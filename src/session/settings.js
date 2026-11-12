// session/settings: impostazioni app-wide, persistenti.
import { detectLanguage, isSupportedLanguage } from '../i18n/i18n.js';
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

// Palette caselle (riviste l'11/11/2026 su consiglio dei tester ipovedenti):
// le caselle chiare hanno SOLO colori chiari e le scure SOLO colori scuri,
// così qualunque combinazione resta ben distinguibile. Aggiunti i grigi.
// "verde salvia" e "azzurro" sono stati schiariti (erano toni medi).
// Ogni colore si può poi rendere più tenue o più intenso (vedi
// applyIntensity in ui/color-utils.js), restando chiaro o scuro.
export const LIGHT_SQUARE_COLORS = {
  bianco: '#FFFFFF',
  avorio: '#F2EDE4',
  'grigio chiaro': '#D6D6D6',
  giallo: '#F2D06B',
  rosa: '#F2B8C6',
  'verde salvia': '#C3D6B3',
  azzurro: '#B9DCEC',
  cielo: '#CFE4F2',
};

export const DARK_SQUARE_COLORS = {
  nero: '#2B2B2B',
  'grigio scuro': '#555555',
  marrone: '#6B4A2F',
  'verde oliva': '#546029',
  rosso: '#8C2F2F',
  viola: '#6B4C7A',
  blu: '#2F4A8C',
  navy: '#243B6B',
};

// Colori casella fissi per set pezzi (non modificabili in Impostazioni). Il
// set Judo ha judogi bianchi e blu fissi: su caselle bianche o blu pure i
// pezzi si confonderebbero con il fondo, quindi usa avorio e navy,
// volutamente diversi dai due judogi. Valori esadecimali diretti: non
// dipendono dalla palette che l'utente può scegliere.
export const PIECE_SET_SQUARE_COLORS = {
  judo: { light: '#F2EDE4', dark: '#243B6B' },
  'cani-gatti': { light: '#CFE4F2', dark: '#6E8FB5' },
};

// Intensità colore caselle: 0 = molto tenue, 50 = colore di base, 100 = molto
// intenso.
export const DEFAULT_INTENSITY = 50;

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
  lightSquareIntensity: DEFAULT_INTENSITY,
  darkSquareIntensity: DEFAULT_INTENSITY,
  language: 'it',
  // Set pezzi preferito: preselezionato in Opzioni partita e usato da
  // "Gioca subito" finché non se ne sceglie un altro in Opzioni partita.
  defaultPieceSet: 'classico',
  // Intestazione PGN sempre completa (11/11/2026): resta solo la nota libera.
  pgn: {
    notes: '',
  },
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Primo avvio: lingua del dispositivo (italiano, altrimenti inglese).
    if (!raw) return { ...structuredClone(DEFAULT_SETTINGS), language: detectLanguage() };
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
    // Un colore salvato che non esiste più nella palette (es. "carta da
    // zucchero", tolto dalle scure perché troppo chiaro) torna al predefinito.
    // Chi ha aperto il gioco prima che arrivassero le lingue (11/11/2026) ha
    // impostazioni salvate SENZA lingua: prima ricadeva sull'italiano anche
    // con il telefono in inglese. Ora vale la lingua del dispositivo.
    if (!isSupportedLanguage(parsed.language)) merged.language = detectLanguage();
    if (!LIGHT_SQUARE_COLORS[merged.lightSquareColorName]) {
      merged.lightSquareColorName = DEFAULT_SETTINGS.lightSquareColorName;
    }
    if (!DARK_SQUARE_COLORS[merged.darkSquareColorName]) {
      merged.darkSquareColorName = DEFAULT_SETTINGS.darkSquareColorName;
    }
    return merged;
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

// Chiede al browser di non cancellare mai i dati salvati da questa app
// (impostazioni, colori, partite). Safari in particolare può svuotare la
// memoria dei siti non usati per qualche giorno: con la memoria "persistente"
// le scelte restano sul dispositivo per le volte successive.
export function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  } catch {
    // API non disponibile: si resta sul salvataggio normale
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // memoria piena o navigazione privata: le impostazioni valgono per la sessione
  }
}
