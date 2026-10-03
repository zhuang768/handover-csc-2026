const VERSION = "handover-public-r05-canonical-1";
const PREFIX = "handover-public-";
const OFFLINE_PATH = "/offline";
const PRECACHE = [
  OFFLINE_PATH,
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/manifest.webmanifest",
];

function publicRequest(request) {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return null;
  if (url.search) return null;
  if (request.headers.get("authorization")) return null;
  if (
    request.headers.has("rsc") ||
    request.headers.has("next-router-state-tree")
  )
    return null;
  if (!PRECACHE.includes(url.pathname)) return null;
  return url;
}

function embeddedOffline() {
  const html = `<!doctype html><html lang="en"><body><h1>Handover needs a connection</h1><p>Nothing was submitted.</p><h2>交接需要網路</h2><p>沒有任何內容被送出。</p><button type="button" onclick="location.reload()">Try again · 重試</button></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function cleanPublicResponse(response, path) {
  if (
    !response ||
    !response.ok ||
    response.redirected ||
    response.type === "opaqueredirect"
  )
    return null;
  const finalUrl = new URL(response.url || path, self.location.origin);
  if (finalUrl.origin !== self.location.origin) return null;
  if (finalUrl.pathname !== path) return null;
  if (finalUrl.pathname.startsWith("/api/")) return null;
  const body = await response.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "content-type":
        response.headers.get("content-type") ||
        (path === OFFLINE_PATH ? "text/html; charset=utf-8" : "text/plain"),
      "cache-control": "no-cache",
    },
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await Promise.all(
        PRECACHE.map(async (path) => {
          const response = await fetch(path);
          const clean = await cleanPublicResponse(response, path);
          if (clean) await cache.put(path, clean);
          else if (path === OFFLINE_PATH)
            await cache.put(path, embeddedOffline());
          else throw new Error(`Could not cache ${path}`);
        }),
      );
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(PREFIX) && key !== VERSION)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/"))
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(VERSION);
        const cached = await cache.match(OFFLINE_PATH);
        if (!cached) {
          return new Response("Offline", {
            status: 503,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }
        return (
          (await cleanPublicResponse(cached, OFFLINE_PATH)) ??
          new Response("Offline", {
            status: 503,
            headers: { "content-type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }
  const allowed = publicRequest(request);
  if (!allowed) return;
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        const clean = await cleanPublicResponse(
          response.clone(),
          allowed.pathname,
        );
        if (clean) {
          const saved = clean.clone();
          event.waitUntil(
            caches
              .open(VERSION)
              .then((cache) => cache.put(allowed.pathname, saved))
              .catch(() => undefined),
          );
        }
        return response;
      } catch {
        const cache = await caches.open(VERSION);
        return (
          (await cache.match(allowed.pathname)) ??
          new Response("Offline", { status: 503 })
        );
      }
    })(),
  );
});
