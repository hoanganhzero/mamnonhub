import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const schools = sqliteTable(
  "schools",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    academicYear: text("academic_year").notNull().default("2026–2027"),
    address: text("address").notNull().default(""),
    logoKey: text("logo_key"),
    bannerKey: text("banner_key"),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("schools_code_unique").on(table.code)],
);

export const children = sqliteTable("children", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id").notNull().default(1),
  name: text("name").notNull(),
  className: text("class_name").notNull().default("Lá 1"),
  birthDate: text("birth_date").notNull().default("2021-01-01"),
  guardian: text("guardian").notNull().default(""),
  phone: text("phone").notNull().default(""),
  allergy: text("allergy").notNull().default("Không"),
  status: text("status").notNull().default("Đã đến"),
  avatarKey: text("avatar_key"),
  parentUserId: integer("parent_user_id"),
  classId: integer("class_id"),
  fatherName: text("father_name").notNull().default(""),
  fatherBirthDate: text("father_birth_date").notNull().default(""),
  fatherJob: text("father_job").notNull().default(""),
  fatherPhone: text("father_phone").notNull().default(""),
  motherName: text("mother_name").notNull().default(""),
  motherBirthDate: text("mother_birth_date").notNull().default(""),
  motherJob: text("mother_job").notNull().default(""),
  motherPhone: text("mother_phone").notNull().default(""),
  zaloPhone: text("zalo_phone").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const campuses = sqliteTable("campuses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull().default(""),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
export const classes = sqliteTable("classes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id").notNull(),
  campusId: integer("campus_id").notNull(),
  name: text("name").notNull(),
  ageGroup: text("age_group").notNull().default(""),
  academicYear: text("academic_year").notNull(),
  teacherId: integer("teacher_id"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id").notNull().default(1),
  title: text("title").notNull(),
  content: text("content").notNull(),
  audience: text("audience").notNull().default("Phụ huynh lớp Lá 1"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    schoolId: integer("school_id"),
    username: text("username").notNull(),
    fullName: text("full_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    salt: text("salt").notNull(),
    role: text("role").notNull().default("parent"),
    status: text("status").notNull().default("pending"),
    phone: text("phone").notNull().default(""),
    address: text("address").notNull().default(""),
    avatarKey: text("avatar_key"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("users_username_unique").on(table.username)],
);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const attendance = sqliteTable(
  "attendance",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    schoolId: integer("school_id").notNull(),
    childId: integer("child_id").notNull(),
    classId: integer("class_id"),
    date: text("date").notNull(),
    status: text("status").notNull().default("Có mặt"),
    note: text("note").notNull().default(""),
    checkInAt: text("check_in_at").notNull().default(""),
    checkOutAt: text("check_out_at").notNull().default(""),
    recordedBy: integer("recorded_by"),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("attendance_child_date_unique").on(table.childId, table.date),
  ],
);

export const dailyLogs = sqliteTable(
  "daily_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    schoolId: integer("school_id").notNull(),
    childId: integer("child_id").notNull(),
    classId: integer("class_id"),
    date: text("date").notNull(),
    breakfast: text("breakfast").notNull().default(""),
    lunch: text("lunch").notNull().default(""),
    snack: text("snack").notNull().default(""),
    sleep: text("sleep").notNull().default(""),
    sleepMinutes: integer("sleep_minutes"),
    mood: text("mood").notNull().default(""),
    health: text("health").notNull().default(""),
    note: text("note").notNull().default(""),
    recordedBy: integer("recorded_by"),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("daily_logs_child_date_unique").on(table.childId, table.date),
  ],
);

export const leaveRequests = sqliteTable("leave_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id").notNull(),
  childId: integer("child_id").notNull(),
  classId: integer("class_id"),
  fromDate: text("from_date").notNull(),
  toDate: text("to_date").notNull(),
  reason: text("reason").notNull().default("Ốm"),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("Chờ duyệt"),
  createdBy: integer("created_by").notNull(),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: text("reviewed_at").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
