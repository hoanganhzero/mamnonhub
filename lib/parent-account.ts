import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { childGuardians, children, users } from "../db/schema";
import { hashPassword, makeSalt } from "./password";

export const DEFAULT_PARENT_PASSWORD = "mamnon2026";

/**
 * Tên đăng nhập phụ huynh lấy từ 2 tiếng cuối trong họ tên trẻ.
 * Ví dụ: Nguyễn Thị Mỹ An -> myan; Trần Đức Anh -> ducanh.
 */
export function parentUsernameBase(childName: string) {
  const parts = childName
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
  return (parts.length >= 2 ? parts.slice(-2).join("") : parts.join("")) || "phuhuynh";
}

async function uniqueUsername(base: string) {
  const db = getDb();
  let username = base.slice(0, 20);
  let suffix = 1;
  while ((await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1)).length) {
    suffix += 1;
    username = `${base.slice(0, Math.max(1, 24 - String(suffix).length))}${suffix}`;
  }
  return username;
}

export async function ensureParentAccount(child: {
  id: number;
  schoolId: number;
  name: string;
  parentUserId?: number | null;
  phone?: string | null;
  motherPhone?: string | null;
  fatherPhone?: string | null;
  zaloPhone?: string | null;
}) {
  if (child.parentUserId) return null;
  const db = getDb();
  const fresh = (await db.select().from(children).where(eq(children.id, child.id)).limit(1))[0];
  if (!fresh || fresh.parentUserId) return null;

  const username = await uniqueUsername(parentUsernameBase(child.name));
  const salt = makeSalt();
  const phone = String(child.phone || child.motherPhone || child.fatherPhone || child.zaloPhone || "").trim().slice(0, 20);
  const [parent] = await db.insert(users).values({
    schoolId: child.schoolId,
    username,
    fullName: `Phụ huynh của ${child.name}`,
    phone,
    passwordHash: await hashPassword(DEFAULT_PARENT_PASSWORD, salt),
    salt,
    role: "parent",
    status: "active",
  }).returning();

  await db.update(children).set({ parentUserId: parent.id }).where(eq(children.id, child.id));
  await db.insert(childGuardians).values({
    childId: child.id,
    userId: parent.id,
    isPrimary: true,
  }).onConflictDoNothing();

  return {
    userId: parent.id,
    childId: child.id,
    childName: child.name,
    username,
    password: DEFAULT_PARENT_PASSWORD,
  };
}
