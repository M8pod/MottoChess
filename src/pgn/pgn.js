// pgn: import/export PGN, inclusi tag metadati opzionali (vedi Impostazioni).
const STORAGE_KEY = 'mottochess.savedGames.v1';

// Applica gli header PGN in base alle opzioni scelte in Impostazioni.
export function applyPgnMetadata(gameCore, { session, pgnOptions, result }) {
  const headers = {};
  const whiteName =
    session.color === 'w' ? 'Giocatore' : `Stockfish (livello ${session.level})`;
  const blackName =
    session.color === 'b' ? 'Giocatore' : `Stockfish (livello ${session.level})`;

  if (pgnOptions.includePlayers) {
    headers.White = whiteName;
    headers.Black = blackName;
  }
  if (pgnOptions.includeDateTime && session.startedAt) {
    const d = new Date(session.startedAt);
    headers.Date = d.toISOString().slice(0, 10).replace(/-/g, '.');
    headers.Time = d.toISOString().slice(11, 19);
  }
  if (pgnOptions.includeSetName) {
    headers.Variant = 'Standard';
    headers.SetName = session.pieceSet || 'Classico';
  }
  if (pgnOptions.notes) {
    headers.Annotator = pgnOptions.notes;
  }
  if (result) {
    headers.Result = result;
  }
  gameCore.setHeaders(headers);
  return gameCore.pgn();
}

export function listSavedGames() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGame({ pgn, label, savedAt = Date.now() }) {
  const games = listSavedGames();
  games.unshift({ id: `${savedAt}-${Math.random().toString(36).slice(2, 8)}`, pgn, label, savedAt });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function deleteSavedGame(id) {
  const games = listSavedGames().filter((g) => g.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}
