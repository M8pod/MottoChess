// io-text: parsing input testuale (compatto e "città italiane"), promozione,
// arrocco, en passant. Non dipende da game-core: riceve la lista delle mosse
// legali correnti (chess.js verbose moves) e prova a risolvere il testo su
// una di esse.
import {
  FILE_BY_CITY_LOWER,
  PIECE_LETTER_BY_NAME_IT,
  PROMO_LETTER_BY_NAME_IT,
  PROMO_LETTER_BY_ITALIAN_LETTER,
  RANK_BY_WORD_IT,
  stripAccents,
} from '../themes/i18n-voice.js';

const FILLER_WORDS = new Set(['in', 'a', 'ad', 'da', 'la', 'il', 'lo', 'e', 'en', 'passant', 'promuove', 'promozione']);
const CAPTURE_WORDS = new Set(['mangia', 'cattura', 'prende']);

function normalizeWord(w) {
  const word = stripAccents(w.toLowerCase()).trim();
  return RANK_BY_WORD_IT[word] || word;
}

// "empoli4" (città e numero attaccati) -> ["empoli", "4"]
function splitCityDigit(word) {
  const m = /^([a-z]+)([1-8])$/.exec(word);
  return m && FILE_BY_CITY_LOWER[m[1]] ? [m[1], m[2]] : [word];
}

// Regex per la notazione compatta: pezzo?, disambiguazione file/riga?, cattura?,
// destinazione, promozione?, +/# finale ignorato. La promozione accetta le
// lettere inglesi (e8q, e8=Q) e, solo dopo "=", anche le italiane (e8=D):
// senza "=" la "c" o la "a" sarebbero ambigue.
const COMPACT_RE = /^([nbrqk])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=([qrbndtac])|([qrbn]))?[+#]?$/i;
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
  const words = rawWords
    .map(normalizeWord)
    .flatMap(splitCityDigit)
    .filter((w) => w.length > 0);
  if (words.length === 0) return null;

  const castle = parseCastleWords(words);
  if (castle) return castle;

  // Un nome di pezzo PRIMA della prima casella è il pezzo che muove
  // ("cavallo Firenze 3"); DOPO una casella è il pezzo di promozione
  // ("Empoli 8 cavallo"). Prima il primo nome di pezzo veniva sempre preso
  // come pezzo che muove, e "Empoli 8 cavallo" risultava illegale.
  let pieceHint;
  let promotion;
  let seenCity = false;
  const remaining = [];

  for (const w of words) {
    if (FILLER_WORDS.has(w) || CAPTURE_WORDS.has(w)) continue;
    if (FILE_BY_CITY_LOWER[w]) seenCity = true;
    if (!seenCity && !pieceHint && PIECE_LETTER_BY_NAME_IT[w]) {
      pieceHint = PIECE_LETTER_BY_NAME_IT[w];
      continue;
    }
    if (seenCity && PROMO_LETTER_BY_NAME_IT[w]) {
      promotion = PROMO_LETTER_BY_NAME_IT[w];
      continue;
    }
    remaining.push(w);
  }

  const squares = parseCityRankPairs(remaining);

  if (squares.length === 0) return null;

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
  const [, pieceLetter, fromFile, fromRank, , dest, promoAfterEquals, promoBare] = m;
  const intent = { toSquare: dest.toLowerCase() };
  if (pieceLetter) intent.pieceHint = pieceLetter.toLowerCase();
  if (fromFile) intent.fromFile = fromFile.toLowerCase();
  if (fromRank) intent.fromRank = fromRank;
  if (promoAfterEquals) {
    const p = promoAfterEquals.toLowerCase();
    intent.promotion = PROMO_LETTER_BY_ITALIAN_LETTER[p] || p;
  } else if (promoBare) {
    intent.promotion = promoBare.toLowerCase();
  }
  // "bc4" / "bxc4" scritti in minuscolo: la "b" può essere l'alfiere oppure
  // la colonna del pedone che cattura. Si prova prima l'alfiere (come vuole
  // la notazione) e, se non c'è nessuna mossa d'alfiere, il pedone.
  if (pieceLetter === 'b' && !fromFile && !fromRank) {
    intent.pawnAlternative = { toSquare: intent.toSquare, pieceHint: 'p', fromFile: 'b', promotion: intent.promotion };
  }
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
  let uniqueFromTo = new Set(candidates.map((m) => `${m.from}-${m.to}`));

  // Convenzione della notazione algebrica: una destinazione senza lettera di
  // pezzo indica una mossa di PEDONE ("e4" = pedone in e4). Serve come
  // discriminante quando anche un altro pezzo può raggiungere quella casella
  // (es. "e4" con il pedone ancora in e2 e un cavallo in c3): prima l'input
  // veniva rifiutato come ambiguo, impedendo di fatto il doppio passo.
  if (uniqueFromTo.size > 1 && !intent.pieceHint) {
    const pawnCandidates = candidates.filter((m) => m.piece === 'p');
    if (pawnCandidates.length > 0) {
      candidates = pawnCandidates;
      uniqueFromTo = new Set(candidates.map((m) => `${m.from}-${m.to}`));
    }
  }

  if (uniqueFromTo.size !== 1) return null;

  const move = candidates[0];
  if (move.isPromotion()) {
    return { from: move.from, to: move.to, promotion: intent.promotion || 'q' };
  }
  return { from: move.from, to: move.to };
}

// Comandi informativi (non sono mosse, funzionano sempre indipendentemente
// dal turno): l'ultima mossa, le ultime N mosse, tempo residuo, pezzi su una
// traversa/colonna, aiuto. Riconosciuti PRIMA di tentare il parsing mossa in
// parseMoveText, così non entrano mai in conflitto con la notazione (nessuna
// mossa scacchistica è "l", "c", "s"+cifra/lettera o "aiuto").
const CMD_HELP_RE = /^aiuto$/i;
const CMD_DIAGNOSTICS_RE = /^diagnosi$/i;
const CMD_CLOCK_RE = /^c$/i;
const CMD_LAST_MOVES_RE = /^l(\d+)?$/i;
const CMD_RANK_RE = /^s([1-8])$/i;
const CMD_FILE_RE = /^s([a-h])$/i;

// Ritorna uno tra:
//  { type: 'help' } | { type: 'diagnostics' }
//  { type: 'clock' }
//  { type: 'lastMove' } | { type: 'lastMoves', count }
//  { type: 'rank', rank: '1'-'8' } | { type: 'file', file: 'a'-'h' }
//  null se il testo non è un comando riconosciuto
export function parseCommandText(rawText) {
  const t = (rawText || '').trim();
  if (!t) return null;

  if (CMD_HELP_RE.test(t)) return { type: 'help' };
  if (CMD_DIAGNOSTICS_RE.test(t)) return { type: 'diagnostics' };
  if (CMD_CLOCK_RE.test(t)) return { type: 'clock' };

  let m = CMD_LAST_MOVES_RE.exec(t);
  if (m) return m[1] ? { type: 'lastMoves', count: Number(m[1]) } : { type: 'lastMove' };

  m = CMD_RANK_RE.exec(t);
  if (m) return { type: 'rank', rank: m[1] };

  m = CMD_FILE_RE.exec(t);
  if (m) return { type: 'file', file: m[1].toLowerCase() };

  return null;
}

// API principale. Ritorna sempre uno tra:
//  { ok: true, move: {from,to,promotion?} }
//  { ok: false, reason: 'invalid' }   testo non interpretabile
//  { ok: false, reason: 'illegal' }   sintassi ok ma nessuna mossa legale corrispondente
export function parseMoveText(rawText, legalMoves) {
  // La punteggiatura (tipica della dettatura: "Empoli, 4.") non porta
  // informazione: si toglie, salvo trattino e uguale che servono a O-O e e8=D.
  const text = (rawText || '').replace(/[,.;:!?]+/g, ' ').trim();
  if (!text) return { ok: false, reason: 'invalid' };

  let intent = tryParseCompact(text);
  if (!intent) {
    intent = tryParseCitta(text.split(/\s+/));
  }
  if (!intent) {
    return { ok: false, reason: 'invalid' };
  }

  let move = resolveIntent(intent, legalMoves);
  if (!move && intent.pawnAlternative) {
    move = resolveIntent(intent.pawnAlternative, legalMoves);
  }
  if (!move) {
    return { ok: false, reason: 'illegal' };
  }
  return { ok: true, move };
}
