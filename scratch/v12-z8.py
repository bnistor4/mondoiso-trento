# v12 diag: full-res art crop from the exported z8 tiles with the window grid (i*896, i*896+1024) and tile grid overlaid
import numpy as np, sys, os
from PIL import Image, ImageDraw
R='data/web/regions/trento/tiles'
def z8(x0,y0,x1,y1,layer='map'):
  out=np.full((y1-y0,x1-x0,3),(232,228,220),np.uint8)
  for tx in range(x0//512,(x1-1)//512+1):
    for ty in range(y0//512,(y1-1)//512+1):
      f=f'{R}/{layer}/8/{tx}/{ty}.avif'
      if not os.path.exists(f): continue
      t=np.asarray(Image.open(f).convert('RGB'))
      ax0,ay0=max(x0,tx*512),max(y0,ty*512); ax1,ay1=min(x1,tx*512+512),min(y1,ty*512+512)
      out[ay0-y0:ay1-y0,ax0-x0:ax1-x0]=t[ay0-ty*512:ay1-ty*512,ax0-tx*512:ax1-tx*512]
  return out
def grid(img,x0,y0,scale=1,win=True,tile=True):
  d=ImageDraw.Draw(img); W,H=img.size
  if win:
    for i in range(x0//896-2,(x0+W*scale)//896+2):
      for x,c in ((i*896,(255,0,255)),(i*896+1024,(0,255,255))):
        if 0<=(x-x0)/scale<W: d.line([((x-x0)/scale,0),((x-x0)/scale,H)],fill=c)
    for j in range(y0//896-2,(y0+H*scale)//896+2):
      for y,c in ((j*896,(255,0,255)),(j*896+1024,(0,255,255))):
        if 0<=(y-y0)/scale<H: d.line([(0,(y-y0)/scale),(W,(y-y0)/scale)],fill=c)
  if tile:
    for x in range((x0//1024)*1024,x0+W*scale+1,1024):
      if 0<=(x-x0)/scale<W: d.line([((x-x0)/scale,0),((x-x0)/scale,H)],fill=(255,255,0))
    for y in range((y0//1024)*1024,y0+H*scale+1,1024):
      if 0<=(y-y0)/scale<H: d.line([(0,(y-y0)/scale),(W,(y-y0)/scale)],fill=(255,255,0))
if __name__=='__main__':
  x0,y0,x1,y1=map(int,sys.argv[1:5]); sc=int(sys.argv[6]) if len(sys.argv)>6 else 2
  a=Image.fromarray(z8(x0,y0,x1,y1)).resize(((x1-x0)//sc,(y1-y0)//sc),Image.BOX); grid(a,x0,y0,sc); a.save(sys.argv[5])
