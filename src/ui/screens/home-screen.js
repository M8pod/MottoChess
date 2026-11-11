import { loadLastConfig } from '../../session/options.js';
import { loadGameProgress } from '../../session/game-progress.js';
import { resolveFaction } from '../../themes/factions.js';
import { pieceSetLabel } from '../../themes/pieces.js';
import { openDialog } from '../modal.js';

function resolveColor(choice) {
  if (choice === 'casuale') return Math.random() < 0.5 ? 'w' : 'b';
  return choice;
}

export function renderHomeScreen(container, ctx) {
  const { sound, navigate, settings } = ctx;
  container.innerHTML = '';

  const h1 = document.createElement('h1');
  h1.textContent = 'Motto Chess';
  container.appendChild(h1);

  const img = document.createElement('img');
  img.src = 'assets/images/motto_chess_pawn_samurai_square.png';
  img.alt = 'Pedone e ombra di samurai';
  img.className = 'hero-image';
  container.appendChild(img);

  // Partita sospesa (vedi session/game-progress.js): il pulsante per
  // riprenderla viene per primo, è l'azione più probabile.
  const progress = loadGameProgress();
  if (progress) {
    const resumeBtn = document.createElement('button');
    resumeBtn.type = 'button';
    resumeBtn.className = 'big-button';
    const colorText = progress.session.color === 'w' ? 'bianco' : 'nero';
    const moveCount = Math.ceil(progress.moves.length / 2);
    resumeBtn.textContent = 'Riprendi partita';
    // Il dettaglio sta in una descrizione separata: il nome del pulsante
    // resta breve, lo screen reader legge il resto subito dopo.
    const resumeHint = document.createElement('p');
    resumeHint.id = 'resume-hint';
    resumeHint.className = 'field-hint';
    resumeHint.textContent =
      `Partita sospesa: giochi con il ${colorText}, set ${pieceSetLabel(progress.session.pieceSet)}, ` +
      `${moveCount === 0 ? 'nessuna mossa giocata' : `dopo la mossa ${moveCount}`}.`;
    resumeBtn.setAttribute('aria-describedby', resumeHint.id);
    resumeBtn.addEventListener('click', () => navigate('game', { resume: true }));
    container.append(resumeBtn, resumeHint);
  }

  const playNowBtn = document.createElement('button');
  playNowBtn.type = 'button';
  playNowBtn.className = 'big-button';
  playNowBtn.textContent = 'Gioca subito';
  playNowBtn.addEventListener('click', async () => {
    sound.playUi('navigation');
    const body = document.createElement('p');
    body.textContent = progress
      ? 'Con quale colore vuoi giocare? La partita sospesa verrà archiviata in Partite salvate.'
      : 'Con quale colore vuoi giocare questa partita?';
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
    const lastConfig = loadLastConfig(settings.defaultPieceSet);
    // "Gioca subito" chiede solo il colore: la fazione è quella dell'ultima
    // configurazione salvata in Opzioni partita ('casuale' inclusa).
    navigate('game', {
      ...lastConfig,
      color: resolveColor(choice),
      faction: resolveFaction(lastConfig.pieceSet, lastConfig.faction),
      startedAt: Date.now(),
    });
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

  // "Impostazioni", come da specifica e come il titolo della schermata che
  // apre (prima il pulsante si chiamava "Extra").
  const settingsBtn = document.createElement('button');
  settingsBtn.type = 'button';
  settingsBtn.className = 'big-button';
  settingsBtn.textContent = 'Impostazioni';
  settingsBtn.addEventListener('click', () => navigate('settings'));

  container.append(playNowBtn, optionsBtn, savedBtn, settingsBtn);

  // Firma in calce (richiesta di Roberto, 11/11/2026): chi ha fatto il gioco,
  // dove trovarlo, come scrivergli e come sostenerlo. Le stesse informazioni
  // stanno anche in Impostazioni > Informazioni.
  const footer = document.createElement('footer');
  footer.className = 'home-footer';
  footer.innerHTML = `
    <p>Un progetto di Roberto Lachin e di <a href="https://mottopodcast.org" target="_blank" rel="noopener">Motto Podcast (mottopodcast.org)</a></p>
    <p><a href="mailto:mottopod@gmail.com">Scrivimi: mottopod@gmail.com</a></p>
    <p><a href="https://www.paypal.me/MottoPodcast" target="_blank" rel="noopener">Sostieni il progetto con una donazione (PayPal)</a></p>
  `;
  container.appendChild(footer);
}
