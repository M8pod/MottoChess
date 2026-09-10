# Motto Chess — Specifiche v1

Documento guida per la generazione del codice. Da fornire a Claude Code come riferimento completo per lo scaffolding del progetto.

## Panoramica

App di scacchi accessibile, pensata per essere usata contemporaneamente da persone vedenti e non vedenti. Piattaforma: **Progressive Web App (PWA)** — HTML/JS/CSS installabile, nessun App Store. Priorità assoluta: piena compatibilità VoiceOver senza sacrificare l'interfaccia visiva per utenti vedenti.

Autore: Roberto Lachin, judoka non vedente, conduttore (con Elena Travaini) di Motto Podcast.

## Architettura — moduli disaccoppiati

- `engine` — wrapper Stockfish (UCI), livelli 1–20 mappati su `UCI_Elo` + `UCI_LimitStrength`
- `game-core` — motore regole/stato partita, opera SEMPRE in notazione algebrica standard (es. e4). Nessuna dipendenza da temi o lingua.
- `io-text` — parsing input testuale (compatto e "città italiane"), promozione, arrocco, en passant
- `pgn` — import/export PGN, inclusi tag metadati opzionali
- `themes/i18n-voice` — mapping nomi pezzi/città per vocalizzazione, traduzione bidirezionale da/verso notazione standard. Strettamente separato da game-core per garantire PGN corretto.
- `session/options` — configurazione partita (persistenza automatica ultima config usata)
- `ui` — layer di presentazione, sempre a doppia modalità parallela (mai un toggle)

## Interfaccia di gioco

Schermata partita mostra solo: scacchiera grafica, campo comando testuale + pulsante invio, box pulsanti funzione (Resign; NO proposta patta in v1 — arriva con multiplayer online).

### Orientamento scacchiera
La scacchiera si orienta sempre in base al colore assegnato al giocatore in quella partita:
- Giocatore bianco: orientamento standard, riga 1 in basso (verso il giocatore), riga 8 in alto.
- Giocatore nero: orientamento ribaltato, riga 8 in basso (verso il giocatore), riga 1 in alto.
- Con colore "casuale", l'orientamento segue il colore effettivamente assegnato dopo il sorteggio (non richiede altra configurazione).
La convenzione a1-sempre-scura (vedi Impostazioni → Grafica scacchiera) resta valida in entrambi gli orientamenti: è la posizione fisica del colore sulla scacchiera a ruotare con la vista, non la regola stessa.

### Interazione pezzi
- VoiceOver: doppio-tap per selezionare, doppio-tap su destinazione per muovere. Casella selezionata annuncia stato "selezionata" durante la navigazione.
- Utenti vedenti: singolo tap per selezionare/rilasciare.
- Selezione/deselezione pezzo (tocco, interfaccia grafica): suono dedicato distinto da mossa/cattura (`chess_piece_select`, `chess_piece_deselect`), riprodotto quando l'utente vedente tappa un pezzo per selezionarlo/deselezionarlo. Fa parte dei suoni di gioco (non UI/menu).
- Mossa scacchisticamente illegale (tocco o testo sintatticamente corretto ma non ammesso dal regolamento): suono di diniego (buzzer elettronico) — `chess_illegal_move`.
- Testo non interpretabile dal parser `io-text` (sintassi non riconosciuta): suono di diniego distinto — `chess_invalid_move`.
- In entrambi i casi: nessun movimento, richiede nuova selezione/nuovo input.
- **Arrocco (tocco)**: singolo doppio-tap sul re che si sposta di due caselle; la torre si muove automaticamente, riconosciuto dal motore.
- **Promozione (tocco)**: popup con 4 opzioni (dama, torre, alfiere, cavallo), selezione a doppio-tap.
- **Promozione (testo)**: mossa senza suffisso pezzo (es. `e8` o `Empoli 8`) → default dama. Con suffisso (es. `e8n` o `Empoli 8 cavallo`) → promuove al pezzo indicato.
- **Promozione**: suono dedicato `chess_pawn_promotion`, unico e generico qualunque sia il pezzo scelto (dama/torre/alfiere/cavallo), riprodotto alla conferma della scelta (tocco o testo).

### Vocalizzazione scacchiera
- Colonne a–h → alfabeto fonetico italiano: Ancona, Bologna, Como, Domodossola, Empoli, Firenze, Genova, Hotel
- Formato: nome città + numero riga; se occupata, annuncia anche pezzo e colore (es. "Empoli 4, cavallo nero")
- Mosse dell'avversario SEMPRE vocalizzate, nessuna opzione per disattivarle
- En passant vocalizzato come "en passant" seguito da descrizione mossa
- Stile narrazione (impostabile in Impostazioni, si applica a TUTTE le mosse, proprie e avversarie):
  - **Compatto**: notazione tipo Nf3, Qxc5 (verificare in fase di sviluppo come VoiceOver legge i simboli `+`/`#`; se la lettura non è chiara, forzare una pronuncia esplicita)
  - **Espanso**: es. "cavallo in Firenze 3", "dama mangia torre in Como 5"; se la mossa dà scacco, aggiungere ", scacco" in coda alla descrizione

### Inizio partita
Alla creazione di una nuova partita, il narratore annuncia colore assegnato e chi muove per primo:
- Giocatore bianco: "Nuova partita. Giochi con il bianco, muovi tu."
- Giocatore nero: "Nuova partita. Giochi con il nero, attendi la mossa dell'avversario."
- Con colore "casuale", l'annuncio usa il colore effettivamente assegnato dopo il sorteggio.

### Promozione — conferma parlata
Oltre al suono `chess_pawn_promotion`, conferma vocale del pezzo scelto: "Promosso a dama." / "Promosso a torre." / "Promosso ad alfiere." / "Promosso a cavallo."

### Abbandono partita (Resign)
Il pulsante Resign richiede conferma prima di eseguire, per evitare tocchi accidentali: prompt "Confermi abbandono partita?" (Sì/No). Confermato l'abbandono, segue l'annuncio dell'esito (vedi sotto).

### Annunci fine partita
Sobri e diretti, preceduti dal suono dedicato. 5 categorie sonore, con testo esatto per ciascun esito effettivo:

1. **Vittoria per scacco matto** — "Scacco matto. Hai vinto."
2. **Stallo o patta** (stessa categoria sonora, testo specifico per chiarezza a chi non vede la scacchiera):
   - Stallo → "Patta per stallo."
   - Tripla ripetizione → "Patta per tripla ripetizione."
   - Regola delle 50 mosse → "Patta per regola delle cinquanta mosse."
   - Materiale insufficiente → "Patta per materiale insufficiente."
3. **Vittoria per resa o tempo scaduto avversario**:
   - Abbandono avversario → "L'avversario ha abbandonato. Hai vinto."
   - Tempo scaduto avversario → "Tempo scaduto per l'avversario. Hai vinto."
4. **Sconfitta per scacco matto** — "Scacco matto. Hai perso."
5. **Sconfitta per tempo scaduto o resa propria**:
   - Abbandono proprio (dopo conferma) → "Hai abbandonato la partita. Hai perso."
   - Tempo scaduto proprio → "Tempo scaduto. Hai perso."

### Notifiche vocali tempo (solo se Tempo attivo nelle Opzioni partita)
Tre notifiche indipendenti, ciascuna attivabile/disattivabile singolarmente da Impostazioni (vedi sotto), attive di default:
- **Avviso 10% tempo residuo**: quando il tempo rimanente di un giocatore scende al 10% del tempo totale assegnato a inizio partita, annuncio con tempo arrotondato, es. "Attenzione, tempo in esaurimento: restano circa 3 minuti." Calcolato individualmente sull'orologio di ciascun giocatore (umano e, se rilevante per la UI, anche per l'avversario).
- **Avviso 5% tempo residuo**: stessa logica al 5%, es. "Attenzione, tempo quasi scaduto: restano circa 1 minuto e 30 secondi."
- **Annuncio tempo trascorso ogni 10 minuti**: solo se il tempo di partita impostato è superiore a 20 minuti; ogni 10 minuti di gioco trascorsi dall'inizio partita, annuncio del tempo totale trascorso, es. "Sono trascorsi 10 minuti di gioco.", poi "Sono trascorsi 20 minuti di gioco.", ecc. Indipendente da chi sta muovendo in quel momento.

## Opzioni partita (per sessione, "Gioca subito" riusa l'ultima configurazione — ECCETTO il colore, vedi punto 3)

1. **Tempo**: on/off; se on, minuti `[10,15,20,30,45,60,90,120]` + incremento secondi `[0,2,3,5,7,10,15,20,30]`, due select indipendenti (replicare comportamento stepper/picker nativo in HTML accessibile, dato che è PWA non nativa)
2. **Livello Stockfish 1–20**, vedi tabella sotto
3. **Colore**: bianco / nero / casuale — scelta OBBLIGATORIA a ogni nuova partita, anche da "Gioca subito" (unico campo escluso dal riuso automatico dell'ultima configurazione, dato che determina l'orientamento scacchiera). "Gioca subito" mostra quindi solo questa scelta (es. 3 pulsanti/select rapidi) e riusa tempo/livello/set pezzi dell'ultima sessione.
4. **Set pezzi tematico**: Classico, Judo, Cani vs Gatti (quest'ultimo coi pezzi classici come segnaposto finché i disegni non arrivano); Samurai vs Ninja pianificato per dopo
5. **Fazione**: presente solo per i set "a fazioni" che la fanno scegliere — oggi solo Cani vs Gatti: gatti / cani / casuale. Indipendente dal colore, e insieme al colore determina chi gioca col bianco (chi sceglie gatti e nero avrà gatti neri contro cani bianchi). A differenza del colore viene ricordata fra le partite: è una preferenza estetica, non qualcosa che cambia l'orientamento della scacchiera. Nell'ordine della schermata viene dopo il set (che decide se la domanda ha senso) e prima del colore. Dettagli in `motto-chess-set-cani-gatti.md` sezione 1, meccanica in `themes/factions.js`
6. Colori scacchiera e set pezzi preferito di default → gestiti in Impostazioni, non qui

### Tabella livelli Stockfish (UCI_Elo)

| Livelli | Etichetta italiana | Elo target |
|---|---|---|
| 1–2 | Principiante | 1320–1420 |
| 3–4 | Dilettante | 1420–1520 |
| 5–6 | Amatore | 1520–1650 |
| 7–8 | Intermedio | 1650–1800 |
| 9–10 | Avanzato | 1800–1950 |
| 11–12 | Esperto | 1950–2150 |
| 13–14 | Candidato Maestro | 2150–2350 |
| 15–16 | Maestro | 2350–2600 |
| 17–18 | Maestro Internazionale | 2600–2900 |
| 19–20 | Gran Maestro | 2900–3190 |

## Impostazioni (app-wide, persistenti)

- **Accessibilità**: on/off suoni set tematici; stile narrazione compatto/espanso (vedi sopra)
  - **Notifiche vocali tempo** (attive di default, ciascuna disattivabile singolarmente): avviso al 10% tempo residuo; avviso al 5% tempo residuo; annuncio tempo trascorso ogni 10 minuti (solo partite con tempo > 20 minuti). Vedi dettagli in "Notifiche vocali tempo".
- **Audio**: volume separato per suoni di gioco (default 90%), suoni UI/menu (default 80%) e musica di sottofondo (default 15%, volutamente basso per non competere con narrazione e suoni di gioco/set — non esiste un volume "voiceover" separato: VoiceOver è lo screen reader dell'utente, il suo volume è dell'OS, non dell'app)
- **Grafica scacchiera**: due select indipendenti colore caselle chiare/scure
  - Chiare: bianco, giallo, rosa, verde salvia (default), azzurro
  - Scure: nero, verde oliva, rosso, viola (default), blu
  - Default: chiare `#9CAF88` (verde salvia), scure `#6B4C7A` (viola)
  - Anteprima live + controllo automatico contrasto WCAG con avviso se insufficiente
  - **Convenzione colore-casella (fissa, non configurabile)**: a1 è SEMPRE casella scura (come da standard scacchistico), h1 sempre chiara, pattern alternato standard su tutta la scacchiera di conseguenza. Vale indipendentemente da orientamento/rotazione della scacchiera per il giocatore con il nero.
- **Colore pezzi** (SOLO scacchiera default/classica): pezzi bianchi/neri con fill in una tonalità leggermente diversa (più chiara/scura) rispetto al colore-casella scelto, per non fondersi visivamente; bordo nero costante su entrambi, stroke-width min. 1.5–2px scalabile
- **Lingua**: italiano + future
- **Set pezzi preferito di default**
- **PGN — metadati opzionali da includere** (checkbox): data/ora inizio-fine partita, set scacchi usato (solo tra quelli predefiniti, mai custom), nome giocatori, note libere. Lista mosse sempre inclusa (standard).
- **Informazioni**:
  - Bio autore (testo fornito da Roberto)
  - Email: mottopod@gmail.com (link mailto)
  - Sito: https://mottopodcast.org (link web)
  - Donazioni: https://www.paypal.me/MottoPodcast
  - Ringraziamenti a Lichess per asset grafici (licenza GPL)

## Sound design

### Set default/neutro (14 suoni di gioco, cartella `assets/sounds/default/`)
Mossa, cattura, selezione pezzo, deselezione pezzo, mossa illegale (buzzer elettronico), testo non interpretabile (buzzer elettronico, distinto dal precedente), arrocco, promozione (unico suono per qualsiasi pezzo scelto), scacco, 5 suoni fine partita (vedi sopra), sigla apertura, sigla chiusura. Stile: legno/pietra per mossa/cattura.

Suoni UI/menu (navigazione tra schermate/menu, estetica casinò) separati e NON applicati ai suoni di gioco sopra: cartella dedicata `assets/sounds/ui-menu/`, per ora contiene solo `chess_ui_navigation.wav` (finito lì per errore insieme ai suoni di gioco, spostato); il set completo di suoni UI/menu è ancora da produrre.

`assets/sounds/default/non-usati-v1/chess_turn_change.wav`: prodotto ma non utilizzato in v1 (previsto per il cambio turno, valutato non necessario). Conservato per un eventuale uso futuro, non collegato a nessun evento.

### Set Judo — completo, vedi `motto-chess-set-judo.md` sezione 10
17 suoni, tutti collegati in `sound-manager.js`. Nessuna parola pronunciata da nessuna
parte (nemmeno lo scacco): comunica con suoni d'ambiente da palazzetto sportivo e urla
non verbali. Granularità **maggiore** del set default su alcuni eventi (sei categorie di
cattura e due di scacco, differenziate per pezzo) e **minore** su altri (selezione e
deselezione condividono un file, mossa illegale e comando non capito pure, così le tre
categorie d'esito vittoria/sconfitta/patta al posto delle cinque del default). Pezzi
bianchi = judogi bianco; pezzi "neri" (standard scacchistico) = judogi blu (visivamente
blu, notazione resta nera). Caselle fisse avorio/navy, non ricolorabili (vedi
`motto-chess-set-judo.md` sezione 3 per il perché non sono bianco/blu puri).

### Set Cani vs Gatti (a fazioni, granularità minima) — dettagli in `motto-chess-set-cani-gatti.md` sezione 8
- Un suono generico "cane" per tutti i pezzi cani, un suono generico "gatto" per tutti i pezzi gatti (movimento e cattura). Sui movimenti si sentono le zampe, non le voci: miagolio e abbaio sono riservati alle catture, che sono rare
- Sigle apertura/chiusura distinte per fazione, quella del giocatore
- Nove file in tutto. Tutto il resto (scacco, dinieghi, esiti) resta al set default neutro: nessuna deroga al principio generale qui sotto

### Set Samurai vs Ninja (a fazioni, granularità mista — da definire in fase di produzione)
- Movimento personalizzato per singolo tipo di pezzo × fazione (12 suoni)
- Cattura: granularità da decidere pezzo per pezzo in fase di generazione (possibile schema pedone/dama/re/pezzi minori come per Judo)
- Sigle apertura/chiusura distinte per fazione
- Samurai = sempre pezzi bianchi, Ninja = sempre pezzi neri

### Principio generale
Suoni "di sistema" (mossa illegale, scacco, scacco matto, esiti fine partita) restano neutri e condivisi anche nei set a fazioni — **salvo deroga esplicita di un set**, come il set Judo (vedi sopra), che li caratterizza deliberatamente. In `sound-manager.js` questo si traduce così: il toggle "suoni set tematici" non silenzia mai questi eventi, ma quando è disattivato li forza al set default neutro invece che al set tematico attivo.

## Brand identity

- Colori: verde felpa `#0F5C3F`, oro/ottone `#D4A94E`, bordeaux `#5C1A2B`
- Home: titolo "Motto Chess" (heading), immagine hero (pedone dorato/ombra samurai, alt breve non descrittivo completo), poi 4 pulsanti: **Gioca subito**, **Opzioni partita**, **Partite salvate (PGN)**, **Impostazioni**
- Pulsanti: fondo bordeaux/verde scuro, bordo oro sottile 2-3px, testo crema/oro chiaro (NO testo dorato su verde chiaro, verificare sempre contrasto)
- Font decorativo solo per titolo/logo, font pulito e leggibile per tutti i controlli interattivi

## Assets grafici pezzi

- Set classico: SVG Cburnett da Lichess (licenza GPLv2+), ricolorabile via `fill`/`stroke` dato che sono vettoriali
- Set tematici (Samurai/Ninja, Judo, Cani/Gatti): illustrazioni originali, generate via Gemini da prompt dettagliati

## Licenza repository

**GPL-3.0** — obbligatoria per compatibilità con asset Lichess (SVG pezzi, eventuale uso di Chessground). Repo pubblica su GitHub.

## Roadmap post-v1 (non bloccante per ora)

- Multiplayer online (aggiunta proposta patta funzionante, matchmaking)
- Ulteriori set tematici
- Eventuale 21° livello Stockfish "libero" (senza limite Elo) se richiesto in futuro

## Scope v1

**v1 include il set pezzi Classico** (SVG Cburnett da Lichess) con il set sonoro default, **e il set Judo** (illustrazioni raster + set sonoro proprio), entrambi completi e selezionabili. **Cani vs Gatti** è selezionabile e giocabile dall'11 settembre 2026 con la meccanica delle fazioni completa, ma con pezzi classici come segnaposto e suoni del set default: mancano i suoi dodici disegni e i suoi nove suoni (vedi `motto-chess-set-cani-gatti.md`). Samurai vs Ninja non è selezionabile: assets grafici e sonori non ancora pronti (vedi sotto). L'architettura a moduli disaccoppiati (`themes/i18n-voice`, `themes/factions`, `sound-manager` con `GAME_SETS`, ecc.) resta comunque predisposta per aggiungerli senza refactoring.

## Asset pronti

- **Set sonoro default (14 suoni di gioco)** — completo, cartella `assets/sounds/default/`. Sigla di chiusura generata come placeholder (`chess_session_end_placeholder_v1.mp3`, via ElevenLabs sfx, formato mp3 mentre gli altri sono wav): da sostituire con versione definitiva nello stesso stile/formato prima del rilascio.
- **SVG pezzi set Classico** (Cburnett, Lichess, GPLv2+) — scaricati, cartella `assets/pieces/classico-cburnett/` (12 file + `LICENSE-cburnett.txt` con attribuzione).
- **Set pezzi Judo** — illustrazioni raster, cartella `assets/pieces/judo/` (12 PNG). Judogi bianco/blu fissi, non ricolorabili (vedi `motto-chess-set-judo.md` sezione 3).
- **Set sonoro Judo (17 suoni di gioco)** — completo, cartella `assets/sounds/judo/`, collegato in `sound-manager.js`. Dettagli in `motto-chess-set-judo.md` sezione 10.

## Da produrre (asset non ancora pronti)

- Set sonoro e grafico Samurai vs Ninja
- **Cani vs Gatti**: 12 illustrazioni (prompt Gemini pronti, `motto-chess-set-cani-gatti.md` sezioni 6-7) e 9 suoni (prompt pronti, sezione 8). La meccanica delle fazioni è già fatta e in uso
- Illustrazioni pezzi Samurai vs Ninja (Gemini)
- Set sonoro UI/menu completo (estetica casinò) — al momento solo `assets/sounds/ui-menu/chess_ui_navigation.wav`
