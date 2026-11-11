// engine: wrapper Stockfish (UCI), livelli 1-20.
//
// ATTENZIONE: la build inclusa (Stockfish 11 WASM, nmrugg/stockfish.js) NON
// ha le opzioni UCI_Elo / UCI_LimitStrength. Fino all'11/11/2026 il codice le
// impostava lo stesso, Stockfish le ignorava e tutti i venti livelli giocavano
// alla forza piena. La forza si regola quindi con le tre leve che questa build
// offre davvero:
//   - "Skill Level" 0-20: sotto 20 Stockfish sceglie di proposito, con una
//     certa probabilità, mosse peggiori della migliore;
//   - profondità massima di ricerca (go depth N);
//   - tempo di riflessione (go movetime).
// Gli Elo della tabella sono STIME indicative (ordine di grandezza, ricavato
// da come motori e siti tarano livelli simili), non misure: servono a dare al
// giocatore un'idea della progressione.
const LEVELS = {
  1: { skill: 0, depth: 1, ms: 100, elo: 800 },
  2: { skill: 0, depth: 2, ms: 150, elo: 900 },
  3: { skill: 1, depth: 3, ms: 200, elo: 1000 },
  4: { skill: 2, depth: 4, ms: 250, elo: 1100 },
  5: { skill: 3, depth: 5, ms: 300, elo: 1200 },
  6: { skill: 4, depth: 6, ms: 400, elo: 1300 },
  7: { skill: 5, depth: 7, ms: 500, elo: 1400 },
  8: { skill: 6, depth: 8, ms: 600, elo: 1500 },
  9: { skill: 7, depth: 9, ms: 800, elo: 1600 },
  10: { skill: 8, depth: 10, ms: 1000, elo: 1700 },
  11: { skill: 9, depth: 11, ms: 1200, elo: 1800 },
  12: { skill: 10, depth: 12, ms: 1500, elo: 1900 },
  13: { skill: 11, depth: 13, ms: 2000, elo: 2000 },
  14: { skill: 12, depth: 14, ms: 2500, elo: 2100 },
  15: { skill: 13, depth: 15, ms: 3000, elo: 2200 },
  16: { skill: 14, depth: 16, ms: 4000, elo: 2300 },
  17: { skill: 16, depth: 18, ms: 5000, elo: 2450 },
  18: { skill: 18, depth: 20, ms: 7000, elo: 2600 },
  19: { skill: 20, depth: null, ms: 10000, elo: 2750 },
  20: { skill: 20, depth: null, ms: 15000, elo: 2900 },
};

const STOCKFISH_WORKER_URL = new URL('../vendor/stockfish/stockfish.js', import.meta.url);

// Garanzia richiesta da Roberto (11/11/2026): l'avversario muove SEMPRE entro
// un minuto. I tempi della tabella stanno già molto sotto; questa è la rete di
// sicurezza per un dispositivo lento o un motore che non risponde al 'stop'.
// Allo scadere il worker viene buttato e ricreato, e si chiede una mossa
// rapidissima: meglio una mossa debole che una partita bloccata.
const HARD_LIMIT_MS = 55000;
// Dopo il 'stop' Stockfish deve ancora chiudere l'iterazione in corso: su un
// telefono può volerci qualche secondo.
const STOP_GRACE_MS = 3000;
// Pausa minima fra la richiesta e la mossa del computer (vedi bestMove).
const MIN_REPLY_MS = 800;

export class Engine {
  constructor() {
    this.worker = null;
    this.ready = false;
    this.level = LEVELS[5];
    this.levelNumber = 5;
    this.positionCmd = null;
  }

  async init() {
    this._spawn();
    await this._send('uci', (line) => line === 'uciok');
    await this._send('isready', (line) => line === 'readyok');
    this.ready = true;
  }

  setLevel(level) {
    this.levelNumber = LEVELS[level] ? level : 20;
    this.level = LEVELS[this.levelNumber];
    this._command(`setoption name Skill Level value ${this.level.skill}`);
  }

  setPositionFen(fen) {
    this.positionCmd = `position fen ${fen}`;
    this._command(this.positionCmd);
  }

  // Chiede la mossa. Il tempo di riflessione è quello del livello, ridotto se
  // l'orologio del motore è basso (mai più di 1/20 del tempo che gli resta più
  // l'incremento), così il computer non perde per tempo.
  async bestMove({ wtimeMs, btimeMs, wincMs = 0, bincMs = 0, color } = {}) {
    let ms = this.level.ms;
    const hasClock = typeof wtimeMs === 'number' && typeof btimeMs === 'number';
    if (hasClock) {
      const turnFromFen = this.positionCmd ? this.positionCmd.split(' ')[3] : null;
      const side = color || turnFromFen || 'w';
      const left = side === 'w' ? wtimeMs : btimeMs;
      const inc = side === 'w' ? wincMs : bincMs;
      ms = Math.min(ms, Math.max(50, left / 20 + inc * 0.8));
    }
    ms = Math.max(50, Math.round(ms));
    const goCmd = this.level.depth ? `go depth ${this.level.depth} movetime ${ms}` : `go movetime ${ms}`;

    const started = Date.now();
    const line = await this._goWithLimits(goCmd, ms);
    // Ai livelli bassi la risposta arriva in pochi millisecondi: una mossa
    // istantanea si accavallerebbe all'annuncio VoiceOver della mossa del
    // giocatore. Una piccola pausa minima tiene il ritmo di prima.
    const wait = MIN_REPLY_MS - (Date.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const uci = line ? line.split(' ')[1] : null; // es. 'e2e4' oppure '(none)'
    if (!uci || uci === '(none)') return null;
    return uci;
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  // Lancia la ricerca con tre paracadute: 'stop' poco dopo il tempo previsto,
  // e oltre HARD_LIMIT_MS motore ricreato e mossa d'emergenza.
  async _goWithLimits(goCmd, ms) {
    const isBest = (l) => l.startsWith('bestmove');
    const search = this._send(goCmd, isBest);
    const stopTimer = setTimeout(() => this._command('stop'), ms + STOP_GRACE_MS);
    let hardTimer;
    const hard = new Promise((resolve) => {
      hardTimer = setTimeout(() => resolve(null), HARD_LIMIT_MS);
    });
    let line;
    try {
      line = await Promise.race([search, hard]);
    } finally {
      clearTimeout(stopTimer);
      clearTimeout(hardTimer);
    }
    if (line || !this.worker) return line;
    return this._emergencyMove();
  }

  async _emergencyMove() {
    this.destroy();
    this._spawn();
    await this._send('uci', (l) => l === 'uciok');
    this._command(`setoption name Skill Level value ${this.level.skill}`);
    if (this.positionCmd) this._command(this.positionCmd);
    return this._send('go depth 1', (l) => l.startsWith('bestmove'));
  }

  _spawn() {
    this.worker = new Worker(STOCKFISH_WORKER_URL);
  }

  _command(cmd) {
    // Il motore può essere già stato distrutto (uscita dalla partita mentre
    // stava ancora pensando): in quel caso il comando non ha più destinatario.
    if (!this.worker) return;
    this.worker.postMessage(cmd);
  }

  // Invia un comando e attende la prima riga di risposta che soddisfa `matchFn`.
  _send(cmd, matchFn) {
    const worker = this.worker;
    return new Promise((resolve) => {
      if (!worker) {
        resolve(null);
        return;
      }
      const onMessage = (e) => {
        const line = typeof e.data === 'string' ? e.data : '';
        if (matchFn(line)) {
          worker.removeEventListener('message', onMessage);
          resolve(line);
        }
      };
      worker.addEventListener('message', onMessage);
      this._command(cmd);
    });
  }
}

export function eloForLevel(level) {
  return (LEVELS[level] || LEVELS[20]).elo;
}
