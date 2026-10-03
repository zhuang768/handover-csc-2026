# R04 真正歷史升級 probe 已執行輸出

候選產品：`6b7b7cd734e9af06785d7f854d75dc8f3a160c6f`；實際 HEAD `7e76a4a1cdccec8b212a6ad7e0b674e425dbdfb8`；app tree `ebbe56dda33a1547d67f17367bc067fe7a6eb2ab`。

這是本輪已執行的 stdin Node probe 結果紀錄，保留真實 diagnostic 與計數；不是後補腳本的新執行紀錄。原命令為 `node --experimental-strip-types --input-type=module <<'NODE'`，使用 `node:test`、真正 R02 service／0000、同步交易 SQLite D1 adapter、真正 current 0001／R04 handler。Exit **1**，**3 tests：1 pass／2 fail／0 skip／0 cancelled**，duration **140.757875 ms**。

## 完整舊庫＋普通帳號／自由自訂 URL：FAIL

普通教師用真正 R02 API 註冊，建立自己的合法 lesson，再由真正 API 建 Draft。該普通 request 的自訂教材刻意使用相同 external URL、不同自由自訂標題，`is_demo=0`。

```json
{"ordinarySession":200,"counts":{"classes":3,"users":46,"lessons":121,"requests":8},"customURLPreserved":true,"knownSeedMaterials":[{"title":"Practice worksheet","url":"https://example.org/worksheet"}],"remainingKnownStubs":1}
```

失敗 assertion：

```text
R03 required existing known demo stubs to be replaced with readable owned material; repairing only new seeds is insufficient
1 !== 0
```

舊／新普通 `auth/me` 都 200；普通 user 全欄位及 session fingerprint 相同，未輸出密碼或 hash。普通 Draft 全 row 相同（排除 additive `transition_token=null`），四個主要 table counts 相同。失敗僅指已知 `demo-request-confirmed` 的原模板材料。

## 第 1 次 lesson INSERT 真正故障：PASS

R02 demo 首請求 500，SQLite trigger counter 真正命中第 1 次 lesson INSERT；留下 seeded=1、3 classes／45 demo users／0 lessons／0 requests。解除 trigger 後正常註冊，R02 `auth/me` 200；執行真正 0001 後 R04 同 session 200，credentials/session 相同。

```json
{"actualFaultHit":1,"beforeLessons":0,"ordinarySession":200,"after":{"classes":3,"users":46,"lessons":120,"requests":7},"completionMarker":"1"}
```

## 第 2 次 lesson INSERT 真正故障：FAIL

R02 demo 首請求 500，SQLite trigger counter 真正命中第 2 次 lesson INSERT；第 1 筆已 commit。留下 seeded=1、3 classes／45 demo users／1 lesson／0 requests。解除 trigger 後正常註冊，R02 `auth/me` 200；執行真正 0001 後 R04 同 session 200，credentials/session 相同。

```json
{"actualFaultHit":2,"beforeLessons":1,"ordinarySession":200,"after":{"classes":3,"users":46,"lessons":1,"requests":0},"completionMarker":"1"}
```

失敗 assertion：

```text
A genuine interrupted R02 school must recover both demo school weeks, not be marked complete after one lesson
1 !== 120
```

## 下一輪重跑

同三個獨立 probe 已保存為 [historical-upgrade-probe.mts](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/historical-upgrade-probe.mts)。產品開始 R05 施工後只保存腳本並型別檢查，沒有再對 moving tree 執行它；此保存版尚待下一個固定候選實跑。它獨立於 85-case suite，不更改原套件斷言／計數。請待 handback、產品與 CI 乾淨，以實際固定 app tree 執行：

```sh
REVIEW_APP_TREE=<固定候選HEAD:handover> node --experimental-strip-types --test .codex-review/historical-upgrade-probe.mts
```

脚本會檢查開始／結束 app tree 與 clean，執行所有 current SQL migration（歷史 0000 已先建立），沒有任何 crypto polyfill、服務啟動或持久化資料庫。其本輪 `tsc --noEmit` exit 0；這只驗存檔型別，不把未執行腳本宣稱通過。
