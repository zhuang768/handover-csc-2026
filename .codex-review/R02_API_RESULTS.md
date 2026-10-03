# R02 獨立後端複驗結果

日期：2026-10-04，Asia/Taipei。驗收產品 commit：`73d32c1ee1a5d764d0dcf8b755b60c0de6eb808a`；工作區 HEAD：`1f1fe7704f92cdc14dd6a819aedeacec909a2f2c`。使用 Node `v26.3.0`，新 process 載入 stable `handleApi`，無 runtime crypto polyfill。未修改產品、未操作 Cursor、未推送或部署。

**本輪未通過後端驗收。** R01 四項已知缺陷的指定重現均通過；另外確認 seed 失敗後無法恢復、平行首請求回 409、失敗轉換仍寫成功事件，以及衝堂檢查後目標被占用仍可送出四項問題。9 個 Node fail 包含一個父案例與四個 child，不能當成 9 個不同根因。

## 實際命令與計數

所有 shell 命令的工作目錄均為 `/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon`。

| 執行 | exit | 結果 |
| --- | --- | --- |
| `node --experimental-strip-types --test .codex-review/independent-api.test.mts`，新加 CAS／stale-submit 前的 28 top-level | 1 | Node 合計 73：71 pass／2 fail／0 skip／0 cancelled；頂層 26 pass／2 fail |
| `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts` | 0 | 2／2 pass |
| `node --experimental-strip-types --test --test-name-pattern='losing transition replays\|injected mid-seed\|parallel first demo' .codex-review/independent-api.test.mts` | 1 | 首次診斷跑，7 fail；取消通知數的一項未有契約根據的預期已更正，見誤報核對 |
| `node --experimental-strip-types --test --test-name-pattern='losing transition replays\|sequential rejected completion' .codex-review/independent-api.test.mts` | 1 | 6 fail：四種 CAS replay、父案例與順序重播；排除取消通知假設後仍全部確認失敗 |
| `node --experimental-strip-types --test --test-name-pattern='submit atomically rechecks' .codex-review/independent-api.test.mts` | 1 | 1 fail，HTTP 200；預期有衝堂的最後寫入為 409 |
| **`node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts`**，最終完整套件 | **1** | **82：73 pass／9 fail／0 skip／0 cancelled**；其中 API 80：71 pass／9 fail，31 top-level 中 26 pass／5 fail；harness 2／2 pass |
| `node handover/node_modules/typescript/bin/tsc --noEmit --module ESNext --moduleResolution Bundler --target ES2022 --allowImportingTsExtensions --skipLibCheck --typeRoots handover/node_modules/@types --types node .codex-review/independent-api.test.mts .codex-review/review-d1.mts handover/node_modules/@cloudflare/workers-types/index.d.ts` | 0 | reviewer 檔型別檢查通過，擴充測試後再次執行 |
| `node --experimental-strip-types --input-type=module <<'NODE'`，獨立記憶體 adapter／migration probe（下方列出七項） | 0 | 7／7 pass |

R02 穩定產品交回後只在 reviewer 專屬檔補三組頂層回歸，沒有降低原 28 組標準、skip 失敗或改產品 fixture 權限。

## 已通過的修正與安全流程

- R01 method：34 個 GET／HEAD mutation 分支都沒有 table 寫入；submit／view 亦正確拒絕，不新增 receipt。baseline 在 seed 完成後建立，避免把初始化與 action 混淆。
- R01 accept／cancel：兩種起始順序都維持合法最終課表、狀態與時間軸；測試允許符合線性順序的兩個 HTTP 200。
- R01 接受重新檢查：Pending 後依法增加接課教師的另一班課堂，accept 409，未產生雙堂或改為 Confirmed。此 fixture 沒有停用 DB constraint／trigger。
- R01 取消原時段衝突：由第二筆真正 API move 占用原時段後，第一筆取消 409；原 Confirmed 與兩份課表保留。
- 私密 teacherNotes、reason、reasonCategory、教師補充與接課留言 marker 均不出現在 student workspace／detail／calendar 原始內容；授權教師仍能看到。
- 不完整草稿 PATCH 與 submit 的兩種競態均無不完整 Pending；合法 Completed 後再次 move／cancel 還原到立即前一次安排，沒有回最早 base_*；實際流程可用，0 skip。
- 七欄直接 submit 強制驗證、危險 URL、teacher-only 衝堂、跨班隔離、越權 mutation、跨 Origin、已登出／已過期／停用 session、密碼復原碼輪換及撤销舊 session 都通過。
- demo reset 撤銷舊 demo cookie，正常註冊教師／學生及 request、demo dependencies、todos、views、credentials、有效 session 保留。兩份普通 Draft 同時搶一個目標與同一 submit 重播均只有一次成功且無重複事件。

## 確認問題 A：[P1] Seed 中途失敗留下永久部分資料，重試不補建

**重現**：對全新、已跑全部 migration 的空庫，在 lessons BEFORE INSERT 用 SQLite `RAISE(ABORT)` 注入一次 seed 寫入故障。計數 function 確認 seed 真正到達 lessons 寫入，不是輸入驗證失敗。第一次 `POST /api/auth/demo` 失敗後，移除測試 trigger，再真正重試 teacher／student／admin 三角色。

**實際**：失敗後已留下 45 users、3 classes 與 `meta.seeded`；受改動 table 為 `classes, meta, users`。重試三角色均 HTTP 200，但最後仍 `users=45, lessons=0, requests=0`。一鍵登入成功不代表學校課表已建立。這不是僅 marker 殘留的推測，retry 已實跑。

**位置**：[service.ts:350](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:350) 的 `seedIfEmpty` 先用 user count 決定跳過；[service.ts:358](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:358) 在 seed 前寫完成 marker；[service.ts:369](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:369)、421、448、470、[service.ts:539](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:539) 是分段、逐筆寫入，沒有包在同一 D1 batch。

**回歸**：[independent-api.test.mts:760](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:760)。R02 修正 prompt 已明確要求 seed 可重跑、原子化，且不能破壞正常註冊者；不是新增未討論的產品政策。

**最小修正方向**：資料與完成標記須同交易落地，失敗整體 rollback；以完成／版本證據判斷完整度，不以有一筆 user 當成完成。請保留真實帳號及關聯，不能以自動清空所有 DB 換取測試通過。

## 確認問題 B：[P2] 空庫平行首次請求，七個失敗而非等待完整 Seed

**重現**：另一個全新已遷移空庫，確認 users／lessons 都為 0，同時釋放 8 個 teacher A／B、student、admin `POST /api/auth/demo`。

**實際**：一個 HTTP 200，另外七個 HTTP 409 `INVALID_STATE`。無巢狀 transaction，沒有 adapter 內 await 交錯批次。各請求都先看到空 count／不存在 marker，`INSERT meta('seeded')` 的 unique 衝突由全域 catch 轉 409。第一次普通 fixture login 是循序的，所以產品原本綠燈沒有覆盖這個情境。

**位置**：[service.ts:350](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:350)、[service.ts:358](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:358)、[service.ts:2534](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:2534)。回歸：[independent-api.test.mts:793](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:793)。

**最小修正方向**：首請求競爭可合併或安全等待／重試完整 seed；敗方應等待學校資料完成後提供所需角色，不能看到半套 seed。單 isolate 的記憶體 promise 不足以作為多 Worker 的唯一資料庫保護。此案例的要求是無故障下所有正常首次登入可用；A 則是故障後資料不可永久壞掉，兩項影響不同。

## 確認問題 C：[P1] CAS 敗方 HTTP 409，仍 commit 成功事件

**平行重現**：同一合法 request，各用兩個真正 API 操作做 accept／accept、decline／decline、cancel／cancel、complete／complete。只在 service 真正 batch 邊界設 barrier；SQL、constraint 與權限保持原樣。每種都是一個 200、一個 409 `INVALID_STATE`，最後狀態合法，卻多寫事件：

| 動作 | 新 timeline（應 1） | 新 audit（應 1） | 新 notifications |
| --- | --- | --- | --- |
| accept | 2 | 2 | 26（應 13：12 位該班學生＋原老師） |
| decline | 2 | 2 | 2（應 1） |
| cancel | 2 | 2 | 0（未另外要求取消通知） |
| complete | 2 | 2 | 0 |

**最簡單的順序重現**：建立過去課堂，Draft→Pending→Confirmed→Completed；第二次 `POST /api/requests/:id/status {status:'Completed'}` 回 409，仍修改 `audit_log`、`timeline`。沒有同步控制、未來課政策、Worker scheduling 等假設。timeline 會記錄敗方 comment 為一次成功完成。

**根因**：狀態 CAS 已正確限制本次 UPDATE，但後續 INSERT 只用 `EXISTS(request.status=終點狀態)`。前一個操作已達終點時，敗方 UPDATE changes=0，INSERT 仍成立。`db.batch` commit 完才根據 `meta.changes` 回傳 409，HTTP 錯誤不會回復已 commit 的成功事件。

**位置**：decline 的 [service.ts:1431](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1431)、1445、1451 與事後驗敗 1464；accept 的 [service.ts:1530](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1530)、1544、1550、1559 與 1572；Completed 的 [service.ts:1607](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1607)、1621 與 1634；Cancelled 的 [service.ts:1722](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1722)、1736 與 1749。

**回歸**：[independent-api.test.mts:820](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:820)、[independent-api.test.mts:861](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:861)。

**最小修正方向**：將事件／稽核／通知與「本次」CAS 成功綁定，例如交易內的唯一 transition token／revision；只看最終 status 不足。只在 batch 後讀 changes 再 throw 也不足，因為交易已 commit。若採 timestamp 作標记，要防同毫秒重播；不能以增加前端 busy 取代 DB 層保證。R02 prompt 已要求「只有成功合法轉換可產生事件」。

## 確認問題 D：[P1] 初次衝堂報告與 Pending batch 之間，已占用目標仍可成功送出

**重現**：同一教師、同一班兩堂合法課，透過 API 建兩筆 move Draft，目標為同一空時段。A submit 的初次 `conflictReport` 通過後，在真正 Pending transaction 尚未執行時暫停；B 透過正常 API submit→accept，正式將另一堂課移到目標且釋放 Pending locks；再用正常 `/conflicts` 確認班級已衝堂，最後放行 A 的原 batch。

**實際**：A HTTP 200、成為 Pending。它保留與 B 已確認課堂重疊的目標與 reservations。這不是「兩份 Pending 搶相同 slot-lock PK」；該原有案例已通過。B 已是正式 lesson，沒有 Pending locks 可觸發 PK 衝突。

**位置**：[service.ts:1334](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1334) 是交易前的 report；[service.ts:1341](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1341) 的條件只檢查 Draft 狀態與七欄完整度；[service.ts:1361](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1361)、1367 的 INSERT 只檢查 Pending。migration 沒有 cross-table lesson／reservation guard。

**回歸**：[independent-api.test.mts:876](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:876)。fixture 初始課表合法；B 的改課／確認全由實際 API 完成，沒直接改 request／lesson 模擬競爭。barrier 不放寬 SQL；它只選擇可在 Worker 請求間出現的一種合法交錯。

**最小修正方向**：Pending CAS 與 reservations 必須在同一原子操作內用當前資料重新檢查 lesson 的班級／教師占用及目前來源安排。若有衝突，保留 Draft、回 409、无 locks／submitted event。注意現有 UPDATE changes=0 分支一律把 Draft 解釋為 INCOMPLETE_HANDOVER；新增衝堂 guard 後也須分辨完整手續但衝堂的 409，不能回 422 且缺項為空陣列。

**影響界線**：本測試確認的是不合法 Pending／reservation 與通知，沒有宣稱 A accept 也能穿過本輪已修的接受防線、或已產生兩份最終正式課堂。

## Migration、constraint 與 adapter 證據

穩定版本的 SQL inventory **只有 `0000_init.sql`**。review-d1 的 discovered inventory、`appliedMigrations`、Drizzle journal entry `0000_init` 三者一致；沒有 0001 被 harness 漏讀。全檔 SQLite `exec`，不按分號切割，若日後新增 trigger body 也會完整讀取。

實際 SQLite guards：

- `lessons_one_teacher_slot` unique index（migration line 40）；衝突時原始 UNIQUE 錯誤往外拋，整批已測 rollback。
- `lessons_class_slot` 是普通 index（line 39），不是 unique。
- `open_request_per_lesson` partial unique index（line 79）。
- `slot_locks` 的 `(scope, scope_id, date, period)` primary key（line 95）；已測整批衝突 rollback。
- `users_email_unique`、sessions／auth_attempts／requests 普通查詢 indexes。
- `sqlite_schema` 沒有 product triggers；不存在「trigger 已安全拒絕 reviewer fixture 卻誤判 API bug」的情形。
- `PRAGMA foreign_keys=1`；目前產品表沒有 declared FK。這是模型觀察，不另憑空新增 FK 缺失的 release failure。

單一 0000 的數量本身不是缺陷：目前 schema／journal 的完整度已有改善。本輪實際漏洞是 D 的跨表最後衝堂防線，不以原先規劃檔名 0001 沒出現當作獨立錯誤。

實跑七項純 adapter probe：完整 inventory／journal一致、`RAISE(ABORT)`、`RAISE(ROLLBACK)`、CAS row metadata 1→0、FK 錯誤 rollback、actual lesson teacher unique rollback、actual slot-lock PK rollback，全部通過。RAISE 原始 errcode 1811／message 未被二次 rollback 蓋掉；每次失敗後連線可繼續使用。Node batch 同步執行所有 statements，兩個呼叫不能巢狀 BEGIN。

## 誤報／假設核對

1. **未来 Completed**：政策仍允許提前完成，advisory 通過且寫 diagnostic。原始需求未明確要求日期 gate，沒有拿它當阻擋。順序 Completed replay 使用過去課堂，與這項政策完全無關。
2. **合法 accept→cancel**：可以兩個 200，本測試驗最終資料符合合法順序，沒有硬規定只一個成功。
3. **同 owner 的後續 Completed move**：產品確實允許，測試實跑完成後再移課／取消，通過且沒有 skip。未設想跨教師無授權操作。
4. **補充內容公開規則**：用正式 `{text}` 契約與已記錄 teacher-only 政策，不臆造 visibility 欄位；學生隱私用 raw JSON marker，沒有因前端不渲染就當成安全。
5. **取消通知錯誤預期**：最初新增 replay 診斷試跑時，曾把 cancel 預期 notifications 設為 12；此項沒有本測試契約依據，已移除，改為 0。同一取消 replay 仍確認 timeline=2、audit=2，故 C 不依賴這項誤報。沒有降低單次成功事件需為 1 的要求。
6. **故障注入合理性**：只有 reviewer BEFORE INSERT trigger；負向控制觀察確有命中。全套正常 seed／普通業務 71 個 API 計數通過；不是所有 runtime 都壞掉的假故障。SQLite ABORT 若在 D1 batch 内应整批 rollback，而 stable seed SQL 在 batch 外逐筆 commit，正是 A 的問題。
7. **D 的交錯合理性**：未停用任何 DB guard、未修改 B 的 request state；A 的初次報告與最後 batch 分開存在，D1 交易邊界外的其他請求可完成。不是假造同交易內 SQL 交错。被驗的是 API 契約已有的「conflict checks and reservation enforced atomically」。
8. **Runtime 限制**：本報告僅 Node SQLite 注入驗收；不代替 actual Worker／D1 上的部署證據。沒有對 PBKDF2 120k 宣稱已證實限制，也未用 Node polyfill 隱藏 timingSafeEqual 差異。根代理另負責 Worker smoke／瀏覽器／build。

本輪產品檔案均未修改；只擴充專屬 reviewer cases、保留更清楚的 seed retry 診斷並建立本報告。後續需在下一個穩定產品版本重跑完整 suite 與 Worker，不能將目前結果標記全部 pass。
