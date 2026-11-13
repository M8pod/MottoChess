// themes/i18n-voice: nomi di colonne, pezzi e colori per la voce, e testi
// delle mosse, nella lingua scelta (italiano o inglese). Separato da
// game-core.
//
// Colonne: in italiano le "città italiane" (Ancona ... Hotel); in inglese
// l'alfabeto fonetico NATO (Alpha ... Hotel), richiesto dai tester
// l'11/11/2026; in spagnolo i nomi raccomandati dalla FIDE per gli scacchi
// dei non vedenti (Ana, Bella, César ... Héctor), come li usano i giocatori
// di lingua spagnola. In spagnolo anche le lettere dei pezzi sono spagnole:
// R rey, D dama, T torre, A alfil, C caballo. In francese gli stessi nomi
// FIDE nella grafia francese (Anna, Bella, César, David, Eva, Félix,
// Gustave, Hector) e le lettere francesi: R roi, D dame, T tour, F fou,
// C cavalier. Le tabelle di riconoscimento accettano entrambi i sistemi in
// qualunque lingua: chi scrive "Empoli 4" o "Echo 4" viene capito comunque.
import { getLanguage } from '../i18n/i18n.js';
import { Chess } from '../vendor/chess.js';

const LANG = {
  it: {
    files: { a: 'Ancona', b: 'Bologna', c: 'Como', d: 'Domodossola', e: 'Empoli', f: 'Firenze', g: 'Genova', h: 'Hotel' },
    pieces: { p: 'pedone', n: 'cavallo', b: 'alfiere', r: 'torre', q: 'dama', k: 're' },
    colors: { w: 'bianco', b: 'nero' },
    selected: 'selezionata',
    empty: 'vuota',
    takes: 'prende',
    check: 'scacco',
    mate: 'scacco matto',
    castleShort: 'arrocco corto',
    castleLong: 'arrocco lungo',
    promotesTo: 'promuove a',
  },
  en: {
    files: { a: 'Alpha', b: 'Bravo', c: 'Charlie', d: 'Delta', e: 'Echo', f: 'Foxtrot', g: 'Golf', h: 'Hotel' },
    pieces: { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' },
    colors: { w: 'white', b: 'black' },
    selected: 'selected',
    empty: 'empty',
    takes: 'takes',
    check: 'check',
    mate: 'checkmate',
    castleShort: 'castles kingside',
    castleLong: 'castles queenside',
    promotesTo: 'promotes to',
  },
  es: {
    files: { a: 'Ana', b: 'Bella', c: 'César', d: 'David', e: 'Eva', f: 'Félix', g: 'Gustavo', h: 'Héctor' },
    pieces: { p: 'peón', n: 'caballo', b: 'alfil', r: 'torre', q: 'dama', k: 'rey' },
    // Il colore come schieramento ("juegas con blancas", "jugada 3, negras");
    // accanto a un pezzo si usa l'aggettivo accordato (colorAdjectiveEs).
    colors: { w: 'blancas', b: 'negras' },
    selected: 'seleccionada',
    empty: 'vacía',
    takes: 'toma',
    check: 'jaque',
    mate: 'jaque mate',
    castleShort: 'enroque corto',
    castleLong: 'enroque largo',
    promotesTo: 'corona',
  },
  fr: {
    files: { a: 'Anna', b: 'Bella', c: 'César', d: 'David', e: 'Eva', f: 'Félix', g: 'Gustave', h: 'Hector' },
    pieces: { p: 'pion', n: 'cavalier', b: 'fou', r: 'tour', q: 'dame', k: 'roi' },
    // Il colore come schieramento ("vous jouez les blancs").
    colors: { w: 'blancs', b: 'noirs' },
    selected: 'sélectionnée',
    empty: 'vide',
    takes: 'prend',
    check: 'échec',
    mate: 'échec et mat',
    castleShort: 'petit roque',
    castleLong: 'grand roque',
    promotesTo: 'promu en',
  },
};

// Lettere dei pezzi nella notazione di ogni lingua (la notazione interna è
// quella inglese di chess.js).
const SAN_LETTERS = {
  es: { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' },
  fr: { K: 'R', Q: 'D', R: 'T', B: 'F', N: 'C' },
};

export function localPieceLetter(letter) {
  const map = SAN_LETTERS[getLanguage()];
  return map ? map[letter] || letter : letter;
}

function L() {
  return LANG[getLanguage()] || LANG.it;
}

// Nome della colonna (es. 'f' -> "Firenze" o "Foxtrot").
export function fileName(file) {
  return L().files[file];
}

export function pieceName(type) {
  return L().pieces[type];
}

export function colorName(color) {
  return L().colors[color];
}

// --- Riconoscimento (tutte le lingue insieme) ---

export const FILE_BY_CITY_LOWER = {};
Object.values(LANG).forEach(({ files }) => {
  Object.entries(files).forEach(([file, name]) => {
    FILE_BY_CITY_LOWER[name.toLowerCase()] = file;
  });
});
// Grafia italiana e americana di "Alpha".
FILE_BY_CITY_LOWER.alfa = 'a';
// Nomi FIDE senza accento e nella grafia tedesca/inglese, come vengono
// spesso scritti o dettati.
Object.assign(FILE_BY_CITY_LOWER, {
  cesar: 'c', felix: 'f', hector: 'h', anna: 'a', bela: 'b', gustav: 'g', ana: 'a', gustavo: 'g', gustave: 'g',
});

export const PIECE_LETTER_BY_NAME = {
  pedone: 'p', cavallo: 'n', alfiere: 'b', torre: 'r', dama: 'q', donna: 'q', regina: 'q', re: 'k',
  pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k',
  peon: 'p', caballo: 'n', alfil: 'b', reina: 'q', rey: 'k',
  pion: 'p', cavalier: 'n', fou: 'b', tour: 'r', roi: 'k',
};

export const PROMO_LETTER_BY_NAME = {
  dama: 'q', donna: 'q', regina: 'q', torre: 'r', alfiere: 'b', cavallo: 'n',
  queen: 'q', rook: 'r', bishop: 'b', knight: 'n',
  reina: 'q', caballo: 'n', alfil: 'b',
  cavalier: 'n', fou: 'b', tour: 'r',
};

// Numeri di traversa scritti in lettere: la dettatura (e chi scrive a mano)
// può produrre "Empoli quattro" o "Echo four" invece di "Empoli 4".
export const RANK_BY_WORD = {
  uno: '1', due: '2', tre: '3', quattro: '4', cinque: '5', sei: '6', sette: '7', otto: '8',
  one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8',
  dos: '2', tres: '3', cuatro: '4', cinco: '5', seis: '6', siete: '7', ocho: '8',
  un: '1', deux: '2', trois: '3', quatre: '4', cinq: '5', sept: '7', huit: '8',
  // errori tipici della dettatura in inglese
  won: '1', for: '4', ate: '8',
};

// Lettere locali accettate per il pezzo di promozione dopo "=" (es.
// "e8=D"): in italiano e spagnolo D dama, T torre, A alfiere/alfil,
// C cavallo/caballo; in francese D dame, T tour, F fou, C cavalier.
export const PROMO_LETTERS_BY_LANGUAGE = {
  it: { d: 'q', t: 'r', a: 'b', c: 'n' },
  es: { d: 'q', t: 'r', a: 'b', c: 'n' },
  fr: { d: 'q', t: 'r', f: 'b', c: 'n' },
};

export function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// --- Testi per la voce ---

export function squareToCity(square) {
  return `${fileName(square[0])} ${square[1]}`;
}

// Etichetta per una casella della scacchiera, usata come aria-label.
// piece: { type, color } | null
export function describeSquare(square, piece, { selected = false } = {}) {
  let label = squareToCity(square);
  if (piece) label += `, ${pieceWithColor(piece)}`;
  if (selected) label += `, ${L().selected}`;
  return label;
}

// "pedone bianco" / "white pawn" / "peón blanco": in inglese l'aggettivo
// va prima; in italiano e spagnolo si accorda al genere ("torre nera",
// "torre negra").
function pieceWithColor(piece) {
  if (getLanguage() === 'en') return `${colorName(piece.color)} ${pieceName(piece.type)}`;
  if (getLanguage() === 'es') return `${pieceName(piece.type)} ${colorAdjectiveEs(piece.color, PIECE_FORMS_ES[piece.type].fem, false)}`;
  if (getLanguage() === 'fr') return `${pieceName(piece.type)} ${colorAdjectiveFr(piece.color, PIECE_FORMS_FR[piece.type].fem, false)}`;
  // Torre e dama sono femminili: "torre nera", "dama bianca".
  const fem = PIECE_FORMS_IT[piece.type].fem;
  return `${pieceName(piece.type)} ${colorAdjectiveIt(piece.color, fem, false)}`;
}

// Descrizione di una casella per i comandi informativi "s+numero"/"s+lettera"
// (elenco pezzi su una traversa/colonna): a differenza di describeSquare(),
// annuncia esplicitamente anche le caselle vuote.
export function describeSquareForListing(square, piece) {
  const base = squareToCity(square);
  if (!piece) return `${base}, ${L().empty}`;
  return `${base}, ${pieceWithColor(piece)}`;
}

// La colonna h letta da sola ("h4", "h") viene presa dalle voci italiane per
// l'abbreviazione di "ore" ("4 ore"): segnalato dai tester (11/11/2026). Nella
// notazione compatta italiana la h diventa quindi "Hotel", come nelle città.
// Le voci inglesi la leggono correttamente come lettera.
function speakFileInSan(text) {
  if (getLanguage() !== 'it') return text;
  return text.replace(/^h/, 'Hotel ').trim();
}

// Testo "compatto" (notazione standard) per una mossa, ma reso PRONUNCIABILE:
// lette così come sono, stringhe come "Qxf7#" o "O-O" venivano lette dagli
// screen reader in modo poco chiaro ("cu ics effe sette cancelletto", "o
// trattino o"). Lettere e caselle restano quelle della notazione, separate da
// spazi, mentre i simboli diventano parole ("prende"/"takes", "scacco"/
// "check", "arrocco corto"/"castles kingside"...).
//
// opts.announceMate: false per l'annuncio "a caldo" di una mossa appena
// giocata, perché subito dopo arriva comunque "Scacco matto. Hai vinto/perso."
export function sanToSpeech(san, { announceMate = true } = {}) {
  const w = L();
  let s = String(san || '').trim();
  let suffix = '';
  if (s.endsWith('#')) {
    suffix = announceMate ? `, ${w.mate}` : '';
    s = s.slice(0, -1);
  } else if (s.endsWith('+')) {
    suffix = `, ${w.check}`;
    s = s.slice(0, -1);
  }
  if (s === 'O-O' || s === '0-0') return `${w.castleShort}${suffix}`;
  if (s === 'O-O-O' || s === '0-0-0') return `${w.castleLong}${suffix}`;

  const m = /^([NBRQK])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=([NBRQ]))?$/.exec(s);
  if (!m) return san;
  const [, piece, fromFile, fromRank, capture, dest, promo] = m;
  const parts = [];
  if (piece) parts.push(localPieceLetter(piece));
  if (fromFile || fromRank) parts.push(speakFileInSan(`${fromFile || ''}${fromRank || ''}`));
  if (capture) parts.push(w.takes);
  parts.push(speakFileInSan(dest));
  if (promo) parts.push(`${w.promotesTo} ${localPieceLetter(promo)}`);
  return parts.join(' ') + suffix;
}

// Vero se un altro pezzo dello stesso tipo e colore poteva andare sulla
// stessa casella (es. cavalli in f3 e f5 che possono entrambi mangiare in
// d4). Segnalato dai tester con JAWS (13/11/2026): la voce diceva solo
// "cavallo mangia pedone in Domodossola 4" senza dire QUALE cavallo.
function isAmbiguousMove(move) {
  if (!move || !move.before || move.isKingsideCastle?.() || move.isQueensideCastle?.()) return false;
  try {
    return new Chess(move.before).moves({ verbose: true })
      .some((m) => m.to === move.to && m.piece === move.piece && m.from !== move.from);
  } catch {
    return false;
  }
}

// Nella notazione compatta, se la mossa è ambigua si dice la casella di
// partenza COMPLETA ("N f3 prende d4") invece della sola lettera o del solo
// numero della notazione standard ("N 3 prende d4"), più difficile da capire
// a orecchio. I pedoni restano come sono: "e prende d4" basta già.
//
// opts.alwaysFrom (impostazione "Pronuncia sempre la casella di partenza",
// richiesta di Roberto del 13/11/2026): la casella di partenza si dice per
// OGNI mossa, pedoni compresi, come nella notazione lunga: "N g1 f3",
// "e2 e4", "e5 prende d6".
export function moveToCompactText(move, opts = {}) {
  const castle = move.isKingsideCastle?.() || move.isQueensideCastle?.();
  if (opts.alwaysFrom && !castle) {
    const suffix = /[+#]$/.test(move.san) ? move.san.slice(-1) : '';
    const letter = move.piece === 'p' ? '' : move.piece.toUpperCase();
    const promo = move.promotion ? `=${move.promotion.toUpperCase()}` : '';
    return sanToSpeech(`${letter}${move.from}${move.captured ? 'x' : ''}${move.to}${promo}${suffix}`, opts);
  }
  let san = move.san;
  if (move.piece !== 'p' && isAmbiguousMove(move)) {
    san = san.replace(/^([NBRQK])[a-h]?[1-8]?/, `$1${move.from}`);
  }
  return sanToSpeech(san, opts);
}

// "a Firenze 3", ma "ad Ancona 3": la "d" eufonica davanti alla a.
function itTo(city) {
  return /^a/i.test(city) ? `ad ${city}` : `a ${city}`;
}

// Parole delle frasi espanse, per lingua. from: "cavallo di Firenze 3
// mangia..." (catture); moveFrom/moveTo: "cavallo da Genova 1 a Firenze 3"
// (mosse senza cattura con la casella di partenza).
const EXPANDED_WORDS = {
  it: { ep: 'en passant, pedone mangia pedone in', epFrom: 'en passant, pedone', epTail: 'mangia pedone in', takes: 'mangia', on: 'in', to: 'in', from: 'di', moveFrom: 'da', moveTo: itTo },
  en: { ep: 'en passant, pawn takes pawn on', epFrom: 'en passant, pawn', epTail: 'takes pawn on', takes: 'takes', on: 'on', to: 'to', from: 'from', moveFrom: 'from', moveTo: (c) => `to ${c}` },
  es: { ep: 'al paso, peón toma peón en', epFrom: 'al paso, peón', epTail: 'toma peón en', takes: 'toma', on: 'en', to: 'a', from: 'de', moveFrom: 'de', moveTo: (c) => `a ${c}` },
  fr: { ep: 'prise en passant, pion prend pion en', epFrom: 'prise en passant, pion', epTail: 'prend pion en', takes: 'prend', on: 'en', to: 'en', from: 'de', moveFrom: 'de', moveTo: (c) => `en ${c}` },
};

// "de" + casella, con l'elisione francese: "d'Anna 1", "d'Eva 2",
// "d'Hector 3", ma "de Bella 1".
function fromWord(P, word, city) {
  if (getLanguage() === 'fr' && word === 'de' && /^[aeiouhéè]/i.test(city)) return `d'${city}`;
  return `${word} ${city}`;
}

// Testo "espanso" per una mossa già eseguita.
// move: oggetto Move di chess.js (con isCapture/isEnPassant/isCastle ecc.)
// opts.isCheck / opts.isCheckmate: stato della partita DOPO la mossa.
// opts.alwaysFrom: dice sempre la casella di partenza (vedi moveToCompactText).
export function moveToExpandedText(move, { isCheck = false, isCheckmate = false, alwaysFrom = false } = {}) {
  const w = L();
  let phrase;

  if (move.isKingsideCastle()) {
    phrase = w.castleShort;
  } else if (move.isQueensideCastle()) {
    phrase = w.castleLong;
  } else {
    const destCity = squareToCity(move.to);
    const fromCity = squareToCity(move.from);
    const P = EXPANDED_WORDS[getLanguage()] || EXPANDED_WORDS.it;
    // Casella di partenza detta se richiesta dall'impostazione, oppure se
    // due pezzi uguali potevano andare sulla stessa casella: "cavallo di
    // Firenze 3 mangia pedone in Domodossola 4", "torre da Ancona 1 a
    // Domodossola 1".
    const withFrom = alwaysFrom || isAmbiguousMove(move);
    const name = pieceName(move.piece);

    if (move.isEnPassant()) {
      phrase = withFrom ? `${P.epFrom} ${fromWord(P, P.from, fromCity)} ${P.epTail} ${destCity}` : `${P.ep} ${destCity}`;
    } else if (move.captured) {
      const mover = withFrom ? `${name} ${fromWord(P, P.from, fromCity)}` : name;
      phrase = `${mover} ${P.takes} ${pieceName(move.captured)} ${P.on} ${destCity}`;
    } else if (withFrom) {
      phrase = `${name} ${fromWord(P, P.moveFrom, fromCity)} ${P.moveTo(destCity)}`;
    } else if (move.piece !== 'p') {
      phrase = `${name} ${P.to} ${destCity}`;
    } else {
      phrase = destCity;
    }
  }

  if (isCheck && !isCheckmate) phrase += `, ${w.check}`;
  return phrase;
}

// --- Comandi "i" (casella), "a" (attenzione) e "x" (materiale) ---

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };

const INFO_WORDS = {
  it: {
    on: 'in', none: 'nessuno', attackers: 'Attaccanti', defenders: 'Difensori',
    controlW: 'Pezzi bianchi che la controllano', controlB: 'Pezzi neri che la controllano',
    hangingHead: 'Attenzione, pezzi in presa:', noHanging: 'Nessun tuo pezzo è in presa.', inCheck: 'Il tuo re è sotto scacco.',
    youTook: 'Hai mangiato', oppTook: "L'avversario ha mangiato", nothing: 'nessun pezzo', and: 'e',
    ahead: (n) => `Sei in vantaggio di ${n} punt${n === 1 ? 'o' : 'i'}.`,
    behind: (n) => `L'avversario è in vantaggio di ${n} punt${n === 1 ? 'o' : 'i'}.`,
    even: 'Materiale in parità.',
  },
  en: {
    on: 'on', none: 'none', attackers: 'Attacked by', defenders: 'Defended by',
    controlW: 'White pieces controlling it', controlB: 'Black pieces controlling it',
    hangingHead: 'Warning, pieces under threat:', noHanging: 'None of your pieces is hanging.', inCheck: 'Your king is in check.',
    youTook: 'You have captured', oppTook: 'Your opponent has captured', nothing: 'nothing', and: 'and',
    ahead: (n) => `You are ahead by ${n} point${n === 1 ? '' : 's'}.`,
    behind: (n) => `Your opponent is ahead by ${n} point${n === 1 ? '' : 's'}.`,
    even: 'Material is even.',
  },
  es: {
    on: 'en', none: 'ninguno', noneFem: 'ninguna', attackers: 'Atacantes', defenders: 'Defensores',
    controlW: 'Piezas blancas que la controlan', controlB: 'Piezas negras que la controlan',
    hangingHead: 'Atención, piezas en peligro:', noHanging: 'Ninguna de tus piezas está en peligro.', inCheck: 'Tu rey está en jaque.',
    youTook: 'Has capturado', oppTook: 'Tu rival ha capturado', nothing: 'nada', and: 'y',
    ahead: (n) => `Vas ganando por ${n} punto${n === 1 ? '' : 's'}.`,
    behind: (n) => `Tu rival va ganando por ${n} punto${n === 1 ? '' : 's'}.`,
    even: 'Material igualado.',
  },
  fr: {
    on: 'en', none: 'aucun', noneFem: 'aucune', attackers: 'Attaquants', defenders: 'Défenseurs',
    controlW: 'Pièces blanches qui la contrôlent', controlB: 'Pièces noires qui la contrôlent',
    hangingHead: 'Attention, pièces en prise :', noHanging: "Aucune de vos pièces n'est en prise.", inCheck: 'Votre roi est en échec.',
    youTook: 'Vous avez pris', oppTook: 'Votre adversaire a pris', nothing: 'rien', and: 'et',
    ahead: (n) => `Vous avez ${n} point${n === 1 ? '' : 's'} d'avance.`,
    behind: (n) => `Votre adversaire a ${n} point${n === 1 ? '' : 's'} d'avance.`,
    even: 'Matériel égal.',
  },
};

function IW() {
  return INFO_WORDS[getLanguage()] || INFO_WORDS.it;
}

// I due punti in francese vogliono lo spazio prima.
function colon() {
  return getLanguage() === 'fr' ? ' :' : ':';
}

// Elenco dei pezzi su un insieme di caselle, dal meno prezioso (il primo
// che conviene usare per catturare): "pedone in Empoli 3, cavallo in
// Firenze 3".
function pieceList(chess, squares, { fem = false } = {}) {
  if (squares.length === 0) return (fem && IW().noneFem) || IW().none;
  return squares
    .map((sq) => ({ sq, p: chess.get(sq) }))
    .filter((x) => x.p)
    .sort((a, b) => PIECE_VALUES[a.p.type] - PIECE_VALUES[b.p.type])
    .map((x) => `${pieceName(x.p.type)} ${IW().on} ${squareToCity(x.sq)}`)
    .join(', ');
}

// Comando "i" + casella: cosa c'è e chi la controlla. Con un pezzo sopra:
// attaccanti (l'altro colore) e difensori (lo stesso colore); vuota: i
// pezzi bianchi e neri che ci possono arrivare.
export function describeSquareInfo(fen, square) {
  const chess = new Chess(fen);
  const piece = chess.get(square);
  const w = IW();
  const c = colon();
  if (piece) {
    const opp = piece.color === 'w' ? 'b' : 'w';
    const attackers = pieceList(chess, chess.attackers(square, opp));
    const defenders = pieceList(chess, chess.attackers(square, piece.color));
    return `${squareToCity(square)}, ${pieceWithColor(piece)}. ${w.attackers}${c} ${attackers}. ${w.defenders}${c} ${defenders}.`;
  }
  const byW = pieceList(chess, chess.attackers(square, 'w'), { fem: true });
  const byB = pieceList(chess, chess.attackers(square, 'b'), { fem: true });
  return `${squareToCity(square)}, ${L().empty}. ${w.controlW}${c} ${byW}. ${w.controlB}${c} ${byB}.`;
}

// Pezzi del giocatore (re escluso) che l'avversario può mangiare con
// guadagno: attaccati e non difesi, oppure attaccati da un pezzo che vale
// meno (una torre attaccata da un pedone è in pericolo anche se difesa).
export function findHangingPieces(fen, color) {
  const chess = new Chess(fen);
  const opp = color === 'w' ? 'b' : 'w';
  const out = [];
  chess.board().flat().forEach((cell) => {
    if (!cell || cell.color !== color || cell.type === 'k') return;
    const attackers = chess.attackers(cell.square, opp);
    if (attackers.length === 0) return;
    const defenders = chess.attackers(cell.square, color);
    const cheapest = Math.min(...attackers.map((sq) => PIECE_VALUES[chess.get(sq).type]));
    if (defenders.length === 0 || cheapest < PIECE_VALUES[cell.type]) {
      out.push({ square: cell.square, type: cell.type, attackers, defenders });
    }
  });
  // Prima i pezzi che valgono di più.
  return out.sort((a, b) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type]);
}

// Comando "a" (attenzione).
export function describeHangingPieces(fen, color) {
  const chess = new Chess(fen);
  const w = IW();
  const c = colon();
  const check = chess.isCheck() && chess.turn() === color ? `${w.inCheck} ` : '';
  const hanging = findHangingPieces(fen, color);
  if (hanging.length === 0) return `${check}${w.noHanging}`;
  const parts = hanging.map((h) =>
    `${capitalize(pieceName(h.type))} ${w.on} ${squareToCity(h.square)}. ${w.attackers}${c} ${pieceList(chess, h.attackers)}. ${w.defenders}${c} ${pieceList(chess, h.defenders)}.`
  );
  return `${check}${w.hangingHead} ${parts.join(' ')}`;
}

// "un cavallo", "2 pedoni", "una torre" / "a knight", "2 pawns"...
function countedPiece(type, n) {
  const lang = getLanguage();
  if (lang === 'en') return n === 1 ? `a ${pieceName(type)}` : `${n} ${PIECE_PLURAL_EN[type]}`;
  const forms = { es: PIECE_FORMS_ES, fr: PIECE_FORMS_FR }[lang] || PIECE_FORMS_IT;
  const f = forms[type];
  if (n > 1) return `${n} ${f.many}`;
  const article = { es: f.fem ? 'una' : 'un', fr: f.fem ? 'une' : 'un' }[lang] || (f.fem ? 'una' : 'un');
  return `${article} ${f.one}`;
}

function joinWithAnd(items) {
  if (items.length <= 1) return items.join('');
  const and = IW().and;
  if (getLanguage() === 'en' && items.length > 2) return `${items.slice(0, -1).join(', ')}, ${and} ${items[items.length - 1]}`;
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

// Pezzi mancanti di un colore rispetto alla posizione iniziale. Un pezzo in
// più del normale (dama da promozione) viene da un pedone: quel pedone non
// è stato mangiato.
function missingPieces(chess, color) {
  const start = { q: 1, r: 2, b: 2, n: 2, p: 8 };
  const now = { q: 0, r: 0, b: 0, n: 0, p: 0 };
  chess.board().flat().forEach((cell) => {
    if (cell && cell.color === color && cell.type !== 'k') now[cell.type] += 1;
  });
  let promoted = 0;
  const missing = {};
  ['q', 'r', 'b', 'n'].forEach((type) => {
    promoted += Math.max(0, now[type] - start[type]);
    missing[type] = Math.max(0, start[type] - now[type]);
  });
  missing.p = Math.max(0, start.p - now.p - promoted);
  const material = Object.entries(now).reduce((sum, [type, n]) => sum + PIECE_VALUES[type] * n, 0);
  return { missing, material };
}

// Comando "x" (materiale): cosa ha mangiato ognuno e chi è in vantaggio,
// con i valori classici (pedone 1, cavallo e alfiere 3, torre 5, dama 9).
export function describeMaterial(fen, color) {
  const chess = new Chess(fen);
  const opp = color === 'w' ? 'b' : 'w';
  const mine = missingPieces(chess, color);
  const theirs = missingPieces(chess, opp);
  const w = IW();
  const c = colon();
  const list = (missing) => {
    const items = ['q', 'r', 'b', 'n', 'p'].filter((type) => missing[type] > 0).map((type) => countedPiece(type, missing[type]));
    return items.length ? joinWithAnd(items) : w.nothing;
  };
  const diff = mine.material - theirs.material;
  const balance = diff > 0 ? w.ahead(diff) : diff < 0 ? w.behind(-diff) : w.even;
  return `${w.youTook}${c} ${list(theirs.missing)}. ${w.oppTook}${c} ${list(mine.missing)}. ${balance}`;
}

// Testo naturale di una durata in millisecondi, per gli avvisi tempo.
export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (getLanguage() === 'en') {
    const mp = minutes > 0 ? `${minutes} minute${minutes === 1 ? '' : 's'}` : '';
    const sp = seconds > 0 ? `${seconds} second${seconds === 1 ? '' : 's'}` : '';
    if (mp && sp) return `${mp} and ${sp}`;
    return mp || sp || 'a few seconds';
  }
  if (getLanguage() === 'es') {
    const mp = minutes > 0 ? `${minutes} minuto${minutes === 1 ? '' : 's'}` : '';
    const sp = seconds > 0 ? `${seconds} segundo${seconds === 1 ? '' : 's'}` : '';
    if (mp && sp) return `${mp} y ${sp}`;
    return mp || sp || 'pocos segundos';
  }
  if (getLanguage() === 'fr') {
    const mp = minutes > 0 ? `${minutes} minute${minutes === 1 ? '' : 's'}` : '';
    const sp = seconds > 0 ? `${seconds} seconde${seconds === 1 ? '' : 's'}` : '';
    if (mp && sp) return `${mp} et ${sp}`;
    return mp || sp || 'quelques secondes';
  }
  const minutePart = minutes > 0 ? `${minutes} minut${minutes === 1 ? 'o' : 'i'}` : '';
  const secondPart = seconds > 0 ? `${seconds} second${seconds === 1 ? 'o' : 'i'}` : '';
  if (minutePart && secondPart) return `${minutePart} e ${secondPart}`;
  return minutePart || secondPart || 'pochi secondi';
}

export function promotionConfirmationText(promotionLetter) {
  const name = pieceName(promotionLetter);
  if (getLanguage() === 'en') return `Promoted to ${name}.`;
  if (getLanguage() === 'es') return `Coronado en ${name}.`;
  if (getLanguage() === 'fr') return `Promu en ${name}.`;
  const article = name === 'alfiere' ? 'ad' : 'a';
  return `Promosso ${article} ${name}.`;
}

// --- Comando "p" (posizione dei pezzi) ---

// Nomi italiani con plurale e genere per accordare il colore: "torri
// bianche", "re nero", "alfieri neri".
const PIECE_FORMS_IT = {
  k: { one: 're', many: 're', fem: false },
  q: { one: 'dama', many: 'dame', fem: true },
  r: { one: 'torre', many: 'torri', fem: true },
  b: { one: 'alfiere', many: 'alfieri', fem: false },
  n: { one: 'cavallo', many: 'cavalli', fem: false },
  p: { one: 'pedone', many: 'pedoni', fem: false },
};

const PIECE_PLURAL_EN = { k: 'kings', q: 'queens', r: 'rooks', b: 'bishops', n: 'knights', p: 'pawns' };

const PIECE_FORMS_ES = {
  k: { one: 'rey', many: 'reyes', fem: false },
  q: { one: 'dama', many: 'damas', fem: true },
  r: { one: 'torre', many: 'torres', fem: true },
  b: { one: 'alfil', many: 'alfiles', fem: false },
  n: { one: 'caballo', many: 'caballos', fem: false },
  p: { one: 'peón', many: 'peones', fem: false },
};

const PIECE_FORMS_FR = {
  k: { one: 'roi', many: 'rois', fem: false },
  q: { one: 'dame', many: 'dames', fem: true },
  r: { one: 'tour', many: 'tours', fem: true },
  b: { one: 'fou', many: 'fous', fem: false },
  n: { one: 'cavalier', many: 'cavaliers', fem: false },
  p: { one: 'pion', many: 'pions', fem: false },
};

function colorAdjectiveFr(color, fem, plural) {
  const base = color === 'w' ? (fem ? 'blanche' : 'blanc') : (fem ? 'noire' : 'noir');
  return `${base}${plural ? 's' : ''}`;
}

function colorAdjectiveEs(color, fem, plural) {
  const base = color === 'w' ? 'blanc' : 'negr';
  return `${base}${fem ? 'a' : 'o'}${plural ? 's' : ''}`;
}

function colorAdjectiveIt(color, fem, plural) {
  if (color === 'w') return plural ? (fem ? 'bianche' : 'bianchi') : (fem ? 'bianca' : 'bianco');
  return plural ? (fem ? 'nere' : 'neri') : (fem ? 'nera' : 'nero');
}

function capitalize(s) {
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}`;
}

// squares: caselle (es. ['c1','f1']) dove si trovano i pezzi di quel tipo e
// colore. Ritorna es. "Alfieri bianchi: Como 1, Firenze 1." /
// "White bishops: Charlie 1, Foxtrot 1." oppure "Nessun alfiere bianco." /
// "No white bishop."
export function describePieceLocations(pieceType, color, squares) {
  if (getLanguage() === 'en') {
    const colorWord = colorName(color);
    if (squares.length === 0) return `No ${colorWord} ${pieceName(pieceType)}.`;
    const name = squares.length > 1 ? PIECE_PLURAL_EN[pieceType] : pieceName(pieceType);
    return `${capitalize(colorWord)} ${name}: ${squares.map(squareToCity).join(', ')}.`;
  }
  if (getLanguage() === 'es') {
    const f = PIECE_FORMS_ES[pieceType];
    if (squares.length === 0) return `${f.fem ? 'Ninguna' : 'Ningún'} ${f.one} ${colorAdjectiveEs(color, f.fem, false)}.`;
    const pl = squares.length > 1;
    return `${capitalize(pl ? f.many : f.one)} ${colorAdjectiveEs(color, f.fem, pl)}: ${squares.map(squareToCity).join(', ')}.`;
  }
  if (getLanguage() === 'fr') {
    const f = PIECE_FORMS_FR[pieceType];
    if (squares.length === 0) return `${f.fem ? 'Aucune' : 'Aucun'} ${f.one} ${colorAdjectiveFr(color, f.fem, false)}.`;
    const pl = squares.length > 1;
    return `${capitalize(pl ? f.many : f.one)} ${colorAdjectiveFr(color, f.fem, pl)} : ${squares.map(squareToCity).join(', ')}.`;
  }
  const forms = PIECE_FORMS_IT[pieceType];
  if (squares.length === 0) {
    const nessun = forms.fem ? 'Nessuna' : 'Nessun';
    return `${nessun} ${forms.one} ${colorAdjectiveIt(color, forms.fem, false)}.`;
  }
  const plural = squares.length > 1;
  const name = plural ? forms.many : forms.one;
  return `${capitalize(name)} ${colorAdjectiveIt(color, forms.fem, plural)}: ${squares.map(squareToCity).join(', ')}.`;
}
