# Handover release plan

English rendering of the historical R04 handoff/R05 takeover plan, updated 2026-10-04 Asia/Taipei. This was a plan, not a publication receipt. Original state described an owner-only version-0 Site and no GitHub repository. R06 later created the public repository and published the same Site; read R06_RELEASE_RESULTS and GitHub/native Sites for current state. Only root executes GitHub/Sites tools.

## Identity, scope, and original evidence

Parent repository `/Users/zhuangzijin/Desktop/01_CSC_Back_to_School_Hackathon`; app `handover/`. Preserve hosting project `appgprj_6ac11cc258608191ba6f05fcd6e031fb`, D1 binding DB, R2 null. Never create a replacement Site/provider. Initial owner-only custom audience had no live URL; expected_url was not publication proof. GitHub account zhuang768 had no Handover repository then. GitHub upload and public-site delivery were already authorized; Devpost eligibility/terms/promotion/final submit remained participant steps.

Open-only checkout `/Users/zhuangzijin/.codex/sites-releases/handover/release-checkout` initially returned null commit (empty remote), without push/archive/deploy. It was preparation, not an accepted release. Current helper version is sites/1.0.0-a; old 0.1.75 paths disappeared.

R04 candidate `6b7b7cd734e9af06785d7f854d75dc8f3a160c6f`, app tree `ebbe56dda33a1547d67f17367bc067fe7a6eb2ab`, retained R03 schema/metadata/helpers. App ignore/docs and eight unique images were corrected; loading screenshot 07 and iOS steps still needed small fixes (R04_DOCS_RESULTS). Root separately reported 26 unit/eight dev/one built passing, actual offline direct 200/no redirect, no failed-save replay, and a real old-SW-to-R04 update protecting dirty profile, retaining session/home, and clearing banner. Public HTTPS/physical phone evidence was still pending at that snapshot.

## 1. Freeze accepted parent source

After handback root validates API/Worker/UI/viewport/tool gates and fixes P0 failures. Schema/migrations/env/docs repairs must happen in the parent repository, never only in a release copy. Record full reviewed_parent_sha and `git rev-parse <SHA>:handover`. Include necessary documentation and reproducible migrations, exclude secrets/cookies/recovery/local DB/generated output, and preserve reviewer work.

R04 removed tracked tsbuildinfo and added parent/app ignores. Helper stages all after commands; confirm exact reviewed tree after build/typecheck. Do not re-remove generated files or invent release-only fixes.

## 2. GitHub parent repository and CI

Keep handover and root .github/workflows/ci.yml together. Use a focused branch and reviewable PR; attach every created PR with attach_artifact. No force push. Original CI: Node 22, handover working directory/lockfile, npm ci, format, lint, types, unit tests, Chromium installation, dev E2E, then test:e2e:built (includes build). English-only changes subsequently add check:english. Never weaken checks/continue-on-error or upload app alone while dropping CI.

Verify remote SHA/tree and actual CI separately from push success. After merge record merged parent SHA and prove app tree still matches tested/released source. Revalidate real differences.

## 3. Export outside the parent repository

Never initialize embedded Git in handover or alter parent Git root. Sites validateCheckout requires selected checkout to be its own Git root with root .openai/hosting.json. Use outside-parent export staging/release checkout/archive paths; archive must not enter app tree.

```sh
git archive --format=tar --output=<absolute-export-tar> <reviewed-parent-sha>:handover
```

Export committed source, not moving working files. Staging root has package.json, hosting manifest, drizzle, and no handover prefix/Git/node_modules/dist/local DB. Validate archive paths before extraction.

Get native write credentials for the same Site and open through the helper without archivePath. Empty remote may initialize exported source. With remote history, open an empty checkout first, retain Git/history/ignored tools, then update accepted source. Remove only confirmed old tracked paths; no reinit/symlink/force-push bypass. Inspect unexpected remote differences before overwriting. Retain returned source descriptor.

Stage and verify release `git write-tree` equals parent `<SHA>:handover`. Moving app to root changes commit SHA, not tree. Non-secret Reviewed-Parent-Commit/Reviewed-App-Tree/GitHub-Repository commit trailers can record provenance without extra product files or unsupported manifest fields. Final reviewer report separately records parent/source/archive/version/deployment IDs.

## 4. Migrations and hosted settings

R03 aligned 14-table schema, 0000/0001 SQL, matching snapshots/journal; generation NOOP, empty apply, real R02 SQL upgrade/preservation, D1 chunks, and portable metadata passed. R04 left these unchanged. R03 seed upgrade failures are historical; R04 service repair still needed independently executed current backend/runtime/session evidence, not author claims or SQL-only success. Preserve applied 0000 DDL/history; never reset old data.

Production schema comes from schema-only migrations with complete matching metadata, not large seed payloads or runtime create/alter of the same tables. Seed is distinct and atomic/concurrency-safe. Packager copies all drizzle to dist/.openai/drizzle. Migrations apply before Worker upload; deployment failure may already have partially applied them, so never rewrite applied history or blindly retry unknown boundaries.

| Setting | Contract |
| --- | --- |
| DB | Logical manifest d1 DB; Sites owns actual resource, local placeholder is not production ID |
| TEACHER_INVITE_CODE | Public demo value may be public; a real school code should be secret. Follow native environment instructions |
| DEMO_MODE | Native runtime string; demo needs enabled. Test final default/disabled behavior |
| Password/recovery/session | Stored hashes/session data, not build env/hosting/Git/stdout/archive |
| AI/email keys | No connected service required; do not create unused secrets |

Vite config.vars is local/build configuration, not proof of hosted values. Sites native tools manage hosted env; preserve revision. Runtime cloudflare:workers env must not become browser import.meta.env secrets. CONNECTORS preview is separate; no new integrations are needed.

## 5. Source helper, build, packaging

Configure the existing external checkout's ignored execution profile only. Managed-linux requires SITES_MANAGED_LINUX_CONTAINER=1; this macOS uses portable. configure-execution-profile.mjs takes no flags. Never reset HOME/CODEX_HOME or rerun starter-copy setup for the existing app. Install dependencies only when missing or inputs changed.

```sh
node /Users/zhuangzijin/.codex/plugins/cache/openai-curated-remote/sites/1.0.0-a/scripts/site-workflow.mjs --project-id appgprj_6ac11cc258608191ba6f05fcd6e031fb
```

Launch exec tty true/yield 1000. Wait for hidden-stdin prompt. Pass one JSON line containing complete credential (session memory only), prior source, remaining ordered command argument arrays, and absolute archivePath for packaging. Never put credentials in argv/files/output. Opening omits archive. Remaining checks may include npm ci/format/lint/types/tests and `node <plugin-root>/scripts/build-site.mjs`; omit already successful unchanged checks. Do not run source-changing db:generate in the release copy.

Helper owns commit/push/remote-HEAD verification/package. Do not save an expected SHA before helper success. Source/lockfile tree must still match accepted parent after build. Worker uses dist/server/index.js with default fetch, full dist, root hosting config, attribution, and Drizzle metadata. Do not turn this D1/API app into static.directory. Verify no credentials/local DB/symlinks in archive. Retain exact returned project_id/checkout_path/commit_sha/archive unchanged through save.

```sh
node .codex-review/verify-site-archive.mjs --reviewed-parent-sha <full-reviewed-parent-sha> --release-checkout /Users/zhuangzijin/.codex/sites-releases/handover/release-checkout --archive <absolute-helper-returned-archive-path>
```

Read-only checker compares parent app/release trees, clean source, Site/DB/Worker entry, eight PWA public files, and every migration byte. It outputs hashes, not credential/config values. Historical fixed fixture passed eight assets/five migrations; wrong-tree/modified-SW controls failed. That fixture was not actual publication/runtime/phone proof. An open-only null HEAD cannot satisfy release provenance.

## 6. Native publication and audience

Read current Site audience. Historical initial owner-only plan used private save/deploy before authorized public access, then same saved version public deployment. The existing Site is now public: preserve that audience and use save_site_version followed by deploy_site_version. Do not alter access/settings on routine edits. No new Site/slug/D1/provider.

No publish-on-push opt-in is needed. If a returned accepted automatic window is active, reconcile the matching version/deployment instead of duplicate save/deploy; false or omitted opt-in does not cancel an earlier window. For ordinary explicit flow use helper's exact source SHA/archive, native saved version ID, then deployment ID. Poll only non-terminal status until success/failure. A success URL verifies hosting, not all product P0s. Missing URL gets one same-ID query, never a guessed URL.

Root verifies deployed four-role sessions/auth/D1/handover/decline-resubmit/conflict/authorization; do not reset shared production to obtain evidence. Platform sign-in is expected only for private audience. Any platform token is same-Site only, never persisted. Anonymous public visitors must reach app login/demo without ChatGPT login. Every Sites deployment URL is production, not a separate staging sandbox.

## 6A. Actual HTTPS PWA validation

Build public assets before packaging; Sites packages built dist and does not repair missing source/public assets. Compare source/built/archive manifest, four PNGs, SW, offline page, favicon, and Drizzle bytes. Do not use R03 archive for R04/new source. Historical assets.html_handling none did not guarantee deployed canonical behavior; record manual redirect initial/final status. Current canonical path is `/offline.htm`, because .html redirected and extensionless MIME was wrong on the platform (see R06).

```sh
node .codex-review/probe-pwa-http.mjs <actual-HTTPS-deployment-URL>
```

This reviewer probe GETs same-origin public resources/anonymous API denials without cookies/private payloads; it records actual status/type/cache/dimensions and canonical offline path. HTTP pass does not establish browser controller/offline navigation/private authenticated responses/phone install.

| Area | Actual evidence required |
| --- | --- |
| HTTPS/entry | Valid TLS, anonymous own login/demo, manifest/Apple icon/theme metadata, no platform/HTTP redirects |
| Manifest | 200 parseable JSON MIME, stable identity/standalone/colors, same-origin in-scope start URL |
| PNG | 200 image/png, PNG signature/IHDR with 192/512/180 dimensions, visually safe maskable composition |
| SW | Direct 200 JavaScript, successful controller at correct script/scope, not login/SPA HTML |
| HTTP cache | Revalidatable SW/manifest, no immutable; all private JSON/HTML/ICS no-store |
| Cache Storage | After signed-in reads/logout/account switch, exact public allowlist only; no API/auth/private HTML/non-GET |
| Offline/update | Actual public fallback/no false success/replay; safe new-version update preserves unsaved/pending work and only cleans app prefix |

Use project authored browser tests for actual hosted controller/offline flow and native Cua for user-facing checks. Do not publish a redundant test version solely for update evidence; observe natural release transitions. Public-resource checks remain separate from physical device installation.

Real iPhone: Safari Share -> Add to Home Screen -> Open as Web App when offered -> Add -> icon. Android Chrome: real install/menu action -> icon. Check standalone, login/detail/back, safe areas/keyboard/todo. The in-app Chromium install action only works after real beforeinstallprompt; otherwise manual guidance. Record model/OS/browser/date/URL/deployment/results. Desktop UA/390px/Playwright/desktop standalone are not phone proof. Without devices mark physical installation pending. No push/App Store claims. [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [Apple](https://support.apple.com/en-au/guide/iphone/iphea86e5236/ios).

## 7. Delivery and failures

Record real URL/GitHub/PR/demo/production evidence in product docs, and provenance parent -> app tree -> source -> archive hash -> version -> deployment -> env revision separately. If app docs change tree, publish matching source rather than falsely attributing an old archive to a new commit. Keep original failures and fix concrete causes without weakened CI/force push. Unknown migration boundaries must be resolved before rewriting/retrying. Explain a real approval/account/platform blocker after completing authorized local work; never invent URLs. Do not submit Devpost or accept participant terms. Historical deadline target was Taiwan 2026-10-05 15:00, recommended 12:00.

References: current sites/1.0.0-a skill and site-workflow/build-site/configure-execution-profile/package-site helpers; packaging shell under skills/sites/scripts/package-site.sh. R03's 0.1.75 package was historical evidence only. This planning reviewer did not call native external tools.
