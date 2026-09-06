import { loadSettings, saveSettings } from './session/settings.js';
import { Narrator } from './ui/narrator.js';
import { SoundManager } from './ui/sound-manager.js';
import { renderHomeScreen } from './ui/screens/home-screen.js';
import { renderOptionsScreen } from './ui/screens/options-screen.js';
import { renderSettingsScreen } from './ui/screens/settings-screen.js';
import { renderSavedGamesScreen } from './ui/screens/saved-games-screen.js';
import { renderGameScreen } from './ui/screens/game-screen.js';

const appMain = document.getElementById('app-main');
const narrator = new Narrator(document.getElementById('narrator-live'));

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

function navigate(screenName, payload) {
  if (currentScreen && typeof currentScreen.destroy === 'function') {
    currentScreen.destroy();
  }
  sound.playUi('navigation');
  const ctx = {
    settings,
    saveSettings: persistSettings,
    sound,
    narrator,
    navigate,
  };

  switch (screenName) {
    case 'options':
      currentScreen = renderOptionsScreen(appMain, ctx) || null;
      break;
    case 'settings':
      currentScreen = renderSettingsScreen(appMain, ctx) || null;
      break;
    case 'saved':
      currentScreen = renderSavedGamesScreen(appMain, ctx) || null;
      break;
    case 'game':
      currentScreen = renderGameScreen(appMain, ctx, payload) || null;
      break;
    case 'home':
    default:
      currentScreen = renderHomeScreen(appMain, ctx) || null;
      break;
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

navigate('home');
