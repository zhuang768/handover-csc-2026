# R02 backend re-review readiness

Date: 2026-10-04, Asia/Taipei. Cursor was still implementing R02/R02B. This round did not import the product service, run formal API acceptance, or modify the product. This is a translated historical record; its observations and planned checks describe that round.

## Read-only observations during implementation

- Neither of the two file inventories contained `drizzle/0001_slot_guards.sql`. They contained only `0000_init.sql`, `meta/0000_snapshot.json`, and `_journal.json`. This was an unfinished artifact requiring confirmation, not a final defect or verified 0001.
- The schema/migration already contained the `lessons_one_teacher_slot` unique index. In-progress service changes included action POST method guards, removal of student reason fields, conditional Draft PATCH/submit, accept/cancel SQL batches, and restoration snapshots. These describe repair direction, not a verdict on unfinished code.
- Before formal re-review, establish Cursor's stable handback HEAD, complete migration inventory, and guard/trigger names, then confirm the planned guards actually exist.

## Harness status and actual repair

`review-d1.mts` already used `readdirSync(...).filter(name => name.endsWith('.sql')).sort()` and executed every file with SQLite `connection.exec`; **it did not load only a handwritten 0000**. It did not split on semicolons, so complete `CREATE TRIGGER ... BEGIN ...; ... END;` statements retained valid SQLite syntax. All SQL in a D1 batch ran synchronously inside one transaction.

Only the reviewer adapter changed this round:

1. It returned read-only `appliedMigrations`; a file was recorded only after its complete SQL succeeded. Re-review could verify execution of 0001 directly rather than relying on a claim.
2. It fixed reproduced error masking: a trigger's `RAISE(ROLLBACK)` had already ended the transaction. The catch block's second ROLLBACK replaced the original guard error, errcode 1811, with errcode 1, `cannot rollback - no transaction is active`. The adapter now avoids rollback after the transaction ends; secondary rollback errors do not replace the original SQL failure. It did not swallow constraints, relax the schema, or weaken assertions.

## Adapter-only checks actually executed

- Existing `reviewer-harness.test.mts`: 2/2 passed. Parallel batches did not nest BEGIN; a later UNIQUE failure rolled back the whole batch.
- Five additional in-memory probes: 5/5 passed.
  - `appliedMigrations` matched every discovered SQL file. The actual inventory then was `0000_init.sql`.
  - `RAISE(ABORT)` retained the original guard message/1811, rolled back earlier writes, and left the connection usable.
  - `RAISE(ROLLBACK)` retained the original guard message/1811, rolled back earlier writes, and left the connection usable.
  - An unmatched conditional UPDATE returned `meta.changes = 0`, without fabricated success.
  - Foreign keys were enabled; FK failure propagated and rolled back the preceding write.
- Reviewer adapter and independent API test TypeScript `--noEmit`: exit 0.

These checks did not call `handleApi`, exercise unfinished features, or replace Worker/actual D1 acceptance.

## Execution plan after stable handback

1. **Migration evidence:** create a fresh in-memory DB in a new Node process, list `appliedMigrations`, and verify every final SQL file including 0001. Inspect actual indexes/triggers in `sqlite_schema`; compare SQL with snapshot/journal. Initialize with all migrations, never SCHEMA_SQL or manually skipped guards.
2. **Guard behavior:** trigger actual unique indexes/triggers using valid fixtures. Confirm errors are not masked, the entire batch rolls back, the connection remains usable, and failed actions create no timeline/notification. If a guard correctly rejects an invalid schedule fixture, do not disable it to manufacture a collision or misclassify setup rejection as an API defect.
3. **Formal API suite:** run all of `independent-api.test.mts`, including R01 method/concurrent cancellation/original-slot occupancy/rechecks and R02 private reasons/supplements/PATCH-submit races/previous-arrangement restoration. Use a new process to avoid a cached pre-repair service module.
4. **Empty-school seed and recovery:** execute the two new R02 cases rather than checking demo login only against an already seeded fixture.
5. **Honest reporting:** record stable HEAD, command exit code, actual parent/child counts, and advisory/unsupported results. Separate harness problems, invalid fixtures, and product defects. If Node and Worker schema/trigger behavior differs, use the root agent's actual Worker/D1 evidence; do not fabricate polyfills or treat Node results as deployment evidence.

## New seed regressions this round (not yet executed)

### Actual retry after a fault

Start from an empty DB with all migrations applied. Inject `RAISE(ABORT)` with a test BEFORE INSERT trigger on `lessons`; a SQLite function counter proves seed SQL was interrupted. The first demo request should fail and roll back all data and seed claims. Remove the test trigger, **actually retry demo APIs for three roles before inspecting the failure snapshot**, rather than merely claiming retry is possible.

Completeness checks: 3 classes, 8 teachers, 36 students, 1 admin, two school weeks, six request states, and working login for both demo teachers. Check lessons/requests/sessions/notifications/timeline/supplements/todos/views/slot_locks for orphan relations and duplicate class/teacher periods.

### Parallel first requests on an empty DB

Use another independent empty DB and release 8 teacher A/teacher B/student/admin demo requests simultaneously. Every request should receive a valid session for its role, backed by one complete school seed. Subsequent demo login must not duplicate or reset users/lessons/requests. Negative controls must first prove users and lessons are 0; an ordinary pre-seeded fixture is insufficient.

The independent API suite then had 28 top-level cases. These two cases and the other new R02 API cases were **not yet executed**; only reviewer static type checking had passed.
