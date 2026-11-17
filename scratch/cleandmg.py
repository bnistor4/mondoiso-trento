# usage: cleandmg.py [--fix] : windows with pure-black pixels where ANY area's render has content (dilated 3 px).
# Cause: clean.mts built its keep-mask from the own area's render only (the ctx csv never matched a path), so it zeroed dark
# painted pixels (forest) wherever the own render was black or missing, i.e. inside neighbours. Restore from the newest archived
# copy of the SAME painting (prenoise/predot/prewhite/prebase/preseam; per-channel median shift, other pixels must agree <1%).
# --fix: current -> archive/cleanbug/, black-on-content pixels pasted from that copy. Windows with no clean copy are listed.
import os,sys,glob,shutil,numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation
R='data/derived'; S=896; T=1024
AR=[a for a in sorted(os.listdir(R)) if a.startswith('trento-') and a not in('trento-htest','trento-duomo')]
rc={}
def rend(tx,ty):
  if (tx,ty) not in rc:
    m=None
    for a in AR:
      f=f'{R}/{a}/render/{tx}_{ty}.png'
      if os.path.exists(f):
        c=np.asarray(Image.open(f).convert('RGB')).astype(int).sum(2)>30; m=c if m is None else (m|c)
    rc[(tx,ty)]=m
  return rc[(tx,ty)]
def content(i,j):
  cont=np.zeros((T,T),bool)
  for ty in range((j*S)//T,(j*S+T-1)//T+1):
    for tx in range((i*S)//T,(i*S+T-1)//T+1):
      m=rend(tx,ty)
      if m is None: continue
      x0,x1=max(tx*T,i*S),min((tx+1)*T,i*S+T); y0,y1=max(ty*T,j*S),min((ty+1)*T,j*S+T)
      cont[y0-j*S:y1-j*S,x0-i*S:x1-i*S]|=m[y0-ty*T:y1-ty*T,x0-tx*T:x1-tx*T]
  return binary_dilation(cont,iterations=3)
fix='--fix' in sys.argv; nfix=0; left=[]
for a in AR:
  for cf in sorted(glob.glob(f'{R}/{a}/windows/*.png')):
    w=os.path.basename(cf)[:-4]
    if not w.replace('-','').replace('_','').isdigit(): continue
    cur=np.asarray(Image.open(cf).convert('RGB')).copy()
    if cur.shape!=(T,T,3): continue
    blk=cur.max(2)==0
    if blk.sum()<500: continue
    i,j=map(int,w.split('_')); B=blk&content(i,j); n=int(B.sum())
    if n<500: continue
    best=None
    for sub in ('prenoise','predot','prewhite','prebase','preseam'):
      pf=f'{R}/{a}/archive/{sub}/{w}.png'
      if not os.path.exists(pf): continue
      p=np.asarray(Image.open(pf).convert('RGB')).astype(int)
      if p.shape!=cur.shape: continue
      both=~blk&(p.max(2)>0)
      sh=np.median((cur.astype(int)-p)[both],axis=0).round().astype(int)
      od=((np.abs(cur.astype(int)-p-sh).sum(2)>12)&both).sum()/max(1,both.sum())
      cov=((p.max(2)>0)&B).sum()/n
      if od<0.01 and cov>0.5 and (best is None or cov>best[0]): best=(cov,sub,sh,p,od)
    if best is None: left.append((a,w,n)); print(a,w,n,'no clean copy'); continue
    cov,sub,sh,p,od=best; d=B&(p.max(2)>0)
    print(a,w,n,'%.2f%%'%(100*n/T/T),'<-',sub,'shift',sh.tolist(),'agree %.2f%%'%(100-100*od),'covers %.0f%%'%(100*cov))
    nfix+=1
    if fix:
      os.makedirs(f'{R}/{a}/archive/cleanbug',exist_ok=True)
      if not os.path.exists(f'{R}/{a}/archive/cleanbug/{w}.png'): shutil.copy(cf,f'{R}/{a}/archive/cleanbug/{w}.png')
      cur[d]=np.clip(p[d]+sh,0,255).astype('uint8'); Image.fromarray(cur).save(cf+'.fix.png','PNG'); os.replace(cf+'.fix.png',cf)
print('restorable',nfix,'(fixed)' if fix else '','no clean copy',len(left),sum(x[2] for x in left),'px')
