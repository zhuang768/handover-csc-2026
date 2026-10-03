# R05 後端來源獨立 review

日期：2026-10-04（Asia/Taipei）。僅唯讀 service／產品 API test diff，未改 source、執行共享 API／moving tests、新增 suite／glob 或操作外部服務。

**Focused source review 通過：第一次找到的既有課堂覆寫已由 backend 局部修正，新 frozen blobs 前後一致；沒有新增具體來源缺陷。** 版本 marker、batch／token、原安排保留與窄 stub CAS 均已複查。這是來源判定，runtime／歷史資料升級／正式發布仍採 root 各自實跑的結果。

## 第一份凍結來源

- base product：`6b7b7cd734e9af06785d7f854d75dc8f3a160c6f`。
- service blob：`a80f03a850e4c1a081b65ebf700b8f5876ea92a4`。
- API test blob：`15ed4055ac5928d70467bb48d2434a8d7b3032b4`。
- backend 釋放時間：2026-10-03 18:20:32 UTC；起始 `git hash-object handover/server/service.ts handover/tests/api.test.ts` exit 0，兩個值吻合。
- 已逐段讀取與 base 的兩檔 diff；作者回報 API 26／26、85 suite 85／85 與局部格式／lint／types 成功，這些不是本 reviewer 執行的結果。三個 true historical probes 由 root 在最終版本 pin 後另驗，不混入 85 計數。

## 已核對的修法

1. `schoolReady` 同時要求 `seed_complete=1` 與 `seed_revision=2`，R04 的舊 completion marker 不再讓一堂課的局部舊庫直接 return。修補與兩個完成 marker 置於同一 D1 batch；失敗時不會只留下本版 completion marker。
2. 原 demo lesson IDs 帶不可變原 seed 日期，從最早有效日期推回原 Monday；不拿可能已被合法移動的 current lesson date 當 seed 起點。zero-lesson 情境才用 default Monday。
3. classes／users 只補缺資料；lesson `WHERE NOT EXISTS(id) ... ON CONFLICT(id) DO NOTHING` 不更新既有 row。它不會把 unique teacher-slot 錯誤像一般 OR IGNORE 一樣吞掉後假裝完成。
4. 已存在的 sample request ID 整個跳過，避免重播該 request 的 lesson 改動、timeline／notification／lock。read snapshot 後另有 caller 插入的 request，也由 INSERT 的 NOT EXISTS／ID conflict 保護。
5. 每次補樣本生成獨立 token，新 request 存入該 token；seed timeline、notification、Pending locks 與 Confirmed／Completed lesson side effects 都以同一 request ID＋token gate。競爭輸掉的 batch 不會套用 winner 的樣本 side effects。此 gate 保護併發插入，並不單獨證明 lesson 本身沒有既有使用者改動，見下項。
6. stub 修復僅限七個 known demo IDs＋`is_demo=1`＋原 default title／URL＋原兩個 material keys；只換那個 URL、保留整份 handover 其他欄位。UPDATE 再 CAS 原 `handover_json`，避免覆寫 read 後的新內容。ordinary request 即使同 title／URL 也不在此範圍；已改 title 或增加 metadata 的 demo material 保留。
7. 兩個新增產品案例涵蓋 one-lesson partial rollback／parallel repair／marker／account-session preservation，以及精確 demo stub／ordinary same URL／edited material／idempotency。直接注入的局部狀態是產品回歸 fixture，不能冒稱真 R02 service 故障產物；真歷史 probe 仍另列。

## 第一次來源問題：已修正

第一 frozen blob 的 [service.ts:905](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:905) 在新缺失 Confirmed／Completed sample 插入勝出後，UPDATE 該 lesson 的 teacher／date／period／room。WHERE 只有 lesson ID 與新 request token，沒有確認該 lesson 是本次剛補入或仍是原模板安排。

具體路徑：真正 R02 逐筆 seed 在 Class 7A Friday P4 Math lesson 之後、sample requests 之前中斷；舊 `seeded` marker 讓舊 API 仍可使用該既有課堂。教師透過另一筆合法 handover 修改該 lesson 安排，而 known `demo-request-confirmed` 仍缺失。R05 的 lesson INSERT 雖不覆寫既有 ID，稍後新 demo sample 勝出卻可把 room 等安排覆回模板（例如回到 A-201），與 R05「部分舊庫保留改過的 lesson」要求衝突。

第一次發現是 **source trace，未在本 reviewer 的 runtime 重現**；不能冒稱歷史 probe 已測這條路徑。當時作者新增 case 保留的是最早 Monday P1 lesson，不是此 Confirmed／Completed sample 的 lesson，故舊 green 不排除此分支。root 接受來源問題並授權 backend 局部修正；本 reviewer 沒有增加測試 gate 或修改 source。

## 新 frozen blobs 與局部複查

- service：`145faf7f27e82e44f2e56ea44e4ca33993c47932`。
- API test：`a43383679244dae8ea2171f682e3e486695d8b13`。
- 前後三次 `git hash-object handover/server/service.ts handover/tests/api.test.ts` 均 exit 0／值相同；其他代理的 frontend 變更不納入此兩檔 frozen review。
- [service.ts:758](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:758) 讀 existing demo lesson map；[service.ts:836](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:836) 比對 teacher／date／period／room 與 immutable seed 計畫。已有改動時，新補樣本改為 inactive `Cancelled`，original／target 快照採 current lesson，而不是聲稱新的確認。
- 因 side effects 依本次 `status` 分支，changed lesson 不會進 Pending locks／notifications 或 Confirmed／Completed lesson UPDATE。仍可補到完整 lesson inventory／missing sample IDs，保留真實已建立的 arrangement；已存在 request IDs 仍整份跳過。
- 產品 case 已擴充：20-lesson partial fixture、缺 known confirmed sample，以真正產品 API 建立 move→submit→accept→Completed→supplement；負對照明確斷言 date／period 已不同。升級後逐 row 保留 lessons、established request 與 timeline／supplement／notification，新的 known sample 為 Cancelled／current snapshot、沒有 active lock 或 submitted／confirmed／completed event。這是有真 API 操作的產品 fixture，仍不是 true historical R02 service probe。
- [service.ts:2441](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:2441) 的普通 API route 在任何正常 mutation 之前先 await `seedIfEmpty`。另一 repair 的敗方樣本 INSERT／side effects 仍受自己 token gate；不為未約定外部 DB writes 想像另設 release gate。

root 另明確回報最終本機整套：33 product tests、format／lint／types／build exit 0；85 independent suite exit 0／85 pass／0 skip；dev E2E 9／9 exit 0；built E2E 6／6 exit 0、offline direct 200／no Location；四個 session 的 built Worker lifecycle／privacy／todo／restore／logout preflight 通過。這些不是本 reviewer 執行的測試。

true historical 三 probes 要等 root commit／pin 後執行，沒有在本報告先寫通過；正式 HTTPS／GitHub CI／實體手機另驗。此局部 source review 沒有未關閉 finding，root 可整合兩份交付文件並 commit 已驗收產品。
