import { asc, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { healthRecords } from "../../../db/schema";
import { isDate, vnToday } from "../../../lib/day";
import { rowChunks } from "../../../lib/batch";
import { classParam, reach, scopedChildren } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

const MAX_ITEMS = 300;

function bmi(heightCm: number | null, weightKg: number | null) {
  if (!heightCm || !weightKg) return null;
  const meters = heightCm / 100;
  return Math.round((weightKg / (meters * meters)) * 10) / 10;
}

export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const scope = await scopedChildren(user, classParam(request));
    const childIds = scope.rows.map((x) => x.id);
    const rows = childIds.length
      ? await getDb()
          .select()
          .from(healthRecords)
          .where(
            reach(scope, user, {
              schoolId: healthRecords.schoolId,
              childId: healthRecords.childId,
            }),
          )
          .orderBy(asc(healthRecords.date))
      : [];
    return Response.json({
      today: vnToday(),
      classes: scope.classes,
      scope: scope.scope,
      classId: scope.classId,
      children: scope.rows.map((child) => {
        const history = rows
          .filter((x) => x.childId === child.id)
          .map((x) => ({
            date: x.date,
            heightCm: x.heightCm,
            weightKg: x.weightKg,
            bmi: bmi(x.heightCm, x.weightKg),
            note: x.note,
          }));
        return {
          childId: child.id,
          name: child.name,
          className: child.className,
          birthDate: child.birthDate,
          history,
          latest: history[history.length - 1] ?? null,
        };
      }),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user || !["teacher", "admin"].includes(user.role))
      return Response.json(
        { error: "Chỉ giáo viên và nhà trường được nhập cân đo" },
        { status: 403 },
      );
    const body = (await request.json()) as {
      date?: string;
      items?: Record<string, string | number | undefined>[];
    };
    if (!isDate(body.date))
      return Response.json({ error: "Ngày không hợp lệ" }, { status: 400 });
    if (body.date > vnToday())
      return Response.json(
        { error: "Không nhập cho ngày chưa tới" },
        { status: 400 },
      );
    const items = body.items;
    if (!Array.isArray(items) || !items.length)
      return Response.json({ error: "Chưa có số liệu" }, { status: 400 });
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
      const heightCm = Number(item.heightCm);
      const weightKg = Number(item.weightKg);
      // Bỏ qua trẻ chưa đo, chỉ lưu dòng có số liệu.
      if (!heightCm && !weightKg && !String(item.note || "").trim()) continue;
      if (heightCm && (heightCm < 40 || heightCm > 180))
        return Response.json(
          { error: `Chiều cao ${heightCm} cm không hợp lý` },
          { status: 400 },
        );
      if (weightKg && (weightKg < 3 || weightKg > 90))
        return Response.json(
          { error: `Cân nặng ${weightKg} kg không hợp lý` },
          { status: 400 },
        );
      values.push({
        schoolId: child.schoolId,
        childId: child.id,
        date: body.date,
        heightCm: heightCm || null,
        weightKg: weightKg || null,
        note: String(item.note || "").slice(0, 300),
        recordedBy: user.id,
      });
    }
    if (!values.length)
      return Response.json(
        { error: "Chưa nhập chiều cao hoặc cân nặng cho trẻ nào" },
        { status: 400 },
      );

    for (const part of rowChunks(values, 8))
      await getDb()
      .insert(healthRecords)
      .values(part)
      .onConflictDoUpdate({
        target: [healthRecords.childId, healthRecords.date],
        set: {
          heightCm: sql`excluded.height_cm`,
          weightKg: sql`excluded.weight_kg`,
          note: sql`excluded.note`,
          recordedBy: sql`excluded.recorded_by`,
        },
      });
    return Response.json({ ok: true, saved: values.length });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
