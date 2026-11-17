# usage: depurple.py <area> <w> : recolour model's purple/violet tree balls (b>g+25, r>g) to a leafy green keeping shading; original in archive/prepurple
import sys,os,shutil,numpy as np
from PIL import Image
a,w=sys.argv[1:3]; f=f'data/derived/{a}/windows/{w}.png'; d=f'data/derived/{a}/archive/prepurple'; os.makedirs(d,exist_ok=True); shutil.copy(f,d)
x=np.asarray(Image.open(f).convert('RGB')).astype(int); r,g,b=x[...,0],x[...,1],x[...,2]
T=int(os.environ.get("PT",25)); m=(b>g+T)&(r>g-5)&(b>40)
L=(r+g+b)/3; y=x.copy(); y[m,0]=(L[m]*0.75).astype(int); y[m,1]=(L[m]*1.15).astype(int); y[m,2]=(L[m]*0.55).astype(int)
Image.fromarray(np.clip(y,0,255).astype('uint8')).save(f); print('depurple',w,int(m.sum()))
