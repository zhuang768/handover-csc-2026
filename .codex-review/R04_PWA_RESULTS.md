# R04 PWA recheck:28 behavior cases and real built offline pass;pending-update guard remains

Pinned product `6b7b7cd734e9af06785d7f854d75dc8f3a160c6f`;handover tree `ebbe56dda33a1547d67f17367bc067fe7a6eb2ab`. SW SHA-256 `d1ff2e5d2e143e7581ce2df935dad890ae2dde245a3151dce8d0c14a19c9a722`. Fixed Git blobs;no moving-product/GUI tests after R05 started. Historical English translation2026-10-05;former bilingual expectations were later superseded.

## Fixed SW behavior:28 pass/0 fail,exit0

This agent executed:

```sh
node .codex-review/sw-behavior-probe.mjs --stable-sha 6b7b7cd734e9af06785d7f854d75dc8f3a160c6f
```

This round's public contract remained/offline.html,using default. Optional --offline-path=/offline supports a later pinned contract;the tool did not choose a route for product. All28 assertions/six negative controls unchanged. Earlier safe fixtures passed28/28 for both paths,six negatives detected,five tool regressions passed. [SW_HARNESS.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/SW_HARNESS.md) records parameters/fidelity/limits.

| R03 gap                              | R04 closure/handler evidence                                                                                                                                                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unrelated cache deletion             | sw78–89 only expires handover-public-*;VM retains current/unrelated namespaces,removes own old version.                                                                                                                                                  |
| Runtime lifetime                     | 137–141 adds cache put to fetch waitUntil/handles optional failure;delayed-put case passes.                                                                                                                                                              |
| Auth/query/RSC/private redirect      | 13–25 reject queries/Auth/RSC/router headers;36–47 reject redirected/opaqueredirect/wrong origin/final path/private API. Four synthetic cases cause no writes. Not a claim of actual historical user leakage.                                            |
| Public offline307/navigation failure | vite80 html_handling:none;SW48–56 builds clean public Response;115 clean navigation fallback. Root built direct offline200/noLocation,and actual controlled offline reload public bilingual page pass. R03 causal inference is not an R04 known failure. |

Direct auth/me/workspace/detail/notification APIs,ICS,private navigation,nonGET,cross-origin remain uncached;private/API network errors are not replaced with public mock data. Public allowlist fallback,HTTP401/403/500 preservation,missing-offline503,no automatic skipWaiting,failed-install preservation all pass. Behavioral28-case evidence,not regex validation.

Normal public mock responses use public,max-age=3600;private marker/Auth/query/RSC/private redirect use no-store. Tests do not force a secure SW to ignore private no-store. Synthetic public-URL+no-store is an extra tool control,not a new unconfirmed29th product gate. VM does not model complete Vary/eviction/opaque/CORS/arbitrary termination/internal URL lists. Built E2E supplies actual navigation evidence.

## Registration/install/normal update closure

| Scope                            | Fixed source/actual evidence                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registration                     | [pwa-register7](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/pwa-register.tsx:7) skipsDEV/catchesPROD registration;InstallGuide42–61 only getRegistration. Built14 requires controller. No observed reproducible registration failure;listener timing speculation is not added gate.                                                                                                    |
| Standalone/guide                 | InstallGuide109–111 shows installed information and hides promotion;default collapsed. Historical bilingual Safari/Chrome/Open as Web App copy,i18n579/639. Manifest/four icons/apple metadata/viewport/safe area remain. Not real OS copy/crop/launch proof.                                                                                                                                                                      |
| Offline copy                     | i18n585/643 explicitly no queued submissions,reconnect then resubmit;offline bilingual,no private timetable/no false submission.                                                                                                                                                                                                                                                                                                   |
| User-confirmed update            | SW92–94 only messages skipWaiting;InstallGuide90–101 installs controllerchange listener before message,reloads after takeover. Immediate-reload defect repaired.                                                                                                                                                                                                                                                                   |
| Actual two-version/Profile dirty | Root Cua built8789 from oldR03 cache/controller toR04 tab5:waiting banner;edited Profile name hides Update,shows dirty message,retains input;restore original name/click Update causes full home reload,session retained,banner gone. [R04_BROWSER_RESULTS.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/R04_BROWSER_RESULTS.md). These paths close;do not continue claiming two versions untested. |

JSON/ICS HTTP no-store belongs to separate root API/header checks;SW exclusion is not proof for all HTTP private headers. Public307 does not imply private redirects.

## R04-PWA01 — Medium: pending writes do not block update

[app495](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/handover/components/handover/app.tsx:495) passes editing||drafting. Detail2308–2311 tracks only comment/supplement,not act busy2314. Profile2712–2719 tracks fields,not reset busy2863. Users3003 writingId stays local. InstallGuide84 hides Update only for editing. Blank-comment accept,unchanged admin reset,and Users toggle pending paths can show Update.

Existing R04 prompt50 gap,**static evidence only,not UI-reproduced**. Not a claim of inevitable cancellation/data loss. Test waiting worker+held real mutation;during pending no skipWaiting/controllerchange/reload;restore in finally after success/failure. Preserve already-proven normal update/Profile dirty. R05 assigned focused delayed-request coverage;no extra hypothetical listener-race/offline-sync requirements.

## What real built E2E proves

Pinned built-offline.spec SHA-256:`b0e8c0a75e4bdb6cc4e4e9edb9448d6081e9acc4b7f628fbc97314124388fd56`. Root executed1pass/0fail,not this agent.8dev+1built both CI commands,retries0,distinct independent servers,built first builds.

- 12–21 real reload/nonnull controller/student session/workspace200;22–31 real detail200 before cache inspection.
- 33–57 inspects all cache keys/URLs/Response.redirected;API keys forbidden;offline body excludes PRIVATE_TEACHER_NOTE and contains both languages. **Only offline body is read as text**;not every cache body/cookie privately scanned. VM/API add separate exclusions.
- 59–63 real contextoffline+fullreload public page/no private marker;65–70 reconnect/Try again returns product,not synthetic offline event.
- 71–86 offline Profile save shows server error,noSaved;online reload lacks Offline Probe value. Proves this failed write is not false-success/persistent,not all mutations/full offline sync.
- 6–10 direct offline status is diagnostic log,not hard200/noLocation assertion. Root log actually200/noLocation and fullreload passes;do not call a log a safety assertion.
- Old reconnect unconditionally clicking Student changed at82 to only when logged out. Valid session may survive;this matches contract without weakening offline/privacy/nonpersistence.69 auth-or-root is intermediate wait;later Profile/field checks are success evidence.

## Device/publication boundary

Local built desktopChromium/rootCua only. No publicHTTPS publication,iPhoneSafari/AndroidChrome real install/icon crop/standalone landscape/safe-area/keyboard/phoneoffline proof. These are delivery limits,not new push/dependency/private offline-sync requirements. On HTTPS verify actualorigin manifest/SW MIME/scope,Secure cookie,and launch. Official minimums in [PWA_ACCEPTANCE.md](/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon/.codex-review/PWA_ACCEPTANCE.md).

Historical verdict:R03 six VM gaps and local public offline redirect closed;real built offline,normal two-version update,Profile dirty passed. R05 pending-update repair/tests remain;R04 alone did not prove every operation safe or real-device PWA acceptance.
