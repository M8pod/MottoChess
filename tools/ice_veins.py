#!/usr/bin/env python3
"""Venature di ghiaccio per la scacchiera del set Orsi polari vs Pinguini.

Disegna UNA sola trama di crepe su tutta la scacchiera (8x8 caselle, 100 unità
ciascuna) e la salva in due colori: una per le caselle chiare (venature più
scure) e una per le scure (venature più chiare). Ogni casella mostra il suo
pezzetto della stessa trama (background-size 800%), così vista nell'insieme la
scacchiera è un mosaico in cui le venature continuano da una casella all'altra.

Uso: python3 tools/ice_veins.py [seme]
"""
import math, random, sys

seed = int(sys.argv[1]) if len(sys.argv) > 1 else 7
rnd = random.Random(seed)
SIZE = 800

def crack(x, y, ang, length, step=14, wobble=0.35):
    pts = [(x, y)]
    for _ in range(int(length / step)):
        ang += rnd.uniform(-wobble, wobble)
        x += math.cos(ang) * step * rnd.uniform(0.7, 1.3)
        y += math.sin(ang) * step * rnd.uniform(0.7, 1.3)
        pts.append((x, y))
    return pts, ang

def path(pts):
    return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts)

main, branches, twigs = [], [], []
# Tre grandi crepe che attraversano la scacchiera in diagonale.
for sx, sy, a in [(-20, 130, 0.45), (180, -20, 1.05), (-20, 560, -0.35)]:
    pts, _ = crack(sx, sy, a, 1150)
    main.append(pts)
    for i in range(3, len(pts) - 3, rnd.randint(5, 8)):
        bx, by = pts[i]
        side = rnd.choice((-1, 1))
        b, _ = crack(bx, by, a + side * rnd.uniform(0.6, 1.1), rnd.uniform(90, 220), 10, 0.5)
        branches.append(b)
        if rnd.random() < 0.6:
            j = len(b) // 2
            t, _ = crack(*b[j], a + side * rnd.uniform(1.2, 1.8), rnd.uniform(30, 70), 7, 0.6)
            twigs.append(t)

def svg(line, line_w, glint):
    g = []
    for group, w in ((main, 3.2), (branches, 1.9), (twigs, 1.1)):
        for pts in group:
            d = path(pts)
            # riflesso sottile accanto alla crepa: dà l'idea del ghiaccio
            g.append(f'<path d="{d}" stroke="{glint}" stroke-width="{w*0.6:.1f}" transform="translate(1.2,1.2)"/>')
            g.append(f'<path d="{d}" stroke="{line}" stroke-width="{w*line_w:.1f}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" '
            f'width="{SIZE}" height="{SIZE}" preserveAspectRatio="none">'
            f'<g fill="none" stroke-linecap="round" stroke-linejoin="round">'
            + ''.join(g) + '</g></svg>')

out = 'assets/boards/'
open(out + 'ghiaccio-venature-chiare.svg', 'w').write(svg('rgba(70,120,155,0.55)', 1, 'rgba(255,255,255,0.8)'))
open(out + 'ghiaccio-venature-scure.svg', 'w').write(svg('rgba(232,246,253,0.9)', 1.25, 'rgba(25,55,80,0.45)'))
print('ok', len(main), len(branches), len(twigs))
