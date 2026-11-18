# usage: v12-comp.py <area> <w> <registered.png> <all|veg> [--dry] : composite a Grok repaint into window <w> of <area>
#  M = content mask (all, or render-green areas dilated 8 + blur 16) * interior ramp (0 at the window border -> 1 at 128 px, smoothstep),
#  render-black pixels keep the old window. Original -> data/derived/archive-v12/windows/<area>/<w>.png (first time only). Writes paint-test/v12/<w>-comp.png too.
import sys, os, shutil, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, binary_dilation
a,w,g,mode=sys.argv[1:5]; dry='--dry' in sys.argv
D=f'data/derived/{a}/windows/{w}.png'; arch=f'data/derived/{os.environ.get("ARCH","archive-v12")}/windows/{a}/{w}.png'
os.makedirs(os.path.dirname(arch),exist_ok=True)
if not os.path.exists(arch): shutil.copy2(D,arch)
old=np.asarray(Image.open(arch).convert('RGB')).astype(np.float32)
G=np.asarray(Image.open(g).convert('RGB').resize((1024,1024),Image.LANCZOS)).astype(np.float32)
r=np.asarray(Image.open(f'paint-test/v12/{w}-render.png').convert('RGB')).astype(np.float32)
if mode=='veg': c=binary_dilation((r[...,1]>r[...,0]+10)&(r[...,1]>r[...,2]+10),iterations=8).astype(np.float32); c=gaussian_filter(c,16)
else: c=np.ones((1024,1024),np.float32)
y,x=np.mgrid[0:1024,0:1024]; d=np.minimum(np.minimum(x,1023-x),np.minimum(y,1023-y)).astype(np.float32)
t=np.clip(d/128,0,1); e=t*t*(3-2*t)
if '--full' in sys.argv: e=np.ones_like(e)
M=c*e; M[r.sum(2)<=30]=0; M[binary_dilation(G.sum(2)<=30,iterations=6)]=0; M=np.minimum(M,gaussian_filter((r.sum(2)>30).astype(np.float32),3)*1.0)
out=(old*(1-M[...,None])+G*M[...,None]).clip(0,255).astype(np.uint8)
Image.fromarray(out).save(f'paint-test/v12/{w}-comp.png')
if not dry: Image.fromarray(out).save(D)
if '--full' in sys.argv and not dry:   # also write the new pixels into every overlapping neighbour window (their bands copy this window)
  import json; A=[x['id'] for x in json.load(open('data/web/regions/trento/data/world.json'))['areas']]; i,j=map(int,w.split('_'))
  for di in (-1,0,1):
    for dj in (-1,0,1):
      if di==dj==0: continue
      n=f'{i+di}_{j+dj}'; nf=next((f'data/derived/{b}/windows/{n}.png' for b in A if os.path.exists(f'data/derived/{b}/windows/{n}.png')),None)
      if not nf: continue
      na=f'data/derived/archive-v12/windows/{nf.split("/")[2]}/{n}.png'; os.makedirs(os.path.dirname(na),exist_ok=True)
      if not os.path.exists(na): shutil.copy2(nf,na)
      N=np.asarray(Image.open(nf).convert('RGB')).astype(np.float32); ox,oy=di*896,dj*896   # neighbour origin in this window's px
      x0,x1=max(0,ox),min(1024,ox+1024); y0,y1=max(0,oy),min(1024,oy+1024)
      m=M[y0:y1,x0:x1,None]; sub=N[y0-oy:y1-oy,x0-ox:x1-ox]; N[y0-oy:y1-oy,x0-ox:x1-ox]=sub*(1-m)+out[y0:y1,x0:x1]*m
      Image.fromarray(N.clip(0,255).astype(np.uint8)).save(nf); print('  band ->',nf)
print('comp',a,w,mode,'mask mean %.2f'%M.mean(),'dry' if dry else 'written')
