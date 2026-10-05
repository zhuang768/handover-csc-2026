# R03 independent backend re-review results

Date: 2026-10-04, Asia/Taipei. Final inspection: 2026-10-04 01:05:54 (2026-10-03 17:05:54 UTC). This is a translated historical record.

**All original R02 82 Node counts passed; new existing-database upgrade acceptance failed, so full backend acceptance was withheld.** One new compatibility issue covers two valid situations: complete and genuinely interrupted legacy schools. The four repaired defects were not relabeled failed; future Completed policy was not expanded.

## Candidate and clean-state checks

| Item | Evidence |
| --- | --- |
| Pinned product commit | `f3fa696115a86f98995686b6bb934b90492133ab` |
| Actual HEAD at execution | `b3753d7e35562359368978d23b902124732e0631` |
| Difference between b375 and f3 | Only `.codex-review/CURSOR_STATUS.json`, no product/CI changes |
| Starting `HEAD:handover` | `911adb7043d89b7487b12b9bb3d06876457699a5` |
| Ending `HEAD:handover` | Same pinned app tree |
| Candidate/ending `.github` tree | `0f1920ddb805942f2c4721686d5bb78392f6900a` |
| Starting/ending `git status --porcelain=v1 -- handover .github` | No output, exit 0 |
| Ending `git diff --name-only f3fa696115a86f98995686b6bb934b90492133ab -- handover .github` | No output, exit 0 |

This agent did not change product/browser/services/Cursor/other reviewers' tests/external apps. Only two justified upgrade cases were added to the owned suite, plus this report. Root's separate product/E2E/Worker results are not claimed as this agent's executions.

## Actual commands, exits, and counts

CWD: `/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon`; Node `v26.3.0`. Each formal suite imported current service in a fresh process, without crypto/D1 runtime polyfills.

| Execution | Exit | Result |
| --- | --- | --- |
| `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts`, original 82 before upgrade additions | **0** | **82 pass/0 fail/0 skip/0 cancelled**; API 80, harness 2 |
| `node --experimental-strip-types --test --test-name-pattern='existing complete R02 school' .codex-review/independent-api.test.mts` | 1 | 1 fail: complete school + real registered session returned 409 `INVALID_STATE` |
| Same complete-suite command after two justified upgrade additions | **1** | **84: 82 pass/2 fail/0 skip/0 cancelled**; API 82 (33 top-level:31 pass/2 fail), harness2/2 |
| `node handover/node_modules/typescript/bin/tsc --noEmit --module ESNext --moduleResolution Bundler --target ES2022 --allowImportingTsExtensions --skipLibCheck --typeRoots handover/node_modules/@types --types node .codex-review/independent-api.test.mts .codex-review/review-d1.mts handover/node_modules/@cloudflare/workers-types/index.d.ts` | 0 | Reviewer types passed after two additions |
| `node --experimental-strip-types --input-type=module <<'NODE'`, five memory migration/adapter probes | 0 | 5/5: complete inventory/journal/snapshot, actual additive migration preservation, ABORT, ROLLBACK, CAS metadata |
| Same stdin form, actual API transition-token rotation | 0 | 1/1: five distinct UUIDv4 success tokens; failed replay preserved token/timeline/audit |
| Same stdin form, **actual R02 service/schema complete DB → actual 0001 → R03 service** | 1 | 1 fail: real session200→409;46 users/120 lessons/7 requests preserved, old `seeded=1` |
| Same stdin form, **actual R02 seed fault → ordinary registration → 0001 → R03** | 1 | 1 fail: fault hit once;session200→409;3 classes/46 users/0 lessons/0 requests, real account/credential/session fully preserved |

Stdin probes created no product files/services. Historical service came from `git show 73d32c1ee1a5d764d0dcf8b755b60c0de6eb808a:handover/server/service.ts`, loaded with Node `stripTypeScriptTypes`. Runtime time.ts was identical. Legacy DB used actual same-commit `0000_init.sql`; upgrade executed current `0001_opposite_kree.sql`. This was not inference from fixture markers alone.

## R02 repairs and original R01 regressions

| Issue | Actual R03 evidence |
| --- | --- |
| R02 seed fault/actual retry | Fresh DB lesson fault proven; all data/markers rolled back; removing fault rebuilt three roles/two weeks/relations, passed |
| R02 eight parallel first logins | All correct roles/valid sessions; one complete seed, no later rebuild/duplicates, passed |
| R02 failed-CAS success events | Accept/decline/cancel/complete replays create only winner timeline/audit/required notifications; sequential Completed replay also makes no writes, passed |
| R02 stale submit | After A report, actual B move/accept occupied target; A batch returned409, retainedDraft, no locks/submitted event, passed |
| R01 GET/HEAD mutations | All34 child cases made no writes;submit/view left state/receipts unchanged, passed |
| R01 accept/cancel | Both start orders had legal state/timetable/events, permitting legal dual200, passed |
| R01 late teacher collision | Valid other-class lesson duringPending caused accept409, preservedPending/original arrangement, passed |
| R01 cancellation restoration collision | Second actual API move occupied original slot;first cancellation409 preserved both established arrangements, passed |

Other original cases all passed with no skip: seven sections, unsafe URLs, teacher-only collisions, raw student private markers, cross-class/permissions/Origin, invalid sessions, recovery rotation, reset preserving real accounts/dependencies/todos/views, submitted locking/decline-resubmit, incomplete PATCH-submit races, second move afterCompleted restoring prior snapshot.

## Migration/token verification

Actual SQL inventory, adapter `appliedMigrations`, and journal:

1. `0000_init.sql`
2. `0001_opposite_kree.sql`

0001 actually ALTERs nullable TEXT `requests.transition_token`; `db/schema.ts:88` and `meta/0001_snapshot.json` agree, with prevId chained to0000. Applying0001 to populated0000 preserves rows and initializes null tokens. Adapter loads0001, never manually0000-only or splits trigger bodies; ABORT/ROLLBACK original errors and zero-row CAS metadata are testable.

- [service.ts:1388](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1388),1489,1674 use fresh `crypto.randomUUID()`, not millisecond timestamps.
- Accept/decline/complete/cancel CAS writes this token; locks/events/notifications/audit in the same batch require request.id plus this token. Losers cannot insert events merely because destination status already exists.
- Actual submit→decline→resubmit→accept→Completed probe produced five unique tokens. Rejected completion preserved last token/audit/timeline. No unnecessary global token unique index required.
- [1414](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1414)/1421 Pending UPDATE checks real lesson class/teacher occupancy from **current** request fields. Same-batch locks require winner token; PK prevents competing Pending. Zero rows with complete handover correctly return409.
- No product trigger and ordinary class lesson index remain; not additional release failures. Actual batch guards/existing slot PK blocked all legal race reproductions exercised here.

## New confirmed [P1]: legacy seed marker upgrade repeatedly returns409 on valid existing DBs

**Shared cause:** [service.ts:352](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:352) `schoolReady` accepts only `meta.seed_complete=1 AND lessons>0`. Both normal complete R02 seed and reproduced partial seed use `meta.seeded=1`.0001 adds token without marker/data conversion. R03 collects/replays seed at[396](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:396), then plain INSERT existing classes at[419](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:419) fails the batch. Catch rereads missing marker and throws. Handler[2278](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:2278) seeds before route/session checks; global catch turns constraints into409.

### Situation1: actual complete R02 database

1. Normal demo seed using historical R02 schema/service.
2. Actual ordinary teacher registration; original `GET /auth/me`200.
3. Execute actual R03 0001 and use actual R03 handler.
4. Same cookie `GET /auth/me`409 `INVALID_STATE`.

Before/after:46 users,120 lessons,7 requests,`seeded=1`. Data was not deleted, but service access failed. Other shared-entry APIs face the same risk; actual measured evidence is auth/me.

Persistent regression:[independent-api.test.mts:925](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:925). Fixture recreates legacy markers; actual historical source/schema probe confirms this is valid state, not arbitrary corruption.

### Situation2: genuinely possible partial R02 database

1. Historical0000, reviewer fault on first lesson INSERT;counter1,HTTP500.
2. R02 had committed3 classes/45 demo users/seeded=1,0 lessons/requests.
3. Remove fault; actual R02 ordinary teacher registration produces valid account/session,auth/me200. This is old-service-supported data, not manually injected fake user.
4. Apply R03 0001;original real cookie auth/me409.

Final:3 classes/46 users/0 lessons/0 requests. All real user fields including credential and session fingerprint matched;no hashes/tokens printed. Missing demo data needs repair;blindly mapping all seeded=1 toseed_complete=1 is unsafe.

Regression:[948](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:948). The one partial-upgrade case proves starting3 classes/45 demo users/0 lessons/requests, preserves registrations/sessions, and requires complete school/relations.

## Compatibility repair recommendation

Add a focused legacy initialization path while retaining fresh-DB atomic batches:

1. **Complete legacy:** read seeded and verify demo school/timetable/required samples/relations before atomically adding completion. Preserve arrangements/request states/history/real accounts/data. Check existence/relations, not that normally transitioned samples still have initial states.
2. **Partial legacy:** add only missing known demo IDs/lessons/samples; conflict handling preserves existing class/user rows and credentials. Repair SQL/completion share one batch;full rollback on failure,complete only after success.
3. **Concurrency/real data:** retain passing multi-caller transaction and safely reread if another caller completes. Never DELETE users/lessons/requests to initialize or assume every old marker is complete.

This is data-version compatibility, not scope expansion. Cover complete and partial legacy states;next round run these then all **84** counts and actual Worker. Fresh-DB82pass does not establish safe upgrade.

## False positives and limits

- Cases derive from readiness/actual historical R02 state, with root explicitly requesting partial legacy;no invented reset/invalid-marker policy.
- Only legacy upgrade failed; fresh fault/retry/parallel initialization passed. Do not say all seed is broken.
- Accounts/credentials/sessions remain;repeat readiness constraints block service. No deletion claim.
- Historical stripTypeScriptTypes loads TS, not crypto polyfills;current suite uses native strip.
- EarlyCompleted stays advisory, no timing gate or one-200-only requirement.
- This agent ran no browser/externalD1/remote deployment. Root's fresh built-Worker smoke does not replace legacy upgrade smoke.

Ending product/.github remained clean with pinned trees. Later source changes require a new pinned commit/rerun, not reuse of this verdict.
