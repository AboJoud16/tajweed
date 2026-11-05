/* عامل الخدمة: يخزّن ملفات التطبيق للعمل دون اتصال. التلاوات تُحمَّل من الشبكة دائمًا. */
const CACHE = 'tajweed-v1';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/fonts.css', './css/app.css',
  './js/data/rules.js', './js/data/chapters.js', './js/data/quizzes.js', './js/data/glossary.js',
  './js/store.js', './js/ayah.js', './js/app.js', './icons/icon.svg',
  './fonts/amiri-quran-400-arabic.woff2', './fonts/amiri-400-arabic.woff2', './fonts/amiri-700-arabic.woff2',
  './fonts/noto-naskh-arabic-400-arabic.woff2', './fonts/noto-naskh-arabic-700-arabic.woff2',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // التلاوات والخطوط الخارجية من الشبكة
  e.respondWith(
    fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
