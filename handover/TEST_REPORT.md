# Test report

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
- `npm run test:e2e:built` — exit 0, 6 passed, 5.6 seconds. The built worker served `/offline.html` directly with status 200 and no `Location`.
- From the repo root, `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts` — exit 0, 85 passed, 0 skipped.

Earlier integrated E2E attempts had one dev notification locator failure and built notification/profile locator failures. The selectors were corrected; focused reruns passed, then both complete suites above passed. The final result is the complete rerun, not only those focused checks.

The root also used four independent demo sessions against a local built Worker. The preflight passed: an occupied target returned 409; Draft → Pending → Declined → corrected Pending → Confirmed → Cancelled completed; student payloads omitted private teacher fields; a student todo persisted; cancellation restored the timetable; and the old cookie returned 401 after logout. The review fixture initially used a move with a different recipient (422), and expected a student Draft response of 403 where the API intentionally returned opaque 404. The fixture was aligned with the existing API contract; the product was not changed to satisfy those incorrect expectations. Failed fixture drafts were cancelled, without resetting school data.

The three true historical R02 probes remain pending until the final product commit is pinned. The product's partial-school and edited-arrangement regressions are not a substitute for those probes. No public HTTPS deployment, GitHub CI run, or physical iPhone/Android installation is claimed here. Earlier rounds below retain their own revision and scope.

## Round 4, 2026-10-04

Round 3’s independent review did not pass. A fixed export of `f3fa696` was reported as 85 counts, 82 pass / 3 fail, all three on legacy upgrade. This section is the later local run of the latest suite, not that export.

From `handover/`:

- `npm test` — exit 0, 26 passed (24 API + 2 PWA file checks).
- `npm run lint` — exit 0.
- `npm run format:check` — exit 0.
- `npm run typecheck` — exit 0.
- `npm run build` — exit 0. Built `dist/server/wrangler.json` has `assets.html_handling` `none`.
- `npm run test:e2e` — exit 0, 8 passed. Logged-in student, original teacher, and admin at 390, 768, and 1440, in English and Traditional Chinese. Document `scrollWidth` was less than or equal to `clientWidth`. PNG files `05-student-390.png` and `06-install-guide-390.png` measured 390 CSS pixels wide, not 392.
- `npm run test:e2e:built` — exit 0, 1 passed. Built worker `GET /offline.html` with redirects disabled returned 200 and no `Location`. A controlled page reloaded while offline and showed the public bilingual page. Reconnect did not submit the profile edit that failed offline.

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

Browser on `http://127.0.0.1:5173/`: student Mina on Sunday saw no class today and the next Monday lesson, with the covering teacher and reminder, and no teacher reason. Primary button computed style was white `rgb(255,255,255)` on green `rgb(36,107,86)`. Teacher Maya opened a blank handover; Send stayed disabled and the form named the missing fields in English and, after the language toggle, in Traditional Chinese. Demo buttons disabled while the login request was in flight. Admin Avery’s list had class and teacher filters plus date, status, and search. Widths 390, 768, and 1440 did not add a horizontal page scrollbar. 768 hid the bottom nav.

Not claimed: a full keyboard tour of every field, reduced-motion computed style, or a production deploy.

## Local server smoke

`npm run dev` on `http://127.0.0.1:5173/` served the sign-in page. `POST /api/auth/demo` with the student role returned 200 and an HttpOnly session cookie. In the browser, Student opened Mina 7A's workspace: 20 lessons in the school week, one confirmed handover, and no lessons on Saturday 2026-10-03.

## Not verified

These three bullets were the Round 1 limit. Round 4 measured 390, 768, and 1440 after login and ran Playwright, including a built-worker offline reload. They are not the current result.

Still not verified: a physical iPhone or Android Add to Home Screen, a public HTTPS deployment, the new GitHub CI run, and the three historical probes against the final pinned product. The root's real local two-version profile-edit update check is recorded under Round 4; Round 5's integrated suites add dirty-edit and pending-write protection checks.
