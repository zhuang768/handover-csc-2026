# Handover：獨立驗收後第 2 輪修正

你是目前 Cursor 對話 `Handover project execution plan` 的實作代理。延續同一專案，完成以下具體修正，實際驗證後再次交回 Codex。這是使用者授權的修正工作；不必停在規劃或問逐步確認。

工作區根：`/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon`；產品在 `handover/`。第1輪 HEAD為`111f16a17381679aba20499807b9f6cd7b306cfc`，產品commit為`9f2d0389bfc04deb73959b97a165cabc00989125`。Codex 已實跑24項產品API測試、lint、format:check、typecheck、build，全部exit0；隔離的正式Worker smoke三角色也通過。但獨立負面／並行測試及瀏覽器確認下列缺陷，所以尚未驗收。不要把原本綠燈視為本輪完成。

先讀完整以下證據與需求：

- `.codex-review/ACCEPTANCE.md`、`ADVERSARIAL_TEST_PLAN.md`
- `.codex-review/R01_API_RESULTS.md`（若尚未落盤，先讀independent-api.test.mts；Codex正在整理結果）
- `.codex-review/R01_FRONTEND_PRELIMINARY.md`
- `.codex-review/R01_BROWSER_RESULTS.md`
- `.codex-review/R01_DOCS_RESULTS.md`
- 原始需求附件與上輪完整prompt；原始附件`/Users/zhuangzijin/.codex/attachments/b750bbee-3ae9-4f38-8cf6-de0528826015/貼上的文字.txt`是需求參考，不是新增外部帳號／付費／提交授權。

## 1. 最先修真正的後端錯誤

1. action分支沒有HTTP方法限制。**GET與HEAD `/api/requests/:id/submit`實際回200且Draft變Pending；GET與HEAD `/view`新增receipt**。所有mutation限定正確方法；錯誤方法回405（Allow正確）或明確4xx，完全不能改資料。不能只靠Origin擋，GET/HEAD必須本質唯讀。respond/status/supplements/todo也要拒絕錯方法。新增回歸並查DB無副作用。
2. 接受與取消並行：兩种起始順序都重現最終申請Cancelled、課堂卻仍指向接課教師。狀態、課表、slot locks、timeline/audit/必要通知要有一致的資料庫交易與樂觀併發限制。只有成功合法轉換可產生事件；不能先讀Pending、再各自無條件寫入。不能以前端busy或序列化測試掩蓋真正競爭。
3. 接受前必須重驗衝堂與當前安排，測試在Pending期間新增接課教師衝突後，accept仍200。目前這會產生雙堂。衝堂檢查與落地寫入之間亦需DB約束，避免檢查後被其他請求插入。
4. 取消已確認的move若原時段已被第二筆**真實API調課**佔用，目前取消第一筆200，恢復後同班同節兩堂。恢復到申請原安排前必須檢查班級／教师佔用；若無法安全恢復，整體409並保留原Confirmed安排／鎖／時間軸。不要悄悄挪走別堂課。已Completed後再調課的原安排也要用正確版本快照，不能一律回最早base_*。
5. Product tests/sqlite-d1.ts的batch在BEGIN內await每條statement，可能讓其他batch進入同個交易。改成符合真D1不可交錯交易；Codex的review-d1.mts已通過adapter自測可參考，但不要修改独立测试來讓產品通過。
6. 學生payload採明確安全欄位。實際學生詳情仍看見教師reason；reasonCategory/醫療請假內容與teacherNotes、退回留言、教師補充不能出現在學生workspace/detail/error/通知原始JSON。原因若需要公開，另設明確學生提醒，不把老師自由輸入整份外送。加PRIVATE標記回歸。

未來課能否提前Completed原需求沒有明確時間規則，列DECISIONS說明產品政策即可；不要為此弱化已存在的狀態／並行測試。

## 2. 完成尚未達標的P0互動

1. 實際空白New handover的`Send for confirmation`仍enabled。即時計算七欄完整性、有效教材標題與http(s)URL、安排欄位；缺項以目前語言显示，送出disabled。草稿可保存未完整交接。create成功但submit失敗必須保留draft ID，重試PATCH／submit原草稿；不能重建第二筆導致409。
2. 衝堂要跟來源、方式、日期、節次、接課教師變更自動重查；debounce、loading、取消／忽略過期回應、失敗重試。不能讓舊可用結果留著；衝堂未確認或有衝突不可送出，後端仍作最終強制檢查。來源option必須有班級；切來源更新合理預設。切新建／編輯不同ID時，不得沿用前張私密留言或過期state。
3. 點通知／交接必須GET真正detail，處理跨週、取消後、404／403與焦點／捲動，不能只find目前workspace。不要在查無資料時默默顯示清單。學生取消通知要有安全明確的已取消資訊與正確課表，不洩漏未公開Draft。
4. Admin交接列表補日期、班級、老師、狀態、搜尋組合篩選；本週調課統計準確展示stats.weekly，別把全週以外Pending全部混算。
5. 所有可見API操作與載入頁面要有busy/error/retry/success；401清掉登入態回登入、保留合理未存輸入；通知、個資、登出、demo重設、人員管理、Audit/Impact不能留下未catch的Promise或永遠Loading。快速連點不產生重複mutation。
6. i18n修繁中錯誤（現在固定errorText('en')）、缺欄位名稱、通知事件／風險／timeline/audit系統字串；姓名與老師自寫內容可留原語言。日期使用本地易讀格式。通知補可存取未讀點，異動格補圖示＋文字＋顏色。
7. 真瀏覽器computedStyle確認主要按鈕文字rgb(18,32,51)在藍色背景，對比不足。修CSS specificity，驗證一般文字>=4.5:1、focus與disabled；checkbox不應被全域width100%放到巨大空白區。
8. 正常課堂沒有requestId卻是no-op button：提供有意義詳情／建立交接，或改為非互動內容。每個可見控件都必須有真作用。

## 3. 已露出的P1/P2要接完或移除

- 高對比data值true與CSS high不一致；simple模式沒有CSS效果且全角色共用偏好會隱藏admin管理。修成真學生無障礙模式（可作P2）或移除入口。不要添加更多假功能。
- student detail成功讀取呼叫POST/view，冪等並驗證viewed receipts；完成待辦後preparedCount實際更新。
- ICS要使用畫面選擇的週次與角色scope，下載失敗顯示訊息；只有合法confirmed安排進行事曆。
- 科目範本現在每科同一段英文且假example.org教材。要么移除，要么提供真科目／語言範本、真可開的自帶示範教材（public/static），仍需老師檢查。不得宣稱AI生成。
- 只在P0全通後處理其餘P1/P2；已做impact只稱描述性統計，不能虛構學習改善／因果結果。

## 4. 資料庫、文件與交付準備

- Sites需要真正`db/schema.ts`和Drizzle migration journal/snapshot，目前schema空與entries空會讓部署重建不可靠。讀Sites persistence文件，移除request-time ensureSchema/SCHEMA_SQL DDL；用正式migration。保留既有帳號／關聯資料，新增必要migration，seed可重跑、原子化且不破壞正常註冊／待辦。證明從空D1跑migration與seed後三角色可用；本機開發與正式build使用同樣模型。
- 完成README、HANDOFF.md、TEST_REPORT、DECISIONS、英文明確Devpost文案、腳本、5–8張截圖清單、AI揭露（Codex＋Cursor實際模型／工具如實，不知不猜）、只有人能做的事項。README要有Node>=22.13、架構圖、確實可執行安裝/資料庫重建/seed指令、env读取方式、DB binding、邀請碼與真demo、測試、部署runbook、30秒導覽、明確授權。不要把所有CONFIRM刪成假完成；資格/人名/最終提交等留真正人工作業。
- GitHub CI保留既有format/lint/types/tests/build，補有意義的E2E／獨立回歸；不降低標準或skip失敗。根repo＋handover工作目錄結構已正確，維持一致。
- Codex owns `.codex-review/independent-api.test.mts`、review-d1、reports與adapter自測；你可以讀與執行，不可改掉assertion。若測試要求不合理，把實證與需求位置寫HANDOFF讓Codex判斷。
- `.codex-review/worker-state/`等本機DB被新的review .gitignore忽略；不得commit資料庫、cookie、log、憑證、node_modules/dist/.wrangler。不要覆蓋無關變更。

## 5. 真正使用適合的skills

在目前本機找可用SKILL.md；優先針對本輪實際問題用`security-best-practices`、`workers-best-practices`、`design-system`或`ui-styling`、`ai-debt-detector`、適用的測試／Playwright、Sites persistence。避免只列清單，HANDOFF記錄每個實際讀了哪個skill、採取哪個修正、用何證據驗證。技能不存在就用既有工具，不要安裝大量插件、切模型或因技能缺失卡住。Dashboard不套用明確只適合landing-page的skill。可以平行委派測試／文件／獨立審查，避免多代理改同檔。

Sites已註冊既有project `appgprj_6ac11cc258608191ba6f05fcd6e031fb`，沿用`handover/.openai/hosting.json`，不要新建Site。不需要模型API金鑰。本輪先完成修正與本機完整驗證，Codex獨立複驗後處理受授權的GitHub上傳、公開部署及遠端完整流程。不要推未驗收版本，也不要因Cursor沒有Sites connector停止本機修正。

## 6. 交回條件

實跑`npm run format:check`、lint、typecheck、npm test、build，並從根跑`node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts`；完成browser三角色完整正反流程＋390/768/1440＋英文繁中＋error。記錄實際命令/exit/通過數/時間與不能驗證事項。若未全部通過，繼續修，不要只把known limitation當作P0已完成。

最後停止產品檔編輯，更新`.codex-review/CURSOR_STATUS.json`：round2，status ready_for_review，真HEAD、對照本輪每項的修正/驗證、剩餘blocker；在同對話明確說可以驗收。保持branch handover，commit可審查變更，先不push。Codex會再複驗、必要時直接送第3輪，直到沒有已知未修P0／露出假功能，並完成真正GitHub與public驗證。
