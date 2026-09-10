// session/settings: impostazioni app-wide, persistenti.
const STORAGE_KEY = 'mottochess.settings.v1';

// Versione delle impostazioni salvate. Va incrementata quando un default
// cambia e il nuovo valore deve valere anche per chi ha già delle
// impostazioni salvate (vedi migrazione in loadSettings).
//  2: volume musica di sottofondo abbassato da 0.5 a 0.3, per non coprire
//     narrazione e suoni di gioco.
//  3: musica di sottofondo abbassata ulteriormente da 0.3 a 0.15 (copriva
//     ancora troppo narrazione e suoni di gioco/set), suoni di gioco portati
//     da 1 a 0.9 per restare in equilibrio con la narrazione dello screen
//     reader (non regolabile da questa app: è il canale audio dell'utente).
const SETTINGS_VERSION = 3;

export const LIGHT_SQUARE_COLORS = {
  bianco: '#FFFFFF',
  avorio: '#F2EDE4',
  giallo: '#F2D06B',
  rosa: '#F2B8C6',
  'verde salvia': '#9CAF88',
  azzurro: '#A9D2E5',
};

export const DARK_SQUARE_COLORS = {
  nero: '#2B2B2B',
  'verde oliva': '#6B7A3A',
  rosso: '#8C2F2F',
  viola: '#6B4C7A',
  blu: '#2F4A8C',
  navy: '#243B6B',
};

// Colori casella consigliati per set pezzi. Il set Judo ha judogi bianchi e
// blu fissi: su caselle bianche o blu pure i pezzi si confonderebbero con il
// fondo, quindi usa avorio e navy, volutamente diversi dai due judogi.
export const PIECE_SET_SQUARE_COLORS = {
  judo: { light: 'avorio', dark: 'navy' },
};

// Tracce musicali di sottofondo (loop continuo durante la partita), canale
// volume indipendente da suoni di gioco/UI. 'nessuna' = musica disattivata.
export const AMBIENT_TRACKS = {
  nessuna: { label: 'Nessuna', file: null },
  newage: { label: 'New age (rilassante)', file: 'newage_loop_v1.mp3' },
  giappone: { label: 'Orientale', file: 'giappone_loop_v1.mp3' },
  spiaggia: { label: 'Spiaggia', file: 'spiaggia_loop_v1.mp3' },
};

export const DEFAULT_SETTINGS = {
  themeSoundsEnabled: true,
  narrationStyle: 'compatto', // 'compatto' | 'espanso'
  timeWarning10Enabled: true,
  timeWarning5Enabled: true,
  timeElapsedEvery10MinEnabled: true,
  volumeGame: 0.9,
  volumeUi: 0.8,
  // La musica resta volutamente sotto ai suoni di gioco: è un sottofondo, non
  // deve competere con la narrazione dello screen reader.
  volumeAmbient: 0.15,
  settingsVersion: SETTINGS_VERSION,
  lightSquareColorName: 'verde salvia',
  darkSquareColorName: 'viola',
  language: 'it',
  pgn: {
    includeDateTime: false,
    includeSetName: false,
    includePlayers: false,
    notes: '',
  },
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const parsed = JSON.parse(raw);
    const merged = {
      ...structuredClone(DEFAULT_SETTINGS),
      ...parsed,
      pgn: { ...DEFAULT_SETTINGS.pgn, ...(parsed.pgn || {}) },
    };
    if (parsed.settingsVersion !== SETTINGS_VERSION) {
      merged.volumeAmbient = DEFAULT_SETTINGS.volumeAmbient;
      merged.volumeGame = DEFAULT_SETTINGS.volumeGame;
      merged.settingsVersion = SETTINGS_VERSION;
    }
    return merged;
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
