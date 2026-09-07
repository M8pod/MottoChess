# Motto Chess — Set pezzi "Judo"

Specifiche per la generazione delle illustrazioni del set Judo (via Gemini) e per la
loro integrazione nell'app. Documento operativo: contiene i prompt pronti all'uso,
i vincoli tecnici e i criteri di accettazione di ogni pezzo.

Convenzione scacchistica: i pezzi "bianchi" sono judoka con **judogi bianco**, i pezzi
"neri" sono judoka con **judogi blu** (come nelle competizioni). La notazione resta
quella standard: nel PGN e nella vocalizzazione restano "bianco" e "nero".

---

## 1. Vincolo fondamentale: leggibilità a 50 pixel

Nell'app una casella misura al massimo **56 pixel** (minimo 36), e il pezzo ne occupa
il 90%. A quella dimensione **volti, cinture, ricami e dettagli del judogi non sono
percepibili**: si distinguono solo l'altezza della figura e la forma della sagoma.

Ogni pezzo è quindi progettato attorno a una geometria di silhouette deliberatamente
diversa dalle altre. È il criterio che prevale su ogni altra considerazione estetica:
se due pezzi hanno sagome simili, il set è sbagliato anche se le illustrazioni sono
belle.

## 2. Palette

I colori sono **piatti**, senza sfumature né ombreggiature. Ogni area è campita con un
colore uniforme, delimitata da un contorno nero.

### Judogi (colore identitario del pezzo)

- Judogi bianco: `#FDFDFB`
- Judogi blu: `#3E6FD9` (blu royal, volutamente **più chiaro e saturo** del blu delle
  caselle)

### Caselle predefinite del set

- Chiare: avorio `#F2EDE4`
- Scure: navy `#243B6B`

Le caselle non sono bianco e blu puri di proposito: un judogi bianco su casella bianca
e un judogi blu su casella blu sparirebbero. La coppia avorio/navy contro judogi
bianco/royal mantiene i pezzi staccati dal fondo in tutte e quattro le combinazioni.

### Altri colori (fissi, non ricolorabili)

- Contorno: nero `#000000`, spessore uniforme e generoso, tracciato chiuso su tutta
  la figura. È l'elemento che garantisce la leggibilità su qualunque colore di casella.
- Incarnato: **rosa chiaro `#F3C9B6`**, identico per tutti i pezzi del set.
- Capelli: neri `#1A1A1A`, tranne il re (grigi, vedi sotto).
- Cinture: bianca (pedone), nera `#1A1A1A` (torre, cavallo, alfiere, dama),
  bianco-rossa (re).

Le cinture nere e bianche restano leggibili su entrambi i judogi grazie al proprio
contorno nero.

## 3. Colori dei judogi: fissi, non ricolorabili (decisione presa)

I judogi del set Judo restano **fissi a bianco e blu**, e le caselle predefinite del set
a avorio e navy. Non seguono i colori scelti in Impostazioni.

La ricolorazione era stata ipotizzata, ma la prova sul campo l'ha esclusa: le immagini
generate sono raster e **non sono affatto piatte**. L'analisi dei pixel della prima
generazione ha trovato, in una sola area di 80×80 pixel, **541 colori distinti e 166
tonalità quasi-bianche diverse**, per via del rumore di compressione del generatore. Una
sostituzione di colore a runtime lascerebbe quindi chiazze e bordi sporchi.

La scelta è anche la più fedele allo sport: in gara il judogi è bianco o blu, e un
judogi verde salvia non avrebbe senso. La ricolorazione resta una prerogativa del set
Classico, che essendo vettoriale la supporta nativamente.

Resta comunque valida, per la qualità dell'illustrazione, la regola che pieghe e
cuciture del judogi vadano rese **con linee nere di contorno** e non con toni più scuri
del tessuto.

## 4. Requisiti tecnici dei file

- **Un file per pezzo, 12 in tutto.** Nessuna immagine unica a griglia: il caricatore
  dell'app mappa colore + tipo su un singolo file.
- Cartella: `assets/pieces/judo/`
- Nomi (identici alla convenzione del set classico, `w` = judogi bianco, `b` = judogi blu):
  - `wP.png` `wR.png` `wN.png` `wB.png` `wQ.png` `wK.png`
  - `bP.png` `bR.png` `bN.png` `bB.png` `bQ.png` `bK.png`
- Formato: **PNG con canale alfa**, sfondo completamente trasparente.
- Canvas: **quadrato**, generazione a 1024×1024, consegna nell'app ridimensionata a
  168×168 (3× la casella massima, per i display retina). Il ridimensionamento si fa a
  posteriori con `sips`, già presente su macOS.
- **Nessuna ombra portata e nessuna ellisse di terra** sotto i piedi: creerebbero una
  macchia opaca sul colore della casella.
- Figura centrata orizzontalmente, appoggiata a una **linea di terra comune** a tutti i
  dodici pezzi, in modo che le altezze relative siano confrontabili.
- Nessun testo, logo, marchio o firma nell'immagine.

### Come si ottengono davvero questi file (pipeline verificata)

Il modello **non produce nessuna di queste caratteristiche da solo**. Restituisce PNG
**1376×768 (16:9), senza canale alfa**, con la scacchiera della trasparenza *dipinta*
dentro l'immagine. La post-produzione è quindi obbligatoria, ed è automatizzata dallo
script `tools/process_piece.py` (nessuna dipendenza esterna: legge via BMP prodotto da
`sips` e scrive il PNG con `zlib`), che si usa così:

```
python3 tools/process_piece.py <sorgente.png> <destinazione.png> <rapporto altezza> 168
```

Lo script:

1. rimuove lo sfondo con un *flood fill* dai bordi che riconosce i due grigi della
   scacchiera. Partendo dai bordi, un grigio interno alla figura — i capelli grigi del
   re — resta correttamente opaco;
2. ritaglia un canvas quadrato con la figura centrata, i piedi su una linea di terra
   comune e la scala data dal rapporto d'altezza del pezzo (sezione 5);
3. riduce a 168×168 con filtro a media e alfa premoltiplicato, così i bordi non
   presentano aloni scuri;
4. scrive un PNG RGBA.

La prova sul pedone ha dato un risultato pulito su entrambi i colori di casella, senza
aloni, e la figura resta riconoscibile a 56 pixel. Non è quindi necessario pagare un
modello di rimozione sfondo.

### Rapporti d'altezza effettivamente usati

Valori passati allo script per i dodici pezzi consegnati, da riusare per eventuali
rigenerazioni: re `0.95`, dama `0.90`, alfiere `0.86`, cavallo `0.86`, pedone `0.66`,
torre `0.57` (quest'ultima, essendo seduta, viene comunque allargata fino a riempire il
canvas in orizzontale).

## 5. Gerarchia delle altezze

Percentuale di altezza del canvas occupata dalla figura, con tutti i pezzi appoggiati
alla stessa linea di terra:

- Re: 100% (il più alto, riferimento)
- Dama: 95% (le braccia alzate arrivano quasi in cima)
- Alfiere: 90%
- Cavallo: 90% (inclusa la gamba sollevata)
- Pedone: 70%
- Torre: 60% di altezza, ma fino al 95% di **larghezza** (unico pezzo seduto)

## 6. Prompt — blocco fisso

Da anteporre, identico, a ogni pezzo. In inglese: i modelli di immagine rispondono in
modo più fedele.

```
Flat 2D vector-style game asset of a judoka, full body, centered on a square canvas,
standing on a common ground line, slight three-quarter view.

Style: bold clean black outline of uniform thickness around every shape, completely
flat colours, no gradients, no shading, no texture, no highlights. Transparent
background. No drop shadow, no ground ellipse, no text, no logos.

Readability: the figure must remain recognisable as a silhouette at 50 pixels; use
large simple shapes and clear negative space between limbs and torso.

Garment: an authentic JUDOGI, not a karate gi — thick heavy cotton weave, wide lapels
crossed left over right, reinforced stitching, wide sleeves ending mid-forearm,
trousers ending mid-calf. The judogi is a single uniform flat colour [WHITE #FDFDFB /
ROYAL BLUE #3E6FD9]; folds and seams are drawn only as black outlines, never as darker
shades of that colour, and that exact colour appears nowhere else in the image.

Skin: light pink, flat #F3C9B6.
```

L'insistenza sui dettagli del judogi non è pedanteria: i modelli tendono a disegnare un
karategi leggero con la cintura annodata in modo scorretto, cosa che un judoka nota
immediatamente.

## 7. I sei pezzi

### Pedone — `wP.png` / `bP.png`

**Descrizione.** Judoka giovane e atletico, corporatura asciutta e muscolosa, **testa
completamente pelata, rasata a zero** (nessun capello, cuoio capelluto liscio). In
guardia base (*shizentai*): gambe leggermente divaricate, ginocchia morbide, braccia
piegate davanti al corpo con le mani aperte, pronte alla presa. Cintura bianca.
Espressione concentrata e serena.

**Sagoma.** Compatta, simmetrica, la più piccola del set. È il pezzo che comparirà otto
volte per colore: deve risultare il più neutro e riconoscibile per contrasto con tutti
gli altri.

```
A young athletic judoka with a completely bald, clean-shaven head and no hair at all,
lean muscular build, standing in the basic shizentai guard: feet slightly apart, knees
soft, both arms bent in front of the chest with open hands ready to grip. White belt.
Compact symmetrical silhouette, figure occupying about 70% of the canvas height.
```

### Torre — `wR.png` / `bR.png`

**Descrizione.** Judoka **massiccio e corpulento**, categoria pesi massimi: spalle molto
larghe, collo taurino, torace ampio. **Seduto a gambe incrociate** sul tatami, con le
**braccia conserte** sul petto. Postura immobile e imperturbabile. Cintura nera.

**Sagoma.** L'unico pezzo seduto, quindi l'unico basso e largo: un trapezio solido che
poggia su tutta la base. È la sagoma più distintiva dell'intero set e comunica
immediatamente stabilità e massa — la torre.

```
A very large, heavyset heavyweight judoka with broad shoulders, thick neck and wide
chest, SEATED CROSS-LEGGED on the ground with both ARMS FOLDED across the chest.
Immobile, imperturbable posture. Black belt. Low wide trapezoidal silhouette resting on
its full base, occupying about 60% of the canvas height and up to 95% of its width.
```

### Cavallo — `wN.png` / `bN.png`

**Descrizione.** Judoka a metà esecuzione di un ***uchi-mata***: corpo inclinato in
avanti, appoggiato su una gamba, e **l'altra gamba sollevata molto in alto di lato**,
tesa, che spazza verso l'esterno. Braccia protese nella direzione della proiezione.
Cintura nera.

**Sagoma.** È il punto critico del pezzo: la gamba sollevata deve essere **nettamente
staccata dal corpo, con spazio vuoto ben visibile tra gamba e busto**, e formare una
diagonale marcata che esce dal profilo della figura. Se la gamba resta attaccata al
tronco, a 50 pixel il pezzo diventa una macchia indistinguibile dall'alfiere e va
riscartato. È l'unico pezzo asimmetrico con un arto alto: correttamente disegnato, è
inconfondibile anche minuscolo.

```
A judoka mid-throw performing uchi-mata: body leaning forward supported on one leg,
while the OTHER LEG IS RAISED VERY HIGH AND OUT TO THE SIDE, fully extended, sweeping
outward. Both arms extended in the direction of the throw. Black belt. CRITICAL: the
raised leg must be clearly detached from the torso with a large, obvious area of empty
space between the leg and the body, forming a strong diagonal that breaks the outline
of the figure. Dynamic asymmetric silhouette, about 90% of the canvas height including
the raised leg.
```

### Alfiere — `wB.png` / `bB.png`

**Descrizione.** Judoka alto e slanciato, corporatura sottile. In piedi, eretto, **piedi
uniti**, con **entrambe le braccia tese in avanti** all'altezza del petto nella presa al
bavero (*kumi-kata*), come se afferrasse un avversario invisibile. Postura composta e
verticale. Cintura nera.

**Sagoma.** Stretta e verticale, con la sola sporgenza orizzontale delle braccia tese in
avanti. Si oppone per costruzione alla torre (larga e bassa) e al cavallo (diagonale
aperta).

```
A tall, slim judoka standing upright with FEET TOGETHER and BOTH ARMS EXTENDED
STRAIGHT FORWARD at chest height, hands closed in a kumi-kata lapel grip on an
invisible opponent. Composed vertical posture. Black belt. Narrow tall silhouette whose
only horizontal projection is the extended arms, about 90% of the canvas height.
```

### Dama — `wQ.png` / `bQ.png`

**Descrizione.** Judoka **donna**, con **capelli lunghi e ondulati** che ricadono sulle
spalle. In piedi, in posa di vittoria, con **entrambe le braccia alzate sopra la testa**,
aperte a V, pugni chiusi. Postura fiera e trionfante. Cintura nera.

**Sagoma.** Le braccia alzate e la massa dei capelli allargano la figura nella parte
alta: il profilo si apre verso l'alto come una corona, che è esattamente la lettura
attesa per la dama. È l'unico pezzo con volume in cima.

```
A FEMALE judoka with LONG WAVY HAIR falling over her shoulders, standing in a victory
pose with BOTH ARMS RAISED ABOVE HER HEAD, opened in a V shape, fists closed. Proud,
triumphant posture. Black belt. The raised arms and the mass of hair widen the upper
part of the figure so the outline opens upward like a crown; about 95% of the canvas
height.
```

### Re — `wK.png` / `bK.png`

**Descrizione.** Il *sensei*: judoka anziano, il più alto e autorevole del set.
**Capelli grigi e barba grigia**, folte e ben visibili. In piedi, frontale, **braccia
conserte** sul petto, postura solenne e immobile. Porta **obbligatoriamente la cintura
bianco-rossa** (*kōhaku obi*, cintura da alto grado): fasce bianche e rosse alternate,
disegnata larga e ben leggibile.

**Nota importante.** Niente *hakama* né sopravvesti, che coprirebbero la vita: la
cintura bianco-rossa è l'elemento identitario del pezzo e deve restare completamente
visibile.

**Sagoma.** La più alta e la più massiccia tra quelle in piedi, resa larga alla base
dalla posizione dei piedi. La barba grigia e la fascia chiara della cintura sono gli
unici due accenti che sopravvivono anche a dimensioni ridotte.

```
An elderly sensei, the tallest and most authoritative judoka of the set, with thick
GREY HAIR and a full GREY BEARD. Standing frontally, ARMS FOLDED across the chest,
solemn and still. He wears a RED-AND-WHITE KOHAKU OBI belt with alternating red and
white panels, drawn wide and clearly readable. No hakama and no overgarment: the belt
must stay fully visible at the waist. Tall imposing silhouette, widened at the base by
the stance, 100% of the canvas height.
```

## 8. Metodo di generazione: la coerenza è la parte difficile

Dodici immagini generate indipendentemente escono con spessori di linea, proporzioni e
stili diversi, e il set risulta sbagliato anche se i singoli pezzi sono buoni.

Procedura consigliata:

1. Generare per primo il **pedone bianco** e iterare finché non convince: diventa il
   riferimento di stile per tutto il set.
2. Generare gli altri cinque pezzi bianchi **passando il pedone approvato come immagine
   di riferimento**, chiedendo esplicitamente di mantenere identici stile, spessore del
   contorno, proporzioni del corpo e incarnato.
3. Generare i sei pezzi blu **usando come riferimento il pezzo bianco corrispondente**,
   cambiando esclusivamente il colore del judogi: la posa deve restare la stessa, così
   che i due schieramenti siano speculari.
4. Validare, ridimensionare, integrare.

Il modello `gemini-3-pro-image` è indicato specificamente per mantenere un personaggio
coerente tra più immagini, quindi è la scelta giusta per i passaggi 2 e 3.

## 9. Criteri di accettazione

Un pezzo si accetta solo se soddisfa tutti questi punti:

- Resta riconoscibile e distinguibile dagli altri cinque una volta ridotto a 56 pixel.
- Il judogi è di un unico colore piatto esatto, che non compare altrove nell'immagine.
- Il contorno nero è chiuso, continuo e di spessore uniforme.
- Lo sfondo è realmente trasparente, senza aloni chiari o scuri sui bordi.
- Non ci sono ombre a terra né ellissi sotto i piedi.
- La figura è centrata e appoggiata alla stessa linea di terra degli altri pezzi.
- Le proporzioni del corpo e l'incarnato corrispondono a quelli del pedone di
  riferimento.
- Il judogi è un vero judogi e la cintura è annodata correttamente.

## 10. Set sonoro Judo

### Principio guida: la voce dell'arbitro è una risorsa scarsa

Ogni mossa, propria e avversaria, viene già annunciata a voce dal narratore in
italiano (VoiceOver). Un suono che contiene **parlato** si sovrappone a quell'annuncio
e rende entrambi incomprensibili.

Da qui la regola che governa tutto il set: **niente voce sugli eventi frequenti**
(movimento, cattura, selezione), la voce dell'arbitro **solo sugli eventi che
concludono o cambiano la partita**, dove il narratore dice poco e una parola giapponese
arriva pulita.

Seconda regola, di accessibilità: **una chiamata arbitrale = un solo significato**. Se
"ippon" indica sia una cattura sia la vittoria, chi non vede non può più distinguerli.
Ogni parola compare quindi una volta sola in tutto il set.

### Correzioni di terminologia

- **"Matte" non è la fine dell'incontro**: significa "fermi", è un'interruzione
  temporanea. La chiamata di fine incontro è **"Sore-made"** ("è tutto"). "Matte" resta
  però perfetto per un altro evento: il comando testuale non compreso (vedi sotto).
- **Per la patta la parola esatta è "Hikiwake"** (引き分け), il pareggio. È il termine
  giusto al posto di "matte".
- **Il suono di cattura è del pezzo che MANGIA, non di quello mangiato.** Se la torre
  mangia un pedone si sente il suono della torre. Le catture diventano quindi **sei**,
  una per tipo di pezzo, e non tre come nell'impostazione iniziale. Di conseguenza
  serve anche un suono per il re, che negli scacchi non viene mai catturato ma
  catturare può eccome. Lato codice questo significa leggere `moveObj.piece` (il pezzo
  che muove) e non `moveObj.captured`.

### I suoni del set

Per ciascuno: evento, proposta, durata indicativa. I suoni frequenti devono essere
**corti e sobri**, perché si sentono decine di volte per partita.

**Eventi frequenti (nessuna voce)**

1. `judo_move` — mossa qualunque pezzo. Passo scivolato sul tatami (*suri-ashi*), secco
   e attutito. Molto corto, 150-250 ms. È il suono più ripetuto del gioco: se è lungo o
   caratterizzato, dopo dieci mosse diventa fastidioso.
2-7. **Catture, una per pezzo che mangia (sei in tutto).** Tutte costruite sulla stessa
   base — schiocco dell'*ukemi*, impatto sul tatami, coda di sala — con sopra la voce
   del pezzo che esegue la presa. Prodotte e scelte in `Judo FX`, prefisso `00`:
   - pedone: solo caduta, nessuna voce
   - dama: urlo di attacco femminile
   - torre: verso gutturale di un uomo molto corpulento
   - cavallo: urlo maschile gutturale sulla parola *uchi-mata*
   - alfiere: urlo maschile acuto e roco tipo "watta"
   - re: voce maschile veloce e decisa che pronuncia "Jigoro Kano", il fondatore del judo

   La voce va **generata asciutta**, senza riverbero proprio: la coda di sala la mette
   già l'impatto, e due riverberi sovrapposti impastano il suono.
8. `judo_touch` — selezione **e** deselezione di un pezzo al tocco, **stesso file per
   entrambi gli eventi**: fruscio della presa sul judogi (*kumi-kata*), la stoffa
   afferrata. Deciso di non differenziare i due versi (presa/rilascio), il fruscio unico
   basta a segnalare l'interazione senza aggiungere un suono in più al set. **Fatto**:
   `Judo FX/00 selezione deselezione.wav` (0,32 s).

**Situazioni particolari**

9. `judo_castle` — arrocco. Due passi rapidi coordinati più fruscio di judogi, a
   suggerire lo spostamento simultaneo di due persone (*tai-sabaki*). 500-700 ms.
10. `judo_promotion` — promozione del pedone. **Ripensato il 7 settembre 2026**: non più
    il nodo della cintura, ma il **"wow" di stupore del pubblico dagli spalti** di un
    palazzetto sportivo, coerente con lo stesso pubblico usato per `judo_outcome_win`.
    **Fatto**: `Judo FX/00 promozione.wav` (0,72 s).
11-12. `judo_check_altri` / `judo_check_dama` — scacco, **due varianti in base al pezzo
    che dà scacco**, sullo stesso principio delle catture (la voce appartiene a chi
    agisce): voce maschile per qualunque pezzo tranne la dama, voce femminile quando è
    la dama a dare scacco. **Ripensato il 7 settembre 2026**: non più la chiamata
    "Osaekomi!" ipotizzata all'inizio, ma **urla non verbali**, sullo stesso principio
    delle catture — nessuna parola pronunciata, solo un verso di attacco maschile o
    femminile a seconda del pezzo. 600-900 ms indicativi. **Fatti**:
    `Judo FX/00 scacco maschile.wav` (0,88 s), `Judo FX/00 scacco dama.wav` (1,42 s, oltre
    target ma approvato all'ascolto).
13. `judo_denied` — **unificato il 7 settembre 2026**: mossa illegale e testo non
    interpretabile dal parser condividono ora lo stesso suono, invece dei due
    `judo_illegal`/`judo_invalid` distinti previsti all'inizio. Non più una chiamata
    arbitrale ("Shido!"/"Matte!") ma un **buzzer metallico di diniego**, stile
    tabellone sonoro sportivo: stessa logica già usata per gli esiti di partita, il
    narratore specifica a voce la causa (mossa illegale vs comando non capito), il
    suono comunica solo "rifiutato". **Fatto**:
    `Judo FX/00 illegale e comando non compreso.wav` (0,45 s).

**Esiti della partita (unificati: tre categorie, non cinque)**

Decisione presa il 7 settembre 2026: le cinque categorie d'esito inizialmente previste
(vittoria/sconfitta per matto, vittoria/sconfitta per resa o tempo, patta) collassano in
tre. Il motivo per cui il matto e la resa/tempo non vanno distinti nel suono è lo stesso
già valido per la patta: **il narratore lo dice già a voce**, il suono deve solo
comunicare "hai vinto / hai perso / pareggiato", non il motivo. Bonus non previsto:
sparendo "Ippon!" e "Kiken-gachi!" come parole pronunciate, cade anche l'unica eccezione
alla regola "una chiamata arbitrale = un solo significato" — ora vale senza eccezioni.

14. `judo_outcome_win` — vittoria del giocatore, qualunque sia la causa. Tonfo sul tatami
    più applauso di pubblico in un palazzetto di arti marziali, nessuna voce. **Fatto**:
    `Judo FX/00 vittoria.wav` (0,97 s).
15. `judo_outcome_loss` — sconfitta del giocatore, qualunque sia la causa. Tonfo sul
    tatami più urlo di strazio con un leggero riverbero, nessuna voce. **Fatto**:
    `Judo FX/00 sconfitta.wav` (1,13 s).
16. `judo_outcome_draw` — stallo o patta, qualunque sia la causa (stallo, tripla
    ripetizione, cinquanta mosse, materiale insufficiente: il narratore specifica a voce
    quale). **Ripensato il 7 settembre 2026**: non più "Hikiwake!" ma **fischietto
    arbitrale** in un palazzetto sportivo, in linea con la svolta non verbale del resto
    del set. **Fatto**: `Judo FX/00 patta stallo.wav` (0,53 s).

**Sigla**

17. `judo_session` — **unificata il 7 settembre 2026**: un solo file per apertura e
    chiusura sessione, al posto dei due `judo_session_start`/`judo_session_end` distinti
    ("Hajime!"/"Sore-made") previsti all'inizio. Pubblico che incita dagli spalti di un
    palazzetto sportivo, riprodotto identico in entrambi i momenti. **Fatto**:
    `Judo FX/00 iniziale finale.wav` (3,00 s).

### Note tecniche

- Cartella sorgente/lavorazione: `Judo FX/` (file `00 *.wav`, prese grezze, scarti in
  `vecchi/`). Cartella asset di gioco: `assets/sounds/judo/` (nomi puliti tipo
  `judo_capture_pawn.wav`, mappati in `sound-manager.js`). Formato `.wav` come il set
  default.
- Livello: i suoni frequenti vanno tenuti **percettivamente più bassi** di quelli
  d'esito, altrimenti il gioco diventa rumoroso. Meglio normalizzarli tutti e poi
  abbassare i primi sei.
- Nessuna coda di riverbero lunga sui suoni frequenti: si accavallerebbero con la mossa
  successiva del motore, che può arrivare subito dopo.
- **Il set finito non contiene alcuna parola pronunciata**, nemmeno lo scacco (deciso
  ripensato in corsa a urla non verbali): comunica interamente con suoni d'ambiente da
  palazzetto sportivo (tonfo, applauso, urlo, buzzer, fischietto, coro) e versi non
  verbali (le urla delle catture e dello scacco). La nota "le parole giapponesi vanno
  pronunciate da voce maschile secca" della bozza iniziale non si applica più a niente
  in questo set: non resta.

### Stato di avanzamento — da dove ripartire

Aggiornato al 7 settembre 2026. **Set completo: 17 suoni su 17.** Tutto il materiale
sorgente sta in `Judo FX/` (file definitivi con prefisso `00`, WAV 2ch/44,1 kHz/Float32);
copiati con nomi puliti in `assets/sounds/judo/` e collegati al gioco in
`sound-manager.js` (vedi "Interventi sul codice" più sotto).

**Fatte tutte e sei le catture**, una per pezzo che esegue la presa:
`00 cattura di pedone.wav` (0,71 s), `00 cattura di dama.wav` (0,53 s),
`00 cattura di torre.wav` (1,00 s), `00 cattura di cavallo.wav` (0,63 s),
`00 cattura di alfiere.wav` (1,00 s), `00 cattura di re.wav` (0,62 s).

**Fatti anche movimento e arrocco**: `00 mossa.wav` (0,53 s) e `00 arrocco.wav` (1,67 s),
ritagliati da `mossa_tatami_v1..v4.mp3` / `mossa_tatami_LUNGO.wav`. Entrambi superano il
target di durata indicato sopra (150-250 ms e 500-700 ms) ma sono stati approvati
all'ascolto così come sono; `00 arrocco.wav` è stato riconvertito da Int16 a Float32 per
uniformità con gli altri file definitivi.

**Decise e fatte anche vittoria e sconfitta**, unificando le cinque categorie d'esito
originarie in tre (vedi sopra): `00 vittoria.wav` (0,97 s, tonfo + applauso di pubblico)
e `00 sconfitta.wav` (1,13 s, tonfo + urlo di strazio con riverbero leggero), montati a
mano dall'utente in Amadeus Pro a partire da prese ElevenLabs più un tonfo sul tatami
già in suo possesso.

**Fatti anche selezione/deselezione (unico file) e scacco (due varianti)**:
`00 selezione deselezione.wav` (0,32 s, stesso suono per i due eventi) e le due urla
dello scacco, `00 scacco maschile.wav` (0,88 s) e `00 scacco dama.wav` (1,42 s, oltre
target ma approvato all'ascolto) — stesso principio delle catture, la voce appartiene al
pezzo che agisce, e come le catture **nessuna parola pronunciata**: solo urla.

**Ripensate e fatte anche promozione e mossa illegale/testo non interpretabile**: la
promozione passa dal nodo di cintura a un "wow" di stupore del pubblico, `00
promozione.wav` (0,72 s); mossa illegale e testo non interpretabile si unificano in un
solo buzzer metallico di diniego, stile tabellone sonoro sportivo, invece delle due
chiamate arbitrali distinte previste all'inizio, `00 illegale e comando non
compreso.wav` (0,45 s).

**Ripensate e fatte anche patta e sigla**, sulla stessa linea non verbale da
palazzetto: la patta passa da "Hikiwake!" a un **fischietto arbitrale**, `00 patta
stallo.wav` (0,53 s); le due sigle d'apertura e chiusura si uniscono in un **solo
file** — pubblico che incita dagli spalti, usato identico due volte — al posto di
"Hajime!"/"Sore-made", `00 iniziale finale.wav` (3,00 s).

**Il set finito non contiene alcuna parola pronunciata da nessuna parte**, scacco
incluso: comunica interamente con suoni d'ambiente da palazzetto sportivo (tonfo,
applauso, urlo, buzzer, fischietto, coro) e urla non verbali (catture e scacco). Questo
va oltre il principio guida iniziale della sezione ("voce dell'arbitro riservata agli
eventi rari") — di fatto quella voce non è mai stata usata, il set ha trovato un'altra
strada fin dall'inizio.

Le prese scartate dopo l'ascolto sono in `Judo FX/vecchi/`.

### Metodo di generazione: cosa funziona davvero

Imparato sul campo, vale per tutti i suoni che restano.

- **Versi e rumori → modello `eleven_text_to_sound_v2`** (nodo `sfx`). **Frasi
  pronunciate → sintesi vocale `eleven_v3`** con direzione recitativa tra parentesi
  quadre. Invertirli non funziona: alla sintesi vocale chiesta di urlare *uchi-mata* è
  venuta fuori una lettura, e al modello sfx chiesta una parola precisa vengono
  vocalizzi inintelligibili.
- **Il modello sfx non supera i 2 secondi**, qualunque cosa gli si chieda: né
  descrivendo un'azione continua né chiedendo esplicitamente più secondi. Per ottenere
  materiale più lungo si generano più prese e **si uniscono i campioni in WAV**.
  Attenzione: concatenare direttamente gli MP3 produce un file che si sente per intero
  ma **dichiara la durata del solo primo segmento**, e gli editor mostrano la forma
  d'onda troncata.
- **Gli aggettivi di piccolezza vanno evitati.** "Soft", "short", "close-mic", "thin",
  "nasal", "yelp" hanno prodotto prima un impatto da soldatino di plastica e poi un urlo
  da neonato. Per ottenere il taglio senza la piccolezza si descrive la **tensione**:
  uomo adulto a piena gola, gola roca, voce che si incrina.
- **Le voci vanno generate asciutte**, senza riverbero: la coda di sala la mette
  l'impatto, e due riverberi sovrapposti impastano.
- **Costo: 16,665 crediti a generazione** per gli effetti sonori, circa il doppio o il
  triplo per la sintesi vocale. Ordini di grandezza sotto le immagini, che ne costavano
  1.827 l'una.
- Il flow ElevenLabs di lavoro è "Motto Chess - Judo FX".

### Interventi sul codice — fatti l'8 settembre 2026

`sound-manager.js` è stato riscritto attorno a un concetto di `GAME_SETS`: ogni set
(oggi `default` e `judo`) ha la propria cartella, la propria mappatura evento→file e,
soprattutto, una funzione `resolve(name, ctx)` opzionale che decide a quale chiave del
proprio `files` corrisponde un evento "semantico" in arrivo da `game-screen.js`. Questo
è il meccanismo che permette al set Judo di avere **una granularità diversa dal
default senza toccare il chiamante**: sei suoni di cattura e due di scacco dove il
default ne ha uno solo (differenziati per `ctx.piece`, il tipo del pezzo che agisce —
letto da `moveObj.piece`, mai da `moveObj.captured`), ma un solo file condiviso per
selezione/deselezione, per mossa-illegale/comando-non-capito, per le due sottocategorie
di vittoria e di sconfitta, e per le due sigle. **Nota generale, non solo per Judo**:
ogni set pezzi può avere non solo suoni diversi dagli altri, ma anche usi diversi dello
stesso evento — un set futuro potrebbe differenziare ciò che Judo unifica, o viceversa.
Vedi il commento in testa a `sound-manager.js` per il meccanismo.

`game-screen.js` passa ora `{ pieceSet: session.pieceSet, piece: moveObj.piece }` (dove
pertinente) a ogni chiamata `sound.playGame(...)`, e `preloadGameSounds(session.pieceSet)`
all'avvio partita.

**Decisione presa sulla deroga ai suoni "di sistema"** (illegale, scacco, esiti): le
specifiche generali dicono che restano neutri anche nei set tematici, ma il set Judo li
caratterizza deliberatamente. Risolto così: il toggle "suoni set tematici" non silenzia
mai questi eventi (restano un `SYSTEM_SOUNDS`), ma quando è disattivato li forza
comunque al set `default` neutro invece che a quello attivo; quando è attivo, il set
Judo (o un futuro set tematico) li caratterizza come qualunque altro evento. Il toggle
quindi non significa più "muto", ma "neutro vs. caratterizzato".

Asset di gioco copiati in `assets/sounds/judo/` con nomi puliti (`judo_move.wav`,
`judo_capture_pawn.wav`, `judo_touch.wav`, `judo_denied.wav`, `judo_outcome_win.wav`,
`judo_session.wav`, ecc. — mappatura completa in `sound-manager.js`), a partire dai file
`00 *.wav` di `Judo FX/`, che restano la sorgente di lavorazione.

## 11. Interventi necessari sul codice

Da fare al momento dell'integrazione, non prima:

- `src/themes/pieces.js`: oggi carica solo SVG ricolorabili via attributo `fill`. Va
  esteso a un descrittore per set (cartella, formato, tecnica di ricolorazione), con un
  percorso raster che disegni il PNG su canvas e sostituisca il colore esatto del
  judogi con la tonalità derivata dal colore della casella.
- `src/session/settings.js`: aggiungere i colori casella predefiniti del set Judo
  (avorio `#F2EDE4` e navy `#243B6B`) alle palette chiare/scure.
- `src/ui/screens/options-screen.js`: abilitare la voce "Judo", oggi disattivata.
- Set sonoro Judo: task separato, già descritto nelle specifiche generali (suono unico
  per il movimento; catture su 4 categorie: pedone, dama, re, pezzi speciali).
