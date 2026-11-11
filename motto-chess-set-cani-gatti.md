# Motto Chess — Set pezzi "Cani vs Gatti"

Documento di lavoro del terzo set tematico. Stessa struttura del set Judo
(`motto-chess-set-judo.md`), a cui si rimanda per tutto ciò che vale per qualunque set:
pipeline di post-produzione delle immagini, criteri di accettazione, metodo di
generazione.

**Stato al 11 settembre 2026**: meccanica di gioco completa e già provabile; disegni e
suoni da produrre. Il set è selezionabile in Opzioni partita e usa i pezzi classici come
segnaposto finché i dodici PNG non sono in `assets/pieces/cani-gatti/`.

## 0. Direzione artistica v2 — decisa il 10 novembre 2026

**Questa sezione sostituisce le sezioni 3 (palette delle fazioni), 5, 6 e 7 dove sono in
conflitto.** Resta valido tutto il resto: fazioni scelte dal giocatore, narrazione in
bianco/nero, nomi dei file, requisiti tecnici.

### Idea

Pezzi **divertenti e personali**, non più la stessa posa per le due specie. Il re dei cani
è **Roger**, il cane guida di Roberto. Ogni pezzo ha una posa propria e riconoscibile in
silhouette; re e dama sono gli unici con un oggetto in testa, le torri le uniche sdraiate.

### Palette: un esercito scuro e uno chiaro

- **Cani = esercito scuro.** Roger labrador nero (`#2E2B29`); gli altri cani labrador
  cioccolato (`#5A3A22`). Muso e dettagli con linee nere, occhi marroni lucidi, lingua rosa
  `#E8829A`.
- **Gatti = esercito chiaro.** Gatti rossi tigrati: arancio `#E8913A` con strisce
  `#C46A1F`, petto e zampe crema `#F6E3C6`, occhi verdi `#7BC47F`.
- Oro del marchio `#D4A94E` per gli oggetti "regali" (ciotola di Roger, scatoletta del re
  gatto, collane delle dame).
- **Bordo adesivo**: contorno nero uniforme disegnato da Gemini, più un bordo **bianco**
  esterno identico su tutti i pezzi, aggiunto da `process_piece.py --sticker`. È quello
  che rende ogni pezzo leggibile su qualunque casella, anche Roger nero su casella scura.
- Pezzi e caselle **non ricolorabili**, come nel Judo. Colori casella da scegliere dopo i
  primi pezzi veri, misurando i contrasti nell'app.

### Pezzi

| | Cani (scuri) | Gatti (chiari) | Altezza |
|---|---|---|---|
| Re | **Roger**: labrador nero seduto, ciotola di crocchette dorata in testa come corona (le crocchette che sbordano fanno le punte), lingua fuori slurposa | Gatto grasso seduto con una scatoletta di tonno aperta dorata in testa come corona, aria soddisfatta | 0.95 |
| Dama | Labrador cioccolato elegante in piedi, collana di ossicini dorati, coda alzata | Gatta elegante in piedi, coda a punto interrogativo, collana di pesciolini dorati | 0.90 |
| Alfiere | Cane in piedi sulle zampe posteriori che "fa la bella", alto e stretto | Gatto in piedi sulle zampe posteriori che si stiracchia verso l'alto | 0.88 |
| Cavallo | Cane di profilo in salto per prendere una pallina | Gatto di profilo che balza su un gomitolo | 0.85 |
| Torre | Cane che dorme felice appallottolato a ciambella | Gatto che dorme sopra un cuscino | 0.55 (larga) |
| Pedone | Cucciolo seduto con un osso in bocca | Gattino seduto con una zampa alzata a giocare | 0.62 |

### Prompt — blocco fisso v2

Da anteporre a ogni pezzo. Le parti fra parentesi quadre cambiano fra cani e gatti.

```
Flat 2D vector-style game piece illustration of a single [DOG / CAT] character, full body,
centered, on a perfectly flat solid MAGENTA background (#FF00FF) filling the whole image.

Style: bold clean pure black outline of uniform thickness around the whole silhouette and
every shape, completely flat colours, no gradients, no shading, no texture, no highlights
except a single small white shine dot in each eye. No drop shadow, no ground, no floor, no
ground ellipse, no text, no letters, no "Zzz", no logos, no border, no frame. Nothing
touches the image edges. The background must stay pure flat magenta with no other colour,
and the character must not use magenta or pink-purple anywhere except the tongue.

Readability: the figure must remain recognisable as a silhouette at 50 pixels: large
simple shapes, clear head silhouette, clear negative space between limbs and body.

Character design: funny, warm and expressive, in the spirit of a children's picture book,
slightly chubby and stylised. Not realistic, not 3D, not chibi with huge eyes.

[DOG: a labrador retriever with floppy ears hanging down and a broad rounded muzzle with a
big nose. / CAT: a ginger tabby cat with tall pointed triangular ears, small muzzle, long
whiskers and a long tail; body flat orange #E8913A with simple darker orange stripes
#C46A1F, chest and paws flat cream #F6E3C6, green eyes #7BC47F.]
```

### Prompt dei pezzi (in coda al blocco fisso)

- **Re cani — Roger** (`caniK.png`): `This is Roger, a BLACK labrador (fur flat very dark
  charcoal #2E2B29, details drawn with black lines, brown eyes). He sits upright facing the
  viewer, happy and proud. On top of his head, worn like a crown, he balances a golden
  dog bowl (#D4A94E) overflowing with brown kibble, the kibble pieces sticking up like the
  points of a crown. His pink tongue (#E8829A) hangs out of his smiling mouth, big and
  slobbery, with one drop of drool. No collar, no harness.`
- **Re gatti** (`gattiK.png`): `A fat, very satisfied ginger cat sitting upright facing the
  viewer, eyes half closed with pleasure. On top of his head, worn like a crown, an open
  golden tuna can (#D4A94E) with the lid curled up behind it like the back of a crown.`
- **Dama cani** (`caniQ.png`): `An elegant CHOCOLATE labrador (fur flat #5A3A22), standing
  on all four legs in three-quarter view, head held high, tail raised, wearing a
  necklace of small golden bones (#D4A94E).`
- **Dama gatti** (`gattiQ.png`): `An elegant ginger cat standing on all four legs in
  three-quarter view, head held high, tail raised in a question-mark curve, wearing a
  necklace of small golden fish (#D4A94E).`
- **Alfiere cani** (`caniB.png`): `A CHOCOLATE labrador (fur flat #5A3A22) standing up on
  its hind legs begging, front paws up, tall and narrow, tongue slightly out, hopeful
  expression.`
- **Alfiere gatti** (`gattiB.png`): `A ginger cat standing up on its hind legs stretching
  upward, front paws raised high, tall and narrow, eyes closed, yawning.`
- **Cavallo cani** (`caniN.png`): `A CHOCOLATE labrador (fur flat #5A3A22) seen in pure
  side profile, mid-leap, all four paws off the ground, catching a yellow tennis ball in
  its mouth, ears flying.`
- **Cavallo gatti** (`gattiN.png`): `A ginger cat seen in pure side profile, mid-pounce,
  front paws reaching for a small blue ball of yarn, back arched, tail stretched out.`
- **Torre cani** (`caniR.png`): `A CHOCOLATE labrador (fur flat #5A3A22) fast asleep, curled
  up into a tight round ball like a doughnut, nose tucked into its tail, blissful smile,
  eyes closed. Wide and low.`
- **Torre gatti** (`gattiR.png`): `A ginger cat fast asleep, curled up on top of a plump
  square red cushion (#5C1A2B) with a gold tassel at each corner, blissful smile, eyes
  closed. Wide and low.`
- **Pedone cani** (`caniP.png`): `A small CHOCOLATE labrador puppy (fur flat #5A3A22)
  sitting facing the viewer, round body, big head, holding a white bone in its mouth.`
- **Pedone gatti** (`gattiP.png`): `A small ginger kitten sitting facing the viewer, round
  body, big head, one front paw raised playfully.`

### Post-produzione

```
python3 tools/process_piece.py <sorgente.png> assets/pieces/cani-gatti/<nome>.png <altezza> 168 --sticker 4
```

Lo sfondo magenta viene riconosciuto da solo; l'alone viola sul contorno viene ripulito.

### Suoni: aggiunte alla sezione 8

Oltre ai nove suoni della sezione 8, per decisione di Roberto anche gli **esiti finali**
sono caratterizzati (deroga al principio generale, come nel Judo), per fazione del
giocatore:

10. `cg_win_cani` — vittoria coi cani: abbaio festoso, coda che sbatte, medaglietta.
11. `cg_win_gatti` — vittoria coi gatti: fusa trionfali e un "mrrraow" soddisfatto.
12. `cg_loss_cani` — sconfitta coi cani: guaito buffo e sospiro.
13. `cg_loss_gatti` — sconfitta coi gatti: miagolio offeso e sbuffo.
14. `cg_draw` — patta, neutro: due animali che sbadigliano insieme.

Scacco, mossa illegale e comando non capito restano al set neutro.

## 1. Cos'ha di diverso questo set: le fazioni

> **Aggiornamento 11 novembre 2026 — fazione legata al colore.** Decisione di Roberto:
> i **gatti sono sempre il bianco** e i **cani sempre il nero**, coerente con "cani
> esercito scuro, gatti esercito chiaro" e come nel Judo (judogi bianco = bianco, blu =
> nero). La domanda "Chi vuoi impersonare?" non c'è più: il giocatore sceglie solo il
> colore. I file restano nominati per fazione. Il testo qui sotto descrive il progetto
> originale con le due scelte indipendenti, e vale solo per la parte sulla narrazione.

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

**Attenzione — verifica dei contrasti fatta il 10 novembre 2026.** L'ipotesi iniziale
(chiara avorio `#F2EDE4`, scura viola `#6B4C7A`) è la peggiore per i gatti:

| | su avorio | su viola |
|---|---|---|
| Gatti grigio ardesia `#4A4E57` | 7,2:1 | **1,17:1** (spariscono) |
| Cani beige `#D9A441` | **1,9:1** | 3,2:1 |

È un limite di fondo: un esercito scuro e uno medio non possono contrastare bene con
entrambe le caselle, e a salvarli sarà soprattutto il contorno nero. Prima di generare
tutti e dodici i pezzi: (1) valutare un sottile alone chiaro fuori dal contorno nero,
aggiunto in post-produzione da `process_piece.py`; (2) generare un solo pedone per specie e
provarlo nell'app su più coppie di caselle; (3) chiedere a Gemini uno sfondo pieno magenta
invece della scacchiera dipinta, perché lo script riconosce solo i grigi di quella e il
petto crema dei gatti è vicino al bianco.
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

Il punto 2 qui sotto è **già fatto** (10 novembre 2026): un set parziale ricade sul set
default per ogni evento che non definisce. Resta solo il punto 1. Testo originale:

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
