import { loadLastConfig, saveLastConfig } from '../../session/options.js';
import { eloForLevel } from '../../engine/engine.js';
import { AMBIENT_TRACKS } from '../../session/settings.js';
import { factionSet, resolveFaction } from '../../themes/factions.js';
import { hasPlaceholderArt } from '../../themes/pieces.js';
import { AmbientPlayer } from '../ambient-player.js';

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
  return entry ? entry[2] : '';
}

function resolveColor(choice) {
  if (choice === 'casuale') return Math.random() < 0.5 ? 'w' : 'b';
  return choice;
}

export function renderOptionsScreen(container, ctx) {
  const { sound, navigate, settings } = ctx;
  const config = loadLastConfig();
  const ambientPreview = new AmbientPlayer();

  container.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'back-link';
  backBtn.textContent = '← Torna al menu';
  backBtn.addEventListener('click', () => navigate('home'));
  container.appendChild(backBtn);

  const h2 = document.createElement('h2');
  h2.textContent = 'Opzioni partita';
  container.appendChild(h2);

  const form = document.createElement('form');

  // Tempo
  const timeFieldset = document.createElement('fieldset');
  const timeLegend = document.createElement('legend');
  timeLegend.textContent = 'Tempo';
  timeFieldset.appendChild(timeLegend);

  const timeToggleLabel = document.createElement('label');
  const timeToggle = document.createElement('input');
  timeToggle.type = 'checkbox';
  timeToggle.checked = config.timeEnabled;
  timeToggleLabel.append(timeToggle, ' Partita a tempo');
  timeFieldset.appendChild(timeToggleLabel);

  const minutesDiv = document.createElement('div');
  minutesDiv.className = 'field';
  const minutesLabel = document.createElement('label');
  minutesLabel.textContent = 'Minuti per giocatore';
  const minutesSelect = document.createElement('select');
  MINUTE_OPTIONS.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = String(m);
    opt.textContent = `${m} minuti`;
    if (m === config.minutes) opt.selected = true;
    minutesSelect.appendChild(opt);
  });
  minutesLabel.appendChild(minutesSelect);
  minutesDiv.appendChild(minutesLabel);

  const incrementDiv = document.createElement('div');
  incrementDiv.className = 'field';
  const incrementLabel = document.createElement('label');
  incrementLabel.textContent = 'Incremento (secondi)';
  const incrementSelect = document.createElement('select');
  INCREMENT_OPTIONS.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = String(s);
    opt.textContent = `${s} secondi`;
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
  levelLabel.textContent = 'Livello Stockfish';
  const levelSelect = document.createElement('select');
  for (let level = 1; level <= 20; level++) {
    const opt = document.createElement('option');
    opt.value = String(level);
    opt.textContent = `${level} — ${labelForLevel(level)} (Elo ${eloForLevel(level)})`;
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
  setLegend.textContent = 'Set pezzi tematico';
  setFieldset.appendChild(setLegend);
  const themes = [
    { value: 'classico', label: 'Classico', available: true },
    { value: 'judo', label: 'Judo (judogi bianco e blu)', available: true },
    { value: 'samurai-ninja', label: 'Samurai vs Ninja (in arrivo)', available: false },
    { value: 'cani-gatti', label: 'Cani vs Gatti', available: true },
  ];
  themes.forEach((theme) => {
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
      ? ' (disegni in arrivo: per ora pezzi classici)'
      : '';
    label.append(radio, ` ${theme.label}${note}`);
    setFieldset.appendChild(label);
  });
  // Una configurazione salvata da una versione precedente può nominare un set
  // che qui non c'è più: senza questo ripiego nessun radio risulterebbe
  // selezionato e la schermata non si costruirebbe.
  if (!setFieldset.querySelector('input[name="pieceSet"]:checked')) {
    setFieldset.querySelector('input[name="pieceSet"][value="classico"]').checked = true;
  }
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

    factionLegend.textContent = factions.legend;
    const choices = [...factions.options.map((o) => [o.value, o.label]), ['casuale', 'Casuale']];
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

  // Colore
  const colorFieldset = document.createElement('fieldset');
  const colorLegend = document.createElement('legend');
  colorLegend.textContent = 'Colore (scelta obbligatoria)';
  colorFieldset.appendChild(colorLegend);
  ['w', 'b', 'casuale'].forEach((value, i) => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'color';
    radio.value = value;
    if (i === 2) radio.checked = true;
    const text = value === 'w' ? ' Bianco' : value === 'b' ? ' Nero' : ' Casuale';
    label.append(radio, text);
    colorFieldset.appendChild(label);
  });
  form.appendChild(colorFieldset);

  // Musica di sottofondo
  const ambientFieldset = document.createElement('fieldset');
  const ambientLegend = document.createElement('legend');
  ambientLegend.textContent = 'Musica di sottofondo';
  ambientFieldset.appendChild(ambientLegend);

  const ambientDiv = document.createElement('div');
  ambientDiv.className = 'field';
  const ambientLabel = document.createElement('label');
  ambientLabel.textContent = 'Traccia (riprodotta in loop durante la partita)';
  const ambientSelect = document.createElement('select');
  Object.entries(AMBIENT_TRACKS).forEach(([key, track]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = track.label;
    ambientSelect.appendChild(opt);
  });
  ambientSelect.value = config.ambientTrack || 'nessuna';
  ambientLabel.appendChild(ambientSelect);
  ambientDiv.appendChild(ambientLabel);
  ambientFieldset.appendChild(ambientDiv);

  // Anteprima: un pulsante ascolta/ferma per ogni traccia, per sentirle prima
  // di sceglierne una. Ne suona una alla volta, al volume impostato in Extra.
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
  ambientFieldset.appendChild(previewRow);
  form.appendChild(ambientFieldset);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'big-button';
  submitBtn.textContent = 'Inizia partita';
  form.appendChild(submitBtn);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const colorChoice = form.querySelector('input[name="color"]:checked').value;
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
    sound.playUi('navigation');
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
