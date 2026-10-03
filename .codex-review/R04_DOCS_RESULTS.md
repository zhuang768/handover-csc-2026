# R04 固定版本：文件、CI、遷移與截圖

日期：2026-10-04（Asia/Taipei）。僅 focused read-only review；未改產品、啟動 server、執行 GUI、安裝、build、push 或 deploy。

**R03 的 schema／metadata／本機遷移／封裝程式沒有變動，可以沿用既有結果。R04 已修正 README 生產遷移敘述、歷史驗證段落、app ignore 與截圖重複。另找到兩個小型交付文案問題：07 截圖仍是登入 Loading 狀態，iOS Open as Web App 的步驟順序不正確。** 它們不等於資料／部署技術失敗，正式 release 判定仍由 root 的 runtime 與其他代理結果決定。

## 固定來源與實際執行範圍

- reviewed product SHA：`6b7b7cd734e9af06785d7f854d75dc8f3a160c6f`。
- status-only root HEAD（起始）：`7e76a4a1cdccec8b212a6ad7e0b674e425dbdfb8`。
- app tree：`ebbe56dda33a1547d67f17367bc067fe7a6eb2ab`；起始 HEAD:handover 與候選相同，`git status --short -- handover .github` 無輸出。
- 實際讀 fixed `git show`／`git diff`、PNG IHDR／SHA-256 與圖像。root 同時跑 E2E 後，working tree 的 02／08 PNG 與候選 bytes 不同；本代理改從 fixed `git show` 匯出這兩張至 owned temporary folder 再看，沒有把覆寫圖當候選。
- 對產品／CI 的最後 diff 僅看到 root 測試產生的 02／08 PNG 變更；本報告只適用固定 SHA，不宣稱當時 moving working tree 乾淨。

| 本代理命令／檢查 | exit | 結果 |
| --- | ---: | --- |
| 起始 `git status --short -- handover .github`、rev-parse | 0 | 產品／CI 乾淨，candidate app tree 相同。 |
| `git diff --exit-code f3fa696... 6b7b7cd... -- handover/drizzle handover/db/schema.ts handover/.openai/hosting.json handover/build handover/scripts handover/package-lock.json` | 0 | 全部未變，不重跑廣泛 install／build／migrations。 |
| fixed 8 PNG 的 Python stdlib IHDR／SHA-256 檢查 | 0 | 8 PNG／8 unique；05、06、08 真實 width 都為 390。 |
| 8 張本機 image inspection（02／08 固定匯出） | 成功 | 7 張為正常 app 狀態；07 登入 Loading 截圖的 README label 不符。 |

第一次 PNG 檢查額外斷言所有 working-tree bytes 等於 fixed candidate，因 root E2E 覆寫 02／08 而 exit 1；隨後只驗固定 blobs 的版本 exit 0。這是並行測試的來源檢查界線，不列產品失敗。

## 遷移與 portable packaging：沿用而非重測

- drizzle tree 在 R03／R04 都是 `6e87cfb7aae789a78e0215912abd77352c4bdec4`；schema blob 都是 `b612f36b10c50389d466af7b9b56b86e800e09d6`。
- 0000／0001、journal／兩份 snapshots、14 table schema 與 migration script 未變，因此沿用 [R03_DOCS_MIGRATION_RESULTS.md](R03_DOCS_MIGRATION_RESULTS.md) 的 fresh apply、舊 0000→0001 SQL upgrade、資料保留、db:generate NOOP、D1 prepared-chunk 與 packaging metadata 結果。
- R04 修改的是 service 的 legacy seed 相容性，應用升級成功仍看新 backend/runtime 證據；不能用 SQL tree 未變推論服務已通過。
- Sites hosting manifest、build helpers／scripts／lockfile 都未變，仍沿用唯一 project `appgprj_6ac11cc258608191ba6f05fcd6e031fb`、logical `DB`、父 Git 外的 release checkout／exact app tree。R04 的 SW bytes 與 Vite `assets.html_handling: "none"` 有變，必須使用 root 的 R04 新 build／archive，不能發布先前 R03 tar。
- R04 app `.gitignore` 現在包含 `*.tsbuildinfo`，已解決外部 checkout 不含父 ignore 的界線。root 仍應依既定規則確認 helper 在 commands 後 `git add --all` 得到 exact reviewed source tree；本代理沒有在 release 副本私補檔案。

## 文件／CI 一致性

- README 已如實解釋 `npm run db:migrate` 只傳 `--local`，不能套 Sites production DB；正式 SQL／metadata 經既有 Site portable publish flow。沒有新增 remote DB ID。
- README 已補 clean-machine Chromium install。CI 包含 Node 22、正確 handover working directory／lockfile、format／lint／typecheck／unit／browser install／dev E2E；最後改為 `test:e2e:built`。package script 實際為 `npm run build && playwright test -c playwright.built.config.ts`，所以 build 未被略過，亦無 continue-on-error。
- TEST_REPORT 明確將 Round 1 的未跑 viewports／Playwright 段落移成歷史限制；Round 4、Round 3、Round 2 分開，舊 82 pass 未被描述為新完整 suite。
- 85 Node／26 unit／8 dev E2E＋1 built E2E／28 SW 行為 probe 是 **Cursor HANDOFF／TEST_REPORT 的本機回報**，本代理本輪未實跑，沒有替它們背書為自己的結果。root 正執行所有 commands／runtime，正式交付應使用那些原始 exit／scope。
- 新 built E2E 原始檔確有 controller wait、`context.setOffline(true)`、reload、public bilingual fallback、cache API 排除與 failed offline profile edit 不重送；已取代 R03 synthetic offline event。`GET /offline.html` 的 status／Location 在該 spec 是 log，沒有明確 expect 200；root 應依實際 Worker probe 核對 200／no redirect，不能只看到 test pass 就推論該 log 值。
- README／HANDOFF／TEST_REPORT 仍明示未實體 iPhone／Android 安裝、未 public HTTPS、未做兩版本 SW update browser run。這些是如實保留的人工／正式環境限制，不能從 desktop Chromium 推成真機成功。
- AI disclosure／Devpost 詳細與短文仍披露 Codex＋Cursor；產品 unlicensed 與 vendor notices 界線保留。未指定產品 license 不列為 GitHub 技術阻擋。根 README app 入口與人工作業／eligibility／deadline notes 未變。
- Devpost 是草稿，公共 URL／repo／影片／人名／release evidence 的 `[CONFIRM]` 仍需正式產物或本人補齊。公開 GitHub 和網站授權不等於替本人 final Devpost submit 或同意條款。

## 8 PNG：固定候選的實際內容

| 檔案 | PNG IHDR | 獨立圖像檢查 |
| --- | --- | --- |
| 01-login-zh-1440.png | 1440×900 | 正常繁中登入。 |
| 02-student-next-lesson.png | 1440×1003 | 正常學生首頁／next lesson。 |
| 03-teacher-editor.png | 1280×2486 | 正常填入模板的教師 editor；available conflict check，R03 server-error banner 已消失。 |
| 04-admin-zh-1440.png | 1440×900 | 繁中 admin overview，已取代 profile-only 圖。 |
| 05-student-390.png | 390×1336 | 手機寬 student；安裝指引收合，只有一條 bottom nav。 |
| 06-install-guide-390.png | 390×1604 | 安裝指引展開，與 05 不同 bytes。 |
| 07-teacher-768.png | 768×1024 | **實際是英文登入畫面／Loading…，不是 README 所寫 Teacher home。** |
| 08-detail-390.png | 390×2546 | 正常 teacher handover detail，Synthetic teacher note 屬有權教師視圖。 |

共 8 個 SHA-256 均不同，5–8 張數量成立；其中 7 張正常頁面已足以滿足最低數量。07 fixed SHA-256：`021f82ab44f100b23a8a08bfaeead20001de4036d27e3feb31c7596f110fcd6b`。可重拍穩定 teacher home，或如實改 label／提交其餘 7 張；不將 loading 圖宣稱成已登入 tablet shell。PNG width 本輪符合 390，並非 R03 的 392。

## 手機指引的小型文案修正

`lib/i18n.ts:579`／`:639` 現在說新增主畫面後「open the icon and choose Open as Web App」。Apple 現行官方流程是先在 Safari 分享選單進 Add to Home Screen，在加入畫面開啟 Open as Web App，再點 Add，最後才從主畫面開啟。請英／繁中同步改為「若出現該選項，於加入畫面啟用，再加入主畫面」。這是步驟文字修正，不需新增服務或擴充 PWA 範圍。[Apple 官方 iPhone web app 指引](https://support.apple.com/en-au/guide/iphone/iphea86e5236/ios)

本代理只唯讀核對 Apple 來源；沒有真機安裝或外部寫入。正式 HTTPS、SW header／controller／private no-store／真斷網與更新流程仍依 root RELEASE_PLAN 6A 驗，不把本輪文件檢查當 native deployment 成功。

## root 後續實跑回報（與本代理檢查分開）

root 已在本報告撰寫期間明確回報：26 unit／8 dev E2E／1 built E2E 都 exit 0；built `/offline.html` direct 200、無 307，controlled page 真斷網 reload 顯示 public fallback，offline save failed case 通過。root 還手動驗真 R03 舊 SW→R04 update UI：dirty profile 禁用 update、還原欄位後 click update、等新 controller full reload、home／session 保留、banner 消失。

這些是 root 的實跑證據，取代前面文件「Cursor 尚未驗兩版本 update」對整體專案的過時限制；固定 R04 TEST_REPORT 自身仍如實描述 Cursor 當時未做。正式 public HTTPS／實體手機仍未驗。root 最終 readiness 文件應依實跑報告更新，不能宣稱本代理執行過該瀏覽器流程。
