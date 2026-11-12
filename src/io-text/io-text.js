// io-text: parsing input testuale (compatto e "città italiane"), promozione,
// arrocco, en passant. Non dipende da game-core: riceve la lista delle mosse
// legali correnti (chess.js verbose moves) e prova a risolvere il testo su
// una di esse.
import {
  FILE_BY_CITY_LOWER,
  PIECE_LETTER_BY_NAME,
  PROMO_LETTER_BY_NAME,
  PROMO_LETTERS_BY_LANGUAGE,
  RANK_BY_WORD,
  stripAccents,
} from '../themes/i18n-voice.js';
import { getLanguage } from '../i18n/i18n.js';

// Parole accettate in italiano e in inglese insieme: "cavallo Firenze 3",
// "knight to Foxtrot 3", "bishop takes Charlie 5", "Echo 8 queen".
const FILLER_WORDS = new Set([
  'in', 'a', 'ad', 'da', 'la', 'il', 'lo', 'e', 'en', 'passant', 'promuove', 'promozione',
  'to', 'on', 'at', 'the', 'and', 'promotes', 'promote', 'promotion', 'equals', 'moves', 'move',
  'al', 'el', 'de', 'y', 'corona', 'promociona', 'paso',
  'le', 'du', 'sur', 'va', 'promu', 'prise', 'et',
]);
const CAPTURE_WORDS = new Set([
  'mangia', 'cattura', 'prende', 'takes', 'take', 'captures', 'capture', 'x',
  'toma', 'come', 'captura', 'por',
  'prend', 'mange',
]);

function normalizeWord(w) {
  const word = stripAccents(w.toLowerCase()).trim();
  return RANK_BY_WORD[word] || word;
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
const COMPACT_RE = /^([nbrqk])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=([qrbndtacf])|([qrbn]))?[+#]?$/i;
// Trattini facoltativi (richiesta di Roberto, 13/11/2026): con la tastiera
// sono scomodi, quindi valgono anche oo, 00, ooo, 000.
const CASTLE_LONG_RE = /^(o-?o-?o|0-?0-?0)$/i;
const CASTLE_SHORT_RE = /^(o-?o|0-?0)$/i;

const CASTLE_WORDS = ['arrocco', 'castle', 'castles', 'castling', 'enroque', 'enroca', 'roque'];
const CASTLE_LONG_WORDS = ['lungo', 'long', 'queenside', 'queen', 'largo', 'grand'];
const CASTLE_SHORT_WORDS = ['corto', 'short', 'kingside', 'king', 'petit'];

function parseCastleWords(words) {
  if (!words.some((w) => CASTLE_WORDS.includes(w))) return null;
  if (words.some((w) => CASTLE_LONG_WORDS.includes(w))) return { castle: 'q' };
  if (words.some((w) => CASTLE_SHORT_WORDS.includes(w))) return { castle: 'k' };
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
    if (!seenCity && !pieceHint && PIECE_LETTER_BY_NAME[w]) {
      pieceHint = PIECE_LETTER_BY_NAME[w];
      continue;
    }
    if (seenCity && PROMO_LETTER_BY_NAME[w]) {
      promotion = PROMO_LETTER_BY_NAME[w];
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

// Notazione spagnola: R rey, D dama, T torre, A alfil, C caballo. Vale solo
// con la lettera MAIUSCOLA (in minuscolo "a", "c", "d" sono colonne) e solo
// con la lingua spagnola, dove "R" è il re e non la torre. Anche "=D" dopo la
// promozione, come in italiano.
// Lo stesso in francese con F per il fou: R roi, D dame, T tour, F fou,
// C cavalier.
const LOCAL_TO_SAN = {
  es: { R: 'K', D: 'Q', T: 'R', A: 'B', C: 'N' },
  fr: { R: 'K', D: 'Q', T: 'R', F: 'B', C: 'N' },
};

function localToSan(text) {
  const map = LOCAL_TO_SAN[getLanguage()];
  if (!map) return text;
  // La lettera è un pezzo solo se dopo c'è una casella intera ("Fc4",
  // "Cxe5", "Tae1"): "F4" o "A4" scritti con la maiuscola sono pedoni.
  return text.replace(/^([A-Z])(?=[a-h]?[1-8]?x?[a-h][1-8])/, (m, l) => map[l] || l);
}

// In spagnolo si prova prima la lettura con le lettere spagnole e, se non
// dà una mossa scritta bene, quella normale (es. "D4" scritto per d4).
function tryParseCompact(rawText) {
  const text = rawText.trim();
  if (LOCAL_TO_SAN[getLanguage()]) {
    const mapped = localToSan(text);
    if (mapped !== text) {
      const intent = parseCompactCore(mapped);
      if (intent) return intent;
    }
  }
  return parseCompactCore(text);
}

function parseCompactCore(t) {
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
    // Lettere locali dopo "=" (D/T/A/C in italiano e spagnolo, D/T/F/C in
    // francese); in inglese solo Q/R/B/N.
    const local = PROMO_LETTERS_BY_LANGUAGE[getLanguage()];
    intent.promotion = (local && local[p]) || p;
    // Lettera sconosciuta in questa lingua: si promuove a dama.
    if (!'qrbn'.includes(intent.promotion)) intent.promotion = 'q';
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
const CMD_HELP_RE = /^(aiuto|help|ayuda|aide)$/i;
const CMD_DIAGNOSTICS_RE = /^(diagnosi|diagnostics|diagnostico|diagnostic)$/i;
const CMD_CLOCK_RE = /^c$/i;
const CMD_LAST_MOVES_RE = /^l(\d+)?$/i;
const CMD_RANK_RE = /^s([1-8])$/i;
const CMD_FILE_RE = /^s([a-h])$/i;
// Posizione dei pezzi (richiesta dei tester, 11/11/2026): "p" + lettera del
// pezzo (in inglese, come nella notazione: K re, Q dama, R torre, B alfiere,
// N cavallo, P pedone) oppure il nome italiano, e facoltativamente il colore
// (b o bianchi, n o neri). Es. "p b" tutti gli alfieri, "p b n" gli alfieri
// neri, "p torri bianche". Nessuna mossa comincia con "p" seguita da questi.
// In inglese il colore è w (white) o b (black): "p b w" alfieri bianchi,
// "p b b" alfieri neri. Il nome del pezzo si può anche scrivere per intero.
const CMD_PIECES_RE = /^p(?:\s*([kqrbnpdtacf])\s*([bnw])?|\s+([a-z]{2,})(?:\s+([a-z]+))?)$/i;
// Lettera del pezzo nel comando "p": inglese in italiano e in inglese (come
// nella notazione), spagnola in spagnolo (r rey, d dama, t torre, a alfil,
// c caballo; anche n/b/q/k inglesi, che lì non si confondono).
const PIECE_LETTERS = {
  it: { k: 'k', q: 'q', r: 'r', b: 'b', n: 'n', p: 'p' },
  en: { k: 'k', q: 'q', r: 'r', b: 'b', n: 'n', p: 'p' },
  es: { r: 'k', d: 'q', t: 'r', a: 'b', c: 'n', p: 'p', k: 'k', q: 'q', b: 'b', n: 'n' },
  fr: { r: 'k', d: 'q', t: 'r', f: 'b', c: 'n', p: 'p', k: 'k', q: 'q', b: 'b', n: 'n' },
};
const PIECE_WORDS = {
  re: 'k', dama: 'q', dame: 'q', donna: 'q', donne: 'q', regina: 'q', regine: 'q',
  torre: 'r', torri: 'r', alfiere: 'b', alfieri: 'b', cavallo: 'n', cavalli: 'n', caballo: 'n',
  pedone: 'p', pedoni: 'p',
  king: 'k', kings: 'k', queen: 'q', queens: 'q', rook: 'r', rooks: 'r',
  bishop: 'b', bishops: 'b', knight: 'n', knights: 'n', pawn: 'p', pawns: 'p',
  rey: 'k', reyes: 'k', damas: 'q', reina: 'q', reinas: 'q', torres: 'r',
  alfil: 'b', alfiles: 'b', caballos: 'n', peon: 'p', peones: 'p',
  roi: 'k', rois: 'k', tour: 'r', tours: 'r', fou: 'b', fous: 'b',
  cavalier: 'n', cavaliers: 'n', pion: 'p', pions: 'p',
};
const COLOR_WORDS = {
  bianco: 'w', bianca: 'w', bianchi: 'w', bianche: 'w',
  nero: 'b', nera: 'b', neri: 'b', nere: 'b',
  white: 'w', whites: 'w', black: 'b', blacks: 'b',
  blanco: 'w', blanca: 'w', blancos: 'w', blancas: 'w',
  negro: 'b', negra: 'b', negros: 'b', negras: 'b',
  blanc: 'w', blanche: 'w', blancs: 'w', blanches: 'w',
  noir: 'b', noire: 'b', noirs: 'b', noires: 'b',
};
// Lettera del colore: in italiano b = bianco e n = nero, in inglese
// w = white e b = black.
const COLOR_LETTERS = {
  it: { b: 'w', n: 'b', w: 'w' },
  en: { w: 'w', b: 'b' },
  es: { b: 'w', n: 'b', w: 'w' },
  fr: { b: 'w', n: 'b', w: 'w' },
};
// Stile narrazione ("v" = voce) e musica ("m", "m+", "m-") durante la partita.
const CMD_VOICE_RE = /^v$/i;
const CMD_MUSIC_RE = /^m\s*([+-])?$/i;

// Ritorna uno tra:
//  { type: 'help' } | { type: 'diagnostics' }
//  { type: 'clock' }
//  { type: 'lastMove' } | { type: 'lastMoves', count }
//  { type: 'rank', rank: '1'-'8' } | { type: 'file', file: 'a'-'h' }
//  { type: 'pieces', piece: 'k'|'q'|'r'|'b'|'n'|'p', color: 'w'|'b'|null }
//  { type: 'narrationStyle' }
//  { type: 'musicToggle' } | { type: 'musicVolume', delta }
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

  if (CMD_VOICE_RE.test(t)) return { type: 'narrationStyle' };

  m = CMD_MUSIC_RE.exec(t);
  if (m) {
    if (m[1] === '+') return { type: 'musicVolume', delta: 0.1 };
    if (m[1] === '-') return { type: 'musicVolume', delta: -0.1 };
    return { type: 'musicToggle' };
  }

  m = CMD_PIECES_RE.exec(stripAccents(t));
  if (m) {
    const word = (m[1] || m[3]).toLowerCase();
    const letters1 = PIECE_LETTERS[getLanguage()] || PIECE_LETTERS.it;
    const piece = word.length === 1 ? letters1[word] : PIECE_WORDS[word];
    const colorWord = (m[2] || m[4] || '').toLowerCase();
    const letters = COLOR_LETTERS[getLanguage()] || COLOR_LETTERS.it;
    const color = colorWord ? (colorWord.length === 1 ? letters[colorWord] : COLOR_WORDS[colorWord]) : null;
    if (piece && (!colorWord || color)) return { type: 'pieces', piece, color };
  }

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
