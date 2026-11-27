import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
test('native portal tile animation and resizing Aura are shipped',()=>{
 const js=read('orbit-space-20261114.js'),css=read('orbit-space-20261114.css');new vm.Script(js);
 assert.match(css,/background-repeat:repeat!important;background-position:0 0/);
 assert.match(css,/better-aether-portal\.gif/);assert.match(css,/841666uly00b1%282%29\.gif/);
 assert.match(js,/layer\.portal\.style\.setProperty\('mask-image',mask\)/);
 assert.match(js,/auraCard\.clientWidth-aura\.offsetWidth/);
 assert.match(js,/auraResize\?\.observe\(auraCard\)/);
 assert.match(js,/event\.key==='Escape'&&cursorMode/);
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html'])assert.equal((read(path).match(/&portaltiles=20261127-10/g)||[]).length,2);
 assert.match(read('index.html'),/biglwa-pwa\.js\?v=5/);
});
function gifFrames(path){
 const b=readFileSync(new URL('./'+path,import.meta.url));
 assert.match(b.subarray(0,6).toString('ascii'),/^GIF8[79]a$/,'Asset must be a genuine GIF');
 let i=13+((b[10]&128)?3*(2**((b[10]&7)+1)):0),frames=0;
 while(i<b.length){
  const x=b[i++];if(x===0x3b)return frames;
  if(x===0x21)i++;else if(x===0x2c){frames++;const packed=b[i+8];i+=9;if(packed&128)i+=3*(2**((packed&7)+1));i++}
  else throw Error('Unexpected GIF block '+x);
  while(i<b.length){const n=b[i++];if(!n)break;i+=n}
 }
 throw Error('GIF missing trailer');
}
test('both public Orbit assets contain multiple native animation frames',()=>{
 for(const path of ['assets/orbit/better-aether-portal.gif','assets/orbit/841666uly00b1(2).gif'])assert(gifFrames(path)>1,path);
 assert.match(read('scripts/performance/build-public-site.mjs'),/assets\/orbit\/better-aether-portal\.gif/);
 assert.match(read('scripts/performance/orbit-idle-art.mjs'),/v=20261127-10/);
});
