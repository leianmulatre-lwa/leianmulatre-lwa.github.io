"""Cut genuinely transparent carousel openings in the approved full-HD cabinets.
Source PNGs are the original dated uploads, copied byte-for-byte to assets/arcade.
Only their SCREEN INTERIORS are cleared; frame, controls and branding stay HD.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/arcade'
CABINETS=[
 ('studio-games-cabinet-hd-20261026.png','studio-games-cabinet-open-20261026.png',(119,372,1002,937),34),
 ('studio-lwazi-cabinet-hd-20261026.png','studio-lwazi-cabinet-open-20261026.png',(132,342,989,920),32)
]
def open_screen(source, destination, bounds, radius):
    original=Image.open(source).convert('RGBA')
    assert original.size==(1122,1402),f'Unexpected original HD cabinet size: {source} {original.size}'
    factor=3
    mask=Image.new('L',(original.width*factor,original.height*factor))
    paint=ImageDraw.Draw(mask)
    paint.rounded_rectangle(tuple(v*factor for v in bounds),radius=radius*factor,fill=255)
    mask=mask.resize(original.size,Image.Resampling.LANCZOS)
    original.putalpha(ImageChops.subtract(original.getchannel('A'),mask))
    assert original.getpixel((550,650))[3]==0,f'Screen is not transparent: {destination}'
    assert original.getpixel((550,210))[3]>200,f'Cabinet art vanished: {destination}'
    original.save(destination,'PNG',optimize=True)
    print(f'{destination.relative_to(ROOT)}: {original.size}, transparent live screen')
def main():
    for src,dst,bounds,radius in CABINETS:
        open_screen(ASSETS/src,ASSETS/dst,bounds,radius)
if __name__=='__main__':main()
