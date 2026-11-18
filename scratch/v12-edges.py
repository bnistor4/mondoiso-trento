# v12 diag: hard tone steps ON the window grid of the exported map (z6 mosaic, 1 px = 4 art px).
# For every window edge (vertical: between windows (i-1,j)|(i,j), lines x = i*896 + {0,64,128};
# horizontal likewise) and each 224-art-px quarter of it: step = dE76 of CIELAB means of the 32-art-px
# strips either side (8 art px gap), minus the median step at 80..240 art px around (texture),
# minus the same excess measured on the render (real features). Best of the three offsets (±12 art px).
import numpy as np, json, os
from skimage.color import rgb2lab
M=np.load('/workspace/v12/'+os.environ.get('ART','mosaic-z6.npy'),mmap_mode='r'); P=np.load('/workspace/v12/'+os.environ.get('REN','mosaic-z6-photo.npy'),mmap_mode='r')
m=json.load(open('/workspace/v12/mosaic-z6.json')); own=json.load(open('/workspace/v12/'+os.environ.get('OWN','owner.json')))
X0,Y0=m['X0'],m['Y0']; H,W,_=M.shape; BG=np.array([232,228,220])
def prof(strip):           # strip: (len_along, across, 3) -> per-across CIELAB means
  return rgb2lab(np.ascontiguousarray(strip)).mean(0)
def steps(p,c):            # p: across x 3 means, c index -> dE at c with 8-px strips, gap 2 (1 px = 4 art)
  a=p[c-10:c-2].mean(0); b=p[c+2:c+10].mean(0); return np.linalg.norm(b-a), b-a
def excess(p,c):
  s,d=steps(p,c); base=np.median([steps(p,c+o)[0] for o in list(range(-60,-19,4))+list(range(20,61,4))]); return s-base,s,d
res=[]
tiles=[tuple(map(int,k.split('_'))) for k in own]
ix0=min(t[0] for t in tiles)*1024//896-1; ix1=(max(t[0] for t in tiles)+1)*1024//896+1
iy0=min(t[1] for t in tiles)*1024//896-1; iy1=(max(t[1] for t in tiles)+1)*1024//896+1
for axis in 'vh':
  for i in range(ix0,ix1+1):
    for j in range(iy0,iy1+1):
      # vertical edge: x near i*896, along y in [j*896,(j+1)*896]; horizontal: y near j*896 (swap roles)
      for q in range(4):
        if axis=='v': gx=i*896; s0=j*896+q*224
        else: gx=j*896; s0=i*896+q*224
        if axis=='v':
          c0=(gx-X0)//4; r0=(s0-Y0)//4
          if c0-80<0 or c0+112>W or r0<0 or r0+56>H: continue
          A=M[r0:r0+56,c0-80:c0+112]; R=P[r0:r0+56,c0-80:c0+112]
        else:
          c0=(gx-Y0)//4; r0=(s0-X0)//4
          if c0-80<0 or c0+112>H or r0<0 or r0+56>W: continue
          A=M[c0-80:c0+112,r0:r0+56].transpose(1,0,2); R=P[c0-80:c0+112,r0:r0+56].transpose(1,0,2)
        mx,my=((gx, s0+112) if axis=='v' else (s0+112, gx))
        if os.environ.get('OWN') and not any(f'{(mx+dx)//1024}_{(my+dy)//1024}' in own for dx in (-200,0,200) for dy in (-200,0,200)): continue
        if (np.abs(A.astype(int)-BG).sum(2)<=12).mean()>0.01: continue
        pa,pr=prof(A),prof(R); best=None
        for off in (0,16,32):          # 0/64/128 art px
          for d in (-3,-2,-1,0,1,2,3):
            c=80+off+d; e,s,dv=excess(pa,c); er,_,_=excess(pr,c); sc=e-max(0,er)
            if best is None or sc>best[0]: best=(sc,s,dv,off*4,d*4)
        sc,s,dv,off,d=best
        px=(gx+off+d, s0+112) if axis=='v' else (s0+112, gx+off+d)
        area=own.get(f'{px[0]//1024}_{px[1]//1024}','-')
        res.append(dict(axis=axis,i=i,j=j,q=q,score=round(float(sc),2),step=round(float(s),2),dLab=[round(float(v),1) for v in dv],off=off,area=area,x=int(px[0]),y=int(px[1])))
json.dump(res,open('/workspace/v12/'+os.environ.get('OUT','edges')+'-seg.json','w'))
# aggregate per window edge
E={}
for r in res:
  k=(r['axis'],r['i'],r['j']); E.setdefault(k,[]).append(r)
agg=[]
for (ax,i,j),rs in E.items():
  sc=sorted(r['score'] for r in rs); top=max(rs,key=lambda r:r['score'])
  pair=(f'{i-1}_{j}',f'{i}_{j}') if ax=='v' else (f'{i}_{j-1}',f'{i}_{j}')
  agg.append(dict(edge=f"{pair[0]}|{pair[1]}",axis=ax,area=top['area'],max=top['score'],mean=round(float(np.mean(sc)),2),nseg=len(rs),step=top['step'],dLab=top['dLab'],off=top['off'],x=top['x'],y=top['y']))
agg.sort(key=lambda a:-(a['mean']+a['max'])/2)
json.dump(agg,open('/workspace/v12/'+os.environ.get('OUT','edges')+'.json','w'),indent=0)
print(len(res),'segments',len(agg),'edges')
for a in agg[:40]: print(a)
