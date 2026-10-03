# R06 production PWA verification

R05 public Site version 1 returned /offline.html with a 307 to /offline. The SW correctly rejected redirected HTML, and retained its embedded generic fallback; it did not cache the designed offline page.

R06 source a8c433071aeaa96101c28f4667b67ca8864bf31f moved the physical file to /offline and added _headers. Local format/lint/types/build exited0, product34/34 and built6/6 (7.4s) passed. Pinned SW28/28 passed and all six intentionally unsafe fixtures were detected. Independent readonly review found no weakened cache or update guard.

Release app tree c523ad694cf59f891ad5413589c7e68a87ea72f8 exactly matched source commit8a0a435ae1db3da69d59ed03355f05c7d3db146e. Archive SHA256 bb1b1f189d30af507036bbce6dffe49b9879a86b1de665449b70a33193496e6f; checker verified9public assets and5migration files byte-for-byte.

Site appgprj_6ac11cc258608191ba6f05fcd6e031fb, saved version2 appgprj_6ac11cc258608191ba6f05fcd6e031fb~appgver_4a616059b1e88191a628f9105997ae13, deployment appgdep_6ac15061f61881918a04b6078f145419 succeeded at2026-10-03T18:58:59.030307+00:00 with env revision1 and unchanged public audience. URL https://handover-campus-2026.ziz81503.chatgpt.site.

**Actual production HTTP probe failed:** /offline200 without Location, exact1181HTML bytes, but Content-Type application/octet-stream. Platform did not apply the packaged _headers; local proof did not establish hosted MIME. R06 remains open. Next focused repair uses a standard .htm static asset and must again pass actual hosted direct200/noLocation/textHTML; do not weaken assertions or accept redirect.

No database/auth/dependency change, demo reset, ordinary account creation, secondSite, or audience change occurred.

## Portable HTML repair

Fixed source77a5faf5653d908bbe5a02094a7004856063d1bb / app tree6b3d42b3d6b30c1247183d54f062603766518005. Standard /offline.htm replaces extensionless asset and ineffective _headers; no asset contents or private cache guards changed. SW cache version handover-public-r06-htm-1, SHA256 b89da360a1101cccdd89cacece658fa6d9d00465de493f8a401e785098cfab3c.

Root checks: format/lint/types/test34/build all exit0; preceding build followed by direct built Playwright6/6 (5.2s), canonical200/noLocation/textHTML, trueoffline reload and failure persistence checks passed. Pinned SW28/28 passed and six intentionally unsafe fixtures detected. New opt-in playwright.hosted.config.ts reuses the same authored offline test; absence of explicit origin rejects before network, valid HTTPS origin lists exactly1case. Formal production test remains pending.

## Actual HTTPS acceptance passed

Portable HTML release source5f14a43e2bb37aaff68d552585b4d363fe2e6423 matched app tree6b3d42b3d6b30c1247183d54f062603766518005. Archive SHA25619b0433d1cf0a035de8d7ef39cf44e0006d2b89f7b7c72372b45f550420b6e98; exact8public assets/5migration byte checks passed. Saved version3 appgprj_6ac11cc258608191ba6f05fcd6e031fb~appgver_e871f762e20881918eba2481c853c5d4; deployment appgdep_6ac151b4add88191895bd9529272706b succeeded2026-10-03T19:04:36.764758+00:00, public audience/envrevision1 retained.

Strict production HTTP probe PASS: /offline.htm direct200/noLocation/textHTML with2119bytes (own1181HTML plus native platformfooter), SW direct200 text/javascript with revalidation, manifeststandalone, PNG192/512/maskable512/Apple180, unauthenticated auth/me and workspace401 no-store. This HTTP check alone is not offline proof.

Existing authored built-offline.spec.ts then ran against actual public HTTPS with opt-in playwright.hosted.config.ts: **1/1 passed17.8seconds**, exit0. This proves actual SWcontroller, exactcanonical cachedHTML, absence of API and oldpath caches and private teacher notes, genuine offline reload bilingual page, reconnection through Retry, failed offline profile save not reported asSaved and not persisted/resubmitted after reconnect. It used demo student only, no reset/ordinary registration/successful profile mutation.

Native Cua on actual public origin proved real published v1→v3 update: unsaved profile draft Mina7A review draft kept its value and showed blocked-update text without reload button; restoring original Mina7A exposed reload; explicit click caused full navigation and retained student session, TC UI and originalname, updatebannergone. This is an actual waiting-worker/controller change, unlike the five deliberate UI seams in pendingwrite tests. The extra tab7 was closed; user-facing tab6 marked deliverable.

Physical iPhone/Android installation remains untested; Chromium viewport/controlledoffline and desktop Cua are not phoneinstallation proof. Docs synchronization, focusedGitHub PR/CI and final exact-source publication remain in progress.

## Final product and documentation release accepted

Accepted parent87bfc8a1de1692c0d43e15679dc9c88bafa9b614 / app treeaabf347075416d971287e0733d3f8c0f81418c81. GitHub pushCI37146871784 and PRCI37146879530 both completed success on that exact parent; Node22 cleaninstall/format/lint/types/product34/dev9/built6 passed. PR https://github.com/zhuang768/handover-csc-2026/pull/1 was attached to this Codexchat. Final five docs passed independent readonly wording review with identical before/after blobs; truthful phone/Devpost and historical-vs-latest CI scopes retained.

Sites final sourcea465f8044ed696427d06a9db7b23aa6782a9182d exactly matches accepted app tree. Archive SHA25687d71e1ab7564107d35e6347d8d24b92b005846986f399adfca0dc503ad65e1f;8public assets and5migration files matched reviewed bytes. Saved version4 appgprj_6ac11cc258608191ba6f05fcd6e031fb~appgver_5327244373208191ae83bb642f9ff220; deploymentappgdep_6ac15357a1e88191b6f99e55d3a04887 succeeded2026-10-03T19:11:35.605584+00:00, env revision1/public audience unchanged.

Version4 only synchronizes documentation; Worker source/SW/staticPWA behavior unchanged from the actually exercised version3. Final public HTTP repeatedPASS canonical/offline.htm200/noLocation/textHTML, manifest/PNG/SW, privateanonymous401no-store. No repetitive fourrole mutating flow or phoneinstallation claim was added. Final reviewer receipt commits keep the exact accepted app tree and require no further Sitespublication; latest PR/main CI is directly visible at https://github.com/zhuang768/handover-csc-2026/actions.

Within exercised requirements no known unresolved product defects remain. Physical-phone install and participant Devpost/guardian/eligibility/film/terms/finalsubmit are explicitly human actions. No absolute zero-bug guarantee. The owned heartbeat is stopped when finalGitHub merge/CI completes; original userpreview5173 remains untouched and rootowned8789/built8788 are stopped.
