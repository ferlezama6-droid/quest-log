// Service Worker de Quest Log — permite que la app cargue y funcione
// sin conexión una vez instalada.
//
// Estrategia:
// - El documento principal (index.html / navegación) es "network-first":
//   siempre intenta traer la versión más nueva del servidor primero; si
//   hay conexión, tu celular queda al día automáticamente cada vez que
//   abres la app. Si no hay conexión, cae al caché para que igual abra.
// - Los archivos estáticos (manifest, íconos) son "cache-first" porque
//   casi nunca cambian, así cargan al instante.

const CACHE_VERSION = "quest-log-v2";
const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isAppDocument(request){
  if (request.mode === "navigate") return true;
  const url = request.url;
  return url.endsWith("/") || url.endsWith("index.html");
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (isAppDocument(event.request)){
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok){
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match("./index.html"))
        )
    );
    return;
  }

  // Cache-first para el resto (manifest, íconos).
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
