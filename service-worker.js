const cacheName = "control-agro-v19";
const assets = [
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./icon.svg",
  "./Iturriberoabereaklogo.svg",
  "./src/main.js",
  "./src/components/bottom-nav.js",
  "./src/components/header.js",
  "./src/components/icons.js",
  "./src/data/api.js",
  "./src/data/categories.js",
  "./src/data/storage.js",
  "./src/data/sync.js",
  "./src/screens/add.js",
  "./src/screens/crops.js",
  "./src/screens/home.js",
  "./src/screens/livestock.js",
  "./src/screens/movement-form.js",
  "./src/screens/report.js",
  "./src/screens/settings.js",
  "./src/utils/files.js",
  "./src/utils/format.js"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== cacheName)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(cacheName).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
