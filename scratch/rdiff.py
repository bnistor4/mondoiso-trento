# usage: rdiff.py <area> [minpx] : per window, render pixels changed vs archive/prebin/render (diff>40 sum RGB); owner of the window
import os,sys,glob,numpy as np
from PIL import Image
a=sys.argv[1]; mn=int(sys.argv[2]) if len(sys.argv)>2 else 3000; D=f'data/derived/{a}'; S=896;T=1024
ch={}
for f in glob.glob(f'{D}/render/*.png'):
  k=os.path.basename(f)[:-4]; o=f'{D}/archive/prebin/render/{k}.png'
  if not os.path.exists(o): continue
  n=np.asarray(Image.open(f).convert('RGB'),int); p=np.asarray(Image.open(o).convert('RGB'),int)
  m=np.abs(n-p).sum(2)>40
  if m.sum(): ch[tuple(map(int,k.split('_')))]=m
print('tiles changed',len(ch),'px',sum(m.sum() for m in ch.values()))
wins={}
for (tx,ty),m in ch.items():
  for i in range((tx*T-1023)//S, (tx*T+1023)//S+1):
    for j in range((ty*T-1023)//S, (ty*T+1023)//S+1):
      x0,y0=i*S,j*S; ax,ay=max(x0,tx*T),max(y0,ty*T); bx,by=min(x0+1024,tx*T+T),min(y0+1024,ty*T+T)
      if ax<bx and ay<by: wins[(i,j)]=wins.get((i,j),0)+int(m[ay-ty*T:by-ty*T, ax-tx*T:bx-tx*T].sum())
areas=['trento-citta','trento-nord','trento-sud','trento-est','trento-spini','trento-povo','trento-martignano']
for (i,j),c in sorted(wins.items(),key=lambda x:-x[1]):
  if c<mn: continue
  w=f'{i}_{j}'; own=[x for x in areas if os.path.exists(f'data/derived/{x}/windows/{w}.png')]
  print(w,c,','.join(own) or '-')
