# Handover：第3輪具體修正與可重跑的交付驗證

第2輪已獨立驗收，尚未通過。延續同一Cursor對話、branch與產品，不重建專案／Site，不再問已核准視覺方向。產品stable `73d32c1ee1a5d764d0dcf8b755b60c0de6eb808a`，status-only HEAD `1f1fe7704f92cdc14dd6a819aedeacec909a2f2c`。

請先完整讀根`.codex-review/R02_API_RESULTS.md`、`R02_FRONTEND_RESULTS.md`、`R02_BROWSER_RESULTS.md`、`R02_DOCS_MIGRATION_RESULTS.md`。原ACCEPTANCE、VISUAL_ACCEPTANCE和R02B視覺要求仍生效。已修R01四類漏洞、七欄gate、草稿ID、Editor key、學生原因遮蔽/TODO持久化、admin組合篩選、亮色主要按鈕對比等都通過，保留成果；不要重列已解或以舊報告覆蓋新事實。

本輪根代理真跑24產品API、lint/format/types/build全部exit0；最新獨立suite含82計數，73pass／9fail（31API頂層中26pass5fail＋child/parent，非9個不同根因）。reviewer-ownedtests擴充是依原seed／原子寫入要求，不可改assertions或skip失敗。畫面另有實際確認問題。

## A. 先修4項後端原子性

1. **Seed失敗不可留下半套資料**：service350–359先寫meta seeded，再逐筆寫45users、lessons等。獨立test在lesson INSERT注入真正SQLite ABORT，seed失敗後留下45users/3classes/marker，解除故障重試所有角色200但永久0lessons/0requests。將完整資料＋完成/版本標記同一D1交易落地；不存在完整標記不能僅因users>0就跳過。保留正常註冊/關聯，不清整庫。SQL schema-only migration與seed分開。
2. **8個首次登入同時來都要正常可用**：同一空已遷移庫目前1個200、7個409。安全合併或DB層冪等／等待完整seed，不让敗方讀半套。不能只靠某isolate的module promise當跨Worker保護。原seed fault/retry與parallel startup tests都要通過。
3. **CAS敗方不得寫成功事件或碰課表／locks**：現在accept/decline/cancel/complete平行都200+409，但timeline/audit各2；accept通知26應13、decline2應1。更簡單：合法Completed後再次Completed回409卻新增timeline/audit。原因是events的EXISTS只看最終status，不看「本次」UPDATE成功，事後batch meta.changes才throw已太晚。
   建議用每次操作唯一transition UUID／revision token，只有成功CAS寫入本次token，batch內課表、鎖、timeline/audit/notifications全以本次token條件執行；或另一個證明同等原子性的可維護方案。只查最終狀態／同毫秒timestamp／batch後再throw／前端busy都不能解。需要migration就正式新增，metadata一致。成功恰好一次，失敗完全無副作用。
4. **submit交易內重查正式lesson占用**：A的conflictReport過後暫停，B正常API submit→accept佔用同一目標且釋放Pendinglocks，再放行A；A仍200Pending，鎖已正式佔用的班級時段。不能只靠slot_locks PK。Pending CAS／reservations在同一原子操作檢查目前lesson班級／教師占用與source安排，失敗409、保留Draft且無submitted事件／locks。不完整交接仍422；完整但衝堂不能錯回422 missing=[]。R01的accept／cancel防線保留。

最新完整命令（repo根）：
`node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts`
不要修改review-d1／獨立案例，產品自己的sqlite helper和回歸可依法完善。報告已排除未來Completed政策、合法accept→cancel兩個200、取消通知未有契約的假設；真正失敗不依賴那些條件。

## B. 具體前端修正：不要只改正常畫面

1. **繁中CSS scope（已真瀏覽器重現）**：1440×900下zh-Hant shell608/main388；切EN shell1440/main1220。handover.css149 `.handover-root :lang(zh)`把所有繼承中文的descendant都max-width38em。只約束文字段落，不限制shell/main/form/button等布局；登入／三角色／兩語真390/768/1440尺寸測內容寬度，禁止overflow:hidden掩蓋。
2. **下一堂資料要同一lesson**：app842 firstConfirmed與846 nextLesson各取各的；883把Friday10/9 P4 Maya→Jonah放在Monday10/5 P1正常Math下。按lessonId/requestId＋合法公開狀態關聯。沒有該堂交接就顯示原安排，其他近期異動獨立列自己的日期節次；卡片和Open目的地一致。依真資料顯示日期／今天／下一上課日，週末不假裝有今日課。
3. **Detail輸入隔離**：app1440 Detail缺key，comment/supplement/error在1937只init，切不同request會把私密留言送錯人。按ID key／明確重置，測A填PRIVATE但不送，切B不能帶入A。Editor已修但Detail另驗。
4. **每個可見API操作完整busy/catch/error/retry/401/success**：R02_FRONTEND_F04有精確表格，logout、全部通知read、profile、reset、users load/toggle、audit、detail動作/view、impact都仍有缺口。初次workspace500不能默默回Auth且丟掉錯誤；global refresh234立即清掉message導致成功回饋看不見。可用清楚共用hook/helper集中mutation與load，但不要用全域unhandledrejection吞掉例外。401一致撤登入回入口、保留合理未存內容；403/validation/network有正確本地文案；忙碌阻止重複寫，失敗不是綠色success；成功aria-live可見。Users/Audit載入失敗不冒充empty。
5. **衝堂重試**：failedKey使當前安排report=null且Send永久disabled；加入保持欄位的Retry，成功清舊error，401/403區分，仍忽略過期查詢。跨週GETdetail／notificationreload的舊新workspace回應逆序要有generation/abort保護，確定週次與資料一致。
6. **系统雙語與日期**：timeline action、notification事件、admin risk、audit action/detail、缺項、availableSlots節次仍rawEnglish/UTC ISO。用事件code＋currentlocale呈現；姓名／老師手寫內容可原文，不翻教師自由輸入。每筆notification已讀／未讀以文字＋圖示可見／可存取，未讀總數不是每筆標記。
7. **真本週件數**：Admin顯示stats.weekly與清楚週次；目前只lessons/pending/declined/confirmed，不把課堂數當調課數。
8. **暴露入口要真作用或移除**：simple偏好目前無CSS／render用途；做真正學生簡易呈現或移除入口，不隱藏admin必要操作。範本目前只插subject名字的固定英文；提供真科目／語言內容與原創自帶教材，或移除未完成入口。範本自有URL已修，但service570 seed仍example.org/worksheet，需seed/reset和已有demo stub都真可讀自有材料，不碰普通教師自訂URL、不硬編未發布domain。
9. **dark／高對比實測**：已露出dark enabled active文字#10221c on#143f34低比；warn白字on#ffb4a8/高對比#ffd0c8約1.70/1.39。修semantic fg/bg組合，真computed驗normal/hover/active/focus/error；一般文字>=4.5、必要非文字/focus>=3，disabled文字排除WCAGthreshold但仍要可用。checkbox真可點label至少44px，不能只放大不存在點擊作用的空白。

## C. 可重跑的真瀏覽器測試與實際截圖

已有@playwright/test devdependency，可用官方Playwright／本機合適skills來寫必要回歸；不新增production套件、不换模型／安裝插件。你這輪從同一份實際產品啟動隔離的已遷移D1 testserver，用真cookies與角色，避免共享開發庫或rootreviewerstate。

至少：

- 390/768/1440 × EN/zh-Hant，登入/學生/老師/行政：document actual viewport真的等於指定尺寸，繁中桌機內容不能被意外窄化，無整頁水平overflow、長文字不裁掉。
- 完整老師建立草稿→七欄與教材→衝堂→送出→接課teacher拒絕/接受→學生安全detail/TODO保存→admin查詢，包含不能越權的負面案例。
- 下一堂與不相干晚些交接的 regression；Detail跨ID PRIVATE不得挪用；所有主要500/401/重試/busy與success訊息；conflict舊回應不覆蓋新安排。
- keyboard/focus/44px、reduce-motion、dark/contrast主要按鈕、實際字体load與fallback。不是className存在就算通過。

提供可執行script／合理CI整合，官方Chromium在CI安裝；不得skip/continue-on-error掩盖。測試敏感session僅記憶體，不寫cookie/hash/恢復碼到log或截圖。5–8張真畫面依docs/SCREENSHOT_PLAN保存在docs/screenshots/或清楚交付位置，檔案是實際頁面非AImockup，附README。這些是展示截圖，不是Sites thumbnail；不要擅加public/screenshot.jpeg。

Codex本輪CUA viewport呼叫後actualdocument仍1440，未冒稱獨立390通過；可重跑的Playwright尺寸證據會補此驗收，不把「工具呼叫成功」當render成功。無工具就如實說，不能偽造pass／截圖。

## D. 資料庫重建、文件、Git清理

- schema/journal/snapshot14表與Wrangler空D1已驗通過，保留。但SQL沒有`--> statement-breakpoint`而journal breakpoints=true，standard Drizzle讀成一個含14CREATE的prepared chunk；首次正式部署前補合適生成式markers、metadata鏈，重驗db:generate no-op/空D1，不宣稱Sites已部署失敗。新增migration同樣只schema/guard，不大量seed。
- **README乾淨npmci→dev後demo500 no such table users**：提供真的本機db:migrate腳本/config，source drizzle絕對／正確根路徑、使用同一持久化state；built config在dist/server，migrations_dir./drizzle直接解析到錯處。照新README從空庫完整重建/啟動/4demo都200，第二次migration no-op。保留既有資料，勿刪共享.wrangler。
- README補Node>=22.13、架構圖、env.example讀取／DB binding、migration/seed、demo invitation、30秒導覽、授權（可以如實unlicensed）、驗證／部署runbook／credits。root入口已修，保留历史筆記。
- TEST_REPORT分清每輪SHA、實際命令/exit/通過數/尺寸；消除R02已測 vs末尾未測矛盾，這輪最新獨立82數不可寫73已全pass。Devpost短AI揭露與Built with同步Codex＋Cursor及真fonts/starter。人名/資格/guardian/Devpostterms/影片與最後提交保留真人項；已授權Github/site不是重複approvalblocker。
- tsconfig.tsbuildinfo加入ignore、git rm --cached僅移出index保留本機；不commitgeneratedstate／DB／node_modules/dist/log／credentials。reviewer新檔不是你的成果，不混入產品修改或覆寫。

## E. 實作與交回

真的讀適用skills（security/workers/diagnosing-bugs/design-system/ui-styling/React/ai-debt/Playwright），記錄具體改動和證據，沿用已核准暖白墨綠字體系統。可以平行分後端／前端／文件測試，隔離檔案，不讓多人同時改app.tsx/service。逐項關閉本prompt，不只挑好改的部分。

format/lint/types/productAPI/最新獨立suite/build/空D1/真E2E都實跑；若有失敗繼續修或給精確不可驗證理由。最後保持branch handover、commit可審查產品版本、**停止產品編輯**，根CURSOR_STATUS更新round3 ready_for_review，用實際当前時間、真HEAD/checks/blockers，同對話交回。不要push未驗收版本；Github與既有Site發布由Codex獨立驗收通過後處理。不建立新Site，不改對外帳號/付費/Devpost最終提交。
