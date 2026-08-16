// Service worker: habilita la instalación como app y el juego offline.
const CACHE = "apunto-y-tiro-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./vendor/three.min.js",
  "./vendor/OrbitControls.js",
  "./vendor/GLTFLoader.js",
  "./vendor/qrcode.js",
  "./vendor/jsQR.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./assets/models/Horse.glb",
  "./assets/models/Flamingo.glb",
  "./assets/models/Parrot.glb",
  "./assets/models/Stork.glb",
  "./assets/models/Fox.glb",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // version.json va SIEMPRE a la red: es el detector de actualizaciones
  // (si se cacheara, nunca nos enteraríamos de una versión nueva)
  if (req.url.includes("version.json")) {
    e.respondWith(fetch(req));
    return;
  }
  const isNav = req.mode === "navigate" || req.url.endsWith("/index.html");
  if (isNav) {
    // páginas: red primero (para recibir versiones nuevas), caché de respaldo
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
  } else {
    // recursos: caché primero, red de respaldo
    e.respondWith(
      caches.match(req).then(
        (r) =>
          r ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
  }
});
