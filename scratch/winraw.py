# usage: winraw.py : for every window file of every trento area: share of pixels ~= raw render crop (and non-black); prints duplicates and raw windows
import os,sys,re,numpy as np
from PIL import Image
S=896;T=1024;R='data/derived'
AR=[a for a in sorted(os.listdir(R)) if a.startswith('trento-') and os.path.isdir(f'{R}/{a}/windows') and a not in('trento-htest','trento-duomo')]
def rcrop(i,j):
  x0,y0=i*S,j*S; c=np.zeros((T,T,3),int); have=np.zeros((T,T),bool)
  for ty in range(y0//T,(y0+T-1)//T+1):
    for tx in range(x0//T,(x0+T-1)//T+1):
      for a in AR:
        f=f'{R}/{a}/render/{tx}_{ty}.png'
        if os.path.exists(f):
          im=np.asarray(Image.open(f).convert('RGB')).astype(int)
          X0=tx*T-x0;Y0=ty*T-y0; xs=slice(max(0,X0),min(T,X0+T)); ys=slice(max(0,Y0),min(T,Y0+T))
          c[ys,xs]=im[ys.start-Y0:ys.stop-Y0, xs.start-X0:xs.stop-X0]; break
  return c
own={}
for a in AR:
  for f in os.listdir(f'{R}/{a}/windows'):
    if re.fullmatch(r'-?\d+_-?\d+\.png',f): own.setdefault(f[:-4],[]).append(a)
out=[]
for w,areas in sorted(own.items()):
  i,j=map(int,w.split('_')); rc=rcrop(i,j); nb=rc.sum(2)>30
  for a in areas:
    p=np.asarray(Image.open(f'{R}/{a}/windows/{w}.png').convert('RGB').resize((T,T))).astype(int)
    same=((np.abs(p-rc).sum(2)<8)&nb).sum()/max(1,nb.sum())
    out.append((w,a,round(float(same),3)))
for w,a,s in out:
  dup=len(own[w])>1
  if s>0.05 or dup: print(w,a,s,'DUP:'+','.join(own[w]) if dup else '')
