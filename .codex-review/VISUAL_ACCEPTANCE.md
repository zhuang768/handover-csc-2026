# Handover 視覺改版驗收清單

建立日期：2026-10-04（Asia/Taipei）。**文件狀態：設計方向已核准，改版待實作與驗收；本清單尚未執行。**

依據：[原始驗收基準](./ACCEPTANCE.md)、[已核准設計方向](./DESIGN_DIRECTION_PENDING.md) 及 `handover/docs/API_CONTRACT.md`。使用者已直接核准「採用這個方向，直接實作（推薦）」。本檔案只定義可驗證的結果，不表示畫面已完成或測試已通過；沒有修改產品或操作 Cursor。

暖白 × 墨綠、Manrope ＋ Noto Sans TC、版面與動態數值依核准方向驗收；若使用者調整方向，先更新對應驗收條件。Cursor 負責實作，Codex 於穩定版本交回後獨立驗收；既有 P0 功能與隱私閘門維持。

## 1. 執行方式與證據

- 僅驗收 Cursor 已交回的穩定版本；記錄 Git HEAD、未提交差異、測試網址、瀏覽器版本、時間、語言、角色及資料日期。產品改動後復驗受影響項目。
- 每項結果填 `未測／通過／失敗／有理由不適用`；附畫面、DOM／computed style、網路紀錄或測試結果。空白、只有「build 通過」或靜態截圖不能視為互動通過。
- 使用獨立測試資料及真實登入 API；三角色分開瀏覽器 context，接課老師另用第四個 context。不要透過前端改 role 或使用本機儲存冒充登入。
- 正常／回歸流程用真實後端資料。故障測試可攔截 API 回應或中斷網路，但證據須明記為「故障注入」；不能用攔截的成功資料證明流程完成。
- 敏感資料檢查記錄 private-marker 是否出現及 endpoint 即可，不把 recovery code、cookie、密碼或老師私密內容放入公開截圖／報告。
- 可使用專案既有 E2E 工具。以語意角色、可存取名稱與穩定測試識別選元素，避免依 DOM 位置或指定元件庫才能驗收。DOM 自動檢查與真實瀏覽器操作互補，不能只靠 axe 或截圖差異宣稱完整無障礙通過。

## 2. 裝置、語言與畫面矩陣

固定基準 viewport：`390×844`、`768×1024`、`1440×900` CSS px，100% 縮放；英語與繁中各跑一次。登入、學生、老師、行政各一張正常資料基準圖，共至少 24 張驗收證據；這不等於 Devpost 最終只需 5–8 張的選圖清單。重要流程另留操作與失敗狀態證據。

| 寬度 | 必跑畫面／操作 | 可觀察的通過條件 |
|---|---|---|
| 390 | 登入、註冊角色切換、重設；學生 Today／This Week／異動詳細／勾選；老師建立與編輯交接、教材增刪、衝堂、接受／退回；行政篩選與詳細、使用者／重設確認 | 先看到當前任務；手機導覽不占滿首屏；表單單欄可依序填完；所有欄位、錯誤、關閉／返回與主要動作可達；沒有全頁橫向溢出或內容被底部導覽／sticky bar 遮住 |
| 768 | 同四角色正常頁；老師完整長表單及 detail；學生週切換；行政組合篩選；逐一開選單／日期選擇器／對話框 | 不落入桌面與手機之間的破版；並排區域仍有足夠文字寬度，必要時折成單欄；浮層不超出 viewport；主要動作不因列寬減少消失 |
| 1440 | 登入與三角色桌面頁；老師課表＋待回應佇列；行政完整列表；請求詳細；鍵盤操作所有導覽／篩選／表單／浮層 | 課表和當前週次清楚；列表欄位對齊；資料與次要操作不搶主行動；欄寬、行長、留白符合核准提案，沒有巨大行銷區壓低工作內容 |

另外於 390 測較短高度（如 667px）及一次實際或可用手機瀏覽器的虛擬鍵盤；記錄無法使用真機的限制。桌面 Chromium 全矩陣，另以可用 WebKit／Safari 跑手機登入、日期、教材連結、長表單及彈窗；Firefox 至少跑鍵盤與縮放。未跑的瀏覽器不標已支援。

- [ ] **RESP-01** `documentElement.scrollWidth <= clientWidth + 1`；若週課表／資料表需要二維捲動，僅其有名稱的局部容器可橫向捲動，頁面標題、導覽、表單不一起移出畫面。局部表格可捲到最後一欄，且鍵盤能到每個動作。
- [ ] **RESP-02** 拖動寬度跨過實際斷點，保留登入、選週／篩選、當前請求及未送出輸入；不能同時出現兩份可聚焦導覽或把同一內容讀兩次。
- [ ] **RESP-03** 對話框／詳細面板可採桌面 pane、手機整頁或 modal；依實際型態驗收。內容、標題、返回／關閉及底部操作均可達，body／panel 不產生無法退出的雙重捲動。填最後欄位、虛擬鍵盤顯示與瀏覽器工具列變動時，仍能看見焦點與送出結果。關閉／返回後保留來源頁的週次、篩選與合理捲動位置。
- [ ] **RESP-04** 200% 文字放大／瀏覽器縮放可讀完與完成操作；補 320 CSS px reflow 壓力測試。週課表／二維資料表可局部捲動，其周邊介面仍應重排。[文字放大](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)、[Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

## 3. 角色頁面與設計方向

下列新外觀條件依已核准方向作為改版閘門；功能條件直接承接 P0。

| ID | 通過條件 | 驗證方法 |
|---|---|---|
| VIEW-01 登入 | 核准的工作手冊構圖、簡潔核心說明與原創 SVG 如有呈現；登入、註冊、忘記密碼仍清楚。學生／老師／行政 demo 加第二位接課老師入口可辨識，點擊建立真正 session | 三寬度截圖；Tab 順序；`/api/auth/demo`、`/api/auth/me`、重新整理及登出 |
| VIEW-02 帳號表單 | 學生班級、老師科目與邀請碼隨角色顯示；沒有 admin 自行註冊入口；註冊／重設的 recovery code 有清楚保存說明，長碼不溢出；profile 修改結果可重新載入 | 缺欄位／無效邀請碼／錯誤 recovery code；真實註冊→重設→登入；錯誤位置與可存取名稱 |
| VIEW-03 學生 | Today 顯示實際日期及自己班級；下一堂只在確有下一堂時顯示；異動的老師／時間／教室與實際課表一致；準備事項來自交接內容，Today 與 This Week 有清楚切換 | API 與 DOM 比對；有／無下一堂、週末、空週、跨週；進詳細並勾選三類待辦 |
| VIEW-04 老師 | 週課表是主要內容，待我確認佇列能找到自己被指派的 Pending；新交接依課程、教學、教材、學生、老師私密內容分組；必填完成度與缺漏訊息始終準確 | 日期／來源課更改、草稿重開、退回修改；七欄逐一清空；查看 required counter 與 disabled |
| VIEW-05 行政 | 學校列表、日期／班級／老師／狀態／搜尋組合篩選可辨識；本週、待確認、退回數源自 API；風險列說明具體課程及下一步 | 每個篩選及清除；已知 fixture 數量；空結果；點風險進正確跨週記錄 |
| VIEW-06 詳細 | 日期／節次／班級／教室／原老師→接課老師順序跨角色一致；狀態圖示＋文字＋顏色；時間軸、補充、主要動作依角色及合法狀態呈現 | 六狀態各開一次；三角色比對；Supplement／時間戳；鎖定欄位與非法操作 |
| VIEW-07 一致性 | 核准的主色、文字、間距、圓角、圖示和焦點以 primitive→semantic→component token 共用；同功能元件跨頁一致；不加入假統計、推薦詞、商業樣板區塊或借用品牌素材 | DOM computed style + 樣式來源；對照核准提案；確認數字來源與資源清單 |

API 狀態仍為 `Draft / Pending / Confirmed / Declined / Completed / Cancelled`。提案的 accepted 用語不能造成第七個狀態或改變 transition；中英文 UI 標籤需映射同一正式狀態。

## 4. 文字、雙語與長資料

- [ ] **I18N-01** 全新瀏覽器 context 預設 English；切繁中後 `html[lang]` 為 `zh-Hant` 或合適的 `zh-TW`，切回為 `en`。設定若有持久化，要依文檔可預期；切語言不能清掉登入、草稿或篩選。
- [ ] **I18N-02** 導覽、標題、按鈕、欄位／placeholder、必填提示、選項、空資料、載入、錯誤、success、通知／時間軸的系統動作、日期／節次及狀態均走 i18n；沒有顯示 raw error code、翻譯 key、`undefined` 或殘留另一語言的系統文案。課程名稱、姓名及使用者原文不要求自動翻譯。
- [ ] **I18N-03** 檢查 AX tree／DOM 的 icon button 名稱、對話框標題、`aria-label`、`aria-describedby`、狀態宣告、未讀數與 checkbox 名稱隨語言更新；只有畫面繁中但螢幕閱讀器仍英文判失敗。
- [ ] **I18N-04** 使用合法 fixture：40 字繁中姓名、60 字班級／教材標題、300 字多段提醒、300 字老師備註、300 字退回留言與至少 180 字元 URL；混合英文單詞、數字、標點、emoji。資料必須在 API 允許長度內，另測超限的友善錯誤。
- [ ] **I18N-05** 三寬度檢查上述長文換行；表單 label、缺漏清單、狀態 badge、通知、表格與材料 URL 不遮住鄰項。摘要可截斷，但可用鍵盤／觸控進詳細取得全文，不能只靠 hover tooltip；填寫欄位及錯誤不能靠截斷隱藏內容。
- [ ] **I18N-06** 日期與相對時間和學校時區一致；週末空態不說今天有課，下一學校日明確分開；不得把前一週請求顯示在錯誤週次。數字採表格數字，節次及日期對齊可由 computed style 與截圖驗證。

## 5. 全部狀態與故障

對 button、input、select、checkbox、tabs／導覽、通知列、課表格、dialog／pane 逐一記錄適用狀態。沒有 hover 的觸控裝置仍可使用；沒有該狀態者以理由標不適用。

| 狀態 | 觸發／fixture | 通過條件 |
|---|---|---|
| default／hover／active／focus | 指標停留、按住滑鼠、Tab、Enter／Space | 功能與資訊不只 hover 才出現；狀態可辨識，沒有閃爍、文字位移、focus ring 被覆蓋 |
| selected／checked／expanded | tabs、filter、checkbox、drawer、選單 | UI 與語意如 `aria-selected`、`checked`、`aria-expanded` 一致；選中、hover 與 disabled 易區分 |
| disabled／locked | 未填交接、衝堂、已送出內容 | 原生表單控件確實 disabled，或等效語意加行為攔截；Enter／程式觸發不能送出。缺漏原因仍可讀；送出後 private/public 原文鎖定，不能只灰掉顏色 |
| loading／busy | 延遲登入／workspace／儲存／確認／todo API | 有簡潔載入指示與必要 `aria-busy`／宣告；重複點、Enter 不產生兩次 mutation；完成或失敗可解除忙碌，不殘留 spinner。`aria-busy` 本身不會禁止操作，須另驗事件防護 |
| success | 真實成功儲存／接受／準備完成 | 只在 API 成功後呈現；重新整理仍保存；訊息可讀／可被宣告，不被後續 refresh 立即清掉或移焦至錯誤地方 |
| validation | 七欄缺漏、無效 email／邀請碼／教材 URL／退回空留言 | 欄位附近具體說明，和欄位關聯；缺漏清單／counter 正確；修正後更新。顏色外另有文字／圖示 |
| permission／session | 401／403、登入逾時、帳號停用 | 友善雙語訊息及可執行下一步；不短暫顯示上一角色內容；不能將 403 當空資料或成功 |
| conflict／changed | 409、來源已改動、同時搶目標時段 | 明示班級／老師／時間衝突，最新檢查後才可送出；可返回修改，不假稱保存成功 |
| network／server | 離線、timeout、500、429；異常回應格式 | 有可靠通用錯誤與 retry；保留尚未保存輸入；不清空表單、不吐 stack、SQL 或私密資料；重試不再建立多份草稿 |
| empty | 無課／無下一堂／無待回應／無通知／篩選無結果 | 每個區域有正確原因及適合下一步；不可把空資料替換成假範例數字；零與尚未載入明確不同 |

- [ ] **STATE-01** 改日期、節次、班級來源或接課人後，前一版「沒有衝堂」立即失效；慢回應不能覆蓋新選擇。busy／disabled／missing list 隨最新資料一致。
- [ ] **STATE-02** 主要錯誤情境至少在 390 繁中與 1440 英文實跑；對話框、七欄缺漏及載入狀態補跑 768。六請求狀態在老師與行政詳情核對，學生僅核對實際允許狀態；不能為湊截圖打開未授權資料。

## 6. 對比、鍵盤、焦點與觸控

- [ ] **A11Y-01 文字對比** 一般可讀文字、placeholder、輔助與錯誤文案至少 4.5:1；符合大字定義者至少 3:1。大字約為 24 CSS px，或約 18.67px 粗體，不能把所有 18px 字視為大字。取實際 computed color、合成 opacity 與背景計算；測白面／暖白面、badge、green button 的所有可用狀態，不四捨五入補門檻。[W3C 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [ ] **A11Y-02 非文字對比** 必要的欄位邊界、checkbox／radio、資訊性 icon、選中指示、圖表／課程變更記號等，對相鄰色至少 3:1；裝飾分隔線不一律要求 3:1，但不能以低對比線作唯一可辨識欄位邊界。所有狀態有文字／圖示等額外線索。[W3C 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [ ] **A11Y-03 disabled** 真正 inactive 控件的 WCAG 對比例外不延伸到它旁邊的必填原因、可操作連結或整個表單。專案仍要求 disabled 文字可辨識，並以行為測試判定不可操作，不以 opacity 判定。
- [ ] **A11Y-04 focus** 所有可操作元素 Tab 可達且有清楚 `focus-visible`；本提案要求焦點指示與相鄰背景至少 3:1。逐一查看暖白／白／深色背景，焦點不能被 `overflow:hidden` 裁掉，也不能被 sticky header、底部 bar 或浮層遮住。[W3C 焦點不被遮蔽](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
- [ ] **A11Y-05 keyboard** Tab／Shift+Tab 順序隨視覺閱讀；Enter／Space 正常啟動；選單、tabs 與日期控件依實際語意提供鍵盤行為。沒有 positive tabindex、不可操作的 click-only div、鍵盤陷阱，且長課表不要求滑鼠才讀得完。
- [ ] **A11Y-06 modal／pane** modal 有可存取名稱、只在 modal 內循環焦點、背景 inert；關閉後回到觸發元件或合理替代位置，Escape 可退出非強制流程。非 modal pane 不硬加 focus trap，但開啟後能找到標題及返回。切角色／路由後焦點到合理主內容，不跳到已卸載元素。
- [ ] **A11Y-07 labels／announcements** 輸入有 visible label 與 programmatic association；required、錯誤與格式說明可讀，`aria-invalid` 正確。保存／失敗／待辦結果有適當 live announcement，不把整個課表掛 live region 導致重讀；螢幕閱讀器至少完成登入與學生勾選／老師缺漏修正兩段抽測。
- [ ] **A11Y-08 觸控目標** 依提案，390／768 的主要動作、底部導覽、icon button、日期箭頭、材料刪除與 checkbox 的可點 hit area 至少 `44×44 CSS px`，可透過 padding／label 擴大而不用放大圖示；相鄰目標不重疊。用 `getBoundingClientRect()`、實際 hit testing／觸控點擊檢查。這是本專案標準；WCAG 2.2 AA 2.5.8 為 24px 或間距等例外，不能把 44px 說成 AA 的唯一門檻。[W3C 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [ ] **A11Y-09 enlargement／modes** 200% 下仍可讀完、填完、關閉及回到原位。如介面提供大字／高對比／簡化學生模式，切換必須真的改變對應視覺或內容且不中斷功能；不是只 toggle 一個 class。深色模式同樣檢查實際色對、焦點與狀態，不因屬 P1 而跳過已顯示控件。

## 7. 動態、字體與資源

- [ ] **MOTION-01** panel／狀態／checkbox 的 transform／opacity 140–220ms 依核准方向作為專案選擇驗證；沒有循環 bounce、捲動綁架、反覆 reveal 或大量裝飾動畫。動態不延遲主要操作，不以動畫結束當 API 成功。
- [ ] **MOTION-02** emulated 與系統 `prefers-reduced-motion: reduce` 下重跑開／關詳細、換週、通知、checkbox、loading；移除非必要位移／縮放／滑動／smooth scroll，保留即時靜態回饋。不能只縮短時間卻保留大幅移動。此為核准提案要求；W3C 的互動動畫準則為 AAA，不宣稱它是 AA 一律要求。[W3C 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [ ] **FONT-01** 確認實際英文 Manrope、繁中 Noto Sans TC：`font-family`、載入請求、`document.fonts.check()` 加 DevTools rendered fonts 抽樣；混合文字的繁中字形不是缺字方框或不受控 fallback。依核准方向抽查正文 16px／行高 1.65–1.75、頁標題 28–36px、區段 20–24px、label 14px 與 400／500／600／700 字重；小 metadata 不能代替正文，繁中不能靠縮字擠進欄位。不是只在 CSS 寫名字。
- [ ] **FONT-02** cold cache＋行動網路節流與字體請求失敗各測一次：`font-display:swap` 或經核准等效策略使文字立即可讀，fallback 可填表及登入；字體換入不遮住按鈕、不清空輸入或使焦點內容跳出視野。記錄首屏可操作時間、字體總位元組及明顯 layout shift，不以本機暖快取宣稱行動效能。
- [ ] **FONT-03** Network 檢查只要求實際使用的字重／subset；沒有重複載入整套字體、不預載巨大的完整 CJK 檔案；若自託管或 Google Fonts 交付策略變更，記錄 URL／檔案與下載量，保留可讀 fallback。
- [ ] **RESOURCE-01** 建立實際使用素材清單：檔案／來源／版本或取得日期／授權／需保留 notice／是否修改。Manrope、Noto Sans CJK 對應 OFL，現有 Lucide 與既有 UI 原始碼依各自授權保留 notice；沒有因參考產品開源或看得到截圖就推定可複製。
- [ ] **RESOURCE-02** 登入 SVG／品牌圖像如出現須為原創或有可重製授權；未複製 Untis／Google／Cal／Linear／Todoist／Notion 的商標、截圖、插畫或原文作為自家資產。圖示同一風格，裝飾 SVG `aria-hidden`、有意義圖像有合適文字替代；外部資源無 404／CORS／console error。
- [ ] **RESOURCE-03** 元件庫不作硬性通過條件；沿用現有元件即可，但實際互動、語意、焦點及狀態仍逐項驗證。引入新字體／動態函式庫不得規避原本依賴、授權或效能審查。

## 8. 真實資料與功能回歸閘門

視覺改版不能改變權限、狀態機、API 契約或持久化。以下正常流程用真 API，每次必要 mutation 記錄 endpoint、結果、重新讀取／reload 後狀態，無須在公開報告曝光 cookie。

| ID | 必跑流程 | 通過條件 |
|---|---|---|
| REG-01 登入／角色 | 四 demo 入口、普通註冊、登入／reload／登出、忘記密碼與 profile | 真 session、原 role scope；舊密碼／舊 session／舊 recovery proof 按既有基準失效；沒有前端假切換 |
| REG-02 正向交接 | 原老師建立 move 與 substitute；缺欄位→草稿→補齊→送出→接課老師確認→學生詳細與勾選→行政列表 | 七欄及至少一教材強制；multiple links 保留；合法狀態、課表、通知、時間軸與統計一致；todo reload 後保存，另一位學生進度不受影響 |
| REG-03 退回 | Pending→Declined＋留言→原老師修改原請求→重送→確認 | 退回留言必填；修改保持同一 ID，無額外草稿；通知與新時間軸正確；busy／error 不吞掉輸入 |
| REG-04 競態／衝堂 | 班級與教師已有課；快改目標；連點 submit；兩請求競爭同一節次 | 最新衝突即時可見；不能送出；後端原有檢查不被 CSS／表單重構繞過；不重複占用 |
| REG-05 鎖定／補充 | Pending／Confirmed 的原交接內容；新增補充；Completed／Cancelled；取消後課表 | 已送出的原文鎖定；補充保留作者／時間與隱私；狀態合法，取消釋放／還原；時間軸顯示和 API 記錄相符 |
| REG-06 學生隱私 | 學生 list／detail／通知／timeline／supplement／error 的 raw response，以及 DOM／AX tree；如有公開卡片亦查 | 私密 teacherNotes、教師原因／留言／補充 marker 不出現在未授權 response；CSS hidden 不算保護。其他班級 ID／query 與 teacher/admin API 越權仍拒絕；登出→切角色→返回前頁／快取畫面也不殘留教師私密內容 |
| REG-07 通知／跨週 | 真事件產生通知；讀取單筆／全部；點跨週記錄；前一天提醒 | 正確 request ID／日期；未讀保存；來源不依賴當前週記憶體清單；提示與下一步符合事件，不顯示 raw code |
| REG-08 行政／reset | 組合篩選、風險、users；取消 reset 再確認 reset | 每項按鈕有真功能；self-disable 仍被擋；取消不送 mutation；確認只重設 demo，真實註冊保留；四 demo 入口可再登入 |
| REG-09 數據／可選功能 | 畫面上的 counts、風險、read/prepared receipts、impact；ICS／範本／dark／print 如提供 | 每個數據可追溯 API 與 fixture，零值不假造；可選功能只驗收已顯示／宣稱部分，不強迫未做 P1／P2；generic 範本不冒稱 AI |
| REG-10 來源一致 | 既有 core/API/E2E、type/lint/build、需要時 CSS／token 檢查；發布預覽同流程 | 原測試不被刪除／弱化；本機與 CI 對齊；最終截圖、測試、部署來源為同一完成版本，不以舊截圖遮掩新失敗 |

## 9. 交付紀錄與判定

- [ ] 設計核准版本及使用者確認時間有紀錄；沒有把等候時間當核准。
- [ ] 24 張正常矩陣圖及長繁中、缺漏、衝堂、手機浮層、busy／error、focus、reduced-motion、font fallback 的代表證據齊全；每張標版本、角色、語言、viewport、資料日期。
- [ ] 對比表列實際前景／背景／狀態／computed ratio，包含 text、non-text、focus；候選色票的預算對比數字只作參考，不取代渲染驗證。
- [ ] 完成必要回歸及 UI 行為；已顯示的 P1／P2 不留下假控件。所有失敗有重現步驟、影響、修正與復驗結果。
- [ ] 未驗證瀏覽器／真機、測不到的狀態、已知限制與 non-applicable 有原因；有嚴重溢出、不可完成的手機流程、缺字、鍵盤不可達、低對比主要內容、資料洩漏或失效主流程時不標整體通過。

**完成條件**：核准的設計方向落實，矩陣與適用狀態有證據，P0 與已宣稱功能回歸通過，已知範圍內沒有未處理的阻擋缺陷。這不構成零缺陷、全瀏覽器或完整 WCAG 認證宣稱。
