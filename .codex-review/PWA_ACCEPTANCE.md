# Handover：HTTPS 網址＋加入主畫面（PWA）實作與驗收

狀態：**使用者已明確定位為 App；PWA 尚待實作／驗收**。查證日期：2026-10-04（台灣）。Cursor R03 還在施工，本報告是唯讀快照，不宣稱產品已完成；未操作 Cursor／瀏覽器／DB／服務，未新增產品檔或套件。

目標是手機從 HTTPS 網址開啟，加入主畫面後以獨立 App 視窗使用既有三角色課務流程。下列安裝、斷線、安全更新是本次定位的最小補強；沒有要求 App Store／Play 上架、推播、離線課表、背景寫入佇列或整套同步。

## 目前來源快照

根 HEAD `1f1fe77`，產品最後提交 `73d32c1`；R03 未提交工作可能持續變動，完成後須重讀。以下行號來自本輪讀取，非舊 R02 CSS 行號。

| 項目 | 目前實際來源 |
| --- | --- |
| Manifest／standalone | [layout.tsx:3](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/app/layout.tsx:3) metadata 無 manifest；app/public 清單未找到 manifest、standalone/start_url/scope 或 display-mode 判斷。未看部署 DOM，不能排除舊部署另有設定。 |
| Icons | [layout.tsx:8](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/app/layout.tsx:8) 只有 favicon／shortcut；[favicon.svg:1](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/public/favicon.svg:1) 是藍色64×64 viewBox圖案。未找到192／512／maskable／Apple touch PNG資產或宣告。 |
| Viewport／safe area | layout 未匯出 viewport，CSS 未找到 safe-area-inset；[handover.css:509](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/handover.css:509) bottom-nav 為 sticky/bottom:0/padding:6px。[342](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/handover.css:342) 使用100dvh，但這不能單獨證明瀏海／Home indicator／鍵盤不遮擋。 |
| 安裝引導／SW | 產品來源未找到 beforeinstallprompt、appinstalled、安裝引導、瀏覽器SW註冊／Cache Storage操作。build/sites-worker.ts 是Cloudflare伺服器Worker，不能當瀏覽器SW。未檢查部署既有SW註冊。 |
| 私人資料 HTTP 快取 | [service.ts:205](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:205) JSON helper 已有Cache-Control:no-store。但角色課表ICS回應 [2527](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:2527) 只有content-type/disposition，尚未no-store。使用者主動下載ICS與自動HTTP/SW快取要分清楚。 |
| Local storage | [app.tsx:106](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:106)、[121](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:121) 僅讀寫偏好：語言、主題、大字、高對比、simple；未見把workspace或token寫入此處。 |

## 官方查證後的界線

MDN 安裝指南目前標示2026-09-07更新：瀏覽器安裝推廣需manifest與HTTPS（localhost只是開發例外），Chromium主要欄位包含name/short_name、192與512 icons、start_url、display，prefer_related_applications不得true；service worker不是安裝的必要條件。獨立App採display:standalone。[MDN：Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

Apple目前iPhone指引是Safari開網站 → 頁面選單／分享 → 加入主畫面 → 開啟「Open as Web App」 → 加入。iOS沒有beforeinstallprompt；應提供可執行的手動步驟，不能放假「一鍵安裝」。[Apple：Turn a website into an app](https://support.apple.com/en-au/guide/iphone/iphea86e5236/ios)、[MDN：安裝提示支援](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

不要照搬舊Lighthouse PWA評分清單。Chrome官方2023公告已移除Android選單安裝所要求的SW fetch-handler；不同版本的自動提示仍有額外條件，beforeinstallprompt未出現不代表App壞掉。驗收採真裝置實際安裝，安裝按鈕採feature detection。[Chrome：Revisiting installability criteria](https://developer.chrome.com/blog/update-install-criteria)

WebKit說明manifest standalone及Apple touch icon，並指出apple-touch-icon優先於manifest icon；第三方iOS瀏覽器在16.4起可提供分享加入主畫面。因此guide以Safari為清楚的標準路徑，但不要寫「所有其他iOS瀏覽器均不可能安裝」。[WebKit：Home Screen web apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

部分web.dev教學仍含較舊「iOS只能Safari」文字；本報告採較新的MDN／WebKit與Apple使用指引，不把舊限制寫成2026通則。瀏覽器／OS版本差異須寫在實際驗收證據中。

## 可直接交給 Cursor 的最小實作

### 1. 公開manifest與App圖示，沿用現有架構

用既有public靜態檔或架構實際支援的manifest route，不必加PWA套件。layout連到同一份公開manifest；所有頁面實際HTML head都須有link。產品若在origin根目錄，下例可作起點；若部署base path不同，id/start_url/scope與資產路徑一起調整，不能填localhost、preview token、角色／帳號或課務內容。

```json
{
  "id": "/",
  "name": "Handover",
  "short_name": "Handover",
  "lang": "en",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#F6F4EF",
  "background_color": "#F6F4EF",
  "prefer_related_applications": false,
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

id是穩定App身分，不隨commit或語言變動；start_url在scope內，同origin可直接開啟。manifest scope定義App視窗導覽範圍，**不是授權邊界，也不等於SW scope**。[MDN：id](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/id)、[web.dev：Manifest](https://web.dev/learn/pwa/web-app-manifest)

圖示延續已核准暖白／墨綠及Handover識別；192與512一般PNG、獨立512 maskable PNG、180×180 apple-touch-icon PNG。maskable需不透明滿版底，關鍵圖形置於中心「直徑80%」安全圓內，不先烤圓角，不只改purpose而不改構圖。Apple head明確宣告apple-touch-icon；180尺寸來自Apple相容指引，不是所有平台的唯一安裝尺寸。[MDN：Define app icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons)、[Apple：Web application configuration（歷史相容指引）](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

可保留Apple web-app title/capable相容metadata，現代manifest仍是主設定；status bar預設即可，不為效果強加black-translucent。theme-color與暖白啟動底一致；既有dark mode保留時檢查切換後狀態列／App背景可讀。不必生成所有Apple splash尺寸、screenshots或商店促銷欄位。

### 2. 簡潔、真實、雙語的安裝入口

- 登入頁／設定提供「加入主畫面」說明入口；English預設、繁中可切，文字集中現有i18n。這是App使用入口，不要改成大型marketing hero或強制安裝遮罩。
- Android／Chromium只有捕獲到beforeinstallprompt才顯示可呼叫prompt的安裝動作；需使用者點擊才觸發、處理accepted/dismissed、一次event只prompt一次。沒有event時顯示瀏覽器選單手動說明，不顯示永遠無作用的Install button。
- iOS顯示Safari分享→加入主畫面→「以Web App開啟」（若版本有此選項）的步驟；站內無法替使用者操作系統分享選單。其他瀏覽器提供適切fallback，不假稱可以程式呼叫iOS安裝。
- 用display-mode:standalone與可選navigator.standalone相容檢查，從已安裝App啟動時隱藏安裝促銷。不要把「目前browser mode」當作「使用者絕對尚未在別處安裝」。appinstalled只做UI收斂，不新增analytics。

這些提示與fallback基於 [web.dev：Installation prompt](https://web.dev/learn/pwa/installation-prompt)；iOS支援範圍以本報告較新官方來源為準。

### 3. 手機安全區與App導覽

實際viewport需width=device-width、initial-scale=1；若採edge-to-edge，加入viewport-fit=cover並同時處理env(safe-area-inset-top/right/bottom/left)。bottom-nav至少加原padding＋bottom inset；橫向的主要內容／導覽也避開左右不安全區。保留正常margin、100dvh可用，但別以固定裝置px硬塞Home indicator高度。這是viewport-fit與env的成套使用，不是只加一項。[WebKit：Safe areas](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)、[Apple：Design for Safari](https://developer.apple.com/videos/play/wwdc2021/10029/)

390px與真iPhone standalone中，keyboard開啟後表單action／最後欄位可見可捲，sticky nav不蓋focus；必要時簡化／收合導覽。保留縮放、大字、44px實際可點範圍與Escape／Tab動線。App沒有browser toolbar後仍要有返回／關閉詳情與回首頁的路徑；教材外連不可把使用者困在無返回的陌生頁。

### 4. 斷線與私人資料：採最小公開fallback，API永遠走網路

**建議實作一個小SW與不含資料的離線頁，理由是冷啟動／重新載入斷線時有清楚退路；不是為了安裝資格。** 可只cache靜態 `/offline.html`（包含必要自帶style／圖示）；不需要precache整個App或Runtime cache套件。離線頁可同時放English／繁中：需要連線才能讀取最新課表、離線無法送出或儲存新的變更、重新連線後重試並核對先前提交結果。內容不得嵌入姓名、班級、課表、原因或recover code。

SW策略必須可在程式碼直接看出以下界線：

| 請求種類 | 最小策略 |
| --- | --- |
| 明確allowlist、公開無資料的offline頁及必要資產 | versioned cache；GET、same-origin、精確路徑，無敏感query；只儲存成功的公開回應。不要「所有public目錄」或全網cache-first。 |
| App頁面的GET navigation | 網路直接取，**不把成功HTML加入CacheStorage**；真正network rejection時才回通用offline頁；不要把401／403／API錯誤／500包裝為已保存的舊課表。 |
| `/api/**`（包含calendar／auth／workspace／request／admin）、RSC／資料載入、帶Authorization、非GET、跨origin、私人教材 | 完全不讀寫SW cache、不套offline HTML fallback；保留正常網路／錯誤處理。不要攔截mutation回假200。 |

Cache API**不會遵守HTTP Cache-Control自動排除資料**，因此no-store不能代替SW的明確allowlist；CacheStorage沒有自動到期，要自行管理版本。[MDN：Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)

保持JSON既有no-store，角色ICS亦加no-store防止非使用者要求的HTTP儲存；若個人化HTML／其他私人匯出存在，同樣檢查。使用者主動download的ICS檔案是明確匯出，不必為PWA功能取消。[MDN：Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)

已開App的斷線提示可參考online/offline事件，但navigator.onLine可能只代表LAN連接；它只能作提示，實際fetch失敗才判定這次操作。畫面留在記憶體的上次資料要標出無法取得最新狀態，不把它持久化做離線課表；重連後可重抓唯讀GET，不能盲目重播接受／取消／submit。若回應中斷無法知道寫入是否完成，先核對最新狀態再提示重試。[MDN：Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)

不把session cookie/token、password、recovery code、API回應／私密teacherNotes等寫進CacheStorage／IndexedDB／localStorage；保留既有語言等偏好即可。登出清除App記憶體資料；從主畫面再次啟動必須重新走真正session檢查，不能看到上一位教師資料。Safari與已安裝App的session是否共用不作保證，正常登入可在兩個context各自完成。

### 5. 安全更新與開發環境

SW穩定URL、scope只涵蓋本App；cache用`handover-public-vN`之類專屬prefix。activate只刪本App過期cache，不刪整origin所有cache；新版本安裝失敗時舊版本仍能工作。不要預設skipWaiting＋controllerchange自動reload，打斷老師未存交接。最小可採預設waiting，離開所有舊clients後啟用；若提供「更新可用」，由使用者主動選擇，未存表單／mutation進行中不可強制reload。[web.dev：Service worker lifecycle](https://web.dev/articles/service-worker-lifecycle)

manifest／sw.js要可重新驗證更新，避免immutable長效快取；固定URL，不把build版本拼成每次新的SW註冊URL。開發環境不註冊production SW，避免HMR／舊cache誤判；不用SW支持的瀏覽器仍正常使用HTTPS版本。既有公開部署若已有錯誤快取SW，交付時須驗證安全清理／upgrade，而非只測清空瀏覽器後的安裝。

## 驗收表：實作後逐項記錄，不先打勾

| ID | 操作與通過條件 | 證據方式 |
| --- | --- | --- |
| PWA-01 | 最終公開HTTPS網址無TLS錯誤／mixed content；URL可直接開啟三角色App。localhost或LAN HTTP不作正式安裝證據。 | 真公開URL、browser network與console。 |
| PWA-02 | 登入與登入後實際head含同一manifest link；200、正確JSON／content-type、無session gate。 | DOM head、manifest response／DevTools。 |
| PWA-03 | id穩定，start_url與scope同origin且範圍正確；無帳號、課務內容或token。 | JSON解析／URL解析；實際從icon啟動。 |
| PWA-04 | manifest為standalone；iOS/Android主畫面icon開啟獨立App視窗，無普通browser address bar。 | 真裝置畫面、display-mode診斷；記錄OS/browser版本。 |
| PWA-05 | 192/512 any PNG、512maskable、180Apple PNG可公開讀取，尺寸／MIME正確，識別與核准墨綠一致。 | 資產metadata檢查＋安裝畫面。 |
| PWA-06 | maskable在中心安全圓仍完整；Android圓／圓角launcher沒有裁掉關鍵圖形或白框縮小。 | DevTools maskable safe area、實機icon。 |
| PWA-07 | iPhone使用預期apple-touch-icon，App名稱Handover、啟動底／狀態列可讀，dark/contrast切換不失讀性。 | iPhone加入主畫面與冷啟動畫面。 |
| PWA-08 | iOS手動guide EN/繁中正確；新版選項出現時有Open as Web App指引，舊版本也能理解。 | 真Safari分享流程，文字／aria檢查。 |
| PWA-09 | Android收到beforeinstallprompt才有可觸發prompt的按鈕；accepted/dismissed都收斂UI，未收到event仍有手動說明。 | 真Chrome安裝與取消；feature分支測試。 |
| PWA-10 | standalone不顯示安裝促銷；不支持prompt的瀏覽器沒有假按鈕、強制彈窗或無限重試。 | browser/standalone與unsupported分支。 |
| PWA-11 | 390/768/1440px的登入＋三角色EN/繁中，App導覽、詳情返回、長字串無整頁橫向overflow。 | 既有VISUAL_ACCEPTANCE回歸＋DOM量測。 |
| PWA-12 | 真iPhone瀏海／Home indicator直向橫向均不蓋header/nav/action；env inset有作用且不重複padding。 | 真standalone與Safari各旋轉，截圖＋computed。 |
| PWA-13 | keyboard開啟時交接最後欄位／儲存／送出／詳情返回可達；focus不被sticky遮住。 | 真iOS/Android長表單，鍵盤與捲動。 |
| PWA-14 | 安裝guide／offline頁／更新提示可keyboard操作、labels/aria-live合理、44px、大字／縮放與reduced-motion可用。 | DOM／keyboard／模式切換，不只CSS存在。 |
| PWA-15 | 已開App斷網顯示真實錯誤，沒有假保存成功；navigator.onLine為true但API無法連線也正確處理。 | offline模式、阻擋API／500對照。 |
| PWA-16 | 至少成功連線並安裝SW一次後，斷網冷啟動／refresh顯示通用離線頁，沒有私人資料，重連Retry可回App。首次從未載入便斷線不假稱可用。 | installed App offline冷啟動、SW控制與fallback。 |
| PWA-17 | API回應失敗從未被SW替換成offline HTML／假200；網路中斷的mutation不自動重播，恢復後可核對狀態。 | response MIME／status與mutation計數／timeline。 |
| PWA-18 | 登入teacher並讀workspace/detail、收通知／下載ICS後，CacheStorage中僅明確公開allowlist；私人內容與標記不出現。 | Cache keys/body檢查；用PRIVATE測試標記，證據遮蔽真內容。 |
| PWA-19 | JSON／ICS／其他私人response有no-store；cache策略即使遇未帶該header也不快取非allowlist。 | network headers＋SW程式／行為負面測試。 |
| PWA-20 | localStorage/IndexedDB沒有cookie/token/password/recoveryCode／課務JSON；沒有新增背景sync或推播permission。 | readonly storage／permission檢查，避免截取秘密值。 |
| PWA-21 | teacher登出→離線reload／關閉重開→另一學生登入，畫面／cache不能暴露前一位私密欄位；401正常回登入。 | 雙帳號分角色流程＋raw response privacy回歸。 |
| PWA-22 | 由v1升v2：未存交接與忙碌mutation不自動reload；稍後正常重開可取新版本，舊cache僅刪App prefix。 | updatefound/waiting/activation記錄、保留表單；混入其他prefix測試。 |
| PWA-23 | 新SW404／syntax/install失敗不讓既有App空白；未支持SW或安裝的browser仍正常連線使用。 | 受控負面測試／fallback。 |
| PWA-24 | production SW在dev/HMR不註冊；manifest/SW/image在正式build／部署可訪問，無missing asset或永久舊版本。 | 對應build產物、HTTP headers、重新驗證更新。 |
| PWA-25 | 安裝後三角色原P0：登入/註冊/recovery、調代課草稿/衝堂/送出/接受退回/取消完成、跨週通知、學生todo、admin篩選／users正常。 | 既有API測試＋真App角色正反流程。 |
| PWA-26 | 記錄實際裝置／OS／browser、HTTPS URL／commit、測試與未做項目；只有桌機390模擬不能稱已完成iOS/Android實機安裝。 | TEST_REPORT/HANDOFF實際證據；無實機項目列pending。 |

最小自動檢查可用既有工具：manifest/schema與URL、PNG尺寸、SW allowlist／API bypass／navigation network-failure fallback／cache prefix cleanup，以及安全update策略。補這些有意義的測試，不引入PWA framework、用class鏡像測試或弱化既有CI。

交回時保留App原功能與已有安全／並行修正；本文件僅供新增PWA實作和最終驗收，所有項目目前均未由本代理實機驗證。
