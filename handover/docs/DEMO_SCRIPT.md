# Handover — 2-minute demo script

錄影目標：**120 秒**，符合使用者要求的 3 分鐘內，也落在[官方鼓勵的 1–2 分鐘](https://csc-back-to-school.devpost.com/)範圍。官方影片選填，沒有要求一定要 3 分鐘。

狀態：**錄製腳本草稿。** 下列操作必須先在實際公開版本跑通；任何未完成或未驗證的畫面都不能用剪接偽裝成成功。已通過項目以 TEST_REPORT.md 為準。

## 錄影前準備

1. 重置 demo，預先確認三個角色帳號與資料可用。
2. 準備 4 個分開的瀏覽器 profile／私密視窗：原老師、接課老師、學生、Admin。不同分頁通常共用 cookie，不能靠分頁保留不同身分。
3. 在老師畫面選一筆 **尚未提交**的可用課程；確認代課對象在該時段有空。
4. 使用合成例子：數學 Unit 4、workbook pages 32–34、bring workbook、submit worksheet。不要放真實學生個資。
5. 把尚未驗證的 P2 畫面移除。第 7 鏡預設展示英文／繁中與手機學生視圖，無障礙大字若已驗證可替換。
6. 開啟英文介面；錄影解析度以 1920×1080 為主，手機鏡頭約 390px 寬。
7. 可預先填好長欄位，但必須真的按送出、接受及勾選，保留載入與成功後的結果。

## 逐字稿與分鏡

總共約 244 個英文單字，平均每分鐘約 122 個字。鏡頭時間包含操作與停頓，不必把每個欄位逐字讀出。

| 時間 | 秒數 | 畫面與操作 | 英文逐字稿 |
| --- | ---: | --- | --- |
| 0:00–0:14 | 14 | 開場：簡單顯示課表異動與產品名稱，游標指向教材／作業資訊。 | “A teacher is absent. Students hear, ‘Tomorrow, study on your own.’ But what should they bring? What happens to the quiz? And where should the next teacher begin?” |
| 0:14–0:27 | 13 | 登入頁，一鍵老師登入；開啟建立調課，留一個必填欄位空白，顯示缺漏與無法送出。 | “Handover carries the lesson through a class change. Its rule is simple: no complete handover, no submission. Here, missing lesson context keeps the request from moving forward.” |
| 0:27–0:52 | 25 | 選一堂課及代課老師；補齐教學進度、內容、材料、作業／小考、教室需求與兩種提醒，按送出；停留 Pending 結果。可插入已確認正常的衝堂提示。 | “I choose the class and a substitute, then explain our progress, the suggested lesson, materials, assignments, and reminders. Teacher notes stay separate from student information. The schedule is checked for conflicts. With the required details complete, I submit one record that everyone can follow.” |
| 0:52–1:08 | 16 | 接課老師独立視窗，進入待確認通知／清單，打開交接內容，按接受，显示 Confirmed 與時間軸。 | “The receiving teacher opens the handover and accepts it. If the plan needs work, they can decline with a reason. The original teacher can revise and resubmit. Each transition remains visible in the history.” |
| 1:08–1:28 | 20 | 學生視窗，班級 Today／This Week 開啟同一筆異動，勾選準備教材；重新載入，保持勾選。 | “The student now sees the class change and a concrete preparation list: bring the workbook, submit the worksheet, and review the next unit. I check a task and reload. My progress is saved, and I only see information for my class.” |
| 1:28–1:43 | 15 | Admin 視窗，搜尋該筆紀錄、篩選 Pending／Confirmed，開啟完整時間軸；實際統計／風險區僅驗證後展示。 | “The school office can find the same request, filter its status, and see who acted and when. It becomes a shared operational record instead of another message to chase.” |
| 1:43–1:52 | 9 | 切換繁體中文，縮至手機學生視圖，顯示可操作的準備清單。 | “English and Traditional Chinese support the same workflow. On a phone, students still get a clear next action before class.” |
| 1:52–2:00 | 8 | 收尾：產品名稱與公開網址（只有真實發布後填入），字幕 AI development assistance disclosed。 | “Our next step is a school pilot. Handover makes every class change a handover, so learning can continue.” |

## 可選替換鏡頭

P2 未通過前，不使用「AI 產生交接單」「QR 交接卡」「家長連結」等描述。若大字／高對比模式已驗證，可用以下 9 秒鏡頭替換 1:43–1:52，總長維持 120 秒：

畫面：手機學生頁开启大字模式，準備清單仍能完整顯示及勾選。

> “Larger text makes the preparation list easier to read. Accessibility supports the same lesson, without asking students to find a different workflow.”

若學期影響分析已驗證，也可改為 Admin 圖表，必須明確標記 synthetic demo data，不把圖表當實測效益。

## 字幕、收尾與最終確認

- 全片英文字幕；可另附繁中字幕檔，不用佔畫面放兩種全文。
- 開場只描述情境，不聲稱已訪談或試辦。
- 末尾可加小字：**Built with AI assistance. See project disclosure. Synthetic demo data.**
- demo URL、repo URL、隊員姓名只放真實可分享的值。
- [ ] 未填完交接不能送出：實際操作有錄到。
- [ ] 送出後接課老師看见同一筆：不是兩筆不同的 seed 案例。
- [ ] 接受後學生及 Admin 顯示一致紀錄。
- [ ] 學生勾選後重新載入仍保存。
- [ ] 成片長度 ≤ 2:00；移除錄影前的等待、切換 profile 與冗長輸入。
- [ ] 所有旁白主張符合公開版本及 TEST_REPORT.md。
- [ ] 分享連結不用登入也可播放。
