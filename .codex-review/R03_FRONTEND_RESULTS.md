# R03 frontend recheck: most previous defects repaired; focused interaction/mobile gaps remain

Pinned product: `f3fa696115a86f98995686b6bb934b90492133ab`; handover tree: `911adb7043d89b7487b12b9bb3d06876457699a5`. Read-only comparison against ACCEPTANCE, nine R02 findings, approved visuals, and R03 repair prompt. No Cursor/GUI/database/server/install/build. Root supplied six passing product E2E results and phone PNG observations. If the product tree changes, withdraw this verdict and recheck.

Historical review, translated 2026-10-05. Bilingual expectations below reflect that round and were later superseded by the English-only instruction.

## R02 findings rechecked

| R02                                    | R03 result                                  | Pinned evidence and limit                                                                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01 inherited language narrows desktop | Repaired                                    | CSS149–153 limits only p.prose, not all inherited zh descendants. E2E43–50 tests Traditional Chinese login1440; not all role/size combinations. Old608px measurement is not an R03 fact.                                                     |
| F02 mixed next lesson/request          | Repaired                                    | app927–933 joins lessonId to nextLesson.id for Confirmed/Completed;936–941 separately presents other handovers. Root saw10/5 Math separate from10/9. Weak E2E assertion remains below.                                                       |
| F03 detail input reuse                 | Repaired                                    | app1562–1563 keys Detail by request ID. Two-private-marker payload runtime still needed; key alone is not full privacy proof.                                                                                                                |
| F04 errors/busy/401/feedback           | Partly repaired; R03-F01                    | Logout362–389 catch/busy/finally; initialization298–305 error/retry; refresh267–269 preserves success; Detail2130–2147 busy; Profile/reset2559–2590/2654–2671 catch/busy; Users/Audit/Impact error/retry. Do not repeat “all missing catch”. |
| F05 conflict retry                     | Mainly repaired;401 still F01               | 1845–1854 retryCheck;1709–1713 clears error/failedKey; retry dependency retains fields;403 permission message. E2E clicks retry but does not wait for200/valid submit.                                                                       |
| F06 system text/time/unread            | Partly repaired;R03-F02                     | 2268–2269 Taipei Intl/six localized actions;1098–1102 risk codes;2477–2489 four notification events/times/read state. Remaining Audit/reminder/errors. Old all-ISO/raw-action report is stale.                                               |
| F07 weekly changes                     | Repaired                                    | 1021–1025 admin uses actual stats.weekly and week; root handles API week consistency.                                                                                                                                                        |
| F08 simple/template/seed               | Seed/language repaired;new simple scope bug | service619 real local worksheet;1797–1825 EN/Traditional Chinese templates. CSS now makes simple effective but not student-scoped, F03. Subject-name substitution is visible P1 quality, not a demand for a full subject-material system.    |
| F09 dark contrast pairs                | Previous pairs repaired                     | CSS281–297 primary normal/hover/active and warning use white on dark green/red. Root E2E Save profile white/#246b56;pair≥4.5:1. Whole-state/nontext/focus/44px still pending;old1.70 estimate no longer applies.                             |

## Remaining source defects and minimum acceptance

### R03-F01 — Medium: remaining API consistency gaps

[client-api.ts:29](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/lib/client-api.ts:29) only throws, without central session clearing.

| Path                                  | Remaining source fact                                                                                                                                                                                                                        | Minimum recheck                                                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Editor conflicts/save;Detail act/view | app1718/1770/2140/2124 local error without root onUnauthorized;non401 view failure ignored.                                                                                                                                                  | Expired sessions return to login on these operations; no falsely valid shell. Nonblocking receipt failure must not be called saved. |
| Profile/reset/Users/Audit/Impact      | 2585/2667 no401 session clearing;GET2700/2819 and Impact2883 treat every failure as network;no root-user clearing prop.                                                                                                                      | Distinguish401/500;401 login;others visible/retry.                                                                                  |
| Single notification read              | [app2470](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:2470) catches then opens in finally;openRequest187 immediately clears error. Busy guards reentry but button has no disabled state. | read500+detail200 preserves readable “not marked read” failure while still opening;401 avoids further expired detail calls.         |
| User toggle                           | 2765 catch exists but no busy/disabled during PATCH→GET;2782 raw code.                                                                                                                                                                       | Slow double-click writes once;refresh failure distinguishable after successful mutation;retry recovers.                             |
| Users/Audit loading                   | 2690/2810 initialize empty without loading;Audit2846 says noActivity before GET completes.                                                                                                                                                   | Loading while slow200;empty only after200;500 retry, initial/retry both.                                                            |
| Initial auth/me                       | 262 all failures just end loading,including500/offline,matching logged-out UI.                                                                                                                                                               | 401 may show login;500/offline must expose error/retry.                                                                             |

Already repaired: refresh clearing success, unhandled logout, Detail busy, workspace initialization returning false auth. Do not repeat. Preserve unsaved input and accessible success; no fake local data.

### R03-F02 — Medium: remaining historical localization/date gaps

- Profile2585 and reset2667 force errorText("en",code);Users2782 raw code.
- Notifications2485 map pending/declined/accepted/class_change only; actual reminder service1867 remains “Class change tomorrow”.
- Audit2851 forces English localWhen;2852 maps six request actions;2854 raw detail. Actual service events include demo.reset/Demo data rebuilt,2142;request.supplement/supplement,2474;user.updated/role,2582.
- Supplement2257 remains ISO while timeline is localized. Seed actor/user content need not translate.

Historical minimum: Traditional Chinese profile/reset/users422/403/401, reminder, actual register/user/reset/supplement Audit and dates; switching English updates systems but preserves authored text. Service306–315 only emits seven known missing keys and app1841 maps them; do not invent unknown dotted-key failures. Cancellation2372 now uses t, fixing former fixed-English system comment.

### R03-F03 — High: student simple preference affects later teacher/admin and hides both desktop schedules

[app107](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:107) stores global handover-prefs.simple;logout362–389 retains it;root329 has no role scope. Checkbox2628–2638 is student-only, so teacher/admin cannot disable the inherited preference themselves.

[CSS72](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/handover.css:72) hides ledger/week-grid for every simple role;at≥1100,618 also hides day-list. Student simple→logout→teacher/admin at1440 hides both schedule displays. This is a definite source path, not an independently operated GUI reproduction; root should verify. Student simple desktop also needs a usable lesson list.

Scope simple to students. Same-browser teacher/admin after student preference must retain actual1440 timetable/admin stats without clearing storage. Students at390/768/1440 retain lesson/change/todo access and can restore normal mode.

### R03-F04 — High: duplicate390px main navigation and clipped Notifications (root PNG evidence)

Root inspected pinned `docs/screenshots/05-student-390.png` with view_image: desktop main nav wraps three rows while bottom nav also shows;Notifications is clipped on the right. Source: app335–338 all-nav plus533–543 first-four bottom items;CSS347–354 mobile row/wrap and511–542 four-column bottom grid;bottom hides only≥768.

Require one clear main navigation for student/teacher/admin at390, complete reachable four targets, and retained Profile/admin extras. Historical EN/long Traditional Chinese,large/contrast,system zoom,keyboard,safe-area checks;drawer or compact tabs are choices,not a mandated library.

Guide was not expanded by default: E2E115 clicked summary before05/06. Do not report its intentionally expanded height as default. Two screenshots of the same state are not two-page coverage. PWA findings: [R03_PWA_RESULTS.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/R03_PWA_RESULTS.md).

## Visual/mobile/data evidence limits

- CSS256–261 clickable checkbox label min-height44 repairs missing height.18px input alone is not WCAG failure. Measure real clickable rect/fragments,width,height,viewport reachability;44px nav height does not repair offscreen text. Focus must remain visible above bottom nav.
- Repaired dark pairs do not prove AA. DOM/manual checks still cover light/dark/contrast/large;normal/hover/active/focus/error/disabled;buttons/links/input borders/state icons. Disabled text exemption does not waive project44px. Gradients/opacity/unresolved backgrounds require manual review.
- Fonts/fallback/Noto subset,long names,Traditional Chinese,reduced-motion,seven-field mobile/multiple materials,keyboard/screen-reader order were not independently GUI-tested this round. Editor1829 is inline,not a tested modal.
- Real detail/cross-week186–201,load generation226–252,todo2234 remain. Root previously verified saved todo/private filtering;do not repeat fake saving/private reason exposure. All raw endpoint privacy remains root's separate API acceptance.
- Template now bilingual with real material, but only subject-name substitution. Rename generic template or improve later;this P1 quality item is not a new complete-material-system P0 gate.

## What six passing product E2E cases actually prove

Root reran six cases with exit0. Read-only assertion review:

| Case                       | Actual coverage/limit                                                                                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language/full-width shells | workspace23–40 loops English login390/768/1440;locator33 includes body.first,not actual shell.41–50 Traditional Chinese login1440 only. Named role shells does not exercise three logged-in roles/all sizes/languages. |
| Student next lesson        | 57 desktop1440 only;62 skips date assertion without arrow;66 merely excludes Friday. No lesson ID/date/period/detail API identity;can pass vacuously. Root visual/source join are separate evidence.                   |
| Conflict retry             | 74 teacher1280;87/88 retry button/Room retention;90 click then91 screenshot,no200/error-cleared/submission-restored assertion.                                                                                         |
| Phone student/install      | 97 studentEnglish390;115 expands;117/118 save same state. No mobile teacher editor/admin users or logged-in768.                                                                                                        |
| Offline                    | 121–178 no real network offline/reload/navigation;see PWA report.                                                                                                                                                      |
| Dark                       | 184 admin1280,Save profile normal white/green only;not hover/active/warn/focus/nontext/all-mode contrast/44px.                                                                                                         |

Minimum focused additions: actual login/teacher/student/admin390/768/1440 shells/overflow/reachable nav under historical languages;API identity for next lesson/cross-week;two-detail private-input isolation;seven-field negative gate,multiple materials,saved-draft retry,delayed conflicts and500 recovery;success/500/401/slow-double-click for mutations;raw student privacy/todo reload;four preferences with cross-role simple;real offline/update;distinct useful screenshots. Test user outcomes rather than mirroring implementation or skipping assertions.

Historical verdict: six green cases do not prove all frontend acceptance. Most nine old groups are repaired;target R03-F01–F04 and focused negative/device evidence. Only reviewer report was written. Final delivery needs root built Worker GUI/API integration.
