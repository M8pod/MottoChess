import sys
sys.path.insert(0, '/Users/robertolachin/Dev/Utility/Ongaku')
from ongaku.canta import nuova_canzone
R = ("Instrumental only, no vocals, no drums, no percussion, no bass line. Very soft ambient Christmas background "
     "for a snowy Arctic night: gentle celesta and music box notes, warm soft string pad, slow and sparse, "
     "calm and dreamy, no strong melody, quiet and even dynamics, like a distant lullaby carried by the wind. "
     "Slow tempo around 60 bpm, major key.")
c, d = nuova_canzone(R, durata=240, versioni=2, strumentale=True, ascolta=False, avvisa=lambda m: print(m, flush=True))
print('CARTELLA', c, flush=True)
