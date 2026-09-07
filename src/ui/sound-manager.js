// Gestione riproduzione suoni: due canali di volume indipendenti (gioco / UI),
// rispetta il toggle "suoni set tematici" per i suoni non di sistema.
//
// Ogni set pezzi ha la propria cartella e la propria mappatura EVENTO -> file,
// ma soprattutto la propria funzione `resolve`: due set possono differenziare
// non solo gli ASSET ma anche QUALI eventi condividono lo stesso suono. Non è
// garantito che un evento del set default abbia una controparte 1:1 nel set
// Judo (e viceversa): es. il set Judo raggruppa selezione/deselezione,
// mossa-illegale/comando-non-capito e le cinque categorie d'esito in un
// suono solo ciascuno, ma in cambio differenzia sei suoni di cattura e due di
// scacco dove il default ne ha uno solo. `resolve` è il punto in cui questa
// libertà per-set viene espressa: riceve l'evento "semantico" invariato che
// arriva da game-screen.js (più il contesto, es. il pezzo coinvolto) e
// decide a quale chiave del proprio `files` corrisponde. Un set nuovo può
// quindi avere una granularità completamente diversa dagli altri senza
// toccare il chiamante.
const UI_SOUNDS_BASE = 'assets/sounds/ui-menu/';

const PIECE_TYPE_NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

const GAME_SETS = {
  default: {
    base: 'assets/sounds/default/',
    files: {
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
    },
  },
  // Set Judo: nessuna parola pronunciata in nessun suono (nemmeno lo scacco,
  // solo urla maschili/femminili) — vedi motto-chess-set-judo.md sezione 10
  // per la motivazione di ogni scelta.
  judo: {
    base: 'assets/sounds/judo/',
    files: {
      move: 'judo_move.wav',
      capture_pawn: 'judo_capture_pawn.wav',
      capture_knight: 'judo_capture_knight.wav',
      capture_bishop: 'judo_capture_bishop.wav',
      capture_rook: 'judo_capture_rook.wav',
      capture_queen: 'judo_capture_queen.wav',
      capture_king: 'judo_capture_king.wav',
      touch: 'judo_touch.wav', // selezione e deselezione condividono
      castle: 'judo_castle.wav',
      promotion: 'judo_promotion.wav',
      check_male: 'judo_check_male.wav',
      check_female: 'judo_check_female.wav',
      denied: 'judo_denied.wav', // mossa illegale e comando non capito condividono
      outcome_win: 'judo_outcome_win.wav', // matto e resa/tempo condividono
      outcome_loss: 'judo_outcome_loss.wav', // matto e resa/tempo condividono
      outcome_draw: 'judo_outcome_draw.wav',
      session: 'judo_session.wav', // inizio e fine condividono, stesso file
    },
    resolve(name, ctx) {
      switch (name) {
        case 'capture':
          return `capture_${PIECE_TYPE_NAME[ctx.piece] || 'pawn'}`;
        case 'check':
          return ctx.piece === 'q' ? 'check_female' : 'check_male';
        case 'select':
        case 'deselect':
          return 'touch';
        case 'illegal':
        case 'invalid':
          return 'denied';
        case 'outcome_win_checkmate':
        case 'outcome_win_resign_timeout':
          return 'outcome_win';
        case 'outcome_loss_checkmate':
        case 'outcome_loss_resign_timeout':
          return 'outcome_loss';
        case 'session_start':
        case 'session_end':
          return 'session';
        default:
          return name; // move, castle, promotion, outcome_draw restano identici
      }
    },
  },
};

const UI_SOUND_FILES = {
  navigation: 'chess_ui_navigation.wav',
};

// Suoni "di sistema": l'evento suona SEMPRE, anche con il toggle "suoni set
// tematici" disattivato — ma in quel caso con l'asset neutro del set default,
// mai con quello caratterizzato del set attivo (vedi playGame). Il toggle
// quindi non silenzia mai questi eventi, ma può renderli neutri.
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
    // Un elemento <audio> per file, creato una volta sola e tenuto in vita:
    // creare un nuovo Audio a ogni riproduzione lo lasciava senza riferimenti
    // (poteva essere raccolto dal garbage collector a metà suono) e ricaricava
    // il file ogni volta, con il risultato che alcuni suoni — tipicamente
    // quelli delle mosse dell'avversario, che partono senza un tocco
    // dell'utente — non venivano riprodotti.
    this.elements = new Map();
  }

  // Scalda la cache dei suoni di gioco del set indicato: va chiamata dopo
  // un'interazione dell'utente (es. avvio partita), così il primo suono non
  // arriva in ritardo.
  preloadGameSounds(pieceSet) {
    const set = GAME_SETS[pieceSet] || GAME_SETS.default;
    Object.values(set.files).forEach((file) => this._element(set.base + file));
  }

  // ctx: { pieceSet, piece } — piece è il tipo (p/n/b/r/q/k) del pezzo che
  // compie l'azione (chi mangia, chi dà scacco), non quello subito.
  playGame(name, ctx = {}) {
    const settings = this.getSettings();
    const isSystem = SYSTEM_SOUNDS.has(name);
    if (!settings.themeSoundsEnabled && !isSystem) return;

    const useThemedSet = settings.themeSoundsEnabled && ctx.pieceSet && GAME_SETS[ctx.pieceSet];
    const set = useThemedSet ? GAME_SETS[ctx.pieceSet] : GAME_SETS.default;
    const key = set.resolve ? set.resolve(name, ctx) : name;
    const file = set.files[key];
    if (!file) return;
    this._play(set.base + file, settings.volumeGame);
  }

  playUi(name) {
    const settings = this.getSettings();
    const file = UI_SOUND_FILES[name];
    if (!file) return;
    this._play(UI_SOUNDS_BASE + file, settings.volumeUi);
  }

  _element(src) {
    let el = this.elements.get(src);
    if (!el) {
      el = new Audio(src);
      el.preload = 'auto';
      this.elements.set(src, el);
    }
    return el;
  }

  _play(src, volume) {
    try {
      const el = this._element(src);
      el.volume = Math.max(0, Math.min(1, volume));
      try {
        el.currentTime = 0;
      } catch {
        // file non ancora caricato: parte comunque dall'inizio
      }
      el.play().catch(() => {});
    } catch {
      // riproduzione audio non disponibile: non blocca l'interazione
    }
  }
}
