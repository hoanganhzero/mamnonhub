import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../db";
import { schools, sessions, users } from "../db/schema";
export function sessionToken(request:Request){return request.headers.get("cookie")?.match(/(?:^|; )mn_session=([^;]+)/)?.[1]}
export async function currentUser(request:Request){const token=sessionToken(request);if(!token)return null;const rows=await getDb().select({user:users}).from(sessions).innerJoin(users,eq(sessions.userId,users.id)).where(and(eq(sessions.id,token),gt(sessions.expiresAt,Date.now()))).limit(1);return rows[0]?.user??null}
export async function safeUser(u:typeof users.$inferSelect){const school=u.schoolId?(await getDb().select().from(schools).where(eq(schools.id,u.schoolId)).limit(1))[0]:null;return {id:u.id,username:u.username,fullName:u.fullName,role:u.role,status:u.status,phone:u.phone,address:u.address,avatarKey:u.avatarKey,schoolId:u.schoolId,schoolName:school?.name||"Toàn hệ thống",schoolCode:school?.code||"",academicYear:school?.academicYear||""}}
