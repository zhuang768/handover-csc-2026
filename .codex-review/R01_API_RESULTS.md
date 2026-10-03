# R01 獨立 API 驗收

- 驗收時間：2026-10-03，Asia/Taipei。
- 受測產品 HEAD：`111f16a17381679aba20499807b9f6cd7b306cfc`。
- 受測入口：`handover/server/service.ts` 的實際 `handleApi`，注入獨立 Node SQLite D1 adapter，執行產品實際 migration。
- 最終指令：`node --experimental-strip-types --test .codex-review/independent-api.test.mts`。
- 最終結果：exit 1；65 個 Node test 計數，47 通過、18 失敗、0 skipped、0 todo。22 個頂層案例；計數含 7 個必填欄位、2 個並行情境與 34 個 HTTP method 子案例，也包含失敗的父案例，**18 失敗不是 18 個不同缺陷**。
- 只修改 reviewer 測試檔及本報告；沒有修改產品、adapter，沒有對外部署或操作 Cursor。

## 必須修正的四項

### R01-API-01 — P1：GET／HEAD 會真的送出調課及寫入已讀回條

重現：取得實際 teacher session、建立完整 Draft，直接呼叫 `GET /api/requests/:id/submit` 或 `HEAD`。另以同班 student session 呼叫 Confirmed request 的 `GET /api/requests/:id/view` 或 `HEAD`。

觀察：

- GET／HEAD submit 都回 HTTP 200，request 由 Draft 變 Pending；`requests`、`slot_locks`、`timeline`、`notifications`、`audit_log` 均改變。
- GET／HEAD view 都回 HTTP 200，views 從 0 變 1。整個資料庫前後雜湊比較確認實際只改了 `views`。
- respond、status、supplements、todo 的 GET／HEAD 回 422：目前沒有副作用，但確實進入錯誤的 action handler 做 mutation 表單驗證，而非拒絕 method。
- `/admin/reset`、auth mutations、profile、notifications/read、conflicts、requests creation、admin user patch 的 GET／HEAD 均回 404，沒有資料庫變動。

原因位置：`handover/server/service.ts:2067` 的 action branch 只檢查 URL，沒有檢查 `method === 'POST'`；`service.ts:1946` 同時讓 GET／HEAD 跳過 mutation 的 Origin 檢查。正式 route 明確將 GET 導向相同 handleApi，故 GET 問題不是僅測試專用入口的問題。

最小修正：所有 action 在取得／修改 request 前明確要求 POST，其他 method 回 405（或既有契約允許的 404）；保持 GET／HEAD 無副作用，不能靠空 body 的 422 間接阻止寫入。驗收須維持回條 0→0、Draft→Draft，所有資料表雜湊不變。

測試位置：`independent-api.test.mts:565`。HEAD 本次驗證的是 service 入口；尚未另做框架真實 HTTP HEAD 探測。

### R01-API-02 — P1：接受與取消並行時，狀態已取消但課表仍由代課老師上課

重現：建立、送出合法代課申請，取得原老師與接課老師兩個真實 session。兩個請求都讀到 Pending 後，在首個寫入前會合，並行呼叫 accept 和 Cancelled；分別測 accept 呼叫先開始、cancel 呼叫先開始。

觀察：兩個起始順序均回 HTTP 200／200；request 最後是 Cancelled，但 lesson.teacher_id 仍是 `demo-teacher-1`，原老師應是 `demo-teacher-0`。這不是「兩個 200」本身有錯，而是沒有任何合法循序歷史能產生此 final 狀態與課表組合。

原因位置：`service.ts:1421` 先寫 Confirmed，再於 `1428` 分開改 lesson；`service.ts:1494` 取消是否還原課表取決於交易前讀到的 row.status；`1502` 最後又無條件寫 Cancelled。這些寫入沒有同一個原子交易及版本／狀態檢查。

最小修正：將預期狀態檢查、狀態轉換、課表更新或還原、slot release，以及成功 timeline／notification／audit 一起放入原子 D1 batch。過時請求失敗時要整批回復，不能留下成功紀錄或部分課表變動。

合法結果可以是：取消先成功，accept 回 409 且原課表不變；或 accept 成功後 cancel 成功並還原；或過時 cancel 回 409，最終 Confirmed 且課表為接課老師。本測試沒有硬性要求只准一個 200。

測試位置：`independent-api.test.mts:516`。

### R01-API-03 — P1：取消已確認移課會把原時段塞回另一堂已確認的課

重現：準備兩堂合法課表 fixture。第一堂經真正 move／submit／accept API 從星期一第 1 節移到星期二第 2 節；第二堂再經真正 move／submit／accept API 移進已釋放的星期一第 1 節。取消第一筆 Confirmed request。

觀察：取消回 HTTP 200，原班級星期一第 1 節變成 **2 堂課**。原時段占用是透過合法產品 API 建立，並非在取消前直接注入非法衝堂資料。

原因位置：`service.ts:1494`–`1499` 直接恢復 `base_*`，沒有重新檢查原班級、老師、教室及 Pending reservations 的占用。

最小修正：在原子取消交易內先驗證還原時段可用，排除自己、納入其他 Pending reservations。若被占用，回 409，保留 Confirmed 與目前移課位置，不能改動第二堂課。最終課表也應有足以防止重複排課的資料庫約束或同等原子 guard。

測試位置：`independent-api.test.mts:377`。

### R01-API-04 — P1：接受 Pending 沒有再次驗證接課老師目前是否衝堂

重現：正常 draft／submit 後，使用受控課表修訂 fixture 為接課老師在另一班同日期／節次新增一堂課，再以真正接課老師 session 呼叫 accept。

觀察：HTTP 200、request 變 Confirmed，同一接課老師該節次有 **2 堂課**。`conflictReport` 在正常 submit 的 teacher-only 衝突案例會阻擋，accept 沒有調用它。

原因位置：`service.ts:1385` 的 respond 只有角色、Pending、decision 檢查，接著 `1421`–`1438` 直接寫 Confirmed 與 lesson。

最小修正：accept 重新檢查目前 occupancy／有效接課人，並將衝突判斷與狀態、課表變動放在同一原子保護下；衝突回 409，維持 Pending 與原課表。

測試位置：`independent-api.test.mts:288`。此案例的新增課表是測試 fixture 模擬課表修訂，沒有宣稱已發現一個未授權 API 可新增課表。重新驗證是本輪明確要求的防護。

## 已實際通過的重點

- 七個交接欄位逐一空白／缺教材，直接 submit 都拒絕並指出缺項，沒有殘留預約。
- javascript／data／file 教材 URL 都拒絕。
- teacher-only 衝堂會在 conflict report 與直接 submit 阻擋。
- Pending 學生不可讀；學生原始 workspace／detail JSON 與 ICS 都沒有 teacherNotes marker。跨班讀取、todo、view 及不相關老師修改均拒絕。
- 已送出原文鎖定，退回需留言、釋放 locks，可修改重送、再確認。
- 登出、session 到期、帳號停用、重設密碼後的舊 cookie 皆拒絕；recovery code 輪換，兩個既有 session 都撤銷。
- 已授課的 past Confirmed 可完成一次，重複完成與 Completed→Cancelled 拒絕。
- 未發生還原衝突的 Confirmed move 能還原 teacher/date/period/room，目標時段可以再被合法使用。
- Demo reset 撤銷舊 demo sessions、刷新 admin session、恢復三角色一鍵登入。
- Demo reset 保留真正註冊老師的 request（引用 demo lesson/class/recipient）、接受後課表、真正註冊學生的三個 todos、views、帳號雜湊與 sessions。
- 並行搶同一目的時段只有一筆 Pending、另一筆 409／Draft，locks 全屬成功者；同筆 submit 並行重播只有一次 submitted timeline 和 pending notification。
- 正常 POST／PATCH 的跨 Origin mutation 都拒絕且沒有變更狀態。

## 誤報排除與範圍

- 未來課程立刻 Completed 本次觀察為允許。原始需求沒有明確要求等到授課結束，故已改成 advisory diagnostic，**不作發布阻擋，不列缺陷**。若產品要定義 Completed 為已授課，再加日期與節次結束時間限制。
- Accept→Cancel 兩個 200 在合法循序操作中可以成立；本輪只因 final Cancelled／代課課表矛盾而失敗，沒有錯誤地禁止所有雙成功。
- 使用根代理同步 SQL batch adapter；並行時沒有巢狀 BEGIN、沒有 `cannot start a transaction within a transaction`。失敗是實際業務狀態／課表不一致，不是 adapter 的假 500。
- Normal register／login／recovery 全都由實際 service 處理，沒有注入 session 或 crypto polyfill。測試 fixture 只設定校務課表與初始授課分派，不跳過被測 API 的角色或 owner checks。
- 原時段重新占用測試已改為合法產品 API 確認的另一筆移課，以排除直接寫入非法課表造成的假問題。
- wrong-method 全表 snapshot 在 fixture 完成初始化後才取得；沒有把第一次 seed 初始化當成 GET mutation。所有快照只比較雜湊，不輸出密碼、recovery codes 或 session cookies。
- 120k PBKDF2 本輪沒有當成缺陷；Workers 支援與否由根代理的實際 workerd probe 判定。Node integration 通過不代表已驗證部署環境性能。
- 尚未執行正式 D1、公開部署、完整 HTTP HEAD 轉送或瀏覽器驗收；這份報告只涵蓋獨立 API／SQLite integration。
