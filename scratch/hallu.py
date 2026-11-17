# usage: hallu.py <area> : per window, edge density of render crop vs painting (flags painted detail where render is flat)
import sys,os,glob
import numpy as np
from PIL import Image, ImageFilter
area=sys.argv[1]; S=896;T=1024
def crop(i,j):
  x0,y0=i*S,j*S; c=Image.new('RGB',(1024,1024))
  for ty in range(y0//T,(y0+1023)//T+1):
    for tx in range(x0//T,(x0+1023)//T+1):
      f=f'data/derived/{area}/render/{tx}_{ty}.png'
      if os.path.exists(f): c.paste(Image.open(f).convert('RGB'),(tx*T-x0,ty*T-y0))
  return c
def ed(im): 
  g=np.asarray(im.convert('L').resize((256,256)).filter(ImageFilter.FIND_EDGES),dtype=float); return g
for f in sorted(glob.glob(f'data/derived/{area}/windows/*.png')):
  w=os.path.basename(f)[:-4]; i,j=map(int,w.split('_'))
  r=ed(crop(i,j)); p=ed(Image.open(f))
  # 32x32 cells: cell flat in render (<2 mean edge) but busy in painting (>12)
  rc=r.reshape(8,32,8,32).mean((1,3)); pc=p.reshape(8,32,8,32).mean((1,3))
  ra=np.asarray(crop(i,j).convert('L').resize((8,8)))>8
  bad=((rc<3)&(pc>14)&ra).sum()
  print(w,bad)
