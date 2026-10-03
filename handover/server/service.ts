import type {
  AuditEvent,
  ChangeRequest,
  ConflictResult,
  Handover,
  Impact,
  Kind,
  Lesson,
  Material,
  Notification,
  RequestInput,
  Risk,
  Role,
  SchoolClass,
  Stats,
  Status,
  Supplement,
  Teacher,
  TimelineEvent,
  User,
  Workspace,
} from "../shared/types.ts";
import {
  addDays,
  defaultSchoolMonday,
  isSchoolDate,
  mondayOnOrBefore,
  periodClock,
  PERIOD_COUNT,
  PERIOD_MINUTES,
  SCHOOL_TIME_ZONE,
  schoolToday,
} from "../shared/time.ts";

export interface ServiceConfig {
  TEACHER_INVITE_CODE: string;
  DEMO_MODE: string;
}

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  class_id: string | null;
  subjects: string;
  password_hash: string;
  recovery_hash: string | null;
  is_demo: number;
  active: number;
};

type LessonRow = {
  id: string;
  class_id: string;
  subject: string;
  teacher_id: string;
  date: string;
  period: number;
  room: string;
  base_teacher_id: string;
  base_date: string;
  base_period: number;
  base_room: string;
  is_demo: number;
};

type RequestRow = {
  id: string;
  lesson_id: string;
  class_id: string;
  subject: string;
  original_teacher_id: string;
  original_date: string;
  original_period: number;
  original_room: string;
  kind: Kind;
  target_date: string;
  target_period: number;
  target_room: string;
  recipient_id: string;
  reason_category: string;
  reason: string;
  handover_json: string;
  status: Status;
  created_at: string;
  updated_at: string;
  is_demo: number;
};

class HttpError extends Error {
  status: number;
  code: string;
  fields?: string[];
  constructor(status: number, code: string, fields?: string[]) {
    super(code);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

const REASONS = new Set(["meeting", "leave", "training", "medical", "other"]);
const TODO_KEYS = new Set(["materials", "assessment", "reminder"]);
const OPEN = new Set(["Draft", "Pending", "Confirmed", "Declined"]);
const MAX_BODY = 20_000;
const SESSION_DAYS = 14;

function nowIso() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function bytes(size: number) {
  const value = new Uint8Array(size);
  crypto.getRandomValues(value);
  return value;
}

function base64url(value: Uint8Array) {
  let text = "";
  for (const item of value) text += String.fromCharCode(item);
  return btoa(text)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return new Uint8Array(digest);
}

async function hex(value: string) {
  return [...(await sha256(value))]
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}

async function secretsEqual(left: string, right: string) {
  const [a, b] = await Promise.all([sha256(left), sha256(right)]);
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a[index] ^ b[index];
  return diff === 0;
}

async function hashPassword(password: string) {
  const salt = bytes(16);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" },
    key,
    256,
  );
  return `pbkdf2$120000$${base64url(salt)}$${base64url(new Uint8Array(bits))}`;
}

function fromBase64url(value: string) {
  const padded =
    value.replaceAll("-", "+").replaceAll("_", "/") +
    "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1)
    out[index] = binary.charCodeAt(index);
  return out;
}

async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, salt, digest] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterations || !salt || !digest) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: fromBase64url(salt),
      iterations: Number(iterations),
      hash: "SHA-256",
    },
    key,
    256,
  );
  const actual = base64url(new Uint8Array(bits));
  return secretsEqual(actual, digest);
}

function json(data: unknown, status = 200, cookie?: string) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
  });
  if (cookie) headers.set("set-cookie", cookie);
  return new Response(JSON.stringify(data), { status, headers });
}

function fail(error: HttpError) {
  return json(
    { error: error.code, ...(error.fields ? { fields: error.fields } : {}) },
    error.status,
  );
}

async function all<T>(db: D1Database, sql: string, binds: unknown[] = []) {
  const statement = binds.length
    ? db.prepare(sql).bind(...binds)
    : db.prepare(sql);
  const result = await statement.all();
  return result.results as T[];
}

async function one<T>(db: D1Database, sql: string, binds: unknown[] = []) {
  const statement = binds.length
    ? db.prepare(sql).bind(...binds)
    : db.prepare(sql);
  return (await statement.first()) as T | null;
}

async function run(db: D1Database, sql: string, binds: unknown[] = []) {
  const statement = binds.length
    ? db.prepare(sql).bind(...binds)
    : db.prepare(sql);
  return statement.run();
}

function asUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    classId: row.class_id,
    subjects: JSON.parse(row.subjects) as string[],
    isDemo: row.is_demo === 1,
    active: row.active === 1,
  };
}

function clampText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function safeUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes(".."))
    return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function parseHandover(value: unknown, strictUrls: boolean): Handover {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const materials = Array.isArray(source.materials)
    ? source.materials.slice(0, 8)
    : [];
  const parsed: Material[] = [];
  for (const item of materials) {
    const record =
      item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const title = clampText(record.title, 120);
    const url = clampText(record.url, 500);
    if (url && !safeUrl(url))
      throw new HttpError(422, "VALIDATION_ERROR", ["materials"]);
    if (strictUrls && url && !safeUrl(url))
      throw new HttpError(422, "VALIDATION_ERROR", ["materials"]);
    parsed.push({ title, url });
  }
  return {
    progress: clampText(source.progress, 2000),
    plan: clampText(source.plan, 2000),
    materials: parsed,
    assessment: clampText(source.assessment, 2000),
    equipment: clampText(source.equipment, 2000),
    studentReminder: clampText(source.studentReminder, 2000),
    teacherNotes: clampText(source.teacherNotes, 2000),
  };
}

function missingHandover(handover: Handover) {
  const fields: string[] = [];
  if (!handover.progress) fields.push("progress");
  if (!handover.plan) fields.push("plan");
  if (!handover.assessment) fields.push("assessment");
  if (!handover.equipment) fields.push("equipment");
  if (!handover.studentReminder) fields.push("studentReminder");
  if (!handover.teacherNotes) fields.push("teacherNotes");
  if (!handover.materials.some((item) => item.title && safeUrl(item.url)))
    fields.push("materials");
  return fields;
}

function cookieFor(request: Request, token: string, clear = false) {
  const parts = [
    `handover_session=${clear ? "" : token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    clear ? "Max-Age=0" : `Max-Age=${SESSION_DAYS * 86400}`,
  ];
  if (new URL(request.url).protocol === "https:") parts.push("Secure");
  return parts.join("; ");
}

function originAllowed(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

async function readBody(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY) throw new HttpError(413, "VALIDATION_ERROR");
  const text = await request.text();
  if (text.length > MAX_BODY) throw new HttpError(413, "VALIDATION_ERROR");
  if (!text) return {} as Record<string, unknown>;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new HttpError(400, "VALIDATION_ERROR");
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "VALIDATION_ERROR");
  }
}

async function schoolReady(db: D1Database) {
  const marker = await one<{ value: string }>(
    db,
    `SELECT value FROM meta WHERE key = 'seed_complete'`,
  );
  const lessons = await one<{ n: number }>(
    db,
    `SELECT COUNT(*) AS n FROM lessons`,
  );
  return marker?.value === "1" && (lessons?.n ?? 0) > 0;
}

function collectingDatabase(db: D1Database, bucket: D1PreparedStatement[]) {
  function wrap(statement: D1PreparedStatement): D1PreparedStatement {
    return new Proxy(statement, {
      get(target, key) {
        if (key === "bind") {
          return (...values: unknown[]) =>
            wrap(target.bind(...(values as never[])));
        }
        if (key === "run") {
          return async () => {
            bucket.push(target);
            return {
              success: true,
              meta: { changes: 1, duration: 0, last_row_id: 0 },
              results: [],
            };
          };
        }
        const value = Reflect.get(target, key, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    }) as D1PreparedStatement;
  }
  return new Proxy(db, {
    get(target, key) {
      if (key === "prepare") return (sql: string) => wrap(target.prepare(sql));
      const value = Reflect.get(target, key, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as D1Database;
}

async function markSchoolReady(db: D1Database) {
  try {
    await run(
      db,
      `INSERT INTO meta (key, value) VALUES ('seed_complete', '1') ON CONFLICT(key) DO UPDATE SET value = '1'`,
    );
  } catch (error) {
    if (await schoolReady(db)) return;
    throw error;
  }
}

async function seedIfEmpty(db: D1Database) {
  if (await schoolReady(db)) return;
  const lessons = await one<{ n: number }>(
    db,
    `SELECT COUNT(*) AS n FROM lessons`,
  );
  const classes = await one<{ n: number }>(
    db,
    `SELECT COUNT(*) AS n FROM classes WHERE is_demo = 1`,
  );
  if ((lessons?.n ?? 0) > 0 && (classes?.n ?? 0) >= 3) {
    await markSchoolReady(db);
    return;
  }
  const bucket: D1PreparedStatement[] = [];
  await seedSchool(collectingDatabase(db, bucket));
  bucket.push(
    db.prepare(
      `INSERT INTO meta (key, value) VALUES ('seed_complete', '1') ON CONFLICT(key) DO UPDATE SET value = '1'`,
    ),
  );
  try {
    await db.batch(bucket);
  } catch (error) {
    if (await schoolReady(db)) return;
    throw error;
  }
}

async function seedSchool(db: D1Database) {
  const created = nowIso();
  const classes = [
    ["demo-class-7a", "Class 7A"],
    ["demo-class-7b", "Class 7B"],
    ["demo-class-8a", "Class 8A"],
  ];
  for (const [classId, name] of classes) {
    await run(
      db,
      `INSERT OR IGNORE INTO classes (id, name, is_demo) VALUES (?, ?, 1)`,
      [classId, name],
    );
  }
  const teachers = [
    ["demo-teacher-0", "maya.chen@demo.handover.school", "Maya Chen", ["Math"]],
    [
      "demo-teacher-1",
      "jonah.park@demo.handover.school",
      "Jonah Park",
      ["Math"],
    ],
    [
      "demo-teacher-2",
      "elena.rossi@demo.handover.school",
      "Elena Rossi",
      ["English"],
    ],
    [
      "demo-teacher-3",
      "kenji.watanabe@demo.handover.school",
      "Kenji Watanabe",
      ["Science"],
    ],
    [
      "demo-teacher-4",
      "priya.shah@demo.handover.school",
      "Priya Shah",
      ["History"],
    ],
    [
      "demo-teacher-5",
      "lucas.meyer@demo.handover.school",
      "Lucas Meyer",
      ["Chinese"],
    ],
    [
      "demo-teacher-6",
      "sofia.alvarez@demo.handover.school",
      "Sofia Alvarez",
      ["PE"],
    ],
    [
      "demo-teacher-7",
      "noah.ibrahim@demo.handover.school",
      "Noah Ibrahim",
      ["Art"],
    ],
  ] as const;
  const unusable = `unusable.${base64url(bytes(24))}`;
  for (const [teacherId, email, name, subjects] of teachers) {
    await run(
      db,
      `INSERT OR IGNORE INTO users (id, email, name, role, class_id, subjects, password_hash, recovery_hash, is_demo, active, created_at) VALUES (?, ?, ?, 'teacher', NULL, ?, ?, NULL, 1, 1, ?)`,
      [teacherId, email, name, JSON.stringify(subjects), unusable, created],
    );
  }
  await run(
    db,
    `INSERT OR IGNORE INTO users (id, email, name, role, class_id, subjects, password_hash, recovery_hash, is_demo, active, created_at) VALUES ('demo-admin', 'admin@demo.handover.school', 'Avery Lin', 'admin', NULL, '[]', ?, NULL, 1, 1, ?)`,
    [unusable, created],
  );
  const studentNames = [
    "Mina",
    "Owen",
    "Hana",
    "Leo",
    "Asha",
    "Noah",
    "Iris",
    "Eli",
    "Vera",
    "Omar",
    "Lina",
    "Seth",
  ];
  let studentIndex = 0;
  for (const [classId] of classes) {
    for (const name of studentNames) {
      const studentId = `demo-student-${studentIndex}`;
      const email =
        studentIndex === 0
          ? "student@demo.handover.school"
          : `student${studentIndex}@demo.handover.school`;
      await run(
        db,
        `INSERT OR IGNORE INTO users (id, email, name, role, class_id, subjects, password_hash, recovery_hash, is_demo, active, created_at) VALUES (?, ?, ?, 'student', ?, '[]', ?, NULL, 1, 1, ?)`,
        [
          studentId,
          email,
          `${name} ${classId.slice(-2).toUpperCase()}`,
          classId,
          unusable,
          created,
        ],
      );
      studentIndex += 1;
    }
  }
  await insertLessons(db);
  await insertSampleRequests(db);
}

function pattern(): Array<[string, number, number, string, string, string]> {
  return [
    ["demo-class-7a", 0, 1, "Math", "demo-teacher-0", "A-201"],
    ["demo-class-7a", 0, 2, "English", "demo-teacher-2", "A-201"],
    ["demo-class-7a", 0, 3, "Science", "demo-teacher-3", "A-201"],
    ["demo-class-7a", 0, 4, "History", "demo-teacher-4", "A-201"],
    ["demo-class-7a", 1, 1, "English", "demo-teacher-2", "A-201"],
    ["demo-class-7a", 1, 2, "Math", "demo-teacher-0", "A-201"],
    ["demo-class-7a", 1, 3, "Science", "demo-teacher-3", "A-201"],
    ["demo-class-7a", 1, 4, "PE", "demo-teacher-6", "Gym"],
    ["demo-class-7a", 2, 1, "Math", "demo-teacher-0", "A-201"],
    ["demo-class-7a", 2, 2, "Chinese", "demo-teacher-5", "A-201"],
    ["demo-class-7a", 2, 3, "History", "demo-teacher-4", "A-201"],
    ["demo-class-7a", 2, 5, "Art", "demo-teacher-7", "Studio"],
    ["demo-class-7a", 3, 1, "History", "demo-teacher-4", "A-201"],
    ["demo-class-7a", 3, 2, "English", "demo-teacher-2", "A-201"],
    ["demo-class-7a", 3, 3, "Math", "demo-teacher-0", "A-201"],
    ["demo-class-7a", 3, 4, "PE", "demo-teacher-6", "Gym"],
    ["demo-class-7a", 4, 1, "Science", "demo-teacher-3", "A-201"],
    ["demo-class-7a", 4, 2, "English", "demo-teacher-2", "A-201"],
    ["demo-class-7a", 4, 3, "History", "demo-teacher-4", "A-201"],
    ["demo-class-7a", 4, 4, "Math", "demo-teacher-0", "A-201"],
    ["demo-class-7b", 0, 1, "Math", "demo-teacher-1", "B-104"],
    ["demo-class-7b", 0, 2, "Science", "demo-teacher-3", "B-104"],
    ["demo-class-7b", 0, 3, "English", "demo-teacher-2", "B-104"],
    ["demo-class-7b", 0, 4, "PE", "demo-teacher-6", "Gym"],
    ["demo-class-7b", 1, 1, "Math", "demo-teacher-1", "B-104"],
    ["demo-class-7b", 1, 2, "History", "demo-teacher-4", "B-104"],
    ["demo-class-7b", 1, 3, "English", "demo-teacher-2", "B-104"],
    ["demo-class-7b", 1, 4, "Chinese", "demo-teacher-5", "B-104"],
    ["demo-class-7b", 2, 1, "Math", "demo-teacher-1", "B-104"],
    ["demo-class-7b", 2, 2, "Science", "demo-teacher-3", "B-104"],
    ["demo-class-7b", 2, 3, "PE", "demo-teacher-6", "Gym"],
    ["demo-class-7b", 2, 4, "Art", "demo-teacher-7", "Studio"],
    ["demo-class-7b", 3, 1, "Math", "demo-teacher-1", "B-104"],
    ["demo-class-7b", 3, 2, "Science", "demo-teacher-3", "B-104"],
    ["demo-class-7b", 3, 3, "Chinese", "demo-teacher-5", "B-104"],
    ["demo-class-7b", 3, 4, "English", "demo-teacher-2", "B-104"],
    ["demo-class-7b", 4, 1, "Math", "demo-teacher-1", "B-104"],
    ["demo-class-7b", 4, 2, "PE", "demo-teacher-6", "Gym"],
    ["demo-class-7b", 4, 3, "Art", "demo-teacher-7", "Studio"],
    ["demo-class-7b", 4, 4, "History", "demo-teacher-4", "B-104"],
    ["demo-class-8a", 0, 1, "History", "demo-teacher-4", "C-310"],
    ["demo-class-8a", 0, 2, "Art", "demo-teacher-7", "Studio"],
    ["demo-class-8a", 0, 3, "Chinese", "demo-teacher-5", "C-310"],
    ["demo-class-8a", 0, 5, "English", "demo-teacher-2", "C-310"],
    ["demo-class-8a", 1, 1, "Science", "demo-teacher-3", "C-310"],
    ["demo-class-8a", 1, 2, "PE", "demo-teacher-6", "Gym"],
    ["demo-class-8a", 1, 4, "Art", "demo-teacher-7", "Studio"],
    ["demo-class-8a", 1, 5, "Math", "demo-teacher-1", "C-310"],
    ["demo-class-8a", 2, 1, "English", "demo-teacher-2", "C-310"],
    ["demo-class-8a", 2, 3, "Science", "demo-teacher-3", "C-310"],
    ["demo-class-8a", 2, 4, "Chinese", "demo-teacher-5", "C-310"],
    ["demo-class-8a", 2, 6, "History", "demo-teacher-4", "C-310"],
    ["demo-class-8a", 3, 2, "Art", "demo-teacher-7", "Studio"],
    ["demo-class-8a", 3, 4, "Science", "demo-teacher-3", "C-310"],
    ["demo-class-8a", 3, 5, "English", "demo-teacher-2", "C-310"],
    ["demo-class-8a", 3, 6, "PE", "demo-teacher-6", "Gym"],
    ["demo-class-8a", 4, 2, "Chinese", "demo-teacher-5", "C-310"],
    ["demo-class-8a", 4, 3, "PE", "demo-teacher-6", "Gym"],
    ["demo-class-8a", 4, 5, "Science", "demo-teacher-3", "C-310"],
    ["demo-class-8a", 4, 6, "Art", "demo-teacher-7", "Studio"],
  ];
}

async function insertLessons(db: D1Database) {
  const start = defaultSchoolMonday();
  for (const week of [0, 1]) {
    for (const [classId, day, period, subject, teacherId, room] of pattern()) {
      const date = addDays(start, week * 7 + day);
      const lessonId = `demo-lesson-${classId}-${date}-${period}`;
      await run(
        db,
        `INSERT OR IGNORE INTO lessons (id, class_id, subject, teacher_id, date, period, room, base_teacher_id, base_date, base_period, base_room, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          lessonId,
          classId,
          subject,
          teacherId,
          date,
          period,
          room,
          teacherId,
          date,
          period,
          room,
        ],
      );
    }
  }
}

const sampleHandover = {
  progress: "Quadratic equations, page 42",
  plan: "Solve two worked examples, then pair practice.",
  materials: [
    { title: "Practice worksheet", url: "/worksheets/class-practice.txt" },
  ],
  assessment: "Bring the worksheet. Quiz postponed to Friday.",
  equipment: "Room whiteboard and projector",
  studentReminder: "Bring a calculator and ask for help when needed.",
  teacherNotes:
    "PRIVATE_TEACHER_NOTE Offer a quiet corner to anyone who needs extra time.",
};

function plannedLesson(classId: string, day: number, period: number) {
  const row = pattern().find(
    (item) => item[0] === classId && item[1] === day && item[2] === period,
  );
  if (!row) return null;
  const date = addDays(defaultSchoolMonday(), day);
  return {
    id: `demo-lesson-${classId}-${date}-${period}`,
    class_id: classId,
    subject: row[3],
    base_teacher_id: row[4],
    base_date: date,
    base_period: period,
    base_room: row[5],
    room: row[5],
  };
}

async function insertSampleRequests(db: D1Database) {
  const start = defaultSchoolMonday();
  const stamp = nowIso();
  const samples: Array<{
    id: string;
    classId: string;
    day: number;
    period: number;
    recipient: string;
    status: Status;
    comment: string;
  }> = [
    {
      id: "demo-request-confirmed",
      classId: "demo-class-7a",
      day: 4,
      period: 4,
      recipient: "demo-teacher-1",
      status: "Confirmed",
      comment: "Ready to teach.",
    },
    {
      id: "demo-request-pending-maya",
      classId: "demo-class-8a",
      day: 2,
      period: 3,
      recipient: "demo-teacher-0",
      status: "Pending",
      comment: "",
    },
    {
      id: "demo-request-pending-jonah",
      classId: "demo-class-7b",
      day: 1,
      period: 3,
      recipient: "demo-teacher-1",
      status: "Pending",
      comment: "",
    },
    {
      id: "demo-request-declined",
      classId: "demo-class-8a",
      day: 0,
      period: 1,
      recipient: "demo-teacher-5",
      status: "Declined",
      comment: "Please add the page range.",
    },
    {
      id: "demo-request-completed",
      classId: "demo-class-7b",
      day: 0,
      period: 4,
      recipient: "demo-teacher-7",
      status: "Completed",
      comment: "Covered in class.",
    },
    {
      id: "demo-request-cancelled",
      classId: "demo-class-8a",
      day: 4,
      period: 6,
      recipient: "demo-teacher-6",
      status: "Cancelled",
      comment: "Meeting moved.",
    },
  ];
  for (const sample of samples) {
    const date = addDays(start, sample.day);
    const lesson = plannedLesson(sample.classId, sample.day, sample.period);
    if (!lesson) continue;
    const handover =
      sample.status === "Draft"
        ? { ...sampleHandover, progress: "" }
        : sampleHandover;
    await run(
      db,
      `INSERT INTO requests (id, lesson_id, class_id, subject, original_teacher_id, original_date, original_period, original_room, kind, target_date, target_period, target_room, recipient_id, reason_category, reason, handover_json, status, created_at, updated_at, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'substitute', ?, ?, ?, ?, 'leave', 'School schedule sample', ?, ?, ?, ?, 1)`,
      [
        sample.id,
        lesson.id,
        lesson.class_id,
        lesson.subject,
        lesson.base_teacher_id,
        lesson.base_date,
        lesson.base_period,
        lesson.base_room,
        date,
        sample.period,
        lesson.room,
        sample.recipient,
        JSON.stringify(handover),
        sample.status,
        stamp,
        stamp,
      ],
    );
    await run(
      db,
      `INSERT INTO timeline (id, request_id, actor_id, actor_name, action, comment, at) VALUES (?, ?, ?, 'Seed', 'created', '', ?)`,
      [id(), sample.id, lesson.base_teacher_id, stamp],
    );
    if (
      sample.status === "Pending" ||
      sample.status === "Confirmed" ||
      sample.status === "Declined" ||
      sample.status === "Completed"
    ) {
      await run(
        db,
        `INSERT INTO timeline (id, request_id, actor_id, actor_name, action, comment, at) VALUES (?, ?, ?, 'Seed', 'submitted', '', ?)`,
        [id(), sample.id, lesson.base_teacher_id, stamp],
      );
    }
    if (sample.status === "Pending") {
      await run(
        db,
        `INSERT OR IGNORE INTO slot_locks (request_id, scope, scope_id, date, period) VALUES (?, 'class', ?, ?, ?)`,
        [sample.id, lesson.class_id, date, sample.period],
      );
      await run(
        db,
        `INSERT OR IGNORE INTO slot_locks (request_id, scope, scope_id, date, period) VALUES (?, 'teacher', ?, ?, ?)`,
        [sample.id, sample.recipient, date, sample.period],
      );
      await notify(
        db,
        sample.recipient,
        sample.id,
        "pending",
        "New handover to confirm",
      );
    }
    if (sample.status === "Confirmed" || sample.status === "Completed") {
      await run(
        db,
        `UPDATE lessons SET teacher_id = ?, date = ?, period = ?, room = ? WHERE id = ?`,
        [sample.recipient, date, sample.period, lesson.room, lesson.id],
      );
      await run(
        db,
        `INSERT INTO timeline (id, request_id, actor_id, actor_name, action, comment, at) VALUES (?, ?, ?, 'Seed', ?, ?, ?)`,
        [
          id(),
          sample.id,
          sample.recipient,
          sample.status === "Confirmed" ? "confirmed" : "completed",
          sample.comment,
          stamp,
        ],
      );
      if (sample.status === "Confirmed") {
        const classIndex = [
          "demo-class-7a",
          "demo-class-7b",
          "demo-class-8a",
        ].indexOf(lesson.class_id);
        for (let student = 0; student < 12; student += 1) {
          await notify(
            db,
            `demo-student-${classIndex * 12 + student}`,
            sample.id,
            "class_change",
            "Your class timetable changed",
          );
        }
      }
    }
    if (sample.status === "Declined") {
      await run(
        db,
        `INSERT INTO timeline (id, request_id, actor_id, actor_name, action, comment, at) VALUES (?, ?, ?, 'Seed', 'declined', ?, ?)`,
        [id(), sample.id, sample.recipient, sample.comment, stamp],
      );
    }
  }
  const draftDate = addDays(start, 3);
  const draftLesson = plannedLesson("demo-class-7b", 3, 3);
  if (draftLesson) {
    await run(
      db,
      `INSERT INTO requests (id, lesson_id, class_id, subject, original_teacher_id, original_date, original_period, original_room, kind, target_date, target_period, target_room, recipient_id, reason_category, reason, handover_json, status, created_at, updated_at, is_demo) VALUES ('demo-request-draft', ?, ?, ?, ?, ?, ?, ?, 'substitute', ?, ?, ?, 'demo-teacher-2', 'training', 'Draft still missing progress', ?, 'Draft', ?, ?, 1)`,
      [
        draftLesson.id,
        draftLesson.class_id,
        draftLesson.subject,
        draftLesson.base_teacher_id,
        draftLesson.base_date,
        draftLesson.base_period,
        draftLesson.base_room,
        draftDate,
        3,
        draftLesson.room,
        JSON.stringify({ ...sampleHandover, progress: "" }),
        stamp,
        stamp,
      ],
    );
  }
}

async function notify(
  db: D1Database,
  userId: string,
  requestId: string,
  event: string,
  title: string,
) {
  await run(
    db,
    `INSERT INTO notifications (id, user_id, request_id, event, title, created_at, read) VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [id(), userId, requestId, event, title, nowIso()],
  );
}

async function audit(
  db: D1Database,
  actor: UserRow,
  action: string,
  entityId: string,
  detail: string,
) {
  await run(
    db,
    `INSERT INTO audit_log (id, actor_name, action, entity_id, at, detail, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id(),
      actor.name,
      action,
      entityId,
      nowIso(),
      detail.slice(0, 300),
      actor.is_demo,
    ],
  );
}

async function sessionUser(db: D1Database, request: Request) {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(/(?:^|;\s*)handover_session=([^;]+)/);
  if (!match) return null;
  const tokenHash = await hex(decodeURIComponent(match[1]));
  const session = await one<{ user_id: string; expires_at: string }>(
    db,
    `SELECT user_id, expires_at FROM sessions WHERE token_hash = ?`,
    [tokenHash],
  );
  if (!session || session.expires_at < nowIso()) return null;
  const user = await one<UserRow>(db, `SELECT * FROM users WHERE id = ?`, [
    session.user_id,
  ]);
  if (!user || user.active !== 1) return null;
  return user;
}

async function createSession(db: D1Database, request: Request, userId: string) {
  const token = base64url(bytes(32));
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  await run(
    db,
    `INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`,
    [await hex(token), userId, expires, nowIso()],
  );
  return cookieFor(request, token);
}

async function throttle(db: D1Database, bucket: string) {
  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  await run(db, `DELETE FROM auth_attempts WHERE at < ?`, [since]);
  const count = await one<{ n: number }>(
    db,
    `SELECT COUNT(*) AS n FROM auth_attempts WHERE bucket = ? AND at >= ?`,
    [bucket, since],
  );
  if ((count?.n ?? 0) >= 20) throw new HttpError(429, "RATE_LIMITED");
  await run(db, `INSERT INTO auth_attempts (bucket, at) VALUES (?, ?)`, [
    bucket,
    nowIso(),
  ]);
}

async function issueDemo(
  db: D1Database,
  request: Request,
  role: string,
  teacherIndex: number,
) {
  let email = "student@demo.handover.school";
  if (role === "teacher")
    email =
      teacherIndex === 1
        ? "jonah.park@demo.handover.school"
        : "maya.chen@demo.handover.school";
  if (role === "admin") email = "admin@demo.handover.school";
  const user = await one<UserRow>(
    db,
    `SELECT * FROM users WHERE email = ? AND is_demo = 1`,
    [email],
  );
  if (!user || user.active !== 1) throw new HttpError(404, "NOT_FOUND");
  const cookie = await createSession(db, request, user.id);
  return json({ user: asUser(user) }, 200, cookie);
}

function parseInput(
  body: Record<string, unknown>,
  partial = false,
): RequestInput {
  const handover = parseHandover(body.handover, false);
  const period = Number(body.targetPeriod);
  const input: RequestInput = {
    lessonId: clampText(body.lessonId, 80),
    kind:
      body.kind === "move"
        ? "move"
        : body.kind === "substitute"
          ? "substitute"
          : ("" as Kind),
    targetDate: clampText(body.targetDate, 10),
    targetPeriod: period,
    targetRoom: clampText(body.targetRoom, 40),
    recipientId: clampText(body.recipientId, 80),
    reasonCategory: clampText(body.reasonCategory, 40),
    reason: clampText(body.reason, 500),
    handover,
  };
  if (!partial) {
    if (
      !input.lessonId ||
      (input.kind !== "move" && input.kind !== "substitute")
    )
      throw new HttpError(422, "VALIDATION_ERROR");
    if (
      !isSchoolDate(input.targetDate) ||
      !Number.isInteger(period) ||
      period < 1 ||
      period > PERIOD_COUNT
    )
      throw new HttpError(422, "VALIDATION_ERROR");
    if (
      !input.targetRoom ||
      !REASONS.has(input.reasonCategory) ||
      !input.reason
    )
      throw new HttpError(422, "VALIDATION_ERROR");
  }
  return input;
}

async function lessonById(db: D1Database, lessonId: string) {
  const lesson = await one<LessonRow>(
    db,
    `SELECT * FROM lessons WHERE id = ?`,
    [lessonId],
  );
  if (!lesson) throw new HttpError(404, "NOT_FOUND");
  return lesson;
}

async function requestById(db: D1Database, requestId: string) {
  const row = await one<RequestRow>(db, `SELECT * FROM requests WHERE id = ?`, [
    requestId,
  ]);
  if (!row) throw new HttpError(404, "NOT_FOUND");
  return row;
}

function canSeeRequest(user: UserRow, row: RequestRow) {
  if (user.role === "admin") return true;
  if (user.role === "teacher")
    return row.original_teacher_id === user.id || row.recipient_id === user.id;
  return (
    user.role === "student" &&
    user.class_id === row.class_id &&
    (row.status === "Confirmed" || row.status === "Completed")
  );
}

async function names(db: D1Database) {
  const users = await all<UserRow>(db, `SELECT * FROM users`);
  const classes = await all<{ id: string; name: string }>(
    db,
    `SELECT id, name FROM classes`,
  );
  return {
    user: new Map(users.map((user) => [user.id, user])),
    className: new Map(classes.map((item) => [item.id, item.name])),
  };
}

async function presentRequest(
  db: D1Database,
  row: RequestRow,
  viewer: UserRow,
): Promise<ChangeRequest> {
  const lookup = await names(db);
  const timeline = await all<{
    id: string;
    actor_name: string;
    action: string;
    at: string;
    comment: string;
  }>(
    db,
    `SELECT id, actor_name, action, at, comment FROM timeline WHERE request_id = ? ORDER BY at`,
    [row.id],
  );
  const supplements = await all<{
    id: string;
    author_name: string;
    text: string;
    at: string;
  }>(
    db,
    `SELECT id, author_name, text, at FROM supplements WHERE request_id = ? ORDER BY at`,
    [row.id],
  );
  const todos = await all<{ key: string; done: number }>(
    db,
    `SELECT key, done FROM todos WHERE request_id = ? AND user_id = ?`,
    [row.id, viewer.id],
  );
  const viewed = await one<{ n: number }>(
    db,
    `SELECT COUNT(*) AS n FROM views WHERE request_id = ?`,
    [row.id],
  );
  const prepared = await one<{ n: number }>(
    db,
    `SELECT COUNT(*) AS n FROM (SELECT user_id FROM todos WHERE request_id = ? AND done = 1 GROUP BY user_id HAVING COUNT(*) >= 3)`,
    [row.id],
  );
  const students = await one<{ n: number }>(
    db,
    `SELECT COUNT(*) AS n FROM users WHERE role = 'student' AND class_id = ?`,
    [row.class_id],
  );
  const handover = JSON.parse(row.handover_json) as Handover;
  if (viewer.role === "student") delete handover.teacherNotes;
  const studentView = viewer.role === "student";
  return {
    id: row.id,
    lessonId: row.lesson_id,
    classId: row.class_id,
    className: lookup.className.get(row.class_id) ?? row.class_id,
    subject: row.subject,
    originalTeacherId: row.original_teacher_id,
    originalTeacherName: lookup.user.get(row.original_teacher_id)?.name ?? "",
    originalDate: row.original_date,
    originalPeriod: row.original_period,
    originalRoom: row.original_room,
    kind: row.kind,
    targetDate: row.target_date,
    targetPeriod: row.target_period,
    targetRoom: row.target_room,
    recipientId: row.recipient_id,
    recipientName: lookup.user.get(row.recipient_id)?.name ?? "",
    reasonCategory: studentView ? "" : row.reason_category,
    reason: studentView ? "" : row.reason,
    handover,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    timeline: timeline.map(
      (item) =>
        ({
          id: item.id,
          actorName: item.actor_name,
          action: item.action,
          at: item.at,
          comment: studentView ? "" : item.comment,
        }) satisfies TimelineEvent,
    ),
    supplements: studentView
      ? []
      : supplements.map(
          (item) =>
            ({
              id: item.id,
              authorName: item.author_name,
              text: item.text,
              at: item.at,
            }) satisfies Supplement,
        ),
    todo: Object.fromEntries(todos.map((item) => [item.key, item.done === 1])),
    viewedCount: viewed?.n ?? 0,
    preparedCount: prepared?.n ?? 0,
    studentCount: students?.n ?? 0,
  };
}

type Slot = {
  lessonId: string;
  requestId: string;
  classId: string;
  teacherId: string;
  date: string;
  period: number;
  subject: string;
};

async function occupancy(db: D1Database): Promise<Slot[]> {
  const lessons = await all<LessonRow>(db, `SELECT * FROM lessons`);
  const pending = await all<RequestRow>(
    db,
    `SELECT * FROM requests WHERE status = 'Pending'`,
  );
  const slots: Slot[] = lessons.map((lesson) => ({
    lessonId: lesson.id,
    requestId: "",
    classId: lesson.class_id,
    teacherId: lesson.teacher_id,
    date: lesson.date,
    period: lesson.period,
    subject: lesson.subject,
  }));
  for (const request of pending) {
    slots.push({
      lessonId: request.lesson_id,
      requestId: request.id,
      classId: request.class_id,
      teacherId: request.recipient_id,
      date: request.target_date,
      period: request.target_period,
      subject: request.subject,
    });
  }
  return slots;
}

async function conflictReport(
  db: D1Database,
  input: RequestInput,
  ignoreRequestId = "",
): Promise<ConflictResult> {
  const lesson = await lessonById(db, input.lessonId);
  const slots = await occupancy(db);
  const lookup = await names(db);
  const ignore = (slot: Slot) =>
    slot.lessonId === lesson.id ||
    (ignoreRequestId && slot.requestId === ignoreRequestId);
  const conflicts: ConflictResult["conflicts"] = [];
  const classHit = slots.find(
    (slot) =>
      !ignore(slot) &&
      slot.classId === lesson.class_id &&
      slot.date === input.targetDate &&
      slot.period === input.targetPeriod,
  );
  if (classHit) {
    conflicts.push({
      kind: "class",
      subject: classHit.subject,
      date: classHit.date,
      period: classHit.period,
      name: lookup.className.get(lesson.class_id) ?? lesson.class_id,
    });
  }
  const teacherHit = slots.find(
    (slot) =>
      !ignore(slot) &&
      slot.teacherId === input.recipientId &&
      slot.date === input.targetDate &&
      slot.period === input.targetPeriod,
  );
  if (teacherHit) {
    conflicts.push({
      kind: "teacher",
      subject: teacherHit.subject,
      date: teacherHit.date,
      period: teacherHit.period,
      name: lookup.user.get(input.recipientId)?.name ?? "",
    });
  }
  const availableSlots: { date: string; period: number }[] = [];
  const monday = mondayOnOrBefore(input.targetDate || lesson.date);
  for (let day = 0; day < 10; day += 1) {
    const date = addDays(monday, day);
    if (new Date(`${date}T12:00:00Z`).getUTCDay() % 6 === 0) continue;
    for (let period = 1; period <= PERIOD_COUNT; period += 1) {
      const blocked = slots.some(
        (slot) =>
          !ignore(slot) &&
          slot.date === date &&
          slot.period === period &&
          (slot.classId === lesson.class_id ||
            slot.teacherId === input.recipientId),
      );
      if (!blocked) availableSlots.push({ date, period });
      if (availableSlots.length >= 6) break;
    }
    if (availableSlots.length >= 6) break;
  }
  const teachers = [...lookup.user.values()].filter(
    (user) => user.role === "teacher" && user.active === 1,
  );
  const candidates: Teacher[] = [];
  for (const teacher of teachers) {
    if (teacher.id === lesson.base_teacher_id) continue;
    const subjects = JSON.parse(teacher.subjects) as string[];
    if (!subjects.includes(lesson.subject)) continue;
    const busy = slots.some(
      (slot) =>
        !ignore(slot) &&
        slot.teacherId === teacher.id &&
        slot.date === input.targetDate &&
        slot.period === input.targetPeriod,
    );
    if (!busy)
      candidates.push({ id: teacher.id, name: teacher.name, subjects });
    if (candidates.length >= 6) break;
  }
  return { conflicts, availableSlots, candidates };
}

async function saveRequest(
  db: D1Database,
  actor: UserRow,
  input: RequestInput,
  existing?: RequestRow,
) {
  const lesson = await lessonById(db, input.lessonId);
  if (
    actor.role !== "admin" &&
    lesson.teacher_id !== actor.id &&
    lesson.base_teacher_id !== actor.id
  )
    throw new HttpError(403, "FORBIDDEN");
  if (input.kind === "move" && input.recipientId !== lesson.base_teacher_id)
    throw new HttpError(422, "VALIDATION_ERROR", ["recipientId"]);
  if (
    input.kind === "substitute" &&
    input.recipientId === lesson.base_teacher_id
  )
    throw new HttpError(422, "VALIDATION_ERROR", ["recipientId"]);
  const recipient = await one<UserRow>(
    db,
    `SELECT * FROM users WHERE id = ? AND role = 'teacher' AND active = 1`,
    [input.recipientId],
  );
  if (!recipient) throw new HttpError(422, "VALIDATION_ERROR", ["recipientId"]);
  const open = await one<{ id: string }>(
    db,
    `SELECT id FROM requests WHERE lesson_id = ? AND status IN ('Draft', 'Pending', 'Confirmed', 'Declined') AND id != ?`,
    [lesson.id, existing?.id ?? ""],
  );
  if (open) throw new HttpError(409, "INVALID_STATE");
  const stamp = nowIso();
  if (!existing) {
    const requestId = id();
    await run(
      db,
      `INSERT INTO requests (id, lesson_id, class_id, subject, original_teacher_id, original_date, original_period, original_room, kind, target_date, target_period, target_room, recipient_id, reason_category, reason, handover_json, status, created_at, updated_at, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?, ?)`,
      [
        requestId,
        lesson.id,
        lesson.class_id,
        lesson.subject,
        lesson.teacher_id,
        lesson.date,
        lesson.period,
        lesson.room,
        input.kind,
        input.targetDate,
        input.targetPeriod,
        input.targetRoom,
        input.recipientId,
        input.reasonCategory,
        input.reason,
        JSON.stringify(input.handover),
        stamp,
        stamp,
        actor.is_demo,
      ],
    );
    await run(
      db,
      `INSERT INTO timeline (id, request_id, actor_id, actor_name, action, comment, at) VALUES (?, ?, ?, ?, 'created', '', ?)`,
      [id(), requestId, actor.id, actor.name, stamp],
    );
    await audit(db, actor, "request.created", requestId, lesson.subject);
    return requestById(db, requestId);
  }
  if (existing.original_teacher_id !== actor.id && actor.role !== "admin")
    throw new HttpError(403, "FORBIDDEN");
  if (
    !OPEN.has(existing.status) ||
    existing.status === "Pending" ||
    existing.status === "Confirmed"
  )
    throw new HttpError(409, "INVALID_STATE");
  const saved = await run(
    db,
    `UPDATE requests SET lesson_id = ?, class_id = ?, subject = ?, original_teacher_id = ?, original_date = ?, original_period = ?, original_room = ?, kind = ?, target_date = ?, target_period = ?, target_room = ?, recipient_id = ?, reason_category = ?, reason = ?, handover_json = ?, updated_at = ? WHERE id = ? AND status IN ('Draft', 'Declined')`,
    [
      lesson.id,
      lesson.class_id,
      lesson.subject,
      lesson.teacher_id,
      lesson.date,
      lesson.period,
      lesson.room,
      input.kind,
      input.targetDate,
      input.targetPeriod,
      input.targetRoom,
      input.recipientId,
      input.reasonCategory,
      input.reason,
      JSON.stringify(input.handover),
      stamp,
      existing.id,
    ],
  );
  if ((saved.meta?.changes ?? 0) !== 1)
    throw new HttpError(409, "INVALID_STATE");
  await audit(db, actor, "request.updated", existing.id, lesson.subject);
  return requestById(db, existing.id);
}

async function submitRequest(db: D1Database, actor: UserRow, row: RequestRow) {
  if (row.original_teacher_id !== actor.id)
    throw new HttpError(403, "FORBIDDEN");
  if (row.status !== "Draft" && row.status !== "Declined")
    throw new HttpError(409, "INVALID_STATE");
  const handover = JSON.parse(row.handover_json) as Handover;
  const fields = missingHandover(handover);
  if (fields.length) throw new HttpError(422, "INCOMPLETE_HANDOVER", fields);
  const input: RequestInput = {
    lessonId: row.lesson_id,
    kind: row.kind,
    targetDate: row.target_date,
    targetPeriod: row.target_period,
    targetRoom: row.target_room,
    recipientId: row.recipient_id,
    reasonCategory: row.reason_category,
    reason: row.reason,
    handover,
  };
  const report = await conflictReport(db, input, row.id);
  if (report.conflicts.length) throw new HttpError(409, "SCHEDULE_CONFLICT");
  const stamp = nowIso();
  const token = crypto.randomUUID();
  try {
    const results = await db.batch([
      db
        .prepare(
          `UPDATE requests SET status = 'Pending', transition_token = ?, updated_at = ?
           WHERE id = ? AND status IN ('Draft', 'Declined')
             AND length(trim(json_extract(handover_json, '$.progress'))) > 0
             AND length(trim(json_extract(handover_json, '$.plan'))) > 0
             AND length(trim(json_extract(handover_json, '$.assessment'))) > 0
             AND length(trim(json_extract(handover_json, '$.equipment'))) > 0
             AND length(trim(json_extract(handover_json, '$.studentReminder'))) > 0
             AND length(trim(json_extract(handover_json, '$.teacherNotes'))) > 0
             AND EXISTS (
               SELECT 1 FROM json_each(json_extract(handover_json, '$.materials'))
               WHERE length(trim(json_extract(value, '$.title'))) > 0
                 AND (
                   json_extract(value, '$.url') LIKE 'https://%'
                   OR json_extract(value, '$.url') LIKE 'http://%'
                   OR (
                     json_extract(value, '$.url') LIKE '/%'
                     AND json_extract(value, '$.url') NOT LIKE '//%'
                     AND instr(json_extract(value, '$.url'), '..') = 0
                   )
                 )
             )
             AND NOT EXISTS (
               SELECT 1 FROM lessons AS other
               WHERE other.id <> requests.lesson_id
                 AND other.class_id = requests.class_id
                 AND other.date = requests.target_date
                 AND other.period = requests.target_period
             )
             AND NOT EXISTS (
               SELECT 1 FROM lessons AS other
               WHERE other.id <> requests.lesson_id
                 AND other.teacher_id = requests.recipient_id
                 AND other.date = requests.target_date
                 AND other.period = requests.target_period
             )`,
        )
        .bind(token, stamp, row.id),
      db
        .prepare(
          `INSERT INTO slot_locks (request_id, scope, scope_id, date, period)
           SELECT id, 'class', class_id, target_date, target_period FROM requests WHERE id = ? AND transition_token = ?`,
        )
        .bind(row.id, token),
      db
        .prepare(
          `INSERT INTO slot_locks (request_id, scope, scope_id, date, period)
           SELECT id, 'teacher', recipient_id, target_date, target_period FROM requests WHERE id = ? AND transition_token = ?`,
        )
        .bind(row.id, token),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1) {
      const current = await requestById(db, row.id);
      if (current.status === "Draft" || current.status === "Declined") {
        const fields = missingHandover(
          JSON.parse(current.handover_json) as Handover,
        );
        if (fields.length)
          throw new HttpError(422, "INCOMPLETE_HANDOVER", fields);
        throw new HttpError(409, "SCHEDULE_CONFLICT");
      }
      throw new HttpError(409, "INVALID_STATE");
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(409, "SCHEDULE_CONFLICT");
  }
  await run(
    db,
    `INSERT INTO timeline (id, request_id, actor_id, actor_name, action, comment, at) VALUES (?, ?, ?, ?, 'submitted', '', ?)`,
    [id(), row.id, actor.id, actor.name, stamp],
  );
  await notify(
    db,
    row.recipient_id,
    row.id,
    "pending",
    "New handover to confirm",
  );
  await audit(db, actor, "request.submitted", row.id, row.subject);
  return requestById(db, row.id);
}

async function respond(
  db: D1Database,
  actor: UserRow,
  row: RequestRow,
  decision: string,
  comment: string,
) {
  if (row.recipient_id !== actor.id) throw new HttpError(403, "FORBIDDEN");
  if (row.status !== "Pending") throw new HttpError(409, "INVALID_STATE");
  if (decision === "decline" && !comment.trim())
    throw new HttpError(422, "VALIDATION_ERROR", ["comment"]);
  if (decision !== "accept" && decision !== "decline")
    throw new HttpError(422, "VALIDATION_ERROR");
  const stamp = nowIso();
  const token = crypto.randomUUID();
  if (decision === "decline") {
    const results = await db.batch([
      db
        .prepare(
          `UPDATE requests SET status = 'Declined', transition_token = ?, updated_at = ? WHERE id = ? AND status = 'Pending'`,
        )
        .bind(token, stamp, row.id),
      db
        .prepare(
          `DELETE FROM slot_locks WHERE request_id = ? AND EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(row.id, row.id, token),
      db
        .prepare(
          `INSERT INTO timeline (id, request_id, actor_id, actor_name, action, comment, at)
           SELECT ?, ?, ?, ?, 'declined', ?, ? WHERE EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(
          id(),
          row.id,
          actor.id,
          actor.name,
          comment.slice(0, 500),
          stamp,
          row.id,
          token,
        ),
      db
        .prepare(
          `INSERT INTO notifications (id, user_id, request_id, event, title, created_at, read)
           SELECT ?, ?, ?, 'declined', 'Handover returned', ?, 0 WHERE EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(id(), row.original_teacher_id, row.id, stamp, row.id, token),
      db
        .prepare(
          `INSERT INTO audit_log (id, actor_name, action, entity_id, at, detail, is_demo)
           SELECT ?, ?, 'request.declined', ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(
          id(),
          actor.name,
          row.id,
          stamp,
          comment.slice(0, 120),
          actor.is_demo,
          row.id,
          token,
        ),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1)
      throw new HttpError(409, "INVALID_STATE");
    return requestById(db, row.id);
  }
  try {
    const results = await db.batch([
      db
        .prepare(
          `UPDATE lessons SET teacher_id = ?, date = ?, period = ?, room = ?
           WHERE id = ?
             AND EXISTS (SELECT 1 FROM requests WHERE id = ? AND status = 'Pending')
             AND NOT EXISTS (
               SELECT 1 FROM lessons AS other
               WHERE other.id <> lessons.id AND other.class_id = lessons.class_id AND other.date = ? AND other.period = ?
             )
             AND NOT EXISTS (
               SELECT 1 FROM lessons AS other
               WHERE other.id <> lessons.id AND other.teacher_id = ? AND other.date = ? AND other.period = ?
             )
             AND NOT EXISTS (
               SELECT 1 FROM requests AS pending
               WHERE pending.id <> ? AND pending.status = 'Pending' AND pending.target_date = ? AND pending.target_period = ?
                 AND (pending.recipient_id = ? OR pending.class_id = lessons.class_id)
             )`,
        )
        .bind(
          row.recipient_id,
          row.target_date,
          row.target_period,
          row.target_room,
          row.lesson_id,
          row.id,
          row.target_date,
          row.target_period,
          row.recipient_id,
          row.target_date,
          row.target_period,
          row.id,
          row.target_date,
          row.target_period,
          row.recipient_id,
        ),
      db
        .prepare(
          `UPDATE requests SET status = 'Confirmed', transition_token = ?, updated_at = ?
           WHERE id = ? AND status = 'Pending'
             AND EXISTS (
               SELECT 1 FROM lessons WHERE id = ? AND teacher_id = ? AND date = ? AND period = ? AND room = ?
             )`,
        )
        .bind(
          token,
          stamp,
          row.id,
          row.lesson_id,
          row.recipient_id,
          row.target_date,
          row.target_period,
          row.target_room,
        ),
      db
        .prepare(
          `DELETE FROM slot_locks WHERE request_id = ? AND EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(row.id, row.id, token),
      db
        .prepare(
          `INSERT INTO timeline (id, request_id, actor_id, actor_name, action, comment, at)
           SELECT ?, ?, ?, ?, 'confirmed', ?, ? WHERE EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(
          id(),
          row.id,
          actor.id,
          actor.name,
          comment.slice(0, 500),
          stamp,
          row.id,
          token,
        ),
      db
        .prepare(
          `INSERT INTO notifications (id, user_id, request_id, event, title, created_at, read)
           SELECT ?, ?, ?, 'accepted', 'Handover accepted', ?, 0 WHERE EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(id(), row.original_teacher_id, row.id, stamp, row.id, token),
      db
        .prepare(
          `INSERT INTO notifications (id, user_id, request_id, event, title, created_at, read)
           SELECT lower(hex(randomblob(16))), users.id, ?, 'class_change', 'Your class timetable changed', ?, 0
           FROM users
           WHERE users.role = 'student' AND users.class_id = ? AND users.active = 1
             AND EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(row.id, stamp, row.class_id, row.id, token),
      db
        .prepare(
          `INSERT INTO audit_log (id, actor_name, action, entity_id, at, detail, is_demo)
           SELECT ?, ?, 'request.confirmed', ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(
          id(),
          actor.name,
          row.id,
          stamp,
          row.subject.slice(0, 300),
          actor.is_demo,
          row.id,
          token,
        ),
    ]);
    if ((results[1]?.meta?.changes ?? 0) !== 1) {
      const current = await requestById(db, row.id);
      throw new HttpError(
        409,
        current.status === "Pending" ? "SCHEDULE_CONFLICT" : "INVALID_STATE",
      );
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(409, "SCHEDULE_CONFLICT");
  }
  return requestById(db, row.id);
}

async function setStatus(
  db: D1Database,
  actor: UserRow,
  row: RequestRow,
  status: string,
  comment: string,
) {
  if (status !== "Completed" && status !== "Cancelled")
    throw new HttpError(422, "VALIDATION_ERROR");
  const stamp = nowIso();
  const token = crypto.randomUUID();
  if (status === "Completed") {
    if (actor.id !== row.original_teacher_id && actor.id !== row.recipient_id)
      throw new HttpError(403, "FORBIDDEN");
    const results = await db.batch([
      db
        .prepare(
          `UPDATE requests SET status = 'Completed', transition_token = ?, updated_at = ? WHERE id = ? AND status = 'Confirmed'`,
        )
        .bind(token, stamp, row.id),
      db
        .prepare(
          `INSERT INTO timeline (id, request_id, actor_id, actor_name, action, comment, at)
           SELECT ?, ?, ?, ?, 'completed', ?, ? WHERE EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(
          id(),
          row.id,
          actor.id,
          actor.name,
          comment.slice(0, 500),
          stamp,
          row.id,
          token,
        ),
      db
        .prepare(
          `INSERT INTO audit_log (id, actor_name, action, entity_id, at, detail, is_demo)
           SELECT ?, ?, 'request.completed', ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(
          id(),
          actor.name,
          row.id,
          stamp,
          row.subject.slice(0, 300),
          actor.is_demo,
          row.id,
          token,
        ),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1)
      throw new HttpError(409, "INVALID_STATE");
    return requestById(db, row.id);
  }
  if (actor.role !== "admin" && actor.id !== row.original_teacher_id)
    throw new HttpError(403, "FORBIDDEN");
  if (!["Draft", "Pending", "Confirmed", "Declined"].includes(row.status))
    throw new HttpError(409, "INVALID_STATE");
  try {
    const results = await db.batch([
      db
        .prepare(
          `UPDATE lessons SET teacher_id = ?, date = ?, period = ?, room = ?
           WHERE id = ?
             AND EXISTS (SELECT 1 FROM requests WHERE id = ? AND status = 'Confirmed')
             AND NOT EXISTS (
               SELECT 1 FROM lessons AS other
               WHERE other.id <> lessons.id AND other.class_id = lessons.class_id AND other.date = ? AND other.period = ?
             )
             AND NOT EXISTS (
               SELECT 1 FROM lessons AS other
               WHERE other.id <> lessons.id AND other.teacher_id = ? AND other.date = ? AND other.period = ?
             )
             AND NOT EXISTS (
               SELECT 1 FROM requests AS pending
               WHERE pending.id <> ? AND pending.status = 'Pending' AND pending.target_date = ? AND pending.target_period = ?
                 AND (pending.class_id = lessons.class_id OR pending.recipient_id = ?)
             )
             AND NOT EXISTS (
               SELECT 1 FROM slot_locks
               WHERE slot_locks.request_id <> ? AND slot_locks.date = ? AND slot_locks.period = ?
                 AND (
                   (slot_locks.scope = 'class' AND slot_locks.scope_id = lessons.class_id)
                   OR (slot_locks.scope = 'teacher' AND slot_locks.scope_id = ?)
                 )
             )`,
        )
        .bind(
          row.original_teacher_id,
          row.original_date,
          row.original_period,
          row.original_room,
          row.lesson_id,
          row.id,
          row.original_date,
          row.original_period,
          row.original_teacher_id,
          row.original_date,
          row.original_period,
          row.id,
          row.original_date,
          row.original_period,
          row.original_teacher_id,
          row.id,
          row.original_date,
          row.original_period,
          row.original_teacher_id,
        ),
      db
        .prepare(
          `UPDATE requests SET status = 'Cancelled', transition_token = ?, updated_at = ?
           WHERE id = ? AND (
             status IN ('Draft', 'Pending', 'Declined')
             OR (
               status = 'Confirmed'
               AND EXISTS (
                 SELECT 1 FROM lessons
                 WHERE id = ? AND teacher_id = ? AND date = ? AND period = ? AND room = ?
               )
             )
           )`,
        )
        .bind(
          token,
          stamp,
          row.id,
          row.lesson_id,
          row.original_teacher_id,
          row.original_date,
          row.original_period,
          row.original_room,
        ),
      db
        .prepare(
          `DELETE FROM slot_locks WHERE request_id = ? AND EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(row.id, row.id, token),
      db
        .prepare(
          `INSERT INTO timeline (id, request_id, actor_id, actor_name, action, comment, at)
           SELECT ?, ?, ?, ?, 'cancelled', ?, ? WHERE EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(
          id(),
          row.id,
          actor.id,
          actor.name,
          comment.slice(0, 500),
          stamp,
          row.id,
          token,
        ),
      db
        .prepare(
          `INSERT INTO audit_log (id, actor_name, action, entity_id, at, detail, is_demo)
           SELECT ?, ?, 'request.cancelled', ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM requests WHERE id = ? AND transition_token = ?)`,
        )
        .bind(
          id(),
          actor.name,
          row.id,
          stamp,
          row.subject.slice(0, 300),
          actor.is_demo,
          row.id,
          token,
        ),
    ]);
    if ((results[1]?.meta?.changes ?? 0) !== 1) {
      const current = await requestById(db, row.id);
      throw new HttpError(
        409,
        current.status === "Confirmed" ? "SCHEDULE_CONFLICT" : "INVALID_STATE",
      );
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(409, "SCHEDULE_CONFLICT");
  }
  return requestById(db, row.id);
}

async function reminders(db: D1Database, user: UserRow) {
  const tomorrow = addDays(schoolToday(), 1);
  const rows = await all<RequestRow>(
    db,
    `SELECT * FROM requests WHERE status = 'Confirmed' AND target_date = ?`,
    [tomorrow],
  );
  for (const row of rows) {
    const involved =
      (user.role === "student" && user.class_id === row.class_id) ||
      user.id === row.original_teacher_id ||
      user.id === row.recipient_id ||
      user.role === "admin";
    if (!involved) continue;
    const existing = await one<{ id: string }>(
      db,
      `SELECT id FROM notifications WHERE user_id = ? AND request_id = ? AND event = 'reminder'`,
      [user.id, row.id],
    );
    if (!existing) await notify(db, user.id, row.id, "reminder", "reminder");
  }
}

async function workspace(
  db: D1Database,
  user: UserRow,
  weekValue: string,
  classFilter: string,
  teacherFilter: string,
  remindersOn = true,
): Promise<Workspace> {
  if (remindersOn) await reminders(db, user);
  const monday = isSchoolDate(weekValue)
    ? mondayOnOrBefore(weekValue)
    : defaultSchoolMonday();
  const friday = addDays(monday, 4);
  const binds: unknown[] = [monday, friday];
  let lessonSql = `SELECT * FROM lessons WHERE date >= ? AND date <= ?`;
  if (user.role === "student") {
    lessonSql += ` AND class_id = ?`;
    binds.push(user.class_id);
  } else if (user.role === "teacher") {
    lessonSql += ` AND (teacher_id = ? OR base_teacher_id = ?)`;
    binds.push(user.id, user.id);
  } else {
    if (classFilter) {
      lessonSql += ` AND class_id = ?`;
      binds.push(classFilter);
    }
    if (teacherFilter) {
      lessonSql += ` AND (teacher_id = ? OR base_teacher_id = ?)`;
      binds.push(teacherFilter, teacherFilter);
    }
  }
  lessonSql += ` ORDER BY date, period LIMIT 300`;
  const lessons = await all<LessonRow>(db, lessonSql, binds);
  const lookup = await names(db);
  const requestSql =
    user.role === "student"
      ? `SELECT * FROM requests WHERE class_id = ? AND status IN ('Confirmed', 'Completed') AND (original_date BETWEEN ? AND ? OR target_date BETWEEN ? AND ?) ORDER BY updated_at DESC LIMIT 80`
      : user.role === "teacher"
        ? `SELECT * FROM requests WHERE (original_teacher_id = ? OR recipient_id = ?) AND (status IN ('Draft', 'Pending', 'Declined') OR original_date BETWEEN ? AND ? OR target_date BETWEEN ? AND ?) ORDER BY updated_at DESC LIMIT 80`
        : `SELECT * FROM requests WHERE original_date BETWEEN ? AND ? OR target_date BETWEEN ? AND ? OR status IN ('Pending', 'Declined') ORDER BY updated_at DESC LIMIT 100`;
  const requestBinds =
    user.role === "student"
      ? [user.class_id, monday, friday, monday, friday]
      : user.role === "teacher"
        ? [user.id, user.id, monday, friday, monday, friday]
        : [monday, friday, monday, friday];
  const requestRows = await all<RequestRow>(db, requestSql, requestBinds);
  const requests = [];
  for (const row of requestRows)
    requests.push(await presentRequest(db, row, user));
  const byLesson = new Map(requestRows.map((row) => [row.lesson_id, row]));
  const presentedLessons: Lesson[] = lessons.map((lesson) => {
    const related = byLesson.get(lesson.id);
    const changed =
      lesson.teacher_id !== lesson.base_teacher_id ||
      lesson.date !== lesson.base_date ||
      lesson.period !== lesson.base_period ||
      lesson.room !== lesson.base_room;
    return {
      id: lesson.id,
      classId: lesson.class_id,
      className: lookup.className.get(lesson.class_id) ?? lesson.class_id,
      subject: lesson.subject,
      teacherId: lesson.teacher_id,
      teacherName: lookup.user.get(lesson.teacher_id)?.name ?? "",
      date: lesson.date,
      period: lesson.period,
      room: lesson.room,
      ...(related ? { requestId: related.id } : {}),
      ...(changed
        ? {
            changed: true,
            originalDate: lesson.base_date,
            originalPeriod: lesson.base_period,
          }
        : {}),
    };
  });
  const noteRows = await all<{
    id: string;
    request_id: string;
    event: string;
    title: string;
    created_at: string;
    read: number;
  }>(
    db,
    `SELECT id, request_id, event, title, created_at, read FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
    [user.id],
  );
  const notifications: Notification[] = noteRows.map((item) => ({
    id: item.id,
    requestId: item.request_id,
    event: item.event,
    title: item.title,
    createdAt: item.created_at,
    read: item.read === 1,
  }));
  const scoped = user.role === "student" ? requests : requests;
  const stats: Stats = {
    weekly: scoped.filter(
      (item) =>
        item.status !== "Cancelled" &&
        ((item.originalDate >= monday && item.originalDate <= friday) ||
          (item.targetDate >= monday && item.targetDate <= friday)),
    ).length,
    pending: scoped.filter((item) => item.status === "Pending").length,
    declined: scoped.filter((item) => item.status === "Declined").length,
    confirmed: scoped.filter(
      (item) => item.status === "Confirmed" || item.status === "Completed",
    ).length,
  };
  const risks: Risk[] = [];
  if (user.role !== "student") {
    for (const item of scoped) {
      if (item.status === "Pending")
        risks.push({
          id: `risk-${item.id}`,
          requestId: item.id,
          kind: "unconfirmed",
          message: "unconfirmed",
        });
      if (item.status === "Declined")
        risks.push({
          id: `risk-d-${item.id}`,
          requestId: item.id,
          kind: "declined",
          message: "returned",
        });
    }
  }
  const classRows = await all<{ id: string; name: string }>(
    db,
    user.role === "student"
      ? `SELECT id, name FROM classes WHERE id = ?`
      : `SELECT id, name FROM classes ORDER BY name`,
    user.role === "student" ? [user.class_id] : [],
  );
  const teacherRows = [...lookup.user.values()].filter(
    (item) =>
      item.role === "teacher" &&
      (user.role !== "student" ||
        presentedLessons.some((lesson) => lesson.teacherId === item.id)),
  );
  return {
    user: asUser(user),
    classes: classRows.map(
      (item) => ({ id: item.id, name: item.name }) satisfies SchoolClass,
    ),
    teachers: teacherRows.map(
      (item) =>
        ({
          id: item.id,
          name: item.name,
          subjects: JSON.parse(item.subjects) as string[],
        }) satisfies Teacher,
    ),
    lessons: presentedLessons,
    requests,
    notifications,
    stats,
    risks: risks.slice(0, 30),
    week: monday,
  };
}

function icsFor(lessons: Lesson[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Handover//EN",
    `X-WR-TIMEZONE:${SCHOOL_TIME_ZONE}`,
  ];
  for (const lesson of lessons) {
    const clock = periodClock(lesson.period);
    const day = lesson.date.replaceAll("-", "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${lesson.id}@handover`,
      `DTSTAMP:${nowIso()
        .replace(/[-:]/g, "")
        .replace(/\.\d+Z$/, "Z")}`,
      `DTSTART;TZID=${SCHOOL_TIME_ZONE}:${day}T${clock.start}00`,
      `DTEND;TZID=${SCHOOL_TIME_ZONE}:${day}T${clock.end}00`,
      `SUMMARY:${lesson.subject} ${lesson.className}`.replaceAll("\n", " "),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

async function impact(db: D1Database, weekValue: string): Promise<Impact> {
  const monday = isSchoolDate(weekValue)
    ? mondayOnOrBefore(weekValue)
    : defaultSchoolMonday();
  const friday = addDays(monday, 4);
  const rows = await all<RequestRow>(
    db,
    `SELECT * FROM requests WHERE status != 'Cancelled' AND (original_date BETWEEN ? AND ? OR target_date BETWEEN ? AND ?)`,
    [monday, friday, monday, friday],
  );
  const classes = await all<{ id: string; name: string }>(
    db,
    `SELECT id, name FROM classes`,
  );
  const className = new Map(classes.map((item) => [item.id, item.name]));
  const byClassMap = new Map<string, number>();
  const bySubjectMap = new Map<string, number>();
  for (const row of rows) {
    const name = className.get(row.class_id) ?? row.class_id;
    byClassMap.set(name, (byClassMap.get(name) ?? 0) + 1);
    bySubjectMap.set(row.subject, (bySubjectMap.get(row.subject) ?? 0) + 1);
  }
  const covered = rows.filter(
    (row) => row.status === "Confirmed" || row.status === "Completed",
  ).length;
  return {
    byClass: [...byClassMap.entries()].map(([name, count]) => ({
      name,
      count,
    })),
    bySubject: [...bySubjectMap.entries()].map(([name, count]) => ({
      name,
      count,
    })),
    learningMinutesProtected: covered * PERIOD_MINUTES,
    coverageRate: rows.length
      ? Math.round((covered / rows.length) * 1000) / 1000
      : 0,
  };
}

async function resetDemo(db: D1Database, actor: UserRow, request: Request) {
  await run(
    db,
    `DELETE FROM slot_locks WHERE request_id IN (SELECT id FROM requests WHERE is_demo = 1)`,
  );
  await run(
    db,
    `DELETE FROM timeline WHERE request_id IN (SELECT id FROM requests WHERE is_demo = 1)`,
  );
  await run(
    db,
    `DELETE FROM supplements WHERE request_id IN (SELECT id FROM requests WHERE is_demo = 1)`,
  );
  await run(
    db,
    `DELETE FROM notifications WHERE request_id IN (SELECT id FROM requests WHERE is_demo = 1) OR user_id IN (SELECT id FROM users WHERE is_demo = 1)`,
  );
  await run(
    db,
    `DELETE FROM todos WHERE request_id IN (SELECT id FROM requests WHERE is_demo = 1) OR user_id IN (SELECT id FROM users WHERE is_demo = 1)`,
  );
  await run(
    db,
    `DELETE FROM views WHERE request_id IN (SELECT id FROM requests WHERE is_demo = 1) OR user_id IN (SELECT id FROM users WHERE is_demo = 1)`,
  );
  await run(db, `DELETE FROM requests WHERE is_demo = 1`);
  await run(
    db,
    `DELETE FROM lessons WHERE is_demo = 1 AND id NOT IN (SELECT lesson_id FROM requests WHERE is_demo = 0)`,
  );
  await run(db, `DELETE FROM audit_log WHERE is_demo = 1`);
  await run(
    db,
    `DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE is_demo = 1)`,
  );
  await insertLessons(db);
  await insertSampleRequests(db);
  const cookie = await createSession(db, request, actor.id);
  await audit(db, actor, "demo.reset", actor.id, "Demo data rebuilt");
  return json({ ok: true }, 200, cookie);
}

async function register(
  db: D1Database,
  request: Request,
  body: Record<string, unknown>,
  config: ServiceConfig,
) {
  const email = clampText(body.email, 200).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const name = clampText(body.name, 80);
  const role = body.role;
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 8 ||
    password.length > 200 ||
    name.length < 1
  )
    throw new HttpError(422, "VALIDATION_ERROR");
  if (role !== "student" && role !== "teacher")
    throw new HttpError(422, "VALIDATION_ERROR");
  await throttle(db, `register:${email}`);
  const existing = await one<{ id: string }>(
    db,
    `SELECT id FROM users WHERE email = ?`,
    [email],
  );
  if (existing) throw new HttpError(409, "EMAIL_EXISTS");
  let classId: string | null = null;
  let subjects: string[] = [];
  if (role === "student") {
    classId = clampText(body.classId, 80);
    const found = await one<{ id: string }>(
      db,
      `SELECT id FROM classes WHERE id = ?`,
      [classId],
    );
    if (!found) throw new HttpError(422, "VALIDATION_ERROR", ["classId"]);
  } else {
    if (
      !(await secretsEqual(
        String(body.inviteCode ?? ""),
        config.TEACHER_INVITE_CODE,
      ))
    )
      throw new HttpError(403, "INVALID_INVITE");
    if (!Array.isArray(body.subjects) || body.subjects.length < 1)
      throw new HttpError(422, "VALIDATION_ERROR", ["subjects"]);
    subjects = body.subjects
      .slice(0, 6)
      .map((item) => clampText(item, 40))
      .filter(Boolean);
    if (!subjects.length)
      throw new HttpError(422, "VALIDATION_ERROR", ["subjects"]);
  }
  const recovery = base64url(bytes(32));
  const userId = id();
  await run(
    db,
    `INSERT INTO users (id, email, name, role, class_id, subjects, password_hash, recovery_hash, is_demo, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?)`,
    [
      userId,
      email,
      name,
      role,
      classId,
      JSON.stringify(subjects),
      await hashPassword(password),
      await hashPassword(recovery),
      nowIso(),
    ],
  );
  const created = await one<UserRow>(db, `SELECT * FROM users WHERE id = ?`, [
    userId,
  ]);
  if (!created) throw new HttpError(500, "INTERNAL");
  const cookie = await createSession(db, request, userId);
  await audit(db, created, "account.registered", userId, role);
  return json({ user: asUser(created), recoveryCode: recovery }, 200, cookie);
}

async function login(
  db: D1Database,
  request: Request,
  body: Record<string, unknown>,
) {
  const email = clampText(body.email, 200).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  await throttle(db, `login:${email || "blank"}`);
  const user = await one<UserRow>(db, `SELECT * FROM users WHERE email = ?`, [
    email,
  ]);
  const valid = user
    ? await verifyPassword(password, user.password_hash)
    : await verifyPassword(password, await hashPassword("unused-local-check"));
  if (!user || !valid) throw new HttpError(401, "INVALID_CREDENTIALS");
  if (user.active !== 1) throw new HttpError(403, "ACCOUNT_DISABLED");
  await run(db, `DELETE FROM sessions WHERE user_id = ?`, [user.id]);
  const cookie = await createSession(db, request, user.id);
  return json({ user: asUser(user) }, 200, cookie);
}

async function resetPassword(db: D1Database, body: Record<string, unknown>) {
  const email = clampText(body.email, 200).toLowerCase();
  const recovery =
    typeof body.recoveryCode === "string" ? body.recoveryCode : "";
  const password = typeof body.password === "string" ? body.password : "";
  await throttle(db, `reset:${email || "blank"}`);
  if (password.length < 8 || password.length > 200)
    throw new HttpError(422, "VALIDATION_ERROR");
  const user = await one<UserRow>(db, `SELECT * FROM users WHERE email = ?`, [
    email,
  ]);
  const valid = user?.recovery_hash
    ? await verifyPassword(recovery, user.recovery_hash)
    : false;
  if (!user || !valid) throw new HttpError(401, "INVALID_RECOVERY_CODE");
  const next = base64url(bytes(32));
  await run(
    db,
    `UPDATE users SET password_hash = ?, recovery_hash = ? WHERE id = ?`,
    [await hashPassword(password), await hashPassword(next), user.id],
  );
  await run(db, `DELETE FROM sessions WHERE user_id = ?`, [user.id]);
  await audit(db, user, "account.reset", user.id, "password rotated");
  return json({ ok: true, recoveryCode: next });
}

export async function handleApi(
  request: Request,
  db: D1Database,
  config: ServiceConfig,
) {
  try {
    await seedIfEmpty(db);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "").replace(/^\/api/, "") || "/";
    const method = request.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD" && !originAllowed(request))
      throw new HttpError(403, "FORBIDDEN");
    const body =
      method === "GET" || method === "HEAD" ? {} : await readBody(request);
    const user = await sessionUser(db, request);

    if (path === "/auth/me" && method === "GET") {
      if (!user) throw new HttpError(401, "UNAUTHENTICATED");
      return json({ user: asUser(user) });
    }
    if (path === "/auth/demo" && method === "POST") {
      if (config.DEMO_MODE === "false") throw new HttpError(404, "NOT_FOUND");
      const role = String(body.role ?? "");
      if (!["student", "teacher", "admin"].includes(role))
        throw new HttpError(422, "VALIDATION_ERROR");
      return await issueDemo(db, request, role, Number(body.teacherIndex ?? 0));
    }
    if (path === "/auth/login" && method === "POST")
      return await login(db, request, body);
    if (path === "/auth/register" && method === "POST")
      return await register(db, request, body, config);
    if (path === "/auth/logout" && method === "POST") {
      if (user) {
        const match = (request.headers.get("cookie") ?? "").match(
          /(?:^|;\s*)handover_session=([^;]+)/,
        );
        if (match)
          await run(db, `DELETE FROM sessions WHERE token_hash = ?`, [
            await hex(decodeURIComponent(match[1])),
          ]);
      }
      return json({ ok: true }, 200, cookieFor(request, "", true));
    }
    if (path === "/auth/reset" && method === "POST")
      return await resetPassword(db, body);
    if (!user) throw new HttpError(401, "UNAUTHENTICATED");

    if (path === "/profile" && method === "PATCH") {
      if ("role" in body || "email" in body || "isDemo" in body || "id" in body)
        throw new HttpError(403, "FORBIDDEN");
      const name = clampText(body.name, 80);
      if (!name) throw new HttpError(422, "VALIDATION_ERROR", ["name"]);
      let classId = user.class_id;
      let subjects = user.subjects;
      if (user.role === "student" && body.classId) {
        const found = await one<{ id: string }>(
          db,
          `SELECT id FROM classes WHERE id = ?`,
          [clampText(body.classId, 80)],
        );
        if (!found) throw new HttpError(422, "VALIDATION_ERROR", ["classId"]);
        classId = found.id;
      }
      if (user.role === "teacher" && body.subjects) {
        if (!Array.isArray(body.subjects))
          throw new HttpError(422, "VALIDATION_ERROR", ["subjects"]);
        const next = body.subjects
          .slice(0, 6)
          .map((item) => clampText(item, 40))
          .filter(Boolean);
        if (!next.length)
          throw new HttpError(422, "VALIDATION_ERROR", ["subjects"]);
        subjects = JSON.stringify(next);
      }
      await run(
        db,
        `UPDATE users SET name = ?, class_id = ?, subjects = ? WHERE id = ?`,
        [name, classId, subjects, user.id],
      );
      const updated = await one<UserRow>(
        db,
        `SELECT * FROM users WHERE id = ?`,
        [user.id],
      );
      return json({ user: asUser(updated!) });
    }
    if (path === "/workspace" && method === "GET") {
      return json(
        await workspace(
          db,
          user,
          url.searchParams.get("week") ?? "",
          url.searchParams.get("classId") ?? "",
          url.searchParams.get("teacherId") ?? "",
        ),
      );
    }
    if (path === "/conflicts" && method === "POST") {
      if (user.role === "student") throw new HttpError(403, "FORBIDDEN");
      const input = parseInput(body);
      const lesson = await lessonById(db, input.lessonId);
      if (user.role === "teacher" && lesson.base_teacher_id !== user.id)
        throw new HttpError(403, "FORBIDDEN");
      return json(await conflictReport(db, input));
    }
    if (path === "/requests" && method === "POST") {
      if (user.role === "student") throw new HttpError(403, "FORBIDDEN");
      const saved = await saveRequest(db, user, parseInput(body));
      return json({ request: await presentRequest(db, saved, user) });
    }
    const requestMatch = path.match(/^\/requests\/([^/]+)$/);
    if (requestMatch && method === "GET") {
      const row = await requestById(db, requestMatch[1]);
      if (!canSeeRequest(user, row))
        throw new HttpError(
          user.role === "student" ? 404 : 403,
          user.role === "student" ? "NOT_FOUND" : "FORBIDDEN",
        );
      return json({ request: await presentRequest(db, row, user) });
    }
    if (requestMatch && method === "PATCH") {
      if (user.role === "student") throw new HttpError(403, "FORBIDDEN");
      const row = await requestById(db, requestMatch[1]);
      if (row.original_teacher_id !== user.id && user.role !== "admin")
        throw new HttpError(403, "FORBIDDEN");
      const saved = await saveRequest(db, user, parseInput(body), row);
      return json({ request: await presentRequest(db, saved, user) });
    }
    const action = path.match(
      /^\/requests\/([^/]+)\/(submit|respond|status|supplements|todo|view)$/,
    );
    if (action) {
      if (method !== "POST") {
        const response = json({ error: "METHOD_NOT_ALLOWED" }, 405);
        response.headers.set("allow", "POST");
        return response;
      }
      const row = await requestById(db, action[1]);
      if (action[2] === "submit") {
        if (user.role === "student") throw new HttpError(403, "FORBIDDEN");
        return json({
          request: await presentRequest(
            db,
            await submitRequest(db, user, row),
            user,
          ),
        });
      }
      if (action[2] === "respond") {
        if (user.role === "student") throw new HttpError(403, "FORBIDDEN");
        return json({
          request: await presentRequest(
            db,
            await respond(
              db,
              user,
              row,
              String(body.decision ?? ""),
              clampText(body.comment, 500),
            ),
            user,
          ),
        });
      }
      if (action[2] === "status") {
        if (user.role === "student") throw new HttpError(403, "FORBIDDEN");
        return json({
          request: await presentRequest(
            db,
            await setStatus(
              db,
              user,
              row,
              String(body.status ?? ""),
              clampText(body.comment, 500),
            ),
            user,
          ),
        });
      }
      if (action[2] === "supplements") {
        if (user.role !== "teacher" && user.role !== "admin")
          throw new HttpError(403, "FORBIDDEN");
        if (
          user.role === "teacher" &&
          user.id !== row.original_teacher_id &&
          user.id !== row.recipient_id
        )
          throw new HttpError(403, "FORBIDDEN");
        if (
          !["Pending", "Confirmed", "Declined", "Completed"].includes(
            row.status,
          )
        )
          throw new HttpError(409, "INVALID_STATE");
        const text = clampText(body.text, 1000);
        if (!text) throw new HttpError(422, "VALIDATION_ERROR", ["text"]);
        await run(
          db,
          `INSERT INTO supplements (id, request_id, author_id, author_name, text, at) VALUES (?, ?, ?, ?, ?, ?)`,
          [id(), row.id, user.id, user.name, text, nowIso()],
        );
        await audit(db, user, "request.supplement", row.id, "supplement");
        return json({ request: await presentRequest(db, row, user) });
      }
      if (action[2] === "todo") {
        if (user.role !== "student" || user.class_id !== row.class_id)
          throw new HttpError(403, "FORBIDDEN");
        if (row.status !== "Confirmed" && row.status !== "Completed")
          throw new HttpError(409, "INVALID_STATE");
        const key = String(body.key ?? "");
        if (!TODO_KEYS.has(key))
          throw new HttpError(422, "VALIDATION_ERROR", ["key"]);
        await run(
          db,
          `INSERT INTO todos (user_id, request_id, key, done) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, request_id, key) DO UPDATE SET done = excluded.done`,
          [user.id, row.id, key, body.done === true ? 1 : 0],
        );
        return json({ ok: true });
      }
      if (action[2] === "view") {
        if (user.role !== "student" || user.class_id !== row.class_id)
          throw new HttpError(403, "FORBIDDEN");
        if (row.status !== "Confirmed" && row.status !== "Completed")
          throw new HttpError(409, "INVALID_STATE");
        await run(
          db,
          `INSERT OR IGNORE INTO views (user_id, request_id, at) VALUES (?, ?, ?)`,
          [user.id, row.id, nowIso()],
        );
        return json({ ok: true });
      }
    }
    if (path === "/notifications/read" && method === "POST") {
      if (body.id)
        await run(
          db,
          `UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`,
          [clampText(body.id, 80), user.id],
        );
      else
        await run(db, `UPDATE notifications SET read = 1 WHERE user_id = ?`, [
          user.id,
        ]);
      return json({ ok: true });
    }
    if (path === "/calendar" && method === "GET") {
      const data = await workspace(
        db,
        user,
        url.searchParams.get("week") ?? "",
        "",
        "",
        false,
      );
      return new Response(icsFor(data.lessons), {
        headers: {
          "content-type": "text/calendar; charset=utf-8",
          "cache-control": "no-store",
          "content-disposition": 'attachment; filename="handover.ics"',
        },
      });
    }
    if (path === "/admin/users" && method === "GET") {
      if (user.role !== "admin") throw new HttpError(403, "FORBIDDEN");
      const rows = await all<UserRow>(
        db,
        `SELECT * FROM users ORDER BY role, name LIMIT 200`,
      );
      return json({ users: rows.map(asUser) });
    }
    const userPatch = path.match(/^\/admin\/users\/([^/]+)$/);
    if (userPatch && method === "PATCH") {
      if (user.role !== "admin") throw new HttpError(403, "FORBIDDEN");
      if (body.active === false && userPatch[1] === user.id)
        throw new HttpError(403, "FORBIDDEN");
      const target = await one<UserRow>(
        db,
        `SELECT * FROM users WHERE id = ?`,
        [userPatch[1]],
      );
      if (!target) throw new HttpError(404, "NOT_FOUND");
      const active =
        body.active === undefined
          ? target.active
          : body.active === true
            ? 1
            : 0;
      const role = body.role === undefined ? target.role : body.role;
      if (role !== "student" && role !== "teacher" && role !== "admin")
        throw new HttpError(422, "VALIDATION_ERROR");
      if (role === "student" && !target.class_id)
        throw new HttpError(422, "VALIDATION_ERROR", ["classId"]);
      if (
        role === "teacher" &&
        target.role !== "teacher" &&
        JSON.parse(target.subjects).length === 0
      )
        throw new HttpError(422, "VALIDATION_ERROR", ["subjects"]);
      await run(db, `UPDATE users SET active = ?, role = ? WHERE id = ?`, [
        active,
        role,
        target.id,
      ]);
      if (active === 0)
        await run(db, `DELETE FROM sessions WHERE user_id = ?`, [target.id]);
      const updated = await one<UserRow>(
        db,
        `SELECT * FROM users WHERE id = ?`,
        [target.id],
      );
      await audit(db, user, "user.updated", target.id, String(role));
      return json({ user: asUser(updated!) });
    }
    if (path === "/admin/audit" && method === "GET") {
      if (user.role !== "admin") throw new HttpError(403, "FORBIDDEN");
      const rows = await all<
        AuditEvent & { actor_name: string; entity_id: string }
      >(
        db,
        `SELECT id, actor_name, action, entity_id, at, detail FROM audit_log ORDER BY at DESC LIMIT 200`,
      );
      return json({
        events: rows.map((item) => ({
          id: item.id,
          actorName: item.actor_name,
          action: item.action,
          entityId: item.entity_id,
          at: item.at,
          detail: item.detail,
        })),
      });
    }
    if (path === "/admin/impact" && method === "GET") {
      if (user.role !== "admin") throw new HttpError(403, "FORBIDDEN");
      return json(await impact(db, url.searchParams.get("week") ?? ""));
    }
    if (path === "/admin/reset" && method === "POST") {
      if (user.role !== "admin") throw new HttpError(403, "FORBIDDEN");
      if (body.confirm !== "RESET DEMO")
        throw new HttpError(422, "VALIDATION_ERROR");
      return await resetDemo(db, user, request);
    }
    throw new HttpError(404, "NOT_FOUND");
  } catch (error) {
    if (error instanceof HttpError) return fail(error);
    const message = error instanceof Error ? error.message : "";
    if (/UNIQUE|constraint/i.test(message))
      return json({ error: "INVALID_STATE" }, 409);
    console.error(
      JSON.stringify({
        message: error instanceof Error ? error.message : "api_failed",
      }),
    );
    return json({ error: "INTERNAL" }, 500);
  }
}
