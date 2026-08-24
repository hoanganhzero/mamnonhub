import { and, desc, inArray, ne } from "drizzle-orm";
import { getDb } from "../../../db";
import { messages, users } from "../../../db/schema";
import { OFFICE_HOURS } from "../../../lib/care";
import { vnNow, vnToday } from "../../../lib/day";
import { rowChunks } from "../../../lib/batch";
import { reach, scopedChildren } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const scope = await scopedChildren(user);
    const childIds = scope.rows.map((x) => x.id);
    if (!childIds.length)
      return Response.json({ threads: [], messages: [], officeHours: OFFICE_HOURS });

    const requested = Number(new URL(request.url).searchParams.get("childId"));
    const childId = childIds.includes(requested) ? requested : childIds[0];

    const db = getDb();
    const all = await db
      .select()
      .from(messages)
      .where(
        reach(scope, user, {
          schoolId: messages.schoolId,
          childId: messages.childId,
        }),
      )
      .orderBy(desc(messages.id))
      .limit(400);

    // Đánh dấu đã đọc các tin của phía bên kia trong hội thoại đang mở.
    const unreadHere = all.filter(
      (x) => x.childId === childId && x.senderId !== user.id && !x.readAt,
    );
    for (const part of rowChunks(unreadHere.map((x) => x.id), 1))
      await db
        .update(messages)
        .set({ readAt: `${vnToday()} ${vnNow()}` })
        .where(
          and(inArray(messages.id, part), ne(messages.senderId, user.id)),
        );

    const senderIds = [...new Set(all.map((x) => x.senderId))];
    const senders = senderIds.length
      ? await db
          .select({ id: users.id, fullName: users.fullName })
          .from(users)
          .where(inArray(users.id, senderIds))
      : [];
    const senderNames = new Map(senders.map((x) => [x.id, x.fullName]));

    const thread = all
      .filter((x) => x.childId === childId)
      .sort((a, b) => a.id - b.id)
      .map((x) => ({
        ...x,
        senderName: senderNames.get(x.senderId) || "Người dùng",
        mine: x.senderId === user.id,
      }));

    return Response.json({
      childId,
      officeHours: OFFICE_HOURS,
      threads: scope.rows.map((child) => {
        const forChild = all.filter((x) => x.childId === child.id);
        const last = forChild[0];
        return {
          childId: child.id,
          name: child.name,
          className: child.className,
          lastBody: last?.body || "",
          lastAt: last?.createdAt || "",
          unread: forChild.filter(
            (x) => x.senderId !== user.id && !x.readAt && x.childId !== childId,
          ).length,
        };
      }),
      messages: thread,
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
    if (!["parent", "teacher", "admin"].includes(user.role))
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const p = (await request.json()) as Record<string, string | number>;
    const body = String(p.body || "").trim();
    if (!body)
      return Response.json({ error: "Chưa nhập nội dung" }, { status: 400 });
    if (body.length > 2000)
      return Response.json(
        { error: "Tin nhắn tối đa 2000 ký tự" },
        { status: 400 },
      );
    const scope = await scopedChildren(user);
    const child = scope.rows.find((x) => x.id === Number(p.childId));
    if (!child)
      return Response.json(
        { error: "Không có quyền nhắn tin về hồ sơ này" },
        { status: 403 },
      );
    const [item] = await getDb()
      .insert(messages)
      .values({
        schoolId: child.schoolId,
        childId: child.id,
        senderId: user.id,
        senderRole: user.role,
        body,
      })
      .returning();
    return Response.json({ message: item }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
