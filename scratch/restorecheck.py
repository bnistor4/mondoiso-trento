# usage: restorecheck.py <w>:<owner>/<archdir> ... : black share of the archived window where the current render crop (any area) has content
import sys,os,numpy as np
from PIL import Image
S=896;T=1024;R='data/derived';AR=[a for a in os.listdir(R) if a.startswith('trento-') and a not in('trento-htest','trento-duomo')]
def rcrop(i,j):
  x0,y0=i*S,j*S; c=np.zeros((T,T,3),int)
  for ty in range(y0//T,(y0+T-1)//T+1):
    for tx in range(x0//T,(x0+T-1)//T+1):
      for a in AR:
        f=f'{R}/{a}/render/{tx}_{ty}.png'
        if os.path.exists(f):
          im=np.asarray(Image.open(f).convert('RGB')).astype(int); X0=tx*T-x0;Y0=ty*T-y0
          xs=slice(max(0,X0),min(T,X0+T)); ys=slice(max(0,Y0),min(T,Y0+T)); c[ys,xs]=im[ys.start-Y0:ys.stop-Y0, xs.start-X0:xs.stop-X0]; break
  return c
for t in sys.argv[1:]:
  w,src=t.split(':'); i,j=map(int,w.split('_')); rc=rcrop(i,j)
  f=f'{R}/{src}/{w}.png'
  if not os.path.exists(f): f=f'{R}/{src}/windows/{w}.png'
  A=np.asarray(Image.open(f).convert('RGB').resize((T,T))).astype(int)
  m=rc.sum(2)>45; blk=(A.sum(2)<30)&m
  print(w,src,'black-where-render %.3f'%(blk.sum()/T/T), 'render-black %.3f'%((~m).mean()))
