// Read-only HTTPS resource probe. No cookies, credentials, browser, or mutations.
// Usage: node .codex-review/probe-pwa-http.mjs https://actual-deployment.example/
import assert from "node:assert/strict";

const supplied = new URL(process.argv[2] ?? "https://invalid.invalid/");
assert.equal(supplied.protocol, "https:", "Use the actual HTTPS deployment URL");
assert.ok(!supplied.username && !supplied.password, "No credentials in URL");
assert.ok(!supplied.search && !supplied.hash, "No query tokens or fragments");
assert.notEqual(supplied.hostname, "invalid.invalid", "Deployment URL is required");
const base = new URL("/", supplied);
const results = [];

async function get(path) {
  let url = new URL(path, base);
  assert.equal(url.origin, base.origin, "Resource must be same-origin");
  assert.ok(!url.username && !url.password && !url.search && !url.hash);
  const redirects = [];
  let initialStatus;
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(url, {
      method: "GET", redirect: "manual", credentials: "omit",
      signal: AbortSignal.timeout(15000),
    });
    initialStatus ??= response.status;
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      assert.ok(location, "Redirect requires Location");
      const next = new URL(location, url);
      assert.equal(next.origin, base.origin, "Do not follow platform/external sign-in redirects");
      assert.equal(next.protocol, "https:");
      assert.ok(!next.username && !next.password && !next.search && !next.hash);
      redirects.push({ status: response.status, path: next.pathname });
      await response.body?.cancel();
      url = next;
      continue;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const record = {
      path: new URL(path, base).pathname, finalPath: url.pathname,
      initialStatus, finalStatus: response.status, status: response.status,
      type: response.headers.get("content-type"),
      cacheControl: response.headers.get("cache-control"), redirects, bytes: bytes.length,
    };
    results.push(record);
    return { bytes, record };
  }
  throw new Error("Too many redirects");
}

function revalidates(record) {
  assert.ok(/no-cache|no-store|max-age\s*=\s*0/i.test(record.cacheControl ?? ""), "Manifest/SW must revalidate");
  assert.ok(!/immutable/i.test(record.cacheControl ?? ""), "Manifest/SW must not be immutable");
}

try {
  const home = await get("/");
  assert.equal(home.record.status, 200);
  assert.match(home.record.type ?? "", /text\/html/i);
  assert.match(home.bytes.toString("utf8"), /manifest\.webmanifest/);
  const manifest = await get("/manifest.webmanifest");
  assert.equal(manifest.record.status, 200);
  assert.match(manifest.record.type ?? "", /application\/(manifest\+json|json)/i);
  revalidates(manifest.record);
  const body = JSON.parse(manifest.bytes.toString("utf8"));
  assert.equal(body.display, "standalone");
  assert.ok(body.id && body.name && body.short_name);
  const scope = new URL(body.scope, base);
  const start = new URL(body.start_url, base);
  assert.equal(scope.origin, base.origin);
  assert.equal(start.origin, base.origin);
  assert.ok(start.pathname.startsWith(scope.pathname), "start_url must be in scope");
  manifest.record.manifest = { id: body.id, scope: body.scope, start_url: body.start_url, display: body.display };

  for (const [path, size] of [
    ["/icons/icon-192.png", 192], ["/icons/icon-512.png", 512],
    ["/icons/icon-maskable-512.png", 512], ["/icons/apple-touch-icon.png", 180],
  ]) {
    const png = await get(path);
    assert.equal(png.record.status, 200);
    assert.match(png.record.type ?? "", /image\/png/i);
    assert.deepEqual(png.bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.equal(png.bytes.toString("ascii", 12, 16), "IHDR");
    const dimensions = [png.bytes.readUInt32BE(16), png.bytes.readUInt32BE(20)];
    assert.deepEqual(dimensions, [size, size]);
    png.record.dimensions = dimensions;
  }

  const sw = await get("/sw.js");
  assert.equal(sw.record.status, 200);
  assert.match(sw.record.type ?? "", /(?:text|application)\/javascript/i);
  assert.equal(sw.record.redirects.length, 0, "SW must load directly");
  revalidates(sw.record);
  const offline = await get("/offline.htm");
  assert.equal(offline.record.status, 200);
  assert.equal(offline.record.initialStatus, 200, "Canonical offline page must return 200 directly");
  assert.equal(offline.record.redirects.length, 0, "Offline page must not redirect");
  assert.equal(offline.record.finalPath, "/offline.htm");
  assert.match(offline.record.type ?? "", /text\/html/i);
  assert.match(offline.bytes.toString("utf8"), /Handover needs a connection/);
  assert.doesNotMatch(offline.bytes.toString("utf8"), /\p{Script=Han}/u);
  assert.match(offline.bytes.toString("utf8"), /Nothing was\s+submitted/);
  offline.record.canonicalPath = offline.record.finalPath;
  for (const path of ["/api/auth/me", "/api/workspace"]) {
    const api = await get(path);
    assert.ok([401, 403].includes(api.record.status), "Anonymous private API must reject access");
    assert.match(api.record.cacheControl ?? "", /no-store/i);
  }
  process.stdout.write(JSON.stringify({ ok: true, resources: results, scope: "HTTP resources only; no SW controller, offline navigation, authenticated response, or phone-install proof" }, null, 2) + "\n");
} catch (error) {
  // Do not print fetch errors/URLs, response bodies, Set-Cookie, or tokens.
  process.stdout.write(JSON.stringify({ ok: false, error: error instanceof assert.AssertionError ? error.message : "Resource fetch or parsing failed", resources: results }, null, 2) + "\n");
  process.exitCode = 1;
}
