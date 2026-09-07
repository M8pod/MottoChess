# Judo FX — cartella di lavoro dei suoni del set Judo

Qui vivono i file audio generati con ElevenLabs per il set Judo e i tagli definitivi
fatti a mano. È l'equivalente sonoro di `judoka/`: **lavorazione, separata dal gioco**.

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

## Fatti — 6 su 16

Tutte e sei le catture, una per pezzo che esegue la presa:

- [x] `00 cattura di pedone.wav` — 0,71 s — solo caduta sul tatami, nessuna voce
- [x] `00 cattura di dama.wav` — 0,53 s — urlo di attacco femminile
- [x] `00 cattura di torre.wav` — 1,00 s — verso gutturale di uomo molto corpulento
- [x] `00 cattura di cavallo.wav` — 0,63 s — urlo maschile gutturale, *uchi-mata*
- [x] `00 cattura di alfiere.wav` — 1,00 s — urlo maschile acuto e roco, tipo "watta"
- [x] `00 cattura di re.wav` — 0,62 s — voce decisa: "Jigoro Kano"

## In lavorazione

- [ ] **Movimento** — prese grezze pronte: `mossa_tatami_v1..v4.mp3` (1 s l'una) e
  `mossa_tatami_LUNGO.wav`, montaggio continuo di 8 s da cui ritagliare. Manca il taglio
  definitivo `00 mossa.wav`, target 150-250 ms.

## Da produrre — 9 suoni

Selezione e deselezione al tocco:

- [ ] `00 selezione.wav` — fruscio della presa sul judogi. 100-200 ms
- [ ] `00 deselezione.wav` — la presa che si lascia. 100-200 ms

Situazioni particolari:

- [ ] `00 arrocco.wav` — due passi coordinati più fruscio. 500-700 ms
- [ ] `00 promozione.wav` — nodo della cintura stretto, colpo di taiko. 800 ms-1,2 s
- [ ] `00 scacco.wav` — **"Osaekomi!"**. 600-900 ms
- [ ] `00 mossa illegale.wav` — **"Shido!"**. 500-700 ms
- [ ] `00 testo non capito.wav` — **"Matte!"**. 500-700 ms

Esiti della partita (cinque categorie distinte):

- [ ] `00 vittoria scacco matto.wav` — **"Ippon!"** con applauso. 1,5-2,5 s
- [ ] `00 sconfitta scacco matto.wav` — caduta e "Ippon!" in tono cupo. 1,5-2,5 s
- [ ] `00 vittoria per resa o tempo.wav` — **"Kiken-gachi!"**. 1,5-2 s
- [ ] `00 sconfitta per resa o tempo.wav` — saluto sobrio. 1,5-2 s
- [ ] `00 patta.wav` — **"Hikiwake!"**. 1,5-2 s

Sigle:

- [ ] `00 inizio partita.wav` — **"Hajime!"**. 1,5-2,5 s
- [ ] `00 fine sessione.wav` — **"Sore-made"** e saluto. 2-3 s

## Regole da non violare

1. **Una chiamata arbitrale, un solo significato.** Nessuna parola giapponese compare
   due volte nel set, tranne "Ippon" nelle due versioni di scacco matto (vinta e persa),
   che devono comunque essere inconfondibili tra loro.
2. **Nessun parlato sui suoni frequenti** (movimento, selezione, deselezione): si
   sovrapporrebbe alla narrazione dello screen reader.
3. I suoni frequenti vanno tenuti **percettivamente più bassi** di quelli d'esito, e
   senza code di riverbero lunghe: la mossa successiva del motore può arrivare subito.
