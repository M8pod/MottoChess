// Contesto audio condiviso (Web Audio API) per suoni di gioco, UI e musica.
//
// Perché non basta <audio>.volume: su iPhone e iPad Safari IGNORA la
// proprietà volume degli elementi audio (è di sola lettura, vale sempre 1),
// quindi i cursori del volume in Impostazioni non avevano alcun effetto. Con
// la Web Audio API il volume passa da un GainNode, che iOS rispetta.
//
// Su iOS il contesto nasce "sospeso" e si sblocca solo dentro un gesto
// dell'utente (tocco, tasto): unlockAudioOnUserGesture() aggancia un
// ascoltatore permanente che lo riattiva a ogni gesto, anche dopo che il
// sistema lo ha interrotto (chiamata in arrivo, app in background...).

let sharedContext = null;
let contextUnavailable = false;

export function getAudioContext() {
  if (sharedContext || contextUnavailable) return sharedContext;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) {
    contextUnavailable = true;
    return null;
  }
  try {
    sharedContext = new Ctor();
  } catch {
    contextUnavailable = true;
    sharedContext = null;
  }
  return sharedContext;
}

export function isAudioContextRunning() {
  const ctx = getAudioContext();
  return Boolean(ctx && ctx.state === 'running');
}

export function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state !== 'running' && typeof ctx.resume === 'function') {
    ctx.resume().catch(() => {});
  }
}

export function unlockAudioOnUserGesture() {
  // Con gli elementi <audio> i suoni dell'app suonavano anche con
  // l'interruttore silenzioso dell'iPhone attivo; la Web Audio API invece di
  // default lo rispetta. 'playback' mantiene il comportamento di prima
  // (Safari 16.4+, ignorato dove non esiste).
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch {
    // API non disponibile: nessun problema
  }
  const events = ['pointerdown', 'touchend', 'keydown', 'click'];
  events.forEach((type) => {
    document.addEventListener(type, resumeAudioContext, { capture: true, passive: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resumeAudioContext();
  });
}

// Decodifica compatibile anche con le versioni di Safari che conoscono solo
// la forma a callback di decodeAudioData.
export function decodeAudio(ctx, arrayBuffer) {
  return new Promise((resolve, reject) => {
    const maybePromise = ctx.decodeAudioData(arrayBuffer, resolve, reject);
    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.then(resolve, reject);
    }
  });
}

// L'orecchio percepisce il volume in scala logaritmica: per la musica di
// sottofondo il cursore (0-1) viene mappato su una curva "audio taper",
// lineare in dB su un intervallo di TAPER_RANGE_DB, così abbassare il cursore
// abbassa davvero ciò che si sente su tutta la corsa.
const TAPER_RANGE_DB = 40;

export function perceptualGain(value) {
  const v = Math.max(0, Math.min(1, Number(value) || 0));
  if (v <= 0) return 0;
  const db = TAPER_RANGE_DB * (v - 1);
  return Math.pow(10, db / 20);
}
