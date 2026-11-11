// Riproduzione musica ambientale in loop continuo durante la partita: canale
// volume indipendente dai suoni di gioco/UI (SoundManager), pensato per una
// singola traccia alla volta che parte con l'inizio partita e si ferma a
// fine partita/uscita dalla schermata.
//
// La traccia resta un elemento <audio> in streaming (decodificarla tutta in
// memoria costerebbe decine di MB), ma il suo segnale passa da un GainNode
// della Web Audio API: su iOS è l'unico modo perché il volume impostato
// venga rispettato (Safari ignora <audio>.volume). Senza Web Audio si
// ripiega su <audio>.volume, che funziona su tutti gli altri sistemi.
import { AMBIENT_TRACKS } from '../session/settings.js';
import { getAudioContext, resumeAudioContext, perceptualGain } from './audio-context.js';

const AMBIENT_BASE = 'assets/sounds/ambient/';

export class AmbientPlayer {
  constructor() {
    this.audio = null;
    this.source = null;
    this.gain = null;
    this.trackKey = null;
    this._retry = null;
  }

  get isPlaying() {
    return Boolean(this.audio);
  }

  // trackKey: chiave in AMBIENT_TRACKS (es. 'nessuna', 'newage')
  play(trackKey, volume) {
    this.stop();
    const track = AMBIENT_TRACKS[trackKey];
    if (!track || !track.file) return;
    try {
      this.audio = new Audio(AMBIENT_BASE + track.file);
      this.audio.loop = true;
      const ctx = getAudioContext();
      if (ctx && typeof ctx.createMediaElementSource === 'function') {
        resumeAudioContext();
        this.source = ctx.createMediaElementSource(this.audio);
        this.gain = ctx.createGain();
        this.source.connect(this.gain).connect(ctx.destination);
      }
      this.trackKey = trackKey;
      this.setVolume(volume);
      const audio = this.audio;
      audio.play().catch(() => this._retryOnNextGesture(audio));
    } catch {
      // riproduzione audio non disponibile: non blocca la partita
      this.stop();
    }
  }

  // Safari su iPhone rifiuta play() se non arriva direttamente da un tocco o
  // da un tasto: succedeva avviando la partita da "Gioca subito", dove la
  // partita parte dopo il dialogo del colore, e la musica si sentiva solo
  // nelle anteprime. Se il primo tentativo viene rifiutato si riprova al
  // primo gesto successivo (tipicamente il primo tasto della prima mossa).
  _retryOnNextGesture(audio) {
    this._clearRetry();
    const events = ['keydown', 'pointerdown', 'touchend', 'click'];
    const handler = () => {
      this._clearRetry();
      if (this.audio !== audio) return;
      resumeAudioContext();
      audio.play().catch(() => {});
    };
    events.forEach((type) => document.addEventListener(type, handler, { capture: true, passive: true }));
    this._retry = () => events.forEach((type) => document.removeEventListener(type, handler, { capture: true }));
  }

  _clearRetry() {
    if (this._retry) this._retry();
    this._retry = null;
  }

  setVolume(volume) {
    const g = perceptualGain(volume);
    if (this.gain) {
      this.gain.gain.value = g;
    } else if (this.audio) {
      this.audio.volume = g;
    }
  }

  stop() {
    this._clearRetry();
    this.trackKey = null;
    if (this.audio) {
      this.audio.pause();
      try {
        this.audio.currentTime = 0;
      } catch {
        // niente da riavvolgere
      }
    }
    try {
      if (this.source) this.source.disconnect();
      if (this.gain) this.gain.disconnect();
    } catch {
      // già scollegati
    }
    this.audio = null;
    this.source = null;
    this.gain = null;
  }
}
