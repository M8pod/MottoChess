import { loadSettings, saveSettings } from './session/settings.js';
import { Narrator } from './ui/narrator.js';
import { SoundManager } from './ui/sound-manager.js';
import { unlockAudioOnUserGesture } from './ui/audio-context.js';
import { renderHomeScreen } from './ui/screens/home-screen.js';
import { renderOptionsScreen } from './ui/screens/options-screen.js';
import { renderSettingsScreen } from './ui/screens/settings-screen.js';
import { renderSavedGamesScreen } from './ui/screens/saved-games-screen.js';
import { renderGameScreen } from './ui/screens/game-screen.js';
import { renderReplayScreen } from './ui/screens/replay-screen.js';

const appMain = document.getElementById('app-main');
const narrator = new Narrator(document.getElementById('narrator-live'));

unlockAudioOnUserGesture();

let settings = loadSettings();
function getSettings() {
  return settings;
}
function persistSettings(next) {
  settings = next;
  saveSettings(settings);
}

const sound = new SoundManager(getSettings);

let currentScreen = null;
let isFirstRender = true;

const SCREEN_TITLES = {
  home: 'Motto Chess',
  options: 'Opzioni partita — Motto Chess',
  settings: 'Impostazioni — Motto Chess',
  saved: 'Partite salvate — Motto Chess',
  game: 'Partita — Motto Chess',
  replay: 'Riproduzione partita — Motto Chess',
};

// Dopo un cambio schermata il contenuto viene sostituito per intero: senza
// spostare il focus, il cursore di VoiceOver/TalkBack/NVDA restava su un
// elemento che non esiste più e finiva in un punto a caso (spesso in cima,
// sulla barra di stato). Il focus va quindi sul titolo della nuova
// schermata, che lo screen reader legge come conferma di dove si è arrivati.
// La schermata di gioco gestisce il proprio focus (campo comandi).
function focusScreenHeading(screenName) {
  if (screenName === 'game') return;
  const heading = appMain.querySelector('h1, h2');
  if (!heading) return;
  heading.setAttribute('tabindex', '-1');
  heading.focus();
}

let navigationId = 0;

function navigate(screenName, payload) {
  navigationId += 1;
  const myNavigation = navigationId;
  if (currentScreen && typeof currentScreen.destroy === 'function') {
    currentScreen.destroy();
  }
  currentScreen = null;
  sound.playUi('navigation');
  const ctx = {
    settings,
    saveSettings: persistSettings,
    sound,
    narrator,
    navigate,
  };

  let rendered;
  switch (screenName) {
    case 'options':
      rendered = renderOptionsScreen(appMain, ctx);
      break;
    case 'settings':
      rendered = renderSettingsScreen(appMain, ctx);
      break;
    case 'saved':
      rendered = renderSavedGamesScreen(appMain, ctx);
      break;
    case 'game':
      rendered = renderGameScreen(appMain, ctx, payload);
      break;
    case 'replay':
      rendered = renderReplayScreen(appMain, ctx, payload);
      break;
    case 'home':
    default:
      rendered = renderHomeScreen(appMain, ctx);
      break;
  }
  // Una schermata può reindirizzare altrove durante il proprio rendering
  // (es. partita da riprendere non più disponibile): in quel caso ha già
  // fatto tutto la navigazione interna, più recente di questa.
  if (myNavigation !== navigationId) return;
  if (rendered) currentScreen = rendered;

  document.title = SCREEN_TITLES[screenName] || SCREEN_TITLES.home;
  // Al primo avvio lo screen reader parte già dall'inizio della pagina.
  if (!isFirstRender) focusScreenHeading(screenName);
  isFirstRender = false;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

navigate('home');
// Segnale per la rete di sicurezza in index.html: l'app è partita.
window.__mottoStarted = true;
