// engine: wrapper Stockfish (UCI), livelli 1-20 mappati su UCI_Elo +
// UCI_LimitStrength.

// Elo assegnato a ciascun livello (estremi delle fasce della tabella in spec).
const ELO_BY_LEVEL = {
  1: 1320, 2: 1420,
  3: 1420, 4: 1520,
  5: 1520, 6: 1650,
  7: 1650, 8: 1800,
  9: 1800, 10: 1950,
  11: 1950, 12: 2150,
  13: 2150, 14: 2350,
  15: 2350, 16: 2600,
  17: 2600, 18: 2900,
  19: 2900, 20: 3190,
};

const STOCKFISH_WORKER_URL = new URL('../vendor/stockfish/stockfish.js', import.meta.url);

export class Engine {
  constructor() {
    this.worker = null;
    this.ready = false;
    this._pendingBestMove = null;
  }

  async init() {
    this.worker = new Worker(STOCKFISH_WORKER_URL);
    await this._send('uci', (line) => line === 'uciok');
    await this._send('isready', (line) => line === 'readyok');
    this.ready = true;
  }

  setLevel(level) {
    const elo = ELO_BY_LEVEL[level] || ELO_BY_LEVEL[20];
    this._command('setoption name UCI_LimitStrength value true');
    this._command(`setoption name UCI_Elo value ${elo}`);
  }

  setPositionFen(fen) {
    this._command(`position fen ${fen}`);
  }

  // Chiede la mossa migliore. Se sono forniti i tempi residui (ms), lascia che
  // sia Stockfish a gestire la propria allocazione del tempo (go wtime/btime);
  // altrimenti usa un tempo di riflessione fisso (partita senza orologio).
  async bestMove({ wtimeMs, btimeMs, wincMs = 0, bincMs = 0 } = {}) {
    let goCmd;
    if (typeof wtimeMs === 'number' && typeof btimeMs === 'number') {
      goCmd = `go wtime ${Math.max(1, Math.round(wtimeMs))} btime ${Math.max(
        1,
        Math.round(btimeMs)
      )} winc ${Math.round(wincMs)} binc ${Math.round(bincMs)}`;
    } else {
      goCmd = 'go movetime 1000';
    }

    const line = await this._send(goCmd, (l) => l.startsWith('bestmove'));
    const parts = line.split(' ');
    const uci = parts[1]; // es. 'e2e4' oppure '(none)' a fine partita
    if (!uci || uci === '(none)') return null;
    return uci;
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  _command(cmd) {
    this.worker.postMessage(cmd);
  }

  // Invia un comando e attende la prima riga di risposta che soddisfa `matchFn`.
  _send(cmd, matchFn) {
    return new Promise((resolve) => {
      const onMessage = (e) => {
        const line = typeof e.data === 'string' ? e.data : '';
        if (matchFn(line)) {
          this.worker.removeEventListener('message', onMessage);
          resolve(line);
        }
      };
      this.worker.addEventListener('message', onMessage);
      this._command(cmd);
    });
  }
}

export function eloForLevel(level) {
  return ELO_BY_LEVEL[level] || ELO_BY_LEVEL[20];
}
