// themes/i18n-voice: mapping nomi pezzi/città per vocalizzazione, traduzione
// bidirezionale da/verso notazione standard. Separato da game-core.

export const CITY_BY_FILE = {
  a: 'Ancona',
  b: 'Bologna',
  c: 'Como',
  d: 'Domodossola',
  e: 'Empoli',
  f: 'Firenze',
  g: 'Genova',
  h: 'Hotel',
};

export const FILE_BY_CITY_LOWER = Object.fromEntries(
  Object.entries(CITY_BY_FILE).map(([file, city]) => [city.toLowerCase(), file])
);

export const PIECE_NAME_IT = {
  p: 'pedone',
  n: 'cavallo',
  b: 'alfiere',
  r: 'torre',
  q: 'dama',
  k: 're',
};

export const PIECE_LETTER_BY_NAME_IT = {
  pedone: 'p',
  cavallo: 'n',
  alfiere: 'b',
  torre: 'r',
  dama: 'q',
  re: 'k',
};

export const PROMO_NAME_IT = {
  q: 'dama',
  r: 'torre',
  b: 'alfiere',
  n: 'cavallo',
};

export const PROMO_LETTER_BY_NAME_IT = {
  dama: 'q',
  torre: 'r',
  alfiere: 'b',
  cavallo: 'n',
};

export const COLOR_NAME_IT = { w: 'bianco', b: 'nero' };

export function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function squareToCity(square) {
  const file = square[0];
  const rank = square[1];
  return `${CITY_BY_FILE[file]} ${rank}`;
}

// Etichetta per una casella della scacchiera, usata come aria-label.
// piece: { type, color } | null
export function describeSquare(square, piece, { selected = false } = {}) {
  let label = squareToCity(square);
  if (piece) {
    label += `, ${PIECE_NAME_IT[piece.type]} ${COLOR_NAME_IT[piece.color]}`;
  }
  if (selected) {
    label += ', selezionata';
  }
  return label;
}

// Costruisce il testo "compatto" (notazione standard) per una mossa.
export function moveToCompactText(move) {
  return move.san;
}

// Costruisce il testo "espanso" in italiano per una mossa già eseguita.
// move: oggetto Move di chess.js (con isCapture/isEnPassant/isCastle ecc.)
// opts.isCheck / opts.isCheckmate: stato della partita DOPO la mossa.
export function moveToExpandedText(move, { isCheck = false, isCheckmate = false } = {}) {
  let phrase;

  if (move.isKingsideCastle()) {
    phrase = 'arrocco corto';
  } else if (move.isQueensideCastle()) {
    phrase = 'arrocco lungo';
  } else {
    const destCity = squareToCity(move.to);
    const moverName = PIECE_NAME_IT[move.piece];

    if (move.isEnPassant()) {
      phrase = `en passant, pedone mangia pedone in ${destCity}`;
    } else if (move.captured) {
      const capturedName = PIECE_NAME_IT[move.captured];
      phrase = `${moverName} mangia ${capturedName} in ${destCity}`;
    } else if (move.piece !== 'p') {
      phrase = `${moverName} in ${destCity}`;
    } else {
      phrase = destCity;
    }
  }

  if (isCheck && !isCheckmate) {
    phrase += ', scacco';
  }

  return phrase;
}

// Testo naturale di una durata in millisecondi, per gli avvisi tempo.
export function formatDurationItalian(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const minutePart = minutes > 0 ? `${minutes} minut${minutes === 1 ? 'o' : 'i'}` : '';
  const secondPart = seconds > 0 ? `${seconds} second${seconds === 1 ? 'o' : 'i'}` : '';
  if (minutePart && secondPart) return `${minutePart} e ${secondPart}`;
  return minutePart || secondPart || 'pochi secondi';
}

export function promotionConfirmationText(promotionLetter) {
  const name = PROMO_NAME_IT[promotionLetter];
  const article = name === 'alfiere' ? 'ad' : 'a';
  return `Promosso ${article} ${name}.`;
}
