import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "../db";
import { postTags, posts } from "../db/schema";
import type { Actor } from "./scope";
import { scopedChildren, teacherClasses } from "./scope";

export type PostVisibility = {
  /** Mã bài viết được phép xem, null nghĩa là không giới hạn theo danh sách. */
  ids: number[] | null;
  childIds: number[];
  classIds: number[];
};

/**
 * Bài viết mà người dùng được phép xem.
 *
 * Giáo viên và quản trị xem theo lớp phụ trách. Phụ huynh chỉ thấy bài có gắn
 * thẻ con mình, hoặc bài chung của lớp con (bài không gắn thẻ ai) — nên ảnh
 * chụp riêng một nhóm trẻ không lọt sang phụ huynh khác.
 */
export async function visiblePosts(user: Actor): Promise<PostVisibility> {
  const db = getDb();
  if (user.role === "superadmin")
    return { ids: null, childIds: [], classIds: [] };

  if (user.role === "parent") {
    const mine = await scopedChildren(user);
    const childIds = mine.rows.map((x) => x.id);
    const classIds = [
      ...new Set(mine.rows.map((x) => x.classId).filter((x): x is number => !!x)),
    ];
    if (!childIds.length) return { ids: [], childIds: [], classIds: [] };

    const tagged = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .where(inArray(postTags.childId, childIds));
    const taggedIds = new Set(tagged.map((x) => x.postId));

    // Bài chung của lớp con: không gắn thẻ riêng trẻ nào.
    const classPosts = user.schoolId
      ? await db
          .select({ id: posts.id })
          .from(posts)
          .where(
            and(
              eq(posts.schoolId, user.schoolId),
              classIds.length
                ? or(isNull(posts.classId), inArray(posts.classId, classIds))
                : isNull(posts.classId),
            ),
          )
      : [];
    const anyTag = classPosts.length
      ? await db
          .select({ postId: postTags.postId })
          .from(postTags)
          .where(
            inArray(
              postTags.postId,
              classPosts.map((x) => x.id),
            ),
          )
      : [];
    const hasTag = new Set(anyTag.map((x) => x.postId));
    for (const row of classPosts) if (!hasTag.has(row.id)) taggedIds.add(row.id);

    return { ids: [...taggedIds], childIds, classIds };
  }

  if (!user.schoolId) return { ids: [], childIds: [], classIds: [] };

  if (user.role === "admin") {
    const rows = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.schoolId, user.schoolId));
    return { ids: rows.map((x) => x.id), childIds: [], classIds: [] };
  }

  const mine = await teacherClasses(user);
  const classIds = mine.map((x) => x.id);
  const rows = await db
    .select({ id: posts.id })
    .from(posts)
    .where(
      and(
        eq(posts.schoolId, user.schoolId),
        classIds.length
          ? or(isNull(posts.classId), inArray(posts.classId, classIds))
          : undefined,
      ),
    );
  return { ids: rows.map((x) => x.id), childIds: [], classIds };
}
