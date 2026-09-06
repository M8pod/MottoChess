import { listSavedGames, deleteSavedGame } from '../../pgn/pgn.js';

export function renderSavedGamesScreen(container, ctx) {
  const { navigate } = ctx;
  container.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'back-link';
  backBtn.textContent = '← Torna al menu';
  backBtn.addEventListener('click', () => navigate('home'));
  container.appendChild(backBtn);

  const h2 = document.createElement('h2');
  h2.textContent = 'Partite salvate (PGN)';
  container.appendChild(h2);

  const games = listSavedGames();
  if (games.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'Nessuna partita salvata finora.';
    container.appendChild(p);
    return;
  }

  games.forEach((game) => {
    const item = document.createElement('div');
    item.className = 'saved-game-item';

    const title = document.createElement('strong');
    title.textContent = game.label;
    item.appendChild(title);

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '0.5rem';
    btnRow.style.marginTop = '0.5rem';

    const viewBtn = document.createElement('button');
    viewBtn.type = 'button';
    viewBtn.textContent = 'Visualizza PGN';

    const downloadBtn = document.createElement('button');
    downloadBtn.type = 'button';
    downloadBtn.textContent = 'Scarica .pgn';
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([game.pgn], { type: 'application/x-chess-pgn' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${game.label.replace(/[^\w-]+/g, '_')}.pgn`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Elimina';
    deleteBtn.addEventListener('click', () => {
      deleteSavedGame(game.id);
      renderSavedGamesScreen(container, ctx);
    });

    let textarea = null;
    viewBtn.addEventListener('click', () => {
      if (textarea) {
        textarea.remove();
        textarea = null;
        return;
      }
      textarea = document.createElement('textarea');
      textarea.readOnly = true;
      textarea.value = game.pgn;
      item.appendChild(textarea);
    });

    btnRow.append(viewBtn, downloadBtn, deleteBtn);
    item.appendChild(btnRow);
    container.appendChild(item);
  });
}
