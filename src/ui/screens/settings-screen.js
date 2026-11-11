import {
  LIGHT_SQUARE_COLORS,
  DARK_SQUARE_COLORS,
  DEFAULT_SETTINGS,
  DEFAULT_INTENSITY,
} from '../../session/settings.js';
import { chosenSquareColors } from '../board-colors.js';
import { t, LANGUAGES } from '../../i18n/i18n.js';
import { AmbientPlayer } from '../ambient-player.js';
import { contrastRatio, pieceFillFromSquareColor } from '../color-utils.js';
import { PIECE_SET_CHOICES } from '../../themes/pieces.js';
import { setLastConfigPieceSet } from '../../session/options.js';

function percentText(value) {
  return t('{n} per cento', { n: Math.round(Number(value) * 100) });
}

function fieldRow(labelText, inputEl) {
  const div = document.createElement('div');
  div.className = 'field';
  const label = document.createElement('label');
  label.textContent = labelText + ' ';
  label.appendChild(inputEl);
  div.appendChild(label);
  return div;
}

export function renderSettingsScreen(container, ctx, payload) {
  const { sound, navigate, saveSettings } = ctx;
  let settings = structuredClone(ctx.settings);

  function persist() {
    saveSettings(structuredClone(settings));
  }

  container.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'back-link';
  backBtn.textContent = `← ${t('Torna al menu')}`;
  backBtn.addEventListener('click', () => navigate('home'));
  container.appendChild(backBtn);

  const h2 = document.createElement('h2');
  h2.textContent = t('Impostazioni');
  container.appendChild(h2);

  // --- Accessibilità ---
  const accessFs = document.createElement('fieldset');
  accessFs.innerHTML = `<legend>${t('Accessibilità')}</legend>`;

  const themeSoundsLabel = document.createElement('label');
  const themeSoundsInput = document.createElement('input');
  themeSoundsInput.type = 'checkbox';
  themeSoundsInput.checked = settings.themeSoundsEnabled;
  themeSoundsInput.addEventListener('change', () => {
    settings.themeSoundsEnabled = themeSoundsInput.checked;
    persist();
  });
  themeSoundsLabel.append(themeSoundsInput, ` ${t('Suoni set tematici attivi')}`);
  const themeSoundsHint = document.createElement('p');
  themeSoundsHint.id = 'theme-sounds-hint';
  themeSoundsHint.className = 'field-hint';
  themeSoundsHint.textContent = t(
    'Se disattivati, ogni set usa i suoni neutri del set classico: i suoni di gioco non vengono mai spenti.'
  );
  themeSoundsInput.setAttribute('aria-describedby', themeSoundsHint.id);
  accessFs.append(themeSoundsLabel, themeSoundsHint);

  // Gruppi di opzioni come <fieldset>/<legend>: così lo screen reader
  // annuncia il nome del gruppo entrando nei radio/checkbox (prima era un
  // semplice <div> di testo, non collegato alle opzioni).
  const narrationDiv = document.createElement('fieldset');
  narrationDiv.className = 'field nested-fieldset';
  const narrationLegend = document.createElement('legend');
  narrationLegend.textContent = t('Stile narrazione');
  narrationDiv.appendChild(narrationLegend);
  ['compatto', 'espanso'].forEach((style) => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'narrationStyle';
    radio.value = style;
    radio.checked = settings.narrationStyle === style;
    radio.addEventListener('change', () => {
      settings.narrationStyle = style;
      persist();
    });
    label.append(radio, ` ${style === 'compatto' ? t('Compatto (es. N f3, Q prende c5)') : t('Espanso (es. cavallo in Firenze 3)')}`);
    narrationDiv.appendChild(label);
  });
  accessFs.appendChild(narrationDiv);

  const timeNoticesDiv = document.createElement('fieldset');
  timeNoticesDiv.className = 'field nested-fieldset';
  const timeNoticesLegend = document.createElement('legend');
  timeNoticesLegend.textContent = t('Notifiche vocali tempo (solo partite a tempo)');
  timeNoticesDiv.appendChild(timeNoticesLegend);
  [
    ['timeWarning10Enabled', 'Avviso al 10% del tempo residuo'],
    ['timeWarning5Enabled', 'Avviso al 5% del tempo residuo'],
    ['timeElapsedEvery10MinEnabled', 'Annuncio tempo trascorso ogni 10 minuti (partite oltre 20 minuti)'],
  ].forEach(([key, text]) => {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = settings[key];
    cb.addEventListener('change', () => {
      settings[key] = cb.checked;
      persist();
    });
    label.append(cb, ` ${t(text)}`);
    timeNoticesDiv.appendChild(label);
  });
  accessFs.appendChild(timeNoticesDiv);
  container.appendChild(accessFs);

  // --- Audio ---
  const audioFs = document.createElement('fieldset');
  audioFs.innerHTML = `<legend>${t('Audio')}</legend>`;
  // Il valore viene letto in percentuale (aria-valuetext) invece di "0,9",
  // ed è scritto anche accanto al cursore. Al rilascio si sente un suono di
  // prova al nuovo volume, così chi non vede sa subito com'è.
  const ambientSample = new AmbientPlayer();
  let ambientSampleTimer = null;
  [
    ['volumeGame', 'Volume suoni di gioco', () => sound.playGame('move', {})],
    ['volumeUi', 'Volume suoni UI/menu', () => sound.playUi('navigation')],
    ['volumeAmbient', 'Volume musica di sottofondo', () => {
      ambientSample.play('newage', settings.volumeAmbient);
      clearTimeout(ambientSampleTimer);
      ambientSampleTimer = setTimeout(() => ambientSample.stop(), 2500);
    }],
  ].forEach(([key, text, preview]) => {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '1';
    input.step = '0.05';
    input.value = String(settings[key]);
    const valueOut = document.createElement('span');
    valueOut.className = 'volume-value';
    valueOut.setAttribute('aria-hidden', 'true');
    const updateValueText = () => {
      input.setAttribute('aria-valuetext', percentText(input.value));
      valueOut.textContent = `${Math.round(Number(input.value) * 100)}%`;
    };
    updateValueText();
    input.addEventListener('input', () => {
      settings[key] = Number(input.value);
      updateValueText();
      persist();
    });
    input.addEventListener('change', preview);
    const row = fieldRow(t(text), input);
    // Fuori dalla <label>: il nome del cursore resta solo "Volume ...", e il
    // valore lo legge lo screen reader da aria-valuetext.
    row.appendChild(valueOut);
    audioFs.appendChild(row);
  });
  container.appendChild(audioFs);

  // --- Grafica scacchiera ---
  // Valgono per la scacchiera classica (e i set ricolorabili): Judo e Cani vs
  // Gatti hanno colori casella propri. Ogni scelta viene salvata subito su
  // questo dispositivo e ritrovata alle aperture successive.
  const boardFs = document.createElement('fieldset');
  boardFs.innerHTML = `<legend>${t('Grafica scacchiera classica')}</legend>`;

  const boardInfo = document.createElement('p');
  boardInfo.className = 'field-hint';
  boardInfo.textContent = t(
    "Le caselle chiare si scelgono fra colori chiari, le scure fra colori scuri. Per ognuna puoi regolare l'intensità. Le scelte vengono salvate su questo dispositivo e restano per le partite successive. I set Judo e Cani vs Gatti usano colori propri."
  );
  boardFs.appendChild(boardInfo);

  function colorSelect(palette, selectedName) {
    const select = document.createElement('select');
    Object.keys(palette).forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = t(name);
      if (name === selectedName) opt.selected = true;
      select.appendChild(opt);
    });
    return select;
  }

  function intensityText(value) {
    const v = Math.round(Number(value));
    if (v === DEFAULT_INTENSITY) return t('normale');
    return v < DEFAULT_INTENSITY ? t('più tenue, {n} per cento', { n: v }) : t('più intensa, {n} per cento', { n: v });
  }

  // Cursore intensità 0-100 a passi di 10 (50 = colore della palette).
  function intensityRow(labelText, key) {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.step = '10';
    input.value = String(settings[key] ?? DEFAULT_INTENSITY);
    const valueOut = document.createElement('span');
    valueOut.className = 'volume-value';
    valueOut.setAttribute('aria-hidden', 'true');
    const refresh = () => {
      input.setAttribute('aria-valuetext', intensityText(input.value));
      valueOut.textContent = intensityText(input.value);
    };
    refresh();
    input.addEventListener('input', () => {
      settings[key] = Number(input.value);
      refresh();
      persist();
      updatePreview();
    });
    const row = fieldRow(labelText, input);
    row.appendChild(valueOut);
    return { row, input, refresh };
  }

  const lightSelect = colorSelect(LIGHT_SQUARE_COLORS, settings.lightSquareColorName);
  boardFs.appendChild(fieldRow(t('Colore caselle chiare'), lightSelect));
  const lightIntensity = intensityRow(t('Intensità caselle chiare'), 'lightSquareIntensity');
  boardFs.appendChild(lightIntensity.row);

  const darkSelect = colorSelect(DARK_SQUARE_COLORS, settings.darkSquareColorName);
  boardFs.appendChild(fieldRow(t('Colore caselle scure'), darkSelect));
  const darkIntensity = intensityRow(t('Intensità caselle scure'), 'darkSquareIntensity');
  boardFs.appendChild(darkIntensity.row);

  const preview = document.createElement('div');
  preview.className = 'color-swatch-preview';
  const lightSwatch = document.createElement('div');
  lightSwatch.className = 'swatch';
  const darkSwatch = document.createElement('div');
  darkSwatch.className = 'swatch';
  const whitePieceSwatch = document.createElement('div');
  whitePieceSwatch.className = 'swatch';
  const blackPieceSwatch = document.createElement('div');
  blackPieceSwatch.className = 'swatch';
  const contrastText = document.createElement('span');
  // Regione "status": cambiando colore, lo screen reader annuncia il nuovo
  // contrasto e l'eventuale avviso senza dover andare a cercarlo.
  contrastText.setAttribute('role', 'status');
  preview.append(lightSwatch, darkSwatch, whitePieceSwatch, blackPieceSwatch, contrastText);
  boardFs.appendChild(preview);

  function updatePreview() {
    const { lightHex, darkHex } = chosenSquareColors(settings);
    lightSwatch.style.background = lightHex;
    darkSwatch.style.background = darkHex;
    whitePieceSwatch.style.background = pieceFillFromSquareColor(lightHex, 'w');
    blackPieceSwatch.style.background = pieceFillFromSquareColor(darkHex, 'b');
    const ratio = contrastRatio(lightHex, darkHex);
    let text = t('Contrasto caselle: {ratio}:1', { ratio: ratio.toFixed(2) });
    if (ratio < 3) text += ` — ${t('contrasto insufficiente, scegli colori più distinti')}`;
    // Riscritto solo se cambia: muovendo il cursore dell'intensità lo
    // screen reader non deve ripetere lo stesso annuncio a ogni passo.
    if (contrastText.textContent !== text) contrastText.textContent = text;
    contrastText.className = ratio >= 3 ? 'contrast-ok' : 'contrast-warning';
  }
  lightSelect.addEventListener('change', () => {
    settings.lightSquareColorName = lightSelect.value;
    persist();
    updatePreview();
  });
  darkSelect.addEventListener('change', () => {
    settings.darkSquareColorName = darkSelect.value;
    persist();
    updatePreview();
  });

  const resetColorsBtn = document.createElement('button');
  resetColorsBtn.type = 'button';
  resetColorsBtn.textContent = t('Ripristina colori predefiniti');
  resetColorsBtn.addEventListener('click', () => {
    settings.lightSquareColorName = DEFAULT_SETTINGS.lightSquareColorName;
    settings.darkSquareColorName = DEFAULT_SETTINGS.darkSquareColorName;
    settings.lightSquareIntensity = DEFAULT_INTENSITY;
    settings.darkSquareIntensity = DEFAULT_INTENSITY;
    persist();
    lightSelect.value = settings.lightSquareColorName;
    darkSelect.value = settings.darkSquareColorName;
    lightIntensity.input.value = String(DEFAULT_INTENSITY);
    darkIntensity.input.value = String(DEFAULT_INTENSITY);
    lightIntensity.refresh();
    darkIntensity.refresh();
    updatePreview();
    ctx.narrator.announce(t('Colori predefiniti ripristinati: verde salvia e viola, intensità normale.'));
  });
  boardFs.appendChild(resetColorsBtn);

  updatePreview();
  container.appendChild(boardFs);

  // --- Set pezzi preferito ---
  const setFs = document.createElement('fieldset');
  setFs.innerHTML = `<legend>${t('Set pezzi preferito')}</legend>`;
  const setSelect = document.createElement('select');
  PIECE_SET_CHOICES.filter((c) => c.available).forEach((choice) => {
    const o = document.createElement('option');
    o.value = choice.value;
    o.textContent = t(choice.label);
    if (choice.value === settings.defaultPieceSet) o.selected = true;
    setSelect.appendChild(o);
  });
  setSelect.addEventListener('change', () => {
    settings.defaultPieceSet = setSelect.value;
    persist();
    setLastConfigPieceSet(setSelect.value, setSelect.value);
  });
  setFs.appendChild(fieldRow(t('Set pezzi'), setSelect));
  const setHint = document.createElement('p');
  setHint.id = 'default-set-hint';
  setHint.className = 'field-hint';
  setHint.textContent = t(
    'Usato da "Gioca subito" e preselezionato in Opzioni partita, finché non ne scegli un altro lì.'
  );
  setSelect.setAttribute('aria-describedby', setHint.id);
  setFs.appendChild(setHint);
  container.appendChild(setFs);

  // --- Lingua ---
  const langFs = document.createElement('fieldset');
  // Lingua di interfaccia e voce. Cambiandola la schermata si ricostruisce
  // nella nuova lingua, e il focus torna su questo menu.
  langFs.innerHTML = '<legend>Lingua / Language / Idioma / Langue</legend>';
  const langSelect = document.createElement('select');
  LANGUAGES.forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    opt.lang = value;
    langSelect.appendChild(opt);
  });
  langSelect.value = settings.language;
  langSelect.addEventListener('change', () => {
    settings.language = langSelect.value;
    persist();
    navigate('settings', { focusLanguage: true });
  });
  langFs.appendChild(fieldRow('Lingua / Language / Idioma / Langue', langSelect));
  container.appendChild(langFs);
  if (payload && payload.focusLanguage) {
    setTimeout(() => {
      langSelect.focus();
      ctx.narrator.announce(t('Lingua cambiata: italiano.'));
    }, 0);
  }

  // --- PGN ---
  const pgnFs = document.createElement('fieldset');
  // Dall'11/11/2026 l'intestazione delle partite salvate è sempre completa
  // (data, set, colore e squadra di ciascuno, avversario, esito, durata):
  // resta da scegliere solo un'eventuale nota libera.
  pgnFs.innerHTML = `<legend>${t('Partite salvate (PGN)')}</legend>`;
  const pgnInfo = document.createElement('p');
  pgnInfo.textContent = t(
    "Ogni partita salvata riporta sempre data e ora, set di pezzi, con quale colore e quale squadra giocavi, l'avversario, l'esito e la durata. Qui puoi aggiungere una nota che verrà scritta in tutte le partite."
  );
  pgnFs.appendChild(pgnInfo);
  const notesInput = document.createElement('textarea');
  notesInput.value = settings.pgn.notes;
  notesInput.rows = 2;
  notesInput.setAttribute('aria-label', t('Note libere'));
  notesInput.addEventListener('change', () => {
    settings.pgn.notes = notesInput.value;
    persist();
  });
  pgnFs.appendChild(fieldRow(t('Note libere'), notesInput));
  container.appendChild(pgnFs);

  // --- Informazioni ---
  const infoFs = document.createElement('fieldset');
  infoFs.className = 'info-section';
  infoFs.innerHTML = `
    <legend>${t('Informazioni')}</legend>
    <p>${t('Roberto Lachin, judoka non vedente, conduttore (con Elena Travaini) di Motto Podcast.')}</p>
    <p><a href="mailto:mottopod@gmail.com">mottopod@gmail.com</a></p>
    <p><a href="https://mottopodcast.org" target="_blank" rel="noopener">mottopodcast.org</a></p>
    <p><a href="https://www.paypal.me/MottoPodcast" target="_blank" rel="noopener">${t('Sostieni il progetto (PayPal)')}</a></p>
    <p>${t('Grazie a Lichess per gli asset grafici dei pezzi (licenza GPL).')}</p>
  `;
  container.appendChild(infoFs);

  return {
    destroy() {
      clearTimeout(ambientSampleTimer);
      ambientSample.stop();
    },
  };
}
