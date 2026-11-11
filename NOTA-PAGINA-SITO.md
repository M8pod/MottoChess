# REGOLA FISSA: ogni modifica al gioco aggiorna anche la pagina del sito

Decisione di Roberto, 11 novembre 2026.

Il manuale ufficiale di Motto Chess è la pagina **"Motto Chess"** sul sito di Motto Podcast:

- Pagina pubblica: https://mottopodcast.org/motto-chess/
- Modifica: https://mottopodcast.org/wp-admin/post.php?post=7585&action=edit
- Sito WordPress.com: mottopodcast.org (ID 190065986), pagina ID **7585**, slug `motto-chess`

**Qualsiasi modifica al gioco deve per forza aggiornare anche questa pagina, nei punti
adeguati, nello stesso momento in cui la modifica viene pubblicata su GitHub.** Questo vale per
funzioni nuove, comandi aggiunti o cambiati, lingue, set di pezzi, impostazioni, colori, suoni e
musica, installazione, e per qualunque testo o schermata che la pagina descrive o mostra in foto.

## Come è fatta la pagina

Struttura dei blocchi, da mantenere:

1. Pattern sincronizzato **BARRA SUPERIORE PULSANTI** (`wp:block ref 6006`)
2. Immagine di copertina (media 7583, generata con Gemini), con testo alternativo descrittivo
3. Presentazione con il pulsante "Gioca subito a Motto Chess"
4. "Cosa sa fare": elenco delle funzioni
5. **Manuale di gioco**, capitoli numerati:
   1. Giocare da qualsiasi dispositivo e installare l'app (iPhone passo per passo, Android, computer)
   2. Iniziare una partita (Opzioni partita: tempo, livelli, set, colore, musica)
   3. Come scrivere le mosse (notazione; tabella dei nomi delle colonne nelle 4 lingue)
   4. Ascoltare la partita (stili compatto ed espanso, comando v)
   5. I comandi per orientarsi (tabella dei comandi in italiano)
   6. I comandi nelle altre lingue (tabella del comando p con le lettere di pezzi e colori per lingua)
   7. La scacchiera al tocco e con la tastiera
   8. Tempo, sospensione e fine della partita
   9. Set di pezzi, suoni e musica (con le foto dei set)
   10. Colori per chi vede poco
   11. Le altre impostazioni
   12. Partite salvate e riproduzione
6. "Provatelo e scrivetemi", con il secondo pulsante "Gioca subito" e il link scritto al gioco
7. Pattern sincronizzato **bloccone** (`wp:block ref 3361`)

Le foto delle schermate sono i media 7574–7581: se una schermata cambia, rifare la foto
(formato iPhone) e sostituirla. Ogni immagine deve avere un testo alternativo che la descriva
per chi non vede.

## Dove guardare nel codice

- Comandi da tastiera: `src/io-text/io-text.js` ed elenco "aiuto" in `src/ui/modal.js`
- Lingue: `src/i18n/` (en, es, fr) e `src/themes/i18n-voice.js` (nomi delle colonne e dei pezzi)
- Colori: `src/session/settings.js` e `src/ui/color-utils.js`
- Set di pezzi: `src/themes/pieces.js`

## Articolo di presentazione

C'è anche un articolo breve che presenta il gioco e rimanda alla pagina per il manuale
(post 7582). Non contiene il manuale: va toccato solo se cambia qualcosa di importante, per
esempio una nuova lingua, un nuovo set o il gioco online.
