const CACHE = "flight-plan-demo-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./sw.js",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/qr_B0170.png",
  "./assets/qr_B0171.png",
  "./assets/qr_B0172.png"
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).catch(()=>caches.match("./index.html"))));
});