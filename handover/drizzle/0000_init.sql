CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  class_id TEXT,
  subjects TEXT NOT NULL DEFAULT '[]',
  password_hash TEXT NOT NULL,
  recovery_hash TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  date TEXT NOT NULL,
  period INTEGER NOT NULL,
  room TEXT NOT NULL,
  base_teacher_id TEXT NOT NULL,
  base_date TEXT NOT NULL,
  base_period INTEGER NOT NULL,
  base_room TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  original_teacher_id TEXT NOT NULL,
  original_date TEXT NOT NULL,
  original_period INTEGER NOT NULL,
  original_room TEXT NOT NULL,
  kind TEXT NOT NULL,
  target_date TEXT NOT NULL,
  target_period INTEGER NOT NULL,
  target_room TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  reason_category TEXT NOT NULL,
  reason TEXT NOT NULL,
  handover_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS open_request_per_lesson
  ON requests(lesson_id)
  WHERE status IN ('Draft', 'Pending', 'Confirmed', 'Declined');

CREATE TABLE IF NOT EXISTS timeline (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS supplements (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  text TEXT NOT NULL,
  at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  event TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS todos (
  user_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  key TEXT NOT NULL,
  done INTEGER NOT NULL,
  PRIMARY KEY (user_id, request_id, key)
);

CREATE TABLE IF NOT EXISTS views (
  user_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  at TEXT NOT NULL,
  PRIMARY KEY (user_id, request_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  at TEXT NOT NULL,
  detail TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS slot_locks (
  request_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  date TEXT NOT NULL,
  period INTEGER NOT NULL,
  PRIMARY KEY (scope, scope_id, date, period)
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket TEXT NOT NULL,
  at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS auth_attempts_bucket ON auth_attempts(bucket, at);
CREATE INDEX IF NOT EXISTS lessons_class_slot ON lessons(class_id, date, period);
CREATE INDEX IF NOT EXISTS lessons_teacher_slot ON lessons(teacher_id, date, period);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS requests_status ON requests(status, updated_at);
