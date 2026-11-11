// session/options: configurazione partita, con persistenza automatica
// dell'ultima config usata (eccetto il colore, sempre chiesto).
const STORAGE_KEY = 'mottochess.lastGameConfig.v1';

// ambientTrack: chiave esplicita di AMBIENT_TRACKS (vedi settings.js).
// faction: fazione scelta dal giocatore nei set che la prevedono (vedi
//   themes/factions.js), 'casuale' compreso. Ignorata dagli altri set. A
//   differenza del colore viene ricordata: è una preferenza estetica, non
//   qualcosa che cambia l'orientamento della scacchiera.
// pieceSet: se non c'è ancora una configurazione salvata vale il set
//   preferito scelto in Impostazioni (vedi loadLastConfig).
export const DEFAULT_CONFIG = {
  timeEnabled: false,
  minutes: 15,
  incrementSec: 5,
  level: 5,
  pieceSet: 'classico',
  faction: 'casuale',
  ambientTrack: 'nessuna',
};

export function loadLastConfig(defaultPieceSet) {
  const base = { ...DEFAULT_CONFIG, pieceSet: defaultPieceSet || DEFAULT_CONFIG.pieceSet };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...base, ...JSON.parse(raw) } : base;
  } catch {
    return base;
  }
}

export function saveLastConfig(config) {
  const { timeEnabled, minutes, incrementSec, level, pieceSet, faction, ambientTrack } = config;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ timeEnabled, minutes, incrementSec, level, pieceSet, faction, ambientTrack })
    );
  } catch {
    // memoria non disponibile: la configurazione vale solo per questa partita
  }
}

// Cambiare il set preferito in Impostazioni lo rende anche quello di
// "Gioca subito" e quello preselezionato in Opzioni partita: altrimenti
// l'ultima configurazione salvata lo nasconderebbe per sempre.
export function setLastConfigPieceSet(pieceSet, defaultPieceSet) {
  const config = loadLastConfig(defaultPieceSet);
  saveLastConfig({ ...config, pieceSet });
}
