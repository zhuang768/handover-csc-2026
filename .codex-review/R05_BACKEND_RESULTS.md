# R05 backend repairs and source verification

Date: 2026-10-04, Taipei; owned source finally released **2026-10-03 18:33:52 UTC**. After Cursor stopped at its quota, root explicitly authorized Codex's reversible R05 backend repairs. Cursor settings were unchanged. After initial release, independent review confirmed the preservation boundary for edited sample lessons in partial schools; root authorized a focused repair. Final blobs below are authoritative. This is translated historical evidence, not a new execution.

## Scope

Only two product files changed; no commit, push, deployment, shared DB reset, service, or GUI operation:

| File | Released blob SHA |
| --- | --- |
| `handover/server/service.ts` | `145faf7f27e82e44f2e56ea44e4ca33993c47932` |
| `handover/tests/api.test.ts` | `a43383679244dae8ea2171f682e3e486695d8b13` |

Product writes stopped after release. Other agents owned frontend/E2E/docs. This repair record was **not yet the final independent verdict for an integrated pinned SHA**.

## Behavior repaired

- Add one-time `meta.seed_revision=2`. R04 falsely complete one-lesson schools still enter repair. Missing data and new completion markers share one D1 batch; faults leave no partial repair.
- Infer original seed week from immutable existing demo lesson IDs. Legal moves retain IDs, so upgrade does not create another current-week school. Add only missing classes/users/lessons. `WHERE NOT EXISTS(id)` avoids reinserting legally moved lessons; `ON CONFLICT(id) DO NOTHING` handles concurrent identical IDs. Other teacher-slot conflicts still roll back without broad ignore.
- Skip entire existing request IDs. Never replay their timetable/timeline/notifications/locks or edit handovers/supplements/todos/views. Missing samples get fresh UUID tokens. Same-batch `id AND transition_token` gates initial effects; concurrent losers cannot duplicate events or restore over a winner's arrangements.
- If a missing sample's existing lesson differs from seed baseline, preserve teacher/date/period/room and insert an inactive `Cancelled` sample with original/target snapshots of the actual current arrangement. No fake confirmed/completed events, student notifications, locks, or template overwrite. Unchanged missing lessons/samples retain default states.
- Material repair targets only seven known sample IDs, `is_demo=1`, exact `Practice worksheet` plus `https://example.org/worksheet`, and items containing only title/url. Replace with owned `/worksheets/class-practice.txt`; preserve other materials/fields. Original handover_json CAS protects concurrent edits. Ordinary same-title/URL and renamed demo items remain. Revision makes repair idempotent.

Used workers-best-practices and read [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)/[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/). No dependencies, external services, migration DDL, auth, or permission changes. Transactions use established prepared SQL/batch.

## Product regressions

Two focused top-level API cases were added: 24→26; reviewer suite remains 85.

1. **One-lesson atomic repair and established-arrangement preservation:** phase 1 includes R04 false completion, edited profile/retained room, ordinary registration/valid session. A real missing-lesson INSERT fault must roll back data/repair markers. After removing it, four parallel callers all return 200: 3 classes/45 demo + 1 real users/120 lessons/7 samples/14 timeline/14 notifications/4 locks, no duplicates, credentials/session/existing rows preserved; retry is idempotent. Phase 2 in the same top-level case retains the first 20 lessons without samples. Actual teacher API move→submit→accept→Completed→supplement changes date by one week, period, and room before legacy repair. Require all 20 lesson rows and established request/timeline/supplement/notifications unchanged. Missing Confirmed template becomes Cancelled with accurate original/target and no fake events/locks; final 120 lessons/7 demo + 1 established requests.
2. **Narrow material repair:** replace known original stub while preserving custom materials/progress/private notes. An actual ordinary teacher registers and creates a Draft through the API with the same title/URL; full row survives. Another known demo with an edited title remains unchanged. Repeat call makes no writes; credentials/sessions remain unprinted and unchanged.

## Commands actually run

| Command | Exit | Result |
| --- | --- | --- |
| `node --experimental-strip-types --test --test-name-pattern='one-lesson legacy school' tests/api.test.ts`, new preservation assertion before fix | **1** | **1 fail**; initial repair changed actual teacher0→1, period5→4, established room→A201, proving overwrite |
| `node --experimental-strip-types --test tests/api.test.ts`, handover CWD, final repair/format | **0** | **26/26 pass, 0 fail/skip/cancelled**, 390.505458 ms |
| `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts`, repo CWD, final repair | **0** | **85/85 pass, 0 fail/skip/cancelled**, 1414.662 ms; existing assertions unchanged |
| `node node_modules/prettier/bin/prettier.cjs --check server/service.ts tests/api.test.ts` | 0 | Owned formatting passed |
| `node node_modules/eslint/bin/eslint.js server/service.ts tests/api.test.ts` | 0 | Owned lint passed |
| Targeted tsc below | 0 | Owned backend/API types passed |
| `git diff --check -- handover/server/service.ts handover/tests/api.test.ts` | 0 | No whitespace errors |

```sh
node handover/node_modules/typescript/bin/tsc --noEmit --module ESNext --moduleResolution Bundler --target ES2022 --allowImportingTsExtensions --skipLibCheck --typeRoots handover/node_modules/@types --types node handover/server/service.ts handover/tests/api.test.ts handover/node_modules/@cloudflare/workers-types/index.d.ts
```

After final focused repair, 26 API/85 reviewer/owned format/lint/types were rerun green, with no extra reviewer counts. Root would integrate frontend/docs and run full format/lint/types/build/E2E/Worker/pinned review. This working-source result was not a release verdict.

## Normal API concurrency between snapshot and batch

Root and this agent verified actual handleApi awaits `seedIfEmpty(db)` before any route/session/business mutation. No current API can edit lessons before its readiness repair.

If B finishes repair after A's snapshot but before A's batch, B's atomic batch establishes the same known sample IDs, B's unique token, and completion/revision before B's legal mutation. A's later batch cannot insert existing IDs. A's lesson/timeline/notify SQL requires A's token and has zero effects. B's later lesson mutation/token rotation cannot produce A's token. If B starts schoolReady, an earlier repair already finished and A is likewise a token loser. Existing samples are skipped during collection.

Atomic batches, same sample IDs, and unique tokens protect this authorized current API sequence. No extra CAS/gates for hypothetical external DB writers or mixed-version direct writes were added. Root explicitly requested source freeze and no schema/auth/reviewer test expansion.

## Historical probe limits

Saved [historical-upgrade-probe.mts](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/historical-upgrade-probe.mts) retains the same three probes/business assertions, separate from 85 counts. Initial saved TS parameter properties were incompatible with native stripping; only Statement constructor became explicit fields, without assertion/adapter semantic changes. Root accepted this execution-format fix.

Three probes awaited the integrated pinned candidate and clean source:

```sh
REVIEW_APP_TREE=<PINNED_HEAD:handover> node --experimental-strip-types --test .codex-review/historical-upgrade-probe.mts
```

This record does not claim unexecuted new-source passes. Actual R04 stdin 1 pass/2 fail remains in [R04_HISTORICAL_PROBE_OUTPUT.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/R04_HISTORICAL_PROBE_OUTPUT.md), not rewritten as pass.

### Saved-wrapper baseline-guard false-positive audit

Pinned R05: `9538135128b95cf2d14db9f154d7aac53ba86e46`, tree `f611d50eaaa655e955d8ac113f7b55bd41cae6f3`. Root's initial saved three-probe run stopped at raw 0000 equality **before all three upgrade business checks**. Wrapper failures were not reproduced product defects.

R02 blank separator lines became **13** Drizzle `--> statement-breakpoint` parser comments in R03/R05. Actual table/column/index/constraint DDL was unchanged. Root compared both strings after `sql.replace(/^--> statement-breakpoint$/gm, '')`, preserving newlines and all other whitespace/case/SQL/comments/business assertions.

At **2026-10-03 18:41:23 UTC**, this agent read-only verified pinned HEAD/tree/product CI clean and marker-only diff. Independent stdin string probe **exit 0**:

```json
{"rawEqual":false,"normalizedEqual":true,"legacyMarkerCount":0,"candidateMarkerCount":13,"normalizedBytes":3849,"normalizedSha256":"d354f114786516e6b7e1d7859dcef5a556d1d6d01b5f6528e9eb8b76e2515c08","realDDLChangeRejected":true}
```

Negative control removed period from the teacher unique index only in memory; strict comparison still rejected that real DDL change. Removing one proven schema-irrelevant parser marker **does not weaken business acceptance or allow DDL rewrite**. This agent changed no probe/product/tests.

Initial independent normalization also removed marker newlines, causing separator inequality/exit 1. Root's exact newline-preserving regex produced exit 0 above. That reviewer string-normalization mistake is not a product defect.

At this record's end, this agent verified only the wrapper guard. Root would rerun actual business probes; their verdict requires full business output, not inference from normalization pass.
