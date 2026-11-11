import { GameCore } from '../../game-core/game-core.js';
import { Engine, eloForLevel } from '../../engine/engine.js';
import { parseMoveText, parseCommandText } from '../../io-text/io-text.js';
import {
  moveToCompactText,
  moveToExpandedText,
  promotionConfirmationText,
  formatDurationItalian,
  describeSquareForListing,
  CITY_BY_FILE,
} from '../../themes/i18n-voice.js';
import {
  LIGHT_SQUARE_COLORS,
  DARK_SQUARE_COLORS,
  PIECE_SET_SQUARE_COLORS,
} from '../../session/settings.js';
import { factionsByColor, playerFaction } from '../../themes/factions.js';
import { pieceSetLabel } from '../../themes/pieces.js';
import { pieceFillFromSquareColor } from '../color-utils.js';
import { BoardView } from '../board.js';
import { ChessClock } from '../clock.js';
import { askPromotionChoice, askResignConfirmation, showHelpDialog } from '../modal.js';
import { applyPgnMetadata, outcomeTexts, saveGame } from '../../pgn/pgn.js';
import { AmbientPlayer } from '../ambient-player.js';
import { saveGameProgress, loadGameProgress, clearGameProgress } from '../../session/game-progress.js';

const FILES_ORDER = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function computeResultTag(outcome) {
  if (!outcome) return '*';
  if (outcome.kind === 'checkmate') return outcome.winner === 'w' ? '1-0' : '0-1';
  if (outcome.kind === 'draw') return '1/2-1/2';
  if (outcome.kind === 'timeout') return outcome.loser === 'w' ? '0-1' : '1-0';
  if (outcome.kind === 'resign') return outcome.loser === 'w' ? '0-1' : '1-0';
  return '*';
}

function sessionForPgn(session) {
  return {
    color: session.color,
    level: session.level,
    pieceSet: session.pieceSet,
    pieceSetLabel: pieceSetLabel(session.pieceSet),
    faction: playerFaction(session.pieceSet, session.color, session.faction),
    factions: factionsByColor(session.pieceSet, { faction: session.faction, color: session.color }),
    levelElo: eloForLevel(session.level),
    timeEnabled: session.timeEnabled,
    minutes: session.minutes,
    incrementSec: session.incrementSec,
    startedAt: session.startedAt,
  };
}

// Salva nell'archivio "Partite salvate" una partita conclusa (o interrotta,
// con risultato "*").
function archiveGame(gameCore, session, settings, outcome, labelSuffix) {
  const resultTag = computeResultTag(outcome);
  const pgnText = applyPgnMetadata(gameCore, {
    session: sessionForPgn(session),
    pgnOptions: settings.pgn,
    result: resultTag,
    outcome,
  });
  const dateLabel = new Date(session.startedAt).toLocaleString('it-IT');
  // Il titolo è ciò che VoiceOver legge nell'elenco: esito a parole e set,
  // non il "1-0" del PGN.
  const esito = labelSuffix || outcomeTexts(outcome, session.color).esito;
  saveGame({ pgn: pgnText, label: `Partita del ${dateLabel}: ${esito}, set ${pieceSetLabel(session.pieceSet)}` });
}

// Una partita sospesa che viene sostituita da una nuova non va persa: finisce
// in "Partite salvate" come interrotta (risultato "*").
function archiveSuspendedGame(settings) {
  const progress = loadGameProgress();
  if (!progress) return;
  clearGameProgress();
  if (progress.moves.length === 0) return;
  const core = new GameCore();
  try {
    progress.moves.forEach((san) => core.chess.move(san));
  } catch {
    return;
  }
  archiveGame(core, progress.session, settings, null, 'interrotta');
}

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// payload: la sessione di una partita nuova
//   { color: 'w'|'b', timeEnabled, minutes, incrementSec, level, pieceSet,
//     faction, ambientTrack, startedAt }
// oppure { resume: true } per riprendere la partita sospesa (vedi
// session/game-progress.js).
// faction è la fazione impersonata dal giocatore nei set che la prevedono
// (già sciolta, mai 'casuale'); negli altri set è null/assente.
export function renderGameScreen(container, ctx, payload) {
  const { settings, sound, narrator, navigate } = ctx;

  let resumeState = null;
  if (payload && payload.resume) {
    resumeState = loadGameProgress();
    if (!resumeState) {
      navigate('home');
      return null;
    }
  } else {
    archiveSuspendedGame(settings);
  }
  const session = resumeState ? resumeState.session : payload;

  container.innerHTML = '';
  const heading = document.createElement('h2');
  heading.className = 'sr-only';
  heading.textContent = 'Partita';
  container.appendChild(heading);

  const clockBar = document.createElement('div');
  clockBar.className = 'clock-bar';
  clockBar.hidden = !session.timeEnabled;
  const yourClock = document.createElement('span');
  yourClock.className = 'clock-you';
  const oppClock = document.createElement('span');
  oppClock.className = 'clock-opp';
  clockBar.append(yourClock, oppClock);
  container.appendChild(clockBar);

  const boardContainer = document.createElement('div');
  boardContainer.className = 'board-container';
  container.appendChild(boardContainer);

  const functionBox = document.createElement('div');
  functionBox.className = 'function-box';
  // "Abbandona" e non "Resign": con la pagina in italiano gli screen reader
  // leggevano la parola inglese con la pronuncia italiana.
  const resignBtn = document.createElement('button');
  resignBtn.type = 'button';
  resignBtn.textContent = 'Abbandona';
  const helpBtn = document.createElement('button');
  helpBtn.type = 'button';
  helpBtn.textContent = 'Aiuto';
  helpBtn.addEventListener('click', () => showHelpDialog());
  // Uscire senza abbandonare: la partita resta salvata e si riprende dalla
  // schermata iniziale.
  const suspendBtn = document.createElement('button');
  suspendBtn.type = 'button';
  suspendBtn.textContent = 'Sospendi e torna al menu';
  functionBox.append(resignBtn, helpBtn, suspendBtn);
  container.appendChild(functionBox);

  const postGamePanel = document.createElement('div');
  postGamePanel.className = 'post-game-panel';
  postGamePanel.hidden = true;
  container.appendChild(postGamePanel);

  // Il campo comandi è l'ULTIMO elemento della schermata: così, se il focus di
  // VoiceOver si perde, si ritrova sempre in fondo alla pagina.
  //
  // Volutamente NON è un <form>: su iPhone, con tastiera Bluetooth, l'Invio
  // dentro un form innesca la "implicit submission" di WebKit, che come
  // effetto collaterale toglie il focus al campo (è il meccanismo che chiude
  // la tastiera a schermo). Con VoiceOver attivo il cursore resta quindi senza
  // elemento e salta in cima allo schermo, sulla barra di stato / Dynamic
  // Island. Senza form quel percorso non può proprio scattare: l'Invio lo
  // gestiamo noi da 'keydown' e il focus non si muove mai dal campo.
  const commandBar = document.createElement('div');
  commandBar.className = 'move-form';
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.autocomplete = 'off';
  textInput.enterKeyHint = 'send';
  textInput.setAttribute('aria-label', 'Comando mossa testuale o comando informativo (aiuto per l\'elenco)');
  textInput.placeholder = 'es. e4, Empoli 4, aiuto...';
  const submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.textContent = 'Invia';
  commandBar.append(textInput, submitBtn);
  container.appendChild(commandBar);

  const gameCore = new GameCore();
  if (resumeState) {
    try {
      resumeState.moves.forEach((san) => gameCore.chess.move(san));
    } catch {
      // Salvataggio danneggiato: meglio ripartire dal menu che giocare una
      // posizione sbagliata.
      clearGameProgress();
      navigate('home');
      return null;
    }
  }
  let selectedSquare = null;
  let legalTargetsForSelected = new Map();
  let gameOver = false;
  let destroyed = false;
  let clock = null;
  let engine = null;
  // Promessa risolta quando Stockfish è inizializzato e ha il livello
  // impostato: chi gioca col bianco può muovere prima che il motore sia
  // pronto, e la sua prima risposta deve aspettare (prima poteva partire
  // senza il limite di forza impostato).
  let engineReady = null;

  const boardView = new BoardView(boardContainer, { onSquareClick });
  const ambient = new AmbientPlayer();
  const ambientTrackKey = session.ambientTrack || 'nessuna';

  // Chi occupa quale colore in questa partita, nei set a fazioni: { w, b }
  // (null per gli altri set). Calcolata una volta sola: vale fino alla fine.
  const factions = factionsByColor(session.pieceSet, {
    faction: session.faction,
    color: session.color,
  });
  // Contesto passato ai suoni. La fazione è quella di CHI AGISCE — come il
  // pezzo, che nelle catture è quello che mangia — così un set a fazioni può
  // far sentire "chi ha mosso" senza che il chiamante sappia come.
  function soundCtxFor(color, piece) {
    return {
      pieceSet: session.pieceSet,
      piece,
      faction: factions ? factions[color] : null,
    };
  }

  function currentColors() {
    // Un set con pezzi a colori fissi (Judo) impone i propri colori casella:
    // quelli scelti in Impostazioni valgono per i set ricolorabili.
    const setColors = PIECE_SET_SQUARE_COLORS[session.pieceSet];
    const lightHex = LIGHT_SQUARE_COLORS[setColors ? setColors.light : settings.lightSquareColorName];
    const darkHex = DARK_SQUARE_COLORS[setColors ? setColors.dark : settings.darkSquareColorName];
    return {
      lightHex,
      darkHex,
      pieceColors: {
        w: pieceFillFromSquareColor(lightHex, 'w'),
        b: pieceFillFromSquareColor(darkHex, 'b'),
      },
    };
  }

  async function renderBoardAndControls() {
    const { lightHex, darkHex, pieceColors } = currentColors();
    await boardView.render({
      boardMatrix: gameCore.board(),
      orientation: session.color,
      lightHex,
      darkHex,
      pieceColors,
      selectedSquare,
      legalTargets: new Set(legalTargetsForSelected.keys()),
      pieceSet: session.pieceSet,
      factions,
    });
  }

  // Il campo testo resta sempre abilitato: i comandi informativi (l, c,
  // s+numero/lettera, aiuto) devono funzionare anche fuori dal proprio turno
  // e a partita finita. Solo l'invio di una mossa vera è vincolato al turno
  // (vedi submitCurrentInput).
  //
  // Il focus torna al campo comandi dopo ogni invio, ma NON viene mai tolto
  // alla scacchiera (se l'utente la sta esplorando al tocco o con VoiceOver,
  // rubargli il focus lo riporterebbe indietro a ogni mossa dell'avversario)
  // né a un dialogo aperto (es. "aiuto"): lì il focus lo gestisce il <dialog>
  // nativo, compreso il ripristino sul campo comandi alla chiusura.
  function focusInput() {
    if (!textInput.isConnected) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest('.board-container')) return;
    if (active instanceof HTMLElement && active.closest('dialog')) return;
    if (active === textInput) return;
    textInput.focus();
  }

  // ANCORAGGIO DEL CAMPO COMANDI (VoiceOver + tastiera Bluetooth).
  //
  // Come nelle altre app di scacchi accessibili: si scrive la mossa, Invio,
  // si sentono la propria mossa e quella dell'avversario, e il cursore resta
  // nel campo pronto per la mossa successiva. Su iOS però il sistema a volte
  // toglie il focus al campo "verso il nulla" (nessun altro elemento lo
  // riceve): succede quando decide di chiudere la tastiera, quando la pagina
  // cambia molto, al ritorno da una notifica. VoiceOver resta allora senza
  // cursore e salta altrove (spesso in cima, sulla barra di stato).
  //
  // Prima la rete di sicurezza restava attiva solo 1,5 secondi dopo ogni
  // mossa: ma Stockfish può pensare fino a 6 secondi, e se la sua mossa
  // arrivava dopo quella finestra la perdita di focus non veniva più
  // corretta. Era il "a volte" del problema.
  //
  // Ora la regola è permanente per tutta la partita:
  //  - focus perso verso il nulla, senza un tocco/clic dell'utente appena
  //    prima -> il cursore torna SEMPRE nel campo (con più tentativi, perché
  //    iOS a volte ignora il primo);
  //  - focus passato a un altro elemento (l'utente esplora col dito o con la
  //    tastiera, apre un dialogo, tocca la scacchiera) -> lo si rispetta;
  //  - tocco/clic su uno spazio vuoto della pagina -> lo si rispetta.
  // Esplorare col dito con VoiceOver non sposta il focus del campo, quindi
  // non viene mai ostacolato.
  const RECENT_GESTURE_MS = 800;
  let lastPointerGestureAt = 0;
  function notePointerGesture(e) {
    if (e.target === textInput) return;
    lastPointerGestureAt = Date.now();
  }
  document.addEventListener('pointerdown', notePointerGesture, true);
  document.addEventListener('touchstart', notePointerGesture, { capture: true, passive: true });

  // Registro delle ultime perdite di focus, leggibile col comando "diagnosi":
  // se il cursore dovesse ancora spostarsi, chi gioca può farsi dire cosa è
  // successo e riferirlo, senza strumenti di sviluppo.
  const focusLog = [];
  function logFocusEvent(text) {
    const t = new Date();
    const stamp = `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`;
    focusLog.push(`${stamp} ${text}`);
    if (focusLog.length > 8) focusLog.shift();
  }

  function describeElement(el) {
    if (!el || el === document.body) return 'nessun elemento';
    const label = el.getAttribute('aria-label') || el.textContent || el.tagName;
    return label.trim().slice(0, 40);
  }

  // Il campo deve tornare al suo posto? No se un dialogo è aperto, se il focus
  // è su un altro elemento, se la schermata non c'è più o la pagina è
  // nascosta.
  function shouldReanchor() {
    if (destroyed || !textInput.isConnected) return false;
    if (document.visibilityState === 'hidden') return false;
    if (document.querySelector('dialog[open]')) return false;
    const active = document.activeElement;
    return !active || active === document.body || active === document.documentElement;
  }

  function reanchor(reason) {
    // Tre tentativi distanziati: iOS può rifiutare un focus() chiesto mentre
    // sta ancora elaborando la perdita di focus o un aggiornamento della
    // pagina.
    [0, 250, 800].forEach((delay) => {
      setTimeout(() => {
        if (!shouldReanchor()) return;
        textInput.focus();
        if (delay === 0) logFocusEvent(`cursore riportato nel campo (${reason})`);
      }, delay);
    });
  }

  textInput.addEventListener('focusout', (e) => {
    if (e.relatedTarget) {
      logFocusEvent(`focus passato a: ${describeElement(e.relatedTarget)}`);
      return; // scelta dell'utente (o dialogo): si rispetta
    }
    if (Date.now() - lastPointerGestureAt < RECENT_GESTURE_MS) {
      logFocusEvent('focus lasciato con un tocco');
      return;
    }
    logFocusEvent('focus perso verso il nulla');
    reanchor('perdita di focus');
  });

  // Al ritorno nell'app (notifica, Siri, multitasking) il cursore torna nel
  // campo se nel frattempo è rimasto senza elemento.
  function onReturnToApp() {
    if (document.visibilityState !== 'visible') return;
    if (shouldReanchor()) reanchor('ritorno nell\'app');
  }
  document.addEventListener('visibilitychange', onReturnToApp);
  window.addEventListener('focus', onReturnToApp);


  function updateClockDisplay(remaining) {
    if (!session.timeEnabled) return;
    const youMs = remaining[session.color];
    const oppColor = session.color === 'w' ? 'b' : 'w';
    const oppMs = remaining[oppColor];
    // L'orologio scatta 4 volte al secondo ma il testo cambia una volta al
    // secondo: riscriverlo comunque era una modifica della pagina ogni 250
    // ms, rumore inutile per lo screen reader (e una delle cose che possono
    // disturbare il cursore di VoiceOver).
    const youText = `Tu: ${formatClock(youMs)}`;
    const oppText = `Avversario: ${formatClock(oppMs)}`;
    if (yourClock.textContent !== youText) yourClock.textContent = youText;
    if (oppClock.textContent !== oppText) oppClock.textContent = oppText;
  }

  if (session.timeEnabled) {
    clock = new ChessClock({
      minutes: session.minutes,
      incrementSec: session.incrementSec,
      callbacks: {
        onTick: updateClockDisplay,
        onWarning10: (side, remainingMs) => {
          if (side !== session.color || !settings.timeWarning10Enabled) return;
          narrator.announce(
            `Attenzione, tempo in esaurimento: restano circa ${formatDurationItalian(remainingMs)}.`
          );
        },
        onWarning5: (side, remainingMs) => {
          if (side !== session.color || !settings.timeWarning5Enabled) return;
          narrator.announce(
            `Attenzione, tempo quasi scaduto: restano circa ${formatDurationItalian(remainingMs)}.`
          );
        },
        onElapsed10Min: (markMs) => {
          if (!settings.timeElapsedEvery10MinEnabled) return;
          narrator.announce(`Sono trascorsi ${Math.round(markMs / 60000)} minuti di gioco.`);
        },
        onFlag: (side) => endGame({ kind: 'timeout', loser: side }),
      },
    });
    if (resumeState && resumeState.clock) clock.restore(resumeState.clock);
    updateClockDisplay(clock.remaining);
  }

  // Salvataggio della partita in corso, per poterla riprendere (dopo ogni
  // mossa, quando l'app va in background e quando si esce dalla schermata).
  function persistProgress() {
    if (gameOver) return;
    saveGameProgress({
      session,
      moves: gameCore.history({ verbose: false }),
      clock: clock ? clock.snapshot() : null,
    });
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') persistProgress();
  }
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', persistProgress);

  function autoSaveGame(outcome) {
    archiveGame(gameCore, session, settings, outcome);
  }

  function endGame(outcome) {
    if (gameOver) return;
    gameOver = true;
    clearGameProgress();
    if (clock) clock.stop();
    ambient.stop();

    let soundKey;
    let text;
    if (outcome.kind === 'checkmate') {
      const won = outcome.winner === session.color;
      soundKey = won ? 'outcome_win_checkmate' : 'outcome_loss_checkmate';
      text = won ? 'Scacco matto. Hai vinto.' : 'Scacco matto. Hai perso.';
    } else if (outcome.kind === 'draw') {
      soundKey = 'outcome_draw';
      const map = {
        stalemate: 'Patta per stallo.',
        threefold: 'Patta per tripla ripetizione.',
        fifty: 'Patta per regola delle cinquanta mosse.',
        insufficient: 'Patta per materiale insufficiente.',
      };
      text = map[outcome.reason];
    } else if (outcome.kind === 'timeout') {
      const lost = outcome.loser === session.color;
      soundKey = lost ? 'outcome_loss_resign_timeout' : 'outcome_win_resign_timeout';
      text = lost ? 'Tempo scaduto. Hai perso.' : "Tempo scaduto per l'avversario. Hai vinto.";
    } else {
      soundKey = 'outcome_loss_resign_timeout';
      text = 'Hai abbandonato la partita. Hai perso.';
    }

    sound.playGame(soundKey, soundCtxFor(session.color));
    narrator.announce(text);
    autoSaveGame(outcome);

    postGamePanel.hidden = false;
    postGamePanel.innerHTML = '';
    const resultText = document.createElement('p');
    resultText.textContent = text;
    const menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.textContent = 'Torna al menu';
    menuBtn.addEventListener('click', () => {
      sound.playGame('session_end', soundCtxFor(session.color));
      if (engine) engine.destroy();
      navigate('home');
    });
    postGamePanel.append(resultText, menuBtn);
  }

  function checkGameOverAfterMove(moveColor) {
    const status = gameCore.status();
    if (status.isCheckmate) {
      endGame({ kind: 'checkmate', winner: moveColor });
      return true;
    }
    if (status.isStalemate) {
      endGame({ kind: 'draw', reason: 'stalemate' });
      return true;
    }
    if (status.isThreefoldRepetition) {
      endGame({ kind: 'draw', reason: 'threefold' });
      return true;
    }
    if (status.isDrawByFiftyMoves) {
      endGame({ kind: 'draw', reason: 'fifty' });
      return true;
    }
    if (status.isInsufficientMaterial) {
      endGame({ kind: 'draw', reason: 'insufficient' });
      return true;
    }
    return false;
  }

  async function afterMoveApplied(moveObj) {
    // Qualunque sia la strada della mossa (tocco, testo, motore), una
    // selezione fatta prima sulla scacchiera non vale più: prima restava
    // evidenziata (e annunciata come "selezionata") dopo una mossa scritta.
    selectedSquare = null;
    legalTargetsForSelected = new Map();

    const soundCtx = soundCtxFor(moveObj.color, moveObj.piece);
    if (moveObj.isKingsideCastle() || moveObj.isQueensideCastle()) {
      sound.playGame('castle', soundCtx);
    } else if (moveObj.captured) {
      sound.playGame('capture', soundCtx);
    } else {
      sound.playGame('move', soundCtx);
    }

    const status = gameCore.status();
    const text =
      settings.narrationStyle === 'compatto'
        ? moveToCompactText(moveObj, { announceMate: false })
        : moveToExpandedText(moveObj, { isCheck: status.isCheck, isCheckmate: status.isCheckmate });
    narrator.announce(text);

    if (status.isCheck && !status.isCheckmate) {
      sound.playGame('check', soundCtx);
    }
    if (moveObj.isPromotion()) {
      sound.playGame('promotion', soundCtx);
      narrator.announce(promotionConfirmationText(moveObj.promotion));
    }

    if (clock) clock.addIncrement(moveObj.color);

    await renderBoardAndControls();

    if (checkGameOverAfterMove(moveObj.color)) return;

    persistProgress();
    if (clock) clock.start(gameCore.turn);

    // Rimesso prima della mossa del motore: durante la sua riflessione il
    // campo comandi resta pronto e i comandi informativi restano usabili.
    // Vale anche per la mossa del motore stesso: appena la scacchiera è
    // aggiornata, il campo deve essere (e restare) il posto dov'è il cursore.
    focusInput();

    if (gameCore.turn !== session.color) {
      await triggerEngineMove();
    }
  }

  // Una sola riflessione del motore alla volta: se il giocatore muove prima
  // che Stockfish sia pronto, sia la sua mossa sia l'avvio partita chiedono
  // la risposta del motore, e senza questo controllo ne arrivavano due.
  let engineThinking = false;

  async function triggerEngineMove() {
    if (engineThinking) return;
    engineThinking = true;
    try {
      await runEngineMove();
    } finally {
      engineThinking = false;
    }
  }

  async function runEngineMove() {
    await engineReady;
    if (gameOver || destroyed || gameCore.turn === session.color) return;
    engine.setPositionFen(gameCore.fen);
    const goOpts = clock
      ? {
          wtimeMs: clock.remaining.w,
          btimeMs: clock.remaining.b,
          wincMs: clock.incrementMs,
          bincMs: clock.incrementMs,
        }
      : {};
    const uci = await engine.bestMove(goOpts);
    if (gameOver || destroyed || !uci) return;
    const moveObj = gameCore.applyUci(uci);
    await afterMoveApplied(moveObj);
  }

  async function onSquareClick(square) {
    if (gameOver || gameCore.turn !== session.color) return;
    const soundCtx = soundCtxFor(session.color);

    if (!selectedSquare) {
      const moves = gameCore.legalMovesFrom(square);
      if (moves.length === 0) return;
      selectedSquare = square;
      legalTargetsForSelected = new Map(moves.map((m) => [m.to, m]));
      sound.playGame('select', soundCtx);
      await renderBoardAndControls();
      return;
    }

    if (square === selectedSquare) {
      selectedSquare = null;
      legalTargetsForSelected = new Map();
      sound.playGame('deselect', soundCtx);
      await renderBoardAndControls();
      return;
    }

    if (legalTargetsForSelected.has(square)) {
      const candidate = legalTargetsForSelected.get(square);
      let promotion;
      if (candidate.isPromotion()) {
        promotion = await askPromotionChoice();
        if (!promotion) return; // annullato
      }
      const from = selectedSquare;
      selectedSquare = null;
      legalTargetsForSelected = new Map();
      const moveObj = gameCore.applyMove({ from, to: square, promotion });
      await afterMoveApplied(moveObj);
      return;
    }

    const otherMoves = gameCore.legalMovesFrom(square);
    if (otherMoves.length > 0) {
      selectedSquare = square;
      legalTargetsForSelected = new Map(otherMoves.map((m) => [m.to, m]));
      sound.playGame('select', soundCtx);
    } else {
      selectedSquare = null;
      legalTargetsForSelected = new Map();
      sound.playGame('illegal', soundCtx);
    }
    await renderBoardAndControls();
  }

  // Descrive una mossa della cronologia per i comandi 'l'/'l+numero',
  // includendo numero di mossa e colore (a differenza dell'annuncio "a caldo"
  // di una mossa appena giocata, qui serve contesto perché può essere letta
  // in un momento qualsiasi).
  function describeHistoryMove(move, index) {
    const moveNumber = Math.floor(index / 2) + 1;
    const sideLabel = move.color === 'w' ? 'bianco' : 'nero';
    const isCheckmate = move.san.endsWith('#');
    const isCheck = isCheckmate || move.san.endsWith('+');
    const text =
      settings.narrationStyle === 'compatto'
        ? moveToCompactText(move)
        : moveToExpandedText(move, { isCheck, isCheckmate });
    return `Mossa ${moveNumber}, ${sideLabel}: ${text}`;
  }

  function announceLastMoves(requestedCount) {
    const history = gameCore.history({ verbose: true });
    if (history.length === 0) {
      narrator.announce('Nessuna mossa giocata finora.');
      return;
    }
    const count = Math.max(1, Math.min(requestedCount, history.length));
    const startIdx = history.length - count;
    const parts = history.slice(startIdx).map((move, i) => describeHistoryMove(move, startIdx + i));
    const prefix = count === 1 ? 'Ultima mossa.' : `Ultime ${count} mosse.`;
    narrator.announce(`${prefix} ${parts.join('. ')}.`);
  }

  function announceClock() {
    if (!session.timeEnabled || !clock) {
      narrator.announce('Questa partita non ha il tempo attivato.');
      return;
    }
    const oppColor = session.color === 'w' ? 'b' : 'w';
    const yours = formatDurationItalian(clock.remaining[session.color]);
    const opp = formatDurationItalian(clock.remaining[oppColor]);
    narrator.announce(`Tempo residuo: tu hai ${yours}, l'avversario ha ${opp}.`);
  }

  function announceRank(rank) {
    const parts = FILES_ORDER.map((file) => {
      const square = `${file}${rank}`;
      return describeSquareForListing(square, gameCore.pieceAt(square));
    });
    narrator.announce(`Traversa ${rank}: ${parts.join(', ')}.`);
  }

  function announceFile(file) {
    const parts = [1, 2, 3, 4, 5, 6, 7, 8].map((rank) => {
      const square = `${file}${rank}`;
      return describeSquareForListing(square, gameCore.pieceAt(square));
    });
    narrator.announce(`Colonna ${CITY_BY_FILE[file]}: ${parts.join(', ')}.`);
  }

  function handleCommand(command) {
    switch (command.type) {
      case 'help':
        showHelpDialog();
        break;
      case 'diagnostics':
        narrator.announce(
          focusLog.length
            ? `Ultimi eventi del cursore: ${focusLog.join('. ')}.`
            : 'Nessuna perdita del cursore registrata in questa partita.'
        );
        break;
      case 'clock':
        announceClock();
        break;
      case 'lastMove':
        announceLastMoves(1);
        break;
      case 'lastMoves':
        announceLastMoves(command.count);
        break;
      case 'rank':
        announceRank(command.rank);
        break;
      case 'file':
        announceFile(command.file);
        break;
      default:
        break;
    }
  }

  // Chi gioca dal campo testo (tipicamente con VoiceOver) non deve doverlo
  // ritrovare ad ogni invio: attivare "Invia" sposta naturalmente il focus
  // su quel pulsante, quindi lo riportiamo qui sul campo comandi in ogni
  // caso (mossa valida, comando, mossa illegale, fuori turno, partita
  // finita...). focusInput() rispetta comunque scacchiera e dialoghi aperti.
  async function submitCurrentInput() {
    const raw = textInput.value;
    textInput.value = '';
    try {
      if (!raw.trim()) return;

      // I comandi informativi funzionano sempre: fuori dal proprio turno e
      // anche a partita finita (utile per rivedere l'ultima mossa/i tempi).
      const command = parseCommandText(raw);
      if (command) {
        handleCommand(command);
        return;
      }

      if (gameOver) {
        narrator.announce('La partita è terminata.');
        return;
      }
      if (gameCore.turn !== session.color) {
        narrator.announce('Non è il tuo turno.');
        return;
      }

      const legalMoves = gameCore.allLegalMoves();
      const result = parseMoveText(raw, legalMoves);
      if (!result.ok) {
        sound.playGame(result.reason === 'invalid' ? 'invalid' : 'illegal', soundCtxFor(session.color));
        return;
      }
      const moveObj = gameCore.applyMove(result.move);
      await afterMoveApplied(moveObj);
    } finally {
      focusInput();
    }
  }

  // Invio da tastiera (fisica o a schermo): lo intercettiamo qui e blocchiamo
  // il comportamento predefinito, così il campo non perde mai il focus.
  textInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.isComposing) return;
    e.preventDefault();
    submitCurrentInput();
  });

  submitBtn.addEventListener('click', () => {
    submitCurrentInput();
  });

  resignBtn.addEventListener('click', async () => {
    if (gameOver) return;
    const confirmed = await askResignConfirmation();
    if (!confirmed) return;
    endGame({ kind: 'resign', loser: session.color });
  });

  let suspending = false;
  suspendBtn.addEventListener('click', () => {
    if (gameOver) {
      navigate('home');
      return;
    }
    suspending = true;
    persistProgress();
    narrator.announce('Partita sospesa. Puoi riprenderla dalla schermata iniziale.');
    navigate('home');
  });

  function resumeAnnouncement() {
    const colorText = session.color === 'w' ? 'il bianco' : 'il nero';
    const turnText = gameCore.turn === session.color ? 'tocca a te' : "tocca all'avversario";
    const history = gameCore.history({ verbose: true });
    let lastText = '';
    if (history.length > 0) {
      const last = history[history.length - 1];
      const isCheckmate = last.san.endsWith('#');
      const isCheck = isCheckmate || last.san.endsWith('+');
      const moveText =
        settings.narrationStyle === 'compatto'
          ? moveToCompactText(last)
          : moveToExpandedText(last, { isCheck, isCheckmate });
      lastText = ` Ultima mossa, ${last.color === 'w' ? 'bianco' : 'nero'}: ${moveText}.`;
    }
    return `Partita ripresa. Giochi con ${colorText}, ${turnText}.${lastText}`;
  }

  async function start() {
    sound.preloadGameSounds(session.pieceSet);
    sound.playGame('session_start', soundCtxFor(session.color));
    ambient.play(ambientTrackKey, settings.volumeAmbient);
    engine = new Engine();
    engineReady = engine.init().then(() => {
      engine.setLevel(session.level);
    });

    if (resumeState) {
      narrator.announce(resumeAnnouncement());
    } else {
      narrator.announce(
        session.color === 'w'
          ? 'Nuova partita. Giochi con il bianco, muovi tu.'
          : 'Nuova partita. Giochi con il nero, attendi la mossa dell\'avversario.'
      );
    }

    await renderBoardAndControls();
    await engineReady;
    if (destroyed) return;

    // Una partita ripresa può essere già finita nella posizione salvata
    // (caso limite: chiusura dell'app nell'istante del matto).
    if (resumeState && gameCore.history().length > 0) {
      const last = gameCore.history({ verbose: true }).pop();
      if (checkGameOverAfterMove(last.color)) return;
    }

    if (clock) clock.start(gameCore.turn);

    focusInput();

    if (gameCore.turn !== session.color) {
      await triggerEngineMove();
    }
  }

  start();

  return {
    destroy() {
      destroyed = true;
      // Uscita dalla schermata senza che la partita sia finita: resta
      // riprendibile (il pulsante "Sospendi" ha già salvato).
      if (!gameOver && !suspending) persistProgress();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('visibilitychange', onReturnToApp);
      window.removeEventListener('focus', onReturnToApp);
      document.removeEventListener('pointerdown', notePointerGesture, true);
      document.removeEventListener('touchstart', notePointerGesture, true);
      window.removeEventListener('pagehide', persistProgress);
      if (clock) clock.stop();
      ambient.stop();
      if (engine) engine.destroy();
    },
  };
}
