# usage: v12-haze.py x0 y0 x1 y1 ref1x0,ref1y0,ref1x1,ref1y1[;ref2...] [--fade=320] [--preview=out.png] : v12c de-haze / moment match of a box.
# Per Lab channel, fit art = a*render + b on the reference boxes (a = std ratio, b = mean offset, assembled art vs render),
# target for the box = a*render_box + b (mean and std), correction L' = L + w*((L-mB)*(tS/sB-1) + (tM-mB)), w = 1 in the box,
# raised-cosine fade over --fade px outside. Applied to every window file covering it (archive dir env ARCH, default archive-v12c).
import sys, os, shutil, numpy as np
from PIL import Image
from skimage.color import rgb2lab, lab2rgb
a=[x for x in sys.argv[1:] if not x.startswith('--')]; opt=dict((x[2:]+'=1').split('=')[:2] for x in sys.argv[1:] if x.startswith('--'))
x0,y0,x1,y1=map(int,a[:4]); refs=[list(map(int,r.split(','))) for r in a[4].split(';')]; F=float(opt.get('fade',320))
src=open('scratch/v12-detail.py').read(); A16=open('/tmp/all16').read().strip().split(','); D='data/derived'
exec("def tilecrop"+src.split("def tilecrop")[1].split("def field")[0])
def stats(b):
  A=tilecrop('paint',b[0],b[1],b[2]-b[0],b[3]-b[1]); R=tilecrop('render',b[0],b[1],b[2]-b[0],b[3]-b[1]); ok=(A.astype(int).sum(2)>30)&(R.astype(int).sum(2)>30)
  return rgb2lab(A)[ok], rgb2lab(R)[ok]
RA=[];RR=[]
for r in refs: x,y=stats(r); RA.append(x); RR.append(y)
RA=np.concatenate(RA); RR=np.concatenate(RR); ka=RA.std(0)/RR.std(0); kb=RA.mean(0)-ka*RR.mean(0)
BA,BR=stats((x0,y0,x1,y1)); mB,sB=BA.mean(0),BA.std(0); tM=ka*BR.mean(0)+kb; tS=ka*BR.std(0)
print('box mean',mB.round(1),'std',sB.round(1),'| target mean',tM.round(1),'std',tS.round(1))
def weight(X0,Y0,W,H):
  Xg=X0+np.arange(W); Yg=Y0+np.arange(H); ex=np.maximum(np.maximum(x0-Xg,Xg-x1),0)[None,:]; ey=np.maximum(np.maximum(y0-Yg,Yg-y1),0)[:,None]
  d=np.hypot(ex,ey)/F; return np.where(d<1,0.5*(1+np.cos(np.pi*np.minimum(d,1))),0)
def apply(Im,w):
  L=rgb2lab(Im); O=L+w[...,None]*((L-mB)*(tS/sB-1)+(tM-mB)); O=(lab2rgb(O)*255).round().clip(0,255).astype(np.uint8); k=Im.astype(int).sum(2)<=30; O[k]=Im[k]; return O
if 'preview' in opt:
  m=int(F)+300; X0,Y0,W,H=x0-m,y0-m,x1-x0+2*m,y1-y0+2*m; P=tilecrop('paint',X0,Y0,W,H); Q=apply(P,weight(X0,Y0,W,H)); s=max(1,W//900)
  Image.fromarray(np.hstack([P,np.full((H,16,3),255,np.uint8),Q])).resize(((2*W+16)//s,H//s),Image.LANCZOS).save(opt['preview']); print('preview',opt['preview']); sys.exit()
n=0; AR=os.environ.get('ARCH','archive-v12c')
for b in A16:
  for f in os.listdir(f'{D}/{b}/windows'):
    if not f.endswith('.png'): continue
    i,j=map(int,f[:-4].split('_')); wx,wy=i*896,j*896
    if wx>x1+F or wx+1024<x0-F or wy>y1+F or wy+1024<y0-F: continue
    p=f'{D}/{b}/windows/{f}'; ar=f'{D}/{AR}/windows/{b}/{f}'; os.makedirs(os.path.dirname(ar),exist_ok=True)
    if not os.path.exists(ar): shutil.copy2(p,ar)
    Image.fromarray(apply(np.asarray(Image.open(p).convert('RGB')),weight(wx,wy,1024,1024))).save(p); n+=1; print('  ',b,f)
print('haze fix windows changed',n)
