import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { incidents, users } from "../../../db/schema";
import { INCIDENT_KINDS, INCIDENT_SEVERITY } from "../../../lib/care";
import { isDate, isTime, vnNow, vnToday } from "../../../lib/day";
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
    const rows = childIds.length
      ? await getDb()
          .select()
          .from(incidents)
          .where(inArray(incidents.childId, childIds))
          .orderBy(desc(incidents.id))
          .limit(100)
      : [];
    const staffIds = [
      ...new Set(rows.map((x) => x.recordedBy).filter((x): x is number => !!x)),
    ];
    const staff = staffIds.length
      ? await getDb()
          .select({ id: users.id, fullName: users.fullName })
          .from(users)
          .where(inArray(users.id, staffIds))
      : [];
    const staffNames = new Map(staff.map((x) => [x.id, x.fullName]));
    return Response.json({
      today: vnToday(),
      kinds: INCIDENT_KINDS,
      severities: INCIDENT_SEVERITY,
      incidents: rows.map((x) => ({
        ...x,
        childName: names.get(x.childId)?.name ?? "",
        className: names.get(x.childId)?.className ?? "",
        recordedName: x.recordedBy ? staffNames.get(x.recordedBy) || "" : "",
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
        { error: "Chỉ giáo viên và nhà trường được ghi nhận sự cố" },
        { status: 403 },
      );
    const p = (await request.json()) as Record<string, string | number>;
    const scope = await scopedChildren(user);
    const child = scope.rows.find((x) => x.id === Number(p.childId));
    if (!child)
      return Response.json(
        { error: "Trẻ không thuộc lớp bạn phụ trách" },
        { status: 403 },
      );
    const kind = String(p.kind || INCIDENT_KINDS[0]);
    const severity = String(p.severity || INCIDENT_SEVERITY[0]);
    if (!INCIDENT_KINDS.includes(kind) || !INCIDENT_SEVERITY.includes(severity))
      return Response.json(
        { error: "Loại hoặc mức độ không hợp lệ" },
        { status: 400 },
      );
    const description = String(p.description || "").trim();
    if (!description)
      return Response.json(
        { error: "Mô tả ngắn gọn việc đã xảy ra" },
        { status: 400 },
      );
    const time = String(p.time || vnNow());
    const mediaKey = String(p.mediaKey || "");
    if (mediaKey && !mediaKey.startsWith(`media/${user.schoolId}/`))
      return Response.json({ error: "Ảnh không thuộc trường" }, { status: 403 });
    const [item] = await getDb()
      .insert(incidents)
      .values({
        schoolId: child.schoolId,
        childId: child.id,
        classId: child.classId,
        date: isDate(p.date) ? String(p.date) : vnToday(),
        time: isTime(time) ? time : vnNow(),
        kind,
        severity,
        description: description.slice(0, 1000),
        handling: String(p.handling || "").slice(0, 1000),
        mediaKey: mediaKey || null,
        recordedBy: user.id,
      })
      .returning();
    return Response.json({ incident: item }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

/** Phụ huynh xác nhận đã đọc — đây là bằng chứng nhà trường đã báo tin. */
export async function PATCH(request: Request) {
  try {
    const user = await currentUser(request);
    if (user?.role !== "parent")
      return Response.json(
        { error: "Chỉ phụ huynh xác nhận được" },
        { status: 403 },
      );
    const p = (await request.json()) as Record<string, number>;
    const scope = await scopedChildren(user);
    const [target] = await getDb()
      .select()
      .from(incidents)
      .where(eq(incidents.id, Number(p.id)))
      .limit(1);
    if (!target || !scope.rows.some((x) => x.id === target.childId))
      return Response.json({ error: "Không tìm thấy" }, { status: 404 });
    const [item] = await getDb()
      .update(incidents)
      .set({
        acknowledgedBy: user.id,
        acknowledgedAt: `${vnToday()} ${vnNow()}`,
      })
      .where(eq(incidents.id, target.id))
      .returning();
    return Response.json({ incident: item });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
