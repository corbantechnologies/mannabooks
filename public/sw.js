// public/sw.js — Manna Books PWA Service Worker
const CACHE_NAME = "mannabooks-pwa-v1";
const OFFLINE_URL = "/offline";

const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/logo.png",
  "/blackLogo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only intercept GET requests
  if (event.request.method !== "GET") return;

  // Skip chrome-extension or non-http requests
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful static asset responses
        if (
          networkResponse.status === 200 &&
          (event.request.destination === "image" ||
            event.request.destination === "style" ||
            event.request.destination === "script" ||
            event.request.destination === "font")
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // If network fails, try cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        // If it's a page navigation request and offline, return offline fallback page
        if (event.request.mode === "navigate") {
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
        }

        return new Response("Network offline", { status: 503, statusText: "Service Unavailable" });
      })
  );
});
