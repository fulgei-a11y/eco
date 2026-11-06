/* Manovra 2027: le misure del disegno di legge di bilancio approvato dal Consiglio dei ministri il 28 ottobre 2026
   e le tappe in Parlamento. Sono proposte: diventano regole solo con la legge pubblicata in Gazzetta Ufficiale.
   stato: "proposta" (nel disegno di legge), "decreto" (già in vigore con decreto-legge da convertire), "legge" (approvata).
   Le date delle tappe sono quelle annunciate e possono cambiare: fatto = confermato. */
(function (root) {
  "use strict";
  var CAMERA = "https://www.camera.it", GOV = "https://www.governo.it";
  root.ECO_MANOVRA = {
    titolo: "Legge di bilancio 2027",
    valore: "circa 26 miliardi di euro nel 2027",
    verificata: "6 novembre 2026",
    tappe: [
      { data: "2026-10-28", fine: "2026-10-28", cosa: "Il Consiglio dei ministri approva il disegno di legge", fatto: true },
      { data: "2026-11-03", fine: "2026-11-03", cosa: "Il testo arriva alla Camera per la prima lettura" },
      { data: "2026-11-05", fine: "2026-11-12", cosa: "Audizioni in commissione Bilancio: Banca d'Italia, Istat, sindacati, imprese" },
      { data: "2026-11-16", fine: "2026-11-16", cosa: "Ultimo giorno per convertire il decreto con il bollo auto 2027" },
      { data: "2026-11-17", fine: "2026-11-17", cosa: "Termine per presentare le proposte di modifica" },
      { data: "2026-11-24", fine: "2026-11-24", cosa: "Parere della Commissione europea" },
      { data: "2026-12-14", fine: "2026-12-20", cosa: "Voto della Camera (data indicativa)" },
      { data: "2026-12-31", fine: "2026-12-31", cosa: "Approvazione definitiva al Senato e pubblicazione in Gazzetta" },
      { data: "2027-01-01", fine: "2027-01-01", cosa: "Le misure approvate entrano in vigore" }
    ],
    // per: famiglie, lavoro, casa, pensioni, auto, risparmio, partite-iva, altro
    misure: [
      { per: "lavoro", titolo: "Irpef: il 33% arriva fino a 55.000 €", stato: "proposta", art: "art. 9",
        testo: "Solo per il 2027 lo scaglione al 33% passa da 50.000 a 55.000 € di reddito; oltre si paga il 43%. Risparmio massimo 500 € l'anno, per circa 3,2 milioni di contribuenti. Dal 2028 si tornerebbe a 50.000 €, salvo proroga.", calc: true },
      { per: "lavoro", titolo: "Aumenti dei giovani tassati all'1%", stato: "proposta", art: "art. 44",
        testo: "Per i dipendenti privati nati dopo il 1997 con reddito fino a 28.000 €, la parte di stipendio 2027 che supera quella del 2026 sarebbe tassata all'1%, fino a 2.500 €." },
      { per: "lavoro", titolo: "Rinnovi dei contratti tassati al 5%", stato: "proposta", art: "art. 6",
        testo: "Gli aumenti pagati nel 2027 per i contratti rinnovati tra il 2024 e il 2027 sarebbero tassati al 5%, per i dipendenti privati con reddito 2026 fino a 33.000 €. Esclusi gli arretrati." },
      { per: "lavoro", titolo: "Notturni, festivi e turni al 15%", stato: "proposta", art: "art. 7",
        testo: "Per il 2026 e il 2027 le maggiorazioni per lavoro notturno, festivo e a turni sarebbero tassate al 15%, fino a 1.500 € l'anno, per i dipendenti privati con reddito fino a 40.000 €." },
      { per: "lavoro", titolo: "Fringe benefit: 1.000 €, 2.000 € con figli o sotto i 31 anni", stato: "proposta", art: "art. 45",
        testo: "Nel 2027 i benefit aziendali esentasse arriverebbero a 1.000 €, anche per rimborsare bollette, affitto e interessi del mutuo; 2.000 € per chi ha figli a carico o meno di 31 anni." },
      { per: "famiglie", titolo: "Bonus mamme stabile a 100 € al mese", stato: "proposta", art: "art. 57",
        testo: "Dal 2027 100 € al mese esentasse per le madri dipendenti e autonome con almeno due figli e reddito da lavoro fino a 40.000 €, fino ai 10 anni del secondo figlio (18 del più piccolo con tre o più figli)." },
      { per: "famiglie", titolo: "Salvadanaio di 100 € l'anno per ogni nato", stato: "proposta", art: "art. 58",
        testo: "Per i nati dal 2027 un conto INPS con 100 € l'anno dallo Stato fino ai 18 anni. I familiari possono aggiungere soldi con una detrazione del 19% fino a 1.000 € l'anno; a 18 anni il capitale può andare in un fondo pensione." },
      { per: "famiglie", titolo: "Congedo all'80% fino a sei mesi", stato: "proposta", art: "art. 59",
        testo: "I mesi di congedo parentale pagati all'80% salirebbero da tre a quattro per il primo figlio, cinque per il secondo e sei dal terzo, entro i 6 anni del bambino." },
      { per: "famiglie", titolo: "Voucher fino a 500 € al mese per genitori autonomi", stato: "proposta", art: "art. 60",
        testo: "Per tre mesi, al posto del congedo, per pagare baby-sitter o nido. Fondi limitati a 15 milioni l'anno." },
      { per: "pensioni", titolo: "Carta da 300 € per le cure degli over 75", stato: "proposta", art: "art. 53",
        testo: "Per chi ha compiuto 75 anni entro il 2026 con pensione 2025 fino a 28.000 €, per spese sanitarie come farmaci e visite." },
      { per: "pensioni", titolo: "Rivalutazione delle pensioni 2027", stato: "proposta", art: "art. 55",
        testo: "Aumento pieno con l'inflazione fino a quattro volte il minimo INPS, poi percentuali decrescenti: 85%, 53%, 47%, 37% e 32% per le pensioni più alte." },
      { per: "pensioni", titolo: "Ape sociale prorogata e fondo per l'uscita flessibile", stato: "proposta", art: "artt. 51-52",
        testo: "Ape sociale anche nel 2027 a 63 anni e 6 mesi. Un fondo da 850 milioni l'anno per il 2027-2029 per uscite più flessibili, con regole ancora da scrivere: nel testo non c'è l'uscita a 64 anni." },
      { per: "pensioni", titolo: "Liquidazione più rapida per i dipendenti pubblici", stato: "proposta", art: "art. 50",
        testo: "L'attesa per il TFS scenderebbe da nove a sei mesi per chi matura il diritto nel 2028 e a tre nel 2029; la prima rata salirebbe da 50.000 a 90.000 € dal 2031." },
      { per: "casa", titolo: "Affitti a canone concordato: cedolare al 5%, all'1% per inquilini under 36", stato: "proposta", art: "art. 5",
        testo: "Per i nuovi contratti del 2027 la cedolare secca scenderebbe dal 10% al 5%, all'1% se l'inquilino ha meno di 36 anni alla firma, per i canoni fino al 2031. Cedolare anche sui negozi fino a 200 m²: 21%, 10% nei capoluoghi delle città metropolitane." },
      { per: "casa", titolo: "Bonus casa confermati nel 2027", stato: "proposta", art: "art. 4",
        testo: "Ristrutturazione, ecobonus e sismabonus al 50% per l'abitazione principale e al 36% per le altre, su un massimo di 96.000 €. Bonus mobili al 50% su 5.000 €. Escluse le caldaie singole a combustibili fossili." },
      { per: "auto", titolo: "Bollo auto 2027 gratuito fino a 80 kW", stato: "decreto", art: "DL 162/2026 art. 2; DDL art. 3",
        testo: "Già in vigore per il 2027 con il decreto-legge del 17 settembre 2026, da convertire entro il 16 novembre: una sola auto a benzina o gasolio, anche ibrida, fino a 80 kW. La manovra propone di renderlo stabile dal 2027.", link: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2026-09-17;162~art2" },
      { per: "auto", titolo: "Contributo per l'auto delle famiglie numerose", stato: "proposta", art: "DDL",
        testo: "Fino a 385,71 € l'anno dall'INPS per le famiglie con più di tre figli, almeno uno minorenne, per un veicolo da 6 a 9 posti fino a 133 kW." },
      { per: "risparmio", titolo: "Tobin tax raddoppiata", stato: "proposta", art: "art. 15",
        testo: "Dopo il raddoppio del 2026, l'imposta sugli acquisti di azioni di società italiane con capitalizzazione sopra 500 milioni raddoppierebbe ancora: in Borsa dallo 0,2% allo 0,4%, fuori Borsa dallo 0,4% allo 0,8%. Su 10.000 € di azioni comprate in Borsa sarebbero 40 € invece di 20 €. Non riguarda chi compra ETF o fondi." },
      { per: "risparmio", titolo: "Più tasse per banche, assicurazioni ed energia", stato: "proposta", art: "artt. 18-21",
        testo: "Ires più alta di 3 punti per banche e assicurazioni per due anni e Irap più alta per le società dell'energia, che non potrebbero scaricare l'aumento sulle tariffe." },
      { per: "partite-iva", titolo: "Regime forfettario fino a 100.000 €", stato: "proposta", art: "art. 9",
        testo: "Il limite per l'imposta sostitutiva salirebbe da 85.000 a 100.000 €, ma l'esenzione IVA resterebbe a 85.000 €: tra 85.000 e 100.000 € si applicherebbe l'IVA. Serve il via libera dell'Unione europea." },
      { per: "altro", titolo: "Tabacchi, giochi e targhe personalizzate", stato: "proposta", art: "artt. 23-38",
        testo: "Accise sui tabacchi anticipate al 1° luglio 2027; puntata massima delle slot da 1 a 2 €; targhe personalizzate a pagamento da marzo 2027. Plastic e sugar tax rinviate al 1° luglio 2027." }
    ],
    fonti: [
      { n: "Camera dei deputati · disegno di legge e dossier", u: CAMERA },
      { n: "Governo · comunicato del Consiglio dei ministri", u: GOV },
      { n: "Normattiva · DL 162/2026", u: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2026-09-17;162~art2" }
    ]
  };
})(typeof window !== "undefined" ? window : globalThis);
