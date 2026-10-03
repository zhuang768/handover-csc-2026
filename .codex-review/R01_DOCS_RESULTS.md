# Round 01 — 文件與交付稽核

稽核日期：2026-10-03（Asia/Taipei）。本輪只讀取產品與既有文件，僅新增本報告；未更動產品、重跑產品測試、部署、推送或操作 Devpost。

## 結論

**DOC-01／DOC-02 尚未通過最終交付。** 提交文件已具備英文敘事、2 分鐘分鏡、7 張截圖計畫、官方來源與未部署聲明；但仍是待整合草稿。README 的重建與維運內容不足、AI／既有素材揭露尚未完整，且驗證報告不能支持「P0 全部完成」。

公開部署與 GitHub 目前仍未完成，這點文件大致如實記載。GitHub 上傳已獲使用者授權，應在獨立驗收、機密檢查與最終來源確認後執行，不必再次把同一授權列為等待本人步驟。Devpost 最終提交、資格、條款及宣傳選項仍須本人確認。

## 快照與方法

- 工作區 repo 根：`/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon`。
- HEAD：`111f16a17381679aba20499807b9f6cd7b306cfc`。
- `CURSOR_STATUS.json` 填寫的產品 HEAD 為 `9f2d0389bfc04deb73959b97a165cabc00989125`。`git diff --name-only 9f2d038 HEAD -- handover .github` 無結果，兩個 commit 的產品／CI 樹相同；最新 commit 是交接狀態 commit，不是本輪產品異動。
- 初始 `git status --short` 僅顯示 `handover/tsconfig.tsbuildinfo` 被修改；未改動或清理它。
- `git remote -v` 無輸出。交接 `publicUrl`／`githubUrl` 均為 null；沒有把預期網址當可用結果。
- 讀取使用者原始附件、`.codex-review/ACCEPTANCE.md`、`CURSOR_STATUS.json`、根／產品 README、DECISIONS、TEST_REPORT、全部提交文件、API contract、實際 service／UI／測試、環境與建置設定、GitHub workflow。
- 使用唯讀腳本檢查文件內本機 Markdown 連結：**0 個損壞連結**。檔名提及但沒有 Markdown 連結者不包含於此結果。
- Demo 主表：**8 鏡、120 秒、241 個英文旁白單字**。文字中的「約 244」是近似值，不影響 3 分鐘內要求。
- `docs/screenshots/` 無實際檔案；`HANDOFF.md` 與產品主授權文件均未找到。現有 vendor 授權文件不是 Handover 自身的授權。
- 競賽來源沿用前次已核對的官方頁面，這輪沒有再次浏覽或傳送外部訊息。

## 已符合的文件部分

| 項目 | 稽核結果與限制 |
| --- | --- |
| 官方要求與截止 | SUBMISSION_CHECKLIST 有官方來源、必交／選填、五項評分、獎項 opt-in 與 10/5 15:00 台灣時間；保留 Rules 午夜／中午矛盾，採較早時間。 |
| 資格及外部同意 | 新清單明確要求本人確認年齡／高中身分／監護人同意；未代按提交。根 README 的舊資格主張仍須避免成為公開主入口。 |
| 英文提交敘事 | 名稱、tagline、七段 Devpost 結構與具體數學課情境齊全；沒有虛構學校試辦或效益百分比。 |
| 影片及截圖計畫 | 120 秒腳本、角色順序與 7 張截圖計畫完整；都是計畫，不是已錄製影片／截圖。 |
| Auth 限制 | README／DECISIONS／提交草稿都揭露恢復碼重設與沒有寄信；沒有宣稱 Email 重設信或 Google 登入完成。 |
| 核心架構 | React 19／TypeScript／Vinext／Workers／D1、PBKDF2 與 HttpOnly session 描述符合目前來源；尚未代表 Worker 正式環境已驗證。 |
| CI 佈局 | 根 `.github/workflows/ci.yml` 使用 `working-directory: handover` 與 `handover/package-lock.json`，符合實際 root repo；依序 npm ci、format:check、lint、typecheck、npm test、build。沒有 continue-on-error／刻意略過既有檢查。 |
| CI 執行狀態 | workflow 定義存在且命令和本機一致；沒有遠端執行紀錄，不能聲稱 GitHub CI 已通過。 |
| Demo 帳號說明 | README 角色與合成 seed 姓名吻合；UI 有 Student、原老師、接課老師、Admin 四個按鈕，實際呼叫後端建立 session，而非只有前端角色切換。 |

## 發現與修正驗收條件

### DOC-R01-01 [P1] README 缺少可重建／部署的必要操作說明

位置：`handover/README.md:7`（安裝）、`:36`（Layout）、`:45`（限制）；`handover/package.json:5`、`handover/.env.example:1`、`handover/vite.config.ts:17`、`handover/app/api/[[...path]]/route.ts:6`。

目前 README 只有 `cd handover`、`npm ci`、`npm run dev`，沒有 Node >=22.13.0 前置條件、資料流／架構圖、環境變數如何真正傳到 Worker、D1 binding、首次 schema／seed 行為、資料保存位置或重建步驟。不能只建議複製 `.env.example`：Vite 的 Worker vars 目前直接寫 demo 值，API 還有預設 demo 值；需要說明實際讀取來源及覆蓋方式。

重現：從 repo 根照 README 閱讀安裝後，無法從文件得知如何重建同一份資料、把 `TEACHER_INVITE_CODE`／`DEMO_MODE` 設到預覽／發布環境，或判定 `npm run start` 是本機 Wrangler 預覽而不是正式部署命令。

影響：原始需求要求資料庫 schema／migration／seed、環境設定、架構與重建說明；評審或接手者無法依文件重現或安全配置交付物。

完成條件：

1. README 明列 repo 根與 app 根、Node 要求、乾淨安裝與啟動 URL。
2. 加上簡單架構／資料流與 DB binding `DB`，區分本機 SQLite 模擬、Workers/D1 與 Sites hosting。
3. 說明實際 Worker vars 設定，demo public invitation 的用途，以及公開 demo 與真實學校部署的差異；不要把 demo 邀請碼當秘密。
4. 說明首次 API 套用 schema／seed 的位置（`ensureSchema`／`seedIfEmpty`）與本機持久化，提供可實際執行的新資料庫／seed 驗證方法；重置不得要求刪真實資料。
5. 明列 preview/build/start/deploy 差異、發布設定與部署後四角色驗證步驟。尚未發布時明寫 pending，不能填預期 URL。

### DOC-R01-02 [P1] AI／既有素材揭露未反映目前 Cursor 實作

位置：`handover/docs/AI_DISCLOSURE.md:7`、`:22`–`:27`；`handover/docs/DEVPOST_SUBMISSION.md:88`、`:92`、`:103`；`handover/DECISIONS.md:3`。

揭露目前只列 OpenAI Codex。這輪產品實作由已授權的 Cursor chat 執行，而 Codex 負責前期工作、資料研究與獨立稽核；未記錄 Cursor 使貢獻邊界不完整。`Applied development/design skills`、`Prior assets`、`Sponsor services` 仍是 CONFIRM。已知本案沿用 Sites/Vinext starter；現有 `build/sites-vite-plugin.LICENSE`（OpenAI）與 `vendor/shadcn-tailwind-4.13.0.LICENSE.md` 是可確認的外部來源，不能讓這些仍全部等待本人猜測。

影響：官方要求揭露 AI 與重要外部素材；提交草稿的後端權限／實作敘述不能同時假設受驗者已理解。模型名稱只有可驗證時才補，不要猜 Cursor 使用的模型。

完成條件：以實際工作紀錄補齊 Codex、Cursor 及各自用途／貢獻；列出已確認 starter／vendor／主要函式庫與授權，保留未知賽前個人素材、隊員姓名與本人理解確認為人工作業。DECISIONS 記錄實際讀取／採用的 skill 與成果，不能只列 skill 名稱。正式 Devpost 文案刪除仍可自行由 repo 確認的占位欄位。

### DOC-R01-03 [P1] 「所有 mutation 都檢查 Origin」與當前來源不符

位置：`handover/DECISIONS.md:13`、`handover/docs/API_CONTRACT.md:3`、`:17`；`handover/server/service.ts:1945`、`:2067`。

DECISIONS 和 contract 宣稱所有 mutation 受 Origin 防護，contract 指定 submit 為 POST。實際 service 只對非 GET／HEAD 檢查 Origin；action 路由符合後沒有統一 `method === "POST"` 限制。GET submit 能造成狀態變更是已有 `.codex-review/R01_PRELIMINARY.md` 的重現項，本次讀取來源仍見相同缺口。

本輪沒有再執行 exploit，因此這項引用既有重現及現在程式碼，不當作新 runtime 測試。

影響：文件中的安全保證超過程式碼實際強制條件。這是產品缺陷，不能只降低文案保證或列 Known Limitations 就把 SEC／P0 算通過。

完成條件：先修補 method 驗證並獨立測試 GET／HEAD／錯誤 method 不改動狀態、鎖定、通知、audit；再保持文件中對 POST 與 Origin 的敘述。若修補尚未完成，TEST_REPORT／HANDOFF 必須把安全要求列為失敗，不能記為已完成。

### DOC-R01-04 [P2] TEST_REPORT 的 API 成功不得升格為 browser／D1／P0 全通

位置：`handover/TEST_REPORT.md:14`、`:21`、`:36`、`:40`、`:44`；`.codex-review/CURSOR_STATUS.json:43`；`handover/tests/api.test.ts:329`。

24 個測試的對象是直接呼叫 `handleApi`，採 in-memory SQLite adapter。名稱「progress survives reload」實際是 POST 後另一次 GET，沒有重新載入瀏覽器或重新啟動 Worker／D1。報告已有 viewport／Playwright／公開 URL 未驗證，這是誠實資訊；但交接 completedRequirements 包含 CHECK-01，其驗收基線還包含 E2E，不能算完整通過。

影響：常規 API 測試沒有覆蓋實際 browser cookie、DOM 表單、載入／失敗／鍵盤／viewport，亦不證明 Cloudflare runtime 與正式 D1 持久性。重複的空 `## Not verified` 也使報告閱讀不清楚。

完成條件：

- 明分「本機 API suite（24 Node test count）」「工具命令」「本機 browser smoke」「獨立 review」「部署驗證」。
- 將 API reload 敘述寫為「再次 API 讀取」，與真實 browser reload／server restart 區分。
- 加上端到端／退回重送／衝堂／越權／demo reset／390、768、1440 等原始驗收矩陣，逐項列 Pass／Fail／Not run、來源版本與證據；沒有實測就不得標 Pass。
- 合併重複 heading，記錄 P1／P2 當前實作及驗證狀態，不以 suite 24 passed 推論每個 UI 控制都可用。
- 更新交接 completedRequirements，使 CHECK-01／UX／WEB 狀態與實際證據一致。

### DOC-R01-05 [P2] Repo 主入口、HANDOFF 與專案授權缺項

位置：根 `README.md:1`、`:14`、`:40`；`handover/README.md:36`；全 repo 找不到 Handover `HANDOFF.md` 或主 LICENSE。

repo 根仍是舊比賽筆記，沒有 Handover 入口，且包含未經本輪驗證的「你目前 16 歲」與 QRAlarm 討論。原文副本已保存在 `handover/docs/ORIGINAL_HACKATHON_NOTES.md`，因此可以保留歷史並讓 GitHub 主入口指向實際產品。交接 JSON 存在且格式可讀，但沒有一份產品內的 HANDOFF 文件供接手者說明如何接著驗證／發布。vendor 的 MIT 文件不能代表 Handover 自有程式已經採用該授權。

完成條件：根 README 加入 Handover 位置／用途／入口並標明舊筆記性質；產品 README 連結提交資料／TEST_REPORT／DECISIONS／HANDOFF，附 30 秒導覽。HANDOFF 需包含實測 commit、命令、已知失敗、下一步、外部發布狀態和剩餘本人步驟。加入明確的本專案授權選擇與現有 vendor credits；沒有足夠授權依據時如實記「尚未指定」，不能聲稱已 open source licensed。

### DOC-R01-06 [P2] 提交草稿與最後步驟需整合實際狀態，GitHub 不再待重複授權

位置：`handover/docs/DEVPOST_SUBMISSION.md:42`、`:66`、`:98`–`:112`；`handover/SUBMISSION_CHECKLIST.md:96`。

文案用 Verification gate／CONFIRM 避免未驗證宣稱，這對草稿適當；但不滿足「完整可直接提交文案」交付。授權 GitHub 上傳已到位，清單仍把「授權並完成 repo 公開」放在只有本人能完成的事項中。公開網址／影片／隊員／個人既有作品有未知資訊，不應虛構；程式與套件、已測試結果、實際 devops 狀態可以由工程工作完成，應先完成。

完成條件：正式文案保留已驗收能力、剔除草稿內管理指示與自動可查占位，附當前真實 repo／部署 URL；尚未部署前維持未發布聲明。Known Limitations 同步提醒觸發方式、shared demo、恢復碼、尚未完成的必需驗收。把「本人事務」限縮為資格、隊員／監護人、條款／獎項／宣傳選擇、錄影片與 Devpost 最終提交；GitHub 推送列為已授權、待獨立驗收後執行。網站發布仍依當前明確授權與平台權限處理。

## 整合時可直接使用的狀態矩陣

| 交付項 | 當前狀態 | 最終通過條件 |
| --- | --- | --- |
| 官方提交清單 | 有來源、截止／資格區分齊全 | 同步最終交付狀態，保留本人確認項。 |
| README | 部分完成 | 環境／DB／seed／架構／部署／授權／導覽可重現。 |
| DECISIONS | 基本架構與部分取捨完整 | 安全主張對應修補證據、skill 成果／擴展取捨齊全。 |
| Devpost 英文 | 草稿 | 工程可查的 CONFIRM 清空、功能與實測吻合、真實URL。 |
| Demo script | 格式與長度完成 | 對實際四角色流程預演後錄製，URL可公開播放。 |
| Screenshot plan | 7 張計畫完成 | 實際截圖與部署/驗證版本一致；不能把計畫稱為已拍。 |
| AI/outside disclosure | 部分完成 | Cursor/Codex貢獻、starter/vendor credits、skills使用補齊。 |
| TEST_REPORT | 本機命令＋API＋單角色smoke | 獨立P0矩陣、browser多角色／viewport／部署實測結果。 |
| HANDOFF | 僅有交接JSON | 產品交接文件與最終狀態／下一步一致。 |
| GitHub CI | workflow存在，root布局正確 | 同一已測試 commit 推送後見實際遠端 CI 結果。 |
| Public URL／GitHub URL | 無 | 完成 authorized release 工作並獨立核對真實URL／remote SHA。 |
| Devpost 最終提交 | 尚未執行，本人步驟 | 本人確認資料／條款並完成，保存成功狀態。 |

## 下一輪文件驗收

1. 以修補後穩定 HEAD 重讀文件與來源，確認 DOC-R01-03 的安全保證已被實測支持。
2. 確認 root workflow 與 handover app 仍在同一 repo，不能只上傳 handover 子目錄而漏 CI。
3. 從乾淨安裝／新空 DB 走 README 步驟，不使用私人機器現有狀態當前置。
4. 檢查內部連結、所有 CONFIRM、真實URL、AI／vendor credits 與主專案授權。
5. 將 GitHub push、CI、公開部署、Devpost 四種狀態分別記錄；任何一項完成不能推論其他完成。
6. 使用繁體中文台灣用語統一中文文件；現有草稿包含少量簡體字，修訂時一併校正。
