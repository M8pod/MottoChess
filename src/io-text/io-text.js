// io-text: parsing input testuale (compatto e "città italiane"), promozione,
// arrocco, en passant. Non dipende da game-core: riceve la lista delle mosse
// legali correnti (chess.js verbose moves) e prova a risolvere il testo su
// una di esse.
import {
  FILE_BY_CITY_LOWER,
  PIECE_LETTER_BY_NAME_IT,
  PROMO_LETTER_BY_NAME_IT,
  stripAccents,
} from '../themes/i18n-voice.js';

const FILLER_WORDS = new Set(['in', 'a', 'da', 'la', 'il', 'lo', 'e', 'en', 'passant']);
const CAPTURE_WORDS = new Set(['mangia', 'cattura', 'prende']);

function normalizeWord(w) {
  return stripAccents(w.toLowerCase()).trim();
}

// Regex per la notazione compatta: pezzo?, disambiguazione file/riga?, cattura?,
// destinazione, promozione?, +/# finale ignorato.
const COMPACT_RE = /^([nbrqk])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=?([qrbn]))?[+#]?$/i;
const CASTLE_LONG_RE = /^(o-o-o|0-0-0)$/i;
const CASTLE_SHORT_RE = /^(o-o|0-0)$/i;

function parseCastleWords(words) {
  if (!words.includes('arrocco')) return null;
  if (words.includes('lungo')) return { castle: 'q' };
  if (words.includes('corto')) return { castle: 'k' };
  return null;
}

function parseCityRankPairs(words) {
  // Trova sequenze (cittàConosciuta, cifra1-8) nell'ordine in cui compaiono.
  const squares = [];
  for (let i = 0; i < words.length; i++) {
    const file = FILE_BY_CITY_LOWER[words[i]];
    if (file && i + 1 < words.length && /^[1-8]$/.test(words[i + 1])) {
      squares.push(file + words[i + 1]);
      i++; // consuma anche la cifra
    }
  }
  return squares;
}

// Prova a interpretare il testo in modalità "città italiane".
function tryParseCitta(rawWords) {
  const words = rawWords.map(normalizeWord).filter((w) => w.length > 0);
  if (words.length === 0) return null;

  const castle = parseCastleWords(words);
  if (castle) return castle;

  let pieceHint;
  let promotion;
  const remaining = [];

  for (const w of words) {
    if (FILLER_WORDS.has(w) || CAPTURE_WORDS.has(w)) continue;
    if (!pieceHint && PIECE_LETTER_BY_NAME_IT[w]) {
      pieceHint = PIECE_LETTER_BY_NAME_IT[w];
      continue;
    }
    remaining.push(w);
  }

  // L'eventuale ultima parola non consumata come città/cifra puo' essere la
  // promozione (dama/torre/alfiere/cavallo), la controlliamo dopo aver
  // estratto le caselle.
  const squares = parseCityRankPairs(remaining);

  if (squares.length === 0) return null;

  // Parola di promozione: un nome-pezzo rimasto tra le "remaining" che non è
  // stato consumato come parte di una coppia città+cifra.
  const consumedCount = squares.length * 2;
  if (remaining.length > consumedCount) {
    const leftover = remaining[remaining.length - 1];
    if (PROMO_LETTER_BY_NAME_IT[leftover]) {
      promotion = PROMO_LETTER_BY_NAME_IT[leftover];
    }
  }

  if (squares.length === 1) {
    return { pieceHint, toSquare: squares[0], promotion };
  }
  if (squares.length >= 2) {
    return {
      pieceHint,
      fromSquare: squares[0],
      toSquare: squares[1],
      promotion,
    };
  }
  return null;
}

function tryParseCompact(text) {
  const t = text.trim();
  if (CASTLE_LONG_RE.test(t)) return { castle: 'q' };
  if (CASTLE_SHORT_RE.test(t)) return { castle: 'k' };

  const m = COMPACT_RE.exec(t);
  if (!m) return null;
  const [, pieceLetter, fromFile, fromRank, , dest, promo] = m;
  const intent = { toSquare: dest };
  if (pieceLetter) intent.pieceHint = pieceLetter.toLowerCase();
  if (fromFile) intent.fromFile = fromFile.toLowerCase();
  if (fromRank) intent.fromRank = fromRank;
  if (promo) intent.promotion = promo.toLowerCase();
  return intent;
}

// Risolve un "intent" (parziale) su una lista di mosse legali (chess.js
// verbose moves) restituendo esattamente una mossa compatibile, oppure null.
function resolveIntent(intent, legalMoves) {
  if (intent.castle) {
    const matches = legalMoves.filter((m) =>
      intent.castle === 'k' ? m.isKingsideCastle() : m.isQueensideCastle()
    );
    return matches.length === 1 ? matches[0] : null;
  }

  let candidates = legalMoves.filter((m) => m.to === intent.toSquare);

  if (intent.pieceHint) {
    candidates = candidates.filter((m) => m.piece === intent.pieceHint);
  } else if (intent.fromFile || intent.fromRank) {
    // Nessun pieceHint esplicito ma c'è disambiguazione: resta compatibile
    // con qualsiasi pezzo (il caso tipico è il pedone in notazione compatta).
  }

  if (intent.fromSquare) {
    candidates = candidates.filter((m) => m.from === intent.fromSquare);
  } else {
    if (intent.fromFile) {
      candidates = candidates.filter((m) => m.from[0] === intent.fromFile);
    }
    if (intent.fromRank) {
      candidates = candidates.filter((m) => m.from[1] === intent.fromRank);
    }
  }

  if (candidates.length === 0) return null;

  // Una mossa di promozione compare nella lista mosse legali una volta per
  // ciascun pezzo promuovibile (stesso from/to, promotion diversa): non è
  // un'ambiguità reale, la scelta del pezzo arriva da intent.promotion.
  const uniqueFromTo = new Set(candidates.map((m) => `${m.from}-${m.to}`));
  if (uniqueFromTo.size !== 1) return null;

  const move = candidates[0];
  if (move.isPromotion()) {
    return { from: move.from, to: move.to, promotion: intent.promotion || 'q' };
  }
  return { from: move.from, to: move.to };
}

// API principale. Ritorna sempre uno tra:
//  { ok: true, move: {from,to,promotion?} }
//  { ok: false, reason: 'invalid' }   testo non interpretabile
//  { ok: false, reason: 'illegal' }   sintassi ok ma nessuna mossa legale corrispondente
export function parseMoveText(rawText, legalMoves) {
  const text = (rawText || '').trim();
  if (!text) return { ok: false, reason: 'invalid' };

  let intent = tryParseCompact(text);
  if (!intent) {
    intent = tryParseCitta(text.split(/\s+/));
  }
  if (!intent) {
    return { ok: false, reason: 'invalid' };
  }

  const move = resolveIntent(intent, legalMoves);
  if (!move) {
    return { ok: false, reason: 'illegal' };
  }
  return { ok: true, move };
}
