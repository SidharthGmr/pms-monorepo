/* eslint-env serviceworker */

// Offline fallback only. This worker caches ONE page, plus the stylesheet and fonts that page
// needs to render, and nothing else.
//
// Do not add page, RSC or /api/* caching here. Cache Storage is shared by every user of a
// browser profile, so a cached authenticated response would leak to the next person who signs
// in on a shared terminal, and cached stock levels would quietly show numbers that are no
// longer true. A live inventory system is better off showing nothing than showing stale data.
//
// It must also never synthesise a response for a real app page: the document's
// Permissions-Policy header (camera=(self)) comes from the network response, and a synthetic
// one would strip it and break the camera capture dialog.

const CACHE = 'pms-offline-v3';
const OFFLINE_URL = '/offline/'; // Trailing slash required: `trailingSlash: true` 308s /offline.

// The offline page's own stylesheet, read out of its HTML so no build step or hard-coded hash
// is involved - the names are content-hashed in production. Query strings are kept: the page
// requests the exact URL.
//
// Webfonts are deliberately NOT cached. The @font-face files behind this layout come to ~260KB,
// over a third of it a Devanagari subset this English-only page never uses, and a metric-matched
// system fallback is a difference almost nobody will notice on an error screen.
const ASSET_PATTERN = /["'](\/_next\/static\/[^"']+?\.css(?:\?[^"']*)?)["']/g;

const FALLBACK_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title></head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:48px 24px;color:#092a55">
<h1 style="font-size:20px">You are offline</h1><p>Check your connection and try again.</p></body></html>`;

const absolute = (path) => new URL(path, self.location.origin).href;

/** Refresh the offline page and its assets, then drop anything no longer referenced. */
async function cacheOfflinePage() {
  try {
    const cache = await caches.open(CACHE);
    const response = await fetch(new Request(OFFLINE_URL, { cache: 'reload' }));
    if (!response.ok) return;

    const html = await response.clone().text();
    await cache.put(OFFLINE_URL, response);

    // Only fetch a stylesheet that is missing. These names are content-hashed, so one already
    // in the cache is current by definition - re-downloading it on every refresh would put a
    // couple of hundred KB on the wire for nothing.
    const assets = [...new Set([...html.matchAll(ASSET_PATTERN)].map((match) => match[1]))];
    await Promise.all(
      assets.map(async (asset) => {
        if (await cache.match(asset)) return;
        await cache.add(new Request(asset, { cache: 'reload' })).catch(() => undefined);
      })
    );

    // A deploy renames these, so stale entries are swept rather than left to accumulate - they
    // would never be requested again anyway.
    const keep = new Set([absolute(OFFLINE_URL), ...assets.map(absolute)]);
    const stale = (await cache.keys()).filter((request) => !keep.has(request.url));
    await Promise.all(stale.map((request) => cache.delete(request)));
  } catch {
    // A failed refresh must never reject install/activate - that would leave the worker
    // unactivated and the previous one serving indefinitely.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheOfflinePage());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await cacheOfflinePage();
      await self.clients.claim();
    })()
  );
});

// This file is byte-identical between deploys, so `install` does not re-run and the cached copy
// would otherwise go stale forever. The page asks for a refresh on every load instead.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'REFRESH_OFFLINE') event.waitUntil(cacheOfflinePage());
});

async function offlineDocument() {
  const cached = await caches.match(OFFLINE_URL);
  // Rebuilt rather than returned as-is: a cached response carrying the `redirected` flag is
  // rejected for a navigation, and a cache miss would resolve to undefined and throw.
  const body = cached ? await cached.text() : FALLBACK_HTML;
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(offlineDocument));
    return;
  }

  // Everything else is left to the browser untouched, except the static assets the offline page
  // itself needs. Network first, so a deploy is picked up immediately and the cache is only
  // ever a last resort - these filenames are not always content-hashed.
  const url = new URL(request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(fetch(request).catch(async () => (await caches.match(request)) || Response.error()));
  }
});
