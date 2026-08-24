import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { leaveRequests } from "../../../db/schema";
import { LEAVE_REASONS } from "../../../lib/care";
import { isDate, vnNow, vnToday } from "../../../lib/day";
import { reach, scopedChildren } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

const STATUSES = ["Chờ duyệt", "Đã duyệt", "Từ chối"];

export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const scope = await scopedChildren(user);
    const names = new Map(scope.rows.map((x) => [x.id, x]));
    const childIds = [...names.keys()];
    const rows = childIds.length
      ? await getDb()
          .select()
          .from(leaveRequests)
          .where(
            reach(scope, user, {
              schoolId: leaveRequests.schoolId,
              childId: leaveRequests.childId,
            }),
          )
          .orderBy(desc(leaveRequests.id))
          .limit(100)
      : [];
    return Response.json({
      today: vnToday(),
      reasons: LEAVE_REASONS,
      requests: rows.map((x) => ({
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
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    if (user.role !== "parent")
      return Response.json(
        { error: "Chỉ phụ huynh được gửi đơn xin nghỉ" },
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
    const fromDate = String(p.fromDate || "");
    const toDate = String(p.toDate || fromDate);
    if (!isDate(fromDate) || !isDate(toDate))
      return Response.json({ error: "Ngày không hợp lệ" }, { status: 400 });
    if (toDate < fromDate)
      return Response.json(
        { error: "Ngày kết thúc phải sau ngày bắt đầu" },
        { status: 400 },
      );
    const reason = String(p.reason || LEAVE_REASONS[0]);
    if (!LEAVE_REASONS.includes(reason))
      return Response.json({ error: "Lý do không hợp lệ" }, { status: 400 });
    const [item] = await getDb()
      .insert(leaveRequests)
      .values({
        schoolId: child.schoolId,
        childId: child.id,
        classId: child.classId,
        fromDate,
        toDate,
        reason,
        note: String(p.note || "").slice(0, 500),
        createdBy: user.id,
      })
      .returning();
    return Response.json({ request: item }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    if (!["teacher", "admin", "superadmin"].includes(user.role))
      return Response.json(
        { error: "Chỉ giáo viên hoặc nhà trường được duyệt đơn" },
        { status: 403 },
      );
    const p = (await request.json()) as Record<string, string | number>;
    const status = String(p.status || "");
    if (!STATUSES.includes(status) || status === "Chờ duyệt")
      return Response.json(
        { error: "Chỉ duyệt hoặc từ chối đơn" },
        { status: 400 },
      );
    const id = Number(p.id);
    const target = (
      await getDb()
        .select()
        .from(leaveRequests)
        .where(eq(leaveRequests.id, id))
        .limit(1)
    )[0];
    if (!target)
      return Response.json({ error: "Không tìm thấy đơn" }, { status: 404 });
    const scope = await scopedChildren(user);
    if (!scope.rows.some((x) => x.id === target.childId))
      return Response.json(
        { error: "Đơn này không thuộc lớp bạn phụ trách" },
        { status: 403 },
      );
    const [item] = await getDb()
      .update(leaveRequests)
      .set({
        status,
        reviewedBy: user.id,
        reviewedAt: `${vnToday()} ${vnNow()}`,
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return Response.json({ request: item });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
