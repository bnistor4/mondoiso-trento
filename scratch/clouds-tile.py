# clouds: seamless tile from the sprites. usage (in paint-test/clouds): python3 ../../scratch/clouds-tile.py tile.png 7 46; then resize to 768 and save web/public/clouds/cloud-tile.webp (q80, alpha q80)
# seamless 1024 tile from the Grok puff sprites: toroidal scatter (every sprite drawn at all 9 wrap offsets)
import numpy as np, glob, sys
from PIL import Image, ImageOps
rng=np.random.default_rng(int(sys.argv[2]) if len(sys.argv)>2 else 7)
S=1024; sp=[Image.open(f) for f in sorted(glob.glob('sprites/b*.png'))]
tile=Image.new('RGBA',(S,S),(0,0,0,0)); items=[]
n=int(sys.argv[3]) if len(sys.argv)>3 else 46
# jittered grid so density is even (no clumps / holes that repeat visibly)
g=int(np.ceil(np.sqrt(n)))
for k in range(n):
  i,j=k%g,k//g; x=(i+rng.uniform(0,1))*S/g; y=(j+rng.uniform(0,1))*S/g
  items.append((y,x,rng.integers(len(sp)),rng.uniform(0.55,1.0),rng.random()<0.5))
for y,x,s,sc,fl in sorted(items):
  im=sp[s]; im=im.resize((int(im.width*sc),int(im.height*sc)),Image.LANCZOS)
  if fl: im=ImageOps.mirror(im)
  for dx in (-S,0,S):
    for dy in (-S,0,S): tile.alpha_composite(im,(int(x-im.width/2+dx),int(y-im.height/2+dy))) if -im.width<x-im.width/2+dx<S and -im.height<y-im.height/2+dy<S else None
tile.save(sys.argv[1]); a=np.asarray(tile)[...,3]/255; print('alpha mean',a.mean().round(3),'cov>0.5',(a>0.5).mean().round(3))
