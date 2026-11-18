# clouds: Grok puffs painted on flat blue -> RGBA sprites. usage: python3 scratch/clouds-unmat.py paint-test/clouds/puffs-b.jpg paint-test/clouds/sprites/b
# unmat Grok puffs on flat blue -> RGBA sprites (alpha from blue-red difference, colour un-mixed: no blue/white halo)
import numpy as np, sys
from PIL import Image
from scipy import ndimage as nd
src=sys.argv[1]; a=np.asarray(Image.open(src).convert('RGB')).astype(float)
e=np.concatenate([a[:8].reshape(-1,3),a[-8:].reshape(-1,3),a[:,:8].reshape(-1,3),a[:,-8:].reshape(-1,3)]); bg=np.median(e,0)
d=a[...,2]-a[...,0]; dbg=bg[2]-bg[0]; dcl=-20.
al=np.clip((dbg-d)/(dbg-dcl),0,1); al[al<0.04]=0
F=(a-(1-al[...,None])*bg)/np.maximum(al[...,None],1e-3)
cream=np.array([240,234,224.]); w=np.clip((al-0.05)/0.35,0,1)[...,None]   # faint fringe: colour from the cloud, not the noisy unmix
F=np.clip(F*w+cream*(1-w),0,255)
lab,n=nd.label(nd.binary_dilation(al>0.02,iterations=6)); out=[]
for i,sl in enumerate(nd.find_objects(lab)):
  h,wd=sl[0].stop-sl[0].start, sl[1].stop-sl[1].start
  if h*wd<4000: continue
  y0,y1=max(0,sl[0].start-4),min(a.shape[0],sl[0].stop+4); x0,x1=max(0,sl[1].start-4),min(a.shape[1],sl[1].stop+4)
  m=(lab[y0:y1,x0:x1]==i+1)
  rgba=np.dstack([F[y0:y1,x0:x1],al[y0:y1,x0:x1]*m*255]).astype(np.uint8)
  out.append(rgba); Image.fromarray(rgba,'RGBA').save(f'{sys.argv[2]}{len(out)}.png')
print(src,'bg',bg,'sprites',len(out),[o.shape[:2] for o in out])
