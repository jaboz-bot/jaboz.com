self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('voice-aid-cache-v1').then(cache => {
      // Đảm bảo tất cả các đường dẫn là TUYỆT ĐỐI (bắt đầu bằng '/') 
      // và bao gồm cả icons.
      return cache.addAll([
        '/',
        '/tools/may-ho-tro-giong-noi/may-voice.html', // File HTML
        '/tools/may-ho-tro-giong-noi/may-voice.json', // File Manifest
        '/tools/may-ho-tro-giong-noi/goi-y-tu.txt', // File dữ liệu
        
        // THÊM CÁC FILE ICONS TỪ MANIFEST VÀO
        '/images/may-ho-tro-giong-noi/icon-72x72.png',
        '/images/may-ho-tro-giong-noi/icon-192x192.png',
        '/images/may-ho-tro-giong-noi/icon-512x512.png'
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
