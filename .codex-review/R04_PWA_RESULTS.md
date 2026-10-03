# R04 PWA 複驗：28 項行為與真正 built 離線通過，busy 更新保護待補

固定產品 commit：`6b7b7cd734e9af06785d7f854d75dc8f3a160c6f`；handover tree：`ebbe56dda33a1547d67f17367bc067fe7a6eb2ab`。SW SHA256：`d1ff2e5d2e143e7581ce2df935dad890ae2dde245a3151dce8d0c14a19c9a722`。來源均用 fixed Git blob；R05開始施工後沒有測 moving product／操作GUI。

## 固定 SW 行為結果：28 pass／0 fail，exit0

本代理實跑：

```sh
node .codex-review/sw-behavior-probe.mjs --stable-sha 6b7b7cd734e9af06785d7f854d75dc8f3a160c6f
```

此版公开契約仍為 `/offline.html`，使用預設。工具也可明確 `--offline-path=/offline` 供之後固定候選改契約，不擅自替產品選路徑。本輪未改28斷言／六個 negative controls。此前兩種path safe fixture皆28/28、六個反例各被抓到、5個Node工具回歸已通過；參數、mock fidelity與界線見 [SW_HARNESS.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/SW_HARNESS.md)。

| R03 剩餘 | R04 closure 與實際 handler 證據 |
| --- | --- |
| 刪除其他 Cache namespace | `sw.js:78–89` 只刪 `handover-public-` 內的過期版本；VM保留其他 app/unrelated namespace、當前版，清舊版。 |
| runtime put 沒有生命週期保護 | `137–141` 將 put 加進 fetch waitUntil並處理非必要快取失敗；延遲put行為案例通過。 |
| Authorization/query/RSC/私人重導邊界 | `13–25` 排除含query、Authorization、RSC/router header；`36–47` 拒redirected/opaqueredirect、來源或最終path不同、私人API。四個**刻意構造**案例均不新增cache。原報告不是正常流程已洩漏的指控，本輪也不把合成測試寫成真實使用者曾洩漏。 |
| 公開offline307／導航失敗 | `vite.config.ts:80` 設 `html_handling:none`；SW `48–56` 重建干淨公開Response，導航fallback `115` 同樣清理；根built direct offline200、無Location、真正controlled斷網reload雙語頁成功。R03的因果推論不再當R04已知故障。 |

直接 `/api/auth/me`／workspace/detail/notifications、ICS、私人導航、非GET、跨origin都不入 Cache；私人／API網路錯誤不被公開mock假資料替換。公开allowlist離線fallback、HTTP401/403/500保留、缺offline503、install不自动skipWaiting/失败保留旧版等既有行為仍通過。這些是28項VM行為證據；沒有把regex作為驗證。

VM公開回應為 `public,max-age=3600`，private marker/Auth/query/RSC/private redirect為 `no-store`，沒有迫使正常公開正例忽略私密no-store。可合成「公開URL＋no-store」是工具額外控制，未擴成第29個未確認產品gate。VM沒有完整Vary/eviction/opaque/CORS/任意SW終止／瀏覽器内部URL list；真正navigation由built E2E另驗，不單靠VM宣稱。

## 安裝／註冊／正常更新 closure

| 範圍 | R04 固定來源與實際證據 |
| --- | --- |
| 註冊 | [pwa-register.tsx:7](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/pwa-register.tsx:7) DEV不註冊、production register catch已接；InstallGuide42–61只getRegistration，不再重複register。built E2E14真的要求目前page有controller。未觀察可重現registry失敗；不把listener時序推測擴成新gate。 |
| Standalone／安裝guide | InstallGuide109–111 standalone顯已開啟資訊並隱藏安裝promotion；預設details收合。EN/繁中有Safari/Chrome步驟及Open as Web App文案（i18n579/639）。manifest、四種PNG、apple metadata／viewport-fit與safe-area原結構仍在，沒有新變更推翻。尚未證明真機OS文案／裁切／啟動成功。 |
| 離線文案 | i18n585/643明說沒有排隊送出，重連後自行提交；offline頁雙語、沒有私密課表／送出聲稱。 |
| 用戶確認更新 | SW只在message92–94 skipWaiting，沒有install自動強更；InstallGuide90–101先listener controllerchange，再傳message，收到接管才reload，原立即reload已修。 |
| 真實兩版本更新＋Profile dirty | 根Cua built8789由R03舊cache/controller進入R04新tab5；確實看到待確認banner。Profile改名後updatebutton消失、dirty提示與欄位保留；恢复原名後點更新，頁面fullreload回home、session保留、banner消失。這是根代理的實際瀏覽器紀錄，見 [R04_BROWSER_RESULTS.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/R04_BROWSER_RESULTS.md)。正常路徑與Profile dirty可closure，不需再以「兩版本未測」阻擋。 |

JSON/ICS HTTP no-store的獨立API檢查與headers closure由根API報告負責；SW不入Cache通過不能代替所有HTTP私密回應header。亦不因某個public path曾307推測有私人重導。

## R04-PWA01 — 中：進行中的 mutation 未擋住更新

根 [app.tsx:495](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:495) 傳 `editing || drafting`。Detail 2308–2311 只以comment/supplement設dirty，act忙碌2314未上傳；Profile 2712–2719 只以name/class/subjects設dirty，reset忙碌2863未上傳；Users writingId3003也未傳根。InstallGuide84只有editing時移除更新button。因此空留言接受、原名未改的admin reset、Users toggle三條pending mutation路徑仍可顯示更新button。

這是既有 R04 prompt50 的明確要求缺口，**僅靜態證据、尚未UI實跑**，不是宣稱request必定中止／資料一定遺失。最小可反駁實證：已有waiting新SW，延遲現有mutating API response；開始操作後驗update不可觸發skipWaiting/controllerchange/reload；finally成功或失敗後恢复。保留已通過正常更新/Profile dirty路徑。R05已收斂給Cursor做這三條 authored delayed-request回歸，不追加泛化listener race或大型離線同步。

## Built E2E 真正驗了什麼

固定 `built-offline.spec.ts` SHA256：`b0e8c0a75e4bdb6cc4e4e9edb9448d6081e9acc4b7f628fbc97314124388fd56`。根實跑 **1 pass／0 fail**，不是本代理執行。8dev+1built兩套都在CI指令，retries0、不同獨立server，built script先build。

- 12–21真reload、非null controller、學生真session/workspace200；22–31真detail200後查Cache。
- 33–57查全部cache keys/URL及Response.redirected；禁止API key，offline body没有PRIVATE_TEACHER_NOTE並含双語。**只有offline body被text讀取**，不能誇大成逐一讀取所有cache body/cookie完成private掃描；VM/API檢查另提供排除證據。
- 59–63真正context offline＋fullreload後双語公開頁可見、私密標記不可見；65–70恢復網路由Try again回產品，不是合成offline事件。
- 71–86離線Profile save得到可見server錯誤、無Saved；重連reload後沒有Offline Probe值。證明該失敗寫入沒有假成功／持久化，不宣稱測過所有mutation或整套離線同步。
- 6–10 direct `/offline.html` status僅log，未將200/noLocation設硬斷言；但根本次log實證200且無Location，完整offline reload亦通過。未把重導diagnostic log誤稱安全斷言。
- 舊失敗階段reload後無條件點Student已改為82「只有未登入才點」；有效session本來可保留，此修正吻合產品契約，未弱化offline／privacy／不持久化斷言。69的auth-or-root只是重連中間等待，後續Profile/field檢查才是成功證據。

## 尚未聲稱通過的裝置／發布範圍

目前是本地built桌機Chromium＋根Cua證據。沒有公網HTTPS發布、iPhone Safari／Android Chrome真機加入主畫面、icon裁切、standalone safe-area/landscape/軟鍵盤或installed真機離線結果；這些是明確交付界線，不新增推播permission、production依賴或離線私人資料同步需求。移至HTTPS時再用實際origin確認manifest/SW MIME與scope、HTTPS Secure cookie及真機啟動。官方安裝需求與最小驗收已列 [PWA_ACCEPTANCE.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/PWA_ACCEPTANCE.md)。

本輪判定：R03全部六個VM缺口與公開offline重導問題已closure；真正built離線、正常兩版更新與Profile dirty已通過。仍待R05小幅busy-update防護與相應測試，不能由R04宣稱所有操作安全更新／真機PWA已整體驗收完成。
