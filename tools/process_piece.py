#!/usr/bin/env python3
"""Post-produzione di un pezzo di Motto Chess (set raster: Judo, Cani vs Gatti).

Gemini restituisce PNG senza canale alfa. Lo sfondo può essere:
  - la scacchiera della trasparenza *dipinta* nell'immagine (set Judo);
  - una tinta unita chiesta apposta nel prompt (Cani vs Gatti: magenta pieno,
    un colore che nessun pezzo usa).

Questo script:
  1. rimuove lo sfondo (flood fill dai bordi: è sfondo solo ciò che è
     raggiungibile da fuori, così un colore simile DENTRO la figura resta)
  2. toglie l'alone del colore di sfondo rimasto sul bordo della figura
  3. ritaglia un canvas quadrato con la figura centrata e appoggiata a una
     linea di terra comune, scalata secondo il rapporto d'altezza del pezzo
  4. facoltativo: aggiunge un bordo bianco uniforme "stile adesivo" attorno
     alla sagoma, identico per spessore su tutti i pezzi del set — è ciò che
     rende leggibile il pezzo su qualunque colore di casella
  5. riduce alla dimensione finale con filtro a media (antialiasing anche
     sul canale alfa) e scrive un PNG RGBA

Uso:
  python3 tools/process_piece.py <sorgente.png> <destinazione.png> <rapporto altezza> <lato>
         [--bg auto|checker|RRGGBB] [--sticker PX]

  --bg       auto (predefinito): riconosce da solo scacchiera o tinta unita
             guardando gli angoli; checker: forza la scacchiera; RRGGBB:
             forza una tinta unita (es. FF00FF).
  --sticker  spessore del bordo bianco in pixel dell'immagine FINALE
             (es. 3 su 168). 0 o assente = nessun bordo.

Nessuna dipendenza esterna: legge via BMP (prodotto da sips) e scrive il
PNG a mano con zlib.
"""
import subprocess
import struct
import sys
import zlib
from collections import deque

BOTTOM_MARGIN = 0.03  # margine sotto i piedi, in frazione del lato del canvas
SOLID_TOLERANCE = 110  # distanza RGB entro cui un pixel è "colore di sfondo"
STICKER_RGB = (255, 255, 255)
SUPERSAMPLE = 4  # il bordo adesivo si calcola a 4x la risoluzione finale


def read_png_as_rgb(path):
    bmp = path + '.tmp.bmp'
    subprocess.run(['sips', '-s', 'format', 'bmp', path, '--out', bmp],
                   check=True, capture_output=True)
    d = open(bmp, 'rb').read()
    off = struct.unpack_from('<I', d, 10)[0]
    w, h = struct.unpack_from('<ii', d, 18)
    bpp = struct.unpack_from('<H', d, 28)[0]
    flip = h > 0
    h = abs(h)
    stride = (w * bpp // 8 + 3) // 4 * 4
    step = bpp // 8
    px = [[None] * w for _ in range(h)]
    for y in range(h):
        src = (h - 1 - y) if flip else y
        base = off + src * stride
        rowpx = px[y]
        for x in range(w):
            i = base + x * step
            rowpx[x] = (d[i + 2], d[i + 1], d[i])
    subprocess.run(['rm', '-f', bmp], check=False)
    return w, h, px


def is_checkerboard(c):
    """Grigio neutro nella fascia dei due grigi della scacchiera (#BFBFBF/#E7E7E7)."""
    r, g, b = c
    if abs(r - g) > 10 or abs(g - b) > 10 or abs(r - b) > 10:
        return False
    return 0xA8 <= r <= 0xF2


def dist2(a, b):
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2


def detect_background(w, h, px):
    """Guarda quattro riquadri d'angolo: se sono tutti dello stesso colore
    (a meno di poco) lo sfondo è una tinta unita, altrimenti scacchiera."""
    k = max(4, min(w, h) // 64)
    samples = []
    for (x0, y0) in ((0, 0), (w - k, 0), (0, h - k), (w - k, h - k)):
        for y in range(y0, y0 + k):
            for x in range(x0, x0 + k):
                samples.append(px[y][x])
    avg = tuple(sum(c[i] for c in samples) // len(samples) for i in range(3))
    spread = max(dist2(c, avg) for c in samples)
    if spread < 30 ** 2 and not is_checkerboard(avg):
        return avg
    return None  # scacchiera


def remove_background(w, h, px, bg_color):
    """Flood fill dai bordi: e' sfondo solo cio' che e' raggiungibile da fuori,
    cosi' un colore simile interno alla figura resta opaco."""
    if bg_color is None:
        is_bg = is_checkerboard
    else:
        tol2 = SOLID_TOLERANCE ** 2

        def is_bg(c):
            return dist2(c, bg_color) <= tol2

    alpha = [[255] * w for _ in range(h)]
    seen = [[False] * w for _ in range(h)]
    q = deque()

    def push(x, y):
        if 0 <= x < w and 0 <= y < h and not seen[y][x] and is_bg(px[y][x]):
            seen[y][x] = True
            q.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    def drain():
        while q:
            x, y = q.popleft()
            alpha[y][x] = 0
            push(x + 1, y)
            push(x - 1, y)
            push(x, y + 1)
            push(x, y - 1)

    drain()

    # Isole di sfondo chiuse dentro la figura (es. il buco fra zampa e
    # guancia): con il magenta, che per contratto nessun pezzo usa, si
    # tolgono anche quelle, partendo solo da pixel magenta quasi puro
    # (la lingua rosa #E8829A dista ~165 dal magenta, ben oltre la soglia).
    if bg_color is not None:
        br, bgc, bb = bg_color
        if br > 150 and bb > 150 and bgc < 100:
            strict2 = 60 ** 2
            for y in range(h):
                for x in range(w):
                    if not seen[y][x] and dist2(px[y][x], bg_color) <= strict2:
                        push(x, y)
                        drain()
    return alpha


def despill(w, h, px, alpha, bg_color):
    """Sul bordo della figura i pixel antialiasati sono un misto fra il
    contorno nero e lo sfondo: con il magenta resterebbe un alone viola.
    Ai pixel opachi vicini allo sfondo si toglie la componente del colore di
    sfondo (per il magenta: rosso e blu in eccesso sul verde)."""
    if bg_color is None:
        return
    br, bgc, bb = bg_color
    magenta_like = br > 150 and bb > 150 and bgc < 100
    for y in range(h):
        for x in range(w):
            if not alpha[y][x]:
                continue
            near = False
            for dy in (-2, -1, 0, 1, 2):
                yy = y + dy
                if 0 <= yy < h:
                    row = alpha[yy]
                    for dx in (-2, -1, 0, 1, 2):
                        xx = x + dx
                        if 0 <= xx < w and not row[xx]:
                            near = True
                            break
                if near:
                    break
            if not near:
                continue
            r, g, b = px[y][x]
            if magenta_like and min(r, b) - g > 25:
                px[y][x] = (g, g, g)
            elif not magenta_like and dist2(px[y][x], bg_color) < (SOLID_TOLERANCE + 40) ** 2:
                alpha[y][x] = 0


def bounding_box(w, h, alpha):
    minx, maxx, miny, maxy = w, -1, h, -1
    for y in range(h):
        row = alpha[y]
        for x in range(w):
            if row[x]:
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
    return minx, miny, maxx, maxy


def compose_square(w, h, px, alpha, ratio, pad_frac):
    """Canvas quadrato: la figura occupa `ratio` dell'altezza, centrata in
    orizzontale, piedi appoggiati alla linea di terra comune. pad_frac
    riserva spazio attorno alla sagoma per il bordo adesivo."""
    minx, miny, maxx, maxy = bounding_box(w, h, alpha)
    fig_h = maxy - miny + 1
    fig_w = maxx - minx + 1
    side = int(round(fig_h / ratio))
    # non tagliare mai la figura in larghezza (bordo adesivo compreso)
    side = max(side, int(fig_w / (1 - 2 * pad_frac)) + 8)

    ox = (side - fig_w) // 2 - minx
    oy = side - int(round(side * (BOTTOM_MARGIN + pad_frac))) - maxy - 1

    out = [[(0, 0, 0, 0)] * side for _ in range(side)]
    for y in range(miny, maxy + 1):
        ty = y + oy
        if not (0 <= ty < side):
            continue
        for x in range(minx, maxx + 1):
            tx = x + ox
            if 0 <= tx < side and alpha[y][x]:
                r, g, b = px[y][x]
                out[ty][tx] = (r, g, b, 255)
    return side, out


def downscale(side, img, size):
    """Media a blocchi con premoltiplicazione dell'alfa: evita aloni scuri
    sui bordi trasparenti."""
    out = []
    for oy in range(size):
        y0 = oy * side // size
        y1 = max(y0 + 1, (oy + 1) * side // size)
        row = []
        for ox in range(size):
            x0 = ox * side // size
            x1 = max(x0 + 1, (ox + 1) * side // size)
            sr = sg = sb = sa = 0
            n = 0
            for y in range(y0, y1):
                for x in range(x0, x1):
                    r, g, b, a = img[y][x]
                    f = a / 255.0
                    sr += r * f; sg += g * f; sb += b * f; sa += a
                    n += 1
            a = sa / n
            if a < 0.5:
                row.append((0, 0, 0, 0))
            else:
                k = sa / 255.0
                row.append((int(round(sr / k)), int(round(sg / k)),
                            int(round(sb / k)), int(round(a))))
        out.append(row)
    return out


def add_sticker(size, img, radius):
    """Bordo uniforme attorno alla sagoma: ogni pixel trasparente entro
    `radius` dalla figura diventa bianco, sotto la figura. Distanza calcolata
    con una trasformata a due passate (chamfer 3-4), veloce anche in Python
    puro."""
    INF = 10 ** 9
    d = [[0 if img[y][x][3] >= 128 else INF for x in range(size)] for y in range(size)]
    for y in range(size):
        for x in range(size):
            v = d[y][x]
            if v == 0:
                continue
            if x > 0: v = min(v, d[y][x - 1] + 3)
            if y > 0:
                v = min(v, d[y - 1][x] + 3)
                if x > 0: v = min(v, d[y - 1][x - 1] + 4)
                if x < size - 1: v = min(v, d[y - 1][x + 1] + 4)
            d[y][x] = v
    for y in range(size - 1, -1, -1):
        for x in range(size - 1, -1, -1):
            v = d[y][x]
            if v == 0:
                continue
            if x < size - 1: v = min(v, d[y][x + 1] + 3)
            if y < size - 1:
                v = min(v, d[y + 1][x] + 3)
                if x < size - 1: v = min(v, d[y + 1][x + 1] + 4)
                if x > 0: v = min(v, d[y + 1][x - 1] + 4)
            d[y][x] = v
    limit = radius * 3
    out = []
    for y in range(size):
        row = []
        for x in range(size):
            r, g, b, a = img[y][x]
            if d[y][x] <= limit and a < 255:
                # la figura (anche semitrasparente sul bordo) sopra il bianco
                f = a / 255.0
                row.append((int(round(r * f + STICKER_RGB[0] * (1 - f))),
                            int(round(g * f + STICKER_RGB[1] * (1 - f))),
                            int(round(b * f + STICKER_RGB[2] * (1 - f))), 255))
            else:
                row.append((r, g, b, a))
        out.append(row)
    return out


def write_png(path, size, img):
    raw = bytearray()
    for row in img:
        raw.append(0)  # filtro "None"
        for r, g, b, a in row:
            raw += bytes((r, g, b, a))

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data +
                struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF))

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')
    open(path, 'wb').write(png)


def parse_args(argv):
    pos, opts = [], {'bg': 'auto', 'sticker': 0}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('--bg', '--sticker'):
            opts[a[2:]] = argv[i + 1]
            i += 2
        else:
            pos.append(a)
            i += 1
    if len(pos) != 4:
        sys.exit(__doc__)
    return pos, opts


def main():
    (src, dst, ratio, size), opts = parse_args(sys.argv[1:])
    ratio, size = float(ratio), int(size)
    sticker = float(opts['sticker'])

    w, h, px = read_png_as_rgb(src)
    if opts['bg'] == 'auto':
        bg = detect_background(w, h, px)
    elif opts['bg'] == 'checker':
        bg = None
    else:
        hx = opts['bg'].lstrip('#')
        bg = (int(hx[0:2], 16), int(hx[2:4], 16), int(hx[4:6], 16))

    alpha = remove_background(w, h, px, bg)
    despill(w, h, px, alpha, bg)
    opaque = sum(1 for y in range(h) for x in range(w) if alpha[y][x])

    pad_frac = (sticker + 1) / size if sticker > 0 else 0.0
    side, img = compose_square(w, h, px, alpha, ratio, pad_frac)
    if sticker > 0:
        big = SUPERSAMPLE * size
        img = add_sticker(big, downscale(side, img, big), sticker * SUPERSAMPLE)
        small = downscale(big, img, size)
    else:
        small = downscale(side, img, size)
    write_png(dst, size, small)
    kind = 'scacchiera' if bg is None else 'tinta unita #%02X%02X%02X' % bg
    print(f'{src}: sorgente {w}x{h}, sfondo {kind}, figura opaca {100*opaque//(w*h)}% dei pixel, '
          f'canvas {side}px -> {dst} {size}x{size} RGBA'
          + (f', bordo adesivo {sticker:g}px' if sticker > 0 else ''))


if __name__ == '__main__':
    main()
