# usage: unblack.py <area> <w> [file] : (file default work/<w>/input.png; v10 also used on stale windows/<w>.png) v10 - in work/<w>/input.png, pixels that are black (stale neighbour strip over an old
# render hole) but where the current render union has content get the render pixel, so holes do not propagate.
import sys, os, numpy as np
from PIL import Image
a,w=sys.argv[1],sys.argv[2]; i,j=map(int,w.split('_')); S=896;T=1024
areas=[d for d in os.listdir('data/derived') if d.startswith('trento-') and d not in('trento-duomo','trento-htest')]
c=np.zeros((T,T,3),np.uint8); x0,y0=i*S,j*S
for ty in range(y0//T,(y0+T-1)//T+1):
  for tx in range(x0//T,(x0+T-1)//T+1):
    for ar in [a]+areas:
      f=f'data/derived/{ar}/render/{tx}_{ty}.png'
      if os.path.exists(f):
        r=np.asarray(Image.open(f).convert('RGB'))
        sx0=max(x0,tx*T); sy0=max(y0,ty*T); sx1=min(x0+T,(tx+1)*T); sy1=min(y0+T,(ty+1)*T)
        sub=r[sy0-ty*T:sy1-ty*T, sx0-tx*T:sx1-tx*T]; dst=c[sy0-y0:sy1-y0, sx0-x0:sx1-x0]
        m=(dst.sum(2)<=30)&(sub.astype(int).sum(2)>30); dst[m]=sub[m]
p=sys.argv[3] if len(sys.argv)>3 else f'data/derived/{a}/work/{w}/input.png'; im=Image.open(p).convert('RGB'); W=im.size[0]
inp=np.asarray(im).copy(); rc=np.asarray(Image.fromarray(c).resize((W,W),Image.BILINEAR)) if W!=T else c
m=(inp.astype(int).sum(2)<=30)&(rc.astype(int).sum(2)>30)
inp[m]=rc[m]; Image.fromarray(inp).save(p); print(f'unblack {a} {w}: {m.mean()*100:.1f}% filled from render')
