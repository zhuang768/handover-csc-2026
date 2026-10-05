# Handover — historical visual acceptance checklist

Created: 2026-10-04 (Asia/Taipei). **Original document state: design approved; implementation and acceptance pending; this checklist had not been executed.** Translated into English on 2026-10-05. It preserves the original test requirements and unchecked status rather than claiming a new run. The later English-only instruction supersedes the historical bilingual/font requirements below.

Sources: [original acceptance baseline](./ACCEPTANCE.md), [approved direction](./DESIGN_DIRECTION_PENDING.md), and `handover/docs/API_CONTRACT.md`. The user selected “Adopt this direction and implement it (Recommended).” This document defines observable results, not completed screens or passed tests. Its creation did not change the product or operate Cursor.

Warm-white/forest-green, historical Manrope/Noto Sans TC typography, layout, and motion follow the approved direction. User changes require corresponding criterion changes. Cursor implements; Codex independently reviews a stable handback. P0 functionality and privacy gates remain.

## 1. Execution and evidence

- Review only a stable Cursor handback. Record HEAD, uncommitted differences, origin, browser/version, time, language, role, and fixture date. Recheck affected items after product changes.
- Mark each item `untested / pass / fail / not applicable with reason`, with screenshots, DOM/computed styles, network records, or test output. Blank items, build success alone, and static captures do not prove interaction success.
- Use isolated fixtures and actual sign-in APIs. Separate student, teacher, and admin contexts, plus a fourth for the receiving teacher. No role spoofing or local-storage authentication.
- Normal/regression flows use real backend data. Fault interception or disconnection is allowed only when labeled fault injection; intercepted success cannot establish a completed workflow.
- Record private-marker presence and endpoint, not recovery codes, cookies, passwords, or private teacher content in public evidence.
- Existing E2E tooling is suitable. Select semantic roles, accessible names, and stable test IDs, not DOM positions or a mandated library. Browser interaction complements automated DOM checks; axe or screenshot differences alone do not establish complete accessibility.

## 2. Device, historical language, and screen matrix

Baseline viewports: `390×844`, `768×1024`, and `1440×900` CSS pixels at 100% zoom. The historical plan ran English and Traditional Chinese with sign-in/student/teacher/admin baselines: at least 24 acceptance images. That differs from the final Devpost selection of 5–8 captures. Important operations and failure states need additional evidence.

| Width | Required screens/actions | Observable pass conditions |
| --- | --- | --- |
| 390 | Sign-in, registration role choice, recovery; student Today/This Week/detail/todos; teacher create/edit/materials/conflicts/accept/decline; admin filters/detail/users/reset confirmation | Current task first; compact navigation; complete sequential single-column form; reachable fields/errors/back/close/actions; no whole-page overflow or content under bottom/sticky bars |
| 768 | All four baseline roles; long teacher form/detail; student week choice; combined admin filters; menus/date pickers/dialogs | No broken intermediate layout; sufficient text widths or single-column fallback; overlays fit viewport; actions remain reachable |
| 1440 | Sign-in and three-role workspace; teacher timetable/queue; complete admin list; request detail; keyboard navigation/filters/forms/overlays | Clear timetable/week, aligned metadata, primary actions retain hierarchy, approved width/line length/spacing, no giant marketing area displacing work |

Also test a shorter390px viewport, such as667px height, and a virtual keyboard using a real or available mobile browser. Record unavailable devices. Desktop Chromium runs the matrix; available WebKit/Safari checks mobile sign-in, dates, material links, long forms, and overlays. Firefox at least checks keyboard/zoom. Do not claim untested browsers.

- [ ] **RESP-01** `documentElement.scrollWidth <= clientWidth + 1`. Only a named local timetable/table container may scroll horizontally when two-dimensional content needs it. Header/navigation/forms remain on screen. The last column and every action are keyboard-reachable.
- [ ] **RESP-02** Resize across actual breakpoints without losing sign-in, week/filter, selected request, or unsent input. No duplicate focusable navigation or repeated content announcement.
- [ ] **RESP-03** Verify the actual detail form: desktop pane, mobile page, or modal. Content, heading, back/close, and bottom actions are reachable; no inescapable double scrolling. Last-field focus and results remain visible with keyboard/browser bars. Closing preserves source week, filters, and reasonable scroll position.
- [ ] **RESP-04** Read and complete operations at200% text/browser zoom and320CSS px reflow. Two-dimensional tables may scroll locally; surrounding UI must reflow. [Resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

## 3. Role views and approved direction

New appearance follows the approved design; functional conditions inherit P0.

| ID | Pass conditions | Verification |
| --- | --- | --- |
| VIEW-01 Sign-in | Handbook composition, concise promise, original SVG when present; login/register/recovery clear; four distinguishable demo entries create actual sessions | Three widths, Tab order, auth/demo, auth/me, refresh, logout |
| VIEW-02 Account forms | Student class and teacher subjects/invitation depend on role; no admin self-registration; clear recovery-code storage instruction without overflow; profile persists | Missing fields, invalid invitation/recovery code, genuine register→reset→login, associated errors/names |
| VIEW-03 Student | Real date/class; next lesson only when available; teacher/time/room match timetable; preparation derives from handover; clear Today/This Week choice | Compare API/DOM; next/no-next/weekend/empty/cross-week; detail and three todo types |
| VIEW-04 Teacher | Main week timetable; assigned Pending queue; grouped arrangement/teaching/materials/student/private content; accurate completeness feedback | Change source/date, reopen draft, revise decline, clear each of seven fields, counter/disabled checks |
| VIEW-05 Admin | Visible combined date/class/teacher/status/search; API-backed weekly/pending/declined counts; specific risk and next action | Each filter/clear, known fixture counts, empty results, correct cross-week risk detail |
| VIEW-06 Detail | Consistent date/period/class/room/original→receiving teacher order; status icon/text/color; role/legal-state timeline/supplements/actions | Six states, three-role comparison, timestamps, locked fields, illegal operations |
| VIEW-07 Consistency | Shared primitive→semantic→component colors/type/spacing/radii/icons/focus; same function behaves consistently; no fake metrics/testimonials/templates/borrowed branding | Computed styles/source, proposal comparison, count provenance, asset inventory |

Official API states remain `Draft / Pending / Confirmed / Declined / Completed / Cancelled`. The proposal's “accepted” label must map to Confirmed, not create a seventh state. Historical language labels map to the same formal state.

## 4. Historical bilingual copy and long data

The following requirements were part of the original bilingual plan and are preserved as historical criteria, not current language-switch instructions.

- [ ] **I18N-01** Fresh context defaults to English. Historical localized selection sets `html[lang]` to `zh-Hant` or appropriate `zh-TW`; English uses `en`. Persistence is documented; switching must not clear session/draft/filter.
- [ ] **I18N-02** Navigation/headings/buttons/fields/placeholders/requirements/options/empty/loading/error/success/notifications/timeline actions/dates/periods/status use localization. No raw code, key, undefined, or mixed system text. Course names, names, and authored content need not auto-translate.
- [ ] **I18N-03** AX/DOM icon names, dialog titles, aria-label/describedby, status announcements, unread counts, and checkbox names follow the historical selected language. Localized pixels with wrong-language accessibility text fail.
- [ ] **I18N-04** Valid historical fixtures:40-character localized name,60-character class/material title,300-character multi-paragraph reminder/private notes/decline comment,and at least180-character URL, mixing words,numbers,punctuation,and emoji. Stay within API limits; over-limit input gets useful errors.
- [ ] **I18N-05** At three widths, long labels,missing lists,badges,notifications,tables,and URLs wrap without overlap. Summaries may truncate only with keyboard/touch access to full detail,not hover-only tooltip. Fields/errors cannot hide content by truncation.
- [ ] **I18N-06** Dates/relative times match school timezone. Honest weekend empty and separate next school day; no wrong-week request placement. Tabular period/date numbers verified through computed styles and captures.

## 5. States and injected failures

Record applicable states for buttons,inputs,selects,checkboxes,tabs/navigation,notifications,timetable cells,and dialogs/panes. Touch does not require hover. Mark absent states not applicable with a reason.

| State | Trigger/fixture | Pass conditions |
| --- | --- | --- |
| Default/hover/active/focus | Pointer,held click,Tab,Enter/Space | Essential actions/info available without hover; distinct stable states; no flicker,text movement,or covered focus |
| Selected/checked/expanded | Tab,filter,checkbox,drawer,menu | UI agrees with aria-selected,checked,aria-expanded; selected/hover/disabled distinguishable |
| Disabled/locked | Incomplete handover,conflict,submitted content | Actual disabled or equivalent semantics plus event prevention; Enter/programmatic triggers cannot submit; reason readable; submitted original text is locked,not just gray |
| Loading/busy | Delayed login/workspace/save/respond/todo | Calm indicator and appropriate aria-busy/announcement; repeated clicks/Enter do not duplicate mutation; completion/failure clears busy; aria-busy alone does not block events |
| Success | Real save/accept/todo success | Only after API success; persists on refresh; readable/announced feedback not immediately cleared or focus misplaced |
| Validation | Missing seven fields,invalid email/invite/material URL,empty decline | Specific associated near-field error; accurate counter/list updated after correction; text/icon beyond color |
| Permission/session |401/403,expiry,disabled account | Friendly historically localized feedback and action; no previous-role flash;403is not empty/success |
| Conflict/changed |409,changed source,concurrent slot competition | Clear class/teacher/time conflict; sending requires latest clear result; can revise; no false save |
| Network/server |Offline,timeout,500,429,malformed response | Safe generic feedback/retry,preserved input,no stack/SQL/private leak,no duplicated draft on retry |
| Empty |No lesson,next lesson,response,notification,or filter result | Accurate reason/next step; no fabricated example count; zero differs from loading |

- [ ] **STATE-01** Changing date,period,source class,or recipient immediately invalidates the old no-conflict result. Slow responses cannot overwrite newer choices. Busy/disabled/missing feedback agrees with current data.
- [ ] **STATE-02** Historical failure matrix includes390localized and1440English,with768dialog/seven-field/loading coverage. Verify six request states for teacher/admin and only student-authorized states. Do not access private data merely to fill a screenshot matrix.

## 6. Contrast,keyboard,focus,and touch

- [ ] **A11Y-01 Text contrast** Ordinary text,placeholders,help,and errors>=4.5:1; qualifying large text>=3:1. Large is about24CSS px or18.67px bold,not every18px text. Calculate actual computed foreground,opacity composition,and background across white/paper,badges,and green-button states without rounding up. [W3C1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [ ] **A11Y-02 Non-text** Necessary field bounds,checkbox/radio,informative icons,selection,charts,and changed-lesson marks>=3:1 against adjacent colors. Decorative rules need not all meet3:1,but cannot be the sole usable field boundary. Include additional state cues. [W3C1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [ ] **A11Y-03 Disabled** Inactive-control contrast exceptions do not cover nearby requirement explanations,active links,or whole forms. Project-disabled text remains recognizable; behavioral checks establish inoperability,not opacity.
- [ ] **A11Y-04 Focus** Every action is Tab-reachable with clear focus-visible; project indicators>=3:1 against adjacent backgrounds. Check paper/white/dark; no overflow:hidden clipping or sticky/bar/overlay obstruction. [Focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
- [ ] **A11Y-05 Keyboard** Logical Tab/Shift+Tab; correct Enter/Space and semantic menu/tab/date behavior. No positive tabindex,click-only div,trap,or mouse-only long timetable.
- [ ] **A11Y-06 Modal/pane** Named modal,contained focus,and inert background; close restores trigger/reasonable focus; Escape exits nonmandatory flow. Nonmodal pane has no forced trap but reachable heading/back. Role/route changes focus valid main content,not unmounted elements.
- [ ] **A11Y-07 Labels/announcements** Visible and programmatically associated labels; readable requirements,formats,errors,and proper aria-invalid. Announce save/failure/todos without making the entire timetable live. Sample screen-reader sign-in,student checkbox,and teacher correction.
- [ ] **A11Y-08 Touch targets** Project standard for390/768:main actions,bottom nav,icons,date arrows,material remove,and checkbox hit area>=44×44CSS px,using padding/labels without oversized icons or overlap. Verify rects,hit testing,and touch. WCAG2.2AA2.5.8is24px or spacing/other exceptions;44pxis not the sole AA threshold. [W3C2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [ ] **A11Y-09 Enlargement/modes** At200%,read/complete/close/return. Larger-text/high-contrast/student-simple controls must genuinely alter their intended presentation without breaking work,not only toggle a class. Test actual dark colors/focus/states; exposed P1 controls cannot escape verification.

## 7. Motion,fonts,and assets

- [ ] **MOTION-01** Approved project transform/opacity140–220ms for panels/states/todos; no looping bounce,scroll hijack,repeated reveals,or widespread decoration. Motion does not delay primary action or substitute for API success.
- [ ] **MOTION-02** With emulated and system reduced-motion,repeat detail,week,notification,todo,and loading. Remove unnecessary movement,scaling,sliding,and smooth scroll while retaining static feedback. Shortening duration alone is insufficient. This is approved scope; W3C interaction animation is AAA,not a universal AA requirement. [W3C2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [ ] **FONT-01** Historical Manrope/Noto actual font-family,requests,document.fonts.check,and sampled rendered fonts; no missing-glyph boxes/uncontrolled fallback. Check body16px/1.65–1.75,headings28–36,sections20–24,label14,weights400/500/600/700. Small metadata is not body text; no shrinking localized text to fit. CSS family name alone is insufficient. Current English-only scope removes Noto.
- [ ] **FONT-02** Cold cache,mobile throttling,and failed fonts:swap/approved equivalent keeps text immediately readable and forms usable. Font swap cannot cover buttons,clear input,or shift focus out of view. Record usable-first-screen time,bytes,and visible layout shift; warm local cache does not prove mobile performance.
- [ ] **FONT-03** Request only used weights/subsets,no duplicate full families or huge full-CJK preload. Record URLs/files/bytes if delivery changes and retain readable fallback.
- [ ] **RESOURCE-01** Actual asset inventory:file,source,version/date,license,notice,and edits. Historical Manrope/Noto use OFL; Lucide/vendor code keeps applicable notices. Open source or visible screenshots do not automatically grant copying rights.
- [ ] **RESOURCE-02** Original/licensed sign-in SVG/branding; no borrowed Untis/Google/Cal/Linear/Todoist/Notion logo,screenshot,illustration,or copy. Consistent icons; decorative SVG hidden,meaningful image has alternative text. No asset404/CORS/console errors.
- [ ] **RESOURCE-03** No mandated component library; existing components may pass through actual semantics,interaction,focus,and states. New font/motion dependency cannot bypass dependency/license/performance review.

## 8. Real-data functional regressions

Redesign must preserve permissions,state machine,API contract,and persistence. Normal flows use actual APIs; record required endpoint/result/reread/reload states without exposing cookies.

| ID | Flow | Pass conditions |
| --- | --- | --- |
| REG-01 Auth/roles |Four demos,ordinary register/login/reload/logout,recovery/profile |Real session/scope; old password/session/recovery proof invalidation per baseline; no visual role spoof |
| REG-02 Positive handover |Original teacher move/substitute; missing→draft→complete→submit→accept→student detail/todo→admin |Seven fields and at least one material enforced; multiple links preserved; status/timetable/notifications/timeline/counts agree; todos persist and another student's progress is separate |
| REG-03 Decline |Pending→Declined with comment→edit same request→resubmit→confirm |Comment required,same ID,no duplicate draft; correct events/notifications; busy/error preserves input |
| REG-04 Race/conflict |Occupied class/teacher,rapid target changes,repeated submit,two competing requests |Latest clear/conflict shown; incompatible submit blocked; backend safeguards survive UI refactor; no duplicate occupancy |
| REG-05 Lock/supplement |Original Pending/Confirmed content,supplement,Completed/Cancelled,cancelled timetable |Submitted text locked; supplement author/time/privacy; legal transition/release/restoration; timeline matches API |
| REG-06 Student privacy |Raw list/detail/notification/timeline/supplement/error plus DOM/AX; public card if exposed |No private notes/reason/comment/supplement markers in unauthorized responses; CSS-hidden is insufficient. Cross-class IDs/query and teacher/admin mutations rejected; logout/role/back/cache do not retain private content |
| REG-07 Notification/week |Real notifications,single/all read,cross-week detail,day-before reminder |Correct ID/date,read persistence,actual detail independent of current-memory week; useful text/action,no raw codes |
| REG-08 Admin/reset |Combined filters,risks,users,cancel reset then confirm |Real controls,self-disable blocked,cancel performs no mutation,confirmed reset demo-only preserving real accounts,four demos usable afterward |
| REG-09 Counts/optional |Counts,risks,read/prepared,impact; exposedICS/templates/dark/print |API/fixture provenance,honest zero; verify exposed claims without requiring unimplemented P1/P2; deterministic templates not called AI |
| REG-10 Source consistency |Existing core/API/E2E/types/lint/build,needed token checks,same preview workflow |No deleted/weakened tests; local/CI alignment; final screenshots/checks/deployment correspond,not old captures hiding new failures |

## 9. Delivery record and decision

- [ ] Approved design/version/time recorded; waiting is not approval.
- [ ]24baseline images plus representative historical long localized text,missing/conflict,phone overlays,busy/errors,focus,reduced motion,and fallback evidence,each labeled version/role/language/viewport/date.
- [ ] Actual foreground/background/state/computed ratios for text/non-text/focus; palette estimates do not replace render checks.
- [ ] Required regressions/interactions complete; exposed optional features have no fake controls. Failures have reproduction,impact,repair,and retest evidence.
- [ ] Untested browsers/devices/states,limits,and nonapplicable items have reasons. Do not declare overall pass with severe overflow,unusable phone flows,missing glyphs,unreachable keyboard controls,low-contrast core content,leakage,or broken main workflow.

**Completion:** approved direction implemented,matrix/applicable states evidenced,P0/exposed features pass,and no unresolved known blocker in scope. This is not a zero-defect,all-browser,or full-WCAG certification.
