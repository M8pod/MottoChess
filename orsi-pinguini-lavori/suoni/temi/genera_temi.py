# Temi musicali Orsi vs Pinguini con Ongaku (ACE-Step), senza ascolto automatico.
import sys, json
sys.path.insert(0, '/Users/robertolachin/Dev/Utility/Ongaku')
from ongaku.canta import nuova_canzone
COMUNE = ("Instrumental only, no vocals. A short jingle for a chess game set in the Arctic, ice and snow. "
          "Shared sound palette: celesta and glockenspiel like tinkling ice, soft arctic wind. ")
ORSI = "Polar bears: low register, tuba, French horns, timpani, deep cellos, big and majestic, slow heavy steps. "
PING = "Penguins: high register, xylophone, pizzicato strings, piccolo flute, bouncy waddling rhythm, playful. "
TEMI = {
 'sigla_orsi':        COMUNE + ORSI + "Opening fanfare, proud and warm, like the curtain rising on a frozen kingdom.",
 'sigla_pinguini':    COMUNE + PING + "Opening theme, cheerful and cheeky, like a parade of penguins arriving.",
 'vittoria_orsi':     COMUNE + ORSI + "Triumphant victory fanfare, ending on a big major chord.",
 'vittoria_pinguini': COMUNE + PING + "Joyful victory celebration, happy and fast, ending on a bright major chord.",
 'sconfitta_orsi':    COMUNE + ORSI + "Funny sad defeat: slow descending tuba line, a big sigh, gentle and not dramatic, minor key.",
 'sconfitta_pinguini':COMUNE + PING + "Funny sad defeat: descending xylophone and a 'wah wah' muted trumpet, gentle, minor key.",
 'patta':             COMUNE + "Neutral draw: calm suspended chords on celesta and soft strings, both bears' low horns and penguins' high flute together, peaceful, unresolved then gently settling.",
}
solo = sys.argv[1:] or list(TEMI)
for nome in solo:
    print('===', nome, flush=True)
    cartella, dati = nuova_canzone(TEMI[nome], durata=20, versioni=2, strumentale=True, ascolta=False,
                                   avvisa=lambda m: print(m, flush=True))
    print('CARTELLA', nome, cartella, flush=True)
