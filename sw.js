// Service worker: membolehkan aplikasi dibuka tanpa internet selepas lawatan pertama.
// Fail laman dan fon disimpan; permintaan Firebase dan Cloudinary tidak disimpan.
const V = 'misi-angkasa-v1';
const CORE = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
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
  e.respondWith(caches.open(V).then(async c => {
    let hit = await c.match(r);
    if (!hit && r.mode === 'navigate') hit = await c.match('index.html');
    const net = fetch(r).then(res => {
      if (res && (res.status === 200 || res.type === 'opaque')) c.put(r, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
