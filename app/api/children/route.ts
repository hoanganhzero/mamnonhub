import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { children, classes } from "../../../db/schema";
import { logAction } from "../../../lib/audit";
import { rowChunks } from "../../../lib/batch";
import { classParam, scopedChildren, teacherClasses } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

async function scope(request: Request) {
  const user = await currentUser(request);
  if (!user) return null;
  return user;
}

/**
 * Lớp mà người dùng được phép xếp trẻ vào. Trả về null khi bỏ trống lớp,
 * hoặc undefined khi mã lớp không thuộc phạm vi của người dùng.
 */
async function resolveClass(
  user: NonNullable<Awaited<ReturnType<typeof scope>>>,
  raw: unknown,
) {
  if (raw === undefined || raw === null || raw === "") return null;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  if (!user.schoolId) return undefined;
  const [row] = await getDb()
    .select()
    .from(classes)
    .where(and(eq(classes.id, id), eq(classes.schoolId, user.schoolId)))
    .limit(1);
  if (!row) return undefined;
  if (user.role === "teacher") {
    const mine = await teacherClasses(user);
    if (!mine.some((x) => x.id === id)) return undefined;
  }
  return row;
}

export async function GET(request: Request) {
  try {
    const user = await scope(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const result = await scopedChildren(user, classParam(request));
    return Response.json(
      {
        children: result.rows,
        classes: result.classes,
        scope: result.scope,
        classId: result.classId,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const user = await scope(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    if (!user.schoolId || !["teacher", "admin"].includes(user.role))
      return Response.json(
        { error: "Không có quyền thêm hồ sơ tại trường" },
        { status: 403 },
      );
    const body = (await request.json()) as
      | Record<string, string>
      | { items: Record<string, string>[]; classId?: string | number };
    const assigned = await resolveClass(
      user,
      (body as Record<string, unknown>).classId,
    );
    if (assigned === undefined)
      return Response.json(
        { error: "Lớp không thuộc phạm vi bạn phụ trách" },
        { status: 403 },
      );
    if ("items" in body) {
      const items = body.items;
      if (!Array.isArray(items) || !items.length || items.length > 500)
        return Response.json(
          { error: "Tệp Excel phải có từ 1 đến 500 trẻ" },
          { status: 400 },
        );
      const valid = items
        .filter((x) => x.name?.trim())
        .map((p) => ({
          schoolId: user.schoolId!,
          name: p.name.trim(),
          classId: assigned?.id ?? null,
          className: assigned?.name || p.className || "Chưa xếp lớp",
          birthDate: p.birthDate || "",
          guardian: p.guardian || "",
          phone: p.phone || "",
          allergy: p.allergy || "Không",
          status: "Đang học",
          fatherName: p.fatherName || "",
          fatherBirthDate: p.fatherBirthDate || "",
          fatherJob: p.fatherJob || "",
          fatherPhone: p.fatherPhone || "",
          motherName: p.motherName || "",
          motherBirthDate: p.motherBirthDate || "",
          motherJob: p.motherJob || "",
          motherPhone: p.motherPhone || "",
          zaloPhone: p.zaloPhone || p.phone || "",
        }));
      if (!valid.length)
        return Response.json(
          { error: "Không tìm thấy cột Họ tên hợp lệ" },
          { status: 400 },
        );
      const inserted = [];
      for (const part of rowChunks(valid, 19))
        inserted.push(
          ...(await getDb().insert(children).values(part).returning()),
        );
      await logAction(
        user,
        "nhập Excel",
        "hồ sơ trẻ",
        null,
        `${inserted.length} hồ sơ`,
      );
      return Response.json(
        { children: inserted, count: inserted.length },
        { status: 201 },
      );
    }
    const p = body;
    if (!p.name?.trim())
      return Response.json({ error: "Họ tên là bắt buộc" }, { status: 400 });
    const [child] = await getDb()
      .insert(children)
      .values({
        schoolId: user.schoolId,
        name: p.name.trim(),
        classId: assigned?.id ?? null,
        className: assigned?.name || p.className || "Chưa xếp lớp",
        birthDate: p.birthDate || "",
        guardian: p.guardian || "",
        phone: p.phone || "",
        allergy: p.allergy || "Không",
        status: p.status || "Đang học",
        fatherName: p.fatherName || "",
        fatherBirthDate: p.fatherBirthDate || "",
        fatherJob: p.fatherJob || "",
        fatherPhone: p.fatherPhone || "",
        motherName: p.motherName || "",
        motherBirthDate: p.motherBirthDate || "",
        motherJob: p.motherJob || "",
        motherPhone: p.motherPhone || "",
        zaloPhone: p.zaloPhone || p.phone || "",
      })
      .returning();
    await logAction(user, "tạo", "hồ sơ trẻ", child.id, child.name);
    return Response.json({ child }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
export async function PATCH(request: Request) {
  try {
    const user = await scope(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const p = (await request.json()) as Record<string, string | number>;
    if (!["teacher", "admin", "superadmin"].includes(user.role))
      return Response.json(
        { error: "Chỉ giáo viên và nhà trường được cập nhật hồ sơ trẻ" },
        { status: 403 },
      );
    const id = Number(p.id);
    if (!id) return Response.json({ error: "Thiếu mã trẻ" }, { status: 400 });
    const target = (
      await getDb().select().from(children).where(eq(children.id, id)).limit(1)
    )[0];
    if (
      !target ||
      (user.role !== "superadmin" && target.schoolId !== user.schoolId)
    )
      return Response.json(
        { error: "Không có quyền với hồ sơ của trường khác" },
        { status: 403 },
      );
    const values: Record<string, string | number | null> = {};
    for (const key of [
      "name",
      "className",
      "birthDate",
      "guardian",
      "phone",
      "allergy",
      "status",
      "fatherName",
      "fatherBirthDate",
      "fatherJob",
      "fatherPhone",
      "motherName",
      "motherBirthDate",
      "motherJob",
      "motherPhone",
      "zaloPhone",
    ]) {
      if (typeof p[key] === "string") values[key] = p[key] as string;
    }
    if ("classId" in p) {
      const moved = await resolveClass(user, p.classId);
      if (moved === undefined)
        return Response.json(
          { error: "Lớp không thuộc phạm vi bạn phụ trách" },
          { status: 403 },
        );
      values.classId = moved?.id ?? null;
      if (moved) values.className = moved.name;
    }
    const [child] = await getDb()
      .update(children)
      .set(values)
      .where(eq(children.id, id))
      .returning();
    await logAction(user, "sửa", "hồ sơ trẻ", id, Object.keys(values).join(", "));
    return Response.json({ child });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  try {
    const user = await scope(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!["teacher", "admin", "superadmin"].includes(user.role))
      return Response.json(
        { error: "Chỉ giáo viên và nhà trường được xóa hồ sơ trẻ" },
        { status: 403 },
      );
    const target = (
      await getDb().select().from(children).where(eq(children.id, id)).limit(1)
    )[0];
    if (
      !target ||
      (user.role !== "superadmin" && target.schoolId !== user.schoolId)
    )
      return Response.json(
        { error: "Không có quyền với hồ sơ của trường khác" },
        { status: 403 },
      );
    // Xóa mềm: hồ sơ và lịch sử điểm danh, sức khỏe được giữ lại để truy vết.
    await getDb()
      .update(children)
      .set({ status: "Đã nghỉ học", parentUserId: null, classId: null })
      .where(eq(children.id, id));
    await logAction(user, "cho nghỉ học (xóa mềm)", "hồ sơ trẻ", id, target.name);
    return Response.json({ ok: true, softDeleted: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
