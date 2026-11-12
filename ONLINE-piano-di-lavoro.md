# Motto Chess online: piano di lavoro

Deciso con Roberto il 12-13 novembre 2026. Ancora da costruire: si comincia nei prossimi giorni.

## L'idea in breve

I giocatori non vedenti fanno già tornei in stanze audio su WhatsApp: due giocatori con la
scacchiera tattile, un arbitro che segna le mosse e tiene il tempo, e il pubblico che ascolta e
poi commenta. Motto Chess diventa la **scacchiera comune** di queste partite: WhatsApp resta il
posto dove si parla, Motto Chess fa da arbitro preciso e racconta la partita a tutti, giocatori e
pubblico, con la sua voce, i suoni dei set e la scacchiera che si muove.

L'esempio è lichess (un link per guardare la partita), ma accessibile davvero.

## Decisioni già prese

1. **Server: Cloudflare** (Workers + Durable Objects). Il piano gratuito regge centinaia di
   giocatori, Firebase gratuito si ferma a 100 connessioni. Il server controlla ogni mossa con
   chess.js: nessuno può barare modificando l'app. Una "stanza" = un Durable Object.
2. **Nickname senza registrazione.** Al primo ingresso nell'online si sceglie il nickname; il
   telefono crea una chiave segreta e la conserva; il server lega il nickname a quella chiave.
   Nessuna email, nessuna password. Viene dato un **codice di recupero di quattro parole** per
   riprendersi il nickname su un altro telefono. Nickname offensivi rifiutati, nessun doppione.
3. **Gli spettatori non hanno bisogno di nickname** (possono metterne uno se vogliono farsi
   riconoscere).
4. **Una mossa valida, una volta inviata, è giocata** ("pezzo toccato, pezzo mosso"). Quella
   annunciata dalla voce è la mossa ufficiale. Le mosse illegali vengono rifiutate con il suono di
   errore, come oggi.
5. Due opzioni facoltative contro gli errori di battitura, scelte quando si prepara la partita:
   - **Conferma mossa**: l'app rilegge la mossa e la invia solo con un secondo Invio. Ogni
     giocatore la accende per sé.
   - **Annullamento con consenso**: si può chiedere di annullare l'ultima mossa, vale solo se
     l'avversario accetta. Chi prepara la partita decide se è permesso (per un torneo: spento).

## Il link: proposta da confermare con Roberto

Dubbio di Roberto: con un link "per l'avversario" il primo che lo apre prende il posto, e se
non ci si mette d'accordo può finire male. Ha ragione. Nuova proposta: **un solo link per tutti**,
con i posti legati ai nickname.

- Quando prepari la partita scrivi **il tuo colore e il nickname dell'avversario** (es. "luca").
- Il tuo posto è legato al tuo nickname, cioè al tuo telefono, fin da subito.
- Chi apre il link con il nickname "luca" si siede automaticamente nell'altro colore.
  Chiunque altro entra come spettatore. Nessuno può rubare il posto.
- Se non conosci ancora il nickname dell'avversario lasci il campo vuoto: quando qualcuno
  chiede di giocare, la voce te lo dice ("Luca chiede di giocare con il nero: accetti?") e
  decidi tu.
- Il link si gira nel gruppo WhatsApp una volta sola: va bene sia per l'avversario sia per il
  pubblico.

## Come si svolge una partita

1. **Preparazione** (giorni prima): "Prepara partita online". Si scelgono tempo e incremento, il
   proprio colore, il nickname dell'avversario, il set di pezzi, le due opzioni contro gli errori.
   L'app dà il link (es. `m8pod.github.io/MottoChess/?stanza=LUPO-42`) e un codice da dettare.
   La stanza resta valida qualche settimana.
2. **Ingresso**: dal link, oppure scrivendo il codice. La voce dice chi c'è: "Luca è collegato,
   6 spettatori in sala".
3. **Partenza**: l'orologio parte solo quando tutti e due i giocatori hanno premuto **Pronto**.
4. **Durante la partita**:
   - ogni giocatore scrive la sua mossa nel campo comandi, come oggi;
   - la mossa arriva subito su tutti i telefoni;
   - tutti sentono la voce narrante (ognuno con il suo stile) e i suoni del set, e chi vede guarda
     i pezzi muoversi;
   - chiunque può interrogare la scacchiera (l, l5, c, s4, se, p, v, m) senza disturbare gli
     altri: le risposte le sente solo lui;
   - gli spettatori non possono muovere.
5. **Arbitraggio automatico**: mosse illegali rifiutate, orologio e caduta della bandierina,
   scacco matto, stallo, ripetizione per tre volte, regola delle 50 mosse, materiale insufficiente.
   Abbandono e proposta di patta tra i giocatori.
6. **Dopo la partita**:
   - la partita (PGN completo, con i nickname) va nell'archivio di tutti, pubblico compreso;
   - **ripasso insieme**: una persona va avanti e indietro tra le mosse e tutti i telefoni
     annunciano la stessa mossa nello stesso momento, mentre si commenta su WhatsApp.

## Fasi di lavoro

**Fase 0: prova audio (prima di tutto).** Durante una chiamata WhatsApp su iPhone aprire Motto
Chess e giocare due o tre mosse contro il computer. Verificare: si sente VoiceOver? Si sentono i
suoni dei pezzi? L'altro nella chiamata sente qualcosa (non dovrebbe)? Se iOS spegne i suoni
della pagina durante la chiamata, cercare una soluzione prima di andare avanti.

**Fase 1: server.**
- Account Cloudflare gratuito (lo apre Claude dal Chrome di Roberto, con il suo ok).
- Worker con: registrazione del nickname (chiave segreta + codice di recupero), creazione
  stanza, ingresso con ruolo, mosse controllate con chess.js, orologio tenuto dal server.
- Connessione WebSocket, con **riconnessione automatica**: su iPhone, passando a WhatsApp e
  tornando, il collegamento può cadere; l'app deve riprendersi da sola e dire "ricollegato".
- Limiti contro gli abusi: un numero massimo di stanze aperte per nickname, stanze scadute
  cancellate da sole.

**Fase 2: app.**
- Schermata "Online" nel menu: scegli nickname / codice di recupero.
- "Prepara partita online" (opzioni come sopra) e "Entra con un codice".
- La schermata di gioco già esistente riceve le mosse dell'avversario dalla rete invece che da
  Stockfish. Lo spettatore usa la stessa schermata, senza poter muovere.
- Annunci vocali per: chi entra ed esce, "Pronto", avversario disconnesso o ricollegato,
  richieste di annullamento e di patta.
- Ripasso insieme a fine partita.
- Tutti i testi nelle quattro lingue (IT, EN, ES, FR).

**Fase 3: prova vera.** Una partita Roberto contro un amico con qualche spettatore, sulla
stanza WhatsApp. Correggere quello che non va.

**Fase 4: pubblicare.** Aggiornare la pagina del sito mottopodcast.org/motto-chess (regola
fissa), con un nuovo capitolo "Giocare online" e la nota sulla privacy: nickname e mosse passano
dal server Cloudflare, nient'altro.

**Più avanti, se serve:** partita rapida con abbinamento automatico, elenco amici, lista breve
di chi aspetta una sfida (massimo 10 alla volta), pulsante Blocca, tornei con più stanze e
classifica.
