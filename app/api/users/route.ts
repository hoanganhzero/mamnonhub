import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { childGuardians, children, classes, schools, users } from "../../../db/schema";
import { hashPassword, makeSalt } from "../../../lib/password";
import { currentUser } from "../../../lib/session";

const managers = ["teacher", "admin", "superadmin"];
export async function GET(request: Request) {
  try {
    const actor = await currentUser(request);
    if (!actor || !managers.includes(actor.role))
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    let rows =
      actor.role === "superadmin"
        ? await getDb()
            .select({ user: users, school: schools })
            .from(users)
            .leftJoin(schools, eq(users.schoolId, schools.id))
        : await getDb()
            .select({ user: users, school: schools })
            .from(users)
            .leftJoin(schools, eq(users.schoolId, schools.id))
            .where(eq(users.schoolId, actor.schoolId!));
    if (actor.role === "teacher")
      rows = rows.filter(({ user }) => user.role === "parent");
    // Kèm danh sách con đã liên kết để màn Tài khoản hiển thị và gỡ liên kết.
    const parentIds = rows
      .filter(({ user }) => user.role === "parent")
      .map(({ user }) => user.id);
    const links = parentIds.length
      ? await getDb()
          .select({
            userId: childGuardians.userId,
            childId: childGuardians.childId,
            childName: children.name,
            className: children.className,
          })
          .from(childGuardians)
          .innerJoin(children, eq(childGuardians.childId, children.id))
          .where(inArray(childGuardians.userId, parentIds))
      : [];
    return Response.json({
      users: rows.map(({ user, school }) => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        schoolId: user.schoolId,
        schoolName: school?.name || "Toàn hệ thống",
        children: links
          .filter((x) => x.userId === user.id)
          .map((x) => ({
            id: x.childId,
            name: x.childName,
            className: x.className,
          })),
      })),
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const actor = await currentUser(request);
    if (!actor || !managers.includes(actor.role))
      return Response.json(
        { error: "Không có quyền tạo tài khoản" },
        { status: 403 },
      );
    const p = (await request.json()) as {
      username?: string;
      password?: string;
      fullName?: string;
      schoolId?: number;
      childId?: number;
    };
    const username = (p.username || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{4,24}$/.test(username))
      return Response.json(
        { error: "Tên đăng nhập từ 4–24 ký tự, không có khoảng trắng" },
        { status: 400 },
      );
    if ((p.password || "").length < 8)
      return Response.json(
        { error: "Mật khẩu phải có ít nhất 8 ký tự" },
        { status: 400 },
      );
    if (!p.fullName?.trim())
      return Response.json({ error: "Họ và tên là bắt buộc" }, { status: 400 });
    if (
      (
        await getDb()
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1)
      ).length
    )
      return Response.json(
        { error: "Tên đăng nhập đã tồn tại" },
        { status: 409 },
      );
    const role =
      actor.role === "superadmin"
        ? "admin"
        : actor.role === "admin"
          ? "teacher"
          : "parent";
    const schoolId =
      actor.role === "superadmin" ? Number(p.schoolId) : actor.schoolId;
    if (!schoolId)
      return Response.json({ error: "Vui lòng chọn trường" }, { status: 400 });
    const school = (
      await getDb()
        .select()
        .from(schools)
        .where(and(eq(schools.id, schoolId), eq(schools.status, "active")))
        .limit(1)
    )[0];
    if (!school)
      return Response.json(
        { error: "Trường không hợp lệ hoặc đã bị khóa" },
        { status: 400 },
      );
    const salt = makeSalt();
    const [user] = await getDb()
      .insert(users)
      .values({
        schoolId,
        username,
        fullName: p.fullName.trim(),
        passwordHash: await hashPassword(p.password!, salt),
        salt,
        role,
        status: "active",
      })
      .returning();
    if (actor.role === "teacher" && p.childId) {
      const child = (
        await getDb()
          .select()
          .from(children)
          .where(
            and(
              eq(children.id, Number(p.childId)),
              eq(children.schoolId, schoolId),
            ),
          )
          .limit(1)
      )[0];
      if (!child)
        return Response.json(
          { error: "Hồ sơ trẻ không hợp lệ" },
          { status: 400 },
        );
      // Giữ parentUserId cho bé chưa có liên kết chính, đồng thời ghi vào
      // child_guardians để bé nhận được nhiều người giám hộ.
      if (!child.parentUserId)
        await getDb()
          .update(children)
          .set({ parentUserId: user.id })
          .where(eq(children.id, child.id));
      await getDb()
        .insert(childGuardians)
        .values({
          childId: child.id,
          userId: user.id,
          isPrimary: !child.parentUserId,
        })
        .onConflictDoNothing();
    }
    return Response.json(
      {
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          schoolId: user.schoolId,
          schoolName: school.name,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
export async function PATCH(request: Request) {
  try {
    const actor = await currentUser(request);
    if (!actor || !managers.includes(actor.role))
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const p = (await request.json()) as {
      id: number;
      status?: string;
      role?: string;
      schoolId?: number;
      fullName?: string;
      username?: string;
      password?: string;
      linkChildId?: number;
      unlinkChildId?: number;
    };
    const target = (
      await getDb().select().from(users).where(eq(users.id, p.id)).limit(1)
    )[0];
    if (!target || target.role === "superadmin")
      return Response.json(
        { error: "Không thể sửa tài khoản này" },
        { status: 403 },
      );
    if (actor.role !== "superadmin" && target.schoolId !== actor.schoolId)
      return Response.json(
        { error: "Không có quyền với tài khoản trường khác" },
        { status: 403 },
      );
    if (actor.role === "teacher" && target.role !== "parent")
      return Response.json(
        { error: "Giáo viên chỉ quản lý tài khoản phụ huynh" },
        { status: 403 },
      );
    if (actor.role === "admin" && target.role !== "teacher")
      return Response.json(
        { error: "Quản trị trường chỉ quản lý tài khoản giáo viên" },
        { status: 403 },
      );

    // Giáo viên liên kết / gỡ liên kết trẻ với tài khoản phụ huynh này.
    if (actor.role === "teacher" && (p.linkChildId || p.unlinkChildId)) {
      const childId = Number(p.linkChildId || p.unlinkChildId);
      const child = (
        await getDb()
          .select()
          .from(children)
          .where(
            and(eq(children.id, childId), eq(children.schoolId, actor.schoolId!)),
          )
          .limit(1)
      )[0];
      if (!child)
        return Response.json({ error: "Hồ sơ trẻ không hợp lệ" }, { status: 400 });
      if (p.linkChildId) {
        if (!child.parentUserId)
          await getDb()
            .update(children)
            .set({ parentUserId: target.id })
            .where(eq(children.id, child.id));
        await getDb()
          .insert(childGuardians)
          .values({
            childId: child.id,
            userId: target.id,
            isPrimary: !child.parentUserId,
          })
          .onConflictDoNothing();
      } else {
        await getDb()
          .delete(childGuardians)
          .where(
            and(
              eq(childGuardians.childId, child.id),
              eq(childGuardians.userId, target.id),
            ),
          );
        if (child.parentUserId === target.id)
          await getDb()
            .update(children)
            .set({ parentUserId: null })
            .where(eq(children.id, child.id));
      }
      return Response.json({ ok: true });
    }
    const values: {
      status?: string;
      role?: string;
      schoolId?: number | null;
      fullName?: string;
      username?: string;
      passwordHash?: string;
      salt?: string;
    } = {};
    if (typeof p.fullName === "string") {
      if (!p.fullName.trim())
        return Response.json({ error: "Họ và tên là bắt buộc" }, { status: 400 });
      values.fullName = p.fullName.trim();
    }
    if (typeof p.username === "string") {
      const username = p.username.trim().toLowerCase();
      if (!/^[a-z0-9._-]{4,24}$/.test(username))
        return Response.json(
          { error: "Tên đăng nhập từ 4–24 ký tự, không có khoảng trắng" },
          { status: 400 },
        );
      const duplicate = (
        await getDb().select().from(users).where(eq(users.username, username)).limit(1)
      )[0];
      if (duplicate && duplicate.id !== target.id)
        return Response.json({ error: "Tên đăng nhập đã tồn tại" }, { status: 409 });
      values.username = username;
    }
    if (p.password) {
      if (p.password.length < 8)
        return Response.json({ error: "Mật khẩu phải có ít nhất 8 ký tự" }, { status: 400 });
      const salt = makeSalt();
      values.salt = salt;
      values.passwordHash = await hashPassword(p.password, salt);
    }
    if (p.status && ["active", "locked"].includes(p.status))
      values.status = p.status;
    if (p.role && ["teacher", "parent", "admin"].includes(p.role)) {
      if (actor.role !== "superadmin" && p.role === "admin")
        return Response.json(
          { error: "Chỉ quản trị tối cao được cấp quyền quản trị" },
          { status: 403 },
        );
      if (actor.role === "teacher" && p.role !== "parent")
        return Response.json(
          { error: "Giáo viên chỉ tạo phụ huynh" },
          { status: 403 },
        );
      values.role = p.role;
    }
    if (actor.role === "superadmin" && p.schoolId) {
      const school = (
        await getDb()
          .select()
          .from(schools)
          .where(and(eq(schools.id, p.schoolId), eq(schools.status, "active")))
          .limit(1)
      )[0];
      if (!school)
        return Response.json({ error: "Trường không hợp lệ" }, { status: 400 });
      values.schoolId = school.id;
    }
    const [user] = await getDb()
      .update(users)
      .set(values)
      .where(eq(users.id, p.id))
      .returning();
    return Response.json({ user });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  try {
    const actor = await currentUser(request);
    if (!actor || !managers.includes(actor.role))
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const id = Number(new URL(request.url).searchParams.get("id")),
      target = (
        await getDb().select().from(users).where(eq(users.id, id)).limit(1)
      )[0];
    if (!target || target.role === "superadmin")
      return Response.json(
        { error: "Không thể xóa tài khoản này" },
        { status: 403 },
      );
    const allowed =
      (actor.role === "superadmin" && target.role === "admin") ||
      (actor.role === "admin" &&
        target.role === "teacher" &&
        target.schoolId == actor.schoolId) ||
      (actor.role === "teacher" &&
        target.role === "parent" &&
        target.schoolId == actor.schoolId);
    if (!allowed)
      return Response.json(
        { error: "Không đúng phạm vi quản lý" },
        { status: 403 },
      );
    await getDb()
      .update(children)
      .set({ parentUserId: null })
      .where(eq(children.parentUserId, id));
    await getDb().delete(childGuardians).where(eq(childGuardians.userId, id));
    if (target.role === "teacher")
      await getDb().update(classes).set({ teacherId: null }).where(eq(classes.teacherId, id));
    await getDb().delete(users).where(eq(users.id, id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
