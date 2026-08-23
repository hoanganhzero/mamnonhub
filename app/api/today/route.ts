import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { getDb } from "../../../db";
import { attendance, dailyLogs, leaveRequests } from "../../../db/schema";
import { dateParam, vnToday } from "../../../lib/day";
import { scopedChildren } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

/** Một ngày ở trường của từng bé mà tài khoản đang đăng nhập được xem. */
export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const date = dateParam(request);
    const scope = await scopedChildren(user);
    const childIds = scope.rows.map((x) => x.id);
    if (!childIds.length)
      return Response.json({ date, today: vnToday(), children: [] });

    const [marks, logs, leaves] = await Promise.all([
      getDb()
        .select()
        .from(attendance)
        .where(
          and(eq(attendance.date, date), inArray(attendance.childId, childIds)),
        ),
      getDb()
        .select()
        .from(dailyLogs)
        .where(
          and(eq(dailyLogs.date, date), inArray(dailyLogs.childId, childIds)),
        ),
      getDb()
        .select()
        .from(leaveRequests)
        .where(
          and(
            inArray(leaveRequests.childId, childIds),
            lte(leaveRequests.fromDate, date),
            gte(leaveRequests.toDate, date),
          ),
        ),
    ]);
    const markBy = new Map(marks.map((x) => [x.childId, x]));
    const logBy = new Map(logs.map((x) => [x.childId, x]));
    const leaveBy = new Map(leaves.map((x) => [x.childId, x]));

    return Response.json({
      date,
      today: vnToday(),
      children: scope.rows.map((child) => ({
        id: child.id,
        name: child.name,
        className: child.className,
        birthDate: child.birthDate,
        allergy: child.allergy,
        avatarKey: child.avatarKey,
        attendance: markBy.get(child.id) ?? null,
        log: logBy.get(child.id) ?? null,
        leave: leaveBy.get(child.id) ?? null,
      })),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
