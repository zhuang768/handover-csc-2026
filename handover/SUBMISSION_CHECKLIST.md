# Handover — Submission checklist

官方資料核對日：2026-10-03（Asia/Taipei）。這是提交準備文件；未勾選項目代表尚待完成或本人確認，不能視為已提交、已部署或已通過驗收。

## 截止時間與倒數

| 項目 | 官網時間 | 台灣時間 |
| --- | --- | --- |
| 提交開始 | 2026-09-04 00:00 PDT | 2026-09-04 15:00 |
| 平台提交截止 | **2026-10-05 00:00 PDT** | **2026-10-05 15:00** |
| 建議完成提交 | 提前 3 小時 | **2026-10-05 12:00** |
| 評審期間 | 10/5 00:00–10/12 00:00 PDT | 10/5 15:00–10/12 15:00 |
| 公布得獎 | 2026-10-12 08:00 PDT | 2026-10-12 23:00 |

時間依[官方平台日程](https://csc-back-to-school.devpost.com/details/dates)。2026 年 10 月 PDT 為 UTC−7，台灣為 UTC+8，差 15 小時。

**官網矛盾仍存在：**[Rules](https://csc-back-to-school.devpost.com/rules) 內文寫 10/5 **12:00 PM Pacific**，換算為台灣 10/6 03:00；平台日程及頁首卻寫 10/5 **12:00am PDT**。準備與提交一律採較早的 **10/5 15:00**，不要依賴較晚時間仍能送出。若本人需要確認，可詢問官網列出的主辦信箱 webbcsc@gmail.com；本專案未代為寄信。

倒數須用當下台灣時間重算，不把「還有兩天」當固定數字。瀏覽器 console 可計算剩餘小時：

```js
const deadline = new Date("2026-10-05T15:00:00+08:00");
console.log(Math.max(0, (deadline.getTime() - Date.now()) / 3_600_000).toFixed(1));
```

## 資格與作品來源：本人確認

- [ ] 每位隊員均為 **13–18 歲高中生**；個人或 **1–4 人**。根目錄舊筆記的「16 歲」敘述不是本次身分驗證結果。
- [ ] 本人確認居住地、活動例外及 Devpost 帳號條件；未成年者確認具有合法父母／監護人同意。
- [ ] 實質開發在正式比賽期間完成；已列出賽前程式、模板、資料及設計來源。
- [ ] 所有展示資料為合成資料；若使用真實資料，已取得必要許可。
- [ ] 作品及文案未把作弊、傷害或騷擾當成用途。

資格、期間及資料要求依[正式規則](https://csc-back-to-school.devpost.com/rules)；帳號与未成年同意依[Devpost 使用條款](https://info.devpost.com/legal/terms-of-service)。是否符合資格必須由本人確認。

## 必交內容

- [ ] **名稱：** Handover。
- [ ] **問題與對象：**調課資訊分散；原授課老師、接課老師、學生及教務處需要同一份交接紀錄。
- [ ] **作品說明：**填入 [Devpost 文案](docs/DEVPOST_SUBMISSION.md)，只保留驗證過的功能主張。
- [ ] **展示證據至少一種：**可開啟的 demo、網站、影片、截圖、照片或其他清楚的證據。
- [ ] **工具與資源：**框架、函式庫、平台、外部素材與既有程式的來源及授權。
- [ ] **AI 揭露：**填入 [AI disclosure](docs/AI_DISCLOSURE.md)，能說明 AI 做了哪些工作。
- [ ] **隊員資訊：**本人姓名／Devpost profile 與所有隊員加入提交。
- [ ] **原始碼／建置／設計檔：**本案有原始碼，應附評審可存取的 repo 連結及重建方式。
- [ ] 用無痕視窗逐一開啟所有連結，確認評審无需私人帳號或授權。

依[主辦提交清單](https://csc-back-to-school.devpost.com/updates/46587-one-week-left-submission-checklist)。平台實際提交表單若另有必填欄位，仍需依表單完成。

## 選填與獎項參與

**Demo 影片為選填。** 官網鼓勵 1–2 分鐘，未列 3 分鐘硬性上限；本案[影片腳本](docs/DEMO_SCRIPT.md)採 2 分鐘，符合使用者要求的 3 分鐘內。公開網站不是一般提交唯一可接受的證據，但本案交付目標仍包含可用網址。[官網介紹](https://csc-back-to-school.devpost.com/)

| 獎項 | 現金 | 名額 |
| --- | ---: | ---: |
| CSC Innovation Gold | US$250 | 1 |
| CSC Innovation Silver | US$100 | 1 |
| CSC Innovation Bronze | US$50 | 1 |
| Honorable Mention | 未列現金 | 5 |

另有贊助額度／訂閱，屬非現金且需符合各服務條件；不應把它們當可直接兌現的獎金。Render 獎勵要求作品使用 **Render Workflows**，本案 Cloudflare 架構不能因此自稱符合。完整細目及資格見[獎項區](https://csc-back-to-school.devpost.com/#prizes)。

- [ ] 本人決定是否在 Devpost 勾選適用的 **Sponsor / Special Prizes**；使用贊助工具不會自動參加獎項。[主辦提醒](https://csc-back-to-school.devpost.com/updates/46517-two-weeks-left-we-re-just-past-halfway)
- [ ] 若選 Innovation Award／Honorable Mention，本人同意提交後公開原始碼或作品、提供公開連結、允許 CSC 在自身管道宣傳，並能解釋作品與 AI 使用。[獎項規則](https://csc-back-to-school.devpost.com/rules)
- [ ] 若領取贊助獎勵，本人另確認年齡、帳號、監護人同意與兌換條件。

## 評分與應提供的證據

官網列出 **Learning、Design、Creativity、Functionality、Impact** 五項，未公布百分比權重；不要把附件中的三項簡稱当作完整評分表。[評分標準](https://csc-back-to-school.devpost.com/#judging-criteria)

| 標準 | Handover 的展示策略 |
| --- | --- |
| Learning | 本人解釋必填交接、權限、衝堂檢查與状态機的實作取捨，說明 AI 貢獻。 |
| Design | 讓不同角色的下一步清楚可見，展示手機版與缺欄位提示。 |
| Creativity | 展示「交接完整才能送出」的強制流程，直接回應調課資訊斷裂。 |
| Functionality | 畫面連續走完老師送出、接課確認、學生準備與教務總覽。 |
| Impact | 明確指出受益對象；沒有試辦數據前，不寫節省時間或改善成績的百分比。 |

评審名單會變動，提交前可在[官網 Judges 區](https://csc-back-to-school.devpost.com/#judges)再次檢視。2026-10-03 顯示 CSC 校內評審及外部技術／產品評審；不需要依個別評審設計特殊登入條件。

## 品質與交付驗證

- [ ] [TEST_REPORT.md](TEST_REPORT.md) 的端到端、退回重送、衝堂、API 越權、不同裝置及 demo 重置項目均有實際結果。
- [ ] 格式、lint、型別、單元／整合測試、build 與 CI 結果如實記錄。
- [ ] 公開部署環境也走完主流程，不能只用本機測試取代。
- [ ] 所有介面按鈕有真實功能；影片不展示未通過的 P1／P2。
- [ ] README 包含網址、demo 登入、安裝、環境變數、seed、授權與 Known Limitations。
- [ ] 密碼重設清楚標示使用恢復碼，未宣稱已實作 Email 寄信。
- [ ] [截圖計畫](docs/SCREENSHOT_PLAN.md) 至少 5 張實際截圖；沒有學生真實姓名、敏感資訊或金鑰。
- [ ] 影片操作與文案對得上部署版本，並附短 AI 使用說明。

## 只有本人能完成的最後步驟

- [ ] 確認資格、隊員、Devpost 條款、監護人同意及獎項宣傳選項。
- [ ] 錄製／上傳影片，確認對外分享可開啟。
- [ ] 授權並完成 repo 公開與網站發布（若尚未完成）。
- [ ] 在 Devpost 填入檔案內文、網址與隊員，選擇獎項，按正式提交／發布。
- [ ] 於 **10/5 12:00** 目標時間前確認成功狀態，保存提交頁與成功畫面；最晚不得超過 **10/5 15:00**。

主辦提醒須完成提交及發布，而非只留草稿。[最後提交提醒](https://csc-back-to-school.devpost.com/updates/45925-3-days-remaining-final-call-for-submissions)。本清單勾選或 Git commit 不等於 Devpost 已收件。
