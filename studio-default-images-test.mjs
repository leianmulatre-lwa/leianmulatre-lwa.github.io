import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const index=read('index.html'),code=read('studio-default-images-20261029.js'),map=read('map-app.html');
for(const ext of ['js','css'])assert(index.includes('studio-default-images-20261029.'+ext+'?v=20261029-uploaded-defaults-1'),'Studio loads defaults '+ext);
const images={
 'archive-windows-hill.webp':'archive',
 'visualizr-stick-animation.webp':'visualizr',
 'map-bikini-bottom-fallback.webp':'map',
 'trophy-achievement-made.webp':'trophy'
};
for(const [file,type]of Object.entries(images)){
 assert(statSync(new URL('./assets/studio-defaults/'+file,import.meta.url)).size>2000, file+' is a real uploaded image');
 assert(code.includes(file),type+' image is referenced');
}
assert(code.includes('biglwa:map-ready'),'Map fallback listens to genuine ready signal');
assert(code.includes('biglwa:map-failed'),'Map fallback listens to genuine failure signal');
assert(code.includes('event.source!==frame.contentWindow'),'Map signals must match their iframe source');
assert(map.includes('type:\'biglwa:map-ready\''),'Map confirms it is interactive');
assert(map.includes('type:\'biglwa:map-failed\''),'Map communicates failure');
assert(code.includes('state.ready)return'),'Working map cannot be covered by timeout fallback');
assert(code.includes('slot.dataset.biglwaDefault20261029'),'Archive default avoids repeated image replacement');
console.log('PASS four uploaded Studio images and working-only Map fallback');
