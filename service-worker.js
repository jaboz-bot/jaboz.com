
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('voice-aid-cache-v1').then(cache => {
      return cache.addAll([
        '/',
        '/tools/may-ho-tro-giong-noi/may-voice.html',
        '/tools/may-ho-tro-giong-noi/may-voice.json',
        '/tools/may-ho-tro-giong-noi/goi-y-tu.txt'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
