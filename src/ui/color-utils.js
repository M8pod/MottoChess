// Utility colore: contrasto WCAG e derivazione tonalità pezzi.

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(hexA, hexB) {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// Tonalità del pezzo leggermente diversa dal colore-casella: più chiara per i
// pezzi bianchi, più scura per i pezzi neri, così da non fondersi con la
// casella scelta mantenendo la stessa "famiglia" di colore.
export function pieceFillFromSquareColor(squareHex, pieceColor) {
  const { r, g, b } = hexToRgb(squareHex);
  const amount = pieceColor === 'w' ? 0.55 : 0.4;
  const target = pieceColor === 'w' ? 255 : 0;
  const blend = (c) => c + (target - c) * amount;
  return rgbToHex({ r: blend(r), g: blend(g), b: blend(b) });
}
