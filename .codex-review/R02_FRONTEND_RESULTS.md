# R02 前端複驗：尚未通過

核對版本：產品 commit `73d32c1`；根 HEAD `1f1fe77`。暖白 × 墨綠／Manrope + Noto Sans TC 方向已核准，這份報告是交回實作的複驗，不把核准方向當成完成證據。

範圍：唯讀核對 `components/handover/app.tsx`、`handover.css`、`lib/i18n.ts`、`lib/client-api.ts`、共享型別、相關 service 呈現與教材／字體資產；依 `ACCEPTANCE.md`、`CURSOR_REPAIR_R02.md`、`CURSOR_VISUAL_R02B.md`。未操作 Cursor／瀏覽器、未啟動服務、未跑安裝／產品 build／DB 操作。下列「瀏覽器已確認」僅引用根代理本輪回報；其餘明確區分靜態事實與待驗風險。

## 已修項目，勿再沿用 R01 缺陷描述

| R01／R02 要求 | 本輪靜態證據與判定 |
| --- | --- |
| 七欄完整性與送出 gate | `app.tsx:1454` 檢查六個文字欄位與有效教材；`1545` 安排完整性；`1851` 翻譯缺項；`1900` 未完整、checking、無有效報告或有衝突均 disabled。需實際負面流程復驗，但原「空表仍 enabled」程式問題已有修正。 |
| 變更安排自動查衝堂、忽略過期結果 | `1554–1607` 使用安排 key、300ms debounce 與 generation；report 必須匹配目前 key。失敗重試仍缺，見 R02-F05。 |
| create 成功、submit 失敗重試同一草稿 | `1613–1622` 保留新 ID，再次 save 使用 PATCH；原重複新建缺陷已有修正。 |
| 來源班級、合理目標預設、Editor 重置 | `1689` source option 有班級；`1638–1646` 同步日期／節次／教室；`1394` Editor 有 request/seed key。Detail 輸入隔離仍缺，見 R02-F03。 |
| 真 GET detail／跨週 | `157–189` GET detail 並轉 targetWeek；`1305–1307` 提供已 GET 的 focus fallback，404 有訊息、401 清 session。不是只 find 目前 workspace。通知與重載競爭仍待瀏覽器驗證。 |
| 學生私密原因 | UI `1988–1992` 只向非學生呈現原因，`2023` 避免呈現 teacherNotes；service `1033`、`1052–1053`、`1065`、`1068–1069` 排除 notes／原因／timeline comment／補充。根代理已確認學生畫面不顯示私密原因；原始 JSON 的各端點安全驗證由根代理 API 報告判定。 |
| 學生待辦保存 | API `2045` 呼叫真正 todo endpoint；根代理已確認勾選後 reload 保留。不能重列為假保存。 |
| Admin 組合篩選 | `1289–1303` 同時套用 query/status/date/class/teacher，`1347–1377` 已提供班級與老師控件。本週調課數仍未展示。 |
| 正常課堂 no-op、狀態圖示、接課清單 | `1038–1047` 正常課堂改為內容與有作用的老師建立入口；`989–1008` 狀態 icon；`911–924`、`1229–1250` 呈現待回應列表；`945–968` 學生 ThisWeek 摘要。 |
| 已露出 P1/P2 的部分修正 | 高對比 selector `handover.css:94` 已匹配 true；admin nav `app.tsx:273` 不再被 simple 隱藏；view receipt `1945` 有真 POST；ICS `100` 帶選定 week、`1127` 有下載 catch；template `1657` 改成本地真檔案。仍有殘缺，見 R02-F08。 |
| 核准視覺方向 | CSS tokens／font-face／紙面與主綠已落地；teacher-board 桌機主週表＋側清單，學生下一堂與行政 ledger 已有結構。原藍色按鈕文字 specificity 問題不再原樣存在。所有模式／狀態對比與實際字型仍不能宣稱全過。 |

## 剩餘確定缺陷與最小驗收

### R02-F01 — 高：繁中段落寬度套到所有 layout，桌機縮在左側（瀏覽器已確認）

位置：[handover.css:148](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/handover.css:148)。`.handover-root :lang(zh)` 匹配繼承繁中語言的所有子元素，包含 `.shell`、`.main`，全部被 `max-width:38em` 約束。根代理在 1440px 實測：EN shell/main 為 1440/1220px，繁中成為 608/388px。

最小修正／驗收：把行長限制縮到段落或明確文字容器，保留 layout 的完整可用寬度；三角色與登入在 390/768/1440px 切 EN/繁中，量測 shell/main、不產生整頁橫向溢出，長繁中文字仍合理換行。

### R02-F02 — 高：學生下一堂混入不同課堂的教師與準備提醒（瀏覽器已確認）

位置：[app.tsx:842](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:842)。`next` 是第一筆 Confirmed request（842–845）；`nextLesson` 則獨立排序未來 lessons（846–850）。883–889 沒有比對 lessonId/requestId，直接把 `next` 的老師、教室與提醒放在 `nextLesson` 下。根代理看到 Monday 2026-10-05 P1 Math/Maya，卻混入 Friday 2026-10-09 P4 的 Maya→Jonah 提醒；Open handover 也開 Friday 的資料。

最小修正／驗收：下一堂資訊只能關聯該 lesson 的交接；沒有異動時不顯示另一堂的異動資訊。若保留其他近期交接，獨立標出實際日期／節次。以一堂正常近期課＋較晚 confirmed 交接重現，核對顯示、按鈕目的地與 API ID 完全一致。

### R02-F03 — 高：切不同詳情會沿用上一筆私密留言／補充

位置：[app.tsx:1440](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1440)。Detail 沒有 request key；`comment`、`supplement`、`error` 在1937–1939只初始化一次；request 變更的 effect（1940–1946）只 focus／view。切清單另筆 request 時同一 Detail component 存活，2105／2117／2145把留下的輸入送往新 request。Editor key 已修，不能把它推廣成 Detail 已修。

最小修正／驗收：依 request ID 隔離／重置詳情輸入和 error。老師 A 詳情輸入獨特 PRIVATE 標記但不送出，切 B，B 欄位與送出的 payload 不含 A 內容；再切回 A，依明確的草稿策略處理。

### R02-F04 — 高：多個 API 操作仍無 catch／busy／重試，401 與成功回饋也不一致

代表位置：[app.tsx:2307](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:2307)。API wrapper 只 throw ApiError（`lib/client-api.ts:29`），未集中處理 session；下列 handler 本身也未處理。

| 路徑 | 現有程式事實 |
| --- | --- |
| 登出 | `315–324` await 沒 catch／busy；失敗留原登入畫面且沒有錯誤。 |
| 全部通知已讀、單筆通知 | `2220–2223` 沒 catch／busy；單筆 `2235` 把錯誤送入綠色成功 notice（364–367），finally 又開詳情／重載，錯誤會被清掉。 |
| 個資、示範重設 | `2307–2324`、`2389–2393` 沒 catch／busy；重設雖有 RESET DEMO gate，但請求期間仍可重按。 |
| 人員／Audit 載入 | `2413–2416`、`2495–2498` 沒 catch、沒有 loading/retry；載入失敗維持空資料，Audit 顯示 noActivity。 |
| 啟停使用者 | `2459–2469` mutation 與第二次 GET 都沒 catch／busy。 |
| 詳情回覆／補充／完成／取消／todo | `1947–1960` 有局部 catch，沒有 busy 鎖；`2099`、`2111`、`2140`、`2156`、`2171` 未 disabled。401 只顯錯，不會像 load/openRequest 清 session。view `1945` fire-and-forget 無 catch。 |
| Impact | `2533–2550` 有 catch，但沒有 retry入口，且所有 HTTP error 都稱 networkError、401不清session；同一component收到新week時也沒有重置failed。 |
| 初次 workspace 載入失敗 | `245–262` 在 workspace 為 null 時直接 return AuthScreen，未把 load 所設 error 傳入，登入成功後首個 workspace 500 的全域錯誤／retry不會呈現。 |
| 成功回饋 | refresh `234–236` 立即 `setMessage("")`；save `1623–1625`、act `1951–1952`、通知／profile／reset 都先設成功再呼叫該 refresh，同批回饋被清除。 |

最小驗收：每個已露出 API 操作各做一次500／offline、401與成功；失敗可見且可重試，保存合理未存內容、401回登入；阻止忙碌期間重複 mutation；成功訊息可見／可由 screen reader 收到，console 無 unhandled rejection。Profile／reset／users／Audit不可略過。

### R02-F05 — 中：衝堂請求失敗後，當前安排沒有可操作的重試

位置：[app.tsx:1586](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1586)。catch 把 failedKey 設為目前 key，checking 變 false，但 report 仍 null；送出被 `1905 !report` 鎖住。effect 只隨欄位／語言等依賴變化，畫面沒有同一安排的 Retry control。catch 不區分401/403/validation，而且成功重查未清除先前 error。

最小驗收：完整安排首次 conflicts500後，直接按明確重試、保持原欄位，後續200恢復正確可送狀態且舊錯誤消失；401回登入、403顯權限錯誤；快速變更欄位仍忽略舊結果。

### R02-F06 — 中：通知／風險／時間軸／Audit系統字串與時間未完整雙語，未讀提示也未補

位置：[app.tsx:2080](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:2080)。timeline直接呈現 action＋ISO at；通知直接呈現 title／createdAt（2242–2244）；admin risk直接呈現英文 server message（980；service1907/1914）；Audit直接呈現 action/detail/at（2508–2510）。API fields 在1678直接 join；取消固定寫入英文系統 comment（2178），availableSlots 1881 固定用P。通知 item 沒有未讀文字／dot／aria標記，只有已讀後的 read suffix；nav 未讀數不能取代每筆狀態。

根代理已實際看到繁中 timeline 的 UTC ISO、created/submitted/confirmed。Seed 若視為示範 actor 名稱可保留英文，不把老師自寫內容／姓名列為翻譯缺陷；系統 action 和格式仍需翻譯。

最小驗收：EN/繁中檢查 created/submitted/confirmed/declined/completed/cancelled、提醒與風險、Audit及缺欄錯誤；採易讀本地時區日期。每筆通知的已讀／未讀可視與可存取，切語言後系統文案同步，私密留言不混入學生通知。

### R02-F07 — 中：本週調課統計仍未展示

位置：[app.tsx:893](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:893)。ledger只呈現 lessons.length、pending、declined、confirmed（893–909）。全app未引用 `stats.weekly`；共享型別110與service1887–1892仍提供真本週數，R02明確要求展示。

最小驗收：Admin 顯示明確「本週調課」及目前週次，數值取正確stats.weekly，跨週前後與真正API結果一致；不要把本週課堂數當調課數。

### R02-F08 — 中：已露出簡易模式／範本仍未符合承諾，seed教材仍placeholder

位置：[app.tsx:2362](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:2362)。simple checkbox真正保存偏好，但只寫 root data-simple（282），CSS與student render都沒有使用，切換不改任何內容。原「simple隱藏admin導航」已修，不重列。

template（1648–1664）只是替換科目名稱的同一段英文，不看 language／科目差異；現有本地教材 `public/worksheets/class-practice.txt` 確實存在，不能再說範本連結是假example.org。另一筆seed教材則仍在 [service.ts:570](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:570) 寫 `https://example.org/worksheet`，根代理也在實際畫面看到該連結。

最小驗收：簡易模式／科目範本做到明確的真差異或移除入口；所有demo可見教材指向實際可讀教材。移除／替換seed stub時要處理既有demo資料，不能只改範本產生器。

### R02-F09 — 中：深色已露出按鈕的靜態顏色配對低於門檻，需computed複驗

位置：[handover.css:272](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/handover.css:272)。dark .btn 文字`#10221c`，active沿用green-2 `#143f34`（26、278–279），簡單固色比約1.41:1。warn規則299–300保留白字，dark danger-fg82為`#ffb4a8`，比約1.70:1；dark＋高對比120為`#ffd0c8`，白字約1.39:1。這是明確CSS配對與公式計算，尚未宣稱瀏覽器實際computed結果／整頁WCAG判定。

最小驗收：light/dark/contrast組合各檢查normal/hover/active/focus/error按鈕computed foreground/background，enabled一般文字≥4.5:1，focus／必要非文字控件≥3:1；gradient、opacity或複合背景人工判定。Disabled文字不當WCAG失敗，44px專案觸控gate仍適用。

## 根代理待完成的瀏覽器／DOM驗證

- **跨週競爭風險**：openRequest169–172發新週load；通知finally2237–2238同時發onReload（舊render閉包的week），load192–221沒有generation／AbortController。需延遲並逆序返回舊／新workspace，確認週次、畫面與GETdetail不混用；目前是程式風險，沒有宣稱已重現。
- **44px與focus**：checkbox本體253–258約18px，label231–236沒有min-height；必須量測真正可點label各fragment，不把整列空白假算觸控面積。Profile與學生todo為優先；keyboard focus不能被sticky bottom-nav遮住，切detail後返回需有合理焦點。
- **390/768/1440 三角色／登入 × EN/繁中**：Sidebar手機仍wrap全部nav（323–339）並另有bottom-nav（485–503），需實際核對內容順序／表單可讀性／長繁中／鍵盤；不憑靜態寬度宣稱手機通過。Editor是inline form（1667），不假稱已測modal。
- **字型／授權／fallback**：CSS1–17自帶woff2與swap；Manrope/Noto notices及CREDITS3–6存在。Noto為小subset，需DOM fonts狀態與實際繁中字形／長姓名／子集外字的fallback驗證，不靠font-family字串宣稱每個字都由Noto Sans TC渲染。未驗證完整CJK coverage，不能只因notice檔名含sc便宣稱字形錯誤。
- **動態與真資料**：CSS589–602只在no-preference啟用transition／位移，需reduced-motion與慢網路實測；保留真課表、通知、狀態、回執及待辦資料，週末empty與取消通知需要正反流程。
- **工具**：review-owned `dom-visual-probe.js`為唯讀診斷函式，可嵌入CUA evaluate；會輸出短label、可見控制rect、solid色比候選、overflow、fonts與focus資訊，疑難背景標manual，不等同產品E2E或全頁AA證明。

## 本輪完成的驗證

唯讀程式／需求逐項比對、可見handler和API呼叫檢視、44px／色彩／語言selector靜態檢查、教材資產存在與字體notice檢查；自己的DOM probe已做syntax與10項隔離mock檢查。沒有重跑產品lint/types/tests/build，沒有將根代理其他測試結果推廣為前端全通。只新增本report，不修改產品檔案。

結論：目前仍有已知未修P0互動與核准視覺要求缺陷，不能標前端驗收完成。優先F01/F02/F03/F04，接續F05/F06/F07及已露出入口／模式；修正後依VISUAL_ACCEPTANCE與實際API／瀏覽器結果復驗。
