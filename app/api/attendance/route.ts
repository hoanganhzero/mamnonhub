import { and, eq, gte, like, lte, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { attendance, leaveRequests } from "../../../db/schema";
import { ATTENDANCE_STATUSES } from "../../../lib/care";
import { dateParam, isDate, isMonth, isTime, vnToday } from "../../../lib/day";
import { rowChunks } from "../../../lib/batch";
import { classParam, reach, scopedChildren } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

const MAX_ITEMS = 300;

async function staff(request: Request) {
  const user = await currentUser(request);
  return user && ["teacher", "admin", "superadmin"].includes(user.role)
    ? user
    : null;
}

/** Đơn xin nghỉ đã duyệt phủ lên ngày đang xem, tra theo phạm vi trẻ. */
async function approvedLeaves(
  scope: Awaited<ReturnType<typeof scopedChildren>>,
  user: NonNullable<Awaited<ReturnType<typeof staff>>>,
  date: string,
) {
  if (!scope.rows.length) return new Map<number, string>();
  const rows = await getDb()
    .select()
    .from(leaveRequests)
    .where(
      and(
        reach(scope, user, {
          schoolId: leaveRequests.schoolId,
          childId: leaveRequests.childId,
        }),
        eq(leaveRequests.status, "Đã duyệt"),
        lte(leaveRequests.fromDate, date),
        gte(leaveRequests.toDate, date),
      ),
    );
  return new Map(rows.map((x) => [x.childId, x.reason]));
}

export async function GET(request: Request) {
  try {
    const user = await staff(request);
    if (!user)
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const scope = await scopedChildren(user, classParam(request));
    const childIds = scope.rows.map((x) => x.id);

    // Chế độ tháng: trả toàn bộ lượt điểm danh để xuất bảng chuyên cần.
    const month = new URL(request.url).searchParams.get("month");
    if (isMonth(month)) {
      const marks = childIds.length
        ? await getDb()
            .select()
            .from(attendance)
            .where(
              and(
                like(attendance.date, `${month}-%`),
                reach(scope, user, {
                  schoolId: attendance.schoolId,
                  childId: attendance.childId,
                }),
              ),
            )
        : [];
      return Response.json({
        month,
        children: scope.rows.map((x) => ({
          childId: x.id,
          name: x.name,
          className: x.className,
        })),
        marks: marks.map((x) => ({
          childId: x.childId,
          date: x.date,
          status: x.status,
        })),
      });
    }

    const date = dateParam(request);
    const [saved, leaves] = await Promise.all([
      childIds.length
        ? getDb()
            .select()
            .from(attendance)
            .where(
              and(
                eq(attendance.date, date),
                reach(scope, user, {
                  schoolId: attendance.schoolId,
                  childId: attendance.childId,
                }),
              ),
            )
        : Promise.resolve([]),
      approvedLeaves(scope, user, date),
    ]);
    const byChild = new Map(saved.map((x) => [x.childId, x]));
    const rows = scope.rows.map((child) => {
      const record = byChild.get(child.id);
      const leave = leaves.get(child.id);
      return {
        childId: child.id,
        name: child.name,
        className: child.className,
        classId: child.classId,
        allergy: child.allergy,
        avatarKey: child.avatarKey,
        // Chưa điểm danh thì mặc định có mặt, cô chỉ bấm những bé vắng.
        status: record?.status ?? (leave ? "Vắng có phép" : "Có mặt"),
        note: record?.note ?? (leave ? `Phụ huynh xin nghỉ · ${leave}` : ""),
        checkInAt: record?.checkInAt ?? "",
        checkOutAt: record?.checkOutAt ?? "",
        recorded: Boolean(record),
        leaveReason: leave ?? "",
      };
    });
    return Response.json({
      date,
      today: vnToday(),
      rows,
      classes: scope.classes,
      scope: scope.scope,
      classId: scope.classId,
      recordedCount: saved.length,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await staff(request);
    if (!user)
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const body = (await request.json()) as {
      date?: string;
      items?: {
        childId?: number;
        status?: string;
        note?: string;
        checkInAt?: string;
        checkOutAt?: string;
      }[];
    };
    if (!isDate(body.date))
      return Response.json({ error: "Ngày không hợp lệ" }, { status: 400 });
    if (body.date > vnToday())
      return Response.json(
        { error: "Không điểm danh cho ngày chưa tới" },
        { status: 400 },
      );
    const items = body.items;
    if (!Array.isArray(items) || !items.length)
      return Response.json({ error: "Chưa có trẻ nào" }, { status: 400 });
    if (items.length > MAX_ITEMS)
      return Response.json(
        { error: `Mỗi lượt lưu tối đa ${MAX_ITEMS} trẻ` },
        { status: 400 },
      );

    const scope = await scopedChildren(user);
    const allowed = new Map(scope.rows.map((x) => [x.id, x]));
    const values = [];
    for (const item of items) {
      const child = allowed.get(Number(item.childId));
      if (!child)
        return Response.json(
          { error: "Có trẻ không thuộc lớp bạn phụ trách" },
          { status: 403 },
        );
      const status = String(item.status || "");
      if (!ATTENDANCE_STATUSES.includes(status))
        return Response.json(
          { error: `Trạng thái không hợp lệ: ${status}` },
          { status: 400 },
        );
      const checkInAt = String(item.checkInAt || "");
      const checkOutAt = String(item.checkOutAt || "");
      if (
        (checkInAt && !isTime(checkInAt)) ||
        (checkOutAt && !isTime(checkOutAt))
      )
        return Response.json(
          { error: "Giờ đến và giờ về phải theo dạng HH:MM" },
          { status: 400 },
        );
      values.push({
        schoolId: child.schoolId,
        childId: child.id,
        classId: child.classId,
        date: body.date,
        status,
        note: String(item.note || "").slice(0, 500),
        checkInAt: status === "Có mặt" ? checkInAt : "",
        checkOutAt: status === "Có mặt" ? checkOutAt : "",
        recordedBy: user.id,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      });
    }

    // Ghi theo lô nhỏ để không vượt giới hạn tham số của D1.
    for (const part of rowChunks(values, 10))
      await getDb()
      .insert(attendance)
      .values(part)
      .onConflictDoUpdate({
        target: [attendance.childId, attendance.date],
        set: {
          classId: sql`excluded.class_id`,
          status: sql`excluded.status`,
          note: sql`excluded.note`,
          checkInAt: sql`excluded.check_in_at`,
          checkOutAt: sql`excluded.check_out_at`,
          recordedBy: sql`excluded.recorded_by`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });

    const present = values.filter((x) => x.status === "Có mặt").length;
    return Response.json({
      ok: true,
      date: body.date,
      saved: values.length,
      present,
      absent: values.length - present,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
