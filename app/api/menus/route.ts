import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { menus } from "../../../db/schema";
import { allergyHits } from "../../../lib/allergy";
import { rowChunks } from "../../../lib/batch";
import { isDate, vnToday } from "../../../lib/day";
import { scopedChildren } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";
import {
  MENU_DAYS,
  WEEKDAYS,
  addDays,
  weekParam,
  weekStartOf,
} from "../../../lib/week";

const MEAL_FIELDS = [
  ["breakfast", "bữa sáng"],
  ["lunch", "bữa trưa"],
  ["snack", "bữa xế"],
] as const;

export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const weekStart = weekParam(request);
    const rows = user.schoolId
      ? await getDb()
          .select()
          .from(menus)
          .where(
            and(eq(menus.schoolId, user.schoolId), eq(menus.weekStart, weekStart)),
          )
      : [];
    const byDay = new Map(rows.map((x) => [x.weekday, x]));
    const days = MENU_DAYS.map((weekday) => {
      const row = byDay.get(weekday);
      return {
        weekday,
        label: WEEKDAYS[weekday - 1],
        date: addDays(weekStart, weekday - 1),
        breakfast: row?.breakfast ?? "",
        lunch: row?.lunch ?? "",
        snack: row?.snack ?? "",
        note: row?.note ?? "",
        photoKey: row?.photoKey ?? null,
        breakfastPhotoKey: row?.breakfastPhotoKey ?? null,
        lunchPhotoKey: row?.lunchPhotoKey ?? row?.photoKey ?? null,
        snackPhotoKey: row?.snackPhotoKey ?? null,
      };
    });

    // Đối chiếu dị ứng của từng trẻ trong phạm vi với từng món trong tuần.
    const scope = await scopedChildren(user);
    const warnings = [];
    for (const child of scope.rows) {
      if (!child.allergy || child.allergy === "Không") continue;
      for (const day of days)
        for (const [field, mealLabel] of MEAL_FIELDS) {
          const hits = allergyHits(child.allergy, day[field]);
          if (hits.length)
            warnings.push({
              childId: child.id,
              childName: child.name,
              className: child.className,
              weekday: day.weekday,
              dayLabel: day.label,
              meal: mealLabel,
              dish: day[field],
              allergens: hits,
            });
        }
    }

    return Response.json({
      weekStart,
      prevWeek: addDays(weekStart, -7),
      nextWeek: addDays(weekStart, 7),
      days,
      warnings,
      canEdit: ["admin", "teacher"].includes(user.role),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user?.schoolId || !["admin", "teacher"].includes(user.role))
      return Response.json(
        { error: "Chỉ quản trị trường và giáo viên được cập nhật thực đơn" },
        { status: 403 },
      );
    const body = (await request.json()) as {
      weekStart?: string;
      days?: Record<string, string | number>[];
    };
    const weekStart = weekStartOf(
      isDate(body.weekStart) ? body.weekStart : vnToday(),
    );
    const days = body.days;
    if (!Array.isArray(days) || !days.length)
      return Response.json({ error: "Chưa có thực đơn" }, { status: 400 });

    const values = [];
    for (const day of days) {
      const weekday = Number(day.weekday);
      if (!MENU_DAYS.includes(weekday))
        return Response.json(
          { error: `Ngày không hợp lệ: ${day.weekday}` },
          { status: 400 },
        );
      const photos = ["breakfastPhotoKey", "lunchPhotoKey", "snackPhotoKey"]
        .map((field) => [field, String(day[field] || "")] as const);
      if (photos.some(([, key]) => key && !key.startsWith(`media/${user.schoolId}/`)))
        return Response.json({ error: "Ảnh không thuộc trường" }, { status: 403 });
      values.push({
        schoolId: user.schoolId,
        weekStart,
        weekday,
        breakfast: String(day.breakfast || "").slice(0, 300),
        lunch: String(day.lunch || "").slice(0, 300),
        snack: String(day.snack || "").slice(0, 300),
        note: String(day.note || "").slice(0, 300),
        photoKey: photos[1][1] || null,
        breakfastPhotoKey: photos[0][1] || null,
        lunchPhotoKey: photos[1][1] || null,
        snackPhotoKey: photos[2][1] || null,
        updatedBy: user.id,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      });
    }

    for (const part of rowChunks(values, 11))
      await getDb()
      .insert(menus)
      .values(part)
      .onConflictDoUpdate({
        target: [menus.schoolId, menus.weekStart, menus.weekday],
        set: {
          breakfast: sql`excluded.breakfast`,
          lunch: sql`excluded.lunch`,
          snack: sql`excluded.snack`,
          note: sql`excluded.note`,
          photoKey: sql`excluded.photo_key`,
          breakfastPhotoKey: sql`excluded.breakfast_photo_key`,
          lunchPhotoKey: sql`excluded.lunch_photo_key`,
          snackPhotoKey: sql`excluded.snack_photo_key`,
          updatedBy: sql`excluded.updated_by`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });
    return Response.json({ ok: true, weekStart, saved: values.length });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
