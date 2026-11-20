# usage: v12-detail.py <x0> <y0> <x1> <y1> <gain> [--fadeup=N] [--fade=320] [--preview=out.png] [--all = every non-black px, not only forest] (env ARCH = archive dir, default archive-v12b) : v12b texfix-style detail gain on a box (global art px).
# Field g(x,y) = 1 + (gain-1)*w, w = 1 in the box, raised-cosine fade over --fade px outside (--fadeup overrides the fade above the box),
# times a soft forest mask (render green, dilate 4 + blur 12). Lab detail = image - gauss(image,6) is scaled by g in EVERY window file
# covering the field (all 16 areas, overlaps stay consistent). Render-black kept. Originals -> data/derived/archive-v12b/windows/<area>/.
import sys, os, json, shutil, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, binary_dilation
from skimage.color import rgb2lab, lab2rgb
a=[x for x in sys.argv[1:] if not x.startswith('--')]; opt=dict((x[2:]+'=1').split('=')[:2] for x in sys.argv[1:] if x.startswith('--'))
x0,y0,x1,y1=map(int,a[:4]); G=float(a[4]); F=float(opt.get('fade',320)); FU=float(opt.get('fadeup',F))
A16=open('/tmp/all16').read().strip().split(','); D='data/derived'
def tilecrop(kind,X0,Y0,W,H,last=True):
  out=np.zeros((H,W,3),np.uint8)
  for ty in range(Y0//1024,(Y0+H-1)//1024+1):
    for tx in range(X0//1024,(X0+W-1)//1024+1):
      f=next((f'{D}/{b}/{kind}/{tx}_{ty}.png' for b in (reversed(A16) if last else A16) if os.path.exists(f'{D}/{b}/{kind}/{tx}_{ty}.png')),None)
      if not f: continue
      im=Image.open(f)
      if im.mode=='RGBA': bg=Image.new('RGBA',im.size,(0,0,0,255)); bg.alpha_composite(im); im=bg
      t=np.asarray(im.convert('RGB')); ax0,ay0=max(X0,tx*1024),max(Y0,ty*1024); ax1,ay1=min(X0+W,tx*1024+1024),min(Y0+H,ty*1024+1024)
      out[ay0-Y0:ay1-Y0,ax0-X0:ax1-X0]=t[ay0-ty*1024:ay1-ty*1024,ax0-tx*1024:ax1-tx*1024]
  return out
def field(X0,Y0,W,H):
  Xg=X0+np.arange(W); Yg=Y0+np.arange(H)
  ex=np.maximum(np.maximum(x0-Xg,Xg-x1),0)[None,:]; up=np.maximum(y0-Yg,0)[:,None]; dn=np.maximum(Yg-y1,0)[:,None]
  d=np.sqrt((ex/F)**2+(up/FU)**2+(dn/F)**2); w=np.where(d<1,0.5*(1+np.cos(np.pi*np.minimum(d,1))),0)
  R=tilecrop('render',X0,Y0,W,H).astype(int); gr=binary_dilation((R[...,1]>R[...,0]+10)&(R[...,1]>R[...,2]+10),iterations=4) if 'all' not in opt else (R.sum(2)>30)
  return 1+(G-1)*w*gaussian_filter(gr.astype(np.float32),12)
def apply(Im,g):
  L=rgb2lab(Im); B=np.stack([gaussian_filter(L[...,c],6) for c in range(3)],-1); O=B+(L-B)*g[...,None]
  O=(lab2rgb(O)*255).round().clip(0,255).astype(np.uint8); k=Im.astype(int).sum(2)<=30; O[k]=Im[k]; return O
if 'preview' in opt:
  m=int(max(F,FU))+200; X0,Y0,W,H=x0-m,y0-m,x1-x0+2*m,y1-y0+2*m; P=tilecrop('paint',X0,Y0,W,H)
  Q=apply(P,field(X0,Y0,W,H)); s=max(1,W//1100)
  Image.fromarray(np.hstack([P,np.full((H,16,3),255,np.uint8),Q])).resize(((2*W+16)//s,H//s),Image.LANCZOS).save(opt['preview']); print('preview',opt['preview']); sys.exit()
n=0
for b in A16:
  for f in os.listdir(f'{D}/{b}/windows'):
    if not f.endswith('.png'): continue
    i,j=map(int,f[:-4].split('_')); wx,wy=i*896,j*896
    if wx>x1+F or wx+1024<x0-F or wy>y1+F or wy+1024<y0-FU: continue
    g=field(wx,wy,1024,1024)
    if np.abs(g-1).max()<0.02: continue
    p=f'{D}/{b}/windows/{f}'; ar=f'{D}/{os.environ.get("ARCH","archive-v12b")}/windows/{b}/{f}'; os.makedirs(os.path.dirname(ar),exist_ok=True)
    if not os.path.exists(ar): shutil.copy2(p,ar)
    Image.fromarray(apply(np.asarray(Image.open(p).convert('RGB')),g)).save(p); n+=1; print('  ',b,f)
print('detail gain',G,'windows changed',n)
