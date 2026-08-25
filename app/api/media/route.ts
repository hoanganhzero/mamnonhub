import { env } from "cloudflare:workers";
import { eq, inArray, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { classes, incidents, menus, postMedia } from "../../../db/schema";
import { visiblePosts } from "../../../lib/posts";
import { scopedChildren } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

/** Ảnh nhật ký và ảnh sự cố: chỉ trả về khi người xem thấy được bài hoặc hồ sơ gốc. */
export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user) return new Response("Unauthorized", { status: 401 });
    const key = new URL(request.url).searchParams.get("key");
    if (!key) return new Response("Not found", { status: 404 });

    const [media] = await getDb()
      .select()
      .from(postMedia)
      .where(eq(postMedia.mediaKey, key))
      .limit(1);
    let allowed = false;
    if (media) {
      const visible = await visiblePosts(user);
      allowed = visible.ids === null || visible.ids.includes(media.postId);
    } else {
      const [incident] = await getDb()
        .select()
        .from(incidents)
        .where(eq(incidents.mediaKey, key))
        .limit(1);
      if (incident) {
        const scope = await scopedChildren(user);
        allowed =
          user.role === "superadmin" ||
          scope.rows.some((x) => x.id === incident.childId);
      } else {
        // Ảnh bìa lớp và ảnh thực đơn: mọi thành viên cùng trường xem được.
        const [cover] = await getDb()
          .select()
          .from(classes)
          .where(eq(classes.coverKey, key))
          .limit(1);
        if (cover)
          allowed =
            user.role === "superadmin" || cover.schoolId === user.schoolId;
        else {
          const [dish] = await getDb()
            .select()
            .from(menus)
            .where(
              or(
                eq(menus.photoKey, key),
                eq(menus.breakfastPhotoKey, key),
                eq(menus.lunchPhotoKey, key),
                eq(menus.snackPhotoKey, key),
              ),
            )
            .limit(1);
          if (dish)
            allowed =
              user.role === "superadmin" || dish.schoolId === user.schoolId;
        }
      }
    }
    if (!allowed) return new Response("Forbidden", { status: 403 });

    const object = await env.BUCKET.get(key);
    if (!object) return new Response("Not found", { status: 404 });
    return new Response(object.body, {
      headers: {
        "content-type": object.httpMetadata?.contentType || "image/jpeg",
        "cache-control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

/** Tải ảnh lên trước, gắn vào bài viết hoặc sự cố sau. */
export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user || !["teacher", "admin", "superadmin"].includes(user.role))
      return Response.json(
        { error: "Chỉ giáo viên và nhà trường được đăng ảnh" },
        { status: 403 },
      );
    const form = await request.formData();
    const files = form.getAll("file").filter((x): x is File => x instanceof File);
    if (!files.length)
      return Response.json({ error: "Chưa chọn ảnh" }, { status: 400 });
    if (files.length > 12)
      return Response.json({ error: "Mỗi lần tối đa 12 ảnh" }, { status: 400 });
    for (const file of files)
      if (!ALLOWED.has(file.type) || file.size > MAX_BYTES)
        return Response.json(
          { error: "Chỉ nhận JPG, PNG, WEBP tối đa 5 MB mỗi ảnh" },
          { status: 400 },
        );

    const uploaded = [];
    for (const file of files) {
      const key = `media/${user.schoolId ?? 0}/${crypto.randomUUID()}`;
      await env.BUCKET.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      });
      uploaded.push({ key, contentType: file.type });
    }
    return Response.json({ media: uploaded }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

/** Dọn ảnh chưa gắn vào đâu khi người dùng bỏ bài viết đang soạn. */
export async function DELETE(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user || !["teacher", "admin", "superadmin"].includes(user.role))
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const key = new URL(request.url).searchParams.get("key") || "";
    if (!key.startsWith(`media/${user.schoolId ?? 0}/`))
      return Response.json({ error: "Ảnh không thuộc trường" }, { status: 403 });
    const used = await getDb()
      .select({ id: postMedia.id })
      .from(postMedia)
      .where(inArray(postMedia.mediaKey, [key]))
      .limit(1);
    if (used.length)
      return Response.json(
        { error: "Ảnh đã gắn vào bài viết" },
        { status: 409 },
      );
    await env.BUCKET.delete(key);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
