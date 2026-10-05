# R05 independent read-only frontend source review

Date:2026-10-04,Taipei. **No actionable blocker found within the assigned scope.** Read frozen diff/full functions/new tests only. No product/assertion edits,service/GUI. Source inspection is not executed E2E evidence;root was running integration and actual E2E. English translation2026-10-05 preserves historical findings/counts.

## Frozen blobs

Beginning/end git hash-object values were identical. Final check UTC **2026-10-03 18:24:34**:

| File                                  | Identical beginning/end blob             |
| ------------------------------------- | ---------------------------------------- |
| components/handover/app.tsx           | 841fdd3442cd286efb4271cd28329c8bcd769c82 |
| components/handover/install-guide.tsx | 31367d79e39db17cf78587968bab8480b75ea079 |
| lib/client-api.ts                     | aad5fd0c8bd0376cb09ec23baaefe9eb7f42ecae |
| tests/client-api.test.ts              | 29645c00a2692ca6e01027454190d416e8637a7c |
| tests/e2e/built-update.spec.ts        | 5b3e422ea902ab188f33e1677e4667c363f5b041 |
| tests/e2e/workspace.spec.ts           | 05c69b5affd3a1cb8f769b1f98b66fa272eff69e |

Paths are relative to `/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/`. Initial client-api lookup incorrectly used components;read failed,then corrected to lib. This reviewer lookup mistake was not a product finding.

## Pending-write update protection

[client-api34](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/lib/client-api.ts:34) normalizes method and increments shared counter for methods other thanGET/HEAD. Increment occurs before fetch/JSON.stringify;finally decrements after response JSON. Network/non2xx/cyclic-body errors release it. Concurrent counter prevents an earlier write completion from releasing a later active write.

[app199](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:199) useSyncExternalStore reads actual counter and passes pendingWrites>0 to InstallGuide. Detail respond,Profile,admin userPATCH,reset,notification,todo,view all use api. Native calendar fetch is read-only;no assigned mutation bypass found.

[install-guide87](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/install-guide.tsx:87) retains editing guard,adds pending message/removes Update. Click rechecks synchronous counter for stale render;after getRegistration/before postMessage rechecks again. Missing waiting/registration failure removes controllerchange listener. No hypothetical listener race was added as a release gate.

Unit assertions use deferred fetch for concurrent writes,counter2→1→0 and listener[1,2,1,0];500/network/cyclic JSON/incomplete body/GET/unsubscribe each have explicit expected results.

Five new built-update cases use actual built Worker route.fetch with a controlled pending interception. They wait for real request started,require no Update,busy text,no skip-waiting calls,and one mutation. After release,wait200/actual resulting state before clicking Update;exactly one skip-waiting. Cases:blank-comment accept,admin toggle,notification,student todo,reset. This verifies the assigned pending-write seam.

Waiting/controller are intentional UI seams;no real controllerchange is dispatched. These five cases do not prove two-version SW installation/fullreload. Source comments say so. Root has independent actual R04 two-version evidence;this review does not claim rerunning it.

## Cross-week notification failure retention

Read failure calls onError then onOpen(id,true).401 calls onUnauthorized/returns without expired detail. Success still reloads workspace then opens.

[app250](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:250) forwards keepError into cross-week load;[app276](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:276) clears only without keepError. Successful load updates workspace/user without clearing notification failure. New workspace errors/401 retain their own useful messages;generation guard remains.

New workspace E2E finds an unread visible handover in real student workspace,moves to prior week,explicitly proves targetWeek differs and notification remains. Only read500 is mocked;detail/target-workspace wait real200. Then detail date and reach-the-server alert are asserted,and real API confirms unread unchanged. This catches the former synchronous load clear,not merely a same-week case or mocked successful workspace.

## Test/image evidence limits

Demo helper waits auth200/workspace200,.shell,user-name heading,and absence of.auth-shell.768 capture also waits desktop nav/Maya. Previously waiting only handover-root could match auth/loading;new gates reasonably identify an actual teacher workspace.

This independent reviewer ran no frontend unit/Playwright/server/UI in this round and provides no fabricated pass count. Findings describe frozen source/assertions;root records final integrated SHA/execution.
