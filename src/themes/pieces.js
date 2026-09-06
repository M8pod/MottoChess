// Set pezzi Classico (Cburnett/Lichess, GPLv2+): SVG vettoriali ricolorabili
// via fill/stroke. v1 include solo questo set (vedi "Scope v1" nella spec).
const PIECES_BASE = 'assets/pieces/classico-cburnett/';
const FILE_LETTER = { p: 'P', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };

const templateCache = new Map();

async function loadTemplate(color, type) {
  const key = `${color}${type}`;
  if (templateCache.has(key)) return templateCache.get(key);
  const url = `${PIECES_BASE}${color}${FILE_LETTER[type]}.svg`;
  const res = await fetch(url);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const template = doc.documentElement;
  templateCache.set(key, template);
  return template;
}

// Ritorna un <svg> pronto da inserire nel DOM, con il fill del corpo pezzo
// sostituito da fillHex. Bordo (stroke) e dettagli decorativi (es. occhio del
// cavallo) restano invariati: si sostituisce SOLO il fill uguale al colore
// "base" del pezzo (bianco o nero) nell'SVG originale.
export async function createPieceElement(color, type, fillHex) {
  const template = await loadTemplate(color, type);
  const svg = document.importNode(template, true);
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
