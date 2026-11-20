# usage: v12-ba.py : before/after crops shots/v12-ba-N.png, BEFORE = v11 export z8 (/workspace/v12/web-v11), AFTER = current export z8.
# N=1..7: Bogdan's defects (box from paint-test/v12-defects.json); N=8..17: the top-10 v11 window edges (2048 px around the edge).
# AFTER_SRC=paint: AFTER from the assembled art (data/derived/*/paint, last area wins) when the export is not done yet.
# PREFIX=name (default v12-ba), ONLY=2,7 (defects only).
# Labels give the edge-scan score before -> after (worst edge in the box; /workspace/v12/edges.json vs $AFTER json).
import json, os, sys, numpy as np
from PIL import Image, ImageDraw
exec(open('scratch/v12-z8.py').read().split("if __name__")[0])
def z8r(root,*a):
  global R; R0=R; R=root; o=z8(*a); R=R0; return o
B='/workspace/v12/web-v11/regions/trento/tiles'; A='data/web/regions/trento/tiles'
eb=json.load(open(os.environ.get('BEFORE','/workspace/v12/edges.json'))); ea=json.load(open(os.environ.get('AFTER','/workspace/v12/edges-v12.json')))
s=lambda a:(a['mean']+a['max'])/2
def worst(E,x0,y0,x1,y1):
  ins=[a for a in E if x0<=a['x']<=x1 and y0<=a['y']<=y1]; return max(map(s,ins)) if ins else 0
def paintcrop(x0,y0,x1,y1):
  import os
  Aa=open('/tmp/all16').read().strip().split(','); out=np.full((y1-y0,x1-x0,3),(232,228,220),np.uint8)
  for ty in range(y0//1024,(y1-1)//1024+1):
    for tx in range(x0//1024,(x1-1)//1024+1):
      f=next((f'data/derived/{a}/paint/{tx}_{ty}.png' for a in reversed(Aa) if os.path.exists(f'data/derived/{a}/paint/{tx}_{ty}.png')),None)
      if not f: continue
      t=np.asarray(Image.open(f).convert('RGB')); ax0,ay0=max(x0,tx*1024),max(y0,ty*1024); ax1,ay1=min(x1,tx*1024+1024),min(y1,ty*1024+1024)
      out[ay0-y0:ay1-y0,ax0-x0:ax1-x0]=t[ay0-ty*1024:ay1-ty*1024,ax0-tx*1024:ax1-tx*1024]
  b=z8r(B,x0,y0,x1,y1); bg=(np.abs(b.astype(int)-[232,228,220]).sum(2)<=12); out[bg]=b[bg]; return out
def one(n,x0,y0,x1,y1,title):
  sc=max(1,int(np.ceil(max(x1-x0,y1-y0)/1100)))
  ims=[Image.fromarray(paintcrop(x0,y0,x1,y1) if (r==A and os.environ.get('AFTER_SRC')=='paint') else z8r(r,x0,y0,x1,y1)).resize(((x1-x0)//sc,(y1-y0)//sc),Image.LANCZOS) for r in (B,A)]
  w,h=ims[0].size; C=Image.new('RGB',(2*w+12,h+30),(255,255,255)); C.paste(ims[0],(0,30)); C.paste(ims[1],(w+12,30))
  d=ImageDraw.Draw(C); d.text((4,4),f'v12-ba-{n} BEFORE (v11 export) worst edge {worst(eb,x0,y0,x1,y1):.1f}  |  {title}',fill=(0,0,0)); lab='assembled art' if os.environ.get('AFTER_SRC')=='paint' else 'export'; d.text((w+16,4),f'AFTER (v12 {lab}) worst edge {worst(ea,x0,y0,x1,y1):.1f}',fill=(0,0,0))
  PF=os.environ.get('PREFIX','v12-ba'); C.save(f'shots/{PF}-{n}.png'); print(f'shots/{PF}-{n}.png',title,'%.1f -> %.1f'%(worst(eb,x0,y0,x1,y1),worst(ea,x0,y0,x1,y1)))
D=json.load(open('paint-test/v12-defects.json'))
ONLY=os.environ.get('ONLY','').split(',') if os.environ.get('ONLY') else None
for k in sorted(D,key=int):
  if ONLY and k not in ONLY: continue
  x0,y0,x1,y1=D[k]['box']; one(int(k),x0,y0,x1,y1,'defect '+k+': '+D[k]['name'])
top=sorted(eb,key=lambda a:-s(a))[:int(os.environ.get('NTOP',10))]
for q,a in enumerate(top if not ONLY else []): one(8+q,a['x']-1024,a['y']-1024,a['x']+1024,a['y']+1024,f"top{q+1} edge {a['edge']} {a['area']}")
