# usage: texout.py <area+area> [thr=0.25] : forest texture per window interior: mean |L - blur(L)| (detail contrast) on assembled art at 1/2 scale over forest-render px;
# lists zone cells whose texture deviates > thr (relative) from the median of forest 8-neighbours. Also prints L mean.
import sys,os,glob,numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
ZA=sys.argv[1].split('+'); thr=float(sys.argv[2]) if len(sys.argv)>2 else 0.25
D='data/derived'; S=896; T=1024; Q=2; FC=np.array([115,168,81])
areas=sorted(d for d in os.listdir(D) if d.startswith('trento-') and d not in('trento-duomo','trento-htest'))
own={}
for a in areas:
  for f in glob.glob(f'{D}/{a}/windows/*.png'): own[os.path.basename(f)[:-4]]=a[7:]
tc={}
def tile(tx,ty):
  if (tx,ty) not in tc:
    art=None; fm=None
    for a in areas:
      f=f'{D}/{a}/paint/{tx}_{ty}.png'
      if os.path.exists(f): art=np.asarray(Image.open(f).convert('L').resize((T//Q,T//Q),Image.BOX),np.float32)
      r=f'{D}/{a}/render/{tx}_{ty}.png'
      if os.path.exists(r):
        m=np.abs(np.asarray(Image.open(r).convert('RGB').resize((T//Q,T//Q),Image.NEAREST)).astype(int)-FC).max(2)<=14
        fm=m if fm is None else fm|m
    tc[(tx,ty)]=(art,fm)
  return tc[(tx,ty)]
def cell(i,j):
  x0,y0=i*S+128,j*S+128; n=768//Q; A=np.zeros((n,n),np.float32); F=np.zeros((n,n),bool)
  for ty in range(y0//T,(y0+767)//T+1):
    for tx in range(x0//T,(x0+767)//T+1):
      art,fm=tile(tx,ty)
      if art is None or fm is None: return None
      sx0=max(x0,tx*T);sy0=max(y0,ty*T);sx1=min(x0+768,(tx+1)*T);sy1=min(y0+768,(ty+1)*T)
      A[(sy0-y0)//Q:(sy1-y0)//Q,(sx0-x0)//Q:(sx1-x0)//Q]=art[(sy0-ty*T)//Q:(sy1-ty*T)//Q,(sx0-tx*T)//Q:(sx1-tx*T)//Q]
      F[(sy0-y0)//Q:(sy1-y0)//Q,(sx0-x0)//Q:(sx1-x0)//Q]=fm[(sy0-ty*T)//Q:(sy1-ty*T)//Q,(sx0-tx*T)//Q:(sx1-tx*T)//Q]
  F&=A>20
  if F.mean()<0.4: return None
  det=np.abs(A-gaussian_filter(A,3))
  return float(det[F].mean()),float(A[F].mean())
C={}
for w,a in own.items():
  i,j=map(int,w.split('_'))
  if a in ZA:
    for di in(-1,0,1):
      for dj in(-1,0,1):
        k=(i+di,j+dj)
        if k not in C: C[k]=cell(*k)
out=[]
for w,a in own.items():
  i,j=map(int,w.split('_'))
  if a not in ZA or C.get((i,j)) is None: continue
  nb=[C[(i+di,j+dj)][0] for di in(-1,0,1) for dj in(-1,0,1) if (di or dj) and C.get((i+di,j+dj))]
  if len(nb)<2: continue
  med=float(np.median(nb)); rel=C[(i,j)][0]/med-1
  if abs(rel)>thr: out.append((abs(rel),a,w,rel,C[(i,j)][0],med))
for r,a,w,rel,t,m in sorted(out,reverse=True): print(f'{rel:+.2f} {a} {w} tex {t:.2f} nb {m:.2f}')
v=[c[0] for k,c in C.items() if c and own.get(f'{k[0]}_{k[1]}') in ZA]
print(len(out),'texture outliers >',thr,'; zone cells',len(v),'tex median %.2f p10 %.2f p90 %.2f'%(np.median(v),np.percentile(v,10),np.percentile(v,90)))
