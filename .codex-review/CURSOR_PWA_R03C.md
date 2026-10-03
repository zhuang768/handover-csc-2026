# R03C — 使用者最新定位：網址＋加入主畫面使用的 App

使用者直接要求：「我是要做一個 app，目前先用網址然後加入主畫面的方式去做。」這是既有 Handover 工作的新增驗收條件。沿用已批准的暖白 × 墨綠校園課務手冊，手機是學生的主要使用裝置；教師與管理員保留完整桌面工作台。請接續 R03 修復，把此項一起完成，不需另詢問方向，不要中斷未完成的原始驗收。

## 實作前的現況

- 目前 app/layout.tsx 只有 favicon metadata，未找到 manifest、Apple icon 或 service worker。
- public/favicon.svg 還是舊藍色品牌。請改成與已批准的墨綠品牌一致的自製 Handover 圖形，提供真正 PNG 安裝圖示，不能只改副檔名。
- 不添加新的 production 套件，不接 App Store、推播、付費服務或第三方帳號。

## 最小完整 PWA

1. HTTPS 正式網址可用，manifest 以正確 JSON/MIME 回應，HTML 有 manifest link。manifest 包含穩定 id、name/short_name、start_url、scope、display: standalone、背景與主題色，以及可實際載入的 192/512 PNG 和具適切安全留白的 maskable icon。root metadata 配置 apple-touch-icon（180 PNG）、Apple standalone 相容資訊與 viewport/theme color；不要阻止縮放。
2. App 內提供自然、可收合且有鍵盤/focus 的「加入主畫面 / Add to Home Screen」入口。iPhone/iPad 顯示 Safari 分享→加入主畫面→開啟為 Web App 的簡短說明（版本文字差異可註明）；Chromium 只有收到 beforeinstallprompt 才顯示可執行的安裝按钮，沒有事件時給瀏覽器選單說明。必須處理已安裝/standalone 狀態，不能畫一個永遠無效的安裝按鈕或自動彈出權限。
3. 手機底部操作列、頁面頂部與表單尊重 env(safe-area-inset-*)，使用合適 dvh/min-height 與可捲動內容，虛擬鍵盤開啟時可完成表單；觸控目標 >=44px。standalone 沒有瀏覽器上一頁時，App 的返回、關閉詳情、導覽仍完整可用。保留學生下一堂／當日／週課表的優先順序。
4. 加入主畫面不等於所有業務離線運作。明確顯示網路中斷與可重試，離線時不把提交/接受/取消顯示成成功。可實作小型原生 service worker：只保存無私人資料的離線說明頁和必要公開静態資源，導航 network-first，離線失敗才回離線說明頁；API、auth、私人課務 JSON、登入後 HTML、非 GET 與個人資料一律不進 Cache Storage。不要做資料同步佇列，不要以舊回應掩蓋權限或登出。
5. service worker 需要更新/版本清理機制，使用者能在安全時重新載入新版；不要自動在編輯未存草稿時跳頁或 reload，也不要把熱更新 dev JS 永久快取。生產建置後確認 sw 路徑與 scope 正確，不可 SPA HTML 假冒 sw.js。若沒有實作 SW，可安裝性本身仍成立，但請完整交代離線與更新策略；不要宣稱具備未實作的離線課表。
6. 安裝、離線與更新文案完整 EN/繁中，與既有 settings/errors/busy 行為一致，尊重 reduced motion。

## 可重複驗證與交付

- Playwright/API 或資源檢查：manifest link、JSON/scope/start_url、PNG 真實尺寸/MIME、icon 200、service worker 註冊/範圍（若有）、離線導航與線上恢復、private/API 不進 Cache Storage；切帳號與登出後無離線資料洩漏；beforeinstallprompt 缺席時仍有有效指南。
- 390/768/1440 實際 viewport 截圖，尤其學生手機首頁、手機交接詳情、加入主畫面指南。不能把桌機 screenshot 宣稱手機測試。
- 真正 iOS/Android 原生「安裝到主畫面→點圖示 standalone 啟動」若手邊沒有手機，明確列為裝置端待驗證。桌面模擬不能代替真機成功證據。
- README 與 demo/submission docs 明確定位為可安裝的 Web App，包含 iOS Safari/Android Chrome 安裝步驟、需要網路的操作、更新方法。CI 納入對應可自動執行的檢查。
- 最後繼續更新 CURSOR_STATUS.json，區分已通過與待真機驗證，不要替監督者宣稱 GitHub/正式網址已完成。

## 查證來源（官方；只借鑑規格和方法）

- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable — manifest 與 HTTPS/localhost，SW 不是現行安裝性必要條件。
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Create_a_standalone_app — display: standalone 與 display-mode，需自身導覽。
- https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios — Safari 加入主畫面與 Open as Web App。
- https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html — Apple touch icon/legacy 相容 metadata（舊文件，不能宣稱涵蓋所有 2026 行為）。

請依現有 Next/Vinext/Cloudflare 技術實際輸出驗證，不盲目照 Next 專屬行為假定 Vinext 支援。
