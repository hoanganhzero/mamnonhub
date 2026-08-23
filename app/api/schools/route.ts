import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { schools } from "../../../db/schema";
import { currentUser } from "../../../lib/session";
import { THEMES } from "../../../lib/themes";

export async function GET(request: Request) {
  try {
    const actor = await currentUser(request);
    if (!actor)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    if (actor.role === "superadmin")
      return Response.json({ schools: await getDb().select().from(schools) });
    if (!actor.schoolId) return Response.json({ schools: [] });
    return Response.json({
      schools: await getDb()
        .select()
        .from(schools)
        .where(eq(schools.id, actor.schoolId)),
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await currentUser(request);
    if (actor?.role !== "superadmin")
      return Response.json(
        { error: "Chỉ quản trị tối cao được tạo trường" },
        { status: 403 },
      );
    const p = (await request.json()) as Record<string, string>;
    const code = (p.code || "").trim().replace(/\s+/g, " ").toUpperCase();
    if (
      code.length < 3 ||
      code.length > 16 ||
      !/^[A-Z0-9]+(?:[ -][A-Z0-9]+)*$/.test(code) ||
      !p.name?.trim()
    )
      return Response.json(
        { error: "Nhập tên trường và mã trường từ 3–16 ký tự" },
        { status: 400 },
      );
    const [school] = await getDb()
      .insert(schools)
      .values({
        code,
        name: p.name.trim(),
        academicYear: p.academicYear || "2026–2027",
      })
      .returning();
    return Response.json({ school }, { status: 201 });
  } catch (e) {
    return Response.json(
      {
        error: String(e).includes("UNIQUE")
          ? "Mã trường đã tồn tại"
          : String(e),
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await currentUser(request);
    if (!actor || !["admin", "superadmin"].includes(actor.role))
      return Response.json(
        { error: "Không có quyền sửa trường" },
        { status: 403 },
      );
    const p = (await request.json()) as {
      id: number;
      name?: string;
      address?: string;
      academicYear?: string;
      status?: string;
      theme?: string;
    };
    const targetId = actor.role === "admin" ? actor.schoolId : Number(p.id);
    if (!targetId)
      return Response.json({ error: "Thiếu trường" }, { status: 400 });
    const values: {
      name?: string;
      address?: string;
      academicYear?: string;
      status?: string;
      theme?: string;
    } = {};
    if (p.theme) {
      if (!THEMES[p.theme])
        return Response.json({ error: "Bộ màu không hợp lệ" }, { status: 400 });
      values.theme = p.theme;
    }
    if (p.name?.trim()) values.name = p.name.trim();
    if (typeof p.address === "string") values.address = p.address.trim();
    if (p.academicYear) values.academicYear = p.academicYear;
    if (
      actor.role === "superadmin" &&
      p.status &&
      ["active", "locked"].includes(p.status)
    )
      values.status = p.status;
    const [school] = await getDb()
      .update(schools)
      .set(values)
      .where(eq(schools.id, targetId))
      .returning();
    return Response.json({ school });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
