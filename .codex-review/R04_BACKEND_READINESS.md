# R04 後端複驗準備與 GitHub 唯讀查詢

日期：2026-10-04，Asia/Taipei。Cursor 正在 R04 施工；本輪沒有對 moving tree 執行 API、產品 suite、瀏覽器或服務，也沒有修改產品。只新增 reviewer 專屬的一個有明確保留資料契約的 top-level case，保留原 84 個計數的所有 assertions。

## 原升級案例的缺口

- 完整舊庫 case（line 925）驗有效 real session 與 users／lessons／requests 數量；它記錄 table snapshot 差異，但沒有要求原 row 值保留。用同樣數量重建／覆寫 demo 課表或交接，可能仍通過。
- 局部舊庫 case（line 948）已比較真實註冊者的 user／credential／session 全值，並要求補建完整 seed／關聯；它沒有先修改 demo profile，因此看不出局部 repair 是否把 demo 名稱／其他欄位重設。
- 原 demo reset 真實資料保留 case 針對明確的 admin reset；不能代替初始化升級時保留教師／學生已建立資料的驗證。

R04 prompt 第 1 節明確要求保留既有帳號、普通註冊、session、改過的課堂／交接及關聯；新增範圍已有依據，不增加產品功能。

## 唯一新增回歸

[independent-api.test.mts:979](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/independent-api.test.mts:979)：`R04 review: legacy readiness preserves edited demo arrangements and established teacher/student relations`。

這是一個 top-level case，含兩個循序階段，不新增 child 計數：

1. **完整舊庫**：透過真 API 修改 demo teacher profile，對真正 demo lesson 建 move→submit→accept，留下修改過的 handover／私密 notes／補充；同班學生以真 API 建 todo／view。負向控制確認課表真的改動、request 屬 demo、todo／receipt 已存在。轉為 R02 marker 與 nullable token 表示後，由有效 real session 觸發 readiness。
2. **局部舊庫**：另建獨立 fixture，以正常 API 修改 demo profile、正常註冊 real teacher，再重建已證實的 R02 3 班／45 demo users／0 lessons／0 requests 舊失敗 state。要求補齊課表／所有 demo 關聯，同時 classes／users／sessions fingerprint 保持不變，包含已改 demo profile 及 real credential／session。

完整舊庫要求**每筆已成立的非 meta row 原值仍存在**；classes／users／lessons／requests 也不可重複。這會抓出同數量覆寫／刪除後重建、改回 base_*、重設 handover／profile、丟 todo／view／timeline／audit。允許新增 completion marker，也允許追加合理的 migration audit，沒有把「不得覆寫既有資料」擴張為「任何 table 都不能追加一筆」。失敗訊息不輸出 row 值、credential hash 或 session token。

局部階段原本就沒有課堂，不能臆造一堂已移課 lesson；所以用 R02 允許的 profile edit／real registration 表示已修改資料，並保留原來有效的負向控制。

## 固定 R03 驗證：已實際執行

為避免碰到施工中的 service，從 **`git archive f3fa696115a86f98995686b6bb934b90492133ab:handover`** 匯出一次性隔離副本，先驗 app tree **`911adb7043d89b7487b12b9bb3d06876457699a5`**，再複製 reviewer suite／adapter／harness。Node process 的 CWD、service、shared/time 與全部 SQL migrations 都來自該固定副本；沒有載入 moving workspace 產品模組。臨時副本執行後已清理，沒有 checkout、stash 或改原工作區。

副本內的命令：

```sh
node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts
```

**實際 exit 1：85 計數、82 pass／3 fail／0 skip／0 cancelled。** API 83（34 top-level），harness 2。原 82 全通過；兩個原 legacy case 與新增的唯一 preservation case 都正常 red，409 `INVALID_STATE`。新增 case 的 profile／move／handover／supplement／todo／view setup 全部已成功，紅燈落在原 R03 readiness；不是先被非法 fixture 或越權擋住。

因固定 R03 在完整舊庫階段就 red，新 case 後半局部 edited profile 階段尚未執行；須在 R04 穩定版本修好共同 blocker 後實測，不能宣稱它已通過。

reviewer 靜態型別也實跑：

```sh
node handover/node_modules/typescript/bin/tsc --noEmit --module ESNext --moduleResolution Bundler --target ES2022 --allowImportingTsExtensions --skipLibCheck --typeRoots handover/node_modules/@types --types node .codex-review/independent-api.test.mts .codex-review/review-d1.mts handover/node_modules/@cloudflare/workers-types/index.d.ts
```

exit 0。這只驗 reviewer 檔型別，沒有執行施工產品或宣稱 R04 已驗收。

## Cursor 交回後的 focused 複驗順序

1. 記錄停止編輯後固定產品 SHA、app／CI tree，確認開始與結束乾淨；有行為碼變動則撤回該輪判定，改用新固定版本。
2. 先跑三個 legacy case（925／948／979）；確認完整與局部舊庫都可用，已成立資料未被覆寫，完整學校不被重複建立。相容判斷看 records／關聯，不要求已正常轉換的 sample 狀態回最初值，也不可盲轉所有 `seeded=1`。
3. 跑完整 **85** 計數。保留新空庫 fault→retry、8 個平行 startup、CAS 失敗事件、stale submit、R01 全回歸、角色／隱私／session／reset 等 gates，不只單跑舊庫。
4. 從 adapter `appliedMigrations` 對照所有 `.sql`、journal 與 snapshot；若 R04 有新增 migration，以實際 inventory 為準。所有 SQL 自動全檔載入，沒有手動跳過 0001／新 guard。
5. 根代理另在隔離的真 Worker／D1 執行 fresh startup 及真正舊完整／局部 DB upgrade smoke，連續檢查有效 session、教師修改安排／交接、學生 todo／receipt、資料持久性。Node native SQLite 與真 Worker 的證據各自記錄，不混當遠端驗收。

## GitHub／remote：只查詢，沒有寫入

查詢時間約 2026-10-04 01:18:27，Asia/Taipei。下列是當次實際證據：

| 命令 | exit／結果 |
| --- | --- |
| `gh api user --jq '{login:.login,owned_private_repos:.owned_private_repos,public_repos:.public_repos}'` | 0；登入身分 `zhuang768`，public repos 62；private count 為 null，不解讀為 0 |
| `gh repo view zhuang768/handover-csc-2026 --json nameWithOwner,url,visibility,isPrivate,defaultBranchRef,createdAt,pushedAt` | 1；GraphQL 無法解析該 repository |
| `gh api -i repos/zhuang768/handover-csc-2026` | 1；HTTP **404 Not Found**；回應 scope 含 `repo`／`workflow`，沒有輸出 access token |
| `gh repo list zhuang768 --limit 100 --json name,nameWithOwner,isPrivate --jq '.[] \| select(.name == "handover-csc-2026")'` | 0；沒有匹配 repository |
| `git remote -v` | 0；無輸出，沒有 configured remote |
| `git config --get-regexp '^remote\..*\.(url\|pushurl)$'` | 1；無匹配 remote config |
| `git branch --show-current`／`git branch -vv` | `handover`，當次 b3753d7；無 upstream tracking |

以目前 owner session 的 exact REST／GraphQL 與列表查詢，**目前查無目標 repository `zhuang768/handover-csc-2026`**。本代理沒有 create repository、設定 origin、push、提交、部署或更動帳號。正式 release 前可再次唯讀核對此狀態；本次 404 與無 remote 不代表 GitHub 上傳已完成。
