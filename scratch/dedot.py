# usage: dedot.py <area> <w> : fill isolated near-black blobs (200..3000 px, model's black tree-marker dots) with the median of their surroundings; original in archive/predot
import sys,os,shutil, numpy as np
from PIL import Image
from scipy import ndimage as nd
a,w=sys.argv[1],sys.argv[2]; D=f'data/derived/{a}'; f=f'{D}/windows/{w}.png'
os.makedirs(f'{D}/archive/predot',exist_ok=True); shutil.copy(f,f'{D}/archive/predot/{w}.png')
im=np.asarray(Image.open(f).convert('RGBA')).copy(); m=im[...,:3].astype(int).sum(2)<70
lab,n=nd.label(m); n_fix=0
for k in range(1,n+1):
  c=lab==k; s=c.sum()
  if not 200<s<3000: continue
  ys,xs=np.where(c)
  if (xs.max()-xs.min())>90 or (ys.max()-ys.min())>90: continue
  c=nd.binary_dilation(c,iterations=4); r=nd.binary_dilation(c,iterations=6)&~c
  im[c,:3]=np.median(im[r,:3],axis=0); n_fix+=1
Image.fromarray(im).save(f); print('dedot',w,n_fix)
