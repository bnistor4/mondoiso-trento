# v12 diag: art|render crop around global art px box from the z6 mosaics (or z8 tiles with --z8)
import numpy as np, json, sys
from PIL import Image, ImageDraw
M=np.load('/workspace/v12/mosaic-z6.npy',mmap_mode='r'); P=np.load('/workspace/v12/mosaic-z6-photo.npy',mmap_mode='r'); m=json.load(open('/workspace/v12/mosaic-z6.json'))
def crop(x0,y0,x1,y1,out,lines=(),render=True):
  X0,Y0,X1,Y1=[(v-o)//4 for v,o in ((x0,m['X0']),(y0,m['Y0']),(x1,m['X0']),(y1,m['Y0']))]
  a=Image.fromarray(np.ascontiguousarray(M[Y0:Y1,X0:X1])); ims=[a]
  if render: ims.append(Image.fromarray(np.ascontiguousarray(P[Y0:Y1,X0:X1])))
  W=sum(i.width for i in ims)+8*(len(ims)-1); c=Image.new('RGB',(W,a.height),(255,255,255)); x=0
  for i in ims: c.paste(i,(x,0)); x+=i.width+8
  d=ImageDraw.Draw(c)
  for (ax,pos,s,e) in lines:
    for off in ([0,a.width+8] if render else [0]):
      if ax=='v': d.line([((pos-x0)//4+off,(s-y0)//4),((pos-x0)//4+off,(e-y0)//4)],fill=(255,0,255),width=1)
      else: d.line([((s-x0)//4+off,(pos-y0)//4),((e-x0)//4+off,(pos-y0)//4)],fill=(255,0,255),width=1)
  c.save(out)
if __name__=='__main__':
  L=json.load(open('/workspace/v12/lines.json'))
  for i,l in enumerate(L[:int(sys.argv[1])]):
    if l['axis']=='v': cx,cy=l['pos'],(l['start']+l['end'])//2
    else: cx,cy=(l['start']+l['end'])//2,l['pos']
    crop(cx-1200,cy-900,cx+1200,cy+900,f'/workspace/v12/line{i:02d}.png',[(l['axis'],l['pos'],l['start'],l['end'])])
