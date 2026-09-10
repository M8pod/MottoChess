# Motto Chess — Set pezzi "Cani vs Gatti"

Documento di lavoro del terzo set tematico. Stessa struttura del set Judo
(`motto-chess-set-judo.md`), a cui si rimanda per tutto ciò che vale per qualunque set:
pipeline di post-produzione delle immagini, criteri di accettazione, metodo di
generazione.

**Stato al 11 settembre 2026**: meccanica di gioco completa e già provabile; disegni e
suoni da produrre. Il set è selezionabile in Opzioni partita e usa i pezzi classici come
segnaposto finché i dodici PNG non sono in `assets/pieces/cani-gatti/`.

## 1. Cos'ha di diverso questo set: le fazioni

È il primo set in cui i due schieramenti non sono "il bianco" e "il nero" ma due
**specie**, e in cui il giocatore sceglie **quale delle due impersonare**.

Le domande in Opzioni partita diventano tre, in quest'ordine:

1. **Set pezzi** → Cani vs Gatti
2. **Chi vuoi impersonare?** → Gatti / Cani / Casuale
3. **Colore** → Bianco / Nero / Casuale

Le ultime due sono **indipendenti** e insieme determinano tutto: la fazione scelta prende
il colore scelto, l'altra fazione prende l'altro colore. Chi sceglie *gatti* e *nero*
gioca coi gatti neri contro i cani bianchi. La scacchiera resta orientata secondo il
colore, come in qualsiasi altra partita, e chi muove per primo resta il bianco.

Conseguenza importante sui disegni: **servono dodici immagini, non ventiquattro.** Gli
stessi gatti giocano col bianco o col nero a seconda della partita; a distinguere i due
schieramenti è la specie, non il colore del pelo. Per questo i file sono nominati per
fazione (`gattiP.png`, `caniK.png`) e non per colore.

### Cosa NON cambia: la narrazione

Narrazione VoiceOver, notazione e PGN continuano a dire **bianco e nero** ("cavallo
bianco in Empoli 4"), non "cavallo gatto". Decisione presa il 10 settembre 2026: bianco e
nero sono lo standard scacchistico che il giocatore usa anche per *scrivere* le proprie
mosse nel campo comandi, e due vocabolari paralleli per la stessa cosa sarebbero un costo
cognitivo inutile proprio nel momento in cui si sta ragionando sulla posizione. La
fazione vive quindi negli **occhi** (disegni) e nelle **orecchie** (suoni), non nelle
parole.

## 2. Vincolo fondamentale: leggibilità a 50 pixel

Vale identico al set Judo. La casella arriva a ~56 px sugli schermi piccoli: la figura
deve restare riconoscibile come silhouette. Nel Judo il problema era distinguere sei
judoka diversi; qui è più facile — **gatto e cane si distinguono già dalla sagoma delle
orecchie e dalla coda** — ma il problema si sposta sul distinguere i sei *ruoli* dentro
la stessa specie.

Soluzione adottata: ogni tipo di pezzo ha una **posa** propria, condivisa fra le due
specie, così la scacchiera si legge per forma anche prima che per specie. Re e dama
prendono in più la corona, che è la convenzione scacchistica che tutti riconoscono.

## 3. Palette

Il set è **non ricolorabile**, come il Judo: i colori sono l'identità delle due fazioni.

### Fazioni

- **Gatti**: grigio ardesia `#4A4E57`, pelo unito, con **petto e zampe bianco crema**
  `#F5F0E6` e occhi verdi `#7BC47F`.
- **Cani**: beige dorato `#D9A441`, pelo unito, con **muso e petto crema** `#F5EAD2` e
  occhi marroni `#5B3A21`.

Le due fazioni sono volutamente una **scura** e una **chiara**: qualunque sia il colore
che il giocatore sceglie, la scacchiera continua a presentare un esercito chiaro e uno
scuro, che è il modo in cui l'occhio legge da sempre una posizione.

- Contorno nero `#1A1A1A` uniforme su tutto, spessore costante. **È il contorno a
  salvare la leggibilità**: essendo il set a fazioni, gli stessi disegni finiscono sia su
  caselle chiare sia su caselle scure, e senza un bordo netto il beige dei cani
  sparirebbe su una casella avorio.
- Corona (re e dama): oro `#D4A94E`, lo stesso oro del marchio Motto Chess.
- Collare: bordeaux `#5C1A2B` per i cani, verde felpa `#0F5C3F` per i gatti — i due
  colori del marchio, usati come segno di appartenenza.

### Caselle predefinite del set

Da decidere **dopo aver visto i primi disegni**, come è stato fatto per il Judo (dove la
scelta avorio/navy è arrivata solo dopo aver provato i judogi su caselle bianche e blu).
Ipotesi di partenza da verificare: chiara **avorio** `#F2EDE4`, scura **viola**
`#6B4C7A` — nessuna delle due vicina né al grigio ardesia dei gatti né al beige dei cani.
Quando la scelta è presa va registrata in `PIECE_SET_SQUARE_COLORS` (`session/settings.js`),
esattamente come per il Judo.

## 4. Requisiti tecnici dei file

Identici al set Judo (sezione 4 di quel documento): PNG con canale alfa, sfondo
trasparente, canvas quadrato, generazione 1024×1024 e consegna a 168×168, nessuna ombra
portata né ellisse di terra, figura centrata su una linea di terra comune, nessun testo o
firma. La post-produzione si fa con lo script già presente:

```
python3 tools/process_piece.py <sorgente.png> <destinazione.png> <rapporto altezza> 168
```

**Cartella**: `assets/pieces/cani-gatti/`

**Nomi** (per fazione, non per colore — vedi sezione 1):

- `gattiP.png` `gattiR.png` `gattiN.png` `gattiB.png` `gattiQ.png` `gattiK.png`
- `caniP.png` `caniR.png` `caniN.png` `caniB.png` `caniQ.png` `caniK.png`

## 5. Gerarchia delle altezze

Rapporti da passare a `process_piece.py`, sulla falsariga del Judo:

- Re: `0.95` — il più alto, in piedi, corona grande
- Dama: `0.90` — in piedi, corona piccola, coda alta
- Alfiere: `0.86` — seduto eretto, orecchie molto lunghe
- Cavallo: `0.86` — di profilo, in balzo
- Pedone: `0.62` — cucciolo seduto, il più piccolo
- Torre: `0.55` di altezza ma fino al `0.95` di larghezza — l'unico pezzo accovacciato

## 6. Prompt — blocco fisso

Da anteporre, identico, a ogni pezzo. In inglese: i modelli di immagine rispondono in
modo più fedele. Le due varianti fra parentesi quadre sono l'unica cosa che cambia fra
gatti e cani.

```
Flat 2D vector-style game asset of a [CAT / DOG] character, full body, centered on a
square canvas, standing on a common ground line.

Style: bold clean black outline of uniform thickness around every shape, completely
flat colours, no gradients, no shading, no texture, no highlights, no fur strands drawn
as texture. Transparent background. No drop shadow, no ground ellipse, no text, no
logos, no border.

Readability: the figure must remain recognisable as a silhouette at 50 pixels. Use
large simple shapes, a clearly readable head silhouette, and clear negative space
between limbs and body. Ears and tail are the main species cue and must stay fully
separated from the body outline.

Species cue: [a CAT with tall pointed triangular ears, a small triangular muzzle, long
whiskers, and a long thin flexible tail /
a DOG with folded floppy ears hanging down, a broad rounded muzzle with a large nose,
and a short thick tail].

Colours: body a single flat [SLATE GREY #4A4E57 / GOLDEN BEIGE #D9A441]; chest and paws
flat [CREAM WHITE #F5F0E6 / CREAM #F5EAD2]; eyes [green #7BC47F / brown #5B3A21].
Folds and details are drawn only as black outlines, never as darker shades of the body
colour.

Proportions: friendly, slightly stylised, big head relative to the body, in the spirit
of a simple children's book illustration. Not realistic, not 3D, not chibi-cute with
oversized eyes.
```

Nota sul perché tanta insistenza sulle orecchie e sulla coda: a 50 pixel il muso
scompare, e l'unica cosa che resta a dire "gatto" o "cane" è il profilo esterno della
sagoma. Se il modello disegna un cane con le orecchie dritte, il pezzo è da rifare anche
se preso da vicino è bellissimo.

## 7. I sei pezzi

Per ciascuno: la posa, uguale nelle due specie, e cosa cambia fra gatto e cane. Il testo
va aggiunto in coda al blocco fisso.

### Pedone — `gattiP.png` / `caniP.png`

**Cucciolo seduto di fronte**, zampe anteriori dritte appoggiate a terra, coda arrotolata
attorno alle zampe (gatto) o appoggiata di lato (cane), orecchie ben visibili. Nessun
accessorio: il pedone è l'unico pezzo senza collare, e questo lo distingue da tutti gli
altri anche in silhouette. Testa grande, corpo piccolo e tondo.

```
Pose: a young kitten/puppy sitting upright facing the viewer, front paws straight on the
ground, small round body, oversized head, ears clearly visible above the head outline.
No collar, no accessory of any kind.
```

### Torre — `gattiR.png` / `caniR.png`

**Accovacciato, visto di fronte**, il pezzo più largo e più basso del set: il gatto nella
posa "pagnotta" (zampe nascoste sotto il corpo), il cane sdraiato in posa da sfinge con
le zampe anteriori distese in avanti. Immobile, massiccio, guardiano. Collare visibile.
È l'unico pezzo che riempie il canvas in orizzontale.

```
Pose: crouching low and facing the viewer, wide and compact and massive, the widest and
lowest figure of the set. A cat in "loaf" position with paws tucked completely under the
body / a dog lying in sphinx position with front legs stretched forward. Calm, still,
guarding. Wearing a plain flat collar.
```

### Cavallo — `gattiN.png` / `caniN.png`

**Di profilo, in balzo**, l'unico pezzo di profilo puro — esattamente come il cavallo del
set classico, ed è quel profilo a renderlo immediatamente riconoscibile. Zampe anteriori
staccate da terra, schiena inarcata, coda tesa all'indietro. Collare visibile.

```
Pose: full side profile, mid-leap, front legs off the ground, back arched, tail
stretched out behind. The only piece drawn in pure side view. Wearing a plain flat
collar.
```

### Alfiere — `gattiB.png` / `caniB.png`

**Seduto eretto, allungato verso l'alto**, in tre quarti, con **orecchie
esageratamente lunghe** — è il tratto che lo distingue dal pedone, che ha la stessa posa
seduta ma è basso e con orecchie normali. Il gatto ha orecchie a punta molto alte, il
cane orecchie a bandiera molto lunghe che scendono oltre il mento. Collare visibile.

```
Pose: sitting upright in three-quarter view, body stretched tall and slender, head high.
Exaggeratedly long ears: very tall pointed ears for the cat, very long hanging ears
reaching below the chin for the dog. This is the tall thin piece of the set. Wearing a
plain flat collar.
```

### Dama — `gattiQ.png` / `caniQ.png`

**In piedi su quattro zampe, elegante**, testa alta, coda sollevata a formare una curva
alta e visibile (la S del gatto, la coda alzata del cane). Porta una **corona piccola e
sottile** in oro. È il secondo pezzo più alto.

```
Pose: standing on all four legs in three-quarter view, elegant and poised, head held
high, tail raised in a tall visible curve. Wearing a small thin golden crown with three
points, sitting between the ears. No collar (the crown replaces it).
```

### Re — `gattiK.png` / `caniK.png`

**In piedi, frontale, maestoso**, il più alto del set. Petto in fuori, testa alta, coda
bassa e rilassata. Porta una **corona grande a cinque punte** in oro e un **piccolo
mantello** appoggiato sulle spalle nel colore del collare della fazione (bordeaux per i
cani, verde per i gatti). Corona e mantello insieme lo rendono distinguibile dalla dama
anche a 50 pixel.

```
Pose: standing facing the viewer, chest out, head high, regal and calm, the tallest
figure of the set. Wearing a large five-pointed golden crown and a short cape resting on
the shoulders in flat [dark green #0F5C3F / burgundy #5C1A2B]. The crown is clearly
larger than the queen's.
```

## 8. Set sonoro

### Principio guida

Vale la regola imparata col set Judo: **niente parlato sugli eventi frequenti**, perché
si sovrappone all'annuncio del narratore e rende incomprensibili tutti e due. Qui però la
tentazione è più forte del solito — un set con cani e gatti "chiede" miagolii e
abbai — e va resistita: un miagolio a ogni mossa, sessanta volte per partita, diventa
insopportabile alla terza partita e copre la voce di VoiceOver proprio mentre annuncia la
mossa.

Da cui la scelta: **sui movimenti si sentono le zampe, non le voci.** Miagolio e abbaio
sono riservati alle catture, dove l'evento è raro e drammatico.

### La cosa che questo set può fare e gli altri no

I suoni sono **per fazione**, quindi ogni mossa dice *da sola* chi ha mosso: zampe felpate
= i gatti, unghiette sul pavimento = i cani. Per chi gioca senza vedere è un'informazione
che oggi arriva solo dalla narrazione, e che qui arriva prima, più corta e senza parole.
È il vero motivo per cui vale la pena fare un set a fazioni.

Il codice è già pronto a riceverlo: `game-screen.js` passa al gestore suoni la fazione di
**chi compie l'azione** (come già fa col pezzo, che nelle catture è quello che mangia).

### I nove suoni

Granularità minima, come da specifica. Tutto ciò che non è elencato qui (scacco, mossa
illegale, comando non capito, esiti di fine partita) resta al **set default neutro**: è
la scelta più semplice e rispetta il principio generale per cui i suoni di sistema non si
caratterizzano, salvo deroga esplicita del set — deroga che il Judo si è preso e che
questo set non si prende.

**Eventi frequenti (nessuna voce, corti)**

1. `cg_move_gatti` — mossa di un pezzo gatto. **Zampe felpate su parquet**: due tocchi
   morbidi e ovattati, quasi senza attacco. 120-200 ms.
   > *Soft padded cat paws stepping twice on a wooden floor, very soft muffled thuds, no
   > claws, no voice, dry close recording, 0.2 seconds*
2. `cg_move_cani` — mossa di un pezzo cane. **Unghiette sul pavimento**: due tocchi con
   un piccolo click secco sopra, più bassi e più pesanti del gatto. 150-250 ms.
   > *Dog claws clicking twice on a hardwood floor, small dry clicks with a soft heavy
   > paw thud, no voice, dry close recording, 0.25 seconds*

   Il contrasto fra i due — acuto e ovattato contro basso e ticchettante — è la cosa da
   verificare per prima all'ascolto: se non si distinguono a occhi chiusi, il set non
   funziona.
3. `cg_capture_gatti` — cattura eseguita da un gatto. **Soffio + zampata**: sibilo breve
   e schiocco secco. Nessun miagolio lamentoso. 400-600 ms.
   > *Angry cat hiss followed immediately by a fast paw swat impact, short and sharp, no
   > meowing, dry, 0.5 seconds*
4. `cg_capture_cani` — cattura eseguita da un cane. **Un solo abbaio secco + schiocco di
   mascelle**. Un abbaio, non una serie. 400-600 ms.
   > *One single sharp dog bark followed by a quick jaw snap, close and dry, no echo, no
   > barking series, 0.5 seconds*
5. `cg_touch` — selezione **e** deselezione al tocco, stesso file per entrambi (come il
   `judo_touch`). **Tintinnio della medaglietta al collare**, brevissimo. 150-250 ms.
   Neutro, non per fazione: è un gesto dell'interfaccia, non un'azione dei personaggi.
   > *A small metal pet tag jingling once against a collar ring, single short bright
   > tink, dry, 0.2 seconds*

**Situazioni particolari**

6. `cg_castle` — arrocco. **Due animali che si scambiano di posto**: trotto rapido di
   quattro zampe con un tintinnio di medaglietta sopra. Neutro. 500-700 ms.
   > *Two small animals trotting quickly past each other on a wooden floor, light fast
   > paw steps, a pet tag jingling, 0.6 seconds*
7. `cg_promotion` — promozione del pedone: il cucciolo diventa dama. **Squeak di gioco di
   gomma ascendente + campanellino**. Neutro, allegro, l'unico suono davvero "premiante"
   del set. 600-800 ms.
   > *A rubber squeaky toy squeak rising in pitch, followed by a small bright bell ding,
   > cheerful, 0.7 seconds*
8. `cg_session_gatti` — sigla di apertura e chiusura quando il giocatore impersona i
   gatti (stesso file per inizio e fine, come nel Judo). **Fusa che crescono, chiuse da
   un miagolio breve e interrogativo**. 1,5-2 s.
   > *A cat purring softly, rising in volume, ending with one short questioning meow,
   > warm and close, 1.8 seconds*
9. `cg_session_cani` — la stessa cosa per i cani. **Ansimare felice + un guaito breve,
   con tintinnio di medaglietta della coda che scodinzola**. 1,5-2 s.
   > *A happy dog panting, a collar tag jingling from a wagging tail, ending with one
   > short excited whine, warm and close, 1.8 seconds*

Le sigle sono **quelle della fazione del giocatore**, non dell'avversario: la partita si
apre e si chiude con la voce della propria squadra.

### Cosa manca lato codice quando i suoni arrivano

Due interventi, entrambi piccoli, in `ui/sound-manager.js`:

1. Aggiungere la voce `'cani-gatti'` a `GAME_SETS`, con la sua `resolve(name, ctx)` che
   usa `ctx.faction` per scegliere fra la variante gatti e quella cani:
   `move` → `move_${ctx.faction}`, `capture` → `capture_${ctx.faction}`,
   `select`/`deselect` → `touch`, `session_start`/`session_end` → `session_${ctx.faction}`.
2. Fare in modo che un set **parziale** ricada sul set default per gli eventi che non
   definisce: oggi `playGame` esce in silenzio se il set attivo non ha un file per quella
   chiave (`if (!file) return`), e questo set — che lascia di proposito scacco, esiti e
   dinieghi al default — resterebbe muto proprio lì. Serve un ripiego esplicito sul file
   corrispondente di `GAME_SETS.default`.

Finché la voce `'cani-gatti'` non esiste in `GAME_SETS`, il ripiego avviene già da solo:
il set attivo non viene trovato e suona interamente il set default. Il gioco è quindi
completo e sonoro fin da subito.

## 9. Stato del codice — fatto l'11 settembre 2026

Meccanica delle fazioni completa e attiva:

- `themes/factions.js` (nuovo) — descrive i set a fazioni e scioglie la mappatura
  colore → fazione per la partita.
- `themes/pieces.js` — nomi file per fazione (`byFaction`) e ripiego automatico sui pezzi
  classici finché `artReady` è `false`. **Quando i dodici PNG sono in cartella, l'unica
  riga da cambiare è `artReady: false` → `true`.**
- `ui/board.js` — la fazione entra nella firma del pezzo disegnato, così un cambio di
  fazione ridisegna la casella.
- `ui/screens/options-screen.js` — set → fazione → colore, in quest'ordine; il riquadro
  della fazione compare solo per i set che la prevedono.
- `ui/screens/home-screen.js` — "Gioca subito" riusa la fazione dell'ultima
  configurazione salvata.
- `ui/screens/game-screen.js` — passa la mappatura alla scacchiera e la fazione di chi
  agisce al gestore suoni.
- `session/options.js` — la fazione viene ricordata fra una partita e l'altra (a
  differenza del colore, che è sempre da scegliere).

Da fare: i dodici disegni, i nove suoni, la scelta definitiva dei colori casella.
