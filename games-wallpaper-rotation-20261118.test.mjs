import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';

const root=new URL('.',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const names=[
 '098fd5e1084e9f1d04223dcaa42387b9.jpg',
 '3unsgny5oup81.jpg',
 '860645.png',
 'ce4cuf5c0pp51.png',
 'games bg.jpg',
 'gta-homepage-icon.avif',
 'playstation_background_by_wintendo558_dhfen5k-fullview.jpg',
 'xbox-360-nxe-wallpapers-ai-upscaled-v0-aavwiqz5oup81.jpg'
];
const rotator=read('games-wallpaper-rotation-20261118.js');
const legacy=read('build-cloudflare-pages.mjs');
const active=read('scripts/performance/build-public-site.mjs');

test('Games rotates the exact original repository folder assets, not arbitrary remote artwork',()=>{
 const found=readdirSync(new URL('./games%20bg/',root)).filter(name=>/\.(?:png|jpe?g|avif)$/i.test(name));
 assert.deepEqual(found.sort(),[...names].sort());
 for(const name of names){
  assert(rotator.includes("'"+name+"'"),'Missing wallpaper in rotator: '+name);
  assert(existsSync(new URL('./games%20bg/'+encodeURIComponent(name),root)));
 }
 assert.match(rotator,/const PATH='\/games%20bg\/'/);
 assert.doesNotMatch(rotator,/raw\.githubusercontent|classic-wallpaper|https?:\/\//i);
 assert.match(rotator,/wii\?'cover,contain':'cover,cover'/);
});

test('Both public packaging paths keep the actual Games folder',()=>{
 assert.match(legacy,/'games bg'/);
 assert.match(legacy,/'\.avif'/);
 for(const name of names) {
  assert(active.includes("'games bg/"+name+"'"),'Active Pages builder must verify '+name);
  assert(legacy.includes("'games bg/"+name+"'"),'Legacy builder must verify '+name);
 }
});

test('Both Studio HTML entry points load the same cache-busted Games folder rotator',()=>{
 for(const path of ['index.html','studio/index.html']){
  assert.match(read(path),/\/games-wallpaper-rotation-20261118\.js\?v=20261118-folder-images-2/);
 }
});
