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

Still not verified: a physical iPhone or Android Add to Home Screen, a public HTTPS deploy, and a browser run that installs two service-worker versions and waits for `controllerchange`. The update button waits for that event in code; that two-version browser run was not executed.
