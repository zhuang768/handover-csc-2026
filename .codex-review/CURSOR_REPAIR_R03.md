# Handover — round 3 repairs and repeatable delivery checks

Historical prompt, translated on 2026-10-05. Language requirements and open defects reflect this round, before the later English-only direction.

Round 2 independent acceptance did not pass. Continue the same Cursor conversation, branch, and product without recreating the project/Site or asking again about the approved design. Stable product: `73d32c1ee1a5d764d0dcf8b755b60c0de6eb808a`; status-only HEAD: `1f1fe7704f92cdc14dd6a819aedeacec909a2f2c`.

Read `R02_API_RESULTS.md`, `R02_FRONTEND_RESULTS.md`, `R02_BROWSER_RESULTS.md`, and `R02_DOCS_MIGRATION_RESULTS.md` completely. ACCEPTANCE, VISUAL_ACCEPTANCE, and R02B remain applicable. Preserve the repaired R01 vulnerabilities, seven-field gate, retained draft ID, Editor key, student privacy/todo persistence, admin filters, and light-button contrast. Do not reopen solved items or overwrite newer facts with old reports.

Root ran 24 product API cases and lint/format/types/build, all exit 0. The latest independent suite had 82 counts, 73 pass/9 fail (31 top-level API cases: 26 pass/5 fail, plus child/parent counts; not nine distinct causes). New reviewer coverage follows original seed/atomic-write requirements. Do not change assertions or skip failures. Browser issues were also confirmed.

## A. Four backend atomicity repairs

1. **Failed seed must not leave half a school.** Service lines 350–359 write seeded metadata before inserting 45 users and lessons individually. A real SQLite ABORT on lesson INSERT leaves 45 users, three classes, and a marker. After removing the fault, every role gets 200 but lessons/requests stay at zero. Write complete seed plus completion/version markers in one D1 transaction. Without a complete marker, users>0 is insufficient. Preserve ordinary registrations/relationships; do not clear the database. Keep schema-only migrations separate from seed.
2. **Eight concurrent first sign-ins must work.** One empty migrated database yields one 200 and seven 409. Use safe coordination/database idempotence and wait for a complete seed; losing attempts must not read partial state. One isolate's module promise is not cross-Worker protection. Seed fault/retry and parallel-start tests must pass.
3. **Losing CAS must not emit success events or alter timetable/locks.** Concurrent accept/decline/cancel/complete return 200+409 but create two timeline/audit events. Accept sends 26 notifications rather than 13; decline sends two rather than one. Repeating Completed after a lawful completion returns 409 but still creates events. EXISTS checks final status rather than this attempt's UPDATE; throwing after batch `meta.changes` is too late. Use a unique transition UUID/revision token written only by the successful CAS, gating lesson, locks, events, and notifications inside the batch, or an equally atomic maintainable solution. Final status, same-millisecond timestamps, post-batch throws, and frontend busy are insufficient. Add proper migration/metadata if needed. Success is exactly once; failure has no effects.
4. **Recheck actual lesson occupancy inside submit.** Pause A after conflictReport; B uses real submit→accept to occupy the same target and release Pending locks; resume A. A still becomes Pending and locks the occupied class slot. A slot_locks primary key alone is insufficient. Pending CAS/reservation must atomically check class/teacher occupancy and current source. Failure is 409, preserving Draft with no submitted events/locks. Incomplete handover remains 422; a complete conflicting request must not return 422 with missing=[]. Preserve accept/cancel safeguards.

Run from root:
`node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts`.
Do not edit review-d1 or independent cases. Product SQLite helpers/regressions may improve. The report excludes future-Completed policy, two lawful accept→cancel 200 responses, and cancellation-notification assumptions without a contract; the real failures do not depend on them.

## B. Frontend repairs beyond the happy path

1. **Historical Traditional Chinese CSS scope:** at 1440×900, zh-Hant shell/main are 608/388 wide, versus English 1440/1220. `handover.css:149` applies `.handover-root :lang(zh)` max-width 38em to all inherited-language descendants. Constrain paragraphs, not shell/main/form/buttons. Check sign-in and three roles at actual 390/768/1440 in both then-supported languages. Do not hide overflow.
2. **Next-lesson content must refer to the same lesson.** `firstConfirmed` at app842 and `nextLesson` at846 are unrelated; line883 attaches Friday10/9 P4 Maya→Jonah to ordinary Monday10/5 P1 mathematics. Join lessonId/requestId and legal public states. Without that lesson's handover, show its original arrangement. Other changes show their own date/period separately. Card and Open destination agree. Show actual dates/today/next school day; no fake weekend lessons.
3. **Isolate Detail inputs.** Detail lacks a key at app1440; comment/supplement/error initialize only at1937 and can send private input to another request. Key/reset by ID and test PRIVATE typed on A but not sent is absent on B. Editor is already fixed; Detail needs separate coverage.
4. **Complete busy/catch/error/retry/401/success.** R02_FRONTEND_F04 identifies remaining logout, mark-all-read, profile/reset, users load/toggle, audit, detail/view, and impact callers. First workspace500 must not silently return to Auth and lose its error. Refresh234 clears success feedback immediately. Use clear shared hooks/helpers, not global unhandledrejection swallowing. 401 consistently signs out while preserving reasonable input; permission/validation/network errors are localized appropriately. Busy prevents duplicates; failure is not green success; success is visible via aria-live. Failed Users/Audit loads are not empty data.
5. **Conflict retry:** failedKey leaves report=null and Send disabled forever. Add retry without losing fields, clear the error after success, distinguish401/403, and reject stale responses. Cross-week detail/notification loads need generation/abort protection so out-of-order workspaces cannot mismatch week/data.
6. **Historical system localization and dates:** timeline actions, notifications, admin risk, audit detail, missing fields, and slot periods remain raw English/UTC ISO. Render event codes using the selected locale; do not translate names or teacher-authored text. Each notification needs accessible text/icon read status; a total unread count alone is insufficient.
7. **Actual weekly count:** show `stats.weekly` and the displayed week. Lessons/pending/declined/confirmed alone must not mislabel lesson counts as changes.
8. **Exposed entries need real behavior or removal:** simple mode currently changes neither CSS nor rendering; make an actual student view without hiding admin tasks. Subject templates need genuine subject/language content and original bundled worksheets or removal. Template URL was repaired but seed at service570 still has example.org/worksheet. Seed/reset and existing known demo stubs need readable local material; preserve ordinary teacher URLs and do not hardcode an unpublished domain.
9. **Measure dark/high contrast:** enabled dark active text #10221c on #143f34 is inadequate; white warning text on #ffb4a8 or contrast #ffd0c8 is about1.70/1.39. Repair semantic pairs and actual default/hover/active/focus/error colors. Ordinary text>=4.5; necessary non-text/focus>=3. Disabled text is exempt from the WCAG threshold but must remain usable. Checkbox labels need real clickable44px targets, not enlarged noninteractive whitespace.

## C. Repeatable real-browser tests and screenshots

Use existing @playwright/test and suitable local/official guidance; no production dependency, model change, or plugin installation. Start isolated migrated D1 from this actual product with real cookies/roles, separate from shared development/root reviewer state.

At minimum:

- Actual390/768/1440 × English/zh-Hant for sign-in/student/teacher/admin. Assert actual viewport, adequate historical localized width, no page overflow, and readable long text.
- Complete draft→seven fields/material→conflict→submit→recipient decline/accept→safe student detail/todo persistence→admin search, with permission negatives.
- Next lesson versus unrelated later handover; Detail PRIVATE isolation; major500/401/retry/busy/success feedback; stale conflict responses cannot overwrite new arrangements.
- Keyboard/focus/44px, reduced motion, dark/contrast primary buttons, and actual font loading/fallback. A className alone is not evidence.

Provide runnable scripts and appropriate CI integration with official Chromium installation. Do not skip or continue-on-error. Keep sessions only in memory; do not log cookies, hashes, or recovery codes. Capture5–8 actual screens under docs/screenshots or a clear delivery location with README, not AI mockups. These are demonstration captures, not Sites thumbnails; do not add public/screenshot.jpeg without authorization.

Root CUA viewport calls still left document width1440, so no independent390 pass was claimed. Repeatable Playwright dimensions must provide evidence. Tool-call success is not render success. If tooling is unavailable, say so; never fabricate passes/captures.

## D. Database reconstruction, docs, and Git cleanup

- Fourteen-table schema/journal/snapshot and empty Wrangler D1 passed; preserve them. SQL lacks `--> statement-breakpoint` while journal breakpoints=true, so standard Drizzle sees one fourteen-CREATE prepared chunk. Add suitable generated markers/metadata chain and recheck db:generate no-op/empty D1 before first production publication. This is not a proven Sites deployment failure. New migrations remain schema/guards, not bulk seed.
- Clean README npmci→dev gives demo500/no such table users. Add a real local migrate script/config with correct source drizzle paths and the same persistence state. Built config under dist/server resolves ./drizzle incorrectly. Follow revised README from empty database through start and all four demo200 sessions; second migration is no-op. Preserve data and shared .wrangler.
- README needs Node>=22.13, architecture, .env.example loading/DB binding, migration/seed, invitation,30-second guide, licensing (truthful unlicensed is acceptable), runbook, and credits. Preserve the corrected root entry and historical notes.
- TEST_REPORT separates each revision, commands, exits, counts, and viewports; remove contradictions between tested and untested sections. Do not call the latest82-count suite a complete73-pass run. Devpost AI/Built with includes both Codex/Cursor and actual fonts/starter. Names, eligibility, guardian consent, terms, video, and final submission stay human tasks. Already-authorized GitHub/Sites is not a repeated approval blocker.
- Ignore tsconfig.tsbuildinfo and remove only its index tracking with git rm --cached while retaining the local file. Do not commit generated state, databases, dependencies, builds, logs, or credentials. Do not include or overwrite reviewer-owned work as product edits.

## E. Implementation and handback

Read suitable security/workers/diagnosis/design/ui/React/AI-debt/Playwright skills and record actual changes/evidence. Keep the approved warm-white/forest-green typography. Parallelize backend/frontend/docs/testing with separate files; do not concurrently edit app.tsx/service. Close every item, not only easy ones.

Run format/lint/types/productAPI/latest independent suite/build/empty-D1/real E2E. Repair failures or give precise verification limits. Keep branch handover, commit a reviewable product, **stop product edits**, and update root CURSOR_STATUS round3 ready_for_review with current time, true HEAD, checks, and blockers. Hand back in the same chat. Do not push unaccepted source; Codex handles authorized GitHub/existing-Site delivery after independent acceptance. No new Site, account changes, payments, or final Devpost submission.
