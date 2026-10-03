# Handover R05：收斂現有驗收缺口

繼續同一專案／branch／chat。R04 固定產品 `6b7b7cd734e9af06785d7f854d75dc8f3a160c6f`、app tree `ebbe56dda33a1547d67f17367bc067fe7a6eb2ab` 已獨立通過 format/lint/types、26產品test、85 reviewer計數、8 dev E2E、1 built offline E2E、28固定SHA SW案例。不要重做視覺或擴張功能。使用者已明確要「網址＋加入手機主畫面」的 App，暖白／墨綠方向已確認，不再問方向。

先讀本輪 `.codex-review/R04_BROWSER_RESULTS.md`、`R04_API_RESULTS.md`、`R04_FRONTEND_RESULTS.md`／`R04_PWA_RESULTS.md`、`R04_DOCS_RESULTS.md`（存在的版本），只修下面仍未關閉的現有要求。reviewer檔案/assertions仍不可改動、skip或混入產品commit。

## 1. 更新保護要包含正在送出的 mutation

根代理已實際驗證舊R03 SW→R04：waiting新版提示出現；Profile未存姓名時更新按鈕消失、欄位保留；還原姓名再按確認後，真的fullreload、session保留、提示消失。**正常兩版更新與Profile dirty路徑已過，不需重新發測試版本或重做SW。**

但 R04 原要求也明列「正在mutation不能reload」。app.tsx:2309 Detail的onDrafting只看comment/supplement、不含busy；Profile:2713只看欄位dirty、不含busy；Users:3003的writingId沒有回報root。等待接課接受（空comment）、管理員reset或啟停帳號時，更新按鈕仍可能可點。請把實際送出中的狀態納入共用更新阻擋，保留舊輸入/成功/失敗處理與正確cleanup。不要以猜測listener競態加功能。

先用產品自己的測試 delay一個真mutation、提供waiting worker條件，斷言busy期間不能觸發reload／skip-waiting，結束後才能更新；保留dirty Profile/Detail保護。這是既有要求的focused回歸，不加production套件或背景queue。

## 2. 跨週開啟通知仍要保留「未讀狀態保存失敗」

R04同週read500→detail200已修；但openRequest(id,true)在app.tsx:240遇targetWeek!=week會await load(targetWeek)，load:265又無條件setError("")，跨週仍清掉read錯誤。請保留單筆通知PATCH失敗的可見回饋，同時允許成功detail/不同週workspace正常打開；401仍先回登入，不呼叫失效詳情。用產品 E2E 的跨週notification＋read500/detail200/workspace200斷言錯誤最後仍可见。不只驗同週。

## 3. 真正健康的768平板截圖

固定6b7的 `07-teacher-768.png` 實際是登入畫面Loading…，但README標成Teacher home。workspace.spec.ts:261–263在demo後立即save；demo helper:26只等 `.handover-root`，AuthScreen app.tsx:801也有該class，並非登入完成證據。

helper或768拍照前等真workspace200及Maya教師工作台heading/desktop nav；健康且可讀才save07。維持5–8張不同實際畫面，不用loading畫面冒充老師首頁。不要修改reviewer自己的PNG備份。

## 4. iPhone安裝指引順序與報告範圍

lib/i18n.ts:579/639 英／繁中同步修：Safari→分享→加入主畫面→在加入畫面啟用「Open as Web App／作為Web App開啟」（若有）→加入；之後才點主畫面圖示。現文案把Open as Web App放到開啟主畫面圖示之後，順序錯。依Apple官方 https://support.apple.com/en-au/guide/iphone/iphea86e5236/ios 。只借流程，不拷貝文案。

TEST_REPORT可引用root `R04_BROWSER_RESULTS` 的真兩版SW正常更新／Profile dirty手動證據；實體iPhone/Android加入主畫面仍未驗。公開HTTPS與GitHubCI尚未做，不冒稱完成。R04文件報告其餘migration/packaging/CI無新缺陷，不重構。

## 5. 真實R02部分舊庫與已知demo教材stub仍未修完

85正式suite全綠，但backend對**真R02原碼**另做3個既有要求的historical probe，結果1pass／2fail（不是新增suite計數）。詳見R04_API_RESULTS。不要把「85全綠」當完整舊庫相容全部完成。

- **部分庫已被誤判完整。** R02原seed第2筆lesson真正注入失敗，留下3classes／45demo users／1lesson／0requests，另有普通帳號與有效session。升R04後auth/me雖200，仍只有1lesson／0requests，卻寫seed_complete=1。service.ts:418–420以任意lesson>0＋3demo classes當完整舊庫，是錯誤捷徑。完整舊庫需合理驗證完整結構／demo關聯；部分庫原子補齊缺資料且保留現有帳號／session／修改過的lesson/request/supplement/todo/view，不能重置、清庫或盲目恢復既有課堂與交接的初始狀態。R02第1筆lesson故障的零lesson部分庫已修，保留該成果。留一個產品回歸涵蓋**已有1lesson的真局部狀態**；backend會重跑相同歷史probe。
- **已知舊demo教材仍是stub。** 完整真R02庫升級後，demo-request-confirmed的Practice worksheet仍為 `https://example.org/worksheet`，不是本地可用教材。R03已要求既有demo stub修復。只對可辨識且未被使用者改過的原demo教材項目做狹窄、冪等替換至可用自製worksheet；不廣泛替换URL。本probe另有普通教師自由自訂同一URL，必須保留，同樣保留credentials/session及其他row。這個既有內容小修不引進外部服務。

## 6. 交回

實際使用適合的 diagnosing-bugs、React／ai-debt、Playwright、安全資料升級skills；只用能解決本輪問題者。先確認重現，再最小修補。所有受影響測試＋format/lint/types/productAPI、最新85 reviewer計數、build、dev/built E2E實跑；獨立歷史probe三個另外列結果，不混入85總數。SW未變時可沿用固定R04的28結果並明列hash，變更時才重跑。

產品commit後停止編輯，CURSOR_STATUS round5 ready_for_review，產品SHA／真實時間／exit／案例數／未驗列表，同chat交回。GitHub/同一Site發布由Codex驗收後完成；不要push未驗收來源、重建Site、加服務或執行Devpost提交。
