#!/usr/bin/env python3
"""Post-produzione di un pezzo del set Judo di Motto Chess.

Gemini restituisce PNG 16:9 senza canale alfa, con la scacchiera della
trasparenza *dipinta* nell'immagine. Questo script:
  1. rimuove lo sfondo (flood fill dai bordi sui grigi della scacchiera)
  2. ritaglia un canvas quadrato con il judoka centrato e i piedi su una
     linea di terra comune, scalato secondo il rapporto d'altezza previsto
     dalle specifiche del set (re 1.00, pedone 0.70, ...)
  3. riduce alla dimensione finale con filtro a media (antialiasing anche
     sul canale alfa)
  4. scrive un PNG RGBA

Nessuna dipendenza esterna: legge via BMP (prodotto da sips) e scrive il
PNG a mano con zlib.
"""
import subprocess
import struct
import sys
import zlib
from collections import deque

BOTTOM_MARGIN = 0.03  # margine sotto i piedi, in frazione del lato del canvas


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


def remove_background(w, h, px):
    """Flood fill dai bordi: e' sfondo solo cio' che e' raggiungibile da fuori,
    cosi' un grigio interno alla figura (i capelli del re) resta opaco."""
    alpha = [[255] * w for _ in range(h)]
    seen = [[False] * w for _ in range(h)]
    q = deque()

    def push(x, y):
        if 0 <= x < w and 0 <= y < h and not seen[y][x] and is_checkerboard(px[y][x]):
            seen[y][x] = True
            q.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    while q:
        x, y = q.popleft()
        alpha[y][x] = 0
        push(x + 1, y)
        push(x - 1, y)
        push(x, y + 1)
        push(x, y - 1)
    return alpha


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


def compose_square(w, h, px, alpha, ratio):
    """Canvas quadrato: la figura occupa `ratio` dell'altezza, centrata in
    orizzontale, piedi appoggiati alla linea di terra comune."""
    minx, miny, maxx, maxy = bounding_box(w, h, alpha)
    fig_h = maxy - miny + 1
    fig_w = maxx - minx + 1
    side = int(round(fig_h / ratio))
    side = max(side, fig_w + 8)  # non tagliare mai la figura in larghezza

    ox = (side - fig_w) // 2 - minx
    oy = side - int(round(side * BOTTOM_MARGIN)) - maxy - 1

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


def main():
    src, dst, ratio, size = sys.argv[1], sys.argv[2], float(sys.argv[3]), int(sys.argv[4])
    w, h, px = read_png_as_rgb(src)
    alpha = remove_background(w, h, px)
    opaque = sum(1 for y in range(h) for x in range(w) if alpha[y][x])
    side, img = compose_square(w, h, px, alpha, ratio)
    small = downscale(side, img, size)
    write_png(dst, size, small)
    print(f'{src}: sorgente {w}x{h}, figura opaca {100*opaque//(w*h)}% dei pixel, '
          f'canvas quadrato {side}px -> {dst} {size}x{size} RGBA')


if __name__ == '__main__':
    main()
