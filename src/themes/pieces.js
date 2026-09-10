// Set pezzi disponibili.
//
// - "classico" (Cburnett/Lichess, GPLv2+): SVG vettoriali, ricolorati in base
//   al colore delle caselle scelto in Impostazioni.
// - "judo": illustrazioni raster (PNG con trasparenza) con judogi bianco e blu
//   fissi. Non ricolorabili: i colori sono parte dell'identità del set, come
//   nelle competizioni.
// - "cani-gatti": set a fazioni scelte dal giocatore (vedi themes/factions.js).
//   I due schieramenti sono due specie, non due colori, quindi i file sono
//   nominati per FAZIONE (gattiP.png, caniK.png...) e non per colore: gli
//   stessi dodici disegni servono sia quando i gatti giocano col bianco sia
//   quando giocano col nero.
const PIECE_SETS = {
  classico: { base: 'assets/pieces/classico-cburnett/', ext: 'svg', recolorable: true },
  judo: { base: 'assets/pieces/judo/', ext: 'png', recolorable: false },
  'cani-gatti': {
    base: 'assets/pieces/cani-gatti/',
    ext: 'png',
    recolorable: false,
    byFaction: true,
    // Finché i dodici disegni non sono nella cartella, la scacchiera mostra i
    // pezzi classici: così tutto il resto del set (scelta della fazione,
    // colore, orientamento, suoni) è già giocabile e collaudabile. Mettere
    // true quando i PNG ci sono — è l'unica riga da cambiare.
    artReady: false,
  },
};

const FILE_LETTER = { p: 'P', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };

const templateCache = new Map();

function setConfig(setName) {
  return PIECE_SETS[setName] || PIECE_SETS.classico;
}

// Un set i cui disegni non sono ancora arrivati ricade sul classico: il set
// resta selezionabile e giocabile, con i pezzi classici come segnaposto.
export function hasPlaceholderArt(setName) {
  return setConfig(setName).artReady === false;
}

function drawnSetName(setName) {
  return hasPlaceholderArt(setName) ? 'classico' : setName;
}

// faction: nome della fazione che occupa quel colore in questa partita
// (solo per i set a fazioni, vedi themes/factions.js).
function pieceUrl(setName, color, type, faction) {
  const { base, ext, byFaction } = setConfig(setName);
  const side = byFaction && faction ? faction : color;
  return `${base}${side}${FILE_LETTER[type]}.${ext}`;
}

async function loadTemplate(setName, color, type) {
  const key = `${setName}${color}${type}`;
  if (templateCache.has(key)) return templateCache.get(key);
  const res = await fetch(pieceUrl(setName, color, type));
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const template = doc.documentElement;
  templateCache.set(key, template);
  return template;
}

// Ritorna l'elemento pronto da inserire nel DOM per un pezzo.
//
// Nei set ricolorabili è un <svg> con il fill del corpo pezzo sostituito da
// fillHex; bordo (stroke) e dettagli decorativi (es. occhio del cavallo)
// restano invariati. Nei set raster è una <img> con i colori originali.
export async function createPieceElement(color, type, fillHex, setName = 'classico', faction = null) {
  const drawnSet = drawnSetName(setName);
  if (!setConfig(drawnSet).recolorable) {
    const img = document.createElement('img');
    img.src = pieceUrl(drawnSet, color, type, faction);
    img.alt = '';
    img.className = 'piece-svg';
    img.setAttribute('aria-hidden', 'true');
    img.draggable = false;
    return img;
  }

  const template = await loadTemplate(drawnSet, color, type);
  const svg = document.importNode(template, true);
  // Fallback ereditato: alcuni path del set Cburnett (es. pedone, dama e
  // torre nere) non hanno un attributo fill proprio e prendono il nero di
  // default SVG. Impostandolo sulla radice, qualunque path privo di fill
  // esplicito lo eredita; i path con fill già esplicito (bordi "none",
  // dettagli decorativi come l'occhio del cavallo) non vengono toccati.
  svg.setAttribute('fill', fillHex);
  const baseFills = color === 'w' ? ['#fff', '#ffffff'] : ['#000', '#000000'];
  for (const baseFill of baseFills) {
    svg.querySelectorAll(`[fill="${baseFill}"]`).forEach((el) => {
      el.setAttribute('fill', fillHex);
    });
  }
  svg.classList.add('piece-svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  return svg;
}
