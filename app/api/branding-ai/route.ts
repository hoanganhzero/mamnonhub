import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { schools } from "../../../db/schema";
import { currentUser } from "../../../lib/session";

export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (user?.role !== "admin" || !user.schoolId)
      return Response.json({ error: "Chỉ quản trị trường được tạo nhận diện" }, { status: 403 });
    const apiKey = (env as unknown as { KIRA_API_KEY?: string }).KIRA_API_KEY;
    if (!apiKey)
      return Response.json({ error: "Chưa cấu hình khóa Kira AI cho website" }, { status: 503 });
    const body = await request.json() as { type?: string; prompt?: string };
    const type = body.type === "banner" ? "banner" : "logo";
    const prompt = String(body.prompt || "").trim().slice(0, 800);
    if (!prompt) return Response.json({ error: "Hãy nhập mô tả hình ảnh" }, { status: 400 });
    const ai = await fetch("https://kiraai.vn/api/v1/images/generations", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "kira-3.0-image",
        aspect_ratio: type === "banner" ? "16:9" : "1:1",
        prompt: `${prompt}. Phong cách chibi đáng yêu, sạch, chuyên nghiệp, phù hợp trường mầm non Việt Nam. Không watermark.`,
      }),
    });
    const result = await ai.json() as { data?: { b64_json?: string; mime_type?: string }[]; error?: { message?: string } };
    const image = result.data?.[0];
    if (!ai.ok || !image?.b64_json)
      return Response.json({ error: result.error?.message || "Dịch vụ AI chưa tạo được ảnh" }, { status: 502 });
    const bytes = Uint8Array.from(atob(image.b64_json), (c) => c.charCodeAt(0));
    const key = `branding/${user.schoolId}/${type}/ai-${crypto.randomUUID()}`;
    await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: image.mime_type || "image/png" } });
    const [school] = await getDb().update(schools).set(type === "logo" ? { logoKey: key } : { bannerKey: key }).where(eq(schools.id, user.schoolId)).returning();
    return Response.json({ school });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
