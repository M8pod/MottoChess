// analysis/game-analysis: commento vocale a fine partita (impostazione
// "Commento e analisi a fine partita", richiesta di Roberto del 13/11/2026).
//
// Stockfish, a piena forza, valuta tutte le posizioni della partita. Per ogni
// mossa del giocatore si confronta la mossa migliore con quella giocata, in
// "probabilità di vittoria" (0-100) invece che in centipedoni: perdere due
// pedoni conta molto in una posizione pari e quasi niente in una già vinta.
// Soglie come quelle di Lichess: 10 punti imprecisione, 20 errore, 30 errore
// grave.
//
// Il commento:
//  - partita persa: i tre errori più pesanti, in ordine di partita;
//  - vinta o patta: un paio di errori e/o le mosse migliori (quelle in cui
//    il giocatore ha trovato l'unica mossa buona).
import { Chess } from '../vendor/chess.js';
import { MATE_CP } from '../engine/engine.js';
import { getLanguage } from '../i18n/i18n.js';
import { moveToCompactText, moveToExpandedText } from '../themes/i18n-voice.js';

const MATE_THRESHOLD = MATE_CP - 1000;

function clampCp(cp) {
  if (cp >= MATE_THRESHOLD) return 1500;
  if (cp <= -MATE_THRESHOLD) return -1500;
  return Math.max(-1500, Math.min(1500, cp));
}

// Probabilità di vittoria (0-100) dai centipedoni, formula di Lichess.
export function winPercent(cp) {
  const c = clampCp(cp);
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1);
}

export function classifyLoss(loss) {
  if (loss >= 30) return 'blunder';
  if (loss >= 20) return 'mistake';
  if (loss >= 10) return 'inaccuracy';
  return null;
}

// Millisecondi di analisi per posizione: meno se la partita è lunga, così il
// commento arriva comunque entro un minuto circa.
export function msPerPosition(plies) {
  if (plies > 100) return 200;
  if (plies > 60) return 280;
  return 380;
}

export function estimateSeconds(plies) {
  const sec = ((plies + 1) * (msPerPosition(plies) + 120)) / 1000;
  return Math.max(5, Math.round(sec / 5) * 5);
}

// moves: cronologia verbose di chess.js (dalla posizione iniziale).
// engine: istanza di Engine già inizializzata, dedicata all'analisi.
// Ritorna { plies, playerMoves, items } oppure null se annullata.
export async function analyseGame({ moves, playerColor, engine, isCancelled = () => false }) {
  const ms = msPerPosition(moves.length);
  const fens = [moves.length ? moves[0].before : new Chess().fen(), ...moves.map((m) => m.after)];
  const evals = [];
  for (let i = 0; i < fens.length; i++) {
    if (isCancelled()) return null;
    const chess = new Chess(fens[i]);
    if (chess.isGameOver()) {
      evals.push({ terminal: chess.isCheckmate() ? 'mate' : 'draw' });
      continue;
    }
    // Due mosse dove muove il giocatore (per sapere se la sua era l'unica
    // buona), una dove muove l'avversario.
    const multipv = chess.turn() === playerColor ? 2 : 1;
    const lines = await engine.analyse(fens[i], { ms, multipv });
    evals.push({ lines });
  }
  if (isCancelled()) return null;

  const items = [];
  moves.forEach((move, i) => {
    if (move.color !== playerColor) return;
    const before = evals[i];
    const after = evals[i + 1];
    if (!before || !before.lines || before.lines.length === 0) return;
    const best = before.lines[0];
    const uci = `${move.from}${move.to}${move.promotion || ''}`;
    let playedCp;
    if (best.move === uci) playedCp = best.cp;
    else if (after && after.terminal === 'mate') playedCp = MATE_CP;
    else if (after && after.terminal === 'draw') playedCp = 0;
    else if (after && after.lines && after.lines.length) playedCp = -after.lines[0].cp;
    else return;

    const loss = Math.max(0, winPercent(best.cp) - winPercent(playedCp));
    const second = before.lines[1];
    const gap = best.move === uci && second ? winPercent(best.cp) - winPercent(second.cp) : 0;
    let bestMoveObj = null;
    if (best.move !== uci) {
      try {
        const c = new Chess(fens[i]);
        bestMoveObj = c.move({ from: best.move.slice(0, 2), to: best.move.slice(2, 4), promotion: best.move[4] });
      } catch {
        bestMoveObj = null;
      }
    }
    items.push({
      ply: i,
      moveNumber: Math.floor(i / 2) + 1,
      move,
      loss,
      kind: classifyLoss(loss),
      bestMove: bestMoveObj,
      missedMate: best.cp >= MATE_THRESHOLD && playedCp < MATE_THRESHOLD,
      isBest: best.move === uci,
      gap,
      decided: winPercent(best.cp) > 97 || winPercent(best.cp) < 3,
      // Riprendere un pezzo appena mangiato è quasi sempre l'unica mossa,
      // ma è ovvia: non merita il commento "ottima mossa".
      recapture: !!(move.captured && i > 0 && moves[i - 1].captured && moves[i - 1].to === move.to),
    });
  });
  return { plies: moves.length, playerMoves: items.length, items };
}

// --- Testi ---

const WORDS = {
  it: {
    head: 'Commento alla partita.',
    tooShort: 'Partita troppo breve per un commento.',
    stats: (n, list) => `Hai giocato ${n} mosse${list ? `: ${list}` : ', senza errori evidenti'}.`,
    count: { blunder: ['errore grave', 'errori gravi'], mistake: ['errore', 'errori'], inaccuracy: ['imprecisione', 'imprecisioni'] },
    and: 'e',
    lossIntro: 'I momenti decisivi.',
    winIntro: 'Bella partita. Ecco cosa si poteva fare meglio.',
    drawIntro: 'Ecco cosa si poteva fare meglio.',
    kind: { blunder: 'Errore grave', mistake: 'Errore', inaccuracy: 'Imprecisione' },
    error: (n, played, kind, best, mate) =>
      `Mossa ${n}: hai giocato ${played}. ${kind}${mate ? ', avevi uno scacco matto a disposizione' : ''}${best ? `: era meglio ${best}` : ''}.`,
    goodIntro: 'Le tue mosse migliori.',
    good: (n, played) => `Mossa ${n}: ${played}. Ottima mossa, l'unica davvero buona in quella posizione.`,
    noErrorsLoss: "L'avversario è stato solo un po' più preciso.",
    noErrorsWin: 'Complimenti!',
  },
  en: {
    head: 'Game review.',
    tooShort: 'The game was too short for a review.',
    stats: (n, list) => `You played ${n} moves${list ? `: ${list}` : ', with no obvious mistakes'}.`,
    count: { blunder: ['blunder', 'blunders'], mistake: ['mistake', 'mistakes'], inaccuracy: ['inaccuracy', 'inaccuracies'] },
    and: 'and',
    lossIntro: 'The key moments.',
    winIntro: 'Well played. Here is what could have been better.',
    drawIntro: 'Here is what could have been better.',
    kind: { blunder: 'Blunder', mistake: 'Mistake', inaccuracy: 'Inaccuracy' },
    error: (n, played, kind, best, mate) =>
      `Move ${n}: you played ${played}. ${kind}${mate ? ', you had a checkmate available' : ''}${best ? `: ${best} was better` : ''}.`,
    goodIntro: 'Your best moves.',
    good: (n, played) => `Move ${n}: ${played}. Excellent, the only really good move in that position.`,
    noErrorsLoss: 'Your opponent was just a little more precise.',
    noErrorsWin: 'Congratulations!',
  },
  es: {
    head: 'Comentario de la partida.',
    tooShort: 'La partida fue demasiado corta para un comentario.',
    stats: (n, list) => `Has jugado ${n} jugadas${list ? `: ${list}` : ', sin errores claros'}.`,
    count: { blunder: ['error grave', 'errores graves'], mistake: ['error', 'errores'], inaccuracy: ['imprecisión', 'imprecisiones'] },
    and: 'y',
    lossIntro: 'Los momentos decisivos.',
    winIntro: 'Buena partida. Esto es lo que se podía mejorar.',
    drawIntro: 'Esto es lo que se podía mejorar.',
    kind: { blunder: 'Error grave', mistake: 'Error', inaccuracy: 'Imprecisión' },
    error: (n, played, kind, best, mate) =>
      `Jugada ${n}: jugaste ${played}. ${kind}${mate ? ', tenías un jaque mate disponible' : ''}${best ? `: era mejor ${best}` : ''}.`,
    goodIntro: 'Tus mejores jugadas.',
    good: (n, played) => `Jugada ${n}: ${played}. Excelente, la única jugada realmente buena en esa posición.`,
    noErrorsLoss: 'Tu rival fue solo un poco más preciso.',
    noErrorsWin: '¡Enhorabuena!',
  },
  fr: {
    head: 'Commentaire de la partie.',
    tooShort: 'La partie était trop courte pour un commentaire.',
    stats: (n, list) => `Vous avez joué ${n} coups${list ? ` : ${list}` : ', sans erreur évidente'}.`,
    count: { blunder: ['gaffe', 'gaffes'], mistake: ['erreur', 'erreurs'], inaccuracy: ['imprécision', 'imprécisions'] },
    and: 'et',
    lossIntro: 'Les moments décisifs.',
    winIntro: 'Belle partie. Voici ce qui pouvait être amélioré.',
    drawIntro: 'Voici ce qui pouvait être amélioré.',
    kind: { blunder: 'Gaffe', mistake: 'Erreur', inaccuracy: 'Imprécision' },
    error: (n, played, kind, best, mate) =>
      `Coup ${n} : vous avez joué ${played}. ${kind}${mate ? ', vous aviez un échec et mat' : ''}${best ? ` : ${best} était meilleur` : ''}.`,
    goodIntro: 'Vos meilleurs coups.',
    good: (n, played) => `Coup ${n} : ${played}. Excellent, le seul vraiment bon coup dans cette position.`,
    noErrorsLoss: 'Votre adversaire a simplement été un peu plus précis.',
    noErrorsWin: 'Félicitations !',
  },
};

function W() {
  return WORDS[getLanguage()] || WORDS.it;
}

// Testo del messaggio "analisi in corso".
export function progressText(plies) {
  const n = estimateSeconds(plies);
  return {
    it: `Analisi della partita in corso: ci vorranno circa ${n} secondi. Intanto puoi usare i comandi.`,
    en: `Analysing the game: it will take about ${n} seconds. You can keep using the commands.`,
    es: `Analizando la partida: tardará unos ${n} segundos. Mientras tanto puedes usar los comandos.`,
    fr: `Analyse de la partie en cours : environ ${n} secondes. Vous pouvez continuer à utiliser les commandes.`,
  }[getLanguage()] || '';
}

function joinAnd(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${W().and} ${items[items.length - 1]}`;
}

// result: risultato di analyseGame; outcome: 'win' | 'loss' | 'draw';
// narration: { style: 'compatto'|'espanso' } — le mosse si dicono nello stile
// del giocatore, sempre con la casella di partenza (nel commento serve).
export function buildAnalysisText(result, outcome, { style = 'espanso' } = {}) {
  const w = W();
  if (!result || result.playerMoves < 3) return `${w.head} ${w.tooShort}`;

  const say = (move) =>
    style === 'compatto'
      ? moveToCompactText(move, { alwaysFrom: true })
      : moveToExpandedText(move, { alwaysFrom: true });

  const counts = { blunder: 0, mistake: 0, inaccuracy: 0 };
  result.items.forEach((it) => {
    if (it.kind) counts[it.kind] += 1;
  });
  const statParts = ['blunder', 'mistake', 'inaccuracy']
    .filter((k) => counts[k] > 0)
    .map((k) => `${counts[k]} ${w.count[k][counts[k] === 1 ? 0 : 1]}`);
  const parts = [w.head, w.stats(result.playerMoves, joinAnd(statParts))];

  const errors = result.items.filter((it) => it.kind).sort((a, b) => b.loss - a.loss);
  const goods = result.items
    .filter((it) => it.isBest && it.gap >= 15 && !it.decided && !it.recapture)
    .sort((a, b) => b.gap - a.gap);

  const errorLine = (it) => w.error(it.moveNumber, say(it.move), w.kind[it.kind], it.bestMove ? say(it.bestMove) : '', it.missedMate);
  const goodLine = (it) => w.good(it.moveNumber, say(it.move));
  const byPly = (a, b) => a.ply - b.ply;

  if (outcome === 'loss') {
    if (errors.length) {
      parts.push(w.lossIntro, ...errors.slice(0, 3).sort(byPly).map(errorLine));
    } else {
      parts.push(w.noErrorsLoss);
      if (goods.length) parts.push(w.goodIntro, ...goods.slice(0, 2).sort(byPly).map(goodLine));
    }
    return parts.join(' ');
  }

  const chosenErrors = errors.slice(0, 2).sort(byPly);
  const chosenGoods = goods.slice(0, chosenErrors.length ? 1 : 2).sort(byPly);
  if (chosenErrors.length) parts.push(outcome === 'win' ? w.winIntro : w.drawIntro, ...chosenErrors.map(errorLine));
  if (chosenGoods.length) parts.push(w.goodIntro, ...chosenGoods.map(goodLine));
  if (!chosenErrors.length && !chosenGoods.length) parts.push(w.noErrorsWin);
  return parts.join(' ');
}
