import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const classes = sqliteTable("classes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  isDemo: integer("is_demo").notNull().default(1),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  classId: text("class_id"),
  subjects: text("subjects").notNull().default("[]"),
  passwordHash: text("password_hash").notNull(),
  recoveryHash: text("recovery_hash"),
  isDemo: integer("is_demo").notNull().default(0),
  active: integer("active").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("sessions_user").on(table.userId)],
);

export const lessons = sqliteTable(
  "lessons",
  {
    id: text("id").primaryKey(),
    classId: text("class_id").notNull(),
    subject: text("subject").notNull(),
    teacherId: text("teacher_id").notNull(),
    date: text("date").notNull(),
    period: integer("period").notNull(),
    room: text("room").notNull(),
    baseTeacherId: text("base_teacher_id").notNull(),
    baseDate: text("base_date").notNull(),
    basePeriod: integer("base_period").notNull(),
    baseRoom: text("base_room").notNull(),
    isDemo: integer("is_demo").notNull().default(1),
  },
  (table) => [
    index("lessons_class_slot").on(table.classId, table.date, table.period),
    uniqueIndex("lessons_one_teacher_slot").on(
      table.teacherId,
      table.date,
      table.period,
    ),
  ],
);

export const requests = sqliteTable(
  "requests",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id").notNull(),
    classId: text("class_id").notNull(),
    subject: text("subject").notNull(),
    originalTeacherId: text("original_teacher_id").notNull(),
    originalDate: text("original_date").notNull(),
    originalPeriod: integer("original_period").notNull(),
    originalRoom: text("original_room").notNull(),
    kind: text("kind").notNull(),
    targetDate: text("target_date").notNull(),
    targetPeriod: integer("target_period").notNull(),
    targetRoom: text("target_room").notNull(),
    recipientId: text("recipient_id").notNull(),
    reasonCategory: text("reason_category").notNull(),
    reason: text("reason").notNull(),
    handoverJson: text("handover_json").notNull(),
    status: text("status").notNull(),
    transitionToken: text("transition_token"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    isDemo: integer("is_demo").notNull().default(1),
  },
  (table) => [
    uniqueIndex("open_request_per_lesson")
      .on(table.lessonId)
      .where(sql`status IN ('Draft', 'Pending', 'Confirmed', 'Declined')`),
    index("requests_status").on(table.status, table.updatedAt),
  ],
);

export const timeline = sqliteTable("timeline", {
  id: text("id").primaryKey(),
  requestId: text("request_id").notNull(),
  actorId: text("actor_id").notNull(),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(),
  comment: text("comment").notNull().default(""),
  at: text("at").notNull(),
});

export const supplements = sqliteTable("supplements", {
  id: text("id").primaryKey(),
  requestId: text("request_id").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  text: text("text").notNull(),
  at: text("at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  requestId: text("request_id").notNull(),
  event: text("event").notNull(),
  title: text("title").notNull(),
  createdAt: text("created_at").notNull(),
  read: integer("read").notNull().default(0),
});

export const todos = sqliteTable(
  "todos",
  {
    userId: text("user_id").notNull(),
    requestId: text("request_id").notNull(),
    key: text("key").notNull(),
    done: integer("done").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.requestId, table.key] }),
  ],
);

export const views = sqliteTable(
  "views",
  {
    userId: text("user_id").notNull(),
    requestId: text("request_id").notNull(),
    at: text("at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.requestId] })],
);

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(),
  entityId: text("entity_id").notNull(),
  at: text("at").notNull(),
  detail: text("detail").notNull(),
  isDemo: integer("is_demo").notNull().default(1),
});

export const slotLocks = sqliteTable(
  "slot_locks",
  {
    requestId: text("request_id").notNull(),
    scope: text("scope").notNull(),
    scopeId: text("scope_id").notNull(),
    date: text("date").notNull(),
    period: integer("period").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.scope, table.scopeId, table.date, table.period],
    }),
  ],
);

export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const authAttempts = sqliteTable(
  "auth_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    bucket: text("bucket").notNull(),
    at: text("at").notNull(),
  },
  (table) => [index("auth_attempts_bucket").on(table.bucket, table.at)],
);
