import { and, eq, ne } from "drizzle-orm";
import { getDb } from "../../../db";
import { children, classes } from "../../../db/schema";
import { teacherClasses } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";
import { MASCOTS } from "../../../lib/themes";

/** Trang lớp chủ nhiệm: giáo viên tự trang trí lớp của mình. */
export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user || user.role !== "teacher")
      return Response.json(
        { error: "Chỉ giáo viên chủ nhiệm có trang lớp" },
        { status: 403 },
      );
    const mine = await teacherClasses(user);
    if (!mine.length)
      return Response.json({ classes: [], mascots: MASCOTS });
    const db = getDb();
    const rows = await Promise.all(
      mine.map(async (c) => {
        const [row] = await db
          .select()
          .from(classes)
          .where(eq(classes.id, c.id))
          .limit(1);
        const kids = await db
          .select({ id: children.id })
          .from(children)
          .where(
            and(
              eq(children.classId, c.id),
              ne(children.status, "Đã nghỉ học"),
            ),
          );
        return {
          id: row.id,
          name: row.name,
          ageGroup: row.ageGroup,
          mascot: row.mascot,
          motto: row.motto,
          intro: row.intro,
          coverKey: row.coverKey,
          childCount: kids.length,
        };
      }),
    );
    return Response.json({ classes: rows, mascots: MASCOTS });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user || user.role !== "teacher")
      return Response.json(
        { error: "Chỉ giáo viên chủ nhiệm được trang trí lớp" },
        { status: 403 },
      );
    const p = (await request.json()) as Record<string, string | number>;
    const mine = await teacherClasses(user);
    const target = mine.find((x) => x.id === Number(p.classId));
    if (!target)
      return Response.json(
        { error: "Lớp không thuộc phạm vi bạn chủ nhiệm" },
        { status: 403 },
      );
    const mascot = String(p.mascot || "");
    if (mascot && !MASCOTS.includes(mascot))
      return Response.json(
        { error: "Biểu tượng không nằm trong bộ cho phép" },
        { status: 400 },
      );
    const coverKey = String(p.coverKey ?? "");
    if (coverKey && !coverKey.startsWith(`media/${user.schoolId}/`))
      return Response.json({ error: "Ảnh không thuộc trường" }, { status: 403 });
    const [row] = await getDb()
      .update(classes)
      .set({
        mascot: mascot || "🌻",
        motto: String(p.motto || "").slice(0, 120),
        intro: String(p.intro || "").slice(0, 400),
        // Chuỗi rỗng nghĩa là gỡ ảnh bìa.
        coverKey: coverKey || null,
      })
      .where(eq(classes.id, target.id))
      .returning();
    return Response.json({
      class: {
        id: row.id,
        name: row.name,
        mascot: row.mascot,
        motto: row.motto,
        intro: row.intro,
        coverKey: row.coverKey,
      },
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
