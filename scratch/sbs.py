# usage: sbs.py <area> <out> <w> <assethash> ... : input|output side by side, 400px rows
import sys
from PIL import Image, ImageDraw
A='/cursor/stores/user/grok-bot/agents/d3fc85fc-b4f0-451d-8faf-4c6678c2b9a5/assets'
a,out=sys.argv[1],sys.argv[2]; p=sys.argv[3:]; n=len(p)//2
o=Image.new('RGB',(800,400*n)); d=ImageDraw.Draw(o)
for k in range(n):
  w,h=p[2*k],p[2*k+1]
  o.paste(Image.open(f'data/derived/{a}/work/{w}/input.png').convert('RGB').resize((400,400)),(0,k*400))
  o.paste(Image.open(f'{A}/{h}.jpg').convert('RGB').resize((400,400)),(400,k*400)); d.text((4,k*400+4),w,fill='red')
o.save(out); print(o.size)
