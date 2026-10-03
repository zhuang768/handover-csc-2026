# R05 根代理整合驗證（2026-10-04，Asia/Taipei）

Cursor 在收到 R05 prompt 後顯示使用量已用完，尚未修改產品。Codex 沿既有可逆修補授權接手，未切換 Cursor 模型或購買額度。此紀錄區分 source、測試與發布證據，不承諾所有可能 bug 都不存在。

## 本機最終整合

- Backend frozen blobs：service `145faf7f27e82e44f2e56ea44e4ca33993c47932`；API tests `a43383679244dae8ea2171f682e3e486695d8b13`。
- Frontend product blobs：app `841fdd3442cd286efb4271cd28329c8bcd769c82`、InstallGuide `31367d79e39db17cf78587968bab8480b75ea079`、client-api `aad5fd0c8bd0376cb09ec23baaefe9eb7f42ecae`。
- 最終 E2E blobs：workspace `eca808dc950ea7636718933bef539f85fb426415`；built-update `7e17e29eed9bfb1614257de359ba8f05bfdfebe1`。

| 根代理實跑 | 結果 |
| --- | --- |
| `npm run format:check`、`npm run lint`、`npm run typecheck` | 各 exit 0 |
| `npm test` | exit 0，33 pass／0 fail／0 skip（26 API、5 client、2 PWA） |
| `npm run build` | exit 0，實際建置 Worker；assets.html_handling `none` |
| reviewer harness + independent API | exit 0，85 pass／0 fail／0 skip，既有業務 assertions 未弱化 |
| `npm run test:e2e` | exit 0，9 pass，15.6 秒；390／768／1440 真 viewport，雙語及登入 shell |
| built Playwright config（使用上一列已建置 dist） | exit 0，6 pass，5.6 秒；offline 200／無 Location，真斷網公共 fallback／重連無假重送，加 5 項 pending-write cases |
| `git diff --check` | exit 0 |

兩個新通知 case 第一輪因 exact button name 未包含未讀數量 timeout；reset case exact `Profile` 也與 `My profile` 不符。只修這三個 locator，保留延遲 HTTP、錯誤提示、不同週及持久化 assertions。focused 1＋2 cases 通過後，上表完整 9／6 套件再跑通過，未把 focused pass 當整套 pass。

獨立 source review 找到 missing sample 可覆蓋已修改 lesson 的實際路徑。後端擴充既有 partial repair case，先以真正 API move／accept／Completed／supplement 建立修改，再用旧修法重現失敗，修後保留 lesson 與真 request／歷史，缺少的模板採 inactive Cancelled snapshot。完整結果見 R05_BACKEND_RESULTS；沒有新增 schema／auth／production dependencies。所有 current API 先 await seedIfEmpty，再進業務 mutation；新 sample 的相同 ID＋唯一 token gating 避免 concurrent repair 敗方重播其副作用。

## 真 Worker HTTP

根代理在獨立 `.codex-review/worker-state/r05-final` 套用兩份 migrations（exit 0），以自有 built Worker `http://127.0.0.1:8789/` 執行 reviewer runtime flow：

- 四個真正 demo sessions；匿名 workspace 401，cookie HttpOnly，私人 JSON no-store。
- 真衝堂查詢與直接 submit 409；Draft → Pending → Declined → 修改重送 → Confirmed → Cancelled。
- 學生看不到私密教師 marker，材料待辦與 viewed 回執保存，班級課表安全限縮。
- 接受改課，取消恢復原 teacher／date／period；登出後旧 cookie replay 401。
- 沒有注册普通帳戶或 reset data；本腳本建立的 handovers 都取消，保留 audit。

此 reviewer helper 預檢初版把換老師誤設 `kind: move`（422）及學生不可見 Draft 預期 403（實際 opaque 404）。按現有 API 契約改成 substitute／404，沒有改產品或移除拒絕斷言。只取消 helper 自建的遺留 Draft；重跑 exit 0、PASS。另 `worker-smoke.mjs` exit 0，學生 20 lessons／1 visible request，老師 5 lessons，admin 60 lessons；後兩者 request 數量含上述取消的 QA 紀錄，非 fresh-seed 數量。

## 圖像／PWA 邊界

已人工查看健康的 teacher 768、student 390、admin TC 1440 與 teacher detail 390 PNG。07 現是 Maya 的登入工作台，非 loading sign-in screenshot。5 個 built update case 的 waiting／controller 是明確 UI seam，mutation 則走真正 HTTP 延遲；不冒稱真兩版 SW reload或手機安裝。R04 根代理真正兩版 SW 的 profile dirty guard／controller reload／保留 session 證據仍是先前結果。

## 固定版本的真正歷史 probe

產品 commit `9538135128b95cf2d14db9f154d7aac53ba86e46`，app tree `f611d50eaaa655e955d8ac113f7b55bd41cae6f3`；執行前後產品／CI 乾淨、tree 不變。

保存 wrapper 第一次執行三案都在 migrate guard 中止，未到業務斷言：它誤用 raw SQL bytes 比較，將 R03 已驗過的 Drizzle `--> statement-breakpoint` 純註解當成 DDL 改寫。只在兩方移除這個精確 marker 行，仍逐 byte 比較其餘全部 SQL；沒有改產品 migration 或三案業務 assertions。這個存檔誤判也不改寫 R04 stdin 原本 1 pass／2 fail 的歷史結果。

同固定 tree 再跑 `REVIEW_APP_TREE=f611d50eaaa655e955d8ac113f7b55bd41cae6f3 node --experimental-strip-types --test .codex-review/historical-upgrade-probe.mts`：exit 0，3 pass／0 fail／0 skip，320.897709 ms。

- 真 R02 完整庫＋真普通教師／session／custom external URL：普通 row/session 全保留，3 classes／46 users／121 lessons／8 requests counts 不變；只有已知原模板的 stub 改為本機 worksheet，remainingKnownStubs=0。
- 真 R02 第一次 lesson INSERT 故障：500，actualFaultHit=1，原 0 lesson；升級後 ordinary session 200、credentials/session 保留、3 classes／46 users／120 lessons／7 requests、completionMarker=1。
- 真 R02 第二次 lesson INSERT 故障：500，actualFaultHit=2，原 1 lesson；相同升級後完整 counts／session／marker，不能只靠虛構半庫。

SW blob `b3b66c94a362b77b560d5be1f8fc4624044a4453` 與 R04 pinned pass 版本完全相同；沿用該版本 28 個行為 checks 的證據，不冒稱 R05 重跑。

發布 archive／正式 HTTPS、GitHub remote／CI 尚待後續記錄。實體 iPhone／Android 加主畫面與 standalone 啟動未實跑。
