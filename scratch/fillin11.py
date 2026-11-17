# usage: fillin11.py <area> <w> <texture> <L,a,b target> : method C Grok input paint-test/e11/<w>-C.png = work/<w>/input.png with every forest-render pixel
# of the unpainted centre replaced by the zone texture (random flip/roll per window, mean shifted to the zone target Lab), feathered 6 px.
import sys,os,hashlib,numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
from skimage.color import rgb2lab,lab2rgb
a,w,tex,tgt=sys.argv[1],sys.argv[2],sys.argv[3],np.array([float(v) for v in sys.argv[4].split(',')])
D=f'data/derived/{a}'; inp=np.asarray(Image.open(f'{D}/work/{w}/input.png').convert('RGB')).astype(np.float32)
t=np.asarray(Image.open(tex).convert('RGB').resize((1024,1024),Image.LANCZOS)).astype(np.float32)
h=int(hashlib.md5(w.encode()).hexdigest(),16); rng=np.random.default_rng(h%2**32)
if rng.random()<.5: t=t[:,::-1]
if rng.random()<.5: t=t[::-1]
t=np.roll(t,(int(rng.integers(1024)),int(rng.integers(1024))),(0,1))
L=rgb2lab(t/255.0); L+= (tgt-L.reshape(-1,3).mean(0)); t=np.clip(lab2rgb(L),0,1)*255
fm=(np.abs(inp-np.array([115,168,81])).max(2)<=14).astype(np.float32)
fm=np.clip(gaussian_filter(fm,3)*1.4-0.2,0,1)
out=inp*(1-fm[...,None])+t*fm[...,None]
os.makedirs('paint-test/e11',exist_ok=True); Image.fromarray(out.clip(0,255).astype(np.uint8)).save(f'paint-test/e11/{w}-C.png')
print(f'paint-test/e11/{w}-C.png forest-filled {fm.mean():.0%}')
