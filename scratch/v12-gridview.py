# usage: v12-gridview.py x0 y0 x1 y1 out.png [width=1000] : assembled-art crop (last area wins) with window grid lines (i*896) labelled
import sys, numpy as np
from PIL import Image, ImageDraw
src=open('scratch/v12-detail.py').read(); A16=open('/tmp/all16').read().strip().split(','); D='data/derived'
import os; exec("def tilecrop"+src.split("def tilecrop")[1].split("def field")[0])
x0,y0,x1,y1=map(int,sys.argv[1:5]); out=sys.argv[5]; Wd=int(sys.argv[6]) if len(sys.argv)>6 else 1000
a=tilecrop('paint',x0,y0,x1-x0,y1-y0); s=Wd/(x1-x0); im=Image.fromarray(a).resize((Wd,int((y1-y0)*s)),Image.LANCZOS); d=ImageDraw.Draw(im)
for i in range(x0//896,x1//896+2):
  X=(i*896-x0)*s; d.line([(X,0),(X,im.size[1])],fill=(255,0,0)); d.text((X+2,2),f'i{i}',fill=(255,0,0))
for j in range(y0//896,y1//896+2):
  Y=(j*896-y0)*s; d.line([(0,Y),(Wd,Y)],fill=(0,0,255)); d.text((2,Y+2),f'j{j}',fill=(0,0,255))
im.save(out)
