# R04 獨立後端複驗結果

日期：2026-10-04，Asia/Taipei；最後固定版本／clean 檢查為 **2026-10-03 18:02:41 UTC**（臺北 2026-10-04 02:02:41）。

**最新正式套件 85／85 通過，原 82 計數未倒退；真正歷史資料升級 probe 仍確認一項 P1 及一項 P2，因此本輪不給完整後端通過判定。** R05 開始施工後停止產品測試，本報告只對下列固定 R04 候選有效。

## 固定版本與乾淨證據

| 項目 | 開始與結束證據 |
| --- | --- |
| 產品候選 SHA | `6b7b7cd734e9af06785d7f854d75dc8f3a160c6f` |
| 實際 HEAD | `7e76a4a1cdccec8b212a6ad7e0b674e425dbdfb8` |
| `HEAD:handover` | `ebbe56dda33a1547d67f17367bc067fe7a6eb2ab`，均一致 |
| `HEAD:.github` | `8d22cea03b2477eacf2e811c5e0a99d1578df288`，均一致 |
| `git status --porcelain=v1 -- handover .github` | 無輸出，exit 0 |
| `git diff --name-only 6b7b7cd734e9af06785d7f854d75dc8f3a160c6f -- handover .github` | 無輸出，exit 0 |

本代理沒有改產品、CI、他人測試斷言、85-case suite、adapter、GUI、服務或外部資料。只保存本報告、歷史 probe 的 reviewer 腳本及其已執行結果。根代理另跑產品格式、型別、lint、build、E2E 與 Worker，本報告不冒稱那些檢查由本代理執行。

## 實際命令與結果

工作目錄：`/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon`；Node `v26.3.0`。

| 命令 | exit | 實際結果 |
| --- | --- | --- |
| `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts` | **0** | **85 tests／85 pass／0 fail／0 skip／0 cancelled**；1175.370916 ms |
| 三個真正歷史 probe，`node --experimental-strip-types --input-type=module <<'NODE'` | **1** | **3 tests／1 pass／2 fail／0 skip／0 cancelled**；140.757875 ms |
| reviewer `tsc --noEmit`，指令如下 | 0 | 既有 API suite／adapter 型別通過 |
| stdin Node migration inventory／journal／snapshot／實際 SQLite index 與 PK probe | 0 | 0000、0001 完整載入；token 與 snapshot chain、teacher unique、slot lock composite PK 一致 |
| 保存的 `historical-upgrade-probe.mts` 同參數 `tsc --noEmit` | 0 | 腳本型別通過；R05 moving tree 沒有執行產品 probe |

```sh
node handover/node_modules/typescript/bin/tsc --noEmit --module ESNext --moduleResolution Bundler --target ES2022 --allowImportingTsExtensions --skipLibCheck --typeRoots handover/node_modules/@types --types node .codex-review/independent-api.test.mts .codex-review/review-d1.mts handover/node_modules/@cloudflare/workers-types/index.d.ts
```

正式 85 計數是 API 83（34 top-level＋49 child）及 harness 2。第 925 行完整舊庫、第 948 行零 lesson 局部舊庫、第 979 行 edited preservation 的完整與局部兩階段都實際執行通過，沒有停在第一階段、skip 或放寬斷言。

## 原問題回歸與 SQL 核對

原 R01 wrong-method 34 個 GET／HEAD child cases 均無任何 table 寫入（包括 view receipt）；accept／cancel 兩種順序、取消時原時段被合法占用、接受前新增教師衝堂皆通過。原 R02 空庫真正 seed 故障後重試、8 個平行首登入、CAS 敗方 timeline／audit／notification 無副作用、stale submit recheck 真正 lessons 與 locks 原子、PATCH／submit 不完整競態、學生原始 JSON 私密 marker、後續 move 取消回前一次安排亦全通過。session／recovery／跨班／Origin／demo reset 保普通帳號與其依賴、todo／view 等既有驗收全綠。

全 SQL inventory、adapter `appliedMigrations`、journal 一致為 `0000_init.sql`、`0001_opposite_kree.sql`；R04 沒有新增 migration。0001 真 ALTER nullable TEXT `requests.transition_token`，snapshot.prevId 接 0000；實際 `lessons_one_teacher_slot` 為 unique，`slot_locks` 的 `(scope,scope_id,date,period)` 是 composite PK。Adapter 同步交易、rollback 原錯誤與 CAS metadata 邏輯未修改，正式 harness 2／2 通過；沒有只手動載 0000 的假綠。

## [P1] 真正舊庫已有一堂課時，缺失 demo 資料被永久誤標完整

重現使用 **真正 R02 SHA `73d32c1ee1a5d764d0dcf8b755b60c0de6eb808a` 的 service、0000、time**，沒有任意改 marker：SQLite `BEFORE INSERT ON lessons` trigger 在第 2 次 INSERT 回 `RAISE(ABORT, ...)`。R02 首個 demo 請求 HTTP **500**、counter **2**，留下 `seeded=1`、**3 classes／45 users／1 lesson／0 requests**。解除 fault 後透過 R02 正常教師註冊，舊 session `GET /auth/me` **200**，users **46**。執行現行真正 0001，再呼叫真正 R04 handler。

R04 原 session `GET /auth/me` **200**、普通 user 全欄位（含 credentials）與 session fingerprint 完全保留，卻仍是 **3 classes／46 users／1 lesson／0 requests**，並写 `seed_complete=1`。期待 120 lessons 的 assertion 得到 1，確認 FAIL。故障在第 1 次 INSERT 的負對照則正確補至 120 lessons／7 requests，PASS；問題只針對已部分寫入 lessons 的有效舊庫。

精確根因：[service.ts:418](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:418) 只看 `lessons>0 && demoClasses>=3`，在 419 寫完成 marker、420 return；[service.ts:361](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:361) 後續又以 marker＋任何一筆 lesson 視為 ready，失去重試補齊機會。舊 R02 service 的 350–359 原本逐筆 seed，該狀態能由真正故障產生。

這是 [CURSOR_REPAIR_R04.md:17](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/CURSOR_REPAIR_R04.md:17) 已要求的「完整先驗完整，部分補齊缺失關聯」，不是新增產品需求。最小修正是依確定 demo record／必要關聯判完整；部分資料只插缺失 rows，修復及完成 marker 同 batch。保留既有改過的 row、帳號／session／普通資料，不能 reset 或把任何一堂課視為完整。本輪沒有驗證更晚的 request INSERT fault，不宣稱其具體結果。

## [P2] 完整舊庫的已知 demo 教材 stub 未修復

真正完整 R02 seed 的已知 `demo-request-confirmed` 材料是 `{title:"Practice worksheet",url:"https://example.org/worksheet"}`，來源為歷史 service **570**。另透過真正舊 API 建立普通教師自己的 Draft，其 **相同 URL** 搭配不同自由自訂標題，`is_demo=0`。

升 R04 後普通 session **200**，**3 classes／46 users／121 lessons／8 requests** 與升級前一致，普通帳戶／session 與自訂 request 全 row 保留；但已知 demo 模板同一 stub 仍存在 **1** 筆，期待 0 得到 1，FAIL。

新 seed 已在 [service.ts:646](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:646) 改為 `/worksheets/class-practice.txt`，完整舊庫卻於 418–420 直接 return，沒有窄範圍的既有模板修復。[CURSOR_REPAIR_R03.md:30](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/CURSOR_REPAIR_R03.md:30) 明確要求「seed/reset 和已有 demo stub」都用可讀自有教材。

最小修正僅識別已知 demo IDs＋原 default material title／URL（或等價 seed 版本條件），替換該材料並保留其他 handover 欄位；不要批次改所有 example.org URL，不改普通或 demo 教師自由自訂材料。正式 85 edited preservation 的教材本來已是新版 URL，因此其全 row 保留 green 不證明舊 stub 已修。

## 可重跑證據與誤報稽核

- 已執行三個歷史 probe 的完整摘要／診斷：[R04_HISTORICAL_PROBE_OUTPUT.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/R04_HISTORICAL_PROBE_OUTPUT.md)。保存的可執行版：[historical-upgrade-probe.mts](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/historical-upgrade-probe.mts)，下一固定候選以 `REVIEW_APP_TREE=<固定tree> node --experimental-strip-types --test .codex-review/historical-upgrade-probe.mts` 執行。它不增加 85 suite 計數；產品 moving 後未執行此存檔版。
- 完整舊庫普通 session 200 與零課堂局部修復确實已通過；不重列 R03 所有舊庫 409 為目前缺陷，也不稱 credentials／session 被刪除。
- 第二堂課故障是同一有效歷史 seed 中斷情境，使用真正旧 API、真正 migration、真正 SQL fault；不是任意設壞 marker 或測試繞過 API 權限。
- 材料 fail 只指已知原模板 stub；普通教師相同 external URL 的自訂材料已證明保留，不把所有外部 URL 當違規。
- 一次 inventory probe 原先誤用 reviewer 假設名稱 `lessons_teacher_slot_unique`／`slot_key`，exit 1；查看實際 migration 後改為真實 `lessons_one_teacher_slot`／composite PK，exit 0。這是 reviewer lookup 錯誤，不是 schema defect，未改產品或既有斷言。
- 一次唯讀 rg 用錯 docs 子目錄，exit 2；改讀真實根層 HANDOFF／DECISIONS 後確認，未把不存在的自造路徑列為產品問題。
- 未來 Completed 時機仍僅 advisory；接受／取消合法雙成功仍被允許。不追加未約定規則、依賴、遠端操作或 crypto polyfill。

截至最後固定檢查產品與 CI clean、tree 符合候選。後續 R05 版本不得沿用本輪判定，應重跑既有 85 與獨立三個歷史 probes。
