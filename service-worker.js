self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('ghostlink-cache').then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/script.js',
          '/manifest.json',
          '/icon_192x192.png',
          '/icon_512x512.png',
          '/Battery-level.mp3',
          '/favicon.ico',
          'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
          'https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css',
          'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });