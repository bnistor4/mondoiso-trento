# usage: zoneviz.py <i0> <j0> <i1> <j1> <out.png> [scale=4] [layer=paint] : mosaic of assembled tiles (last area wins) over windows i0..i1, j0..j1 with window grid + labels
import sys,os,glob,numpy as np
from PIL import Image,ImageDraw
i0,j0,i1,j1=map(int,sys.argv[1:5]); out=sys.argv[5]; Q=int(sys.argv[6]) if len(sys.argv)>6 else 4; layer=sys.argv[7] if len(sys.argv)>7 else 'paint'
D='data/derived'; S=896; T=1024
gx0,gy0=i0*S,j0*S; gx1,gy1=(i1+1)*S+128,(j1+1)*S+128
W,H=(gx1-gx0)//Q,(gy1-gy0)//Q; im=Image.new('RGB',(W,H),(232,228,220))
areas=sorted(d for d in os.listdir(D) if d.startswith('trento-') and d not in('trento-duomo','trento-htest'))
for ty in range(gy0//T-(gy0<0 and gy0%T!=0)*0,(gy1-1)//T+1):
  for tx in range(gx0//T,(gx1-1)//T+1):
    for a in areas:
      f=f'{D}/{a}/{layer}/{tx}_{ty}.png'
      if os.path.exists(f):
        t=Image.open(f).convert('RGB').resize((T//Q,T//Q),Image.BOX); im.paste(t,((tx*T-gx0)//Q,(ty*T-gy0)//Q))
im.save(out.replace(".png","-plain.png")); d=ImageDraw.Draw(im); own={}
for a in areas:
  for f in glob.glob(f'{D}/{a}/windows/*.png'): own.setdefault(os.path.basename(f)[:-4],a[7:])
for j in range(j0,j1+1):
  for i in range(i0,i1+1):
    x=(i*S+128-gx0)//Q; y=(j*S+128-gy0)//Q; d.rectangle([x,y,x+768//Q,y+768//Q],outline=(255,0,0))
    d.text((x+3,y+2),f'{i}_{j}',fill=(255,0,0)); d.text((x+3,y+12),own.get(f'{i}_{j}','-')[:8],fill=(255,255,0))
im.save(out); print(out,im.size)
