# R04 前端複驗：舊四組問題已大幅收斂，剩兩個精準修補路徑

固定產品：`6b7b7cd734e9af06785d7f854d75dc8f3a160c6f`；handover tree：`ebbe56dda33a1547d67f17367bc067fe7a6eb2ab`。來源採該 SHA 的 Git blob，與 status-only HEAD `7e76a4a` 的產品 tree 相同。記錄時間：2026-10-04 02:04 臺灣時間。此後 R05 已開始施工；本報告只判定固定 R04，不將施工中來源當完成證據。

本代理只讀程式與測試，寫 reviewer 報告及執行固定來源的 SW VM；未操作 Cursor／GUI／DB、未跑產品 install/build/server。根代理實跑 8 項 dev E2E、1 項 built offline E2E 皆通過，另有 built Worker 真實 Cua 證據，見 [R04_BROWSER_RESULTS.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/R04_BROWSER_RESULTS.md)。下列程式路徑缺陷未由本代理 UI 重現，明確區分。

## R03 四組缺陷 closure

| 舊項目 | R04 固定版結果 | 證據與界線 |
| --- | --- | --- |
| F01 局部 API 錯誤、401、busy、loading | 主要已修，僅跨週通知錯誤保留仍缺 | 根 `signOut` app 215–223 清有效 shell；Editor/Detail/Profile/Users/Audit/Impact 已傳 onUnauthorized。Detail view 2299–2305 不再吞非401失敗；Profile/reset 2786/2872 及 Users 3033 用目前語言錯誤。通知 2639 disabled；401 2651–2653 直接結束、不再開 detail。Users 3000–3003 阻擋連按，PATCH 後 GET 失敗 3023 給「列表需要更新」；Users/Audit 2909/3074 有 loading 與 retry。auth/me 301–309 分開正常未登入401與500/offline。跨週缺口詳見 R04-F01。Profile401 E2E只證明回登入，不等於所有 caller／每個 error code 都已自動覆蓋。 |
| F02 系統雙語與時間 | 本輪原列項目靜態已修 | app 62–85 映射已知 audit action/detail（updated、supplement、demo.reset、user.updated、registered/reset）；Audit 3129 使用当前 language；補充／timeline 2443/2454 使用臺北 Intl；notification reminder 2674 有 t 映射；Profile/reset/Users 已移除強制 en/raw code。未知或使用者自訂內容仍保留原文，不能以此判雙語失敗。不是完整全畫面螢幕閱讀器／翻譯品質驗證。 |
| F03 simple 跨角色且桌機沒課表 | 已修，有對應 E2E | root [app.tsx:385](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:385) 限 `student && prefs.simple`；CSS 651–654 讓 simple 桌機 day-list 可見、week-grid 隱藏。E2E 266–293 實驗學生390/1440簡易課表，接著同瀏覽器老師／admin1440仍有 week-grid。不能重列 R03「老師无法關閉simple而表全沒」為現況。 |
| F04 手機双導覽與 Notifications 截切 | 原缺陷已修，角色尺寸測試通過 | desktop-nav app 394 包含桌機導覽；CSS 547 手機隱藏；bottom-nav 514 四等份，525 換行/min-height44，610 桌機隱藏。第四個 More 打開真功能列表，不再塞長 Notifications 標籤。E2E 222–258 驗三角色×390/768/1440、EN/繁中 document overflow，390 驗單導覽、四個底列 button 的高度及右邊界、More 開關。尚未等於所有控制項44、鍵盤/focus、iOS safe area／放大模式都通過。 |

R02 其他已修的繁中整頁 max-width、下一堂交接錯配、Detail state 沿用、本週統計、seed 教材假 URL、深色 primary 配對，沒有新證據推翻其修復；本輪不再重列為缺陷。學生 raw payload／不同班級／private note 與 todo 持久化由根獨立 API／先前 UI 證據處理，不能把單一 input 清空測試冒稱完整 privacy 驗收。

## R04-F01 — 中：跨週開交接仍清除「通知未成功標已讀」錯誤

程式事實：[app.tsx:2655](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:2655) 在通知 read500 設翻譯 error，2660 呼叫 `onOpen(id, true)`。`openRequest` 226 的 keepError 保住**同週**錯誤，故原 R03 一律吞錯誤已修。當 detail 的 targetWeek 不同，238–240 呼叫 `load(targetWeek)`；[app.tsx:265](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:265) 不分來源立即 `setError("")`，紅色失敗訊息仍會消失。

這是有條件的確定呼叫路徑，未由本代理操作 UI。最小實證／修補：先切到與該通知交接不同的 week；延遲或回傳 read500，detail200、target workspace200。詳情正常打開後仍保留清楚的「標已讀失敗」訊息，未讀不能被假裝已保存；同週成功與401不開失效詳情的既有行為保留。R04 E2E 沒有這條 cross-week read500 case。

## R04-PWA01 — 中：進行中的 mutation 未納入更新保護

此項屬既有 R04 prompt 第50行「沒有未存輸入或正在處理的 mutation」的範圍；詳細 SW／更新報告見 [R04_PWA_RESULTS.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/R04_PWA_RESULTS.md)。

根只傳 [app.tsx:495](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:495) 的 `editing || drafting`；Detail 的 dirty effect 2308–2311 只看 comment/supplement；Profile 2712–2719 只看名稱／班級／科目；Users writingId 是元件局部狀態。因此未填留言的接受操作 busy2314、沒有 profile 改動的 admin reset busy2863、Users toggle writingId3003 都可在 pending 期間仍看到更新按鈕；沒有把 busy 提供給 InstallGuide。

這是靜態缺口，不宣稱已 UI 重現、不推論 pending mutation 一定被取消或資料一定遺失。最小 authored test：建立 waiting worker，攔住其中一次真 mutation 回應；開始操作後驗更新按鈕不可按且不送 skip-waiting／reload；完成或失敗後恢复。應覆盖上述三個現有路徑，可小幅共用 busy callback。根已真實驗過**正常兩版本更新及 Profile dirty**，其已通過部分不需重做整套。

## 8 dev + 1 built E2E 的實際證據強度

| 範圍 | R04 真正新增／改善的斷言 | 剩餘測試界線（不等同產品缺陷） |
| --- | --- | --- |
| 尺寸／語言／角色 | workspace.spec 222–258 真登入三角色×三尺寸並切 EN/繁中；390 button 高度/右邊界與 More；有 body/html overflow 真量測。 | 40–70 單獨登入測試的 `body` first 仍不是每輪 shell，但新角色測試補了 overflow；繁中只量 overflow，未逐個重驗44和 More 所有目的頁。不是全部表單、長繁中、large/high contrast、keyboard、safe area。 |
| 下一堂關聯 | 73–125 等 workspace200，再核實實際 lesson date/period/subject；另筆 Confirmed 不应混入卡。 | 126–130 仍 `if(paired)` 才點 detail，且 click 未限制於 card、未核 GET request ID；該 seed 下下一堂無 paired 時，不能宣稱 linked-detail 分支通過。原錯配修復另有程式與根 GUI 證據。 |
| conflicts500→重試 | 135–164 保留欄位，真正等待 conflicts200，error 消失且 submit enabled。 | 原 R03 只點 retry／拍圖的弱斷言已補；尚非所有冲堂／逆序回應的驗證。 |
| Detail state／401 | 296–322 先填 FIRST-NOTE，開另一 Pending 確認空值；profile401 回可登入畫面。 | 不涵蓋全部401 caller、teacherNotes raw payload、通知跨週500、Users slow PATCH。 |
| 截圖 | 05 是390首頁收合guide，06 是刻意展開安裝guide；07老師768、08手機Detail、04繁中admin1440。 | 原「05/06同狀態」已修；guide展開不能誤認預設占首頁。圖片不代替互動與裝置驗證。 |
| PWA | 獨立 built spec 真 controller＋登入後 workspace/detail＋真正 setOffline/reload＋双語頁＋重連；離線 Profile 寫入沒有假成功、重連後沒持久化。 | 詳見PWA報告。桌機 Chromium，不是 iPhone／Android 已安裝。正常兩版本更新／Profile dirty 另由根 Cua 補真實證據；busy缺口未測。 |

固定 CI [.github/workflows/ci.yml:25](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.github/workflows/ci.yml:25) 依序跑 dev、built E2E；兩 config retries0，沒有 skip／only，舊合成 offline 測試改成獨立真 built case是證據改善。`test:e2e:built` 先 build，測試不用复用既有服務。根本地9測通過與 CI 指令對齊；尚未宣稱遠端 GitHub CI 已成功。

R04 結果：F02/F03/F04 原列缺陷 closure；F01只留下跨週通知訊息。PWA正常離線／更新已獲實證，mutation busy guard仍需小幅修補。R05已接手這兩個路徑，本報告不判定 R05 或宣布整體已可發布。
