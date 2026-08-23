import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditLogs, users } from "../../../db/schema";
import { currentUser } from "../../../lib/session";

/** Nhật ký thao tác cho ban giám hiệu: ai làm gì, lúc nào. */
export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user || !["admin", "superadmin"].includes(user.role))
      return Response.json(
        { error: "Chỉ ban giám hiệu xem được nhật ký thao tác" },
        { status: 403 },
      );
    const db = getDb();
    const rows =
      user.role === "superadmin"
        ? await db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(200)
        : user.schoolId
          ? await db
              .select()
              .from(auditLogs)
              .where(eq(auditLogs.schoolId, user.schoolId))
              .orderBy(desc(auditLogs.id))
              .limit(200)
          : [];
    const actorIds = [...new Set(rows.map((x) => x.actorId))];
    const actors = actorIds.length
      ? await db
          .select({ id: users.id, fullName: users.fullName })
          .from(users)
          .where(inArray(users.id, actorIds))
      : [];
    const names = new Map(actors.map((x) => [x.id, x.fullName]));
    return Response.json({
      logs: rows.map((x) => ({
        ...x,
        actorName: names.get(x.actorId) || `Người dùng #${x.actorId}`,
      })),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
