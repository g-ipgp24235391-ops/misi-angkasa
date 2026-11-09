// Service worker: aplikasi (termasuk semua video) disimpan dalam peranti selepas lawatan pertama,
// supaya boleh dibuka dan dimainkan tanpa internet. Permintaan Firebase dan Cloudinary tidak disimpan.
// Setiap kali anda mengemas kini laman, naikkan nombor versi V di bawah (contoh: v4).
const V = 'misi-angkasa-v3';
const CORE = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function allowed(u) {
  if (u.origin === location.origin) return true;
  if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return true;
  return u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/');
}
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (!allowed(u)) return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    let hit = await c.match(r.url);
    if (!hit && r.mode === 'navigate') hit = await c.match('index.html');
    if (hit) return hit;
    try {
      const res = await fetch(r);
      if (res && (res.status === 200 || res.type === 'opaque')) c.put(r, res.clone());
      return res;
    } catch (err) { return Response.error(); }
  })());
});
