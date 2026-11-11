// Colori effettivi di scacchiera e pezzi per una partita o una riproduzione:
// unico punto che mette insieme palette, intensità scelte in Impostazioni e
// colori fissi dei set tematici.
import {
  LIGHT_SQUARE_COLORS,
  DARK_SQUARE_COLORS,
  PIECE_SET_SQUARE_COLORS,
  DEFAULT_SETTINGS,
} from '../session/settings.js';
import { applyIntensity, pieceFillFromSquareColor } from './color-utils.js';

// Solo colori caselle, dalle impostazioni (scacchiera classica).
export function chosenSquareColors(settings) {
  const lightBase =
    LIGHT_SQUARE_COLORS[settings.lightSquareColorName] ||
    LIGHT_SQUARE_COLORS[DEFAULT_SETTINGS.lightSquareColorName];
  const darkBase =
    DARK_SQUARE_COLORS[settings.darkSquareColorName] ||
    DARK_SQUARE_COLORS[DEFAULT_SETTINGS.darkSquareColorName];
  return {
    lightHex: applyIntensity(lightBase, settings.lightSquareIntensity, 'light'),
    darkHex: applyIntensity(darkBase, settings.darkSquareIntensity, 'dark'),
  };
}

export function boardColorsFor(settings, pieceSet) {
  // Un set con pezzi a colori fissi (Judo, Cani vs Gatti) impone i propri
  // colori casella: quelli scelti in Impostazioni valgono per i set
  // ricolorabili.
  const setColors = PIECE_SET_SQUARE_COLORS[pieceSet];
  const { lightHex, darkHex } = setColors
    ? { lightHex: setColors.light, darkHex: setColors.dark }
    : chosenSquareColors(settings);
  return {
    lightHex,
    darkHex,
    pieceColors: {
      w: pieceFillFromSquareColor(lightHex, 'w'),
      b: pieceFillFromSquareColor(darkHex, 'b'),
    },
  };
}
