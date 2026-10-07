import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { childGuardians, children } from "../../../db/schema";
import { ensureParentAccount, DEFAULT_PARENT_PASSWORD } from "../../../lib/parent-account";
import { teacherClasses } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

export async function POST(request: Request) {
  try {
    const actor = await currentUser(request);
    if (!actor || !["teacher", "admin", "superadmin"].includes(actor.role))
      return Response.json({ error: "Không có quyền" }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as { schoolId?: number };
    const schoolId = actor.role === "superadmin" ? Number(body.schoolId) : actor.schoolId;
    if (!schoolId)
      return Response.json({ error: "Vui lòng chọn trường cần tạo tài khoản phụ huynh" }, { status: 400 });

    let rows = await getDb().select().from(children).where(eq(children.schoolId, schoolId));
    rows = rows.filter((child) => child.status !== "Đã nghỉ học" && !child.parentUserId);

    if (actor.role === "teacher") {
      const allowed = new Set((await teacherClasses(actor)).map((item) => item.id));
      rows = rows.filter((child) => child.classId && allowed.has(child.classId));
    }

    const created: { childId: number; childName: string; username: string }[] = [];
    let restored = 0;
    let skipped = 0;

    for (const child of rows) {
      const existing = (
        await getDb()
          .select({ userId: childGuardians.userId })
          .from(childGuardians)
          .where(eq(childGuardians.childId, child.id))
          .limit(1)
      )[0];

      if (existing) {
        await getDb()
          .update(children)
          .set({ parentUserId: existing.userId })
          .where(eq(children.id, child.id));
        restored += 1;
        continue;
      }

      const result = await ensureParentAccount(child);
      if (result?.username) {
        created.push({
          childId: child.id,
          childName: child.name,
          username: result.username,
        });
      } else {
        skipped += 1;
      }
    }

    return Response.json({
      ok: true,
      created: created.length,
      restored,
      skipped,
      defaultPassword: DEFAULT_PARENT_PASSWORD,
      accounts: created,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
