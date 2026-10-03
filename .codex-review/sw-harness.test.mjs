import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHarness, selfTest } from "./sw-behavior-probe.mjs";

// This fixture observes only the fake browser/network boundary; it is not a
// product worker or a replacement for the 28 behavioral product cases.
const NETWORK_ONLY = `self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});`;

test("ordinary public response is cacheable while a private response is no-store", async () => {
  const h = createHarness(NETWORK_ONLY);
  const publicResult = await h.dispatch("fetch", { request: h.request("/offline.html") });
  assert.equal(publicResult.response.headers.get("cache-control"), "public, max-age=3600");
  assert.equal(publicResult.response.headers.get("content-type"), "text/html; charset=utf-8");
  const privateResult = await h.dispatch("fetch", { request: h.request("/api/auth/me") });
  assert.equal(privateResult.response.headers.get("cache-control"), "no-store");
  assert.match(await privateResult.response.text(), /PRIVATE_SW_PROBE/);
});

test("canonical /offline contract uses public HTML and its own offline body", async () => {
  const source = `self.addEventListener("install", event => {
    event.waitUntil(caches.open("handover-public-probe").then(cache => cache.add("/offline")));
  });`;
  const h = createHarness(source, { offlinePath: "/offline" });
  await h.dispatch("install");
  h.assertPublicOnly();
  const page = await h.caches.match("/offline");
  assert.equal(await page.text(), "PUBLIC_OFFLINE_PAGE: /offline; reconnect to read the current timetable");
  assert.equal(page.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(page.headers.get("cache-control"), "public, max-age=3600");
  assert.equal(await h.caches.match("/offline.html"), undefined);
});

test("both offline contracts retain all 28 cases and all six negative controls", async () => {
  for (const offlinePath of ["/offline.html", "/offline"]) {
    const result = await selfTest({ offlinePath });
    assert.equal(result.offlinePath, offlinePath);
    assert.deepEqual(result.safeFixture, { passed: 28, failed: 0 });
    assert.equal(result.unsafeFixtures.length, 6);
    assert(result.unsafeFixtures.every((item) => item.detected && item.failures > 0));
  }
});

test("a public no-store response can be constructed without changing Cache API semantics", async () => {
  const h = createHarness(NETWORK_ONLY, { offlinePath: "/offline" });
  h.cacheControl("no-store");
  const result = await h.dispatch("fetch", { request: h.request("/offline") });
  assert.equal(result.response.headers.get("cache-control"), "no-store");
  assert.equal(await result.response.clone().text(), "PUBLIC_OFFLINE_PAGE: /offline; reconnect to read the current timetable");
  assert.equal(h.writes.length, 0);
  const cache = await h.caches.open("handover-public-api-fidelity");
  await cache.put("/offline", result.response);
  assert.equal((await cache.match("/offline")).headers.get("cache-control"), "no-store");
  // Header overrides are a public-response fixture control. They must never
  // turn synthetic private content into publicly cacheable network responses.
  h.cacheControl("public, max-age=3600");
  const privateResult = await h.dispatch("fetch", { request: h.request("/api/auth/me") });
  assert.equal(privateResult.response.headers.get("cache-control"), "no-store");
});

test("CLI accepts the explicit public offline route and rejects unsafe or unknown options", () => {
  const tool = fileURLToPath(new URL("./sw-behavior-probe.mjs", import.meta.url));
  const output = execFileSync(process.execPath, [tool, "--self-test", "--offline-path=/offline"], {
    encoding: "utf8", timeout: 10_000,
  });
  const result = JSON.parse(output);
  assert.equal(result.offlinePath, "/offline");
  assert.deepEqual(result.safeFixture, { passed: 28, failed: 0 });
  for (const value of ["/api/auth/me", "/private/notes", "/requests/private-id", "//external.invalid/offline", "/offline?secret=x", "/offline#secret", "/x/../offline"]) {
    const rejected = spawnSync(process.execPath, [tool, "--self-test", `--offline-path=${value}`], { encoding: "utf8" });
    assert.equal(rejected.status, 2, `Unsafe path accepted: ${value}`);
  }
  const typo = spawnSync(process.execPath, [tool, "--self-test", "--offline-paht=/offline"], { encoding: "utf8" });
  assert.equal(typo.status, 2);
  const duplicate = spawnSync(process.execPath, [tool, "--self-test", "--offline-path=/offline", "--offline-path=/offline.html"], { encoding: "utf8" });
  assert.equal(duplicate.status, 2);
});
