# Handover 發布計畫

狀態：**操作計畫，尚未執行發布。** 2026-10-04（Asia/Taipei）更新至 R04 交回／Codex 接手 R05 階段；Sites plugin 已自動換版為 1.0.0-a，root 與本研究已重讀當前 skill／相關腳本。只有主代理執行 GitHub／Sites 工具。

## 已知狀態與限制

- 主 repo 根是 `/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon`，app 位於 `handover/`。
- Site manifest 是 `handover/.openai/hosting.json`：`project_id = appgprj_6ac11cc258608191ba6f05fcd6e031fb`、D1 binding `DB`、R2 null。維持同一 Site，不另建 Site。
- 主代理已確認 Site owner／active、`access_mode=custom` 且只有 owner、version 0、無 live URL；`expected_url` 不代表已發布。
- 主代理已確認 GitHub 帳號 `zhuang768`，沒有 Handover repo。驗收後建立新的公開 repo，例如 `handover-csc-2026`；不可改動其他既有 repo。
- GitHub 上傳及本案公開網站交付已有授權；Devpost 最終提交、資格、條款及宣傳選項仍是本人步驟。
- root 已用當前 helper 對唯一既有 Site 做 **open only**，checkout 為 `/Users/zhuangzijin/.codex/sites-releases/handover/release-checkout`，source 結果 `commit_sha:null`，remote 無 history；尚無 source push／archive／publish。R05 尚在整合，不能將這個 open 結果當發布版本。checker 不會寫入或修補該 checkout。
- R04 固定候選 `6b7b7cd734e9af06785d7f854d75dc8f3a160c6f` 的 app tree 為 `ebbe56dda33a1547d67f17367bc067fe7a6eb2ab`。本研究確認未變 schema／metadata／migration helpers 可沿用 R03 證據，app ignore／文件已修，8 PNG unique；07 loading screenshot 與 iOS 安裝步驟文字尚需小型修正，詳見 [R04_DOCS_RESULTS.md](R04_DOCS_RESULTS.md)。如果 Cursor 修文字／截圖，記錄新 parent SHA／app tree，再由 root 核對必要差異；不能拿 R03 或修正前 R04 tree 宣稱發布來源相同。
- root 已實跑 26 unit／8 dev E2E／1 built E2E exit 0，built offline direct 200／no 307、真斷網 public fallback、失敗離線 profile save 不重送均通過。root 也手動驗真舊 SW→R04 update UI：dirty profile 禁用 update，還原後 click update 等新 controller reload，home／session 保留、banner 消失。這是 root 證據，不是本研究的瀏覽器實跑。正式 public HTTPS／實體手機仍未驗。

## 1. 凍結主 repo 的已驗收版本

Cursor handback 後，主代理完成相關 API、Worker、UI、viewport 與工具檢查，修復未通過的 P0。先在主 repo 完成 schema／migration、環境與文件修補，**不可只修 release 副本**。

R04 的 `handover/tsconfig.tsbuildinfo` 已移出 index，父根及 app 自身 `.gitignore` 均已處理（app 含 `*.tsbuildinfo`），不需要再移除或只修 release 副本。helper 仍會在 commands 後 `git add --all`，依既定規則確認 typecheck／build 後 exact reviewed tree，相同來源不能摻入其他 generated output。

記錄完整的 `reviewed_parent_sha` 與 `reviewed_app_tree = git rev-parse "<SHA>:handover"`。確認沒有未納入 commit 的產品改動、金鑰／cookie／恢復碼／本機 DB／generated output；勿清除其他代理的 review 檔案。必要文件與可重建的 migrations 都必須在該 commit 內。

## 2. GitHub：保留父 repo 與 CI 佈局

建立新公開 repo，維持 repo 根含 `handover/` 與 `.github/workflows/ci.yml`。使用 focused branch；不 force-push。建立可 review 的 PR，並用 app 的 `attach_artifact` 附上 PR。

R04 CI 以 `working-directory: handover` 執行 npm ci、format:check、lint、typecheck、npm test、Chromium install、test:e2e、test:e2e:built，Node 22，lockfile 指向 `handover/package-lock.json`。`test:e2e:built` 內含 `npm run build && playwright test -c playwright.built.config.ts`，未省略 build。**不要只上傳 app 子目錄而漏掉 CI。** 不加入略過失敗或 continue-on-error。

上傳後核對 remote SHA／tree 與已驗收 commit，以及實際 GitHub CI 結果。若採 squash merge，重新記錄合併後 parent SHA，核對 `HEAD:handover` tree 與已測試 app tree 一致；來源不一致就重新驗證。公開 repo URL、PR URL與 CI 狀態分開記錄，不把「推送成功」當「CI 通過」。

## 3. 在父 repo 外建立 Sites release checkout

**禁止在 `handover/` 建立嵌入 `.git`，禁止更動父 repo 的 Git root。** Sites 的 `validateCheckout()` 要求 Git 根等於選定 checkout，且在根讀 `.openai/hosting.json`。

建議使用 `/Users/zhuangzijin/.codex/sites-releases/handover/<reviewed-sha>/` 的獨立目錄，分成 export staging、Site checkout、archive output。它們不得位於父 repo 內，archive 也不得放進 app 來源樹。

從 commit 匯出，不能複製尚有 Cursor 修改的工作目錄：

```sh
git archive --format=tar --output=<absolute-export-tar> <reviewed-parent-sha>:handover
```

解到 release staging 後應在根看到 `package.json`、`.openai/hosting.json`、`drizzle/`，沒有 `handover/` 前綴、`.git`、node_modules、dist 或本機 DB。

主代理對同一 Site 取得原生 source write credential，依下述 helper 做 **open**。已註冊 version 0 不保證 source branch 不存在：

- 若 Site remote 尚無 source branch，可以讓 helper 在匯出的獨立 app checkout 內初始化正常 Git，open 不帶 archive。
- 若 remote 已有 history，helper 會拒絕「未初始化且非空」的來源；保留 staging，改在另一個空 release checkout 先 open，取回 remote 與其 `.git`，再以已驗收 staging 更新來源。保留 `.git`、歷史及忽略的工具狀態，只移除對比確認過的舊來源路徑。不要以重新 init、symlink、強制推送繞過 history 保護。
- open 的 `checkout_path` 必須位於父 repo 外；保留回傳的 `source` 給 publish 使用。若 source 遠端進度與預期不同，先看 diff，不能覆蓋未知改動。

覆蓋來源後，在 release checkout 暫存／核對 tree：**release `git write-tree` 必須完全等於 parent `<SHA>:handover` tree**。只因把 app 移到根而產生的來源 commit SHA 不同是正常的；內容 tree 必須相同。

建議 release commit 訊息加非機密 trailers：`Reviewed-Parent-Commit`、`Reviewed-App-Tree`、`GitHub-Repository`。使用 commit message 記錄溯源，**不要額外新增檔案或自創 hosting manifest 欄位破壞 tree 相同**。最終另在主 repo release report 記錄 parent SHA、Sites source SHA、app tree、archive hash、version/deployment ID。

## 4. Migration 與 Hosted 環境值的發布前檢查

R03 已解決先前空 schema／journal 問題：14 tables 的 `db/schema.ts`、0000／0001 SQL、matching snapshots／journal 對齊；db:generate NOOP、空庫與 R02 SQL upgrade、原列保留、本機 D1 prepared chunks、portable migration 封裝均通過。R04 fixed diff 確認這些檔案／helpers 全部未變，詳見 [R03_DOCS_MIGRATION_RESULTS.md](R03_DOCS_MIGRATION_RESULTS.md) 與 [R04_DOCS_RESULTS.md](R04_DOCS_RESULTS.md)，無須將先前空 schema／metadata 問題當成目前缺陷。

R03 真舊庫 `seeded` marker 的應用升級失敗屬歷史結果；R04 service 已修完整／局部 legacy seed 路徑，Cursor 回報最新 85 計數 exit 0。發布判定仍採 root／後端獨立的新 suite 與真 Worker 資料保留／session 證據，不能把 SQL metadata 通過或 Cursor 回報改寫成本研究已實跑後端。已套用的 0000 history 保持原 DDL，不重設舊庫。

Sites 指引要求正式 schema 由 migrations 管理，生成 SQL、matching snapshots、journal 一併保存；migration 要 schema-only，不包含大量 seed。正式 runtime 不應再 create／alter 同一套表。seed 與 schema 遷移分開，且不能在公開 API 初次讀取時產生競態或部分初始化。變更必須先回到主 repo、測試、commit，然後重新匯出。

packager 會完整複製 `drizzle/` 至 **`dist/.openai/drizzle/`**。驗收後必須確認 SQL 與 metadata 對應、保留完整鏈、DB binding 為 `DB`。部署 migrations 會先於 Worker upload 執行；發布失敗可能已套用一部分，因此不能改寫已套用 migration 或盲目重試同一 archive。

| 設定 | 本機／建置來源 | Hosted 設定方式與注意事項 |
| --- | --- | --- |
| `DB` | Vite local D1 config／logical binding | manifest `d1: "DB"`；Sites 管理真實 resource。不要將本機 placeholder database ID 當正式 ID。 |
| `TEACHER_INVITE_CODE` | 目前 Vite vars／route fallback 為公開 demo 值 | 先讀原生 `get_environment_variables` 的 instructions，再用 `update_environment_variables` 設定。Hackathon demo 值可公開；若是非 demo 學校邀請碼需 `is_secret:true`。 |
| `DEMO_MODE` | 目前本機字串 `"true"` | Native env 設為字串；本案公開 demo 需要開啟。依最終候選驗證預設／關閉行為，不依賴 Vite 本機 fallback。 |
| 密碼／recovery／session | D1 內的 hash／session 資料 | 不是 build env，也不能放 hosting.json、Git、stdout 或 archive。 |
| 外部 AI／Email key | 本案目前未接服務 | 不建立或要求不需要的 secret；不能因 tool 存在就新增服務。 |

Vite `config.vars` 是本機／Wrangler 建置設定，**不能推論 Sites 正式 runtime 會採用其中的值**。Hosted 值由 Sites 原生環境工具管理；保存 environment revision。`cloudflare:workers` env 在 runtime 讀取，不能改成把秘密編入 `import.meta.env`／browser bundle。Connector preview 的 `CONNECTORS` binding 與部署環境值是不同機制；本案不需要新增 plugins/connectors 宣告。

## 5. 乾淨 build、source push 與 helper packaging

外部 release checkout 沒有原機器 node_modules／dist。依當前環境設定 execution profile：只有 `SITES_MANAGED_LINUX_CONTAINER=1` 才用 managed-linux；本機 macOS 用 portable。現行入口是 `/Users/zhuangzijin/.codex/plugins/cache/openai-curated-remote/sites/1.0.0-a/scripts/configure-execution-profile.mjs`，在 release checkout 執行，不帶參數；只寫 ignored `.sites-runtime/execution-profile.json`，不更改 app 來源或 lockfile，也不重新定義 HOME／CODEX_HOME。既有 app 不跑會重新拷 starter 的 project-setup。

依 skill 以 `exec_command(tty:true, yield_time_ms:1000)` 啟動：

```sh
node /Users/zhuangzijin/.codex/plugins/cache/openai-curated-remote/sites/1.0.0-a/scripts/site-workflow.mjs --project-id appgprj_6ac11cc258608191ba6f05fcd6e031fb
```

等 hidden-stdin 訊息後才用 `write_stdin` 傳一行 JSON。credential 保存在主代理 session memory 與 hidden stdin，**不能放 shell argv、檔案或報告**。open 輸入不含 archive；publish 輸入重用 open 的 `source`，加絕對 `archivePath` 與剩餘 `commands` 引數陣列。

乾淨 release 的 commands 建議依序：

```json
[
  ["npm", "ci"],
  ["npm", "run", "format:check"],
  ["npm", "run", "lint"],
  ["npm", "run", "typecheck"],
  ["npm", "test"],
  ["node", "/Users/zhuangzijin/.codex/plugins/cache/openai-curated-remote/sites/1.0.0-a/scripts/build-site.mjs"]
]
```

不在副本跑會改動來源的 db:generate；完整 migrations 應已在驗收 commit。安裝後 lockfile／build後來源 tree 必須仍相同。helper 自行 commit／push／核對 source remote HEAD，再呼叫包裝器產生 archive；成功前不能自行用預期 SHA 呼叫 save。

包裝器使用 Worker-compatible **`dist/server/index.js`**（default `fetch`），完整 dist tree 與 root `.openai/hosting.json`，保留 build attribution，補入 migration metadata。這不是 static app，不能加 `static.directory` 略過 D1／API。壓縮包的根是 `dist/`；helper 自行驗證，另核對 `dist/.openai/hosting.json`、`dist/.openai/drizzle/`、Worker entrypoint 與無 secrets／symlink／本機 DB。

記錄最後 JSON 的 **實際** `project_id`、`checkout_path`、`commit_sha`、`archive`，並核對發布 source tree 仍是已驗收 app tree。archive 保存到 native save 成功，過程不修改它；若 source／build/config 有變更，需重建並重新走流程。

helper 產生真 archive 且 release HEAD 存在後，執行本案只讀 checker，將實際值填入：

```sh
node .codex-review/verify-site-archive.mjs --reviewed-parent-sha <full-reviewed-parent-sha> --release-checkout /Users/zhuangzijin/.codex/sites-releases/handover/release-checkout --archive <absolute-helper-returned-archive-path>
```

checker 核對 `parentSHA:handover` 與 release HEAD tree、clean source、Site／DB／Worker entry、8 個 PWA public files 與全部 drizzle SQL／metadata bytes，輸出 archive／file SHA-256 而不印 manifest vars／credential。已用既有 R03 archive＋owned exact-tree Git fixture 實跑 exit 0（8 assets／5 migrations），錯 tree 與被改 SW 的 negative fixture 均 exit 1；不是正式 release artifact 驗收，也不驗 build runtime／遷移套用／HTTPS／真機。當前 `commit_sha:null` 的 open-only checkout 還不能拿來執行成功判定。

## 6. 同一版本由 owner-private 驗證至公開

目前 Site 是已確認 owner-only，先用 `save_version_and_deploy_private`；若沒有此工具則 save＋deploy_private。只使用 helper 回傳的 source SHA／archive。不要把 private deploy 當權限探測，也不 opt-in publish-on-push，以免 source push 自動發布後又重複 save/deploy。

若 credential 顯示先前仍有 `publish_on_push_accepted:true` 的有效發布窗口，先協調該版本的實際 deployment；未帶 opt-in 參數或回傳 false 不代表取消舊窗口。有效 accepted 窗口的 source push 會自動 private publish，此時依原生 schema 查同版本 deployment，避免另外 save/deploy。

非 terminal 時以相同 project／deployment ID 查 `get_deployment_status`，直到 succeeded 且回傳真實 URL；URL 缺漏只做一次同 ID 查詢。Native succeeded 表示 hosting 成功，仍不代表 Handover P0 自動通過。

主代理依使用者原驗收要求，在已部署環境完成四角色、auth／cookies、D1 保存、交接主流程、退回重送、衝堂、越權及 demo reset；private 階段平台登入是正常 audience，不要寫「公開評審可以匿名開啟」。若使用平台 service credential，只送至同一 Site且保持 app 自有 session／授權，token 不留檔。

在既有公開交付授權範圍內，通過後 `update_site_access({project_id, access_mode:"public"})`，只改 audience，不添加外部 viewer、不觸發邀請信。再以同一 saved version `deploy_site_version`，查 status 並記錄公開 URL，確認無痕訪客可進 app 自有登入頁及 demo，不需要 ChatGPT 登入。若目前平台要求重新 save，依原生結果處理，不能猜 version ID。

所有 Sites URL 都是正式部署，不稱 private deployment 為獨立 staging／沙箱。不要更換 Site、slug、D1 resource 或另註冊 provider 來躲避發布錯誤。

## 6A. 正式 HTTPS 網址的 PWA 最小驗證（2026-10-04 補充）

使用者最新定位是「先用 HTTPS 網址，再加入主畫面的 App」。R04 已有 manifest／PNG／SW／offline public assets，root 本機 built Worker 真斷網與兩版本 SW 更新也已驗；正式 HTTPS／實體手機仍待驗，以下正式環境程序尚未通過。沿用唯一 project `appgprj_6ac11cc258608191ba6f05fcd6e031fb`、既有 DB 及父 repo 外的 release checkout；app tree／source SHA／archive 對照維持前述規則，不另建 Site、不改帳號、不因 PWA 選另一個部署平台。

**PWA public 檔案須先建置再封裝。** R03 固定候選的專用匯出副本已實際執行 portable build／local package：`dist/client/` 與 tar 內 manifest、4 PNG、SW、offline、favicon bytes 均與 public 來源相同，drizzle metadata 也完整。Sites `prepare-site-build.cjs` 對 Worker build 完整複製 `dist/`，`package-site.sh` 再壓縮完整 staged `dist/`；它不會另行補拷 source `public/`。下一輪仍以 R04 已驗收來源重建，不能拿 R03 archive 當 R04 發布證據。

在最後已驗收來源的外部 checkout 乾淨 build，再以 helper 回傳的 archive 路徑核對。R04 採靜態 public manifest／icons，Vite 已設定 `assets.html_handling: "none"` 防止 offline file canonical redirect；正式 GET 仍須 manual redirects 記 initial／final status，不以本機 200 推論正式必為 200。若最終改用 Worker metadata route，改驗 route 的正式回應，不假設 route 一定有相同 client 檔名。

```sh
# 在外部 release checkout；TASK_ARCHIVE 是 helper 真正回傳的絕對路徑。
set -euo pipefail
for TASK_PWA_FILE in manifest.webmanifest icons/icon-192.png icons/icon-512.png icons/icon-maskable-512.png icons/apple-touch-icon.png; do
  cmp "public/$TASK_PWA_FILE" "dist/client/$TASK_PWA_FILE"
  tar -xOf "$TASK_ARCHIVE" "dist/client/$TASK_PWA_FILE" | cmp - "public/$TASK_PWA_FILE"
done
if test -f public/sw.js; then
  for TASK_PWA_FILE in sw.js offline.html; do
    cmp "public/$TASK_PWA_FILE" "dist/client/$TASK_PWA_FILE"
    tar -xOf "$TASK_ARCHIVE" "dist/client/$TASK_PWA_FILE" | cmp - "public/$TASK_PWA_FILE"
  done
fi
```

正式 deployment succeeded、取得真實 URL，且 public audience 已依授權完成後，用**新的無痕瀏覽器 context** 依序檢查；不以 expected_url 或 owner-private 的平台登入頁代替正式公開 App。HTTPS、manifest 與 192／512 icons 是可安裝體驗的重要條件；SW 是否有實作另記，不能因此宣稱所有課務離線可用。[MDN 安裝要求](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

read-only HTTP 資源預檢可使用 `node .codex-review/probe-pwa-http.mjs <actual-HTTPS-deployment-URL>`；此 reviewer-owned script 只 GET 同源公開資源及無 session 的拒絕回應，manual redirects 明列 initial／final status 與 offline canonical path，不送出或印出 cookie／token。只做過 `node --check`，尚未對正式 URL 執行；HTTP pass 不能代替 browser controller／真斷網 reload／authenticated private response／實體安裝驗證。

| 項目 | 最小通過條件／證據 |
| --- | --- |
| HTTPS 與入口 | 真 URL 憑證有效；無痕可進自有登入／demo。最終 HTML 有實際可讀的 manifest link、180 PNG apple-touch-icon、theme／standalone metadata；必要資源沒有轉去平台登入或 HTTP。 |
| manifest | 實際 GET 200，JSON 能解析，Content-Type 為 `application/manifest+json`（若平台回 `application/json`，另記瀏覽器解析結果與差異）。穩定 id／name／short_name、standalone、背景／主題色正確；start_url 和 scope 同源，start_url 在 scope 內且實際可開啟，不含 app 子目錄或本機 host。 |
| PNG | 每個宣告 icon 及 Apple icon 實際 GET 200、`image/png`；驗 PNG signature／IHDR，真實像素為 192×192／512×512／180×180。maskable 的 purpose／安全留白以圖像檢查，不能只看副檔名或 manifest 的 sizes 字串。 |
| SW（有實作才測） | `/sw.js` 實際 GET 200，JavaScript MIME，內容是真 JS，不是 SPA／登入 HTML。正式瀏覽器註冊成功、active，reload 後 controller 的 script URL 與 scope 正確；根 SW 可控制 `/`，若 SW 在子路徑卻要更廣 scope，必須驗 `Service-Worker-Allowed`。[SW scope](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register) |
| HTTP cache | 正式 SW／manifest 可重新驗證，不用長期 immutable 覆蓋更新；檢查實際 GET 的 Cache-Control，不只 source `_headers`。API／auth／任何私人課務 JSON 或登入後私人 HTML 回 `no-store`；不能因有 HttpOnly cookie 就假設 CDN 或 browser 不 cache。 |
| Cache Storage 隔離 | 登入學生／老師、讀資料、登出及切帳號後，檢查所有 cache 的 keys／responses：只准明確 allowlist 的公開靜態內容／離線說明頁；API、auth、課務 JSON、私人 HTML、非 GET、含個資回應均無 entry。`no-store` 不會自動阻止 SW 的 Cache API 寫入，須同時驗證 allowlist。[Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) |
| 離線／更新 | SW 有實作時，斷網導航只顯示公開離線說明；送出／接受／取消不得偽裝成功，重試在線恢復。正式版本更新時測新 SW、舊 cache 清理及新版載入，不強制在未存草稿中 reload。不額外發布測試版本只為做更新 probe；遇正常版本更替時記錄證據。無 SW 就如實列需要網路及更新方式。 |

PNG 可用下面的 Node 斷言，對正式下載的 response bytes 做驗證；HTTP probe 只記 status、Content-Type、Cache-Control 與尺寸，不輸出 cookie／私人 payload：

```js
const bytes = Buffer.from(await response.arrayBuffer());
assert.equal(response.status, 200);
assert.equal(response.headers.get("content-type")?.split(";")[0], "image/png");
assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137,80,78,71,13,10,26,10]));
assert.equal(bytes.subarray(12, 16).toString("ascii"), "IHDR");
assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], expectedSize);
```

最後分別記錄**自動化資源／SW 驗證**與**手機實際安裝**。iPhone Safari 依分享→加入主畫面→Open as Web App（依該版 UI）→點主畫面圖示，驗 standalone 啟動、登入、App 內返回／詳情關閉、safe area／鍵盤與學生待辦保存；Android Chrome 使用真實安裝入口並點 App 圖示做同一流程。Chromium App 內安裝按鈕只在收到 beforeinstallprompt 時可執行，事件缺席則須有可操作的選單指南。[Apple 真機流程](https://support.apple.com/en-au/guide/iphone/iphea86e5236/ios)

記錄裝置型號、OS／browser 版本、日期、URL／deployment ID、結果。桌面 UA、390px viewport、Playwright 或 desktop standalone 都不能代替手機實際成功；沒有可用真機就明確寫「iOS／Android 裝置端待驗證」，不要寫已安裝成功。README／TEST_REPORT／Devpost 的 App 定位、需要網路的功能、更新方式與此證據一致；本段沒有宣稱推播或 App Store 上架。

## 7. 最後交付與失敗處理

- 把真實公開網址、GitHub／PR、四角色 demo instructions、production verification 寫入 README／TEST_REPORT／HANDOFF 與提交文案。文件改動另記 parent commit；如 app tree 改動，重新發布對應版本，不冒稱既有 archive 出自新 commit。
- 保存 parent commit→app tree→Sites source commit→archive hash→saved version→deployment→environment revision 的對照，明確區分各 ID。
- Native save/deploy／CI 失敗：保存結果，修具體原因後重建；不弱化 checks、不 force-push。確定 migration error 時只能修未套用的失敗檔案與對應 metadata；套用邊界未知須查清，不改寫歷史。
- 平台 approval／帳號／外部同意拒絕時，先完成所有本機／GitHub可執行項；對外如實指出具體 blocker，不能補假網址或宣稱完成。
- 發布流程不處理 Devpost 最終提交或替本人同意條款。截止仍以台灣 **2026-10-05 15:00**，建議 **12:00** 提交。

參考來源：現行 Sites `sites/1.0.0-a/skills/sites/SKILL.md` 與同版 `scripts/site-workflow.mjs`、`build-site.mjs`、`configure-execution-profile.mjs`、`package-site.mjs`，實際 package shell 位於 `skills/sites/scripts/package-site.sh`。R03 的封裝實測仍是 0.1.75 的歷史證據；舊 plugin 路徑已消失，正式 release 僅使用現行絕對路徑。本研究沒有呼叫原生外部工具。
