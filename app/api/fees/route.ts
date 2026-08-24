import { and, eq, inArray, like, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { attendance, feeSettings, invoices } from "../../../db/schema";
import { logAction } from "../../../lib/audit";
import { rowChunks } from "../../../lib/batch";
import { isMonth, monthParam, vnMonth, vnNow, vnToday } from "../../../lib/day";
import { scopedChildren } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

async function settingsFor(schoolId: number) {
  const [row] = await getDb()
    .select()
    .from(feeSettings)
    .where(eq(feeSettings.schoolId, schoolId))
    .limit(1);
  return row ?? null;
}

export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    if (!user.schoolId)
      return Response.json({ settings: null, invoices: [], month: vnMonth() });
    const month = monthParam(request);
    const settings = await settingsFor(user.schoolId);
    const scope = await scopedChildren(user);
    const names = new Map(scope.rows.map((x) => [x.id, x]));

    // Quản trị xem cả trường theo tháng; phụ huynh xem mọi phiếu của con mình.
    const rows =
      user.role === "admin"
        ? await getDb()
            .select()
            .from(invoices)
            .where(
              and(eq(invoices.schoolId, user.schoolId), eq(invoices.month, month)),
            )
        : names.size
          ? await getDb()
              .select()
              .from(invoices)
              .where(inArray(invoices.childId, [...names.keys()]))
          : [];

    return Response.json({
      month,
      settings:
        user.role === "admin"
          ? settings
          : settings && {
              bankCode: settings.bankCode,
              bankAccount: settings.bankAccount,
              bankHolder: settings.bankHolder,
              note: settings.note,
            },
      invoices: rows
        .sort((a, b) => b.month.localeCompare(a.month) || a.childId - b.childId)
        .map((x) => ({
          ...x,
          childName: names.get(x.childId)?.name ?? `Trẻ #${x.childId}`,
          className: names.get(x.childId)?.className ?? "",
        })),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user?.schoolId || user.role !== "admin")
      return Response.json(
        { error: "Chỉ quản trị trường được quản lý học phí" },
        { status: 403 },
      );
    const p = (await request.json()) as Record<string, string | number>;

    if (p.action === "settings") {
      const money = (v: unknown) => {
        const n = Math.round(Number(v) || 0);
        return n >= 0 && n <= 100_000_000 ? n : -1;
      };
      const tuitionMonthly = money(p.tuitionMonthly),
        mealPerDay = money(p.mealPerDay),
        otherFee = money(p.otherFee);
      if (tuitionMonthly < 0 || mealPerDay < 0 || otherFee < 0)
        return Response.json(
          { error: "Số tiền phải từ 0 đến 100 triệu" },
          { status: 400 },
        );
      const values = {
        schoolId: user.schoolId,
        tuitionMonthly,
        mealPerDay,
        otherFee,
        otherLabel: String(p.otherLabel || "Phí khác").slice(0, 100),
        bankCode: String(p.bankCode || "")
          .trim()
          .toUpperCase()
          .slice(0, 20),
        bankAccount: String(p.bankAccount || "")
          .replace(/\s/g, "")
          .slice(0, 30),
        bankHolder: String(p.bankHolder || "").slice(0, 100),
        note: String(p.note || "").slice(0, 300),
        updatedAt: sql`CURRENT_TIMESTAMP`,
      };
      await getDb()
        .insert(feeSettings)
        .values(values)
        .onConflictDoUpdate({
          target: [feeSettings.schoolId],
          set: values,
        });
      await logAction(user, "cập nhật", "biểu phí", user.schoolId);
      return Response.json({ settings: await settingsFor(user.schoolId) });
    }

    if (p.action === "generate") {
      const month = isMonth(p.month) ? String(p.month) : vnMonth();
      if (month > vnMonth())
        return Response.json(
          { error: "Chưa phát hành được cho tháng chưa tới" },
          { status: 400 },
        );
      const settings = await settingsFor(user.schoolId);
      if (!settings)
        return Response.json(
          { error: "Hãy lưu biểu phí trước khi phát hành" },
          { status: 400 },
        );
      const scope = await scopedChildren(user);
      if (!scope.rows.length)
        return Response.json({ error: "Trường chưa có hồ sơ trẻ" }, { status: 400 });

      // Tiền ăn tính theo số ngày có mặt thật trong sổ điểm danh của tháng.
      const marks = await getDb()
        .select({ childId: attendance.childId })
        .from(attendance)
        .where(
          and(
            eq(attendance.schoolId, user.schoolId),
            eq(attendance.status, "Có mặt"),
            like(attendance.date, `${month}-%`),
          ),
        );
      const mealDays = new Map<number, number>();
      for (const m of marks)
        mealDays.set(m.childId, (mealDays.get(m.childId) || 0) + 1);

      const values = scope.rows.map((child) => {
        const days = mealDays.get(child.id) || 0;
        return {
          schoolId: user.schoolId!,
          childId: child.id,
          month,
          tuition: settings.tuitionMonthly,
          mealDays: days,
          mealPerDay: settings.mealPerDay,
          otherFee: settings.otherFee,
          otherLabel: settings.otherLabel,
          total:
            settings.tuitionMonthly + days * settings.mealPerDay + settings.otherFee,
        };
      });
      // Phiếu đã đóng rồi thì giữ nguyên, chỉ cập nhật phiếu chưa đóng.
      for (const part of rowChunks(values, 14))
        await getDb()
        .insert(invoices)
        .values(part)
        .onConflictDoUpdate({
          target: [invoices.childId, invoices.month],
          set: {
            tuition: sql`excluded.tuition`,
            mealDays: sql`excluded.meal_days`,
            mealPerDay: sql`excluded.meal_per_day`,
            otherFee: sql`excluded.other_fee`,
            otherLabel: sql`excluded.other_label`,
            total: sql`excluded.total`,
          },
          setWhere: sql`"invoices"."status" != 'Đã đóng'`,
        });
      await logAction(
        user,
        "phát hành",
        "phiếu thu",
        null,
        `${month}: ${values.length} phiếu`,
      );
      return Response.json({ ok: true, month, generated: values.length });
    }

    return Response.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

/** Đánh dấu đã đóng / mở lại một phiếu thu. */
export async function PATCH(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user?.schoolId || user.role !== "admin")
      return Response.json(
        { error: "Chỉ quản trị trường được xác nhận thanh toán" },
        { status: 403 },
      );
    const p = (await request.json()) as Record<string, string | number>;
    const [target] = await getDb()
      .select()
      .from(invoices)
      .where(eq(invoices.id, Number(p.id)))
      .limit(1);
    if (!target || target.schoolId !== user.schoolId)
      return Response.json({ error: "Không tìm thấy phiếu" }, { status: 404 });
    const paid = p.status === "Đã đóng";
    const [item] = await getDb()
      .update(invoices)
      .set({
        status: paid ? "Đã đóng" : "Chưa đóng",
        paidAt: paid ? `${vnToday()} ${vnNow()}` : "",
      })
      .where(eq(invoices.id, target.id))
      .returning();
    await logAction(
      user,
      paid ? "xác nhận đã đóng" : "mở lại",
      "phiếu thu",
      target.id,
      `${target.month} · trẻ #${target.childId}`,
    );
    return Response.json({ invoice: item });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
