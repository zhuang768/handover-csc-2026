# Handover — Screenshot plan

拍攝目標：7 張實際操作截圖，英文介面為主。這是拍攝清單，**不是已產生截圖的證明**。驗收後才拍；截圖不能代替完整主流程測試。

使用一致的合成案例，讓每張圖中的班級、科目與交接單對得起來。桌面 1440×900，手機 390×844。只裁掉無關瀏覽器邊框，不加工錯誤訊息或修改資料造成成功假象。

| # | 建議檔名 | 拍攝角色／畫面 | 必須呈現的重点 | 英文圖片說明 |
| --- | --- | --- | --- | --- |
| 1 | `01-teacher-next-action.png` | 原老師首頁或週課表 | 今週課程、待填／待確認區、建立申請入口；30 秒內辨認用途。 | “A teacher sees which class changes need their next action.” |
| 2 | `02-required-handover.png` | 老師建立調課 | 留一個必填欄位空白，截到缺漏說明及不可送出狀態。 | “A complete handover is required before a change can be submitted.” |
| 3 | `03-schedule-conflict.png` | 老師選擇新時段 | 實際衝堂提示，說明是哪個班級／老師衝突；若有空堂建議一并呈現。 | “Schedule conflicts are explained before a request moves forward.” |
| 4 | `04-receiving-teacher.png` | 接課老師交接詳情 | 教學進度、教材與接課操作；姓名皆為合成。 | “The receiving teacher reviews the lesson context before confirming.” |
| 5 | `05-student-mobile.png` | 手機學生首頁／詳情 | 原老師→接課老師、新時地、教材與已勾選準備清單；沒有老師私密備註。 | “Students get the change and a preparation checklist for their class.” |
| 6 | `06-admin-history.png` | Admin 总覽＋詳情 | 搜尋／狀態篩選、該筆時間軸、誰／何時／做了什么。 | “The school office follows the same record from request to confirmation.” |
| 7 | `07-traditional-chinese.png` | 手機繁中學生視圖 | 繁中切換、可讀文字、明确下一步；若大字功能已驗證可顯示。 | “The same preparation workflow is available in Traditional Chinese.” |

## 封面選擇

封面建議使用第 2 張或第 5 張；旁邊短句只用：**Every class change needs a complete handover.** 不要只用裝飾性登入畫面當主要證據。若另製作封面合成圖，清楚標記它是封面，不當實際 app 截圖。

## 拍攝步驟

1. 重置 demo，確認視窗的登入角色，不用不同分頁假設不同身分。
2. 走完一筆真實交接流程，保留一致的案例。
3. 依第 1–7 張的畫面操作與截圖；尚未驗證的可選功能不拍。
4. 把實際截圖放 `docs/screenshots/`，提供最終尺寸與拍攝日期。
5. 在 Devpost 依流程排序並貼上英文圖片說明。

## 圖片檢查

- [ ] 沒有 `.env`、API key、session、恢復碼或真實密碼。
- [ ] 沒有真實學生個資、健康、輔導或特殊需求紀錄。
- [ ] 全部畫面来自实际可使用版本，没有空壳按钮。
- [ ] 桌面／手機內容沒有被切掉，按鈕與提示可讀。
- [ ] 文字、圖示與狀態對得上，沒有只靠顏色表達異動。
- [ ] 第 3 張顯示實際阻擋；第 5 張顯示保存後的勾選結果。
- [ ] 圖片與影片、文案、TEST_REPORT.md 使用同一版本。
