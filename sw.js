/* Funzionamento offline: mostra sempre i dati più recenti disponibili, e l'ultima copia salvata quando manca la rete. */
const VERSIONE = "eco-v6";
const BASE = ["./", "./index.html", "./data.js", "./pillole.js", "./bitcoin.js", "./investire.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/favicon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSIONE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Rete prima, copia salvata se offline: per pagina, dati e contenuti, che possono cambiare a ogni edizione.
async function retePrima(req) {
  const cache = await caches.open(VERSIONE);
  try {
    const res = await fetch(req, { cache: "no-store" });
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const salvata = await cache.match(req, { ignoreSearch: true });
    if (salvata) return salvata;
    if (req.mode === "navigate") { const pag = await cache.match("./index.html"); if (pag) return pag; }
    throw err;
  }
}

// Copia salvata subito, aggiornata in background: per icone e caratteri.
async function cachePrima(req) {
  const cache = await caches.open(VERSIONE);
  const salvata = await cache.match(req);
  const rete = fetch(req).then((res) => { if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone()); return res; }).catch(() => salvata);
  return salvata || rete;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === "navigate" || /\/(index\.html)?$/.test(url.pathname) || url.pathname.endsWith(".js") || url.pathname.endsWith(".webmanifest")) {
      e.respondWith(retePrima(req));
    } else {
      e.respondWith(cachePrima(req));
    }
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(cachePrima(req));
  }
  // Tutti gli altri collegamenti esterni (fonti delle notizie) passano direttamente alla rete.
});
