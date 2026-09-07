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

const HELP_COMMANDS = [
  ['Notazione mossa compatta', 'es. e4, Nf3, exd5, e8=D'],
  ['Notazione "città italiane"', 'es. Empoli 4, cavallo Firenze 3'],
  ['Arrocco', 'O-O oppure O-O-O, o "arrocco corto" / "arrocco lungo"'],
  ['l', "annuncia l'ultima mossa giocata"],
  ['l + numero (es. l5)', 'annuncia le ultime N mosse giocate'],
  ['c', "annuncia il tempo residuo, tuo e dell'avversario"],
  ['s + numero (es. s4)', 'annuncia tutti i pezzi sulla traversa 4, comprese le caselle vuote'],
  ['s + lettera (es. se)', 'annuncia tutti i pezzi sulla colonna Empoli, comprese le caselle vuote'],
  ['aiuto', 'apre questo elenco comandi'],
];

export async function showHelpDialog() {
  const body = document.createElement('div');
  const intro = document.createElement('p');
  intro.textContent = 'Comandi disponibili nel campo di testo durante la partita:';
  body.appendChild(intro);

  const list = document.createElement('ul');
  HELP_COMMANDS.forEach(([cmd, desc]) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = cmd;
    li.append(strong, `: ${desc}`);
    list.appendChild(li);
  });
  body.appendChild(list);

  return openDialog({
    titleText: 'Comandi disponibili',
    bodyNode: body,
    buttons: [{ label: 'Chiudi', value: true, primary: true }],
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
