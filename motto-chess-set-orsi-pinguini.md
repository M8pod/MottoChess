# Motto Chess — Set pezzi "Orsi polari vs Pinguini"

Quarto set tematico. Per tutto ciò che vale per qualunque set (post-produzione, requisiti
dei file, narrazione in bianco/nero) si rimanda a `motto-chess-set-judo.md` e
`motto-chess-set-cani-gatti.md`.

**Stato al 19 novembre 2026**: i dodici pezzi sono fatti, approvati da Roberto e installati in `assets/pieces/orsi-pinguini/`; scacchiera di ghiaccio a mosaico attiva. Scelte: torri coppia 2; pedone orso v1 / pinguino v2; alfiere orso v1 / pinguino v2; cavallo, dama, re v1 per entrambi (sorgenti e scarti in `orsi-pinguini-lavori/`). Suoni completati e installati il 19/11 (vedi sezione 6).
Scadenza: **sabato 21 novembre 2026**, presentazione ufficiale di Motto Chess in diretta
WhatsApp al gruppo di scacchi (dove gli utenti vengono chiamati "pinguini"). Niente prove
al gruppo prima della diretta.

## 1. Fazioni

- **Orsi polari = bianco** (esercito chiaro).
- **Pinguini = nero** (esercito scuro).
- Fazione legata al colore, come nei cani-gatti dall'11/11. Narrazione e PGN restano
  "bianco" e "nero".
- File nominati per fazione: `orsiK.png` … `pinguiniP.png` in `assets/pieces/orsi-pinguini/`.

## 2. Principio guida: lo stesso oggetto per lo stesso pezzo

Lezione del set cani-gatti: con pose diverse per specie la gente non distingueva i pezzi.
Qui **ogni tipo di pezzo ha lo stesso oggetto e la stessa sagoma nelle due squadre**,
come negli scacchi classici. Prima si legge l'oggetto (igloo = torre), poi il colore.

| Pezzo | Segno comune | Orsi | Pinguini | Altezza |
|---|---|---|---|---|
| Re | corona di ghiaccio alta con croce di cristallo + mantello | grande orso seduto | pinguino imperatore | 0.95 |
| Dama | diadema di ghiaccioli a raggiera + sciarpa lunga | orsa in piedi | pinguina | 0.90 |
| Alfiere | berretto di lana a punta, altissimo, col pon-pon (mitra) | orso | pinguino | 0.88 |
| Cavallo | unico di profilo: scivolata di pancia sul ghiaccio | orso | pinguino | 0.80 |
| Torre | igloo a cupola con l'animale che sbuca dalla porta | igloo di neve bianca | igloo di ghiaccio scuro | 0.62 (larga) |
| Pedone | cucciolo con un pesce in bocca | orsetto | pulcino grigio scuro | 0.58 |

## 3. Palette

- Contorno nero uniforme e spesso su tutto. **Niente bordo adesivo bianco** (sparirebbe
  sugli orsi).
- **Orsi**: pelo bianco panna caldo `#F4EEE2`, naso e occhi neri. Accessori **azzurro
  ghiaccio** `#7FD3F0` (sciarpe, corona di ghiaccio, berretto).
- **Pinguini**: dorso e testa nero bluastro `#1C2230`, pancia **grigio chiaro** `#C9CED6`
  ristretta (mai bianco puro), sempre di **tre quarti** perché domini il nero. Becco e
  zampe **arancio** `#F08A24`, macchia gialla al collo `#F6C443`. Accessori arancio.
- Ghiaccio della corona: azzurro `#BFE9F7` con contorno nero.
- Caselle: da misurare dopo i primi pezzi. Ipotesi: chiara `#CFE3EE`, scura `#5F8FA8`.
  Da registrare in `PIECE_SET_SQUARE_COLORS`.

## 4. Generazione

Con Tsukuri: `immagina --muto --varianti 2 "<prompt>"`, sfondo magenta pieno, poi:

```
python3 tools/process_piece.py <sorgente.png> assets/pieces/orsi-pinguini/<nome>.png <altezza> 168
```

Ordine: torri → controllo sagome e caselle → gli altri dieci pezzi → controllo finale
(tutte le sagome nere a 40 px: se due si somigliano, quel pezzo si rifà).

### Blocco fisso

```
Flat 2D vector-style chess game piece illustration, single character, full body,
centered, on a perfectly flat solid MAGENTA background (#FF00FF) filling the whole image.
Bold clean pure black outline of uniform thickness around the whole silhouette and every
shape, completely flat colours, no gradients, no shading, no texture, small white shine
dot in each eye only. No drop shadow, no ground, no snow on the ground, no text, no
border. Nothing touches the image edges. Never use magenta or pink anywhere on the
character. Cute picture-book style, chubby, recognisable as a silhouette at 50 pixels.
```

## 5. Suoni (dopo le immagini)

Ogni suono in **almeno due versioni**, fatte ascoltare a Roberto, che sceglie.

- Sigla iniziale per colore: `op_session_orsi`, `op_session_pinguini`.
- Mossa: passi sulla neve (orsi pesanti e gravi, pinguini passetti ondeggianti acuti).
- Cattura: ghiaccio che si spezza + verso breve (brontolio orso, raglio pinguino).
- Arrocco: blocchi dell'igloo che scivolano. Promozione: scintillio di cristalli.
- Vittoria, sconfitta per fazione; patta neutra (vento, due versi stanchi).
- Regole comuni: sempre all'aperto con un filo di vento, volume uniformato, orsi nei
  bassi, pinguini negli acuti. Nomi file come i cani-gatti con prefisso `op_`.

## 6. Suoni scelti da Roberto (19 novembre 2026)

In `assets/sounds/orsi-pinguini/`, registrati in `GAME_SETS['orsi-pinguini']` (`src/ui/sound-manager.js`), stessa logica per fazione dei cani-gatti. Fonti Freesound tutte CC0 in `FONTI-freesound-CC0.tsv`; lavorazione in `orsi-pinguini-lavori/suoni/crea.py`, scelte in `SCELTE.txt`.

- Mossa orsi: un passo pesante su neve (scarponi, abbassato di tono). Mossa pinguini: tre passetti leggeri su neve compatta, alzati.
- Cattura orsi: due crepe di ghiaccio + ringhio d'orso. Cattura pinguini: lastra che si spezza (acuta) + richiamo vero di pinguino (colonia in Antartide).
- Arrocco: scivolata sul ghiaccio + due mattoni d'igloo. Promozione: scintillio di gemma. Tocco: tintinnio di vetro breve.
- Sigle (inizio e fine): musica Ongaku/ACE-Step con il verso della squadra all'inizio.
- Vittoria: verso + fanfara. Sconfitta: musica triste buffa + verso rallentato alla fine. Patta: accordi calmi, uguale per tutti.
- Scacco, mossa illegale e comando non capito: set default.

## 7. Musica di sottofondo "Polo Nord (Natale)" (19 novembre 2026)

`assets/sounds/ambient/polonord_loop_v1.mp3`, 4 minuti in loop senza giunta, versione B "Tormenta gentile" scelta da Roberto: vento artico, tappeto Ongaku appena accennato, tintinnii rari, renne con slitta che passano da sinistra a destra, "oh oh oh" lontano, gufo. Niente ghiaccio, ringhi, pinguini o passi (sono suoni del gioco). Riservata ai set elencati in `sets` (`AMBIENT_TRACKS.polonord`, oggi solo Orsi vs Pinguini; aggiungere lì i futuri set natalizi): in Opzioni partita compare e viene proposta da sola solo con quel set. Composizione: `orsi-pinguini-lavori/suoni/ambiente/componi.py B`; fonti CC0 in `assets/sounds/ambient/FONTI-polonord-freesound-CC0.tsv`.
