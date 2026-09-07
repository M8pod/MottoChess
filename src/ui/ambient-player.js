// Riproduzione musica ambientale in loop continuo durante la partita: canale
// volume indipendente dai suoni di gioco/UI (SoundManager), pensato per una
// singola traccia alla volta che parte con l'inizio partita e si ferma a
// fine partita/uscita dalla schermata.
import { AMBIENT_TRACKS } from '../session/settings.js';

const AMBIENT_BASE = 'assets/sounds/ambient/';

export class AmbientPlayer {
  constructor() {
    this.audio = null;
  }

  // trackKey: chiave in AMBIENT_TRACKS (es. 'nessuna', 'newage')
  play(trackKey, volume) {
    this.stop();
    const track = AMBIENT_TRACKS[trackKey];
    if (!track || !track.file) return;
    try {
      this.audio = new Audio(AMBIENT_BASE + track.file);
      this.audio.loop = true;
      this.audio.volume = Math.max(0, Math.min(1, volume));
      this.audio.play().catch(() => {});
    } catch {
      // riproduzione audio non disponibile: non blocca la partita
      this.audio = null;
    }
  }

  setVolume(volume) {
    if (this.audio) this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }
}
