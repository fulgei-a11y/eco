/* Funzionamento offline: mostra sempre i dati più recenti disponibili, e l'ultima copia salvata quando manca la rete. */
const VERSIONE = "eco-v11";
const BASE = ["./", "./index.html", "./data.js", "./pillole.js", "./bitcoin.js", "./investire.js", "./glossario.js", "./calcoli.js", "./bonus.js", "./manovra.js", "./archivio.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/favicon.png"];

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

// Avvisi ad app chiusa (Android, app installata): il telefono sveglia il service worker qualche volta al giorno.
self.addEventListener("periodicsync", (e) => {
  if (e.tag === "eco-segnali") e.waitUntil(controllaSegnali());
});

async function controllaSegnali() {
  const cfgCache = await caches.open("eco-config");
  const r = await cfgCache.match("./__segnali.json");
  if (!r) return;
  const cfg = await r.json();
  if (!cfg.attivi) return;
  const res = await fetch("./data.js", { cache: "no-store" });
  if (!res || !res.ok) return;
  (await caches.open(VERSIONE)).put("./data.js", res.clone());
  const w = {};
  new Function("window", await res.text())(w);
  const D = w.ECO;
  if (!D) return;
  const voce = (id) => { for (const g of D.mercati || []) for (const v of g.voci || []) if (v.id === id) return v; return null; };
  const nr = await cfgCache.match("./__notificati.json");
  const fatti = nr ? await nr.json() : {};
  const fmt = (n, d) => Number(n).toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d });
  for (const [id, voceId, op, nome, unita, dec, msg] of cfg.sig || []) {
    const st = (cfg.soglie || {})[id];
    if (!st || !st.on || st.soglia == null) { delete fatti[id]; continue; }
    const v = voce(voceId);
    if (!v) continue;
    const val = op === "calo" ? (typeof v.mese === "number" ? -v.mese : null) : (typeof v.valore === "number" ? v.valore : null);
    if (val == null) continue;
    const scatta = op === "<" ? val < st.soglia : val > st.soglia;
    if (scatta && !fatti[id]) {
      await self.registration.showNotification("Eco Bussola · " + nome + " " + fmt(st.soglia, dec) + " " + unita, {
        body: "Valore attuale: " + (op === "calo" ? "−" : "") + fmt(val, dec || 1) + " " + unita + ". " + msg + ".",
        icon: "icons/icon-192.png", badge: "icons/favicon.png", tag: "segnale-" + id, data: { url: "./#oggi" },
      });
      fatti[id] = true;
    } else if (!scatta) delete fatti[id];
  }
  await cfgCache.put("./__notificati.json", new Response(JSON.stringify(fatti), { headers: { "Content-Type": "application/json" } }));
}

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./#oggi";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    for (const c of cs) if ("focus" in c) { c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
