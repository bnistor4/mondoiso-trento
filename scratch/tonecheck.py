#!/usr/bin/env python3
# usage: tonecheck.py <area> ... [--limit=6] [--min-forest=0.4] [--list=N] [--focus=a,b] [--zones='Z1=a+b;Z2=c'] [--dump=file.json]
# v10 gate for patchy forest: on the assembled art (paint tiles, last area wins as export.ts) at 1/8 scale, take each
# window cell's interior (art px [i*896+128, i*896+896), i.e. outside the 128 px blend overlap), mean CIELAB of the
# pixels whose render is forest (#73a851 +-14), and compare 4-neighbour cells where both are >= min-forest forest.
# Reports dE76 of the means; exit 1 if any pair > limit.
import sys, os, numpy as np
from PIL import Image
args=[a for a in sys.argv[1:] if not a.startswith('--')]; opt=dict(a[2:].split('=',1) for a in sys.argv[1:] if a.startswith('--'))
LIM=float(opt.get('limit',6)); MINF=float(opt.get('min-forest',0.4)); NL=int(opt.get('list',15))
D='/workspace/mondoiso-trento/data/derived'; T=1024; Q=8; t=T//Q
art={}; rend={}
for a in args:
  for layer,m in (('paint',art),('render',rend)):
    d=f'{D}/{a}/{layer}'
    if os.path.isdir(d):
      for f in os.listdir(d):
        if f.endswith('.png') and f[:-4].replace('-','').replace('_','').isdigit(): m[f[:-4]]=f'{d}/{f}'
ks=[tuple(map(int,k.split('_'))) for k in art]; x0=min(k[0] for k in ks); y0=min(k[1] for k in ks)
W=(max(k[0] for k in ks)-x0+1)*t; H=(max(k[1] for k in ks)-y0+1)*t
A=np.zeros((H,W,3),np.float32); F=np.zeros((H,W),bool)
for k,f in art.items():
  tx,ty=map(int,k.split('_')); px,py=(tx-x0)*t,(ty-y0)*t
  A[py:py+t,px:px+t]=np.asarray(Image.open(f).convert('RGB').resize((t,t),Image.BOX),np.float32)
  if k in rend:
    r=np.asarray(Image.open(rend[k]).convert('RGB').resize((t,t),Image.NEAREST)).astype(int)
    F[py:py+t,px:px+t]=np.abs(r-np.array([115,168,81])).max(2)<=14
def lab(rgb):
  c=rgb/255.0; c=np.where(c>0.04045,((c+0.055)/1.055)**2.4,c/12.92)
  M=np.array([[0.4124,0.3576,0.1805],[0.2126,0.7152,0.0722],[0.0193,0.1192,0.9505]]); xyz=c@M.T/np.array([0.95047,1,1.08883])
  f=np.where(xyz>0.008856,np.cbrt(xyz),7.787*xyz+16/116)
  return np.stack([116*f[...,1]-16,500*(f[...,0]-f[...,1]),200*(f[...,1]-f[...,2])],-1)
S=896//Q; O=128//Q
cells={}
gx0=(x0*T)//896-1; gy0=(y0*T)//896-1; gx1=((x0*T+W*Q)//896)+1; gy1=((y0*T+H*Q)//896)+1
owner={}
for a in args:
  d=f'{D}/{a}/windows'
  if os.path.isdir(d):
    for f in os.listdir(d):
      if f.endswith('.png'): owner[f[:-4]]=a.replace('trento-','')
for j in range(gy0,gy1):
  for i in range(gx0,gx1):
    ax=(i*896+128)//Q-x0*t; ay=(j*896+128)//Q-y0*t
    if ax<0 or ay<0 or ax+S-O>W or ay+S-O>H: continue
    m=F[ay:ay+S-O,ax:ax+S-O]&(A[ay:ay+S-O,ax:ax+S-O].sum(2)>90)  # art holes (black) are holecheck's job
    if m.mean()<MINF: continue
    cells[(i,j)]=(lab(A[ay:ay+S-O,ax:ax+S-O][m].mean(0)),m.mean())
pairs=[]
for (i,j),(L,fr) in cells.items():
  for di,dj in ((1,0),(0,1)):
    n=cells.get((i+di,j+dj))
    if n: pairs.append((float(np.linalg.norm(L-n[0])),f'{i}_{j}',f'{i+di}_{j+dj}'))
pairs.sort(reverse=True); d=np.array([p[0] for p in pairs]) if pairs else np.zeros(1)
for p in pairs[:NL]: print('  %5.2f  %s(%s) | %s(%s)'%(p[0],p[1],owner.get(p[1],'?'),p[2],owner.get(p[2],'?')))
bad=int((d>LIM).sum())
print(f'tonecheck {len(args)} areas: {len(cells)} forest cells (>= {MINF:.0%} forest), {len(pairs)} neighbour pairs, dE76 median {np.median(d):.2f} p90 {np.percentile(d,90):.2f} max {d.max():.2f}, {bad} pairs > {LIM}')
FOC=[f for f in opt.get('focus','').split(',') if f]
if FOC:
  fp=[p for p in pairs if owner.get(p[1]) in FOC or owner.get(p[2]) in FOC]; fd=np.array([p[0] for p in fp]) if fp else np.zeros(1)
  print(f'  focus {",".join(FOC)}: {len(fp)} pairs, dE76 median {np.median(fd):.2f} p90 {np.percentile(fd,90):.2f} max {fd.max():.2f}, {int((fd>LIM).sum())} pairs > {LIM}')
for z in [z for z in opt.get('zones','').split(';') if z]:
  zn,za=z.split('='); ZA=za.split('+')
  fp=[p for p in pairs if owner.get(p[1]) in ZA or owner.get(p[2]) in ZA]; fd=np.array([p[0] for p in fp]) if fp else np.zeros(1)
  print(f'  zone {zn} ({za}): {len(fp)} pairs, dE76 median {np.median(fd):.2f} p90 {np.percentile(fd,90):.2f} max {fd.max():.2f}, {int((fd>LIM).sum())} pairs > {LIM}')
if 'dump' in opt:
  import json; json.dump({'cells':{f'{i}_{j}':[owner.get(f'{i}_{j}','?'),[float(v) for v in L],float(fr)] for (i,j),(L,fr) in cells.items()},'pairs':pairs},open(opt['dump'],'w'))
sys.exit(1 if bad else 0)
