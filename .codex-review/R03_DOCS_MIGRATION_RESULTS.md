# R03 documentation, migrations, and Sites package re-review

Date: 2026-10-04, Asia/Taipei. Independent review only; no product changes, deployment, upload, or external account operations. This is translated historical evidence.

**Empty startup, four demo logins, SQL migrations, Drizzle metadata, build artifacts, and local packaging passed; legacy application upgrade/production PWA were not established.** Backend separately reproduced R02 initialization compatibility failure; repair/re-review required. Two documentation validation/deployment claims also need repair.

## Pinned version and isolation

- Product commit: `f3fa696115a86f98995686b6bb934b90492133ab`.
- app tree：`911adb7043d89b7487b12b9bb3d06876457699a5`。
- Ending root HEAD: `b3753d7e35562359368978d23b902124732e0631`, status-only. Git diff against f3 and git status for handover/.github both had no output; HEAD app tree unchanged.
- `git archive f3fa696115a86f98995686b6bb934b90492133ab:handover` exported `/tmp/handover-r03-docs.0k49OP/app`. No embedded Git/shared root D1/dev server.
- Own dev port 8897; D1 prepared-chunk probe 8898. Both stopped with Ctrl-C, exit 0.
- Shared product lint/typecheck/build not rerun. Required Sites build ran only in the export.

## Checks actually executed by this agent

Relative paths use exported app CWD; Sites helpers come from the read bundled `sites/0.1.75` plugin.

| Command/check | Exit | Result/scope |
| --- | ---: | --- |
| `npm ci` | 0 | 688 packages, no dependency/lockfile change |
| bundled `configure-execution-profile.mjs`, portable | 0 | Only dedicated ignored runtime config |
| `node ../metadata-check.mjs`, from MIGRATION_RELEASE_CHECKS | 0 | Journal/order/inventory/two-snapshot chain/14 tables/columns/defaults/PK/named indexes/partial predicates match |
| `npm run db:generate` + drizzle backup diff | 0 | NOOP, no SQL/journal/snapshot change |
| `npm test` | 0 | 26 pass: 24 API + 2 PWA source checks |
| `npm run test:e2e -- --list` | 0 | 6 tests/1 file listed; the full 6 browser cases were not run by this agent |
| `npm run dev -- --port 8897 --host 127.0.0.1 --strictPort` | 0 (stopped) | Actually empty default `.wrangler/state`; local migration prompt answered, 0000+0001 automatically applied, Vinext ready |
| Dedicated Node fetch login probe | 0 | GET `/` 200; Student/Teacher 0/Teacher 1/Admin demo 200/correct roles/HttpOnly, all workspace 200 |
| `npm run db:migrate` on fresh state | 0 | No migrations to apply |
| Wrangler local actual R02 0000→R03 0001 | 0 | Only 0001 added, old request/reason preserved, token null, ledger 0000/0001, second apply NOOP. SQL/data preservation only, not application upgrade pass |
| Old/new 0000 comparison after marker/whitespace normalization | 0 | Identical DDL, no substantive applied-history rewrite |
| Dedicated Worker `DB.batch(chunks.map(sql => DB.prepare(sql)))` | 0 | 14 tables/7 named indexes created; matches snapshot excluding `_cf_METADATA` |
| bundled `build-site.mjs` in export | 0 | Five portable Vinext Worker build phases, `dist/server/index.js` exists |
| `package-site.sh "$PWD" ../handover-r03-local-review.tar.gz` | 0 | Local only; PWA/SQL/journal/snapshots in tar byte-identical to source |

Local migration config copied from `wrangler.migrate.json`. Old SQL exported with `git show 73d32c1:handover/drizzle/0000_init.sql`. Owned states: `../upgrade-state`, `../chunk-probe-state`.

### Specific migration conclusions

- 0000 SHA-256：`0e4981fa31a01abd5f9a20d0928d37451b294382a9396c27083bec944c7a4039`。
- 0001 SHA-256：`b6e2047d90a0dc2524de142e1e95270285cb9199e53fbdfe9db0923754957248`。
- 0001 snapshot/schema add nullable text `requests.transition_token`; 14 tables, requests has 21 columns.
- Journal top version 7 versus entry/snapshot 6 are distinct fields, not automatic error; chain/alignment passed.
- 0000 Drizzle reader produces 14 nonempty chunks, 5 with multiple CREATE statements. Actual local D1 batch created 14 tables/7 indexes. **No evidence to classify this as Sites failure**; at most formatting/readability advice. Root still needs actual Sites publication evidence.

### Existing R02 application upgrade still failed

Separate [R03_API_RESULTS.md](R03_API_RESULTS.md) used actual R02 service/schema/seed/real session: `seeded=1` not accepted by `seed_complete=1`, reseed hits class constraint, auth/me 200→409. Complete/partial legacy states both reproduced; accounts/sessions/data were not deleted.

SQL upgrade exit 0/row preservation does not override the backend blocker. Preserve complete arrangements/states; atomically add only missing partial demo records. No blind seeded→complete or reset. Next: full 84 counts and actual Worker upgrade login.

## Documentation and CI audit

1. **README production migration instruction needs repair.** README line 37 says run db:migrate before deployment, but migrate-local-d1.mjs always uses --local/migration-only config and cannot modify Sites production D1. Document local only; Sites applies portable SQL/metadata through the existing publication flow. Never remove --local or invent a remote DB ID.
2. **TEST_REPORT Not verified contradictions.** Round 3 records 6 E2E/390/768/1440, but lines 69/71 still claim widths/Playwright untested. Label historical Round 1 or actual missing physical phone/hosted HTTPS/SW/legacy compatibility evidence.
3. **82 count was true, but scope changed.** Original 82 pass was independently rerun, not fabricated. Root authorized two legacy cases; new 84 exit 1/82 pass/2 fail. Do not describe old 82 as complete backend/migration acceptance.
4. Six E2Es are not a full walkthrough: widths only test sign-in; others cover student next lesson, forced 500 draft retry, install guide/manifest, SW allowlist/synthetic offline event, and admin dark profile. No full request→confirm→student→admin, no context.setOffline navigation. Report 6 pass without claiming full real offline/phone installation.
5. CI uses handover/Node 22/correct lockfile, npm ci/format/lint/types/26 tests/Chromium install/E2E/build, with no weakened checks. New GitHub cloud CI had not run; local 26 is not CI 22 evidence. Clean machines need browser installation; CI already has `npx playwright install --with-deps chromium`, which README can add as a prerequisite.
6. Root README links the app/distinguishes historical notes. README/HANDOFF disclaim deployment this round. Eligibility/name/terms/Devpost remain human; deadline contradiction retained.
7. Detailed/short AI/Built with disclose **OpenAI Codex and Cursor**, not runtime model inference. CREDITS includes starter/Manrope/Noto Sans TC/Lucide notices. Product is currently unlicensed; not a technical GitHub release blocker.
8. Devpost `[CONFIRM]` fields remain: root fills verified package/version/scope and actual URL/repo/video; participant checks name/eligibility/prior work. No unresolved placeholders in final submission.
9. `tsconfig.tsbuildinfo` was removed from parent index/ignored there, but R03 app `.gitignore` lacks `*.tsbuildinfo` with incremental=true. External app-only checkout cannot inherit parent ignore. Helper git add --all after checks could capture the artifact. Root must fix source ignore/commit/export, not only privately patch the release copy.

## Actual screenshots

Viewed 6 actual PNGs in handover screenshots, not mockups. Five unique images meet the 5–8 minimum, but content can improve.

| File | Actual PNG size | Observation |
| --- | --- | --- |
| 01 login | 1440×900 | Normal Traditional Chinese sign-in |
| 02 student | 1440×1003 | Actual student workspace |
| 03 teacher | 1280×2459 | We couldn’t reach server/Checking timetable from forced retry; retake after recovery for normal workflow |
| 04 admin | 1280×924 | Dark admin profile, not operational overview/history |
| 05 student mobile | 392×1725 | Install guide open, byte-identical to 06 |
| 06 install guide | 392×1725 | Same as 05, SHA-256 `3e3fc6cc6c123dacb8d851904696b29f35d21cb2dcbbfd0aeb2c2d4bc4960e72` |

Recommend 6 unique important flows without unexpected server banners: recipient acceptance/student preparation/admin record. README 390×844 is viewport size; actual 392 width merits an overflow check. Full-page height beyond viewport is normal. Desktop Chromium is not physical installation evidence, as documentation states.

## Sites/PWA: local evidence and pending production checks

- Existing project `appgprj_6ac11cc258608191ba6f05fcd6e031fb`, binding DB, and portable Worker entry exist; not a mistaken static build.
- dist/client/local tar contain manifest, SW, offline.html, favicon, 192/512/maskable512/apple180 PNGs, byte-identical; no assets lost. Two SQL files/journal/two snapshots included.
- Local dev: manifest 200/application/manifest+json/root scope/no-cache; SW 200/text/javascript/no-cache; offline 200/text/html; four PNGs 200/image/png/signature and IHDR 192²/512²/512²/180².
- Build `_headers` contains only `_next/static/*` immutable caching. Dev no-cache does not prove production. Check hosted manifest/SW/API/private HTML headers/controller/allowlist/real offline/login not cached through RELEASE_PLAN 6A.
- Root built Worker observed offline.html 307→offline 200 and stopped-Worker IAB reload ERR_FAILED. Controller unproven: **not isolated SW root-cause evidence**. Next use a built controlled page/real offline reload; synthetic events are insufficient.
- No public deployment/hosted fetch/native Sites migration/physical phone evidence. This agent used no publication tools. External release checkout must retain accepted tree/same Site outside parent Git; no new Site/account.

## Review-operation corrections (not product failures)

- First fresh dev was still at the migration prompt; early fetch was refused and manual migration ran. Stopped process/backed up owned state, then reran README from nonexistent default state. Fresh PASS above is the actual second empty run.
- Initial chunk-probe config date 2026-10-01 exceeded installed workerd support. Owned probe changed to actual app date 2026-05-15 and passed. Cloudflare error report declined; no external write.
- First chunk count forgot to exclude `_cf_METADATA`, yielding 15 instead of 14. Read-only product table/snapshot recheck passed. Reviewer count mistake, not a missing product table.

**Delivery limit:** SQL/fresh local/package passed; release awaited legacy repair/document consistency/actual PWA acceptance. Physical installation/personal Devpost actions remain human, not desktop-simulation claims.
