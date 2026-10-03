# Handover API contract

All routes use JSON, same-origin HttpOnly session cookies, and return `{ error: string, fields?: string[] }` on errors. Errors use stable codes translated by the client. Every mutation rejects a mismatched Origin. The database is injected into `server/service.ts` so real API tests can run against SQLite.

- `GET /api/auth/me` → `{ user: User }` or 401
- `POST /api/auth/demo` `{role, teacherIndex?: 0 | 1}` → `{user}`. Teacher0 = original demo teacher, Teacher1 = recipient demo teacher.
- `POST /api/auth/login` `{email,password}` → `{user}`
- `POST /api/auth/register` `{email,password,name,role:'student'|'teacher',classId?,subjects?:string[],inviteCode?}` → `{user,recoveryCode}`
- `POST /api/auth/logout` → `{ok:true}`
- `POST /api/auth/reset` `{email,recoveryCode,password}` → `{ok:true,recoveryCode}`; rotate recovery code and invalidate sessions.
- `PATCH /api/profile` `{name,classId?,subjects?}` → `{user}`; role/email changes rejected.
- `GET /api/workspace?week=YYYY-MM-DD&classId=&teacherId=` → `Workspace`; role scoped server-side, one week. Teacher includes incoming assigned requests. Admin aggregates school-wide, lessons filtered to selected class/teacher. Default week next school Monday when weekend.
- `POST /api/conflicts` `RequestInput` → `ConflictResult`; teacher owns source lesson, admin allowed to inspect.
- `POST /api/requests` `RequestInput` → `{request:ChangeRequest}`; create Draft (incomplete handover permitted).
- `GET /api/requests/:id` → `{request}`; server filters student-visible content.
- `PATCH /api/requests/:id` `RequestInput` → `{request}`; original owner only, Draft/Declined only.
- `POST /api/requests/:id/submit` → `{request}`; all seven handover fields + ≥1 material required; conflict checks and reservation enforced atomically. Draft/Declined → Pending.
- `POST /api/requests/:id/respond` `{decision:'accept'|'decline',comment}` → `{request}`; assigned teacher only, Pending → Confirmed/Declined; decline requires comment.
- `POST /api/requests/:id/status` `{status:'Completed'|'Cancelled',comment?}` → `{request}`; Completed only after Confirmed, original/recipient teacher; Cancelled Draft/Pending/Confirmed/Declined by original or admin.
- `POST /api/requests/:id/supplements` `{text}` → `{request}`; original/recipient teacher, submitted states; immutable additions.
- `POST /api/requests/:id/todo` `{key:'materials'|'assessment'|'reminder',done:boolean}` → `{ok:true}`; own-class student, confirmed/completed only.
- `POST /api/requests/:id/view` → `{ok:true}`; own-class student records read receipt.
- `POST /api/notifications/read` `{id?:string}` → `{ok:true}`; missing id marks all own notifications read.
- `GET /api/calendar` → ICS download scoped to signed-in user.
- `GET /api/admin/users` → `{users:User[]}`; admin only.
- `PATCH /api/admin/users/:id` `{active?:boolean,role?:Role}` → `{user}`; cannot disable self; classroom/subject constraints enforced.
- `GET /api/admin/audit` → `{events:AuditEvent[]}`; admin only, recent 200 immutable logs.
- `GET /api/admin/impact?week=` → `Impact`; school aggregates, admin only.
- `POST /api/admin/reset` `{confirm:'RESET DEMO'}` → `{ok:true}`; admin only, clears only demo-domain data, real registrations retained, demo sessions invalidated then admin session refreshed.
- `GET /api/public/card/:token` → public student-safe handover card; ONLY if implemented with unguessable opt-in token, otherwise omit P2.

Seed includes 3 classes, 8 teachers, 36 students, 2 weeks of real dated lessons, requests across six states. No plain passwords in tracked files. Demo one-click issues genuine sessions for seeded users. Teacher signup invitation comes from `TEACHER_INVITE_CODE` server environment; sample demo invite `HANDOVER-2026` is explicitly public demonstration-only.
