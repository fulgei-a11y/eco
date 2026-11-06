/* Bonus e agevolazioni per le famiglie: regole in vigore nel 2026, decreti da convertire e proposte della manovra 2027.
   Ogni voce ha norma, fonte e una funzione che, dalle risposte date nel browser (mai inviate), dice se può interessare.
   esito: "si" = probabilmente sì, "forse" = dipende da requisiti che l'app non conosce, "no" = non sembra.
   Da riverificare dopo ogni legge di bilancio e a ogni nuova circolare INPS. */
(function (root) {
  "use strict";
  var INPS = "https://www.inps.it", AE = "https://www.agenziaentrate.gov.it";

  // ISEE scelto come fascia: il numero è il limite superiore della fascia; null = non lo so
  function iseeFino(r, max) { if (r.isee == null) return null; return r.isee <= max; }
  function iseeNota(ok, testo) { return ok === null ? ["forse", "Serve l'ISEE: con la DSU precompilata sul sito INPS si ottiene in pochi giorni. " + (testo || "")] : null; }
  var piccoli = function (r) { return r.eta.attesa || r.eta.m3 || r.eta.m3_9; };
  var minori = function (r) { return r.eta.attesa || r.eta.m3 || r.eta.m3_9 || r.eta.m10_17; };
  var figliUnder21 = function (r) { return minori(r) || r.eta.m18_20; };
  function regolaMamme(r) {
    if (!r.mamma) return ["no", "È per madri lavoratrici con reddito da lavoro fino a 40.000 €."];
    if (r.figli < 2) return ["no", "Servono almeno due figli."];
    if (r.figli === 2 && !piccoli(r)) return ["no", "Con due figli spetta fino al compimento dei 10 anni del più piccolo."];
    if (r.figli >= 3 && !minori(r)) return ["no", "Con tre o più figli spetta fino ai 18 anni del più piccolo."];
    if (r.figli === 2 && !r.eta.attesa && !r.eta.m3) return ["forse", "Spetta se il più piccolo non ha ancora compiuto 10 anni."];
    return ["si", ""];
  }

  var bonus = [
    {
      id: "auu", nome: "Assegno unico per i figli", cat: "Figli", stato: "vigore",
      importo: "Da 58,30 a 203,80 € al mese per ogni figlio minorenne nel 2026, secondo l'ISEE. Ci sono maggiorazioni per i figli sotto un anno, dal terzo figlio e per i figli con disabilità.",
      chi: "Tutte le famiglie con figli a carico, dal settimo mese di gravidanza fino ai 21 anni (dai 18 ai 20 se studiano, fanno tirocinio, lavorano con reddito basso o cercano lavoro). Senza limiti di età per i figli con disabilità. Spetta anche senza ISEE, ma al minimo.",
      come: "Domanda sul sito INPS o con l'app INPS Mobile, oppure con un patronato (gratuito). Poi si rinnova da sola: va rinnovato solo l'ISEE ogni anno.",
      attenzione: "Senza ISEE nuovo da marzo arriva l'importo minimo. Se presenti l'ISEE entro il 30 giugno ricevi gli arretrati.",
      scadenza: null, norma: "D.Lgs. 230/2021; importi 2026 nella circolare INPS n. 7 del 30 gennaio 2026",
      fonte: { n: "INPS · Assegno unico", u: "https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.assegno-unico-e-universale-per-i-figli-a-carico-55984.assegno-unico-e-universale-per-i-figli-a-carico.html" },
      verifica: function (r) {
        if (!figliUnder21(r)) return ["no", "È per figli sotto i 21 anni o con disabilità."];
        if (r.isee == null) return ["si", "Senza ISEE ricevi il minimo, 58,30 € al mese per figlio: con l'ISEE di solito ricevi di più."];
        if (r.isee <= 17468) return ["si", "Con il tuo ISEE spetta l'importo pieno: 203,80 € al mese per ogni figlio minorenne, più le maggiorazioni."];
        if (r.isee > 46582) return ["si", "Con un ISEE sopra 46.582 € spetta il minimo: 58,30 € al mese per ogni figlio minorenne."];
        return ["si", "Con il tuo ISEE l'importo è tra il minimo e il massimo: il simulatore sul sito INPS ti dà la cifra esatta."];
      }
    },
    {
      id: "nati", nome: "Bonus nuovi nati da 1.000 €", cat: "Figli", stato: "vigore",
      importo: "1.000 € in un'unica volta per ogni figlio nato, adottato o in affido preadottivo nel 2026. Si somma all'assegno unico.",
      chi: "Famiglie con ISEE fino a 40.000 €. Conta l'ISEE per le prestazioni familiari, che non include l'assegno unico e quindi spesso è più basso dell'ISEE ordinario.",
      come: "Domanda sul sito INPS (cerca «Bonus nuovi nati»), con l'app INPS Mobile o con un patronato.",
      attenzione: "La domanda va fatta entro 120 giorni dalla nascita o dall'adozione. Le domande sono accolte in ordine di arrivo finché ci sono fondi: meglio non aspettare.",
      scadenza: { testo: "Entro 120 giorni dalla nascita o dall'adozione" }, norma: "L. 207/2024; istruzioni nella circolare INPS n. 45 del 10 aprile 2026",
      fonte: { n: "INPS", u: INPS },
      verifica: function (r) {
        if (!r.eta.attesa) return ["no", "È per i bambini nati o adottati nel 2026."];
        var ok = iseeFino(r, 40000); var n = iseeNota(ok); if (n) return n;
        return ok ? ["si", "Ricorda: la domanda va fatta entro 120 giorni dalla nascita."] : ["forse", "L'ISEE per le prestazioni familiari esclude l'assegno unico: potrebbe scendere sotto i 40.000 €."];
      }
    },
    {
      id: "nido", nome: "Bonus asilo nido", cat: "Figli", stato: "vigore",
      importo: "Per i bambini nati dal 2024: fino a 3.600 € l'anno con ISEE per le prestazioni familiari fino a 40.000 €, 1.500 € oltre questa soglia o senza ISEE. Rimborsa le rette di nidi, micronidi e sezioni primavera.",
      chi: "Genitori di bambini sotto i 3 anni che frequentano un nido pubblico o privato autorizzato. In alternativa c'è un contributo per l'assistenza a casa dei bambini con malattie croniche che non possono andare al nido.",
      come: "Domanda sul sito INPS (cerca «Bonus asilo nido»), allegando le ricevute delle rette. Dal 2026 la domanda vale fino ai 3 anni: negli anni dopo basta scegliere i mesi da rimborsare.",
      attenzione: "Le domande sono accolte finché ci sono fondi. Di norma le mensilità dell'anno vanno chieste entro il 31 dicembre: controlla la data sulla pagina INPS.",
      scadenza: { data: "2026-12-31", testo: "Di norma entro il 31 dicembre per le rette dell'anno" }, norma: "L. 232/2016 art. 1 c. 355 e successive modifiche; circolare INPS n. 29 del 27 marzo 2026",
      fonte: { n: "INPS", u: INPS },
      verifica: function (r) {
        if (!(r.eta.m3 || r.eta.attesa)) return ["no", "È per bambini sotto i 3 anni."];
        if (!r.eta.m3) return ["forse", "Varrà quando il bambino inizierà il nido, entro i 3 anni."];
        if (r.isee == null) return ["si", "Senza ISEE spettano 1.500 € l'anno: con l'ISEE fino a 40.000 € si arriva a 3.600 €."];
        return ["si", r.isee <= 40000 ? "Con il tuo ISEE puoi arrivare a 3.600 € l'anno." : "Con un ISEE sopra 40.000 € spettano 1.500 € l'anno."];
      }
    },
    {
      id: "mamme", nome: "Bonus mamme lavoratrici 2026", cat: "Lavoro", stato: "vigore",
      importo: "60 € per ogni mese di lavoro nel 2026, fino a 720 €, pagati in un'unica volta. Non è tassato e non conta per l'ISEE.",
      chi: "Madri lavoratrici dipendenti o autonome con almeno due figli e reddito da lavoro fino a 40.000 €: con due figli fino ai 10 anni del più piccolo, con tre o più fino ai 18 anni del più piccolo. Escluse le lavoratrici domestiche. Non si somma con l'esonero dei contributi per le madri con tre figli.",
      come: "Domanda sul sito INPS nella pagina «Nuovo Bonus mamme 2026», o con un patronato.",
      attenzione: "Scade il 31 dicembre 2026 (il 31 gennaio 2027 solo se i requisiti si completano a dicembre). Il reddito di 40.000 € è quello da lavoro della madre, non l'ISEE.",
      scadenza: { data: "2026-12-31", testo: "Domanda entro il 31 dicembre 2026" }, norma: "L. 199/2025 art. 1 c. 207; circolare INPS n. 106 del 16 ottobre 2026",
      fonte: { n: "INPS", u: INPS },
      verifica: regolaMamme
    },
    {
      id: "congedo", nome: "Congedo parentale pagato all'80%", cat: "Lavoro", stato: "vigore",
      importo: "Tre mesi per la coppia di genitori pagati all'80% dello stipendio, se presi entro i 6 anni del bambino. Gli altri mesi sono pagati al 30%. Dal 2026 il congedo si può usare fino ai 14 anni del figlio.",
      chi: "Genitori lavoratori dipendenti. Per gli iscritti alla Gestione separata le regole sono diverse.",
      come: "Domanda al datore di lavoro e all'INPS prima di iniziare il congedo, sul sito o con un patronato.",
      attenzione: "I mesi all'80% si perdono se non si usano entro i 6 anni del bambino. I mesi di congedo contano anche per la pensione.",
      scadenza: null, norma: "D.Lgs. 151/2001 art. 34, come modificato dalle leggi di bilancio 2024, 2025 e 2026",
      fonte: { n: "INPS", u: INPS },
      verifica: function (r) {
        if (!r.dip) return ["no", "È per i genitori lavoratori dipendenti."];
        if (r.eta.attesa || r.eta.m3) return ["si", "Se non li avete ancora usati, i tre mesi all'80% vanno presi entro i 6 anni del bambino."];
        if (r.eta.m3_9) return ["forse", "I mesi all'80% valgono solo entro i 6 anni del bambino."];
        if (r.eta.m10_17) return ["forse", "Dopo i 6 anni il congedo è pagato al 30%, fino ai 14 anni del figlio."];
        return ["no", "Serve un figlio sotto i 14 anni."];
      }
    },
    {
      id: "bollette", nome: "Bonus sociale luce, gas e acqua", cat: "Casa", stato: "vigore",
      importo: "Uno sconto direttamente in bolletta, che cambia con il numero di persone in famiglia e i consumi. Esiste anche il bonus rifiuti (TARI).",
      chi: "Famiglie con ISEE fino a 9.796 € (soglia dal 2026), oppure fino a 20.000 € con almeno quattro figli a carico. Chi usa apparecchi medici salvavita ha un bonus luce senza limiti di ISEE.",
      come: "È automatico: basta presentare la DSU per l'ISEE. Lo sconto arriva in bolletta nei mesi successivi.",
      attenzione: "Se non rinnovi l'ISEE ogni anno, lo sconto si ferma.",
      scadenza: null, norma: "Delibera ARERA n. 2/2026/R/com",
      fonte: { n: "ARERA", u: "https://www.arera.it" },
      verifica: function (r) {
        var ok = iseeFino(r, 9796);
        if (ok === null) return ["forse", "Serve l'ISEE: se è sotto 9.796 € (o 20.000 € con quattro figli) lo sconto arriva da solo."];
        if (ok) return ["si", "È automatico: tieni l'ISEE sempre rinnovato."];
        if (r.figli >= 4) { if (r.isee <= 17468) return ["si", "Con quattro o più figli la soglia è 20.000 €."]; if (r.isee <= 30000) return ["forse", "Con quattro o più figli la soglia è 20.000 €: dipende dal tuo ISEE esatto."]; }
        return ["no", "La soglia è 9.796 € di ISEE (20.000 € con quattro figli)."];
      }
    },
    {
      id: "carta", nome: "Carta Dedicata a te", cat: "Spesa", stato: "vigore",
      importo: "500 € nel 2026 e altri 500 € nel 2027 su una carta prepagata di Poste Italiane, per comprare alimenti di prima necessità.",
      chi: "Famiglie con ISEE ordinario fino a 15.000 €, con priorità a quelle di almeno tre persone con figli minori. Le carte sono limitate e ripartite tra i Comuni: avere l'ISEE sotto soglia non basta. Esclusi i beneficiari dell'Assegno di inclusione.",
      come: "Non si fa domanda: l'INPS prepara le liste dall'ISEE e il Comune avvisa chi è stato scelto.",
      attenzione: "Se il Comune ti avvisa, attiva la carta con il primo acquisto entro la data indicata (per il 2026 il 16 dicembre), altrimenti la perdi.",
      scadenza: { data: "2026-12-16", testo: "Primo acquisto entro il 16 dicembre per chi l'ha ricevuta" }, norma: "Decreto attuativo 2026 dei ministeri dell'Agricoltura, dell'Economia e del Lavoro",
      fonte: { n: "INPS", u: INPS },
      verifica: function (r) {
        var ok = iseeFino(r, 15000); var n = iseeNota(ok, "Senza ISEE non si entra nelle liste."); if (n) return n;
        if (!ok) return ["no", "È per ISEE fino a 15.000 €."];
        return ["forse", "Dipende dalle carte assegnate al tuo Comune e dalle priorità: chiedi ai servizi sociali."];
      }
    },
    {
      id: "adi", nome: "Assegno di inclusione", cat: "Sostegno", stato: "vigore",
      importo: "Fino a 6.500 € l'anno, moltiplicati per la scala che tiene conto delle persone in famiglia, più fino a 3.640 € l'anno per l'affitto. Si riceve sulla Carta di inclusione.",
      chi: "Famiglie con ISEE fino a 10.140 € e almeno una persona minorenne, con disabilità, con più di 60 anni o seguita dai servizi sociali. Ci sono limiti anche di reddito e di patrimonio.",
      come: "Domanda sul sito INPS, al CAF o al patronato, poi iscrizione alla piattaforma SIISL e firma del patto di attivazione digitale.",
      attenzione: "Va rinnovato dopo 18 mesi: dal 2026 non c'è più il mese di stop, ma la prima mensilità dopo il rinnovo è dimezzata.",
      scadenza: null, norma: "DL 48/2023; modifiche della L. 199/2025",
      fonte: { n: "Ministero del Lavoro", u: "https://www.lavoro.gov.it" },
      verifica: function (r) {
        var ok = iseeFino(r, 10140); var n = iseeNota(ok); if (n) return (minori(r) || r.fragile) ? n : ["no", "Serve in famiglia una persona minorenne, con disabilità o con più di 60 anni."];
        if (!ok) return ["no", "È per ISEE fino a 10.140 €."];
        if (!(minori(r) || r.fragile)) return ["no", "Serve in famiglia una persona minorenne, con disabilità o con più di 60 anni."];
        return ["forse", "Contano anche reddito familiare e patrimonio: verifica al patronato."];
      }
    },
    {
      id: "psico", nome: "Bonus psicologo", cat: "Salute", stato: "vigore",
      importo: "Fino a 1.500 € con ISEE sotto 15.000 €, 1.000 € tra 15.000 e 30.000 €, 500 € tra 30.000 e 50.000 €. Copre fino a 50 € a seduta di psicoterapia.",
      chi: "Persone residenti in Italia con ISEE fino a 50.000 €. Per i minorenni fa domanda il genitore.",
      come: "Domanda sul sito INPS nella finestra annuale; poi l'INPS fa la graduatoria per ISEE e invia un codice da dare al terapeuta.",
      attenzione: "Al 6 novembre 2026 l'INPS non ha ancora aperto le domande per il 2026 (nel 2025 erano dal 15 settembre al 14 novembre). Prepara l'ISEE per tempo. La prima seduta va fatta entro 60 giorni dall'assegnazione.",
      scadenza: null, norma: "DL 228/2021 art. 1-quater e successive leggi di bilancio",
      fonte: { n: "INPS", u: INPS },
      verifica: function (r) {
        if (r.isee == null) return ["forse", "Serve l'ISEE fino a 50.000 €. È utile solo se tu o un familiare avete bisogno di un percorso di psicoterapia."];
        if (r.isee > 50000) return ["no", "È per ISEE fino a 50.000 €."];
        return ["forse", "Interessa solo se tu o un familiare avete bisogno di psicoterapia. Le domande 2026 non sono ancora aperte."];
      }
    },
    {
      id: "figli21", nome: "Detrazione per i figli tra 21 e 29 anni", cat: "Tasse", stato: "vigore",
      importo: "Fino a 950 € in meno di Irpef per ogni figlio a carico, che si riducono al crescere del reddito: con un figlio è 950 × (95.000 − reddito) / 95.000. Con 30.000 € di reddito sono circa 650 €.",
      chi: "Genitori con figli dai 21 ai 29 anni fiscalmente a carico: reddito del figlio fino a 4.000 € se ha al massimo 24 anni, fino a 2.840,51 € dai 25 anni. Senza limiti di età per i figli con disabilità.",
      come: "In busta paga, chiedendola al datore di lavoro, oppure nel 730.",
      attenzione: "Sotto i 21 anni non c'è detrazione perché c'è l'assegno unico; dai 30 anni si perde, salvo disabilità.",
      scadenza: null, norma: "Art. 12 TUIR come modificato dalla L. 207/2024",
      fonte: { n: "Agenzia delle Entrate", u: AE },
      verifica: function (r) { return r.eta.m21_29 ? ["si", "Controlla che il figlio resti sotto il limite di reddito per essere a carico."] : ["no", "È per figli a carico tra 21 e 29 anni."]; }
    },
    {
      id: "spese", nome: "Spese da detrarre nel 730", cat: "Tasse", stato: "vigore",
      importo: "Il 19% di molte spese torna come rimborso o minori tasse: spese mediche e farmaci oltre 129,11 €, interessi del mutuo prima casa, spese per la scuola e l'università, attività sportive dei figli, veterinario, assicurazioni vita e infortuni.",
      chi: "Chi paga l'Irpef e presenta il 730 o il modello Redditi. Sopra 75.000 € di reddito c'è un tetto alle spese detraibili, che non riguarda le spese sanitarie.",
      come: "Conserva scontrini parlanti e ricevute, e paga con carta o bonifico: per quasi tutte le spese i contanti non danno diritto alla detrazione (fanno eccezione farmaci e dispositivi medici e le prestazioni del servizio sanitario).",
      attenzione: "Molte spese sono già nel 730 precompilato, ma non tutte: controllale prima di inviarlo.",
      scadenza: null, norma: "Art. 15 TUIR",
      fonte: { n: "Agenzia delle Entrate", u: AE },
      verifica: function () { return ["si", "Vale per quasi tutte le famiglie che pagano l'Irpef."]; }
    },
    {
      id: "casa", nome: "Bonus ristrutturazione e mobili", cat: "Casa", stato: "vigore",
      importo: "Nel 2026: 50% delle spese di ristrutturazione sulla casa dove abiti come proprietario, 36% sulle altre, su un massimo di 96.000 € per casa, recuperato in 10 anni. Bonus mobili ed elettrodomestici al 50% su 5.000 €, solo insieme a una ristrutturazione.",
      chi: "Proprietari e titolari di diritti reali che pagano l'Irpef. Lo sconto vale fino a quanta Irpef paghi ogni anno.",
      come: "Pagamento con bonifico «parlante» indicando la norma; poi la detrazione nel 730 per 10 anni.",
      attenzione: "Le caldaie singole a gas o gasolio sono escluse. La manovra 2027 propone di mantenere le stesse percentuali anche nel 2027.",
      scadenza: null, norma: "Art. 16-bis TUIR; L. 199/2025",
      fonte: { n: "Agenzia delle Entrate", u: AE },
      verifica: function (r) { return r.casa === "proprieta" ? ["forse", "Interessa se hai in programma lavori in casa."] : ["no", "È per chi è proprietario della casa."]; }
    },
    {
      id: "bollo", nome: "Bollo auto 2027 gratuito fino a 80 kW", cat: "Auto", stato: "decreto",
      importo: "Nel 2027 niente bollo su una sola auto a benzina o gasolio, anche ibrida, fino a 80 kW (circa 109 cavalli), regolarmente assicurata. In alternativa su una moto o un motorino a benzina, se non hai un'auto che rientra.",
      chi: "Persone fisiche. Con più auto che rientrano, l'esenzione va a quella con meno kW. Non ci sono limiti di reddito o di ISEE.",
      come: "Secondo il decreto non serve fare domanda. La potenza è sul libretto alla voce P.2.",
      attenzione: "È un decreto-legge già in vigore, ma il Parlamento deve convertirlo in legge entro il 16 novembre 2026 e il testo può cambiare. I bolli che scadono nel 2026 vanno pagati normalmente.",
      scadenza: null, norma: "DL 17 settembre 2026 n. 162, art. 2",
      fonte: { n: "Normattiva · DL 162/2026", u: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2026-09-17;162~art2" },
      verifica: function (r) { return r.auto ? ["si", "Controlla la voce P.2 del libretto: deve essere 80 kW o meno."] : ["no", "È per chi ha un'auto a benzina o gasolio fino a 80 kW, o una moto."]; }
    },

    // Proposte della manovra 2027: non ancora legge
    {
      id: "m-salvadanaio", nome: "Salvadanaio «Valore nuovi nati»", cat: "Figli", stato: "proposta",
      importo: "Per ogni bambino nato dal 2027 un conto INPS con 100 € l'anno versati dallo Stato fino ai 18 anni (1.800 € in tutto). I familiari possono aggiungere soldi, detraibili al 19% fino a 1.000 € l'anno.",
      chi: "Tutti i nati dal 1° gennaio 2027. Le somme non sono tassate né pignorabili e non si possono ritirare prima dei 18 anni, salvo emergenze autorizzate dal giudice tutelare.",
      come: "Le regole arriveranno con un decreto entro 180 giorni dalla legge.",
      attenzione: "È una proposta del disegno di legge di bilancio (art. 58): può cambiare in Parlamento.",
      scadenza: null, norma: "DDL Bilancio 2027, art. 58",
      fonte: { n: "Camera dei deputati", u: "https://www.camera.it" },
      verifica: function (r) { return r.eta.attesa ? ["forse", "Varrebbe per i bambini nati dal 2027."] : ["no", "Varrebbe per i nati dal 2027."]; }
    },
    {
      id: "m-mamme", nome: "Bonus mamme 2027: 100 € al mese", cat: "Lavoro", stato: "proposta",
      importo: "Dal 2027 il bonus mamme diventerebbe stabile e salirebbe a 100 € al mese esentasse.",
      chi: "Madri dipendenti e autonome con almeno due figli e reddito da lavoro fino a 40.000 €: fino ai 10 anni del secondo figlio, o fino ai 18 del più piccolo con tre o più figli.",
      come: "Da definire dopo l'approvazione.",
      attenzione: "Proposta del disegno di legge di bilancio (art. 57): può cambiare in Parlamento.",
      scadenza: null, norma: "DDL Bilancio 2027, art. 57",
      fonte: { n: "Camera dei deputati", u: "https://www.camera.it" },
      verifica: function (r) { var e = regolaMamme(r); return e[0] === "si" ? ["forse", "Se approvato, nel 2027 passeresti da 60 a 100 € al mese."] : e; }
    },
    {
      id: "m-congedo", nome: "Congedo all'80% più lungo", cat: "Lavoro", stato: "proposta",
      importo: "I mesi pagati all'80% salirebbero da tre a quattro per il primo figlio, cinque per il secondo e sei dal terzo, sempre entro i 6 anni del bambino.",
      chi: "Genitori dipendenti, per i congedi che terminano dopo il 31 dicembre 2026.",
      come: "Da definire dopo l'approvazione.",
      attenzione: "Proposta del disegno di legge di bilancio (art. 59): può cambiare in Parlamento.",
      scadenza: null, norma: "DDL Bilancio 2027, art. 59",
      fonte: { n: "Camera dei deputati", u: "https://www.camera.it" },
      verifica: function (r) { return r.dip && (r.eta.attesa || r.eta.m3 || r.eta.m3_9) ? ["forse", "Se approvato, avreste più mesi all'80% entro i 6 anni del bambino."] : ["no", "Varrebbe per genitori dipendenti con figli sotto i 6 anni."]; }
    },
    {
      id: "m-voucher", nome: "Voucher baby-sitter per genitori autonomi", cat: "Lavoro", stato: "proposta",
      importo: "Fino a 500 € al mese per tre mesi per baby-sitter o nido, al posto del congedo parentale.",
      chi: "Genitori lavoratori autonomi. Fondi limitati a 15 milioni l'anno.",
      come: "Da definire dopo l'approvazione.",
      attenzione: "Proposta del disegno di legge di bilancio (art. 60): può cambiare in Parlamento.",
      scadenza: null, norma: "DDL Bilancio 2027, art. 60",
      fonte: { n: "Camera dei deputati", u: "https://www.camera.it" },
      verifica: function (r) { return r.aut && (r.eta.attesa || r.eta.m3) ? ["forse", "Se approvato, potrebbe aiutarti nei primi anni del bambino."] : ["no", "Varrebbe per genitori autonomi con bambini piccoli."]; }
    },
    {
      id: "m-over75", nome: "Carta per le cure degli over 75", cat: "Salute", stato: "proposta",
      importo: "300 € per spese sanitarie fuori dal servizio pubblico, come farmaci e visite specialistiche.",
      chi: "Chi ha compiuto 75 anni entro la fine del 2026 e nel 2025 aveva una pensione fino a 28.000 €.",
      come: "Da definire dopo l'approvazione.",
      attenzione: "Proposta del disegno di legge di bilancio (art. 53): può cambiare in Parlamento.",
      scadenza: null, norma: "DDL Bilancio 2027, art. 53",
      fonte: { n: "Camera dei deputati", u: "https://www.camera.it" },
      verifica: function (r) { return r.over75 ? ["forse", "Se approvata, la riceverebbe chi ha più di 75 anni con pensione fino a 28.000 €."] : ["no", "Varrebbe per chi ha più di 75 anni."]; }
    },
    {
      id: "m-fringe", nome: "Fringe benefit 2027 fino a 2.000 €", cat: "Lavoro", stato: "proposta",
      importo: "Nel 2027 i benefit aziendali esentasse arriverebbero a 1.000 €, anche come rimborso di bollette, affitto e interessi del mutuo; 2.000 € per chi ha meno di 31 anni o figli a carico.",
      chi: "Lavoratori dipendenti, se l'azienda decide di offrirli.",
      come: "Li riconosce il datore di lavoro in busta paga.",
      attenzione: "Proposta del disegno di legge di bilancio (art. 45): può cambiare in Parlamento.",
      scadenza: null, norma: "DDL Bilancio 2027, art. 45",
      fonte: { n: "Camera dei deputati", u: "https://www.camera.it" },
      verifica: function (r) { return r.dip ? ["forse", r.figli > 0 ? "Con figli a carico il limite salirebbe a 2.000 €: chiedi in azienda se li prevede." : "Chiedi in azienda se prevede benefit: il limite sarebbe 1.000 €."] : ["no", "Varrebbe per i lavoratori dipendenti."]; }
    },
    {
      id: "m-auto", nome: "Contributo auto per famiglie numerose", cat: "Auto", stato: "proposta",
      importo: "Fino a 385,71 € l'anno dall'INPS per un veicolo da 6 a 9 posti fino a 133 kW.",
      chi: "Famiglie con più di tre figli, di cui almeno uno minorenne.",
      come: "Da definire dopo l'approvazione.",
      attenzione: "Proposta del disegno di legge di bilancio: può cambiare in Parlamento.",
      scadenza: null, norma: "DDL Bilancio 2027",
      fonte: { n: "Camera dei deputati", u: "https://www.camera.it" },
      verifica: function (r) { return r.figli >= 4 && minori(r) ? ["forse", "Varrebbe se avete un veicolo da 6 a 9 posti."] : ["no", "Varrebbe per famiglie con più di tre figli."]; }
    }
  ];

  root.ECO_BONUS = { verificati: "6 novembre 2026", bonus: bonus };
})(typeof window !== "undefined" ? window : globalThis);
