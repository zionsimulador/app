const CACHE_NAME = "zionpay-v3";

const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/supabase.js",
];

// INSTALAÇÃO
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

// FETCH (offline)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
