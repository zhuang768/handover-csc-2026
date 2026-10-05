# R01 frontend requirements review: preliminary, recheck after completion

Review date: 2026-10-03, Taiwan time. Cursor had marked ready_for_review and stopped product edits. This is the historical preliminary static review, pending the root agent's independent browser and API verification. It is not a final acceptance report. English translation on 2026-10-05 preserves the pinned evidence and findings. Historical bilingual requirements were later superseded by the user's English-only instruction.

Pinned root HEAD: `111f16a17381679aba20499807b9f6cd7b306cfc`. The three frontend SHA-256 values below matched the earlier construction snapshot; relevant lines were rechecked. Explicit P0 requirements from `.codex-review/ACCEPTANCE.md` and the original attachment were treated as blockers. Visible P1/P2 entry points were checked for real behavior without requiring every unclaimed P1/P2 feature.

No server, installation, build, Cursor operation, local database access, or product edit was performed in this review. The root agent's build exit 0 did not prove the interactions below. The server GET mutation issue was tracked separately by root.

Sources: original P0 items 1–9, `docs/API_CONTRACT.md`, `shared/types.ts`, `components/handover/app.tsx`, `handover.css`, `lib/client-api.ts`, and `lib/i18n.ts`.

Snapshot SHA-256:

- app.tsx, 2079 lines: `0554a09e2cde9a2c8332769a00e8c41050d9b2fc800425579c7ed907e1f3ca27`
- handover.css, 372 lines: `477102eb5516024ff26d0b45d7333090cc7b6db1443572fdef6e64ca9023d1ef`
- lib/i18n.ts, 577 lines: `ca3bcc55eaad3f84c2666e9347f687fa2ba6fab9a9ad2b9a9cf5a30531217874`

All app line references below identify the pinned `handover/components/handover/app.tsx`. Later revisions may change these line numbers.

## Findings

### R01-01 [HAND-01, UX-04] P0 blocker: required handover submission gate missing

At [app.tsx:1436](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1436), submit was always enabled `type="button"`, with no completeness calculation, disabled gate, or missing-field list before submission. The six text fields/material inputs lacked required attributes. `missing` was set only from caught API fields, lines 1192–1196, and raw keys were rendered before line 1230. `save(true)` bypassed native date/period validation.

An empty form could create a request and attempt submit. Server rejection did not satisfy the explicit UI requirement. Recheck each of seven fields, whitespace-only values, the sole material, and missing material title/URL: submit must stay disabled with immediate missing-field feedback, while incomplete handover drafts remain saveable.

### R01-02 [REQ-02, UX-04] P0 blocker: conflict checks were manual and stale

At [app.tsx:1174](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1174), `check()` was triggered only by the button at 1398. Source, kind, target date/period/room, and recipient changes did not recheck or clear `report`. There was no loading, catch, cancellation, or stale-response guard. The button permanently said “Checking…”. Available slots/candidates were plain text; lack of click-to-select was not counted as an independent P0 blocker.

Recheck automatic checks after changes, disabled submission while checking, recoverable failure, and delayed out-of-order responses. Only the latest arrangement may determine availability.

### R01-03 [NOTIF-02, UX-05] P0 blocker: opening notifications depended on the current week's requests

At [app.tsx:999](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:999), detail was selected only through `workspace.requests.find(selected)`. The UI never fetched GET `/api/requests/:id`. Notification lines 1745–1748 only selected/opened the ID. Server notifications were not week-limited, `service.ts:1626`, while student requests were, 1573–1584.

Older-week, cancelled, or otherwise excluded IDs could become read and navigate to a list without detail or an explicit unavailable explanation. Detail appeared after the entire list, line 1096, with no focus or scroll movement. Recheck confirmed/cancelled requests in another week: load real detail or a clear permission/cancellation error and move focus to the result.

### R01-04 [ACL-02, STUD-01] P0 privacy blocker: students received private absence reasons

At [app.tsx:1505](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1505), `request.reason` was rendered without role filtering. Server `presentRequest` removed teacherNotes, 1047, timeline comments, 1079, and supplements, 1082, but returned reasonCategory/reason, 1066–1067.

Private medical/leave text could reach both student raw JSON and UI. Recheck distinct PRIVATE markers in reason and notes across student workspace, detail, and notifications, including raw payloads. Teachers must retain authorized access. Also check declined comments and supplements.

### R01-05 [ADMIN-01] P0 blocker: admin request filters and weekly-change statistic missing

At [app.tsx:987](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:987), requests had only query/status/date filters. Timetable class/teacher controls changed workspace lessons; service request queries, 1573–1584, did not apply classFilter/teacherFilter. Overview 733–749 showed lessons.length, pending, declined, and confirmed, but not `workspace.stats.weekly`.

Recheck combined date/class/teacher/status/search filters and a true weekly-change count. Other-week pending/declined work may remain visible but must not be miscounted as this week's changes.

### R01-06 [AUTH-01, REQ-03, UX-04] P0 quality blocker: API failures and busy states missing

No try/catch existed for notification read, 1732/1745, profile, 1816, demo reset, 1898, users toggle, 1968, logout, 250, and conflict checks, 1174. Users/Audit/Impact reads, 1922/2004/2040, used only `then`. Demo auth buttons, 655–679, Editor save, and Detail act lacked busy gates.

401/403/422/500 or offline could yield only console errors or permanent loading. Repeated clicks could issue simultaneous mutations. Create followed by failed submit, 1181–1188, lost the saved ID; retry could create another draft. Mutations set success before `onReload=refresh`, which immediately cleared it, 174–176. Top-level load did not clear session on 401, 152; first workspace failure rendered AuthScreen without top-level error, 185.

Recheck each visible API action under 401/403/409/422/500/offline and success: visible recoverable errors, retained input, no false success, one mutation per action, retry using the saved draft, correct session expiry, and visible success feedback.

### R01-07 [UX-01] Historical bilingual P0 blocker: generated errors/events remained English

At [app.tsx:1195](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1195) and 1474, `errorText("en", code)` was fixed to English. Raw API field keys, 1226, timeline.action, 1592, notification.title, 1751, risk.message, 778, and audit.action, 2017, were rendered. Examples included service-generated “Class change tomorrow”, 1536, and “is still unconfirmed”, 1654. Language control labels, 246/514, were hardcoded. document.lang switching already existed, 75/82, so it was not reported as missing.

The historical recheck required localized system text, field names, errors, and ARIA labels when switching to Traditional Chinese; names, subjects, and user-authored seed materials could remain English. This expectation is historical, not the current English-only policy.

### R01-08 [UX-03] P0 contrast risk: higher-specificity rule overrode primary button text

[handover.css:62](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/handover.css:62), `.handover-root button { color: inherit }`, outweighed `.btn { color: #fff }`, 150–155. Light primary buttons were expected to inherit ink `#122033` over cobalt `#1d4ed8`; demo secondary used `#16345c`.

Static WCAG calculations were approximately 2.45:1 and 1.31:1, below 4.5:1 for ordinary text. No browser computed styles were measured, so these estimates alone did not prove actual rendered results or whole-page compliance. Recheck computed colors, focus, disabled states, and dark badges at 390/768/1440.

### R01-09 [REQ-01, UX-04] P0 workflow risk: source identification and editor/detail isolation

At [app.tsx:1233](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1233), changing lessonId left target date/period/room at the old initial values. Source options, 1237, omitted className; teachers teaching the same subject in multiple classes could not distinguish them. Fallback choices, 1127, allowed any lesson with originalDate rather than only editable sources.

Editor lacked a key, 1054, and state did not reset when `existing` changed; New handover could reuse an old request's content. Detail also lacked a key and could carry comments/supplements into another request. Recheck clear date/period/class labels, synchronized source defaults, edit-to-new reset, and A-to-B detail isolation of private text.

### R01-10 [UX-05, visible P1/P2] Visible extra features were ineffective/incomplete

- Normal lessons were buttons with no-op handlers when requestId was absent, [app.tsx:800](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:800).
- Viewed count was displayed, 1572, but no `/api/requests/:id/view` request existed.
- Template, 1199, filled every subject with the same English content and an example.org material URL, automatically satisfying all seven fields. Remove the entry or provide a clearly editable, real starting point.
- Root wrote `data-contrast="true"`, 216, while CSS 43/51 matched `"high"`, so the toggle did not change styling.
- Simple mode only wrote data-simple, 217; CSS had no matching rules. The student view did not simplify, but global prefs.simple could hide admin navigation on next login, 208.
- Calendar download, 86–95, silently returned on non-200 with no visible error. This was visible P1 quality, not a demand for subscription support.

### R01-11 [SCHED-02, STATE-02, STUD-01] Role next actions and change markers incomplete

At [app.tsx:806](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:806), changes had text/color but no required icon. Overview computed incoming at 704 but used only incoming[0]; Requests, 990, lacked an “Awaiting my confirmation” grouping. Student Overview, 751–766, showed today's lessons without per-lesson preparation/task summaries; the week timetable was another route without a homepage Today/This Week entry.

Recheck text + icon + color markers; all Pending requests with recipientId equal to the current teacher; and clear student Today/This Week access with what to bring/submit/reminders and persistent tasks. A single next-step button or detail-only tasks do not meet the historical homepage requirement.

## P0 requirement matrix

| Requirement          | Static wiring present                                                                                                       | Gap/recheck                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1 Accounts/roles     | Password login, two registration types, invitation, recovery, four real demo APIs, profile PATCH, logout POST, me bootstrap | Session expiry, errors/busy, completion after displaying recovery code; runtime authorization                |
| 2 Timetable          | Current-week API, week navigation, five days, role views, change color/text, admin filters                                  | Missing icons, no-op normal lessons, 390/768 layout/date/empty states                                        |
| 3 Create request     | Source, move/substitute, reason category/text, conflicts API                                                                | Automatic/stale checks, source class label, synchronized target                                              |
| 4 Required handover  | Six text fields + materials; draft POST/PATCH, submit POST, supplement POST                                                 | Completeness/missing list, duplicate draft retry; verify edit locking                                        |
| 5 Recipient response | Designated Pending recipient accept/decline APIs; Declined editing, timeline, Completed/Cancelled                           | Blank decline/busy gate, historical localized timeline, complete cross-role cycle                            |
| 6 Student            | Today Overview, week/day timetable, original/new teacher/time/room, todo POST                                               | Private reason leak, homepage per-lesson task summary, persistence and student isolation                     |
| 7 Notifications      | Unread count, single/all-read POST, open navigation                                                                         | Per-item unread marker, cross-week detail, event/reminder runtime, errors                                    |
| 8 Admin              | Pending/declined/confirmed stats, risks, date/status/search                                                                 | Class/teacher request filters, real weekly-change statistic                                                  |
| 9 Quality            | Mobile-first CSS, 768/1100 breakpoints, labels, focus-visible, loading/empty/some errors, EN/ZH, reset confirmation         | Error/busy gaps, contrast override, untranslated system text; long inline form and seeded/reset data runtime |

“Static wiring present” means code existed, not that the feature passed.

## Visible controls and API inventory

All 41 app button declaration locations were covered; mapped declarations could render multiple buttons.

| Lines              | Control                   | Handler/API                             | Preliminary result                                                 |
| ------------------ | ------------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| 227, 387           | Desktop/mobile navigation | setView; desktop clears editing         | Real state; mobile editing/focus/back behavior pending             |
| 240, 509           | Language                  | Preferences + html.lang                 | Real preference; labels not centralized                            |
| 248                | Logout                    | POST /api/auth/logout                   | No catch/busy                                                      |
| 274, 285           | Refresh/retry             | GET /api/workspace                      | Real API; 401 gap                                                  |
| 631                | Continue                  | POST login/register/reset               | catch/busy present; recovery-code completion pending               |
| 636, 643           | Auth mode                 | setMode                                 | Check cross-mode errors/code/password                              |
| 655, 662, 669, 676 | Four demo roles           | POST /api/auth/demo                     | Real session; missing busy gate                                    |
| 728, 772           | Next action/risk          | select ID + requests view               | Detail absent if ID excluded by workspace                          |
| 797                | Lesson                    | onOpen only with requestId              | Normal lesson no-op                                                |
| 849, 859           | Week navigation           | GET workspace?week                      | Out-of-order response pending                                      |
| 866                | Calendar                  | GET calendar + blob download            | Non-200 silent                                                     |
| 908                | Day selector              | setDay + day-list filter                | Desktop grid still all-week; misleading change risk                |
| 1041               | New handover              | clear selection + editing               | Unkeyed state risk                                                 |
| 1084               | Open handover             | select ID + end editing                 | No detail GET/focus/scroll                                         |
| 1324               | Template                  | Local fixed content                     | Placeholder material; no subject-specific behavior                 |
| 1385               | Add material              | Append blank title/URL                  | Real operation; no remove, quality improvement                     |
| 1398               | Check availability        | POST /api/conflicts                     | Manual/stale; no catch/busy                                        |
| 1433               | Save draft                | POST requests or PATCH ID               | No busy; native validation may block incomplete arrangement/reason |
| 1436               | Submit                    | Save then POST ID/submit                | No completeness gate; failed submit could recreate                 |
| 1439               | Close editor              | End editing                             | Unsaved input discarded                                            |
| 1597               | Edit                      | Start editing                           | Draft/Declined original-teacher UI gate; API authorization pending |
| 1611, 1623         | Accept/decline            | POST ID/respond                         | No blank-decline/busy gate                                         |
| 1652               | Supplement                | POST ID/supplements                     | No busy/empty gate or clearing on success                          |
| 1668               | Complete                  | POST ID/status Completed                | State gate present; no busy                                        |
| 1683               | Cancel                    | confirm then POST status Cancelled      | Fixed English comment; no busy                                     |
| 1697               | Print                     | window.print                            | Real browser operation; print scope pending                        |
| 1729, 1741         | Read all/single           | POST notifications/read + reload/open   | No catch/busy; cross-week gap                                      |
| 1813               | Save profile              | PATCH profile, GET me/workspace         | No catch/busy/friendly field errors                                |
| 1894               | Reset demo                | Matched confirmation + POST admin/reset | No catch/busy; real-data protection API review                     |
| 1965               | Enable/disable user       | PATCH user + GET users                  | No catch/busy; self-disable rendered but server rejects            |

Inputs/selects update state, search controls filter locally, and profile checkboxes update preferences. Users/Audit/Impact have real GETs but no failure recovery. Incomplete extra routes were not declared passed P1/P2.

## Mobile and keyboard observations; pending verification

Editor was an inline form, line 1215, without Dialog/aria-modal/focus trap. Neither original P0 nor a mandated component library required a modal, so lack of modal/shadcn was not independently a blocker. Actual keyboard usability, focus, and uncropped mobile content were required.

Below 768, the complete sidebar remained a vertical homepage block alongside bottom navigation, with no drawer/hiding. Long URLs/names, date/period/room rows, and two-column material controls needed runtime wrapping checks. Global input width:100%, 137–144, also affected checkbox visuals/label hit areas. Labels and focus-visible existed; errors lacked aria-invalid/aria-describedby, and loading was a plain p without status announcement.

Recheck:

1. 390×844: four identities, seven-field long form, soft keyboard, focus/back and detail scrolling; historical English/Traditional Chinese runs.
2. 768×1024: source switching, decline/revise/resubmit, combined filters, padding and table overflow.
3. 1440×900: full-week table; keyboard login/create/respond/todo/admin; measured button contrast.
4. 200% zoom; visible contrast/large/simple toggles; remove or repair ineffective extra entries.
5. API failures, double clicks, duplicate-draft retry, workspace races, session expiry.
6. Cross-week notification; raw PRIVATE markers; two-student todo isolation; cancellation restoration; all demo logins after reset.

Cursor was ready_for_review and the frontend snapshot was unchanged when findings were rechecked. The final repair prompt should integrate root browser/API evidence. This review sent no Cursor message and changed no product code.
