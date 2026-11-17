# usage: cmp11.py <out.png> "<area> <w> [after.png]" ... : per window: 3x3 window mosaic (1/4 scale) BEFORE (archive/v11 original) | AFTER (current) | render
import sys,os,glob,numpy as np
from PIL import Image,ImageDraw
D='data/derived';S=896;Q=4;n=(2*S+1024)//Q
def win(i,j,override=None):
  if override and (i,j)==override[0]: return Image.open(override[1]).convert('RGB')
  fs=glob.glob(f'{D}/trento-*/windows/{i}_{j}.png'); fs=[f for f in fs if 'duomo' not in f and 'htest' not in f]
  return Image.open(fs[0]).convert('RGB') if fs else None
def mosaic(i,j,override=None):
  m=Image.new('RGB',(n,n),(232,228,220))
  order=[(di,dj) for dj in(-1,0,1) for di in(-1,0,1) if (di,dj)!=(0,0)]+[(0,0)]
  for di,dj in order:
    w=win(i+di,j+dj,override)
    if w: m.paste(w.resize((1024//Q,1024//Q),Image.BOX),(((di+1)*S)//Q,((dj+1)*S)//Q))
  return m
def rend(i,j):
  m=Image.new('RGB',(n,n)); T=1024; x0,y0=(i-1)*S,(j-1)*S
  for ty in range(y0//T,(y0+2*S+1024)//T+1):
    for tx in range(x0//T,(x0+2*S+1024)//T+1):
      for f in glob.glob(f'{D}/trento-*/render/{tx}_{ty}.png'):
        m.paste(Image.open(f).convert('RGB').resize((T//Q,T//Q),Image.BOX),((tx*T-x0)//Q,(ty*T-y0)//Q)); break
  return m
rows=sys.argv[2:]; o=Image.new('RGB',(3*n+20,len(rows)*(n+16)),'white'); d=ImageDraw.Draw(o)
for r,t in enumerate(rows):
  p=t.split(); a,w=p[0],p[1]; i,j=map(int,w.split('_')); arch=f'{D}/{a}/archive/v11/windows/{w}.png'
  aft=mosaic(i,j,((i,j),p[2])) if len(p)>2 else mosaic(i,j)
  for c,im in enumerate([mosaic(i,j,((i,j),arch)),aft,rend(i,j)]):
    o.paste(im,(c*(n+10),r*(n+16)+14)); 
  d.text((2,r*(n+16)+1),f'{a[7:]} {w}: before | after | render',fill='red')
  for c in range(3): d.rectangle([c*(n+10)+S//Q,r*(n+16)+14+S//Q,c*(n+10)+(S+1024)//Q,r*(n+16)+14+(S+1024)//Q],outline=(255,0,0))
o.save(sys.argv[1]); print(sys.argv[1],o.size)
