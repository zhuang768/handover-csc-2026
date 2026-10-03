# Handover 教育與排程產品參考

研究日期：2026-10-03。範圍：Untis／WebUntis、Google Classroom、Cal.com。只研究官方公開產品資料；未登入帳號、未改產品程式、未操作 Cursor。新視覺實作須等使用者核准整合設計提案。

## 證據程度

- **官方文件可確認**：下列操作、資訊組織與狀態用途由官方文件明示。
- **靜態畫面待像素復核**：已找到官方介面圖片／教材，但此研究代理的 Web 工具只回傳圖片參考，CUA 的 iab／Chrome surface 不可用；Safari 正由使用者使用，因此停止原生操作。沒有把尚未看到的色票、字體、陰影、動畫或手機斷點寫成實測事實。
- **Handover 設計推論**：適用性與建議是根據 Handover 的老師、學生、行政三種任務判斷，並非原產品的效能或可用性結論。

主代理另有可用的 CUA 瀏覽器；如果主代理補完成畫面檢視，可在整合提案中提升相應證據程度。本檔案不宣稱已完成這些產品的完整操作驗收。

## 1. Untis／WebUntis：校園週課表與變更辨識

官方來源：

- [新課表導覽及色彩說明](https://help.untis.at/hc/en-150/articles/18231094538396-Navigation-and-Color-Scheme-in-the-New-Timetable-View)
- [代課顯示](https://help.untis.at/hc/en-150/articles/18231765445148-Display-of-Substitutions)
- [每日及每週總覽](https://help.untis.at/hc/en-150/articles/21175434824604-Daily-and-Weekly-Overviews-in-WebUntis)
- [新課表官方介面圖片](https://help.untis.at/hc/article_attachments/22255697940764)

**文件可確認的版面及操作**：課表上方放目前週次與前後箭頭；點週次開日期選擇器。左上方選班級／老師，並可切換前後對象。下方控制哪些變更課程、考試、取消課程等項目顯示；選單可增加小圖示。每日總覽把多個班級、老師或教室並排，比較空堂與占用；每週總覽以有內容、空白、虛線格區別上課、空堂、假期。[導覽說明](https://help.untis.at/hc/en-150/articles/18231094538396-Navigation-and-Color-Scheme-in-the-New-Timetable-View)、[總覽說明](https://help.untis.at/hc/en-150/articles/21175434824604-Daily-and-Weekly-Overviews-in-WebUntis)

**文件可確認的狀態語意**：代課保留原老師與接課老師，原老師以虛線框表示未授課；連科目都換了時，原課程標取消、新課程標變更。[代課說明](https://help.untis.at/hc/en-150/articles/18231765445148-Display-of-Substitutions)

**色彩／字體／動態**：文件證實顏色與附加圖示用於課程類型，但本代理未看到圖片像素，不能核定實際配色、字級或字型；沒有播放或操作動畫。Handover 不應照抄未驗證色票。

**適合 Handover 的推論**：

- 老師：週次始終可見，日期／節次／班級／教室保持固定順序；變更課程保留「原課 → 新課」對照與接課老師，減少讀錯課程的機會。
- 學生：只呈現自己的班級；課程狀態用圖示、文字及邊框共同表達，先說清楚「何時、哪裡、要帶什麼」。
- 行政：借用並排資源總覽及「由總覽進入詳細課表」的層級，不把全部教師課表塞進初始首頁。

**不適合直接移植**：密集多資源矩陣不適合 390px 手機或學生首頁；虛線若沒有明確文字，會混淆「原課已改」、「假期」及「草稿」。Handover 必須保留各自不同的狀態名稱。

## 2. Google Classroom：作業內容、教材與對象分組

官方來源：

- [Classroom 現行官方產品頁](https://edu.google.com/workspace-for-education/products/classroom/)
- [Google Classroom 教師使用指南，2023-10 更新](https://services.google.com/fh/files/misc/google_classroom_user_guide.pdf)
- [作業詳細資料及教材，PDF 第 11 頁](https://services.google.com/fh/files/misc/google_classroom_user_guide.pdf#page=11)
- [立即發布／排程／草稿，PDF 第 13 頁](https://services.google.com/fh/files/misc/google_classroom_user_guide.pdf#page=13)

**文件可確認的版面及操作**：先進入班級的 Classwork，再建立作業。內容包含標題與指示，另設班級／學生對象、期限、主題等資料；教材有獨立新增入口。發布操作區分立即發布、排程及儲存草稿，草稿可回到 Classwork 編輯。這是 2023 教材的行為證據，不宣稱為 2026 全部介面的現況。[官方教師指南](https://services.google.com/fh/files/misc/google_classroom_user_guide.pdf)

**色彩／字體／動態**：未完成教材截圖的像素檢視，因此不能核定目前產品是否使用特定藍色、字體或欄寬。現行產品頁有介面媒體，但首批圖涉及 AI 編輯器；沒有把 AI 行銷畫面當成 Handover 核心表單。未測動畫。

**適合 Handover 的推論**：

- 老師：交接表單把「課程與對象」、「教學內容」、「教材與提醒」分組；教材 URL 清單有獨立的新增／刪除操作。儲存草稿和送出邀請是清楚的兩個動作，送出前列出缺漏。
- 學生：交接內容依上課準備、教材、作業及勾選待辦閱讀；不要呈現老師協作備註或行政稽核紀錄。
- 行政：可借用「同一實體的內容／人員／追蹤」分頁概念；行政篩選仍應依日期、班級、教師、狀態設計。

**不適合直接移植**：班級封面與大型卡片不應占用 Handover 課表的主要空間；Classroom 的評分、原創性及 AI 功能不屬於這次視覺改版範圍。手機不能單純縮窄桌面側欄表單，應讓全部必填欄位與送出區可順序閱讀。

## 3. Cal.com：待確認事項、狀態篩選與週時間分布

官方來源：

- [Bookings dashboard 官方導覽，2025-02-19](https://cal.com/blog/a-complete-walkthrough-of-cal-com-s-booking-dashboard-its-key-features)
- [2026.2 新 Bookings 日曆及詳細頁更新](https://cal.com/blog/calcom-v6-2)
- [2026.2 官方產品圖片](https://framerusercontent.com/images/rzsoTgTN0p5A21efQ9JftAMKI.png?height=866&width=2048)
- [Cal Sans 官方字體說明](https://cal.com/font)

**文件可確認的版面及操作**：左側導覽進入 Bookings；上方依 upcoming、unconfirmed、recurring、past、canceled 分組，右側有 Filters，可依人員、事件與日期找資料。Unconfirmed 是待本人確認的事項，與已確認未發生的 Upcoming 分開。[官方導覽](https://cal.com/blog/a-complete-walkthrough-of-cal-com-s-booking-dashboard-its-key-features)

**文件可確認的演進**：2026.2 官方更新加入日曆瀏覽，目的為看一週分布與空隙；當時仍需在 Features 開啟，並說明詳細頁及 history log 持續更新。此頁不能證明今天每個帳號預設都顯示相同版面。[官方更新](https://cal.com/blog/calcom-v6-2)

**色彩／字體／動態**：此代理尚未完成產品圖片像素檢視。官方另公開 Cal Sans 字體系統，區分標題、本文及小尺寸功能文字，並說明 Text 為 14px／16px 最佳化；這只能證明官方字體產品與原則，不能據此斷言所有 Bookings UI 的 computed font。[官方字體說明](https://cal.com/font) 未實測任何動畫。

**適合 Handover 的推論**：

- 老師：收件匣先顯示「需要我回應」的 Pending；已接受、已完成、已取消是其他狀態分組。每列清楚顯示時間、班級、邀請人、交接摘要，再進入詳情。
- 學生：借用已確認未發生事項的日期排序，但不顯示邀請審批操作。
- 行政：借用狀態分組加組合篩選的組織方式；列表與週課表互補，列表適合查單一請求，課表適合查衝突。

**不適合直接移植**：公開訂位頁的選時間流程不等同校園固定節次；商業排程的多人輪派、付款、路由規則不能變成這次新增功能。小字密集的預約列也不能直接帶入繁中手機畫面。

## 給整合設計提案的決策

以下為設計建議，須使用者核准後才可實作：

1. 結構優先借 WebUntis 的週／課程定位、Classroom 的內容分組、Cal.com 的待確認佇列；不以三個品牌色拼貼。
2. 首頁依角色選任務：老師的今日課程與待接課、學生的下一堂與待辦、行政的待處理與衝突。保留一致的資訊順序與狀態標籤。
3. 同一套狀態元件分別呈現 Draft、Pending、Accepted、Declined、Completed、Cancelled；「課程已變更」另有狀態，不混成請求的 Accepted。
4. 中文長字串、空資料、錯誤、載入、焦點、disabled 都列入視覺交付，不能只交正常英文畫面。
5. 字體選型須同時驗證英文與繁中、日期及節次數字；可採主代理提出的 Manrope＋Noto Sans TC 概念，但這是 Handover 自己的設計選擇，不是本研究驗證的原產品字體。
6. 1440px 做週課表＋待回應列表；768px 減欄位而保持資料順序；390px 優先日程列表與單欄表單，完整週課表可切換或橫向閱讀。這是改版提案，尚未經 Handover 實測。

已使用 [design-system skill](/Users/zhuangzijin/.agents/skills/design-system/SKILL.md) 的三層 token 與狀態定義原則：將品牌主色與請求狀態色分開，並預留 keyboard focus、busy、錯誤、無資料及深色模式的語意 token。研究沒有執行 skill 的產碼腳本或改任何 CSS。
