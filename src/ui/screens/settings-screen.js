import { LIGHT_SQUARE_COLORS, DARK_SQUARE_COLORS, AMBIENT_TRACKS } from '../../session/settings.js';
import { contrastRatio, pieceFillFromSquareColor } from '../color-utils.js';
import { AmbientPlayer } from '../ambient-player.js';

function fieldRow(labelText, inputEl) {
  const div = document.createElement('div');
  div.className = 'field';
  const label = document.createElement('label');
  label.textContent = labelText + ' ';
  label.appendChild(inputEl);
  div.appendChild(label);
  return div;
}

export function renderSettingsScreen(container, ctx) {
  const { sound, navigate, saveSettings } = ctx;
  let settings = structuredClone(ctx.settings);
  const ambientPreview = new AmbientPlayer();

  function persist() {
    saveSettings(structuredClone(settings));
  }

  container.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'back-link';
  backBtn.textContent = '← Torna al menu';
  backBtn.addEventListener('click', () => navigate('home'));
  container.appendChild(backBtn);

  const h2 = document.createElement('h2');
  h2.textContent = 'Impostazioni';
  container.appendChild(h2);

  // --- Accessibilità ---
  const accessFs = document.createElement('fieldset');
  accessFs.innerHTML = '<legend>Accessibilità</legend>';

  const themeSoundsLabel = document.createElement('label');
  const themeSoundsInput = document.createElement('input');
  themeSoundsInput.type = 'checkbox';
  themeSoundsInput.checked = settings.themeSoundsEnabled;
  themeSoundsInput.addEventListener('change', () => {
    settings.themeSoundsEnabled = themeSoundsInput.checked;
    persist();
  });
  themeSoundsLabel.append(themeSoundsInput, ' Suoni set tematici attivi');
  accessFs.appendChild(themeSoundsLabel);

  const narrationDiv = document.createElement('div');
  narrationDiv.className = 'field';
  const narrationLegend = document.createElement('div');
  narrationLegend.textContent = 'Stile narrazione';
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
    label.append(radio, ` ${style === 'compatto' ? 'Compatto (es. Nf3)' : 'Espanso (es. cavallo in Firenze 3)'}`);
    narrationDiv.appendChild(label);
  });
  accessFs.appendChild(narrationDiv);

  const timeNoticesDiv = document.createElement('div');
  timeNoticesDiv.className = 'field';
  const timeNoticesLegend = document.createElement('div');
  timeNoticesLegend.textContent = 'Notifiche vocali tempo (solo partite a tempo)';
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
    label.append(cb, ` ${text}`);
    timeNoticesDiv.appendChild(label);
  });
  accessFs.appendChild(timeNoticesDiv);
  container.appendChild(accessFs);

  // --- Audio ---
  const audioFs = document.createElement('fieldset');
  audioFs.innerHTML = '<legend>Audio</legend>';
  [
    ['volumeGame', 'Volume suoni di gioco'],
    ['volumeUi', 'Volume suoni UI/menu'],
    ['volumeAmbient', 'Volume musica di sottofondo'],
  ].forEach(([key, text]) => {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '1';
    input.step = '0.05';
    input.value = String(settings[key]);
    input.addEventListener('input', () => {
      settings[key] = Number(input.value);
      persist();
      // Se si sta ascoltando un'anteprima, il volume cambia mentre si trascina.
      if (key === 'volumeAmbient') ambientPreview.setVolume(settings.volumeAmbient);
    });
    audioFs.appendChild(fieldRow(text, input));
  });
  container.appendChild(audioFs);

  // --- Musica di sottofondo ---
  const ambientFs = document.createElement('fieldset');
  ambientFs.innerHTML = '<legend>Musica di sottofondo</legend>';
  const ambientSelect = document.createElement('select');
  Object.entries(AMBIENT_TRACKS).forEach(([key, track]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = track.label;
    if (key === settings.ambientTrack) opt.selected = true;
    ambientSelect.appendChild(opt);
  });
  ambientSelect.addEventListener('change', () => {
    settings.ambientTrack = ambientSelect.value;
    persist();
  });
  ambientFs.appendChild(fieldRow('Traccia predefinita (riprodotta in loop durante la partita)', ambientSelect));

  // Anteprima: un pulsante ascolta/ferma per ogni traccia, per sentirle prima
  // di sceglierne una. Ne suona una alla volta, al volume impostato sopra.
  const previewButtons = new Map();
  let previewKey = null;

  function updatePreviewButtons() {
    previewButtons.forEach((btn, key) => {
      const playing = previewKey === key;
      btn.textContent = `${playing ? 'Ferma' : 'Ascolta'} ${AMBIENT_TRACKS[key].label}`;
      btn.setAttribute('aria-pressed', String(playing));
    });
  }

  function togglePreview(key) {
    if (previewKey === key) {
      ambientPreview.stop();
      previewKey = null;
    } else {
      ambientPreview.play(key, settings.volumeAmbient);
      previewKey = key;
    }
    updatePreviewButtons();
  }

  const previewRow = document.createElement('div');
  previewRow.className = 'preview-row';
  Object.entries(AMBIENT_TRACKS)
    .filter(([, track]) => track.file)
    .forEach(([key]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.addEventListener('click', () => togglePreview(key));
      previewButtons.set(key, btn);
      previewRow.appendChild(btn);
    });
  updatePreviewButtons();
  ambientFs.appendChild(previewRow);
  container.appendChild(ambientFs);

  // --- Grafica scacchiera ---
  const boardFs = document.createElement('fieldset');
  boardFs.innerHTML = '<legend>Grafica scacchiera</legend>';

  const lightSelect = document.createElement('select');
  Object.keys(LIGHT_SQUARE_COLORS).forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    if (name === settings.lightSquareColorName) opt.selected = true;
    lightSelect.appendChild(opt);
  });
  boardFs.appendChild(fieldRow('Colore caselle chiare', lightSelect));

  const darkSelect = document.createElement('select');
  Object.keys(DARK_SQUARE_COLORS).forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    if (name === settings.darkSquareColorName) opt.selected = true;
    darkSelect.appendChild(opt);
  });
  boardFs.appendChild(fieldRow('Colore caselle scure', darkSelect));

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
  preview.append(lightSwatch, darkSwatch, whitePieceSwatch, blackPieceSwatch, contrastText);
  boardFs.appendChild(preview);

  function updatePreview() {
    const lightHex = LIGHT_SQUARE_COLORS[lightSelect.value];
    const darkHex = DARK_SQUARE_COLORS[darkSelect.value];
    lightSwatch.style.background = lightHex;
    darkSwatch.style.background = darkHex;
    whitePieceSwatch.style.background = pieceFillFromSquareColor(lightHex, 'w');
    blackPieceSwatch.style.background = pieceFillFromSquareColor(darkHex, 'b');
    const ratio = contrastRatio(lightHex, darkHex);
    contrastText.textContent = `Contrasto caselle: ${ratio.toFixed(2)}:1`;
    contrastText.className = ratio >= 3 ? 'contrast-ok' : 'contrast-warning';
    if (ratio < 3) {
      contrastText.textContent += ' — contrasto insufficiente, scegli colori più distinti';
    }
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
  updatePreview();
  container.appendChild(boardFs);

  // --- Lingua ---
  const langFs = document.createElement('fieldset');
  langFs.innerHTML = '<legend>Lingua</legend>';
  const langSelect = document.createElement('select');
  const opt = document.createElement('option');
  opt.value = 'it';
  opt.textContent = 'Italiano';
  langSelect.appendChild(opt);
  langSelect.disabled = true;
  langFs.appendChild(fieldRow('Lingua (altre in arrivo)', langSelect));
  container.appendChild(langFs);

  // --- Set pezzi preferito ---
  const favSetFs = document.createElement('fieldset');
  favSetFs.innerHTML = '<legend>Set pezzi preferito di default</legend>';
  const favLabel = document.createElement('label');
  const favRadio = document.createElement('input');
  favRadio.type = 'radio';
  favRadio.checked = true;
  favRadio.disabled = true;
  favLabel.append(favRadio, ' Classico (unico disponibile in v1)');
  favSetFs.appendChild(favLabel);
  container.appendChild(favSetFs);

  // --- PGN ---
  const pgnFs = document.createElement('fieldset');
  pgnFs.innerHTML = '<legend>PGN — metadati opzionali da includere</legend>';
  [
    ['includeDateTime', 'Data/ora inizio-fine partita'],
    ['includeSetName', 'Set scacchi usato'],
    ['includePlayers', 'Nome giocatori'],
  ].forEach(([key, text]) => {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = settings.pgn[key];
    cb.addEventListener('change', () => {
      settings.pgn[key] = cb.checked;
      persist();
    });
    label.append(cb, ` ${text}`);
    pgnFs.appendChild(label);
  });
  const notesInput = document.createElement('textarea');
  notesInput.value = settings.pgn.notes;
  notesInput.rows = 2;
  notesInput.setAttribute('aria-label', 'Note libere');
  notesInput.addEventListener('change', () => {
    settings.pgn.notes = notesInput.value;
    persist();
  });
  pgnFs.appendChild(fieldRow('Note libere', notesInput));
  container.appendChild(pgnFs);

  // --- Informazioni ---
  const infoFs = document.createElement('fieldset');
  infoFs.className = 'info-section';
  infoFs.innerHTML = `
    <legend>Informazioni</legend>
    <p>Roberto Lachin, judoka non vedente, conduttore (con Elena Travaini) di Motto Podcast.</p>
    <p><a href="mailto:mottopod@gmail.com">mottopod@gmail.com</a></p>
    <p><a href="https://mottopodcast.org" target="_blank" rel="noopener">mottopodcast.org</a></p>
    <p><a href="https://www.paypal.me/MottoPodcast" target="_blank" rel="noopener">Sostieni il progetto (PayPal)</a></p>
    <p>Grazie a Lichess per gli asset grafici dei pezzi (licenza GPL).</p>
  `;
  container.appendChild(infoFs);

  return {
    destroy() {
      ambientPreview.stop();
    },
  };
}
