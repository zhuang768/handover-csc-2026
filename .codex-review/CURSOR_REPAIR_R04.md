# Handover R04 — legacy upgrades, phone navigation, and real offline checks

Historical prompt, translated on2026-10-05. It preserves the defects and bilingual requirements known then; later verified results and English-only instructions supersede current-status implications.

Continue the same project/branch/Cursor chat. Warm-white/forest-green design is approved, and the app is explicitly used by URL then added to the phone home screen. Do not ask again about direction, recreate the project/Site, or add production dependencies.

R03 product:`f3fa696115a86f98995686b6bb934b90492133ab`; status-only HEAD:`b3753d7e35562359368978d23b902124732e0631`. Original82 independent cases,26 product cases,format/lint/types/build,and six E2E passed. Preserve that work and address only confirmed issues and necessary evidence gaps below.

Read R03_API_RESULTS, R03_FRONTEND_RESULTS,R03_PWA_RESULTS,R03_BROWSER_RESULTS,and R03_DOCS_MIGRATION_RESULTS when present. ACCEPTANCE/PWA_ACCEPTANCE/VISUAL_ACCEPTANCE remain applicable. Do not edit,skip,or mix reviewer adapters/assertions/reports into product commits.

## 1. Real R02 upgrades must not turn valid accounts into409

Two genuine historical upgrade cases bring the suite to84 counts:82pass/2fail. Complete seeded R02 and interrupted partial R02 databases both return auth/me409 INVALID_STATE for an ordinary registered account with valid session after R03 migration.

One required preservation case was added at independent-api.test.mts979 (R04_BACKEND_READINESS): actual API edits to demo profile,move/confirm timetable,handover/supplement,and student todo/view,followed by per-row preservation checks. It also covers an edited partial-school profile and ordinary account/session. Fixed R03 export:85counts,82pass/3fail/0skip; all three share the legacy root cause. Run85,not older84/82.

R02 wrote meta.seeded=1; R03 schoolReady accepts only seed_complete. Migration0001 adds transition_token without compatibility. seedIfEmpty repeats plain INSERT on existing classes and fails. This comes from real historical service and migrations,not an arbitrary fake marker.

Validate completeness before marking a full legacy seed complete. Atomically fill missing partial-demo relationships plus marker while preserving ordinary accounts,sessions,and edited lessons/requests/relations. Do not reset,clear,delete data,or blindly regard every seeded marker as complete. Retain empty-seed fault/retry,eight simultaneous first logins,losing-CAS no-effects,and stale-submit gates.

Root command:
`node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts`.

## 2. App-like phone navigation and role-scoped preferences

Actual390px capture05 shows three rows of desktop navigation plus fixed bottom navigation; Notifications text clips. Provide one clear phone navigation. Four bottom actions fit/read; profile,language,logout,and extra admin features remain reachable,possibly via More/drawer. Keep keyboard,focus,safe areas,44px targets,long text in both historical languages,and larger text. Preserve desktop workspace; no overflow:hidden concealment.

Student simple preference is global and CSS hides both week-grid and desktop day-list. After enabling it,teacher/admin lose the timetable and cannot turn it off. Scope simple view to students. At390/768/1440,students still have lessons,detail,and todos; switching toteacher/admin retains full timetable/statistics without clearing localStorage.

## 3. Remaining API feedback and historical system localization

R03_FRONTEND_F01/F02 have exact callers/lines; preserve completed catches,busy,and notices. Finish:

- Editor/conflicts/Detail/Profile/reset/Users/Audit/Impact401 remove invalid signed-in shells and give clear sign-in guidance. Other500/network errors preserve useful input and show retry. Initial auth/me500/offline is not ordinary signed-out state.
- Single notification read500 followed by detail200 must retain the read-status error. On401,do not call invalid detail. Slow requests show disabled busy state.
- User toggles allow only one slow PATCH. Successful PATCH followed by failed GET says refresh is still needed. Slow Users/Audit loads show loading; only successful empty data shows empty; failures offer retry.
- Do not force Profile/reset through errorText(en) or show raw codes in Users. Localize reminders,actual audit actions/details such as demo.reset/user.updated/request.supplement,and dates in the selected locale/Taipei timezone. Do not translate names or teacher-authored titles/content.

Use clear shared helpers,not global unhandledrejection swallowing or false network success.

## 4. Small safe PWA with real offline/update behavior

Preserve manifest,four genuine PNGs,scope,standalone,guidance,and public allowlist. Direct API/private navigation/ICS/non-GET exclusions passed; do not start caching timetables.

- Activation deletes only old handover-public- caches,not other namespaces.
- Runtime cache.put runs within respondWith/waitUntil and handles failure without swallowing a valid network response.
- Reject Authorization,sensitive query,and RSC allowlist requests; do not cache redirects to private URLs,other origins,or different resources. These are defensive checks,not a claim of observed ordinary-flow leakage.
- Add no-store to private ICS responses; SW bypass and HTTP caching are separate layers.
- Centralize registration,catch failures,and avoid duplicate InstallGuide/PwaRegister or dev-HMR interference. Verify a fixed built runtime.
- Update only with user consent and no unsaved input or mutation. After postMessage,wait for controllerchange before reloading. Protect Detail comments/supplements and Profile edits,not only Editor. If using manual safe reopen instead,describe it accurately without claiming tested automatic updates.
- Installed/standalone state stops promoting installation. iOS guidance includes version-appropriate Open as Web App. Offline copy says retry submission after reconnect; no background queue.

Real offline navigation was not yet verified: existing E2E read online caches and dispatched synthetic offline events,without disconnect/reload.

Root built-Worker log showed `/offline.html`307→`/offline`200. A redirected install response stored and reused as navigation fallback might be rejected. Root stopped its Worker and CUA reload showed ERR_FAILED,but controller was not established; causality therefore needs a genuine built regression. Official references:
https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/
https://fetch.spec.whatwg.org/#http-fetch

First reproduce a failing real navigation test,then fix it with a valid public canonical route,asset configuration,or safe public-response handling. Do not broadly permit private redirects or replace the failure with a synthetic event.

Fixed-SHA SW probe currently has28cases,22pass/6fail. After product commit run:
`node .codex-review/sw-behavior-probe.mjs --stable-sha <actual-40-character-product-SHA>`.
Tell Codex if the public offline-path contract changes; do not weaken reviewer tooling.

## 5. Focused browser regressions,captures,and docs

Use existing Playwright/CI without production packages and isolated migrated D1,separate from shared development/root reviewer state.

- Actual signed-in student/teacher/admin at390/768/1440,in both historical languages: shell size,no horizontal overflow,reachable navigation,and44px targets. Include simple-mode role switching. Sign-in viewport alone is not all-role coverage.
- Verify next-lesson ID/date/period and opened detail without conditional skips; conflict500retry waits for200,clears error,and restores submission. Test Detail input isolation and explicit401/slow/failure feedback.
- Built Worker: assert active controller; after real authenticated workspace/detail,caches contain no private API/HTML/cookie content. True offline full reload/navigation shows public bilingual fallback; deliberate reconnect retry returns to the app. An offline mutation while DOM remains cannot show success or automatically replay. Inspect body for private markers,not only keys.
- If automatic update is retained,provide actual two-version waiting/draft/comment guard/controllerchange/reload evidence. No claimed physical iOS/Android installation without devices.
- Capture5–8 distinct healthy screens: teacher editor,student390home with collapsed guide,mobile detail,installation guide,768tablet,and desktop admin in the then-supported languages. Current03Server error and identical05/06 are unsuitable finished evidence.

README/TEST_REPORT explain the app,installation,network needs,and updates. Record actual revision/command/exit/count/scope. Remove stale “Playwright not run” contradictions. Match font/icon credits and Codex+Cursor disclosure. Identity,guardian consent,eligibility,terms,video,and final submission stay human tasks.

R03_DOCS_MIGRATION_RESULTS: README37 mislabels npm run db:migrate as production,but the script is fixed--local. Document local-only; Sites uses packaged SQL/metadata. Do not remove--local or invent a remote database ID. PNG05/06 are392wide despite390viewport; fix real client/scroll overflow. Fixed R03 portable build/package passed with PWA bytes/migration metadata; no new Site.

Parent ignores tsbuildinfo,but the app's own .gitignore lacks it. External release checkout exports only the app; helper runs git add--all after commands. Add `*.tsbuildinfo` in the app source,not secretly in the release copy,to keep generated typecheck output out of publication. Preserve local file and untracked status.

Empty-D1 npmci→npmdev with four demo sessions,second migration no-op,schema/journal/dbgenerate already passed independently. The0000 multi-statement chunk actually created14tables via D1.batch; it is not a proven Sites failure and does not justify speculative migration refactoring. Keep required future migrations/metadata consistent without bulk seed.

## 6. Handback

Read relevant diagnosis/security/workers/design/ui/React/AI-debt/Playwright skills and record actual use. No indiscriminate skills/plugins. Parallel ownership must isolate app.tsx/service.

Run relevant format/lint/types/productAPI,latest85-count independent suite,build,necessary migrations,and real browser/PWA regressions. Do not skip,continue-on-error,delete failure assertions,or only rename tests.

Commit reviewable product,stop editing,and set CURSOR_STATUS round4 ready_for_review with current time,product SHA,commands/exits,and verified/unverified lists. Do not push unaccepted source. Codex handles GitHub/existing-Site publication after review. No new Site,account/payment changes,or final Devpost submission.
