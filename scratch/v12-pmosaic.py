# usage: v12-pmosaic.py <out> [--tar=archive.tar] : 1/4-scale mosaic of the ASSEMBLED art (data/derived/<area>/paint, last area in
# /tmp/all16 order wins, as export.ts) on the mosaic-z6 grid; pixels that are page background in the v11 export mosaic are set to it
# (same footprint/skip decisions as the export scan). --tar reads the paint tiles from an archive tar instead (v11 baseline).
import sys, os, io, json, tarfile, numpy as np
from PIL import Image
out=sys.argv[1]; tarp=next((a[6:] for a in sys.argv if a.startswith('--tar=')),None)
A=open('/tmp/all16').read().strip().split(','); m=json.load(open('/workspace/v12/mosaic-z6.json')); E=np.load('/workspace/v12/mosaic-z6.npy')
BG=np.array([232,228,220]); M=np.empty_like(E); M[:]=BG
T=tarfile.open(tarp) if tarp else None; names={}
if T:
  for ti in T.getmembers(): names[ti.name]=ti
def get(a,k):
  f=f'data/derived/{a}/paint/{k}.png'
  if T: return Image.open(io.BytesIO(T.extractfile(names[f]).read())) if f in names else None
  return Image.open(f) if os.path.exists(f) else None
keys=set()
for a in A:
  d=f'data/derived/{a}/paint'
  for f in os.listdir(d): keys.add(f[:-4])
n=0
for k in keys:
  im=None
  for a in reversed(A):
    im=get(a,k)
    if im is not None: break
  if im is None: continue
  tx,ty=map(int,k.split('_')); X=(tx*1024-m['X0'])//4; Y=(ty*1024-m['Y0'])//4
  if X<0 or Y<0 or X+256>M.shape[1] or Y+256>M.shape[0]: continue
  M[Y:Y+256,X:X+256]=np.asarray(im.convert('RGB').resize((256,256),Image.BOX)); n+=1
bg=np.abs(E.astype(int)-BG).sum(2)<=12; M[bg]=BG
np.save(f'/workspace/v12/{out}.npy',M); print(out,'tiles',n)
