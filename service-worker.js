// Service Worker de Quest Log — permite que la app cargue y funcione
// sin conexión una vez instalada, usando una estrategia "cache-first"
// con fallback a la red y auto-actualización cuando publiques una nueva versión.

const CACHE_VERSION = "quest-log-v1";
const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

// Al instalar: precarga todos los archivos de la app en caché.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Al activar: borra cachés de versiones anteriores.
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

// Estrategia: cache-first. Si el archivo ya está en caché, se sirve al
// instante (offline funciona siempre); si no, se pide a la red y se
// guarda en caché para la próxima vez. Si falla todo (sin caché ni red),
// se cae de vuelta al index.html para que la app igual abra.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
