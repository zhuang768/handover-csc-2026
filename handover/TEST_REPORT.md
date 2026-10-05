# Test report

## English-only migration, 2026-10-05

The source interface and project documentation have been converted to English only. The root's actual integrated local results after the update are:

- `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run build` — each exit 0.
- `npm test` — exit 0, 34 passed.
- Dev Playwright suite — exit 0, 13/13 passed.
- Direct built Playwright configuration after the build — exit 0, 6/6 passed, 6.7 seconds.
- Eight English screenshots were regenerated on 2026-10-05; their actual PNG dimensions are recorded in [docs/screenshots/README.md](docs/screenshots/README.md). Student and teacher captures were visually checked for healthy signed-in workspaces.

The new `npm run check:english` command scans maintained Git text, including reviewer documents, for Han characters and is included in CI. Its full-project run is pending completion of the reviewer-document translations. Hosted verification of the English-only update is still pending. The earlier records below retain their historical language coverage and are not presented as newly run English-only hosted checks.

## Earlier verification record

Date: 2026-10-03, Asia/Taipei. Machine: local macOS, Node.js v26.3.0 for the API suite. Project: `handover/`.

## Command

```bash
cd handover
node --experimental-strip-types --test tests/api.test.ts
```

## Result

PASS. 24 tests, 0 failed.

Covered by that run:

- Incomplete handover cannot be submitted; a draft can.
- Class collision blocks submit; a free substitute slot can be submitted.
- Decline requires a comment; the original teacher can edit and resubmit; only the assigned teacher can accept.
- Student preparation survives a reload. Teacher notes are absent from the student payload.
- Another teacher cannot edit the draft. Students cannot call teacher or admin mutations. A forged role on profile is rejected. Cross-origin mutation is rejected.
- Registration, invitation failure, recovery-code rotation, session revocation, logout, and demo reset that keeps a real registration.
- Two concurrent submits for one empty slot: one 200 and one 409.

## Also run

```bash
npm run lint          # exit 0
npm run format:check  # exit 0
npm run typecheck     # exit 0
```

`npm run build` completed with exit 0 on 2026-10-03 (`vinext build`, route `/` and `/api/:path*`).

## Round 5 local verification, 2026-10-04

Codex took over the authorized repairs after Cursor stopped at its usage limit before changing the product for this round. Repairs cover pending-write update protection, cross-week notification error feedback, the tablet screenshot login gate, the iOS installation sequence, and legacy school repair. Legacy revision 2 fills missing rows atomically, preserves established arrangements, and repairs only exact known demo worksheet stubs. A missing demonstration for an already changed lesson stays inactive instead of replaying a confirmation.

The Codex root ran the final integrated local checks after the source repairs:

- `npm test` — exit 0, 33 passed.
- `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run build` — each exit 0.
- `npm run test:e2e` — exit 0, 9 passed, 15.6 seconds.
- After the successful `npm run build`, the installed Playwright CLI ran `playwright test -c playwright.built.config.ts` directly against that build — exit 0, 6 passed, 5.6 seconds. The local built worker served `/offline.html` directly with status 200 and no `Location`. This local run did not invoke the combined `npm run test:e2e:built` script again.
- From the repo root, `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts` — exit 0, 85 passed, 0 skipped.

Earlier integrated E2E attempts had one dev notification locator failure and built notification/profile locator failures. The selectors were corrected; focused reruns passed, then both complete suites above passed. The final result is the complete rerun, not only those focused checks.

The root also used four independent demo sessions against a local built Worker. The preflight passed: an occupied target returned 409; Draft → Pending → Declined → corrected Pending → Confirmed → Cancelled completed; student payloads omitted private teacher fields; a student todo persisted; cancellation restored the timetable; and the old cookie returned 401 after logout. The review fixture initially used a move with a different recipient (422), and expected a student Draft response of 403 where the API intentionally returned opaque 404. The fixture was aligned with the existing API contract; the product was not changed to satisfy those incorrect expectations. Failed fixture drafts were cancelled, without resetting school data.

The root subsequently ran all three true historical R02 probes against a pinned product export: exit 0, 3 passed, 0 failed, 0 skipped. The complete R02 school retained ordinary accounts, sessions, edited rows, and its established record counts. Two genuine interrupted R02 seed attempts, failing on the first and second lesson insert respectively, upgraded to complete schools while retaining ordinary credentials and sessions. Known demo worksheet stubs were repaired without replacing an ordinary external URL. The product's partial-school regressions were not used as a substitute for these historical probes.

The saved probe wrapper initially stopped before its business assertions because it compared raw SQL bytes and treated Drizzle's `--> statement-breakpoint` comments as a DDL change. Its comparison now removes only those exact marker lines from both versions and still compares every remaining SQL byte. Product migrations and the three probes' business assertions were not weakened. Earlier rounds below retain their own revision and scope; a later passing run does not rewrite an earlier failure.

## Published deployment and GitHub CI, 2026-10-04

- Live HTTPS app: [handover-campus-2026.ziz81503.chatgpt.site](https://handover-campus-2026.ziz81503.chatgpt.site), with public access enabled.
- Public source: [zhuang768/handover-csc-2026](https://github.com/zhuang768/handover-csc-2026).
- GitHub CI: [successful run](https://github.com/zhuang768/handover-csc-2026/actions/runs/37145231969). The workflow uses Node 22 and runs `npm ci`, format, lint, types, product tests, dev E2E, and the combined `npm run test:e2e:built` script. That combined CI command builds before running the built Playwright configuration.

Before public access was enabled, the root exercised four demo sessions on the deployed HTTPS app: occupied conflict 409; Draft → Pending → Declined → revised Pending → Confirmed → Cancelled; student payload privacy and todo persistence; restored timetable after cancellation; and old-cookie 401 after logout. Cookies were Secure and HttpOnly, and private responses used `Cache-Control: no-store`. This hosted check did not register an ordinary account or reset demonstration data.

After public access was enabled, anonymous root access returned 200 and anonymous API access returned 401 with `no-store`. The manifest, four PNG icons, and service-worker MIME checks passed. The first production asset handler redirected the HTML asset, unlike the local built worker. Rejecting that redirected response prevented caching the designed offline HTML; the service worker still installed its embedded generic fallback. Resource accessibility alone did not prove that the designed offline page was cached. Version 3's successful canonical-resource and real offline-browser checks are recorded below.

Physical iPhone/Android installation and standalone launch have not been tested. Deployment/source identifiers are kept in the root release record rather than inserting a self-referential app commit into these files.

## Round 6 canonical offline-page repair, 2026-10-04

The first repair used an extensionless `/offline` resource and explicit HTML headers. The root ran these local checks:

- `npm test` — exit 0, 34 passed.
- `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run build` — each exit 0.
- After that build, `playwright test -c playwright.built.config.ts` — exit 0, 6 passed, 7.4 seconds. The canonical `/offline` returned 200 with no `Location` and `text/html`. A controlled offline reload showed the designed public page; an offline save was not reported as success or resent on reconnect. All five existing pending-write cases passed.
- Service-worker behavior probe — 28/28 passed; all six unsafe fixtures were detected.

That first attempt failed the strict production resource check: `/offline` was served as `application/octet-stream`, despite passing the local built cases. The extensionless attempt is not the final resource. The final repair uses `/offline.htm`; the root reran `npm test` (34 passed), format, lint, types, and build (each exit 0), then ran the built Playwright configuration directly (6/6 passed, 5.2 seconds). The pinned service-worker VM checks passed 28/28 and detected all six unsafe fixtures. The successful CI linked above records the earlier released version; it is not a CI result for this final repair. Current runs are listed in [GitHub Actions](https://github.com/zhuang768/handover-csc-2026/actions). The earlier Round 5 and historical-probe evidence retains its recorded scope.

### Public HTTPS version 3

The strict HTTP probe passed for `/offline.htm`: status 200, no `Location`, `Content-Type: text/html`, and a body containing the designed offline page plus the platform footer.

From `handover/`, the root ran the same authored `built-offline.spec` against the actual public HTTPS origin through the opt-in hosted configuration:

```bash
HANDOVER_TEST_ORIGIN=https://handover-campus-2026.ziz81503.chatgpt.site node ./node_modules/@playwright/test/cli.js test -c playwright.hosted.config.ts
```

PASS: 1/1, 17.8 seconds. This verified a real service-worker controller, `/offline.htm` as the canonical offline-page cache entry, no old fallback paths or API/private entries, and a real `setOffline` reload showing the then-bilingual public page, before the English-only update. An offline profile save showed an error, did not show Saved, and did not persist after reconnecting. No demo reset or successful profile write was performed. This is a hosted Chromium check, not a physical-phone install.

The root additionally used the native browser for a real hosted version 1 → 3 waiting-worker update. An unsaved Mina 7A name change showed only a warning and no reload button. Restoring the original name made the button appear; clicking it caused an actual reload, retained the Mina 7A student session and the then-selected language, and removed the update banner. This result used real versions and a real browser controller, not an injected UI seam.

## Round 4, 2026-10-04

Round 3’s independent review did not pass. A fixed export of `f3fa696` was reported as 85 counts, 82 pass / 3 fail, all three on legacy upgrade. This section is the later local run of the latest suite, not that export.

From `handover/`:

- `npm test` — exit 0, 26 passed (24 API + 2 PWA file checks).
- `npm run lint` — exit 0.
- `npm run format:check` — exit 0.
- `npm run typecheck` — exit 0.
- `npm run build` — exit 0. Built `dist/server/wrangler.json` has `assets.html_handling` `none`.
- `npm run test:e2e` — exit 0, 8 passed. Logged-in student, original teacher, and admin at 390, 768, and 1440, in English and Traditional Chinese in that historical release. Document `scrollWidth` was less than or equal to `clientWidth`. PNG files `05-student-390.png` and `06-install-guide-390.png` measured 390 CSS pixels wide, not 392.
- `npm run test:e2e:built` — exit 0, 1 passed. Built worker `GET /offline.html` with redirects disabled returned 200 and no `Location`. A controlled page reloaded while offline and showed the public bilingual page in that historical release. Reconnect did not submit the profile edit that failed offline.

From the repo root:

- `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts` — exit 0, 85 passed, 0 failed, 0 skipped. Includes the R04 row-preservation case. The Codex test files were not edited.
- Service worker behavior probe against `handover/public/sw.js` before commit — 28 passed, 0 failed. The reviewer command that pins a git SHA is run after the product commit.

### Independent root checks after the Round 4 handoff

The Codex root repeated `npm test` (26 passed), `npm run test:e2e` (8 passed), and `npm run test:e2e:built` (1 passed), each with exit 0. The built worker served `/offline.html` directly with status 200 and no 307. The controlled page showed only the public fallback on a real offline reload, and the failed offline profile save was not sent after reconnecting.

The root also exercised a real local browser update from the Round 3 service worker to Round 4. A changed profile field disabled the update action. Restoring the field enabled the action; clicking it waited for the new controller, reloaded to the home page, preserved the signed-in session, and removed the update banner. This verifies that local two-version profile-edit path. It is not a public deployment or a physical-phone install result, and does not prove every draft or comment path passed.

## Round 3, 2026-10-04

Round 2’s independent re-review did not pass. This section is only the later local run.

From `handover/`:

- `npm test` — exit 0, 26 passed (24 API + 2 PWA file checks).
- `npm run lint` — exit 0.
- `npm run format:check` — exit 0.
- `npm run typecheck` — exit 0.
- `npm run build` — exit 0. `dist/client/sw.js` is JavaScript, not an HTML fallback.
- `npm run db:generate` — exit 0, no schema changes after `0001_opposite_kree.sql`.
- `HANDOVER_PERSIST=/tmp/handover-r03-empty npm run db:migrate` — exit 0, applied `0000_init.sql` and `0001_opposite_kree.sql`. The same command again — exit 0, no migrations to apply.
- `npm run test:e2e` — exit 0, 6 passed. Chromium viewports included 390, 768, and 1440. Screenshots are in `docs/screenshots/`. This is a desktop browser at those sizes. A physical iPhone or Android install was not run.

From the repo root:

- `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts` — exit 0, 82 passed, 0 failed. The Codex test files were not edited.

## Round 2, 2026-10-04

`npm test` 24 passed. `npm run lint`, `format:check`, `typecheck`, and `build` exited 0. From the repo root, the Codex harness and independent API file exited 0 with 73 passed. Those files were not edited.

Browser on `http://127.0.0.1:5173/`: student Mina on Sunday saw no class today and the next Monday lesson, with the covering teacher and reminder, and no teacher reason. Primary button computed style was white `rgb(255,255,255)` on green `rgb(36,107,86)`. Teacher Maya opened a blank handover; Send stayed disabled and the form named the missing fields in both languages available in that historical release. The English-only update removes that switch; this is not a current operation or a new English-only test result. Demo buttons disabled while the login request was in flight. Admin Avery’s list had class and teacher filters plus date, status, and search. Widths 390, 768, and 1440 did not add a horizontal page scrollbar. 768 hid the bottom nav.

Not claimed: a full keyboard tour of every field, reduced-motion computed style, or a production deploy.

## Local server smoke

`npm run dev` on `http://127.0.0.1:5173/` served the sign-in page. `POST /api/auth/demo` with the student role returned 200 and an HttpOnly session cookie. In the browser, Student opened Mina 7A's workspace: 20 lessons in the school week, one confirmed handover, and no lessons on Saturday 2026-10-03.

## Not verified

These three bullets were the Round 1 limit. Round 4 measured 390, 768, and 1440 after login and ran Playwright, including a built-worker offline reload. They are not the current result.

Still not verified: physical iPhone/Android Add to Home Screen and standalone launch. Hosted ordinary registration and demo reset were not exercised in the four-session release walkthrough. Public HTTPS workflow, version 3's hosted offline reload and real version update, GitHub CI for the earlier release, and the three pinned historical probes have the evidence recorded above. The latest repair's CI status must be read from its actual workflow run; final Devpost submission is a separate participant action.
