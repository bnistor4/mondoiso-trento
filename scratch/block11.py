# usage: block11.py make|makeC (see makeC below) <i0> <j0> <n> <name> : paint-test/b11/<name>-in.png = current window mosaic of the n x n window block (i0..i0+n-1, j0..), size (n-1)*896+1024, downscaled to 1024 (Grok edit input)
#        block11.py split <i0> <j0> <n> <name> <grok.jpg> : upscale the Grok result back to block size, keep the outer 64 px of the block from the current mosaic (feathered),
#        and write one 1024 crop per window to paint-test/b11/<name>/<i>_<j>.png (to be accepted with acc11.sh)
import sys,os,glob,numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
D='data/derived';S=896
cmd,i0,j0,n,name=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),int(sys.argv[4]),sys.argv[5]; B=(n-1)*S+1024
os.makedirs('paint-test/b11',exist_ok=True)
def win(i,j):
  fs=[f for f in glob.glob(f'{D}/trento-*/windows/{i}_{j}.png') if 'duomo' not in f and 'htest' not in f]
  return np.asarray(Image.open(fs[0]).convert('RGB')) if fs else None
M=np.zeros((B,B,3),np.float32); Wt=np.zeros((B,B),np.float32)
ramp=np.minimum(np.minimum(np.arange(1024),np.arange(1024)[::-1])+1,128)/128.0; w2=np.outer(ramp,ramp)
for j in range(j0,j0+n):
  for i in range(i0,i0+n):
    w=win(i,j)
    if w is None: continue
    y,x=(j-j0)*S,(i-i0)*S; M[y:y+1024,x:x+1024]+=w*w2[...,None]; Wt[y:y+1024,x:x+1024]+=w2
M=M/np.maximum(Wt,1e-6)[...,None]
def rmosaic():
  R=np.zeros((B,B,3),np.uint8); T=1024; x0,y0=i0*S,j0*S
  for ty in range(y0//T,(y0+B-1)//T+1):
    for tx in range(x0//T,(x0+B-1)//T+1):
      fs=[f for f in glob.glob(f'{D}/trento-*/render/{tx}_{ty}.png') if 'duomo' not in f and 'htest' not in f]
      if not fs: continue
      r=np.asarray(Image.open(fs[0]).convert('RGB')); sx0=max(x0,tx*T);sy0=max(y0,ty*T);sx1=min(x0+B,(tx+1)*T);sy1=min(y0+B,(ty+1)*T)
      R[sy0-y0:sy1-y0,sx0-x0:sx1-x0]=r[sy0-ty*T:sy1-ty*T,sx0-tx*T:sx1-tx*T]
  return R
if cmd=='makeC':   # makeC <i0> <j0> <n> <name> <texture> <L,a,b>: forest-render px of the current mosaic replaced by the zone texture (tiled at native scale, mean -> target Lab)
  from skimage.color import rgb2lab,lab2rgb
  t=np.asarray(Image.open(sys.argv[6]).convert('RGB')).astype(np.float32); tgt=np.array([float(v) for v in sys.argv[7].split(',')])
  th,tw=t.shape[:2]; reps=(B//th+2,B//tw+2); tt=np.tile(np.concatenate([t,t[:,::-1]],1),(reps[0],(reps[1]+1)//2,1))[:B,:B]
  L=rgb2lab(tt/255.0); L+=tgt-L.reshape(-1,3).mean(0); tt=np.clip(lab2rgb(L),0,1)*255
  R=rmosaic().astype(int); fm=(np.abs(R-np.array([115,168,81])).max(2)<=14).astype(np.float32); fm=np.clip(gaussian_filter(fm,3)*1.4-0.2,0,1)
  fm[64:-64,64:-64]*=1; edge=np.zeros((B,B),np.float32); edge[96:-96,96:-96]=1; edge=gaussian_filter(edge,24); fm*=edge
  out=M*(1-fm[...,None])+tt*fm[...,None]
  Image.fromarray(out.clip(0,255).astype(np.uint8)).resize((1024,1024),Image.LANCZOS).save(f'paint-test/b11/{name}-in.png'); print(f'paint-test/b11/{name}-in.png block {B}px forest {fm.mean():.0%}')
elif cmd=='make':
  Image.fromarray(M.clip(0,255).astype(np.uint8)).resize((1024,1024),Image.LANCZOS).save(f'paint-test/b11/{name}-in.png'); print(f'paint-test/b11/{name}-in.png block {B}px')
else:
  g=np.asarray(Image.open(sys.argv[6]).convert('RGB').resize((B,B),Image.LANCZOS)).astype(np.float32)
  m=np.zeros((B,B),np.float32); m[64:-64,64:-64]=1; m=gaussian_filter(m,16)
  blk=M.sum(2)<=30; m[blk]=0
  out=(M*(1-m[...,None])+g*m[...,None]).clip(0,255).astype(np.uint8)
  od=f'paint-test/b11/{name}'; os.makedirs(od,exist_ok=True); Image.fromarray(out).save(f'{od}/block.png')
  for j in range(j0,j0+n):
    for i in range(i0,i0+n):
      y,x=(j-j0)*S,(i-i0)*S; Image.fromarray(out[y:y+1024,x:x+1024]).save(f'{od}/{i}_{j}.png')
  print(od)
