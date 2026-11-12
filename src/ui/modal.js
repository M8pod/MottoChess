// Modale accessibile basata su <dialog> nativo (focus e semantica gestiti
// dal browser). Usato per la scelta di promozione, le conferme e l'aiuto.
//
// Titolo e testo sono collegati al dialogo con aria-labelledby e
// aria-describedby: all'apertura gli screen reader (VoiceOver, TalkBack,
// NVDA, JAWS) leggono subito domanda e spiegazione, non solo il pulsante che
// riceve il focus.
import { t } from '../i18n/i18n.js';

let dialogCounter = 0;

// describeBody: false per i dialoghi con contenuto lungo (l'aiuto), che si
// esplora a piacere invece di sentirlo leggere tutto all'apertura.
export function openDialog({ titleText, bodyNode, buttons, describeBody = true }) {
  return new Promise((resolve) => {
    dialogCounter += 1;
    const titleId = `dialog-title-${dialogCounter}`;
    const bodyId = `dialog-body-${dialogCounter}`;

    const dialog = document.createElement('dialog');
    dialog.className = 'app-dialog';
    dialog.setAttribute('aria-labelledby', titleId);

    const h2 = document.createElement('h2');
    h2.id = titleId;
    h2.textContent = titleText;
    dialog.appendChild(h2);

    if (bodyNode) {
      if (describeBody) {
        bodyNode.id = bodyNode.id || bodyId;
        dialog.setAttribute('aria-describedby', bodyNode.id);
      }
      dialog.appendChild(bodyNode);
    }

    const btnRow = document.createElement('div');
    btnRow.className = 'dialog-buttons';
    let resolved = false;
    let autofocusButton = null;

    buttons.forEach(({ label, value, primary, autofocus }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      if (primary) b.className = 'primary';
      if (autofocus) autofocusButton = b;
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
    if (autofocusButton) autofocusButton.focus();
  });
}

export async function askPromotionChoice() {
  const body = document.createElement('p');
  body.textContent = t('Scegli il pezzo per la promozione del pedone.');
  return openDialog({
    titleText: t('Promozione'),
    bodyNode: body,
    buttons: [
      { label: t('Dama'), value: 'q', primary: true },
      { label: t('Torre'), value: 'r' },
      { label: t('Alfiere'), value: 'b' },
      { label: t('Cavallo'), value: 'n' },
    ],
  });
}

// Conferma sì/no generica. Il focus parte sempre sul pulsante che NON fa
// nulla: un doppio tocco distratto non deve mai confermare un'azione
// irreversibile.
export async function askConfirmation({ titleText, bodyText, confirmLabel = t('Sì'), cancelLabel = t('No') }) {
  let bodyNode = null;
  if (bodyText) {
    bodyNode = document.createElement('p');
    bodyNode.textContent = bodyText;
  }
  const value = await openDialog({
    titleText,
    bodyNode,
    buttons: [
      { label: cancelLabel, value: false, autofocus: true },
      { label: confirmLabel, value: true, primary: true },
    ],
  });
  return value === true;
}

const HELP_COMMANDS = [
  ['Notazione mossa compatta', 'es. e4, Nf3, exd5. Lettere dei pezzi in inglese: N cavallo, B alfiere, R torre, Q dama, K re'],
  ['Promozione', 'e8 promuove a dama; e8=D, e8=T, e8=A, e8=C (oppure e8=Q, e8n) per scegliere il pezzo; a parole: Empoli 8 cavallo'],
  ['Notazione "città italiane"', 'es. Empoli 4, cavallo Firenze 3, alfiere mangia Como 5. Il numero si può scrivere anche in lettere: Empoli quattro'],
  ['Arrocco', 'corto: oo, 00 oppure O-O; lungo: ooo, 000 oppure O-O-O. Anche a parole: "arrocco corto" / "arrocco lungo"'],
  ['l', "annuncia l'ultima mossa giocata"],
  ['l + numero (es. l5)', 'annuncia le ultime N mosse giocate'],
  ['c', "annuncia il tempo residuo, tuo e dell'avversario"],
  ['s + numero (es. s4)', 'annuncia tutti i pezzi sulla traversa 4, comprese le caselle vuote'],
  ['s + lettera (es. se)', 'annuncia tutti i pezzi sulla colonna Empoli, comprese le caselle vuote'],
  ['p + lettera del pezzo (es. p b)', 'dove sono i pezzi di quel tipo: p b tutti gli alfieri, p n i cavalli, p r le torri, p q le dame, p k i re, p p i pedoni. Si può scrivere anche il nome: p torri'],
  ['p + pezzo + colore (es. p b b, p b n)', 'solo i pezzi bianchi (b) o neri (n): p b b alfieri bianchi, p b n alfieri neri. Anche a parole: p cavalli neri'],
  ['v', 'cambia lo stile della narrazione: compatto (N f3) o espanso, più semplice (cavallo in Firenze 3)'],
  ['m', 'accende o spegne la musica di sottofondo'],
  ['m+ / m-', 'alza o abbassa il volume della sola musica'],
  ['aiuto', 'apre questo elenco comandi'],
  ['diagnosi', 'annuncia gli ultimi spostamenti del cursore fuori dal campo comandi (utile per segnalare problemi)'],
  ['Scacchiera con tastiera', 'frecce per spostarsi fra le caselle, Invio o Spazio per selezionare e muovere'],
  ['Sospendi', 'il pulsante "Sospendi e torna al menu" salva la partita: la riprendi dalla schermata iniziale'],
];

export async function showHelpDialog() {
  const body = document.createElement('div');
  const intro = document.createElement('p');
  intro.textContent = t('Comandi disponibili nel campo di testo durante la partita:');
  body.appendChild(intro);

  const list = document.createElement('ul');
  HELP_COMMANDS.forEach(([cmd, desc]) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = t(cmd);
    li.append(strong, `: ${t(desc)}`);
    list.appendChild(li);
  });
  body.appendChild(list);

  return openDialog({
    titleText: t('Comandi disponibili'),
    bodyNode: body,
    describeBody: false,
    buttons: [{ label: t('Chiudi'), value: true, primary: true }],
  });
}

export async function askResignConfirmation() {
  return askConfirmation({ titleText: t('Confermi abbandono partita?') });
}
