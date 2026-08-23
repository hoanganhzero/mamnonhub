import type { SQL } from "drizzle-orm";
import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "../db";
import { children, classes, users } from "../db/schema";

export type Actor = typeof users.$inferSelect;
export type Child = typeof children.$inferSelect;
export type ClassOption = { id: number; name: string; ageGroup: string };

/** Lớp mà giáo viên đang được phân công chủ nhiệm. */
export async function teacherClasses(user: Actor): Promise<ClassOption[]> {
  if (!user.schoolId) return [];
  return getDb()
    .select({ id: classes.id, name: classes.name, ageGroup: classes.ageGroup })
    .from(classes)
    .where(
      and(
        eq(classes.schoolId, user.schoolId),
        eq(classes.teacherId, user.id),
        eq(classes.status, "active"),
      ),
    )
    .orderBy(asc(classes.name));
}

export type ChildScope = {
  rows: Child[];
  classes: ClassOption[];
  /** "class": đúng lớp được phân công · "school": chưa phân lớp nên tạm mở toàn trường */
  scope: "class" | "school" | "parent" | "system";
  classId: number | null;
};

function listChildren(where?: SQL) {
  return getDb()
    .select()
    .from(children)
    .where(where)
    .orderBy(asc(children.name));
}

/**
 * Danh sách trẻ mà người dùng được phép xem và thao tác.
 *
 * Giáo viên chỉ thấy trẻ thuộc lớp mình chủ nhiệm, cộng thêm trẻ chưa xếp lớp
 * của cùng trường để còn xếp lớp cho các hồ sơ nhập từ Excel. Giáo viên chưa
 * được phân lớp nào thì tạm thấy toàn trường và nhận cờ scope "school" để giao
 * diện nhắc nhà trường phân lớp.
 *
 * `classId` là số hiệu lớp cần lọc, hoặc 0 để lấy riêng nhóm chưa xếp lớp.
 */
export async function scopedChildren(
  user: Actor,
  classId: number | null = null,
): Promise<ChildScope> {
  if (user.role === "parent")
    return {
      rows: await listChildren(eq(children.parentUserId, user.id)),
      classes: [],
      scope: "parent",
      classId: null,
    };

  if (user.role === "superadmin")
    return {
      rows: await listChildren(
        classId ? eq(children.classId, classId) : undefined,
      ),
      classes: [],
      scope: "system",
      classId,
    };

  if (!user.schoolId)
    return { rows: [], classes: [], scope: "school", classId: null };

  const school = eq(children.schoolId, user.schoolId);

  if (user.role === "admin") {
    const all = await getDb()
      .select({
        id: classes.id,
        name: classes.name,
        ageGroup: classes.ageGroup,
      })
      .from(classes)
      .where(eq(classes.schoolId, user.schoolId))
      .orderBy(asc(classes.name));
    const where =
      classId === 0
        ? and(school, isNull(children.classId))
        : classId
          ? and(school, eq(children.classId, classId))
          : school;
    return {
      rows: await listChildren(where),
      classes: all,
      scope: "school",
      classId,
    };
  }

  const mine = await teacherClasses(user);
  const ids = mine.map((x) => x.id);
  if (!ids.length)
    return {
      rows: await listChildren(school),
      classes: [],
      scope: "school",
      classId: null,
    };

  const picked = classId === 0 || (classId !== null && ids.includes(classId));
  const where = !picked
    ? and(school, or(inArray(children.classId, ids), isNull(children.classId)))
    : classId === 0
      ? and(school, isNull(children.classId))
      : and(school, eq(children.classId, classId));

  return {
    rows: await listChildren(where),
    classes: mine,
    scope: "class",
    classId: picked ? classId : null,
  };
}

/** Số hiệu lớp lấy từ tham số truy vấn: null = mọi lớp trong phạm vi, 0 = chưa xếp lớp. */
export function classParam(request: Request) {
  const raw = new URL(request.url).searchParams.get("classId");
  if (raw === null || raw === "" || raw === "all") return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : null;
}
