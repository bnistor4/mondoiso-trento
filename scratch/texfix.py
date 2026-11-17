#!/usr/bin/env python3
# usage: texfix.py <mod-area,...> <all-area,...> [--sigma=1.2] [--min-forest=0.4] [--maxgain=2.0] [--dry]
# v11 forest texture harmonizer: measure each window cell's forest detail amplitude (mean |L - gauss(L,3)| at 1/2 scale over forest-render px of the
# assembled art, interior outside the 128 px overlaps, as scratch/texout.py), build a smoothed target per cell (gaussian over neighbouring forest
# cells in log space, sigma in cells), log-gain = target - own for cells owned by <mod-area> (others 0), bilinearly interpolate the log-gain over
# global pixels (continuous across windows, so overlaps agree) and scale the Lab detail (image - gauss(image,6)) of the owning windows/<w>.png by it,
# weighted by a soft forest-render mask. Originals archived to <area>/archive/v11/windows-tex/ (first time only).
import sys,os,shutil,numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
from skimage.color import rgb2lab,lab2rgb
args=[a for a in sys.argv[1:] if not a.startswith('--')]; opt=dict((a[2:]+'=1').split('=')[:2] for a in sys.argv[1:] if a.startswith('--'))
MOD=['trento-'+a.replace('trento-','') for a in args[0].split(',')]; ALL=['trento-'+a.replace('trento-','') for a in args[1].split(',')]
SIG=float(opt.get('sigma',1.2)); MINF=float(opt.get('min-forest',0.4)); MG=float(opt.get('maxgain',2.0)); DRY='dry' in opt
D='/workspace/mondoiso-trento/data/derived'; T=1024; Q=2; S=896; FC=np.array([115,168,81])
art={}; rend={}
for a in ALL:
  for layer in ('paint','render'):
    d=f'{D}/{a}/{layer}'
    if os.path.isdir(d):
      for f in os.listdir(d):
        if f.endswith('.png') and f[:-4].replace('-','').replace('_','').isdigit():
          if layer=='paint': art[f[:-4]]=f'{d}/{f}'
          else: rend.setdefault(f[:-4],[]).append(f'{d}/{f}')
owner={}
for a in ALL:
  d=f'{D}/{a}/windows'
  if os.path.isdir(d):
    for f in os.listdir(d):
      if f.endswith('.png'): owner.setdefault(f[:-4],a)
fcache={}
def fmask(k,size,res=Image.NEAREST):
  if (k,size) not in fcache:
    m=np.zeros((size,size),bool)
    for p in rend.get(k,[]):
      r=np.asarray(Image.open(p).convert('RGB').resize((size,size),res)).astype(int); m|=np.abs(r-FC).max(2)<=14
    fcache[(k,size)]=m
  return fcache[(k,size)]
acache={}
def artL(k):
  if k not in acache: acache[k]=np.asarray(Image.open(art[k]).convert('L').resize((T//Q,T//Q),Image.BOX),np.float32) if k in art else None
  return acache[k]
def cell(i,j):
  x0,y0=i*S+128,j*S+128; n=768//Q; A=np.zeros((n,n),np.float32); F=np.zeros((n,n),bool)
  for ty in range(y0//T,(y0+767)//T+1):
    for tx in range(x0//T,(x0+767)//T+1):
      k=f'{tx}_{ty}'; a=artL(k)
      if a is None: return None
      fm=fmask(k,T//Q)
      sx0=max(x0,tx*T);sy0=max(y0,ty*T);sx1=min(x0+768,(tx+1)*T);sy1=min(y0+768,(ty+1)*T)
      A[(sy0-y0)//Q:(sy1-y0)//Q,(sx0-x0)//Q:(sx1-x0)//Q]=a[(sy0-ty*T)//Q:(sy1-ty*T)//Q,(sx0-tx*T)//Q:(sx1-tx*T)//Q]
      F[(sy0-y0)//Q:(sy1-y0)//Q,(sx0-x0)//Q:(sx1-x0)//Q]=fm[(sy0-ty*T)//Q:(sy1-ty*T)//Q,(sx0-tx*T)//Q:(sx1-tx*T)//Q]
  F&=A>20
  if F.mean()<MINF: return None
  return float(np.abs(A-gaussian_filter(A,3))[F].mean())
need=set()
for w,a in owner.items():
  if a in MOD:
    i,j=map(int,w.split('_')); R=int(np.ceil(3*SIG))
    for dj in range(-R,R+1):
      for di in range(-R,R+1): need.add((i+di,j+dj))
cells={}
for k in need:
  if f'{k[0]}_{k[1]}' in owner:
    t=cell(*k)
    if t: cells[k]=np.log(t)
R=int(np.ceil(3*SIG)); lg={}
for (i,j),l in cells.items():
  if owner[f'{i}_{j}'] not in MOD: continue
  num=0.;den=0.
  for dj in range(-R,R+1):
    for di in range(-R,R+1):
      n=cells.get((i+di,j+dj))
      if n is None: continue
      wg=np.exp(-(di*di+dj*dj)/(2*SIG*SIG)); num+=wg*n; den+=wg
  lg[(i,j)]=float(np.clip(num/den-l,-np.log(MG),np.log(MG)))
g=np.exp(np.array(list(lg.values())))
print(f'texfix: {len(cells)} forest cells, {len(lg)} to adjust in {",".join(a[7:] for a in MOD)}; gain median {np.median(g):.2f} p10 {np.percentile(g,10):.2f} p90 {np.percentile(g,90):.2f} min {g.min():.2f} max {g.max():.2f}')
def lget(i,j): return lg.get((i,j),0.)
xs=np.arange(1024); done=0
for (i,j) in sorted(lg):
  if abs(lg[(i,j)])<0.05 and all(abs(lget(i+di,j+dj))<0.05 for di in(-1,0,1) for dj in(-1,0,1)): continue
  w=f'{i}_{j}'; a=owner[w]
  gx=(i*S+xs-512)/S; ci=np.floor(gx).astype(int); fx=gx-ci
  gy=(j*S+xs-512)/S; cj=np.floor(gy).astype(int); fy=gy-cj
  field=np.zeros((1024,1024))
  for yi in np.unique(cj):
    for xi in np.unique(ci):
      my=(cj==yi); mx=(ci==xi); FX=fx[mx][None,:]; FY=fy[my][:,None]
      field[np.ix_(my,mx)]=lget(xi,yi)*(1-FX)*(1-FY)+lget(xi+1,yi)*FX*(1-FY)+lget(xi,yi+1)*(1-FX)*FY+lget(xi+1,yi+1)*FX*FY
  gx0,gy0=i*S,j*S; m=np.zeros((1024,1024),np.float32)
  for ty in range(gy0//T,(gy0+1023)//T+1):
    for tx in range(gx0//T,(gx0+1023)//T+1):
      k=f'{tx}_{ty}'
      if k not in rend: continue
      fm=fmask(k,T).astype(np.float32)
      sx0=max(gx0,tx*T);sx1=min(gx0+1024,(tx+1)*T);sy0=max(gy0,ty*T);sy1=min(gy0+1024,(ty+1)*T)
      m[sy0-gy0:sy1-gy0,sx0-gx0:sx1-gx0]=np.maximum(m[sy0-gy0:sy1-gy0,sx0-gx0:sx1-gx0],fm[sy0-ty*T:sy1-ty*T,sx0-tx*T:sx1-tx*T])
  m=np.clip(gaussian_filter(m,6),0,1)
  p=f'{D}/{a}/windows/{w}.png'; im=np.asarray(Image.open(p).convert('RGB')).astype(np.float64)/255.0
  m*=(im.sum(2)*255>30)
  lab=rgb2lab(im); base=np.stack([gaussian_filter(lab[...,c],6) for c in range(3)],-1)
  gain=np.exp(field)*m+(1-m)
  out=(np.clip(lab2rgb(base+(lab-base)*gain[...,None]),0,1)*255+0.5).astype(np.uint8)
  if not DRY:
    ad=f'{D}/{a}/archive/v11/windows-tex'; os.makedirs(ad,exist_ok=True)
    if not os.path.exists(f'{ad}/{w}.png'): shutil.copy2(p,f'{ad}/{w}.png')
    Image.fromarray(out).save(p)
  done+=1
  print(f'  {a[7:]} {w} gain {np.exp(lg[(i,j)]):.2f} forest {m.mean():.2f}')
print(f'texfix: {"would adjust" if DRY else "adjusted"} {done} windows')
