const CACHE_NAME = "dshario-production-pwa-v1";

const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/dshario-icon-192.png",
  "/dshario-icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(
            key =>
              (
                key.startsWith("dshario-rc101-pwa-") ||
                key.startsWith("dshario-production-pwa-")
              ) &&
              key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Only handle files from DShario's own domain.
  if (url.origin !== self.location.origin) return;

  // Always get page/navigation requests from the network.
  // This prevents old DShario HTML from being shown from cache.
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
    return;
  }

  // Only cache the small static PWA files.
  // Supabase, authentication, AI/API calls and dynamic content
  // are deliberately not cached here.
  if (!STATIC_ASSETS.includes(url.pathname)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });
        }

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
