import { getDb } from "../db";
import { auditLogs } from "../db/schema";
import type { Actor } from "./scope";

/** Ghi một dòng nhật ký thao tác. Không bao giờ làm hỏng request chính. */
export async function logAction(
  actor: Actor,
  action: string,
  entity: string,
  entityId: number | null,
  detail = "",
) {
  try {
    await getDb().insert(auditLogs).values({
      schoolId: actor.schoolId,
      actorId: actor.id,
      actorRole: actor.role,
      action,
      entity,
      entityId,
      detail: detail.slice(0, 500),
    });
  } catch {
    // Nhật ký lỗi không được chặn nghiệp vụ chính.
  }
}
