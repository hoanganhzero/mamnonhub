import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { campuses, children, classes, users } from "../../../db/schema";
import { currentUser } from "../../../lib/session";

async function actor(request: Request) {
  const user = await currentUser(request);
  return user && ["teacher", "admin", "superadmin"].includes(user.role)
    ? user
    : null;
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
    const [campusRows, classRows, teacherRows] = await Promise.all([
      getDb().select().from(campuses).where(eq(campuses.schoolId, schoolId)),
      getDb().select().from(classes).where(eq(classes.schoolId, schoolId)),
      getDb()
        .select({
          id: users.id,
          fullName: users.fullName,
          status: users.status,
        })
        .from(users)
        .where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher"))),
    ]);
    return Response.json({
      campuses: campusRows,
      classes: classRows,
      teachers: teacherRows,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const user = await actor(request);
    if (!user?.schoolId || user.role !== "admin")
      return Response.json(
        { error: "Chỉ quản trị trường được tạo cơ cấu trường" },
        { status: 403 },
      );
    const p = (await request.json()) as Record<string, string | number>;
    if (p.type === "campus") {
      if (!String(p.name || "").trim())
        return Response.json({ error: "Nhập tên điểm trường" }, { status: 400 });
      if (!String(p.name || "").trim())
        return Response.json(
          { error: "Nhập tên điểm trường" },
          { status: 400 },
        );
      const [item] = await getDb()
        .insert(campuses)
        .values({
          schoolId: user.schoolId,
          name: String(p.name).trim(),
          address: String(p.address || "").trim(),
        })
        .returning();
      return Response.json({ item }, { status: 201 });
    }
    if (p.type === "class") {
      const campusId = Number(p.campusId),
        campus = (
          await getDb()
            .select()
            .from(campuses)
            .where(
              and(
                eq(campuses.id, campusId),
                eq(campuses.schoolId, user.schoolId),
              ),
            )
            .limit(1)
        )[0];
      if (!campus || !String(p.name || "").trim())
        return Response.json(
          { error: "Chọn điểm trường và nhập tên lớp" },
          { status: 400 },
        );
      const teacherId = p.teacherId ? Number(p.teacherId) : null;
      if (teacherId) {
        const teacher = (
          await getDb()
            .select()
            .from(users)
            .where(
              and(
                eq(users.id, teacherId),
                eq(users.schoolId, user.schoolId),
                eq(users.role, "teacher"),
              ),
            )
            .limit(1)
        )[0];
        if (!teacher)
          return Response.json(
            { error: "Giáo viên không hợp lệ" },
            { status: 400 },
          );
      }
      const [item] = await getDb()
        .insert(classes)
        .values({
          schoolId: user.schoolId,
          campusId,
          name: String(p.name).trim(),
          ageGroup: String(p.ageGroup || ""),
          academicYear: String(p.academicYear || ""),
          teacherId,
        })
        .returning();
      return Response.json({ item }, { status: 201 });
    }
    return Response.json(
      { error: "Loại dữ liệu không hợp lệ" },
      { status: 400 },
    );
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
export async function PATCH(request: Request) {
  try {
    const user = await actor(request);
    if (!user?.schoolId || user.role !== "admin")
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const p = (await request.json()) as Record<string, string | number>;
    if (p.type === "campus") {
      const [item] = await getDb()
        .update(campuses)
        .set({
          name: String(p.name || "").trim(),
          address: String(p.address || "").trim(),
          status: String(p.status || "active"),
        })
        .where(
          and(
            eq(campuses.id, Number(p.id)),
            eq(campuses.schoolId, user.schoolId),
          ),
        )
        .returning();
      return Response.json({ item });
    }
    const campusId = Number(p.campusId);
    const campus = (
      await getDb().select().from(campuses).where(
        and(eq(campuses.id, campusId), eq(campuses.schoolId, user.schoolId)),
      ).limit(1)
    )[0];
    if (!campus || !String(p.name || "").trim())
      return Response.json({ error: "Chọn điểm trường và nhập tên lớp" }, { status: 400 });
    const teacherId = p.teacherId ? Number(p.teacherId) : null;
    if (teacherId) {
      const teacher = (
        await getDb().select().from(users).where(
          and(eq(users.id, teacherId), eq(users.schoolId, user.schoolId), eq(users.role, "teacher"), eq(users.status, "active")),
        ).limit(1)
      )[0];
      if (!teacher)
        return Response.json({ error: "Giáo viên không hợp lệ hoặc đang bị khóa" }, { status: 400 });
    }
    const [item] = await getDb()
      .update(classes)
      .set({
        name: String(p.name || "").trim(),
        ageGroup: String(p.ageGroup || ""),
        academicYear: String(p.academicYear || ""),
        campusId,
        teacherId,
        status: String(p.status || "active"),
      })
      .where(
        and(eq(classes.id, Number(p.id)), eq(classes.schoolId, user.schoolId)),
      )
      .returning();
    return Response.json({ item });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  try {
    const user = await actor(request);
    if (!user?.schoolId || user.role !== "admin")
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const u = new URL(request.url),
      type = u.searchParams.get("type"),
      id = Number(u.searchParams.get("id"));
    if (type === "campus") {
      const used = (
        await getDb()
          .select()
          .from(classes)
          .where(
            and(eq(classes.campusId, id), eq(classes.schoolId, user.schoolId)),
          )
          .limit(1)
      )[0];
      if (used)
        return Response.json(
          { error: "Điểm trường đang có lớp, không thể xóa" },
          { status: 409 },
        );
      await getDb()
        .delete(campuses)
        .where(and(eq(campuses.id, id), eq(campuses.schoolId, user.schoolId)));
    } else {
      const used = (
        await getDb().select().from(children).where(
          and(eq(children.classId, id), eq(children.schoolId, user.schoolId)),
        ).limit(1)
      )[0];
      if (used)
        return Response.json(
          { error: "Lớp đang có hồ sơ trẻ, hãy chuyển trẻ sang lớp khác trước khi xóa" },
          { status: 409 },
        );
      await getDb()
        .delete(classes)
        .where(and(eq(classes.id, id), eq(classes.schoolId, user.schoolId)));
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
