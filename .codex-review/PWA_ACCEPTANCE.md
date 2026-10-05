# Handover: HTTPS address and Add to Home Screen acceptance

Historical R03 planning snapshot, verified 2026-10-04 Asia/Taipei. The user explicitly positioned the product as an app. PWA implementation/acceptance was still pending while Cursor worked. This was read-only research: no Cursor/browser/DB/service operations, product files, or packages. Later results supersede this snapshot.

Use the same three-role school workflow from HTTPS, installed as a standalone home-screen web app. Minimum additions cover installation, offline honesty, and safe updates. App stores, push, offline timetable storage, background writes, and full synchronization are outside scope.

## Source snapshot

Root HEAD 1f1fe77, last product 73d32c1; moving R03 needed rereading after completion. Layout metadata had no manifest, standalone/start/scope, display-mode detection, or install assets; favicon was blue SVG 64x64. No 192/512/maskable/Apple PNGs, install guidance, beforeinstallprompt/appinstalled, or browser SW existed. Server build/sites-worker is not a browser SW. CSS used 100dvh and sticky bottom navigation without safe-area handling, which could not prove notch/keyboard safety. JSON helper service :205 had no-store; role ICS :2527 lacked it. App localStorage contained language/theme/large/contrast/simple preferences, not workspace/token. Deployed DOM/SW was not inspected, so existing deployment settings could not be excluded.

## Official-source boundaries

[MDN installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) required HTTPS (localhost is development-only), manifest, Chromium names/192+512 icons/start/display, and prefer_related_applications not true; SW was not itself an install prerequisite. Use display standalone.

[Apple's guide](https://support.apple.com/en-au/guide/iphone/iphea86e5236/ios): Safari Share/page menu -> Add to Home Screen -> enable Open as Web App when available -> Add -> open icon. iOS has no beforeinstallprompt; use truthful manual steps. [Chrome's updated criteria](https://developer.chrome.com/blog/update-install-criteria) removed Android-menu installation's fetch-handler requirement in 2023; automatic prompt conditions differ by browser/version, so absence does not prove a broken app. Do not use obsolete Lighthouse PWA scores.

[WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) documents standalone, Apple-touch-icon precedence, and third-party iOS share installation from 16.4. Safari is the clearest guide, not proof all other browsers are incapable. Older web.dev Safari-only wording was not treated as a 2026 universal rule. Record actual OS/browser versions.

## Minimum implementation

1. Reuse existing public/static architecture without a PWA dependency. Layout links the same public manifest in actual HTML. Stable id/name Handover, root start/scope for root deployment, English lang, standalone, warm-white background/theme, and no account/lesson/token in URLs. Adjust every path together if a base path differs. Manifest scope is navigation, not authorization or SW scope. [MDN id](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/id), [manifest guide](https://web.dev/learn/pwa/web-app-manifest).
2. Keep approved warm-white/forest-green identity. Supply 192/512 ordinary PNGs, separate opaque 512 maskable PNG with central 80%-diameter safe circle, and 180 Apple touch PNG explicitly linked in head. Do not bake rounded corners or relabel an unsuitable image as maskable. Default readable status bar; compatibility Apple metadata may supplement manifest. No exhaustive splash/marketing assets required. [MDN icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons), [Apple historical compatibility](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).
3. Provide concise Add to Home Screen guidance in login/settings. Historical R03 requested English and a translated option; current product scope supersedes it with English only. Avoid marketing hero/forced overlay. Chromium install button exists only after captured beforeinstallprompt, is user-triggered, handles accepted/dismissed, and uses the event once. Otherwise show browser-menu instructions. iOS has manual Safari steps; the site cannot control system Share. Detect standalone (optional navigator.standalone compatibility) and hide promotion there; browser mode does not prove no installation elsewhere. appinstalled updates UI without new analytics. [Prompt guidance](https://web.dev/learn/pwa/installation-prompt).
4. Set width=device-width/initial-scale=1. If edge-to-edge, add viewport-fit=cover plus all safe-area insets, preserving normal spacing and one mobile navigation. Avoid fixed device pixels. Desktop sidebar and mobile bottom nav must be mutually exclusive; reachable long forms/detail return, 44px targets, keyboard focus, browser/installed/back behavior. Real 390/768/1440 viewports, landscape, large text, contrast, and reduced motion remain required.
5. SW caches only exact allowlisted successful public GET assets, same origin, no sensitive query. Network-only app navigation never caches successful private HTML; only actual network rejection returns generic public offline help. API/auth/workspace/request/admin/calendar/ICS, RSC/data, Authorization, non-GET, cross-origin, and private materials bypass SW cache/fallback entirely. Never turn mutation errors into 200. Cache API does not automatically honor HTTP no-store; explicit allowlist remains necessary. Keep private JSON/ICS/HTML/export no-store. User-requested ICS export remains allowed. [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache), [Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control).
6. Online/offline events are hints; navigator.onLine can only indicate LAN. Actual failed fetch determines operation failure. Label stale in-memory data; never persist private timetable or blindly replay accept/cancel/submit. If response loss leaves completion uncertain, reread state before retry. Store only harmless preferences, never cookies/tokens/password/recovery/private payloads. Logout clears app memory and next launch checks real session. Do not promise Safari/installed-app session sharing. [onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine).
7. Stable SW URL/scope, versioned app-specific cache prefix, delete only obsolete app caches. Failed installation leaves old app working. Default waiting; explicit user update only, blocked by unsaved draft/comment/supplement/profile or pending mutation. No automatic install-time skipWaiting/reload. Revalidatable SW/manifest, not immutable; no production SW in dev/HMR. Unsupported browsers keep network use. Existing erroneous SW needs real upgrade evidence, not only cleared-browser testing. [Lifecycle](https://web.dev/articles/service-worker-lifecycle).

## Acceptance matrix: record actual results after implementation

| ID | Required evidence |
| --- | --- |
| PWA-01 | Actual public HTTPS, valid TLS/no mixed content, direct role-app entry; localhost/LAN not installation proof |
| PWA-02 | Login and signed-in head link same publicly readable 200 JSON manifest/MIME |
| PWA-03 | Stable id, same-origin start/scope/in-scope entry, no user/task/token URL |
| PWA-04 | Real iOS/Android icon launches standalone without ordinary address bar; OS/browser recorded |
| PWA-05 | Public 192/512 ordinary, 512 maskable, 180 Apple PNGs with actual dimensions/MIME/identity |
| PWA-06 | Safe-circle and real launcher masks retain essential icon, without unwanted white frame |
| PWA-07 | iPhone uses intended Apple icon/title; launch/status bar readable in dark/contrast modes |
| PWA-08 | Accurate Safari manual steps and conditional Open as Web App; historical translated-guide scope noted |
| PWA-09 | Real captured prompt enables install; acceptance/dismissal handled; missing event has manual guide |
| PWA-10 | Standalone hides promotion; unsupported browser has no fake button/forced popup/retry loop |
| PWA-11 | Actual 390/768/1440 login/role navigation/detail/long content with no horizontal overflow |
| PWA-12 | Real portrait/landscape notch/home-indicator safe areas, no duplicate inset |
| PWA-13 | Real keyboard leaves last form fields/save/send/return reachable; sticky focus not hidden |
| PWA-14 | Guide/offline/update keyboard access, labels/live feedback, 44px, large text/zoom/reduced motion |
| PWA-15 | Open-app network/API failure produces honest feedback, never successful offline save |
| PWA-16 | After real initial SW installation, offline cold navigation/reload public fallback; retry reconnects, no private data |
| PWA-17 | API errors retain proper MIME/status; mutations never replaced by HTML/200 or replayed |
| PWA-18 | After teacher workspace/detail/notifications/ICS, cache keys/bodies remain public-only; private marker absent |
| PWA-19 | Private JSON/ICS have no-store; non-allowlist still never cached without that header |
| PWA-20 | Storage has no credentials/recovery/private JSON, no added background sync/push permission |
| PWA-21 | Teacher logout/offline/reopen/other student cannot reveal previous teacher; normal 401 sign-in |
| PWA-22 | Real v1-to-v2 waiting/activation preserves draft/pending writes and deletes only app cache prefix |
| PWA-23 | New SW 404/syntax/install failure leaves existing app usable; unsupported SW still works online |
| PWA-24 | Dev excludes production SW; built/deployed assets readable and updates revalidate |
| PWA-25 | Installed role workflows retain auth/recovery/conflicts/submit/respond/cancel/complete/notifications/todo/admin behavior |
| PWA-26 | Record device/OS/browser/date/HTTPS/commit/results/pending items; desktop emulation is not physical-install proof |

Use existing tools for manifest/URLs/PNG/SW allowlist, bypass, actual network fallback, prefix cleanup, and safe updates. Add meaningful tests without a new PWA framework or weakened CI. Preserve existing product/security/concurrency repairs. This historical planning reviewer did not physically verify these matrix items.
