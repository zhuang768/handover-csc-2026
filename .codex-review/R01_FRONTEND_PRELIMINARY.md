# R01 前端需求審查：初步，完成後復驗

日期：2026-10-03（台灣時間）。Cursor 已標示 ready_for_review 並停止產品編輯。本文件仍是初步靜態審查，等待根代理的瀏覽器及 API 獨立復驗，不是最終驗收報告。

穩定來源復核：根工作目錄 HEAD `111f16a17381679aba20499807b9f6cd7b306cfc`；下列三個前端 SHA-256 與施工中快照完全一致，已重新比對關鍵行。讀取 `.codex-review/ACCEPTANCE.md` 與原始附件要求後，僅將明確 P0 門檻列為阻擋；可見 P1/P2 問題另列為移除或修正入口。

本輪未啟動伺服器、未安裝、未建置、未操作 Cursor、未讀寫本機 DB、未修改產品程式碼。根代理回報的 build exit 0 不代表下列互動已通過。server 的 GET mutation 問題由根代理另案追蹤，此處不重複列為前端發現。

審查基準：使用者附件的 P0 1–9、docs/API_CONTRACT.md、shared/types.ts、目前 components/handover/app.tsx 與 handover.css、lib/client-api.ts 與 lib/i18n.ts。已顯示的 P1/P2 入口也檢查是否真正有作用，但不要求尚未宣稱的 P1/P2 現在全部實作。

前端來源快照 SHA-256：

- app.tsx（2079 行）：0554a09e2cde9a2c8332769a00e8c41050d9b2fc800425579c7ed907e1f3ca27
- handover.css（372 行）：477102eb5516024ff26d0b45d7333090cc7b6db1443572fdef6e64ca9023d1ef
- lib/i18n.ts（577 行）：ca3bcc55eaad3f84c2666e9347f687fa2ba6fab9a9ad2b9a9cf5a30531217874

下文 app 行號均指 `/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx`。Cursor 後續更新可能使行號改變，完成後須核對最新檔案。

## 初步發現

### R01-01 [HAND-01、UX-04] 阻擋 P0：送出交接未實作必填 gate

[app.tsx:1436](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1436) 的送出是永遠可點的 `type="button"`，沒有 disabled、完整性計算或送出前缺項清單；六個交接 textarea／教材 input 也未提供 required。`missing` 只在 API 失敗後由 caught.fields 設定（1192–1196），1230 前的錯誤區直接印原始 key。

結果：空表單仍能發出 create＋submit，與「欄位未齊時不可送出且顯示缺項」不符。後端拒絕不能取代此 P0 UI 要求。save(true) 亦繞過日期／節次等原生 form validation。

復驗：逐一清空七欄、改成純空格、清空唯一教材、移除標題／URL，送出保持停用且缺項文字即時更新；仍可保存未完成的交接草稿。

### R01-02 [REQ-02、UX-04] 阻擋 P0：衝堂只手動檢查，結果會過期

[app.tsx:1174](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1174) 的 check() 只由1398的按鈕觸發，未監聽來源、kind、targetDate、targetPeriod、targetRoom、recipientId。修改欄位後 report 不清空；無 loading、catch、取消前一次查詢或阻止舊回應覆蓋新結果。按鈕文字永遠是「Checking…／檢查可用時段…」，不代表真的正在查。

結果：不符合即時衝堂檢查；上一個時段的「可用」可能留在新時段。availableSlots／candidates 只是文字，未提供快速選擇操作；列出空堂本身已部分實作，不將「不能點」單獨算 P0 阻擋。

復驗：改目標即重查、等待期間不可送、錯誤可重試；人工延遲前一次 response，最新選擇才可決定結果。

### R01-03 [NOTIF-02、UX-05] 阻擋 P0：通知／交接開啟依賴當週資料，缺少真正 detail fetch

[app.tsx:999](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:999) 只以 workspace.requests.find(selected) 決定詳情，整個 UI 沒呼叫 GET `/api/requests/:id`。通知1745–1748只是 setSelected/onOpen；server 的通知查詢不限制週次（server/service.ts:1626），但學生 requests 限當週（1573–1584）。

結果：較舊週的通知、已取消而退出學生清單的通知、被週次排除的 request ID 可以標已讀並切到清單，卻沒有對應詳情／明確失效說明。開啟詳情還排在所有清單之後（1096），沒有焦點或捲動，手機可能看不出有開啟。

復驗：在另一週建立並確認／取消，再從通知點擊；應載入對應詳情或清楚的無權／已取消訊息，並將焦點移到詳情。

### R01-04 [ACL-02、STUD-01] 阻擋 P0／隱私：學生仍看到私人請假原因

[app.tsx:1505](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1505) 無角色判斷顯示 request.reason。靜態讀取 server/service.ts 的 presentRequest：teacherNotes 被刪（1047）、學生 timeline.comment 被清（1079）、supplements 被剔除（1082），但 reasonCategory／reason 仍直接回傳（1066–1067）。

結果：原教師若在就醫／請假原因輸入私人資訊，學生 raw JSON 與畫面都收到。使用者要求學生看到教材／作業小考／提醒等學生可見部分，不能把完整教師原因視為學生公開內容。

復驗：教師原因與 notes 放獨特 PRIVATE 標記；學生 workspace、detail、notification 原始回應及畫面不得有該標記，教師仍可讀。亦複驗退回留言與補充的安全過濾。

### R01-05 [ADMIN-01] 阻擋 P0：教務處交接清單缺少班級／教師篩選與本週異動數

[app.tsx:987](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:987) 只有 query／status／date。Requests 的 filter 控制只有搜尋、狀態、日期，未有班級、教師選項。Timetable 的班級／教師選項只改 workspace lessons；server requests 查詢沒有套 classFilter／teacherFilter（server/service.ts:1573–1584），所以不能當作交接列表篩選。

Overview 733–749 顯示 lessons.length、pending、declined、confirmed，沒有 workspace.stats.weekly 對應「本週調課數」。

復驗：日期＋班級＋教師＋狀態＋搜尋可組合，清單與本週統計一致；待確認／退回可包含其他週的課務，但不能直接混算本週異動。

### R01-06 [AUTH-01、REQ-03、UX-04] 阻擋 P0 品質：大量 API 操作沒有錯誤／忙碌處理

[app.tsx:1732](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1732) 通知標已讀、1745點通知、1816存個資、1898重設demo、1968啟停用、250登出與1174衝堂都沒有 try/catch。Users1922／Audit2004／Impact2040 的讀取只有 then，失敗會無提示或永久loading。auth/demo 655–679 未 disabled={busy}，Editor save 與 Detail act 也無 busy gate。

結果：401／403／422／500 或離線可能只在 console 出現、沒有可重試提示；快速重複點擊會同時變更資料。原教師 new request 的 create 成功後 submit 失敗（1181–1188）未留 saved request ID，再按會新建另一份草稿。

成功提示也會立即被 onReload=refresh 清掉（174–176），因為各 mutation 先 onMessage 再 onReload；React 批次更新可能讓成功訊息根本不顯示。

另外頂層 load 的401不清 session（152），初次workspace失敗仍走 AuthScreen且不顯示頂層error（185）。新登入成功但workspace失敗時看起來像登入沒成功。

復驗：各控制攔截401／403／409／422／500與離線，UI提供正確訊息、保存輸入、不假稱成功、可重試；一次操作只有一次mutation，submit失敗後重試沿用已保存草稿。

### R01-07 [UX-01] 阻擋 P0 雙語：錯誤與系統事件仍直接顯示英文

[app.tsx:1195](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1195) 與1474固定 errorText("en", code)；1226直接印 fields key；1592直接印 timeline.action；1751直接印 notification.title；778直接印risk.message；2017直接印audit.action。這些多為系統產生的英文，不是允許保留英文的姓名／科目／教材seed內容。

例：server 1536固定 `Class change tomorrow`，1654固定 `is still unconfirmed`。語言按鈕標籤246／514也寫死在元件，未集中i18n。已存在 document.lang 切換（75／82），不要再誤報缺少語言標籤更新。

復驗：繁中下觸發validation／conflict／權限錯誤，開通知、風險、時間軸；所有系統名稱與錯誤欄位為繁中，ARIA標籤同樣更新。

### R01-08 [UX-03] 阻擋 P0 對比：主要按鈕文字被更高 specificity 覆寫

[handover.css:62](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/handover.css:62) 的 `.handover-root button { color: inherit }` specificity高於150–155的 `.btn { color: #fff }`。淺色主按鈕因此預期繼承 --ink=#122033，背景 --cobalt=#1d4ed8；demo secondary背景=#16345c。

只根據CSS色值與WCAG公式靜態計算，對比約2.45:1／1.31:1，低於一般文字4.5:1。未使用瀏覽器 getComputedStyle，完成後需實測確認，而非只靠這個預估宣稱驗收失敗或通過。

復驗：390／768／1440下computed color、contrast、焦點樣式與disabled樣式；深色狀態badge亦須檢查。

### R01-09 [REQ-01、UX-04] P0 流程風險：來源課堂辨識、編輯狀態與開啟位置不足

[app.tsx:1233](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1233) 只改lessonId，targetDate／period／room仍是舊來源課堂的useState初值。來源option1237沒有className，教師同一科在多班授課時無法由選項辨識班級。fallback choices1127允許任何有originalDate的lesson，不完全等同自己可編辑的来源。

Editor沒有key（1054），state不隨existing改變重設；編辑中再點「New handover」會改變existing但保留先前內容，可能把舊交接作為新草稿。Detail也無key，先前輸入的comment／supplement可能留到另一張交接。

復驗：切換來源後顯示明確日期／節次／班級，代課默認目標跟新来源一致；從編辑→新建或A詳情→B詳情，不能沿用未經用戶確認的私密留言。

### R01-10 [UX-05；可見 P1/P2] 無作用／不完整的額外功能

- [app.tsx:800](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:800)：所有正常課堂亦渲染可點button，沒有requestId時handler什麼都不做。應正常顯示內容／開詳情／提供建立交接，或不呈現成可操作按鈕。
- [app.tsx:1572](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1572)：回條顯示viewedCount，但UI沒有任何 `/api/requests/:id/view` 呼叫；學生真的閱讀不會增加。這是可見P1入口未接完整，不要求新做未顯示P1。
- [app.tsx:1199](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1199)：範本按鈕對每科填同一段英文與example.org教材URL，並自動把七欄填滿。可移除或改為清楚可編的有效起點，不能讓假教材自動通過交接要求。
- [app.tsx:216](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:216) 寫data-contrast="true"，CSS43／51只比對"high"，高對比開關不改樣式。
- simple開關只寫data-simple（217），CSS沒有對應selector；student界面沒有簡化，反而208會因為全域prefs.simple讓下次登入admin隱藏管理導航。可移除該P2入口或真正接好。
- downloadCalendar86–95遇非200靜默return，沒有下載失敗訊息；這是可見P1功能品質，未要求做訂閱。

### R01-11 [SCHED-02、STATE-02、STUD-01] 明確的角色下一步與異動標記尚缺

[app.tsx:806](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:806) 的異動標記只有色彩和文字，沒有原要求的圖示。Overview704計算incoming，但只取incoming[0]作為單一「下一步」；Requests990未有recipient／「待我確認」分組，無法直接看到與本人相關的完整待確認清單。學生Overview751–766只列今日課堂，沒有每堂學生待辦摘要；本週課表在另一個導覽頁，首頁沒有Today／This Week切換。

復驗：異動格包含文字＋圖示＋色彩；教師有「待我確認」且只列recipientId=本人、status=Pending的清單；學生首頁提供清楚的Today／This Week入口及每堂異動的「帶什麼／交什麼／提醒」摘要，可開啟並保存待辦。不得以只存在明細頁或單一任務按鈕代替原需求。

## P0 逐條核對

| 原需求 | 靜態已有 | 初步缺口／待復驗 |
|---|---|---|
| 1 帳號／角色 | Email密碼、兩類註冊、邀請碼、復原、四個真demo API、個資PATCH、登出POST、me初始化 | session失效處理、個資／登出錯誤、busy、註冊後保存復原碼的完成狀態；不同帳號越權須runtime驗 |
| 2 課表 | 當週API、前後週、五天、teacher/student/admin角色、異動色與文字、admin課表filters | 異動沒有圖示；正常lesson是假可點；390/768布局與日期／空態待驗 |
| 3 建立申請 | 來源選擇、move/substitute、原因select＋文字、conflicts API | R01-02即時檢查；來源未顯示班級；切來源後目標未同步 |
| 4 強制交接 | 六個文字欄＋materials、草稿POST/PATCH、送出POST、補充POST | R01-01 gate/缺項；重試可能重建draft；送出後鎖定由canEdit＋server共同驗 |
| 5 接課確認 | Pending指定recipient按鈕、接受／退回API、可改Declined、timeline、Completed／Cancelled | 退回空留言無前端disabled／busy；timeline系統字串未翻；跨角色完整流程待驗 |
| 6 學生檢視 | Overview Today、Timetable週／日、原/新教師時間教室、待辦POST | 安全原因洩漏R01-04；Today首頁只展示課堂，不直接列每堂待辦；待辦保存與跨學生隔離待驗 |
| 7 通知中心 | 未讀數、標單筆／全部已讀POST、onOpen跳轉 | 無未讀紅點（只有文字count）；跨週詳情R01-03；事件／前一天提醒runtime驗；API失敗處理不足 |
| 8 教務處總覽 | pending／declined／confirmed統計、風險、日期／status／文字搜尋 | R01-05缺班級／教師交接filters與本週異動統計 |
| 9 品質 | 手機優先CSS、768/1100breakpoint、label包覆輸入、focus-visible、empty/loading/部分error、EN/ZH、admin reset確認文字 | 錯誤/busy缺失、對比覆寫、系統字串未翻；表單長頁非modal，需實測；seed/runtime reset須另驗 |

上表「靜態已有」只表示程式中存在對應接線，不表示功能已通過。

## 所有可見按鈕／API 方法盤點

下表涵蓋app.tsx目前所有41個button宣告位置（map可產生多個實際按鈕），沒有單靠按鈕名稱推定它已可用。

| 位置 | 可見控制 | handler／真正請求 | 初步結果 |
|---|---|---|---|
| 227、387 | 側欄／手機導航 | setView；側欄另setEditing(false) | 有作用；手機導航未清editing；需焦點與返回情境驗 |
| 240、509 | 語言 | setLanguage→localStorage偏好＋html.lang | 真偏好，不是角色假切換；標籤字串需集中 |
| 248 | 登出 | POST /api/auth/logout（body={}） | 接真API；無catch/busy |
| 274、285 | 重新整理／重試 | load→GET /api/workspace | 接真API；401處理待修 |
| 631 | 登入／註冊／復原Continue | POST /api/auth/login、register、reset | 有catch/busy；註冊成功後只shownCode、需復驗完成流程 |
| 636、643 | 建立帳號／返回登入／忘記密碼 | setMode | 有作用；保留error/shownCode/password的跨mode狀態須檢查 |
| 655、662、669、676 | student／teacher0／teacher1／admin demo | POST /api/auth/demo | 真session；沒有disabled busy，可能競態 |
| 728、772 | 下一步交接／風險 | setSelected＋setView(requests) | 有state變化；當前workspace沒有ID時無詳情 |
| 797 | 課堂 | requestId存在才onOpen | 無requestId時no-op |
| 849、859 | 前／後週 | setWeek→GET /api/workspace?week | 真API；快速點擊response排序待驗 |
| 866 | 日曆下載 | GET /api/calendar→blob下載 | 真接線；非200無提示 |
| 908 | 選星期 | setDay→day-list過濾 | 手機有作用；desktop week-grid仍顯示整週，須避免看似切換內容卻無效 |
| 1041 | 新交接 | setSelected(null)、setEditing(true) | 真編輯區；useState未key重設風險 |
| 1084 | 開交接 | onSelect(id)、setEditing(false) | 真state；無GET詳情、無scroll/focus |
| 1324 | 套範本 | setHandover固定內容 | 本機操作；假教材與非科目範本問題 |
| 1385 | 新增教材 | append {title:'',url:''} | 真操作；無移除控制，屬品質改進非單獨P0阻擋 |
| 1398 | 檢查可用時段 | POST /api/conflicts | 真API；手動、過期、無catch/busy |
| 1433 | 儲存草稿 | formSubmit→POST /api/requests或PATCH /api/requests/:id | 真API；無busy；原生required可能阻止欠安排／原因草稿，但允許欠交接草稿 |
| 1436 | 送出確認 | 上述保存→POST /api/requests/:id/submit | 真API；未disabled、不完整create後submit失敗會重建 |
| 1439 | 關閉編輯 | onClose→setEditing(false) | 有作用；未保存內容直接捨棄 |
| 1597 | 編輯 | onEdit→setEditing(true) | 只Draft/Declined原教師顯示；真正授權仍需API驗 |
| 1611、1623 | 接受／退回 | POST /api/requests/:id/respond | 真API；空退回沒有先擋、無busy |
| 1652 | 送補充 | POST /api/requests/:id/supplements | 真API；無busy/空文字gate，輸入成功後未清 |
| 1668 | 完成 | POST /api/requests/:id/status {Completed} | 真API；狀態門控存在、無busy |
| 1683 | 取消 | window.confirm→POST status {Cancelled} | 真API；固定英文comment保存，無busy |
| 1697 | 列印 | window.print | 有真正瀏覽器操作；列印整頁而非單張詳情需實測 |
| 1729、1741 | 全部已讀／單則通知 | POST /api/notifications/read→reload；單則另onOpen | 真API；無catch/busy、跨週detail問題 |
| 1813 | 存個資 | PATCH /api/profile→GET /api/auth/me→workspace | 真API；無catch/busy／欄位友善錯誤 |
| 1894 | 重設demo | confirm匹配才可按，POST /api/admin/reset | 真API；無catch/busy；真實資料保留另API驗 |
| 1965 | 啟用／停用人員 | PATCH /api/admin/users/:id→GET users | 真API；無catch/busy、自我停用仍顯示且後端拒絕 |

其餘可見互動包括表單input/select（state）、查詢filter（client filter）、profile checkbox（prefs）。高對比／簡易檢視的接線問題已列R01-10。Users、Audit、Impact讀取都有真正GET，但無錯誤恢復；沒有以這些未完成的額外頁面宣稱P1/P2通過。

## 手機／鍵盤靜態觀察與完成後復驗

目前 Editor 是普通inline form（1215），不是modal；無Dialog／aria-modal／focus trap，因此不能聲稱手機modal通過，也不能單憑沒有modal判原始P0不合格。原始 P0 未指定必須使用 modal 或特定元件套件，因此本審查不以 inline form 或未採 shadcn 單獨列為阻擋。要求是實際可鍵盤操作、焦點合理與手機不裁切。

CSS在768以下sidebar仍以完整縱向區塊占據首頁，另有bottom-nav；沒有drawer，也未hidden。頁面小寬度還要實測long URL、長名、row裡date／period／room與materials雙欄能否合理換行。checkbox也受全域input width:100%（137–144）影響，須檢查勾選視覺與label點選範圍。基礎label與focus-visible已存在，錯誤尚無aria-invalid／aria-describedby關聯；loading是普通p，沒有狀態宣告。

完成後至少：

1. 390×844：四身分主流程、七欄長表單、軟鍵盘、focus返回與捲動到詳情；英文／繁中各一次。
2. 768×1024：來源切換、退回重送、日期／班級／教師／狀態組合、padding與表格橫向捲動。
3. 1440×900：整週課表、全鍵盘登入→建交接→回覆→待辦→admin，確認Button text contrast實測。
4. 200%縮放與可見高對比／大字／簡易檢視；無作用的額外入口先刪除或修正。
5. 各APIerror、雙擊、防重建草稿、workspace response競態與session失效。
6. 跨週通知、PRIVATE標记rawpayload、兩個學生待辦隔離、取消後恢復、demo reset後全部登入。

Cursor 現已 ready_for_review；上述前端快照未變，初步發現已重核。最終修正 Prompt 應納入根代理的瀏覽器／API 證據後再發送；本文件沒有對 Cursor 發訊息或修改產品程式。
