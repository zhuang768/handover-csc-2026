# R03 root verification — not accepted yet

Product: `f3fa696115a86f98995686b6bb934b90492133ab`; status-only HEAD: `b3753d7e35562359368978d23b902124732e0631`; app tree: `911adb7043d89b7487b12b9bb3d06876457699a5`.

## Independently rerun commands

- `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: all exit 0. Product tests: 26 pass / 0 fail.
- `npm run test:e2e`: exit 0, 6 Chromium cases pass. This is the actual command result; it does not establish that the test names faithfully describe all exercised behavior.
- Test-generated changes to tracked screenshot 01/02 were saved to reviewer artifacts/R03 and only those own-generated changes restored to the reviewed commit. Product and .github then clean; no product code was edited by root.
- Fresh isolated D1 in reviewer worker-state/r03: `HANDOVER_PERSIST=<absolute state> npm run db:migrate`, exit 0, 0000 (22 statements) and 0001 (2 commands including ledger) applied. Production Wrangler serves port 8789 against this state.
- `HANDOVER_REVIEW_URL=http://127.0.0.1:8789 node .codex-review/worker-smoke.mjs`: exit 0. Anonymous 401, real cookie student/teacher/admin workspaces (20/5/60 lessons), logout and replay denial pass. No credentials printed.

## Actual production-build browser (Cua tab 4)

- Actual viewport 1280×720. Cua temporary viewport override was reset. These checks are desktop checks, not claimed as device installs.
- Student EN and zh-Hant workspace load correctly. Chinese shell is full 1280px, not the R02 608px clamp. HTML lang changes to zh-Hant, no page overflow.
- Next lesson is 2026-10-05 Math with Maya Chen. The separate 2026-10-09 Math handover is separately labelled; the R02 cross-lesson mix-up is repaired.
- Confirmed student detail shows safe progress/plan/materials/assessment/equipment/student reminder. No teacher-private reason/notes/supplements/comments shown. Material links to a real public `/worksheets/class-practice.txt`, replacing example.org.
- Student checklist label hit targets measure 962×44. No visible buttons/summary below 44px in this desktop view. This does not prove all mobile targets.
- Student notification translates system title, localized date/time, and per-item unread indicator. Timeline actions/date/time translate; actor `Seed` is still technical English sample metadata.
- Admin overview shows stats.weekly=6 and translated risk captions. Class/teacher/status/date/search controls present.
- Admin dark-mode badges were measured on actual computed solid colors: Confirmed/Completed 8.84:1; Pending 9.03:1; Declined 8.32:1; Cancelled 8.35:1; Draft 8.81:1. Dark toggle restored after inspection. Only these measured pairs are confirmed.
- Also measured dark + high contrast together: Confirmed/Completed 12.31:1, Pending 16.28:1, Declined 15.11:1, Cancelled 8.35:1, Draft 8.81:1. Both toggles restored. The earlier R02 dark warning contrast defect is repaired in these actual states.

## PWA HTTP resources, real built Worker

- HTML manifest link `/manifest.webmanifest`, Apple icon `/icons/apple-touch-icon.png`, viewport `width=device-width, initial-scale=1, viewport-fit=cover` present.
- Manifest 200 application/manifest+json; sw.js 200 text/javascript. The HTTP client followed redirects for offline.html: real Worker logs show `/offline.html` **307 → `/offline` 200** text/html. The final 200 must not be described as a direct, redirect-free response.
- Four PNGs 200 image/png with valid PNG signatures and both dimensions 192×192 / 512×512 / 512×512 maskable / 180×180 Apple.
- Root visually opened the actual maskable512 PNG: original paper/three-line mark on full forest-green canvas, centered with substantial safe margin; corners/background are visibly filled. This is a file-level visual check, not a physical home-screen crop/launch test.
- Static resource Cache-Control `public, max-age=0, must-revalidate`; unauthenticated auth/me 401 application/json with `no-store`.
- HTTPS actual hosted install, physical iOS/Android Add-to-Home-Screen and standalone launches are not verified by localhost or desktop Chromium.

## Remaining meaningful evidence gaps / mobile issue

- Viewed real `handover/docs/screenshots/05-student-390.png` via view_image. Top desktop navigation wraps to three rows while fixed mobile bottom navigation also appears; right-hand Notifications is cut in the 390px screenshot. Installation guide was deliberately expanded by the test; do not mistake its expanded state for the default.
- 05 and 06 were saved after opening the same guide, so they do not demonstrate two distinct app states. Capture a clean mobile home plus a separate expanded guide; include at least one actual 768px screenshot and appropriate teacher/admin mobile checks.
- Offline E2E no longer cuts the network or reloads. It inspects precached offline HTML while online and dispatches an `offline` event; this proves cache content and an event/banner path only. It does not prove actual navigation fallback, mutation failure under network loss, recovery, or safe SW update.
- Several E2E assertions are weak: the next-lesson case only conditionally tests text for Friday, and the layout case principally resizes login, not every role in both languages. A green suite must not be described as complete four-role mobile/desktop acceptance.
- Backend's new real R02→R03 upgrade probes independently fail; source and full evidence in R03_API_RESULTS.md. SW boundary/harness results and remaining frontend error/locale details are separate reviewer reports.

R03 is not ready to publish. Root runtime will be stopped before Cursor edits the next round. No GitHub push or live Site deployment has occurred.

## Late actual offline observation and falsifiable hypothesis

Root stopped its own isolated production Worker (session 62380), then reloaded its previously loaded production tab through Cua. The browser showed its network-error page (`ERR_FAILED`) rather than the app's bilingual offline page. The browser tool disallowed that internally generated error-page data URL; root did not bypass the URL policy. Because controller ownership was not established before the reload, this observation alone is not proof of a specific SW root cause or a physical-device install failure.

The real Worker redirect above supplies a concrete hypothesis: the actual install handler performs `fetch('/offline.html')` followed by `cache.put(path, response)` (sw.js18–20), which can store a response whose final URL is `/offline` and whose `redirected` flag is true. Returning that cached response directly for a navigation with non-follow redirect mode can be rejected as a network error. This must be reproduced with the actual built Worker, an asserted active controller, real offline mode, and a full reload; an online cache inspection or synthetic offline event is insufficient.

The routing behavior is documented by [Cloudflare HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/) (default auto-trailing-slash). The response/request restriction is in [WHATWG Fetch HTTP fetch](https://fetch.spec.whatwg.org/#http-fetch), step 3.5.7. This is an inference linking an observed redirect to a possible browser failure, not yet a confirmed causal reproduction. Use a safe canonical public route or otherwise fix the public response handling without permitting private redirects; keep a red-before/green-after real-navigation regression.
