# v12 diag: mosaic of the exported map tiles at level Z (default 6), RGB, origin = global art px (X0,Y0)
import numpy as np, os, sys, json
from PIL import Image
Z=int(sys.argv[1]) if len(sys.argv)>1 else 6
L=sys.argv[2] if len(sys.argv)>2 else 'map'; SUF='' if L=='map' else '-'+L
R='data/web/regions/trento'; w=json.load(open(R+'/data/world.json'))
[[y0,x0],[y1,x1]]=w['bounds']; s=2**(8-Z); TS=512
tx0,ty0=int(np.floor(x0/s/TS)),int(np.floor(y0/s/TS)); tx1,ty1=int(np.ceil(x1/s/TS)),int(np.ceil(y1/s/TS))
M=np.full(((ty1-ty0)*TS,(tx1-tx0)*TS,3),(232,228,220),np.uint8)
for tx in range(tx0,tx1):
  for ty in range(ty0,ty1):
    f=f'{R}/tiles/{L}/{Z}/{tx}/{ty}.avif'
    if os.path.exists(f): M[(ty-ty0)*TS:(ty-ty0+1)*TS,(tx-tx0)*TS:(tx-tx0+1)*TS]=np.asarray(Image.open(f).convert('RGB'))
np.save(f'/workspace/v12/mosaic-z{Z}{SUF}.npy',M); json.dump({'z':Z,'scale':s,'X0':tx0*TS*s,'Y0':ty0*TS*s},open(f'/workspace/v12/mosaic-z{Z}{SUF}.json','w'))
Image.fromarray(M).save(f'/workspace/v12/mosaic-z{Z}{SUF}.png'); print(M.shape, tx0*TS*s, ty0*TS*s)
