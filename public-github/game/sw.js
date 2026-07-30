const CACHE = "ousang-app-v8";
const CORE = [
  "./",
  "./index.html",
  "./game.css",
  "./game.js",
  "./manifest.webmanifest",
  "./app-icon.png",
  "./key-art.png",
  "./sprites-v3.png",
  "./enemy-animations-v3.png",
  "./backgrounds-v3.png",
  "./audio/music-meadow.wav",
  "./audio/music-chase.wav",
  "./audio/music-boss.wav",
  "./audio/jump.wav",
  "./audio/dash.wav",
  "./audio/hit-light.wav",
  "./audio/hit-heavy.wav",
  "./audio/perfect.wav",
  "./audio/alert.wav",
  "./audio/pickup.wav",
  "./audio/resonance.wav",
  "./audio/hurt.wav",
  "./audio/land.wav",
  "./audio/boss-slam.wav",
  "./audio/break.wav",
  "../audio/ousang-lively.mp3",
  "../audio/ousang-cute.mp3",
  "../audio/ousang-passion.mp3"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const refreshed = fetch(request).then(response => {
        if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
        return response;
      }).catch(() => cached);
      return cached || refreshed;
    })
  );
});
