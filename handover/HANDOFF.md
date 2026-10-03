# Handoff

Branch `handover`. Round 5's integrated local checks passed. Round 3 did not pass independent review. Do not treat an older 82-pass run as the current suite.

Codex completed the Round 5 repairs after Cursor stopped at its usage limit before making Round 5 product changes. The final product commit and the three pinned historical probes are still pending; public HTTPS, GitHub CI, and physical-phone installation have not been verified.

## Round 5 handoff

- Pending API writes block version reload; cross-week notification read failures remain visible while the detail opens. The tablet capture waits for the signed-in teacher workspace. iOS guidance enables Open as Web App on the add screen before Add.
- Legacy `seed_revision=2` repair fills missing data and completion markers in one batch. Existing requests and arrangements stay; a missing sample for a changed lesson is inactive with an accurate current snapshot. New sample side effects require its insertion token. Only exact known demo material stubs receive the local worksheet URL.
- Root's final local checks: 33 product tests, format, lint, types, and build exited 0; the independent suite passed 85 with 0 skipped; dev E2E passed 9/9 (15.6 s), built E2E passed 6/6 (5.6 s), with offline direct 200 and no Location.
- The notification/profile locator failures were corrected and both full E2E suites were rerun successfully. Four local built-Worker sessions passed conflict rejection, the request return/resubmit/confirm/cancel lifecycle, student privacy and todo persistence, timetable restoration, and logout revocation. See `TEST_REPORT.md` for the reviewer fixture corrections and exact scope.
- Root will pin the product before running the three true historical probes, then deliver GitHub and the existing Site. No final Devpost submit or participant terms/eligibility action is included.

## Round 4 changes (historical)

- A complete legacy school, recognized by demo classes plus lessons, is marked `seed_complete` and is not inserted again. A partial legacy school fills missing lessons with `INSERT OR IGNORE` on classes and demo accounts. Edited profiles, real accounts, sessions, and established rows stay.
- Phone width uses one bottom navigation plus More. Simple view applies only while a student is signed in, and that student still has the day list.
- 401 responses leave the signed-in shell. Session check failures are not shown as a normal sign-out. Audit, reminder, and system action text follow the current language.
- The service worker only deletes `handover-public-` caches, ignores authorization, query, and RSC requests, and does not store a redirected response. Built assets use `html_handling: none`. On this machine `GET /offline.html` returned 200 with no redirect, and an offline reload showed the public page.
- `handover/.gitignore` ignores `*.tsbuildinfo`. `npm run db:migrate` is documented as local-only.

## Skills actually read

- `diagnosing-bugs`: the legacy 409 was tied to `seed_complete` versus `meta.seeded`, and the offline reload was tested on the built worker instead of a synthetic event.
- `workers-best-practices`: cache writes stay inside `waitUntil`; HTML handling is set so `/offline.html` is not canonicalized.
- `security-best-practices`: the public cache rejects authorization, secrets in the query, RSC requests, and redirected private URLs. The calendar response sends `cache-control: no-store`.
- Playwright skill: the repair asked for rerunnable test files, so the checks live in `@playwright/test`.
- `ai-debt-detector`: the update reload listens once for `controllerchange`; a failed offline save is not treated as success.

## Round 4 checks (historical)

From `handover/`:

- `npm test` — exit 0, 26 passed.
- `npm run test:e2e` — exit 0, 8 passed.
- `npm run test:e2e:built` — exit 0, 1 passed. `offline.html` status 200, no `Location`.
- `npm run lint` — exit 0.
- `npm run format:check` — exit 0.
- `npm run typecheck` — exit 0.
- `npm run build` — exit 0.

From the repo root:

- `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts` — exit 0, 85 passed, 0 failed, 0 skipped.

After the Round 4 handoff, the Codex root verified a local Round 3→Round 4 service-worker update with a dirty profile guard, controller change, session-preserving reload, and banner dismissal; see `TEST_REPORT.md`. Current Round 5 verification and remaining limits are listed above.
