# usage: rawviz2.py <out> <area>:<tile> ... : raw-render points = art exactly flat in a 3x3 (max-min summed over RGB <= TH) where render is flat too; magenta overlay
import sys,os,numpy as np
from PIL import Image
from scipy import ndimage as nd
TH=int(os.environ.get('TH','3'))
K=int(os.environ.get('K','3'))
def flat(X): return sum(nd.maximum_filter(X[...,c],K)-nd.minimum_filter(X[...,c],K) for c in range(3))
out=sys.argv[1]; ts=sys.argv[2:]; o=Image.new('RGB',(800,400*len(ts)))
for k,t in enumerate(ts):
  a,tile=t.split(':'); A=np.asarray(Image.open(f'data/derived/{a}/paint/{tile}.png').convert('RGB')).astype(int)
  for ar in [a]+[d for d in os.listdir('data/derived') if d.startswith('trento-')]:
    f=f'data/derived/{ar}/render/{tile}.png'
    if os.path.exists(f): R=np.asarray(Image.open(f).convert('RGB')).astype(int); break
  v=R.sum(2)>45; m=(flat(A)<=TH)&(flat(R)<=TH)&v
  B=A.copy().astype(np.uint8); B[m]=(B[m]*0.4+np.array([255,0,255])*0.6).astype(np.uint8)
  o.paste(Image.fromarray(B).resize((400,400)),(0,400*k)); o.paste(Image.fromarray(R.astype(np.uint8)).resize((400,400)),(400,400*k)); print(t,'%.3f'%m[v].mean())
o.save(out)
