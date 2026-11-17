# v10: opaque near-black blobs (sum<=40, >=N px) in exported map z8 tiles = visible black/wedge artefacts
import sys,glob,os,numpy as np
from PIL import Image
from scipy.ndimage import label
N=int(sys.argv[1]) if len(sys.argv)>1 else 150
R=sys.argv[2] if len(sys.argv)>2 else "data/web/regions/trento/tiles/map/8"; hits=[]
for f in glob.glob(R+'/*/*'):
  im=Image.open(f).convert('RGBA'); a=np.asarray(im).astype(int)
  m=(a[...,:3].sum(2)<=40)&(a[...,3]>200)
  if m.sum()<N: continue
  L,n=label(m); sz=np.bincount(L.ravel())[1:]
  if sz.max()>=N: hits.append((int(sz.max()),os.path.relpath(f,R)))
for h in sorted(hits,reverse=True): print(*h)
print('blackcheck:',len(hits),'z8 tiles with a near-black blob >=',N,'px')
