# R03 前端複驗：大部分舊缺陷已修，尚有局部互動與手機問題

固定產品 commit：`f3fa696115a86f98995686b6bb934b90492133ab`；handover tree：`911adb7043d89b7487b12b9bb3d06876457699a5`。依 `ACCEPTANCE.md`、R02九組前端缺陷、核准視覺方向與R03修正prompt逐項唯讀核對。未操作Cursor／GUI／DB、未啟動產品服務、未跑install/build；產品6項E2E exit0及手機PNG觀察由根代理回報，清楚標示來源。若候選產品tree改變，這份判定撤回並需複驗。

## R02 九組逐項結果

| 原項目 | R03判定 | 固定版事實與剩餘界線 |
| --- | --- | --- |
| F01 繁中桌機layout縮窄 | 原缺陷已修 | CSS `149–153` 行長只限制 `p.prose`，不再讓所有繼承zh子元素max-width38em。E2E `43–50`測繁中登入shell1440；三角色全尺寸仍未覆蓋。不能沿用R02的608px實測數當R03事實。 |
| F02 下一堂混入另一交接 | 原缺陷已修 | app `927–933`以 `lessonId === nextLesson.id` 且Confirmed/Completed關聯，`936–941`其他交接獨立。根代理已看見下一堂10/5 Math與另一10/9交接分開；不重列原錯配。E2E弱斷言見下。 |
| F03 Detail沿用前筆留言 | 原缺陷已修 | app `1562–1563` Detail按request ID加key；原component state會重建。仍需兩筆私密標記payload手動負面流程，不宣稱只憑key等於完整安全驗證。 |
| F04 API失敗／busy／401／回饋 | 部分修正，見R03-F01 | 登出 `362–389` catch/busy/finally；workspace初始化error/retry `298–305`；refresh `267–269`不再清成功notice；Detail `2130–2147`與回應／補充／完成／取消有busy；Profile/reset `2559–2590/2654–2671`有catch/busy；Users/Audit有error/retry；Impact有retry。剩餘不是原「全部沒有catch」。 |
| F05 同安排conflicts重試 | 主要修正，401仍見R03-F01 | app `1845–1854`真retryCheck；`1709–1713`成功清error/failedKey；依賴含retryCheck且保留欄位；403具permission訊息。E2E點重試但沒等200報告／可送出，不能單憑exit0說完整恢复已驗。 |
| F06 系統字串／時間／未讀 | 部分修正，見R03-F02 | timeline `2268–2269`台北Intl與六種action翻譯；risk `1098–1102`翻譯兩種codes；notification `2477–2489`四種event、時間與read/unread文字。剩餘Audit/reminder/局部error，不沿用「timeline仍全ISO／created raw」舊描述。 |
| F07 本週調課 | 原缺陷已修 | app `1021–1025`admin顯示真 `workspace.stats.weekly`與week；跨週數字API一致性由根代理驗證，未本地DB測試。 |
| F08 simple/template/seed | seed與語言已修，simple有新跨角色問題 | service `619`seed worksheet改本地真檔；app `1797–1825`範本有EN/繁中分支，不能再說只有英文。CSS已令simple有效，不再no-op；但作用未限學生，見R03-F03。科目只換名稱仍為通用範本，屬已露出P1功能品質而非新增P0必做科目設計。 |
| F09 深色按鈕低對比 | 原靜態配對已修 | CSS `281–297` dark primary normal/hover/active與warn白字配深綠/深紅；根代理E2E測Save profile白字／#246b56。此配對比≥4.5:1，不能再沿用舊dark warn1.70。所有狀態／非文字／focus／44仍待DOM與實際互動。 |

## 剩餘確定程式問題與最小驗收

### R03-F01 — 中：局部API錯誤尚未滿足一致的401、busy、loading與可見回饋

API wrapper [client-api.ts:29](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/lib/client-api.ts:29) 仍只throw，沒有集中清session，故以下各caller的缺口是真程式事實。

| 路徑 | 已修後仍剩的事實 | 最小驗收 |
| --- | --- | --- |
| Editor衝堂／save；Detail act／view | [app.tsx:1718](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:1718)、1770、2140、2124只局部顯error，沒有根onUnauthorized；Detail view非401失敗被catch忽略。 | 每條mutation/conflicts失效session時立即回可重新登入狀態，不留假的有效登入shell；error明確。若回執失敗屬非阻擋，至少不得把失敗宣稱已保存。 |
| Profile/reset／Users/Audit/Impact | 2585／2667無401清session；Users/Audit的GET2700／2819、Impact2883全錯當network；沒有可清根user的prop。 | 401與500區分；401回登入；其他錯誤可見且可重試。 |
| 單筆notification標已讀 | [app.tsx:2470](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:2470) catch後仍finally onOpen；onOpen對應openRequest187立刻setError空字串，讀取失敗剛設的紅error因成功detailGET被清掉。busy邏輯阻止重入，但button沒有disabled顯態。 | 注入read500＋detail200，保留「未讀未成功」的可見error；詳情仍可開但不得吞失敗；401不再連續呼叫失效detail。 |
| 使用者啟停 | [app.tsx:2765](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:2765) try/catch已補，但沒有busy/disabled，await PATCH後GET期間可以重按；2782還顯raw code。 | 慢PATCH雙擊只送一次mutation，第二次GET失敗可辨識「已修改但列表未更新」，重試可恢復。 |
| Users/Audit載入 | 2690/2810初始空陣列，無loading狀態；Audit2846在真正GET完成前顯noActivity。 | 慢200期間顯loading，200空才顯empty；500顯retry；初始與重試都適用。 |
| 初次auth/me | [app.tsx:262](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:262)任何失敗都只setLoadingfalse，包含500/offline；與「尚未登入」呈現相同。 | 正常未登入401可顯登入；500/offline應有可見訊息／重試，不能讓使用者以為session正常登出。 |

先前成功notice被refresh立刻清除、登出無catch、Detail無busy、workspace初始化假回Auth等已修，不能重列。重試應保留合理未存內容，已完成的success仍可讀／screen-reader可收到，不新增本地假資料。

### R03-F02 — 中：剩餘系統雙語與時間格式缺口

- Profile API錯誤 [app.tsx:2585](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:2585)及reset2667強制 `errorText("en", code)`，繁中也顯英文；Users2782直接顯raw code。
- Notification只映射pending/declined/accepted/class_change，2485 fallback server title；真reminder事件 [service.ts:1867](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/server/service.ts:1867)仍為 `Class change tomorrow`。這是系統文案，不是老師內容。
- Audit [app.tsx:2851](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:2851)固定 `localWhen(...,"en")`，2852 map只有六個request action，2854 raw detail。真 `demo.reset`＋`Demo data rebuilt`（service2142）、`request.supplement`＋`supplement`（2474）、`user.updated`＋role（2582）等不會翻譯；不是對未知未產生事件的推測。
- supplement日期 [app.tsx:2257](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:2257)仍ISO，和同區timeline的localWhen不一致。原六狀態timeline已修；Seed actor／姓名／使用者寫的comment、reason或教材名稱可保留原文。

最小驗收：繁中profile/reset/users各422/403/401，帶reminder的通知、實際註冊/改user/reset/supplement的Audit與日期全部顯合適雙語；切EN同步；保留原始user內容。missing fields現有server `306–315`只回七個已知key、app1841有t映射，不把不存在的 dotted-field錯誤當已知問題。取消comment現在2372用t，原固定英文系統取消文已修。

### R03-F03 — 高：學生simple偏好影響後續老師／行政，桌機可同時隱藏兩種課表

[app.tsx:107](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:107)用單一 `handover-prefs` 保存simple；登出362–389不重設；root329無角色限制直接data-simple。checkbox只有學生可見2628–2638，因此後登入老師／admin不能在自己Profile關掉該偏好。

[handover.css:72](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/handover.css:72)全角色simple隱藏ledger與week-grid；在≥1100px，618还隱藏day-list。結果是同瀏覽器學生啟用simple→登出→老師／admin登入，1440週表與日列表都被隱藏。這是可由程式確定的CSS路徑，尚未自行操作GUI；請根代理實際確認。（學生simple自身桌機也需保有可用簡易課表，不能只有tab標題。）

最小驗收：simple只影響學生；同瀏覽器student開啟→teacher/admin登入，1440仍見真課表／admin統計且不需清storage。學生390/768/1440簡易模式仍可查今日／週課堂、異動詳情與todo；正常模式可戻，偏好不能削弱跨角色功能。

### R03-F04 — 高：390px同時呈現兩套主導覽，底列Notifications遭截切（根代理圖片已確認）

根代理以view_image查看固定候選 `docs/screenshots/05-student-390.png`：上方desktop主導覽排三列，同時有底列；Notifications右側被截切。來源程式對應：app335–338全部nav無手機隱藏＋533–543再render前四項bottom；CSS347–354手機sidebar仍row/wrap，511–542底列grid四格，僅≥768隐藏bottom。不是只凭猜测斷言溢出。

最小驗收：390px學生、老師、admin均有清楚單一主導覽；四個底部功能文字完整、觸控区域不超viewport，profile與admin額外功能仍可达。EN/長繁中、large/highcontrast、system放大／鍵盘／safearea一起測；必要可以用drawer或更精簡tab，但不硬套元件庫。

安裝guide不是預設展開：E2E115先click summary，才存05/06。不能把展開占大半首頁當default缺陷；但兩張連續相同狀態不是兩頁覆蓋。PWA其他缺口另見 [R03_PWA_RESULTS.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/R03_PWA_RESULTS.md)。

## 手機／視覺與真資料驗收界線

- checkbox目前CSS256–261給可點label min-height44，已修原缺高度；input本體18px不是單獨WCAGfail。必須量真正label可點rect／fragment、minimum寬高／viewport內可達；nav44高也不能覆蓋被截出螢幕的文字與target。量測focus可見且不被sticky底列遮住。
- dark原配對已修，不據此宣稱完整AA；light/dark/contrast/large的normal/hover/active/focus/error/disabled與button、link、input邊框、statusicon要DOMcomputed＋必要人工檢查。Disabled文字豁免文字對比，但專案44gate仍看；gradient/opacity/background未解需manual，不能自動冒稱AA。
- 真實font loading/fallback、Noto子集外長姓名／繁中、reduced-motion、Editor手機所有七欄與多教材、keyboard／螢幕閱讀順序沒有本輪親自GUI證據。Editor當前為inline form（1829），不要聲稱已測modal／dialogfocus trap。
- 正常API與真資料仍保留：detail GET＋跨週 `186–201`，load generation `226–252`防舊結果覆蓋；學生todo true API `2234`與私密fields排除已由根代理前輪驗過，不重列fake保存或私密原因仍曝光。未將API安全結論擴大到所有raw payload；各端點privacy由根代理獨立API驗收判定。
- 通用template已雙語、真本地教材；若仍命名「科目範本」，科目內容只有名稱替換，可調整為「通用交接範本」或之後補真差异。這個已露出P1品質項不單獨擴張為P0必做完整教材系統。

## 產品E2E通過能證明什麼

根代理重新跑6項E2E exit0；本輪唯讀比對實際斷言：

| 測試 | 實際覆蓋與限制 |
| --- | --- |
| 英文／繁中shell全寬 | workspace.spec23–40只迴圈**登入英文**390/768/1440；33把body加入locator且first依DOM先取body，所以不是每輪真shell尺寸。41–50只測繁中1440登入；測試名稱role shells未真的登入三角色全部尺寸／語言。 |
| student下一堂 | 57只1440；62若無箭頭整個日期斷言跳过，有箭頭只要求不是Friday（66）；沒有核對下一堂lesson ID／日期／period／點擊detail的API ID，可能vacuous pass。根代理實際圖片與靜態lessonId修正另有證據。 |
| conflicts重試 | 74在1280老師；87/88驗button與原Room保留，90click後91直接screenshot，沒有assert重試200報告／error清除／submit恢复，不能把全流程當已自動驗證。 |
| student390＋install | 97只390學生英文，115先展guide；05/06連續同狀態117/118。無老師mobileEditor／adminmobileUsers／768任何登入後角色。 |
| offline | 121–178未切真offline、reload/navigation；詳見PWA結果，不算真正離線導航證據。 |
| dark | 184在1280admin，只Save profile normal computed白字與green；未測hover/active/warn/focus/非文字/全模式對比與44。 |

最小補測：登入＋teacher/student/admin ×390/768/1440 ×EN/繁中實際shell/overflow/可達導航；以source API IDs核下一堂／跨週detail；2筆留言state隔離；完整七欄負面送出gate／多教材／草稿retry／conflicts延遲逆序＋500重試恢复；每項mutation成功、500、401、慢網雙擊；學生rawpayload privacy、todo reload；四種顯示偏好尤其跨角色simple；真正offline/更新；分享可用的不同頁面截圖。新增測試應驗使用者結果，不只重述實作或寬鬆跳过。

結論：不能以6 E2E綠灯推廣為前端全部通過。九組舊缺陷多數已有修復；當前需要針對F01–F04剩餘問題小幅修正與具體負面／跨裝置驗收，避免重做已修部分。本報告僅reviewer檔案；最終合併root真正built Worker GUI/API結果後再判整體交付。
