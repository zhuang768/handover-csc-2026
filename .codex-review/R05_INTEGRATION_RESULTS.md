# R05 root integration verification

Historical results, 2026-10-04 Asia/Taipei. Cursor exhausted its quota after receiving R05 and before product edits. Codex took over the already-authorized reversible repairs without changing Cursor's model or buying quota. Source, test, and publication evidence are distinct; no claim excludes every possible bug.

## Final local integration

Frozen backend blobs: service `145faf7f27e82e44f2e56ea44e4ca33993c47932`, API tests `a43383679244dae8ea2171f682e3e486695d8b13`.
Frontend blobs: app `841fdd3442cd286efb4271cd28329c8bcd769c82`, InstallGuide `31367d79e39db17cf78587968bab8480b75ea079`, client API `aad5fd0c8bd0376cb09ec23baaefe9eb7f42ecae`.
E2E blobs: workspace `eca808dc950ea7636718933bef539f85fb426415`, built-update `7e17e29eed9bfb1614257de359ba8f05bfdfebe1`.

| Root execution | Result |
| --- | --- |
| Format, lint, typecheck | Each exit 0 |
| npm test | Exit 0; 33 passed, zero failed/skipped: 26 API, five client, two PWA |
| Build | Exit 0; actual Worker, assets.html_handling none |
| Reviewer harness + independent API | Exit 0; 85 passed, zero failed/skipped, original business assertions preserved |
| Dev E2E | Exit 0; nine passed in 15.6 seconds; actual 390/768/1440 viewports and historical bilingual/login shells |
| Built E2E using preceding build | Exit 0; six passed in 5.6 seconds; direct offline 200/no Location, real public fallback/reconnect without replay, five pending-write cases |
| git diff --check | Exit 0 |

Initial notification locators timed out because exact names omitted unread counts, and reset used Profile instead of My profile. Only these three locators changed; delayed HTTP, errors, cross-week navigation, and persistence assertions stayed intact. Focused one-plus-two tests then passed, followed by full nine/six suites.

Independent source review found a missing sample could overwrite an edited lesson. The existing partial-repair case now creates a real move/accept/Completed/supplement before upgrade. The old repair reproduced failure; the fix preserves lessons/real request/history and restores missing samples as inactive Cancelled snapshots. See R05_BACKEND_RESULTS. No schema/auth/production dependencies were added. Current API routes await seedIfEmpty before mutations; request ID plus unique token gates prevent losing concurrent repair from replaying winner side effects.

## Actual Worker HTTP

Root applied two migrations to isolated `.codex-review/worker-state/r05-final` (exit 0), then tested its built Worker at `http://127.0.0.1:8789/`:

- Four real demo sessions; anonymous workspace 401; HttpOnly cookies and private JSON no-store.
- Real conflict lookup/direct submit 409; Draft -> Pending -> Declined -> revise/resubmit -> Confirmed -> Cancelled.
- Student could not see private teacher markers; materials/todo/viewed persisted and timetable stayed class-scoped.
- Acceptance changed arrangement; cancellation restored original teacher/date/period; logout made old-cookie replay 401.
- No ordinary registration or demo reset; helper-created handovers were cancelled with audit retained.

The helper initially mislabeled a teacher change as move (422) and expected 403 for a student-hidden draft (actual opaque 404). It was corrected to substitute/404 under the existing contract, without product changes or removed denial assertions. Only its own leftover draft was cancelled. Rerun passed. Worker smoke also passed: student 20 lessons/one visible request, teacher five lessons, admin 60 lessons. Teacher/admin request counts included cancelled QA records, not fresh-seed counts.

## Images and PWA limits

Root inspected healthy teacher 768, student 390, historical translated admin 1440, and teacher detail 390 PNGs. Screenshot 07 now showed Maya's signed-in workspace, not loading. Five built update cases use an explicit waiting/controller UI seam and real delayed HTTP mutations; they are not a genuine two-version SW or physical-install proof. The earlier R04 real dirty-profile/controller reload/session preservation remained separately documented evidence.

## Fixed-candidate genuine historical probes

Product `9538135128b95cf2d14db9f154d7aac53ba86e46`, app tree `f611d50eaaa655e955d8ac113f7b55bd41cae6f3`; clean product/CI and unchanged tree before/after.

The first stored wrapper stopped all three cases at migration guard before business assertions because raw SQL comparison treated Drizzle's exact `--> statement-breakpoint` comment as DDL rewrite. Removing only that exact marker line on both sides retained byte comparison for all remaining SQL. Product migrations/business assertions were unchanged. This wrapper error did not rewrite the historical R04 stdin result of one pass/two failures.

```sh
REVIEW_APP_TREE=f611d50eaaa655e955d8ac113f7b55bd41cae6f3 node --experimental-strip-types --test .codex-review/historical-upgrade-probe.mts
```

Exit 0: three passed, zero failed/skipped, 320.897709ms.

- Real complete R02 DB with ordinary teacher/session/custom external URL: ordinary rows/session preserved; three classes/46 users/121 lessons/eight requests unchanged; only exact known demo stub replaced, remainingKnownStubs=0.
- Real R02 first lesson INSERT fault: 500, actualFaultHit=1, zero original lessons; upgrade retained credentials/session, ordinary session 200, three classes/46 users/120 lessons/seven requests, completionMarker=1.
- Real R02 second lesson INSERT fault: 500, actualFaultHit=2, one original lesson; same complete counts/session/marker after upgrade. This was not only a fabricated partial-DB fixture.

SW blob `b3b66c94a362b77b560d5be1f8fc4624044a4453` matched the earlier pinned R04 pass; its 28-case evidence was reused, not claimed as a new R05 run. At this snapshot archive/public HTTPS/GitHub remote/CI were still pending. Physical iPhone/Android installation and standalone launch were not tested.
