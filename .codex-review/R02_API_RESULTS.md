# R02 independent backend re-review results

Date: 2026-10-04, Asia/Taipei. Product commit: `73d32c1ee1a5d764d0dcf8b755b60c0de6eb808a`; workspace HEAD: `1f1fe7704f92cdc14dd6a819aedeacec909a2f2c`. Node `v26.3.0`, fresh process importing stable `handleApi`, no runtime crypto polyfill. No product changes, Cursor interaction, push, or deployment. This is a translated historical record.

**Backend acceptance failed this round.** All specified reproductions of R01's four defects passed. Four other issues were confirmed: unrecoverable failed seed, 409 parallel first requests, successful events from failed transitions, and submit after the checked target becomes occupied. Nine Node failures include a parent and four children, not nine distinct causes.

## Actual commands and counts

All shell commands used `/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon` as CWD.

| Execution | Exit | Result |
| --- | --- | --- |
| `node --experimental-strip-types --test .codex-review/independent-api.test.mts`, 28 top-level before CAS/stale-submit additions | 1 | 73 Node counts: 71 pass/2 fail/0 skip/0 cancelled; top-level 26 pass/2 fail |
| `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts` | 0 | 2/2 pass |
| `node --experimental-strip-types --test --test-name-pattern='losing transition replays\|injected mid-seed\|parallel first demo' .codex-review/independent-api.test.mts` | 1 | Initial diagnostic: 7 fail; unsupported cancellation-notification expectation corrected, see false-positive audit |
| `node --experimental-strip-types --test --test-name-pattern='losing transition replays\|sequential rejected completion' .codex-review/independent-api.test.mts` | 1 | 6 fail: four CAS replays, parent, and sequential replay; all remained confirmed after removing notification assumption |
| `node --experimental-strip-types --test --test-name-pattern='submit atomically rechecks' .codex-review/independent-api.test.mts` | 1 | 1 fail, HTTP 200 instead of expected collision-time 409 |
| **`node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts`**, final complete suite | **1** | **82: 73 pass/9 fail/0 skip/0 cancelled**; API 80: 71 pass/9 fail, 31 top-level with 26 pass/5 fail; harness 2/2 pass |
| `node handover/node_modules/typescript/bin/tsc --noEmit --module ESNext --moduleResolution Bundler --target ES2022 --allowImportingTsExtensions --skipLibCheck --typeRoots handover/node_modules/@types --types node .codex-review/independent-api.test.mts .codex-review/review-d1.mts handover/node_modules/@cloudflare/workers-types/index.d.ts` | 0 | Reviewer type checking rerun after test additions |
| `node --experimental-strip-types --input-type=module <<'NODE'`, independent memory adapter/migration probe | 0 | 7/7 pass, described below |

After stable R02 handback, three reviewer-owned top-level regressions were added, without weakening the original 28 groups, skipping failures, or changing fixture permissions.

## Repairs and security flows that passed

- R01 methods: all 34 GET/HEAD mutation branches made no table writes; submit/view rejected without creating receipts. Baseline follows seed completion.
- R01 accept/cancel: both start orders produced legal timetable/state/timeline, allowing linearly valid dual 200.
- R01 accept recheck: a valid new other-class lesson after Pending caused accept 409 without duplicate lessons/Confirmed. No constraint/trigger disabled.
- R01 cancellation collision: another actual API move occupied the original slot; cancellation returned 409, preserving Confirmed and both schedules.
- Private teacherNotes/reason/reasonCategory/supplement/acceptance-comment markers were absent from raw student workspace/detail/calendar; authorized teachers retained access.
- Both incomplete Draft PATCH/submit races avoided incomplete Pending. A legal Completed followed by another move/cancel restored the immediately preceding arrangement, not earliest base_*. Actually exercised, 0 skip.
- Seven sections, dangerous URLs, teacher-only collisions, cross-class scope, unauthorized/cross-Origin mutations, logged-out/expired/disabled sessions, recovery rotation, and revocation passed.
- Reset revoked demo cookies while preserving ordinary teachers/students, requests/demo dependencies/todos/views/credentials/valid sessions. Parallel ordinary Draft claims and submit replay produced one success with no duplicate events.

## Confirmed A: [P1] mid-seed failure leaves permanent partial data; retry does not rebuild

**Reproduction:** on a fresh DB with all migrations, inject one lesson BEFORE INSERT `RAISE(ABORT)`. A counting SQLite function proves execution reached the seed write. After first `POST /api/auth/demo` failure, remove the trigger and actually retry teacher/student/admin.

**Actual:** 45 users, 3 classes, and `meta.seeded` survived the fault; modified tables were `classes, meta, users`. All three retries returned 200, yet `users=45, lessons=0, requests=0`. Successful demo login does not prove a complete school. Retry was actually run, not inferred from a marker.

**Locations:** [service.ts:350](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:350) skips by user count; [358](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:358) writes completion before seed; [369](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:369),421,448,470,[539](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:539) are segmented/per-row writes outside one batch.

**Regression:** [independent-api.test.mts:760](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:760). R02 already explicitly required atomic/retryable seed without harming real registrants; no new policy.

**Minimal repair:** commit data/completion in one transaction with full rollback. Determine completeness from completion/version evidence, not any user row. Preserve real accounts/relations; never automatically empty the DB to pass.

## Confirmed B: [P2] seven parallel first requests fail instead of waiting for complete seed

**Reproduction:** another fresh migrated DB, users/lessons proven 0; release 8 teacher A/B/student/admin demo POSTs together.

**Actual:** one 200 and seven 409 `INVALID_STATE`. No nested transaction or adapter await interleaving. All initially saw empty count/no marker; unique collision on `INSERT meta('seeded')` became global-catch 409. Sequential normal-fixture login did not cover this.

**Locations:** [service.ts:350](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:350),[358](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:358),[2534](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:2534). Regression: [793](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:793).

**Minimal repair:** coalesce or safely wait/retry competing initialization. Losers receive roles after complete seed, never partial seed. An isolate-local promise alone cannot protect multiple Workers. B concerns normal first-login availability; A concerns permanent corruption after failure.

## Confirmed C: [P1] CAS loser returns 409 but commits successful events

**Concurrent reproduction:** replay valid accept/accept, decline/decline, cancel/cancel, complete/complete through actual APIs, with a barrier only at the real batch boundary. Preserve SQL/constraints/permissions. Each pair returned one 200/one 409 `INVALID_STATE` and legal final state, but duplicate events:

| Action | New timeline (expected 1) | New audit (expected 1) | New notifications |
| --- | --- | --- | --- |
| accept | 2 | 2 | 26 (expected 13: 12 class students + original teacher) |
| decline | 2 | 2 | 2 (expected 1) |
| cancel | 2 | 2 | 0 (no additional cancellation-notification requirement) |
| complete | 2 | 2 | 0 |

**Simplest sequential reproduction:** past lesson Draft→Pending→Confirmed→Completed; second status POST `{status:'Completed'}` returns 409 but still changes audit_log/timeline, recording the losing comment as successful completion. No synchronization/future-date/Worker-scheduling assumptions.

**Cause:** CAS protects the UPDATE, but later INSERTs use only `EXISTS(request.status=destination)`. Once an earlier action reached destination, loser UPDATE changes=0 still permits INSERT. Checking changes after `db.batch` commits cannot undo successful events.

**Locations:** decline [1431](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1431),1445,1451/post-check1464; accept [1530](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1530),1544,1550,1559/1572; Completed [1607](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1607),1621/1634; Cancelled [1722](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1722),1736/1749.

**Regressions:** [820](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:820),[861](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:861).

**Minimal repair:** bind events/audit/notifications to **this** CAS success, e.g. a unique transaction transition token/revision. Final status alone and post-commit throw are insufficient. Timestamp markers must handle same-millisecond replay; frontend busy cannot replace DB guarantees. R02 explicitly required events only for successful legal transitions.

## Confirmed D: [P1] target occupied between report and Pending batch still submits successfully

**Reproduction:** same-teacher/class valid lessons, two API-created move Drafts targeting one free slot. Pause A after successful initial `conflictReport` but before the real Pending transaction. B completes API submit→accept, occupying the slot and releasing Pending locks. Confirm collision via `/conflicts`, then release A's batch.

**Actual:** A returns 200/Pending with overlapping target/reservations. This is not two Pending requests fighting over a lock PK (already passed): B is a real confirmed lesson with no Pending lock to collide.

**Locations:** pre-transaction report [1334](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1334); UPDATE at [1341](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1341) checks Draft/seven sections only; INSERTs [1361](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1361),1367 check Pending only. Migration lacks cross-table lesson/reservation guards.

**Regression:** [876](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:876). Initial fixture is valid; B's schedule/confirmation use actual APIs without directly editing request/lesson race state. Barrier preserves SQL and selects a legally possible inter-request ordering.

**Minimal repair:** Pending CAS/reservations atomically recheck current lesson class/teacher occupancy and source arrangement. Collision preserves Draft with 409 and no locks/submitted event. Existing changes=0 logic treats every Draft as INCOMPLETE_HANDOVER; new guards must distinguish complete-but-conflicting 409 from 422 with empty missing fields.

**Limit:** this proves invalid Pending/reservations/notifications, not that A acceptance bypasses repaired acceptance or produces two final lessons.

## Migration, constraints, and adapter evidence

Stable SQL inventory contained **only `0000_init.sql`**. Discovered inventory, `appliedMigrations`, and journal `0000_init` agreed; harness did not miss 0001. Complete SQLite exec preserves future trigger bodies without semicolon splitting.

Actual guards:

- `lessons_one_teacher_slot` unique index (migration40), original UNIQUE errors propagated and full rollback tested.
- `lessons_class_slot` ordinary index (39), not unique.
- `open_request_per_lesson` partial unique (79).
- `slot_locks` `(scope, scope_id, date, period)` PK (95), full conflicting-batch rollback tested.
- `users_email_unique` and ordinary session/auth_attempt/request query indexes.
- No product triggers in sqlite_schema; no correct guard rejecting the reviewer fixture misclassified as an API defect.
- `PRAGMA foreign_keys=1`, but product tables have no declared FK. This is a model observation, not an invented FK release failure.

Having one 0000 is not itself a defect; schema/journal completeness improved. Actual D is the missing final cross-table occupancy boundary, not a filename requirement.

Seven adapter probes passed: inventory/journal agreement, RAISE(ABORT), RAISE(ROLLBACK), CAS metadata1→0, FK-error rollback, actual teacher unique rollback, actual slot-lock PK rollback. Original RAISE1811/messages were not masked; connections remained usable. Synchronous statements prevent nested BEGIN across calls.

## False-positive/assumption audit

1. **Future Completed:** still permitted; advisory passes with diagnostic. Original requirements did not mandate date gating. Sequential completion replay uses a past lesson and is independent of this policy.
2. **Legal accept→cancel:** dual 200 allowed if final data matches legal ordering.
3. **Same-owner subsequent Completed move:** supported and actually passed move/cancel with 0 skip, without cross-teacher unauthorized assumptions.
4. **Supplement visibility:** published `{text}`/documented teacher-only contract, no invented visibility field. Raw JSON markers, not lack of frontend rendering, prove student privacy.
5. **Cancellation-notification false expectation:** first replay diagnostic expected 12 without contract support; removed and changed to 0. Cancellation still duplicates timeline=2/audit=2, so C does not depend on it. One successful event remains required.
6. **Fault injection:** reviewer-only BEFORE INSERT trigger with proven hit. Normal seed/business produced 71 passing API counts; not a universally broken runtime. ABORT in D1 batch should roll back all, while stable seed writes committed separately, explaining A.
7. **D interleaving:** no guard disabled/B state edited. A report and batch are separate; another request can finish outside a D1 transaction. No invented SQL interleaving inside one transaction. Contract already required atomic conflict/reservation enforcement.
8. **Runtime limits:** Node SQLite injection only, not actual Worker/D1 deployment evidence. No unsupported PBKDF2 120k limitation claim or timingSafeEqual-hiding Node polyfill. Root owns Worker smoke/browser/build.

No product files changed this round. Only reviewer cases/clearer seed-retry diagnostics/report were added. Rerun the full suite and Worker on the next stable version; these results cannot be labeled all-pass.
