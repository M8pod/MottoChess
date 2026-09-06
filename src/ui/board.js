// ui/board: rendering della scacchiera grafica (dual-mode: tocco + VoiceOver).
import { describeSquare } from '../themes/i18n-voice.js';
import { createPieceElement } from '../themes/pieces.js';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// Convenzione fissa (non configurabile): a1 è sempre casella scura.
export function isDarkSquare(square) {
  const fileIdx = square.charCodeAt(0) - 97; // 'a' -> 0
  const rank = Number(square[1]);
  return (fileIdx + rank) % 2 === 1;
}

export class BoardView {
  constructor(container, { onSquareClick }) {
    this.container = container;
    this.onSquareClick = onSquareClick;
  }

  // state:
  //  boardMatrix: risultato di chess.board() (8x8, righe rank8..rank1)
  //  orientation: 'w' | 'b'
  //  lightHex/darkHex: colori caselle
  //  pieceColors: { w: '#hex', b: '#hex' }
  //  selectedSquare: string|null
  //  legalTargets: Set<string>
  async render(state) {
    const {
      boardMatrix,
      orientation,
      lightHex,
      darkHex,
      pieceColors,
      selectedSquare,
      legalTargets,
    } = state;

    const pieceBySquare = new Map();
    for (const row of boardMatrix) {
      for (const cell of row) {
        if (cell) pieceBySquare.set(cell.square, cell);
      }
    }

    const ranks = orientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
    const files = orientation === 'w' ? FILES : [...FILES].reverse();

    this.container.innerHTML = '';
    this.container.setAttribute('role', 'grid');
    this.container.setAttribute('aria-label', 'Scacchiera');

    for (const rank of ranks) {
      const rowEl = document.createElement('div');
      rowEl.className = 'board-row';
      rowEl.setAttribute('role', 'row');

      for (const file of files) {
        const square = `${file}${rank}`;
        const piece = pieceBySquare.get(square) || null;
        const dark = isDarkSquare(square);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `square ${dark ? 'dark' : 'light'}`;
        btn.style.backgroundColor = dark ? darkHex : lightHex;
        btn.setAttribute('role', 'gridcell');
        btn.dataset.square = square;

        const selected = selectedSquare === square;
        btn.setAttribute('aria-label', describeSquare(square, piece, { selected }));
        if (selected) btn.classList.add('selected');
        if (legalTargets && legalTargets.has(square)) btn.classList.add('legal-target');

        if (piece) {
          const fillHex = pieceColors[piece.color];
          // eslint-disable-next-line no-await-in-loop
          const svg = await createPieceElement(piece.color, piece.type, fillHex);
          btn.appendChild(svg);
        }

        btn.addEventListener('click', () => this.onSquareClick(square));
        rowEl.appendChild(btn);
      }
      this.container.appendChild(rowEl);
    }
  }
}
