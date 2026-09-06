// Orologio partita a doppio tempo (bianco/nero), con incremento e le 3
// notifiche vocali opzionali (10% residuo, 5% residuo, ogni 10 minuti
// trascorsi per partite oltre 20 minuti).
export class ChessClock {
  constructor({ minutes, incrementSec, callbacks = {} }) {
    this.totalMs = minutes * 60000;
    this.incrementMs = incrementSec * 1000;
    this.remaining = { w: this.totalMs, b: this.totalMs };
    this.warned10 = { w: false, b: false };
    this.warned5 = { w: false, b: false };
    this.elapsedMs = 0;
    this.nextElapsedMarkMs = 10 * 60000;
    this.trackElapsed = minutes > 20;
    this.running = null;
    this.intervalId = null;
    this.callbacks = callbacks;
  }

  start(side) {
    this.running = side;
    this._lastTs = performance.now();
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this._tick(), 250);
    }
  }

  pause() {
    this.running = null;
  }

  stop() {
    this.running = null;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  addIncrement(side) {
    this.remaining[side] += this.incrementMs;
  }

  _tick() {
    const now = performance.now();
    const dt = now - this._lastTs;
    this._lastTs = now;
    if (this.running) {
      const side = this.running;
      this.remaining[side] = Math.max(0, this.remaining[side] - dt);

      if (this.remaining[side] === 0) {
        this.stop();
        this.callbacks.onFlag?.(side);
        this.callbacks.onTick?.(this.remaining);
        return;
      }

      const pct = this.remaining[side] / this.totalMs;
      if (pct <= 0.1 && !this.warned10[side]) {
        this.warned10[side] = true;
        this.callbacks.onWarning10?.(side, this.remaining[side]);
      }
      if (pct <= 0.05 && !this.warned5[side]) {
        this.warned5[side] = true;
        this.callbacks.onWarning5?.(side, this.remaining[side]);
      }

      if (this.trackElapsed) {
        this.elapsedMs += dt;
        if (this.elapsedMs >= this.nextElapsedMarkMs) {
          this.callbacks.onElapsed10Min?.(this.nextElapsedMarkMs);
          this.nextElapsedMarkMs += 10 * 60000;
        }
      }
    }
    this.callbacks.onTick?.(this.remaining);
  }
}
