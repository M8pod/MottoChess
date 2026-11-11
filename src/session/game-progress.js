// session/game-progress: partita in corso salvata in automatico.
//
// Prima, chiudere l'app o uscire dalla schermata a metà partita voleva dire
// perderla, e l'unico modo per tornare al menu era abbandonare. Ora lo stato
// viene salvato dopo ogni mossa (e quando l'app va in background): la Home
// offre "Riprendi partita" finché la partita non finisce.
//
// Si salvano le mosse in notazione standard (SAN), non una FEN: rigiocandole
// si ricostruisce anche la cronologia, che serve ai comandi "l"/"l+numero",
// alla tripla ripetizione e al PGN finale.
const STORAGE_KEY = 'mottochess.gameInProgress.v1';

// state: { session, moves: string[], clock: { remaining: {w,b}, elapsedMs } | null,
//          savedAt }
export function saveGameProgress(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch {
    // memoria non disponibile: la partita resta giocabile, solo non riprendibile
  }
}

export function loadGameProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (!state || !state.session || !Array.isArray(state.moves)) return null;
    return state;
  } catch {
    return null;
  }
}

export function clearGameProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // niente da cancellare
  }
}
