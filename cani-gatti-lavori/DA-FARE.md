# Cani vs Gatti — da fare (aggiornato il 10 novembre 2026)

Cartella di lavoro del set. La direzione artistica completa e i prompt di tutti i pezzi
sono nel documento del set, sezione 0: `../motto-chess-set-cani-gatti.md`.

## Fatto

- **Re dei cani, Roger**: labrador nero seduto, ciotola dorata di crocchette come corona,
  lingua slurposa con goccia di bava. Sorgente: `sorgenti/caniK_roger_v1.png`.
- **Pedone dei gatti**: gattino rosso tigrato seduto con una zampa alzata.
  Sorgente: `sorgenti/gattiP_v1.png`.
- **Pedone dei cani**: cucciolo di labrador cioccolato seduto con un osso bianco in bocca,
  coda alzata. Sorgente: `sorgenti/caniP_v1.jpg`, prompt in `prompt_caniP.txt`.
  Stessa altezza del gattino, un po' più stretto perché coda e zampe stanno vicino al corpo.
- **Re dei gatti**: gatto rosso grasso, occhi chiusi beati, scatoletta di tonno dorata in
  testa con il bordo strappato a punte di corona. Sorgente: `sorgenti/gattiK_v2.jpg`
  (la v1 aveva la scatoletta grigia e inclinata, scartata), prompt in `prompt_gattiK.txt`
  più una richiesta di correzione. Nota: la scatoletta è un po' spostata a sinistra, con
  il coperchio tondo che sporge di lato; i baffi escono un po' a destra.
- Generati con Gemini, conversazione "Black Lab Vector Game Piece" (nella cronologia di
  Gemini). Gemini scarica in JPEG 2048×2048: lo script li gestisce senza problemi.
- `tools/process_piece.py` riconosce da solo lo sfondo magenta, toglie l'alone viola e
  aggiunge il bordo bianco "adesivo" (`--sticker 4`). Pezzi elaborati in `prove/`.
- Prova delle caselle in `prove/`: tre coppie, tutte leggibili grazie al bordo bianco.
  - A avorio `#F2EDE4` / viola `#6B4C7A` (ipotesi iniziale)
  - B menta `#D8EBD0` / salvia `#8FAE7E` (tema prato)
  - C cielo `#CFE4F2` / carta da zucchero `#6E8FB5` — **la mia preferita**: l'arancio dei
    gatti risalta sull'azzurro e il blu chiaro non si confonde con il navy del Judo.

## Decisioni dell'11 novembre 2026

- **Caselle: coppia C**, cielo `#CFE4F2` / carta da zucchero `#6E8FB5`.
- **Commit e push su GitHub solo quando tutto il set è finito** (pezzi, caselle, suoni).
- **Fazione legata al colore**: gatti sempre bianco, cani sempre nero (come il Judo,
  judogi bianco = bianco, blu = nero). Tolta la domanda "Chi vuoi impersonare?";
  `FIXED_FACTIONS` in `src/themes/factions.js`. Provato nell'app.

## Richieste di Roberto, fatte l'11 novembre 2026

1. **Avversario e livelli** — FATTO. Scoperto che Stockfish 11 incluso non ha `UCI_Elo`:
   tutti i livelli giocavano a forza piena. Ora `Skill Level` + profondità + tempo
   (tabella in `src/engine/engine.js` e nelle specifiche); Elo mostrati come "circa".
   Risposta sempre entro un minuto: massimo 15 s (livello 20), minimo 0,8 s, rete di
   sicurezza a 55 s che ricrea il motore e gioca una mossa rapida.
2. **Partite solo in locale** — già così (`localStorage`, nessun server); aggiunta la frase
   esplicita nella schermata Partite salvate.
3. **Intestazione completa del PGN** — FATTO, sempre presente: Set, Giocatore ("Bianco,
   con i gatti"), Avversario, Esito, Tempo, Durata, Mosse, più i tag standard. Tolti i tre
   interruttori da Impostazioni (resta la nota libera). Titolo in archivio con esito a parole.

4. **Riproduzione delle partite salvate/importate** — FATTO: pulsante "Riproduci sulla
   scacchiera" in Partite salvate, con Riproduci/Pausa, avanti/indietro, inizio/fine,
   velocità, suoni e narrazione. Provato con la partita dell'Opera di Morphy (importata)
   e con una partita Cani vs Gatti.
5. **Riferimenti dell'autore** — già presenti in Impostazioni > Informazioni: nome,
   mottopod@gmail.com, mottopodcast.org, PayPal (paypal.me/MottoPodcast).

## Pezzi completati l'11 novembre 2026

Tutti i 12 PNG sono in `assets/pieces/cani-gatti/`, `artReady: true`, caselle C fisse in
`PIECE_SET_SQUARE_COLORS`. Provato nell'app: si vedono tutti bene.
Sorgenti scelte (prompt in `prompt_<nome>.txt`):
- Torri: `caniR_v1` (labrador a ciambella), `gattiR_v1` (gatto sul cuscino rosso con nappine).
- Dame: `caniQ_v2` (la v1 era troppo seria e con collana sottile; corretta in chat:
  più paffuta, aria vanitosa, ossi grossi), `gattiQ_v1` (coda a punto interrogativo, pesciolini).
- Alfieri: `caniB_v2` (la v1 sembrava seduta come re e pedone; corretta: ritto in piedi,
  alto e stretto), `gattiB_v1` (in piedi che si stiracchia sbadigliando, zampe in alto).
- Cavalli: `caniN_v1` (salto con pallina da tennis), `gattiN_v1` (balzo sul gomitolo blu).
`process_piece.py` ora toglie anche le isole di magenta chiuse dentro la figura (es. fra
zampa e guancia dell'alfiere dei cani).
Comando per rielaborare tutto: `process_piece.py` per ciascun pezzo con altezze K .95 Q .90 B .88
N .85 R .55 P .62.

## Suoni completati l'11 novembre 2026

14 file in `assets/sounds/cani-gatti/` (`cg_*.wav`), collegati in `GAME_SETS['cani-gatti']`
di `src/ui/sound-manager.js`; provato nell'app (sigla gatti, passo gatti, passo cani).
Generati con ElevenLabs Sound Effects (flow "Motto Chess - suoni Cani vs Gatti"), 4 versioni
per suono, scaricate in `suoni/grezzi/`. Scelta fatta guardando gli spettri (`suoni/spettri/`)
e i tempi degli eventi (`suoni/onsets.py`): Claude non può ascoltare, quindi la prova
d'ascolto vera è di Roberto. Tagli, dissolvenze e volumi in `suoni/master.py`
(rilanciarlo rigenera tutti i file). Passo dei cani rinforzato di 15 dB con limitatore
perché i ticchettii sono brevissimi. Punti deboli da verificare all'ascolto:
- sigla dei cani: solo ansimare con medaglietta (0,75 s), manca il guaito finale;
- cattura dei gatti: il soffio ha una componente vocale, forse sembra un ringhio-miagolio;
- tocco: tintinnio di medaglietta un po' "sporco", non un tink singolo pulito;
- vittoria gatti: fusa + "mrrraow" montati da due versioni diverse.

## Prossimi passi

1. **Ascolto dei suoni da parte di Roberto** e ritocchi. Suoni fatti l'11/11/2026 (vedi
   sotto).
2. Eventuale: i cavalli guardano entrambi a sinistra; si potrebbe specchiare quello di
   una fazione perché si guardino in faccia.
3. Da valutare alla prova: i baffi del gattino escono dalla sagoma come linee sottili; se
   a misura di casella disturbano, rifarli più corti.

## Ricordare

- Dall'11/11/2026 `prove/`, `sorgenti/` e `suoni/grezzi/` restano **solo su questo Mac** (in
  `.gitignore`, tolte da GitHub su richiesta di Roberto): non servono all'app. Se si lavora da
  un altro computer, quelle cartelle non ci sono.

- Tutto il lavoro di oggi (correzioni, ancoraggio VoiceOver, script, questa cartella) è
  **solo su questo Mac, non ancora su GitHub**. Per riprendere da un altro computer
  bisogna prima fare commit e push.
