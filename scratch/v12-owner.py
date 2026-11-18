# v12 diag: which area's paint tile is in the export, per 1024 tile (compare with the z6 mosaic)
import numpy as np, json, os, glob
from PIL import Image
w=json.load(open('data/web/regions/trento/data/world.json')); A=[a['id'] for a in w['areas']]
M=np.load('/workspace/v12/mosaic-z6.npy'); m=json.load(open('/workspace/v12/mosaic-z6.json'))
cand={}
for a in A:
  for f in glob.glob(f'data/derived/{a}/paint/*.png'):
    cand.setdefault(os.path.basename(f)[:-4],[]).append(a)
own={}; multi=0
for k,c in cand.items():
  tx,ty=map(int,k.split('_')); X=(tx*1024-m['X0'])//4; Y=(ty*1024-m['Y0'])//4
  if len(c)==1: own[k]=c[0]; continue
  multi+=1; ref=M[Y:Y+256,X:X+256].astype(float); best=None
  for a in c:
    im=np.asarray(Image.open(f'data/derived/{a}/paint/{k}.png').convert('RGB').resize((256,256),Image.BOX)).astype(float)
    e=np.abs(im-ref).mean()
    if best is None or e<best[0]: best=(e,a)
  own[k]=best[1]
json.dump(own,open('/workspace/v12/owner.json','w')); print('tiles',len(own),'multi',multi,'areas',len(A),A)
