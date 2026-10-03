# R02 後端複驗準備

日期：2026-10-04，Asia/Taipei。Cursor 仍在 R02／R02B 施工；本輪沒有載入產品 service、執行正式 API 驗收或修改產品。

## 唯讀施工觀察

- 本輪兩次檔案清單中，`drizzle/0001_slot_guards.sql` 尚未出現，實際只有 `0000_init.sql`、`meta/0000_snapshot.json` 與 `_journal.json`。這是施工中的待確認產物，不判定最終缺陷，也不宣稱已驗證 0001。
- 現有 schema／migration 已有 `lessons_one_teacher_slot` unique index。service 施工差異包含 action POST method guard、學生 reason 去除、conditional Draft PATCH／submit、接受與取消的 SQL batch 與還原 snapshot。僅記錄修正方向，不以未完成版本判斷通過或失敗。
- 正式複驗前，須確認 Cursor 交回的穩定 HEAD、完整 migration 清單與 guard／trigger 名稱，再評估是否所有 planned guards 已實際落盤。

## Harness 現況與實際修正

`review-d1.mts` 原本就使用 `readdirSync(...).filter(name => name.endsWith('.sql')).sort()`，逐檔以 SQLite `connection.exec` 執行，**不是只載入手寫 0000**。不切割分號，因此完整 `CREATE TRIGGER ... BEGIN ...; ... END;` 可以按 SQLite 正常語法執行。D1 batch 內所有 SQL 同步在一個交易內執行。

本輪只改 reviewer adapter：

1. 回傳唯讀 `appliedMigrations`，每一項只在 SQL 完整執行成功後加入。正式複驗可直接核對 0001 是否真的執行，不依賴手動宣稱。
2. 修正一個已重現的錯誤遮蔽：SQLite trigger 的 `RAISE(ROLLBACK)` 已經結束交易，原 catch 再執行 ROLLBACK，會把原本 errcode 1811 的 guard error 蓋成 errcode 1 的 `cannot rollback - no transaction is active`。現在交易已結束時不重複 rollback；其他 rollback 的次要錯誤不取代原始 SQL 失敗。沒有吞掉 constraint、放寬 schema 或弱化 assertion。

## 已實際執行的純 Adapter 自測

- 既有 `reviewer-harness.test.mts`：2／2 通過。平行 batch 不出現巢狀 BEGIN；後續 UNIQUE 失敗整批回復。
- 另外 5 個記憶體 probe：5／5 通過。
  - `appliedMigrations` 等於當次發現的全部 SQL 檔。本次實際輸出為 `0000_init.sql`。
  - `RAISE(ABORT)` 保留原始 guard message／1811，回復之前的寫入，連線仍可使用。
  - `RAISE(ROLLBACK)` 保留原始 guard message／1811，回復之前的寫入，連線仍可使用。
  - conditional UPDATE 不命中時 `meta.changes = 0`，不捏造成功。
  - foreign key 已啟用；FK 失敗往外拋出，前一筆寫入也回復。
- reviewer adapter 與獨立 API 測試檔的 TypeScript `--noEmit` 檢查 exit 0。

這些自測沒有呼叫 `handleApi`，沒有測試施工中的功能，也不能取代 Worker／正式 D1 驗收。

## 穩定版本交回後的執行計畫

1. **Migration 證據**：在新 Node process 建立全新記憶體 DB，列出 `appliedMigrations`，確認包含全部正式 SQL（含 0001）。從 `sqlite_schema` 列出實際 indexes／triggers，核對 SQL 本體與 snapshot／journal 的一致性。初始化用全部 migration，不用 SCHEMA_SQL 或手動跳過 guard。
2. **Guard 行為**：以合法基礎資料逐一觸發實際 unique index／trigger，確認錯誤沒有被 adapter 蓋掉，整批回復、連線可繼續使用，且沒有失敗操作的 timeline／notification。先確認 fixture 在目前 guard 下合法；若 guard 已阻止不合法的課表變更，不停用 trigger 來硬造衝突，也不把 setup 的正確拒絕誤列成 API 缺陷。
3. **正式 API 套件**：再跑完整 `independent-api.test.mts`。包含 R01 method／並行取消／原時段占用／重新檢查，以及 R02 private reason／supplement／PATCH-submit race／前一安排還原。使用新 process，避免沿用施工前快取的 service module。
4. **Seed 空庫與故障恢復**：執行本輪新增的兩個 R02 案例，不能只在已 seed 的 fixture 測 demo login。
5. **誠實報告**：記錄穩定 HEAD、指令 exit code、含父／子案例的實際計數、advisory／unsupported，區分 harness 問題、fixture 不合法與真正產品問題。若 schema／trigger 在 Node 與 Worker 行為不同，再由根代理的真實 Worker／D1 測試核對，不偽造 polyfill 或將 Node 結果當部署證據。

## 本輪新增 Seed 回歸（尚未執行）

### 故障後真正重試

從已執行全部 migration 的空庫開始；在 `lessons` 的 BEFORE INSERT 測試 trigger 注入 `RAISE(ABORT)`，透過 SQLite function 計數確定真的中斷 seed SQL。第一次 demo 請求應失敗，資料與 seed claim 必須全部回復。移除測試 trigger 後，**先真正重試三角色 demo API，再檢查失敗後 snapshot**，避免測試只宣稱可恢復而沒真的重試。

重建完整度檢查：3 班、8 位老師、36 位學生、1 位 admin、兩週課表、六個 request 狀態、兩位 demo 老師均可登入；lessons／requests／sessions／notifications／timeline／supplements／todos／views／slot_locks 沒有孤兒關聯，班級及老師沒有重複節次。

### 空庫平行首請求

再次從獨立空庫開始，同時釋放 8 個 teacher A／teacher B／student／admin demo 請求。每個請求都應取得正確角色的有效 session，學校資料必須是同一份完整 seed。後續再次一鍵登入不能重複新增或重置 users／lessons／requests。負向控制先確認 users、lessons 真的是 0，不能重用已 seed 的普通 fixture。

獨立 API 套件目前共 28 組頂層案例。這兩個新案例與其他 R02 API 案例均**尚未執行**；目前只通過 reviewer 檔靜態型別檢查。
