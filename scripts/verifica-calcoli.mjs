// Ricontrolla i calcolatori con i casi di prova di calcoli.js: se un risultato cambia, l'aggiornamento si ferma.
import { readFileSync } from "node:fs";
new Function(readFileSync(new URL("../calcoli.js", import.meta.url), "utf8"))();
const esiti = globalThis.ECO_CALC.verifica();
let ko = 0;
for (const e of esiti) {
  console.log(`${e.ok ? "ok " : "NO "} ${e.nome}: ${Number(e.valore).toFixed(4)} (atteso ${Number(e.atteso).toFixed(4)}, ${e.fonte})`);
  if (!e.ok) ko++;
}
console.log(`regole ${globalThis.ECO_CALC.regole.anno}, verificate il ${globalThis.ECO_CALC.regole.verificate}`);
if (ko) { console.error(`${ko} verifiche non superate`); process.exit(1); }
