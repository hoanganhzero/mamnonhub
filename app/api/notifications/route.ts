import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  announcementReads,
  announcements,
  attendance,
  incidents,
  leaveRequests,
  messages,
} from "../../../db/schema";
import { vnToday } from "../../../lib/day";
import { reach, scopedChildren, teacherClasses } from "../../../lib/scope";
import { currentUser } from "../../../lib/session";

type Item = { kind: string; label: string; count: number; target: string };

/** Số đếm thật cho chuông thông báo, thay cho con số cố định trước đây. */
export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user)
      return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const db = getDb();
    const today = vnToday();
    const scope = await scopedChildren(user);
    const childIds = scope.rows.map((x) => x.id);
    const items: Item[] = [];

    if (childIds.length) {
      const inbox = await db
        .select()
        .from(messages)
        .where(
          and(
            reach(scope, user, {
              schoolId: messages.schoolId,
              childId: messages.childId,
            }),
            eq(messages.readAt, ""),
          ),
        );
      const unread = inbox.filter((x) => x.senderId !== user.id).length;
      if (unread)
        items.push({
          kind: "messages",
          label: "tin nhắn chưa đọc",
          count: unread,
          target: "Tin nhắn",
        });
    }

    if (user.role === "parent") {
      if (childIds.length) {
        const pending = await db
          .select()
          .from(incidents)
          .where(
            and(
              reach(scope, user, {
                schoolId: incidents.schoolId,
                childId: incidents.childId,
              }),
              isNull(incidents.acknowledgedBy),
            ),
          );
        if (pending.length)
          items.push({
            kind: "incidents",
            label: "sự cố cần xác nhận",
            count: pending.length,
            target: "Hôm nay của con",
          });
      }
      const classIds = [
        ...new Set(
          scope.rows.map((x) => x.classId).filter((x): x is number => !!x),
        ),
      ];
      if (user.schoolId) {
        const audienceReach = and(
          eq(announcements.schoolId, user.schoolId),
          classIds.length
            ? or(
                isNull(announcements.classId),
                inArray(announcements.classId, classIds),
              )
            : isNull(announcements.classId),
        );
        const [all, read] = await Promise.all([
          db.select({ id: announcements.id }).from(announcements).where(audienceReach),
          db
            .select({ id: announcementReads.announcementId })
            .from(announcementReads)
            .where(eq(announcementReads.userId, user.id)),
        ]);
        const readIds = new Set(read.map((x) => x.id));
        const unread = all.filter((x) => !readIds.has(x.id)).length;
        if (unread)
          items.push({
            kind: "announcements",
            label: "thông báo chưa đọc",
            count: unread,
            target: "Thông báo",
          });
      }
    }

    if (["teacher", "admin"].includes(user.role) && childIds.length) {
      const waiting = await db
        .select()
        .from(leaveRequests)
        .where(
          and(
            reach(scope, user, {
              schoolId: leaveRequests.schoolId,
              childId: leaveRequests.childId,
            }),
            eq(leaveRequests.status, "Chờ duyệt"),
          ),
        );
      if (waiting.length)
        items.push({
          kind: "leaves",
          label: "đơn xin nghỉ chờ duyệt",
          count: waiting.length,
          target: "Điểm danh",
        });

      if (user.role === "teacher" && (await teacherClasses(user)).length) {
        const marked = await db
          .select({ childId: attendance.childId })
          .from(attendance)
          .where(
            and(
              eq(attendance.date, today),
              reach(scope, user, {
                schoolId: attendance.schoolId,
                childId: attendance.childId,
              }),
            ),
          );
        const missing = childIds.length - marked.length;
        if (missing > 0)
          items.push({
            kind: "attendance",
            label: "trẻ chưa điểm danh hôm nay",
            count: missing,
            target: "Điểm danh",
          });
      }
    }

    return Response.json({
      total: items.reduce((sum, x) => sum + x.count, 0),
      items,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
