// game-core: motore regole/stato partita. Opera SEMPRE in notazione algebrica
// standard (chess.js). Nessuna dipendenza da temi o lingua.
import { Chess } from '../vendor/chess.js';

export class GameCore {
  constructor() {
    this.chess = new Chess();
  }

  get turn() {
    return this.chess.turn(); // 'w' | 'b'
  }

  get fen() {
    return this.chess.fen();
  }

  board() {
    return this.chess.board();
  }

  legalMovesFrom(square) {
    return this.chess.moves({ square, verbose: true });
  }

  // { type, color } | undefined
  pieceAt(square) {
    return this.chess.get(square);
  }

  allLegalMoves() {
    return this.chess.moves({ verbose: true });
  }

  // moveInput: { from, to, promotion? } -> Move | throws
  applyMove(moveInput) {
    return this.chess.move(moveInput);
  }

  // uci like 'e2e4' or 'e7e8q'
  applyUci(uci) {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    return this.applyMove({ from, to, promotion });
  }

  history({ verbose = true } = {}) {
    return this.chess.history({ verbose });
  }

  status() {
    return {
      turn: this.chess.turn(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isStalemate: this.chess.isStalemate(),
      isThreefoldRepetition: this.chess.isThreefoldRepetition(),
      isInsufficientMaterial: this.chess.isInsufficientMaterial(),
      isDrawByFiftyMoves: this.chess.isDrawByFiftyMoves(),
      isDraw: this.chess.isDraw(),
      isGameOver: this.chess.isGameOver(),
    };
  }

  pgn(options) {
    return this.chess.pgn(options);
  }

  loadPgn(pgn) {
    return this.chess.loadPgn(pgn);
  }

  setHeaders(headersObj) {
    const pairs = Object.entries(headersObj).flat();
    this.chess.header(...pairs);
  }

  reset() {
    this.chess.reset();
  }
}
