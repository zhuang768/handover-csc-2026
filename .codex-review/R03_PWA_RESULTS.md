# R03 PWA 複驗：核心排除通過，仍待小幅修正與裝置驗收

固定產品 commit：`f3fa696115a86f98995686b6bb934b90492133ab`；handover tree：`911adb7043d89b7487b12b9bb3d06876457699a5`。正式工具讀此 commit 的 `handover/public/sw.js`；SHA256：`f1c1ecd2dcf997277a8f98515e9e22f9cae0a6af021d1fce9fb420ff7b86a5f2`。不將 moving HEAD 或 Cursor 狀態當成產品證據。

範圍：SW 行為 VM、manifest／metadata／PNG header／安裝與更新 UI 的唯讀程式檢查、產品 E2E 證據強度審查。沒有啟動產品服務、操作 GUI、登入 DB、安裝套件或修改產品。本報告不是 iOS/Android 真機通過紀錄。

## 行為結果與重要區分

review-owned [工具](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/sw-behavior-probe.mjs) 自檢安全 fixture 28/28；六個錯誤 fixture 均被抓到。固定產品正式跑 **22 pass／6 fail，exit 1**。完整28斷言保留在工具，mock fidelity 與命令見 [SW_HARNESS.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/SW_HARNESS.md)。

| 類別 | 案例數／結果 | 證據可支持的結論 |
| --- | --- | --- |
| install 不強制更新、失敗 install 保留前版 | 2／通過 | 公開預快取成功；install 404 不執行清理或自動 skipWaiting。 |
| 直接 workspace/auth/detail/notifications API、ICS、私人非 allowlist 資源、跨 origin、POST/PUT/PATCH/DELETE/HEAD | 13／通過 | 這些實際常見路徑不寫 Cache Storage，網路失敗不被公開頁面替代。不能沿用「直接 API 被快取」描述。 |
| 私人導航／401/403/500／公開離線 allowlist／缺 offline 頁／公開 HTTP 失敗 | 7／通過 | 登入後 HTML 不入 Cache；網路拒絕只 fallback 公開頁；HTTP 錯誤原樣保留；缺 offline 頁回503；公開500不覆蓋好快取。 |
| Authorization／敏感 query／RSC 的公開外觀 URL、allowlist 重導至私密API | 4／失敗 | 刻意構造的 guard 缺口。現有正常 app 未觀察到 Bearer/secret URL／重導至私密API，**不代表正常流程已洩漏私人資料**。公開offline已有307實證，另見SW-R03-04。 |
| runtime put 生命週期、activate 清理 namespace | 2／失敗 | 真正 SW 維護／可靠性缺口；小幅修正即可，無須大型離線框架。 |

### SW-R03-01 — activate 刪除所有其他 Cache namespace

[sw.js:33](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/public/sw.js:33) 只以 `key !== VERSION` 過濾，沒有自身 prefix。VM 放入舊 `handover-public-*`、`other-app-v1` 與 `handover-unrelated-tool-v1`，activate 把後兩者也刪除。這是實際 handler 行為，不依賴私人資料假設。

最小驗收：只刪 `handover-public-` 下的過期版本，保留當前版本與其他 namespace；28 案例中的 scoped-cleanup 通過。新安裝失敗仍不能清掉可用舊版。

### SW-R03-02 — runtime put 沒有 fetch 生命週期保護

[sw.js:78](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/public/sw.js:78) `void caches.open(...).then(cache.put)` 沒有 await，也沒有 `event.waitUntil`。VM 將 put 延遲20ms後，觀察寫入完成晚於 respondWith／waitUntil 結束。這證明生命週期未受承諾保護；不聲稱每次真瀏覽器一定遺失。

最小驗收：把 runtime 寫入納入 respondWith 或 waitUntil 並處理失敗；正常回應不因非必要快取失敗變成假離線／吞掉 API錯誤；生命週期案例通過。

### SW-R03-03 — 四個刻意邊界 guard 缺口（防護補強）

[sw.js:72](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/public/sw.js:72) 僅比 pathname，沒有 query／Authorization／RSC guard；[sw.js:76](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/public/sw.js:76) 只檢查 `response.ok`，不檢查重導後的實際 URL。以下四個合成請求各造成一次新 Cache 寫入：`/offline.html`＋Authorization、`/offline.html?recoveryCode=probe-secret`、`/offline.html`＋RSC headers、公開 allowlist 重導到 `/api/auth/me`。合成回應用 marker 模擬可能的私密內容，RSC 案主要驗證不應持久化特殊請求。

最小驗收：公開 allowlist 僅接受無 query/Authorization/框架私密請求特徵的同 origin GET；重導至私密API／不同 origin/URL／非公開內容不寫入 Cache。普通公開資產與實際導航 fallback 必須再通過built驗證；canonical公開offline路徑可依真實assets契約調整。這是嚴格公開快取政策的小修，不據此推測不存在的 Bearer/secret URL 資料流。

### SW-R03-04 — built Worker公開offline確有307，真正離線reload未成功（根代理觀察，因果待驗）

根代理停止自己8789 built Worker後，已載入tab的reload呈IAB custom network error `ERR_FAILED`，沒有公開離線頁。當時controller未被證實，因此單獨這次結果不能證明SW一定已接管或鎖定根因；不冒稱真機／標準Chrome重現。

更具體的built Worker log是 `GET /offline.html 307 → GET /offline 200`。Cloudflare預設HTML canonical處理確實會將`/file.html`307到`/file`，支持這段log的原因。[Cloudflare HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/) 固定版SW install在18–20跟隨fetch重導後put原始key，再於62回傳該Response；它沒有驗證redirected。WHATWG Fetch規定service-worker回應的URL list超過一項且request redirect mode非follow時，產生network error。[Fetch Standard：HTTP fetch](https://fetch.spec.whatwg.org/#http-fetch)

**推論而非已定位根因**：若受控導航回傳帶redirect歷史的cached offline Response，就可能符合上述network-error條件。VM目前只模擬redirect metadata，沒有瀏覽器內部URL list／navigation接受規則，22 pass中的fallback成功不能排除這個built限定問題。這是公開頁可靠性問題，不是私密內容重導洩漏；不再假設所有allowlist資產均不重導。

最小驗收：真正built Worker而非dev server，先證明registration active＋目前page controller，記錄offline來源Response的URL／redirected與Cache key；真正斷網後reload／導航，確實看見雙語公開頁且不保留私人HTML。可使用真正無重導canonical public path或生成乾淨公開fallback Response；不得只新增guard後令預快取失敗卻沒檢查fallback可用。恢復網路後正常session／API重試，並保留28安全斷言。後續工具可適應公開路徑契約（例如`/offline`），不硬鎖舊檔名或弱化排除/private/lifetime/prefix驗證。

## 靜態實作與仍需驗收

| 項目 | 固定版事實／結果 |
| --- | --- |
| manifest、identity、standalone | `public/manifest.webmanifest:2–10` 有 id/start_url/scope `/`、display standalone、紙色與主綠。`app/layout.tsx:9–29` 有 manifest、appleWebApp、apple icon、viewport-fit cover、theme color。靜態結構具備；最終 HTTPS headers／真機安裝待驗。 |
| icons | PNG IHDR 實讀：icon192＝192×192、icon512＝512×512、maskable＝512×512、apple＝180×180；manifest purpose any/maskable 有區分。四檔 colorType6（RGBA）；只憑這點不能判斷實際不透明、full bleed、maskable safe zone，裁切真機仍待驗。 |
| safe area／44px | CSS `522–525` shell 上左/右 inset，bottom-nav `519` bottom inset；summary `528` 與button `540` 最小高度44。離線頁 `offline.html:14` 下 inset 與button44；上下左右在 iOS landscape/standalone/鍵盤遮擋未驗；手機導覽截切見前端報告。 |
| 個資快取 | JSON helper `server/service.ts:208` no-store；SW/API/private navigation 排除通過。`service.ts:2527–2531` 另建 ICS Response 只指定content-type/disposition，沒有同一 no-store；應小幅補 HTTP 防護。SW 不快取該路徑已過，不能將兩層混為一談。 |
| offline 訊息 | `offline.html:31–38` 清楚雙語說明沒有存課表／沒有送出、重連重試。`i18n.ts:570–571/615` banner「連線恢復前…」容易被讀成會自動補送，實作沒有queue；可改為需重連後重新提交的明確文字。 |
| 安裝引導 | `install-guide.tsx:28–34/104–122` 使用 browser install event＋預設收合details，Safari/Chrome 分流文案。`i18n.ts:565/610` 缺新iOS「Open as Web App」選項步驟；使用者已定位先用HTTPS＋加入主畫面，應依真機當前系統更新。standalone仍顯示整個安裝details，只多一段已開啟資訊107，不能宣稱已隱藏已安裝promotion。不需要推播或安裝新套件。 |
| 安全更新 | SW install 無自動 skipWaiting；UI只有click後傳message；`install-guide.tsx:82` 擋住根editing draft。**93–95 postMessage 後立即reload，未等controllerchange**；可能先重載舊controller，需要實際兩版更新驗證與等待接管。root只傳Editor的editing；Profile/Detail未存留言與正在處理的mutation不在guard，需確認不遺失輸入。 |
| registration失敗 | `pwa-register.tsx:8` 無catch，且`install-guide.tsx:43`另register同scope（後者有catch）。前者失敗可能unhandled rejection；應集中/捕捉可見失敗。當前無prod gate，E2E就在dev註冊；避免開發舊SW影響HMR，或明確採固定built預覽驗證。不擴成離線同步。 |

安裝要求的官方文件與來源日期已在 [PWA_ACCEPTANCE.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/PWA_ACCEPTANCE.md) 留存；本輪不把 metadata/manifest 存在誇大為 iOS/Android 已安裝成功。

## E2E 品質與真機證據缺口

根代理回報固定候選版6 E2E exit0；這是產品 automation 確實通過其現有斷言，不等於完整PWA驗收。

- `tests/e2e/workspace.spec.ts:121–178` 名稱稱「offline navigation」，實際讀取SW/offline頁、輪詢cache內容、登入後 dispatch合成offline事件；**沒有真正切網路offline、reload/navigation、驗證controller接管**。active在145只記錄，不是成功條件；API快取檢查161–170在student登入之前。可證明公開預快取與bannerlistener，不能證明已登入課表API後不快取／真正離線導航。
- `tests/pwa.test.ts:35–40` 目前只是SW source regex；獨立VM行為補足normal排除及邊界測試，不取代真正瀏覽器生命週期。
- 390px安裝截圖測試115先手動展開details，117/118無狀態變更連存兩張；不能把展開guide占大半首頁說成default。這兩張也不是兩個手機頁面覆蓋。
- `playwright.config.ts:18/23` 是loopback dev＋Desktop Chrome；沒有公網HTTPS、iPhoneSafari/AndroidChrome、installed display-mode、landscape safe area、兩版update／systemhomeicon測試。

最小後續證據：固定built/HTTPS候選上，一台iPhone、一台Android完成安裝→icon啟動standalone→三角色可登入／登出→長繁中與390級窄螢幕可觸控→已登入工作台斷網reload顯公開雙語fallback（無私人HTML／API Cache）→重連主動重試→兩版更新不自動遺失草稿。桌機automation補真offline/context＋controller＋post-logincache檢查，以及本報告兩維護/四guard小修28行為全綠。

本輪判定：正常路徑公開快取隔離有實際行為證據；SW維護和更新仍需修正、完整installed／真機／離線reload尚無證據，**不可標PWA整體驗收完成**。
