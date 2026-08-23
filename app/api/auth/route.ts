import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { sessions, users } from "../../../db/schema";
import {
  hashPassword,
  makeSalt,
  makeToken,
  verifyPassword,
} from "../../../lib/password";
import { currentUser, safeUser, sessionToken } from "../../../lib/session";

export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    return user
      ? Response.json({ user: await safeUser(user) })
      : Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const db = getDb(),
      p = (await request.json()) as Record<string, string>,
      action = p.action;
    if (action === "register")
      return Response.json(
        {
          error:
            "Hệ thống không mở đăng ký công khai. Vui lòng liên hệ nhà trường để được cấp tài khoản.",
        },
        { status: 403 },
      );
    if (action === "login") {
      const username = (p.username || "").trim().toLowerCase();
      let found = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      // Mật khẩu khởi tạo tài khoản quản trị tối cao: đặt qua biến môi trường
      // SUPERADMIN_BOOTSTRAP_PASSWORD khi triển khai; chuỗi mặc định chỉ dành
      // cho lần chạy đầu và nên đổi ngay sau khi đăng nhập.
      const bootstrapPassword =
        (env as { SUPERADMIN_BOOTSTRAP_PASSWORD?: string })
          .SUPERADMIN_BOOTSTRAP_PASSWORD || "MamNon@2026!";
      if (
        username === "admin" &&
        p.password === bootstrapPassword &&
        (!found.length || !found[0].passwordHash.startsWith("v2$"))
      ) {
        const salt = makeSalt(),
          passwordHash = await hashPassword(p.password, salt);
        if (found.length) {
          const [admin] = await db
            .update(users)
            .set({
              schoolId: null,
              fullName: "Quản trị tối cao",
              passwordHash,
              salt,
              role: "superadmin",
              status: "active",
            })
            .where(eq(users.id, found[0].id))
            .returning();
          found = [admin];
        } else {
          const [admin] = await db
            .insert(users)
            .values({
              schoolId: null,
              username: "admin",
              fullName: "Quản trị tối cao",
              passwordHash,
              salt,
              role: "superadmin",
              status: "active",
            })
            .returning();
          found = [admin];
        }
      }
      const user = found[0];
      if (
        !user ||
        !(await verifyPassword(p.password || "", user.salt, user.passwordHash))
      )
        return Response.json(
          { error: "Tên đăng nhập hoặc mật khẩu không đúng" },
          { status: 401 },
        );
      if (user.status !== "active")
        return Response.json(
          { error: "Tài khoản đang chờ quản trị duyệt" },
          { status: 403 },
        );
      const token = makeToken(),
        maxAge = 60 * 60 * 24 * 7;
      await db
        .insert(sessions)
        .values({
          id: token,
          userId: user.id,
          expiresAt: Date.now() + maxAge * 1000,
        });
      return new Response(JSON.stringify({ user: await safeUser(user) }), {
        headers: {
          "content-type": "application/json",
          "set-cookie": `mn_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
        },
      });
    }
    if (action === "update-profile") {
      const user = await currentUser(request);
      if (!user)
        return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
      const [updated] = await db
        .update(users)
        .set({
          fullName: (p.fullName || user.fullName).trim(),
          phone: (p.phone || "").trim(),
          address: (p.address || "").trim(),
        })
        .where(eq(users.id, user.id))
        .returning();
      return Response.json({ user: await safeUser(updated) });
    }
    if (action === "change-password") {
      const user = await currentUser(request);
      if (!user)
        return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
      if (
        !(await verifyPassword(
          p.currentPassword || "",
          user.salt,
          user.passwordHash,
        ))
      )
        return Response.json(
          { error: "Mật khẩu hiện tại không đúng" },
          { status: 400 },
        );
      if ((p.newPassword || "").length < 8)
        return Response.json(
          { error: "Mật khẩu mới phải có ít nhất 8 ký tự" },
          { status: 400 },
        );
      const salt = makeSalt();
      await db
        .update(users)
        .set({ salt, passwordHash: await hashPassword(p.newPassword, salt) })
        .where(eq(users.id, user.id));
      await db.delete(sessions).where(eq(sessions.userId, user.id));
      return new Response(
        JSON.stringify({
          ok: true,
          message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
        }),
        {
          headers: {
            "content-type": "application/json",
            "set-cookie":
              "mn_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
          },
        },
      );
    }
    if (action === "logout") {
      const token = sessionToken(request);
      if (token) await db.delete(sessions).where(eq(sessions.id, token));
      return new Response(JSON.stringify({ ok: true }), {
        headers: {
          "content-type": "application/json",
          "set-cookie":
            "mn_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      });
    }
    return Response.json({ error: "Thao tác không hợp lệ" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
