// Narratore: annuncia testo tramite una regione aria-live, letta
// automaticamente da VoiceOver (e altri screen reader) senza sintesi vocale
// propria, per non interferire con la voce dello screen reader dell'utente.
export class Narrator {
  constructor(liveRegionEl) {
    this.el = liveRegionEl;
    this._queue = [];
    this._busy = false;
    // Stima di quando lo screen reader avrà finito di leggere: VoiceOver non
    // lo dice a nessuno, quindi la si calcola dalla lunghezza del testo
    // (msPerChar dipende dal "Ritmo di suoni e voce" scelto in Impostazioni).
    // Serve a far partire il suono della mossa dell'avversario solo dopo che
    // la voce ha letto la mossa precedente.
    this.msPerChar = 65;
    this.speakingUntil = 0;
  }

  // Millisecondi che mancano, secondo la stima, alla fine della lettura.
  remainingSpeechMs() {
    return Math.max(0, this.speakingUntil - Date.now());
  }

  // Annuncia un testo. Le chiamate ravvicinate vengono accodate ed emesse in
  // sequenza (svuotando e riscrivendo il nodo) per essere lette tutte.
  announce(text) {
    if (!text) return;
    const start = Math.max(Date.now() + 150, this.speakingUntil);
    this.speakingUntil = start + 250 + text.length * this.msPerChar;
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
