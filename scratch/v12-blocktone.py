# usage: [ARCH=archive-v12b PM=pm-v12f.npy] v12-blocktone.py <x0> <y0> <x1> <y1> [--k=1.0] [--all = all non-black px, not only render-green] : v12 tone match of a repainted block (global art box) to its ring.
# delta = CIELAB mean of the ring 128..640 px outside the box - mean inside (render-green pixels only, assembled-art mosaic pm-v12e),
# applied as a global field (1 inside the box, raised-cosine fade over 320 px outside) to every window file covering it.
import sys, os, json, shutil, numpy as np
from PIL import Image
from skimage.color import rgb2lab, lab2rgb
x0,y0,x1,y1=map(int,sys.argv[1:5]); K=float(next((a[4:] for a in sys.argv if a.startswith('--k=')),1))
g=json.load(open('/workspace/v12/mosaic-z6.json')); M=np.load('/workspace/v12/'+os.environ.get('PM','pm-v12e.npy'),mmap_mode='r'); P=np.load('/workspace/v12/mosaic-z6-photo.npy',mmap_mode='r')
def box(a,b,c,d): return (slice((b-g['Y0'])//4,(d-g['Y0'])//4),slice((a-g['X0'])//4,(c-g['X0'])//4))
o=box(x0-640,y0-640,x1+640,y1+640); A=rgb2lab(np.asarray(M[o])); R=np.asarray(P[o]).astype(int)
green=((R[...,1]>R[...,0]+10)&(R[...,1]>R[...,2]+10)) if '--all' not in sys.argv else (R.sum(2)>30)
yy,xx=np.mgrid[0:A.shape[0],0:A.shape[1]]; X=x0-640+xx*4; Y=y0-640+yy*4
dx=np.maximum(np.maximum(x0-X,X-x1),0); dy=np.maximum(np.maximum(y0-Y,Y-y1),0); dd=np.hypot(dx,dy)
inside=(dd==0)&green; ring=(dd>=128)&(dd<=640)&green
D=(A[ring].mean(0)-A[inside].mean(0))*K; print('blocktone',x0,y0,x1,y1,'delta Lab',D.round(1),'n',inside.sum(),ring.sum())
A16=open('/tmp/all16').read().strip().split(','); n=0
for a in A16:
  for f in os.listdir(f'data/derived/{a}/windows'):
    if not f.endswith('.png'): continue
    i,j=map(int,f[:-4].split('_')); wx,wy=i*896,j*896
    if wx>x1+320 or wx+1024<x0-320 or wy>y1+320 or wy+1024<y0-320: continue
    p=f'data/derived/{a}/windows/{f}'; ar=f'data/derived/{os.environ.get("ARCH","archive-v12")}/windows/{a}/{f}'; os.makedirs(os.path.dirname(ar),exist_ok=True)
    if not os.path.exists(ar): shutil.copy2(p,ar)
    Xg=wx+np.arange(1024); Yg=wy+np.arange(1024)
    ex=np.maximum(np.maximum(x0-Xg,Xg-x1),0); ey=np.maximum(np.maximum(y0-Yg,Yg-y1),0); d=np.hypot(ex[None,:],ey[:,None])
    w=np.where(d<320,0.5*(1+np.cos(np.pi*np.minimum(d,320)/320)),0)
    Im=np.asarray(Image.open(p).convert('RGB')); keep=Im.astype(int).sum(2)<=30
    L=rgb2lab(Im)+w[...,None]*D; O=(lab2rgb(L)*255).round().clip(0,255).astype(np.uint8); O[keep]=Im[keep]
    Image.fromarray(O).save(p); n+=1; print('  ',a,f)
print('windows changed',n)
