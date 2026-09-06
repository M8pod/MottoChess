// Gestione riproduzione suoni: due canali di volume indipendenti (gioco / UI),
// rispetta il toggle "suoni set tematici" per i suoni non di sistema.
const GAME_SOUNDS_BASE = 'assets/sounds/default/';
const UI_SOUNDS_BASE = 'assets/sounds/ui-menu/';

const GAME_SOUND_FILES = {
  move: 'chess_move_magnetic_v1.wav',
  capture: 'chess_capture_impact_v4.wav',
  select: 'chess_piece_select_v4.wav',
  deselect: 'chess_piece_deselect.wav',
  illegal: 'chess_illegal_move_v4.wav',
  invalid: 'chess_invalid_move_v3.wav',
  castle: 'chess_castling.wav',
  promotion: 'chess_pawn_promotion.wav',
  check: 'chess_check_v2.wav',
  outcome_win_checkmate: 'chess_checkmate_victory_v2.wav',
  outcome_win_resign_timeout: 'chess_resignation_timeout_victory_v3.wav',
  outcome_loss_checkmate: 'chess_checkmate_defeat_v3.wav',
  outcome_loss_resign_timeout: 'chess_timeout_resignation_defeat_v2.wav',
  outcome_draw: 'chess_draw_stalemate_v4.wav',
  session_start: 'chess_game_start.wav',
  session_end: 'chess_session_end_placeholder_v1.mp3',
};

const UI_SOUND_FILES = {
  navigation: 'chess_ui_navigation.wav',
};

// Suoni "di sistema": restano sempre neutri e attivi anche con set tematici
// diversi dal default, e non sono disattivati dal toggle "suoni set tematici".
const SYSTEM_SOUNDS = new Set([
  'illegal',
  'invalid',
  'check',
  'outcome_win_checkmate',
  'outcome_win_resign_timeout',
  'outcome_loss_checkmate',
  'outcome_loss_resign_timeout',
  'outcome_draw',
]);

export class SoundManager {
  constructor(getSettings) {
    this.getSettings = getSettings; // () => settings corrente
  }

  playGame(name) {
    const settings = this.getSettings();
    if (!settings.themeSoundsEnabled && !SYSTEM_SOUNDS.has(name)) return;
    const file = GAME_SOUND_FILES[name];
    if (!file) return;
    this._play(GAME_SOUNDS_BASE + file, settings.volumeGame);
  }

  playUi(name) {
    const settings = this.getSettings();
    const file = UI_SOUND_FILES[name];
    if (!file) return;
    this._play(UI_SOUNDS_BASE + file, settings.volumeUi);
  }

  _play(src, volume) {
    try {
      const audio = new Audio(src);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(() => {});
    } catch {
      // riproduzione audio non disponibile: non blocca l'interazione
    }
  }
}
