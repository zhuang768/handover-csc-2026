# Handover R04：舊資料升級、手機 App 操作與真正離線驗證

繼續同一個專案／branch／Cursor chat。使用者已核准暖白 × 墨綠設計，最新明確用途為「網址開啟，加入手機主畫面使用的 App」。不需再問方向；不要重建專案、建立新 Site 或加入 production dependency。

R03 固定產品 commit `f3fa696115a86f98995686b6bb934b90492133ab`，status-only HEAD `b3753d7e35562359368978d23b902124732e0631`。原82個独立案例、26個產品案例、format/lint/types/build與現有6個E2E全部通過；多數舊問題已修。**本輪只關閉下列已證實問題和必要的證據缺口，保留所有通過成果。**

先讀 `.codex-review/R03_API_RESULTS.md`、`R03_FRONTEND_RESULTS.md`、`R03_PWA_RESULTS.md`、`R03_BROWSER_RESULTS.md`；若已存在也讀 `R03_DOCS_MIGRATION_RESULTS.md`。ACCEPTANCE／PWA_ACCEPTANCE／VISUAL_ACCEPTANCE仍適用。reviewer-owned檔案、SQL adapter、assertions不可修改、skip或混入你的產品commit。

## 1. 真實 R02 舊庫升級不能使有效帳號409

新增兩個真實歷史升級案例後，独立suite是 **84個計數：82pass、2fail**，不是82全綠即完成。完整R02已seed與R02種子曾中途失敗的部分庫，套用R03 migration後已有普通真實註冊帳號、有效session的 auth/me 都409 INVALID_STATE。

最後新增**一個必要資料保留case**（independent-api.test.mts979，R04_BACKEND_READINESS）：先以真API修改demo profile、move/confirm課表、交接/supplement、學生todo/view，再升級逐row確認原值保留；同case含部分庫edited profile與普通帳號/session保留。固定R03匯出副本已實跑：**最新85計數82pass3fail0skip**，三fail同屬legacy根因。現在請跑最新85，不能只跑舊84或82。

根因：R02寫 `meta.seeded=1`，R03 `schoolReady`只認seed_complete；0001僅加transition_token，沒有相容。seedIfEmpty重新plain INSERT已存在classes而失敗。此為真正舊service與migration重現，非任意偽造marker。

實作可維護相容：完整舊種子先驗完整再記新版完成標記；部分舊種子原子補齊缺失的demo關聯和完成標記，保留既有帳號、普通註冊、session、改過的課堂／交接及關聯。不要清庫、reset、刪資料或把所有seeded盲目視為完整。仍維持空庫seed fault/retry、8個同時首次登入、CAS敗方無副作用與stale submit gates。

repo根命令：
`node --experimental-strip-types --test .codex-review/reviewer-harness.test.mts .codex-review/independent-api.test.mts`

## 2. 手機操作必須像 App；修現有導覽與跨角色偏好

真390px截圖05證實：上方desktop nav排三列，同時存在固定bottom nav，右側Notifications文字截切。請給手機單一清楚主導覽；四個底列功能可讀、不超viewport，Profile／語言／登出及admin額外功能可到達。可以合適的More/drawer，但保持鍵盤、focus、safe area、44px、長繁中與英文、large text。桌機仍保留完整工作台，不以overflow:hidden遮問題。

學生simple checkbox仍存在；全域handover-prefs與root data-simple沒有角色限制，CSS同時隱藏week-grid與桌機day-list。student開simple後登入teacher/admin也失去課表且無法關。simple只適用學生，学生簡易模式390/768/1440仍有可用課堂列表、詳情和TODO；同瀏覽器切teacher/admin週表與统计完整，不需清localStorage。

## 3. 完成局部API回饋與已知系統雙語

R03_FRONTEND_F01/F02列有精確caller與行號，已修的catch/busy/notice不要重做。補目前剩餘：

- Editor/conflicts/Detail/Profile/reset/Users/Audit/Impact的401一致撤有效登入shell、給重新登入與清楚理由；其他500/network保留合理輸入、有可見retry。初次auth/me500/offline不能當正常未登入。
- 單筆通知read500後detail200目前清掉未讀保存錯誤；保留可見訊息，401不要再呼叫失效detail。慢網busy disabled可見。
- Users啟停慢PATCH期間只能寫一次；PATCH成功但GET失敗明確說列表待刷新。Users/Audit慢GET顯loading，成功空才empty，錯誤retry。
- Profile/reset不再強制errorText(en)，Users不顯raw code；reminder通知、已實際產生的audit actions/detail（demo.reset、user.updated、request.supplement等）、supplement日期以目前locale/台北時間呈現。老師自由輸入、姓名／教材名稱不翻譯。

用清楚共用helper處理即可，勿加全域unhandledrejection吞錯誤，也勿把網路失敗顯示成成功。

## 4. PWA：小型、安全而能真正運作的離線與更新

保留manifest／4個真PNG／scope／standalone／安裝引導／公開資產allowlist；直接API、私人navigation、ICS與非GET的SW排除已通過，別誤改成cache課表。

確定小缺口：

- activate只清理自身 `handover-public-` 舊版本，不刪其他Cache namespace。
- runtime cache.put納入respondWith或waitUntil生命周期並處理失敗，不讓非必要cache失敗吞正常回應。
- 公開allowlist拒有Authorization／敏感query／RSC請求；不cache重導到私人URL、不同origin或不同資源。四案是防護補強，沒有宣稱目前普通流程已洩漏私人資料。
- 私人ICS Response補no-store HTTP header（SW bypass與HTTP快取是兩層）。
- 註冊集中並catch失敗，避免PwaRegister uncaught＋InstallGuide重複；dev SW影響HMR需避免，PWA驗證改固定built runtime。
- 更新只在使用者同意且沒有未存輸入／正在mutation時執行；postMessage後**等待controllerchange再reload**，勿立即reload舊controller。Editor以外Detail留言、supplement、Profile修改也不能丟。若簡化為更新提醒＋手動安全重開，要完整誠實，不聲稱測過自動安全更新。
- standby／已安裝狀態不再促銷安裝；iOS指南包含版本適用的Open as Web App；離線banner明確說重連後需重新送出，沒有背景queue。

**真正offline navigation目前未驗過**：現有E2E只在線讀Cache與dispatch合成offline事件，沒有断網／reload，不能以此完成本項。

更具體待驗假設：根代理built Worker實際log `/offline.html` **307→`/offline` 200**。目前install實際fetch→cache.put可能保留redirected response，直接作navigation fallback可能被瀏覽器拒絕。根代理停自有Worker後Cua reload看到ERR_FAILED，controller未證實，所以因果仍需你用真正built regression證實。Cloudflare預設HTML canonicalization與WHATWG條件可查：
https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/
https://fetch.spec.whatwg.org/#http-fetch

先寫/重現能紅的真正導航測試，再修成綠；可用正確公開canonical route、合適asset設定或安全的公開回應處理，不盲目允許redirect私密內容。不准把測試換成合成event來消失紅燈。

独立SW行為工具的28個case目前22pass6fail。工具以固定git sha讀SW，不讀moving tree。產品commit後run：
`node .codex-review/sw-behavior-probe.mjs --stable-sha <實際40位產品SHA>`
如果公開offline路徑契約改了，向Codex指出差異；不要自己改reviewer工具或弱化斷言。

## 5. 精準的瀏覽器回歸、截圖與文件

產品自己的Playwright/CI補真使用者結果（不增加prod套件），隔離已遷移D1、不動共享開發庫或rootreviewerstate：

- 登入入口＋student/teacher/admin，390/768/1440，EN/繁中：**實際登入後**shell尺寸、無水平溢出、可達navigation與真44px，至少學生simple跨角色回歸。既有登入viewport測試不能稱全角色測試。
- 下一堂核對真正lesson ID/日期/節次與點開detail，沒有條件式跳過；conflicts500 retry必須等200、清錯與送出恢復；Detail不同ID輸入隔離；上述401/慢網/失敗回饋要具體斷言。
- **built Worker**上assert active controller；登入與實際workspace/detail API後讀Cache，無private API/HTML/cookie內容；真離線(full reload/navigation)顯公開雙語fallback，真重連主動retry回App；仍在線DOM時真斷網mutation不能假成功，重連不自動補送。不要只驗cache key，也檢查body不含測試私密marker。
- 更新若保留自動接管：兩版SW、waiting、草稿／留言阻擋、按確認後controllerchange再reload的真行為證據；無真機時別冒稱iOS/Android已加入主畫面成功。
- 5–8張不同真畫面：健康的teacher editor、student390首頁（guide收合）、mobile detail、獨立install guide、至少一張768平板、admin桌機/繁中；03現為Server error，05/06相同，不適合充當完成畫面。

README/TEST_REPORT同步真PWA定位、安装／需要網路／更新方法。每個命令列SHA、exit、實際案例數與coverage邊界；刪過時「未跑Playwright」等矛盾；第三方font/icon credits與Cursor＋Codex AI揭露一致。人名/監護人/資格/Devpost terms/影片最後提交保持真人待辦。

R03_DOCS_MIGRATION_RESULTS已落盤：README37把npm run db:migrate寫成生產遷移，但script固定--local；請明確限為本機命令，Sites正式D1由封包SQL／metadata發布流程套用，不移除--local、不編造remote DB ID。截圖05/06實際PNG寬392雖宣告viewport390，請用真document client/scroll width修溢出。Sites portable build/package在固定R03匯出副本已通過，PWA bytes與migration metadata皆在tar，不重建Site。

發布來源的小修：父根已ignore handover/tsconfig.tsbuildinfo，但**app自身.gitignore缺 *.tsbuildinfo**，Sites外部checkout只匯出app且helper在commands之後git add --all。請在app .gitignore同步忽略生成typecheck檔案，避免把本機generated artifact收進正式來源；不是在release副本偷偷補。保留本機檔案與已取消追蹤狀態。

空D1 npmci→npmdev四demo、第二次migration no-op、schema/journal/dbgenerate通過已有獨立證據。**0000多statement chunk实际D1.batch已建14表通過，不是已證實Sites failure，不需為假想錯誤另重構migration。** 新migration若必要仍保持metadata一致、不寫大量種子。

## 6. 交回

實際使用適合的 diagnosing-bugs、security/workers、design-system/ui-styling/React、ai-debt、Playwright skills，記錄用了什麼解決哪個問題；不盲目堆skill或新增插件。可以平行分後端／前端／測試文件，不多人同改app.tsx/service。

所有相關format/lint/types/productAPI、**最新85計數独立suite**、build、必要migration、真瀏覽器/PWA回歸都跑。不要skip、continue-on-error、刪失敗斷言或僅換測試名字。

完成可審查產品commit，停止產品編輯，`CURSOR_STATUS.json` round4 ready_for_review＋真實當前時間／產品SHA／命令exit／已驗與未驗清單，同chat交回。不要push未驗收版本；GitHub與既有Site正式發布仍由Codex驗收後處理。不得重建Site、改帳號／付費服務或執行Devpost最後提交。
