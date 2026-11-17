# v10: windows whose 1024 px footprint contains render pixels changed by the footprint fix (old black -> content, or |d|>30)
import numpy as np, os, collections
from PIL import Image
T=1024;S=896;Q=4
ch={}
for l in open('/tmp/rr-pairs.txt'):
  a,k=l.split(); tx,ty=map(int,k.split('_'))
  o=np.asarray(Image.open(f'data/derived/{a}/archive/v10/render/{k}.png').convert('RGB').resize((T//Q,T//Q),Image.NEAREST)).astype(int)
  n=np.asarray(Image.open(f'data/derived/{a}/render/{k}.png').convert('RGB').resize((T//Q,T//Q),Image.NEAREST)).astype(int)
  m=(np.abs(o-n).sum(2)>30)
  al=np.asarray(Image.open(f'/tmp/alpha/{k}.png').convert('L').resize((T//Q,T//Q),Image.BILINEAR))
  m&=al>25  # only where the map is visible (edge-fade alpha > 0.1)
  ch[(tx,ty)]=m
cnt=collections.Counter()
for (tx,ty),m in ch.items():
  ys,xs=np.nonzero(m)
  gx=(tx*T+xs*Q); gy=(ty*T+ys*Q)
  for i0 in (0,1):
    pass
  # window (i,j) covers [i*S, i*S+T)
  for i in range((tx*T)//S-1,((tx+1)*T)//S+1):
    for j in range((ty*T)//S-1,((ty+1)*T)//S+1):
      sel=(gx>=i*S)&(gx<i*S+T)&(gy>=j*S)&(gy<j*S+T)
      c=int(sel.sum())
      if c: cnt[(i,j)]+=c
own={}
for a in os.listdir('data/derived'):
  d=f'data/derived/{a}/windows'
  if a.startswith('trento-') and os.path.isdir(d) and a not in('trento-duomo','trento-htest'):
    for f in os.listdir(d):
      if f.endswith('.png'): own[f[:-4]]=a
tot=(T//Q)**2*(T/S)**2
rows=sorted(((c/((T//Q)**2),f'{i}_{j}',own.get(f'{i}_{j}','-')) for (i,j),c in cnt.items()),reverse=True)
for thr in (0.005,0.02,0.05): print(thr, sum(1 for r in rows if r[0]>=thr))
with open('/tmp/changedwin.txt','w') as f:
  for r in rows: f.write('%s %s %.4f\n'%(r[2],r[1],r[0]))
print(collections.Counter(r[2] for r in rows if r[0]>=0.005))
