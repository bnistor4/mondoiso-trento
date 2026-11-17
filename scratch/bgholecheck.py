# v10: page-background pixels enclosed by the painted footprint in exported map z8 tiles (= beige wedges), plus near-black blobs.
# usage: bgholecheck.py <tiles/map/8 dir> [r,g,b]
import sys,glob,os,numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes,label
R=sys.argv[1]; BG=np.array([int(v) for v in (sys.argv[2] if len(sys.argv)>2 else '232,228,220').split(',')])
TOL=int(sys.argv[3]) if len(sys.argv)>3 else 2; Q=4; t=512//Q; tiles={}
for f in glob.glob(R+'/*/*'):
  x=int(os.path.basename(os.path.dirname(f))); y=int(os.path.basename(f).split('.')[0]); tiles[(x,y)]=f
xs=[k[0] for k in tiles]; ys=[k[1] for k in tiles]; x0,y0=min(xs),min(ys)
W=(max(xs)-x0+1)*t; H=(max(ys)-y0+1)*t; bg=np.ones((H,W),bool); blk=0
for (x,y),f in tiles.items():
  a=np.asarray(Image.open(f).convert('RGB').resize((t,t),Image.NEAREST)).astype(int)
  bg[(y-y0)*t:(y-y0+1)*t,(x-x0)*t:(x-x0+1)*t]=np.abs(a-BG).max(2)<=TOL
inside=binary_fill_holes(~bg)&bg
L,n=label(inside); sz=np.bincount(L.ravel())[1:] if n else np.zeros(1,int)
print(f'bgholecheck {R}: {len(tiles)} z8 tiles, enclosed background {int(inside.sum())*Q*Q} px (z8), {int((sz*Q*Q>=200).sum())} wedges >= 200 px, largest {int(sz.max())*Q*Q} px')
if len(sys.argv)>4:
  for i in np.argsort(sz)[::-1][:int(sys.argv[4])]:
    yy,xx=np.nonzero(L==i+1); print(f'  {sz[i]*Q*Q} px at z8 tile {xx.min()//t+x0}/{yy.min()//t+y0}  bbox px {xx.min()*Q},{yy.min()*Q}-{xx.max()*Q},{yy.max()*Q}')
