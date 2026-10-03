import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function pngSize(path: string) {
  const bytes = readFileSync(path);
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("installable manifest and real PNG icons", () => {
  const manifest = JSON.parse(
    readFileSync("public/manifest.webmanifest", "utf8"),
  ) as {
    id: string;
    display: string;
    start_url: string;
    scope: string;
    icons: { src: string; sizes: string; purpose: string }[];
  };
  assert.equal(manifest.id, "/");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(pngSize("public/icons/icon-192.png").width, 192);
  assert.equal(pngSize("public/icons/icon-512.png").width, 512);
  assert.equal(pngSize("public/icons/apple-touch-icon.png").width, 180);
  assert.equal(pngSize("public/icons/icon-maskable-512.png").width, 512);
  assert.ok(
    manifest.icons.some((icon) => icon.purpose === "maskable"),
    "maskable icon is listed",
  );
});

test("service worker does not cache private API responses", () => {
  const source = readFileSync("public/sw.js", "utf8");
  assert.match(source, /pathname\.startsWith\("\/api\/"\)/);
  assert.match(source, /request\.method !== "GET"/);
  assert.match(source, /const OFFLINE_PATH = "\/offline\.htm"/);
  assert.doesNotMatch(source, /cache\.put\(request,\s*copy\)[\s\S]*\/api\//);
  const offline = readFileSync("public/offline.htm", "utf8");
  assert.match(offline, /needs a connection/);
  assert.match(offline, /交接需要網路/);
});

test("offline asset is self-contained public HTML", () => {
  const offline = readFileSync("public/offline.htm", "utf8");
  assert.match(offline, /^<!doctype html>/i);
  assert.match(offline, /Nothing was\s+submitted/);
  assert.doesNotMatch(offline, /<(?:script|link|iframe|img)\b/i);
});
