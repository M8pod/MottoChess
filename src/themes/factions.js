// themes/factions: set pezzi "a fazioni".
//
// In un set a fazioni i due schieramenti hanno un'identità propria (gatti e
// cani, samurai e ninja, judogi bianco e blu) al posto del generico bianco e
// nero. Il legame fra fazione e colore può essere di due tipi:
//
//  - FISSO, deciso dal set: nel Judo il judogi bianco è sempre il bianco e il
//    blu è sempre il nero; nei Samurai vs Ninja i samurai saranno sempre
//    bianchi. Non c'è niente da chiedere al giocatore e i file dei pezzi
//    restano nominati per colore (wP.png, bP.png), quindi questi set non
//    compaiono qui sotto.
//  - SCELTO dal giocatore, ed è il caso di Cani vs Gatti: "chi impersono" e
//    "con che colore gioco" sono due domande indipendenti. Insieme
//    determinano la mappatura — la fazione scelta prende il colore scelto,
//    l'altra fazione l'altro colore. Chi sceglie i gatti e il nero gioca
//    quindi coi gatti neri contro i cani bianchi, e la scacchiera resta
//    orientata secondo il colore, come in qualsiasi altra partita.
//
// La fazione è un'informazione GRAFICA e SONORA: narrazione, notazione e PGN
// continuano a parlare di bianco e nero (decisione del 10 settembre 2026),
// perché sono lo standard scacchistico che il giocatore usa anche per
// scrivere le proprie mosse nel campo comandi.
export const SET_FACTIONS = {
  'cani-gatti': {
    legend: 'Chi vuoi impersonare? (scelta obbligatoria)',
    options: [
      { value: 'gatti', label: 'Gatti', one: 'gatto' },
      { value: 'cani', label: 'Cani', one: 'cane' },
    ],
  },
};

// Descrittore delle fazioni di un set, o null se il set non ne ha da far
// scegliere.
export function factionSet(setName) {
  return SET_FACTIONS[setName] || null;
}

export function factionValues(setName) {
  const set = factionSet(setName);
  return set ? set.options.map((o) => o.value) : [];
}

// Come per il colore, 'casuale' viene sciolto una volta sola quando la
// partita parte, non a ogni lettura.
export function resolveFaction(setName, choice) {
  const values = factionValues(setName);
  if (values.length === 0) return null;
  if (values.includes(choice)) return choice;
  return values[Math.floor(Math.random() * values.length)];
}

// Mappatura colore -> fazione valida per tutta la partita, es.
// { w: 'cani', b: 'gatti' }. null per i set senza fazioni da scegliere: lì i
// pezzi sono già nominati per colore e non serve nessuna mappatura.
export function factionsByColor(setName, { faction, color }) {
  const values = factionValues(setName);
  if (values.length === 0) return null;
  // Nessuna estrazione casuale qui dentro: la scelta è già stata sciolta da
  // resolveFaction() all'avvio partita, e questa funzione viene chiamata
  // anche in seguito (deve dare sempre la stessa risposta).
  const mine = values.includes(faction) ? faction : values[0];
  const other = values.find((v) => v !== mine);
  const oppColor = color === 'w' ? 'b' : 'w';
  return { [color]: mine, [oppColor]: other };
}
