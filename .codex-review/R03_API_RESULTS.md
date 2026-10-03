# R03 獨立後端複驗結果

日期：2026-10-04，Asia/Taipei。結束檢查時間：2026-10-04 01:05:54（2026-10-03 17:05:54 UTC）。

**原 R02 的 82 個 Node 計數全數通過；新增的既有資料庫升級驗收未通過，暫不能給完整後端通過判定。** 只確認一項新增相容性問題，包含完整舊庫與曾中斷的舊庫兩種有效情境。沒有把已修四項重新列為失敗，也沒有擴張未來 Completed 的產品規則。

## 候選版本與乾淨檢查

| 項目 | 證據 |
| --- | --- |
| 固定產品候選 commit | `f3fa696115a86f98995686b6bb934b90492133ab` |
| 呼叫測試時實際 HEAD | `b3753d7e35562359368978d23b902124732e0631` |
| b375 與 f3 差異 | 僅 `.codex-review/CURSOR_STATUS.json`，沒有產品或 CI 變動 |
| 開始 `HEAD:handover` | `911adb7043d89b7487b12b9bb3d06876457699a5` |
| 結束 `HEAD:handover` | 同上，符合固定 app tree |
| 候選及結束 `.github` tree | `0f1920ddb805942f2c4721686d5bb78392f6900a` |
| 開始／結束 `git status --porcelain=v1 -- handover .github` | 均無輸出，exit 0 |
| 結束 `git diff --name-only f3fa696115a86f98995686b6bb934b90492133ab -- handover .github` | 無輸出，exit 0 |

本代理沒有修改產品、瀏覽器、服務程序、Cursor、其他人的測試或外部應用；僅在專屬 independent suite 新增兩個升級案例，以及本報告。根代理另有產品檢查、E2E 與 Worker 證據，本報告不把那些結果當成自己執行。

## 實際命令、exit、計數

工作目錄：`/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon`；Node `v26.3.0`。每次正式 suite 都從新 process 載入 current service；沒有 crypto 或 D1 runtime polyfill。

| 執行 | exit | 結果 |
| --- | --- | --- |
| `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts`，補升級案例前原 82 計數 | **0** | **82 pass／0 fail／0 skip／0 cancelled**；API 80、harness 2 |
| `node --experimental-strip-types --test --test-name-pattern='existing complete R02 school' .codex-review/independent-api.test.mts` | 1 | 1 fail，既有完整學校＋真實註冊 session：409 `INVALID_STATE` |
| 同完整 suite 指令，補兩個有依據的升級案例後 | **1** | **84：82 pass／2 fail／0 skip／0 cancelled**；API 82（33 top-level 中 31 pass、2 fail），harness 2／2 pass |
| `node handover/node_modules/typescript/bin/tsc --noEmit --module ESNext --moduleResolution Bundler --target ES2022 --allowImportingTsExtensions --skipLibCheck --typeRoots handover/node_modules/@types --types node .codex-review/independent-api.test.mts .codex-review/review-d1.mts handover/node_modules/@cloudflare/workers-types/index.d.ts` | 0 | 補兩個升級案例後 reviewer 型別通過 |
| `node --experimental-strip-types --input-type=module <<'NODE'`，五個記憶體 migration／adapter probes | 0 | 5／5 pass：完整 inventory／journal／snapshot、真實 additive migration 保資料、ABORT、ROLLBACK、CAS metadata |
| 同 stdin Node 形式，真實 API transition-token rotation probe | 0 | 1／1 pass；五次成功轉換 token 都為不同 UUIDv4，失敗重播不改 token／timeline／audit |
| 同 stdin Node 形式，**真正 R02 service＋schema 建完整庫 → 真正 0001 → R03 service** | 1 | 1 fail：原 real session 200→409；46 users／120 lessons／7 requests 全保留，舊 marker `seeded=1` |
| 同 stdin Node 形式，**真正 R02 service seed fault → 正常註冊 → 0001 → R03** | 1 | 1 fail：故障控制命中一次；原 real session 200→409；3 classes／46 users／0 lessons／0 requests，real 帳號／credential／session 完全保留 |

stdin probes 不產生產品檔案或本機服務。歷史 service 以 `git show 73d32c1ee1a5d764d0dcf8b755b60c0de6eb808a:handover/server/service.ts` 讀取，再用 Node `stripTypeScriptTypes` 載入。runtime time.ts 在兩版本無差異。舊 DB 從同一 R02 commit 的真正 `0000_init.sql` 建立，升級實際執行 current `0001_opposite_kree.sql`；不是只用 fixture marker 推測相容性。

## R02 四項修正與原 R01 回歸

| 問題 | R03 實際驗證 |
| --- | --- |
| R02 seed 中途故障與真正重試 | 新空庫：故障已命中 lessons SQL；整體資料／marker 回復，移除 fault 後重新 seed 完整三角色、兩週與關聯，全通過 |
| R02 8 個平行首次登入 | 全部取得正確角色與有效 session；只有同一完整種子資料，後續登入不重建／重複，通過 |
| R02 CAS 敗方寫成功事件 | accept／decline／cancel／complete 重播均只有成功方的 timeline／audit／必要通知；普通順序 Completed 重播亦無寫入，通過 |
| R02 stale submit | A 初次 report 通過後，B 真正 API 移課接受占位；A 放行 batch 後 409，保留 Draft、無 locks／submitted，通過 |
| R01 GET／HEAD mutation | 34 child cases 全無 table 寫入，submit／view 不改狀態、不新增 receipt，通過 |
| R01 accept／cancel | 兩種起始順序最終狀態、課表、事件都符合合法順序；允許合法的雙 200，通過 |
| R01 late teacher conflict | Pending 期間合法加入接課教師別班課堂，accept 409 且 Pending／原安排保留，通過 |
| R01 cancelled restore collision | 第二筆真正 API move 占原時段後，取消第一筆 409，兩份已成立安排不被覆寫，通過 |

其餘原 suite：七欄強制驗證、危險 URL、teacher-only 衝堂、學生 raw payload 私密 marker、跨班／越權／Origin、失效 session、復原碼輪換、demo reset 保留真實帳戶／依賴／todo／view、完整 handover 鎖定／退回再送、PATCH-submit 不完整競態、Completed 後二次 move 回前一次 snapshot，均通過；沒有 skip。

## Migration 與 token 核對

實際 SQL inventory、adapter `appliedMigrations`、journal 都是：

1. `0000_init.sql`
2. `0001_opposite_kree.sql`

0001 真正 ALTER 新增 nullable TEXT `requests.transition_token`；current `db/schema.ts:88` 與 `meta/0001_snapshot.json` 一致，snapshot.prevId 正確連到 0000。從有 user／request 的 0000 DB 套用 0001，舊 row 值未被改掉，token 是 null。Adapter 未漏讀 0001、未手寫只跑 0000、未切分 trigger body；ABORT／ROLLBACK 原始 constraint 錯誤與 CAS zero-row metadata 都能真被測到。

- [service.ts:1388](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1388)、1489、1674 每次 transition 用新的 `crypto.randomUUID()`，不是同毫秒 timestamp。
- accept／decline／complete／cancel 的 CAS 更新寫本次 token，locks／成功事件／通知／audit 同 batch 用 `request.id AND transition_token=本次token`  gating。敗方無法因資料已達終點狀態就插入成功事件。
- 額外真 API probe 走 submit→decline→resubmit→accept→Completed，五個成功 token 不重複；Rejected Completed 保持最後 token、audit／timeline 不變。未要求資料庫增加不必要的全域 token unique index。
- [service.ts:1414](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1414)／1421 在 Pending UPDATE 內按 request **目前**欄位檢查正式 lessons 的 class／teacher 占用；同一 batch 插入只有贏方 token 可得的 class／teacher locks，其 PK 仍防不同 Pending 競爭。zero-row 且完整 handover 正確解釋為衝堂 409。
- 現在仍無 product trigger，class lesson index 仍普通；這本身不新增 release failure。已驗證 API 真正 batch guard 與 existing slot PK 能擋本輪全部合法競爭重現。

## 新確認問題：[P1] 舊 Seed Marker 升級會讓有效既有資料庫持續回 409

**共同根因**：[service.ts:352](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:352) `schoolReady` 只承認 `meta.seed_complete=1 AND lessons>0`。R02 的正規完整種庫與已重現的局部失敗種庫都寫 `meta.seeded=1`。0001 只加 token 欄位，沒有處理舊 marker／既有資料。R03 看到舊庫便在 [service.ts:396](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:396) 收集並重跑 seed，而 [service.ts:419](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:419) 對已存在 classes 作 plain INSERT，整個 batch constraint 失敗；catch 再讀同一不存在的 marker，繼續拋錯。handler 在 [service.ts:2278](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:2278) 於路由／session 判斷前做 seed，全域 catch 把 constraint 變成 409。

### 情境一：真正完整的 R02 庫

1. 從歷史 R02 schema／service 正常 demo seed。
2. 真正正常 teacher registration，原 `GET /auth/me` 200。
3. 執行真正 R03 0001，再交給真正 R03 handler。
4. 同 cookie `GET /auth/me` 409 `INVALID_STATE`。

before／after 都是 46 users、120 lessons、7 requests，marker `seeded=1`；沒有資料刪除，但現有服務入口不能使用。對共同入口的其他正常 API 也有同類風險，已實測證據是 auth/me。

持久回歸：[independent-api.test.mts:925](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:925)。這個常態 testcase 重建舊 marker 表示；上述真正歷史 service／schema probe 已確認 fixture 表示並非任意非法狀態。

### 情境二：已證明可能留下的局部 R02 庫

1. 從歷史 R02 0000 開始，第一次 lessons INSERT 的 reviewer trigger 故障；實際命中一次，HTTP 500。
2. R02 已 commit 3 classes／45 demo users／`seeded=1`，lessons／requests 都 0。
3. 移除 fault，使用 R02 真正正常 teacher registration。新 real 帳號與 session 可用，auth/me 200；這是舊服務允許的有效既有資料，不是手動塞一筆假的 user。
4. 執行 R03 0001，以 R03 auth/me 查原 real cookie，409。

最後仍 3 classes／46 users／0 lessons／0 requests。real user 全欄位（含 credential）與 session fingerprint 完全一致；沒有輸出 hash／token。它需要補建缺失 demo 資料，不能把 `seeded=1` 全部盲轉 `seed_complete=1`。

持久回歸：[independent-api.test.mts:948](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:948)。唯一新增的局部升級 case 先確認 3 班／45 demo users／0 lessons／0 requests，再檢查正常註冊帳戶與 sessions 保留、學校完整度／關聯恢復。

## 相容修正建議

可在初始化增加一個 focused legacy path，保留現在新空庫的 atomic batch：

1. **完整舊庫**：讀舊 `seeded` 標記並確認 demo 學校／既有課表／必要 sample records 與關聯已完成後，以小型原子操作補新 completion marker；保留所有現有 lesson 安排、request 狀態／歷史、真實帳號及資料。驗完整度要看 record 的存在與關聯，不要求已被使用者正常轉換的 sample 仍保持最初狀態。
2. **局部舊庫**：只補缺少的確定 demo IDs／lesson／sample records。existing demo classes／users 以保留現有 row 的 conflict handling 建立；不要重寫真實資料或 credential。累積修復 SQL 與新 completion marker 同一 batch，失敗整批 rollback，成功才稱 complete。
3. **競爭與真實資料**：沿用已通過的新多 caller transaction，若另一個 caller 已完成則安全重讀；不能以 `DELETE users/lessons/requests` 清空既有庫換取初始化成功，也不能把任何舊 marker 無條件視為完整。

這是資料版本相容性修正，無須擴張產品範圍。完整舊庫與局部舊庫應各有案例；下一輪先跑這兩項，再跑完整 **84** 計數與 real Worker。現有 fresh DB 的 82 pass 不可被解讀為升級已安全。

## 誤報與界線

- 新增案例由最新 readiness path 與真正歷史 R02 state 推導，根代理也明確要求局部舊庫；不是另訂 demo reset 或任意非法 marker 政策。
- 只有升級驗收 fail；新空庫 seed 故障重試與平行 caller 都已實際通過。不能把兩種 state 混成所有 seed 都壞。
- 沒有宣稱 DB 已刪帳號；目前 data／credentials／sessions 留存，問題是每次 readiness 重試會 constraint 409，服務被阻擋。
- 舊 service probe 的 stripTypeScriptTypes 是歷史 TS 載入工具，不是 crypto polyfill；current suite 用真正 native strip TS。
- Completed 提前允許僅 advisory；本輪沒有加時間門檻，也沒有要求接受取消競爭只能一個 200。
- 本代理沒有執行瀏覽器／外部 D1／遠端部署。根代理已提供 fresh built Worker smoke 通過，仍不能取代旧資料升級 smoke。

結束時產品與 `.github` 仍乾淨且 tree 符合候選；報告可保留上述具體判定。若產品後續改動，下一輪須以新固定 commit 重跑，不沿用本輪 verdict。
