// session/settings: impostazioni app-wide, persistenti.
const STORAGE_KEY = 'mottochess.settings.v1';

export const LIGHT_SQUARE_COLORS = {
  bianco: '#FFFFFF',
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
};

// Tracce musicali di sottofondo (loop continuo durante la partita), canale
// volume indipendente da suoni di gioco/UI. 'nessuna' = musica disattivata.
export const AMBIENT_TRACKS = {
  nessuna: { label: 'Nessuna', file: null },
  newage: { label: 'New age (rilassante)', file: 'newage_loop_v1.mp3' },
};

export const DEFAULT_SETTINGS = {
  themeSoundsEnabled: true,
  narrationStyle: 'compatto', // 'compatto' | 'espanso'
  timeWarning10Enabled: true,
  timeWarning5Enabled: true,
  timeElapsedEvery10MinEnabled: true,
  volumeGame: 1,
  volumeUi: 0.8,
  volumeAmbient: 0.5,
  ambientTrack: 'nessuna', // default: musica di sottofondo disattivata
  lightSquareColorName: 'verde salvia',
  darkSquareColorName: 'viola',
  language: 'it',
  favoritePieceSet: 'classico',
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
    return { ...structuredClone(DEFAULT_SETTINGS), ...parsed, pgn: { ...DEFAULT_SETTINGS.pgn, ...(parsed.pgn || {}) } };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
