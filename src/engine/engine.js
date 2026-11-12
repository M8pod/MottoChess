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
//
// LIVELLI 1-10, "modo debole" (12/11/2026). I tester non riuscivano a vincere
// nemmeno al livello 1: Stockfish con Skill Level 0 e profondità 1 vede
// comunque tutte le catture e le minacce immediate (ricerca di quiete) e gioca
// come un buon dilettante. Ora, nei livelli bassi, chiediamo a Stockfish di
// valutare TUTTE le mosse legali (MultiPV) e la scelta la facciamo noi:
//   - blunder: probabilità di giocare una mossa legale qualsiasi, a caso;
//   - temp: "temperatura" in centipedoni. Più è alta, più spesso sceglie una
//     mossa peggiore della migliore (scelta pesata, non sempre la prima).
// Così il computer lascia pezzi in presa e manca matti, come un principiante
// vero, ma non fa solo mosse assurde.
const LEVELS = {
  1: { weak: true, depth: 1, multipv: 500, blunder: 0.5, temp: 450, elo: 400 },
  2: { weak: true, depth: 1, multipv: 500, blunder: 0.38, temp: 350, elo: 500 },
  3: { weak: true, depth: 2, multipv: 500, blunder: 0.28, temp: 260, elo: 600 },
  4: { weak: true, depth: 2, multipv: 500, blunder: 0.2, temp: 190, elo: 700 },
  5: { weak: true, depth: 3, multipv: 500, blunder: 0.14, temp: 140, elo: 800 },
  6: { weak: true, depth: 4, multipv: 40, blunder: 0.09, temp: 100, elo: 950 },
  7: { weak: true, depth: 5, multipv: 25, blunder: 0.06, temp: 75, elo: 1100 },
  8: { weak: true, depth: 6, multipv: 15, blunder: 0.04, temp: 55, elo: 1250 },
  9: { weak: true, depth: 7, multipv: 10, blunder: 0.025, temp: 40, elo: 1400 },
  10: { weak: true, depth: 8, multipv: 6, blunder: 0.015, temp: 28, elo: 1500 },
  11: { skill: 3, depth: 6, ms: 400, elo: 1600 },
  12: { skill: 5, depth: 8, ms: 600, elo: 1750 },
  13: { skill: 7, depth: 10, ms: 1000, elo: 1900 },
  14: { skill: 9, depth: 12, ms: 1500, elo: 2000 },
  15: { skill: 11, depth: 14, ms: 2500, elo: 2150 },
  16: { skill: 13, depth: 16, ms: 4000, elo: 2300 },
  17: { skill: 16, depth: 18, ms: 5000, elo: 2450 },
  18: { skill: 18, depth: 20, ms: 7000, elo: 2600 },
  19: { skill: 20, depth: null, ms: 10000, elo: 2750 },
  20: { skill: 20, depth: null, ms: 15000, elo: 2900 },
};
// Tempo massimo per i livelli deboli: la profondità bassa li fa finire quasi
// sempre molto prima.
const WEAK_MAX_MS = 3000;
// Valore in centipedoni dato a "matto in N" per poterlo confrontare.
const MATE_CP = 100000;

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
    this._applyLevelOptions();
  }

  _applyLevelOptions() {
    // Nel modo debole la "sbadataggine" la mettiamo noi: Stockfish deve dare
    // valutazioni oneste di tutte le mosse.
    const skill = this.level.weak ? 20 : this.level.skill;
    const multipv = this.level.weak ? this.level.multipv : 1;
    this._command(`setoption name Skill Level value ${skill}`);
    this._command(`setoption name MultiPV value ${multipv}`);
  }

  setPositionFen(fen) {
    this.positionCmd = `position fen ${fen}`;
    this._command(this.positionCmd);
  }

  // Chiede la mossa. Il tempo di riflessione è quello del livello, ridotto se
  // l'orologio del motore è basso (mai più di 1/20 del tempo che gli resta più
  // l'incremento), così il computer non perde per tempo.
  async bestMove({ wtimeMs, btimeMs, wincMs = 0, bincMs = 0, color } = {}) {
    let ms = this.level.weak ? WEAK_MAX_MS : this.level.ms;
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
    const candidates = new Map(); // indice multipv -> { move, cp }
    const line = await this._goWithLimits(goCmd, ms, candidates);
    // Ai livelli bassi la risposta arriva in pochi millisecondi: una mossa
    // istantanea si accavallerebbe all'annuncio VoiceOver della mossa del
    // giocatore. Una piccola pausa minima tiene il ritmo di prima.
    const wait = MIN_REPLY_MS - (Date.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const uci = line ? line.split(' ')[1] : null; // es. 'e2e4' oppure '(none)'
    if (!uci || uci === '(none)') return null;
    if (this.level.weak && candidates.size > 0) return pickWeakMove(candidates, this.level) || uci;
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
  async _goWithLimits(goCmd, ms, candidates) {
    const isBest = (l) => {
      if (candidates && l.startsWith('info ')) collectCandidate(l, candidates);
      return l.startsWith('bestmove');
    };
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
    this._applyLevelOptions();
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

// Legge una riga "info ... multipv K score cp X ... pv e2e4 ..." e tiene,
// per ogni K, l'ultima valutazione (quella della profondità più alta).
// Il punteggio è dal punto di vista di chi muove, cioè del computer.
export function collectCandidate(line, candidates) {
  const parts = line.split(' ');
  const pvAt = parts.indexOf('pv');
  const scoreAt = parts.indexOf('score');
  if (pvAt < 0 || scoreAt < 0 || !parts[pvAt + 1]) return;
  const mpvAt = parts.indexOf('multipv');
  const k = mpvAt >= 0 ? Number(parts[mpvAt + 1]) : 1;
  const kind = parts[scoreAt + 1];
  const value = Number(parts[scoreAt + 2]);
  if (!Number.isFinite(value)) return;
  let cp;
  if (kind === 'mate') cp = value > 0 ? MATE_CP - value : -MATE_CP - value;
  else cp = value;
  candidates.set(k, { move: parts[pvAt + 1], cp });
}

// Scelta "umana" fra le mosse valutate (vedi commento sui livelli 1-10).
export function pickWeakMove(candidates, level, rand = Math.random) {
  const list = [...candidates.values()];
  if (list.length === 0) return null;
  if (rand() < level.blunder) return list[Math.floor(rand() * list.length)].move;
  const best = Math.max(...list.map((c) => c.cp));
  // Le differenze enormi (matti) vengono limitate, altrimenti un matto
  // disponibile verrebbe scelto sempre: un principiante a volte non lo vede.
  const weights = list.map((c) => Math.exp(-Math.min(best - c.cp, 2000) / level.temp));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r <= 0) return list[i].move;
  }
  return list[list.length - 1].move;
}

export function eloForLevel(level) {
  return (LEVELS[level] || LEVELS[20]).elo;
}
