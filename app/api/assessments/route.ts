import { inArray, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { assessments } from "../../../db/schema";
import { ASSESSMENT_DOMAINS, ASSESSMENT_LEVELS } from "../../../lib/care";
import { scopedChildren } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

const MAX_ITEMS = 300;

export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const scope = await scopedChildren(user);
    const names = new Map(scope.rows.map((x) => [x.id, x]));
    const rows = names.size
      ? await getDb()
          .select()
          .from(assessments)
          .where(inArray(assessments.childId, [...names.keys()]))
      : [];
    return Response.json({
      domains: ASSESSMENT_DOMAINS.map(([key, label]) => ({ key, label })),
      levels: ASSESSMENT_LEVELS,
      classes: scope.classes,
      children: scope.rows.map((x) => ({
        childId: x.id,
        name: x.name,
        className: x.className,
      })),
      assessments: rows.map((x) => ({
        ...x,
        childName: names.get(x.childId)?.name ?? "",
        className: names.get(x.childId)?.className ?? "",
      })),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user || !["teacher", "admin"].includes(user.role))
      return Response.json(
        { error: "Chỉ giáo viên được nhập đánh giá" },
        { status: 403 },
      );
    const body = (await request.json()) as {
      period?: string;
      items?: Record<string, string | number | undefined>[];
    };
    const period = String(body.period || "").trim();
    if (!period || period.length > 60)
      return Response.json(
        { error: "Chọn kỳ đánh giá (ví dụ: Học kỳ 1 · 2026–2027)" },
        { status: 400 },
      );
    const items = body.items;
    if (!Array.isArray(items) || !items.length)
      return Response.json({ error: "Chưa có trẻ nào" }, { status: 400 });
    if (items.length > MAX_ITEMS)
      return Response.json(
        { error: `Mỗi lượt lưu tối đa ${MAX_ITEMS} trẻ` },
        { status: 400 },
      );

    const scope = await scopedChildren(user);
    const allowed = new Map(scope.rows.map((x) => [x.id, x]));
    const values = [];
    for (const item of items) {
      const child = allowed.get(Number(item.childId));
      if (!child)
        return Response.json(
          { error: "Có trẻ không thuộc lớp bạn phụ trách" },
          { status: 403 },
        );
      const picked: Record<string, string> = {};
      let hasAny = false;
      for (const [key] of ASSESSMENT_DOMAINS) {
        const value = String(item[key] ?? "");
        if (value && !ASSESSMENT_LEVELS.includes(value))
          return Response.json(
            { error: `Mức đánh giá không hợp lệ: ${value}` },
            { status: 400 },
          );
        picked[key] = value;
        if (value) hasAny = true;
      }
      const comment = String(item.comment ?? "").slice(0, 1000);
      // Trẻ chưa được đánh giá mục nào thì bỏ qua, không tạo bản ghi rỗng.
      if (!hasAny && !comment.trim()) continue;
      values.push({
        schoolId: child.schoolId,
        childId: child.id,
        period,
        physical: picked.physical,
        cognitive: picked.cognitive,
        language: picked.language,
        social: picked.social,
        aesthetic: picked.aesthetic,
        comment,
        teacherId: user.id,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      });
    }
    if (!values.length)
      return Response.json(
        { error: "Chưa đánh giá trẻ nào trong danh sách" },
        { status: 400 },
      );

    await getDb()
      .insert(assessments)
      .values(values)
      .onConflictDoUpdate({
        target: [assessments.childId, assessments.period],
        set: {
          physical: sql`excluded.physical`,
          cognitive: sql`excluded.cognitive`,
          language: sql`excluded.language`,
          social: sql`excluded.social`,
          aesthetic: sql`excluded.aesthetic`,
          comment: sql`excluded.comment`,
          teacherId: sql`excluded.teacher_id`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });
    return Response.json({ ok: true, period, saved: values.length });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
