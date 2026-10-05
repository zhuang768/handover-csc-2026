# Reviewer service-worker behavior harness

This is an English translation of the historical R03/R04 review record. It does not claim that those historical candidates are the current release.

Tool: `sw-behavior-probe.mjs`. It uses Node VM with no dependencies, real network, browser, database, persistent Cache Storage, or product writes. Normal mode reads only `git show <full SHA>:handover/public/sw.js`, never a moving worktree. It executes the product's actual install, activate, fetch, and message handlers; behavioral assertions are not replaced by regex checks.

```sh
node --check .codex-review/sw-behavior-probe.mjs
node --test .codex-review/sw-harness.test.mjs
node .codex-review/sw-behavior-probe.mjs --self-test
node .codex-review/sw-behavior-probe.mjs --self-test --offline-path=/offline
node .codex-review/sw-behavior-probe.mjs --stable-sha f3fa696115a86f98995686b6bb934b90492133ab
```

Exit codes: 0 means all behavioral cases passed; 1 means at least one failed; 2 means an argument, source, or tool error. JSON records the selected offline path, commit, SW SHA-256, 28 case names, results, and assertion errors. Historical product findings are in [R03_PWA_RESULTS.md](R03_PWA_RESULTS.md).

## Public-path contract added in R04

`--offline-path=/offline` works with self-test or stable-SHA mode. The historical default remains `/offline.html`. The path must be an absolute public static pathname without origin, query, fragment, or traversal. API, private, and framework namespaces, unknown arguments, and duplicate flags are rejected. The harness never infers or modifies a product path. Body marker, HTML MIME, cross-origin, non-GET, sensitive requests, cache keys, and every positive/negative fixture use the selected contract; other safety exclusions are unchanged. Selecting a new path does not silently allow the old one.

For the current `.htm` contract, use an actual fixed full 40-character SHA:

```sh
node .codex-review/sw-behavior-probe.mjs --stable-sha FULL_40_CHARACTER_SHA --offline-path=/offline.htm
```

JS exports also support `createHarness(source, { offlinePath: "/offline" })`, `probeSource(...)`, and `selfTest(...)`. The CLI requires committed source.

The historical five Node regression tests passed: public/private headers; canonical path/body/MIME; all 28 cases and six controls under both path choices; synthetic public no-store responses and Cache API semantics; and safe CLI arguments. Both safe fixtures passed 28/28 and caught all six negative controls. The original pinned R03 source still produced 22 passes/six failures with the same source SHA-256. No moving R04 tree or product server/build was tested by that tool update.

## Harness self-check

The safe fixture passes 28/28. Six deliberately unsafe fixtures are detected: caching private content, deleting another namespace, missing private-navigation offline fallback, automatic install-time skipWaiting, caching a private redirect from an allowlisted resource, and unprotected background cache puts. Their respective failure counts are 15/1/5/1/1/1, demonstrating detector sensitivity rather than product failure counts. Each case has an independent VM/in-memory cache and a three-second limit.

## Fidelity and limits

The harness uses native Node Request, Response, and Headers. Node cannot construct navigation mode, so only the browser-observable mode and destination fields are overridden. In-memory cache clones requests/responses, retains query keys, supports GET-only put and add/addAll success checks, and models the fact that HTTP no-store does not automatically prevent explicit Cache API writes. It does not fully model Vary, quotas, eviction, opaque/CORS responses, persistence, or arbitrary worker termination.

Ordinary public mocks use `Cache-Control: public, max-age=3600`. Private markers, Authorization, sensitive queries, RSC, and private redirect responses use no-store. Positive public cases therefore do not force safe workers to ignore no-store. Offline MIME is HTML with UTF-8; legitimate charset normalization is allowed. SVG/PNG mocks are not decoded as real binary images; these are cache-boundary tests, not rendering/integrity tests.

`h.cacheControl("no-store")` constructs the same public URL/body with an uncacheable header, overriding public mocks only. Independent regression tests prove that explicit puts still store no-store responses, so the mock does not supply a missing safety guard. This control did not add a 29th required product case. To examine a candidate's public no-store guard, set the control after install and observe subsequent cache writes.

The lifetime case delays put by 20ms and checks whether respondWith/waitUntil had both ended before completion. It identifies writes lacking lifetime protection, not the frequency of real interruption. Draining promises for observation does not guarantee that unprotected work finishes in browsers.

Network mocks return public synthetic strings or `PRIVATE_SW_PROBE`, with rejection, 401/403/500, or redirect metadata. Authorization/query/RSC/private-redirect requests are deliberately constructed safety boundaries, not proof that normal product flows generate them or leak data. These cases require zero new cache writes. API/auth/ICS/non-GET/cross-origin/private-navigation cases remain independent.

Root observed the historical built Worker's `/offline.html` redirecting 307 to `/offline`. That public canonical redirect differs from a synthetic private-API redirect. VM does not model internal Fetch URL lists or navigation redirect-mode acceptance, so it cannot prove redirected cached pages work for actual navigation. Canonical-path changes may update the public contract while preserving all safety assertions; the old `.html` string is not a mandatory implementation.

## Results this tool cannot establish

It does not establish deployed HTTPS MIME/headers, install eligibility, physical iOS/Android installation, standalone/safe areas, actual offline reload, controllerchange updates, user-content preservation, or phone fonts/touch. Those need fixed-candidate browser/device checks. Push permission and full offline synchronization are outside scope.
