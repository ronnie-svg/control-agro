const cacheName = "control-agro-v11";
const assets = [
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./icon.svg",
  "./src/main.js",
  "./src/components/bottom-nav.js",
  "./src/components/header.js",
  "./src/components/icons.js",
  "./src/data/api.js",
  "./src/data/categories.js",
  "./src/data/storage.js",
  "./src/screens/crops.js",
  "./src/screens/home.js",
  "./src/screens/movement-form.js",
  "./src/screens/report.js",
  "./src/screens/settings.js",
  "./src/utils/files.js",
  "./src/utils/format.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
