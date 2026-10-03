# Round 01 preliminary evidence — Cursor still implementing

These observations are not a completed review. Revalidate against Cursor's finished source before sending the repair round or publishing.

## Reproduced HTTP method authorization gap

Observed in `handover/server/service.ts`, `handleApi`, the `/requests/:id/(submit|respond|status|supplements|todo|view)` dispatch.

- Create a complete, valid move Draft with an authenticated demo teacher using POST `/api/requests`.
- Request GET `/api/requests/:id/submit` using the same real server-issued session.
- Independent in-memory SQLite API probe returned `{ "probe": "GET-submit", "status": 200, "state": "Pending" }`.
- Expected: only POST may submit; GET must be rejected and retain Draft with no slot lock, timeline, audit or notification writes.
- Impact: GET bypasses the mutation Origin check and may be triggered by cross-site top-level navigation with SameSite=Lax cookies. All action routes need explicit method validation, not only front-end POST calls. Audit GET/HEAD for other unexpected business-state writes.
- Add a regression that invokes each mutation via GET/HEAD/DELETE/PATCH where inappropriate, checks an error and verifies unchanged DB state.

## Reproduced initial test-helper defects

`handover/tests/sqlite-d1.ts` initially used a constructor parameter property unsupported by native Node strip-types, plus awaited each statement inside a transaction, allowing nested transactions during concurrent calls. An independent adapter was created outside the product in `.codex-review/review-d1.mts`; both its parallel-uniqueness and rollback tests passed. Cursor may already be fixing its own helper; recheck before reporting.

## Isolated runtime probe

Using the installed Miniflare/workerd runtime, PBKDF2 at 100000 and 120000 both succeeded. Do not report a guessed 100000 limit for this installed runtime. Workers exposed `crypto.subtle.timingSafeEqual`; Node's global Web Crypto did not. Revalidate password/invitation/recovery code portability if the finished service still calls that extension directly.

## Remaining observations to verify, not final findings

- Drizzle schema/snapshots/journal vs hand-written SQL and runtime schema initialization.
- Atomic accept/cancel/decline, acceptance recheck and cancellation restoration to the actual request baseline.
- Demo reset protection for normally registered users' progress on demo records.
- Admin weekly counts must not include unrelated old Pending/Declined rows.
- Student-safe raw payload whitelist, including reason/timeline/supplements/notifications.
- Entirely functional UI, dates, i18n, all required artifacts, public deployment and correct GitHub source state.
