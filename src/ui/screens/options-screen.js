import { loadLastConfig, saveLastConfig } from '../../session/options.js';
import { eloForLevel } from '../../engine/engine.js';
import { AMBIENT_TRACKS } from '../../session/settings.js';

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
  const { sound, navigate } = ctx;
  const config = loadLastConfig();

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

  // Set pezzi tematico
  const setFieldset = document.createElement('fieldset');
  const setLegend = document.createElement('legend');
  setLegend.textContent = 'Set pezzi tematico';
  setFieldset.appendChild(setLegend);
  const themes = [
    { value: 'classico', label: 'Classico', available: true },
    { value: 'samurai-ninja', label: 'Samurai vs Ninja (in arrivo)', available: false },
    { value: 'judo', label: 'Judo (in arrivo)', available: false },
    { value: 'cani-gatti', label: 'Cani vs Gatti (in arrivo)', available: false },
  ];
  themes.forEach((theme) => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'pieceSet';
    radio.value = theme.value;
    radio.disabled = !theme.available;
    radio.checked = theme.value === 'classico';
    label.append(radio, ` ${theme.label}`);
    setFieldset.appendChild(label);
  });
  form.appendChild(setFieldset);

  // Musica di sottofondo (per questa partita)
  const ambientDiv = document.createElement('div');
  ambientDiv.className = 'field';
  const ambientLabel = document.createElement('label');
  ambientLabel.textContent = 'Musica di sottofondo per questa partita';
  const ambientSelect = document.createElement('select');
  const defaultOpt = document.createElement('option');
  defaultOpt.value = 'predefinita';
  defaultOpt.textContent = 'Come da Impostazioni';
  ambientSelect.appendChild(defaultOpt);
  Object.entries(AMBIENT_TRACKS).forEach(([key, track]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = track.label;
    ambientSelect.appendChild(opt);
  });
  ambientSelect.value = config.ambientTrack || 'predefinita';
  ambientLabel.appendChild(ambientSelect);
  ambientDiv.appendChild(ambientLabel);
  form.appendChild(ambientDiv);

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
      pieceSet: 'classico',
      ambientTrack: ambientSelect.value,
    };
    saveLastConfig(newConfig);
    sound.playUi('navigation');
    navigate('game', { ...newConfig, color: resolveColor(colorChoice), startedAt: Date.now() });
  });

  container.appendChild(form);
}
