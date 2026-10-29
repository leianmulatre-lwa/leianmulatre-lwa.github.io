/* New masthead and edge-gutter visual stability checks. No account migration. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const css=read('studio-header-gutters-20261029.css');
const nav=read('studio-tipi-navigation-20261026.js');
const marks=read('studio-tipi-navigation-20261026.css');
const index=read('index.html');
const layout=read('studio-spatial-drag-20261029.js');
const ui=read('ui-coherence.js');
assert(index.includes('studio-header-gutters-20261029.css?v=20261029-compact-1'),'New gutters stylesheet is actually loaded');
assert(index.includes('studio-tipi-navigation-20261026.js?v=20261029-uniform-archive-1'),'New masthead runtime has cache-busted URL');
assert(index.includes('studio-tipi-navigation-20261026.css?v=20261029-uniform-archive-1'),'New masthead CSS has cache-busted URL');
assert(css.includes('height:60px!important')&&css.includes('max-height:60px!important'),'Desktop masthead is limited to 60px');
assert(css.includes('height:54px!important')&&css.includes('max-height:54px!important'),'Mobile masthead is limited to 54px');
assert(css.includes('margin-left:var(--biglwa-widget-edge)!important')&&
 css.includes('margin-right:var(--biglwa-widget-edge)!important'),'Bottom widgets have equal left/right gutters');
assert(css.includes('width:calc(100% - var(--biglwa-widget-edge) * 2)!important'),'Free layout measures the reduced available width');
assert(!css.includes('padding-left:var(--biglwa-widget-edge)'),'Do not double-indent JS absolute-column positions');
assert(layout.includes('const total=Math.max(1,parent.clientWidth'),'Spatial layout still computes from parent width');
assert(ui.includes('header.offsetHeight||header.getBoundingClientRect().height'),'Sidebar anchor follows fixed header height');
assert(marks.includes('.biglwa-topbar-current')&&marks.includes('.biglwa-module-tipi')&&marks.includes('.biglwa-topbar-crest'),'Three separate layers for home/module/hover');
assert(marks.includes('width:52px!important')&&marks.includes('height:52px!important'),'All module marks share image-square dimensions');
assert(marks.includes('biglwa-brand-in-module:is(:hover,:focus-visible) .biglwa-module-tipi'),'Tipi only appears on module hover/focus');
assert(nav.includes('brand.dataset.biglwaActiveModule=key'),'Page icon tracks live module key');
assert(nav.includes("if(back)back.click()"),'Click returns via existing module Back button');
assert(!nav.includes('brand.querySelectorAll(\'.biglwa-topbar-current\').forEach(node=>node.remove())'),'Module marks are preserved rather than forcibly deleted');
console.log('PASS compact top bar, symmetric widget edges, fixed masthead optical square, module hover and home return');
