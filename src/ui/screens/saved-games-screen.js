import { listSavedGames, deleteSavedGame, importPgnText } from '../../pgn/pgn.js';
import { askConfirmation } from '../modal.js';
import { t } from '../../i18n/i18n.js';

function plural(n, one, many) {
  return `${n} ${n === 1 ? t(one) : t(many)}`;
}

export function renderSavedGamesScreen(container, ctx) {
  const { navigate, narrator } = ctx;
  container.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'back-link';
  backBtn.textContent = `← ${t('Torna al menu')}`;
  backBtn.addEventListener('click', () => navigate('home'));
  container.appendChild(backBtn);

  const h2 = document.createElement('h2');
  h2.textContent = t('Partite salvate (PGN)');
  container.appendChild(h2);

  // Richiesta di Roberto (11/11/2026): le partite di ciascuno restano sue.
  // Archivio e importazione vivono solo nella memoria del browser di questo
  // dispositivo (localStorage, vedi pgn/pgn.js): nessun server, nessun invio.
  const privacy = document.createElement('p');
  privacy.className = 'privacy-note';
  privacy.textContent = t(
    'Le partite salvate e quelle importate restano solo su questo dispositivo: non vengono inviate da nessuna parte e nessun altro giocatore può vederle. Se cancelli i dati del sito dal browser, l’archivio si perde: per conservare una partita usa «Scarica .pgn».'
  );
  container.appendChild(privacy);

  // --- Importazione (la specifica prevede import ED export) ---
  const importFs = document.createElement('fieldset');
  importFs.className = 'import-section';
  const importLegend = document.createElement('legend');
  importLegend.textContent = t('Importa partite PGN');
  importFs.appendChild(importLegend);

  const fileLabel = document.createElement('label');
  fileLabel.textContent = `${t('Scegli un file .pgn')} `;
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.pgn,application/x-chess-pgn,application/vnd.chess-pgn,text/plain';
  fileLabel.appendChild(fileInput);
  importFs.appendChild(fileLabel);

  const pasteLabel = document.createElement('label');
  pasteLabel.textContent = t('Oppure incolla qui il testo PGN');
  const pasteArea = document.createElement('textarea');
  pasteArea.rows = 4;
  pasteLabel.appendChild(pasteArea);
  importFs.appendChild(pasteLabel);

  const pasteBtn = document.createElement('button');
  pasteBtn.type = 'button';
  pasteBtn.textContent = t('Importa il testo incollato');
  importFs.appendChild(pasteBtn);

  // Esito dell'importazione: regione "status", letta dagli screen reader
  // appena cambia, e visibile per chi vede.
  const importStatus = document.createElement('p');
  importStatus.className = 'status-message';
  importStatus.setAttribute('role', 'status');
  importFs.appendChild(importStatus);
  container.appendChild(importFs);

  function reportImport({ imported, failed }) {
    let text;
    if (imported === 0 && failed === 0) {
      text = t('Nessuna partita trovata nel testo.');
    } else if (imported === 0) {
      text = `${t('Importazione non riuscita:')} ${plural(failed, 'partita illeggibile', 'partite illeggibili')}.`;
    } else {
      text = `${plural(imported, 'partita importata', 'partite importate')}.`;
      if (failed > 0) text += ` ${plural(failed, 'partita scartata perché illeggibile', 'partite scartate perché illeggibili')}.`;
    }
    importStatus.textContent = text;
    renderList();
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      reportImport(importPgnText(await file.text()));
    } catch {
      importStatus.textContent = t('Impossibile leggere il file scelto.');
    }
    fileInput.value = '';
  });

  pasteBtn.addEventListener('click', () => {
    if (!pasteArea.value.trim()) {
      importStatus.textContent = t('Il campo di testo è vuoto: incolla prima una partita PGN.');
      pasteArea.focus();
      return;
    }
    reportImport(importPgnText(pasteArea.value));
    pasteArea.value = '';
  });

  // --- Elenco ---
  const listHeading = document.createElement('h3');
  listHeading.textContent = t('Archivio');
  listHeading.setAttribute('tabindex', '-1');
  container.appendChild(listHeading);

  const list = document.createElement('div');
  container.appendChild(list);

  function renderList() {
    list.innerHTML = '';
    const games = listSavedGames();
    listHeading.textContent = games.length ? `${t('Archivio')} (${plural(games.length, 'partita', 'partite')})` : t('Archivio');
    if (games.length === 0) {
      const p = document.createElement('p');
      p.textContent = t('Nessuna partita salvata finora.');
      list.appendChild(p);
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'saved-games-list';
    games.forEach((game, index) => {
      const item = document.createElement('li');
      item.className = 'saved-game-item';

      // Il titolo di ogni partita è un'intestazione: con lo screen reader si
      // salta da una partita all'altra per intestazioni.
      const title = document.createElement('h4');
      title.textContent = game.label;
      title.setAttribute('tabindex', '-1');
      item.appendChild(title);

      const btnRow = document.createElement('div');
      btnRow.className = 'saved-game-actions';

      // I pulsanti dicono anche DI QUALE partita si tratta (aria-label), così
      // chi scorre i pulsanti con lo screen reader non sente dieci "Elimina"
      // tutti uguali.
      // Riproduzione sulla scacchiera con suoni e narrazione (11/11/2026).
      const replayBtn = document.createElement('button');
      replayBtn.type = 'button';
      replayBtn.textContent = t('Riproduci sulla scacchiera');
      replayBtn.setAttribute('aria-label', `${t('Riproduci sulla scacchiera')}, ${game.label}`);
      replayBtn.addEventListener('click', () => navigate('replay', { gameId: game.id }));

      const viewBtn = document.createElement('button');
      viewBtn.type = 'button';
      viewBtn.textContent = t('Visualizza PGN');
      viewBtn.setAttribute('aria-expanded', 'false');

      const downloadBtn = document.createElement('button');
      downloadBtn.type = 'button';
      downloadBtn.textContent = t('Scarica .pgn');
      downloadBtn.setAttribute('aria-label', `${t('Scarica .pgn')}, ${game.label}`);
      downloadBtn.addEventListener('click', () => {
        const blob = new Blob([game.pgn], { type: 'application/x-chess-pgn' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${game.label.replace(/[^\w-]+/g, '_')}.pgn`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = t('Elimina');
      deleteBtn.setAttribute('aria-label', `${t('Elimina')}, ${game.label}`);
      deleteBtn.addEventListener('click', async () => {
        const confirmed = await askConfirmation({
          titleText: t('Eliminare questa partita?'),
          bodyText: `${game.label}. ${t("L'operazione non si può annullare.")}`,
          confirmLabel: t('Elimina'),
          cancelLabel: t('Annulla'),
        });
        if (!confirmed) return;
        deleteSavedGame(game.id);
        renderList();
        narrator.announce(t('Partita eliminata.'));
        // Il pulsante premuto non esiste più: il focus va sulla partita che
        // ha preso il suo posto (o sulla precedente, o sul titolo
        // dell'archivio), invece di perdersi in cima alla pagina.
        const titles = list.querySelectorAll('h4');
        const next = titles[Math.min(index, titles.length - 1)];
        (next || listHeading).focus();
      });

      let textarea = null;
      viewBtn.addEventListener('click', () => {
        if (textarea) {
          textarea.remove();
          textarea = null;
          viewBtn.setAttribute('aria-expanded', 'false');
          return;
        }
        textarea = document.createElement('textarea');
        textarea.readOnly = true;
        textarea.value = game.pgn;
        textarea.setAttribute('aria-label', `PGN: ${game.label}`);
        item.appendChild(textarea);
        viewBtn.setAttribute('aria-expanded', 'true');
      });
      viewBtn.setAttribute('aria-label', `${t('Visualizza PGN')}, ${game.label}`);

      btnRow.append(replayBtn, viewBtn, downloadBtn, deleteBtn);
      item.appendChild(btnRow);
      ul.appendChild(item);
    });
    list.appendChild(ul);
  }

  renderList();
}
