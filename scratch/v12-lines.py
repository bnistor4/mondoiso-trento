# v12 diag: long axis-aligned tone steps in the exported map (z6 mosaic, 1 px = 4 art px).
# Column (row) means of CIELAB over 64-px blocks (256 art px); step = dE76 between the means of the
# strips [c-20,c-8) and [c+8,c+20) (outside a 64-art-px feather), minus the median step around it.
# Steps aligned over consecutive blocks are joined into lines; each line is classified by where it
# sits on the global grids: window seam (x = 64 mod 896, feather centre), window border (0/128 mod 896),
# tile border (0 mod 1024, where the owning area changes = cross-area seam), else inside a painting.
import numpy as np, json, sys
from skimage.color import rgb2lab
from scipy.ndimage import uniform_filter1d, median_filter
M=np.load('/workspace/v12/mosaic-z6.npy'); P=np.load('/workspace/v12/mosaic-z6-photo.npy'); m=json.load(open('/workspace/v12/mosaic-z6.json'))
own=json.load(open('/workspace/v12/owner.json'))
B=64; S=4; BG=np.array([232,228,220])
def prof(blk):
  lab=rgb2lab(blk).mean(0); cs=np.vstack([np.zeros((1,3)),np.cumsum(lab,0)]); W=blk.shape[1]
  x=np.arange(20,W-20); dv=(cs[x+20]-cs[x+8])/12.0-(cs[x-8]-cs[x-20])/12.0
  st=np.linalg.norm(dv,axis=1); return x,st,dv
def scan(img, ren, axis):  # axis 'v': vertical lines (steps along x)
  H,W,_=img.shape; out=[]
  for r0 in range(0,H-B+1,B//2):
    blk=img[r0:r0+B]
    bg=(np.abs(blk.astype(int)-BG).sum(2)<=12).mean(0)        # fraction of faded px per column
    x,st,dv=prof(blk); _,sr,_=prof(ren[r0:r0+B])
    from scipy.ndimage import maximum_filter1d
    sr=maximum_filter1d(sr,7)
    base=median_filter(st,size=129,mode='nearest')
    sc=st-base-np.maximum(0,sr-median_filter(sr,size=129,mode='nearest'))  # minus the step the render has here
    bad=uniform_filter1d(bg,41)[x]>0.02
    sc[bad]=0
    out.append((r0,x,sc,st,dv))
  return out
def lines(res, axis, thr=3.0):
  # peaks per block (local max within ±6), then join by position across consecutive blocks
  pk={}
  for bi,(r0,x,sc,st,dv) in enumerate(res):
    for i in np.where(sc>thr)[0]:
      lo,hi=max(0,i-6),min(len(sc),i+7)
      if sc[i]==sc[lo:hi].max(): pk.setdefault(bi,[]).append((int(x[i]),float(sc[i]),float(st[i]),dv[i]))
  L=[]; open_={}
  for bi in range(len(res)):
    nxt={}
    for (p,s,st,dv) in pk.get(bi,[]):
      key=next((q for q in open_ if abs(q-p)<=2),None)
      if key is not None: l=open_.pop(key); l['pts'].append((bi,p,s,st,dv)); nxt[p]=l
      else: l={'axis':axis,'pts':[(bi,p,s,st,dv)]}; L.append(l); nxt[p]=l
    open_=nxt
  return L
res_v=scan(M,P,'v'); Lv=lines(res_v,'v')
res_h=scan(M.transpose(1,0,2),P.transpose(1,0,2),'h'); Lh=lines(res_h,'h')
out=[]
for l in Lv+Lh:
  n=len(l['pts'])
  if n<3: continue   # < 128 mosaic px = 512 art px long (blocks overlap by half)
  pos=int(np.median([q[1] for q in l['pts']])); s=float(np.mean([q[2] for q in l['pts']])); dvm=np.mean([q[4] for q in l['pts']],0); st=float(np.mean([q[3] for q in l['pts']]))
  b0=l['pts'][0][0]*B//2; b1=l['pts'][-1][0]*B//2+B
  if l['axis']=='v': ax=m['X0']+pos*S; a0,a1=m['Y0']+b0*S,m['Y0']+b1*S
  else: ax=m['Y0']+pos*S; a0,a1=m['X0']+b0*S,m['X0']+b1*S
  r896=ax%896; r1024=ax%1024
  cls='window-seam' if min(abs(r896-64),896-abs(r896-64))<=12 else 'window-border' if min(r896,896-r896)<=12 or abs(r896-128)<=12 else 'tile-border' if min(r1024,1024-r1024)<=12 else 'inside'
  # areas on both sides at the line middle
  mid=(a0+a1)//2
  if l['axis']=='v': pa,pb=(ax-40,mid),(ax+40,mid)
  else: pa,pb=(mid,ax-40),(mid,ax+40)
  oa=own.get(f'{pa[0]//1024}_{pa[1]//1024}','-'); ob=own.get(f'{pb[0]//1024}_{pb[1]//1024}','-')
  if cls=='tile-border' and oa!=ob: cls='cross-area'
  out.append(dict(axis=l['axis'],pos=int(ax),start=int(a0),end=int(a1),len=int(a1-a0),score=round(s,2),step=round(st,2),cls=cls,areas=[oa,ob],dLab=[round(float(v),1) for v in dvm],rank=round(float(s*np.sqrt((a1-a0)/256)),2)))
out.sort(key=lambda d:-d['rank']); json.dump(out,open('/workspace/v12/lines.json','w'),indent=0)
from collections import Counter
print(len(out),'lines', Counter(d['cls'] for d in out))
for d in out[:40]: print(d)
