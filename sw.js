/* Service Worker สำหรับ PWA "ตามงาน"
   - แคช app shell ให้เปิดได้เร็ว/ออฟไลน์บางส่วน
   - ไม่แคชการเรียก API (Apps Script / Google) เพื่อให้ข้อมูลสดเสมอ */
const CACHE = 'tamngan-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // ปล่อยผ่าน: ไม่ใช่ GET หรือเป็นการเรียก API ของ Google (Apps Script)
  if (e.request.method !== 'GET' || /google|gstatic/.test(url.hostname)) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      if (resp && resp.status === 200 && url.origin === location.origin) {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
