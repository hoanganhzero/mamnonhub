import { getDb } from "../../../db";
import * as schema from "../../../db/schema";
import { vnToday } from "../../../lib/day";
import { currentUser } from "../../../lib/session";

/**
 * Xuất toàn bộ dữ liệu (trừ phiên đăng nhập và mã mật khẩu) thành một file
 * JSON để lưu trữ ngoài hệ thống. Chỉ quản trị tối cao được tải.
 */
export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (user?.role !== "superadmin")
      return Response.json(
        { error: "Chỉ quản trị tối cao được tải bản sao lưu" },
        { status: 403 },
      );
    const db = getDb();
    const tables = {
      schools: schema.schools,
      campuses: schema.campuses,
      classes: schema.classes,
      children: schema.children,
      childGuardians: schema.childGuardians,
      users: schema.users,
      attendance: schema.attendance,
      dailyLogs: schema.dailyLogs,
      leaveRequests: schema.leaveRequests,
      posts: schema.posts,
      postMedia: schema.postMedia,
      postTags: schema.postTags,
      messages: schema.messages,
      healthRecords: schema.healthRecords,
      incidents: schema.incidents,
      menus: schema.menus,
      announcements: schema.announcements,
      announcementReads: schema.announcementReads,
      feeSettings: schema.feeSettings,
      invoices: schema.invoices,
      assessments: schema.assessments,
      pickupPersons: schema.pickupPersons,
      pickupNotices: schema.pickupNotices,
      auditLogs: schema.auditLogs,
    } as const;

    const dump: Record<string, unknown[]> = {};
    for (const [name, table] of Object.entries(tables))
      dump[name] = await db.select().from(table);
    // Không đưa mã mật khẩu ra ngoài hệ thống.
    dump.users = (dump.users as (typeof schema.users.$inferSelect)[]).map(
      (row) => {
        const rest = { ...row } as Partial<typeof row>;
        delete rest.passwordHash;
        delete rest.salt;
        return rest;
      },
    );

    const date = vnToday();
    return new Response(
      JSON.stringify({ exportedAt: date, tables: dump }, null, 1),
      {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition": `attachment; filename="mamnonhub-backup-${date}.json"`,
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
