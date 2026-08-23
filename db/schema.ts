import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
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
  classId: integer("class_id"),
  createdBy: integer("created_by"),
  requiresAck: integer("requires_ack", { mode: "boolean" })
    .notNull()
    .default(false),
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

export const announcementReads = sqliteTable(
  "announcement_reads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    announcementId: integer("announcement_id").notNull(),
    userId: integer("user_id").notNull(),
    readAt: text("read_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("announcement_reads_unique").on(
      table.announcementId,
      table.userId,
    ),
  ],
);

export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    schoolId: integer("school_id").notNull(),
    classId: integer("class_id"),
    authorId: integer("author_id").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    category: text("category").notNull().default("Hoạt động học"),
    date: text("date").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("posts_school_date_idx").on(table.schoolId, table.date)],
);

export const postMedia = sqliteTable(
  "post_media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id").notNull(),
    mediaKey: text("media_key").notNull(),
    contentType: text("content_type").notNull().default("image/jpeg"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("post_media_post_idx").on(table.postId)],
);

/** Trẻ có mặt trong bài viết — phụ huynh chỉ thấy ảnh có con mình hoặc bài chung. */
export const postTags = sqliteTable(
  "post_tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id").notNull(),
    childId: integer("child_id").notNull(),
  },
  (table) => [uniqueIndex("post_tags_unique").on(table.postId, table.childId)],
);

export const messages = sqliteTable(
  "messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    schoolId: integer("school_id").notNull(),
    childId: integer("child_id").notNull(),
    senderId: integer("sender_id").notNull(),
    senderRole: text("sender_role").notNull(),
    body: text("body").notNull(),
    readAt: text("read_at").notNull().default(""),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("messages_child_idx").on(table.childId, table.id)],
);

export const healthRecords = sqliteTable(
  "health_records",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    schoolId: integer("school_id").notNull(),
    childId: integer("child_id").notNull(),
    date: text("date").notNull(),
    heightCm: real("height_cm"),
    weightKg: real("weight_kg"),
    note: text("note").notNull().default(""),
    recordedBy: integer("recorded_by"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("health_records_child_date_unique").on(
      table.childId,
      table.date,
    ),
  ],
);

export const incidents = sqliteTable(
  "incidents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    schoolId: integer("school_id").notNull(),
    childId: integer("child_id").notNull(),
    classId: integer("class_id"),
    date: text("date").notNull(),
    time: text("time").notNull().default(""),
    kind: text("kind").notNull().default("Sốt"),
    severity: text("severity").notNull().default("Nhẹ"),
    description: text("description").notNull().default(""),
    handling: text("handling").notNull().default(""),
    mediaKey: text("media_key"),
    recordedBy: integer("recorded_by"),
    acknowledgedBy: integer("acknowledged_by"),
    acknowledgedAt: text("acknowledged_at").notNull().default(""),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("incidents_child_idx").on(table.childId, table.date)],
);

export const menus = sqliteTable(
  "menus",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    schoolId: integer("school_id").notNull(),
    weekStart: text("week_start").notNull(),
    weekday: integer("weekday").notNull(),
    breakfast: text("breakfast").notNull().default(""),
    lunch: text("lunch").notNull().default(""),
    snack: text("snack").notNull().default(""),
    note: text("note").notNull().default(""),
    updatedBy: integer("updated_by"),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("menus_week_unique").on(
      table.schoolId,
      table.weekStart,
      table.weekday,
    ),
  ],
);
