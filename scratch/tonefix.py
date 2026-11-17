#!/usr/bin/env python3
# usage: tonefix.py <mod-area,...> <all-area,...> [--sigma=1.2] [--min-forest=0.4] [--dry] [--archive=v10|v11]
# v10 fix3 colour-match: measure each window cell's forest mean CIELAB on the assembled art (as tonecheck.py),
# build a smoothed target per cell (gaussian over neighbouring forest cells, sigma in cells), delta = target - own
# for cells owned by <mod-area> (others fixed at 0), bilinearly interpolate the delta field over global pixels
# (continuous across windows, so 128 px overlaps blend consistently) and add it, weighted by a soft render-forest
# mask, to the owning windows/<w>.png. Originals archived to <area>/archive/v10/windows-tone/.
import sys, os, shutil, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
from skimage.color import rgb2lab, lab2rgb
args=[a for a in sys.argv[1:] if not a.startswith('--')]; opt=dict((a[2:]+'=1').split('=')[:2] for a in sys.argv[1:] if a.startswith('--'))
MOD=['trento-'+a.replace('trento-','') for a in args[0].split(',')]; ALL=['trento-'+a.replace('trento-','') for a in args[1].split(',')]
SIG=float(opt.get('sigma',1.2)); MINF=float(opt.get('min-forest',0.4)); DRY='dry' in opt
D='/workspace/mondoiso-trento/data/derived'; T=1024; Q=8; t=T//Q; FC=np.array([115,168,81])
art={}; rend={}
for a in ALL:
  for layer,m in (('paint',art),('render',rend)):
    d=f'{D}/{a}/{layer}'
    if os.path.isdir(d):
      for f in os.listdir(d):
        if f.endswith('.png') and f[:-4].replace('-','').replace('_','').isdigit(): m.setdefault(f[:-4],[]).append(f'{d}/{f}') if layer=='render' else m.__setitem__(f[:-4],f'{d}/{f}')
ks=[tuple(map(int,k.split('_'))) for k in art]; x0=min(k[0] for k in ks); y0=min(k[1] for k in ks)
W=(max(k[0] for k in ks)-x0+1)*t; H=(max(k[1] for k in ks)-y0+1)*t
A=np.zeros((H,W,3),np.float32); F=np.zeros((H,W),bool)
def forest(paths,size,res):
  m=np.zeros((size,size),bool)
  for p in paths:
    r=np.asarray(Image.open(p).convert('RGB').resize((size,size),res)).astype(int); m|=np.abs(r-FC).max(2)<=14
  return m
for k,f in art.items():
  tx,ty=map(int,k.split('_')); px,py=(tx-x0)*t,(ty-y0)*t
  A[py:py+t,px:px+t]=np.asarray(Image.open(f).convert('RGB').resize((t,t),Image.BOX),np.float32)
  if k in rend: F[py:py+t,px:px+t]=forest(rend[k],t,Image.NEAREST)
owner={}
for a in ALL:
  d=f'{D}/{a}/windows'
  if os.path.isdir(d):
    for f in os.listdir(d):
      if f.endswith('.png'): owner.setdefault(f[:-4],a)
S=896//Q; O=128//Q; cells={}
for w,a in owner.items():
  i,j=map(int,w.split('_')); ax=(i*896+128)//Q-x0*t; ay=(j*896+128)//Q-y0*t
  if ax<0 or ay<0 or ax+S-O>W or ay+S-O>H: continue
  m=F[ay:ay+S-O,ax:ax+S-O]&(A[ay:ay+S-O,ax:ax+S-O].sum(2)>90)
  if m.mean()<MINF: continue
  cells[(i,j)]=rgb2lab(A[ay:ay+S-O,ax:ax+S-O][m].mean(0)[None,None]/255.0)[0,0]
R=int(np.ceil(3*SIG)); delta={}
for (i,j),L in cells.items():
  if owner[f'{i}_{j}'] not in MOD: continue
  num=np.zeros(3); den=0.
  for dj in range(-R,R+1):
    for di in range(-R,R+1):
      n=cells.get((i+di,j+dj))
      if n is None: continue
      wgt=np.exp(-(di*di+dj*dj)/(2*SIG*SIG)); num+=wgt*n; den+=wgt
  d=num/den-L; nd=np.linalg.norm(d)
  if nd>15: d*=15/nd
  delta[(i,j)]=d
print(f'tonefix: {len(cells)} forest cells, {len(delta)} to adjust in {",".join(a.replace("trento-","") for a in MOD)}; |delta| median {np.median([np.linalg.norm(v) for v in delta.values()]):.2f} max {max(np.linalg.norm(v) for v in delta.values()):.2f}')
def dget(i,j): return delta.get((i,j),np.zeros(3))
xs=np.arange(1024)
done=0
for (i,j) in sorted(delta):
  w=f'{i}_{j}'; a=owner[w]
  # delta field over this window: cell (c,r) centred at c*896+512; window pixel x is global i*896+x
  gx=(i*896+xs-512)/896.0; gy=gx-i+j  # same offsets in y
  ci=np.floor(gx).astype(int); fx=gx-ci; cj=np.floor(gy).astype(int); fy=gy-cj
  field=np.zeros((1024,1024,3))
  for yi in np.unique(cj):
    for xi in np.unique(ci):
      my=(cj==yi); mx=(ci==xi)
      d00,d10,d01,d11=dget(xi,yi),dget(xi+1,yi),dget(xi,yi+1),dget(xi+1,yi+1)
      FX=fx[mx][None,:,None]; FY=fy[my][:,None,None]
      field[np.ix_(my,mx)]=(d00*(1-FX)*(1-FY)+d10*FX*(1-FY)+d01*(1-FX)*FY+d11*FX*FY)
  # soft render-forest mask over the window footprint (global px i*896.. +1024)
  gx0,gy0=i*896,j*896; m=np.zeros((1024,1024),np.float32)
  for ty in range(gy0//T,(gy0+1023)//T+1):
    for tx in range(gx0//T,(gx0+1023)//T+1):
      k=f'{tx}_{ty}'
      if k not in rend: continue
      fm=forest(rend[k],T,Image.NEAREST).astype(np.float32)
      sx0=max(gx0,tx*T); sx1=min(gx0+1024,(tx+1)*T); sy0=max(gy0,ty*T); sy1=min(gy0+1024,(ty+1)*T)
      m[sy0-gy0:sy1-gy0,sx0-gx0:sx1-gx0]=np.maximum(m[sy0-gy0:sy1-gy0,sx0-gx0:sx1-gx0],fm[sy0-ty*T:sy1-ty*T,sx0-tx*T:sx1-tx*T])
  m=np.clip(gaussian_filter(m,6),0,1)
  p=f'{D}/{a}/windows/{w}.png'; im=np.asarray(Image.open(p).convert('RGB')).astype(np.float64)/255.0
  m*=(im.sum(2)*255>30)
  lab=rgb2lab(im); lab+=field*m[...,None]
  out=(np.clip(lab2rgb(lab),0,1)*255+0.5).astype(np.uint8)
  if not DRY:
    ad=f'{D}/{a}/archive/'+opt.get('archive','v10')+'/windows-tone'; os.makedirs(ad,exist_ok=True)
    if not os.path.exists(f'{ad}/{w}.png'): shutil.copy2(p,f'{ad}/{w}.png')
    Image.fromarray(out).save(p)
  done+=1
  print(f'  {a.replace("trento-","")} {w} delta L{delta[(i,j)][0]:+.1f} a{delta[(i,j)][1]:+.1f} b{delta[(i,j)][2]:+.1f} forest {m.mean():.2f}')
print(f'tonefix: {"would adjust" if DRY else "adjusted"} {done} windows')
