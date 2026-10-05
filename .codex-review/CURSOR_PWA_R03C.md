# R03C — an app accessed by URL and added to the home screen

Historical implementation prompt, translated into English on 2026-10-05. The language requirements below describe the earlier release and are superseded by the user's later English-only instruction.

The user explicitly requested an app initially accessed through a URL and added to the home screen. This adds an acceptance condition to the existing Handover work. Keep the approved warm-white and forest-green campus handbook design. Phones are the student's primary device; teachers and administrators retain the full desktop workspace. Continue the R03 repairs and complete this condition without asking again about direction or abandoning unfinished acceptance work.

## State before implementation

- `app/layout.tsx` has favicon metadata but no manifest, Apple icon, or service worker was found.
- `public/favicon.svg` still uses the old blue branding. Replace it with an original Handover graphic matching the approved forest green and provide actual PNG installation icons, not renamed files.
- Do not add production packages, App Store integration, push, paid services, or third-party accounts.

## Minimum complete PWA

1. Provide a working HTTPS URL, a manifest with correct JSON/MIME, and an HTML manifest link. Include stable id, name/short_name, start_url, scope, `display: standalone`, background/theme colors, actual 192/512 PNG icons, and a maskable icon with a safe area. Root metadata needs a 180px Apple touch icon, compatible standalone metadata, viewport, and theme color. Do not prevent zoom.
2. Provide a natural collapsible Add to Home Screen entry with keyboard and focus support. Explain Safari Share → Add to Home Screen → Open as Web App as appropriate to the version. Chromium may show an actionable install button only after `beforeinstallprompt`; otherwise provide browser-menu guidance. Handle installed/standalone state. No permanently ineffective button or automatic permission prompt.
3. Respect `env(safe-area-inset-*)` in bottom controls, page headers, and forms. Use suitable dvh/min-height and scrolling; forms must remain usable with the virtual keyboard. Touch targets are at least 44px. Back, close-detail, and navigation must work without browser Back in standalone mode. Preserve next-lesson, day, and week priorities for students.
4. Home-screen installation does not make every operation work offline. Show connection failures and retry; do not report offline submit/accept/cancel as success. A small native service worker may store only a public offline page and necessary public assets. Navigations are network-first with public fallback on failure. Never cache API, auth, private school JSON, authenticated HTML, non-GET requests, or personal data. Do not add a synchronization queue or mask revoked permissions/logout with stale responses.
5. Include worker version cleanup and safe user-approved reload. Do not leave an unsaved draft or permanently cache development HMR JavaScript. Check the production worker path and scope; SPA HTML must not masquerade as `sw.js`. A service worker is not mandatory for installability, but explain the actual offline/update strategy. Do not claim an unimplemented offline timetable.
6. The earlier requirement called for complete English and Traditional Chinese installation/offline/update copy consistent with settings, errors, busy states, and reduced motion. This is historical scope, not the current language requirement.

## Repeatable verification and delivery

- Check manifest link, JSON, scope/start_url, genuine PNG sizes/MIME, icon 200, worker registration/scope when present, offline navigation and recovery, and exclusion of private/API content from Cache Storage. Account switching/logout must not leak offline data. Without `beforeinstallprompt`, guidance must remain useful.
- Capture actual 390/768/1440 viewports, especially student home, narrow request detail, and installation guidance. Do not call desktop screenshots physical-phone tests.
- If no device is available, leave native iOS/Android home-screen installation and standalone launch explicitly unverified. Emulation is not proof of physical-device success.
- README, demo, and submission copy must explain the installable web app, Safari/Chrome steps, network-required operations, and updates. Include automated checks in CI where practical.
- Continue updating `CURSOR_STATUS.json`, separating passes from device checks. Do not claim that the supervising agent has completed GitHub or production publication.

## Official research sources

- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable — manifest, HTTPS/localhost, and current installability without mandatory service worker.
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Create_a_standalone_app — standalone/display-mode and app-owned navigation.
- https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios — Safari home-screen installation and Open as Web App.
- https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html — legacy Apple icon and compatibility metadata; this older document does not establish every 2026 behavior.

Verify the actual Next/Vinext/Cloudflare output rather than assuming Vinext supports every Next-specific behavior.
