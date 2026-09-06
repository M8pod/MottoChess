// session/options: configurazione partita, con persistenza automatica
// dell'ultima config usata (eccetto il colore, sempre chiesto).
const STORAGE_KEY = 'mottochess.lastGameConfig.v1';

export const DEFAULT_CONFIG = {
  timeEnabled: false,
  minutes: 15,
  incrementSec: 5,
  level: 5,
  pieceSet: 'classico',
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
  const { timeEnabled, minutes, incrementSec, level, pieceSet } = config;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ timeEnabled, minutes, incrementSec, level, pieceSet })
  );
}
