# Judo FX — cartella di lavoro dei suoni del set Judo

Qui vivono i file audio generati con ElevenLabs per il set Judo e i tagli definitivi
fatti a mano. È l'equivalente sonoro di `judoka/`: **lavorazione, separata dal gioco**.
Gli asset di gioco veri e propri (nomi puliti, senza prefisso `00` né spazi) sono
copiati in `assets/sounds/judo/` e collegati agli eventi in `src/ui/sound-manager.js`.

La specifica completa — motivazione di ogni scelta, durate, correzioni di terminologia,
metodo di generazione — è nella sezione 10 di `motto-chess-set-judo.md`.

## Convenzione dei nomi

- **`00 <nome>.wav`** = **file definitivo**, già tagliato e pronto. Il prefisso `00` li
  tiene in cima all'elenco alfabetico.
- `nome_vN.mp3` senza prefisso = presa grezza appena generata, da valutare.
- `vecchi/` = prese scartate dopo l'ascolto, conservate per riferimento.

**`00 cattura di X`** è il suono che si sente quando **il pezzo X mangia** un altro
pezzo, non quando viene mangiato. Se la torre mangia un pedone si sente
`00 cattura di torre`.

## Set completo — 17 su 17

**Il set finito non contiene alcuna parola pronunciata da nessuna parte**, scacco
incluso: tutte le chiamate arbitrali giapponesi ipotizzate all'inizio ("Osaekomi!",
"Hikiwake!", "Shido!", "Matte!", "Hajime!", "Sore-made", "Ippon!", "Kiken-gachi!") sono
state sostituite in corsa da suoni d'ambiente da palazzetto sportivo (tonfo, applauso,
urlo, buzzer, fischietto, coro) e da urla non verbali per catture e scacco.

Tutte e sei le catture, una per pezzo che esegue la presa:

- [x] `00 cattura di pedone.wav` — 0,71 s — solo caduta sul tatami, nessuna voce
- [x] `00 cattura di dama.wav` — 0,53 s — urlo di attacco femminile
- [x] `00 cattura di torre.wav` — 1,00 s — verso gutturale di uomo molto corpulento
- [x] `00 cattura di cavallo.wav` — 0,63 s — urlo maschile gutturale, *uchi-mata*
- [x] `00 cattura di alfiere.wav` — 1,00 s — urlo maschile acuto e roco, tipo "watta"
- [x] `00 cattura di re.wav` — 0,62 s — voce decisa: "Jigoro Kano"

Movimento e arrocco:

- [x] `00 mossa.wav` — 0,53 s (target 150-250 ms, approvato più lungo dopo ascolto)
- [x] `00 arrocco.wav` — 1,67 s (target 500-700 ms, approvato più lungo dopo ascolto)

Esiti della partita, unificati da cinque categorie a tre (deciso il 7 settembre 2026: il
narratore specifica già a voce il motivo di vittoria/sconfitta/patta, il suono deve dire
solo l'esito):

- [x] `00 vittoria.wav` — 0,97 s — tonfo sul tatami + applauso di pubblico in un
  palazzetto di arti marziali, nessuna voce
- [x] `00 sconfitta.wav` — 1,13 s — tonfo sul tatami + urlo di strazio con riverbero
  leggero, nessuna voce
- [x] `00 patta stallo.wav` — 0,53 s — fischietto arbitrale in un palazzetto sportivo,
  nessuna voce

Selezione/deselezione (unico file per entrambi gli eventi) e scacco (due varianti in
base al pezzo che lo dà, stesso principio delle catture — urla non verbali, non parole):

- [x] `00 selezione deselezione.wav` — 0,32 s — fruscio della presa sul judogi, usato
  identico per selezione e deselezione
- [x] `00 scacco maschile.wav` — 0,88 s — urlo maschile, per qualunque pezzo tranne la
  dama
- [x] `00 scacco dama.wav` — 1,42 s (target 600-900 ms, approvato più lungo dopo
  ascolto) — urlo femminile, quando è la dama a dare scacco

Promozione e diniego, entrambi ripensati il 7 settembre 2026 (non più chiamate
arbitrali, per restare in tema con vittoria/sconfitta):

- [x] `00 promozione.wav` — 0,72 s — "wow" di stupore del pubblico dagli spalti di un
  palazzetto sportivo
- [x] `00 illegale e comando non compreso.wav` — 0,45 s — **unico suono condiviso** per
  mossa illegale e testo non interpretabile: buzzer metallico di diniego, stile
  tabellone sonoro sportivo

Sigla, unica per apertura e chiusura sessione:

- [x] `00 iniziale finale.wav` — 3,00 s — pubblico che incita dagli spalti di un
  palazzetto sportivo, usato identico due volte

Prese grezze usate per i vari montaggi (Amadeus Pro), non ripulite dalla cartella:
`applauso_palazzetto_v1..v4.mp3`, `urlo_sconfitta_v1..v4.mp3`,
`fischietto_arbitro_v1..v4.mp3`, `pubblico_incita_v1..v4.mp3`, `allarme_diniego_v1..
v4.mp3`, `stupore_pubblico_v1..v4.mp3`, `mossa_tatami_v1..v4.mp3` +
`mossa_tatami_LUNGO.wav`.

## Regole del set (rispettate fino in fondo)

1. **Una chiamata arbitrale, un solo significato.** Superata alla radice: il set finito
   non ha più chiamate arbitrali, quindi nessuna parola può ripetersi con due significati.
2. **Nessun parlato sui suoni frequenti** (movimento, selezione, deselezione): rispettato
   fin dall'inizio, e ormai vale per l'intero set.
3. I suoni frequenti vanno tenuti **percettivamente più bassi** di quelli d'esito, e
   senza code di riverbero lunghe: la mossa successiva del motore può arrivare subito.
   Da verificare in fase di normalizzazione finale (vedi sezione 10, "Note tecniche").
