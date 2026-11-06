// Service worker: membolehkan aplikasi dibuka dan dimainkan tanpa internet selepas lawatan pertama.
// Fail laman, fon dan video disimpan dalam peranti. Permintaan Firebase dan Cloudinary tidak disimpan.
const V = 'misi-angkasa-v2';
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
// Video memerlukan respons separa (206) untuk dimainkan dan di-seek, terutamanya pada Safari.
async function ranged(req, hit) {
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  const b = await hit.clone().blob(), n = b.size;
  let s = 0, e = n - 1;
  if (m && m[1] !== '') { s = +m[1]; if (m[2] !== '') e = +m[2]; }
  else if (m && m[2] !== '') { s = Math.max(0, n - (+m[2])); }
  if (e >= n) e = n - 1;
  if (s >= n || s > e) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + n } });
  return new Response(b.slice(s, e + 1), { status: 206, statusText: 'Partial Content', headers: {
    'Content-Type': hit.headers.get('Content-Type') || 'video/mp4',
    'Content-Range': 'bytes ' + s + '-' + e + '/' + n,
    'Content-Length': String(e - s + 1),
    'Accept-Ranges': 'bytes' } });
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
    if (r.headers.has('range')) {
      if (hit && hit.status === 200) return ranged(r, hit);
      return fetch(r);
    }
    const net = fetch(r).then(res => {
      if (res && (res.status === 200 || res.type === 'opaque')) c.put(r, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  })());
});
