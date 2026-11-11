// pgn: import/export PGN, inclusi tag metadati opzionali (vedi Impostazioni).
import { Chess } from '../vendor/chess.js';

const STORAGE_KEY = 'mottochess.savedGames.v1';

// Il valore di un tag PGN sta fra virgolette: una virgoletta nel testo (es.
// nelle note libere) chiudeva il tag a metà e un a capo lo spezzava,
// rendendo il PGN illeggibile. Lo standard prevede l'escape \" ma molti
// programmi (compresa la libreria usata qui per l'importazione) non lo
// rileggono: si sostituiscono quindi virgolette e barre rovesciate con
// caratteri equivalenti innocui.
function pgnTagValue(text) {
  return String(text)
    .replace(/[\r\n]+/g, ' ')
    .replace(/"/g, "'")
    .replace(/\\/g, '/')
    .trim();
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Data e ora LOCALI: prima si usava l'ora UTC, e una partita giocata alle
// 00:30 in Italia finiva sotto la data del giorno prima.
function pgnDate(d) {
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
}
function pgnTime(d) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

const COLOR_NAME = { w: 'Bianco', b: 'Nero' };

function factionPhrase(faction) {
  return faction ? `, con i ${faction}` : '';
}

function durationText(ms) {
  if (ms < 60000) return 'meno di un minuto';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h && m) return `${h} ore e ${m} minuti`.replace(/^1 ore/, '1 ora');
  if (h) return h === 1 ? '1 ora' : `${h} ore`;
  return m === 1 ? '1 minuto' : `${m} minuti`;
}

// Esito dal punto di vista del giocatore, in parole: è la riga che si sente
// per prima con VoiceOver aprendo una partita salvata.
export function outcomeTexts(outcome, playerColor) {
  if (!outcome) return { termination: 'Partita interrotta', esito: 'Partita interrotta, senza risultato' };
  const won = (c) => (c === playerColor ? 'Hai vinto' : 'Hai perso');
  switch (outcome.kind) {
    case 'checkmate':
      return { termination: 'Scacco matto', esito: `${won(outcome.winner)} per scacco matto` };
    case 'timeout': {
      const winner = outcome.loser === 'w' ? 'b' : 'w';
      return { termination: 'Tempo scaduto', esito: `${won(winner)} per tempo scaduto` };
    }
    case 'resign': {
      const winner = outcome.loser === 'w' ? 'b' : 'w';
      return { termination: 'Abbandono', esito: `${won(winner)} per abbandono` };
    }
    case 'draw': {
      const why = {
        stalemate: 'stallo',
        threefold: 'tripla ripetizione',
        fifty: 'regola delle cinquanta mosse',
        insufficient: 'materiale insufficiente',
      }[outcome.reason] || 'accordo';
      return { termination: `Patta per ${why}`, esito: `Patta per ${why}` };
    }
    default:
      return { termination: 'Sconosciuta', esito: 'Esito sconosciuto' };
  }
}

// Intestazione della partita salvata (decisione dell'11/11/2026: sempre
// completa, non più a scelta in Impostazioni). Tag standard PGN in inglese,
// così gli altri programmi di scacchi li riconoscono, più tag in italiano
// leggibili a voce: set, con chi e con cosa giocava il giocatore, avversario,
// esito, durata.
// session: { color, level, levelElo, pieceSetLabel, factions: {w,b}|null,
//            timeEnabled, minutes, incrementSec, startedAt }
// outcome: come in game-screen (null = partita interrotta)
export function applyPgnMetadata(gameCore, { session, pgnOptions = {}, result, outcome = null, endedAt = Date.now() }) {
  const me = session.color;
  const opp = me === 'w' ? 'b' : 'w';
  const engineName = `Stockfish livello ${session.level}` + (session.levelElo ? ` (circa ${session.levelElo} Elo)` : '');
  const factions = session.factions || {};
  const start = new Date(session.startedAt || endedAt);
  const end = new Date(endedAt);
  const { termination, esito } = outcomeTexts(outcome, me);
  const tc = session.timeEnabled
    ? `${session.minutes * 60}+${session.incrementSec || 0}`
    : '-';

  const headers = {
    Event: 'Motto Chess',
    Site: 'Motto Chess',
    Date: pgnDate(start),
    Round: '-',
    White: me === 'w' ? 'Giocatore' : engineName,
    Black: me === 'b' ? 'Giocatore' : engineName,
    Result: result || '*',
    Set: session.pieceSetLabel || 'Classico',
    Giocatore: `${COLOR_NAME[me]}${factionPhrase(factions[me])}`,
    Avversario: `${engineName}, ${COLOR_NAME[opp]}${factionPhrase(factions[opp])}`,
    Esito: esito,
    Termination: termination,
    TimeControl: tc,
    Tempo: session.timeEnabled
      ? `${session.minutes} minuti per giocatore, ${session.incrementSec || 0} secondi di incremento`
      : 'senza orologio',
    StartTime: pgnTime(start),
  };
  if (pgnDate(end) !== pgnDate(start)) headers.EndDate = pgnDate(end);
  headers.EndTime = pgnTime(end);
  headers.Durata = durationText(end - start);
  headers.Mosse = String(Math.ceil(gameCore.chess.history().length / 2));
  if (pgnOptions.notes && pgnOptions.notes.trim()) {
    // Tag dedicato: "Annotator" in PGN indica chi ha commentato la partita,
    // non delle note libere.
    headers.Notes = pgnOptions.notes.trim();
  }
  const escaped = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, pgnTagValue(v)]));
  gameCore.setHeaders(escaped);
  return gameCore.pgn();
}

export function listSavedGames() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const games = raw ? JSON.parse(raw) : [];
    return Array.isArray(games) ? games : [];
  } catch {
    return [];
  }
}

function writeSavedGames(games) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    return true;
  } catch {
    return false;
  }
}

export function saveGame({ pgn, label, savedAt = Date.now() }) {
  const games = listSavedGames();
  games.unshift({ id: `${savedAt}-${Math.random().toString(36).slice(2, 8)}`, pgn, label, savedAt });
  return writeSavedGames(games);
}

export function deleteSavedGame(id) {
  const games = listSavedGames().filter((g) => g.id !== id);
  writeSavedGames(games);
}

// --- Importazione ---

// Un file PGN può contenere più partite: una nuova partita comincia quando
// una riga di tag ("[Event ...]") arriva DOPO le mosse della precedente.
export function splitPgnGames(text) {
  const lines = text.replace(/^﻿/, '').split(/\r\n?|\n/);
  const games = [];
  let current = [];
  let seenMoves = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const isTag = /^\[[A-Za-z0-9_]+\s+".*"\]$/.test(trimmed);
    if (isTag && seenMoves) {
      games.push(current.join('\n').trim());
      current = [];
      seenMoves = false;
    }
    if (trimmed && !isTag) seenMoves = true;
    current.push(line);
  }
  const last = current.join('\n').trim();
  if (last) games.push(last);
  return games.filter(Boolean);
}

function labelForImported(chess, index) {
  const h = chess.getHeaders();
  const known = (v) => v && v !== '?' && !/^\?+(\.\?+)*$/.test(v);
  const parts = [];
  if (known(h.White) || known(h.Black)) {
    parts.push(`${known(h.White) ? h.White : '?'} contro ${known(h.Black) ? h.Black : '?'}`);
  }
  if (known(h.Date)) parts.push(h.Date);
  if (known(h.Result) && h.Result !== '*') parts.push(`(${h.Result})`);
  return parts.length ? `Importata: ${parts.join(' ')}` : `Partita importata ${index + 1}`;
}

// Ritorna { imported, failed }: le partite valide vengono aggiunte
// all'archivio, quelle illeggibili contate e scartate.
export function importPgnText(text) {
  const chunks = splitPgnGames(text || '');
  let imported = 0;
  let failed = 0;
  const now = Date.now();
  chunks.forEach((chunk, i) => {
    const chess = new Chess();
    try {
      chess.loadPgn(chunk);
    } catch {
      failed += 1;
      return;
    }
    if (chess.history().length === 0 && Object.keys(chess.getHeaders()).length <= 7) {
      failed += 1;
      return;
    }
    if (saveGame({ pgn: chess.pgn(), label: labelForImported(chess, i), savedAt: now + i })) {
      imported += 1;
    } else {
      failed += 1;
    }
  });
  return { imported, failed };
}
