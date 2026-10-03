# Decisions

Checked against the existing Vinext / Cloudflare Workers skeleton on 2026-10-03. The stack stays. Rebuilding on Supabase or Vercel would drop the Sites project already recorded in `.openai/hosting.json`.

## Persistence

Cloudflare D1 binding `DB` is the only store for accounts, sessions, timetables, handovers, todos, notifications, and the audit log. Tables are declared in `db/schema.ts`. `drizzle/0000_init.sql` and `drizzle/meta` are the Drizzle migration and snapshot. The request path does not create tables. An empty database is migrated, then the first API call seeds the demo school if `users` is empty. Local tests apply the same SQL through `node:sqlite`. `db.batch` in the test adapter runs every statement before another batch can start.

## Auth

There is no mail provider in this environment, so password reset uses a high-entropy recovery code shown once at registration. The database stores a PBKDF2-SHA256 hash (120,000 iterations), never the code. Reset rotates the code and deletes that account's sessions. Demo accounts are not password accounts; Try as Student / Teacher / Admin creates a real server session. The public invite `HANDOVER-2026` is a demonstration code, not a secret.

Cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` only on HTTPS. Mutations require the `Origin` header to match the request origin, and they also require the method that owns that route. GET and HEAD never submit, accept, cancel, or record a view. Identity comes from the session, never from `role` or `userId` in the body.

## Schedule and privacy

School dates are `Asia/Taipei` calendar dates. On Saturday or Sunday the default week is the next Monday, and Saturday itself has no lessons. A move or substitute is reserved with a unique slot lock when it is submitted. Accepting rechecks the slot inside the same batch as the lesson write. A unique teacher slot index rolls that batch back if two lessons would share a teacher, date, and period. Cancelling a confirmed change restores the snapshot stored on that request (`original_*`), which is the lesson arrangement at draft time, and only if the class slot, teacher slot, and pending locks are free. Confirmed lessons may be marked Completed before the lesson time; the written spec has no time gate, so none was added.

Students do not receive `reason`, `reasonCategory`, `teacherNotes`, supplement text, or timeline comments. Progress, plan, materials, assessment, equipment, and the student reminder stay visible after confirmation.

## Demo isolation

Seeded people, lessons, and requests are marked `is_demo = 1`. Reset deletes only those rows, rebuilds the sample school, and keeps `is_demo = 0` registrations. Day-before reminders are created when someone loads the workspace, not by a background push.

## Deferred

Public deployment, GitHub push, Playwright viewport screenshots, and a parent/QR card are not claimed as done. Subject templates in the editor are deterministic starters, not an AI model.
