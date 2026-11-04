// Aggiorna data.js con dati di mercato da fonti pubbliche gratuite.
// I numeri arrivano solo dalle fonti; l'IA (Gemini o Groq, piani gratuiti) scrive soltanto i testi.
// Uso: node scripts/aggiorna.mjs   (Node 20+, nessuna dipendenza)

import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const FILE = new URL("../data.js", import.meta.url);
const UA = "Mozilla/5.0 (compatible; eco-bussola/1.0)";
const log = (...a) => console.log("[aggiorna]", ...a);

// ---------------------------------------------------------------- configurazione

const BCE_RIUNIONI = [
  "2026-12-17",
  "2027-02-04", "2027-03-18", "2027-04-29", "2027-06-10",
  "2027-07-22", "2027-09-09", "2027-10-28", "2027-12-16",
];

const SCADENZE_FISCALI = [ // [mese, giorno, evento, perché]
  [6, 16, "Acconto IMU", "Prima rata per seconde case e immobili non esenti"],
  [6, 30, "Saldo e primo acconto Irpef", "Per chi presenta il modello Redditi"],
  [9, 30, "Termine per il 730", "Ultimo giorno per la dichiarazione precompilata"],
  [11, 30, "Seconda rata dell'acconto Irpef", "Per chi ha un acconto dovuto"],
  [12, 16, "Saldo IMU", "Seconde case e immobili non esenti"],
];

// Tassi dei conti deposito: non esiste una fonte gratuita aggiornata in automatico.
// Si aggiornano a mano qui quando cambiano sensibilmente.
const RENDIMENTI = {
  contoDepositoLibero: { min: 2.35, max: 2.5 },
  contoDeposito12m: { min: 3.15, max: 4.0 },
  nota: "Tassi lordi rilevati a metà ottobre 2026. Verifica sempre il foglio informativo della banca.",
  fonte: "Economia Italia",
  url: "https://finanza.economia-italia.com/migliori-conti-deposito-novembre-dicembre-2026",
};

const YAHOO = [ // id, simbolo, nome, unità, decimali, buono
  ["ftsemib", "FTSEMIB.MI", "FTSE MIB", "pt", 0],
  ["sp500", "^GSPC", "S&P 500", "pt", 2],
  ["dow", "^DJI", "Dow Jones", "pt", 2],
  ["nasdaq", "^IXIC", "Nasdaq", "pt", 2],
  ["eurusd", "EURUSD=X", "Euro / Dollaro", "$", 4],
  ["oro", "GC=F", "Oro", "$/oz", 0],
  ["brent", "BZ=F", "Petrolio Brent", "$/bbl", 2, "giu"],
  ["btc", "BTC-USD", "Bitcoin", "$", 0],
  ["ttf", "TTF=F", "Gas TTF", "€/MWh", 2, "giu"],
];

const RSS = [
  ["ANSA Economia", "https://www.ansa.it/sito/notizie/economia/economia_rss.xml"],
  ["ANSA Borsa", "https://www.ansa.it/sito/notizie/economia/borsa/borsa_rss.xml"],
  ["Il Sole 24 Ore", "https://www.ilsole24ore.com/rss/finanza.xml"],
];

// ---------------------------------------------------------------- utilità

async function get(url, { text = true, timeout = 30000, headers = {} } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, ...headers }, signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
    return text ? await r.text() : await r.json();
  } finally { clearTimeout(t); }
}
const safe = async (label, fn) => { try { return await fn(); } catch (e) { log("ATTENZIONE", label, "-", e.message); return null; } };
const romeNow = () => new Date();
const isoRome = (d = romeNow()) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZoneName: "longOffset" }).formatToParts(d).map((x) => [x.type, x.value]));
  const off = (p.timeZoneName || "GMT+01:00").replace("GMT", "") || "+00:00";
  return `${p.year}-${p.month}-${p.day}T${p.hour === "24" ? "00" : p.hour}:${p.minute}:${p.second}${off}`;
};
const dayRome = (d = romeNow()) => isoRome(d).slice(0, 10);
const hourRome = () => Number(isoRome().slice(11, 13));
const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
const it = (n, d = 2) => {
  const s = Math.abs(n).toFixed(d).split(".");
  return (n < 0 ? "−" : "") + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (d ? "," + s[1] : "");
};
const csvRows = (txt) => {
  const lines = txt.trim().split(/\r?\n/);
  const sep = lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
  const head = lines[0].split(sep).map((h) => h.replace(/"/g, "").trim());
  return lines.slice(1).map((l) => { const c = l.split(sep).map((x) => x.replace(/"/g, "").trim()); return Object.fromEntries(head.map((h, i) => [h, c[i]])); });
};

// ---------------------------------------------------------------- fonti

async function yahoo(sym) {
  const j = await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=3mo&interval=1d`, { text: false });
  const r = j?.chart?.result?.[0];
  if (!r) throw new Error("risposta vuota");
  const ts = r.timestamp || [], cl = r.indicators?.quote?.[0]?.close || [];
  const pts = ts.map((t, i) => [t, cl[i]]).filter((p) => typeof p[1] === "number");
  if (pts.length < 2) throw new Error("serie troppo corta");
  const live = r.meta?.regularMarketPrice;
  const lastT = r.meta?.regularMarketTime || pts.at(-1)[0];
  let last = typeof live === "number" ? live : pts.at(-1)[1];
  // Se il prezzo live appartiene a una nuova seduta non ancora in serie, il precedente è l'ultima chiusura.
  const sameDay = new Date(pts.at(-1)[0] * 1000).toISOString().slice(0, 10) === new Date(lastT * 1000).toISOString().slice(0, 10);
  const prev = sameDay ? pts.at(-2)[1] : pts.at(-1)[1];
  const serie = pts.slice(-60).map((p) => round(p[1], 4));
  if (sameDay) serie[serie.length - 1] = round(last, 4); else serie.push(round(last, 4));
  return { valore: last, var: (last / prev - 1) * 100, data: dayRome(new Date(lastT * 1000)), serie, mese: serie.length > 21 ? (last / serie.at(-22) - 1) * 100 : null };
}

async function ecb(key, n = 13) {
  const [flow, ...rest] = key.split(".");
  const txt = await get(`https://data-api.ecb.europa.eu/service/data/${flow}/${rest.join(".")}?lastNObservations=${n}&format=csvdata`);
  const rows = csvRows(txt).filter((r) => r.OBS_VALUE !== "" && r.OBS_VALUE != null && !isNaN(+r.OBS_VALUE));
  if (!rows.length) throw new Error("nessun dato " + key);
  return rows.map((r) => ({ t: r.TIME_PERIOD, v: +r.OBS_VALUE }));
}

async function fred(id) {
  const txt = await get(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`);
  const rows = txt.trim().split(/\r?\n/).slice(1).map((l) => l.split(",")).filter((c) => c[1] && !isNaN(+c[1]));
  const last = rows.at(-1);
  return { t: last[0], v: +last[1] };
}

async function carburanti() {
  const txt = await get("https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv", { timeout: 90000 });
  const lines = txt.split(/\r?\n/).filter(Boolean);
  const hIdx = lines.findIndex((l) => /descCarburante/i.test(l));
  if (hIdx < 0) throw new Error("formato CSV inatteso");
  const sep = lines[hIdx].includes("|") ? "|" : ";";
  const head = lines[hIdx].split(sep);
  const iC = head.indexOf("descCarburante"), iP = head.indexOf("prezzo"), iS = head.indexOf("isSelf"), iD = head.indexOf("dtComu");
  const estr = (lines[0].match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || dayRome();
  const pick = (name) => {
    const v = [];
    for (const l of lines.slice(hIdx + 1)) {
      const c = l.split(sep);
      if (c[iC] === name && c[iS] === "1") { const p = parseFloat(c[iP]); if (p > 0.8 && p < 4) v.push(p); }
    }
    if (v.length < 500) throw new Error("troppi pochi prezzi per " + name);
    v.sort((a, b) => a - b);
    const cut = Math.floor(v.length * 0.02); const trimmed = v.slice(cut, v.length - cut);
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  };
  return { benzina: pick("Benzina"), gasolio: pick("Gasolio"), data: estr };
}

async function notizieRss() {
  const out = [];
  for (const [fonte, url] of RSS) {
    const xml = await safe("RSS " + fonte, () => get(url));
    if (!xml) continue;
    const items = xml.split(/<item[\s>]/i).slice(1, 12);
    for (const it of items) {
      const tag = (n) => { const m = it.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`, "i")); return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, " ").trim() : ""; };
      const titolo = tag("title"), link = tag("link"), data = tag("pubDate"), descr = tag("description").slice(0, 400);
      if (titolo && /^https?:\/\//.test(link)) out.push({ titolo, url: link, fonte, data: data ? new Date(data).toISOString() : null, descr });
    }
  }
  const seen = new Set();
  return out.filter((n) => { const k = n.titolo.toLowerCase().slice(0, 60); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => (b.data || "").localeCompare(a.data || "")).slice(0, 25);
}

// ---------------------------------------------------------------- intelligenza artificiale (gratuita)

async function gemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const models = [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"].filter(Boolean);
  for (const m of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, responseMimeType: "application/json" } }),
      });
      if (!r.ok) { log("Gemini", m, "HTTP", r.status); continue; }
      const j = await r.json();
      const txt = j?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
      log("testi scritti con Gemini", m);
      return txt;
    } catch (e) { log("Gemini", m, e.message); }
  }
  return null;
}

async function groq(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const models = [process.env.GROQ_MODEL, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"].filter(Boolean);
  for (const m of models) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: m, temperature: 0.4, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
      });
      if (!r.ok) { log("Groq", m, "HTTP", r.status); continue; }
      const j = await r.json();
      log("testi scritti con Groq", m);
      return j?.choices?.[0]?.message?.content || null;
    } catch (e) { log("Groq", m, e.message); }
  }
  return null;
}

function parseJson(txt) {
  if (!txt) return null;
  const s = txt.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try { return JSON.parse(s); } catch { const m = s.match(/\{[\s\S]*\}/); try { return m ? JSON.parse(m[0]) : null; } catch { return null; } }
}

function validAi(a, notizie) {
  if (!a || typeof a !== "object") return null;
  const str = (x, max) => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null);
  const out = {};
  out.titolo = str(a.titolo, 70);
  out.sintesi = str(a.sintesi, 520);
  const clima = (c) => c && typeof c.valore === "number" && str(c.etichetta, 24) && str(c.nota, 160) ? { valore: Math.max(0, Math.min(100, Math.round(c.valore))), etichetta: c.etichetta.trim(), nota: c.nota.trim() } : null;
  out.mercati = clima(a.climi?.mercati); out.famiglie = clima(a.climi?.famiglie);
  const links = new Set(["#strumenti", "#piano", "#tutela", "#fonti", "#oggi-agenda"]);
  out.perTe = Array.isArray(a.perTe) ? a.perTe.filter((c) => str(c.tema, 20) && str(c.titolo, 70) && str(c.testo, 420)).slice(0, 4)
    .map((c) => ({ tema: c.tema.trim(), titolo: c.titolo.trim(), testo: c.testo.trim(), azione: str(c.azione, 40) || "Apri gli strumenti", link: links.has(c.link) ? c.link : "#strumenti" })) : null;
  if (out.perTe && out.perTe.length < 4) out.perTe = null;
  out.notizie = Array.isArray(a.notizie) ? a.notizie.map((n) => {
    const src = notizie[n.indice];
    if (!src || !str(n.titolo, 110) || !str(n.testo, 360)) return null;
    return { titolo: n.titolo.trim(), testo: n.testo.trim(), impatto: ["positivo", "negativo", "misto", "neutro"].includes(n.impatto) ? n.impatto : "neutro", fonte: src.fonte, url: src.url };
  }).filter(Boolean).slice(0, 6) : null;
  if (out.notizie && out.notizie.length < 3) out.notizie = null;
  return out;
}

function prompt(ctx) {
  return `Sei la redazione di "Eco Bussola", un'app italiana di educazione finanziaria per famiglie e risparmiatori senza esperienza.
Scrivi in italiano semplice e preciso, senza gergo, senza punti esclamativi, senza emoji.
Regole inderogabili:
- Usa SOLO i numeri forniti qui sotto; non inventare dati, date o fatti non presenti.
- Non consigliare mai di comprare o vendere titoli, fondi o criptovalute specifici. Puoi spiegare effetti concreti e strumenti generali (fondo di emergenza, conti deposito, titoli di Stato, costi bassi, diversificazione).
- Le notizie vanno riscritte con parole tue, mai copiando frasi dei titoli o delle descrizioni.
- Numeri in formato italiano (virgola decimale).

Edizione: ${ctx.edizione} del ${ctx.giorno}.

DATI (fonte ufficiale, con data):
${JSON.stringify(ctx.dati, null, 1)}

NOTIZIE DISPONIBILI (indice, fonte, titolo, descrizione):
${ctx.notizie.map((n, i) => `${i}. [${n.fonte}] ${n.titolo} — ${n.descr}`).join("\n")}

Rispondi SOLO con un oggetto JSON con questa forma:
{
 "titolo": "max 60 caratteri, due parti separate da una virgola, la seconda è quella che pesa sulle famiglie",
 "sintesi": "2-3 frasi che collegano mercati e portafoglio di casa",
 "climi": {
   "mercati": {"valore": 0-100 (alto = favorevole), "etichetta": "1-2 parole", "nota": "max 110 caratteri, motivata dai dati"},
   "famiglie": {"valore": 0-100 (alto = pressione sui prezzi forte), "etichetta": "1-2 parole", "nota": "max 110 caratteri"}
 },
 "perTe": [4 oggetti {"tema": "Liquidità"|"Tassi e mutuo"|"Investimenti"|"Spese", "titolo": "max 50 caratteri", "testo": "2-3 frasi con un esempio numerico concreto calcolato dai dati", "azione": "max 35 caratteri", "link": "#strumenti"|"#piano"|"#tutela"|"#fonti"|"#oggi-agenda"}],
 "notizie": [da 4 a 6 oggetti {"indice": numero della notizia scelta, "titolo": "riscritto, max 90 caratteri", "testo": "1-2 frasi su cosa è successo e perché conta per chi risparmia", "impatto": "positivo"|"negativo"|"misto"|"neutro"}]
}
Scegli le notizie più rilevanti per mercati, prezzi, tasse, lavoro e risparmio delle famiglie italiane.`;
}

// ---------------------------------------------------------------- testi di riserva (senza IA)

function fallbackTesti(ctx, V) {
  const f = V.ftsemib, inf = V.infl_it, bce = V.bce;
  const parteMerc = f && typeof f.var === "number" ? `Piazza Affari ${f.var >= 0 ? "+" : ""}${it(f.var)}%` : "Mercati in attesa";
  const parteFam = inf ? `inflazione al ${it(inf.valore, 1)}%` : "prezzi sotto osservazione";
  const scoreM = Math.max(5, Math.min(95, Math.round(50 + 12 * (((f?.var || 0) + (V.sp500?.var || 0)) / 2))));
  const scoreF = Math.max(5, Math.min(95, Math.round(20 + 11 * (inf?.valore || 2) + (V.benzina && V.benzina.valore > 1.9 ? 8 : 0))));
  const lab = (s, a) => (a ? (s >= 66 ? "Pressione alta" : s >= 40 ? "Moderata" : "Bassa") : (s >= 60 ? "Positivo" : s >= 40 ? "Variabile" : "Negativo"));
  const dep = RENDIMENTI.contoDeposito12m.max, depNet = dep * 0.74 - 0.2, infl = inf?.valore || 2;
  const perdita = 10000 * (1 - 1 / (1 + infl / 100));
  const prossima = BCE_RIUNIONI.find((d) => d > ctx.giorno);
  const rata = (P, r, y) => { const i = r / 1200, n = y * 12; return P * i / (1 - (1 + i) ** -n); };
  const dRata = rata(120000, 3.45, 20) - rata(120000, 3.2, 20);
  return {
    titolo: `${parteMerc}, ${parteFam}`,
    sintesi: [
      f ? `Il FTSE MIB è a ${it(f.valore, 0)} punti (${f.var >= 0 ? "+" : ""}${it(f.var)}% nella seduta).` : "",
      V.spread ? `Lo spread BTP-Bund è a ${it(V.spread.valore, 0)} punti base (media mensile).` : "",
      inf ? `L'inflazione italiana è al ${it(inf.valore, 1)}%: è il dato che pesa di più sul potere d'acquisto delle famiglie.` : "",
    ].filter(Boolean).join(" "),
    mercati: { valore: scoreM, etichetta: lab(scoreM), nota: "Calcolato dall'andamento di Piazza Affari e Wall Street nell'ultima seduta." },
    famiglie: { valore: scoreF, etichetta: lab(scoreF, true), nota: inf ? `Inflazione al ${it(infl, 1)}%${V.benzina ? `, benzina self a ${it(V.benzina.valore, 3)} €/l` : ""}.` : "Dati sui prezzi in aggiornamento." },
    perTe: [
      { tema: "Liquidità", titolo: "Il conto fermo perde valore", testo: `Con l'inflazione al ${it(infl, 1)}%, 10.000 € fermi a tasso zero perdono circa ${it(perdita, 0)} € di potere d'acquisto in un anno. I migliori conti deposito a 12 mesi rendono fino al ${it(dep)}% lordo, circa ${it(depNet)}% netto.`, azione: "Calcola il rendimento netto", link: "#strumenti" },
      { tema: "Tassi e mutuo", titolo: bce ? `Tasso BCE sui depositi al ${it(bce.valore)}%` : "Tassi BCE", testo: `${prossima ? `La prossima riunione BCE è il ${prossima.split("-").reverse().join("/")}. ` : ""}Per un mutuo variabile da 120.000 € a 20 anni, un rialzo di 0,25 punti vale circa ${it(dRata)} € in più al mese.`, azione: "Simula la tua rata", link: "#strumenti" },
      { tema: "Investimenti", titolo: "Il piano conta più della seduta", testo: `${f ? `Piazza Affari segna ${f.var >= 0 ? "+" : ""}${it(f.var)}% nella seduta${typeof f.mese === "number" ? ` e ${f.mese >= 0 ? "+" : ""}${it(f.mese, 1)}% in un mese` : ""}. ` : ""}Per chi investe a lungo termine contano costi bassi, diversificazione e versamenti regolari.`, azione: "Simula un piano di accumulo", link: "#strumenti" },
      { tema: "Spese", titolo: "Energia e carburanti", testo: `${V.benzina ? `La benzina self è in media a ${it(V.benzina.valore, 3)} €/l. ` : ""}Confrontare le offerte luce e gas sul Portale Offerte ARERA e i distributori sull'Osservaprezzi del Mimit è gratuito.`, azione: "Apri le fonti utili", link: "#fonti" },
    ],
    notizie: ctx.notizie.slice(0, 5).map((n) => ({ titolo: n.titolo, testo: "", impatto: null, fonte: n.fonte, url: n.url })),
  };
}

// ---------------------------------------------------------------- principale

async function main() {
  const src = await readFile(FILE, "utf8");
  const sandbox = { window: {} }; vm.runInNewContext(src, sandbox);
  const prev = sandbox.window.ECO || {};
  const prevVoce = (id) => { for (const g of prev.mercati || []) for (const v of g.voci) if (v.id === id) return v; return null; };
  const giorno = dayRome();
  const edizione = hourRome() < 13 ? "mattina" : "sera";
  const V = {};
  const serie = { ...(prev.serie || {}) };

  for (const [id, sym, nome, unita, dec, buono] of YAHOO) {
    const y = await safe("Yahoo " + sym, () => yahoo(sym));
    if (!y) continue;
    V[id] = { nome, unita, decimali: dec, buono, valore: round(y.valore, dec), var: round(y.var, 2), data: y.data, mese: y.mese, fonte: "Yahoo Finance", url: `https://finance.yahoo.com/quote/${encodeURIComponent(sym)}` };
    serie[id] = y.serie;
  }

  const dfr = await safe("BCE tasso depositi", () => ecb("FM.D.U2.EUR.4F.KR.DFR.LEV", 400));
  if (dfr) {
    const last = dfr.at(-1), chg = [...dfr].reverse().find((o) => o.v !== last.v);
    V.bce = { nome: "BCE depositi", unita: "%", decimali: 2, valore: last.v, var: null, delta: chg ? `da ${it(chg.v)}%` : "invariato", nota: `Tasso sui depositi in vigore dal ${(dfr[dfr.findLastIndex((o, i) => i > 0 && dfr[i - 1].v !== o.v)] || dfr[0]).t.split("-").reverse().join("/")}`, data: last.t, fonte: "BCE", url: "https://data.ecb.europa.eu/" };
  }
  const itY = await safe("BTP 10 anni", () => ecb("IRS.M.IT.L.L40.CI.0000.EUR.N.Z", 13));
  const deY = await safe("Bund 10 anni", () => ecb("IRS.M.DE.L.L40.CI.0000.EUR.N.Z", 13));
  if (itY) {
    const l = itY.at(-1), p = itY.at(-2);
    V.btp10 = { nome: "BTP 10 anni", unita: "%", decimali: 2, valore: l.v, var: null, delta: p ? `da ${it(p.v)}%` : "", buono: "giu", nota: `Media mensile (${l.t})`, data: l.t, fonte: "BCE", url: "https://data.ecb.europa.eu/" };
    serie.btp10 = itY.map((o) => o.v);
  }
  if (itY && deY) {
    const map = Object.fromEntries(deY.map((o) => [o.t, o.v]));
    const sp = itY.filter((o) => map[o.t] != null).map((o) => ({ t: o.t, v: round((o.v - map[o.t]) * 100, 0) }));
    if (sp.length) {
      const l = sp.at(-1), p = sp.at(-2);
      V.spread = { nome: "Spread BTP-Bund", unita: "pb", decimali: 0, valore: l.v, var: null, delta: p ? `da ${it(p.v, 0)}` : "", buono: "giu", nota: `Media mensile (${l.t}). Più basso è, meno costa il debito italiano`, data: l.t, fonte: "BCE", url: "https://data.ecb.europa.eu/" };
      serie.spread = sp.map((o) => o.v);
    }
  }
  const fu = await safe("Fed massimo", () => fred("DFEDTARU"));
  const fl = await safe("Fed minimo", () => fred("DFEDTARL"));
  if (fu && fl) V.fed = { nome: "Fed (USA)", unita: "%", valore: `${it(fl.v)}–${it(fu.v)}`, var: null, delta: "", nota: "Intervallo obiettivo dei Fed Funds", data: fu.t, fonte: "FRED", url: "https://fred.stlouisfed.org/series/DFEDTARU" };
  for (const [id, key, nome, nota] of [
    ["infl_it", "ICP.M.IT.N.000000.4.ANR", "Inflazione Italia", "Indice armonizzato IPCA, variazione annua"],
    ["infl_ez", "ICP.M.U2.N.000000.4.ANR", "Inflazione Eurozona", "Variazione annua, area euro"],
  ]) {
    const s = await safe(nome, () => ecb(key, 13));
    if (!s) continue;
    const l = s.at(-1), p = s.at(-2);
    V[id] = { nome, unita: "%", decimali: 1, valore: l.v, var: null, delta: p ? `da ${it(p.v, 1)}%` : "", buono: "giu", nota: `${nota} (${l.t})`, data: l.t, fonte: "BCE / Eurostat", url: "https://data.ecb.europa.eu/" };
    serie[id] = s.map((o) => o.v);
  }
  const carb = await safe("Carburanti Mimit", carburanti);
  if (carb) {
    const old = serie.benzina || [];
    const b = round(carb.benzina, 3);
    const lastDay = (prev.serieDate || {}).benzina;
    serie.benzina = lastDay === carb.data ? [...old.slice(0, -1), b] : [...old, b].slice(-60);
    V.benzina = { nome: "Benzina self", unita: "€/l", decimali: 3, valore: b, var: old.length ? round((b / old.at(-1) - 1) * 100, 2) : null, buono: "giu", nota: `Media nazionale self. Gasolio a ${it(carb.gasolio, 3)} €/l`, data: carb.data, fonte: "Mimit", url: "https://carburanti.mise.gov.it/" };
  }

  // Le voci non aggiornate tengono il valore precedente con la sua data originale.
  const GRUPPI = [
    ["Borse", ["ftsemib", "sp500", "dow", "nasdaq"]],
    ["Tassi", ["bce", "btp10", "spread", "fed"]],
    ["Prezzi in Italia", ["infl_it", "infl_ez", "benzina", "ttf"]],
    ["Valute e beni rifugio", ["eurusd", "oro", "brent", "btc"]],
  ];
  const NOTE = { ftsemib: "Indice principale di Piazza Affari", sp500: "Le 500 maggiori società USA", dow: "Indice storico di Wall Street", nasdaq: "Indice dei tecnologici USA", eurusd: "Un euro forte rende più economici gli acquisti in dollari", oro: "Bene rifugio, quotazione future", brent: "Riferimento per carburanti ed energia", btc: "Asset speculativo, molto volatile e non protetto", ttf: "Riferimento europeo per le bollette del gas" };
  const mercati = GRUPPI.map(([gruppo, ids]) => ({
    gruppo,
    voci: ids.map((id) => {
      const v = V[id];
      if (v) {
        const { mese, ...rest } = v;
        return { id, ...rest, nota: rest.nota || NOTE[id] || "" };
      }
      return prevVoce(id);
    }).filter(Boolean),
  }));
  const valOf = (id) => { for (const g of mercati) for (const v of g.voci) if (v.id === id) return v; return null; };
  const updatedCount = Object.keys(V).length;
  log("voci aggiornate:", updatedCount, Object.keys(V).join(", "));
  if (updatedCount < 4) throw new Error("Troppe fonti non raggiungibili: dati precedenti lasciati invariati.");

  const notizie = (await safe("notizie", notizieRss)) || [];
  const ctx = { giorno, edizione, notizie };
  ctx.dati =Object.fromEntries(mercati.flatMap((g) => g.voci).map((v) => [v.nome, { valore: v.valore, unita: v.unita, variazione_giornaliera_pct: v.var ?? null, confronto: v.delta || null, variazione_un_mese_pct: V[v.id]?.mese != null ? round(V[v.id].mese, 2) : null, data: v.data }]));
  ctx.dati["Conti deposito 12 mesi (lordo)"] = { min: RENDIMENTI.contoDeposito12m.min, max: RENDIMENTI.contoDeposito12m.max, unita: "%" };
  ctx.dati["Prossima riunione BCE"] = BCE_RIUNIONI.find((d) => d > giorno) || null;

  const VV = Object.fromEntries(mercati.flatMap((g) => g.voci).map((v) => [v.id, { ...v, mese: V[v.id]?.mese }]));
  const base = fallbackTesti(ctx, VV);
  let ai = null;
  if (notizie.length || Object.keys(V).length) {
    const p = prompt(ctx);
    ai = validAi(parseJson(await gemini(p)), notizie) || validAi(parseJson(await groq(p)), notizie);
  }
  if (!ai) log("IA non disponibile: uso i testi automatici di riserva");

  const agenda = [
    ...BCE_RIUNIONI.map((d) => ({ data: d, evento: "Riunione BCE sui tassi", perche: "Conta per mutui variabili, conti deposito e titoli di Stato" })),
    ...[0, 1].flatMap((k) => SCADENZE_FISCALI.map(([m, g, evento, perche]) => ({ data: `${+giorno.slice(0, 4) + k}-${String(m).padStart(2, "0")}-${String(g).padStart(2, "0")}`, evento, perche }))),
  ].filter((a) => a.data >= giorno).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 5);

  const serieDate = { ...(prev.serieDate || {}) };
  if (carb) serieDate.benzina = carb.data;

  const out = {
    aggiornato: isoRome(),
    edizione,
    testiIA: Boolean(ai),
    titolo: ai?.titolo || base.titolo,
    sintesi: ai?.sintesi || base.sintesi,
    climi: { mercati: ai?.mercati || base.mercati, famiglie: ai?.famiglie || base.famiglie },
    perTe: ai?.perTe || base.perTe,
    mercati,
    notizie: ai?.notizie || (base.notizie.length ? base.notizie : prev.notizie || []),
    agenda,
    rendimenti: RENDIMENTI,
    serie,
    serieDate,
  };
  await writeFile(FILE, "/* Dati del giorno, generati automaticamente due volte al giorno. */\nwindow.ECO = " + JSON.stringify(out, null, 2) + ";\n");
  log("data.js scritto:", out.edizione, out.aggiornato, ai ? "(testi IA)" : "(testi automatici)");
}

main().catch((e) => { console.error(e); process.exit(1); });
