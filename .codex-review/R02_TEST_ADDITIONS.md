# R02 獨立回歸案例準備

Cursor 修正施工期間只新增 reviewer 測試，沒有執行產品 API，也沒有修改 handover 或 D1 adapter。

已新增四組頂層案例，完整檔案目前共 26 組；另有 PATCH／submit 兩種起始順序子案例。

1. **學生原因隱私**：使用 API 接受的 `medical` 類別與獨特 private reason marker。確認老師仍能讀到兩欄，但學生 workspace／detail 的原始 JSON 不含 marker，目標 request 的 reason 和 reasonCategory 都省略或留空。沒有用會被驗證器拒絕的虛構 category。
2. **補充與留言隱私**：依目前發布的 `{text}` API 契約，以及 DECISIONS 中 supplement／timeline comment 僅老師可見的規則，新增有時間戳的私密補充，接課時寫入私密留言。先確認接課老師確實可讀，再檢查學生 list／detail／ICS 都沒有原始教師 marker。未捏造未發布的 visibility 欄位或要求公共分享功能；若修正後契約新增必要的 privacy classification，需先對齊正式欄位再執行。
3. **Draft PATCH／submit 並行**：先用真正 PATCH 將 Draft progress 留空並確認持久化，再恢復完整 Draft，證明不完整 payload 是合法草稿，不是僅被驗證器攔住的假 race。兩個請求在首個寫入前會合；最終 Pending 必須七項皆完整，或 Draft 必須沒有預約與成功 submitted 紀錄。
4. **第二筆移課的取消還原**：同一位原授課與目前任課老師，先移課、以已過日期 Completed，再建立第二筆移課並取消。若 API 支援第二筆 request，必須恢復第二筆申請前的日期／節次／教室，保留第一筆 Completed，不能退回最初 base_*。沒有使用換老師後的模糊 ownership，也沒有要求未來課可 Completed；若 API 明確回 409 禁止 Completed lesson 再申請，透明標記 unsupported／skipped，不指稱還原缺陷。

僅 reviewer 檔的 TypeScript `--noEmit` 靜態檢查已執行，exit 0。上述新 API 案例**尚未執行，不宣稱通過或失敗**。

待產品穩定後執行：

```sh
node --experimental-strip-types --test .codex-review/independent-api.test.mts
```
