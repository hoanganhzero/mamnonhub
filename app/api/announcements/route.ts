import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { announcementReads, announcements, users } from "../../../db/schema";
import { scopedChildren, teacherClasses } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";
import type { Actor } from "../../../lib/scope";

/** Lớp mà người dùng thuộc về, dùng để lọc thông báo đúng nơi nhận. */
async function audienceClasses(user: Actor) {
  if (user.role === "teacher") return (await teacherClasses(user)).map((x) => x.id);
  if (user.role === "parent") {
    const mine = await scopedChildren(user);
    return [
      ...new Set(mine.rows.map((x) => x.classId).filter((x): x is number => !!x)),
    ];
  }
  return [];
}

export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const db = getDb();
    if (!user.schoolId && user.role !== "superadmin")
      return Response.json({ announcements: [] });

    // Quản trị và giáo viên xem được mọi thông báo của trường; phụ huynh chỉ
    // nhận thông báo toàn trường hoặc đúng lớp của con mình.
    const classIds = await audienceClasses(user);
    const reach =
      user.role === "superadmin"
        ? undefined
        : user.role === "parent"
          ? and(
              eq(announcements.schoolId, user.schoolId!),
              classIds.length
                ? or(
                    isNull(announcements.classId),
                    inArray(announcements.classId, classIds),
                  )
                : isNull(announcements.classId),
            )
          : eq(announcements.schoolId, user.schoolId!);

    const rows = await db
      .select({ item: announcements, author: users.fullName })
      .from(announcements)
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .where(reach)
      .orderBy(desc(announcements.id))
      .limit(100);

    const ids = rows.map((x) => x.item.id);
    const reads = ids.length
      ? await db
          .select()
          .from(announcementReads)
          .where(inArray(announcementReads.announcementId, ids))
      : [];
    const mineRead = new Set(
      reads.filter((x) => x.userId === user.id).map((x) => x.announcementId),
    );

    return Response.json({
      announcements: rows.map(({ item, author }) => ({
        ...item,
        authorName: author || "Nhà trường",
        read: mineRead.has(item.id),
        // Người gửi cần biết bao nhiêu phụ huynh đã đọc.
        readCount: reads.filter((x) => x.announcementId === item.id).length,
      })),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    if (!user.schoolId || !["teacher", "admin"].includes(user.role))
      return Response.json(
        { error: "Chỉ giáo viên hoặc quản trị trường được gửi thông báo" },
        { status: 403 },
      );
    const p = (await request.json()) as Record<string, string | number | boolean>;
    if (!p.title || !p.content)
      return Response.json({ error: "Nhập tiêu đề và nội dung" }, { status: 400 });

    const classId = Number(p.classId) || null;
    if (classId) {
      const allowed =
        user.role === "admin"
          ? (await scopedChildren(user)).classes
          : await teacherClasses(user);
      if (!allowed.some((x) => x.id === classId))
        return Response.json(
          { error: "Lớp không thuộc phạm vi bạn phụ trách" },
          { status: 403 },
        );
    }
    const audience = classId
      ? String(p.audience || "Phụ huynh một lớp")
      : "Toàn trường";

    const [announcement] = await getDb()
      .insert(announcements)
      .values({
        schoolId: user.schoolId,
        title: String(p.title),
        content: String(p.content),
        audience,
        classId,
        createdBy: user.id,
        requiresAck: Boolean(p.requiresAck),
      })
      .returning();
    return Response.json({ announcement }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

/** Đánh dấu đã đọc, hoặc xác nhận với thông báo cần phản hồi. */
export async function PATCH(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const p = (await request.json()) as Record<string, number>;
    const id = Number(p.id);
    const [item] = await getDb()
      .select()
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);
    if (!item || (user.role !== "superadmin" && item.schoolId !== user.schoolId))
      return Response.json({ error: "Không tìm thấy thông báo" }, { status: 404 });
    if (item.classId && user.role === "parent") {
      const classIds = await audienceClasses(user);
      if (!classIds.includes(item.classId))
        return Response.json({ error: "Không có quyền" }, { status: 403 });
    }
    await getDb()
      .insert(announcementReads)
      .values({ announcementId: id, userId: user.id })
      .onConflictDoNothing();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
