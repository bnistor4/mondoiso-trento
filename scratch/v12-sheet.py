# v12 diag: contact sheet of the worst window edges (art z8 at 1/4 + render), edge marked in magenta
import json, sys, numpy as np
from PIL import Image, ImageDraw
exec(open('scratch/v12-z8.py').read().split("if __name__")[0])
E=json.load(open('/workspace/v12/edges.json')); N=int(sys.argv[1]); out=sys.argv[2]; start=int(sys.argv[3]) if len(sys.argv)>3 else 0
def edgebox(e):
  a,b=e['edge'].split('|'); i,j=map(int,b.split('_'))
  if e['axis']=='v': g=i*896+e['off']; return ('v',g,j*896,j*896+896)
  g=j*896+e['off']; return ('h',g,i*896,i*896+896)
cells=[]
for n,e in enumerate(E[start:start+N]):
  ax,g,s0,s1=edgebox(e); cx,cy=((g,(s0+s1)//2) if ax=='v' else ((s0+s1)//2,g))
  x0,y0=cx-1000,cy-750; sc=4
  ims=[]
  for layer in ('map','photo'):
    im=Image.fromarray(z8(x0,y0,x0+2000,y0+1500,layer)).resize((500,375),Image.BOX); d=ImageDraw.Draw(im)
    if ax=='v': d.line([((g-x0)/sc,(s0-y0)/sc-6),((g-x0)/sc,(s0-y0)/sc-14)],fill=(255,0,255),width=3); d.line([((g-x0)/sc,(s1-y0)/sc+6),((g-x0)/sc,(s1-y0)/sc+14)],fill=(255,0,255),width=3)
    else: d.line([((s0-x0)/sc-6,(g-y0)/sc),((s0-x0)/sc-14,(g-y0)/sc)],fill=(255,0,255),width=3); d.line([((s1-x0)/sc+6,(g-y0)/sc),((s1-x0)/sc+14,(g-y0)/sc)],fill=(255,0,255),width=3)
    ims.append(im)
  c=Image.new('RGB',(1010,395),(255,255,255)); c.paste(ims[0],(0,20)); c.paste(ims[1],(510,20))
  ImageDraw.Draw(c).text((4,4),f"#{start+n+1} {e['area'].replace('trento-','')} {e['edge']} {e['axis']} off{e['off']} max {e['max']} mean {e['mean']} dLab {e['dLab']}",fill=(0,0,0))
  cells.append(c)
cols=2; rows=(len(cells)+1)//2; S=Image.new('RGB',(cols*1020,rows*400),(255,255,255))
for k,c in enumerate(cells): S.paste(c,((k%cols)*1020,(k//cols)*400))
S.save(out)
