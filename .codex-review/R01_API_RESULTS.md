# R01 independent API acceptance

This is a translated historical review record, not a current-release verdict.

- Review date: 2026-10-03, Asia/Taipei.
- Product HEAD: `111f16a17381679aba20499807b9f6cd7b306cfc`.
- Entry: actual `handleApi` in `handover/server/service.ts`, with an independent Node SQLite D1 adapter and actual product migrations.
- Final command: `node --experimental-strip-types --test .codex-review/independent-api.test.mts`.
- Final result: exit 1; 65 Node counts, 47 passed, 18 failed, 0 skipped, 0 todo. There were 22 top-level cases; counts include 7 required-field cases, 2 concurrency cases, 34 HTTP-method subcases, and failed parents. **18 failures are not 18 distinct defects.**
- Only reviewer tests and this report changed; no product/adapter changes, external deployment, or Cursor interaction.

## Four required repairs

### R01-API-01 — P1: GET/HEAD actually submits changes and creates read receipts

Reproduction: obtain a real teacher session, create a complete Draft, then call `GET /api/requests/:id/submit` or HEAD directly. With a same-class student session, call GET/HEAD on `/api/requests/:id/view` for a Confirmed request.

Observed:

- GET/HEAD submit return 200 and change Draft to Pending, modifying `requests`, `slot_locks`, `timeline`, `notifications`, and `audit_log`.
- GET/HEAD view return 200 and change views from 0 to 1. Whole-DB hash comparison confirms only `views` changed.
- GET/HEAD respond/status/supplements/todo return 422 without side effects, but enter action mutation validation rather than reject the method.
- GET/HEAD admin/reset, auth mutations, profile, notifications/read, conflicts, request creation, and admin user patch return 404 with no DB changes.

Cause: action branch `handover/server/service.ts:2067` checks URL without `method === 'POST'`; `service.ts:1946` also exempts GET/HEAD from mutation Origin checking. The actual route forwards GET to this same handler, so GET is not merely a test-entry problem.

Minimal fix: require POST on every action before obtaining/modifying the request. Other methods return 405 or contract-supported 404. GET/HEAD must be side-effect-free, without relying on empty-body 422. Acceptance requires receipt 0→0, Draft→Draft, and unchanged hashes across all tables.

Test: `independent-api.test.mts:565`. HEAD was tested at the service entry only; actual framework HTTP HEAD forwarding was not separately probed.

### R01-API-02 — P1: concurrent acceptance/cancellation leaves Cancelled with substitute teaching

Reproduction: create/submit a valid substitute request and obtain original/receiving teacher sessions. Synchronize after both read Pending and before the first write; run accept/cancel concurrently with both start orders.

Both orders returned 200/200. The final request was Cancelled, but lesson.teacher_id remained `demo-teacher-1` instead of original `demo-teacher-0`. Two 200 responses are not inherently wrong; no legal sequential history can produce this status/timetable combination.

Cause: `service.ts:1421` writes Confirmed before a separate lesson update at 1428. Cancellation restoration at 1494 depends on a pre-transaction status snapshot, followed by unconditional Cancelled at 1502. These writes lack one atomic transaction and version/state checks.

Minimal fix: put expected-state validation, transition, timetable update/restoration, slot release, and successful timeline/notification/audit in one atomic D1 batch. A stale loser must roll back completely, without successful events or partial timetable writes.

Legal outcomes include cancellation first with accept 409 and original timetable; accept then successful cancel/restoration; or stale cancel 409 leaving Confirmed/substitute timetable. The test does not insist on only one 200.

Test: `independent-api.test.mts:516`.

### R01-API-03 — P1: cancelling a confirmed move restores into another confirmed lesson

Reproduction: start with two valid lessons. Move the first from Monday period 1 to Tuesday period 2 through actual move/submit/accept APIs. Move the second into the freed Monday period 1 through the same APIs. Cancel the first Confirmed request.

Observed: cancellation returns 200 and creates **2 lessons** for the class at Monday period 1. Original-slot occupancy was created by legal product APIs, not invalid direct DB injection.

Cause: `service.ts:1494`–1499 restores `base_*` without rechecking class/teacher/room occupancy or Pending reservations.

Minimal fix: inside atomic cancellation, validate restoration availability, exclude self, and include other Pending reservations. Occupancy returns 409 and preserves Confirmed/current location and the second lesson. Use adequate DB constraints or equivalent atomic guards against duplicate scheduling.

Test: `independent-api.test.mts:377`.

### R01-API-04 — P1: accepting Pending does not recheck receiving-teacher collision

Reproduction: draft/submit normally, then use a controlled timetable-revision fixture to add another-class lesson for the receiving teacher at that date/period. Accept with the real receiving-teacher session.

Observed: 200/Confirmed, with **2 lessons** for that teacher/period. Normal teacher-only submit collision invokes `conflictReport`; acceptance does not.

Cause: respond at `service.ts:1385` checks role/Pending/decision, then 1421–1438 directly writes Confirmed and lesson.

Minimal fix: recheck current occupancy/eligible recipient and atomically guard conflict/state/timetable changes. Collision returns 409, preserving Pending and the original timetable.

Test: `independent-api.test.mts:288`. The extra lesson simulates a timetable revision; it does not claim an unauthorized lesson-creation API exists. Revalidation was an explicit round requirement.

## Important checks actually passed

- Each of seven missing handover sections/materials is rejected on direct submit with identified omissions and no residual reservation.
- javascript/data/file material URLs are rejected.
- Teacher-only collisions are blocked by conflict report and submit.
- Students cannot read Pending; raw workspace/detail JSON and ICS exclude teacherNotes markers. Cross-class reads/todos/views and unrelated-teacher edits are denied.
- Submitted originals are locked; decline requires a comment, releases locks, permits edit/resubmit/reconfirmation.
- Logout/expired/disabled/password-reset old cookies are rejected. Recovery codes rotate and both existing sessions are revoked.
- Past Confirmed lessons can complete once; duplicate completion and Completed→Cancelled are denied.
- Confirmed moves with no restoration collision restore teacher/date/period/room and free the target for legal reuse.
- Demo reset revokes demo sessions, refreshes admin session, and restores role demo login.
- Reset preserves real teacher requests referencing demo lesson/class/recipient, accepted timetable, real student three todos/views, account hashes, and sessions.
- Parallel claims on one destination produce one Pending and one 409/Draft; all locks belong to the winner. Concurrent submit replay creates one submitted timeline/pending notification.
- Cross-Origin POST/PATCH mutations are rejected without state changes.

## False-positive audit and scope

- Immediate completion of future lessons was permitted. Original requirements did not explicitly require waiting for teaching to end, so this became advisory diagnostic, **not a release blocker/defect**. If Completed is defined as already taught, add date/period-end guards.
- Legal sequential accept→cancel can return two 200s. Failure concerns only contradictory final Cancelled/substitute data, not a blanket ban on dual success.
- Root's synchronous SQL batch adapter avoids nested BEGIN/`cannot start a transaction within a transaction`. Failures are actual business/timetable inconsistency, not adapter-induced 500.
- Registration/login/recovery use actual service code, without injected sessions or crypto polyfills. Fixtures establish school schedules/initial teaching assignments without bypassing tested role/ownership checks.
- Original-slot reuse was revised to use another actual API-confirmed move, eliminating invalid direct schedule injection as an explanation.
- Wrong-method snapshots are taken after fixture seed completes; initial seed is not classified as GET mutation. Snapshots compare hashes without printing passwords/recovery codes/cookies.
- PBKDF2 120k was not treated as a defect; Worker support is determined by root's actual workerd probe. Node integration does not verify hosted performance.
- Actual production D1, public deployment, complete HTTP HEAD forwarding, and browser acceptance were not executed. Scope is independent API/SQLite integration only.
