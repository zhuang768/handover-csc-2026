# R02 文件與 migration 獨立複驗

2026-10-04，Asia/Taipei。產品 commit：`73d32c1ee1a5d764d0dcf8b755b60c0de6eb808a`。status-only HEAD：`1f1fe7704f92cdc14dd6a819aedeacec909a2f2c`。兩者的 `handover` tree 均為 `dd2569753e139cd2ba5ce78c34ba1b22ac3e55ef`。

**結論：schema／journal／snapshot 與空本機 D1 遷移通過；乾淨安裝的 README 流程失敗，提交文件仍需收尾。** 本輪只寫本報告，產品完全未改；沒有 GitHub、Sites、Devpost 外部寫入。未使用其他代理的 DB／devserver。

## 實際執行範圍與結果

使用 `git archive 73d32c1:handover` 建立 `/tmp/handover-r02-docs.uDXiYt/app`（macOS realpath 為 `/private/tmp/...`）。所有依賴、產物、profile 和 DB 均在這份副本及其專用父目錄。環境是 Node `v26.3.0`、npm `11.16.0`；不是 GitHub CI 的 Node 22。

| 真正執行的命令／檢查 | exit | 結果 |
| --- | ---: | --- |
| `npm ci` | 0 | lockfile 安裝 688 packages；有 deprecated／allow-scripts 警告，後續 build 成功，未另外放寬 scripts。 |
| bundled `configure-execution-profile.mjs` | 0 | portable；只寫副本 ignored `.sites-runtime`。 |
| `node ../metadata-check.mjs` | 0 | journal 順序、SQL 清單、snapshot 鏈、14 表、欄位 default／not-null／PK、索引與 partial predicate 相符。 |
| `npm run db:generate` | 0 | `No schema changes, nothing to migrate`。 |
| `diff -ru ../drizzle-before drizzle` | 0 | SQL 與 metadata 沒有重新生成差異。 |
| `npm test` | 0 | 24 passed，0 failed。 |
| `npm run typecheck` | 0 | `tsc --noEmit`。 |
| `npm run lint` | 0 | 沒有 lint 錯誤。 |
| `npm run format:check` | 0 | All matched files use Prettier code style。 |
| bundled `build-site.mjs` → `npm run build` | 0 | 完整 Vinext client／server／RSC／SSR build 成功。 |
| 空本機 D1 `migrations apply DB --local` | 0 | `0000_init.sql`，22 commands 成功；記錄到 `d1_migrations`。 |
| 同一 D1 第二次 `migrations apply` | 0 | `No migrations to apply`。 |
| D1 migration ledger／table 查詢 | 0 | `0000_init.sql`；14 產品表，另有 `_cf_METADATA`、`d1_migrations`。 |
| 已遷移 Worker 四個 demo session／workspace probe | 0 | student、teacher0、teacher1、admin 登入及 workspace 均 200，HttpOnly true，`/auth/me` 均 200。 |
| D1 seed 角色數查詢 | 0 | admin 1、teachers 8、students 36。 |
| README 乾淨 dev／demo probe | **1** | GET `/` 200；POST `/api/auth/demo` 500 `{"error":"INTERNAL"}`；server：`no such table: users`。 |

`metadata-check.mjs` 是 [MIGRATION_RELEASE_CHECKS.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/MIGRATION_RELEASE_CHECKS.md) 第 2 節的 Node 檢查，僅複製到 owned scratch 執行。SQL SHA-256：`d354f114786516e6b7e1d7859dcef5a556d1d6d01b5f6528e9eb8b76e2515c08`。

## 必修文件與重建問題

1. **[README.md:9](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/README.md:9) 不能重建可登入的空資料庫。** `npm ci` → `npm run dev` 只建立 Worker binding，並未套用 migrations；移除 request-time DDL 後，一鍵 demo 登入必定遇到缺表。`DECISIONS.md` 雖寫先 migrate，但 README 沒有命令、config、persist 路徑或 seed 說明。加入可靠的本機 migration 命令／script，再以空 DB 照 README 完整重跑。此為可重現 blocker，不能以現有已 seed 的開發 DB 當通過。
2. **[TEST_REPORT.md:40](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/TEST_REPORT.md:40) 與 [同檔:50](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/TEST_REPORT.md:50) 互相矛盾。** 前者稱 390／768／1440 已測且無 overflow，後者稱只有一種寬度、三種未測。把歷史 Round 1 與 Round 2、各測試 SHA／日期／範圍分開，最後未驗清單只列目前仍缺的證據。24 API tests、73 先前獨立案例、本輪新 backend suite、browser／Worker／正式部署不能混成一個 PASS。
3. **[DEVPOST_SUBMISSION.md:92](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/docs/DEVPOST_SUBMISSION.md:92) 短 AI 揭露仍只列 Codex。** `AI_DISCLOSURE.md:7`／`:22` 已列 Codex 與 Cursor；Devpost 的 Built with、短揭露和 prior assets 需同步，不能讓實際貼出的版本省略 Cursor。已有的 starter、fonts、Lucide／vendor notices 可先填入已知事實，再由本人確認是否另有賽前素材。
4. **README 交付資訊仍不完整。** 原需求指定架構圖、`.env.example` 使用方式、migration／seed 重建、授權、30 秒評審導覽；目前 README 只有簡短介紹、角色與檢查。`.env.example` 已存在且被追蹤（demo invite／DEMO_MODE），但 README 未解釋本機與 Sites runtime 的設定方式；真實 public／repo URL 需在發布完成後填入，不能現在捏造。
5. **[SUBMISSION_CHECKLIST.md:96](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/SUBMISSION_CHECKLIST.md:96) 把 repo／網站發布留在「只有本人」區。** 使用者已授權本案 GitHub／公開網站交付，主代理可以在驗收後完成；不要把它變成重複索取授權的 blocker。真正本人步驟保留資格、姓名／隊員、監護人／條款、獎項選擇、錄影／影片分享及 Devpost 最終提交。

產品授權尚未指定不是 GitHub 上傳 blocker。可在 README 如實寫「product currently unlicensed；第三方 notices 適用於各素材」，不要擅自替本人選 MIT，也不要把 OFL／ISC／MIT 的 vendor notices 說成整個作品的授權。

## Migration 相容性警訊：需在正式發布前處理

SQL、snapshot、schema 的**內容一致性已通過**；Wrangler 本機 CLI 的完整 SQL-script 執行也已通過。但 `0000_init.sql` 沒有 `--> statement-breakpoint`，而 journal `breakpoints=true`。實際執行：

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

exit 0，結果為 `[{"breakpoints":true,"statementChunks":1,"containsCreateTables":14}]`。已安裝 `drizzle-orm/d1/migrator.js` 對每個 chunk 呼叫 `db.run(sql.raw(stmt))`；這份檔案因沒有 markers，會送出含多個語句的單一 prepared query，與 Sites 指引每次 `prepare()` 一句的要求有落差。

**建議：正式首次部署前保留生成式 statement breakpoints，回 parent 更新 SQL，重新做 metadata／db:generate no-op／空 D1 驗證。** 目前 Site 尚未套用此 migration，仍有修正空間；已正式套用後不得改寫 migration 歷史。此項不是「Sites 已部署失敗」的宣稱，因為沒有呼叫 native deployment，也無法由本機 helper 確定服務端解析器。

額外 standard Drizzle D1 migrator probe 未產生有效結果：直接使用 standalone Miniflare `getD1Database()` 在兩份 owned 空 state 等不到 binding；第一次手動停止（exit 137），第二次加 `cf:false`／停用 fetch、以 20 秒限時（exit 124）。只看到 `probe begin`，未執行到 `migrate`。此為 probe 工具限制，**不當產品失敗，也不當 standard migrator 通過**。實際 Wrangler Worker／D1 路徑則如上通過。

## README blocker 與空 D1 的可重現命令

在 owned app 副本先照原 README 啟動，不套 migration：

```sh
cd /tmp/handover-r02-docs.uDXiYt/app
npm run dev -- --port 8897 --host 127.0.0.1
```

另一個 terminal 執行以下 **實際使用的** probe；exit 1、GET 200、demo POST 500：

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

停止該 server，再乾淨 build。從新 build 讀 DB binding、產生 source 外的 config：

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

新 dist 的 binding `migrations_dir` 是 `./drizzle`，其 config 位於 `dist/server/`。直接用該 config 跑 migration 會依 config 目錄解析路徑；本輪因此使用**絕對 source drizzle 路徑**的隔離 config。不要將新 README 修成一條指向錯誤 migration 目錄的命令。

8898 的 Node probe 逐一對 student、teacherIndex 0／1、admin 發送同源 `POST /api/auth/demo`，assert status 200、角色正確與 cookie HttpOnly；cookie 僅在記憶體，接著 assert `/auth/me`、`/workspace` 200。workspace 課程數分別為 20／5／7／60，requests 1／2／2／7。再用相同 DB-only config 查 `SELECT role,COUNT(*) AS n FROM users GROUP BY role ORDER BY role;` 得到 1／8／36。兩個 server 與 standalone probes 已全部停止。

## 已一致的文件與仍需填入的事實

- 根 [README.md:3](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/README.md:3) 有正確 app 入口，舊筆記明確標歷史；資格沒有因此視為已確認。其 relative link 對 GitHub 的 parent-root 佈局有效。
- `HANDOFF`／`DECISIONS` 正確寫 request-time DDL 已移除、後端授權、真正 session、salted PBKDF2／recovery、Email 未接、demo reset 保留真實帳號；這些承諾的深入並行驗證以 backend reviewer 報告為準，本報告沒有重複宣布 seed 競態已解決。
- `.github/workflows/ci.yml` 在 parent 根，Node 22、working-directory `handover`、cache lockfile 路徑正確；commands 對齊本機 npm ci／format／lint／types／tests／build，沒有 continue-on-error。GitHub 實際 CI 尚未執行，不把本機 Node 26 當 Node 22 的雲端通過證據。
- `CREDITS`／AI 詳細揭露包含 starter、Manrope／Noto Sans TC、Lucide／shadcn，兩份自託管字型與 OFL notices 存在；沒有 stock photos。暖白／墨綠 tokens 與 design notes 相符。小差異：design notes 說 motion 只 transform／opacity，但 CSS 也 transition background-color／color；可修文案，無需因此改產品。
- Devpost 文案仍是草稿；技術庫、測試數／SHA、限制與已知 credits 可由代理填實，public／repo URL 必須等真實發布，姓名／隊員與理解確認留本人。不要保留 `[CONFIRM]` 後直接貼到 Devpost。
- DEMO_SCRIPT 120 秒、7 個截圖分鏡與 AI／synthetic 標示符合原需求；尚無 `docs/screenshots/` 的實際輸出。腳本與計畫沒有冒稱已錄影／截圖，檔案存在不能當媒體交付完成。
- 清單保留官方 deadline 矛盾，採較早台灣 2026-10-05 15:00、建議 12:00；影片選填、5 項評分與 Render Workflows 限制沒有被改成不實規則。此輪未重複 browse。
- `handover/tsconfig.tsbuildinfo` 仍被追蹤；依 release 計畫在 handback 後加入 ignore／移出 index，保留本機檔案。發布 checkout 不可收進因 checks 改動的 buildinfo。

後續發布仍須由主代理完成：external checkout Git 根與 parent `HEAD:handover` app tree 完全相等、同一 Site project／DB、archive 的 `dist/.openai/drizzle/` SQL＋meta 完整且 hash 相同、runtime env revision、native succeeded／真 URL、公開無痕角色主流程。沒有新增 Site 或更換正式 DB 的理由；本輪本機 PASS 不代表 production PASS。
