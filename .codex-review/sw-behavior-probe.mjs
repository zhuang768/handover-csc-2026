import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

// Review-only behavioral probe. No real network, browser, storage, or product writes.
const ORIGIN = "https://handover-probe.invalid";
const PREFIX = "handover-public-";
const PRIVATE_MARKER = "PRIVATE_SW_PROBE";
const STATIC_PUBLIC_PATHS = [
  "/favicon.svg", "/manifest.webmanifest",
  "/icons/icon-192.png", "/icons/icon-512.png",
  "/icons/icon-maskable-512.png", "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png", "/icons/apple-touch-icon-180.png",
];

// This is an explicit reviewer contract, never inferred from product branches.
function publicContract({ offlinePath = "/offline.html" } = {}) {
  assert(typeof offlinePath === "string" && /^(?:\/[A-Za-z0-9_-]+)+(?:\.[A-Za-z0-9]+)?$/.test(offlinePath),
    "Offline path must be an absolute static pathname without origin, query, fragment, or traversal");
  assert(!/^\/(?:api|_next|private|requests)(?:\/|$)/.test(offlinePath) && !offlinePath.includes("hot-update"),
    "Offline path must not use a private/API/framework namespace");
  return {
    offlinePath,
    offlineBody: `PUBLIC_OFFLINE_PAGE: ${offlinePath}; reconnect to read the current timetable`,
    offlineMime: "text/html; charset=utf-8",
    publicPaths: new Set([offlinePath, ...STATIC_PUBLIC_PATHS]),
  };
}

// Node does not allow constructing mode:navigate. Preserve its native Request
// implementation and override only browser-only observable mode/destination.
class BrowserRequest extends Request {
  constructor(input, init = {}) {
    const mode = init.mode ?? (input instanceof Request ? input.mode : "cors");
    const destination = init.destination ?? (input instanceof Request ? input.destination : "");
    const normalized = typeof input === "string" || input instanceof URL
      ? new URL(input, ORIGIN).href : input;
    super(normalized, { ...init, mode: mode === "navigate" ? "same-origin" : mode });
    Object.defineProperty(this, "mode", { value: mode });
    Object.defineProperty(this, "destination", { value: destination });
  }
  clone() { return new BrowserRequest(super.clone(), { mode: this.mode, destination: this.destination }); }
}

export function createHarness(source, options = {}) {
  const { offlinePath, offlineBody, offlineMime, publicPaths } = publicContract(options);
  const listeners = new Map();
  const stores = new Map();
  const pending = new Set();
  const failures = [];
  const writes = [];
  const deletions = [];
  const networkCalls = [];
  let offline = false;
  let status = 200;
  let redirectTarget = null;
  let publicCacheControl = "public, max-age=3600";
  let putDelay = 0;
  let activeEvent = null;
  let claims = 0;
  let skips = 0;
  const requestOf = (input, init) => new BrowserRequest(input, init);
  function track(promise, captureFailure = false) {
    pending.add(promise);
    promise.then(() => pending.delete(promise), (error) => {
      pending.delete(promise);
      if (captureFailure) failures.push(error);
    });
    return promise;
  }
  function fetchMock(input, init) {
    return track((async () => {
      const request = requestOf(input, init);
      const url = new URL(request.url);
      networkCalls.push({ url: request.url, method: request.method });
      if (offline) throw new TypeError("Mock network unavailable");
      const isPublic = !redirectTarget && url.origin === ORIGIN && publicPaths.has(url.pathname)
        && !url.search && !request.headers.has("authorization")
        && !request.headers.has("rsc") && !request.headers.has("next-router-state-tree");
      const body = isPublic
        ? url.pathname === offlinePath ? offlineBody : `PUBLIC_ASSET:${url.pathname}`
        : `${PRIVATE_MARKER}:${url.pathname}`;
      const response = new Response(body, { status, headers: {
        "content-type": url.pathname === offlinePath ? offlineMime : "text/plain",
        // HTTP cacheability belongs to the fake network response. Cache Storage
        // still accepts no-store when a faulty worker explicitly puts it.
        "cache-control": isPublic ? publicCacheControl : "no-store",
      } });
      function exposeMetadata(value) {
        Object.defineProperties(value, {
          url: { value: redirectTarget ?? request.url },
          redirected: { value: Boolean(redirectTarget) },
          type: { value: "basic" },
        });
        const nativeClone = value.clone.bind(value);
        value.clone = () => exposeMetadata(nativeClone());
        return value;
      }
      return exposeMetadata(response);
    })());
  }
  class MemoryCache {
    constructor(name) { this.name = name; this.entries = new Map(); }
    put(input, response) {
      const eventOwner = activeEvent;
      return track((async () => {
        const request = requestOf(input);
        if (request.method !== "GET") throw new TypeError("Cache.put accepts GET only");
        if (!response || !(response instanceof Response)) throw new TypeError("Response required");
        if (putDelay) await new Promise((resolveWrite) => setTimeout(resolveWrite, putDelay));
        const body = await response.clone().text();
        this.entries.set(request.url, { request: request.clone(), response: response.clone(), body });
        writes.push({ cache: this.name, url: request.url, method: request.method,
          authorization: request.headers.has("authorization"), body,
          outlivedEvent: Boolean(eventOwner?.complete) });
      })(), true);
    }
    match(input, options = {}) {
      return track((async () => {
        const request = requestOf(input);
        if (!options.ignoreMethod && request.method !== "GET") return undefined;
        const entry = [...this.entries.values()].find((item) => {
          const a = new URL(item.request.url); const b = new URL(request.url);
          if (options.ignoreSearch) { a.search = ""; b.search = ""; }
          return a.href === b.href;
        });
        return entry?.response.clone();
      })());
    }
    add(input) { return track(fetchMock(input).then((response) => {
      if (!response.ok) throw new TypeError("Cache.add requires a successful response");
      return this.put(input, response);
    }), true); }
    addAll(inputs) { return track(Promise.all(inputs.map((input) => this.add(input))), true); }
    keys() { return Promise.resolve([...this.entries.values()].map((entry) => entry.request.clone())); }
    delete(input) { return Promise.resolve(this.entries.delete(requestOf(input).url)); }
  }
  const caches = {
    open(name) {
      return track((async () => {
        if (!stores.has(name)) stores.set(name, new MemoryCache(name));
        return stores.get(name);
      })());
    },
    keys() { return Promise.resolve([...stores.keys()]); },
    has(name) { return Promise.resolve(stores.has(name)); },
    delete(name) { deletions.push(name); return Promise.resolve(stores.delete(name)); },
    async match(input, options = {}) {
      for (const [name, cache] of stores) {
        if (options.cacheName && options.cacheName !== name) continue;
        const response = await cache.match(input, options);
        if (response) return response;
      }
      return undefined;
    },
  };
  const self = {
    location: new URL(`${ORIGIN}/sw.js`),
    registration: { scope: `${ORIGIN}/` },
    clients: { claim: () => { claims++; return Promise.resolve(); } },
    skipWaiting: () => { skips++; return Promise.resolve(); },
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
  };
  const context = vm.createContext({ self, caches, fetch: fetchMock,
    Request: BrowserRequest, Response, Headers, URL, URLSearchParams,
    console: { log() {}, warn() {}, error() {} } });
  vm.runInContext(source, context, { timeout: 1000, filename: "pinned-sw.js" });
  async function flush() {
    for (let iteration = 0; iteration < 100; iteration++) {
      const work = [...pending];
      if (work.length) await Promise.allSettled(work);
      await new Promise((resolveIdle) => setImmediate(resolveIdle));
      if (!pending.size) { assert.equal(failures.length, 0, "Detached cache operation failed"); return; }
    }
    throw new Error("Harness pending-operation limit exceeded");
  }
  async function dispatch(type, data = {}) {
    const waits = [];
    const eventOwner = { type, complete: false };
    activeEvent = eventOwner;
    let response;
    let synchronous = true;
    const event = { ...data,
      waitUntil(promise) { waits.push(Promise.resolve(promise)); },
      respondWith(promise) {
        assert(synchronous, "respondWith must be invoked synchronously during event dispatch");
        assert.equal(response, undefined, "respondWith invoked twice");
        response = Promise.resolve(promise);
      },
    };
    for (const callback of listeners.get(type) ?? []) {
      const returned = callback(event);
      if (returned && typeof returned.then === "function") track(returned, true);
    }
    synchronous = false;
    const output = response ? await response : undefined;
    await Promise.all(waits);
    eventOwner.complete = true;
    await flush();
    activeEvent = null;
    return { intercepted: Boolean(response), response: output };
  }
  function assertPublicOnly() {
    for (const write of writes) {
      const url = new URL(write.url);
      assert.equal(url.origin, ORIGIN, "Cross-origin cache write");
      assert(publicPaths.has(url.pathname), `Non-allowlist cache write: ${url.pathname}`);
      assert.equal(url.search, "", "Query-bearing URL persisted");
      assert.equal(write.authorization, false, "Authorization-bearing request persisted");
      assert(!write.body.includes(PRIVATE_MARKER), "Private response body persisted");
    }
  }
  return { caches, stores, writes, deletions, networkCalls, dispatch, assertPublicOnly,
    request: requestOf, offline: (value) => { offline = value; }, status: (value) => { status = value; },
    redirect: (value) => { redirectTarget = value; }, delayWrites: (value) => { putDelay = value; },
    cacheControl: (value) => {
      assert(typeof value === "string", "Public Cache-Control fixture value must be a string");
      publicCacheControl = value;
    },
    counters: () => ({ claims, skips }), listeners };
}

async function deadline(action) {
  let timer;
  try { return await Promise.race([action(), new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Behavior case timed out after 3 seconds")), 3000);
  })]); } finally { clearTimeout(timer); }
}

export async function probeSource(source, options = {}) {
  const { offlinePath, offlineBody, offlineMime } = publicContract(options);
  const cases = [];
  function assertOfflineMime(response) {
    // Correct HTML type matters; a worker may legitimately normalize charset
    // parameters when returning a fresh, non-redirected fallback Response.
    const actual = (response.headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase();
    assert.equal(actual, offlineMime.split(";", 1)[0], "Offline fallback must have its public HTML MIME type");
  }
  async function check(name, action, install = true) {
    try { await deadline(async () => {
      const h = createHarness(source, options);
      assert(h.listeners.has("install"), "SW has no install listener");
      if (install) await h.dispatch("install");
      h.assertPublicOnly();
      await action(h);
      h.assertPublicOnly();
    }); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false, error: error.message }); }
  }
  await check("install precaches public offline page without automatic skipWaiting", async (h) => {
    const page = await h.caches.match(offlinePath);
    assert(page, "Offline page not cached");
    assert.equal(await page.text(), offlineBody);
    assertOfflineMime(page);
    assert.equal(h.counters().skips, 0, "Install forces a new worker onto existing clients");
  });
  await check("failed install rejects and preserves previous caches", async (h) => {
    const previous = await h.caches.open(`${PREFIX}previous-probe`);
    await previous.put(offlinePath, new Response("PREVIOUS_PUBLIC_OFFLINE_PAGE"));
    await h.caches.open("other-app-v1");
    h.status(404);
    await assert.rejects(() => h.dispatch("install"), "Unsuccessful precache must reject install");
    assert(h.stores.has("other-app-v1"));
    assert.equal(await (await previous.match(offlinePath)).text(), "PREVIOUS_PUBLIC_OFFLINE_PAGE");
  }, false);
  const excluded = [
    ["workspace API", "/api/workspace"], ["auth session", "/api/auth/me"],
    ["auth login", "/api/auth/login"], ["request private detail", "/api/requests/private-id"],
    ["notifications", "/api/notifications"], ["role-scoped ICS", "/api/calendar?week=2026-10-05"],
    ["private non-allowlist resource", "/private/teacher-notes.txt"],
    ["cross-origin asset", `https://external-probe.invalid${offlinePath}`],
    ["POST public-looking URL", offlinePath, { method: "POST", body: "mutation" }],
    ["PUT public-looking URL", "/favicon.svg", { method: "PUT", body: "mutation" }],
    ["PATCH public-looking URL", offlinePath, { method: "PATCH", body: "mutation" }],
    ["DELETE public-looking URL", offlinePath, { method: "DELETE" }],
    ["HEAD public-looking URL", offlinePath, { method: "HEAD" }],
    ["Authorization public-looking URL", offlinePath, { headers: { authorization: "Bearer probe-secret" } }],
    ["sensitive query public-looking URL", `${offlinePath}?recoveryCode=probe-secret`],
    ["RSC public-looking URL", offlinePath, { headers: { rsc: "1", "next-router-state-tree": "probe" } }],
  ];
  for (const [label, path, init = {}] of excluded) await check(`${label} bypasses SW cache`, async (h) => {
    const count = h.writes.length;
    const result = await h.dispatch("fetch", { request: h.request(path, init) });
    // Pure network-only respondWith is also valid; it must not substitute HTML
    // for API errors or make this request persistent.
    if (result.intercepted) assert(result.response instanceof Response);
    assert.equal(h.writes.length, count, "Excluded request caused a cache write");
    h.offline(true);
    try {
      const failed = await h.dispatch("fetch", { request: h.request(path, init) });
      assert.equal(failed.intercepted, false, "Excluded request received a cached/offline fallback");
    } catch (error) {
      assert.equal(error.message, "Mock network unavailable", "Excluded request did not preserve network failure");
    }
  });
  await check("private navigation stays network-only; failure uses only generic offline page", async (h) => {
    const request = h.request("/requests/private-id", { mode: "navigate", destination: "document" });
    const count = h.writes.length;
    const online = await h.dispatch("fetch", { request });
    assert(online.intercepted, "No navigation fallback handler");
    assert((await online.response.text()).includes(PRIVATE_MARKER));
    assert.equal(h.writes.length, count, "Navigation HTML was persisted");
    h.offline(true);
    const failed = await h.dispatch("fetch", { request });
    assert.equal(await failed.response.text(), offlineBody);
    assertOfflineMime(failed.response);
    assert.equal(h.writes.length, count, "Offline fallback persisted private navigation");
  });
  for (const status of [401, 403, 500]) await check(`navigation HTTP ${status} is not replaced by offline success`, async (h) => {
    h.status(status);
    const result = await h.dispatch("fetch", { request: h.request("/requests/private-id", { mode: "navigate" }) });
    assert(result.intercepted);
    assert.equal(result.response.status, status);
    assert((await result.response.text()).includes(PRIVATE_MARKER));
  });
  await check("explicit public allowlist asset works offline", async (h) => {
    h.offline(true);
    const result = await h.dispatch("fetch", { request: h.request(offlinePath) });
    assert(result.intercepted, "Public offline asset was not handled");
    assert.equal(await result.response.text(), offlineBody);
    assertOfflineMime(result.response);
  });
  await check("missing offline page yields a generic failure without private content", async (h) => {
    for (const cache of h.stores.values()) await cache.delete(offlinePath);
    h.offline(true);
    const result = await h.dispatch("fetch", { request: h.request("/requests/private-id", { mode: "navigate" }) });
    assert(result.response instanceof Response);
    assert.equal(result.response.status, 503);
    assert(!(await result.response.text()).includes(PRIVATE_MARKER));
  });
  await check("public allowlist HTTP failure does not overwrite good cache", async (h) => {
    const count = h.writes.length;
    h.status(500);
    await h.dispatch("fetch", { request: h.request(offlinePath) });
    assert.equal(h.writes.length, count);
    assert.equal(await (await h.caches.match(offlinePath)).text(), offlineBody);
  });
  await check("redirected allowlist response cannot persist private content", async (h) => {
    const count = h.writes.length;
    h.redirect(`${ORIGIN}/api/auth/me`);
    await h.dispatch("fetch", { request: h.request(offlinePath) });
    assert.equal(h.writes.length, count, "Redirected allowlist response was persisted");
  });
  await check("runtime cache write is covered by respondWith or waitUntil lifetime", async (h) => {
    const count = h.writes.length;
    h.delayWrites(20);
    await h.dispatch("fetch", { request: h.request(offlinePath) });
    assert(h.writes.slice(count).every((item) => !item.outlivedEvent), "Background cache write outlived the fetch event");
  });
  await check("activation deletes only obsolete caches in its own public prefix", async (h) => {
    const current = [...h.stores.keys()];
    assert(current.some((name) => name.startsWith(PREFIX)), "Expected Handover public namespace absent");
    await h.caches.open(`${PREFIX}obsolete-probe`);
    await h.caches.open("other-app-v1");
    await h.caches.open("handover-unrelated-tool-v1");
    await h.dispatch("activate");
    assert(!h.stores.has(`${PREFIX}obsolete-probe`), "Obsolete app cache retained");
    assert(h.stores.has("other-app-v1"), "Another app's cache was deleted");
    assert(h.stores.has("handover-unrelated-tool-v1"), "Unrelated Handover cache was deleted");
    assert(current.every((name) => h.stores.has(name)), "Current public cache was deleted");
    assert(h.deletions.every((name) => name.startsWith(PREFIX)), "Cleanup escaped its namespace");
  });
  return { passed: cases.filter((item) => item.passed).length,
    failed: cases.filter((item) => !item.passed).length, cases };
}

function fixture({ offlinePath = "/offline.html", privateCache = false, deleteAll = false, omitFallback = false,
  forceUpdate = false, redirectCache = false, detachedWrite = false } = {}) {
  const encodedOffline = JSON.stringify(publicContract({ offlinePath }).offlinePath);
  return `
    const NAME = 'handover-public-fixture';
    const PUBLIC = [${encodedOffline}, '/favicon.svg'];
    self.addEventListener('install', e => e.waitUntil((async () => {
      const cache = await caches.open(NAME); await cache.addAll(PUBLIC);
      if (${forceUpdate}) await self.skipWaiting();
    })()));
    self.addEventListener('activate', e => e.waitUntil((async () => {
      for (const name of await caches.keys()) {
        if (name !== NAME && (${deleteAll} || name.startsWith('handover-public-'))) await caches.delete(name);
      }
    })()));
    self.addEventListener('fetch', e => {
      const r = e.request; const u = new URL(r.url);
      if (r.method !== 'GET' || u.origin !== self.location.origin) return;
      if (!${privateCache} && (u.pathname.startsWith('/api/') || u.search || r.headers.has('authorization') || r.headers.has('rsc') || r.headers.has('next-router-state-tree'))) return;
      if (r.mode === 'navigate') {
        if (${omitFallback}) return;
        e.respondWith(fetch(r).then(async response => {
          if (${privateCache}) await (await caches.open(NAME)).put(r, response.clone());
          return response;
        }).catch(async () => (await (await caches.open(NAME)).match(${encodedOffline})) ?? new Response('Offline', { status: 503 }))); return;
      }
      if (!${privateCache} && !PUBLIC.includes(u.pathname)) return;
      e.respondWith(fetch(r).then(async response => {
        if (response.ok && (${privateCache} || ${redirectCache} || !response.redirected)) {
          const write = (async () => (await caches.open(NAME)).put(r, response.clone()))();
          if (${detachedWrite}) void write; else await write;
        }
        return response;
      }).catch(async () => (await caches.open(NAME)).match(u.pathname)));
    });`;
}

export async function selfTest(options = {}) {
  const { offlinePath } = publicContract(options);
  const good = await probeSource(fixture({ offlinePath }), { offlinePath });
  assert.equal(good.failed, 0, JSON.stringify(good.cases.filter((item) => !item.passed)));
  const bad = [];
  for (const [name, behavior, expectedCase] of [
    ["private caching", { privateCache: true }, "workspace API bypasses SW cache"],
    ["overbroad cleanup", { deleteAll: true }, "activation deletes only obsolete caches in its own public prefix"],
    ["missing navigation fallback", { omitFallback: true }, "private navigation stays network-only; failure uses only generic offline page"],
    ["forced update", { forceUpdate: true }, "install precaches public offline page without automatic skipWaiting"],
    ["redirected private response", { redirectCache: true }, "redirected allowlist response cannot persist private content"],
    ["unprotected background cache write", { detachedWrite: true }, "runtime cache write is covered by respondWith or waitUntil lifetime"],
  ]) {
    const result = await probeSource(fixture({ offlinePath, ...behavior }), { offlinePath });
    assert(result.cases.some((item) => item.name === expectedCase && !item.passed), `${name} fixture was not detected`);
    bad.push({ fixture: name, detected: true, failures: result.failed });
  }
  return { mode: "self-test", offlinePath, safeFixture: { passed: good.passed, failed: good.failed }, unsafeFixtures: bad };
}

const ownPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === ownPath) {
  try {
    let selfTestMode = false;
    let sha;
    let offlinePath;
    const args = process.argv.slice(2);
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (arg === "--self-test") {
        assert(!selfTestMode, "Duplicate --self-test option");
        selfTestMode = true;
      } else if (arg === "--stable-sha") {
        assert(sha === undefined, "Duplicate --stable-sha option");
        sha = args[++index];
        assert(sha !== undefined, "Missing --stable-sha value");
      } else if (arg.startsWith("--offline-path=")) {
        assert(offlinePath === undefined, "Duplicate --offline-path option");
        offlinePath = arg.slice("--offline-path=".length);
      } else {
        throw new Error(`Unknown option: ${arg}`);
      }
    }
    const options = { offlinePath: publicContract({ offlinePath }).offlinePath };
    assert(!(selfTestMode && sha !== undefined), "Choose --self-test or --stable-sha, not both");
    if (selfTestMode) {
      console.log(JSON.stringify(await selfTest(options), null, 2));
    } else {
      assert(/^[a-f0-9]{40}$/i.test(sha), "Use --self-test, or --stable-sha <full 40-character commit SHA>; never run the moving worktree");
      const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: dirname(ownPath), encoding: "utf8" }).trim();
      const path = "handover/public/sw.js";
      const source = execFileSync("git", ["show", `${sha}:${path}`], { cwd: root, encoding: "utf8" });
      const result = await probeSource(source, options);
      console.log(JSON.stringify({ mode: "pinned-product", commit: sha, path,
        offlinePath: options.offlinePath,
        sourceSha256: createHash("sha256").update(source).digest("hex"), ...result }, null, 2));
      process.exitCode = result.failed ? 1 : 0;
    }
  } catch (error) { console.error(error.message); process.exitCode = 2; }
}
