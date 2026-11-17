# usage: editin11.py <area> <w> : /tmp/e11/<w>.png = work/<w>/input.png (painted neighbour strips) with the centre [128:896] replaced by the
# original painted window (archive/v11), feathered (sigma 12), written to paint-test/e11/<w>.png, as the Grok edit input (method B: re-texture existing painting)
import sys,os,numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
a,w=sys.argv[1],sys.argv[2]; D=f'data/derived/{a}'
inp=np.asarray(Image.open(f'{D}/work/{w}/input.png').convert('RGB')).astype(np.float32)
org=np.asarray(Image.open(f'{D}/archive/v11/windows/{w}.png').convert('RGB')).astype(np.float32)
m=np.zeros((1024,1024),np.float32); m[128:896,128:896]=1; m=gaussian_filter(m,12)
blk=inp.sum(2)<=30; m[blk]=0   # keep black (outside footprint) as in input
out=inp*(1-m[...,None])+org*m[...,None]
os.makedirs('paint-test/e11',exist_ok=True); Image.fromarray(out.clip(0,255).astype(np.uint8)).save(f'paint-test/e11/{w}.png'); print(f'paint-test/e11/{w}.png')
