import { GameCore } from '../../game-core/game-core.js';
import { Engine } from '../../engine/engine.js';
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
import { factionsByColor } from '../../themes/factions.js';
import { pieceFillFromSquareColor } from '../color-utils.js';
import { BoardView } from '../board.js';
import { ChessClock } from '../clock.js';
import { askPromotionChoice, askResignConfirmation, showHelpDialog } from '../modal.js';
import { applyPgnMetadata, saveGame } from '../../pgn/pgn.js';
import { AmbientPlayer } from '../ambient-player.js';

const FILES_ORDER = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// session: { color: 'w'|'b', timeEnabled, minutes, incrementSec, level,
//            pieceSet, faction }
// faction è la fazione impersonata dal giocatore nei set che la prevedono
// (già sciolta, mai 'casuale'); negli altri set è null/assente.
export function renderGameScreen(container, ctx, session) {
  const { settings, sound, narrator, navigate } = ctx;

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
  const resignBtn = document.createElement('button');
  resignBtn.type = 'button';
  resignBtn.textContent = 'Resign';
  const helpBtn = document.createElement('button');
  helpBtn.type = 'button';
  helpBtn.textContent = 'Aiuto';
  helpBtn.addEventListener('click', () => showHelpDialog());
  functionBox.append(resignBtn, helpBtn);
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
  let selectedSquare = null;
  let legalTargetsForSelected = new Map();
  let gameOver = false;
  let clock = null;
  let engine = null;

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

  // Rete di sicurezza per iOS: se subito dopo un invio (o dopo la mossa del
  // motore) il campo perde il focus senza che questo finisca su un altro
  // elemento — è quello che fa il sistema quando decide di "chiudere" la
  // tastiera — VoiceOver resta senza cursore e risale in cima allo schermo.
  // La finestra è volutamente breve e si arma solo attorno alle mosse: fuori
  // da quei momenti l'utente è libero di uscire dal campo come vuole.
  const FOCUS_RESTORE_WINDOW_MS = 1500;
  let restoreFocusUntil = 0;

  function armFocusRestore() {
    restoreFocusUntil = Date.now() + FOCUS_RESTORE_WINDOW_MS;
  }

  textInput.addEventListener('focusout', (e) => {
    if (Date.now() > restoreFocusUntil) return;
    if (e.relatedTarget) return; // il focus è andato su un altro elemento: è una scelta dell'utente
    setTimeout(() => {
      if (Date.now() > restoreFocusUntil) return;
      const active = document.activeElement;
      if (active && active !== document.body) return;
      focusInput();
    }, 0);
  });

  function updateClockDisplay(remaining) {
    if (!session.timeEnabled) return;
    const youMs = remaining[session.color];
    const oppColor = session.color === 'w' ? 'b' : 'w';
    const oppMs = remaining[oppColor];
    yourClock.textContent = `Tu: ${formatClock(youMs)}`;
    oppClock.textContent = `Avversario: ${formatClock(oppMs)}`;
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
    updateClockDisplay(clock.remaining);
  }

  function computeResultTag(outcome) {
    if (outcome.kind === 'checkmate') return outcome.winner === 'w' ? '1-0' : '0-1';
    if (outcome.kind === 'draw') return '1/2-1/2';
    if (outcome.kind === 'timeout') return outcome.loser === 'w' ? '0-1' : '1-0';
    if (outcome.kind === 'resign') return outcome.loser === 'w' ? '0-1' : '1-0';
    return '*';
  }

  function autoSaveGame(outcome) {
    const resultTag = computeResultTag(outcome);
    const pgnText = applyPgnMetadata(gameCore, {
      session: { color: session.color, level: session.level, pieceSet: session.pieceSet, startedAt: session.startedAt },
      pgnOptions: settings.pgn,
      result: resultTag,
    });
    const dateLabel = new Date(session.startedAt).toLocaleString('it-IT');
    saveGame({ pgn: pgnText, label: `Partita del ${dateLabel} (${resultTag})` });
  }

  function endGame(outcome) {
    if (gameOver) return;
    gameOver = true;
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
        ? moveToCompactText(moveObj)
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

    if (clock) clock.start(gameCore.turn);

    // Rimesso prima della mossa del motore: durante la sua riflessione il
    // campo comandi resta pronto e i comandi informativi restano usabili.
    // Vale anche per la mossa del motore stesso: appena la scacchiera è
    // aggiornata, il campo deve essere (e restare) il posto dov'è il cursore.
    armFocusRestore();
    focusInput();

    if (gameCore.turn !== session.color) {
      await triggerEngineMove();
    }
  }

  async function triggerEngineMove() {
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
    if (gameOver || !uci) return;
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
    armFocusRestore();
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
      armFocusRestore();
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

  async function start() {
    sound.preloadGameSounds(session.pieceSet);
    sound.playGame('session_start', soundCtxFor(session.color));
    ambient.play(ambientTrackKey, settings.volumeAmbient);
    engine = new Engine();
    await engine.init();
    engine.setLevel(session.level);

    narrator.announce(
      session.color === 'w'
        ? 'Nuova partita. Giochi con il bianco, muovi tu.'
        : 'Nuova partita. Giochi con il nero, attendi la mossa dell\'avversario.'
    );

    await renderBoardAndControls();

    if (clock) clock.start(gameCore.turn);

    focusInput();

    if (gameCore.turn !== session.color) {
      await triggerEngineMove();
    }
  }

  start();

  return {
    destroy() {
      if (clock) clock.stop();
      ambient.stop();
      if (engine) engine.destroy();
    },
  };
}
