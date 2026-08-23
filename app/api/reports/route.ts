import { and, eq, gte, inArray, like, lte } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  announcementReads,
  announcements,
  attendance,
  children,
  classes,
  incidents,
  posts,
} from "../../../db/schema";
import { monthParam } from "../../../lib/day";
import { currentUser } from "../../../lib/session";

/** Báo cáo tháng cho ban giám hiệu: chuyên cần, sự cố, mức độ tương tác từng lớp. */
export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user?.schoolId || !["admin", "superadmin"].includes(user.role))
      return Response.json(
        { error: "Chỉ ban giám hiệu xem được báo cáo" },
        { status: 403 },
      );
    const month = monthParam(request);
    const db = getDb();
    const monthLike = like(attendance.date, `${month}-%`);

    const [classRows, childRows] = await Promise.all([
      db
        .select()
        .from(classes)
        .where(eq(classes.schoolId, user.schoolId)),
      db
        .select()
        .from(children)
        .where(eq(children.schoolId, user.schoolId)),
    ]);
    const activeChildren = childRows.filter((x) => x.status !== "Đã nghỉ học");
    const childIds = activeChildren.map((x) => x.id);

    const [marks, incidentRows, postRows, notices, reads] = await Promise.all([
      childIds.length
        ? db
            .select()
            .from(attendance)
            .where(
              and(eq(attendance.schoolId, user.schoolId), monthLike),
            )
        : Promise.resolve([]),
      db
        .select()
        .from(incidents)
        .where(
          and(
            eq(incidents.schoolId, user.schoolId),
            gte(incidents.date, `${month}-01`),
            lte(incidents.date, `${month}-31`),
          ),
        ),
      db
        .select()
        .from(posts)
        .where(
          and(
            eq(posts.schoolId, user.schoolId),
            gte(posts.date, `${month}-01`),
            lte(posts.date, `${month}-31`),
          ),
        ),
      db
        .select()
        .from(announcements)
        .where(eq(announcements.schoolId, user.schoolId)),
      db.select().from(announcementReads),
    ]);

    const classOf = new Map(activeChildren.map((x) => [x.id, x.classId]));
    const perClass = classRows.map((cls) => {
      const kids = activeChildren.filter((x) => x.classId === cls.id);
      const kidIds = new Set(kids.map((x) => x.id));
      const classMarks = marks.filter((m) => kidIds.has(m.childId));
      const present = classMarks.filter((m) => m.status === "Có mặt").length;
      const excused = classMarks.filter((m) => m.status === "Vắng có phép").length;
      const unexcused = classMarks.filter(
        (m) => m.status === "Vắng không phép",
      ).length;
      return {
        classId: cls.id,
        name: cls.name,
        ageGroup: cls.ageGroup,
        childCount: kids.length,
        markedDays: classMarks.length,
        present,
        excused,
        unexcused,
        attendanceRate: classMarks.length
          ? Math.round((present / classMarks.length) * 100)
          : null,
        incidents: incidentRows.filter((i) => kidIds.has(i.childId)).length,
        posts: postRows.filter((p) => p.classId === cls.id).length,
      };
    });

    const unassigned = activeChildren.filter((x) => !classOf.get(x.id)).length;
    const noticeIds = new Set(notices.map((x) => x.id));
    return Response.json({
      month,
      totals: {
        children: activeChildren.length,
        left: childRows.length - activeChildren.length,
        unassigned,
        marked: marks.length,
        present: marks.filter((m) => m.status === "Có mặt").length,
        incidents: incidentRows.length,
        incidentsUnacknowledged: incidentRows.filter((i) => !i.acknowledgedBy)
          .length,
        posts: postRows.length,
        announcements: notices.length,
        announcementReads: reads.filter((r) => noticeIds.has(r.announcementId))
          .length,
      },
      perClass,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
