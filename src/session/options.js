// session/options: configurazione partita, con persistenza automatica
// dell'ultima config usata (eccetto il colore, sempre chiesto).
const STORAGE_KEY = 'mottochess.lastGameConfig.v1';

// ambientTrack: chiave esplicita di AMBIENT_TRACKS (vedi settings.js).
// faction: fazione scelta dal giocatore nei set che la prevedono (vedi
//   themes/factions.js), 'casuale' compreso. Ignorata dagli altri set. A
//   differenza del colore viene ricordata: è una preferenza estetica, non
//   qualcosa che cambia l'orientamento della scacchiera.
export const DEFAULT_CONFIG = {
  timeEnabled: false,
  minutes: 15,
  incrementSec: 5,
  level: 5,
  pieceSet: 'classico',
  faction: 'casuale',
  ambientTrack: 'nessuna',
};

export function loadLastConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_CONFIG };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveLastConfig(config) {
  const { timeEnabled, minutes, incrementSec, level, pieceSet, faction, ambientTrack } = config;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ timeEnabled, minutes, incrementSec, level, pieceSet, faction, ambientTrack })
  );
}
