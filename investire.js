/* Investire con senso critico: schede degli strumenti, percorso in 10 lezioni e trappole della mente.
   Contenuti educativi e generali: non sono raccomandazioni personalizzate né inviti a comprare o vendere. */

window.ECO_INV = {
  /* Voti da 1 a 5. rischio: quanto può oscillare o perdere. costi: quanto costa tenerlo (5 = caro).
     liquidita: quanto in fretta torni ai soldi senza perdite (5 = subito). complessita: quanto è difficile capirlo.
     inflazione: quanto protegge il potere d'acquisto nel lungo periodo. anni: orizzonte minimo sensato. */
  strumenti: [
    {
      id: "conto", nome: "Conto corrente", famiglia: "Liquidità", dato: "dep_conto", anni: 0,
      voti: { rischio: 1, costi: 2, liquidita: 5, complessita: 1, inflazione: 1 },
      cosa: "Il conto per entrate, spese e bonifici. Serve a pagare, non a far crescere i risparmi.",
      guadagno: "Quasi niente: il tasso medio pagato dalle banche italiane sui conti delle famiglie è vicino allo zero.",
      rischi: ["Con inflazione alta perde potere d'acquisto ogni mese", "Canoni e commissioni possono superare gli interessi"],
      costi: "Canone mensile, carte, bonifici istantanei: confronta il costo annuo totale con il servizio pubblico Conto corrente di Banca d'Italia.",
      tasse: "Interessi al 26%. Imposta di bollo di 34,20 € l'anno se la giacenza media supera 5.000 €.",
      tutela: "Fondo Interbancario di Tutela dei Depositi: fino a 100.000 € per persona e per banca.",
      domanda: "Quanto mi costa in tutto il conto in un anno, e quanto tengo fermo più del necessario?"
    },
    {
      id: "deposito", nome: "Conto deposito", famiglia: "Liquidità", dato: "dep_vincolati", anni: 0,
      voti: { rischio: 1, costi: 1, liquidita: 3, complessita: 1, inflazione: 2 },
      cosa: "Un conto dove parcheggiare risparmi che non servono subito, libero o vincolato per un periodo (3, 6, 12 mesi o più).",
      guadagno: "Un tasso fisso deciso all'apertura. I tassi seguono quelli della BCE, con un certo ritardo.",
      rischi: ["Se svincoli prima della scadenza puoi perdere gli interessi", "Le promozioni durano pochi mesi, poi il tasso scende"],
      costi: "Di solito nessun costo di gestione.",
      tasse: "Interessi al 26% e bollo dello 0,20% l'anno sulla somma depositata.",
      tutela: "Fondo Interbancario di Tutela dei Depositi: fino a 100.000 € per persona e per banca, contando insieme conto e deposito presso la stessa banca.",
      domanda: "Il tasso è lordo o netto? Cosa succede se mi servono i soldi prima della scadenza?"
    },
    {
      id: "bot", nome: "BOT", famiglia: "Titoli di Stato", dato: "bce", anni: 0,
      voti: { rischio: 1, costi: 1, liquidita: 4, complessita: 1, inflazione: 2 },
      cosa: "Buoni ordinari del Tesoro a 3, 6 o 12 mesi: presti denaro allo Stato e a scadenza ricevi il valore pieno.",
      guadagno: "Li compri sotto 100 e a scadenza ricevi 100: la differenza è il rendimento, legato ai tassi della BCE.",
      rischi: ["Il rischio è la solidità dello Stato italiano", "Rendimento basso se i tassi scendono"],
      costi: "Commissioni d'acquisto della banca: chiedile prima, perché su importi piccoli pesano molto.",
      tasse: "12,5% sul rendimento e bollo 0,20% l'anno. Titoli di Stato e buoni postali sono esclusi dall'ISEE fino a 50.000 € per nucleo familiare.",
      tutela: "Nessun fondo di garanzia: rispondi al rischio dello Stato emittente. In custodia restano tuoi anche se la banca fallisce.",
      domanda: "Quanto pago di commissione all'asta o sul mercato, rispetto al rendimento che incasso?"
    },
    {
      id: "btp", nome: "BTP a tasso fisso", famiglia: "Titoli di Stato", dato: "btp10", anni: 3,
      voti: { rischio: 2, costi: 1, liquidita: 4, complessita: 2, inflazione: 2 },
      cosa: "Buoni del Tesoro poliennali da 3 a 50 anni: ricevi una cedola fissa ogni sei mesi e il capitale a scadenza.",
      guadagno: "Cedola più eventuale differenza tra prezzo d'acquisto e 100 a scadenza.",
      rischi: ["Se i tassi salgono il prezzo scende: vendere prima della scadenza può voler dire perdere", "Più la scadenza è lunga, più il prezzo oscilla", "Rischio di credito dell'Italia (lo misura lo spread)"],
      costi: "Commissioni di negoziazione; nessun costo annuo di gestione.",
      tasse: "12,5% su cedole e guadagni, bollo 0,20% l'anno. Esclusi dall'ISEE fino a 50.000 € per nucleo familiare, insieme a BOT e buoni postali.",
      tutela: "Nessun fondo di garanzia: il rischio è lo Stato italiano. In custodia restano tuoi anche se la banca fallisce.",
      domanda: "Se mi servissero i soldi prima della scadenza e i tassi fossero saliti, quanto perderei vendendo?"
    },
    {
      id: "indicizzati", nome: "BTP indicizzati all'inflazione", famiglia: "Titoli di Stato", dato: "infl_it", anni: 3,
      voti: { rischio: 2, costi: 1, liquidita: 3, complessita: 3, inflazione: 5 },
      cosa: "BTP Italia (legati all'inflazione italiana) e BTP€i (legati a quella europea): capitale e cedole crescono con i prezzi.",
      guadagno: "Un tasso reale fisso più il recupero dell'inflazione. Proteggono proprio quando i prezzi corrono.",
      rischi: ["Il prezzo oscilla con i tassi reali prima della scadenza", "Se l'inflazione crolla rendono meno dei BTP fissi", "Bisogna capire a quale indice dei prezzi sono legati"],
      costi: "Come i BTP: solo commissioni d'acquisto. In emissione i BTP Italia di solito non le prevedono.",
      tasse: "12,5%, anche sulla rivalutazione del capitale; bollo 0,20% l'anno.",
      tutela: "Come per gli altri titoli di Stato: rischio dello Stato emittente, titoli separati dal patrimonio della banca.",
      domanda: "A quale inflazione è legato, e quanto pago in più se compro sopra 100?"
    },
    {
      id: "etf_obbl", nome: "ETF obbligazionari", famiglia: "Fondi a basso costo", dato: null, anni: 3,
      voti: { rischio: 2, costi: 1, liquidita: 5, complessita: 2, inflazione: 2 },
      cosa: "Fondi quotati in Borsa che contengono centinaia di obbligazioni (governative, societarie o miste) e replicano un indice.",
      guadagno: "Interessi delle obbligazioni contenute, distribuiti o reinvestiti, più le variazioni di prezzo.",
      rischi: ["Non hanno una scadenza: se i tassi salgono il valore scende e non c'è un rimborso a 100", "Gli ETF in valuta estera aggiungono il rischio di cambio"],
      costi: "Costo annuo (TER) spesso tra 0,05% e 0,30%, più le commissioni di compravendita.",
      tasse: "26%, ridotto in proporzione alla quota di titoli di Stato (tassati al 12,5%). I guadagni sono redditi di capitale: non si compensano con le minusvalenze. Bollo 0,20% l'anno.",
      tutela: "Patrimonio separato da quello della società che lo gestisce e della banca.",
      domanda: "Qual è la durata media finanziaria (duration)? Quanto perderebbe se i tassi salissero di un punto?"
    },
    {
      id: "etf_az", nome: "ETF azionari globali", famiglia: "Fondi a basso costo", dato: "mondo", storia: "sp500", anni: 10,
      voti: { rischio: 4, costi: 1, liquidita: 5, complessita: 2, inflazione: 4 },
      cosa: "Fondi quotati che comprano in un colpo solo migliaia di aziende di tutto il mondo, seguendo un indice come l'MSCI World.",
      guadagno: "Crescita degli utili delle aziende e dividendi. Nel lungo periodo le azioni sono state lo strumento che ha battuto di più l'inflazione.",
      rischi: ["Cali del 30-50% nelle crisi, con anni per recuperare", "Gli indici mondiali oggi pesano molto sugli Stati Uniti e su pochi grandi gruppi tecnologici", "Rischio di cambio dollaro-euro"],
      costi: "TER spesso tra 0,10% e 0,25% l'anno.",
      tasse: "26% sui guadagni, che sono redditi di capitale e non si compensano con minusvalenze passate. Le perdite invece si possono compensare con guadagni da azioni, ETC e certificati entro 4 anni. Bollo 0,20% l'anno.",
      tutela: "Patrimonio separato. Il rischio è l'andamento delle borse, non la custodia.",
      domanda: "Sono pronto a vedere il valore calare di un terzo e a non vendere per almeno 10 anni?"
    },
    {
      id: "azioni", nome: "Azioni singole", famiglia: "Investimenti diretti", dato: "ftsemib", storia: "ftsemib", anni: 10,
      voti: { rischio: 5, costi: 2, liquidita: 5, complessita: 4, inflazione: 4 },
      cosa: "Quote di proprietà di una singola società quotata.",
      guadagno: "Dividendi e aumento del prezzo, se l'azienda cresce più di quanto il mercato si aspetti già.",
      rischi: ["Una singola azienda può perdere quasi tutto il valore", "Poche azioni non sono un portafoglio diversificato", "Notizie, mode e passaparola spingono spesso a comprare tardi"],
      costi: "Commissioni per ogni operazione e imposta sulle transazioni finanziarie sulle azioni italiane.",
      tasse: "26% su dividendi e guadagni. Le minusvalenze si compensano con le plusvalenze entro 4 anni. Bollo 0,20% l'anno.",
      tutela: "Le azioni in custodia restano tue se la banca fallisce; nessuna tutela sul fallimento dell'azienda.",
      domanda: "Saprei spiegare come guadagna questa azienda e perché il prezzo di oggi non sconta già tutto?"
    },
    {
      id: "fondi", nome: "Fondi comuni attivi", famiglia: "Risparmio gestito", dato: null, anni: 7,
      voti: { rischio: 3, costi: 4, liquidita: 4, complessita: 3, inflazione: 3 },
      cosa: "Fondi in cui un gestore sceglie i titoli cercando di fare meglio del mercato. Sono spesso proposti allo sportello.",
      guadagno: "Quello che ottiene il gestore, meno i costi. Il confronto onesto è con il suo indice di riferimento (benchmark).",
      rischi: ["Le statistiche SPIVA mostrano che nel lungo periodo la grande maggioranza dei fondi azionari attivi fa peggio del proprio indice", "Commissioni di ingresso e di performance riducono il risultato", "Chi li propone spesso guadagna sulle commissioni"],
      costi: "Costi correnti spesso tra 1,5% e 2,5% l'anno, a volte con commissioni di ingresso o di performance.",
      tasse: "26%, ridotto per la quota di titoli di Stato. Guadagni come redditi di capitale. Bollo 0,20% l'anno.",
      tutela: "Patrimonio separato da quello della società di gestione e della banca.",
      domanda: "Negli ultimi 10 anni ha battuto il suo indice dopo i costi? Quanto costa in totale ogni anno, scritto nel KID?"
    },
    {
      id: "ramo1", nome: "Polizze vita di ramo I", famiglia: "Risparmio gestito", dato: null, anni: 5,
      voti: { rischio: 2, costi: 3, liquidita: 2, complessita: 3, inflazione: 2 },
      cosa: "Polizze legate a una gestione separata della compagnia, investita soprattutto in titoli di Stato e obbligazioni.",
      guadagno: "Un rendimento che si consolida anno per anno; alcune garantiscono il capitale, a certe condizioni.",
      rischi: ["Penali se riscatti nei primi anni", "Il rendimento netto può restare sotto l'inflazione", "Le garanzie hanno condizioni che vanno lette"],
      costi: "Caricamenti iniziali e una trattenuta annua sul rendimento, spesso tra l'1% e il 2%.",
      tasse: "26% al riscatto, ridotto per la quota di titoli di Stato. Niente imposta di bollo. Le somme ai beneficiari non pagano imposta di successione.",
      tutela: "Gli attivi della gestione separata sono riservati agli assicurati; vigila l'IVASS. Non c'è il Fondo di tutela dei depositi.",
      domanda: "Quali sono le penali di riscatto anno per anno, e quanto trattiene la compagnia sul rendimento?"
    },
    {
      id: "unit", nome: "Unit linked e multiramo", famiglia: "Risparmio gestito", dato: null, anni: 10,
      voti: { rischio: 4, costi: 5, liquidita: 3, complessita: 4, inflazione: 3 },
      cosa: "Polizze il cui valore segue fondi interni o esterni: in pratica fondi d'investimento dentro un contratto assicurativo.",
      guadagno: "L'andamento dei fondi sottostanti, meno i costi della polizza e dei fondi.",
      rischi: ["Nessuna garanzia sul capitale nella parte unit linked", "Doppio strato di costi", "Penali e vincoli di uscita"],
      costi: "Tra polizza e fondi il costo totale supera spesso il 2-3% l'anno: su 20 anni può mangiare un terzo del risultato.",
      tasse: "26% al riscatto, ridotto per la quota di titoli di Stato. Bollo 0,20% l'anno, pagato al riscatto.",
      tutela: "Vigilanza IVASS; nessun fondo di garanzia sui depositi.",
      domanda: "Qual è l'incidenza totale dei costi indicata nel KID, e cosa ottengo in più rispetto a un ETF che costa un decimo?"
    },
    {
      id: "pensione", nome: "Fondo pensione", famiglia: "Previdenza", dato: null, anni: 15,
      voti: { rischio: 2, costi: 2, liquidita: 1, complessita: 2, inflazione: 3 },
      cosa: "Un fondo per integrare la pensione pubblica: negoziale (di categoria), aperto, oppure piano individuale (PIP).",
      guadagno: "Rendimento del comparto scelto, più il vantaggio fiscale e, nei fondi negoziali, il contributo del datore di lavoro.",
      rischi: ["I soldi sono vincolati fino alla pensione, salvo anticipi per casa, spese mediche e altri casi previsti", "Comparti azionari oscillano molto", "I PIP costano spesso molto più dei fondi negoziali"],
      costi: "Confrontali con l'Indicatore sintetico dei costi (ISC) pubblicato dalla COVIP: le differenze tra fondi sono grandi.",
      tasse: "Versamenti deducibili fino a 5.164,57 € l'anno. Rendimenti tassati al 20% (12,5% per i titoli di Stato). Prestazione finale al 15%, che scende fino al 9% con gli anni di adesione.",
      tutela: "Patrimonio separato e vigilanza COVIP.",
      domanda: "Il mio contratto di lavoro prevede un contributo del datore se aderisco al fondo negoziale?"
    },
    {
      id: "oro", nome: "Oro (fisico o ETC)", famiglia: "Beni reali", dato: "oro_eur", storia: "oro", anni: 10,
      voti: { rischio: 3, costi: 2, liquidita: 4, complessita: 1, inflazione: 4 },
      cosa: "Lingotti e monete da investimento, oppure ETC: titoli quotati garantiti da oro fisico depositato.",
      guadagno: "Solo l'aumento del prezzo: l'oro non paga interessi né dividendi.",
      rischi: ["Lunghi periodi di calo: dopo il massimo del 1980 servirono decenni per tornarci", "Prezzo in dollari: il cambio pesa sul risultato in euro", "Nel fisico, rischio di furto e differenza tra prezzo di acquisto e di vendita"],
      costi: "Monete e lingotti: differenza tra acquisto e vendita di qualche punto percentuale. ETC: costo annuo spesso tra 0,12% e 0,40%.",
      tasse: "26% sul guadagno. Per l'oro fisico senza documento d'acquisto si tassa il 25% del prezzo di vendita. ETC: bollo 0,20% l'anno.",
      tutela: "ETC: oro segregato presso un depositario. Fisico: compra solo da operatori autorizzati e conserva la fattura.",
      domanda: "Che quota del patrimonio sto mettendo in un bene che non produce reddito, e perché proprio ora?"
    },
    {
      id: "certificati", nome: "Certificati e prodotti strutturati", famiglia: "Prodotti complessi", dato: null, anni: 3,
      voti: { rischio: 4, costi: 4, liquidita: 3, complessita: 5, inflazione: 2 },
      cosa: "Titoli emessi da banche il cui rimborso dipende da regole su uno o più sottostanti: barriere, premi, rimborsi anticipati.",
      guadagno: "Premi periodici se il sottostante resta sopra certe soglie.",
      rischi: ["Sotto la barriera si perde come il sottostante, spesso il peggiore di un gruppo", "Se la banca emittente fallisce si può perdere tutto", "Costi nascosti nel prezzo, difficili da vedere"],
      costi: "Costi impliciti nel prezzo di emissione: cercali nel KID alla voce costi totali.",
      tasse: "26% su premi e guadagni, che sono redditi diversi: si compensano con le minusvalenze.",
      tutela: "Nessuna garanzia dei depositi: conta la solidità della banca emittente.",
      domanda: "Cosa succede, numeri alla mano, se il sottostante peggiore scende del 40%? Chi è l'emittente?"
    },
    {
      id: "cripto", nome: "Cripto-attività", famiglia: "Speculativi", dato: "btc", anni: 10,
      voti: { rischio: 5, costi: 3, liquidita: 4, complessita: 4, inflazione: 2 },
      cosa: "Bitcoin e altre monete digitali. Non hanno flussi di cassa: il valore dipende solo da quanto altri sono disposti a pagarle.",
      guadagno: "Solo l'aumento del prezzo.",
      rischi: ["Cali dell'80% già avvenuti più volte", "Truffe, piattaforme fallite, chiavi perse", "Migliaia di monete minori sono finite quasi a zero"],
      costi: "Commissioni delle piattaforme e differenza tra prezzo di acquisto e di vendita, a volte alte.",
      tasse: "33% dal 2026 sui guadagni, senza franchigia, e imposta dello 0,2% l'anno sul valore detenuto.",
      tutela: "Dal 1° luglio 2026 il regolamento europeo MiCAR è pienamente in vigore: usa solo prestatori autorizzati. Nessun fondo di garanzia.",
      domanda: "Se domani valesse la metà, cambierebbe qualcosa nella mia vita? Se sì, la quota è troppo alta."
    },
    {
      id: "immobile", nome: "Immobile da mettere a reddito", famiglia: "Beni reali", dato: "mutuo_medio", anni: 15,
      voti: { rischio: 3, costi: 4, liquidita: 1, complessita: 3, inflazione: 4 },
      cosa: "Una casa o un locale da affittare.",
      guadagno: "Canone d'affitto e possibile rivalutazione nel tempo.",
      rischi: ["Tutto il capitale in un solo bene e in una sola città", "Inquilini morosi, sfitti, manutenzioni straordinarie", "Venderlo richiede mesi"],
      costi: "Notaio, imposte d'acquisto, agenzia, IMU, condominio, manutenzione, assicurazione.",
      tasse: "Affitto tassato con l'Irpef o con la cedolare secca al 21%, ridotta per i canoni concordati. IMU sulle seconde case.",
      tutela: "Proprietà diretta, ma senza diversificazione.",
      domanda: "Quanto rende davvero l'affitto, al netto di tasse, IMU, spese e mesi senza inquilino?"
    }
  ],

  /* Percorso in 10 lezioni: ogni lezione si completa rispondendo bene alla domanda finale. */
  lezioni: [
    {
      titolo: "Prima di investire",
      testo: [
        "L'ordine conta. Prima si costruisce un fondo per le emergenze: in genere da tre a sei mesi di spese, su un conto o un deposito subito disponibile. Poi si chiudono i debiti cari, come carte revolving e prestiti al consumo, che costano più di quanto un investimento prudente possa rendere.",
        "Solo dopo ha senso investire, e solo i soldi che non serviranno per anni. Chi investe denaro che potrebbe servirgli è costretto a vendere nel momento peggiore."
      ],
      punto: "Si investe solo ciò che non serve per anni, dopo aver messo al sicuro le emergenze.",
      domanda: { q: "Hai un prestito al 9% e 5.000 € fermi. Cosa conviene valutare per primo?", opts: ["Investirli in borsa, che in media rende di più", "Ridurre o chiudere il prestito al 9%", "Comprare oro per proteggersi"], ok: 1, spiega: "Chiudere un debito al 9% è un rendimento certo del 9%, che nessun investimento prudente garantisce." }
    },
    {
      titolo: "Rischio e rendimento vanno insieme",
      testo: [
        "Non esiste un investimento che renda molto senza rischi. Se qualcuno lo promette, o sta nascondendo il rischio o sta mentendo.",
        "Il rischio non è solo perdere: è anche dover aspettare anni per recuperare, o non riuscire a vendere quando servono i soldi. La sezione «La storia insegna» mostra quanto sono stati profondi e lunghi i cali passati."
      ],
      punto: "Un rendimento più alto è sempre il compenso per un rischio più alto, anche quando non si vede.",
      domanda: { q: "Ti propongono un 10% l'anno garantito e senza rischi. Cosa ne pensi?", opts: ["È un'occasione da prendere al volo", "È un segnale di allarme: rendimento alto e assenza di rischio non stanno insieme", "Dipende da quanto è simpatico chi lo propone"], ok: 1, spiega: "Con i titoli di Stato intorno al 3-4%, chi promette il 10% senza rischi sta nascondendo qualcosa." }
    },
    {
      titolo: "Il tempo è il tuo alleato",
      testo: [
        "Gli interessi composti fanno crescere anche gli interessi già maturati: 10.000 € al 5% l'anno diventano circa 16.300 € in 10 anni e 26.500 € in 20.",
        "Il tempo riduce anche l'effetto del caso. In un singolo anno la borsa può fare +30% o −40%; su 15-20 anni, storicamente, i risultati sono stati molto più stabili. Lo vedi nel grafico «Più tieni, meno conta il caso»."
      ],
      punto: "Più lungo è l'orizzonte, più il risultato dipende dalla crescita dell'economia e meno dalla fortuna del momento.",
      domanda: { q: "Perché le azioni sono adatte a soldi che servono tra 15 anni e non a quelli che servono tra 1 anno?", opts: ["Perché in un anno possono perdere molto, mentre su 15 anni i cali storicamente si sono riassorbiti più spesso", "Perché tra un anno le azioni sono tassate di più", "Non c'è differenza"], ok: 0, spiega: "Su orizzonti brevi il risultato è quasi una lotteria; su orizzonti lunghi pesa di più la crescita degli utili." }
    },
    {
      titolo: "Diversificare davvero",
      testo: [
        "Diversificare significa non dipendere da un'unica azienda, un unico Paese o un unico settore. Dieci azioni italiane di banche non sono un portafoglio diversificato: salgono e scendono insieme.",
        "Attenzione anche alla diversificazione apparente: molti indici mondiali oggi pesano per oltre metà sugli Stati Uniti e per una quota alta su pochi grandi gruppi tecnologici. Sapere cosa c'è dentro è parte della diversificazione."
      ],
      punto: "Diversificato vuol dire che le parti del portafoglio non crollano tutte per la stessa ragione.",
      domanda: { q: "Quale portafoglio è più diversificato?", opts: ["Cinque azioni di banche italiane", "Un ETF che contiene migliaia di aziende di molti Paesi e settori", "Tre criptovalute diverse"], ok: 1, spiega: "Banche italiane o criptovalute tendono a muoversi insieme; un indice mondiale distribuisce il rischio." }
    },
    {
      titolo: "I costi: il nemico silenzioso",
      testo: [
        "Un costo del 2% l'anno sembra piccolo, ma si applica a tutto il capitale, ogni anno. Su 20 anni, con un rendimento lordo del 5%, con un costo del 2% invece dello 0,2% si arriva con quasi il 30% di capitale in meno.",
        "I costi sono l'unica parte del rendimento che conosci in anticipo e che puoi controllare. Li trovi nel KID, il documento che l'intermediario deve consegnarti prima dell'acquisto."
      ],
      punto: "Ogni euro di costi è un euro di rendimento in meno, certo e garantito.",
      domanda: { q: "Due fondi investono nelle stesse azioni. Uno costa 0,2% l'anno, l'altro 2%. Cosa è più probabile su 20 anni?", opts: ["Il più caro rende di più perché è gestito meglio", "Il più economico finisce con molto più capitale", "Finiscono uguali"], ok: 1, spiega: "A parità di investimenti, la differenza di costo si accumula ogni anno a favore del più economico." }
    },
    {
      titolo: "Inflazione e rendimento reale",
      testo: [
        "Il rendimento che conta è quello reale: quanto cresce il tuo potere d'acquisto. Se un deposito rende il 3% e i prezzi salgono del 5%, stai perdendo circa il 2% l'anno anche se il saldo sale.",
        "Per questo il denaro «sicuro» non è mai del tutto sicuro: è protetto dalle oscillazioni, non dall'inflazione. La sezione «Il denaro sicuro batte i prezzi?» fa il conto con i dati di oggi, al netto delle tasse."
      ],
      punto: "Conta quanto puoi comprare con i tuoi soldi, non quanti euro vedi sul conto.",
      domanda: { q: "Un deposito rende il 3% lordo, tassato al 26%, con inflazione al 4%. Il rendimento reale è circa:", opts: ["+3%", "−1,7%", "0%"], ok: 1, spiega: "3% meno il 26% di tasse fa circa 2,2% netto; togliendo l'inflazione al 4% resta circa −1,7%." }
    },
    {
      titolo: "Mode, bolle e la folla",
      testo: [
        "Il Nasdaq toccò il massimo a marzo 2000, dopo anni di euforia per internet, e perse circa l'80% nei due anni successivi: tornò a quei livelli solo nel 2015. Il Nikkei giapponese impiegò oltre 34 anni per superare il massimo di fine 1989.",
        "Le bolle hanno sempre la stessa forma: un'idea vera, prezzi che salgono, racconti che spiegano perché «stavolta è diverso», tutti che ne parlano, ultimi arrivati che comprano ai massimi. La folla non sbaglia sull'idea, spesso sbaglia sul prezzo e sul momento."
      ],
      punto: "Quando tutti ne parlano, il prezzo contiene già le buone notizie: la domanda giusta è quanto stai pagando.",
      domanda: { q: "Un mercato è salito del 60% in un anno e ne parlano tutti. Qual è la domanda più utile da farsi?", opts: ["Quanto salirà ancora?", "Quanto ottimismo è già nel prezzo, e cosa succede al mio piano se torna giù del 30%?", "Come faccio a comprare subito?"], ok: 1, spiega: "Dopo una grande salita le aspettative sono alte: il rischio di delusione è maggiore." }
    },
    {
      titolo: "Prezzo e valore",
      testo: [
        "Un'azione dà diritto a una parte degli utili di un'azienda. Il rapporto tra prezzo e utili (P/E) dice quanti anni di utili attuali stai pagando: un P/E di 30 significa che compri 30 anni di utili di oggi.",
        "Un P/E alto non significa che il prezzo crollerà, ma che il mercato si aspetta molta crescita: se arriva meno crescita del previsto, il prezzo soffre. Un buon termine di paragone è il rendimento dei titoli di Stato, che oggi trovi nella sezione Tassi."
      ],
      punto: "Un'ottima azienda può essere un pessimo investimento se la paghi troppo.",
      domanda: { q: "Due aziende crescono allo stesso ritmo. La prima ha P/E 12, la seconda P/E 40. Cosa è vero?", opts: ["La seconda è sicuramente migliore", "Per la seconda paghi molto di più ogni euro di utile: serve più crescita futura per giustificare il prezzo", "Il P/E non conta nulla"], ok: 1, spiega: "A parità di crescita, un P/E più alto lascia meno margine se le cose vanno peggio del previsto." }
    },
    {
      titolo: "Le trappole della mente",
      testo: [
        "Il cervello umano non è fatto per investire: ci fa comprare dopo che i prezzi sono saliti (perché ci sentiamo sicuri) e vendere dopo che sono scesi (perché abbiamo paura). Una perdita pesa circa il doppio di un guadagno della stessa cifra.",
        "Altre trappole comuni: voler recuperare a tutti i costi una perdita, fidarsi di chi ha un interesse a venderci qualcosa, credere di saper prevedere il mercato. La funzione «Metti alla prova un'idea» ti aiuta a riconoscerle prima di decidere."
      ],
      punto: "Le decisioni migliori si prendono con un piano scritto prima, non con le emozioni del momento.",
      domanda: { q: "La borsa è scesa del 25% e hai paura. Cosa dice un approccio razionale?", opts: ["Vendere subito tutto per non perdere altro", "Ricontrollare il piano: se orizzonte e bisogni non sono cambiati, il calo da solo non è un motivo per vendere", "Comprare a debito per approfittarne"], ok: 1, spiega: "Vendere dopo un calo trasforma una perdita temporanea in definitiva; conta il piano, non la paura." }
    },
    {
      titolo: "Restare nel piano e ribilanciare",
      testo: [
        "Un piano semplice dice quanto tenere in liquidità, obbligazioni e azioni, in base a orizzonte e tolleranza al rischio. Nel tempo le parti crescono in modo diverso e le proporzioni cambiano.",
        "Ribilanciare, per esempio una volta l'anno, significa riportare le quote ai valori scelti: si vende un po' di ciò che è salito e si compra ciò che è sceso. È un modo disciplinato di fare l'opposto della folla, senza dover prevedere nulla."
      ],
      punto: "Il ribilanciamento ti fa comprare basso e vendere alto in automatico, senza indovinare il futuro.",
      domanda: { q: "Il tuo piano prevede 60% azioni e 40% obbligazioni. Dopo un anno di borsa forte sei al 70% e 30%. Ribilanciare significa:", opts: ["Comprare altre azioni perché vanno bene", "Riportare le quote al 60/40, vendendo un po' di azioni", "Non fare nulla per sempre"], ok: 1, spiega: "Ribilanciare riporta il rischio al livello scelto e fa prendere profitto su ciò che è salito." }
    }
  ],

  /* Motivi per cui si prende in considerazione un'operazione. peso positivo = ragionamento, negativo = trappola. */
  motivi: [
    { id: "piano", t: "Rientra nel mio piano scritto (quote, orizzonte)", peso: 12 },
    { id: "studio", t: "Ho letto il KID e confrontato costi e rischi", peso: 10 },
    { id: "divers", t: "Mi serve per diversificare ciò che ho già", peso: 8 },
    { id: "ribil", t: "Sto ribilanciando le quote", peso: 8 },
    { id: "salito", t: "È salito molto di recente", peso: -12, bias: "Inseguire i rendimenti passati", spiega: "Ciò che è salito di più attira di più, ma il rendimento passato è già nel prezzo. Chi entra dopo una lunga corsa compra quando le aspettative sono più alte." },
    { id: "tutti", t: "Ne parlano tutti: amici, social, giornali", peso: -14, bias: "Effetto gregge", spiega: "Quando tutti ne parlano, molti hanno già comprato: restano meno compratori nuovi per spingere ancora il prezzo. È spesso la fase finale di una salita." },
    { id: "proposto", t: "Me l'ha proposto la banca o un venditore", peso: -6, bias: "Fiducia in chi vende", spiega: "Chi propone un prodotto può guadagnare commissioni su quel prodotto. Chiedi sempre per iscritto i costi totali e confrontali con alternative semplici." },
    { id: "paura", t: "Ho paura che scenda ancora", peso: -10, bias: "Avversione alla perdita", spiega: "Le perdite pesano il doppio dei guadagni. Vendere per paura dopo un calo trasforma una perdita temporanea in definitiva, spesso vicino ai minimi." },
    { id: "recuperare", t: "Voglio recuperare una perdita", peso: -12, bias: "Voler recuperare a ogni costo", spiega: "Il mercato non sa a che prezzo hai comprato. Rischiare di più per tornare in pari porta spesso a perdere di più." },
    { id: "sicuro", t: "Sono sicuro di come andrà", peso: -10, bias: "Eccesso di sicurezza", spiega: "Nessuno prevede i mercati con regolarità, nemmeno i professionisti. La sicurezza spinge a concentrare troppo e a ignorare i rischi." }
  ],

  domande: [
    { id: "spiega", t: "So spiegare in due frasi come guadagna questo strumento" },
    { id: "costi", t: "Conosco il costo totale annuo, scritto nel KID" },
    { id: "perdita", t: "So quanto può perdere nel caso peggiore e lo sopporterei senza vendere" },
    { id: "emergenze", t: "Ho già un fondo per le emergenze a parte" },
    { id: "orizzonte", t: "Questi soldi non mi serviranno prima dell'orizzonte indicato" },
    { id: "uscita", t: "So come e quando potrei uscire, e a che costo" }
  ]
};
