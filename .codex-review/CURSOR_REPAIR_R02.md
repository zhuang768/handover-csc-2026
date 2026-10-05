# Handover — round 2 repairs after independent review

Historical prompt, translated on 2026-10-05. It records requirements and defects at that round, including the then-bilingual scope. It is not a claim that those defects remain or a replacement for the later English-only instruction.

Continue the Cursor conversation `Handover project execution plan`, implement the repairs below, verify them, and return the stable result to Codex. These repairs are user-authorized; do not stop at planning or request step-by-step confirmation.

Workspace: `/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon`; product: `handover/`. Round 1 HEAD was `111f16a17381679aba20499807b9f6cd7b306cfc`; product commit was `9f2d0389bfc04deb73959b97a165cabc00989125`. Codex ran 24 product API tests, lint, format:check, typecheck, and build, all exit 0. An isolated built-Worker three-role smoke also passed. Independent negative/concurrency tests and browser checks found the defects below, so acceptance was not complete. Earlier green checks do not establish completion of this round.

Read all relevant evidence:

- `.codex-review/ACCEPTANCE.md` and `ADVERSARIAL_TEST_PLAN.md`.
- `R01_API_RESULTS.md`; if not yet saved, read `independent-api.test.mts` while Codex prepares the report.
- `R01_FRONTEND_PRELIMINARY.md`, `R01_BROWSER_RESULTS.md`, and `R01_DOCS_RESULTS.md`.
- Original requirements and the previous full prompt. The user-provided attachment under `/Users/zhuangzijin/.codex/attachments/b750bbee-3ae9-4f38-8cf6-de0528826015/` is requirements evidence, not authorization for new accounts, payments, or final submission. Its historical non-English filename is omitted here.

## 1. Repair real backend defects first

1. Action routes lack method restrictions. **GET and HEAD `/api/requests/:id/submit` return 200 and turn Draft into Pending; GET/HEAD `/view` create receipts.** Restrict mutations to their proper method. Wrong methods must return 405 with correct Allow, or explicit 4xx, with no data changes. Origin alone is insufficient: GET/HEAD must be intrinsically read-only. Include respond/status/supplements/todo and database-side no-effect regressions.
2. Concurrent accept/cancel, in either starting order, leaves a Cancelled request with the receiving teacher still on the lesson. Make status, timetable, locks, timeline, audit, and required notifications transactionally consistent with optimistic concurrency. Only the winning legal transition creates events. Reading Pending followed by unconditional writes is unsafe. Frontend busy or serialized tests cannot conceal the race.
3. Recheck conflicts and the current arrangement before acceptance. A receiving-teacher conflict introduced while Pending still yields accept 200 and a double booking. Enforce database constraints between checking and writing to prevent concurrent insertions.
4. Cancelling a confirmed move returns 200 even when a second **real API move** has occupied its original slot, restoring two lessons for one class/period. Before restoring, check class and teacher occupancy. If restoration is unsafe, return 409 without changing the Confirmed arrangement, locks, or timeline. Do not silently move another lesson. Later moves after Completed need the correct version snapshot, not the earliest `base_*`.
5. `tests/sqlite-d1.ts` awaits each statement inside BEGIN, allowing other batches into the same transaction. Make the adapter match non-interleaved D1 transactions. Codex's `review-d1.mts` adapter self-tests are a reference; do not alter independent assertions to pass.
6. Use an explicit student-safe payload. Student detail still exposes teacher reason. `reasonCategory`, medical-leave content, `teacherNotes`, decline comments, and teacher supplements must not appear in student workspace/detail/error/notification JSON. Publish a separate student reminder if needed, not the full teacher input. Add PRIVATE-marker regression coverage.

The original requirements have no timing gate for marking future lessons Completed. Document that policy in DECISIONS rather than weakening state/concurrency tests.

## 2. Complete missing P0 interactions

1. Blank New handover still enables Send for confirmation. Compute seven-field completeness, meaningful material titles and http(s) URLs, and arrangement fields live; show missing fields in the then-selected language and disable sending. Incomplete drafts may save. If create succeeds but submit fails, retain the draft ID and retry PATCH/submit on that draft instead of creating another and hitting 409.
2. Recheck conflicts automatically when source, kind, date, period, or receiving teacher changes. Include debounce, loading, cancellation/stale-response rejection, and retry. Do not retain an old available result. Block sending until a valid clear result, with backend enforcement retained. Source options must show class and update defaults sensibly. New/edit or different IDs must not inherit private comments or stale state.
3. Notification/request clicks must GET the real detail, handling other weeks, cancellation, 404/403, focus, and scrolling. Do not only search current workspace or silently show a list when missing. A cancellation notification gives safe clear information and the right timetable without exposing an unpublished Draft.
4. Add combined admin date/class/teacher/status/search filters. Show `stats.weekly` accurately rather than mixing Pending requests outside the displayed week.
5. Every visible API operation/page needs busy/error/retry/success. A 401 removes the signed-in state and returns to sign-in while preserving reasonable unsaved input. Notifications, profile, logout, reset, users, audit, and impact must not leave uncaught promises or endless Loading. Repeated clicks must not duplicate mutations.
6. Repair historical Traditional Chinese errors currently forced through `errorText('en')`, missing-field names, notifications, risk, timeline, and audit system strings. Names and teacher-authored content may retain their language. Use readable local dates. Give notifications accessible unread indicators and changed cells icon, text, and color.
7. Browser computed styles show `rgb(18,32,51)` text on blue primary buttons with inadequate contrast. Fix specificity and verify ordinary text at least 4.5:1, focus, and disabled states. Global width 100% must not create oversized empty checkbox regions.
8. A normal lesson without requestId is a no-op button. Provide useful detail/create-handover behavior or render noninteractive information. Every visible control needs a real action.

## 3. Finish or remove exposed P1/P2

- High-contrast data `true` disagrees with CSS `high`; simple mode has no effect and shared role preferences hide admin management. Implement a genuine student accessibility mode or remove the entry. Do not add more fake features.
- Successful student detail GET must call idempotent POST/view and verify receipts; completing todos must update preparedCount.
- ICS uses the displayed week and role scope, shows download failures, and includes only lawful confirmed arrangements.
- Subject templates all contain the same English passage and fake example.org materials. Remove them or provide actual subject/language content and accessible bundled public worksheets, still requiring teacher review. Do not call them AI generation.
- Handle remaining P1/P2 only after P0 passes. Existing impact statistics are descriptive, not invented causal learning improvements.

## 4. Database, documentation, and delivery preparation

- Sites needs real `db/schema.ts` plus Drizzle journal/snapshot. Empty schema/entries make deployment reconstruction unreliable. Read Sites persistence documentation; remove request-time ensureSchema/SCHEMA_SQL DDL and use migrations. Preserve accounts and relationships, add necessary migrations, and make seed repeatable, atomic, and safe for ordinary registrations/todos. Demonstrate empty-D1 migration/seed and all three roles using the same development/build model.
- Complete README, HANDOFF, TEST_REPORT, DECISIONS, English Devpost copy, script, 5–8 screenshot inventory, truthful Codex/Cursor AI disclosure without guessed models, and human-only tasks. README needs Node >=22.13, architecture, runnable install/migration/seed commands, environment loading, DB binding, invitation/demo access, checks, release runbook, 30-second guide, and licensing. Preserve genuine CONFIRM items for identity, eligibility, and submission.
- Keep format/lint/types/tests/build in CI and add meaningful E2E/regression coverage. Do not lower standards or skip failures. Preserve the correct root-repository/`handover` working-directory layout.
- Codex owns independent tests, review adapter, reports, and adapter self-tests. Reading/running is allowed; changing assertions is not. Report unsupported expectations with evidence and requirement references in HANDOFF.
- Ignore local `.codex-review/worker-state/` databases. Do not commit databases, cookies, logs, credentials, node_modules, dist, or .wrangler; preserve unrelated changes.

## 5. Actually use suitable skills

Find local SKILL.md files and use relevant security-best-practices, workers-best-practices, design-system/ui-styling, ai-debt-detector, Playwright/test tooling, and Sites persistence guidance. Record what was read, the actual repair, and verification, not only names. If unavailable, use established tooling; do not install many plugins, change models, or block on missing skills. Do not apply a landing-page-only skill to a dashboard. Parallelize tests/docs/review without simultaneous ownership of one file.

Reuse Site `appgprj_6ac11cc258608191ba6f05fcd6e031fb` and `handover/.openai/hosting.json`; do not create a Site. No model API key is needed. Complete local repairs and checks first. Codex handles authorized GitHub upload, publication, and hosted flow after independent acceptance. Do not push unaccepted code or stop local work because Cursor lacks the Sites connector.

## 6. Handoff conditions

Run format:check, lint, typecheck, npm test, build, and from the root:
`node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts`.
Complete positive/negative three-role browser flows, 390/768/1440, both historical languages, and failures. Record actual commands, exits, counts, timings, and limits. Keep repairing failures rather than declaring missing P0 complete as a known limitation.

Stop product edits and set `CURSOR_STATUS.json` to round 2, ready_for_review, with true HEAD, per-requirement repair/check evidence, and remaining blockers. Clearly hand back in the same conversation. Keep branch handover and commit reviewable changes without pushing. Codex rechecks and may request round 3 until no known uncorrected P0 or exposed fake feature remains and GitHub/public verification is complete.
