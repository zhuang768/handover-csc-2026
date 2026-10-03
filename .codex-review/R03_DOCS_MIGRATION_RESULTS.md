# R03 文件、遷移與 Sites 打包複驗

日期：2026-10-04（Asia/Taipei）。本報告僅作獨立驗證，沒有修改產品、部署、上傳或操作外部帳號。

**空庫啟動、四個示範登入、SQL 遷移、Drizzle metadata、產物與本機封裝通過；不能據此宣稱舊庫的應用升級或正式 PWA 已通過。** 後端另已重現既有 R02 資料庫升級後的初始化相容性問題，須修正後再驗收。文件還有兩處應修的驗證／部署敘述。

## 固定版本與隔離

- 驗證產品 commit：`f3fa696115a86f98995686b6bb934b90492133ab`。
- app tree：`911adb7043d89b7487b12b9bb3d06876457699a5`。
- 結束唯讀檢查的 root HEAD：`b3753d7e35562359368978d23b902124732e0631`，僅狀態更新；`git diff --name-only f3fa696115a86f98995686b6bb934b90492133ab -- handover .github` 無輸出，`git status --short -- handover .github` 無輸出，HEAD 的 app tree 相同。
- 使用 `git archive f3fa696115a86f98995686b6bb934b90492133ab:handover` 匯出至 `/tmp/handover-r03-docs.0k49OP/app`。未在產品內建立 Git repository，未共用根代理 D1／dev server。
- 個人開發服務使用 8897；D1 prepared-chunk 探針使用 8898。兩個服務均已 Ctrl-C 停止，exit 0。
- 本輪沒有重跑共享產品的 lint／typecheck／build。必要 Sites build 僅在此匯出副本執行。

## 本代理實際執行

以下相對路徑均以匯出 app 為工作目錄；Sites helper 來自已讀的 `sites/0.1.75` bundled plugin。

| 命令／驗證 | exit | 結果與範圍 |
| --- | ---: | --- |
| `npm ci` | 0 | 安裝 688 packages；未新增 dependency 或改 lockfile。 |
| bundled `configure-execution-profile.mjs`，portable profile | 0 | 專用副本建立 ignored runtime 設定。 |
| `node ../metadata-check.mjs`，依 MIGRATION_RELEASE_CHECKS 的 metadata validator | 0 | journal 順序、SQL inventory、兩份 snapshot 鏈、14 tables、欄位／default／PK／named index／partial predicate 對齊。 |
| `npm run db:generate`，前後 `diff -ru` drizzle 備份 | 0 | NOOP，未改 SQL／journal／snapshot。 |
| `npm test` | 0 | 26 passed：24 API + 2 PWA 原始檔檢查。 |
| `npm run test:e2e -- --list` | 0 | 列出 6 tests，1 file；本代理沒有執行完整 6 個瀏覽器測試。 |
| `npm run dev -- --port 8897 --host 127.0.0.1 --strictPort` | 0（停止） | default `.wrangler/state` 真空庫開始，回答本機 migration prompt 後自動套 0000＋0001，Vinext ready。 |
| 專用 Node fetch 登入探針 | 0 | GET `/` 200；Student、Teacher 0、Teacher 1、Admin 的 `/api/auth/demo` 均 200、角色正確、HttpOnly cookie；各 `/api/workspace` 均 200。 |
| 上述 fresh state 的 `npm run db:migrate` | 0 | `No migrations to apply`。 |
| Wrangler local：真 R02 0000 → 真 R03 0001 | 0 | 只新增 0001，原 request／reason 保留，`transition_token` 為 null；ledger 為 0000、0001；第二次套用 NOOP。這是 SQL／資料保留驗證，並非 application upgrade pass。 |
| 舊／新 0000 移除 statement markers、正規化空白後比較 | 0 | DDL 相同，已套用 history 沒有實質 SQL 改寫。 |
| 專用 Worker 對 Drizzle chunks 執行 `DB.batch(chunks.map(sql => DB.prepare(sql)))` | 0 | 14 product tables、7 named indexes 全部建立；排除平台 `_cf_METADATA` 後與 snapshot 相同。 |
| bundled `build-site.mjs`（匯出副本） | 0 | portable Vinext Worker build 五階段完成，`dist/server/index.js` 存在。 |
| `package-site.sh "$PWD" ../handover-r03-local-review.tar.gz` | 0 | 僅本機封裝；tar 內 PWA files 及 `dist/.openai/drizzle/` SQL／journal／snapshots 皆與來源 bytes 相同。 |

本機 migration 配置由產品 `wrangler.migrate.json` 複製至專用副本；舊 SQL 由 `git show 73d32c1:handover/drizzle/0000_init.sql` 匯出。upgrade 的 owned state 為 `../upgrade-state`，prepared-chunk 的 owned state 為 `../chunk-probe-state`。

### 遷移具體結論

- 0000 SHA-256：`0e4981fa31a01abd5f9a20d0928d37451b294382a9396c27083bec944c7a4039`。
- 0001 SHA-256：`b6e2047d90a0dc2524de142e1e95270285cb9199e53fbdfe9db0923754957248`。
- 0001 snapshot／schema 均為 requests 新增 nullable text `transition_token`；schema 共 14 tables，requests 21 columns。
- journal 最上層 version 7、snapshot／entry version 6 屬不同 metadata 欄位，不應直接判成錯誤；本輪鏈與 entry/snapshot alignment 通過。
- 0000 的 Drizzle reader 產生 14 個非空 chunk，其中 5 個仍含多個 CREATE statement；本機 D1 實際 batch 已驗證可完整建立 14 tables＋7 indexes。**沒有證據可將此列為 Sites failure**，最多是格式可讀性建議。正式 Sites migration 成功仍需 root 的真實發布證據。

### 既有 R02 應用升級仍未通過

另組的 [R03_API_RESULTS.md](R03_API_RESULTS.md) 已使用真正 R02 service／schema／seed state 及真實登入 session 重現：舊 `meta.seeded=1` 不被 R03 的 `seed_complete=1` 判定承認，重跑 seed 遇既有 class constraint，升級後 `auth/me` 由 200 變 409。完整舊庫與局部初始化舊庫均重現，真實帳號、session 與資料未刪除。

因此本代理的「SQL upgrade exit 0／原列保留」不能覆蓋這個後端阻擋。修正應保留完整舊庫現有安排與狀態，對局部舊庫只原子補缺失 demo records；不能盲目把所有 `seeded` 改成 complete，也不能重設既有資料。下一輪需重跑完整 84 計數及實際 Worker 升級登入。

## 文件與 CI 核對

1. **README 生產遷移指令需修正。** `handover/README.md:37` 說上線前對該環境執行 `npm run db:migrate`，但 `scripts/migrate-local-d1.mjs` 固定使用 `--local` 及 migration-only config，並不能操作 Sites 正式 D1。應明寫此命令只供本機；正式 Sites 使用 portable package 中 SQL／metadata，由既有 Site 的發布流程套用。不要拿掉 `--local` 或編造 remote database ID。
2. **TEST_REPORT 的 Not verified 段落互相矛盾。** Round 3 已記 6 E2E 與 390／768／1440 desktop viewports，但 `handover/TEST_REPORT.md:69`、`:71` 仍說未測三寬度、未跑 Playwright。請標成歷史 Round 1 限制，或改為本輪真正未驗項（實體手機、正式 HTTPS／SW、舊庫相容性等）。
3. **82 數字本身屬實，但 scope 需更新。** HANDOFF／TEST_REPORT 所記原命令的 82 passed 已由後端本輪複驗，不能改稱造假。後端在根代理核准後加入兩個 legacy upgrade case，完整新 84 計數為 exit 1、82 pass／2 fail；下一版文件不得把原 82 pass 描述成全部後端與遷移已驗收。
4. 6 E2E 的原始檔 scope 比「完整產品走查」小：三寬度只檢 sign-in；其他涵蓋 student 下一節、forced 500 retry draft、安裝指引／manifest、SW allowlist 加 synthetic offline event、admin profile dark theme。沒有完整 request→confirm→student→admin 全程；offline case 沒有真正 `context.setOffline` 後導航。6 pass 可如實列，但不能推成完整 offline workflow／手機安裝通過。
5. CI root working directory 為 `handover`、Node 22、lockfile path 正確；包含 npm ci、format、lint、typecheck、26 tests、Chromium install、E2E、build，未弱化檢查。尚未在新 GitHub repo 真正執行雲端 CI；本機 Node 26 不是 CI Node 22 的成功證據。乾淨機器要先裝 Playwright browser：CI 已有 `npx playwright install --with-deps chromium`，README 可補此前置步驟。
6. 根 README 有 app 入口並區分原始競賽筆記。README／HANDOFF 明示未由本輪部署；個人資格／姓名／條款／Devpost final submit 保留人工作業，官方 deadline 矛盾仍保留。
7. 詳細 AI disclosure、Devpost 短文與 Built with 均披露 **OpenAI Codex 和 Cursor**；沒有把 AI-assisted development 宣稱成 runtime model inference。CREDITS 有 Vinext starter、Manrope、Noto Sans TC、Lucide notices。產品如實記 currently unlicensed，可交付 GitHub；未選 license 不列為發布技術阻擋。
8. Devpost 仍有 `[CONFIRM]`：已知 package／版本／測試 scope 待 root 填可驗證值；公開 URL／repo／影片只填真實產物；姓名／資格／先前作品宣告由本人核對。不得在正式提交時保留這些 placeholder。
9. `tsconfig.tsbuildinfo` 已移出父 repo index，父根 ignore 已處理；固定 R03 app 自身 `.gitignore` 尚無 `*.tsbuildinfo`，而 tsconfig `incremental=true`。外部 Sites checkout 只含 app tree，不能沿用父根 ignore。source helper 在 commands 後 `git add --all`，因此 root 正式發布必須確認 generated file 不進 source tree；若補 app ignore，須由 Cursor／root 在主來源 commit 後再匯出，不能只私改 release 副本。

## 實際截圖

已開啟檢視 `handover/docs/screenshots/` 的 6 PNG，均為實際 app capture，非 mockup；5 個 unique 圖檔符合 5–8 張的數量下限，但內容尚可改善。

| 檔案 | 實際 PNG 尺寸 | 檢視結果 |
| --- | --- | --- |
| 01 login | 1440×900 | 正常繁中 sign-in。 |
| 02 student | 1440×1003 | 真實 student workspace。 |
| 03 teacher | 1280×2459 | 顯示 “We couldn’t reach server”／Checking timetable，來自 forced failure retry；宜等待復原後重拍正常主流程。 |
| 04 admin | 1280×924 | admin profile 的 dark theme，尚非 operational history／overview。 |
| 05 student mobile | 392×1725 | install guide 開啟狀態；與 06 完全相同 bytes。 |
| 06 install guide | 392×1725 | 與 05 相同，SHA-256 `3e3fc6cc6c123dacb8d851904696b29f35d21cb2dcbbfd0aeb2c2d4bc4960e72`。 |

建議下一輪產出 6 張 unique、無非預期 server banner 的重點流程圖，包含接收教師確認／student preparation／admin record。README 的 390×844 是 viewport 宣告，actual width 392 值得檢查可能的 horizontal overflow；full-page height 高於 viewport 本身正常。截圖說明已如實指出 desktop Chromium 不等於實體手機安裝證據。

## Sites 與 PWA：本機證據及正式待驗

- metadata 的 project ID 是唯一既有 `appgprj_6ac11cc258608191ba6f05fcd6e031fb`、logical D1 binding 是 `DB`，portable Worker entry 存在、未誤建 static site。
- `dist/client/` 及本機 tar 實際含 `manifest.webmanifest`、`sw.js`、`offline.html`、favicon、192／512／maskable512／apple180 PNG；來源 bytes 完全相同，沒有 public assets 漏包。drizzle 的兩份 SQL、journal、兩份 snapshots 已納入 metadata package。
- localhost dev fetch：manifest 200、`application/manifest+json`、scope `/`、no-cache；SW 200、text/javascript、no-cache；offline 200、text/html；四個圖示 200、image/png，PNG signature＋IHDR 寬高實測為 192²／512²／512²／180²。
- build `_headers` 僅列 `_next/static/*` immutable cache；dev 的 no-cache 不能直接外推 production。正式 HTTPS 的 manifest／SW／API／private HTML header、SW controller／cache allowlist／實際斷網導航／登入資料不得入 cache，依 RELEASE_PLAN 6A 逐項驗。
- root 另在 built Worker 觀察 `/offline.html` 307→`/offline` 200，以及 Worker 停止後 IAB reload ERR_FAILED；controller 尚未證實，**不是單一 SW 根因證據**。下一輪須以 built Worker、已 controlled page、真斷網 reload 複驗，不能用 synthetic offline event 宣告完成。
- 沒有公開部署、正式 HTTPS fetch、native Sites migration 或實體 iPhone／Android 安裝證據。本代理未叫任何發布工具；release checkout 必須在父 Git 之外，保留 exact reviewed app tree，沿用同一 Site project，不重新建 Site／帳號。

## 檢驗操作更正（不列產品失敗）

- 第一個 fresh dev 還停在 migration prompt 時，本代理提早 fetch 出現 connection refused，且手動執行 migration；已停止該 process，把該 owned state 移到 control 備份，再從不存在的 default state 重新跑 README 路徑。上面 fresh PASS 是後一次真正空庫的結果。
- chunk 探針初次使用 migration-only config 的日期 2026-10-01，超過目前 installed workerd 可支援日期；只修正個人 probe 為實際 app 使用的 2026-05-15 後成功。拒絕送出 Cloudflare error report，未外部寫入。
- chunk count 首次 assert 忘記排除 `_cf_METADATA`，得到 15 而非 14；唯讀重查 product tables／snapshot indexes 後通過。這是 reviewer harness 計數錯誤，沒有產品漏 table。

**交付界線：** SQL／fresh local／封裝可通過；整體 release 仍等待 legacy upgrade 修正、文件一致性及正式 PWA 行為驗收。真機安裝與本人 Devpost 操作保留人工，不能由桌面模擬宣稱成功。
