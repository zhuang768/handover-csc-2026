# Handover：已核准的視覺改版，接續第2輪錯誤修正

使用者已於2026-10-04直接確認：「採用這個方向，直接實作（推薦）」。請在同一個 Cursor 對話和同一個產品完成改版，不必再詢問方向。先完成目前 CURSOR_REPAIR_R02.md 的核心功能、安全、資料庫修正，再依本文件改版；不要丟棄既有修正或只交一張漂亮登入頁。最後整體停止編輯並交給 Codex 獨立驗收。本文件是使用者新增要求，與原始 P0／資料保護／GitHub交付一起生效。

工作區：`/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon`；產品：`handover/`；branch：`handover`。Codex 不會與你同時修改產品。先讀 DESIGN_DIRECTION_PENDING.md、DESIGN_REFS_EDUCATION.md、ACCEPTANCE.md，以及 VISUAL_ACCEPTANCE.md（若已產生）。不要改 Codex 的獨立測試與報告，原本 product tests 可增加真回歸案例。

## 1. 研究已完成，採用明確手法

使用者要求「先上網找5–8案例、整理優缺點、確認後才動手」。Codex 已完成8案例並取得核准；可以直接實作。若需要查某套件 API／字體資產，查官方來源，不要重新耗時蒐集整批參考或抄整個範本。來源寫入產品 DESIGN_NOTES.md／CREDITS.md，說明實際借鑑了什麼。

1. WebUntis：https://help.untis.at/hc/en-150/articles/18231094538396-Navigation-and-Color-Scheme-in-the-New-Timetable-View 。借清楚週次、班級／教師定位；不要密集企業矩陣。官方22255697940764附件是日期選擇器，不能誤稱完整課表。
2. Google Classroom 官方教師指南：https://services.google.com/fh/files/misc/google_classroom_user_guide.pdf 。借教學內容、教材、對象分組與草稿／發布區別；指南是資訊組織參考，不能宣稱2026即時介面。不要加評分、AI或大班級封面。
3. Cal.com：https://cal.com/blog/calcom-v6-2 。借細線週格、低干擾課程表面、窄色邊、明確週次。Codex實際檢視的日曆圖為 https://framerusercontent.com/images/BgiY1AZCj7h3Bky4LKzFqxrLTl4.png ，只做參考，不複製圖片或原始碼。不能把文章當每個帳號預設UI證據。
4. Linear：https://linear.app/plan 。借對齊的狀態／對象／日期與聚焦詳細內容；不要近黑行銷外觀或超小字密度。
5. Todoist：https://www.todoist.com/task-management 。借溫暖留白、Today／下一步與自然空狀態；不复制品牌紅、評論或插圖。
6. Notion Calendar：https://www.notion.com/product/calendar 。借桌機週格／手機每日清單互補；不要眾多競爭色彩及外部串接功能。
7. shadcn：https://ui.shadcn.com/examples/dashboard 。借控件一致性、欄位／選單／焦點／狀態；不抄銷售四卡、Acme、範例數字或整套模板。
8. Material3：https://m3.material.io/styles/motion/overview/how-it-works 。借服務狀態理解的 standard 動態；不用 expressive overshoot、持續浮動或所有區塊淡入。

最貼近三個：Todoist＝學生下一步；Cal.com＝週課表與節次；Linear＝交接詳細與管理列表。請真正套用到相應頁面。只借手法，不下載／複製他人品牌、介面截圖、行銷文案、插圖或來源不明元件。

## 2. 唯一視覺概念與設計系統

「清楚的校園課務手冊」：像用心排版的工作文件，暖白紙面、墨綠操作、深色墨字。日期、節次、異動與下一步帶出層次。寬窄對比、細分隔線、適量留白與不對稱，不把所有內容做成同樣圓角卡片。

CSS tokens採 primitive→semantic→component，以清楚命名覆蓋所有現有視圖，整併舊CSS並避免層層附加覆寫：

- 頁背景#F6F4EF，內容表面#FFFFFF。
- 主文字#202D2A，次文字#5F6B64。
- 主操作／完成#246B56，搭白字；hover/active需另外選可讀深色，不靠降低opacity使字變淡。
- 待確認文字#8A5A08／底#FFF3D6。
- 退回／錯誤文字#A12F2F／底#FFF0EC。
- 另明確定義border、focus、link、disabled、loading、selected、草稿與取消的語意色。狀態總是文字＋一致圖示，不能只看顏色。
- 白字／主綠已計算6.34:1，主文字／紙面12.99:1，次文字／紙面5.06:1，amber和error配對5.37/6.39。這不是整頁AA保證：實際computed顏色、深色／高對比模式、一般字>=4.5:1、非文字控件／焦點>=3:1要逐一驗證。若既有模式入口保留，它們必須真有作用。

字体Manrope（英文字／數字）＋Noto Sans TC（繁中），合理fallback，內文16px／行高1.65–1.75，標題28–36px、區塊20–24px、標籤14px；字重控制400/500/600/700。日期與節次tabular-nums，繁中段落約30–38字／行、英文約65ch。不能唯一依賴Inter/Roboto/system；不要把中文渲染成簡中字形。Google Fonts官方來源、woff2、font-display:swap，限制字重／子集，避免整份大CJK字體preload。網路無字體時仍可讀、layout穩定；若本地化資產，保存OFL，不可寫入金鑰。

## 3. 全角色與登入的實際版面

先檢視既有app.tsx／CSS結構，再按既有React19/Vinext/Cloudflare/D1架構實作，必要時拆清楚的現有元件。不要換框架、重寫API或添加新的資料服務。

- **登入**：不對稱的文字／工作文件圖形；自製SVG描繪週次與交接關係，有適當decorative/accessible處理。英文預設、繁中可切，主句可用「Change the timetable. Keep the lesson ready.」／「換課之前，把下一堂說清楚。」依真人文案調整。登入、註冊、找回均真正可用。4個真demo按角色分組，不能像3個行銷功能卡。
- **學生**：日期／今天之後先顯示下一堂、實際改變的時間／老師／教室／要準備什麼；準備事項是自己的真DB待辦，不可造數據。不為固定3條而隱藏更多待辦。Today為主、ThisWeek次要；週末誠實顯示今天無課，下一上課日另說清楚。390px單欄日程、合理底部導覽或簡潔頂部導覽，不先塞巨大側欄；完整週表可切換但不能造成整頁水平overflow。
- **老師**：桌機主週表＋較窄的待回應列表；日期與節次、班級／科目／場所固定顺序。原安排→新安排清楚，異動格圖示＋文字＋顏色。交接表單分課程安排、教學內容、教材、學生提醒、教師私密內容，仍維持7必填項／live gate／conflict validation。狀態／missing count清晰；草稿和送出分開。固定actionbar不能蓋欄位或鍵盤焦點。
- **行政**：以完整篩選列表為主，日期／班級／教師／狀態／搜尋組合篩選可用，較小的真本週數字區與可處理風險列。桌機聚焦詳情區、手機單欄完整詳情／返回；不要多張等寬假KPI卡。
- **詳情、通知與設定**：跟同一tokens／字體／狀態元件；跨週通知仍真GETdetail，角色可見欄位不因改版漏保護。系統時間軸／錯誤／空態中英完整，教師自寫內容可保持原語言。表單label、hint、error與focus顺序清楚。

單一圖示系統用已安裝lucide-react，大小／stroke一致。自製圖形代替灰placeholder，避免stock圖和emoji。實際demo資料標示為示範；沒有假好評、假客戶logo、假學習改善或placeholder教材。

## 4. 互動、無障礙、RWD與效能

- 所有可見控件都有hover/focus-visible/active/disabled/busy/error/empty；非互動資訊不能偽裝button。44px最小觸控目標，表格iconbutton也要達標。
- CSS transform/opacity約140–220ms，僅面板開關、日期切換、送出／儲存狀態、待辦成功回饋；先等API持久化成功再說已完成。不加無目的的首屏／所有卡fade、捲動劫持、无限bounce、霓虹、毛玻璃或紫藍漸層。
- prefers-reduced-motion減少或去除移動，busy狀態仍清楚；必要時既有設定可提供關閉動態，但不要新增沒作用開關。這些互動CSS即可，不為了用skill而加GSAP/Three/Lottie大型依賴。
- 語意main/nav/header/form/heading；label/hint/error連結、適當aria-live、keyboard focus／詳情返回焦點、必要Escape／Tab行为；SVG無意義就aria-hidden。不要aria濫用或focus trap沒有出口。
- 實测390/768/1440，EN與繁中、長姓名／教材標題／URL、週末empty、載入失敗、衝突、disabled、已取消、私密老師資料；手機無整頁橫向overflow，內容不是裁掉，focus不被sticky遮住。
- 限制fonts與JavaScript重量，分角色資料按需讀取，保留既有快取及安全機制。禁止新productiondependency、外部analytics／email／auth／AI付費服務；確有必要先在HANDOFF解釋理由給Codex判斷。

## 5. 合適skills、授權與交回

本機可用skill在 /Users/zhuangzijin/.agents/skills 與 /Users/zhuangzijin/.codex/skills；真的讀適用SKILL.md後用，不要只列名字。此輪適合design、redesign-existing-projects、design-system或ui-styling、React best practices、ai-debt-detector、Playwright／既有瀏覽器驗證；權限與並行缺陷依原R02的security／workers技能。不要套明確只做landing的skill到課務dashboard；任何skill的假stats／隨機stock／外部Gemini/key setup建議都不適用。不要安裝插件、改模型／帳號／系統設定來湊數。

已核對資源授權：

- Manrope OFL1.1 https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt
- Noto Sans CJK OFL1.1 https://github.com/notofonts/noto-cjk/blob/main/Sans/LICENSE
- Lucide ISC及Feather衍生MIT部分 https://github.com/lucide-icons/lucide/blob/main/LICENSE
- shadcn MIT https://github.com/shadcn-ui/ui/blob/main/LICENSE.md

保留必要notice與既有starter來源，不把整套Lucide誤稱MIT，不假設Cal.com原始碼MIT。設計來源看法不等於資產可再散布。

完成後實跑原有format/lint/typecheck/API/independent tests/build；新增或更新有意義的互動回歸，不以DOMclass鏡像測試充數。真瀏覽器三角色和正反流程＋四demo＋390/768/1440＋中英＋keyboard/reducedmotion/contrast；記錄實際做過項目，不把未驗證事項寫成完成。沒有可用瀏覽器就明確交代讓Codex複驗，不要虛構截圖。

自我檢查AI感，具體指出並修正：是否每區都一樣、等寬iconcards、空洞文案、假統計、圓角陰影濫用、無目的動畫。產品 DESIGN_NOTES 說明8參考／真正借用的3個／色彩字體motion理由／授權／可微調tokens。HANDOFF列本輪實際skill、檔案改動、測試證據與剩餘限制，5–8張真畫面截圖／記錄。

整合目前R02修正與視覺改版後，保持branch、commit可審查版本，停止產品檔編輯，更新根 `.codex-review/CURSOR_STATUS.json` 為round2 ready_for_review，並在同對話清楚交回。不要push未驗收產品或新建Sites；GitHub及既有Sites公開發布仍由Codex在獨立驗收通過後處理。
