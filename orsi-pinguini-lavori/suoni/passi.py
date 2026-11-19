import numpy as np, subprocess, sys
from scipy.signal import find_peaks
def load(f):
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar','44100','-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,dtype=np.float32)
for f in sys.argv[1:]:
    x=load(f); sr=44100; w=int(0.06*sr); hop=441
    e=np.array([np.sqrt(np.mean(x[i:i+w]**2)+1e-12) for i in range(0,len(x)-w,hop)])
    db=20*np.log10(e)
    p,_=find_peaks(db,distance=35,prominence=8)
    best=sorted(p,key=lambda i:-db[i])[:6]
    print(f, ' '.join(f'{i/100:.2f}({db[i]:.0f})' for i in sorted(best)))
