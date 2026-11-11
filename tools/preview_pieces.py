# Anteprima: pezzi PNG su caselle colorate. uso: preview.py out.png chiaraHEX scuraHEX pezzo1.png [pezzo2.png ...]
import sys, struct, zlib, subprocess
sys.path.insert(0,'/Users/robertolachin/Dev/MottoChess/tools')
from process_piece import write_png
def read_rgba(path):
    bmp=path+'.p.bmp'; subprocess.run(['sips','-s','format','bmp',path,'--out',bmp],check=True,capture_output=True)
    d=open(bmp,'rb').read(); off=struct.unpack_from('<I',d,10)[0]; w,h=struct.unpack_from('<ii',d,18); bpp=struct.unpack_from('<H',d,28)[0]
    flip=h>0; h=abs(h); step=bpp//8; stride=(w*bpp//8+3)//4*4
    px=[]
    for y in range(h):
        src=(h-1-y) if flip else y; base=off+src*stride; row=[]
        for x in range(w):
            i=base+x*step; row.append((d[i+2],d[i+1],d[i],d[i+3] if step==4 else 255))
        px.append(row)
    subprocess.run(['rm','-f',bmp]); return w,px
out, light, dark = sys.argv[1], sys.argv[2], sys.argv[3]
pieces=[read_rgba(p) for p in sys.argv[4:]]
hx=lambda s:(int(s[0:2],16),int(s[2:4],16),int(s[4:6],16))
L,D=hx(light),hx(dark); S=168; n=len(pieces)
W=S*n
img=[[None]*W for _ in range(2*S)]
for row in range(2):
  for i,(w,px) in enumerate(pieces):
    bg = L if (row+i)%2==0 else D
    for y in range(S):
      for x in range(S):
        r,g,b,a=px[y][x]; f=a/255
        img[row*S+y][i*S+x]=(int(r*f+bg[0]*(1-f)),int(g*f+bg[1]*(1-f)),int(b*f+bg[2]*(1-f)),255)
# write non-square: adapt write_png for WxH
raw=bytearray()
for r in img:
    raw.append(0)
    for c in r: raw+=bytes(c)
def chunk(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xFFFFFFFF)
open(out,'wb').write(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',W,2*S,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(raw),9))+chunk(b'IEND',b''))
