import { loadLastConfig, saveLastConfig } from '../../session/options.js';
import { eloForLevel } from '../../engine/engine.js';
import { AMBIENT_TRACKS } from '../../session/settings.js';
import { factionSet, resolveFaction } from '../../themes/factions.js';
import { hasPlaceholderArt, PIECE_SET_CHOICES } from '../../themes/pieces.js';
import { AmbientPlayer } from '../ambient-player.js';
import { t } from '../../i18n/i18n.js';

const MINUTE_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120];
const INCREMENT_OPTIONS = [0, 2, 3, 5, 7, 10, 15, 20, 30];

const LEVEL_LABELS = [
  [1, 2, 'Principiante'],
  [3, 4, 'Dilettante'],
  [5, 6, 'Amatore'],
  [7, 8, 'Intermedio'],
  [9, 10, 'Avanzato'],
  [11, 12, 'Esperto'],
  [13, 14, 'Candidato Maestro'],
  [15, 16, 'Maestro'],
  [17, 18, 'Maestro Internazionale'],
  [19, 20, 'Gran Maestro'],
];

function labelForLevel(level) {
  const entry = LEVEL_LABELS.find(([lo, hi]) => level >= lo && level <= hi);
  return entry ? t(entry[2]) : '';
}

function resolveColor(choice) {
  if (choice === 'casuale') return Math.random() < 0.5 ? 'w' : 'b';
  return choice;
}

export function renderOptionsScreen(container, ctx) {
  const { navigate, settings } = ctx;
  const config = loadLastConfig(settings.defaultPieceSet);
  const ambientPreview = new AmbientPlayer();

  container.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'back-link';
  backBtn.textContent = `← ${t('Torna al menu')}`;
  backBtn.addEventListener('click', () => navigate('home'));
  container.appendChild(backBtn);

  const h2 = document.createElement('h2');
  h2.textContent = t('Opzioni partita');
  container.appendChild(h2);

  const form = document.createElement('form');

  // Tempo
  const timeFieldset = document.createElement('fieldset');
  const timeLegend = document.createElement('legend');
  timeLegend.textContent = t('Tempo');
  timeFieldset.appendChild(timeLegend);

  const timeToggleLabel = document.createElement('label');
  const timeToggle = document.createElement('input');
  timeToggle.type = 'checkbox';
  timeToggle.checked = config.timeEnabled;
  timeToggleLabel.append(timeToggle, ` ${t('Partita a tempo')}`);
  timeFieldset.appendChild(timeToggleLabel);

  const minutesDiv = document.createElement('div');
  minutesDiv.className = 'field';
  const minutesLabel = document.createElement('label');
  minutesLabel.textContent = t('Minuti per giocatore');
  const minutesSelect = document.createElement('select');
  MINUTE_OPTIONS.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = String(m);
    opt.textContent = t('{n} minuti', { n: m });
    if (m === config.minutes) opt.selected = true;
    minutesSelect.appendChild(opt);
  });
  minutesLabel.appendChild(minutesSelect);
  minutesDiv.appendChild(minutesLabel);

  const incrementDiv = document.createElement('div');
  incrementDiv.className = 'field';
  const incrementLabel = document.createElement('label');
  incrementLabel.textContent = t('Incremento (secondi)');
  const incrementSelect = document.createElement('select');
  INCREMENT_OPTIONS.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = String(s);
    opt.textContent = t('{n} secondi', { n: s });
    if (s === config.incrementSec) opt.selected = true;
    incrementSelect.appendChild(opt);
  });
  incrementLabel.appendChild(incrementSelect);
  incrementDiv.appendChild(incrementLabel);

  timeFieldset.append(minutesDiv, incrementDiv);
  form.appendChild(timeFieldset);

  function updateTimeFieldsEnabled() {
    minutesSelect.disabled = !timeToggle.checked;
    incrementSelect.disabled = !timeToggle.checked;
  }
  timeToggle.addEventListener('change', updateTimeFieldsEnabled);
  updateTimeFieldsEnabled();

  // Livello Stockfish
  const levelDiv = document.createElement('div');
  levelDiv.className = 'field';
  const levelLabel = document.createElement('label');
  levelLabel.textContent = t('Livello Stockfish');
  const levelSelect = document.createElement('select');
  for (let level = 1; level <= 20; level++) {
    const opt = document.createElement('option');
    opt.value = String(level);
    opt.textContent = t('{level} — {label} (circa {elo} Elo)', { level, label: labelForLevel(level), elo: eloForLevel(level) });
    if (level === config.level) opt.selected = true;
    levelSelect.appendChild(opt);
  }
  levelLabel.appendChild(levelSelect);
  levelDiv.appendChild(levelLabel);
  form.appendChild(levelDiv);

  // Set pezzi tematico. Viene prima della fazione e del colore perché è la
  // scelta che decide se le altre due domande hanno senso: solo un set a
  // fazioni chiede anche "chi impersoni".
  const setFieldset = document.createElement('fieldset');
  const setLegend = document.createElement('legend');
  setLegend.textContent = t('Set pezzi tematico');
  setFieldset.appendChild(setLegend);
  PIECE_SET_CHOICES.forEach((theme) => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'pieceSet';
    radio.value = theme.value;
    radio.disabled = !theme.available;
    radio.checked = theme.value === (config.pieceSet || 'classico');
    radio.addEventListener('change', renderFactionChoice);
    // I disegni di un set possono non essere ancora arrivati: il set resta
    // giocabile con i pezzi classici come segnaposto, ma va detto.
    const note = theme.available && hasPlaceholderArt(theme.value)
      ? ` ${t('(disegni in arrivo: per ora pezzi classici)')}`
      : '';
    label.append(radio, ` ${t(theme.label)}${note}`);
    setFieldset.appendChild(label);
  });
  // Una configurazione salvata da una versione precedente può nominare un set
  // che qui non c'è più: senza questo ripiego nessun radio risulterebbe
  // selezionato e la schermata non si costruirebbe.
  if (!setFieldset.querySelector('input[name="pieceSet"]:checked')) {
    setFieldset.querySelector('input[name="pieceSet"][value="classico"]').checked = true;
  }
  const colorsHint = document.createElement('p');
  colorsHint.className = 'field-hint';
  colorsHint.textContent = t(
    "I colori e l'intensità delle caselle della scacchiera classica si scelgono in Impostazioni, e restano salvati su questo dispositivo."
  );
  setFieldset.appendChild(colorsHint);
  form.appendChild(setFieldset);

  // Fazione: presente solo per i set che la fanno scegliere (vedi
  // themes/factions.js), e ricostruita a ogni cambio di set perché legenda e
  // opzioni appartengono al set.
  const factionFieldset = document.createElement('fieldset');
  const factionLegend = document.createElement('legend');
  factionFieldset.appendChild(factionLegend);
  form.appendChild(factionFieldset);

  // La scelta vive qui e non solo nei radio: i radio spariscono quando si passa
  // a un set senza fazioni, e tornando indietro (o avviando la partita) la
  // preferenza deve essere ancora quella, non "Casuale".
  let factionChoice = config.faction || 'casuale';

  function renderFactionChoice() {
    const setName = form.querySelector('input[name="pieceSet"]:checked').value;
    const factions = factionSet(setName);
    factionFieldset.hidden = !factions;
    factionFieldset.querySelectorAll('label').forEach((el) => el.remove());
    if (!factions) return;

    factionLegend.textContent = t(factions.legend);
    const choices = [...factions.options.map((o) => [o.value, t(o.label)]), ['casuale', t('Casuale')]];
    choices.forEach(([value, text]) => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'faction';
      radio.value = value;
      radio.checked = value === factionChoice;
      radio.addEventListener('change', () => {
        factionChoice = value;
      });
      label.append(radio, ` ${text}`);
      factionFieldset.appendChild(label);
    });
    // Preferenza salvata che appartiene a un altro set (o nessuna): ripiego su
    // "Casuale", così esiste sempre un radio selezionato.
    if (!factionFieldset.querySelector('input[name="faction"]:checked')) {
      factionChoice = 'casuale';
      factionFieldset.querySelector('input[name="faction"][value="casuale"]').checked = true;
    }
  }
  renderFactionChoice();

  // Colore: scelta davvero obbligatoria, come da specifica. Prima "Casuale"
  // era già selezionato e la parola "obbligatoria" nella legenda non
  // corrispondeva a niente. Nessun radio preselezionato; se si prova ad
  // avviare senza sceglierlo, un messaggio d'errore collegato al gruppo
  // (aria-describedby) viene annunciato e il focus va sul primo colore.
  const colorFieldset = document.createElement('fieldset');
  const colorLegend = document.createElement('legend');
  colorLegend.textContent = t('Colore (scelta obbligatoria a ogni partita)');
  colorFieldset.appendChild(colorLegend);
  ['w', 'b', 'casuale'].forEach((value) => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'color';
    radio.value = value;
    radio.addEventListener('change', clearColorError);
    const text = ` ${value === 'w' ? t('Bianco') : value === 'b' ? t('Nero') : t('Casuale')}`;
    label.append(radio, text);
    colorFieldset.appendChild(label);
  });
  const colorError = document.createElement('p');
  colorError.id = 'color-error';
  colorError.className = 'field-error';
  colorError.hidden = true;
  colorError.textContent = t('Scegli il colore con cui giocare: bianco, nero o casuale.');
  colorFieldset.appendChild(colorError);
  form.appendChild(colorFieldset);

  function clearColorError() {
    colorError.hidden = true;
    colorFieldset.removeAttribute('aria-describedby');
    colorFieldset.removeAttribute('aria-invalid');
  }

  // Musica di sottofondo
  const ambientFieldset = document.createElement('fieldset');
  const ambientLegend = document.createElement('legend');
  ambientLegend.textContent = t('Musica di sottofondo');
  ambientFieldset.appendChild(ambientLegend);

  const ambientDiv = document.createElement('div');
  ambientDiv.className = 'field';
  const ambientLabel = document.createElement('label');
  ambientLabel.textContent = t('Traccia da suonare durante la partita (i pulsanti Ascolta servono solo per sentirle)');
  const ambientSelect = document.createElement('select');
  Object.entries(AMBIENT_TRACKS).forEach(([key, track]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = t(track.label);
    ambientSelect.appendChild(opt);
  });
  ambientSelect.value = config.ambientTrack || 'nessuna';
  ambientLabel.appendChild(ambientSelect);
  ambientDiv.appendChild(ambientLabel);
  ambientFieldset.appendChild(ambientDiv);

  // Anteprima: un pulsante ascolta/ferma per ogni traccia, per sentirle prima
  // di sceglierne una. Ne suona una alla volta, al volume impostato in
  // Impostazioni.
  const previewButtons = new Map();
  let previewKey = null;

  function updatePreviewButtons() {
    previewButtons.forEach((btn, key) => {
      const playing = previewKey === key;
      btn.textContent = `${playing ? t('Ferma') : t('Ascolta')} ${t(AMBIENT_TRACKS[key].label)}`;
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
  ambientFieldset.appendChild(previewRow);
  form.appendChild(ambientFieldset);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'big-button';
  submitBtn.textContent = t('Inizia partita');
  form.appendChild(submitBtn);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const colorRadio = form.querySelector('input[name="color"]:checked');
    if (!colorRadio) {
      colorError.hidden = false;
      colorFieldset.setAttribute('aria-describedby', colorError.id);
      colorFieldset.setAttribute('aria-invalid', 'true');
      ctx.narrator.announce(colorError.textContent);
      form.querySelector('input[name="color"]').focus();
      return;
    }
    const colorChoice = colorRadio.value;
    const newConfig = {
      timeEnabled: timeToggle.checked,
      minutes: Number(minutesSelect.value),
      incrementSec: Number(incrementSelect.value),
      level: Number(levelSelect.value),
      pieceSet: form.querySelector('input[name="pieceSet"]:checked').value,
      faction: factionChoice,
      ambientTrack: ambientSelect.value,
    };
    saveLastConfig(newConfig);
    // Il suono di navigazione lo suona già navigate(): suonarlo anche qui
    // lo faceva sentire due volte sovrapposto.
    // Colore e fazione vengono sciolti qui una volta sola: da qui in poi la
    // partita lavora su valori concreti, mai su 'casuale'.
    navigate('game', {
      ...newConfig,
      color: resolveColor(colorChoice),
      faction: resolveFaction(newConfig.pieceSet, newConfig.faction),
      startedAt: Date.now(),
    });
  });

  container.appendChild(form);

  return {
    destroy() {
      ambientPreview.stop();
    },
  };
}
