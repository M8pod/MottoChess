// themes/openings: nomi delle aperture più comuni, per l'annuncio vocale
// "Apertura: Partita italiana" (impostazione "Pronuncia il nome delle
// aperture", richiesta di Roberto del 13/11/2026: per imparare qualcosa
// giocando).
//
// Il riconoscimento è per POSIZIONE, non per sequenza di mosse: così
// un'apertura viene riconosciuta anche se ci si arriva con un ordine di
// mosse diverso (trasposizione). Ogni riga è: mosse dalla posizione
// iniziale, poi il nome in italiano, inglese, spagnolo e francese. Quando
// più righe portano a posizioni successive, vale l'ultima raggiunta: la
// voce dice prima "Partita italiana" e poi, se si prosegue, "Giuoco piano".
import { Chess } from '../vendor/chess.js';
import { getLanguage } from '../i18n/i18n.js';

const LINES = [
  // --- Prime mosse del bianco ---
  ['e4', 'Apertura di pedone di re', "King's Pawn Opening", 'Apertura de peón de rey', 'Ouverture du pion roi'],
  ['d4', 'Apertura di pedone di donna', "Queen's Pawn Opening", 'Apertura de peón de dama', 'Ouverture du pion dame'],
  ['c4', 'Apertura inglese', 'English Opening', 'Apertura inglesa', 'Ouverture anglaise'],
  ['Nf3', 'Apertura Réti', 'Réti Opening', 'Apertura Réti', 'Ouverture Réti'],
  ['f4', 'Apertura Bird', "Bird's Opening", 'Apertura Bird', 'Ouverture Bird'],
  ['b3', 'Apertura Larsen', 'Nimzo-Larsen Attack', 'Ataque Nimzo-Larsen', 'Attaque Nimzo-Larsen'],
  ['g3', 'Apertura con fianchetto di re', "King's Fianchetto Opening", 'Apertura del fianchetto de rey', 'Ouverture du fianchetto roi'],

  // --- 1.e4 e5 ---
  ['e4 e5 Nf3 Nc6 Bc4', 'Partita italiana', 'Italian Game', 'Apertura italiana', 'Partie italienne'],
  ['e4 e5 Nf3 Nc6 Bc4 Bc5', 'Giuoco piano', 'Giuoco Piano', 'Giuoco piano', 'Giuoco piano'],
  ['e4 e5 Nf3 Nc6 Bc4 Bc5 b4', 'Gambetto Evans', 'Evans Gambit', 'Gambito Evans', 'Gambit Evans'],
  ['e4 e5 Nf3 Nc6 Bc4 Nf6', 'Difesa dei due cavalli', 'Two Knights Defense', 'Defensa de los dos caballos', 'Défense des deux cavaliers'],
  ['e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7', 'Attacco Fegatello', 'Fried Liver Attack', 'Ataque Fegatello', 'Attaque Fegatello'],
  ['e4 e5 Nf3 Nc6 Bb5', 'Partita spagnola', 'Ruy Lopez, Spanish Game', 'Apertura española', 'Partie espagnole'],
  ['e4 e5 Nf3 Nc6 Bb5 a6 Bxc6', 'Partita spagnola, variante di cambio', 'Ruy Lopez, Exchange Variation', 'Apertura española, variante del cambio', "Partie espagnole, variante d'échange"],
  ['e4 e5 Nf3 Nc6 Bb5 Nf6', 'Partita spagnola, difesa berlinese', 'Ruy Lopez, Berlin Defense', 'Apertura española, defensa berlinesa', 'Partie espagnole, défense berlinoise'],
  ['e4 e5 Nf3 Nc6 d4', 'Partita scozzese', 'Scotch Game', 'Apertura escocesa', 'Partie écossaise'],
  ['e4 e5 Nf3 Nc6 Nc3', 'Partita dei tre cavalli', 'Three Knights Game', 'Apertura de los tres caballos', 'Partie des trois cavaliers'],
  ['e4 e5 Nf3 Nc6 Nc3 Nf6', 'Partita dei quattro cavalli', 'Four Knights Game', 'Apertura de los cuatro caballos', 'Partie des quatre cavaliers'],
  ['e4 e5 Nf3 Nc6 c3', 'Apertura Ponziani', 'Ponziani Opening', 'Apertura Ponziani', 'Ouverture Ponziani'],
  ['e4 e5 Nf3 Nf6', 'Difesa Petrov', "Petrov's Defense", 'Defensa Petrov', 'Défense Petrov'],
  ['e4 e5 Nf3 d6', 'Difesa Philidor', 'Philidor Defense', 'Defensa Philidor', 'Défense Philidor'],
  ['e4 e5 Nf3 f5', 'Controgambetto lettone', 'Latvian Gambit', 'Gambito letón', 'Contre-gambit letton'],
  ['e4 e5 f4', 'Gambetto di re', "King's Gambit", 'Gambito de rey', 'Gambit du roi'],
  ['e4 e5 f4 exf4', 'Gambetto di re accettato', "King's Gambit Accepted", 'Gambito de rey aceptado', 'Gambit du roi accepté'],
  ['e4 e5 Nc3', 'Partita viennese', 'Vienna Game', 'Apertura vienesa', 'Partie viennoise'],
  ['e4 e5 Bc4', "Apertura d'alfiere", "Bishop's Opening", 'Apertura de alfil', 'Ouverture du fou'],
  ['e4 e5 d4 exd4 c3', 'Gambetto danese', 'Danish Gambit', 'Gambito danés', 'Gambit danois'],
  ['e4 e5 d4 exd4 Qxd4', 'Partita del centro', 'Center Game', 'Apertura del centro', 'Partie du centre'],
  ['e4 e5 Qh5', 'Attacco Parham', 'Wayward Queen Attack', 'Ataque Parham', 'Attaque Parham'],
  ['e4 e5 Bc4 Nc6 Qh5 Nf6 Qxf7#', 'Matto del barbiere', "Scholar's Mate", 'Mate del pastor', 'Coup du berger'],

  // --- Difesa siciliana ---
  ['e4 c5', 'Difesa siciliana', 'Sicilian Defense', 'Defensa siciliana', 'Défense sicilienne'],
  ['e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6', 'Siciliana, variante Najdorf', 'Sicilian, Najdorf Variation', 'Siciliana, variante Najdorf', 'Sicilienne, variante Najdorf'],
  ['e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6', 'Siciliana, variante del dragone', 'Sicilian, Dragon Variation', 'Siciliana, variante del dragón', 'Sicilienne, variante du dragon'],
  ['e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6', 'Siciliana, variante Scheveningen', 'Sicilian, Scheveningen Variation', 'Siciliana, variante Scheveningen', 'Sicilienne, variante Scheveningen'],
  ['e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5', 'Siciliana, variante Sveshnikov', 'Sicilian, Sveshnikov Variation', 'Siciliana, variante Sveshnikov', 'Sicilienne, variante Sveshnikov'],
  ['e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6', 'Siciliana, dragone accelerato', 'Sicilian, Accelerated Dragon', 'Siciliana, dragón acelerado', 'Sicilienne, dragon accéléré'],
  ['e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6', 'Siciliana, variante Kan', 'Sicilian, Kan Variation', 'Siciliana, variante Kan', 'Sicilienne, variante Kan'],
  ['e4 c5 Nf3 Nc6 Bb5', 'Siciliana, variante Rossolimo', 'Sicilian, Rossolimo Variation', 'Siciliana, variante Rossolimo', 'Sicilienne, variante Rossolimo'],
  ['e4 c5 c3', 'Siciliana, variante Alapin', 'Sicilian, Alapin Variation', 'Siciliana, variante Alapin', 'Sicilienne, variante Alapin'],
  ['e4 c5 Nc3', 'Siciliana chiusa', 'Closed Sicilian', 'Siciliana cerrada', 'Sicilienne fermée'],
  ['e4 c5 d4 cxd4 c3', 'Gambetto Morra', 'Smith-Morra Gambit', 'Gambito Smith-Morra', 'Gambit Smith-Morra'],

  // --- Altre difese contro 1.e4 ---
  ['e4 e6', 'Difesa francese', 'French Defense', 'Defensa francesa', 'Défense française'],
  ['e4 e6 d4 d5 Nc3 Bb4', 'Francese, variante Winawer', 'French, Winawer Variation', 'Francesa, variante Winawer', 'Française, variante Winawer'],
  ['e4 e6 d4 d5 Nc3 Nf6', 'Francese, variante classica', 'French, Classical Variation', 'Francesa, variante clásica', 'Française, variante classique'],
  ['e4 e6 d4 d5 e5', 'Francese, variante di spinta', 'French, Advance Variation', 'Francesa, variante del avance', "Française, variante d'avance"],
  ['e4 e6 d4 d5 exd5', 'Francese, variante di cambio', 'French, Exchange Variation', 'Francesa, variante del cambio', "Française, variante d'échange"],
  ['e4 e6 d4 d5 Nd2', 'Francese, variante Tarrasch', 'French, Tarrasch Variation', 'Francesa, variante Tarrasch', 'Française, variante Tarrasch'],
  ['e4 c6', 'Difesa Caro-Kann', 'Caro-Kann Defense', 'Defensa Caro-Kann', 'Défense Caro-Kann'],
  ['e4 c6 d4 d5 e5', 'Caro-Kann, variante di spinta', 'Caro-Kann, Advance Variation', 'Caro-Kann, variante del avance', "Caro-Kann, variante d'avance"],
  ['e4 c6 d4 d5 exd5 cxd5', 'Caro-Kann, variante di cambio', 'Caro-Kann, Exchange Variation', 'Caro-Kann, variante del cambio', "Caro-Kann, variante d'échange"],
  ['e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5', 'Caro-Kann, variante classica', 'Caro-Kann, Classical Variation', 'Caro-Kann, variante clásica', 'Caro-Kann, variante classique'],
  ['e4 d5', 'Difesa scandinava', 'Scandinavian Defense', 'Defensa escandinava', 'Défense scandinave'],
  ['e4 Nf6', 'Difesa Alekhine', 'Alekhine Defense', 'Defensa Alekhine', 'Défense Alekhine'],
  ['e4 d6', 'Difesa Pirc', 'Pirc Defense', 'Defensa Pirc', 'Défense Pirc'],
  ['e4 g6', 'Difesa moderna', 'Modern Defense', 'Defensa moderna', 'Défense moderne'],
  ['e4 Nc6', 'Difesa Nimzowitsch', 'Nimzowitsch Defense', 'Defensa Nimzowitsch', 'Défense Nimzowitsch'],
  ['e4 b6', 'Difesa Owen', 'Owen Defense', 'Defensa Owen', 'Défense Owen'],

  // --- 1.d4 d5 ---
  ['d4 d5 c4', 'Gambetto di donna', "Queen's Gambit", 'Gambito de dama', 'Gambit dame'],
  ['d4 d5 c4 dxc4', 'Gambetto di donna accettato', "Queen's Gambit Accepted", 'Gambito de dama aceptado', 'Gambit dame accepté'],
  ['d4 d5 c4 e6', 'Gambetto di donna rifiutato', "Queen's Gambit Declined", 'Gambito de dama rehusado', 'Gambit dame refusé'],
  ['d4 d5 c4 c6', 'Difesa slava', 'Slav Defense', 'Defensa eslava', 'Défense slave'],
  ['d4 d5 c4 c6 Nf3 Nf6 Nc3 e6', 'Difesa semi-slava', 'Semi-Slav Defense', 'Defensa semieslava', 'Défense semi-slave'],
  ['d4 d5 c4 e5', 'Controgambetto Albin', 'Albin Countergambit', 'Contragambito Albin', 'Contre-gambit Albin'],
  ['d4 d5 c4 Nc6', 'Difesa Chigorin', 'Chigorin Defense', 'Defensa Chigorin', 'Défense Tchigorine'],
  ['d4 d5 Bf4', 'Sistema Londra', 'London System', 'Sistema Londres', 'Système de Londres'],
  ['d4 d5 Nf3 Nf6 Bf4', 'Sistema Londra', 'London System', 'Sistema Londres', 'Système de Londres'],
  ['d4 d5 e4', 'Gambetto Blackmar-Diemer', 'Blackmar-Diemer Gambit', 'Gambito Blackmar-Diemer', 'Gambit Blackmar-Diemer'],

  // --- 1.d4 Nf6 e altre ---
  ['d4 Nf6', 'Difesa indiana', 'Indian Defense', 'Defensa india', 'Défense indienne'],
  ['d4 Nf6 Bf4', 'Sistema Londra', 'London System', 'Sistema Londres', 'Système de Londres'],
  ['d4 Nf6 Bg5', 'Attacco Trompowsky', 'Trompowsky Attack', 'Ataque Trompowsky', 'Attaque Trompowsky'],
  ['d4 Nf6 c4 g6 Nc3 Bg7', 'Difesa est-indiana', "King's Indian Defense", 'Defensa india de rey', 'Défense est-indienne'],
  ['d4 Nf6 c4 g6 Nc3 d5', 'Difesa Grünfeld', 'Grünfeld Defense', 'Defensa Grünfeld', 'Défense Grünfeld'],
  ['d4 Nf6 c4 e6 Nc3 Bb4', 'Difesa nimzo-indiana', 'Nimzo-Indian Defense', 'Defensa nimzoindia', 'Défense nimzo-indienne'],
  ['d4 Nf6 c4 e6 Nf3 b6', 'Difesa ovest-indiana', "Queen's Indian Defense", 'Defensa india de dama', 'Défense ouest-indienne'],
  ['d4 Nf6 c4 e6 Nf3 Bb4+', 'Difesa bogo-indiana', 'Bogo-Indian Defense', 'Defensa bogoindia', 'Défense bogo-indienne'],
  ['d4 Nf6 c4 e6 g3 d5', 'Apertura catalana', 'Catalan Opening', 'Apertura catalana', 'Ouverture catalane'],
  ['d4 Nf6 c4 c5 d5', 'Difesa Benoni', 'Benoni Defense', 'Defensa Benoni', 'Défense Benoni'],
  ['d4 Nf6 c4 c5 d5 b5', 'Gambetto Benko', 'Benko Gambit', 'Gambito Benko', 'Gambit Benko'],
  ['d4 Nf6 c4 e5', 'Gambetto Budapest', 'Budapest Gambit', 'Gambito Budapest', 'Gambit de Budapest'],
  ['d4 f5', 'Difesa olandese', 'Dutch Defense', 'Defensa holandesa', 'Défense hollandaise'],
  ['d4 e5', 'Gambetto Englund', 'Englund Gambit', 'Gambito Englund', 'Gambit Englund'],

  // --- Apertura inglese ---
  ['c4 e5', 'Inglese, siciliana rovesciata', 'English, Reversed Sicilian', 'Inglesa, siciliana invertida', 'Anglaise, sicilienne inversée'],
  ['c4 c5', 'Inglese simmetrica', 'English, Symmetrical Variation', 'Inglesa simétrica', 'Anglaise symétrique'],
  ['c4 Nf6', 'Inglese, difesa anglo-indiana', 'English, Anglo-Indian Defense', 'Inglesa, defensa angloindia', 'Anglaise, défense anglo-indienne'],
];

const LANG_INDEX = { it: 1, en: 2, es: 3, fr: 4 };

// Chiave di posizione: disposizione dei pezzi, tratto e arrocchi (la casella
// en passant no, così le trasposizioni coincidono).
function positionKey(fen) {
  return fen.split(' ').slice(0, 3).join(' ');
}

let byPosition = null;

function buildIndex() {
  byPosition = new Map();
  LINES.forEach((line) => {
    const chess = new Chess();
    try {
      line[0].split(' ').forEach((san) => chess.move(san));
    } catch {
      return; // riga scritta male: si ignora, il gioco non si rompe
    }
    byPosition.set(positionKey(chess.fen()), line);
  });
}

// Nome dell'apertura per la posizione data (FEN), nella lingua attuale, o
// null se la posizione non è fra quelle conosciute.
export function openingNameForFen(fen) {
  if (!byPosition) buildIndex();
  const line = byPosition.get(positionKey(fen));
  return line ? line[LANG_INDEX[getLanguage()] || 1] : null;
}

// Ultima apertura riconosciuta lungo una partita (lista di FEN dopo ogni
// semimossa): per il comando "apertura" e per la ripresa di una partita.
export function lastOpeningName(fens) {
  let name = null;
  fens.forEach((fen) => {
    const n = openingNameForFen(fen);
    if (n) name = n;
  });
  return name;
}

// Oltre questa semimossa non si cercano più aperture.
export const OPENING_MAX_PLY = 24;

// Solo per le prove: quante righe sono state lette correttamente.
export function _checkLines() {
  if (!byPosition) buildIndex();
  return { lines: LINES.length, positions: byPosition.size };
}
