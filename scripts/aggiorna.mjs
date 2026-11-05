// Aggiorna data.js con dati da fonti pubbliche gratuite. Funziona senza alcuna intelligenza artificiale:
// numeri e testi sono calcolati dai dati. Se è presente GEMINI_API_KEY (o GROQ_API_KEY) l'IA può
// riscrivere solo i testi; se non risponde o sbaglia formato, restano i testi calcolati.
// Uso: node scripts/aggiorna.mjs   (Node 20+, nessuna dipendenza)

import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";
import { gunzipSync } from "node:zlib";

const FILE = new URL("../data.js", import.meta.url);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const log = (...a) => console.log("[aggiorna]", ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ================================================================ configurazione

// Riunioni di politica monetaria BCE (calendari ufficiali 2026 e 2027).
const BCE_RIUNIONI = [
  "2026-12-17",
  "2027-02-04", "2027-03-18", "2027-04-29", "2027-06-10",
  "2027-07-22", "2027-09-09", "2027-10-28", "2027-12-16",
];

// Scadenze fiscali ricorrenti: [mese, giorno, evento, perché]. Se cadono di sabato o domenica slittano al lunedì.
const SCADENZE_FISCALI = [
  [6, 16, "Acconto IMU", "Prima rata per seconde case e immobili non esenti"],
  [6, 30, "Saldo e primo acconto Irpef", "Per chi presenta il modello Redditi"],
  [9, 30, "Termine per il 730", "Ultimo giorno per la dichiarazione precompilata"],
  [11, 30, "Seconda rata dell'acconto Irpef", "Per chi ha un acconto dovuto"],
  [12, 16, "Saldo IMU", "Seconde case e immobili non esenti"],
];

// Quotazioni giornaliere: id, simbolo Yahoo, nome, unità, decimali, buono ("giu" = scendere è favorevole), [min, max] plausibili
const YAHOO = [
  ["ftsemib", "FTSEMIB.MI", "FTSE MIB", "pt", 0, null, [10000, 200000]],
  ["stoxx50", "^STOXX50E", "Euro Stoxx 50", "pt", 0, null, [1500, 20000]],
  ["dax", "^GDAXI", "DAX", "pt", 0, null, [5000, 100000]],
  ["mondo", "SWDA.MI", "Azionario mondiale", "€", 2, null, [20, 1000]],
  ["sp500", "^GSPC", "S&P 500", "pt", 2, null, [1000, 30000]],
  ["dow", "^DJI", "Dow Jones", "pt", 2, null, [10000, 200000]],
  ["nasdaq", "^IXIC", "Nasdaq", "pt", 2, null, [3000, 100000]],
  ["vix", "^VIX", "Indice della paura (VIX)", "pt", 2, "giu", [5, 150]],
  ["us10y", "^TNX", "Treasury USA 10 anni", "%", 2, "neutro", [0, 20]],
  ["eurusd_y", "EURUSD=X", "Euro / Dollaro (mercato)", "$", 4, "neutro", [0.5, 2]],
  ["oro", "GC=F", "Oro", "$/oz", 0, null, [500, 20000]],
  ["argento", "SI=F", "Argento", "$/oz", 2, null, [5, 500]],
  ["platino", "PL=F", "Platino", "$/oz", 0, null, [200, 10000]],
  ["rame", "HG=F", "Rame", "$/lb", 2, null, [1, 30]],
  ["emergenti", "EIMI.MI", "Mercati emergenti", "€", 2, null, [5, 500]],
  ["giappone", "^N225", "Giappone (Nikkei)", "pt", 0, null, [5000, 200000]],
  ["india", "^NSEI", "India (Nifty 50)", "pt", 0, null, [3000, 200000]],
  ["cina", "000001.SS", "Cina (Shanghai)", "pt", 0, null, [1000, 20000]],
  ["brasile", "^BVSP", "Brasile (Bovespa)", "pt", 0, null, [20000, 1000000]],
  ["brent", "BZ=F", "Petrolio Brent", "$/bbl", 2, "giu", [10, 400]],
  ["btc", "BTC-USD", "Bitcoin", "$", 0, null, [1000, 2000000]],
];

// Statistiche ufficiali BCE (le chiavi alternative coprono eventuali variazioni di codifica).
const BCE_SERIE = [
  // id, chiavi, nome, nota, buono, decimali, osservazioni, [min, max]
  ["euribor3m", ["FM.M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA"], "Euribor 3 mesi", "Parametro dei mutui variabili, media mensile", "neutro", 2, 13, [-2, 15]],
  ["mutuo_medio", ["MIR.M.IT.B.A2C.AM.R.A.2250.EUR.N", "MIR.M.IT.B.A2C.A.R.A.2250.EUR.N"], "Tasso medio mutui casa", "Nuovi mutui alle famiglie in Italia", "giu", 2, 13, [0, 20]],
  ["dep_vincolati", ["MIR.M.IT.B.L22.F.R.A.2250.EUR.N"], "Depositi vincolati", "Tasso lordo medio fino a 1 anno, nuovi depositi delle famiglie", null, 2, 13, [-1, 15]],
  ["dep_conto", ["MIR.M.IT.B.L21.A.R.A.2250.EUR.O", "MIR.M.IT.B.L21.A.R.A.2250.EUR.N"], "Conti correnti", "Tasso lordo medio pagato sui conti delle famiglie", null, 2, 13, [-1, 15]],
];

const RSS = [
  ["ANSA", "https://www.ansa.it/sito/notizie/economia/economia_rss.xml"],
  ["Il Sole 24 Ore", "https://www.ilsole24ore.com/rss/finanza.xml"],
  ["Il Sole 24 Ore", "https://www.ilsole24ore.com/rss/economia.xml"],
  ["Istat", "https://www.istat.it/feed/"],
  ["BCE", "https://www.ecb.europa.eu/rss/press.html"],
];

// Parole che rendono una notizia rilevante per chi risparmia (servono a ordinare, non a giudicare).
const PAROLE_CHIAVE = /borsa|piazza affari|ftse|spread|btp|bce|lagarde|fed|tass[oi]|mutu|inflazion|prezz|bollett|carburant|benzin|gas|petroli|energia|pil|istat|lavoro|occupa|disoccupa|pension|fisco|tasse|irpef|imu|manovra|bilancio|risparm|banc|conto|deposit|euribor|dollaro|oro|crypto|bitcoin|salari|stipend|consum/i;

// ================================================================ utilità

async function get(url, { json = false, timeout = 30000, tries = 3 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeout);
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: json ? "application/json" : "*/*" }, signal: ctl.signal, redirect: "follow" });
      if (r.status === 429 || r.status >= 500) throw Object.assign(new Error(`HTTP ${r.status}`), { retry: true });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return json ? await r.json() : await r.text();
    } catch (e) {
      last = e;
      if (!(e.retry || e.name === "AbortError" || /fetch failed|ECONNRESET|ETIMEDOUT/i.test(e.message))) break;
      if (e.cause && /CERT|SELF_SIGNED|UNABLE_TO/i.test(e.cause.code || "")) break; // errori di certificato: inutile riprovare
      await sleep(1500 * (i + 1));
    } finally { clearTimeout(t); }
  }
  throw last;
}
const motivo = (e) => [e.message, e.cause && (e.cause.code || e.cause.message)].filter(Boolean).join(" / ");
const safe = async (label, fn) => { try { return await fn(); } catch (e) { log("ATTENZIONE", label, "-", motivo(e)); return null; } };

const romeParts = (d) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZoneName: "longOffset" }).formatToParts(d).map((x) => [x.type, x.value]));
const isoRome = (d = new Date()) => {
  const p = romeParts(d);
  const off = (p.timeZoneName || "GMT").replace("GMT", "") || "+00:00";
  return `${p.year}-${p.month}-${p.day}T${p.hour === "24" ? "00" : p.hour}:${p.minute}:${p.second}${off}`;
};
const dayRome = (d = new Date()) => isoRome(d).slice(0, 10);
const hourRome = () => Number(isoRome().slice(11, 13));
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
const num = (x) => (typeof x === "number" && isFinite(x) ? x : null);
const it = (n, d = 2) => {
  if (num(n) == null) return "—";
  const s = Math.abs(n).toFixed(d).split(".");
  const neg = n < 0 && Number(s.join(".")) !== 0;
  return (neg ? "−" : "") + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (d ? "," + s[1] : "");
};
// "al 5,6%" ma "all'1,2%", "all'8%", "all'11%"; lo stesso per "del" e "dal"
const prep = (p, n, d = 2) => {
  const i = Math.floor(Math.abs(n));
  const voc = n >= 0 && (i === 1 || i === 11 || String(i).startsWith("8"));
  return voc ? `${p}ll'${it(n, d)}` : `${p}l ${it(n, d)}`;
};
const segno = (n, d = 2) => (n > 0 ? "+" : "") + it(n, d);
const dataIt = (iso) => { const [y, m, g] = iso.split("-"); return g ? `${+g}/${m}/${y}` : `${m}/${y}`; };
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const meseIt = (t) => { const [y, m] = t.split("-"); return `${MESI[+m - 1]} ${y}`; };

// CSV conforme RFC 4180: gestisce virgole e virgolette dentro i campi (i file BCE ne contengono).
function parseCsv(txt) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) {
      if (c === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && txt[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
    else f += c;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  const head = (rows.shift() || []).map((h) => h.trim());
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const inRange = (v, r) => num(v) != null && (!r || (v >= r[0] && v <= r[1]));

// ================================================================ fonti

// Statistiche di un anno di prezzi giornalieri: distanza da massimo e minimo, scarto dalla media di 200 sedute,
// volatilità annua (deviazione standard dei rendimenti giornalieri) e calo massimo nell'anno.
function statistiche(ts, c) {
  if (!ts || !c || c.length < 60 || c.length !== ts.length) return null;
  const last = c.at(-1), max = Math.max(...c), min = Math.min(...c);
  const m = c.slice(-200), ma = m.reduce((a, b) => a + b, 0) / m.length;
  const r = [];
  for (let i = 1; i < c.length; i++) if (c[i - 1] > 0 && c[i] > 0) r.push(Math.log(c[i] / c[i - 1]));
  if (r.length < 50) return null;
  const mu = r.reduce((a, b) => a + b, 0) / r.length;
  const sd = Math.sqrt(r.reduce((a, b) => a + (b - mu) ** 2, 0) / (r.length - 1));
  const anni = (ts.at(-1) - ts[0]) / (365.25 * 86400);
  const perAnno = anni > 0.3 ? r.length / anni : 252;
  let picco = c[0], calo = 0;
  for (const v of c) { if (v > picco) picco = v; calo = Math.min(calo, v / picco - 1); }
  const out = { dalMax: round((last / max - 1) * 100, 1), dalMin: round((last / min - 1) * 100, 1), ma200: round((last / ma - 1) * 100, 1), vol: round(sd * Math.sqrt(perAnno) * 100, 1), calo1a: round(calo * 100, 1) };
  return Object.values(out).every((v) => isFinite(v)) ? out : null;
}

// Storia lunga (dati mensili): quanto spesso e di quanto un mercato ha guadagnato o perso, a seconda di quanto a lungo lo si è tenuto.
const STORIA = [
  ["sp500", "^GSPC", "Borsa USA (S&P 500)", "Solo prezzo: i dividendi, circa 1-2% l'anno in più, non sono inclusi"],
  ["nasdaq", "^IXIC", "Tecnologici USA (Nasdaq)", "Solo prezzo, senza dividendi"],
  ["stoxx50", "^STOXX50E", "Europa (Euro Stoxx 50)", "Solo prezzo, senza dividendi"],
  ["dax", "^GDAXI", "Germania (DAX)", "Indice con dividendi reinvestiti"],
  ["ftsemib", "FTSEMIB.MI", "Italia (FTSE MIB)", "Solo prezzo, senza dividendi"],
  ["giappone", "^N225", "Giappone (Nikkei)", "Solo prezzo, senza dividendi"],
  ["oro", "GC=F", "Oro (in dollari)", "Prezzo del metallo, che non paga interessi né dividendi"],
];

async function storiaLunga(sym) {
  let j, lastErr;
  for (const host of ["query1", "query2"]) {
    try { j = await get(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=max&interval=1mo&includePrePost=false`, { json: true, timeout: 45000 }); break; }
    catch (e) { lastErr = e; }
  }
  if (!j) throw lastErr;
  const r = j?.chart?.result?.[0];
  if (!r) throw new Error(j?.chart?.error?.description || "risposta vuota");
  const ts = r.timestamp || [], cl = r.indicators?.quote?.[0]?.close || [];
  const perMese = new Map();
  ts.forEach((t, i) => { const v = num(cl[i]); if (v != null && v > 0) perMese.set(new Date((t + 43200) * 1000).toISOString().slice(0, 7), v); });
  const mesi = [...perMese.keys()].sort();
  const m = [], c = [];
  for (const k of mesi) {
    const v = perMese.get(k);
    if (c.length && (v / c.at(-1) > 1.6 || v / c.at(-1) < 0.45)) continue; // dato anomalo
    m.push(k); c.push(v);
  }
  if (c.length < 120) throw new Error(`storia troppo corta (${c.length} mesi)`);
  const n = c.length, anni = (n - 1) / 12;
  const cagr = (c.at(-1) / c[0]) ** (1 / anni) - 1;
  // calo massimo dal picco e mesi per tornare al picco
  let pi = 0, best = { calo: 0, p: 0, t: 0 };
  for (let i = 0; i < n; i++) { if (c[i] > c[pi]) pi = i; const d = c[i] / c[pi] - 1; if (d < best.calo) best = { calo: d, p: pi, t: i }; }
  let rec = null;
  for (let i = best.t; i < n; i++) if (c[i] >= c[best.p]) { rec = i; break; }
  const max = Math.max(...c);
  const finestre = [1, 3, 5, 10, 15, 20].map((H) => {
    const k = 12 * H;
    if (n - 1 < k + 24) return null;
    const v = [];
    for (let i = 0; i + k < n; i++) v.push((c[i + k] / c[i]) ** (1 / H) - 1);
    v.sort((a, b) => a - b);
    const pos = v.filter((x) => x > 0).length / v.length;
    return { anni: H, n: v.length, positivi: round(pos * 100, 0), peggiore: round(v[0] * 100, 1), mediana: round(v[Math.floor(v.length / 2)] * 100, 1), migliore: round(v.at(-1) * 100, 1) };
  }).filter(Boolean);
  // rendimenti per anno solare (anni completi)
  const fineAnno = new Map();
  m.forEach((k, i) => fineAnno.set(+k.slice(0, 4), c[i]));
  const anniSolari = [...fineAnno.keys()].sort((a, b) => a - b);
  const annoCorrente = +m.at(-1).slice(0, 4);
  const annuali = [];
  for (let i = 1; i < anniSolari.length; i++) {
    const y = anniSolari[i];
    if (y === annoCorrente && m.at(-1).slice(5) !== "12") continue;
    if (anniSolari[i - 1] !== y - 1) continue;
    annuali.push([y, round((fineAnno.get(y) / fineAnno.get(y - 1) - 1) * 100, 1)]);
  }
  return {
    inizio: m[0], fine: m.at(-1), anni: round(anni, 1), cagr: round(cagr * 100, 1),
    calo: { valore: round(best.calo * 100, 1), picco: m[best.p], minimo: m[best.t], ritorno: rec != null ? m[rec] : null, mesi: rec != null ? rec - best.p : null },
    dalMassimo: round((c.at(-1) / max - 1) * 100, 1),
    finestre, annuali: annuali.slice(-30),
  };
}

// Cambi ufficiali dal file giornaliero della BCE (server diverso dall'API statistica): usato se l'API non risponde.
let cambiXml;
async function cambiBceXml() {
  if (cambiXml !== undefined) return cambiXml;
  cambiXml = null;
  const xml = await get("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml", { timeout: 45000 });
  const out = {};
  for (const g of xml.matchAll(/<Cube time="(\d{4}-\d{2}-\d{2})">([\s\S]*?)<\/Cube>/g))
    for (const x of g[2].matchAll(/currency="([A-Z]{3})"\s+rate="([\d.]+)"/g)) (out[x[1]] ||= []).push({ t: g[1], v: Number(x[2]) });
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.t.localeCompare(b.t));
  cambiXml = out;
  return out;
}

async function yahoo(sym, range) {
  let j, lastErr;
  for (const host of ["query1", "query2"]) {
    try { j = await get(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1y&interval=1d&includePrePost=false`, { json: true }); break; }
    catch (e) { lastErr = e; }
  }
  if (!j) throw lastErr;
  const r = j?.chart?.result?.[0];
  if (!r) throw new Error(j?.chart?.error?.description || "risposta vuota");
  const ts = r.timestamp || [], cl = r.indicators?.quote?.[0]?.close || [];
  let pts = ts.map((t, i) => [t, cl[i]]).filter((p) => num(p[1]) != null);
  // ^TNX in alcune risposte è espresso in decimi di punto
  if (sym === "^TNX" && pts.length && pts.at(-1)[1] > 20) pts = pts.map(([t, v]) => [t, v / 10]);
  if (pts.length < 3) throw new Error("serie troppo corta");
  let live = num(r.meta?.regularMarketPrice);
  if (sym === "^TNX" && live > 20) live /= 10;
  const liveT = num(r.meta?.regularMarketTime) || pts.at(-1)[0];
  const day = (t) => dayRome(new Date(t * 1000));
  const closes = pts.map((p) => p[1]);
  let last = closes.at(-1), prev = closes.at(-2), lastDay = day(pts.at(-1)[0]);
  if (live != null) {
    if (day(liveT) === lastDay) last = live;                                  // seduta in corso o appena chiusa
    else if (liveT > pts.at(-1)[0]) { prev = closes.at(-1); last = live; lastDay = day(liveT); closes.push(live); }
  }
  closes[closes.length - 1] = last;
  const tsC = pts.map((p) => p[0]);
  if (tsC.length < closes.length) tsC.push(liveT);
  if (!inRange(last, range) || !inRange(prev, range)) throw new Error(`valore fuori scala (${last})`);
  const var1 = (last / prev - 1) * 100;
  if (Math.abs(var1) > 35) throw new Error(`variazione implausibile (${var1.toFixed(1)}%)`);
  // rendimento rispetto all'ultima chiusura disponibile a una certa data
  const tsAll = pts.map((p) => p[0]);
  const alla = (sec) => { let k = -1; for (let i = 0; i < tsAll.length; i++) if (tsAll[i] <= sec) k = i; return k >= 0 ? pts[k][1] : null; };
  const ora = num(liveT) || pts.at(-1)[0];
  const perf = (base) => (base && base > 0 ? round((last / base - 1) * 100, 2) : null);
  const primoAnno = Date.UTC(new Date(ora * 1000).getUTCFullYear(), 0, 1) / 1000;
  const copre = (sec) => tsAll[0] <= sec + 5 * 86400; // la serie arriva davvero a quella data
  const rend = {
    m1: copre(ora - 30 * 86400) ? perf(alla(ora - 30 * 86400)) : null,
    m3: copre(ora - 91 * 86400) ? perf(alla(ora - 91 * 86400)) : null,
    ytd: copre(primoAnno) ? perf(alla(primoAnno)) : null,
    y1: copre(ora - 360 * 86400) ? perf(pts[0][1]) : null,
  };
  return {
    valore: last, var: var1, data: lastDay, mese: rend.m1, rend,
    inizio: dayRome(new Date(pts[Math.max(0, pts.length - 130)][0] * 1000)),
    serie: closes.slice(-130).map((v) => round(v, 4)),
    stat: statistiche(tsC, closes),
    completo: { ts: tsC, c: closes },
  };
}

async function ecb(keys, n, range) {
  let lastErr;
  for (const key of keys) {
    try {
      const [flow, ...rest] = key.split(".");
      const txt = await get(`https://data-api.ecb.europa.eu/service/data/${flow}/${rest.join(".")}?lastNObservations=${n}&format=csvdata`);
      const rows = parseCsv(txt).map((r) => ({ t: r.TIME_PERIOD, v: Number(r.OBS_VALUE) })).filter((o) => o.t && r_ok(o.v, range));
      if (rows.length) return rows.sort((a, b) => a.t.localeCompare(b.t));
      lastErr = new Error("nessun dato valido per " + key);
    } catch (e) { lastErr = new Error(`${key}: ${e.message}`); }
  }
  throw lastErr;
}
const r_ok = (v, range) => isFinite(v) && (!range || (v >= range[0] && v <= range[1]));

async function eurostat(dataset, query) {
  const j = await get(`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${dataset}?format=JSON&lang=EN&${query}`, { json: true });
  const idx = j?.dimension?.time?.category?.index || {};
  const pts = Object.entries(idx).map(([t, i]) => ({ t, v: j.value?.[i] ?? j.value?.[String(i)] })).filter((o) => num(o.v) != null).sort((a, b) => a.t.localeCompare(b.t));
  if (!pts.length) throw new Error("nessun dato " + dataset);
  return pts.map((o) => ({ t: o.t.replace(/M(\d{2})$/, "-$1"), v: o.v }));
}

// Legge un dataset Eurostat scegliendo da solo le categorie giuste in ogni dimensione
// (la classificazione dei prezzi è cambiata nel 2026: i codici vengono riconosciuti per nome).
async function eurostatAuto(dataset, query, scelte) {
  const j = await get(`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${dataset}?format=JSON&lang=EN&${query}`, { json: true, timeout: 60000 });
  const ids = j.id || [], size = j.size || [];
  const pos = ids.map((dim) => {
    const cat = j.dimension[dim].category, codes = Object.keys(cat.index);
    if (dim === "time") return null;
    if (codes.length === 1) return cat.index[codes[0]];
    const regola = scelte[dim] || Object.entries(scelte).find(([k]) => dim.toLowerCase().startsWith(k))?.[1];
    if (!regola) throw new Error(`dimensione ${dim} non prevista: ${codes.slice(0, 8).join(",")}`);
    const trovato = codes.find((c) => regola.codici?.includes(c)) || codes.find((c) => regola.etichetta?.test(cat.label?.[c] || ""));
    if (!trovato) throw new Error(`${dim}: nessuna categoria valida tra ${codes.slice(0, 12).join(",")}`);
    return cat.index[trovato];
  });
  const tIdx = ids.indexOf("time"), tCat = j.dimension.time.category.index;
  const stride = size.map((_, i) => size.slice(i + 1).reduce((a, b) => a * b, 1));
  const pts = Object.entries(tCat).map(([t, ti]) => {
    const flat = pos.reduce((acc, p, i) => acc + (i === tIdx ? ti : p) * stride[i], 0);
    const v = j.value?.[flat] ?? j.value?.[String(flat)];
    return { t: t.replace(/M(\d{2})$/, "-$1"), v };
  }).filter((o) => num(o.v) != null).sort((a, b) => a.t.localeCompare(b.t));
  if (!pts.length) throw new Error("nessun dato " + dataset);
  return pts;
}

async function inflazione(geos) {
  const scelte = {
    unit: { codici: ["RCH_A"], etichetta: /annual rate of change/i },
    coicop: { codici: ["TOTAL", "CP00", "CP00_2"], etichetta: /^all[- ]items|overall index|^total$/i },
  };
  let ultimoErrore;
  for (const ds of ["prc_hicp_minr", "prc_hicp_manr"]) {
    for (const geo of geos) {
      try {
        const s = await eurostatAuto(ds, `geo=${geo}&lastTimePeriod=13`, scelte);
        if (fresco(s.at(-1).t, 4)) return { s, fonte: `Eurostat ${ds}` };
        ultimoErrore = new Error(`${ds} ${geo} fermo a ${s.at(-1).t}`);
      } catch (e) { ultimoErrore = new Error(`${ds} ${geo}: ${motivo(e)}`); }
    }
  }
  throw ultimoErrore;
}

// Inflazione italiana per categoria di spesa (ultimo mese disponibile), riconoscendo le voci dal nome.
const CATEGORIE = [
  ["alimentari", ["CP01"], /^food and non-alcoholic/i, "Alimentari e bevande"],
  ["abbigliamento", ["CP03"], /^clothing and footwear/i, "Abbigliamento e calzature"],
  ["casa", ["CP04"], /^housing, water, electricity/i, "Casa, acqua ed energia"],
  ["energia", ["CP045"], /^electricity, gas and other fuels/i, "Luce, gas e combustibili"],
  ["salute", ["CP06"], /^health/i, "Salute"],
  ["trasporti", ["CP07"], /^transport$/i, "Trasporti"],
  ["comunicazioni", ["CP08"], /^(information and )?communication/i, "Telefono e internet"],
  ["svago", ["CP09"], /^recreation/i, "Svago e cultura"],
  ["ristoranti", ["CP11"], /^restaurants/i, "Ristoranti e vacanze"],
];
async function inflazioneCategorie() {
  for (const ds of ["prc_hicp_minr", "prc_hicp_manr"]) {
    try {
      const j = await get(`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${ds}?format=JSON&lang=EN&geo=IT&lastTimePeriod=3`, { json: true, timeout: 120000 });
      const ids = j.id, size = j.size, dims = j.dimension;
      const stride = size.map((_, i) => size.slice(i + 1).reduce((a, b) => a * b, 1));
      const dCoicop = ids.find((d) => /^coicop/i.test(d)), dUnit = ids.find((d) => d === "unit");
      if (!dCoicop) throw new Error("dimensione coicop assente");
      const uCat = dims[dUnit].category, uCodes = Object.keys(uCat.index);
      const uCode = uCodes.find((c) => c === "RCH_A") || uCodes.find((c) => /annual rate of change/i.test(uCat.label?.[c] || ""));
      if (!uCode) throw new Error("unità RCH_A assente: " + uCodes.join(","));
      const cCat = dims[dCoicop].category, cCodes = Object.keys(cCat.index);
      const tempi = Object.entries(dims.time.category.index).sort((a, b) => b[0].localeCompare(a[0])); // dal più recente
      const valore = (code, ti) => {
        const flat = ids.reduce((acc, d, i) => {
          const idx = d === dCoicop ? cCat.index[code] : d === dUnit ? uCat.index[uCode] : d === "time" ? ti : 0;
          return acc + idx * stride[i];
        }, 0);
        return j.value?.[flat] ?? j.value?.[String(flat)];
      };
      // l'ultimo mese in cui la maggior parte delle categorie ha un valore
      let scelto = null;
      for (const [t, ti] of tempi) {
        const n = CATEGORIE.filter(([, codici]) => cCodes.includes(codici[0]) && num(valore(codici[0], ti)) != null).length;
        if (n >= 5) { scelto = [t, ti]; break; }
      }
      if (!scelto) throw new Error(`nessun mese completo tra ${tempi.map((x) => x[0]).join(",")}`);
      const periodo = scelto[0].replace(/M(\d{2})$/, "-$1");
      if (!fresco(periodo, 4)) throw new Error(`${ds} fermo a ${periodo}`);
      const out = {};
      for (const [id, codici, etichetta, nome] of CATEGORIE) {
        const code = cCodes.find((c) => codici.includes(c)) || cCodes.find((c) => etichetta.test(cCat.label?.[c] || ""));
        if (!code) continue;
        const v = valore(code, scelto[1]);
        if (num(v) != null && v > -30 && v < 80) out[id] = { nome, valore: v };
      }
      if (Object.keys(out).length < 5) throw new Error(`categorie con valore: ${Object.keys(out).length}`);
      return { periodo, categorie: out };
    } catch (e) { log("ATTENZIONE inflazione per categoria", ds, "-", motivo(e)); }
  }
  return null;
}

// Un dato mensile è "fresco" se non è più vecchio di N mesi rispetto a oggi.
function fresco(periodo, mesi) {
  const [y, m] = periodo.split("-").map(Number);
  const oggi = new Date();
  return (oggi.getUTCFullYear() - y) * 12 + (oggi.getUTCMonth() + 1 - m) <= mesi;
}

async function fedNY() {
  const j = await get("https://markets.newyorkfed.org/api/rates/unsecured/effr/last/1.json", { json: true, timeout: 30000 });
  const r = j?.refRates?.[0];
  if (!r || num(r.targetRateFrom) == null || num(r.targetRateTo) == null) throw new Error("risposta inattesa");
  return { min: r.targetRateFrom, max: r.targetRateTo, t: r.effectiveDate };
}

async function fred(id) {
  const txt = await get(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`);
  const rows = parseCsv(txt).map((r) => Object.values(r)).filter((c) => c[1] !== "" && isFinite(Number(c[1])));
  if (!rows.length) throw new Error("nessun dato " + id);
  const last = rows.at(-1);
  return { t: last[0], v: Number(last[1]) };
}

async function carburanti() {
  let txt, err;
  for (const u of ["https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv", "https://www.mise.gov.it/images/exportCSV/prezzo_alle_8.csv"]) {
    try { txt = await get(u, { timeout: 180000, tries: 2 }); break; } catch (e) { err = new Error(`${u}: ${motivo(e)}`); }
  }
  if (!txt) throw err;
  const lines = txt.split(/\r?\n/).filter(Boolean);
  const hIdx = lines.findIndex((l) => /descCarburante/i.test(l));
  if (hIdx < 0) throw new Error("formato CSV inatteso");
  const sep = lines[hIdx].includes("|") ? "|" : ";";
  const head = lines[hIdx].split(sep).map((h) => h.trim());
  const iI = head.indexOf("idImpianto"), iC = head.indexOf("descCarburante"), iP = head.indexOf("prezzo"), iS = head.indexOf("isSelf"), iD = head.indexOf("dtComu");
  if (iC < 0 || iP < 0 || iS < 0) throw new Error("colonne mancanti");
  const m = lines[0].match(/(\d{4}-\d{2}-\d{2})/) || lines[0].match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const estr = !m ? dayRome() : m[0].includes("-") ? m[1] : `${m[3]}-${m[2]}-${m[1]}`;
  const limite = Date.parse(estr) - 8 * 864e5;
  const media = (name) => {
    const perImpianto = new Map();
    for (const l of lines.slice(hIdx + 1)) {
      const c = l.split(sep);
      if (c[iC]?.trim() !== name || c[iS]?.trim() !== "1") continue;
      const p = parseFloat(String(c[iP]).replace(",", "."));
      if (!(p > 0.8 && p < 4)) continue;
      let t = 0;
      if (iD >= 0) { const d = String(c[iD]).match(/(\d{2})\/(\d{2})\/(\d{4})/); if (d) t = Date.parse(`${d[3]}-${d[2]}-${d[1]}`); if (t && t < limite) continue; }
      const id = iI >= 0 ? c[iI] : perImpianto.size;
      const old = perImpianto.get(id);
      if (!old || t >= old.t) perImpianto.set(id, { p, t });
    }
    const v = [...perImpianto.values()].map((o) => o.p).sort((a, b) => a - b);
    if (v.length < 3000) throw new Error(`file incompleto: solo ${v.length} prezzi per ${name}`);
    const cut = Math.floor(v.length * 0.02), t = v.slice(cut, v.length - cut);
    return { media: t.reduce((a, b) => a + b, 0) / t.length, n: v.length };
  };
  return { benzina: media("Benzina"), gasolio: media("Gasolio"), data: estr };
}

// Bollettino petrolifero settimanale della Commissione europea (dati CC BY 4.0, compilati da fuel-prices.eu).
// Usato quando il Mimit non è raggiungibile. Riconosce da solo colonne e unità.
async function carburantiUE() {
  const r = await fetch("https://www.fuel-prices.eu/research/data/d1-eu-weekly-bulletin/fp-d1-eu-weekly-panel.csv.gz", { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  let buf = Buffer.from(await r.arrayBuffer());
  try { buf = gunzipSync(buf); } catch { /* già decompresso */ }
  const testo = buf.toString("utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#")).join("\n");
  const righe = parseCsv(testo);
  if (!righe.length) throw new Error("file vuoto");
  const cols = Object.keys(righe[0]);
  log("bollettino UE, colonne:", cols.join(", "));
  const trova = (re) => cols.find((c) => re.test(c));
  const cData = trova(/date|week|period/i), cPaese = trova(/country|iso|geo|nation/i);
  const cBenz = trova(/euro.?super|petrol|gasoline|unleaded|95/i), cDies = trova(/diesel|gasoil|gas.?oil/i);
  const cProd = trova(/fuel|product/i), cPrezzo = trova(/price|value|eur/i);
  if (!cData || !cPaese) throw new Error("colonne data/paese non trovate");
  const italia = righe.filter((x) => /^(IT|ITA|Italy|Italia)$/i.test(String(x[cPaese]).trim()));
  if (!italia.length) throw new Error("nessuna riga per l'Italia");
  const norm = (v) => { let n = Number(String(v).replace(",", ".")); if (!isFinite(n) || n <= 0) return null; if (n > 100) n /= 1000; return n > 0.8 && n < 4 ? n : null; };
  const serieDi = (filtroProd, colWide) => {
    const pts = italia.map((x) => ({ t: String(x[cData]).slice(0, 10), v: norm(colWide ? x[colWide] : (filtroProd.test(String(x[cProd])) ? x[cPrezzo] : NaN)) }))
      .filter((o) => o.v != null && /^\d{4}-\d{2}-\d{2}$/.test(o.t)).sort((a, b) => a.t.localeCompare(b.t));
    return pts;
  };
  const benz = cBenz && !cProd ? serieDi(null, cBenz) : serieDi(/super|petrol|gasoline|unleaded|95/i);
  const dies = cDies && !cProd ? serieDi(null, cDies) : serieDi(/diesel|gasoil/i);
  if (!benz.length || !dies.length) throw new Error("prezzi non riconosciuti");
  const ultima = benz.at(-1).t;
  if (daysBetween(ultima, dayRome()) > 16) throw new Error("bollettino fermo al " + ultima);
  return { benzina: benz, gasolio: dies };
}

function decode(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"').replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}
const breve = (s, max) => { if (s.length <= max) return s; const c = s.slice(0, max); return c.slice(0, c.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "") + "…"; };

async function notizieRss(giorno) {
  const out = [];
  for (const [fonte, url] of RSS) {
    const xml = await safe("RSS " + url, () => get(url, { tries: 2 }));
    if (!xml) continue;
    const atom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
    const items = xml.split(atom ? /<entry[\s>]/i : /<item[\s>]/i).slice(1, 20);
    for (const raw of items) {
      const tag = (n) => { const m = raw.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, "i")); return m ? decode(m[1]) : ""; };
      const titolo = tag("title");
      let link = tag("link");
      if (!/^https?:\/\//.test(link)) { const m = raw.match(/<link[^>]*href="([^"]+)"/i); link = m ? m[1] : ""; }
      const dRaw = tag("pubDate") || tag("published") || tag("updated") || tag("dc:date");
      const d = dRaw ? new Date(dRaw) : null;
      const data = d && !isNaN(d) ? d.toISOString() : null;
      let descr = breve(tag("description") || tag("summary"), 220);
      if (descr.length < 25) descr = "";
      if (titolo && /^https?:\/\//.test(link)) out.push({ titolo: breve(titolo, 140), url: link, fonte, data, descr: descr && descr !== titolo ? descr : "" });
    }
  }
  const limite = Date.parse(giorno) - 2 * 864e5;
  const seen = new Set(), perFonte = {};
  const pertinenti = out.filter((n) => PAROLE_CHIAVE.test(n.titolo + " " + n.descr)).length;
  return out
    .filter((n) => !n.data || Date.parse(n.data) >= limite)
    .filter((n) => pertinenti === 0 || PAROLE_CHIAVE.test(n.titolo + " " + n.descr)) // solo notizie su economia e risparmio
    .filter((n) => { const k = n.titolo.toLowerCase().replace(/[^a-zà-ù0-9 ]/g, "").slice(0, 50); if (seen.has(k)) return false; seen.add(k); return true; })
    .map((n) => ({ ...n, peso: (PAROLE_CHIAVE.test(n.titolo + " " + n.descr) ? 1 : 0) }))
    .sort((a, b) => b.peso - a.peso || (b.data ? 1 : 0) - (a.data ? 1 : 0) || (b.data || "").localeCompare(a.data || ""))
    .filter((n) => { perFonte[n.fonte] = (perFonte[n.fonte] || 0) + 1; return perFonte[n.fonte] <= 3; })
    .slice(0, 12);
}

// ================================================================ Bitcoin

// Bitcoin estratti fino a un certo blocco: 50 BTC per blocco, dimezzati ogni 210.000 blocchi.
function offertaBitcoin(altezza) {
  let tot = 0, premio = 50 * 1e8, h = altezza + 1;
  for (let era = 0; h > 0 && premio >= 1; era++) { const n = Math.min(h, 210000); tot += n * premio; h -= n; premio = Math.floor(premio / 2); }
  return tot / 1e8;
}

async function bitcoin() {
  const B = {};
  // Prezzo, massimo storico e capitalizzazione (CoinGecko, piano pubblico senza chiave)
  const cg = await safe("Bitcoin CoinGecko", () => get("https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false", { json: true, timeout: 40000 }));
  const md = cg?.market_data;
  if (md && num(md.current_price?.eur) > 100) {
    B.prezzoEur = md.current_price.eur; B.prezzoUsd = md.current_price.usd;
    B.var24h = num(md.price_change_percentage_24h);
    B.var7g = num(md.price_change_percentage_7d); B.var30g = num(md.price_change_percentage_30d); B.var1a = num(md.price_change_percentage_1y);
    B.athEur = num(md.ath?.eur); B.athData = md.ath_date?.eur ? String(md.ath_date.eur).slice(0, 10) : null;
    B.daAth = num(md.ath_change_percentage?.eur);
    B.capEur = num(md.market_cap?.eur);
    B.aggiornatoPrezzo = md.last_updated || null;
  }
  const gl = await safe("Dominanza CoinGecko", () => get("https://api.coingecko.com/api/v3/global", { json: true, timeout: 40000 }));
  if (num(gl?.data?.market_cap_percentage?.btc) != null) B.dominanza = round(gl.data.market_cap_percentage.btc, 1);
  // Indice di paura e avidità del mercato cripto
  const fg = await safe("Fear & Greed", () => get("https://api.alternative.me/fng/?limit=31", { json: true }));
  if (Array.isArray(fg?.data) && fg.data.length) {
    B.paura = { valore: +fg.data[0].value, etichetta: fg.data[0].value_classification, serie: fg.data.map((d) => +d.value).reverse(), settimana: fg.data[7] ? +fg.data[7].value : null, mese: fg.data[30] ? +fg.data[30].value : null };
  }
  // Rete: altezza, commissioni, potenza di calcolo, aggiustamento di difficoltà (mempool.space)
  const alt = await safe("Altezza blocco", () => get("https://mempool.space/api/blocks/tip/height", { timeout: 30000 }));
  if (alt && /^\d+$/.test(alt.trim())) {
    const hgt = +alt.trim();
    B.altezza = hgt;
    B.offerta = round(offertaBitcoin(hgt), 0);
    const prossimo = Math.ceil((hgt + 1) / 210000) * 210000;
    B.halving = { blocco: prossimo, mancano: prossimo - hgt, premioOra: 50 / 2 ** Math.floor(hgt / 210000), premioDopo: 50 / 2 ** Math.floor(prossimo / 210000) };
  }
  const fees = await safe("Commissioni rete", () => get("https://mempool.space/api/v1/fees/recommended", { json: true, timeout: 30000 }));
  if (fees && num(fees.halfHourFee) != null) B.commissioni = { veloce: fees.fastestFee, mezzora: fees.halfHourFee, ora: fees.hourFee, minima: fees.minimumFee };
  const hr = await safe("Hashrate", () => get("https://mempool.space/api/v1/mining/hashrate/1m", { json: true, timeout: 30000 }));
  if (hr && num(hr.currentHashrate) != null) {
    B.hashrate = round(hr.currentHashrate / 1e18, 0); // EH/s
    if (Array.isArray(hr.hashrates) && hr.hashrates.length > 5) B.hashrateSerie = hr.hashrates.map((x) => round(x.avgHashrate / 1e18, 0)).slice(-30);
  }
  const da = await safe("Aggiustamento difficoltà", () => get("https://mempool.space/api/v1/difficulty-adjustment", { json: true, timeout: 30000 }));
  if (da && num(da.progressPercent) != null) {
    B.difficolta = { avanzamento: round(da.progressPercent, 1), variazione: round(da.difficultyChange, 2), data: da.estimatedRetargetDate ? new Date(da.estimatedRetargetDate).toISOString().slice(0, 10) : null, tempoMedio: num(da.timeAvg) ? round(da.timeAvg / 60000, 2) : null };
    if (B.halving && B.difficolta.tempoMedio) B.halving.data = new Date(Date.now() + B.halving.mancano * B.difficolta.tempoMedio * 60000).toISOString().slice(0, 10);
  }
  // Storico mensile in euro dal 2014 (per il simulatore) e giornaliero di un anno (per il grafico)
  const mens = await safe("Storico mensile BTC-EUR", async () => {
    const j = await get("https://query1.finance.yahoo.com/v8/finance/chart/BTC-EUR?range=max&interval=1mo", { json: true });
    const r = j?.chart?.result?.[0], ts = r?.timestamp || [], cl = r?.indicators?.quote?.[0]?.close || [];
    const out = ts.map((t, i) => [new Date(t * 1000).toISOString().slice(0, 7), cl[i]]).filter((p) => num(p[1]) != null && p[1] > 1);
    if (out.length < 24) throw new Error("serie troppo corta");
    const vista = new Map(out.map((p) => [p[0], round(p[1], 2)])); // un valore per mese
    return [...vista.entries()];
  });
  if (mens) B.mensile = mens;
  const gior = await safe("Storico giornaliero BTC-EUR", () => yahoo("BTC-EUR", [100, 10000000]));
  if (gior) { B.giornaliero = gior.serie; B.giornalieroInizio = gior.inizio; B.rend = gior.rend; if (!B.prezzoEur) { B.prezzoEur = gior.valore; B.var24h = gior.var; } }
  if (!B.prezzoEur) throw new Error("prezzo non disponibile da nessuna fonte");
  if (B.mensile && B.mensile.length) {
    // calo massimo dal picco nei dati mensili
    let picco = 0, peggio = 0, piccoT = null, fondoT = null, tmpT = null;
    for (const [t, v] of B.mensile) { if (v > picco) { picco = v; tmpT = t; } const dd = (v / picco - 1) * 100; if (dd < peggio) { peggio = dd; piccoT = tmpT; fondoT = t; } }
    B.caloMassimo = { valore: round(peggio, 1), da: piccoT, a: fondoT };
  }
  B.data = isoRome();
  return B;
}

// ================================================================ testi calcolati dai dati (nessuna IA)

function testiCalcolati(ctx, V) {
  const f = V.ftsemib, sp = V.sp500, inf = V.infl_it, bce = V.bce, vix = num(V.vix?.valore);
  const infl = num(inf?.valore) ?? 2;
  const dep = num(V.dep_vincolati?.valore), depNet = dep != null ? dep * 0.74 - 0.2 : null;
  const tassoMutuo = num(V.mutuo_medio?.valore) ?? 3.2;
  const prossima = BCE_RIUNIONI.find((d) => d >= ctx.giorno);
  const gg = prossima ? daysBetween(ctx.giorno, prossima) : null;
  const rata = (P, r, y) => { const i = r / 1200, n = y * 12; return i === 0 ? P / n : P * i / (1 - (1 + i) ** -n); };
  const dRata = rata(120000, tassoMutuo + 0.25, 20) - rata(120000, tassoMutuo, 20);
  const fv = num(f?.var), spv = num(sp?.var);
  const ultima = f && f.data === ctx.giorno ? "nella seduta di oggi" : "nell'ultima seduta";

  // Clima dei mercati: media delle due borse, corretta dal VIX
  const media = [fv, spv].filter((x) => x != null);
  const mov = media.length ? media.reduce((a, b) => a + b, 0) / media.length : 0;
  const scoreM = Math.max(5, Math.min(95, Math.round(50 + 12 * mov - (vix > 30 ? 18 : vix > 25 ? 12 : vix > 20 ? 5 : vix != null && vix < 15 ? -5 : 0))));
  const labM = scoreM >= 62 ? "Positivo" : scoreM >= 45 ? "Variabile" : scoreM >= 30 ? "Negativo" : "Tempesta";
  // Pressione sulle famiglie: inflazione, carburanti, disoccupazione
  const benz = num(V.benzina?.valore), dis = num(V.disoccupazione?.valore);
  const scoreF = Math.max(5, Math.min(95, Math.round(20 + 11 * infl + (benz > 1.9 ? 8 : benz > 1.75 ? 3 : 0) + (dis > 9 ? 6 : dis > 7.5 ? 3 : 0))));
  const labF = scoreF >= 66 ? "Pressione alta" : scoreF >= 45 ? "Moderata" : "Bassa";

  // Titolo
  const mercFrase = fv == null ? "Mercati in attesa"
    : fv >= 1.5 ? `Piazza Affari corre (${segno(fv)}%)`
    : fv >= 0.3 ? `Piazza Affari in rialzo (${segno(fv)}%)`
    : fv > -0.3 ? "Piazza Affari stabile"
    : fv > -1.5 ? `Piazza Affari in calo (${segno(fv)}%)`
    : `Piazza Affari in forte calo (${segno(fv)}%)`;
  const famFrase = infl >= 4 ? `inflazione alta ${prep("a", infl, 1)}%`
    : infl >= 2.5 ? `inflazione ${prep("a", infl, 1)}%`
    : infl >= 1 ? `inflazione sotto controllo (${it(infl, 1)}%)`
    : `prezzi quasi fermi (${it(infl, 1)}%)`;

  // Sintesi
  const sint = [];
  if (f && fv != null) sint.push(`${f.data === ctx.giorno ? "Oggi il FTSE MIB" : "Nell'ultima seduta il FTSE MIB"} ${f.data === ctx.giorno && ctx.edizione === "sera" ? "chiude" : "ha chiuso"} a ${it(f.valore, 0)} punti (${segno(fv)}%)${sp && spv != null ? `, mentre l'S&P 500 di Wall Street segna ${segno(spv)}%` : ""}.`);
  if (vix != null) sint.push(vix > 25 ? `Il VIX a ${it(vix, 1)} segnala mercati nervosi: oscillazioni ampie sono normali in queste fasi.` : vix < 15 ? `Il VIX a ${it(vix, 1)} indica mercati tranquilli.` : "");
  if (inf) sint.push(`L'inflazione italiana è ${prep("a", infl, 1)}% (${meseIt(inf.data)})${infl > 3 ? ": è il fattore che pesa di più sul potere d'acquisto delle famiglie" : ""}.`);
  if (V.spread && num(V.spread.valore) != null) sint.push(`Lo spread BTP-Bund è a ${it(V.spread.valore, 0)} punti base (media di ${meseIt(V.spread.data)}).`);

  // Scheda Liquidità
  const reale = depNet != null ? depNet - infl : null;
  const perdita = 10000 * (1 - 1 / (1 + infl / 100));
  const liq = {
    tema: "Liquidità",
    titolo: reale == null ? "Quanto rende davvero il conto" : reale < 0 ? "Il conto fermo perde valore" : "I depositi battono l'inflazione",
    testo: `Con l'inflazione ${prep("a", infl, 1)}%, 10.000 € fermi a tasso zero perdono circa ${it(perdita, 0)} € di potere d'acquisto in un anno.` +
      (dep != null ? ` In media le banche italiane pagano il ${it(dep)}% lordo sui depositi vincolati fino a un anno, circa ${it(depNet)}% netto: ${reale < 0 ? "proteggono solo in parte, e le offerte migliori vanno cercate e confrontate." : "oggi superano l'inflazione, ma conviene confrontare le offerte."}` : ""),
    azione: "Calcola il rendimento netto", link: "#strumenti",
  };

  // Scheda Tassi e mutuo
  const e3 = V.euribor3m, e3prev = e3 && /da ([\d,]+)/.exec(e3.delta || "");
  const e3dir = e3 && e3prev ? Math.sign(e3.valore - Number(e3prev[1].replace(",", "."))) : 0;
  const tassi = {
    tema: "Tassi e mutuo",
    titolo: gg != null && gg <= 14 ? `BCE tra ${gg === 0 ? "poche ore" : gg === 1 ? "un giorno" : gg + " giorni"}` : e3dir > 0 ? "Euribor in salita" : e3dir < 0 ? "Euribor in discesa" : bce ? `Tasso BCE ${prep("a", bce.valore)}%` : "Tassi e mutuo",
    testo: [
      bce ? `Il tasso BCE sui depositi è ${prep("a", bce.valore)}%${prossima ? ` e la prossima decisione è il ${dataIt(prossima)}` : ""}.` : "",
      e3 ? `L'Euribor a 3 mesi, base dei mutui variabili, è ${prep("a", e3.valore)}% (${meseIt(e3.data)}).` : "",
      `Su un mutuo da 120.000 € a 20 anni al tasso medio attuale ${prep("de", tassoMutuo)}%, ogni 0,25 punti in più valgono circa ${it(dRata)} € al mese.`,
    ].filter(Boolean).join(" "),
    azione: "Simula la tua rata", link: "#strumenti",
  };

  // Scheda Investimenti
  const mo = V.mondo, mm = num(mo?.mese);
  const invTitolo = fv == null ? "Il piano conta più della seduta"
    : fv <= -2 || vix > 28 ? "Giornata pesante: niente scelte di panico"
    : fv >= 2 ? "Giornata forte, piano invariato"
    : "Il piano conta più della seduta";
  const inv = {
    tema: "Investimenti",
    titolo: invTitolo,
    testo: [
      fv != null ? `Piazza Affari segna ${segno(fv)}% ${ultima}${num(f.mese) != null ? ` e ${segno(f.mese, 1)}% nell'ultimo mese` : ""}.` : "",
      mm != null ? `L'azionario mondiale, riferimento di molti piani di accumulo, è a ${segno(mm, 1)}% in un mese.` : "",
      fv != null && fv <= -2 ? "Vendere dopo un calo trasforma una perdita temporanea in definitiva: chi investe a lungo termine segue il piano." : "Per chi investe a lungo termine contano costi bassi, diversificazione e versamenti regolari.",
    ].filter(Boolean).join(" "),
    azione: "Simula un piano di accumulo", link: "#strumenti",
  };

  // Scheda Spese
  const sb = (ctx.serie.benzina || []).filter((x) => num(x) != null);
  const settimanale = /settimanale/i.test(V.benzina?.nota || "");
  const passi = settimanale ? 4 : 10; // circa un mese: 4 bollettini settimanali o 10 aggiornamenti giornalieri
  const sett = sb.length > passi ? benz - sb.at(-1 - passi) : null;
  const rispetto = settimanale ? "rispetto a un mese fa" : "rispetto a circa una settimana fa";
  const pieno = benz != null ? benz * 50 : null;
  const brm = num(V.brent?.mese);
  const spe = {
    tema: "Spese",
    titolo: benz == null ? "Energia e carburanti" : sett != null && sett > 0.015 ? "Carburanti in aumento" : sett != null && sett < -0.015 ? "Carburanti in calo" : `Benzina a ${it(benz, 3)} €/l`,
    testo: [
      benz != null ? `La benzina self costa in media ${it(benz, 3)} €/l${sett != null ? ` (${segno(sett * 100, 1)} centesimi ${rispetto})` : ""}: un pieno da 50 litri vale circa ${it(pieno, 0)} €.` : "",
      brm != null && Math.abs(brm) >= 3 ? `Il petrolio è ${brm >= 0 ? "salito" : "sceso"} ${prep("de", Math.abs(brm), 0)}% in un mese: i prezzi alla pompa di solito lo seguono con qualche settimana di ritardo.` : "",
      "Il Portale Offerte ARERA e l'Osservaprezzi del Mimit sono gratuiti e neutrali.",
    ].filter(Boolean).join(" "),
    azione: "Apri le fonti utili", link: "#fonti",
  };

  return {
    titolo: `${mercFrase}, ${famFrase}`,
    sintesi: sint.filter(Boolean).join(" "),
    mercati: { valore: scoreM, etichetta: labM, nota: `Da Piazza Affari e Wall Street ${ultima}${vix != null ? `; VIX a ${it(vix, 1)}` : ""}.` },
    famiglie: { valore: scoreF, etichetta: labF, nota: [`Inflazione ${prep("a", infl, 1)}%`, benz != null ? `benzina a ${it(benz, 3)} €/l` : "", dis != null ? `disoccupazione ${prep("a", dis, 1)}%` : ""].filter(Boolean).join(", ") + "." },
    perTe: [liq, tassi, inv, spe],
    notizie: ctx.notizie.slice(0, 6).map((n) => ({ titolo: n.titolo, testo: n.descr || "", impatto: null, fonte: n.fonte, url: n.url, data: n.data })),
  };
}

// ================================================================ IA facoltativa (solo testi)

async function gemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  for (const m of [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite"].filter(Boolean)) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, responseMimeType: "application/json" } }),
      });
      if (!r.ok) { log("Gemini", m, "HTTP", r.status); continue; }
      const j = await r.json();
      const txt = j?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("");
      if (txt) { log("testi riscritti con Gemini", m); return txt; }
    } catch (e) { log("Gemini", m, e.message); }
  }
  return null;
}

async function groq(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  for (const m of [process.env.GROQ_MODEL, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"].filter(Boolean)) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: m, temperature: 0.3, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
      });
      if (!r.ok) { log("Groq", m, "HTTP", r.status); continue; }
      const txt = (await r.json())?.choices?.[0]?.message?.content;
      if (txt) { log("testi riscritti con Groq", m); return txt; }
    } catch (e) { log("Groq", m, e.message); }
  }
  return null;
}

function parseJson(txt) {
  if (!txt) return null;
  const s = txt.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  try { return JSON.parse(s); } catch { const m = s.match(/\{[\s\S]*\}/); try { return m ? JSON.parse(m[0]) : null; } catch { return null; } }
}

// Accetta i testi dell'IA solo se ben formati e se ogni numero compare davvero nei dati (o nella notizia citata).
// Gli indicatori di clima restano sempre calcolati: l'IA non decide valori.
function numeriDi(s) {
  return new Set((String(s).match(/\d+(?:[.,]\d+)*/g) || []).flatMap((x) => {
    const a = x.replace(/\./g, "").replace(",", "."), b = x.replace(",", ".");
    return [a, b, String(Number(a)), String(Number(b))];
  }));
}
function numeriOk(testo, ammessi) {
  const re = /(\d+(?:[.,]\d+)*)(\s*%)?/g; let m;
  while ((m = re.exec(testo))) {
    const x = m[1], pct = Boolean(m[2]);
    const cand = [x.replace(/\./g, "").replace(",", "."), x.replace(",", ".")].map((v) => String(Number(v)));
    if (cand.some((v) => ammessi.has(v))) continue;
    const intero = /^\d+$/.test(x) && Number(x) <= 31;
    const anno = /^(19|20)\d\d$/.test(x);
    if (!pct && (intero || anno)) continue; // giorni, conteggi, anni
    return false;
  }
  return true;
}
function validaIA(a, ctx) {
  if (!a || typeof a !== "object") return null;
  const str = (x, max) => (typeof x === "string" && x.trim() && x.trim().length <= max ? x.trim() : null);
  const datiNum = numeriDi(JSON.stringify(ctx.dati));
  const out = {};
  out.titolo = str(a.titolo, 80); if (out.titolo && !numeriOk(out.titolo, datiNum)) out.titolo = null;
  out.sintesi = str(a.sintesi, 600); if (out.sintesi && !numeriOk(out.sintesi, datiNum)) out.sintesi = null;
  if (!out.titolo || !out.sintesi) { out.titolo = null; out.sintesi = null; } // titolo e sintesi vanno in coppia
  const links = new Set(["#strumenti", "#piano", "#tutela", "#fonti", "#oggi-agenda"]);
  const pt = Array.isArray(a.perTe) ? a.perTe.filter((c) => c && str(c.tema, 24) && str(c.titolo, 70) && str(c.testo, 480) && numeriOk(c.titolo + " " + c.testo, datiNum)) : [];
  out.perTe = pt.length === 4 ? pt.map((c) => ({ tema: c.tema.trim(), titolo: c.titolo.trim(), testo: c.testo.trim(), azione: str(c.azione, 40) || "Apri gli strumenti", link: links.has(c.link) ? c.link : "#strumenti" })) : null;
  const usate = new Set();
  const nz = Array.isArray(a.notizie) ? a.notizie.map((n) => {
    const s = Number.isInteger(n?.indice) ? ctx.notizie[n.indice] : null;
    if (!s || usate.has(n.indice) || !str(n.titolo, 120) || !str(n.testo, 400)) return null;
    const amm = new Set([...datiNum, ...numeriDi(s.titolo + " " + s.descr)]);
    if (!numeriOk(n.titolo + " " + n.testo, amm)) return null;
    usate.add(n.indice);
    return { titolo: n.titolo.trim(), testo: n.testo.trim(), impatto: ["positivo", "negativo", "misto", "neutro"].includes(n.impatto) ? n.impatto : "neutro", fonte: s.fonte, url: s.url, data: s.data };
  }).filter(Boolean) : [];
  out.notizie = nz.length >= Math.min(3, ctx.notizie.length) && nz.length ? nz.slice(0, 6) : null;
  return out;
}

function promptIA(ctx) {
  return `Sei la redazione di "Eco Bussola", app italiana di educazione finanziaria per famiglie senza esperienza.
Italiano semplice e preciso, senza gergo, senza punti esclamativi, senza emoji. Numeri in formato italiano.
Regole: usa SOLO i numeri forniti; non inventare fatti; mai consigliare di comprare o vendere strumenti specifici; riscrivi le notizie con parole tue senza copiare frasi.

Edizione: ${ctx.edizione} del ${ctx.giorno}.
DATI: ${JSON.stringify(ctx.dati)}
NOTIZIE:
${ctx.notizie.map((n, i) => `${i}. [${n.fonte}] ${n.titolo} — ${n.descr}`).join("\n")}

Rispondi solo con JSON:
{"titolo":"max 60 caratteri, due parti separate da virgola","sintesi":"2-3 frasi",
"perTe":[4 oggetti {"tema":"Liquidità"|"Tassi e mutuo"|"Investimenti"|"Spese","titolo":"max 50","testo":"2-3 frasi; cita solo numeri presenti nei DATI, senza calcolarne di nuovi","azione":"max 35","link":"#strumenti"|"#piano"|"#tutela"|"#fonti"}],
"notizie":[4-6 oggetti {"indice":n,"titolo":"riscritto max 90","testo":"1-2 frasi","impatto":"positivo"|"negativo"|"misto"|"neutro"}]}`;
}

// ================================================================ principale

async function main() {
  let prev = {};
  try { const sb = { window: {} }; vm.runInNewContext(await readFile(FILE, "utf8"), sb, { timeout: 2000 }); prev = sb.window.ECO || {}; }
  catch (e) { log("data.js precedente illeggibile, riparto da zero:", e.message); }
  const prevVoce = (id) => { for (const g of prev.mercati || []) for (const v of g.voci || []) if (v.id === id) return v; return null; };

  const giorno = dayRome();
  const edizione = hourRome() < 13 ? "mattina" : "sera";
  const V = {};
  const serie = { ...(prev.serie || {}) };
  const serieDate = { ...(prev.serieDate || {}) };
  const esito = { ok: [], ko: [] };
  const rendimenti = {};
  const completi = {};

  // --- quotazioni giornaliere
  for (const [id, sym, nome, unita, dec, buono, range] of YAHOO) {
    const y = await safe("Yahoo " + sym, () => yahoo(sym, range));
    await sleep(400);
    if (!y) { esito.ko.push(nome); continue; }
    V[id] = { nome, unita, decimali: dec, buono, valore: round(y.valore, dec), var: round(y.var, 2), data: y.data, mese: y.mese, fonte: "Yahoo Finance", url: `https://finance.yahoo.com/quote/${encodeURIComponent(sym)}` };
    rendimenti[id] = { ...y.rend, ...(y.stat || {}) };
    completi[id] = y.completo;
    V[id].rend = y.rend; V[id].inizio = y.inizio;
    serie[id] = y.serie;
    esito.ok.push(nome);
  }

  // --- BCE: tasso sui depositi (serie giornaliera)
  const dfr = await safe("BCE tasso depositi", () => ecb(["FM.D.U2.EUR.4F.KR.DFR.LEV"], 800, [-2, 20]));
  if (dfr) {
    const last = dfr.at(-1);
    const iCambio = dfr.findLastIndex((o, i) => i > 0 && dfr[i - 1].v !== o.v);
    const precedente = iCambio > 0 ? dfr[iCambio - 1].v : null;
    V.bce = { nome: "BCE depositi", unita: "%", decimali: 2, buono: "neutro", valore: last.v, var: null, delta: precedente != null ? `da ${it(precedente)}%` : "invariato", nota: iCambio > 0 ? `In vigore dal ${dataIt(dfr[iCambio].t)}` : "Tasso sui depositi presso la BCE", data: last.t, fonte: "BCE", url: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.it.html" };
    esito.ok.push("BCE");
  } else esito.ko.push("BCE");

  // --- BTP, Bund e spread (medie mensili ufficiali)
  const itY = await safe("BTP 10 anni", () => ecb(["IRS.M.IT.L.L40.CI.0000.EUR.N.Z"], 13, [-2, 20]));
  const deY = await safe("Bund 10 anni", () => ecb(["IRS.M.DE.L.L40.CI.0000.EUR.N.Z"], 13, [-2, 20]));
  if (itY) {
    const l = itY.at(-1), p = itY.at(-2);
    V.btp10 = { nome: "BTP 10 anni", unita: "%", decimali: 2, valore: round(l.v, 2), var: null, delta: p ? `da ${it(p.v)}%` : "", buono: "giu", nota: `Rendimento medio di ${meseIt(l.t)}`, data: l.t, fonte: "BCE", url: "https://data.ecb.europa.eu/data/datasets/IRS" };
    serie.btp10 = itY.map((o) => round(o.v, 3));
    esito.ok.push("BTP");
  } else esito.ko.push("BTP");
  if (itY && deY) {
    const de = Object.fromEntries(deY.map((o) => [o.t, o.v]));
    const sp = itY.filter((o) => de[o.t] != null).map((o) => ({ t: o.t, v: round((o.v - de[o.t]) * 100, 0) }));
    if (sp.length) {
      const l = sp.at(-1), p = sp.at(-2);
      V.spread = { nome: "Spread BTP-Bund", unita: "pb", decimali: 0, valore: l.v, var: null, delta: p ? `da ${it(p.v, 0)}` : "", buono: "giu", nota: `Media di ${meseIt(l.t)}. Più basso è, meno costa il debito italiano`, data: l.t, fonte: "BCE", url: "https://data.ecb.europa.eu/data/datasets/IRS" };
      serie.spread = sp.map((o) => o.v);
    }
  }

  // --- Fed
  let fed = await safe("Fed (New York Fed)", fedNY);
  if (!fed) {
    const fu = await safe("Fed massimo (FRED)", () => fred("DFEDTARU"));
    const fl = await safe("Fed minimo (FRED)", () => fred("DFEDTARL"));
    if (fu && fl) fed = { min: fl.v, max: fu.v, t: fu.t };
  }
  if (fed && fed.max >= fed.min && fed.max < 25) {
    V.fed = { nome: "Fed (USA)", unita: "%", buono: "neutro", valore: `${it(fed.min)}–${it(fed.max)}`, var: null, delta: "", nota: "Intervallo obiettivo dei tassi USA", data: fed.t, fonte: "Federal Reserve Bank of New York", url: "https://www.newyorkfed.org/markets/reference-rates/effr" };
    esito.ok.push("Fed");
  } else esito.ko.push("Fed");

  // --- inflazione: Eurostat (nuova classificazione 2026), con controllo che il dato sia recente
  for (const [id, geos, nome, nota] of [
    ["infl_it", ["IT"], "Inflazione Italia", "Indice armonizzato IPCA, variazione annua"],
    ["infl_ez", ["EA", "EA20", "EA21"], "Inflazione Eurozona", "Variazione annua, area euro"],
  ]) {
    const r = await safe(nome, () => inflazione(geos));
    if (!r) { esito.ko.push(nome); continue; }
    const s = r.s, l = s.at(-1), p = s.at(-2);
    V[id] = { nome, unita: "%", decimali: 1, valore: l.v, var: null, delta: p ? `da ${it(p.v, 1)}%` : "", buono: "giu", nota: `${nota} (${meseIt(l.t)})`, data: l.t, fonte: "Eurostat", url: "https://ec.europa.eu/eurostat/web/hicp" };
    serie[id] = s.map((o) => o.v);
    esito.ok.push(nome);
  }

  // --- inflazione, Euribor, tassi bancari medi
  for (const [id, keys, nome, nota, buono, dec, n, range] of BCE_SERIE) {
    const s = await safe(nome, () => ecb(keys, n, range));
    if (!s) { esito.ko.push(nome); continue; }
    if (!fresco(s.at(-1).t, 6)) { log("ATTENZIONE", nome, "- serie ferma a", s.at(-1).t); esito.ko.push(nome); continue; }
    const l = s.at(-1), p = s.at(-2);
    V[id] = { nome, unita: "%", decimali: dec, valore: round(l.v, dec), var: null, delta: p ? `da ${it(p.v, dec)}%` : "", buono, nota: `${nota} (${meseIt(l.t)})`, data: l.t, fonte: id.startsWith("infl") ? "Eurostat via BCE" : "Banca d'Italia / BCE", url: "https://data.ecb.europa.eu/" };
    serie[id] = s.map((o) => round(o.v, 3));
    esito.ok.push(nome);
  }

  // --- disoccupazione
  const dis = await safe("Disoccupazione", () => eurostat("une_rt_m", "geo=IT&s_adj=SA&age=TOTAL&sex=T&unit=PC_ACT&lastTimePeriod=13"));
  if (dis && dis.at(-1).v > 0 && dis.at(-1).v < 40) {
    const l = dis.at(-1), p = dis.at(-2);
    V.disoccupazione = { nome: "Disoccupazione Italia", unita: "%", decimali: 1, valore: l.v, var: null, delta: p ? `da ${it(p.v, 1)}%` : "", buono: "giu", nota: `Tasso destagionalizzato (${meseIt(l.t)})`, data: l.t, fonte: "Eurostat", url: "https://ec.europa.eu/eurostat/databrowser/view/une_rt_m/default/table" };
    serie.disoccupazione = dis.map((o) => o.v);
    esito.ok.push("Disoccupazione");
  } else esito.ko.push("Disoccupazione");

  // --- cambi ufficiali BCE (riferimento giornaliero delle 14:15)
  for (const [id, cur, nome, dec, nota] of [
    ["eurusd", "USD", "Euro / Dollaro", 4, "Cambio ufficiale BCE. Un euro forte rende più economici acquisti e viaggi in dollari"],
    ["eurgbp", "GBP", "Euro / Sterlina", 4, "Cambio ufficiale BCE, utile per viaggi e acquisti nel Regno Unito"],
    ["eurchf", "CHF", "Euro / Franco svizzero", 4, "Cambio ufficiale BCE, utile per frontalieri e viaggi in Svizzera"],
  ]) {
    const s = (await safe(nome, () => ecb([`EXR.D.${cur}.EUR.SP00.A`], 60, [0.1, 500])))
      || (await safe(nome + " (file giornaliero BCE)", async () => { const x = (await cambiBceXml())?.[cur]; if (!x || x.length < 2) throw new Error("cambio assente"); return x.slice(-60); }));
    if (!s || s.length < 2) { if (!V[id]) esito.ko.push(nome); continue; }
    const l = s.at(-1), p = s.at(-2), ago = s.length > 22 ? s.at(-23) : null;
    V[id] = { nome, unita: cur === "USD" ? "$" : cur === "GBP" ? "£" : "CHF", decimali: dec, valore: round(l.v, dec), var: round((l.v / p.v - 1) * 100, 2), data: l.t, mese: ago ? (l.v / ago.v - 1) * 100 : null, nota, fonte: "BCE", url: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.it.html" };
    serie[id] = s.map((o) => o.v);
    esito.ok.push(nome);
  }
  // Oro in euro al grammo: quotazione in dollari per oncia, convertita al cambio del giorno.
  const fxOro = V.eurusd_y ? "eurusd_y" : V.eurusd ? "eurusd" : null;
  if (V.oro && fxOro) {
    const g = (x, fx) => x / fx / 31.1034768;
    const so = serie.oro || [], su = serie[fxOro] || [];
    const k = Math.min(so.length, su.length);
    const s = Array.from({ length: k }, (_, i) => round(g(so[so.length - k + i], su[su.length - k + i]), 2));
    const val = g(V.oro.valore, V[fxOro].valore);
    V.oro_eur = { nome: "Oro al grammo", unita: "€/g", decimali: 2, valore: round(val, 2), var: s.length > 1 ? round((val / s.at(-2) - 1) * 100, 2) : null, data: V.oro.data, mese: s.length > 22 ? (val / s.at(-23) - 1) * 100 : null, nota: `Oro puro. A 18 carati circa ${it(val * 0.75)} €/g`, fonte: "Calcolo su Yahoo Finance e BCE", url: "https://finance.yahoo.com/quote/GC%3DF" };
    serie.oro_eur = s;
    if (rendimenti.oro && rendimenti[fxOro]) {
      const r = {}; for (const k of ["m1", "m3", "ytd", "y1"]) { const a = rendimenti.oro[k], b = rendimenti[fxOro][k]; r[k] = a != null && b != null ? round(((1 + a / 100) / (1 + b / 100) - 1) * 100, 2) : null; }
      const a = completi.oro, b = completi[fxOro];
      if (a && b) {
        const giornoDi = (t) => new Date(t * 1000).toISOString().slice(0, 10);
        const fx = new Map(b.ts.map((t, i) => [giornoDi(t), b.c[i]]));
        const ts2 = [], c2 = [];
        a.ts.forEach((t, i) => { const f = fx.get(giornoDi(t)); if (f) { ts2.push(t); c2.push(g(a.c[i], f)); } });
        Object.assign(r, statistiche(ts2, c2) || {});
      }
      rendimenti.oro_eur = r;
      V.oro_eur.rend = r; V.oro_eur.inizio = V.oro?.inizio;
    }
  }

  // --- carburanti (media dei distributori self, aggiornata ogni mattina dal Mimit)
  const carb = await safe("Carburanti Mimit", carburanti);
  if (carb) {
    for (const [id, nome] of [["benzina", "Benzina self"], ["gasolio", "Gasolio self"]]) {
      const val = round(carb[id].media, 3), old = (serie[id] || []).filter((x) => num(x) != null);
      const stessoGiorno = serieDate[id] === carb.data;
      const base = stessoGiorno ? old.slice(0, -1) : old;
      serie[id] = [...base, val].slice(-60);
      serieDate[id] = carb.data;
      const prevVal = base.at(-1);
      V[id] = { nome, unita: "€/l", decimali: 3, valore: val, var: prevVal ? round((val / prevVal - 1) * 100, 2) : null, buono: "giu", nota: `Media di ${it(carb[id].n, 0)} distributori self service`, data: carb.data, fonte: "Mimit", url: "https://carburanti.mise.gov.it/" };
    }
    esito.ok.push("Carburanti");
  } else {
    const ue = await safe("Carburanti (bollettino UE)", carburantiUE);
    if (ue) {
      for (const [id, nome] of [["benzina", "Benzina"], ["gasolio", "Gasolio"]]) {
        const s = ue[id], l = s.at(-1), p = s.at(-2);
        V[id] = { nome, unita: "€/l", decimali: 3, valore: round(l.v, 3), var: p ? round((l.v / p.v - 1) * 100, 2) : null, buono: "giu", nota: "Media nazionale settimanale, Bollettino petrolifero UE", data: l.t, fonte: "Commissione europea via fuel-prices.eu", url: "https://www.fuel-prices.eu/research/" };
        serie[id] = s.slice(-26).map((o) => round(o.v, 3));
        serieDate[id] = l.t;
      }
      esito.ok.push("Carburanti (settimanale UE)");
    } else esito.ko.push("Carburanti");
  }

  // --- composizione: le voci non aggiornate mantengono valore e data precedenti
  const GRUPPI = [
    ["Borse", ["ftsemib", "stoxx50", "dax", "mondo", "sp500", "nasdaq", "giappone", "vix"]],
    ["Mercati emergenti", ["emergenti", "india", "cina", "brasile"]],
    ["Tassi", ["bce", "euribor3m", "btp10", "spread"]],
    ["Banche e lavoro in Italia", ["mutuo_medio", "dep_vincolati", "dep_conto", "disoccupazione"]],
    ["Prezzi in Italia", ["infl_it", "infl_ez", "benzina", "gasolio"]],
    ["Metalli preziosi e industriali", ["oro_eur", "argento", "platino", "rame"]],
    ["Valute e cripto", ["eurusd", "eurgbp", "eurchf", "btc"]],
    ["Stati Uniti ed energia", ["fed", "us10y", "dow", "brent"]],
  ];
  const NOTE = {
    ftsemib: "Indice principale di Piazza Affari", stoxx50: "Le 50 maggiori società dell'area euro", dax: "Borsa di Francoforte",
    mondo: "ETF iShares Core MSCI World quotato a Milano: misura l'azionario globale", sp500: "Le 500 maggiori società USA",
    dow: "Indice storico di Wall Street", nasdaq: "Indice dei tecnologici USA", vix: "Sopra 25 i mercati sono nervosi, sotto 15 tranquilli",
    us10y: "Rendimento del decennale USA, riferimento mondiale", eurusd: "Un euro forte rende più economici gli acquisti in dollari",
    oro: "Bene rifugio, quotazione future", argento: "Metallo prezioso e industriale", brent: "Riferimento per carburanti ed energia",
    btc: "Asset speculativo, molto volatile e non protetto", ttf: "Riferimento europeo per le bollette del gas",
    argento: "Metallo prezioso e industriale, più volatile dell'oro", platino: "Usato in gioielleria e catalizzatori auto", palladio: "Metallo per l'industria automobilistica",
    rame: "Termometro dell'economia mondiale: sale quando l'industria cresce", emergenti: "ETF iShares MSCI EM IMI quotato a Milano: oltre 3.000 aziende di Cina, India, Taiwan, Brasile",
    giappone: "Borsa di Tokyo, in yen", india: "Le 50 maggiori società indiane, in rupie", cina: "Borsa di Shanghai, in yuan", brasile: "Borsa di San Paolo, in real",
  };
  const mercati = GRUPPI.map(([gruppo, ids]) => ({
    gruppo,
    voci: ids.map((id) => {
      if (V[id]) { const { mese, ...rest } = V[id]; return { id, ...rest, mese: num(mese) != null ? round(mese, 2) : null, nota: rest.nota || NOTE[id] || "" }; }
      return prevVoce(id);
    }).filter(Boolean),
  }));
  const VV = Object.fromEntries(mercati.flatMap((g) => g.voci).map((v) => [v.id, { ...v, mese: V[v.id]?.mese ?? null }]));

  log(`aggiornate ${esito.ok.length} fonti: ${esito.ok.join(", ")}`);
  if (esito.ko.length) log(`non aggiornate (restano i valori precedenti): ${esito.ko.join(", ")}`);
  if (Object.keys(V).length < 5) throw new Error("Troppe fonti non raggiungibili: data.js lasciato invariato.");

  const inflCat = await inflazioneCategorie();
  if (inflCat) { log("inflazione per categoria:", inflCat.periodo, Object.entries(inflCat.categorie).map(([k, v]) => `${k} ${v.valore}%`).join(", ")); esito.ok.push("Inflazione per categoria"); }
  else esito.ko.push("Inflazione per categoria");

  const btc = await safe("Sezione Bitcoin", bitcoin);
  if (btc) { log("bitcoin:", Object.keys(btc).join(", ")); esito.ok.push("Bitcoin (rete e mercato)"); }
  else esito.ko.push("Bitcoin (rete e mercato)");

  const storia = [];
  for (const [id, sym, nome, nota] of STORIA) {
    const st = await safe("Storia " + sym, () => storiaLunga(sym));
    await sleep(400);
    if (st) storia.push({ id, nome, nota, ...st });
  }
  log("storia lunga:", storia.map((x) => `${x.id} ${x.inizio} ${x.cagr}%/anno, calo max ${x.calo.valore}%`).join("; "));
  if (storia.length >= 3) esito.ok.push("Storia dei mercati"); else esito.ko.push("Storia dei mercati");

  const notizie = (await safe("notizie", () => notizieRss(giorno))) || [];
  log("notizie raccolte:", notizie.length);

  const ctx = { giorno, edizione, notizie, serie };
  ctx.dati = Object.fromEntries(Object.values(VV).map((v) => [v.nome, { valore: v.valore, unita: v.unita, var_giorno_pct: v.var ?? null, confronto: v.delta || null, var_mese_pct: v.mese != null ? round(v.mese, 1) : null, data: v.data }]));
  ctx.dati["Prossima riunione BCE"] = BCE_RIUNIONI.find((d) => d >= giorno) || null;

  const base = testiCalcolati(ctx, VV);
  let ia = null;
  if (process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY) {
    const p = promptIA(ctx);
    ia = validaIA(parseJson(await gemini(p)), ctx);
    if (!ia || !ia.perTe) ia = validaIA(parseJson(await groq(p)), ctx) || ia;
  }
  log(ia ? "testi: IA dove valida, calcolati per il resto" : "testi: calcolati dai dati (nessuna IA)");

  const lunedi = (iso) => { const d = new Date(iso + "T12:00:00Z"), w = d.getUTCDay(); if (w === 6) d.setUTCDate(d.getUTCDate() + 2); if (w === 0) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
  const anno = +giorno.slice(0, 4);
  const agenda = [
    ...BCE_RIUNIONI.map((d) => ({ data: d, evento: "Riunione BCE sui tassi", perche: "Conta per mutui variabili, conti deposito e titoli di Stato" })),
    ...[anno, anno + 1].flatMap((y) => SCADENZE_FISCALI.map(([m, g, evento, perche]) => ({ data: lunedi(`${y}-${String(m).padStart(2, "0")}-${String(g).padStart(2, "0")}`), evento, perche }))),
  ].filter((a) => a.data >= giorno).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 5);

  const out = {
    aggiornato: isoRome(),
    edizione,
    testiIA: Boolean(ia && (ia.titolo || ia.perTe || ia.notizie)),
    fonti: { aggiornate: esito.ok, nonAggiornate: esito.ko },
    titolo: ia?.titolo || base.titolo,
    sintesi: ia?.sintesi || base.sintesi,
    climi: { mercati: base.mercati, famiglie: base.famiglie },
    perTe: ia?.perTe || base.perTe,
    mercati,
    notizie: ia?.notizie || (base.notizie.length ? base.notizie : prev.notizie || []),
    agenda,
    rendimenti: VV.dep_vincolati ? { mediaVincolati: VV.dep_vincolati.valore, mediaConto: VV.dep_conto?.valore ?? null, mutuoMedio: VV.mutuo_medio?.valore ?? null, data: VV.dep_vincolati.data, fonte: "Banca d'Italia / BCE" } : prev.rendimenti || null,
    inflazioneCategorie: inflCat || prev.inflazioneCategorie || null,
    bitcoin: btc ? { ...(prev.bitcoin || {}), ...btc } : prev.bitcoin || null,
    classifica: (() => {
      const LISTA = [
        ["mondo", "Azionario mondiale", "€"], ["emergenti", "Mercati emergenti", "€"], ["stoxx50", "Europa (Euro Stoxx 50)", "€"],
        ["ftsemib", "Italia (FTSE MIB)", "€"], ["sp500", "USA (S&P 500)", "$"], ["nasdaq", "Tecnologici USA (Nasdaq)", "$"],
        ["giappone", "Giappone", "¥"], ["india", "India", "₹"], ["cina", "Cina", "¥"], ["brasile", "Brasile", "R$"],
        ["oro_eur", "Oro", "€"], ["argento", "Argento", "$"], ["platino", "Platino", "$"], ["rame", "Rame", "$"],
        ["brent", "Petrolio", "$"], ["btc", "Bitcoin", "$"],
      ];
      const out = LISTA.filter(([id]) => rendimenti[id]).map(([id, nome, valuta]) => ({ id, nome, valuta, ...rendimenti[id] }));
      return out.length >= 6 ? { data: giorno, voci: out } : prev.classifica || null;
    })(),
    storia: storia.length >= 3 ? { data: giorno, fonte: "Yahoo Finance, dati mensili", indici: storia } : prev.storia || null,
    serie,
    serieDate,
  };
  const testo = "/* Dati del giorno, generati automaticamente due volte al giorno. */\nwindow.ECO = " + JSON.stringify(out, null, 2) + ";\n";
  vm.runInNewContext(testo, { window: {} }); // verifica che il file sia valido prima di scriverlo
  await writeFile(FILE, testo);
  log("data.js scritto:", out.edizione, out.aggiornato);
}

main().catch((e) => { console.error("[aggiorna] ERRORE", e.message); process.exit(1); });
