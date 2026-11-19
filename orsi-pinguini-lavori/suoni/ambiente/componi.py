"""Ambiente "Notte al Polo Nord" a strati, in loop senza giunta.
uso: python3 componi.py A|B musica.wav uscita.wav
Strati: vento (sempre) + tappeto Ongaku + tintinnii sparsi + eventi rari (renne che passano con panning,
oh oh oh lontano con eco, gufo). Niente ghiaccio, ringhi, pinguini o passi: sono suoni del gioco."""
import sys, glob, subprocess, numpy as np
from scipy.signal import fftconvolve
SR = 44100; LUNGHEZZA = 240.0; GIUNTA = 8.0
FS = '/Users/robertolachin/Dev/Games/MottoChess/orsi-pinguini-lavori/suoni/ambiente/freesound/'
rng = np.random.default_rng(19)

def carica(path, a=0, b=None):
    f = glob.glob(FS + path + '*')[0] if not path.startswith('/') else path
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    x = x[int(a * SR): (int(b * SR) if b else None)]
    n = min(len(x), int(0.02 * SR)); x[:n] *= np.linspace(0, 1, n)[:, None]; x[-n:] *= np.linspace(1, 0, n)[:, None]
    return x

def db(v): return 10 ** (v / 20)
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
def a_livello(x, dbfs): return x * db(dbfs) / rms(x)

def lontano(x, quanto):
    """più quanto è alto (0-1), più il suono è ovattato e riverberato."""
    from scipy.signal import butter, sosfilt
    sos = butter(2, 9000 - 6500 * quanto, 'low', fs=SR, output='sos')
    y = sosfilt(sos, x, axis=0)
    t = np.arange(int(2.2 * SR)) / SR
    ir = np.stack([rng.standard_normal(len(t)) * np.exp(-t * 3.0) for _ in range(2)], 1); ir[0] = 0
    ir /= np.sqrt((ir ** 2).sum(0))
    wet = np.stack([fftconvolve(y[:, c], ir[:, c])[:len(y) + len(t) - 1] for c in range(2)], 1)
    dry = np.vstack([y, np.zeros((len(t) - 1, 2))])
    return dry * (1 - 0.6 * quanto) + wet * (0.3 + 0.6 * quanto)

def pan(x, da, a):
    """panning a potenza costante che si muove da 'da' ad 'a' (-1 sinistra, +1 destra)."""
    m = x.mean(1); p = np.linspace(da, a, len(m)); th = (p + 1) * np.pi / 4
    return np.stack([m * np.cos(th), m * np.sin(th)], 1) * np.sqrt(2)

def passaggio(sec, da, a):
    """renne con slitta: sonagli + zoccoli che arrivano, passano davanti e se ne vanno."""
    b = carica('sonagli_05', 0.7, 0.7 + sec); z = carica('zoccoli2_01', 1.0, 1.0 + sec)
    n = min(len(b), len(z)); x = a_livello(b[:n], -20) + a_livello(z[:n], -23)
    env = np.sin(np.linspace(0, np.pi, n)) ** 1.6
    x = pan(x * env[:, None], da, a)
    return lontano(x, 0.35)

def mescola(dove, x, t, dbfs=None):
    i = int(t * SR); x = a_livello(x, dbfs) if dbfs is not None else x
    j = min(len(dove), i + len(x)); dove[i:j] += x[:j - i]

def loop_vento(nomi, durata):
    pezzi = [carica(n) for n in nomi]; out = np.zeros((0, 2)); k = 0; cf = int(4 * SR)
    while len(out) < durata * SR + cf:
        p = pezzi[k % len(pezzi)]; k += 1
        if len(out) == 0: out = p.copy(); continue
        r = np.linspace(0, 1, cf)[:, None]
        out = np.vstack([out[:-cf], out[-cf:] * (1 - r) + p[:cf] * r, p[cf:]])
    return out[:int(durata * SR)]

def componi(versione, musica, uscita):
    T = LUNGHEZZA + GIUNTA; N = int(T * SR); mix = np.zeros((N, 2))
    if versione == 'A':
        vento = loop_vento(['vento_02', 'vento_06'], T); mix += a_livello(vento, -30)
        mus = carica(musica); mus = np.vstack([mus, mus])[:N]; mix[:len(mus)] += a_livello(mus, -27)
        a = np.arange(12, LUNGHEZZA - 10, 17.0); tintinnii = list(a + rng.uniform(-4, 4, len(a)))
        renne = [(62, -1, 1), (171, 1, -1)]; ohoho = [96, 208]; gufi = [134]; carillon = [30, 150]
    else:
        vento = loop_vento(['vento_03', 'vento_02', 'vento_06'], T); mix += a_livello(vento, -26)
        mus = carica(musica); mus = np.vstack([mus, mus])[:N]; mix[:len(mus)] += a_livello(mus, -34)
        a = np.arange(20, LUNGHEZZA - 10, 31.0); tintinnii = list(a + rng.uniform(-5, 5, len(a)))
        renne = [(118, -1, 1)]; ohoho = [186]; gufi = [52, 160]; carillon = []
    for t in tintinnii:
        src = rng.choice(['sonagli_04', 'campanelle_01', 'sonagli_01'])
        x = carica(src); x = pan(x, *(rng.uniform(-0.9, 0.9),) * 2)
        mescola(mix, lontano(x, 0.6), t, -36 if versione == 'A' else -39)
    for t, da, a in renne: mescola(mix, passaggio(6.0, da, a), t, -27)
    for t in ohoho:
        x = pan(carica('hohoho_03', 0.05, 1.95), *(rng.choice([-0.6, 0.6]),) * 2)
        mescola(mix, lontano(x, 0.75), t, -31 if versione == 'A' else -34)
    for t in gufi:
        x = pan(carica('gufo_01', 1.6, 4.2), *(rng.uniform(-0.8, 0.8),) * 2)
        mescola(mix, lontano(x, 0.7), t, -31)
    for t in carillon:
        mescola(mix, lontano(carica('carillon_03', 0, 6), 0.5), t, -37)
    # giunta: gli ultimi GIUNTA secondi si sovrappongono all'inizio -> loop senza scatti
    g = int(GIUNTA * SR); r = np.linspace(0, 1, g)[:, None]
    out = mix[:int(LUNGHEZZA * SR)].copy(); out[:g] = out[:g] * r + mix[-g:] * (1 - r)
    out *= 0.9 / max(1e-9, np.abs(out).max()) if np.abs(out).max() > 0.9 else 1
    pcm = (np.clip(out, -1, 1) * 32767).astype('<i2').tobytes()
    tmp = uscita + '.tmp.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', tmp], input=pcm)
    import re
    e = subprocess.run(['ffmpeg', '-i', tmp, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', e)[-1])
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', f'volume={-22 - I}dB,alimiter=limit=0.8:level=disabled', uscita])
    subprocess.run(['rm', tmp]); print(uscita, 'loudness prima', I)

componi(sys.argv[1], sys.argv[2], sys.argv[3])
