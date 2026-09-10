import { loadLastConfig } from '../../session/options.js';
import { openDialog } from '../modal.js';

function resolveColor(choice) {
  if (choice === 'casuale') return Math.random() < 0.5 ? 'w' : 'b';
  return choice;
}

export function renderHomeScreen(container, ctx) {
  const { sound, navigate } = ctx;
  container.innerHTML = '';

  const h1 = document.createElement('h1');
  h1.textContent = 'Motto Chess';
  container.appendChild(h1);

  const img = document.createElement('img');
  img.src = 'assets/images/motto_chess_pawn_samurai_square.png';
  img.alt = 'Pedone e ombra di samurai';
  img.className = 'hero-image';
  container.appendChild(img);

  const playNowBtn = document.createElement('button');
  playNowBtn.type = 'button';
  playNowBtn.className = 'big-button';
  playNowBtn.textContent = 'Gioca subito';
  playNowBtn.addEventListener('click', async () => {
    sound.playUi('navigation');
    const body = document.createElement('p');
    body.textContent = 'Con quale colore vuoi giocare questa partita?';
    const choice = await openDialog({
      titleText: 'Scegli il colore',
      bodyNode: body,
      buttons: [
        { label: 'Bianco', value: 'w' },
        { label: 'Nero', value: 'b' },
        { label: 'Casuale', value: 'casuale', primary: true },
      ],
    });
    if (!choice) return;
    const lastConfig = loadLastConfig();
    navigate('game', { ...lastConfig, color: resolveColor(choice), startedAt: Date.now() });
  });

  const optionsBtn = document.createElement('button');
  optionsBtn.type = 'button';
  optionsBtn.className = 'big-button';
  optionsBtn.textContent = 'Opzioni partita';
  optionsBtn.addEventListener('click', () => navigate('options'));

  const savedBtn = document.createElement('button');
  savedBtn.type = 'button';
  savedBtn.className = 'big-button';
  savedBtn.textContent = 'Partite salvate (PGN)';
  savedBtn.addEventListener('click', () => navigate('saved'));

  const settingsBtn = document.createElement('button');
  settingsBtn.type = 'button';
  settingsBtn.className = 'big-button';
  settingsBtn.textContent = 'Extra';
  settingsBtn.addEventListener('click', () => navigate('settings'));

  container.append(playNowBtn, optionsBtn, savedBtn, settingsBtn);
}
