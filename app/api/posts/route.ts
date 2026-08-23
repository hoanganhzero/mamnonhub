import { env } from "cloudflare:workers";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { postMedia, postTags, posts, users } from "../../../db/schema";
import { POST_CATEGORIES as CATEGORIES } from "../../../lib/care";
import { isDate, vnToday } from "../../../lib/day";
import { visiblePosts } from "../../../lib/posts";
import { scopedChildren } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

const MAX_MEDIA = 12;

export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const visible = await visiblePosts(user);
    if (visible.ids !== null && !visible.ids.length)
      return Response.json({ posts: [], categories: CATEGORIES });

    const db = getDb();
    const rows = await db
      .select({ post: posts, author: users.fullName })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(visible.ids === null ? undefined : inArray(posts.id, visible.ids))
      .orderBy(desc(posts.date), desc(posts.id))
      .limit(60);
    const ids = rows.map((x) => x.post.id);
    const [media, tags] = ids.length
      ? await Promise.all([
          db.select().from(postMedia).where(inArray(postMedia.postId, ids)),
          db.select().from(postTags).where(inArray(postTags.postId, ids)),
        ])
      : [[], []];
    // Phụ huynh chỉ nhìn thấy tên con mình trong danh sách gắn thẻ.
    const nameScope = await scopedChildren(user);
    const names = new Map(nameScope.rows.map((x) => [x.id, x.name]));

    return Response.json({
      categories: CATEGORIES,
      posts: rows.map(({ post, author }) => ({
        ...post,
        authorName: author || "Giáo viên",
        media: media
          .filter((m) => m.postId === post.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((m) => ({ key: m.mediaKey, contentType: m.contentType })),
        children: tags
          .filter((t) => t.postId === post.id && names.has(t.childId))
          .map((t) => ({ id: t.childId, name: names.get(t.childId) })),
        taggedCount: tags.filter((t) => t.postId === post.id).length,
      })),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user?.schoolId || !["teacher", "admin"].includes(user.role))
      return Response.json(
        { error: "Chỉ giáo viên và nhà trường được đăng nhật ký" },
        { status: 403 },
      );
    const p = (await request.json()) as {
      title?: string;
      content?: string;
      category?: string;
      date?: string;
      classId?: number | string;
      childIds?: number[];
      media?: { key?: string; contentType?: string }[];
    };
    if (!p.title?.trim())
      return Response.json({ error: "Nhập tiêu đề bài viết" }, { status: 400 });
    const category = String(p.category || CATEGORIES[0]);
    if (!CATEGORIES.includes(category))
      return Response.json({ error: "Chủ đề không hợp lệ" }, { status: 400 });
    const date = isDate(p.date) ? p.date : vnToday();

    const scope = await scopedChildren(user);
    const allowedChildren = new Map(scope.rows.map((x) => [x.id, x]));
    const childIds = [...new Set((p.childIds || []).map(Number))];
    for (const id of childIds)
      if (!allowedChildren.has(id))
        return Response.json(
          { error: "Có trẻ không thuộc lớp bạn phụ trách" },
          { status: 403 },
        );

    const classId = Number(p.classId) || null;
    if (classId && !scope.classes.some((x) => x.id === classId))
      return Response.json(
        { error: "Lớp không thuộc phạm vi bạn phụ trách" },
        { status: 403 },
      );

    const media = (p.media || []).slice(0, MAX_MEDIA).filter((m) => m.key);
    for (const item of media)
      if (!String(item.key).startsWith(`media/${user.schoolId}/`))
        return Response.json(
          { error: "Ảnh không thuộc trường" },
          { status: 403 },
        );

    const db = getDb();
    const [post] = await db
      .insert(posts)
      .values({
        schoolId: user.schoolId,
        classId,
        authorId: user.id,
        title: p.title.trim(),
        content: String(p.content || "").slice(0, 4000),
        category,
        date,
      })
      .returning();
    if (media.length)
      await db.insert(postMedia).values(
        media.map((item, index) => ({
          postId: post.id,
          mediaKey: String(item.key),
          contentType: String(item.contentType || "image/jpeg"),
          sortOrder: index,
        })),
      );
    if (childIds.length)
      await db
        .insert(postTags)
        .values(childIds.map((childId) => ({ postId: post.id, childId })));
    return Response.json({ post }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user?.schoolId || !["teacher", "admin"].includes(user.role))
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const id = Number(new URL(request.url).searchParams.get("id"));
    const db = getDb();
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);
    if (!post || post.schoolId !== user.schoolId)
      return Response.json({ error: "Không tìm thấy bài" }, { status: 404 });
    if (user.role === "teacher" && post.authorId !== user.id)
      return Response.json(
        { error: "Chỉ người đăng mới xóa được bài" },
        { status: 403 },
      );
    const media = await db
      .select()
      .from(postMedia)
      .where(eq(postMedia.postId, id));
    for (const item of media) await env.BUCKET.delete(item.mediaKey);
    await db.delete(postMedia).where(eq(postMedia.postId, id));
    await db.delete(postTags).where(eq(postTags.postId, id));
    await db.delete(posts).where(eq(posts.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
