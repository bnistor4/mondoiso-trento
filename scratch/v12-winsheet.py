# usage: v12-winsheet.py <out.png> <i_j> ... : per window: art (export z8) | render around the window (+-448 px), window box marked
import sys, json, numpy as np
from PIL import Image, ImageDraw
exec(open('scratch/v12-z8.py').read().split("if __name__")[0])
out=sys.argv[1]; ws=sys.argv[2:]; cells=[]
for w in ws:
  i,j=map(int,w.split('_')); x0,y0=i*896-448,j*896-448; x1,y1=x0+1920,y0+1920
  ims=[]
  for L in ('map','photo'):
    im=Image.fromarray(z8(x0,y0,x1,y1,L)).resize((480,480),Image.BOX); d=ImageDraw.Draw(im); d.rectangle([112,112,368,368],outline=(255,0,255)); ims.append(im)
  c=Image.new('RGB',(970,500),(255,255,255)); c.paste(ims[0],(0,20)); c.paste(ims[1],(490,20)); ImageDraw.Draw(c).text((4,4),w,fill=(0,0,0)); cells.append(c)
S=Image.new('RGB',(2*980,((len(cells)+1)//2)*505),(255,255,255))
for k,c in enumerate(cells): S.paste(c,((k%2)*980,(k//2)*505))
S.save(out)
