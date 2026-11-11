// Gestione riproduzione suoni: due canali di volume indipendenti (gioco / UI),
// rispetta il toggle "suoni set tematici".
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
//
// Un set può anche essere PARZIALE (come sarà Cani vs Gatti, che lascia di
// proposito scacco, dinieghi ed esiti al set neutro): per ogni evento che non
// definisce si ricade sul file corrispondente del set default, mai sul
// silenzio.
//
// Riproduzione: Web Audio API (vedi audio-context.js), perché su iOS è
// l'unico modo in cui il volume impostato viene davvero rispettato. Se la Web
// Audio API non è disponibile o non è ancora sbloccata, si ripiega su <audio>.
import {
  getAudioContext,
  isAudioContextRunning,
  resumeAudioContext,
  decodeAudio,
} from './audio-context.js';

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
  // Set Cani vs Gatti (11/11/2026): suoni per FAZIONE. Mosse e catture sono
  // della fazione di chi muove (zampe felpate / unghiette; soffio+zampata /
  // abbaio), sigle ed esiti della fazione del giocatore. Scacco e dinieghi
  // non sono definiti e ricadono sul set default — vedi
  // motto-chess-set-cani-gatti.md sezioni 0 e 8. Sorgenti e tagli in
  // cani-gatti-lavori/suoni/master.py.
  'cani-gatti': {
    base: 'assets/sounds/cani-gatti/',
    files: {
      move_gatti: 'cg_move_gatti.wav',
      move_cani: 'cg_move_cani.wav',
      capture_gatti: 'cg_capture_gatti.wav',
      capture_cani: 'cg_capture_cani.wav',
      touch: 'cg_touch.wav', // selezione e deselezione condividono
      castle: 'cg_castle.wav',
      promotion: 'cg_promotion.wav',
      session_gatti: 'cg_session_gatti.wav', // inizio e fine condividono
      session_cani: 'cg_session_cani.wav',
      win_gatti: 'cg_win_gatti.wav', // matto e resa/tempo condividono
      win_cani: 'cg_win_cani.wav',
      loss_gatti: 'cg_loss_gatti.wav',
      loss_cani: 'cg_loss_cani.wav',
      outcome_draw: 'cg_draw.wav',
    },
    resolve(name, ctx) {
      const f = ctx.faction; // senza fazione la chiave non esiste -> default
      switch (name) {
        case 'move':
        case 'capture':
          return `${name}_${f}`;
        case 'select':
        case 'deselect':
          return 'touch';
        case 'session_start':
        case 'session_end':
          return `session_${f}`;
        case 'outcome_win_checkmate':
        case 'outcome_win_resign_timeout':
          return `win_${f}`;
        case 'outcome_loss_checkmate':
        case 'outcome_loss_resign_timeout':
          return `loss_${f}`;
        default:
          return name; // castle, promotion, outcome_draw; check/illegal/invalid -> default
      }
    },
  },
};

const UI_SOUND_FILES = {
  navigation: 'chess_ui_navigation.wav',
};

// Risolve un evento in un percorso file. Con il toggle "suoni set tematici"
// disattivato si usa SEMPRE il set default neutro: il toggle rende i suoni
// neutri, non li spegne (prima spegneva mossa, cattura, selezione, arrocco e
// promozione, togliendo a chi non vede un'informazione importante).
function resolveGameSoundPath(name, ctx, themeSoundsEnabled) {
  const themed = themeSoundsEnabled && ctx.pieceSet ? GAME_SETS[ctx.pieceSet] : null;
  if (themed) {
    const key = themed.resolve ? themed.resolve(name, ctx) : name;
    const file = themed.files[key];
    if (file) return themed.base + file;
  }
  const fallback = GAME_SETS.default.files[name];
  return fallback ? GAME_SETS.default.base + fallback : null;
}

export class SoundManager {
  constructor(getSettings) {
    this.getSettings = getSettings; // () => settings corrente
    // src -> Promise<AudioBuffer|null>, decodificato una volta sola.
    this.buffers = new Map();
    // src -> <audio>, solo per il ripiego senza Web Audio. Tenuti in vita
    // perché un Audio senza riferimenti può essere raccolto a metà suono.
    this.elements = new Map();
  }

  // Scalda la cache dei suoni di gioco del set indicato (e del default, che
  // fa da ripiego per gli eventi che il set non definisce).
  preloadGameSounds(pieceSet) {
    const sets = [GAME_SETS.default];
    if (pieceSet && GAME_SETS[pieceSet] && pieceSet !== 'default') sets.push(GAME_SETS[pieceSet]);
    sets.forEach((set) => {
      Object.values(set.files).forEach((file) => this._loadBuffer(set.base + file));
    });
  }

  // ctx: { pieceSet, piece, faction } — piece è il tipo (p/n/b/r/q/k) del
  // pezzo che compie l'azione (chi mangia, chi dà scacco), non quello subito;
  // faction è la fazione di chi agisce nei set a fazioni.
  playGame(name, ctx = {}) {
    const settings = this.getSettings();
    const src = resolveGameSoundPath(name, ctx, settings.themeSoundsEnabled);
    if (!src) return;
    this._play(src, settings.volumeGame);
  }

  playUi(name) {
    const settings = this.getSettings();
    const file = UI_SOUND_FILES[name];
    if (!file) return;
    this._play(UI_SOUNDS_BASE + file, settings.volumeUi);
  }

  _loadBuffer(src) {
    const ctx = getAudioContext();
    if (!ctx) return Promise.resolve(null);
    let promise = this.buffers.get(src);
    if (!promise) {
      promise = fetch(src)
        .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(res.status))))
        .then((data) => decodeAudio(ctx, data))
        .catch(() => null);
      this.buffers.set(src, promise);
    }
    return promise;
  }

  _play(src, volume) {
    const gainValue = Math.max(0, Math.min(1, Number(volume) || 0));
    if (gainValue === 0) return;

    const ctx = getAudioContext();
    if (!ctx || !isAudioContextRunning()) {
      // Contesto non ancora sbloccato (nessun gesto dell'utente finora) o
      // Web Audio assente: si prova a sbloccarlo per i prossimi suoni e
      // intanto si usa <audio>, così questo suono non va perso.
      resumeAudioContext();
      this._playWithElement(src, gainValue);
      return;
    }

    this._loadBuffer(src).then((buffer) => {
      if (!buffer) {
        this._playWithElement(src, gainValue);
        return;
      }
      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = gainValue;
        source.connect(gain).connect(ctx.destination);
        source.start();
      } catch {
        this._playWithElement(src, gainValue);
      }
    });
  }

  _playWithElement(src, volume) {
    try {
      let el = this.elements.get(src);
      if (!el) {
        el = new Audio(src);
        el.preload = 'auto';
        this.elements.set(src, el);
      }
      el.volume = volume; // ignorato da iOS, rispettato altrove
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
