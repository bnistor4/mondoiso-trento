# usage: stripfix.py <edges.json> <art-mosaic.npy> [--t=10] [--fade=320] [--dry] [--only=edge,...]
# v12: remove hard straight tone steps on window strip edges (where a later window's pasted neighbour strip meets
# its own painting). For every flagged edge (scan score (mean+max)/2 > t, from scratch/v12-edges.py on a mosaic of the
# assembled art), along the line: d(k) = CIELAB mean of the 32 px band after the line - the band before (8 px gap),
# minus the same on the render (real features stay), smoothed along the line (sigma 64 px), weight 1 on the edge's
# 896 px and a cosine taper over 128 px beyond. The exact line position is refined on the full-res assembled art (+-12 px).
# Correction, split across both sides: each side moves half way towards the other, -/+ d/2, fading with a raised
# cosine to 0 at <fade> px from the line (the jump itself is a 6 px linear ramp). The field is global and applied to
# EVERY window file covering a pixel (all 16 areas), so overlaps stay consistent for the assemble/palette step.
# Render-black (sum<=30) pixels are untouched. Originals -> data/derived/archive-v12/windows/<area>/<w>.png (first time only).
import sys, os, json, shutil, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter1d
from skimage.color import rgb2lab, lab2rgb
args=[a for a in sys.argv[1:] if not a.startswith('--')]; opt=dict(a[2:].split('=',1) if '=' in a else (a[2:],'1') for a in sys.argv[1:] if a.startswith('--'))
T=float(opt.get('t',10)); FADE=float(opt.get('fade',320)); DRY='dry' in opt; ONLY=set(opt['only'].split(',')) if 'only' in opt else None
R='data/derived'; A=open('/tmp/all16').read().strip().split(',')
E=json.load(open(args[0])); M=np.load(args[1],mmap_mode='r'); P=np.load('/workspace/v12/mosaic-z6-photo.npy',mmap_mode='r')
g=json.load(open('/workspace/v12/mosaic-z6.json')); X0,Y0=g['X0'],g['Y0']; BG=np.array([232,228,220])
paint={}
def ptile(k):
  if k not in paint:
    paint[k]=None
    for a in reversed(A):
      f=f'{R}/{a}/paint/{k}.png'
      if os.path.exists(f): paint[k]=np.asarray(Image.open(f).convert('RGB')); break
  return paint[k]
def crop(x0,y0,W,H):
  out=np.zeros((H,W,3),np.uint8)
  for ty in range(y0//1024,(y0+H-1)//1024+1):
    for tx in range(x0//1024,(x0+W-1)//1024+1):
      t=ptile(f'{tx}_{ty}')
      if t is None: continue
      ax0,ay0=max(x0,tx*1024),max(y0,ty*1024); ax1,ay1=min(x0+W,tx*1024+1024),min(y0+H,ty*1024+1024)
      out[ay0-y0:ay1-y0,ax0-x0:ax1-x0]=t[ay0-ty*1024:ay1-ty*1024,ax0-tx*1024:ax1-tx*1024]
  return out
flag=[e for e in E if (e['mean']+e['max'])/2>T and (ONLY is None or e['edge'] in ONLY)]
lines={}   # (axis, refined line pos) -> list of (s0,s1)
for e in flag:
  ax=e['axis']; a,b=e['edge'].split('|'); i,j=map(int,b.split('_'))
  pos=e['x'] if ax=='v' else e['y']; s0=(j if ax=='v' else i)*896; s1=s0+896
  # refine on full-res art: across profile (mean along the edge), max step of 8 px bands within +-12
  if ax=='v': C=crop(pos-24,s0,48,896).astype(np.float32)
  else: C=crop(s0,pos-24,896,48).transpose(1,0,2).astype(np.float32)
  ok=C.sum(2)>30; L=rgb2lab(C.clip(0,255).astype(np.uint8)); prof=np.array([L[:,c][ok[:,c]].mean(0) if ok[:,c].sum()>50 else np.full(3,np.nan) for c in range(48)])
  best=(0,24)
  for c in range(12,37):
    v=np.linalg.norm(np.nanmean(prof[c:c+8],0)-np.nanmean(prof[c-8:c],0))
    if np.isfinite(v) and v>best[0]: best=(v,c)
  lp=pos-24+best[1]   # first pixel of the + side
  lines.setdefault((ax,lp),[]).append((s0,s1,e['edge']))
print('stripfix t=%g fade=%g: %d flagged edges on %d lines'%(T,FADE,len(flag),len(lines)))
fields=[]   # (ax, lp, k0, D[k] (n,3) per art px from k0)
for (ax,lp),segs in lines.items():
  k0=min(s for s,_,_ in segs)-128; k1=max(s for _,s,_ in segs)+128; n=k1-k0
  W=np.zeros(n)
  for s0,s1,_ in segs:
    k=np.arange(k0,k1); w=np.where((k>=s0)&(k<s1),1.0,0.0); dd=np.where(k<s0,s0-k,np.where(k>=s1,k-s1+1,0))
    w=np.maximum(w,np.where((dd>0)&(dd<=128),0.5*(1+np.cos(np.pi*dd/128)),0)); W=np.maximum(W,w)
  # mosaic profile along the line (1 mosaic px = 4 art px)
  c=(lp-(X0 if ax=='v' else Y0))//4; r0=(k0-(Y0 if ax=='v' else X0))//4; nr=n//4+1
  if ax=='v': SA=np.asarray(M[r0:r0+nr,c-10:c+10]); SR=np.asarray(P[r0:r0+nr,c-10:c+10])
  else: SA=np.asarray(M[c-10:c+10,r0:r0+nr]).transpose(1,0,2); SR=np.asarray(P[c-10:c+10,r0:r0+nr]).transpose(1,0,2)
  if SA.shape[0]<nr: continue
  def bands(S):
    Lb=rgb2lab(np.ascontiguousarray(S)); return Lb[:,0:8].mean(1), Lb[:,12:20].mean(1)   # before: c-10..c-2, after: c+2..c+10
  ab,aa=bands(SA); rb,ra=bands(SR); d=(aa-ab)-(ra-rb)
  bad=((SA.sum(2)<=30)|(np.abs(SA.astype(int)-BG).sum(2)<=12)).mean(1)>0.2
  wq=(~bad).astype(float); d=np.where(bad[:,None],0,d)
  ds=gaussian_filter1d(d,16,axis=0); wsm=gaussian_filter1d(wq,16); ds=ds/np.maximum(wsm,1e-3)[:,None]*(wsm>0.3)[:,None]
  O=(Y0 if ax=='v' else X0); D=ds[((np.arange(k0,k1)-O)//4-r0).clip(0,len(ds)-1)]
  D=D[:n]*W[:len(D[:n]),None]
  fields.append((ax,lp,k0,D)); print('  line',ax,lp,'k',k0,k1,'edges',','.join(s[2] for s in segs),'max |d| %.1f'%np.abs(np.linalg.norm(D,axis=1)).max())
json.dump([dict(ax=a,lp=int(l),k0=int(k),dmax=float(np.linalg.norm(D,axis=1).max())) for a,l,k,D in fields],open('/workspace/v12/stripfix-last.json','w'))
ramp=lambda t: np.clip(t/3.0,-1,1)   # 6 px jump ramp
def fade(t): u=np.abs(t)/FADE; return np.where(u<1,0.5*(1+np.cos(np.pi*np.minimum(u,1))),0)
if 'preview' in opt:   # apply the field to the 1/4 mosaic instead (prediction), save /workspace/v12/<preview>.npy
  Mq=np.array(M); H,Wd,_=Mq.shape; Fq=np.zeros(Mq.shape,np.float32)
  for ax,lp,k0,D in fields:
    n=len(D); Dq=D[::4]; kq0=k0
    if ax=='v':
      c0=max(0,int((lp-FADE-X0)//4)); c1=min(Wd,int((lp+FADE-X0)//4)+1); r0=int((kq0-Y0)//4); r1=r0+len(Dq)
      rr0,rr1=max(0,r0),min(H,r1); t=X0+4*np.arange(c0,c1)+2-lp; prof=-ramp(t)*fade(t)/2
      Fq[rr0:rr1,c0:c1]+=Dq[rr0-r0:rr1-r0,None,:]*prof[None,:,None]
    else:
      c0=max(0,int((lp-FADE-Y0)//4)); c1=min(H,int((lp+FADE-Y0)//4)+1); r0=int((kq0-X0)//4); r1=r0+len(Dq)
      rr0,rr1=max(0,r0),min(Wd,r1); t=Y0+4*np.arange(c0,c1)+2-lp; prof=-ramp(t)*fade(t)/2
      Fq[c0:c1,rr0:rr1]+=prof[:,None,None]*Dq[None,rr0-r0:rr1-r0,:]
  keep=(Mq.astype(int).sum(2)<=30)|(np.abs(Mq.astype(int)-BG).sum(2)<=12); ch=np.abs(Fq).max(2)>0.3
  for y0 in range(0,H,1024):
    sl=slice(y0,y0+1024); m=ch[sl]&~keep[sl]
    if not m.any(): continue
    Lb=rgb2lab(Mq[sl][m][None])[0]+Fq[sl][m]; Mq[sl][m]=(lab2rgb(Lb[None])[0]*255).round().clip(0,255).astype(np.uint8)
  np.save('/workspace/v12/'+opt['preview']+'.npy',Mq); print('preview saved'); sys.exit(0)
if DRY: sys.exit(0)
# apply to every window file covering the fields
wins={}
for a in A:
  for f in os.listdir(f'{R}/{a}/windows'):
    if f.endswith('.png') and '_' in f: wins.setdefault(f[:-4],[]).append(a)
touched=0
for w,areas in wins.items():
  i,j=map(int,w.split('_')); wx0,wy0=i*896,j*896
  F=None
  for ax,lp,k0,D in fields:
    n=len(D)
    if ax=='v':
      if lp+FADE<wx0 or lp-FADE>wx0+1024 or k0>wy0+1024 or k0+n<wy0: continue
      t=(np.arange(wx0,wx0+1024)-lp+0.5); kk=np.arange(wy0,wy0+1024)-k0
      Dk=np.where(((kk>=0)&(kk<n))[:,None],D[np.clip(kk,0,n-1)],0)            # (1024 rows,3)
      prof=-ramp(t)*fade(t)/2                                                   # (1024 cols)
      f=Dk[:,None,:]*prof[None,:,None]
    else:
      if lp+FADE<wy0 or lp-FADE>wy0+1024 or k0>wx0+1024 or k0+n<wx0: continue
      t=(np.arange(wy0,wy0+1024)-lp+0.5); kk=np.arange(wx0,wx0+1024)-k0
      Dk=np.where(((kk>=0)&(kk<n))[:,None],D[np.clip(kk,0,n-1)],0)
      prof=-ramp(t)*fade(t)/2
      f=prof[:,None,None]*Dk[None,:,:]
    F=f if F is None else F+f
  if F is None or np.abs(F).max()<0.3: continue
  for a in areas:
    p=f'{R}/{a}/windows/{w}.png'; arch=f'{R}/archive-v12/windows/{a}/{w}.png'
    os.makedirs(os.path.dirname(arch),exist_ok=True)
    if not os.path.exists(arch): shutil.copy2(p,arch)
    im=Image.open(p); mode=im.mode; X=np.asarray(im.convert('RGB'))
    keep=X.astype(int).sum(2)<=30
    Lw=rgb2lab(X)+F; Y=(lab2rgb(Lw)*255).round().clip(0,255).astype(np.uint8); Y[keep]=X[keep]
    Image.fromarray(Y).save(p); touched+=1
print('stripfix applied: %d window files changed'%touched)
