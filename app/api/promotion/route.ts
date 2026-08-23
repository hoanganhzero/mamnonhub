import { and, eq, inArray, notInArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { children, classes, schools } from "../../../db/schema";
import { logAction } from "../../../lib/audit";
import { currentUser } from "../../../lib/session";

/**
 * Kết chuyển năm học: chuyển cả lớp sang lớp mới hoặc cho ra trường,
 * đồng thời cập nhật năm học của trường. Chạy một lần vào cuối hè.
 */
export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user?.schoolId || user.role !== "admin")
      return Response.json(
        { error: "Chỉ quản trị trường được kết chuyển năm học" },
        { status: 403 },
      );
    const db = getDb();
    const [classRows, kids, [school]] = await Promise.all([
      db
        .select()
        .from(classes)
        .where(
          and(eq(classes.schoolId, user.schoolId), eq(classes.status, "active")),
        ),
      db
        .select({ id: children.id, classId: children.classId })
        .from(children)
        .where(
          and(
            eq(children.schoolId, user.schoolId),
            notInArray(children.status, ["Đã nghỉ học", "Đã tốt nghiệp"]),
          ),
        ),
      db.select().from(schools).where(eq(schools.id, user.schoolId)).limit(1),
    ]);
    return Response.json({
      academicYear: school?.academicYear || "",
      classes: classRows.map((c) => ({
        id: c.id,
        name: c.name,
        ageGroup: c.ageGroup,
        childCount: kids.filter((k) => k.classId === c.id).length,
      })),
      unassigned: kids.filter((k) => !k.classId).length,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user?.schoolId || user.role !== "admin")
      return Response.json(
        { error: "Chỉ quản trị trường được kết chuyển năm học" },
        { status: 403 },
      );
    const body = (await request.json()) as {
      academicYear?: string;
      moves?: { fromClassId?: number; to?: string | number }[];
    };
    const academicYear = String(body.academicYear || "").trim();
    if (!/^\d{4}\s*[–-]\s*\d{4}$/.test(academicYear))
      return Response.json(
        { error: "Năm học mới phải theo dạng 2027–2028" },
        { status: 400 },
      );
    const moves = body.moves;
    if (!Array.isArray(moves) || !moves.length)
      return Response.json(
        { error: "Chưa chọn hướng chuyển cho lớp nào" },
        { status: 400 },
      );

    const db = getDb();
    const classRows = await db
      .select()
      .from(classes)
      .where(eq(classes.schoolId, user.schoolId));
    const byId = new Map(classRows.map((c) => [c.id, c]));
    type ClassRow = (typeof classRows)[number];

    // Kiểm tra toàn bộ kế hoạch trước khi động vào dữ liệu.
    const plan: { from: ClassRow; to: "graduate" | "keep" | ClassRow }[] = [];
    for (const move of moves) {
      const from = byId.get(Number(move.fromClassId));
      if (!from)
        return Response.json(
          { error: "Có lớp không thuộc trường của bạn" },
          { status: 400 },
        );
      if (move.to === "graduate") plan.push({ from, to: "graduate" });
      else if (move.to === "keep" || move.to === "" || move.to == null)
        plan.push({ from, to: "keep" });
      else {
        const to = byId.get(Number(move.to));
        if (!to)
          return Response.json(
            { error: `Lớp đích của ${from.name} không hợp lệ` },
            { status: 400 },
          );
        if (to.id === from.id)
          return Response.json(
            { error: `Lớp ${from.name} không thể chuyển vào chính nó` },
            { status: 400 },
          );
        plan.push({ from, to });
      }
    }
    const targets = plan
      .filter((x) => x.to !== "graduate" && x.to !== "keep")
      .map((x) => (x.to as ClassRow).id);
    if (new Set(targets).size !== targets.length)
      return Response.json(
        {
          error: "Hai lớp không thể cùng chuyển vào một lớp đích trong một lượt",
        },
        { status: 400 },
      );

    const enrolled = notInArray(children.status, [
      "Đã nghỉ học",
      "Đã tốt nghiệp",
    ]);
    // Chụp danh sách trẻ của TỪNG lớp trước khi cập nhật, để chuỗi chuyển
    // Mầm → Chồi → Lá không cuốn trẻ đi hai bước trong cùng một lượt.
    const roster = new Map<number, number[]>();
    for (const step of plan) {
      const kids = await db
        .select({ id: children.id })
        .from(children)
        .where(and(eq(children.classId, step.from.id), enrolled));
      roster.set(
        step.from.id,
        kids.map((k) => k.id),
      );
    }
    let graduated = 0;
    let moved = 0;
    for (const step of plan) {
      const ids = roster.get(step.from.id) || [];
      if (!ids.length || step.to === "keep") continue;
      if (step.to === "graduate") {
        await db
          .update(children)
          .set({ status: "Đã tốt nghiệp", classId: null })
          .where(inArray(children.id, ids));
        graduated += ids.length;
      } else {
        const to = step.to as ClassRow;
        await db
          .update(children)
          .set({ classId: to.id, className: to.name })
          .where(inArray(children.id, ids));
        moved += ids.length;
      }
    }

    await db
      .update(classes)
      .set({ academicYear })
      .where(eq(classes.schoolId, user.schoolId));
    await db
      .update(schools)
      .set({ academicYear })
      .where(eq(schools.id, user.schoolId));
    await logAction(
      user,
      "kết chuyển năm học",
      "trường",
      user.schoolId,
      `${academicYear}: ${moved} trẻ chuyển lớp, ${graduated} ra trường`,
    );
    return Response.json({ ok: true, academicYear, moved, graduated });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
