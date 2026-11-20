# usage: v12-prep.py <w> ... : Grok inputs for a v12 repaint of window <w> (the area whose windows/ holds it):
#  paint-test/v12/<w>-input.png  = render of the window with the outer 128 px band = current assembled art (painted neighbours)
#  paint-test/v12/<w>-render.png = render only (gate reference)
#  paint-test/v12/<w>-style.png  = current assembled art of the 3x3 window neighbourhood (2816 px -> 1024), style/tone reference
import sys, os, json, numpy as np
from PIL import Image
D='data/derived'; A=[a['id'] for a in json.load(open('data/web/regions/trento/data/world.json'))['areas']]
own=json.load(open('/workspace/v12/owner.json')); os.makedirs('paint-test/v12',exist_ok=True)
def tile(kind,tx,ty):
  k=f'{tx}_{ty}'; order=([own[k]] if k in own else [])+A
  for a in order:
    f=f'{D}/{a}/{kind}/{k}.png'
    if os.path.exists(f):
      im=Image.open(f)
      if im.mode=='RGBA': bg=Image.new('RGBA',im.size,(0,0,0,255)); bg.alpha_composite(im); im=bg
      return np.asarray(im.convert('RGB'))
  return None
def crop(kind,x0,y0,W,H):
  out=np.zeros((H,W,3),np.uint8)
  for ty in range(y0//1024,(y0+H-1)//1024+1):
    for tx in range(x0//1024,(x0+W-1)//1024+1):
      t=tile(kind,tx,ty)
      if t is None: continue
      ax0,ay0=max(x0,tx*1024),max(y0,ty*1024); ax1,ay1=min(x0+W,tx*1024+1024),min(y0+H,ty*1024+1024)
      out[ay0-y0:ay1-y0,ax0-x0:ax1-x0]=t[ay0-ty*1024:ay1-ty*1024,ax0-tx*1024:ax1-tx*1024]
  return out
def src(w): return next((a for a in A if os.path.exists(f'{D}/{a}/windows/{w}.png')),None)
if __name__=='__main__':
  for w in sys.argv[1:]:
    i,j=map(int,w.split('_')); x0,y0=i*896,j*896
    r=crop('render',x0,y0,1024,1024); art=crop('paint',x0,y0,1024,1024)
    inp=r.copy(); band=np.ones((1024,1024),bool); band[128:896,128:896]=False; inp[band]=art[band]
    Image.fromarray(r).save(f'paint-test/v12/{w}-render.png'); Image.fromarray(inp).save(f'paint-test/v12/{w}-input.png')
    Image.fromarray(crop('paint',x0-896,y0-896,2816,2816)).resize((1024,1024),Image.LANCZOS).save(f'paint-test/v12/{w}-style.png')
    print(w,src(w))
