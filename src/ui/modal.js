// Modale accessibile basata su <dialog> nativo (focus e semantica gestiti
// dal browser). Usato per la scelta di promozione e la conferma di abbandono.
export function openDialog({ titleText, bodyNode, buttons }) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'app-dialog';

    const h2 = document.createElement('h2');
    h2.textContent = titleText;
    dialog.appendChild(h2);

    if (bodyNode) dialog.appendChild(bodyNode);

    const btnRow = document.createElement('div');
    btnRow.className = 'dialog-buttons';
    let resolved = false;

    buttons.forEach(({ label, value, primary }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      if (primary) b.className = 'primary';
      b.addEventListener('click', () => {
        resolved = true;
        dialog.close();
        resolve(value);
      });
      btnRow.appendChild(b);
    });
    dialog.appendChild(btnRow);

    dialog.addEventListener('close', () => {
      if (!resolved) resolve(undefined);
      dialog.remove();
    });

    document.body.appendChild(dialog);
    dialog.showModal();
  });
}

export async function askPromotionChoice() {
  const body = document.createElement('p');
  body.textContent = 'Scegli il pezzo per la promozione del pedone.';
  return openDialog({
    titleText: 'Promozione',
    bodyNode: body,
    buttons: [
      { label: 'Dama', value: 'q', primary: true },
      { label: 'Torre', value: 'r' },
      { label: 'Alfiere', value: 'b' },
      { label: 'Cavallo', value: 'n' },
    ],
  });
}

export async function askResignConfirmation() {
  return openDialog({
    titleText: 'Confermi abbandono partita?',
    buttons: [
      { label: 'No', value: false },
      { label: 'Sì', value: true, primary: true },
    ],
  });
}
