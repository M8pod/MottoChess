import subprocess, re, sys
OUT='../../assets/sounds/cani-gatti/'
# nome finale: [(sorgente, inizio, fine)], fade-out s, picco dBFS
SPEC = {
 'cg_move_gatti':   ([('move_gatti_1',0.27,0.62)], 0.08, -3),
 'cg_move_cani':    ([('move_cani_3',0.13,0.40)], 0.06, -3),
 'cg_capture_gatti':([('capture_gatti_3',0.0,1.0)], 0.12, -1),
 'cg_capture_cani': ([('capture_cani_4',0.24,0.80)], 0.12, -1),
 'cg_touch':        ([('touch_1',0.0,0.26)], 0.10, -10),
 'cg_castle':       ([('castle_1',0.05,0.95)], 0.15, -2),
 'cg_promotion':    ([('promotion_3',0.0,1.0)], 0.15, -1),
 'cg_session_gatti':([('session_gatti_4',2.7,5.1)], 0.30, -1),
 'cg_session_cani': ([('session_cani_2',0.25,1.0)], 0.15, -1),
 'cg_win_gatti':    ([('win_gatti_3',0.0,0.85),('win_gatti_4',0.05,1.0)], 0.20, -1),
 'cg_win_cani':     ([('win_cani_2',0.12,1.85)], 0.20, -1),
 'cg_loss_gatti':   ([('loss_gatti_2',0.0,1.6)], 0.20, -1),
 'cg_loss_cani':    ([('loss_cani_2',0.0,2.6)], 0.25, -2),
 'cg_draw':         ([('draw_2',0.0,1.75)], 0.25, -5),
}
# guadagno extra (dB) con limitatore, per suoni fatti di transienti brevissimi
BOOST={'cg_move_cani':15}
def run(args): return subprocess.run(args,capture_output=True,text=True)
for name,(segs,fo,peak) in SPEC.items():
    ins=[]; fl=[]
    for i,(src,a,b) in enumerate(segs):
        ins+=['-i',f'grezzi/{src}.mp3']
        fl.append(f'[{i}:a]atrim={a}:{b},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo,afade=t=in:d=0.005[s{i}]')
    if len(segs)>1:
        fl.append(''.join(f'[s{i}]' for i in range(len(segs)))+f'concat=n={len(segs)}:v=0:a=1[c]'); last='c'
    else: last='s0'
    dur=sum(b-a for _,a,b in segs)
    fl.append(f'[{last}]afade=t=out:st={max(0,dur-fo)}:d={fo}[o]')
    tmp=f'/tmp/{name}.wav'
    run(['ffmpeg','-y','-v','error',*ins,'-filter_complex',';'.join(fl),'-map','[o]','-c:a','pcm_f32le',tmp])
    st=run(['ffmpeg','-i',tmp,'-af','astats=measure_overall=Peak_level:measure_perchannel=0','-f','null','-']).stderr
    p=float(re.findall(r'Peak level dB: (-?[\d.]+)',st)[-1])
    out=OUT+name+'.wav'
    boost=BOOST.get(name,0)
    af=f'volume={peak-p+boost}dB'
    if boost: af+=f',alimiter=limit={10**(peak/20):.4f}:attack=1:release=30:level=disabled'
    run(['ffmpeg','-y','-v','error','-i',tmp,'-af',af,'-c:a','pcm_s16le',out])
    e=run(['ffmpeg','-i',out,'-af','ebur128=peak=true','-f','null','-']).stderr
    I=re.findall(r'I:\s+(-?[\d.]+) LUFS',e)[-1]
    print(f'{name:18s} {dur:4.2f}s  picco {peak} dB  {I} LUFS')
