// themes/factions: set pezzi "a fazioni".
//
// In un set a fazioni i due schieramenti hanno un'identità propria (gatti e
// cani, samurai e ninja, judogi bianco e blu) al posto del generico bianco e
// nero. Il legame fra fazione e colore può essere di due tipi:
//
//  - FISSO, deciso dal set. Nel Judo il judogi bianco è sempre il bianco e il
//    blu sempre il nero, e i file restano nominati per colore (wP.png,
//    bP.png): il Judo non compare qui. In Cani vs Gatti i gatti (esercito
//    chiaro) sono sempre il bianco e i cani (esercito scuro, con Roger) sempre
//    il nero — decisione dell'11 novembre 2026 — ma i file sono nominati per
//    fazione (gattiP.png, caniK.png), quindi il set sta in FIXED_FACTIONS.
//    Non c'è niente da chiedere al giocatore: sceglie solo il colore.
//  - SCELTO dal giocatore (SET_FACTIONS): "chi impersono" e "con che colore
//    gioco" sono due domande indipendenti; la fazione scelta prende il colore
//    scelto, l'altra fazione l'altro colore. Oggi nessun set lo usa (Cani vs
//    Gatti lo usava fino all'11/11/2026), ma il meccanismo resta pronto.
//
// La fazione è un'informazione GRAFICA e SONORA: narrazione, notazione e PGN
// continuano a parlare di bianco e nero (decisione del 10 settembre 2026),
// perché sono lo standard scacchistico che il giocatore usa anche per
// scrivere le proprie mosse nel campo comandi.

// Set con fazione legata al colore e file nominati per fazione.
export const FIXED_FACTIONS = {
  'cani-gatti': { w: 'gatti', b: 'cani' },
};

// Set con fazione da scegliere. Formato di una voce:
//   'nome-set': {
//     legend: 'Chi vuoi impersonare?',
//     options: [{ value: 'gatti', label: 'Gatti' }, { value: 'cani', label: 'Cani' }],
//   }
export const SET_FACTIONS = {};

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
  if (FIXED_FACTIONS[setName]) return { ...FIXED_FACTIONS[setName] };
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

// Fazione impersonata dal giocatore (per PGN e simili), o null. Nei set a
// fazione fissa dipende solo dal colore, e ignora l'eventuale fazione salvata
// in una partita iniziata prima che il legame diventasse fisso.
export function playerFaction(setName, color, faction) {
  const map = factionsByColor(setName, { faction, color });
  return map ? map[color] : null;
}
