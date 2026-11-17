# v10 close-out: in windows/<w>.png, black pixels where the current render union has content get the painted pixel of an
# overlapping neighbour window (non-black there), else the render pixel. Original archived to <area>/archive/v10/windows-unblack2/.
# MINB=<px> env: only fix black-over-render blobs of at least that size (keeps small painted shadows).
import sys,os,glob,shutil,numpy as np
from PIL import Image
from scipy.ndimage import label
MINB=int(os.environ.get('MINB','1'))
D='data/derived'; S=896; T=1024
for arg in sys.argv[1:]:
  a,w=arg.split(':'); i,j=map(int,w.split('_')); x0,y0=i*S,j*S
  p=f'{D}/trento-{a}/windows/{w}.png'; im=np.asarray(Image.open(p).convert('RGB')).copy()
  ren=np.zeros_like(im)
  for ty in range(y0//T,(y0+T-1)//T+1):
    for tx in range(x0//T,(x0+T-1)//T+1):
      for f in glob.glob(f'{D}/trento-*/render/{tx}_{ty}.png'):
        r=np.asarray(Image.open(f).convert('RGB'))
        sx0=max(x0,tx*T);sy0=max(y0,ty*T);sx1=min(x0+T,(tx+1)*T);sy1=min(y0+T,(ty+1)*T)
        sub=r[sy0-ty*T:sy1-ty*T,sx0-tx*T:sx1-tx*T];dst=ren[sy0-y0:sy1-y0,sx0-x0:sx1-x0]
        m=dst.astype(int).sum(2)<=30; dst[m]=sub[m]
  bad=(im.astype(int).sum(2)<=30)&(ren.astype(int).sum(2)>30)
  L,nl=label(bad); sz=np.bincount(L.ravel()); sz[0]=0; bad=sz[L]>=MINB; n0=int(bad.sum())
  for di in(-1,0,1):
    for dj in(-1,0,1):
      if di==dj==0: continue
      for f in glob.glob(f'{D}/trento-*/windows/{i+di}_{j+dj}.png'):
        nb=np.asarray(Image.open(f).convert('RGB')); ox,oy=di*S,dj*S
        ys,xs=np.nonzero(bad); ny,nx=ys-oy,xs-ox; ok=(nx>=0)&(nx<T)&(ny>=0)&(ny<T)
        ys,xs,ny,nx=ys[ok],xs[ok],ny[ok],nx[ok]; v=nb[ny,nx]; good=v.astype(int).sum(1)>30
        im[ys[good],xs[good]]=v[good]; bad[ys[good],xs[good]]=False
  n1=int(bad.sum()); im[bad]=ren[bad]
  ad=f'{D}/trento-{a}/archive/v10/windows-unblack2'; os.makedirs(ad,exist_ok=True)
  if not os.path.exists(f'{ad}/{w}.png'): shutil.copy2(p,f'{ad}/{w}.png')
  Image.fromarray(im).save(p); print(a,w,'black-over-render px',n0,'-> from neighbour paint',n0-n1,'from render',n1)
