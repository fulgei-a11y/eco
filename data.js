/* Dati del giorno. Aggiornati due volte al giorno (mattina e sera). */
window.ECO = {
  "aggiornato": "2026-11-04T22:55:00+01:00",
  "edizione": "sera",
  "titolo": "Borse in festa, ma il carrello pesa",
  "sintesi": "Piazza Affari chiude a +2,18% trascinata dalle banche dopo la vittoria democratica alle elezioni di metà mandato negli Stati Uniti. Lo spread scende a 107 punti. Sul fronte domestico però l'inflazione italiana è balzata al 5,4% a ottobre per il caro energia: per le famiglie il potere d'acquisto resta sotto pressione.",
  "climi": {
    "mercati": { "valore": 68, "etichetta": "Positivo", "nota": "Rialzo diffuso su borse e titoli di Stato; petrolio in calo." },
    "famiglie": { "valore": 82, "etichetta": "Pressione alta", "nota": "Inflazione al 5,4%, energia +59% sui prezzi regolati, carburanti sopra 2 €/l." }
  },
  "perTe": [
    {
      "tema": "Liquidità",
      "titolo": "Il conto corrente fermo perde valore",
      "testo": "Con l'inflazione al 5,4%, 10.000 € fermi a tasso zero perdono oltre 500 € di potere d'acquisto in un anno. I migliori conti deposito vincolati a 12 mesi rendono intorno al 4% lordo, cioè circa 2,8% netto: proteggono in parte, non del tutto.",
      "azione": "Calcola il tuo rendimento netto",
      "link": "#strumenti"
    },
    {
      "tema": "Mutuo",
      "titolo": "BCE ferma, ma dicembre è aperto",
      "testo": "La BCE ha lasciato il tasso sui depositi al 2,5%. Diversi gestori considerano possibile un rialzo il 17 dicembre se l'energia non scende. Chi ha un mutuo variabile può verificare quanto salirebbe la rata con +0,25%.",
      "azione": "Vedi l'agenda",
      "link": "#oggi-agenda"
    },
    {
      "tema": "Investimenti",
      "titolo": "Giornata forte, piano invariato",
      "testo": "Il Dow ha fatto il miglior giorno post-elezioni da 44 anni. Per chi investe a lungo termine un singolo giorno non cambia la strategia: contano costi bassi, diversificazione e versamenti regolari.",
      "azione": "Simula un piano di accumulo",
      "link": "#strumenti"
    },
    {
      "tema": "Spese",
      "titolo": "Energia: il punto dove si risparmia di più",
      "testo": "Benzina self a 2,01 €/l e bollette in forte rialzo. Confrontare le offerte luce e gas sul Portale Offerte ARERA e i prezzi dei distributori sull'Osservaprezzi del Mimit è gratuito e può valere centinaia di euro l'anno.",
      "azione": "Apri le fonti utili",
      "link": "#fonti"
    }
  ],
  "mercati": [
    {
      "gruppo": "Borse",
      "voci": [
        { "id": "ftsemib", "nome": "FTSE MIB", "valore": 51031, "decimali": 0, "unita": "pt", "var": 2.18, "nota": "Chiusura, vicino ai massimi di un mese", "data": "2026-11-04", "fonte": "Askanews", "url": "https://askanews.it/2026/11/04/chiusura-sprint-per-piazza-affari-218-con-londa-dem-negli-usa/" },
        { "id": "sp500", "nome": "S&P 500", "valore": 7688.62, "decimali": 2, "unita": "pt", "var": 1.58, "nota": "Chiusura Wall Street", "data": "2026-11-04", "fonte": "TheStreet", "url": "https://www.thestreet.com/stock-market-today/stock-market-today-dow-jones-sp-500-nasdaq-updates-nov-04-2026" },
        { "id": "dow", "nome": "Dow Jones", "valore": 53356.12, "decimali": 2, "unita": "pt", "var": 3.03, "nota": "Miglior giorno post-midterm da 44 anni", "data": "2026-11-04", "fonte": "TheStreet", "url": "https://www.thestreet.com/stock-market-today/stock-market-today-dow-jones-sp-500-nasdaq-updates-nov-04-2026" },
        { "id": "nasdaq", "nome": "Nasdaq", "valore": 25736.51, "decimali": 2, "unita": "pt", "var": 1.44, "nota": "Tecnologici più cauti", "data": "2026-11-04", "fonte": "TheStreet", "url": "https://www.thestreet.com/stock-market-today/stock-market-today-dow-jones-sp-500-nasdaq-updates-nov-04-2026" }
      ]
    },
    {
      "gruppo": "Tassi",
      "voci": [
        { "id": "bce", "nome": "BCE depositi", "valore": 2.5, "decimali": 2, "unita": "%", "var": null, "delta": "invariato", "nota": "Decisione del 29 ottobre; prossima riunione 17 dicembre", "data": "2026-10-29", "fonte": "SoldiOnline", "url": "https://www.soldionline.it/notizie/macroeconomia/bce-decisione-tassi-interesse-29-ottobre-2026" },
        { "id": "btp10", "nome": "BTP 10 anni", "valore": 4.36, "decimali": 2, "unita": "%", "var": null, "delta": "da 4,45%", "buono": "giu", "nota": "Rendimento in calo, prezzi dei BTP in salita", "data": "2026-11-04", "fonte": "Askanews", "url": "https://askanews.it/2026/11/04/chiusura-sprint-per-piazza-affari-218-con-londa-dem-negli-usa/" },
        { "id": "spread", "nome": "Spread BTP-Bund", "valore": 107, "decimali": 0, "unita": "pb", "var": null, "delta": "da 114", "buono": "giu", "nota": "Più basso è, meno costa il debito italiano", "data": "2026-11-04", "fonte": "Askanews", "url": "https://askanews.it/2026/11/04/chiusura-sprint-per-piazza-affari-218-con-londa-dem-negli-usa/" },
        { "id": "fed", "nome": "Fed (USA)", "valore": "3,75–4,00", "unita": "%", "var": null, "delta": "invariato", "nota": "Decisione del 28 ottobre, 2 voti per un rialzo", "data": "2026-10-28", "fonte": "StockAnalysis", "url": "https://stockanalysis.com/news/fed-holds-rates-steady-oct-2026/" }
      ]
    },
    {
      "gruppo": "Prezzi in Italia",
      "voci": [
        { "id": "infl_it", "nome": "Inflazione Italia", "valore": 5.4, "decimali": 1, "unita": "%", "var": null, "delta": "da 4,2%", "buono": "giu", "nota": "Ottobre, stima provvisoria Istat (NIC). Carrello della spesa +2,5%", "data": "2026-10-30", "fonte": "Istat", "url": "https://www.istat.it/comunicato-stampa/prezzi-al-consumo-dati-provvisori-ottobre-2026/" },
        { "id": "infl_ez", "nome": "Inflazione Eurozona", "valore": 4.0, "decimali": 1, "unita": "%", "var": null, "delta": "da 3,8%", "buono": "giu", "nota": "Ottobre, stima flash Eurostat. Energia +20,8%", "data": "2026-11-04", "fonte": "ANSA", "url": "https://www.ansa.it/sito/notizie/economia/2026/11/04/linflazione-e-salita-al-4-nelleurozona-a-ottobre_322a1cda-fea3-4327-b408-42a920c45bfc.html" },
        { "id": "benzina", "nome": "Benzina self", "valore": 2.010, "decimali": 3, "unita": "€/l", "var": null, "delta": "in lieve calo", "buono": "giu", "nota": "Media nazionale Mimit. Gasolio a 2,241 €/l", "data": "2026-11-01", "fonte": "ANSA", "url": "https://www.ansa.it/sito/notizie/topnews/2026/11/01/mimit-carburanti-in-calo-prezzo-medio-self-benzina-a-2010-euro-gasolio_c7b14e0a-aec7-428d-a49d-c2f692324c2a.html" },
        { "id": "ttf", "nome": "Gas TTF", "valore": 98.6, "decimali": 1, "unita": "€/MWh", "var": -2.1, "buono": "giu", "nota": "Future novembre, riferimento per le bollette del gas", "data": "2026-10-29", "fonte": "SoldiOnline", "url": "https://www.soldionline.it/notizie/forex-commodities/gas-sotto-quota-100-euro-perche-il-future-ttf-scende-del-21" }
      ]
    },
    {
      "gruppo": "Valute e beni rifugio",
      "voci": [
        { "id": "eurusd", "nome": "Euro / Dollaro", "valore": 1.125, "decimali": 3, "unita": "$", "var": null, "delta": "dollaro debole", "nota": "Valore in seduta. Un euro forte rende più economici gli acquisti in dollari", "data": "2026-11-04", "fonte": "SoldiOnline", "url": "https://www.soldionline.it/notizie/azioni-italia/borsa-italiana-commento-giornata-4-novembre-2026" },
        { "id": "oro", "nome": "Oro", "valore": 4045, "decimali": 0, "unita": "$/oz", "var": 2.86, "nota": "Valore in seduta; futures in rialzo", "data": "2026-11-04", "fonte": "TheStreet", "url": "https://www.thestreet.com/stock-market-today/stock-market-today-dow-jones-sp-500-nasdaq-updates-nov-04-2026" },
        { "id": "brent", "nome": "Petrolio Brent", "valore": "< 100", "unita": "$/bbl", "var": null, "delta": "circa −10 $ nel giorno", "buono": "giu", "nota": "Sotto 100 $ per la prima volta da settimane, su speranze di fine del conflitto con l'Iran", "data": "2026-11-04", "fonte": "TheStreet", "url": "https://www.thestreet.com/stock-market-today/stock-market-today-dow-jones-sp-500-nasdaq-updates-nov-04-2026" },
        { "id": "btc", "nome": "Bitcoin", "valore": "> 78.000", "unita": "$", "var": null, "delta": "molto volatile", "nota": "Valore in seduta. Asset speculativo, non protetto", "data": "2026-11-04", "fonte": "SoldiOnline", "url": "https://www.soldionline.it/notizie/azioni-italia/borsa-italiana-commento-giornata-4-novembre-2026" }
      ]
    }
  ],
  "notizie": [
    {
      "titolo": "Midterm USA: i democratici conquistano Camera e Senato",
      "testo": "Il voto di metà mandato consegna il Congresso ai democratici. I mercati leggono un governo diviso come meno incertezza politica: Wall Street sale con forza, il dollaro si indebolisce.",
      "impatto": "positivo",
      "fonte": "CNN",
      "url": "https://www.cnn.com/2026/11/04/investing/us-markets-midterm-elections"
    },
    {
      "titolo": "Piazza Affari +2,18%, corrono le banche",
      "testo": "UniCredit, Mps e Intesa Sanpaolo guadagnano intorno al 5%. In calo invece tecnologici e infrastrutture energetiche come STMicroelectronics e Prysmian, per i timori sulla crescita dei data center negli Stati Uniti.",
      "impatto": "positivo",
      "fonte": "Askanews",
      "url": "https://askanews.it/2026/11/04/chiusura-sprint-per-piazza-affari-218-con-londa-dem-negli-usa/"
    },
    {
      "titolo": "Inflazione Eurozona al 4%, Italia la più colpita tra i grandi",
      "testo": "Eurostat stima l'inflazione dell'area euro al 4% a ottobre, spinta dall'energia. L'Italia sale al 5,6% sull'indice armonizzato, molto sopra Germania e Francia.",
      "impatto": "negativo",
      "fonte": "ANSA",
      "url": "https://www.ansa.it/sito/notizie/economia/2026/11/04/linflazione-e-salita-al-4-nelleurozona-a-ottobre_322a1cda-fea3-4327-b408-42a920c45bfc.html"
    },
    {
      "titolo": "Petrolio sotto 100 dollari, ma Hormuz resta un rischio",
      "testo": "Il Brent scende di circa 10 dollari sulle speranze di una fine del conflitto con l'Iran. Il traffico nello Stretto di Hormuz resta però esposto dopo l'incendio di quattro petroliere colpite da mine.",
      "impatto": "misto",
      "fonte": "TheStreet",
      "url": "https://www.thestreet.com/stock-market-today/stock-market-today-dow-jones-sp-500-nasdaq-updates-nov-04-2026"
    },
    {
      "titolo": "BCE: tassi fermi, Lagarde annuncia le dimissioni",
      "testo": "Il 29 ottobre la BCE ha confermato il tasso sui depositi al 2,5% all'unanimità, segnalando rischi al rialzo per l'inflazione dall'energia. Lagarde lascerà l'incarico dal 7 febbraio 2027.",
      "impatto": "neutro",
      "fonte": "SoldiOnline",
      "url": "https://www.soldionline.it/notizie/macroeconomia/bce-decisione-tassi-interesse-29-ottobre-2026"
    }
  ],
  "agenda": [
    { "data": "2026-11-17", "evento": "Istat: inflazione definitiva di ottobre", "perche": "Conferma o corregge il 5,4%" },
    { "data": "2026-11-30", "evento": "Seconda rata dell'acconto Irpef", "perche": "Scadenza fiscale per chi ha redditi oltre il 730 con acconto dovuto" },
    { "data": "2026-12-16", "evento": "Saldo IMU", "perche": "Seconde case e immobili non esenti" },
    { "data": "2026-12-17", "evento": "Riunione BCE sui tassi", "perche": "Possibile rialzo: conta per mutui variabili e conti deposito" }
  ],
  "rendimenti": {
    "contoDepositoLibero": { "min": 2.35, "max": 2.5 },
    "contoDeposito12m": { "min": 3.15, "max": 4.0 },
    "nota": "Tassi lordi rilevati a metà ottobre 2026. Verifica sempre il foglio informativo della banca.",
    "fonte": "Economia Italia",
    "url": "https://finanza.economia-italia.com/migliori-conti-deposito-novembre-dicembre-2026"
  },
  "storico": [
    { "t": "2026-11-03", "ftsemib": 49941, "spread": 114, "btp10": 4.45 },
    { "t": "2026-11-04", "ftsemib": 51031, "spread": 107, "btp10": 4.36, "sp500": 7688.62, "oro": 4045, "eurusd": 1.125, "benzina": 2.010, "infl_it": 5.4 }
  ]
};
