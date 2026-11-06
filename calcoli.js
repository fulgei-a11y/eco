/* Calcoli con regole di legge, separati dalla pagina per poterli verificare in automatico.
   Ogni regola riporta la norma di riferimento. Da riverificare dopo ogni legge di bilancio. */
(function (root) {
  "use strict";
  var R = {
    anno: 2026,
    verificate: "5 novembre 2026",
    // Irpef (art. 11 TUIR, come modificato dalla L. 199/2025): 23% fino a 28.000, 33% fino a 50.000, 43% oltre
    scaglioni: [[28000, 0.23], [50000, 0.33], [Infinity, 0.43]],
    // Proposta per il solo 2027 (DDL Bilancio 2027, art. 9): il 33% arriva a 55.000. Non è ancora legge.
    proposta2027: { scaglioni: [[28000, 0.23], [55000, 0.33], [Infinity, 0.43]], fonte: "disegno di legge di bilancio 2027, art. 9" },
    contributiDipendente: 0.0919, // quota INPS a carico del dipendente nel settore privato (generale)
    // Coefficienti di trasformazione 2025-2026 (decreto interministeriale del 20 novembre 2024)
    coeff: { 57: 4.204, 58: 4.308, 59: 4.419, 60: 4.536, 61: 4.661, 62: 4.795, 63: 4.936, 64: 5.088, 65: 5.250, 66: 5.423, 67: 5.608, 68: 5.808, 69: 6.024, 70: 6.258, 71: 6.510 },
    aliquotaContributivaIVS: 0.33, // aliquota di computo per i dipendenti
    quotaTfr: 0.0691
  };

  function irpefLorda(r, sc) {
    var tot = 0, base = 0;
    (sc || R.scaglioni).forEach(function (s) { if (r > base) { tot += (Math.min(r, s[0]) - base) * s[1]; } base = s[0]; });
    return Math.max(0, tot);
  }
  // Detrazione per lavoro dipendente (art. 13 c. 1 e 1.1 TUIR), anno intero
  function detrazioneLavoro(rc, determinato) {
    var d;
    if (rc <= 15000) d = Math.max(1955, determinato ? 1380 : 690);
    else if (rc <= 28000) d = 1910 + 1190 * (28000 - rc) / 13000;
    else if (rc <= 50000) d = 1910 * (50000 - rc) / 22000;
    else d = 0;
    if (rc > 25000 && rc <= 35000) d += 65;
    return d;
  }
  // Cuneo fiscale (art. 1 c. 4-9 L. 207/2024): somma esente fino a 20.000 e ulteriore detrazione fino a 40.000
  function sommaEsente(redditoLavoro, rc) {
    if (rc > 20000) return 0;
    var p = redditoLavoro <= 8500 ? 0.071 : redditoLavoro <= 15000 ? 0.053 : 0.048;
    return redditoLavoro * p;
  }
  function ulterioreDetrazione(rc) {
    if (rc <= 20000 || rc > 40000) return 0;
    if (rc <= 32000) return 1000;
    return 1000 * (40000 - rc) / 8000;
  }
  // Trattamento integrativo (art. 1 DL 3/2020): 1.200 € fino a 15.000 se l'imposta lorda supera la detrazione meno 75 €
  function trattamentoIntegrativo(rc, lorda, detr) {
    return rc <= 15000 && lorda > detr - 75 ? 1200 : 0;
  }

  function bustaPaga(o) {
    var ral = Math.max(0, +o.ral || 0), mens = +o.mensilita || 13, add = Math.max(0, +o.addizionali || 0) / 100;
    var contr = ral * R.contributiDipendente;
    var rc = ral - contr;
    var sc = o.scaglioni || R.scaglioni;
    var lorda = irpefLorda(rc, sc);
    var detr = detrazioneLavoro(rc, o.determinato);
    var ult = ulterioreDetrazione(rc);
    var irpef = Math.max(0, lorda - detr - ult);
    var ti = trattamentoIntegrativo(rc, lorda, detr);
    var es = sommaEsente(rc, rc);
    var addiz = rc * add;
    var netto = ral - contr - irpef - addiz + ti + es;
    var marg = 0; sc.some(function (s) { if (rc <= s[0]) { marg = s[1]; return true; } return false; });
    return { ral: ral, contributi: contr, imponibile: rc, irpefLorda: lorda, detrazioneLavoro: detr, ulterioreDetrazione: ult, irpefNetta: irpef, trattamentoIntegrativo: ti, sommaEsente: es, addizionali: addiz, nettoAnnuo: netto, nettoMese: netto / mens, aliquotaMarginale: marg };
  }

  // TAEG di un acquisto a rate: tasso che rende uguali il credito ricevuto e i pagamenti (Dir. 2008/48/CE, allegato I)
  function taeg(o) {
    var credito = (+o.importo || 0) - (+o.speseIniziali || 0), n = Math.round(+o.rate || 0), pag = (+o.rata || 0) + (+o.speseRata || 0);
    if (credito <= 0 || n <= 0 || pag <= 0) return null;
    var vp = function (i) { var s = 0; for (var k = 1; k <= n; k++) s += pag / Math.pow(1 + i, k); return s; };
    if (pag * n < credito) return { taeg: NaN, totale: pag * n + (+o.speseIniziali || 0), costo: pag * n - credito };
    var lo = -0.99, hi = 1;
    for (var it = 0; it < 200; it++) { var mid = (lo + hi) / 2; if (vp(mid) > credito) lo = mid; else hi = mid; }
    var im = (lo + hi) / 2;
    var tan = (function () { var c = +o.importo || 0, r = +o.rata || 0; if (r * n <= c) return 0; var l = 0, h = 1; for (var t = 0; t < 200; t++) { var m = (l + h) / 2, s = 0; for (var k = 1; k <= n; k++) s += r / Math.pow(1 + m, k); if (s > c) l = m; else h = m; } return 12 * (l + h) / 2; })();
    return { taeg: Math.pow(1 + im, 12) - 1, tan: tan, totale: pag * n + (+o.speseIniziali || 0), costo: pag * n + (+o.speseIniziali || 0) - (+o.importo || 0) };
  }

  function rataMutuo(capitale, tassoAnnuo, anni) {
    var n = anni * 12, i = tassoAnnuo / 12;
    return i ? capitale * i / (1 - Math.pow(1 + i, -n)) : capitale / n;
  }

  // Comprare o affittare: patrimonio dopo N anni nelle due strade, a parità di soldi spesi ogni mese
  function compraAffitta(o) {
    var prezzo = +o.prezzo, ant = prezzo * (+o.anticipo / 100), costiAcq = prezzo * (+o.costiAcquisto / 100);
    var debito = prezzo - ant, rata = rataMutuo(debito, +o.tasso / 100, +o.durata);
    var anni = Math.max(1, Math.round(+o.orizzonte)), r = +o.rendimento / 100 / 12, g = +o.rivalutazione / 100;
    var affitto = +o.affitto, cresc = +o.crescitaAffitto / 100, spese = +o.speseProprietario / 100;
    var portafoglio = ant + costiAcq, residuo = debito, i = +o.tasso / 100 / 12, pagatoCasa = ant + costiAcq, pagatoAffitto = 0;
    for (var m = 1; m <= anni * 12; m++) {
      var valore = prezzo * Math.pow(1 + g, (m - 1) / 12);
      var costoProp = (m <= o.durata * 12 ? rata : 0) + valore * spese / 12;
      var aff = affitto * Math.pow(1 + cresc, Math.floor((m - 1) / 12));
      if (m <= o.durata * 12) residuo = Math.max(0, residuo * (1 + i) - rata);
      portafoglio = portafoglio * (1 + r) + (costoProp - aff);
      pagatoCasa += costoProp; pagatoAffitto += aff;
    }
    var casa = prezzo * Math.pow(1 + g, anni);
    return { rata: rata, patrimonioCompra: casa - residuo, patrimonioAffitto: portafoglio, valoreCasa: casa, debitoResiduo: residuo, pagatoCasa: pagatoCasa, pagatoAffitto: pagatoAffitto };
  }

  // Pensione contributiva stimata in euro di oggi, più la rendita del fondo pensione
  function pensione(o) {
    var eta = Math.round(+o.eta), uscita = Math.min(71, Math.max(57, Math.round(+o.etaUscita))), gia = Math.max(0, +o.anniVersati);
    var ral = +o.ral, cs = +o.crescitaStipendio / 100, rv = +o.rivalutazione / 100;
    var anniFuturi = Math.max(0, uscita - eta), mont = 0;
    // anni già lavorati: stessa retribuzione riportata indietro con la crescita reale
    for (var k = 1; k <= gia; k++) mont += ral / Math.pow(1 + cs, k) * R.aliquotaContributivaIVS * Math.pow(1 + rv, k);
    var ultimo = ral;
    for (var y = 0; y < anniFuturi; y++) { mont = mont * (1 + rv) + ultimo * R.aliquotaContributivaIVS; if (y < anniFuturi - 1) ultimo *= (1 + cs); }
    var coeff = R.coeff[uscita] / 100, pens = mont * coeff;
    // fondo pensione: versamenti mensili più TFR, rendimento reale netto
    var rf = +o.rendimentoFondo / 100, cap = +o.capitaleFondo || 0, vers = (+o.versamento || 0) * 12 + (o.tfr ? ral * R.quotaTfr : 0), sal = 1;
    for (var z = 0; z < anniFuturi; z++) { cap = cap * (1 + rf) + vers * sal; sal *= (1 + cs); }
    var rendita = cap * coeff;
    return { montante: mont, coefficiente: coeff * 100, pensioneAnnua: pens, ultimoStipendio: ultimo, sostituzione: ultimo ? pens / ultimo : 0, capitaleFondo: cap, renditaFondo: rendita, sostituzioneTotale: ultimo ? (pens + rendita) / ultimo : 0, anni: anniFuturi + gia };
  }

  // Casi di prova: confrontati con esempi pubblicati e con calcoli a mano. Lo script di aggiornamento li ricontrolla ogni volta.
  var verifiche = [
    { nome: "Detrazione lavoro, reddito 27.243 € (RAL 30.000)", fn: function () { return detrazioneLavoro(27243); }, atteso: 2044.26, tol: 1, fonte: "dipendenti.it, esempio RAL 30.000" },
    { nome: "Detrazione lavoro, reddito 16.345,80 € (RAL 18.000)", fn: function () { return detrazioneLavoro(16345.8); }, atteso: 2976.72, tol: 1, fonte: "dipendenti.it, esempio RAL 18.000" },
    { nome: "Detrazione lavoro, reddito 20.000 €", fn: function () { return detrazioneLavoro(20000); }, atteso: 2642.31, tol: 0.5, fonte: "informazionefiscale.it" },
    { nome: "Somma esente, RAL 18.000", fn: function () { return sommaEsente(16345.8, 16345.8); }, atteso: 784.60, tol: 0.5, fonte: "dipendenti.it, esempio RAL 18.000" },
    { nome: "Ulteriore detrazione, reddito 36.000 €", fn: function () { return ulterioreDetrazione(36000); }, atteso: 500, tol: 0.01, fonte: "L. 207/2024" },
    { nome: "Ulteriore detrazione, reddito 39.000 €", fn: function () { return ulterioreDetrazione(39000); }, atteso: 125, tol: 0.01, fonte: "L. 207/2024" },
    { nome: "Irpef lorda su 60.000 €", fn: function () { return irpefLorda(60000); }, atteso: 28000 * 0.23 + 22000 * 0.33 + 10000 * 0.43, tol: 0.01, fonte: "aliquote 2026" },
    { nome: "Irpef lorda su 60.000 € con la proposta 2027", fn: function () { return irpefLorda(60000, R.proposta2027.scaglioni); }, atteso: 28000 * 0.23 + 27000 * 0.33 + 5000 * 0.43, tol: 0.01, fonte: "DDL Bilancio 2027, art. 9" },
    { nome: "Risparmio massimo della proposta 2027", fn: function () { return irpefLorda(80000) - irpefLorda(80000, R.proposta2027.scaglioni); }, atteso: 500, tol: 0.01, fonte: "relazione tecnica: massimo 500 €" },
    { nome: "TAEG senza costi né interessi", fn: function () { return taeg({ importo: 1200, rate: 12, rata: 100 }).taeg; }, atteso: 0, tol: 1e-6, fonte: "definizione" },
    { nome: "TAEG 10.000 € in 36 rate al TAN 6%", fn: function () { return taeg({ importo: 10000, rate: 36, rata: rataMutuo(10000, 0.06, 3) }).taeg; }, atteso: Math.pow(1.005, 12) - 1, tol: 1e-6, fonte: "calcolo a mano" },
    { nome: "Rata mutuo 120.000 € al 3% per 20 anni", fn: function () { return rataMutuo(120000, 0.03, 20); }, atteso: 665.51, tol: 0.05, fonte: "formula alla francese" },
    { nome: "Coefficiente a 67 anni", fn: function () { return R.coeff[67]; }, atteso: 5.608, tol: 0, fonte: "decreto 20 novembre 2024" }
  ];
  function verifica() { return verifiche.map(function (v) { var x = v.fn(); return { nome: v.nome, valore: x, atteso: v.atteso, ok: Math.abs(x - v.atteso) <= v.tol, fonte: v.fonte }; }); }

  root.ECO_CALC = { regole: R, irpefLorda: irpefLorda, detrazioneLavoro: detrazioneLavoro, sommaEsente: sommaEsente, ulterioreDetrazione: ulterioreDetrazione, bustaPaga: bustaPaga, taeg: taeg, rataMutuo: rataMutuo, compraAffitta: compraAffitta, pensione: pensione, verifica: verifica };
})(typeof window !== "undefined" ? window : globalThis);
