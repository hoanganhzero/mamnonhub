import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { dailyLogs } from "../../../db/schema";
import { HEALTH, MEALS, MOODS, SLEEPS } from "../../../lib/care";
import { dateParam, isDate, vnToday } from "../../../lib/day";
import { rowChunks } from "../../../lib/batch";
import { classParam, reach, scopedChildren } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

const MAX_ITEMS = 300;

const FIELDS = [
  ["breakfast", MEALS],
  ["lunch", MEALS],
  ["snack", MEALS],
  ["sleep", SLEEPS],
  ["mood", MOODS],
  ["health", HEALTH],
] as const;

async function staff(request: Request) {
  const user = await currentUser(request);
  return user && ["teacher", "admin", "superadmin"].includes(user.role)
    ? user
    : null;
}

export async function GET(request: Request) {
  try {
    const user = await staff(request);
    if (!user)
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const date = dateParam(request);
    const scope = await scopedChildren(user, classParam(request));
    const childIds = scope.rows.map((x) => x.id);
    const saved = childIds.length
      ? await getDb()
          .select()
          .from(dailyLogs)
          .where(
            and(
              eq(dailyLogs.date, date),
              reach(scope, user, {
                schoolId: dailyLogs.schoolId,
                childId: dailyLogs.childId,
              }),
            ),
          )
      : [];
    const byChild = new Map(saved.map((x) => [x.childId, x]));
    const rows = scope.rows.map((child) => {
      const log = byChild.get(child.id);
      return {
        childId: child.id,
        name: child.name,
        className: child.className,
        allergy: child.allergy,
        breakfast: log?.breakfast ?? "",
        lunch: log?.lunch ?? "",
        snack: log?.snack ?? "",
        sleep: log?.sleep ?? "",
        sleepMinutes: log?.sleepMinutes ?? null,
        mood: log?.mood ?? "",
        health: log?.health ?? "",
        note: log?.note ?? "",
        recorded: Boolean(log),
      };
    });
    return Response.json({
      date,
      today: vnToday(),
      rows,
      classes: scope.classes,
      scope: scope.scope,
      classId: scope.classId,
      options: {
        meals: MEALS,
        sleeps: SLEEPS,
        moods: MOODS,
        health: HEALTH,
      },
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
      items?: Record<string, string | number | undefined>[];
    };
    if (!isDate(body.date))
      return Response.json({ error: "Ngày không hợp lệ" }, { status: 400 });
    if (body.date > vnToday())
      return Response.json(
        { error: "Không ghi sổ cho ngày chưa tới" },
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
      const picked: Record<string, string> = {};
      for (const [field, options] of FIELDS) {
        const value = String(item[field] ?? "");
        // Chuỗi rỗng nghĩa là cô chưa ghi mục đó — vẫn hợp lệ.
        if (value && !options.includes(value))
          return Response.json(
            { error: `Giá trị không hợp lệ cho ${field}: ${value}` },
            { status: 400 },
          );
        picked[field] = value;
      }
      const minutes = Number(item.sleepMinutes);
      values.push({
        schoolId: child.schoolId,
        childId: child.id,
        classId: child.classId,
        date: body.date,
        breakfast: picked.breakfast,
        lunch: picked.lunch,
        snack: picked.snack,
        sleep: picked.sleep,
        sleepMinutes:
          Number.isInteger(minutes) && minutes >= 0 && minutes <= 480
            ? minutes
            : null,
        mood: picked.mood,
        health: picked.health,
        note: String(item.note ?? "").slice(0, 500),
        recordedBy: user.id,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      });
    }

    for (const part of rowChunks(values, 14))
      await getDb()
      .insert(dailyLogs)
      .values(part)
      .onConflictDoUpdate({
        target: [dailyLogs.childId, dailyLogs.date],
        set: {
          classId: sql`excluded.class_id`,
          breakfast: sql`excluded.breakfast`,
          lunch: sql`excluded.lunch`,
          snack: sql`excluded.snack`,
          sleep: sql`excluded.sleep`,
          sleepMinutes: sql`excluded.sleep_minutes`,
          mood: sql`excluded.mood`,
          health: sql`excluded.health`,
          note: sql`excluded.note`,
          recordedBy: sql`excluded.recorded_by`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });

    return Response.json({ ok: true, date: body.date, saved: values.length });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
