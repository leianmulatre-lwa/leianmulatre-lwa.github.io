/* Original BIG LWA social-share art. Copyright © 2026 BIG LWA.
   Uses only Node's built-in zlib/fs; no downloaded artwork, fonts or packages.
   Deterministic 1200×630 PNG, reproducible in GitHub Pages and Cloudflare builds. */
import {deflateSync} from 'node:zlib';
import {writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
const W=1200,H=630,rgba=Buffer.alloc(W*H*4);
const colors={cream:[251,236,206],red:[115,8,26],wine:[79,0,16],gold:[202,149,64],ivory:[255,248,225],yellow:[249,197,64],coral:[242,92,94],green:[62,154,84],blue:[91,100,216],pink:[222,93,188]};
const rgb=s=>Array.isArray(s)?s:colors[s];
function dot(x,y,c){x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return;const p=(y*W+x)*4;const v=rgb(c);rgba[p]=v[0];rgba[p+1]=v[1];rgba[p+2]=v[2];rgba[p+3]=255}
function rect(x,y,w,h,c){for(let yy=Math.max(0,y|0);yy<Math.min(H,(y+h)|0);yy++)for(let xx=Math.max(0,x|0);xx<Math.min(W,(x+w)|0);xx++)dot(xx,yy,c)}
function disk(cx,cy,r,c){for(let y=Math.max(0,cy-r|0);y<Math.min(H,cy+r+1);y++)for(let x=Math.max(0,cx-r|0);x<Math.min(W,cx+r+1);x++)if((x-cx)**2+(y-cy)**2<=r*r)dot(x,y,c)}
function line(x1,y1,x2,y2,w,c){const dx=x2-x1,dy=y2-y1,steps=Math.max(Math.abs(dx),Math.abs(dy));for(let i=0;i<=steps;i++){const x=x1+dx*i/steps,y=y1+dy*i/steps;rect(x-w/2,y-w/2,w,w,c)}}
function star(cx,cy,r,c){for(let i=-r;i<=r;i++){line(cx-r+Math.abs(i),cy+i,cx+r-Math.abs(i),cy+i,1,c);line(cx+i,cy-r+Math.abs(i),cx+i,cy+r-Math.abs(i),1,c)}}
const FONT={
A:['01110','10001','10001','11111','10001','10001','10001'],
B:['11110','10001','10001','11110','10001','10001','11110'],
C:['01111','10000','10000','10000','10000','10000','01111'],
D:['11110','10001','10001','10001','10001','10001','11110'],
E:['11111','10000','10000','11110','10000','10000','11111'],
F:['11111','10000','10000','11110','10000','10000','10000'],
G:['01111','10000','10000','10111','10001','10001','01111'],
H:['10001','10001','10001','11111','10001','10001','10001'],
I:['11111','00100','00100','00100','00100','00100','11111'],
J:['00111','00010','00010','00010','10010','10010','01100'],
K:['10001','10010','10100','11000','10100','10010','10001'],
L:['10000','10000','10000','10000','10000','10000','11111'],
M:['10001','11011','10101','10101','10001','10001','10001'],
N:['10001','11001','10101','10011','10001','10001','10001'],
O:['01110','10001','10001','10001','10001','10001','01110'],
P:['11110','10001','10001','11110','10000','10000','10000'],
Q:['01110','10001','10001','10001','10101','10010','01101'],
R:['11110','10001','10001','11110','10100','10010','10001'],
S:['01111','10000','10000','01110','00001','00001','11110'],
T:['11111','00100','00100','00100','00100','00100','00100'],
U:['10001','10001','10001','10001','10001','10001','01110'],
V:['10001','10001','10001','10001','10001','01010','00100'],
W:['10001','10001','10001','10101','10101','10101','01010'],
X:['10001','10001','01010','00100','01010','10001','10001'],
Y:['10001','10001','01010','00100','00100','00100','00100'],
Z:['11111','00001','00010','00100','01000','10000','11111'],
' ':['00000','00000','00000','00000','00000','00000','00000'],
'.':['00000','00000','00000','00000','00000','01100','01100'],
'·':['00000','00000','00000','01100','00000','00000','00000']
};
function ink(text,x,y,scale,color){for(const ch of text.toUpperCase()){const rows=FONT[ch]||FONT[' '];rows.forEach((row,i)=>[...row].forEach((v,j)=>{if(v==='1')rect(x+j*scale,y+i*scale,scale-1,scale-1,color)}));x+=6*scale}}
function centered(text,y,scale,c){ink(text,(W-(text.length*6-1)*scale)/2,y,scale,c)}
function build(){
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const grain=((x*13+y*19)%47===1)?-6:0;dot(x,y,[Math.max(0,251-Math.floor(y*.018)+grain),Math.max(0,236-Math.floor(y*.023)+grain),Math.max(0,206-Math.floor(y*.028)+grain)])}
// Art-deco stepped frame, created for BIG LWA.
rect(36,26,1128,5,'gold');rect(36,600,1128,5,'gold');rect(36,26,5,578,'gold');rect(1159,26,5,578,'gold');
for(const side of [0,1]){const x=side?1120:0;rect(x,0,80,630,'wine');for(let i=0;i<7;i++)rect(x+(i*11),0,4,630,i%2?'wine':'red')}
for(let x=0;x<W;x++){const curve=64+Math.floor(26*Math.cos((x-W/2)/W*Math.PI*3));for(let y=0;y<curve;y++)dot(x,y,(x%33<4)?'wine':'red');dot(x,curve,'gold');dot(x,curve+1,'gold')}
for(let x=0;x<W;x+=14){let edge=64+Math.floor(26*Math.cos((x-W/2)/W*Math.PI*3));rect(x,edge+2,2,9,'gold')}
line(170,125,1030,125,4,'red');line(190,134,1010,134,2,'gold');
for(const [x,c] of [[554,'coral'],[600,'yellow'],[646,'green']]){disk(x,171,17,'wine');disk(x,171,13,c)}
star(146,306,21,'red');star(1054,306,21,'red');star(157,445,11,'red');star(1043,445,11,'red');
// One iridescent shadow behind the giant stitched-style block title.
const title='BIG LWA',scale=24,tx=(W-(title.length*6-1)*scale)/2,ty=224;
for(const [dx,dy,c] of [[21,18,'blue'],[16,14,'pink'],[11,10,'green'],[6,6,'yellow']])ink(title,tx+dx,ty+dy,scale,c);
ink(title,tx+2,ty+2,scale,'gold');ink(title,tx,ty,scale,'wine');
line(210,426,990,426,3,'gold');
centered('A BIGGER YOU. A BRIGHTER WORLD.',453,5,'wine');
rect(257,514,686,68,'gold');rect(262,518,676,60,'wine');
centered('CREATE · CONNECT · DISCOVER',537,5,'ivory');
for(const cx of [150,1050]){line(cx-34,548,cx+34,548,3,'red');star(cx,548,12,'gold')}
}
function crc32(bytes){let c=0xffffffff;for(const n of bytes){c^=n;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function chunk(type,data){const label=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([label,data])));return Buffer.concat([len,label,data,crc])}
export function generateOgImage(path){
build();const scan=Buffer.alloc(H*(W*4+1));
for(let y=0;y<H;y++)rgba.copy(scan,y*(W*4+1)+1,y*W*4,(y+1)*W*4);
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(scan,{level:9})),chunk('IEND',Buffer.alloc(0))]);
mkdirSync(dirname(path),{recursive:true});writeFileSync(path,png);return png.length;
}
if(process.argv[1]?.endsWith('build-og-image.mjs')){const path=process.argv[2]||'assets/brand/og-biglwa.png';console.log('BIG LWA OG 1200×630 PNG:',generateOgImage(path),'bytes')}
