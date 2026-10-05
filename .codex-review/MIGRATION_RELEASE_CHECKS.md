# Minimum verification: empty database to Sites publication

Status: **procedure only, not executed or claimed passed.** 2026-10-04, Asia/Taipei. This translated historical record came from read-only product/Sites 0.1.75 instructions/helper inspection. Only this file was written; only root runs publication tools.

Cursor was implementing R02/R02B. Complete `db/schema.ts`, `drizzle/0000_init.sql`, `drizzle/meta/_journal.json`, and `0000_snapshot.json` now existed, with 14 snapshot tables. Earlier descriptions of empty schema/journal were outdated. **These require confirmation after handback, not final defect/pass claims.** Use a full accepted SHA only after handback, independent acceptance, and commit.

## 1. Export a frozen version outside the original workspace

These commands create a local review copy, not Site source open/publication. Replace `REPLACE_WITH_REVIEWED_FULL_SHA` with the accepted 40-character parent commit. Retain task-specific shell variables; never repurpose HOME/CODEX_HOME.

```sh
TASK_REPO='/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon'
REVIEWED_PARENT_SHA='REPLACE_WITH_REVIEWED_FULL_SHA'
export TASK_REVIEW_DIR="$(mktemp -d "${TMPDIR:-/tmp}/handover-migration-review.XXXXXX")"
mkdir "$TASK_REVIEW_DIR/app"
git -C "$TASK_REPO" cat-file -e "${REVIEWED_PARENT_SHA}^{commit}"
git -C "$TASK_REPO" rev-parse "${REVIEWED_PARENT_SHA}:handover"
git -C "$TASK_REPO" archive --format=tar --output="$TASK_REVIEW_DIR/app.tar" "${REVIEWED_PARENT_SHA}:handover"
tar -xf "$TASK_REVIEW_DIR/app.tar" -C "$TASK_REVIEW_DIR/app"
cd "$TASK_REVIEW_DIR/app"
node /Users/zhuangzijin/.codex/plugins/cache/openai-curated-remote/sites/0.1.75/scripts/configure-execution-profile.mjs
npm ci
```

Pass criteria: copy root contains package.json, .openai/hosting.json, db/schema.ts, and complete drizzle/, without another handover/ layer. Install with lockfile. macOS uses portable profile; only SITES_MANAGED_LINUX_CONTAINER=1 uses managed-linux. Original Cursor workspace remains untouched.

## 2. Journal → SQL → snapshot → schema consistency

Run in the exported copy. The memory SQLite check covers migration order, snapshot chain, final tables/columns/indexes/composite keys; it does not prove production D1 deployment.

```sh
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const journal = readJson('drizzle/meta/_journal.json');
assert.equal(journal.dialect, 'sqlite');
assert.ok(journal.entries.length > 0, 'empty journal');
const files = readdirSync('drizzle').filter(p => p.endsWith('.sql')).sort();
assert.deepEqual(files, journal.entries.map(e => `${e.tag}.sql`));
assert.deepEqual(readdirSync('drizzle/meta').filter(p => p.endsWith('_snapshot.json')).sort(), journal.entries.map(e => `${String(e.idx).padStart(4, '0')}_snapshot.json`));
const db = new DatabaseSync(':memory:');
let previousId = '00000000-0000-0000-0000-000000000000';
let lastWhen = -1, snapshot;
for (const [i, entry] of journal.entries.entries()) {
  assert.equal(entry.idx, i);
  assert.ok(entry.when > lastWhen, 'journal order');
  snapshot = readJson(`drizzle/meta/${String(i).padStart(4, '0')}_snapshot.json`);
  assert.equal(snapshot.dialect, 'sqlite');
  assert.equal(snapshot.version, entry.version);
  assert.equal(snapshot.prevId, previousId);
  assert.notEqual(snapshot.id, previousId);
  const sql = readFileSync(`drizzle/${entry.tag}.sql`, 'utf8');
  assert.ok(sql.trim().length > 0);
  db.exec(sql);
  console.log(entry.tag, createHash('sha256').update(sql).digest('hex'));
  previousId = snapshot.id; lastWhen = entry.when;
}
const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => r.name);
assert.deepEqual(tables, Object.keys(snapshot.tables).sort());
assert.equal(tables.length, 14, 'review expected schema count if intentional change');
for (const [name, table] of Object.entries(snapshot.tables)) {
  const columns = db.prepare('SELECT * FROM pragma_table_info(?)').all(name);
  assert.deepEqual(columns.map(c => c.name).sort(), Object.keys(table.columns).sort());
  for (const col of columns) {
    const expected = table.columns[col.name];
    assert.equal(col.type.toLowerCase(), expected.type.toLowerCase());
    assert.equal(Boolean(col.notnull), expected.notNull);
    assert.equal(col.dflt_value == null ? null : String(col.dflt_value), expected.default == null ? null : String(expected.default));
  }
  const expectedPk = Object.values(table.compositePrimaryKeys ?? {}).flatMap(p => p.columns);
  if (!expectedPk.length) expectedPk.push(...Object.values(table.columns).filter(c => c.primaryKey).map(c => c.name));
  assert.deepEqual(columns.filter(c => c.pk).sort((a,b) => a.pk-b.pk).map(c => c.name), expectedPk);
  const indexes = db.prepare('SELECT * FROM pragma_index_list(?)').all(name).filter(i => i.origin === 'c');
  assert.deepEqual(indexes.map(i => i.name).sort(), Object.keys(table.indexes).sort());
  for (const index of indexes) {
    const expected = table.indexes[index.name];
    assert.equal(Boolean(index.unique), expected.isUnique);
    assert.deepEqual(db.prepare('SELECT * FROM pragma_index_info(?) ORDER BY seqno').all(index.name).map(c => c.name), expected.columns);
    const sql = db.prepare('SELECT sql FROM sqlite_schema WHERE name=?').get(index.name).sql;
    const where = sql.match(/\bWHERE\s+(.+)$/i)?.[1] ?? '';
    const normalize = value => value.replace(/\s+/g, ' ').trim().toLowerCase();
    assert.equal(normalize(where), normalize(expected.where ?? ''));
  }
}
console.log('journal/SQL/snapshot PASS');
NODE
cp -R drizzle "$TASK_REVIEW_DIR/drizzle-before"
npm run db:generate
diff -ru "$TASK_REVIEW_DIR/drizzle-before" drizzle
```

Pass criteria: check exit0, db:generate reports no schema changes, and diff exit0. Top-level journal format version may differ from SQLite snapshot version, e.g. journal7 versus entry/snapshot6; do not require all three to match.

Also inspect each SQL file manually: schema-only, complete statements, no demo seed/large backfill; added columns meet Sites constant-default/nullable-REFERENCES limits. Key guards: lessons_one_teacher_slot unique, open_request_per_lesson partial unique, slot_locks(scope,scope_id,date,period) composite PK. Actual npm test collision/concurrency cases must verify duplicate rejection and rollback, not index names alone.

## 3. Apply migrations once to empty local D1; reapply without data changes

Finish all checks and a fresh build first. Existing dist/server/wrangler.json may be stale; the observed old dist lacked migrations_dir. Generate an external DB-only config from the **freshly built** binding with explicit migration path, without product config changes or remote access.

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
node /Users/zhuangzijin/.codex/plugins/cache/openai-curated-remote/sites/0.1.75/scripts/build-site.mjs
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const built = JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8'));
const binding = built.d1_databases.find(d => d.binding === 'DB');
assert.ok(binding, 'missing DB binding');
writeFileSync(resolve(process.env.TASK_REVIEW_DIR, 'wrangler-migration.json'), JSON.stringify({
  name: built.name,
  compatibility_date: built.compatibility_date,
  d1_databases: [{...binding, migrations_dir: resolve('drizzle')}]
}, null, 2));
NODE
WRANGLER_SEND_METRICS=false WRANGLER_WRITE_LOGS=false CI=true node node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --local --persist-to "$TASK_REVIEW_DIR/d1-state" --config "$TASK_REVIEW_DIR/wrangler-migration.json"
WRANGLER_SEND_METRICS=false WRANGLER_WRITE_LOGS=false CI=true node node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --local --persist-to "$TASK_REVIEW_DIR/d1-state" --config "$TASK_REVIEW_DIR/wrangler-migration.json"
WRANGLER_SEND_METRICS=false WRANGLER_WRITE_LOGS=false node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --persist-to "$TASK_REVIEW_DIR/d1-state" --config "$TASK_REVIEW_DIR/wrangler-migration.json" --command "SELECT name FROM d1_migrations ORDER BY id;" --json
WRANGLER_SEND_METRICS=false WRANGLER_WRITE_LOGS=false node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --persist-to "$TASK_REVIEW_DIR/d1-state" --config "$TASK_REVIEW_DIR/wrangler-migration.json" --command "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;" --json
```

Pass criteria: all checks exit0; every first migration succeeds; second run says No migrations to apply. d1_migrations order matches journal; product tables match snapshot after excluding platform/migration-management tables. Always use --local and isolated --persist-to, never --remote.

## 4. Minimal fresh-DB startup and first-seed behavior

Start the freshly built Worker using the same isolated DB, never the original .wrangler/state:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to "$TASK_REVIEW_DIR/d1-state" --ip 127.0.0.1 --port 8799 --inspector-port 0
```

Use existing API/browser harnesses; record statuses/assertions only, never session cookies/passwords/recovery codes:

- Migrated schema with no data: first student/teacher/admin demo login succeeds with valid session/role data. Repeat login/Worker restart does not duplicate seed.
- **Second fresh migrated isolated D1:** simultaneous first demo requests cause no partial initialization, SQL UNIQUE500, or permanent waiting. Observed seedIfEmpty wrote meta(seeded) before per-row seed; races/recovery still require stable handback verification, not premature repair/final-defect claims.
- Inject a reproducible seed DB failure, then retry. No permanent seeded marker with partial data. Demo reset is consistent, preserves real accounts, and concurrent reset/mutation has defined outcomes.
- **Separate unmigrated isolated DB:** request boundary returns recoverable unavailable status; runtime never secretly CREATE/ALTERs schema. README requires migrations before local Worker startup, not automatic API production-schema setup.

SQLite-adapter npm test proves only exercised adapter behavior. Wrangler/Miniflare, actual Sites D1, and browsers require separate evidence.

## 5. Same app tree → same Site → migration package

Use the external release checkout in [RELEASE_PLAN.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/RELEASE_PLAN.md). Preserve project appgprj_6ac11cc258608191ba6f05fcd6e031fb and D1 binding DB. **Never embed .git in parent handover/.** Site helper expects checkout Git root and reads .openai/hosting.json there.

Root obtains credentials for the existing Site and opens source using site-workflow.mjs hidden stdin, then checks/builds/publishes/packages that source. If history exists, open in an empty external checkout before applying accepted app; never force-push/overwrite unknown history. Fix and commit parent before export; do not privately patch release copy. Credentials never enter argv/files/reports.

Verify before publication and after helper completion:

```sh
# First command uses parent; second uses external Site checkout with staged source.
git -C "$TASK_REPO" rev-parse "${REVIEWED_PARENT_SHA}:handover"
git -C '/ABSOLUTE/EXTERNAL/SITE/CHECKOUT' write-tree
git -C '/ABSOLUTE/EXTERNAL/SITE/CHECKOUT' rev-parse 'HEAD^{tree}'
```

Pass criteria: all three trees equal. Different Site commit SHA is expected when app becomes root; record parent SHA/app tree in trailers without adding provenance files that change tree. First ignore/remove tsconfig.tsbuildinfo from index so build artifacts stay out of source.

Package root is dist/; migrations are **dist/.openai/drizzle/**, including SQL/journal/snapshots, not dist/drizzle/. Use actual helper-returned absolute archive path:

```sh
tar -tzf '/ABSOLUTE/HELPER/ARCHIVE.tar.gz'
tar -xOf '/ABSOLUTE/HELPER/ARCHIVE.tar.gz' dist/.openai/hosting.json
tar -xOf '/ABSOLUTE/HELPER/ARCHIVE.tar.gz' dist/.openai/drizzle/meta/_journal.json
tar -xOf '/ABSOLUTE/HELPER/ARCHIVE.tar.gz' dist/.openai/drizzle/0000_init.sql | shasum -a 256
shasum -a 256 drizzle/0000_init.sql
shasum -a 256 '/ABSOLUTE/HELPER/ARCHIVE.tar.gz'
```

Every packaged migration/metadata file must equal accepted source. Worker entry is dist/server/index.js; static config cannot bypass D1. No local DB/env secrets/cookies/recovery codes/symlinks in archive. Preserve helper attribution; never native-save an archive that bypassed the helper.

## 6. Production Sites migration/publication evidence

Root retains same project/DB, verifies owner-private first, then publishes the same saved version with authorized public audience. Every Sites URL is production; private audience is not a separate staging DB. Never delete production tables/change DB/reset users for testing.

Set environment values according to get_environment_variables instructions and record revision. DEMO_MODE/TEACHER_INVITE_CODE are runtime values; local Vite vars do not establish hosted values. Do not put them in browser bundle or invent manifest fields.

Native save/deploy uses actual helper-returned source commit_sha/archive. Record version/deployment IDs and query those same IDs. **Only succeeded plus actual returned URL establishes hosting success.** Expected URL/source push/save alone does not prove migration/Worker completion. Coordinate any existing publish-on-push deployment instead of duplicate publication.

Production pass criteria: migrations succeed before Worker upload; initial demo/full handover/reload/session persistence work; anonymous public visitors reach own sign-in/demo without ChatGPT audience gate; hosted auth/concurrency/role/reset smoke is recorded. Map parent SHA→app tree→Sites source SHA→archive hash→version→deployment→environment revision without confusing IDs.

For deterministic SQLITE_* failure, determine exact failed unapplied migration and prior applied boundary. **Never rewrite applied SQL/matching snapshots/journal entries.** Repair only confirmed unapplied failure and matching schema/metadata, then re-review/commit/export/build/save from parent. Unknown boundary requires investigation; never blindly retry identical archive or bypass failing earlier migration with later correction.

Sources read: Sites sites-hosting/SKILL.md, sites-building/references/persistence-and-storage.md, project-setup/portable.md; local site-workflow.mjs/package-site.sh/prepare-site-build.cjs; installed Wrangler4.92.0 d1 migrations apply implementation. No external operation/D1 migration/product test executed here. Only shell/Node example syntax was checked; root must fill actual pass evidence.
