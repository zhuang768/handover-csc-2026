# R04 independent backend re-review results

Date: 2026-10-04, Asia/Taipei. Final pinned/clean check: **2026-10-03 18:02:41 UTC** (Taipei 2026-10-04 02:02:41). This is a translated historical record.

**The final 85/85 suite passed without regression of the original 82. Genuine historical probes still confirmed one P1 and one P2, so full backend acceptance was withheld.** Testing stopped when R05 implementation began. This report applies only to the pinned R04 candidate.

## Pinned version and clean evidence

| Item | Starting/ending evidence |
| --- | --- |
| Product SHA | `6b7b7cd734e9af06785d7f854d75dc8f3a160c6f` |
| Actual HEAD | `7e76a4a1cdccec8b212a6ad7e0b674e425dbdfb8` |
| `HEAD:handover` | `ebbe56dda33a1547d67f17367bc067fe7a6eb2ab`, identical |
| `HEAD:.github` | `8d22cea03b2477eacf2e811c5e0a99d1578df288`, identical |
| `git status --porcelain=v1 -- handover .github` | No output, exit 0 |
| `git diff --name-only 6b7b7cd734e9af06785d7f854d75dc8f3a160c6f -- handover .github` | No output, exit 0 |

No product, CI, other reviewer's assertions, 85-case suite, adapter, GUI, service, or external data changed. Only this report, the saved historical probe, and executed evidence were stored. Root separately ran formatting, types, lint, build, E2E, and Worker checks; those are not claimed as this agent's checks.

## Actual commands and results

CWD: `/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon`; Node `v26.3.0`.

| Command | Exit | Actual result |
| --- | --- | --- |
| `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts` | **0** | **85 tests/85 pass/0 fail/0 skip/0 cancelled**, 1175.370916 ms |
| Three genuine historical stdin probes, `node --experimental-strip-types --input-type=module <<'NODE'` | **1** | **3 tests/1 pass/2 fail/0 skip/0 cancelled**, 140.757875 ms |
| Reviewer `tsc --noEmit`, below | 0 | Existing API suite/adapter types passed |
| Stdin inventory/journal/snapshot/actual SQLite index/PK probe | 0 | 0000/0001 loaded; token/snapshot chain/teacher unique/slot composite PK agreed |
| Saved `historical-upgrade-probe.mts` with the same tsc options | 0 | Script types passed; not run against moving R05 |

```sh
node handover/node_modules/typescript/bin/tsc --noEmit --module ESNext --moduleResolution Bundler --target ES2022 --allowImportingTsExtensions --skipLibCheck --typeRoots handover/node_modules/@types --types node .codex-review/independent-api.test.mts .codex-review/review-d1.mts handover/node_modules/@cloudflare/workers-types/index.d.ts
```

The 85 counts comprise API 83 (34 top-level + 49 child) and harness 2. Complete legacy case 925, zero-lesson partial case 948, and both complete/partial edited-preservation phases at 979 actually passed, without stopping at phase 1, skipping, or weakening assertions.

## Original regressions and SQL verification

All R01 34 GET/HEAD subcases wrote no tables, including receipts. Both accept/cancel orders, legally occupied restoration slots, and late receiving-teacher collisions passed. R02 actual seed-fault/retry, eight parallel startups, failed-CAS event/audit/notification isolation, atomic stale-submit lesson/lock recheck, incomplete PATCH/submit races, raw student privacy, and subsequent-move restoration passed. Sessions, recovery, cross-class scope, Origin, and reset preserving ordinary accounts/dependencies/todos/views were green.

SQL inventory, `appliedMigrations`, and journal matched `0000_init.sql` and `0001_opposite_kree.sql`; there was no R04 migration addition. 0001 ALTERs nullable TEXT `transition_token`, with prevId linked to 0000. The teacher-slot index is unique; slot_locks has `(scope,scope_id,date,period)` composite PK. Adapter synchronous transactions, original rollback errors, and CAS metadata were unchanged; harness 2/2 passed. No manually 0000-only false pass.

## [P1] genuine legacy DB with one lesson is permanently mislabeled complete

Use **actual R02 SHA `73d32c1ee1a5d764d0dcf8b755b60c0de6eb808a` service/0000/time**, not arbitrary marker edits. A lessons BEFORE INSERT trigger raises ABORT on INSERT 2. First R02 demo: HTTP **500**, counter **2**, state `seeded=1`, **3 classes/45 users/1 lesson/0 requests**. Remove the fault and register a teacher normally with R02: old auth/me **200**, users **46**. Apply actual current 0001 and use the actual R04 handler.

R04 same-session auth/me returns **200**. All ordinary user fields, including credentials, and session fingerprints are preserved, yet counts remain **3 classes/46 users/1 lesson/0 requests**, now with `seed_complete=1`. Expected 120 lessons, actual 1: FAIL. The first-INSERT fault negative control correctly restored 120 lessons/7 requests: PASS. The issue affects valid partly committed lessons, not every partial state.

Cause: [service.ts:418](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:418) checks only `lessons>0 && demoClasses>=3`, writes the marker at 419, and returns at 420. [361](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:361) then treats a marker plus any lesson as ready, preventing repair. Historical R02 lines 350–359 seed per row, so a real fault can produce this state.

[CURSOR_REPAIR_R04.md:17](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/CURSOR_REPAIR_R04.md:17) already required verifying complete schools and filling missing partial relations. This is no new feature. Validate known records/necessary relations; insert missing rows and completion in one batch, preserving edited rows/accounts/sessions/ordinary data. Never reset or equate one lesson with completeness. Later request-INSERT faults were not tested or claimed.

## [P2] known demo worksheet stub survives complete legacy upgrade

Actual complete R02 `demo-request-confirmed` material is `{title:"Practice worksheet",url:"https://example.org/worksheet"}`, historical service line **570**. An ordinary teacher's own Draft, created through the actual old API, uses the **same URL** with a different custom title, `is_demo=0`.

R04 ordinary session returns **200**. **3 classes/46 users/121 lessons/8 requests** are unchanged; ordinary account/session/custom request rows are preserved. The known original demo stub remains **1**, expected 0: FAIL.

New seed [service.ts:646](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:646) uses `/worksheets/class-practice.txt`, but complete legacy returns at 418–420 without narrow repair. [CURSOR_REPAIR_R03.md:30](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/CURSOR_REPAIR_R03.md:30) explicitly required readable owned materials for seed/reset **and existing demo stubs**.

Minimal repair identifies known demo IDs plus original default title/URL, or equivalent seed-version evidence, replaces only that material, and preserves other handover fields. Never replace every example.org URL or ordinary/demo custom materials. The 85-case preservation fixture already used the new URL, so its green full-row check does not prove old-stub repair.

## Reproducible evidence and false-positive audit

- Actual three-probe summary: [R04_HISTORICAL_PROBE_OUTPUT.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/R04_HISTORICAL_PROBE_OUTPUT.md). Saved executable: [historical-upgrade-probe.mts](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/historical-upgrade-probe.mts). Next pinned candidate: `REVIEW_APP_TREE=<PINNED_TREE> node --experimental-strip-types --test .codex-review/historical-upgrade-probe.mts`. Separate from 85 counts; not run after source started moving.
- Complete ordinary session/zero-lesson partial repair genuinely passed. R03's universal legacy 409 is not relisted; credentials/sessions were not deleted.
- Second-lesson failure is genuine historical seed interruption using actual old API/migration/SQL fault, not arbitrary corruption or permission bypass.
- Material failure concerns only the known original stub; ordinary same-external-URL preservation was proved. External URLs in general are not violations.
- One inventory probe wrongly assumed `lessons_teacher_slot_unique`/`slot_key`, exit 1. Actual names `lessons_one_teacher_slot`/composite PK corrected the lookup, exit 0. Reviewer lookup mistake, not schema defect; no product/assertion changes.
- One read-only rg used the wrong docs subdirectory, exit 2. Actual root HANDOFF/DECISIONS were then read; invented missing paths were not reported as product bugs.
- Future Completed remains advisory; legal dual accept/cancel success is allowed. No extra unagreed rules/dependencies/remote actions/crypto polyfills.

Final product/CI were clean and trees matched the candidate. R05 must rerun 85 cases and three historical probes rather than reuse the R04 verdict.
