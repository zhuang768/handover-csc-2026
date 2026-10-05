# R02 independent documentation/migration re-review

2026-10-04, Asia/Taipei. Product commit: `73d32c1ee1a5d764d0dcf8b755b60c0de6eb808a`; status-only HEAD: `1f1fe7704f92cdc14dd6a819aedeacec909a2f2c`. Both app trees: `dd2569753e139cd2ba5ce78c34ba1b22ac3e55ef`. This is translated historical evidence.

**Schema/journal/snapshot and empty local D1 migrations passed; clean README setup failed and submission documents required completion.** Only this report changed; no product/GitHub/Sites/Devpost writes or shared DB/devserver use.

## Actual execution scope/results

`git archive 73d32c1:handover` created `/tmp/handover-r02-docs.uDXiYt/app` (macOS realpath `/private/tmp/...`). Dependencies, artifacts, profile, and DB stayed in that copy/dedicated parent. Node `v26.3.0`, npm `11.16.0`, not CI Node 22.

| Actual command/check | Exit | Result |
| --- | ---: | --- |
| `npm ci` | 0 | Lockfile installed 688 packages; deprecated/allow-scripts warnings, subsequent build succeeded without further script allowances |
| bundled `configure-execution-profile.mjs` | 0 | Portable; only copy ignored `.sites-runtime` changed |
| `node ../metadata-check.mjs` | 0 | Journal/order/SQL/snapshot chain/14 tables/column defaults/not-null/PK/indexes/partial predicates matched |
| `npm run db:generate` | 0 | `No schema changes, nothing to migrate`。 |
| `diff -ru ../drizzle-before drizzle` | 0 | No regenerated SQL/metadata differences |
| `npm test` | 0 | 24 passed，0 failed。 |
| `npm run typecheck` | 0 | `tsc --noEmit`。 |
| `npm run lint` | 0 | No lint errors |
| `npm run format:check` | 0 | All matched files use Prettier code style。 |
| bundled `build-site.mjs` → `npm run build` | 0 | Full Vinext client/server/RSC/SSR build succeeded |
| Empty local D1 `migrations apply DB --local` | 0 | `0000_init.sql`, 22 commands succeeded, recorded in `d1_migrations` |
| Same D1 migrations apply again | 0 | No migrations to apply |
| D1 ledger/table query | 0 | `0000_init.sql`; 14 product tables plus `_cf_METADATA`, `d1_migrations` |
| Migrated Worker four-demo-session/workspace probe | 0 | Student/teacher0/teacher1/admin login/workspace 200, HttpOnly true, all auth/me 200 |
| Seed role count | 0 | Admin 1, teachers 8, students 36 |
| Clean README dev/demo probe | **1** | GET `/` 200; demo POST 500 `{"error":"INTERNAL"}`; server: `no such table: users` |

`metadata-check.mjs` was copied only into owned scratch from section 2 of [MIGRATION_RELEASE_CHECKS.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/MIGRATION_RELEASE_CHECKS.md). SQL SHA-256: `d354f114786516e6b7e1d7859dcef5a556d1d6d01b5f6528e9eb8b76e2515c08`.

## Required documentation/reconstruction repairs

1. **[README.md:9](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/README.md:9) cannot reconstruct a usable empty DB.** `npm ci` → `npm run dev` creates the binding without migrations. After request-time DDL removal, demo fails with missing tables. DECISIONS mentions migration, but README lacks command/config/persistence/seed instructions. Add a reliable local script/command and rerun the full README from an empty DB. Existing seeded dev data does not disprove this reproduced blocker.
2. **[TEST_REPORT.md:40](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/TEST_REPORT.md:40) contradicts [line 50](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/TEST_REPORT.md:50).** One claims 390/768/1440 with no overflow; the other says one width/three untested. Separate Round 1/Round 2/SHA/date/scope and current missing evidence. 24 API tests, 73 earlier independent counts, new backend, browser, Worker, and production results cannot become one PASS.
3. **[DEVPOST_SUBMISSION.md:92](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/docs/DEVPOST_SUBMISSION.md:92) short AI disclosure names only Codex.** AI_DISCLOSURE lines 7/22 name Codex and Cursor. Synchronize Built with/short disclosure/prior assets so the actual submission does not omit Cursor. Fill known starter/fonts/Lucide/vendor facts; the participant confirms additional preexisting assets.
4. **README delivery details are incomplete.** Requirements include architecture, `.env.example`, migration/seed, license, and a 30-second judge guide. README had only brief introduction/roles/checks. Tracked `.env.example` contains demo invite/DEMO_MODE, but local/Sites runtime configuration is unexplained. Add actual public/repo links only after publication.
5. **[SUBMISSION_CHECKLIST.md:96](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/SUBMISSION_CHECKLIST.md:96) places repo/site publication among participant-only tasks.** The user already authorized GitHub/public delivery; root may complete it after acceptance without repeated approval blockers. Participant retains eligibility/name/team/guardian/terms/prizes/video sharing/final Devpost submission.

Unspecified product license is not a GitHub upload blocker. State product currently unlicensed and third-party notices apply to their assets. Do not select MIT for the user or label vendor OFL/ISC/MIT as the whole product license.

## Migration compatibility concern before production publication

SQL/snapshot/schema **content consistency passed**, as did Wrangler local full SQL-script execution. But `0000_init.sql` lacks `--> statement-breakpoint` markers while journal has `breakpoints=true`. Actual check:

```sh
node --input-type=module <<'NODE'
import {readMigrationFiles} from 'drizzle-orm/migrator';
console.log(JSON.stringify(readMigrationFiles({migrationsFolder:'./drizzle'}).map(m => ({
  breakpoints:m.bps,
  statementChunks:m.sql.length,
  containsCreateTables:(m.sql.join('\n').match(/CREATE TABLE/g)??[]).length
}))));
NODE
```

Exit 0: `[{"breakpoints":true,"statementChunks":1,"containsCreateTables":14}]`. Installed `drizzle-orm/d1/migrator.js` calls `db.run(sql.raw(stmt))` for each chunk. Missing markers produce one multistatement prepared query, unlike Sites guidance of one prepare statement.

**Recommendation: retain generated statement breakpoints before first deployment; update parent SQL and rerun metadata/db:generate NOOP/empty D1.** The Site had not applied this migration yet; after application never rewrite history. This does not claim actual Sites deployment failure: no native deploy ran, and a local helper cannot establish the server parser.

An extra standard Drizzle D1 migrator probe produced no valid result: standalone Miniflare `getD1Database()` never resolved the binding in two owned empty states. First manually stopped (exit 137); second used `cf:false`/disabled fetch/20-second timeout (exit 124). Only `probe begin`, never reaching migrate. Tool limitation, **neither product failure nor standard migrator pass**. Actual Wrangler Worker/D1 passed above.

## Reproduction commands for README blocker and empty D1

Start the owned app copy following the original README without migration:

```sh
cd /tmp/handover-r02-docs.uDXiYt/app
npm run dev -- --port 8897 --host 127.0.0.1
```

In another terminal run this **actually used** probe: exit 1, GET 200, demo POST 500:

```sh
node --input-type=module <<'NODE'
const base='http://127.0.0.1:8897';
const page=await fetch(base);
console.log('GET /',page.status);
const response=await fetch(base+'/api/auth/demo',{method:'POST',headers:{Origin:base,'content-type':'application/json'},body:JSON.stringify({role:'student'})});
console.log('POST /api/auth/demo',response.status,await response.text());
process.exitCode=response.status===200?0:1;
NODE
```

Stop the server, build fresh, read the new binding, and generate config outside source:

```sh
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const built=JSON.parse(readFileSync('dist/server/wrangler.json','utf8'));
const binding=built.d1_databases.find(d=>d.binding==='DB');
assert.ok(binding);
writeFileSync(resolve('../wrangler-migration.json'),JSON.stringify({
  name:built.name,compatibility_date:built.compatibility_date,
  d1_databases:[{...binding,migrations_dir:resolve('drizzle')}]
},null,2));
NODE
WRANGLER_SEND_METRICS=false WRANGLER_WRITE_LOGS=false CI=true node node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --local --persist-to ../d1-state --config ../wrangler-migration.json
WRANGLER_SEND_METRICS=false WRANGLER_WRITE_LOGS=false CI=true node node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --local --persist-to ../d1-state --config ../wrangler-migration.json
WRANGLER_SEND_METRICS=false WRANGLER_WRITE_LOGS=false node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --persist-to ../d1-state --config ../wrangler-migration.json --command "SELECT name FROM d1_migrations ORDER BY id;" --json
WRANGLER_SEND_METRICS=false WRANGLER_WRITE_LOGS=false node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --persist-to ../d1-state --config ../wrangler-migration.json --command "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;" --json
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to ../d1-state --ip 127.0.0.1 --port 8898 --inspector-port 0
```

New dist binding `migrations_dir` is `./drizzle`, with config in `dist/server/`. Relative paths resolve from the config directory, so this round used an isolated config with **absolute source drizzle path**. Do not repair README with the wrong migration path.

Port 8898 Node probe sent same-origin demo POST for student/teacherIndex 0/1/admin, asserting 200/correct role/HttpOnly; cookies remained only in memory. Then auth/me/workspace returned 200. Workspace lessons: 20/5/7/60; requests: 1/2/2/7. The same DB config role COUNT query returned 1/8/36. Both servers and standalone probes were stopped.

## Consistent documents and facts still to fill

- Root [README.md:3](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/README.md:3) correctly links the app and labels historical notes; it does not establish eligibility. Relative links work in the parent-root GitHub layout.
- HANDOFF/DECISIONS correctly record removed request DDL, backend authorization, real sessions, salted PBKDF2/recovery, no email, and reset preserving real users. Deep concurrency claims belong to the backend report; this report does not claim seed races are resolved.
- Parent `.github/workflows/ci.yml` uses Node 22/working-directory handover/correct lockfile cache. Commands align npm ci/format/lint/types/tests/build, with no continue-on-error. Actual GitHub CI had not run; local Node 26 is not cloud Node 22 evidence.
- CREDITS/detailed AI disclosure includes starter/Manrope/Noto Sans TC/Lucide/shadcn. Two self-hosted fonts/OFL notices exist; no stock photos. Warm paper/forest tokens match design notes. Minor difference: notes say motion only transform/opacity; CSS also transitions background-color/color. Fix copy without product changes.
- Devpost copy remains draft. Agents can fill verified libraries/counts/SHAs/limits/credits. Public/repo URLs await real publication; participant confirms names/team/understanding. Never paste unresolved `[CONFIRM]` fields into submission.
- DEMO_SCRIPT is 120 seconds, with 7 screenshot storyboards and AI/synthetic labels meeting the brief. No actual `docs/screenshots/` output yet. Script/plan do not claim recorded media; file existence is not media delivery.
- Checklist retains official deadline contradiction, earlier Taiwan 2026-10-05 15:00, target 12:00. Optional video, five criteria, and Render Workflows restrictions remain accurate. No browsing repeated this round.
- `handover/tsconfig.tsbuildinfo` remains tracked. After handback, ignore/remove from index but preserve the local file. Release checkout must exclude check-generated buildinfo.

Root still owns release: external Git root tree equals parent `HEAD:handover`, same Site project/DB, complete byte-identical archive SQL/meta at `dist/.openai/drizzle/`, environment revision, native succeeded/actual URL, and anonymous public role workflow. No reason for a new Site/production DB. Local PASS does not mean production PASS.
