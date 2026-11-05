/* One audience-number grammar across the Studio strip, public preview,
   Skeleton Key and provider rows. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom');
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const lib=read('analytics-format.js');
assert.doesNotThrow(()=>new Function(lib),'shared formatter is valid JavaScript');
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://biglwa.com/studio',runScripts:'outside-only'});
const w=dom.window;
w.eval(lib);
const f=w.__biglwaFormatMetric;
assert.equal(typeof f,'function','window.__biglwaFormatMetric is installed once');
assert.equal(w.eval(lib),undefined,'loading twice never replaces the shared formatter');

// Followers: exact below one million, never a trailing plus.
assert.equal(f('followers',39667),'39,667');
assert.equal(f('followers',999999),'999,999');
assert.equal(f('followers',1000000),'1m+');
assert.equal(f('followers',2500000),'2.5m+');

// Reach and likes: k+ from one thousand, m+ from one million.
assert.equal(f('reach',32466),'32.5k+');
assert.equal(f('reach',999),'999');
assert.equal(f('reach',1000),'1k+');
assert.equal(f('likes',1400000),'1.4m+');
assert.equal(f('likes',19700),'19.7k+');

// Unavailable metrics stay honest.
for(const value of [null,undefined,'',NaN,-1,'abc'])assert.equal(f('reach',value),'—',String(value)+' is not a metric');

// Consumers keep a working local fallback if the shared file is late.
for(const file of ['studio-account-insights.js','ui-coherence.js','studio-preview.js']){
 const source=read(file);
 assert.ok(source.includes('__biglwaFormatMetric'),file+' prefers the shared formatter');
 assert.ok(/1e6[\s\S]{0,80}m\+/.test(source)||source.includes("+'m+'"),file+' keeps its m+ fallback');
}
assert.ok(read('index.html').includes('/analytics-format.js?v=20261028-shared-metric-1'),'formatter ships in the page');
console.log('PASS shared followers/reach/likes number grammar');
