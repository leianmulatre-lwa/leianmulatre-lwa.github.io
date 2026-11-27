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
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html'])assert.equal((read(path).match(/&portaltiles=20261126-7/g)||[]).length,2);
 assert.match(read('index.html'),/biglwa-pwa\.js\?v=5/);
});