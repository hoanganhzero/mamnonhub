import { env } from "cloudflare:workers";
import { eq, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { schools } from "../../../db/schema";
import { currentUser } from "../../../lib/session";
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user?.schoolId) return new Response("Not found", { status: 404 });
    const key = new URL(request.url).searchParams.get("key");
    if (!key) return new Response("Not found", { status: 404 });
    const school = (
      await getDb()
        .select()
        .from(schools)
        .where(or(eq(schools.logoKey, key), eq(schools.bannerKey, key)))
        .limit(1)
    )[0];
    if (!school || (school.id !== user.schoolId && user.role !== "superadmin"))
      return new Response("Forbidden", { status: 403 });
    const obj = await env.BUCKET.get(key);
    if (!obj) return new Response("Not found", { status: 404 });
    return new Response(obj.body, {
      headers: {
        "content-type": obj.httpMetadata?.contentType || "image/jpeg",
        "cache-control": "private, max-age=3600",
      },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (user?.role !== "admin" || !user.schoolId)
      return Response.json(
        { error: "Chỉ quản trị trường được thay nhận diện" },
        { status: 403 },
      );
    const form = await request.formData(),
      file = form.get("file"),
      type = String(form.get("type"));
    if (
      !(file instanceof File) ||
      !allowed.has(file.type) ||
      file.size > 5 * 1024 * 1024
    )
      return Response.json(
        { error: "Chỉ nhận JPG, PNG, WEBP tối đa 5 MB" },
        { status: 400 },
      );
    if (!["logo", "banner"].includes(type))
      return Response.json({ error: "Loại ảnh không hợp lệ" }, { status: 400 });
    const key = `branding/${user.schoolId}/${type}/${crypto.randomUUID()}`;
    await env.BUCKET.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    const [school] = await getDb()
      .update(schools)
      .set(type === "logo" ? { logoKey: key } : { bannerKey: key })
      .where(eq(schools.id, user.schoolId))
      .returning();
    return Response.json({ school });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
