# R02 獨立瀏覽器與建置複驗

日期：2026-10-04 Asia/Taipei。產品commit `73d32c1ee1a5d764d0dcf8b755b60c0de6eb808a`；交回HEAD `1f1fe77`只新增status，兩者app tree相同。產品除生成的tracked tsbuildinfo外已停止修改。根代理使用獨立CUA瀏覽器tab1 `http://127.0.0.1:5173/`；沒有控制Cursor自己的測試瀏覽器或改產品檔。

## 命令實跑

在handover跑npm test：24 pass、0fail、exit0。npm run lint、format:check、typecheck、build全部exit0。建置完整產生Worker／client；Node26的module.register deprecation只是提示，沒有當成測試失敗。獨立進階API結果見R02_API_RESULTS.md，不把24個產品測試代表全部驗收。

## 真瀏覽器已確認通過

- student／teacher0／admin demo均有真登入工作台；登出回到登入頁，角色資料跟著切換。
- 學生詳情不顯示reason／reasonCategory／teacherNotes；rawpayload安全另由獨立API測試驗證。
- 學生第一個準備checkbox勾選後reload並重新開啟同一交接，仍checked。驗證後還原根代理自己的那次勾選；沒有重設其他資料。
- 原教師繁中空白表單列7個缺項，送出disabled；來源option已有Class、date、subject、period，起始安排同步來源。
- 套用範本後材料URL改為本站 `/worksheets/class-practice.txt` 的絕對HTTP網址；仍缺接課教師時送出disabled。
- 主要按鈕computed白字rgb255,255,255／墨綠rgb36,107,86，修好了R01的文字對比問題。
- admin真的有Class／Teacher filters。實際選Class8A＋Pending＋Maya Chen後只剩Science待確認交接，符合班級／接課教師／狀態。

## 確認未通過

### 1. 繁中全畫面被段落行長CSS限制

同一tab、同一1440×900實際viewport，zh-Hant的`.shell`width608px／main388px，內容區實際324px，右側約864px空白；標題與Refresh按鈕被迫換行。切English後shell1440px／main1220px立即恢复。登入頁也同樣左邊窄區。

CSS149 `.handover-root :lang(zh)`對**所有繼承中文語言的descendants**套max-width38em，不只是段落。修正限定實際文字段落／content measure，不能給shell／main／form／button等布局容器統一max-width。驗證兩語在相同desktop1440／tablet768／mobile390真正viewport下的內容寬度，不只是「沒有overflow」；不以overflow:hidden遮問題。

### 2. 學生下一堂卡混入另一堂的交接

Overview的下一堂显示`Math · Class7A · 2026-10-05 Monday · P1 · Maya Chen`，下方卻接上`Maya→Jonah`和calculator提醒。点击Open handover實際詳情是**2026-10-09 Friday P4**的另一堂。

app.tsx842–850獨立選firstConfirmed request與按日期排序nextLesson，883–889直接合併。依lessonId／requestId且合法公開狀態對應，卡片只能顯示同一堂資料；沒有對應交接就呈現原安排。另列「近期課務異動」可顯示Friday，但要有自己的日期節次，不與Monday合併。

### 3. 原本要求的繁中系統字串尚未完成

繁中detail時間軸仍`2026-10-03T15:41:22.301Z · Seed · created/submitted/confirmed`。admin風險按鈕仍`Class8A Science is still unconfirmed.`等英文系統句。名字和教師手寫內容可原文；這些是系统事件，應由事件碼與currentlocale映射，日期合理本地格式。

### 4. seed教材仍placeholder，範本仍固定英文

學生已確認demo詳情的Practice worksheet仍`https://example.org/worksheet`；stable service.ts570也同樣，並非只舊本機資料。本站worksheet已存在，seed／reset／學生顯示應用真的可開的自有教材，不硬編未發布網址。

繁中点击「套用科目範本」仍填`Math: the class has finished the previous worked example.`等全英文。材料本站URL已修；語言及真正不同科目的內容仍需修或移除未完成入口，不能把替換subject名稱稱真科目／語言範本。

### 5. 管理員本週異動統計尚未出現

Overview只有課堂60／Pending2／Declined1／Ready2，沒有`stats.weekly`對應的本週異動件數。後端契約有该field；UI要清楚呈現真实本週件数而非用課堂數代替。

## 尺寸驗證限制，禁止冒稱

根代理對此瀏覽器的document實測為1440×900。viewport capability呼叫390×844後，舊tab仍1440×900；新暫時tab也只是1280×720，已關閉。因此此輪**根代理只完成實際1440的畫面驗證**，沒有把無效果的resize當390成功。Cursor交回文件宣稱390／768／1440已測，獨立驗收尚需真viewport證據或可重跑的Playwright tests。已用文檔化API與新tab排查，不以DevTools source或其他方式修改瀏覽器內部。

尚有明確後端失敗，本輪先送具體修正，不在不合格版本上偽造完整四角色／多尺寸通過。R03後繼續實際完整流程、keyboard／reduced-motion與必要截圖。
