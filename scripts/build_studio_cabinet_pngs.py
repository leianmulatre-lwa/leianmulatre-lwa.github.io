"""Produce TWO separate transparent, tightly cropped PNG cabinet borders from
the approved two-panel artwork already held by BIG LWA. No Studio carousel markup
is overwritten by this asset build. """
from collections import deque
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/arcade/studio-cabinet-pair-20261026.avif'
OUT=ROOT/'assets/arcade'

def cutout(half: Image.Image) -> Image.Image:
    src=half.convert('RGB')
    w,h=src.size
    pixels=src.load()
    visited=bytearray(w*h)
    q=deque()
    def enqueue(x,y):
        idx=y*w+x
        if visited[idx]:return
        r,g,b=pixels[x,y]
        if max(r,g,b)>28 or r+g+b>70:return
        visited[idx]=1;q.append((x,y))
    for x in range(w):enqueue(x,0);enqueue(x,h-1)
    for y in range(h):enqueue(0,y);enqueue(w-1,y)
    while q:
        x,y=q.popleft()
        for dx,dy in ((0,1),(0,-1),(1,0),(-1,0)):
            nx=x+dx;ny=y+dy
            if 0<=nx<w and 0<=ny<h:enqueue(nx,ny)
    alpha=Image.new('L',(w,h),255)
    a=alpha.load()
    for idx,done in enumerate(visited):
        if done:a[idx%w,idx//w]=0
    rgba=src.convert('RGBA')
    rgba.putalpha(alpha)
    box=alpha.getbbox()
    if not box:raise ValueError('No cabinet art found')
    pad=4
    box=(max(0,box[0]-pad),max(0,box[1]-pad),min(w,box[2]+pad),min(h,box[3]+pad))
    return rgba.crop(box)

def main():
    with Image.open(SOURCE) as im:
        im.load()
        w,h=im.size
        assert w>=2 and h>200
        for name,crop in [
            ('studio-games-cabinet-20261026.png',(0,0,w//2,h)),
            ('studio-lwazi-cabinet-20261026.png',(w//2,0,w,h))
        ]:
            result=cutout(im.crop(crop))
            path=OUT/name
            result.save(path,format='PNG',optimize=True,compress_level=9)
            print(path.relative_to(ROOT),result.size,path.stat().st_size,'bytes')
if __name__=='__main__':main()
