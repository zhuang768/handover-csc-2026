# R05 前端獨立唯讀 source review

日期：2026-10-04（臺北）。**本輪指定範圍未找到 actionable blocker**。只讀 frozen diff 與完整相關函式／新增測試；沒有改產品、測試斷言或啟動服務／GUI，也沒有把 source inspection 當 E2E 已執行結果。根代理正在執行整合檢查與真正 E2E。

## Frozen blob 前後核對

以下檔案開始與結束 `git hash-object` 完全相同，最後檢查 UTC **2026-10-03 18:24:34**：

| 檔案 | 開始＝結束 blob |
| --- | --- |
| `components/handover/app.tsx` | `841fdd3442cd286efb4271cd28329c8bcd769c82` |
| `components/handover/install-guide.tsx` | `31367d79e39db17cf78587968bab8480b75ea079` |
| `lib/client-api.ts` | `aad5fd0c8bd0376cb09ec23baaefe9eb7f42ecae` |
| `tests/client-api.test.ts` | `29645c00a2692ca6e01027454190d416e8637a7c` |
| `tests/e2e/built-update.spec.ts` | `5b3e422ea902ab188f33e1677e4667c363f5b041` |
| `tests/e2e/workspace.spec.ts` | `05c69b5affd3a1cb8f769b1f98b66fa272eff69e` |

表內相對 path 都以 `/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/` 為根。最初讀取把 client-api 誤放 components 子目錄，唯讀查找失敗；已改讀真實 lib 路徑，並未列為產品問題。

## Pending-write 更新保護

[client-api.ts:34](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/lib/client-api.ts:34) 將 method 正規化，只對 GET／HEAD 之外的請求增加共用 counter；增加發生在 fetch／JSON.stringify 前，減少在 `finally`，且 await response JSON 後才減少。網路錯誤、非 2xx、無法序列化 body 都經 finally 釋放。多個同時 mutation 使用計數，不會由先完成的一筆誤解除另一筆。

[app.tsx:199](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:199) 用 `useSyncExternalStore` 讀真正 counter，並將 `pendingWrites>0` 傳給 InstallGuide。已核對 detail respond、profile、admin user PATCH、reset、notification、todo、view 都透過這個 api；另一個原生 fetch 是 read-only calendar，沒有繞過寫入計數的本輪 mutation。

[install-guide.tsx:87](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/install-guide.tsx:87) 保留既有 editing 保護，加入 pending 狀態文字及移除更新按鈕；click 的同步 counter 檢查可避免 stale render。await getRegistration 後、postMessage 前再讀 counter；沒有 waiting 或取得失敗時撤 controllerchange listener。沒有把新 listener 競態的假想情境另訂 release gate。

新增 unit tests 實際以 deferred fetch 控制兩筆同時寫入，assert counter `2→1→0` 與 listener `[1,2,1,0]`；500／network／cyclic JSON、response body 未完成、GET 與 unsubscribe 都有明確預期值，不是只呼叫函式而不檢查。

新增 built-update 五案都以 `route.fetch()` 呼叫真正 built Worker，再延遲 route response；先等真請求 started，assert 更新按鈕為 0、busy 文字可見、skip-waiting calls 為空且只送一筆 mutation；釋放後等 200／實際狀態更新，才點更新並 assert 只有一次 skip-waiting。涵蓋空白 comment 接受、admin 啟停、通知、student todo、reset。這能驗證指定的 pending-write seam。

這五案的 waiting/controller 是刻意提供的 UI seam，沒有派發真正 controllerchange，不證明兩版 SW 安裝／實際 reload；source 註解已正確說明。根代理另有 R04 真兩版更新證據，本 review 沒有冒稱重跑。

## 跨週通知失敗保留

通知 read 失敗的 catch 先 onError，再 `onOpen(id,true)`；401 直接 onUnauthorized 並 return，不追失效 detail。成功路徑仍重新載 workspace 然後正常開 detail。

[app.tsx:250](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:250) 現將 keepError 傳入跨週 load；[app.tsx:276](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:276) 只有非 keepError 時清錯誤。load 成功只換 workspace／user，不再清原通知 read 錯誤；真正新 workspace error／401 仍顯示自己的有用錯誤，原 generation guard 保留。

新增 workspace E2E 從真正 student workspace 找未讀／可見 handover，先切前一週並明確 assert targetWeek 不同，確認該通知仍存在；只 mock read 500，detail 與 targetWeek workspace 都等待真正 200，最後 assert detail 日期＋alert「reach the server」。再以 API 查看未讀值仍與初始一致。這會捕捉舊 load 在開始時同步 `setError("")` 的實際缺陷，不是只有同週 case，也不是 mock 成功整份 workspace。

## 測試及圖像證據界線

Demo helper 現等真正 auth 200／workspace 200、`.shell`、登入姓名 heading、`.auth-shell` 不存在；768 拍照前再等 desktop nav／Maya。它修正原只等 auth 也有的 `.handover-root`，可合理保證老師工作台 screenshot，不把 loading 登入入口當首頁。

本代理沒有跑任何 frontend unit／Playwright／服務或 UI，因此不提供虛構 pass counts。以上是 frozen source 與 assertions 的獨立閱讀結果；最後整合固定 SHA 與執行結果由根代理記錄。
