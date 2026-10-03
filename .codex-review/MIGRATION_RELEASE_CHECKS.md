# 空資料庫到 Sites 發布：最小驗證

狀態：**檢查程序，尚未執行或宣稱通過。** 2026-10-04（Asia/Taipei）。本輪只讀產品、已安裝 Sites 0.1.75 的指引與 helper，僅寫本文件；只有主代理執行發布工具。

Cursor 正在 R02／R02B 修改。讀取當下已出現完整的 `db/schema.ts`、`drizzle/0000_init.sql`、`drizzle/meta/_journal.json` 及 `0000_snapshot.json`，snapshot 含 14 張表。先前「空 schema／空 journal」的描述已過時，**這些是交回後待核對項目，不能當成最終缺陷或已通過證據**。所有命令應在 Cursor handback、獨立驗收並 commit 後，使用完整已驗收 SHA。

## 1. 匯出凍結版本，與原工作目錄分離

下列命令只建立本機驗證副本，不是 Site source open／發布。把 `REPLACE_WITH_REVIEWED_FULL_SHA` 換成已驗收的 40 字元 parent commit。保留此 shell 的 task-specific 變數，勿重新指定 HOME／CODEX_HOME。

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

通過條件：副本根有 `package.json`、`.openai/hosting.json`、`db/schema.ts`、完整 `drizzle/`，沒有額外 `handover/` 層。使用 lockfile 安裝；本機 macOS profile 是 portable，只有 `SITES_MANAGED_LINUX_CONTAINER=1` 的環境採 managed-linux。原 Cursor 工作目錄完全不變。

## 2. Journal → SQL → snapshot → schema 一致

在上述副本執行。這支記憶體 SQLite 檢查涵蓋 migration 順序、snapshot 鏈、最後表與欄位／索引／複合主鍵；它不等於正式 D1 部署成功。

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

通過條件：檢查 exit 0；`db:generate` 回報沒有 schema changes，且 `diff` exit 0。注意 journal 的頂層 format version 與 SQLite snapshot version 可不同，例如目前 journal `7`／entry 與 snapshot `6`；不要要求三者全部相同。

另人工檢查每份 SQL：schema-only、完整語句、沒有 demo seed／大量 backfill；新增欄位符合 Sites 指引的 constant default／nullable REFERENCES 限制。關鍵約束包括 `lessons_one_teacher_slot` unique、`open_request_per_lesson` partial unique，以及 `slot_locks(scope,scope_id,date,period)` 複合主鍵；`npm test` 的衝堂／並行行為案例必須實際驗證拒絕重複及失敗時回滾。不能只以索引名稱存在判定行為通過。

## 3. 空的本機 D1 套用一次，再次套用不改資料

先完成完整檢查與新建置。現在工作區已有的 `dist/server/wrangler.json` 可能是舊產物，不能沿用；目前快照的舊 dist 沒有 `migrations_dir`。以下從**剛建置**的 DB binding 生成副本外的 DB-only config，明確設定 migration 路徑，不改產品配置，也不連遠端。

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

通過條件：所有檢查 exit 0；第一次每份 migration 套用成功，第二次 `No migrations to apply`；`d1_migrations` 名稱與 journal 順序相同，產品表集合與 snapshot 相同（排除 Wrangler 的 migration 管理表等平台表）。全程必須帶 `--local` 與隔離 `--persist-to`；這個程序不使用 `--remote`。

## 4. 新 DB 啟動與初次 seed 的最小行為檢查

使用同一隔離 DB 啟動剛建置的 Worker，不能套用到原工作區 `.wrangler/state`：

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to "$TASK_REVIEW_DIR/d1-state" --ip 127.0.0.1 --port 8799 --inspector-port 0
```

以現有 API／browser harness 驗證以下條件，僅記錄狀態與斷言結果，勿輸出 session cookie、密碼或恢復碼：

- 已套用 schema、尚無資料：student／teacher／admin demo 首次登入成功，正常 session／角色資料可讀；再次登入或 Worker 重啟不重複 seed。
- **全新、已遷移的第二份隔離 D1**：同時送出首批 demo 登入，沒有部分初始化、SQL UNIQUE 500 或永久等待。當下快照 `seedIfEmpty` 先寫 `meta('seeded')` 再逐筆 seed；其競態與中斷恢復仍須在交回版本驗證，不能提前視為已修或最終缺陷。
- seed 過程注入可重現的 DB 失敗後再試，不留下永久 `seeded` marker 搭配半套資料。示範 reset 後資料一致，且不刪真實帳號；並行 reset／mutation 有明確結果。
- **另建未遷移的隔離 DB**：request 邊界回報可恢復的 unavailable 狀態；runtime 不偷偷 `CREATE/ALTER` schema。README 必須寫先 migrations，再啟動本機 Worker，不得仍寫 API 自動套用正式 schema。

Node SQLite adapter 的 `npm test` 只能證明該 adapter 測到的行為；Wrangler／Miniflare、真正 Sites D1 與瀏覽器仍需各自證據。

## 5. 同一 app tree → 同一 Site → migration 封包

沿用 [RELEASE_PLAN.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/RELEASE_PLAN.md) 的外部 release checkout；manifest project 必須維持 `appgprj_6ac11cc258608191ba6f05fcd6e031fb`，D1 binding `DB`。**不要在父 repo 的 `handover/` 建嵌入 `.git`。** Site source helper 要求 checkout 本身是 Git 根，在根讀 `.openai/hosting.json`。

主代理對 existing Site 取得 source credential，以 `site-workflow.mjs` 的 hidden stdin 執行 open，沿用其 `source` 完成 checks／build／publish／packaging。若已有 Site history，先在空的外部 checkout open，再套入已驗收 app；不強推或覆蓋未知來源。先修並 commit parent，再匯出，不能只改 release 副本。credential 不放 argv、檔案或報告。

發布前及 helper 完成後各核對：

```sh
# 第一個命令在 parent；第二個命令在外部 Site checkout，且已暫存來源。
git -C "$TASK_REPO" rev-parse "${REVIEWED_PARENT_SHA}:handover"
git -C '/ABSOLUTE/EXTERNAL/SITE/CHECKOUT' write-tree
git -C '/ABSOLUTE/EXTERNAL/SITE/CHECKOUT' rev-parse 'HEAD^{tree}'
```

通過條件：三個 tree 完全相同。Sites commit SHA 因 app 移到 checkout 根而不同是正常的；透過 commit trailers 記錄 parent SHA／app tree，不新增溯源檔案改變 tree。先完成 `tsconfig.tsbuildinfo` ignore／index 清理，避免 build 收進非來源產物。

helper 封包的根是 `dist/`，migration 路徑是 **`dist/.openai/drizzle/`**（包含 SQL、journal、snapshots），不是 `dist/drizzle/`。用 helper 回傳的 archive 絕對路徑：

```sh
tar -tzf '/ABSOLUTE/HELPER/ARCHIVE.tar.gz'
tar -xOf '/ABSOLUTE/HELPER/ARCHIVE.tar.gz' dist/.openai/hosting.json
tar -xOf '/ABSOLUTE/HELPER/ARCHIVE.tar.gz' dist/.openai/drizzle/meta/_journal.json
tar -xOf '/ABSOLUTE/HELPER/ARCHIVE.tar.gz' dist/.openai/drizzle/0000_init.sql | shasum -a 256
shasum -a 256 drizzle/0000_init.sql
shasum -a 256 '/ABSOLUTE/HELPER/ARCHIVE.tar.gz'
```

逐份 migration 與 metadata 的封包內容必須等於已驗收來源；worker entrypoint 是 `dist/server/index.js`，不得用 static 設定跳過 D1。archive 不得含本機 DB、env secrets、cookies／恢復碼或 symlink。packager 會保留建置 attribution；未通過 helper 的 archive 不送 native save。

## 6. 正式 Sites migrations 與發布證據

主代理維持同一 project／DB，先 owner-private 版本驗證，再依已授權公開交付切 public audience 並發布同一已保存版本。每個 Sites URL 都是正式環境；private 並不提供獨立 staging DB。不要為了驗證刻意刪正式表、換 DB 或重設正式使用者資料。

原生環境值先依 `get_environment_variables` 回傳 instructions 設定；記錄 revision。`DEMO_MODE` 與 `TEACHER_INVITE_CODE` 是 runtime 值，不能假設 Vite 的本機 `vars` 一定等於 hosted 值，不放入 browser bundle 或擅加 hosting manifest 欄位。

Native save/deploy 只使用 helper 實際回傳的 Site source `commit_sha` 與 archive；保存 version ID／deployment ID 並以相同 ID 查 status。**只有 `succeeded` 與工具實際回傳 URL 算 hosting 成功**；expected URL、source push 或 save 成功不等於 migrations／Worker 完成。若有有效 publish-on-push window，先協調已觸發的 deployment，勿重複發布。

正式通過條件：遷移先於 Worker upload 成功；demo 首次登入及完整交接流程成功、跨 reload／session 資料保留；公開無痕訪客可進自有登入／demo，沒有 ChatGPT audience gate；auth、並行衝堂、角色隔離與 demo reset 的正式環境 smoke 結果已記錄。紀錄 parent SHA → app tree → Sites source SHA → archive hash → version → deployment → environment revision，勿混用 ID。

如果發生 deterministic `SQLITE_*`：先確定哪份 migration 失敗且尚未套用，以及前面已套用到哪裡。**已套用 SQL／matching snapshot／journal entry 不可改寫**；只修確認未套用的失敗 migration 與對應 schema／metadata，回 parent 重新驗收、commit、匯出、build、save 新版本。套用邊界不明時停止發布並查明；不能盲重試同一 archive，也不能以新增後續 correction 繞過前面的失敗檔。

參考：已讀 Sites `sites-hosting/SKILL.md`、`sites-building/references/persistence-and-storage.md`、`project-setup/portable.md`，本機 `site-workflow.mjs`／`package-site.sh`／`prepare-site-build.cjs`，以及已安裝 Wrangler 4.92.0 `d1 migrations apply` CLI 實作。此程序沒有執行外部操作、D1 migration 或產品測試；僅檢查文件內 shell／Node 範例語法，通過欄位待主代理實跑填入。
