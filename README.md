# Eco Bussola

Il punto quotidiano su mercati, prezzi e risparmio, con strumenti per decidere dove spendere e come investire.

Due volte al giorno (6:10 e 18:10 UTC) il workflow **Aggiorna e pubblica** scarica dati da fonti pubbliche gratuite,
aggiorna `data.js` e `archivio.js` e pubblica il sito con GitHub Pages. Funziona senza intelligenza artificiale.

## Accesso con password

Il sito chiede una password all'ingresso; su ogni dispositivo la chiede una volta sola (il tasto **Esci** in fondo alla pagina la fa richiedere di nuovo).
È una protezione semplice, per tenere lontani i curiosi: la repository è pubblica, quindi chi è esperto può comunque leggere codice e dati qui su GitHub.

**Cambiare la password:** Settings → Secrets and variables → Actions → *New repository secret*,
nome `SITO_PASSWORD`, valore la nuova password. Vale dalla pubblicazione successiva
(Actions → Aggiorna e pubblica → *Run workflow* per farlo subito). La password non finisce mai nel codice: sul sito c'è solo la sua impronta.

Il sito chiede ai motori di ricerca di non mostrarlo nei risultati.

## Salvare in PDF

In cima a ogni scheda c'è il pulsante **Salva … in PDF**: si apre la finestra di stampa, dove scegliere *Salva come PDF*.
Il PDF ha colori chiari, intestazione con la data e tutti i riquadri aperti; poi si può inviare come qualsiasi file.

## File principali

- `index.html` – il sito; sezioni in `pillole.js`, `manovra.js`, `investire.js`, `glossario.js`, `calcoli.js`, `bonus.js`, `bitcoin.js`
- `data.js`, `archivio.js` – dati del giorno e archivio (generati)
- `sw.js`, `manifest.webmanifest`, `icons/` – app installabile, funziona anche offline
- `scripts/aggiorna.mjs` – scarica i dati (Node 20, nessuna dipendenza)
- `scripts/verifica-calcoli.mjs` – controlla i calcolatori prima di pubblicare
- `scripts/password.mjs` – applica la password del segreto `SITO_PASSWORD` al momento della pubblicazione

## Segreti facoltativi

`SITO_PASSWORD` (password del sito), `GEMINI_API_KEY` o `GROQ_API_KEY` (l'IA può solo riscrivere i testi). Mai nel codice.

Il sito dà informazioni generali, non consigli finanziari personalizzati.
