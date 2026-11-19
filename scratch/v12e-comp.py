# usage: v12e-comp.py <area> <w> <registered.png> <ytop> [--dry] : v12e composite for a window whose LEFT border must be replaced too.
# Mask: 1 below ytop (smoothstep over 128 px), smoothstep 0->1 over 128 px from the top/right/bottom borders, NO ramp on the left border
# (the left band is replaced and propagated into the left-hand neighbours' overlap bands so both files agree there).
# Render-black and near-black Grok pixels keep the old window. Current files -> data/derived/$ARCH/windows (default archive-v12e, first time only).
import numpy as np, sys, os, shutil, json
from PIL import Image
from scipy.ndimage import gaussian_filter, binary_dilation
a,w,g,yt=sys.argv[1:5]; yt=int(yt); dry='--dry' in sys.argv; AR=os.environ.get('ARCH','archive-v12e')
D=f'data/derived/{a}/windows/{w}.png'; arch=f'data/derived/{AR}/windows/{a}/{w}.png'
os.makedirs(os.path.dirname(arch),exist_ok=True)
if not os.path.exists(arch): shutil.copy2(D,arch)
old=np.asarray(Image.open(D).convert('RGB')).astype(np.float32)
G=np.asarray(Image.open(g).convert('RGB').resize((1024,1024),Image.LANCZOS)).astype(np.float32)
r=np.asarray(Image.open(f'paint-test/v12/{w}-render.png').convert('RGB')).astype(np.float32)
y,x=np.mgrid[0:1024,0:1024]; ss=lambda t: (lambda u: u*u*(3-2*u))(np.clip(t,0,1))
d=np.minimum(1023-x,np.minimum(y,1023-y)).astype(np.float32)
M=ss(d/128)*ss((y-yt)/128.)
M[r.sum(2)<=30]=0; M[binary_dilation(G.sum(2)<=30,iterations=6)]=0; M=np.minimum(M,gaussian_filter((r.sum(2)>30).astype(np.float32),3))
out=(old*(1-M[...,None])+G*M[...,None]).clip(0,255).astype(np.uint8)
Image.fromarray(out).save(f'paint-test/v12/{w}-comp.png')
if not dry:
  Image.fromarray(out).save(D)
  A=[q['id'] for q in json.load(open('data/web/regions/trento/data/world.json'))['areas']]; i,j=map(int,w.split('_'))
  for dj in (-1,0,1):
    n=f'{i-1}_{j+dj}'; nf=next((f'data/derived/{b}/windows/{n}.png' for b in A if os.path.exists(f'data/derived/{b}/windows/{n}.png')),None)
    if not nf: continue
    na=f'data/derived/{AR}/windows/{nf.split("/")[2]}/{n}.png'; os.makedirs(os.path.dirname(na),exist_ok=True)
    if not os.path.exists(na): shutil.copy2(nf,na)
    N=np.asarray(Image.open(nf).convert('RGB')).astype(np.float32); ox,oy=-896,dj*896
    x0,x1=0,128; y0,y1=max(0,oy),min(1024,oy+1024)
    m=M[y0:y1,x0:x1,None]
    if m.max()==0: continue
    N[y0-oy:y1-oy,x0-ox:x1-ox]=N[y0-oy:y1-oy,x0-ox:x1-ox]*(1-m)+out[y0:y1,x0:x1]*m
    Image.fromarray(N.clip(0,255).astype(np.uint8)).save(nf); print('  band ->',nf)
print('comp',a,w,'ytop',yt,'mask mean %.2f'%M.mean(),'dry' if dry else 'written')
