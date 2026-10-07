CREATE TABLE IF NOT EXISTS family_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  school_id INTEGER NOT NULL,
  child_id INTEGER NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'daily_log',
  source_id INTEGER,
  reaction TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_by INTEGER NOT NULL,
  created_role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS family_feedback_child_idx ON family_feedback(child_id, id);

CREATE TABLE IF NOT EXISTS family_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  school_id INTEGER NOT NULL,
  child_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Chưa làm',
  created_by INTEGER NOT NULL,
  completed_by INTEGER,
  completed_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS family_tasks_child_idx ON family_tasks(child_id, status, due_date);

CREATE TABLE IF NOT EXISTS family_appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  school_id INTEGER NOT NULL,
  child_id INTEGER NOT NULL,
  requested_by INTEGER NOT NULL,
  requested_role TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'Trực tiếp',
  requested_date TEXT NOT NULL,
  requested_time TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Chờ xác nhận',
  confirmed_date TEXT NOT NULL DEFAULT '',
  confirmed_time TEXT NOT NULL DEFAULT '',
  reviewed_by INTEGER,
  reviewed_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS family_appointments_child_idx ON family_appointments(child_id, status, requested_date);
