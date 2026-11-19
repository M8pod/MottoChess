"""Candidati suoni Orsi vs Pinguini da anteprime Freesound CC0 (freesound/elenco.tsv)."""
import subprocess, re, sys
F='freesound/'
def run(a): return subprocess.run(a,capture_output=True,text=True)
def seg(src,a,d,pitch=1.0,extra=''):
    f=f'atrim={a}:{a+d},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=mono'
    if pitch!=1.0: f+=f',asetrate={int(44100*pitch)},aresample=44100'
    if extra: f+=','+extra
    return (F+src, f+f',afade=t=in:d=0.004,afade=t=out:st={max(0,d/pitch-0.06):.3f}:d=0.06')
def build(name, parts, peak=-3, tail=0.0):
    """parts: [(src_filter, delay_s, gain_db)] mixati insieme."""
    ins=[];fl=[]
    for i,((src,f),delay,g) in enumerate(parts):
        ins+=['-i',src]; fl.append(f'[{i}:a]{f},volume={g}dB,adelay={int(delay*1000)}|{int(delay*1000)},apad=pad_dur={tail}[s{i}]')
    fl.append(''.join(f'[s{i}]' for i in range(len(parts)))+f'amix=inputs={len(parts)}:normalize=0:duration=longest,silenceremove=stop_periods=-1:stop_threshold=-60dB:stop_silence=0.15[m]')
    tmp=f'/tmp/{name}.wav'
    r=run(['ffmpeg','-y','-v','error',*ins,'-filter_complex',';'.join(fl),'-map','[m]','-c:a','pcm_f32le',tmp])
    if r.stderr: print(r.stderr); return
    st=run(['ffmpeg','-i',tmp,'-af','astats=measure_overall=Peak_level:measure_perchannel=0','-f','null','-']).stderr
    p=float(re.findall(r'Peak level dB: (-?[\d.]+)',st)[-1])
    out=f'candidati/{name}.wav'
    run(['ffmpeg','-y','-v','error','-i',tmp,'-af',f'volume={peak-p}dB','-ac','2','-c:a','pcm_s16le',out])
    d=float(run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',out]).stdout)
    print(f'{name:22s} {d:.2f}s')

NOX='passi_neve_02_613849.mp3'; FLO='passi_neve3_01_453168.mp3'; CRA='passi_neve2_02_560874.mp3'; NEW='passi_neve3_03_348248.mp3'
# Mossa orsi: un passo solo, pesante e grave
if 'mosse' in sys.argv: build('mossa_orsi_1',[(seg(NOX,1.80,0.55,0.80,'lowpass=f=3500,bass=g=6'),0,0)])
if 'mosse' in sys.argv: build('mossa_orsi_2',[(seg(FLO,15.40,0.55,0.78,'lowpass=f=3500,bass=g=6'),0,0)])
# Mossa pinguini: tre passetti leggeri e acuti, ondeggianti
if 'mosse' in sys.argv: build('mossa_pinguini_1',[(seg(CRA,0.95,0.16,1.35,'highpass=f=300'),0,0),(seg(CRA,1.55,0.16,1.45,'highpass=f=300'),0.15,-2),(seg(CRA,0.95,0.16,1.40,'highpass=f=300'),0.30,-1)])
if 'mosse' in sys.argv: build('mossa_pinguini_2',[(seg(NEW,4.30,0.18,1.30,'highpass=f=300'),0,0),(seg(NEW,5.27,0.18,1.42,'highpass=f=300'),0.14,-2),(seg(NEW,6.06,0.18,1.36,'highpass=f=300'),0.28,-1)])

# Catture: ghiaccio che si spezza + verso breve. Orsi più gravi, pinguini più acuti.
if 'catture' in sys.argv:
    G6='ghiaccio_06_755506.mp3'; G5='ghiaccio_05_342546.mp3'; G1='ghiaccio_01_262635.mp3'
    PB='orso2_01_588556.mp3'; BA='orso_01_763026.mp3'; COL='pinguino2_01_150873.mp3'
    build('cattura_orsi_1',[(seg(G6,0.28,0.70,0.85),0,0),(seg(PB,0.70,0.70,0.95,'lowpass=f=5000'),0.22,-2)],peak=-1)
    build('cattura_orsi_2',[(seg(G5,0.38,0.30,0.85),0,0),(seg(G5,1.25,0.25,0.80),0.12,-3),(seg(BA,2.90,0.95,1.0,'highpass=f=60'),0.25,0)],peak=-1)
    build('cattura_pinguini_1',[(seg(G6,0.28,0.70,1.15),0,0),(seg(COL,3.38,0.72,1.0,'highpass=f=400'),0.20,-1)],peak=-1)
    build('cattura_pinguini_2',[(seg(G1,0.05,0.30,1.2),0,0),(seg(G1,0.45,0.25,1.25),0.10,-3),(seg(COL,5.60,0.55,1.05,'highpass=f=400'),0.22,-1)],peak=-1)

# Arrocco: scivolata + due mattoni d'igloo che si posano. Promozione: scintillio di cristalli. Tocco: tintinnio di ghiaccio leggero.
if 'altri' in sys.argv:
    SL='arrocco2_01_'; TH='arrocco3_02_'; BR='arrocco4_02_'
    import glob
    g=lambda p: glob.glob(F+p+'*')[0].split('/')[-1]
    build('arrocco_1',[(seg(g(SL),0,0.40,0.85),0,0),(seg(g(BR),0,0.55,0.95),0.32,0),(seg(g(BR),0,0.55,1.05),0.58,-1)],peak=-2)
    build('arrocco_2',[(seg(g(TH),0,0.70,0.9),0,-2),(seg(g(BR),0,0.55,0.90),0.55,0),(seg(g(BR),0,0.55,1.0),0.80,-1)],peak=-2)
    build('promozione_1',[(seg(g('promo2_05_'),0,1.8,1.0),0,0)],peak=-1)
    build('promozione_2',[(seg(g('promo2_01_'),0,2.3,1.0),0,0)],peak=-1)
    build('tocco_1',[(seg(g('tocco3_03_'),0,0.35,1.2),0,0)],peak=-10)
    build('tocco_2',[(seg(g('tocco3_04_'),0,0.22,1.1),0,0)],peak=-10)
