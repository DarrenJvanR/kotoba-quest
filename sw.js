// Offline support: app files are fetched fresh when online and served from cache when not.
const CACHE = 'kotoba-quest-v15';
const SHELL = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'js/app.js', 'js/kana.js', 'js/vocab.js', 'js/phrases.js', 'js/kanji.js', 'js/stories.js', 'js/regions.js', 'js/fsrs.js', 'js/store.js',
  'js/session.js', 'js/speech.js', 'js/sfx.js', 'js/battle.js', 'js/ui.js',
  ...['home', 'study', 'library', 'settings', 'town', 'shop', 'travel', 'story', 'arcade', 'kanji', 'phrases', 'sentences', 'stats'].map((s) => `js/screens/${s}.js`),
  'icons/icon-192.png', 'icons/icon-512.png',
  ...['hero', 'tengu', 'witch', 'axolotl', 'dragonknight', 'lantern', 'battle-bg'].map((a) => `art/${a}.png`),
  ...['dojo', 'arcade', 'teahouse', 'garden', 'ramen', 'shrine', 'library', 'station', 'castle', 'lot'].map((b) => `art/town/${b}.png`),
  ...['kinkakuji', 'tearoom', 'kimono', 'bamboo', 'inari', 'ryokan', 'kappa', 'karakasa', 'oni', 'battle-bg'].map((a) => `art/kyoto/${a}.png`),
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((p) => new Request(p, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !isFont) return;

  // App files always ask the server whether they changed, so an update shows up on the next
  // load instead of hiding behind the browser's own cache.
  const fresh = url.origin === location.origin ? fetch(request, { cache: 'no-cache' }) : fetch(request);
  e.respondWith(
    fresh
      .then((res) => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request, { ignoreSearch: true })),
  );
});
