# Handover R05 — close remaining acceptance gaps

Historical prompt, translated on2026-10-05. Counts,language requirements,and open defects reflect that round,not the later English-only release.

Continue the same project/branch/chat. R04 product `6b7b7cd734e9af06785d7f854d75dc8f3a160c6f`,app tree `ebbe56dda33a1547d67f17367bc067fe7a6eb2ab`,independently passed format/lint/types,26product tests,85reviewer counts,8dev E2E,1built offline E2E,and28fixed-SHA SW checks. Do not redesign or expand features. The URL/home-screen app and warm-white/forest-green direction are approved.

Read available R04_BROWSER_RESULTS,R04_API_RESULTS,R04_FRONTEND_RESULTS/R04_PWA_RESULTS,and R04_DOCS_RESULTS. Repair only the existing gaps below. Do not edit/skip reviewer assertions or mix them into product commits.

## 1. Update protection includes active mutations

Root verified real R03→R04 waiting-worker update: unsaved Profile name removed the update button without losing input; restoring the name and confirming caused a genuine reload,retained session,and dismissed the banner. Normal two-version/Profile-dirty behavior already passed; no extra test publication or SW redesign is needed.

The earlier requirement also forbids reload during mutation. Detail app2309 reports only comment/supplement dirty,not busy; Profile2713 reports field dirty,not busy; Users3003 does not report writingId to root. Accept with an empty comment,admin reset,and user enable/disable can leave update clickable. Include actual pending requests in shared update protection,retaining input,success/failure,and cleanup. Do not invent listener-race scope.

Use a product test delaying a real mutation with a waiting-worker condition. Assert no reload/skip-waiting while busy and eligibility afterward; retain dirty Profile/Detail guards. This is focused existing scope,not a production dependency or background queue.

## 2. Cross-week notification read failures remain visible

Same-week read500→detail200 was fixed. Cross-week openRequest(id,true) app240 awaits load(targetWeek),whose line265 unconditionally clears error. Preserve read-status-save failure while allowing successful detail and other-week workspace to open. A401returns to sign-in without calling invalid detail. Product E2E must use cross-week notification plus read500/detail200/workspace200 and assert the final error,not only same-week behavior.

## 3. Healthy768tablet capture

Fixed6b7's07-teacher-768.png is actually sign-in Loading,but README says Teacher home. workspace.spec261–263 captures immediately after demo; helper26 waits only for .handover-root,also used by AuthScreen app801. That is not successful sign-in evidence.

Wait for real workspace200 plus Maya's teacher heading/desktop navigation before saving07. Keep5–8 distinct healthy readable screens; no loading screen as finished teacher home. Do not edit reviewer PNG backups.

## 4. iPhone guidance order and reporting scope

Repair both earlier languages in lib/i18n.ts579/639:Safari→Share→Add to Home Screen→enable Open as Web App on the add screen when available→Add→open the icon. Current text places the option after opening the icon,in the wrong order. Follow https://support.apple.com/en-au/guide/iphone/iphea86e5236/ios without copying its wording.

TEST_REPORT may cite root R04_BROWSER_RESULTS real two-version update/Profile dirty evidence. Physical iPhone/Android installation remains unverified. At this historical point,public HTTPS and GitHub CI had not run; do not claim them. No new migration/packaging/CI defect was found; do not refactor.

## 5. Genuine partial R02 schools and known demo stubs remain incomplete

The85-count suite is green,but three probes using real R02 source produced1pass/2fail,separately from suite counts. See R04_API_RESULTS.85green does not establish all legacy compatibility.

- **One-lesson partial school is misclassified complete.** Fault the second real R02 lesson INSERT:three classes,45demo users,one lesson,zero requests,plus ordinary account/session. R04 auth/me200 still leaves one lesson/zero requests while writing seed_complete1. Service418–420's arbitrary lesson>0 plus three demo classes is insufficient. Validate complete structure/relationships; atomically supplement partial data while preserving accounts,sessions,edited lessons/requests/supplements/todos/views. Do not reset,clear,or replay existing arrangements. Preserve the already-fixed zero-lesson case. Add product regression for an actual one-lesson partial state; backend will rerun the same probes.
- **Known old worksheets remain stubs.** Full real R02 upgrade still gives demo-request-confirmed Practice worksheet URL https://example.org/worksheet. R03 required repairing old known stubs. Narrowly and idempotently replace only recognizable unedited original demo materials with a usable original local worksheet. An ordinary teacher's identical custom URL must remain,as must credentials,sessions,and other rows. No new external service.

## 6. Handback

Use relevant diagnosis,React/AI-debt,Playwright,and safe-upgrade skills only. Reproduce first,then repair minimally. Run affected tests,format/lint/types/productAPI,latest85reviewer counts,build,and dev/built E2E. Report the three historical probes separately,not within85. If SW is unchanged,retain fixedR04's28checks with its hash; rerun only if changed.

After product commit,stop editing and report CURSOR_STATUS round5 ready_for_review with actual SHA,time,commands/exits,counts,and limits in the same chat. Codex handles authorized GitHub/same-Site publication after acceptance. No unaccepted push,new Site,services,or Devpost submission.
