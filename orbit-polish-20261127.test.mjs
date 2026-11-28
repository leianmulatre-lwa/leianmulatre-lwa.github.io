import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const read=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const pages=read('module-pages.js');
const loader=read('studio-loading-dots-20261021.js');
const keyCss=read('source-shadow-key-20261025.css');
const keyJs=read('source-shadow-key-20261025.js');
const orbitCss=read('orbit-space-20261114.css');
const preview=read('orbit-preview-eight-20261016.js');
const root=read('index.html');
const studio=read('studio/index.html');

test('repeated Manage clicks cannot stack duplicate Orbit provider buttons',()=>{
  assert.match(pages,/function openConnectionsPopup\(\)\{[\s\S]{0,400}data-biglwa-popup="connections"/);
  assert.match(pages,/for\(const stale of document\.querySelectorAll\('\[data-biglwa-popup="connections"\]'\)\)stale\.remove\(\);/);
});

test('the loading curtain has a hard reveal deadline',()=>{
  assert.match(loader,/const stalled=Date\.now\(\)-moduleStarted>=6500;/);
  assert.match(loader,/\|\|stalled\);/);
});

test('Orbit shadow-key text is right aligned without moving the panel',()=>{
  assert.doesNotMatch(keyCss,/justify-content:center/);
  assert.match(keyCss,/#studioApp \.module-heading \.module-shadow-key\{justify-content:flex-end\}/);
  assert.match(keyCss,/\.module-heading-right \.module-shadow-key\{[\s\S]{0,120}justify-content:flex-end/);
  assert.match(keyCss,/module-shadow-key\{justify-content:flex-end\}/);
  assert.match(keyCss,/grid-template-areas:"title shadow" "meta meta"/);
});

test('Orbit box faces use the shared shadow-key source colors',()=>{
  assert.match(keyJs,/\['deviantart','DeviantArt','#45ad47'\]/);
  assert.match(orbitCss,/data-orbit-app="instagram"[\s\S]{0,160}--orbit-source:#f36b21/);
  assert.match(orbitCss,/data-orbit-app="deviantart"[\s\S]{0,160}--orbit-source:#45ad47/);
  assert.match(orbitCss,/background:var\(--orbit-source,#e6d7ff\)!important/);
  assert.match(orbitCss,/\.orbit-platform-badge\{\s*background:var\(--orbit-source,#d9c6ee\)!important/);
});

test('DeviantArt is available as a saved public profile in Orbit',()=>{
  assert.match(pages,/\["deviantart","DeviantArt","#45ad47","#8bd48d"\]/);
  assert.match(pages,/\['deviantart','DA','DeviantArt','#45ad47'\]/);
  assert.match(pages,/<option value="deviantart">DeviantArt<\/option>/);
  assert.match(preview,/\['deviantart','DA','DeviantArt'\]/);
  assert.match(preview,/deviantart:\['deviantart\.com','www\.deviantart\.com'\]/);
});

test('shell cache keys bust every edited Orbit asset on root and Studio',()=>{
  for(const shell of [root,studio]){
    assert.equal((shell.match(/orbitex=20261127-2/g)||[]).length,1);
    assert.equal((shell.match(/orbitex=20261127-1/g)||[]).length,3);
    assert.equal((shell.match(/orbitpolish=20261127-1/g)||[]).length,5);
  }
  assert.match(pages,/orbitex=20261127-2&orbitpolish=20261127-1/);
});
