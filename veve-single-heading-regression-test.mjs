import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const js=read('veve.js'),css=read('veve.css'),modules=read('module-pages.js');
const index=read('index.html');
assert.ok(modules.includes("body.innerHTML=heading('veve')+"),'The Studio router owns Veve heading and subtitle');
assert.ok(js.includes('hasRouteHeading')&&js.includes("hasRouteHeading?'':'<div class=\"veve-intro\""),
  'Embedded Veve hides its duplicate intro while standalone Veve can retain it');
assert.ok(css.includes('.module-workspace[data-module-key="veve"] .module-heading{display:grid!important}'),
  'The route title is no longer hidden by old Veve CSS');
assert.ok(css.includes('#biglwaVeve .veve-top{justify-content:flex-end!important'),
  'Sort, show and customize align under the authoritative title');
assert.ok(index.includes('/veve.js?v=20261027-lwazi-interest-sensitivity-1'),
  'Browser requests the refreshed script');
assert.ok(index.includes('/veve.css?v=20261023-orbit-colors-7-single-header-3'),
  'Browser requests the refreshed styling');
console.log('PASS one Veve heading, toolbar retained, source assets versioned');