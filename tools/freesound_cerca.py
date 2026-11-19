#!/usr/bin/env python3
"""Cerca su Freesound SOLO suoni CC0 e scarica l'anteprima HQ (mp3) dei primi risultati.
Uso: python3 tools/freesound_cerca.py <cartella> <etichetta> "<ricerca>" [quanti] [durata_max]
Scrive <cartella>/<etichetta>_NN_<id>.mp3 e aggiunge le info a <cartella>/elenco.tsv
(etichetta, file, id, autore, titolo, durata, download, licenza CC0, pagina).
"""
import html, re, subprocess, sys, urllib.parse
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131 Safari/537.36"
out, tag, q = sys.argv[1], sys.argv[2], sys.argv[3]
n = int(sys.argv[4]) if len(sys.argv) > 4 else 6
dmax = float(sys.argv[5]) if len(sys.argv) > 5 else 30
url = "https://freesound.org/search/?" + urllib.parse.urlencode({"q": q, "f": 'license:"Creative Commons 0"'})
page = subprocess.run(["curl", "-s", "-A", UA, url], capture_output=True, text=True).stdout
blocks = page.split('class="bw-player"')[1:]
k = 0
for b in blocks:
    g = lambda a: (re.search(a + r'="([^"]*)"', b) or [None, ""])[1]
    sid, user, title, dur, mp3 = g("data-sound-id"), g("data-username"), html.unescape(g("data-title")), float(g("data-duration") or 0), g("data-mp3")
    if not mp3 or dur > dmax:
        continue
    k += 1
    f = f"{out}/{tag}_{k:02d}_{sid}.mp3"
    subprocess.run(["curl", "-s", "-A", UA, "-o", f, mp3.replace("-lq.mp3", "-hq.mp3")])
    with open(f"{out}/elenco.tsv", "a") as fh:
        fh.write("\t".join([tag, f.split("/")[-1], sid, user, title, f"{dur:.1f}", g("data-num-downloads"), "CC0",
                            f"https://freesound.org/people/{user}/sounds/{sid}/"]) + "\n")
    print(f"{tag} {k}: {title} — {user}, {dur:.1f}s, {g('data-num-downloads')} download")
    if k >= n:
        break
