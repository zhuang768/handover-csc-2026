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

## Round 2, 2026-10-04

`npm test` 24 passed. `npm run lint`, `format:check`, `typecheck`, and `build` exited 0. From the repo root, the Codex harness and independent API file exited 0 with 73 passed. Those files were not edited.

Browser on `http://127.0.0.1:5173/`: student Mina on Sunday saw no class today and the next Monday lesson, with the covering teacher and reminder, and no teacher reason. Primary button computed style was white `rgb(255,255,255)` on green `rgb(36,107,86)`. Teacher Maya opened a blank handover; Send stayed disabled and the form named the missing fields in English and, after the language toggle, in Traditional Chinese. Demo buttons disabled while the login request was in flight. Admin Avery’s list had class and teacher filters plus date, status, and search. Widths 390, 768, and 1440 did not add a horizontal page scrollbar. 768 hid the bottom nav.

Not claimed: a full keyboard tour of every field, reduced-motion computed style, or a production deploy.

## Local server smoke

`npm run dev` on `http://127.0.0.1:5173/` served the sign-in page. `POST /api/auth/demo` with the student role returned 200 and an HttpOnly session cookie. In the browser, Student opened Mina 7A's workspace: 20 lessons in the school week, one confirmed handover, and no lessons on Saturday 2026-10-03.

## Not verified

- Phone 390, tablet 768, and desktop 1440 were not measured as separate viewports. The browser check above was one width only.
- No public URL was exercised. Local tests are not a deployment test.
- Playwright end-to-end was not run.
