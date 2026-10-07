import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { campuses, children, classes, users } from "../../../db/schema";
import { currentUser } from "../../../lib/session";

async function actor(request: Request) {
  const user = await currentUser(request);
  return user && ["teacher", "admin", "superadmin"].includes(user.role)
    ? user
    : null;
}

type Payload = Record<string, unknown>;
function teacherIdsFrom(p: Payload) {
  const raw = p.teacherIds;
  const ids = Array.isArray(raw)
    ? raw.map(Number)
    : typeof raw === "string"
      ? raw.split(",").map(Number)
      : p.teacherId
        ? [Number(p.teacherId)]
        : [];
  return [...new Set(ids.filter((x) => Number.isInteger(x) && x > 0))];
}

async function validateTeachers(schoolId: number, ids: number[]) {
  if (!ids.length) return true;
  const rows = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.schoolId, schoolId),
        eq(users.role, "teacher"),
        eq(users.status, "active"),
        inArray(users.id, ids),
      ),
    );
  return rows.length === ids.length;
}

async function replaceClassTeachers(classId: number, teacherIds: number[]) {
  const db = getDb();
  await db.run(sql`DELETE FROM class_teachers WHERE class_id = ${classId}`);
  for (const teacherId of teacherIds)
    await db.run(sql`INSERT OR IGNORE INTO class_teachers (class_id, teacher_id) VALUES (${classId}, ${teacherId})`);
}

async function addPrimaryTeacher(classId: number, teacherId: number | null) {
  if (!teacherId) return;
  await getDb().run(sql`INSERT OR IGNORE INTO class_teachers (class_id, teacher_id) VALUES (${classId}, ${teacherId})`);
}

export async function GET(request: Request) {
  try {
    const user = await actor(request);
    if (!user)
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const schoolId =
      user.role === "superadmin"
        ? Number(new URL(request.url).searchParams.get("schoolId"))
        : user.schoolId;
    if (!schoolId)
      return Response.json({ campuses: [], classes: [], teachers: [] });
    const db = getDb();
    const [campusRows, classRows, teacherRows, links] = await Promise.all([
      db.select().from(campuses).where(eq(campuses.schoolId, schoolId)),
      db.select().from(classes).where(eq(classes.schoolId, schoolId)),
      db
        .select({ id: users.id, fullName: users.fullName, status: users.status })
        .from(users)
        .where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher"))),
      db.all<{ classId: number; teacherId: number; fullName: string }>(sql`
        SELECT ct.class_id AS classId, ct.teacher_id AS teacherId, u.full_name AS fullName
        FROM class_teachers ct
        INNER JOIN classes c ON c.id = ct.class_id
        INNER JOIN users u ON u.id = ct.teacher_id
        WHERE c.school_id = ${schoolId}
        ORDER BY u.full_name
      `),
    ]);
    const enhanced = classRows.map((row) => {
      const assigned = links.filter((x) => x.classId === row.id);
      return {
        ...row,
        teacherIds: assigned.map((x) => x.teacherId),
        teacherNames: assigned.map((x) => x.fullName),
      };
    });
    return Response.json({ campuses: campusRows, classes: enhanced, teachers: teacherRows });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await actor(request);
    if (!user?.schoolId || user.role !== "admin")
      return Response.json({ error: "Chỉ quản trị trường được tạo cơ cấu trường" }, { status: 403 });
    const p = (await request.json()) as Payload;
    if (p.type === "campus") {
      if (!String(p.name || "").trim())
        return Response.json({ error: "Nhập tên điểm trường" }, { status: 400 });
      const [item] = await getDb().insert(campuses).values({
        schoolId: user.schoolId,
        name: String(p.name).trim(),
        address: String(p.address || "").trim(),
      }).returning();
      return Response.json({ item }, { status: 201 });
    }
    if (p.type === "class") {
      const campusId = Number(p.campusId);
      const campus = (await getDb().select().from(campuses).where(and(eq(campuses.id, campusId), eq(campuses.schoolId, user.schoolId))).limit(1))[0];
      if (!campus || !String(p.name || "").trim())
        return Response.json({ error: "Chọn điểm trường và nhập tên lớp" }, { status: 400 });
      const teacherIds = teacherIdsFrom(p);
      if (!(await validateTeachers(user.schoolId, teacherIds)))
        return Response.json({ error: "Có giáo viên không hợp lệ hoặc đang bị khóa" }, { status: 400 });
      const [item] = await getDb().insert(classes).values({
        schoolId: user.schoolId,
        campusId,
        name: String(p.name).trim(),
        ageGroup: String(p.ageGroup || ""),
        academicYear: String(p.academicYear || ""),
        teacherId: teacherIds[0] || null,
      }).returning();
      await replaceClassTeachers(item.id, teacherIds);
      return Response.json({ item: { ...item, teacherIds } }, { status: 201 });
    }
    return Response.json({ error: "Loại dữ liệu không hợp lệ" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await actor(request);
    if (!user?.schoolId || user.role !== "admin")
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const p = (await request.json()) as Payload;
    if (p.type === "campus") {
      const [item] = await getDb().update(campuses).set({
        name: String(p.name || "").trim(),
        address: String(p.address || "").trim(),
        status: String(p.status || "active"),
      }).where(and(eq(campuses.id, Number(p.id)), eq(campuses.schoolId, user.schoolId))).returning();
      return Response.json({ item });
    }
    const campusId = Number(p.campusId);
    const campus = (await getDb().select().from(campuses).where(and(eq(campuses.id, campusId), eq(campuses.schoolId, user.schoolId))).limit(1))[0];
    if (!campus || !String(p.name || "").trim())
      return Response.json({ error: "Chọn điểm trường và nhập tên lớp" }, { status: 400 });

    const explicitMulti = Object.prototype.hasOwnProperty.call(p, "teacherIds");
    const teacherIds = teacherIdsFrom(p);
    if (!(await validateTeachers(user.schoolId, teacherIds)))
      return Response.json({ error: "Có giáo viên không hợp lệ hoặc đang bị khóa" }, { status: 400 });

    const [item] = await getDb().update(classes).set({
      name: String(p.name || "").trim(),
      ageGroup: String(p.ageGroup || ""),
      academicYear: String(p.academicYear || ""),
      campusId,
      teacherId: teacherIds[0] || null,
      status: String(p.status || "active"),
    }).where(and(eq(classes.id, Number(p.id)), eq(classes.schoolId, user.schoolId))).returning();

    if (!item) return Response.json({ error: "Không tìm thấy lớp" }, { status: 404 });
    if (explicitMulti) await replaceClassTeachers(item.id, teacherIds);
    else await addPrimaryTeacher(item.id, teacherIds[0] || null);
    return Response.json({ item: { ...item, teacherIds } });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await actor(request);
    if (!user?.schoolId || user.role !== "admin")
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const u = new URL(request.url), type = u.searchParams.get("type"), id = Number(u.searchParams.get("id"));
    if (type === "campus") {
      const used = (await getDb().select().from(classes).where(and(eq(classes.campusId, id), eq(classes.schoolId, user.schoolId))).limit(1))[0];
      if (used) return Response.json({ error: "Điểm trường đang có lớp, không thể xóa" }, { status: 409 });
      await getDb().delete(campuses).where(and(eq(campuses.id, id), eq(campuses.schoolId, user.schoolId)));
    } else {
      const used = (await getDb().select().from(children).where(and(eq(children.classId, id), eq(children.schoolId, user.schoolId))).limit(1))[0];
      if (used) return Response.json({ error: "Lớp đang có hồ sơ trẻ, hãy chuyển trẻ sang lớp khác trước khi xóa" }, { status: 409 });
      await getDb().run(sql`DELETE FROM class_teachers WHERE class_id = ${id}`);
      await getDb().delete(classes).where(and(eq(classes.id, id), eq(classes.schoolId, user.schoolId)));
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
