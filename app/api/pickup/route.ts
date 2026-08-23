import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { pickupNotices, pickupPersons } from "../../../db/schema";
import { PICKUP_RELATIONS } from "../../../lib/care";
import { dateParam, isDate, isTime, vnToday } from "../../../lib/day";
import { scopedChildren } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const scope = await scopedChildren(user);
    const names = new Map(scope.rows.map((x) => [x.id, x]));
    const childIds = [...names.keys()];
    const date = dateParam(request);
    const db = getDb();

    const [persons, notices] = childIds.length
      ? await Promise.all([
          db
            .select()
            .from(pickupPersons)
            .where(inArray(pickupPersons.childId, childIds)),
          // Giáo viên xem theo ngày; phụ huynh xem các báo gần nhất của con.
          user.role === "parent"
            ? db
                .select()
                .from(pickupNotices)
                .where(inArray(pickupNotices.childId, childIds))
                .orderBy(desc(pickupNotices.id))
                .limit(30)
            : db
                .select()
                .from(pickupNotices)
                .where(
                  and(
                    eq(pickupNotices.date, date),
                    inArray(pickupNotices.childId, childIds),
                  ),
                ),
        ])
      : [[], []];

    const label = (childId: number) => ({
      childName: names.get(childId)?.name ?? "",
      className: names.get(childId)?.className ?? "",
    });
    return Response.json({
      date,
      today: vnToday(),
      relations: PICKUP_RELATIONS,
      persons: persons.map((x) => ({ ...x, ...label(x.childId) })),
      notices: notices.map((x) => ({ ...x, ...label(x.childId) })),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (user?.role !== "parent")
      return Response.json(
        { error: "Chỉ phụ huynh được đăng ký người đón" },
        { status: 403 },
      );
    const p = (await request.json()) as Record<string, string | number>;
    const scope = await scopedChildren(user);
    const child = scope.rows.find((x) => x.id === Number(p.childId));
    if (!child)
      return Response.json(
        { error: "Tài khoản chưa được liên kết với hồ sơ trẻ này" },
        { status: 403 },
      );
    const name = String(p.name || p.personName || "").trim();
    if (!name)
      return Response.json({ error: "Nhập tên người đón" }, { status: 400 });
    const relation = String(p.relation || "");
    if (relation && !PICKUP_RELATIONS.includes(relation))
      return Response.json({ error: "Quan hệ không hợp lệ" }, { status: 400 });

    if (p.action === "person") {
      const existing = await getDb()
        .select()
        .from(pickupPersons)
        .where(eq(pickupPersons.childId, child.id));
      if (existing.length >= 6)
        return Response.json(
          { error: "Mỗi bé đăng ký tối đa 6 người đón" },
          { status: 400 },
        );
      const [item] = await getDb()
        .insert(pickupPersons)
        .values({
          schoolId: child.schoolId,
          childId: child.id,
          name: name.slice(0, 100),
          relation,
          phone: String(p.phone || "").slice(0, 20),
          createdBy: user.id,
        })
        .returning();
      return Response.json({ person: item }, { status: 201 });
    }

    if (p.action === "notice") {
      const date = isDate(p.date) ? String(p.date) : vnToday();
      if (date < vnToday())
        return Response.json(
          { error: "Không báo người đón cho ngày đã qua" },
          { status: 400 },
        );
      const expectedTime = String(p.expectedTime || "");
      const [item] = await getDb()
        .insert(pickupNotices)
        .values({
          schoolId: child.schoolId,
          childId: child.id,
          date,
          personName: name.slice(0, 100),
          relation,
          phone: String(p.phone || "").slice(0, 20),
          expectedTime: isTime(expectedTime) ? expectedTime : "",
          note: String(p.note || "").slice(0, 300),
          createdBy: user.id,
        })
        .returning();
      return Response.json({ notice: item }, { status: 201 });
    }

    return Response.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await currentUser(request);
    if (user?.role !== "parent")
      return Response.json({ error: "Không có quyền" }, { status: 403 });
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    const kind = url.searchParams.get("kind") || "person";
    const scope = await scopedChildren(user);
    const childIds = scope.rows.map((x) => x.id);
    if (kind === "notice") {
      const [target] = await getDb()
        .select()
        .from(pickupNotices)
        .where(eq(pickupNotices.id, id))
        .limit(1);
      if (!target || !childIds.includes(target.childId))
        return Response.json({ error: "Không tìm thấy" }, { status: 404 });
      if (target.date < vnToday())
        return Response.json(
          { error: "Báo đón của ngày đã qua được giữ lại làm lịch sử" },
          { status: 400 },
        );
      await getDb().delete(pickupNotices).where(eq(pickupNotices.id, id));
      return Response.json({ ok: true });
    }
    const [target] = await getDb()
      .select()
      .from(pickupPersons)
      .where(eq(pickupPersons.id, id))
      .limit(1);
    if (!target || !childIds.includes(target.childId))
      return Response.json({ error: "Không tìm thấy" }, { status: 404 });
    await getDb().delete(pickupPersons).where(eq(pickupPersons.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
