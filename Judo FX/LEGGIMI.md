# Judo FX — archivio dei suoni generati

Cartella di lavoro per i file audio del set Judo generati con ElevenLabs, comprese le
versioni scartate. È l'equivalente sonoro di `judoka/`: **archivio personale, separato
dal gioco**.

I suoni definitivi, tagliati e pronti, vanno invece in `assets/sounds/judo/` con i nomi
esatti dell'elenco qui sotto: sono quelli che l'app cerca.

La specifica completa — motivazione di ogni scelta, durate, correzioni di terminologia —
è nella sezione 10 di `motto-chess-set-judo.md`.

## I sedici suoni da produrre

Eventi frequenti, **senza voce** (si sovrapporrebbe al narratore):

- [ ] `judo_move` — passo scivolato sul tatami. 150-250 ms
- [ ] `judo_capture_pedone` — tonfo leggero. 300-400 ms
- [ ] `judo_capture_minori` — tonfo pieno (torre, alfiere, cavallo). 400-600 ms
- [ ] `judo_capture_dama` — tonfo pesante con reazione di pubblico. 700 ms-1 s
- [ ] `judo_select` — fruscio della presa sul judogi. 100-200 ms
- [ ] `judo_deselect` — la presa che si lascia. 100-200 ms

Situazioni particolari:

- [ ] `judo_castle` — due passi coordinati più fruscio. 500-700 ms
- [ ] `judo_promotion` — nodo della cintura stretto, colpo di taiko. 800 ms-1,2 s
- [ ] `judo_check` — **"Osaekomi!"**. 600-900 ms
- [ ] `judo_illegal` — **"Shido!"**. 500-700 ms
- [ ] `judo_invalid` — **"Matte!"**. 500-700 ms

Esiti (cinque categorie):

- [ ] `judo_outcome_win_checkmate` — **"Ippon!"** con applauso. 1,5-2,5 s
- [ ] `judo_outcome_loss_checkmate` — caduta e "Ippon!" in tono cupo. 1,5-2,5 s
- [ ] `judo_outcome_win_resign_timeout` — **"Kiken-gachi!"**. 1,5-2 s
- [ ] `judo_outcome_loss_resign_timeout` — saluto sobrio. 1,5-2 s
- [ ] `judo_outcome_draw` — **"Hikiwake!"**. 1,5-2 s

Sigle:

- [ ] `judo_session_start` — **"Hajime!"**. 1,5-2,5 s
- [ ] `judo_session_end` — **"Sore-made"** e saluto. 2-3 s

## Regole da non violare

1. **Una chiamata arbitrale, un solo significato.** Nessuna parola giapponese compare
   due volte nel set, tranne "Ippon" nelle due versioni di scacco matto (vinta e persa),
   che devono comunque essere inconfondibili tra loro.
2. **Nessun parlato sui sei suoni frequenti**, altrimenti copre il narratore.
3. I suoni frequenti vanno tenuti **percettivamente più bassi** di quelli d'esito, e
   senza code di riverbero lunghe: la mossa successiva del motore può arrivare subito.
