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

function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h / 6, s, l };
}

function hslToRgb({ h, s, l }) {
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 };
  const hue = (p, q, t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return { r: hue(p, q, h + 1 / 3) * 255, g: hue(p, q, h) * 255, b: hue(p, q, h - 1 / 3) * 255 };
}

// Intensità di un colore casella (richiesta dei tester ipovedenti,
// 11/11/2026). intensity: 0-100, 50 = colore della palette invariato.
//  - caselle chiare: sotto 50 il colore si schiarisce verso il bianco
//    (più tenue), sopra 50 diventa più carico e un po' più scuro, ma senza
//    mai smettere di essere un colore chiaro;
//  - caselle scure: sopra 50 il colore diventa più profondo (più scuro),
//    sotto 50 si schiarisce, ma senza mai diventare un colore chiaro.
// Così la regola "chiare chiare, scure scure" vale a qualunque intensità.
// Limiti di luminanza che l'intensità non può superare: una casella chiara
// resta sempre abbastanza chiara e una scura abbastanza scura da garantire
// un contrasto di almeno 3:1 fra qualunque coppia.
const LIGHT_MIN_LUMINANCE = 0.47;
const DARK_MAX_LUMINANCE = 0.11;

export function applyIntensity(hex, intensity, kind) {
  const value = Number.isFinite(Number(intensity)) ? Number(intensity) : 50;
  const t = Math.max(-1, Math.min(1, (value - 50) / 50));
  if (t === 0) return hex.toUpperCase();
  const hsl = rgbToHsl(hexToRgb(hex));
  let { s, l } = hsl;
  if (kind === 'light') {
    if (t < 0) {
      l += (1 - l) * -t * 0.85;
      s *= 1 + t * 0.3;
    } else {
      l -= Math.max(0, l - 0.6) * t * 0.85;
      s = Math.min(1, s * (1 + t * 0.6));
    }
  } else if (t > 0) {
    l *= 1 - t * 0.6;
    s = Math.min(1, s * (1 + t * 0.3));
  } else {
    l += Math.max(0, 0.45 - l) * -t * 0.85;
  }
  const make = (lightness) => rgbToHex(hslToRgb({ h: hsl.h, s, l: lightness }));
  // Se si è oltrepassato il limite, si torna indietro sulla luminosità fino
  // al primo valore accettabile.
  let result = make(l);
  if (kind === 'light') {
    while (relativeLuminance(result) < LIGHT_MIN_LUMINANCE && l < 1) {
      l = Math.min(1, l + 0.01);
      result = make(l);
    }
  } else {
    while (relativeLuminance(result) > DARK_MAX_LUMINANCE && l > 0) {
      l = Math.max(0, l - 0.01);
      result = make(l);
    }
  }
  return result;
}
