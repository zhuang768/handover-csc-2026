# R03 PWA recheck: core exclusions pass; focused repairs and device evidence remain

Pinned product `f3fa696115a86f98995686b6bb934b90492133ab`;handover tree `911adb7043d89b7487b12b9bb3d06876457699a5`. Probe executed sw.js from this commit, SHA-256 `f1c1ecd2dcf997277a8f98515e9e22f9cae0a6af021d1fce9fb420ff7b86a5f2`. Moving HEAD/Cursor status is not product evidence.

Scope: VM behavior,read-only manifest/metadata/PNG headers/install/update UI,and product E2E quality. No service/GUI/database/install/product edits. This is not iOS/Android real-device acceptance. Historical report translated2026-10-05;old bilingual expectations were later superseded.

## Behavior results and evidence boundaries

Review-owned [probe](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/sw-behavior-probe.mjs): safe fixture28/28;six negative fixtures detected. Pinned product: **22 pass/6 fail,exit1**. All28 assertions retained;mock fidelity/commands in [SW_HARNESS.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/SW_HARNESS.md).

| Category                                                                                                         | Count/result | Supported conclusion                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No forced install update;failed install preserves old version                                                    | 2 pass       | Public precache succeeds;404 does not clean/auto skipWaiting.                                                                                                                                      |
| Direct workspace/auth/detail/notifications APIs,ICS,private nonallowlist,cross-origin,POST/PUT/PATCH/DELETE/HEAD | 13 pass      | Common paths do not enter Cache Storage;network failures are not replaced with a public page. Do not report direct API caching.                                                                    |
| Private navigation,401/403/500,public fallback,missing offline,public HTTP failure                               | 7 pass       | Private HTML not cached;network rejection falls back only publicly;HTTP errors preserved;missing offline503;public500 retains good cache.                                                          |
| Authorization,sensitive query,RSC public-looking URL;allowlist redirect to private API                           | 4 fail       | Deliberately constructed guard gaps. Normal app showed no Bearer/secret URL/private API redirect. **Not evidence of normal-flow private leakage.** Actual public offline307 is separate,SW-R03-04. |
| Runtime put lifecycle;activate namespace                                                                         | 2 fail       | Real maintenance/reliability gaps,suitable for small repairs without offline framework.                                                                                                            |

### SW-R03-01 — Activation deletes unrelated cache namespaces

[sw33](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/public/sw.js:33) filters only key!==VERSION,without own prefix. With old handover-public-*,other-app-v1,and handover-unrelated-tool-v1,handler deletes unrelated latter two. Actual VM handler behavior,no private-data assumption.

Only clean stale handover-public-*;preserve current/unrelated caches. Scoped-cleanup assertion must pass;failed install must not remove viable old version.

### SW-R03-02 — Runtime put lacks event lifetime protection

[sw78](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/public/sw.js:78) uses void cache open/put without await/waitUntil. With20ms delayed put,write completes after respondWith/waitUntil settle. This demonstrates unprotected lifecycle,not guaranteed loss in every browser.

Protect via response lifetime or waitUntil and handle failure. Optional cache failure must not fabricate offline response or swallow API error.

### SW-R03-03 — Four synthetic boundary guard gaps

[sw72](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/public/sw.js:72) checks pathname only,not query/Auth/RSC;[sw76](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/public/sw.js:76) accepts response.ok without actual redirect URL. Each synthetic request creates a cache write:offline.html+Authorization;offline.html?recoveryCode=probe-secret;offline.html+RSC headers;allowlist redirect to/api/auth/me. Marker responses simulate potential private content;RSC primarily tests avoiding special-request persistence.

Allow only ordinary query-free/Auth-free/framework-private-header-free same-origin GET. Reject private/different-origin/different-URL redirects and nonpublic content. Reverify real public assets/navigation in built Worker. Canonical offline contract may change;do not infer nonexistent Bearer/secret URL flows.

### SW-R03-04 — Built public offline307 and unsuccessful real reload (root observation;cause unproven)

After root stopped its8789 built Worker,previous tab reload showed IAB ERR_FAILED instead of public fallback. Controller had not been demonstrated,so this alone did not prove SW ownership/root cause,or standardChrome/phone reproduction.

Stronger Worker log:GET /offline.html307→GET /offline200. Cloudflare default HTML canonicalization supports this observation: [official HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/). Install18–20 follows redirect and stores Response under original key;62 returns it without redirected validation. WHATWG Fetch produces network error when SW response URL list has multiple entries and navigation request redirect mode is not follow: [HTTP fetch](https://fetch.spec.whatwg.org/#http-fetch).

**Inference,not isolated cause:** returning a redirected cached offline Response for controlled navigation may trigger that rule. VM models redirect metadata,not internal browser URL lists/navigation acceptance;its passing fallback cases cannot exclude this built-only failure. This is public-page reliability,not private redirect leakage. Public allowlist responses cannot be assumed redirect-free.

Minimum:built Worker,not dev. Demonstrate active registration/current controller;record offline source URL/redirected/cache key;actually disconnect and reload/navigate into a public fallback without private HTML. A redirect-free canonical public path or clean public Response is acceptable;guards must not make precache fail without checking fallback. Reconnect and explicitly retry API/session. Retain all28 safety assertions;parameterize canonical route,not exclusion/lifetime/prefix semantics.

## Static implementation and outstanding verification

| Item                         | Pinned evidence/limit                                                                                                                                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manifest/identity/standalone | manifest2–10 id/start_url/scope/,standalone,paper/green;layout9–29 manifest/appleWebApp/appleicon/viewport-fit/theme. Structure present;HTTPS headers/real install unverified.                                                                                  |
| Icons                        | Actual IHDR192×192,512×512,maskable512×512,apple180×180;any/maskable distinct. ColorType6 RGBA does not prove opacity/full-bleed/safe-zone;real cropping pending.                                                                                               |
| Safe area/touch              | CSS522–525 top/left/right inset;bottom519;summary528/button540 min-height44;offline.html14 bottom and button44. iOS landscape/standalone/keyboard unverified;clipped nav in frontend report.                                                                    |
| Private caching              | service208 JSON no-store;direct API/private navigation exclusions pass. ICS2527–2531 sets MIME/disposition without no-store;small HTTP-layer repair needed. SW exclusion already passes;do not conflate layers.                                                 |
| Offline text                 | offline31–38 bilingual no-cache/no-submission/retry. i18n570–571/615 could imply auto replay although no queue exists;clarify reconnect then resubmit.                                                                                                          |
| Install guide                | install-guide28–34/104–122 install event/default collapsed details/Safari-Chrome copy. i18n565/610 lacks modern iOS Open as Web App step. Standalone still shows entire promotion plus107 message;not hidden. No push/dependency required.                      |
| Safe update                  | No install auto skipWaiting;click messages SW;82 guards Editor draft.93–95 reloads immediately after message without controllerchange. Root passes only Editor editing;Profile/Detail unsaved input/pending mutation not guarded. Real two-version test needed. |
| Registration failure         | pwa-register8 no catch;install-guide43 independently registers same scope with catch. Could unhandled reject;centralize/catch. No PROD gate;dev E2E registers SW,possible HMR interference. Prefer fixed built validation;no offline sync expansion.            |

Official install references/date are in [PWA_ACCEPTANCE.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/PWA_ACCEPTANCE.md). Static metadata is not installed-device success.

## Automation quality and real-device gap

Root's six cases genuinely passed their assertions,not full PWA acceptance.

- workspace121–178 named offline navigation actually reads SW/offline,polls cache,then dispatches synthetic offline event after login. No real context offline/reload/navigation/controller requirement.145 records active without gating;161–170 checks API cache before login. Proves precache/banner listener,not post-login API exclusion or offline navigation.
- pwa35–40 uses source regex. Independent behavioral VM supplements normal/boundary checks but not browser lifecycle.
  -390px test115 expands details;117/118 captures same state twice. Expanded guide is not default behavior or two-page coverage.
- Config18/23 loopback dev/DesktopChrome. No publicHTTPS/iPhoneSafari/AndroidChrome/installed-mode/landscape/two-version/home-icon proof.

Historical next evidence:fixed built/HTTPS,iPhone and Android install/icon standalone,three-role auth/logout,narrow/long localized touch,really offline logged-in reload public fallback with no private/API cache,reconnect/manual retry,two-version draft-safe update. Desktop automation:real offline/controller/post-login cache and28green safety repairs.

Historical verdict:normal-path public cache isolation has behavioral evidence;maintenance/update repairs and installed/real-device/true reload evidence remain. **PWA acceptance was not complete.**
