// i18n: lingua dell'interfaccia e della voce (inglese aggiunto l'11/11/2026).
//
// Il testo italiano resta scritto nel codice ed è anche la CHIAVE della
// traduzione: t('Torna al menu') restituisce la frase così com'è in italiano
// e la sua traduzione nelle altre lingue (vedi en.js). Una frase senza
// traduzione resta in italiano invece di sparire: l'app non si rompe mai.
//
// Parametri fra graffe: t('Mossa {n}, {side}', { n: 3, side: 'bianco' }).
// Una traduzione può essere anche una funzione (params) => testo, per
// plurali e accordi che non si risolvono con una sostituzione.
import EN from './en.js';
import ES from './es.js';
import FR from './fr.js';

const DICTIONARIES = { en: EN, es: ES, fr: FR };

export const LANGUAGES = [
  { value: 'it', label: 'Italiano' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
];

let current = 'it';

// Lingua proposta al primo avvio: quella del dispositivo se l'app la parla
// (italiano, spagnolo, francese), altrimenti inglese.
export function detectLanguage() {
  try {
    const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    const first = String(langs[0] || '').toLowerCase().slice(0, 2);
    if (first === 'it' || first === 'es' || first === 'fr') return first;
    return 'en';
  } catch {
    return 'it';
  }
}

export function isSupportedLanguage(lang) {
  return LANGUAGES.some((l) => l.value === lang);
}

// Cambia lingua e la dichiara alla pagina: è l'attributo lang che fa usare
// allo screen reader la voce giusta (inglese o italiana).
export function setLanguage(lang) {
  current = isSupportedLanguage(lang) ? lang : 'it';
  try {
    document.documentElement.lang = current;
  } catch {
    // fuori dal browser (prove da riga di comando)
  }
}

export function getLanguage() {
  return current;
}

function fill(text, params) {
  return text.replace(/\{(\w+)\}/g, (m, k) => (params[k] === undefined ? m : String(params[k])));
}

export function t(key, params = {}) {
  const dict = DICTIONARIES[current];
  const value = dict && Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key;
  if (typeof value === 'function') return value(params);
  return fill(value, params);
}

// Tutte le versioni di una frase, in ogni lingua: per riconoscere testi
// salvati in una lingua diversa da quella attuale (es. il nome del set nei
// PGN).
export function allTranslations(key) {
  const out = [key];
  Object.values(DICTIONARIES).forEach((dict) => {
    if (typeof dict[key] === 'string') out.push(dict[key]);
  });
  return out;
}
