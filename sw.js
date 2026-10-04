/* Besoin d'Alchimie : service worker.
   Il permet d'installer l'application et de l'ouvrir sans connexion.
   - La page elle-même : réseau d'abord, pour recevoir chaque nouvelle version ;
     la copie en cache ne sert que hors connexion.
   - Styles, scripts, icônes, polices : cache d'abord, rafraîchi en arrière-plan.
   Changer VERSION à chaque mise en ligne qui touche ces fichiers. */

const VERSION = 'alchimie-v1';
const COQUILLE = [
  './',
  './index.html',
  './css/app.css?v=4',
  './js/data.js?v=4',
  './js/app.js?v=4',
  './manifest.webmanifest',
  './assets/favicon-braise.ico',
  './assets/icone-braise-180.png',
  './assets/icone-braise-192.png',
  './assets/icone-braise-512.png'
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(VERSION).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const memeSite = url.origin === self.location.origin;
  const polices = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!memeSite && !polices) return;

  // La page : réseau d'abord.
  if (req.mode === 'navigate') {
    ev.respondWith(
      fetch(req)
        .then((rep) => { const copie = rep.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copie)); return rep; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Le reste : cache d'abord, mis à jour en arrière-plan.
  ev.respondWith(
    caches.open(VERSION).then((c) =>
      c.match(req).then((enCache) => {
        const reseau = fetch(req)
          .then((rep) => { if (rep && (rep.ok || rep.type === 'opaque')) c.put(req, rep.clone()); return rep; })
          .catch(() => enCache);
        return enCache || reseau;
      })
    )
  );
});
