# R05 後端修補與 source 驗證

日期：2026-10-04（臺北）；owned source 最終於 **2026-10-03 18:33:52 UTC** 釋放。Cursor 額度用盡並已停止後，根代理明確授權 Codex 接手可逆 R05 後端修補；本代理未變更 Cursor 設定。初版釋放後，獨立審查確認 partial school 已改 sample lesson 的保留邊界，根代理授權 focused 修正，最終 blob 以下表為準。

## 改動範圍

僅兩個產品檔案，未 commit、push、部署、重置共享 DB 或操作服務／GUI：

| 檔案 | 釋放 blob SHA |
| --- | --- |
| `handover/server/service.ts` | `145faf7f27e82e44f2e56ea44e4ca33993c47932` |
| `handover/tests/api.test.ts` | `a43383679244dae8ea2171f682e3e486695d8b13` |

Source 釋放後停止寫產品；其他代理負責前端、E2E 與文件。本報告為修補工作紀錄，**尚非整合固定 SHA 的最終獨立 verdict**。

## 修正行為

- 加 `meta.seed_revision=2` 的一次性修復標記。R04 曾把只有一堂課的舊庫寫 `seed_complete=1`，現在仍會走 missing-data repair；新完成標記與全部缺項資料同一 D1 batch，故障不留半套修補。
- 從既有 demo lesson ID 的原日期推回當初種課週次，合法移課不改 ID，升級不會憑新本週重建另一份舊庫。只補缺少 classes／users／lesson；lesson 的 `WHERE NOT EXISTS(id)` 避免重新 INSERT 已被合法移動的 row，再由 `ON CONFLICT(id) DO NOTHING` 防 concurrent 同 ID。真正其他 teacher slot 衝突仍會 rollback，不以寬泛 ignore 吞掉。
- 既有 request IDs 整份跳過，不重播其課表／timeline／通知／locks，不動已修改 handover、supplement、todo 或 view。Missing sample request 取得本次新 UUID token，其初始副作用以 `id AND transition_token` 在同 batch gating，並行 caller 的敗方不重複寫成功事件或回復勝方已成立安排。
- Missing sample 的來源 lesson 若已偏離原 seed baseline，保留其現有 teacher／date／period／room，補入 inactive `Cancelled` 示範 request，original／target snapshot 都取真正現有安排；不製造假的 confirmed／completed 事件、學生改課通知或 locks，也不重播模板覆寫已成立課堂。未修改的 missing lesson／sample 仍建立原 default states。
- 材料修復只對已知七個 seed sample IDs、`is_demo=1`、精確原 `Practice worksheet`＋`https://example.org/worksheet`、只有原 `title/url` 欄位的 material item 生效。替換成已提供的 `/worksheets/class-practice.txt`，保留其他交接欄位／教材。UPDATE 以原 `handover_json` CAS 防止重寫同時修改；普通教師的相同 title／URL及 demo 教師已改 title 都保留。升級標記讓修復冪等。

使用 workers-best-practices，已查閱 [D1 batch 官方文件](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch) 與 [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)；沒有加套件、外部服務、migration DDL 或 auth／permissions 變更。D1 transaction 採既有 prepared SQL＋batch 模式。

## 產品回歸

新增兩個 focused top-level API cases，產品 API 24→26 計數；reviewer suite 保持 85：

1. **一 lesson 舊庫原子補齊與成立安排保留**：第一階段包含 R04 假完成 marker、edited demo profile／retained room、正常註冊帳戶與有效 session。真正 SQLite missing-lesson INSERT 故障後要求整批資料與修復 marker rollback；解除 fault 後四個平行 caller 都 200，完整三班／45 demo＋1 real users／120 lessons／7 samples、14 timeline／14 notifications／4 locks，无重複效果，credentials/session／既有 row 保留；再呼叫冪等。同一 top-level 的第二階段保留最初 20 lessons、missing sample 全無，以真正 teacher API 完成 move→submit→accept→Completed→supplement；改日期一週、節次及教室後才觸發 legacy repair。要求原 20 lesson 全 row、真正 request／timeline／supplement／notifications 不變；missing confirmed 模板補为 Cancelled、original／target snapshot 對應已成立安排，無假的成功事件／locks，完整 120 lessons／7 demo＋1 established requests。
2. **教材精準修復**：known demo 原模板教材替換；同 handover 其他自由教材、progress／private notes 保留。普通真註冊教師透過真正 API 自建 Draft，刻意用相同 default title／URL，也保留全 row。另一 known demo 改 title 的教材保留全 row；再次呼叫不寫資料。credentials／session 未輸出且保持不變。

## 實跑命令

| 命令 | exit | 結果 |
| --- | --- | --- |
| `node --experimental-strip-types --test --test-name-pattern='one-lesson legacy school' tests/api.test.ts`，補產品 preservation 斷言、修 source 前負對照 | **1** | **1 fail**；原修法把真正成立安排的 teacher0→1、period5→4、roomEstablished→A201，確認具體覆寫，不是推測 |
| `node --experimental-strip-types --test tests/api.test.ts`（handover 根目錄，最終 focused 修正／格式後） | **0** | **26／26 pass，0 fail／skip／cancelled**，390.505458 ms |
| `node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts`（repo 根，最終 focused 修正後） | **0** | **85／85 pass，0 fail／skip／cancelled**，1414.662 ms；既有斷言未改 |
| `node node_modules/prettier/bin/prettier.cjs --check server/service.ts tests/api.test.ts` | 0 | owned files 格式通過 |
| `node node_modules/eslint/bin/eslint.js server/service.ts tests/api.test.ts` | 0 | owned files lint 通過 |
| 下列 targeted `tsc --noEmit` | 0 | owned backend/API tests 型別通過 |
| `git diff --check -- handover/server/service.ts handover/tests/api.test.ts` | 0 | 無 whitespace error |

```sh
node handover/node_modules/typescript/bin/tsc --noEmit --module ESNext --moduleResolution Bundler --target ES2022 --allowImportingTsExtensions --skipLibCheck --typeRoots handover/node_modules/@types --types node handover/server/service.ts handover/tests/api.test.ts handover/node_modules/@cloudflare/workers-types/index.d.ts
```

最終 focused 修正之後 26 API、85 suite、owned format／lint／types 都已再跑全綠，無新增 reviewer counts。根代理會整合 frontend／docs 並執行全套格式、lint、型別、build、E2E、Worker，以及固定 tree 的 reviewer suite；不沿用本輪 working source 作正式發布 verdict。

## Snapshot 至 batch 之間的正常 API 並行保護

根代理與本代理都核對真正 `handleApi`：在任何路由／session 或業務 mutation 前先 `await seedIfEmpty(db)`。因此沒有新 API 路由可以跳過 readiness repair 先改 lesson。

若 B 在 A 收集 legacy snapshot 後先完成 repair，B 的單一 batch 已建立同一 known sample IDs、B 唯一 token 與 completion／revision，然後才能開始自己的合法 mutation。A 的 batch 即使更晚送出，其 request `WHERE NOT EXISTS(id)` 不會插入勝方已存在的 sample；A 的 lesson／timeline／notify SQL 用 A 唯一 token gating，全部零效果。B 後續合法改 lesson 或旋轉 request token，也不會變成 A 的 token。若 B 開頭已 schoolReady，代表某修補 batch 之前已完成，A 同樣是 token 敗方。完整舊 sample 則在收集時就全部跳過。

因此沿用原子 batch、same sample ID 與唯一 token 即可保護這個已授權 current API 序列，沒有為假想外部 DB writer／混版本直接寫入新增 CAS 或新 gate。根代理明確指示保持已釋放 source，不擴 schema／auth／reviewer tests。

## 歷史 probe 邊界

保存的 [historical-upgrade-probe.mts](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/historical-upgrade-probe.mts) 仍是三個相同 probe、相同業務斷言，不增加 85 計數。最初存檔使用 TS parameter property，與 native strip 模式不相容；只把 Statement constructor 的參數屬性改成顯式 fields，沒有改 assertions／adapter semantics。根代理已確認此純執行格式修正合理。

歷史三 probe 尚待整合固定候選與乾淨 source：

```sh
REVIEW_APP_TREE=<固定HEAD:handover> node --experimental-strip-types --test .codex-review/historical-upgrade-probe.mts
```

本 report 不將它們未跑的新 source 結果宣稱通過。原 R04 stdin 的三個真歷史結果仍在 [R04_HISTORICAL_PROBE_OUTPUT.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/R04_HISTORICAL_PROBE_OUTPUT.md)（1 pass／2 fail），不能改成新 pass。
