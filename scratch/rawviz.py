# usage: rawviz.py <out> <area>:<tile> ... : art tile with raw-render points (offset-corrected |diff|<10) in magenta, next to render; 400px each
import sys,os,numpy as np
from PIL import Image
out=sys.argv[1]; ts=sys.argv[2:]; o=Image.new('RGB',(800,400*len(ts)))
for k,t in enumerate(ts):
  a,tile=t.split(':'); A=np.asarray(Image.open(f'data/derived/{a}/paint/{tile}.png').convert('RGB').resize((1024,1024))).astype(int)
  import os
  R=None
  for ar in [a]+[d for d in os.listdir('data/derived') if d.startswith('trento-')]:
    f=f'data/derived/{ar}/render/{tile}.png'
    if os.path.exists(f): R=np.asarray(Image.open(f).convert('RGB')).astype(int); break
  v=R.sum(2)>45; off=np.median((A-R)[v],axis=0); m=(np.abs(A-R-off).sum(2)<int(os.environ.get("TH","10")))&v
  B=A.copy().astype(np.uint8); B[m]=(B[m]*0.4+np.array([255,0,255])*0.6).astype(np.uint8)
  o.paste(Image.fromarray(B).resize((400,400)),(0,400*k)); o.paste(Image.fromarray(R.astype(np.uint8)).resize((400,400)),(400,400*k)); print(t,'%.3f'%m[v].mean())
o.save(out)
