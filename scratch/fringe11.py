# usage: fringe11.py [--fix] : v11 texfix side effect check: in every window changed in v11 (archive/v11/windows-tex original exists), pixels within
# 16 px of near-black (sum<=30) that became near-black-ish (sum<=90) while the original was not (sum>120). --fix: restore those band pixels
# (16 px band around black, feathered) from the v11 original; current file copied to archive/v11/prefringe/ first.
import sys,glob,os,shutil,numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt,label
FIX='--fix' in sys.argv; tot=0; nw=0
for org in sorted(glob.glob('data/derived/trento-*/archive/v11/windows-tex/*.png')+glob.glob('data/derived/trento-*/archive/v11/windows-tone/*.png')):
  a=org.split('/')[2]; w=os.path.basename(org); cur=f'data/derived/{a}/windows/{w}'
  if '/windows-tone/' in org and os.path.exists(f'data/derived/{a}/archive/v11/windows-tex/{w}'): continue
  o=np.asarray(Image.open(org).convert('RGB')).astype(int); c=np.asarray(Image.open(cur).convert('RGB')).astype(int)
  blk=c.sum(2)<=30
  if not blk.any(): continue
  d=distance_transform_edt(~blk); band=(d>0)&(d<=16)
  bad=band&(c.sum(2)<=90)&(o.sum(2)>120); n=int(bad.sum())
  if n==0: continue
  nw+=1; tot+=n; print(a[7:],w,n)
  if FIX:
    ad=f'data/derived/{a}/archive/v11/prefringe'; os.makedirs(ad,exist_ok=True)
    if not os.path.exists(f'{ad}/{w}'): shutil.copy2(cur,f'{ad}/{w}')
    wt=np.clip((18-d)/6,0,1)*(d>0); wt[blk]=0
    out=c*(1-wt[...,None])+o*wt[...,None]; Image.fromarray(out.round().clip(0,255).astype(np.uint8)).save(cur)
print('fringe11:',nw,'windows,',tot,'darkened band px', '(fixed)' if FIX else '')
