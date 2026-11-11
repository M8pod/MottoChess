import sys, subprocess, numpy as np
def load(f):
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar','44100','-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,dtype=np.float32)
for f in sys.argv[1:]:
    x=load(f); hop=441
    env=np.array([np.sqrt(np.mean(x[i:i+hop]**2)+1e-12) for i in range(0,len(x)-hop,hop)])
    db=20*np.log10(env); thr=db.max()-18
    ons=[]; above=False
    for i,v in enumerate(db):
        if v>thr and not above: ons.append(i*0.01); above=True
        elif v<thr-6: above=False
    print(f.split('/')[-1], 'max %.1fdB'%db.max(), 'onsets', ' '.join('%.2f'%o for o in ons[:12]))
