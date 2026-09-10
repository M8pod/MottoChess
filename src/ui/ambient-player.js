// Riproduzione musica ambientale in loop continuo durante la partita: canale
// volume indipendente dai suoni di gioco/UI (SoundManager), pensato per una
// singola traccia alla volta che parte con l'inizio partita e si ferma a
// fine partita/uscita dalla schermata.
import { AMBIENT_TRACKS } from '../session/settings.js';

const AMBIENT_BASE = 'assets/sounds/ambient/';

// L'orecchio percepisce il volume in scala logaritmica, ma <audio>.volume è
// un'ampiezza lineare: usando lo slider (0-1) direttamente come volume, gran
// parte della corsa suona quasi invariata e solo l'ultimo tratto vicino allo
// zero si sente davvero abbassarsi. Per far sì che abbassare lo slider
// abbassi davvero quel che si sente, mappiamo lo slider su una curva "audio
// taper": lineare in dB (range di TAPER_RANGE_DB) invece che in ampiezza.
const TAPER_RANGE_DB = 40;

function perceptualGain(value) {
  const v = Math.max(0, Math.min(1, value));
  if (v <= 0) return 0;
  const db = TAPER_RANGE_DB * (v - 1);
  return Math.pow(10, db / 20);
}

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
      this.audio.volume = perceptualGain(volume);
      this.audio.play().catch(() => {});
    } catch {
      // riproduzione audio non disponibile: non blocca la partita
      this.audio = null;
    }
  }

  setVolume(volume) {
    if (this.audio) this.audio.volume = perceptualGain(volume);
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }
}
