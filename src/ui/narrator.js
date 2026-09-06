// Narratore: annuncia testo tramite una regione aria-live, letta
// automaticamente da VoiceOver (e altri screen reader) senza sintesi vocale
// propria, per non interferire con la voce dello screen reader dell'utente.
export class Narrator {
  constructor(liveRegionEl) {
    this.el = liveRegionEl;
    this._queue = [];
    this._busy = false;
  }

  // Annuncia un testo. Le chiamate ravvicinate vengono accodate ed emesse in
  // sequenza (svuotando e riscrivendo il nodo) per essere lette tutte.
  announce(text) {
    if (!text) return;
    this._queue.push(text);
    this._drain();
  }

  _drain() {
    if (this._busy || this._queue.length === 0) return;
    this._busy = true;
    const text = this._queue.shift();
    this.el.textContent = '';
    // Un reflow forza lo screen reader a considerare il testo come "nuovo"
    // anche se identico all'annuncio precedente.
    requestAnimationFrame(() => {
      this.el.textContent = text;
      setTimeout(() => {
        this._busy = false;
        this._drain();
      }, 400);
    });
  }
}
