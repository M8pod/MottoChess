// Schermata "Riproduzione partita" (richiesta di Roberto, 11/11/2026).
//
// Apre una partita dell'archivio (giocata o importata) sulla scacchiera e la
// fa rivivere mossa per mossa, con gli stessi suoni e la stessa narrazione di
// una partita vera. Comandi: Riproduci/Pausa, Mossa precedente, Mossa
// successiva, Torna all'inizio, Vai alla fine, e la velocità. In pausa chi
// ascolta ha il tempo di rifare la mossa su una scacchiera fisica, oppure di
// esplorare le caselle con VoiceOver come durante una partita.
//
// Il set di pezzi è quello scritto nel PGN (tag "Set", o il vecchio
// "SetName"); se manca o non è riconosciuto si usa il set classico. La
// scacchiera è orientata dal lato del giocatore quando il PGN lo dice
// ("Giocatore" come White o Black), altrimenti dal lato del bianco.
import { Chess } from '../../vendor/chess.js';
import { GameCore } from '../../game-core/game-core.js';
import { listSavedGames } from '../../pgn/pgn.js';
import { moveToCompactText, moveToExpandedText, promotionConfirmationText, sanToSpeech } from '../../themes/i18n-voice.js';
import { LIGHT_SQUARE_COLORS, DARK_SQUARE_COLORS, PIECE_SET_SQUARE_COLORS } from '../../session/settings.js';
import { factionsByColor } from '../../themes/factions.js';
import { PIECE_SET_CHOICES, pieceSetLabel } from '../../themes/pieces.js';
import { pieceFillFromSquareColor } from '../color-utils.js';
import { BoardView } from '../board.js';

const SPEEDS = [
  { value: 'lenta', label: 'Lenta (una mossa ogni 8 secondi)', ms: 8000 },
  { value: 'normale', label: 'Normale (una mossa ogni 5 secondi)', ms: 5000 },
  { value: 'veloce', label: 'Veloce (una mossa ogni 3 secondi)', ms: 3000 },
];
const SPEED_KEY = 'mottochess.replaySpeed';
const COLOR_IT = { w: 'bianco', b: 'nero' };

// Dal nome del set scritto nel PGN alla chiave interna. Accetta sia il tag
// nuovo ("Cani vs Gatti") sia il vecchio SetName ("Cani vs Gatti (giocatore:
// gatti)") sia l'etichetta lunga del Judo.
export function pieceSetFromHeaders(headers) {
  const raw = String(headers.Set || headers.SetName || '').toLowerCase().trim();
  if (!raw) return 'classico';
  const match = PIECE_SET_CHOICES.find((c) => {
    if (!c.available) return false;
    const label = c.label.toLowerCase();
    const short = label.split(' (')[0];
    return raw === label || raw.startsWith(short) || raw === c.value;
  });
  return match ? match.value : 'classico';
}

function playerColorFromHeaders(headers) {
  if (headers.White === 'Giocatore') return 'w';
  if (headers.Black === 'Giocatore') return 'b';
  return null;
}

function loadReplayData(game) {
  const chess = new Chess();
  chess.loadPgn(game.pgn);
  const headers = chess.getHeaders();
  const sans = chess.history();
  const startFen = headers.FEN && headers.FEN !== '?' ? headers.FEN : null;
  return { headers, sans, startFen };
}

function readSpeed() {
  try {
    const v = localStorage.getItem(SPEED_KEY);
    if (SPEEDS.some((s) => s.value === v)) return v;
  } catch {
    // archiviazione non disponibile: velocità predefinita
  }
  return 'normale';
}

function writeSpeed(v) {
  try {
    localStorage.setItem(SPEED_KEY, v);
  } catch {
    // non essenziale
  }
}

export function renderReplayScreen(container, { settings, sound, narrator, navigate }, payload) {
  container.innerHTML = '';
  const game = listSavedGames().find((g) => g.id === (payload && payload.gameId));
  let data = null;
  try {
    data = game ? loadReplayData(game) : null;
  } catch {
    data = null;
  }

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'back-link';
  backBtn.textContent = '← Torna alle partite salvate';
  backBtn.addEventListener('click', () => navigate('saved'));
  container.appendChild(backBtn);

  const h2 = document.createElement('h2');
  h2.textContent = 'Riproduzione partita';
  container.appendChild(h2);

  if (!data) {
    const p = document.createElement('p');
    p.textContent = 'Questa partita non si può riprodurre: il file PGN non è leggibile.';
    container.appendChild(p);
    return { destroy() {} };
  }

  const { headers, sans, startFen } = data;
  const pieceSet = pieceSetFromHeaders(headers);
  const playerColor = playerColorFromHeaders(headers);
  const orientation = playerColor || 'w';
  const factions = factionsByColor(pieceSet, { faction: null, color: orientation });

  // --- Riepilogo: titolo, set, chi giocava cosa, esito ---
  const summary = document.createElement('div');
  summary.className = 'replay-summary';
  const lines = [game.label];
  const known = (v) => v && v !== '?' && v !== '-';
  if (known(headers.Giocatore)) lines.push(`Giocatore: ${headers.Giocatore}.`);
  if (known(headers.Avversario)) lines.push(`Avversario: ${headers.Avversario}.`);
  if (!known(headers.Giocatore) && (known(headers.White) || known(headers.Black))) {
    lines.push(`Bianco: ${known(headers.White) ? headers.White : 'sconosciuto'}. Nero: ${known(headers.Black) ? headers.Black : 'sconosciuto'}.`);
  }
  lines.push(`Set di pezzi: ${pieceSetLabel(pieceSet)}.`);
  lines.push(`${sans.length} semimosse in tutto.`);
  lines.forEach((t) => {
    const p = document.createElement('p');
    p.textContent = t;
    summary.appendChild(p);
  });
  container.appendChild(summary);

  // --- Scacchiera (consultabile, non giocabile) ---
  const boardContainer = document.createElement('div');
  boardContainer.className = 'board-container';
  container.appendChild(boardContainer);
  const boardView = new BoardView(boardContainer, { onSquareClick: () => {} });

  // Posizione corrente, sempre visibile (non "live": la narrazione la dà già)
  const position = document.createElement('p');
  position.className = 'replay-position';
  container.appendChild(position);

  // --- Comandi ---
  const controls = document.createElement('div');
  controls.className = 'function-box replay-controls';
  const mkBtn = (text) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    controls.appendChild(b);
    return b;
  };
  const playBtn = mkBtn('Riproduci');
  const prevBtn = mkBtn('Mossa precedente');
  const nextBtn = mkBtn('Mossa successiva');
  const startBtn = mkBtn("Torna all'inizio");
  const endBtn = mkBtn('Vai alla fine');
  container.appendChild(controls);

  const speedLabel = document.createElement('label');
  speedLabel.className = 'field';
  speedLabel.textContent = 'Velocità ';
  const speedSelect = document.createElement('select');
  SPEEDS.forEach((s) => {
    const o = document.createElement('option');
    o.value = s.value;
    o.textContent = s.label;
    speedSelect.appendChild(o);
  });
  speedSelect.value = readSpeed();
  speedSelect.addEventListener('change', () => {
    writeSpeed(speedSelect.value);
    if (playing) scheduleNext();
  });
  speedLabel.appendChild(speedSelect);
  container.appendChild(speedLabel);

  // --- Stato ---
  const core = new GameCore();
  if (startFen) core.chess.load(startFen);
  let ply = 0; // semimosse già eseguite sulla scacchiera
  let playing = false;
  let timer = null;
  let destroyed = false;

  function currentColors() {
    const setColors = PIECE_SET_SQUARE_COLORS[pieceSet];
    const lightHex = LIGHT_SQUARE_COLORS[setColors ? setColors.light : settings.lightSquareColorName];
    const darkHex = DARK_SQUARE_COLORS[setColors ? setColors.dark : settings.darkSquareColorName];
    return {
      lightHex,
      darkHex,
      pieceColors: { w: pieceFillFromSquareColor(lightHex, 'w'), b: pieceFillFromSquareColor(darkHex, 'b') },
    };
  }

  function moveLabel(index) {
    // index: posizione della semimossa nell'elenco (0 = prima mossa del bianco
    // se la partita parte dalla posizione iniziale)
    const startsBlack = startFen ? startFen.split(' ')[1] === 'b' : false;
    const offset = startsBlack ? 1 : 0;
    const n = Math.floor((index + offset) / 2) + 1;
    const color = (index + offset) % 2 === 0 ? 'w' : 'b';
    return { n, color };
  }

  function updatePositionText() {
    if (ply === 0) {
      position.textContent = `Posizione iniziale. ${sans.length} semimosse da riprodurre.`;
    } else {
      const { n, color } = moveLabel(ply - 1);
      position.textContent = `Semimossa ${ply} di ${sans.length}: mossa ${n} del ${COLOR_IT[color]}, ${sanToSpeech(sans[ply - 1])}.`;
    }
    prevBtn.disabled = ply === 0;
    startBtn.disabled = ply === 0;
    nextBtn.disabled = ply >= sans.length;
    endBtn.disabled = ply >= sans.length;
    if (ply >= sans.length && playing) setPlaying(false, { silent: true });
  }

  async function render() {
    const { lightHex, darkHex, pieceColors } = currentColors();
    await boardView.render({
      boardMatrix: core.board(),
      orientation,
      lightHex,
      darkHex,
      pieceColors,
      selectedSquare: null,
      legalTargets: new Set(),
      pieceSet,
      factions,
    });
    updatePositionText();
  }

  function soundCtx(color, piece) {
    return { pieceSet, piece, faction: factions ? factions[color] : null };
  }

  function outcomeAnnouncement() {
    const result = headers.Result;
    let reason = headers.Termination && headers.Termination !== '?' ? headers.Termination.toLowerCase() : '';
    // PGN importati spesso non dicono come è finita: se la posizione finale
    // lo mostra, lo si ricava da lì (calcolato su una copia, a fine partita).
    if (!reason) {
      const probe = new Chess(startFen || undefined);
      try {
        sans.forEach((san) => probe.move(san));
        if (probe.isCheckmate()) reason = 'per scacco matto';
        else if (probe.isStalemate()) reason = 'per stallo';
      } catch {
        // mosse non rigiocabili: nessun motivo
      }
    } else if (reason === 'scacco matto' || reason === 'tempo scaduto' || reason === 'abbandono') {
      reason = `per ${reason}`;
    }
    let text;
    let key = null;
    let winner = null;
    if (result === '1-0') winner = 'w';
    if (result === '0-1') winner = 'b';
    if (headers.Esito && headers.Esito !== '?') {
      text = `Fine della partita. ${headers.Esito}.`;
    } else if (winner) {
      text = `Fine della partita. Vince il ${COLOR_IT[winner]}${reason ? ` ${reason}` : ''}.`;
    } else if (result === '1/2-1/2') {
      text = reason.startsWith('patta') ? `Fine della partita. ${reason[0].toUpperCase()}${reason.slice(1)}.` : `Fine della partita. Patta${reason ? ` ${reason}` : ''}.`;
    } else {
      text = 'Fine delle mosse registrate: partita senza risultato.';
    }
    if (result === '1/2-1/2') key = 'outcome_draw';
    else if (winner) {
      // Con il giocatore noto, l'esito è dal suo punto di vista (come in
      // partita); altrimenti si festeggia il vincitore, con la sua fazione.
      const won = playerColor ? winner === playerColor : true;
      key = won ? 'outcome_win_checkmate' : 'outcome_loss_checkmate';
      const who = playerColor || winner;
      return { text, key, ctx: soundCtx(who, null) };
    }
    return { text, key, ctx: soundCtx(orientation, null) };
  }

  // Esegue la semimossa successiva con suoni e narrazione, come in partita.
  async function stepForward() {
    if (ply >= sans.length) return false;
    const { n, color } = moveLabel(ply);
    const moveObj = core.chess.move(sans[ply]);
    ply += 1;
    const ctx = soundCtx(moveObj.color, moveObj.piece);
    if (moveObj.isKingsideCastle() || moveObj.isQueensideCastle()) sound.playGame('castle', ctx);
    else if (moveObj.captured) sound.playGame('capture', ctx);
    else sound.playGame('move', ctx);

    const status = core.status();
    const moveText =
      settings.narrationStyle === 'compatto'
        ? moveToCompactText(moveObj, { announceMate: true })
        : moveToExpandedText(moveObj, { isCheck: status.isCheck, isCheckmate: status.isCheckmate });
    const mateText = status.isCheckmate && settings.narrationStyle !== 'compatto' ? ', scacco matto' : '';
    narrator.announce(`${n}, ${COLOR_IT[color]}: ${moveText}${mateText}`);
    if (status.isCheck && !status.isCheckmate) sound.playGame('check', ctx);
    if (moveObj.isPromotion()) {
      sound.playGame('promotion', ctx);
      narrator.announce(promotionConfirmationText(moveObj.promotion));
    }
    await render();
    if (ply >= sans.length) {
      const end = outcomeAnnouncement();
      setTimeout(() => {
        if (destroyed) return;
        if (end.key) sound.playGame(end.key, end.ctx);
        narrator.announce(end.text);
      }, 1200);
    }
    return true;
  }

  async function stepBack() {
    if (ply === 0) return;
    const undone = core.chess.undo();
    ply -= 1;
    sound.playGame('deselect', soundCtx(undone ? undone.color : orientation, null));
    await render();
    if (ply === 0) {
      narrator.announce('Indietro. Posizione iniziale.');
    } else {
      const { n, color } = moveLabel(ply - 1);
      narrator.announce(`Indietro. Ultima mossa giocata: ${n}, ${COLOR_IT[color]}, ${sanToSpeech(sans[ply - 1])}.`);
    }
  }

  async function goTo(target, announceText) {
    while (ply > target) {
      core.chess.undo();
      ply -= 1;
    }
    while (ply < target) {
      core.chess.move(sans[ply]);
      ply += 1;
    }
    sound.playGame('select', soundCtx(orientation, null));
    await render();
    narrator.announce(announceText);
  }

  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function scheduleNext() {
    clearTimer();
    if (!playing || destroyed) return;
    const speed = SPEEDS.find((s) => s.value === speedSelect.value) || SPEEDS[1];
    timer = setTimeout(async () => {
      if (!playing || destroyed) return;
      const moved = await stepForward();
      if (moved && ply < sans.length) scheduleNext();
      else setPlaying(false, { silent: true });
    }, speed.ms);
  }

  function setPlaying(on, { silent = false } = {}) {
    playing = on;
    playBtn.textContent = on ? 'Pausa' : 'Riproduci';
    playBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (!on) {
      clearTimer();
      if (!silent) narrator.announce('Pausa.');
    }
  }

  playBtn.addEventListener('click', async () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (ply >= sans.length) {
      await goTo(0, 'Si riparte dalla posizione iniziale.');
    }
    setPlaying(true);
    // La prima mossa parte subito: aspettare l'intervallo intero dopo aver
    // premuto Riproduci sembrerebbe un pulsante che non funziona.
    const moved = await stepForward();
    if (moved && ply < sans.length) scheduleNext();
    else setPlaying(false, { silent: true });
  });
  nextBtn.addEventListener('click', async () => {
    setPlaying(false, { silent: true });
    await stepForward();
  });
  prevBtn.addEventListener('click', async () => {
    setPlaying(false, { silent: true });
    await stepBack();
  });
  startBtn.addEventListener('click', async () => {
    setPlaying(false, { silent: true });
    await goTo(0, 'Posizione iniziale.');
  });
  endBtn.addEventListener('click', async () => {
    setPlaying(false, { silent: true });
    await goTo(sans.length, `Posizione finale, dopo ${sans.length} semimosse.`);
    const end = outcomeAnnouncement();
    narrator.announce(end.text);
  });

  sound.preloadGameSounds(pieceSet);
  render().then(() => {
    if (destroyed) return;
    narrator.announce(
      `Partita pronta da riprodurre, ${sans.length} semimosse, set ${pieceSetLabel(pieceSet)}. Usa Riproduci, oppure Mossa successiva per andare avanti una mossa alla volta.`
    );
  });

  return {
    destroy() {
      destroyed = true;
      clearTimer();
    },
  };
}
