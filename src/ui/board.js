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
    this.buttons = new Map(); // square -> <button>
    this.pieceSignatures = new Map(); // square -> descrizione del pezzo disegnato
    this.ariaLabels = new Map(); // square -> ultimo aria-label scritto
    this.squareColors = new Map(); // square -> ultimo colore di sfondo scritto
    this.orientation = null;
  }

  // Le 64 caselle vengono create una volta sola (e ricreate solo se cambia
  // l'orientamento, cioè mai durante una partita). Aggiornare i pulsanti
  // esistenti invece di ricostruire la scacchiera a ogni mossa è ciò che
  // permette a VoiceOver di non perdere il punto in cui si trova il cursore.
  _buildGrid(orientation) {
    this.container.innerHTML = '';
    this.buttons.clear();
    this.pieceSignatures.clear();
    this.ariaLabels.clear();
    this.squareColors.clear();
    this.container.setAttribute('role', 'grid');
    this.container.setAttribute('aria-label', 'Scacchiera');

    const ranks = orientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
    const files = orientation === 'w' ? FILES : [...FILES].reverse();

    for (const rank of ranks) {
      const rowEl = document.createElement('div');
      rowEl.className = 'board-row';
      rowEl.setAttribute('role', 'row');

      for (const file of files) {
        const square = `${file}${rank}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `square ${isDarkSquare(square) ? 'dark' : 'light'}`;
        btn.setAttribute('role', 'gridcell');
        btn.dataset.square = square;
        btn.addEventListener('click', () => this.onSquareClick(square));
        rowEl.appendChild(btn);
        this.buttons.set(square, btn);
      }
      this.container.appendChild(rowEl);
    }
    this.orientation = orientation;
  }

  // state:
  //  boardMatrix: risultato di chess.board() (8x8, righe rank8..rank1)
  //  orientation: 'w' | 'b'
  //  lightHex/darkHex: colori caselle
  //  pieceColors: { w: '#hex', b: '#hex' }
  //  selectedSquare: string|null
  //  legalTargets: Set<string>
  //  factions: { w, b } | null — quale fazione occupa ciascun colore, nei set
  //    a fazioni (vedi themes/factions.js)
  async render(state) {
    const {
      boardMatrix,
      orientation,
      lightHex,
      darkHex,
      pieceColors,
      selectedSquare,
      legalTargets,
      pieceSet = 'classico',
      factions = null,
    } = state;

    if (this.orientation !== orientation) this._buildGrid(orientation);

    const pieceBySquare = new Map();
    for (const row of boardMatrix) {
      for (const cell of row) {
        if (cell) pieceBySquare.set(cell.square, cell);
      }
    }

    for (const [square, btn] of this.buttons) {
      const piece = pieceBySquare.get(square) || null;
      const selected = selectedSquare === square;

      // Anche riscrivere lo stile inline con lo stesso valore è una mutazione
      // dell'attributo: come per l'aria-label qui sotto, si scrive solo se il
      // colore è davvero cambiato (cioè quasi mai durante una partita).
      const bgHex = isDarkSquare(square) ? darkHex : lightHex;
      if (this.squareColors.get(square) !== bgHex) {
        btn.style.backgroundColor = bgHex;
        this.squareColors.set(square, bgHex);
      }
      // Riscrivere l'aria-label anche quando non cambia genera comunque una
      // mutazione dell'accessibility tree per tutte le 64 caselle a ogni
      // mossa: con VoiceOver e tastiera Bluetooth esterna, dopo l'attesa del
      // motore questo può far perdere il cursore (torna sull'interfaccia di
      // sistema, es. la barra di stato). Si scrive quindi solo se il testo è
      // davvero cambiato.
      const ariaLabel = describeSquare(square, piece, { selected });
      if (this.ariaLabels.get(square) !== ariaLabel) {
        btn.setAttribute('aria-label', ariaLabel);
        this.ariaLabels.set(square, ariaLabel);
      }
      btn.classList.toggle('selected', selected);
      btn.classList.toggle('legal-target', Boolean(legalTargets && legalTargets.has(square)));

      // L'SVG viene rigenerato solo se il pezzo sulla casella (o il suo
      // colore) è effettivamente cambiato.
      const fillHex = piece ? pieceColors[piece.color] : '';
      const faction = piece && factions ? factions[piece.color] : null;
      const signature = piece ? `${pieceSet}${faction || ''}${piece.color}${piece.type}${fillHex}` : '';
      if (this.pieceSignatures.get(square) !== signature) {
        btn.replaceChildren();
        if (piece) {
          // eslint-disable-next-line no-await-in-loop
          btn.appendChild(await createPieceElement(piece.color, piece.type, fillHex, pieceSet, faction));
        }
        this.pieceSignatures.set(square, signature);
      }
    }
  }
}
