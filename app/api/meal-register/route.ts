import { and, like } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { attendance } from "../../../db/schema";
import { reach, scopedChildren, teacherClasses } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";
import { isMonth } from "../../../lib/day";

async function staff(request: Request) {
  const user = await currentUser(request);
  return user && ["teacher", "admin", "superadmin"].includes(user.role)
    ? user
    : null;
}

async function ensureBoardingTable() {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS boarding_enrollment (
      child_id INTEGER PRIMARY KEY,
      school_id INTEGER NOT NULL,
      is_boarding INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS boarding_enrollment_school_idx ON boarding_enrollment(school_id)",
  ).run();
}

function classIdParam(request: Request) {
  const raw = new URL(request.url).searchParams.get("classId");
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(request: Request) {
  try {
    const user = await staff(request);
    if (!user)
      return Response.json({ error: "Không có quyền" }, { status: 403 });

    await ensureBoardingTable();
    const classId = classIdParam(request);
    const month = new URL(request.url).searchParams.get("month");

    // Khi mới mở màn hình, chỉ cần trả danh sách lớp được phép thao tác.
    if (!classId) {
      const classes =
        user.role === "teacher"
          ? await teacherClasses(user)
          : (await scopedChildren(user)).classes;
      return Response.json({ classes, children: [], marks: [] });
    }

    const scope = await scopedChildren(user, classId);
    const allowedClass =
      user.role === "superadmin" ||
      scope.classes.some((item) => item.id === classId) ||
      scope.rows.some((item) => item.classId === classId);
    if (!allowedClass)
      return Response.json(
        { error: "Lớp không thuộc phạm vi bạn phụ trách" },
        { status: 403 },
      );

    const children = scope.rows.filter((item) => item.classId === classId);
    const schoolId = children[0]?.schoolId ?? user.schoolId;
    const overrides = schoolId
      ? await env.DB.prepare(
          "SELECT child_id, is_boarding FROM boarding_enrollment WHERE school_id = ?",
        )
          .bind(schoolId)
          .all<{ child_id: number; is_boarding: number }>()
      : { results: [] as { child_id: number; is_boarding: number }[] };
    const byChild = new Map(
      (overrides.results || []).map((row) => [row.child_id, row.is_boarding === 1]),
    );

    const marks = isMonth(month)
      ? await getDb()
          .select({
            childId: attendance.childId,
            date: attendance.date,
            status: attendance.status,
          })
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
      month: isMonth(month) ? month : null,
      classId,
      classes: scope.classes,
      children: children.map((child) => ({
        childId: child.id,
        name: child.name,
        className: child.className,
        boarding: byChild.get(child.id) ?? true,
      })),
      marks,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await staff(request);
    if (!user || !user.schoolId || !["teacher", "admin"].includes(user.role))
      return Response.json({ error: "Không có quyền" }, { status: 403 });

    await ensureBoardingTable();
    const body = (await request.json()) as { childId?: number; boarding?: boolean };
    const childId = Number(body.childId);
    if (!childId || typeof body.boarding !== "boolean")
      return Response.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

    const scope = await scopedChildren(user);
    const child = scope.rows.find((item) => item.id === childId);
    if (!child)
      return Response.json(
        { error: "Trẻ không thuộc phạm vi bạn phụ trách" },
        { status: 403 },
      );

    await env.DB.prepare(`
      INSERT INTO boarding_enrollment(child_id, school_id, is_boarding, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(child_id) DO UPDATE SET
        school_id = excluded.school_id,
        is_boarding = excluded.is_boarding,
        updated_at = CURRENT_TIMESTAMP
    `)
      .bind(childId, child.schoolId, body.boarding ? 1 : 0)
      .run();

    return Response.json({ ok: true, childId, boarding: body.boarding });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
