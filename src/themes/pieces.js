// Set pezzi disponibili.
//
// - "classico" (Cburnett/Lichess, GPLv2+): SVG vettoriali, ricolorati in base
//   al colore delle caselle scelto in Impostazioni.
// - "judo": illustrazioni raster (PNG con trasparenza) con judogi bianco e blu
//   fissi. Non ricolorabili: i colori sono parte dell'identità del set, come
//   nelle competizioni.
const PIECE_SETS = {
  classico: { base: 'assets/pieces/classico-cburnett/', ext: 'svg', recolorable: true },
  judo: { base: 'assets/pieces/judo/', ext: 'png', recolorable: false },
};

const FILE_LETTER = { p: 'P', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };

const templateCache = new Map();

function setConfig(setName) {
  return PIECE_SETS[setName] || PIECE_SETS.classico;
}

function pieceUrl(setName, color, type) {
  const { base, ext } = setConfig(setName);
  return `${base}${color}${FILE_LETTER[type]}.${ext}`;
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
export async function createPieceElement(color, type, fillHex, setName = 'classico') {
  if (!setConfig(setName).recolorable) {
    const img = document.createElement('img');
    img.src = pieceUrl(setName, color, type);
    img.alt = '';
    img.className = 'piece-svg';
    img.setAttribute('aria-hidden', 'true');
    img.draggable = false;
    return img;
  }

  const template = await loadTemplate(setName, color, type);
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
