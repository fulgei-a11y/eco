// Ricontrolla i calcolatori con i casi di prova di calcoli.js: se un risultato cambia, l'aggiornamento si ferma.
// Controlla anche che le schede di bonus.js e manovra.js siano complete e che le verifiche dei bonus diano esiti sensati.
import { readFileSync } from "node:fs";
const carica = (f) => new Function(readFileSync(new URL("../" + f, import.meta.url), "utf8"))();
carica("calcoli.js");
const esiti = globalThis.ECO_CALC.verifica();
let ko = 0;
for (const e of esiti) {
  console.log(`${e.ok ? "ok " : "NO "} ${e.nome}: ${Number(e.valore).toFixed(4)} (atteso ${Number(e.atteso).toFixed(4)}, ${e.fonte})`);
  if (!e.ok) ko++;
}
console.log(`regole ${globalThis.ECO_CALC.regole.anno}, verificate il ${globalThis.ECO_CALC.regole.verificate}`);

carica("bonus.js");
carica("manovra.js");
const B = globalThis.ECO_BONUS, M = globalThis.ECO_MANOVRA;
const no = (msg) => { console.error("NO  " + msg); ko++; };
const vuote = { figli: 0, eta: {}, isee: null, casa: null, dip: false, aut: false, mamma: false, fragile: false, over75: false, auto: false };
const fam = { figli: 2, eta: { attesa: true, m3_9: true }, isee: 15000, casa: "affitto", dip: true, aut: false, mamma: true, fragile: false, over75: false, auto: true };
const ids = new Set();
for (const b of B.bonus) {
  if (ids.has(b.id)) no(`bonus ripetuto: ${b.id}`); ids.add(b.id);
  for (const k of ["nome", "importo", "chi", "come", "norma"]) if (!b[k]) no(`${b.id}: manca ${k}`);
  if (!["vigore", "decreto", "proposta"].includes(b.stato)) no(`${b.id}: stato sconosciuto`);
  if (!/^https:\/\//.test(b.fonte?.u || "")) no(`${b.id}: fonte senza link`);
  if (b.scadenza?.data && !/^\d{4}-\d{2}-\d{2}$/.test(b.scadenza.data)) no(`${b.id}: data non valida`);
  for (const r of [vuote, fam]) { const e = b.verifica(r); if (!Array.isArray(e) || !["si", "forse", "no"].includes(e[0])) no(`${b.id}: esito non valido`); }
}
const atteso = { auu: "si", nati: "si", mamme: "si", bollette: "no", bollo: "si", nido: "forse" };
for (const [id, e] of Object.entries(atteso)) { const b = B.bonus.find((x) => x.id === id); if (!b || b.verifica(fam)[0] !== e) no(`${id}: per la famiglia di prova atteso «${e}»`); }
for (const t of M.tappe) if (!/^\d{4}-\d{2}-\d{2}$/.test(t.data) || t.fine < t.data) no(`tappa con date non valide: ${t.cosa}`);
for (const m of M.misure) if (!m.titolo || !m.testo || !m.art) no(`misura incompleta: ${m.titolo}`);
console.log(`bonus: ${B.bonus.length} schede verificate il ${B.verificati}; manovra: ${M.misure.length} misure, ${M.tappe.length} tappe`);

if (ko) { console.error(`${ko} verifiche non superate`); process.exit(1); }
