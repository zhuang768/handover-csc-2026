# Handoff

Round 5's integrated local checks and three pinned historical probes passed. The public Site and GitHub repository are available. Version 3 passed hosted offline verification and a real version 1 → 3 browser update. Round 3 did not pass independent review. Do not treat an older 82-pass run as the current suite.

Codex completed the Round 5 repairs after Cursor stopped at its usage limit before making Round 5 product changes. The [live app](https://handover-campus-2026.ziz81503.chatgpt.site), [public repository](https://github.com/zhuang768/handover-csc-2026), and [successful GitHub CI run](https://github.com/zhuang768/handover-csc-2026/actions/runs/37145231969) are recorded here. Physical-phone installation and final Devpost submission remain unverified.

## Round 5 handoff

- Pending API writes block version reload; cross-week notification read failures remain visible while the detail opens. The tablet capture waits for the signed-in teacher workspace. iOS guidance enables Open as Web App on the add screen before Add.
- Legacy `seed_revision=2` repair fills missing data and completion markers in one batch. Existing requests and arrangements stay; a missing sample for a changed lesson is inactive with an accurate current snapshot. New sample side effects require its insertion token. Only exact known demo material stubs receive the local worksheet URL.
- Root's final local checks: 33 product tests, format, lint, types, and build exited 0; the independent suite passed 85 with 0 skipped; dev E2E passed 9/9 (15.6 s), built E2E passed 6/6 (5.6 s), with offline direct 200 and no Location.
- The notification/profile locator failures were corrected and both full E2E suites were rerun successfully. Four local built-Worker sessions passed conflict rejection, the request return/resubmit/confirm/cancel lifecycle, student privacy and todo persistence, timetable restoration, and logout revocation. See `TEST_REPORT.md` for the reviewer fixture corrections and exact scope.
- The three true R02 historical probes passed against a fixed export: a complete legacy school and two real interrupted-seed schools. The stored wrapper's DDL comparison was corrected only to ignore exact Drizzle statement-breakpoint comment lines; all remaining SQL bytes and business assertions were retained.
- Four demo sessions passed the same lifecycle, privacy, todo persistence, timetable restoration, and logout checks on hosted HTTPS before public access was enabled. Secure session cookies and private-response `no-store` were checked. Hosted ordinary registration and demo reset were not exercised.
- After public access was enabled, anonymous root access returned 200, anonymous API access returned 401 with `no-store`, and the manifest, four PNG icons, and service-worker MIME were checked. The first hosted HTML redirect prevented caching the designed offline HTML; its embedded generic fallback remained. That designed-page issue is fixed and verified in version 3 below. No final Devpost submit or participant terms/eligibility action is included.

## Round 6 canonical offline-page repair

The first extensionless `/offline` attempt passed 6/6 local built cases in 7.4 seconds but failed the production MIME check: the host served `application/octet-stream`. Those local results did not establish the hosted result. The final asset is `/offline.htm`, with a bumped public-cache version. Final local product tests passed 34/34; format, lint, types, and build each exited 0; the direct built Playwright run passed 6/6 in 5.2 seconds. Pinned service-worker behavior checks passed 28/28 and detected all six unsafe fixtures.

On public HTTPS version 3, `/offline.htm` passed strict HTTP checks: 200, no `Location`, `text/html`, and the designed page with the platform footer. The same authored offline browser test ran through the opt-in hosted configuration and passed 1/1 in 17.8 seconds. It verified the real controller, the canonical offline-page cache entry, no old paths or API/private entries, a bilingual offline reload, and an offline profile error with no successful-save message or persistence after reconnecting. It did not reset data or successfully write a profile. See `TEST_REPORT.md` for the exact command.

The root also exercised a real hosted version 1 → 3 waiting-worker update in the native browser. An unsaved Mina 7A name change showed a warning without a reload button. Restoring the original name exposed the button; clicking it performed a real reload, preserved the Mina 7A student session and Traditional Chinese, and dismissed the banner. This was not an injected update seam. Physical-phone installation remains unverified. The linked successful CI run is for the earlier release; current workflow status is available in [GitHub Actions](https://github.com/zhuang768/handover-csc-2026/actions).

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
