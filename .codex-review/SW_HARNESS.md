# Reviewer Service Worker 行為工具

工具：[sw-behavior-probe.mjs](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/sw-behavior-probe.mjs)。純 Node VM，沒有依賴、實際網路、瀏覽器、DB、Cache Storage 或產品寫入。正式模式只從 `git show <完整 SHA>:handover/public/sw.js` 取得固定來源，不讀施工中的 SW。執行產品 SW 的真正 install/activate/fetch/message handler；沒有用 regex 取代行為斷言。

```sh
node --check .codex-review/sw-behavior-probe.mjs
node --test .codex-review/sw-harness.test.mjs
node .codex-review/sw-behavior-probe.mjs --self-test
node .codex-review/sw-behavior-probe.mjs --self-test --offline-path=/offline
node .codex-review/sw-behavior-probe.mjs --stable-sha f3fa696115a86f98995686b6bb934b90492133ab
```

Exit 0：所有行為案例通過；1：至少一個案例失敗；2：參數／來源／工具錯誤。輸出 JSON 含選定offlinePath、commit、SW SHA256、28 案例名稱、結果及斷言錯誤。正式產品結果另見 [R03_PWA_RESULTS.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/R03_PWA_RESULTS.md)。

## 公開路徑契約選項（R04工具更新）

`--offline-path=/offline`可放在self-test或stable-sha命令，預設仍`/offline.html`。路徑必須是無origin/query/fragment/traversal的絕對公開static pathname；API／私人／框架namespace會拒絕，錯字與重複flag也拒絕。工具不從產品source推測路徑或修改產品source；離線body marker、HTML MIME、跨origin／非GET／敏感請求／Cache key／所有正反fixture一致採此契約，其他安全排除不變。只允許選定offline路徑，不會同時偷偷把舊路徑視為公開。

後續候選若改canonical `/offline`，根代理取得真正固定的完整40位SHA後使用（先以完整SHA替換示意值）：

```sh
node .codex-review/sw-behavior-probe.mjs --stable-sha R04_FULL_40_CHARACTER_SHA --offline-path=/offline
```

JS匯出同樣支援`createHarness(source, { offlinePath: "/offline" })`、`probeSource(...)`、`selfTest(...)`。請不要對施工中的worktree source執行；CLI只讀固定SHA。

本次自身5個Node回歸案例通過（public/private header、canonical path/body/MIME、兩種path全部28／6對照、可合成no-store公開回應及Cache API語意、CLI安全參數）。兩種path的safe fixture都是28 pass／0 fail，六個negative controls每种path均被抓到；原R03固定SHA使用default重跑仍22 pass／6 fail、source SHA256相同。沒有跑R04 movingTree或產品server/build。

## 工具自檢

- 安全 fixture：28 pass／0 fail。
- 六個故意錯誤 fixture 均被預期的行為斷言抓到：私人內容快取、刪除其他 namespace、缺私人導航離線 fallback、install 自動 skipWaiting、allowlist 重導後存私人內容、沒有生命週期保護的背景 put。
- 每個案例使用獨立 VM／記憶體 Cache；單案例 3 秒上限。固定結果：六個錯誤 fixture 分別出現 15／1／5／1／1／1 個失敗。這是檢查工具有偵測能力的證據，不是產品失敗數。

## 模擬 fidelity 與界線

採 Node 原生 Request／Response／Headers。Node 無法建立 `mode: navigate`，所以只覆寫這個瀏覽器可觀察欄位及 destination，其餘仍用原生 Request。記憶體 Cache 複製 Request／Response，保留完整 query key，模擬 GET-only put、add/addAll 成功狀態檢查與 Cache API 不受 HTTP no-store 自動保護的特性；尚未完整模擬 Vary、配額、eviction、opaque/CORS、底層持久化或瀏覽器任意終止 worker。

一般公開allowlist網路mock是`Cache-Control: public, max-age=3600`；合成private marker／Authorization／query／RSC／private redirect回應是`no-store`，不能迫使安全SW為了通過公開正例而忽略no-store。公開offline的MIME為HTML＋UTF-8；產品fallback只需正確HTML media type，允許合法charset參數正規化。其他非HTML公開mock目前不解析真SVG/PNG等二進位內容；它是Cache行為邊界，不是檔案渲染或圖像完整性測試。

`h.cacheControl("no-store")`可合成**相同公開URL與公開body，但HTTP不可快取**的負面回應；只覆寫公開mock，私人marker仍固定no-store。獨立回歸案例驗證這個控制及Cache API：錯誤worker明確put時，Cache Storage仍會存no-store，mock不替worker自動補安全guard。此可合成控制沒有新增第29個產品必過案例／擴大未確認需求；若根代理要測候選的no-store回應guard，可在install後設定control，再觀察同公開URLfetch是否新增write。

生命週期案例刻意將 put 延遲 20ms，觀察它完成時 fetch 的 respondWith／waitUntil 是否都已結束。這可確認未被承諾保護的寫入，不能估算真瀏覽器中斷頻率。工具會排空 Promise 來觀察結果，不等同瀏覽器保證未受保護工作一定完成。

網路只回合成公開字串／`PRIVATE_SW_PROBE`，可切成拒絕、401/403/500 或重導 metadata。Authorization／敏感 query／RSC／allowlist重導至私密API為刻意構造防護邊界，不證明產品現有正常流程有這些請求或洩漏。對應案例要求完全不新增 Cache 寫入；直接 API／auth／ICS／非 GET／跨 origin／私人導航另有獨立案例。

R03根代理已觀察到built Worker公開`/offline.html`307至`/offline`，這與重導至私密API的合成guard案例不同。VM沒有模擬Fetch内部response URL list及導航redirect-mode接受規則，因此不證明cached redirected offline頁能在真正navigation使用。後續candidate若改canonical public path，可相應調整公開資源契約，保留全部安全行為斷言；不能把舊`/offline.html`字串視為必要產品實作。

## 不可由此宣稱的結果

工具不證明 HTTPS 部署 MIME/header、manifest 安裝 eligibility、iOS/Android 加入主畫面、standalone/safe area、真正離線 reload、controllerchange 更新、使用者內容保存或真機字型／觸控。這些仍需固定候選版的實際瀏覽器與裝置驗收；不要求推播權限或整套離線同步。
