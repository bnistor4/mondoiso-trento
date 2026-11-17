# usage: darkchk.py <input.png> <out> : replicate paint.ts hasDarkPatch (8x8 cells), print offending cells
import sys,numpy as np
from PIL import Image
def c(f): return np.asarray(Image.open(f).convert('RGB').resize((8,8),Image.BILINEAR)).astype(float)
n=c(sys.argv[1]); o=c(sys.argv[2])
bad=[(k//8,k%8,round(o.reshape(-1,3)[k].mean()),round(n.reshape(-1,3)[k].mean())) for k in range(64) if (lambda oc,nc: oc.mean()<40 and oc.max()<48 and oc.max()-oc.min()<12 and oc.mean()<0.5*nc.mean() and nc.mean()>=24)(o.reshape(-1,3)[k],n.reshape(-1,3)[k])]
print(bad)
