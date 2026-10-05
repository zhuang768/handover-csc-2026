# R02 frontend recheck: not yet accepted

Pinned product commit: `73d32c1`; root HEAD: `1f1fe77`. The warm-white/forest-green direction with Manrope + Noto Sans TC had been approved. Approval was not implementation or acceptance evidence. This is a historical review translated on 2026-10-05; its bilingual expectations were subsequently replaced by the user's English-only requirement.

Scope: read-only review of app.tsx, handover.css, i18n.ts, client-api.ts, shared types, relevant service presentation, materials, and font assets against ACCEPTANCE.md, CURSOR_REPAIR_R02.md, and CURSOR_VISUAL_R02B.md. No Cursor/browser operation, server, install, build, or database access. “Browser confirmed” below attributes evidence to root; other findings distinguish source facts from unverified risks.

## Repairs confirmed in source; do not repeat stale R01 findings

| Requirement                           | R02 source evidence                                                                                                                                                                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seven-field completeness/submission   | app 1454 validates six text fields and materials; 1545 arrangement completeness; 1851 localized missing list; 1900 disables for incomplete/checking/invalid report/conflict. Negative runtime cases still required.                                  |
| Automatic conflicts/stale result      | 1554–1607 uses arrangement key, 300ms debounce, generation, and matching report key. Failure retry still missing, F05.                                                                                                                               |
| Retry saved draft after failed submit | 1613–1622 retains created ID and retries via PATCH; duplicate-create issue repaired.                                                                                                                                                                 |
| Source class/defaults/editor reset    | 1689 includes class; 1638–1646 synchronizes target date/period/room; 1394 keys Editor. Detail isolation remains F03.                                                                                                                                 |
| Real cross-week detail GET            | 157–189 fetches detail and target week; 1305–1307 focused-detail fallback; 404 message, 401 clears session. Notification/reload race pending runtime.                                                                                                |
| Student private reason                | UI 1988–1992 hides reason from students; 2023 hides teacherNotes. Service 1033/1052–1053/1065/1068–1069 excludes notes/reason/comments/supplements. Root confirmed no private reason in student UI; raw endpoint privacy belongs to root API report. |
| Persistent student todo               | app 2045 uses real todo endpoint. Root confirmed reload persistence; do not report fake saving.                                                                                                                                                      |
| Admin combined filters                | 1289–1303 combines query/status/date/class/teacher; 1347–1377 provides controls. Weekly statistic remains missing.                                                                                                                                   |
| Normal lessons/icons/incoming         | 1038–1047 replaces no-op lessons with content/teacher create; 989–1008 state icons; 911–924/1229–1250 incoming list; 945–968 student This Week summary.                                                                                              |
| Visible P1/P2 improvements            | CSS94 contrast matches true; app273 admin nav unaffected by simple;1945 view POST;100/1127 selected-week ICS/error catch;1657 real local template material. Remaining F08.                                                                           |
| Approved visuals                      | Tokens/fonts/paper/green implemented; desktop teacher board, student next lesson, admin ledger exist. Former blue specificity issue no longer applies unchanged. All-state contrast/font coverage not declared passed.                               |

## Remaining defects and minimal acceptance

### R02-F01 — High: inherited Traditional Chinese selector narrows desktop layout (root browser confirmed)

[handover.css:148](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/handover.css:148): `.handover-root :lang(zh)` matches every descendant inheriting the language, including shell/main, imposing max-width:38em. Root measured at 1440px: English shell/main 1440/1220px; Traditional Chinese 608/388px.

Limit line length to paragraphs or explicit text containers. Historical recheck: login and three roles at390/768/1440, both languages, full shell/main width, no page overflow, sensible long-text wrapping.

### R02-F02 — High: next lesson mixes a different request's teachers/reminder (root browser confirmed)

[app.tsx:842](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:842): `next` is the first Confirmed request,842–845; `nextLesson` is independently sorted future lessons,846–850. Lines883–889 attach next's teacher/room/reminder without matching lessonId/requestId. Root saw Monday2026-10-05 P1 Math/Maya with Friday2026-10-09 P4 Maya→Jonah details; Open handover opened Friday.

Only associate the next lesson's request. Separately label other upcoming handovers with their real date/period. Reproduce normal early lesson plus later confirmed request; text, destination, and API ID must agree.

### R02-F03 — High: another detail can inherit private comment/supplement

[app.tsx:1440](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1440): Detail lacks a request key. comment/supplement/error initialize only once,1937–1939; request effect1940–1946 only focuses/records view. Handlers2105/2117/2145 can send previous input to the new request. Editor's repaired key does not repair Detail.

Key/isolate/reset detail input and error per request. Enter a unique PRIVATE marker on A without sending, open B, and ensure B fields/payload exclude A. Returning to A must follow an explicit draft policy.

### R02-F04 — High: API errors/busy/retry/session/success gaps remain

The wrapper only throws ApiError, client-api29; it does not centrally expire sessions. Representative handler: [app.tsx:2307](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:2307).

| Path                                   | Source fact                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logout                                 | 315–324 await without catch/busy; failure has no message.                                                                                                     |
| Notification read                      | 2220–2223 no catch/busy; single2235 sends error to green success notice364–367, then finally opens/reloads and clears it.                                     |
| Profile/demo reset                     | 2307–2324/2389–2393 no catch/busy; RESET DEMO gate exists but repeated clicks remain possible.                                                                |
| Users/Audit reads                      | 2413–2416/2495–2498 no catch/loading/retry; failed Audit appears noActivity.                                                                                  |
| User toggle                            | 2459–2469 mutation and refresh GET both lack catch/busy.                                                                                                      |
| Detail response/supplement/status/todo | 1947–1960 local catch but no busy lock;2099/2111/2140/2156/2171 not disabled.401 shows error without clearing session.1945 view fire-and-forget has no catch. |
| Impact                                 | 2533–2550 catch but no retry; all HTTP errors labeled networkError;401 session retained; new week does not reset failed.                                      |
| First workspace failure                | 245–262 returns AuthScreen with no load error when workspace null.                                                                                            |
| Success feedback                       | 234–236 refresh clears message immediately; mutations1623–1625/1951–1952/notification/profile/reset set success before refresh.                               |

Recheck every visible action with500/offline,401,and success. Require visible recoverable errors, retained reasonable input,401 login, duplicate-write protection, audible/visible success, and no unhandled rejection. Include profile/reset/users/Audit.

### R02-F05 — Medium: failed conflict check has no same-arrangement retry

[app.tsx:1586](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1586): catch sets failedKey=current key, checking false, report null;1905 disables submission without report. The effect reruns only on dependencies; no explicit retry. Catch conflates401/403/validation, and successful recheck does not clear old error.

After first conflicts500, retry without changing fields; later200 restores valid submission and clears old error.401 logs out,403 shows permission error, stale results remain ignored.

### R02-F06 — Medium: generated text/times not fully bilingual; per-notification unread marker missing

[app.tsx:2080](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:2080) renders timeline action and ISO time directly. Notifications2242–2244 render title/createdAt; risk980 and service1907/1914 render English; Audit2508–2510 renders action/detail/time. Fields1678 join raw keys; cancellation2178 stores a fixed English comment; availableSlots1881 hardcodes P. Per-item unread text/dot/ARIA is missing; nav count is not its replacement.

Root observed UTC ISO and created/submitted/confirmed in Traditional Chinese. Seed actor names and teacher-authored content may stay English; system actions/formats needed localization under historical requirements. Recheck all transitions, notifications, risks, Audit, missing fields, readable local time, accessible read/unread state, and student privacy. This historical bilingual gate is now superseded.

### R02-F07 — Medium: weekly-change statistic not displayed

[app.tsx:893](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:893) ledger only uses lessons.length/pending/declined/confirmed,893–909. No app reference to stats.weekly despite shared type110 and service1887–1892.

Show explicit weekly changes and selected week using actual stats.weekly; verify against API across week navigation. Lesson count is not change count.

### R02-F08 — Medium: visible simple/template promises incomplete; seeded material still placeholder

[app.tsx:2362](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:2362) saves simple mode but root282 is its only use; CSS/student render does not react. The old admin-nav hiding bug is repaired, not repeated.

Template1648–1664 substitutes subject into otherwise identical English content without language/subject distinction. Its local `public/worksheets/class-practice.txt` exists; do not call that template URL fake. Separately [service.ts:570](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:570) still seeds `https://example.org/worksheet`, observed by root.

Implement real promised differences or remove entries. Every demo material must open real content. Replacing a seed stub must repair existing demo records, not only the generator.

### R02-F09 — Medium: dark control static color pairs below threshold; computed recheck required

[handover.css:272](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/handover.css:272): dark button text#10221c on active green-2#143f34,26/278–279, gives≈1.41:1. Warning299–300 retains white on dark danger-fg#ffb4a8,82,≈1.70:1; dark+contrast#ffd0c8,120,≈1.39:1. These are source pairs/formula estimates, not measured browser or whole-page WCAG verdicts.

Check light/dark/contrast combinations and normal/hover/active/focus/error computed colors. Enabled ordinary text≥4.5:1; necessary nontext/focus≥3:1. Complex backgrounds require manual assessment. Disabled text is exempt from that WCAG failure, while project44px touch gate still applies.

## Pending root browser/DOM verification

- Cross-week race: openRequest169–172 loads new week; notification finally2237–2238 also reloads old render's week. load192–221 lacks generation/AbortController. Delay/reverse old/new workspace responses; verify week/detail alignment. Source risk, not claimed reproduction.
  -44px/focus: checkbox253–258≈18px; label231–236 lacks min-height. Measure actual clickable label fragments, not blank row area. Prioritize Profile/todo, sticky-nav focus visibility, sensible detail return.
- Login/three roles at390/768/1440 in historical EN/Traditional Chinese: mobile sidebar wraps all nav323–339 alongside bottom-nav485–503. Verify ordering/long form/text/keyboard. Editor1667 is inline, not a tested modal.
- Fonts/license/fallback: CSS1–17 local woff2/swap; notices/CREDITS3–6 exist. Noto small subset needs document.fonts and real glyph/long-name/fallback verification. Family name alone does not prove all glyph coverage; “sc” license filename alone does not prove incorrect glyphs.
- Motion/data: CSS589–602 transitions only for no-preference; measure reduced motion/slow network. Real timetable/notification/state/view/todo data; weekend empty/cancelled notification positive/negative cases.
- Review-owned dom-visual-probe.js is read-only diagnostics: short labels, rects, solid-color contrast candidates, overflow/fonts/focus, manual flags for uncertain backgrounds. It is not product E2E or AA proof.

## Verification and historical verdict

Read-only requirement/source/handler/API comparisons, static selector/color/touch checks, material/notices existence. The owned DOM probe passed syntax plus10 isolated mock checks. No product lint/types/tests/build rerun, and other root results were not promoted to full frontend acceptance. Only this report was created.

Known P0 and approved-visual defects remained. Priorities: F01–F04, thenF05–F07 and visible incomplete features/modes. Recheck using VISUAL_ACCEPTANCE and actual API/browser evidence after repairs.
