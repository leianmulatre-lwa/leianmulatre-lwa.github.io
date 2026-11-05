import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL('./'+path, import.meta.url), 'utf8');
const index = read('index.html');
const css = read('retro-browser-frames-20261029.css');
assert(index.includes('retro-browser-frames-20261029.css?v=20261029-old-web-1'),'Browser frames loaded into canonical Studio patch');
assert(index.includes('studio-cabinet-thumbnails-20261026.css'),'Original cabinet CSS kept as non-destructive fallback');
assert(index.includes('studio-lwazi-thumbnail-20261026.js'),'Lwazi real carousel loader kept');
for(const name of ['games','lwazi']){
 const xml=read('assets/frames/retro-browser-'+name+'-20261029.svg');
 assert(xml.includes('viewBox="0 0 1000 720"'),name+' retains responsive aspect ratio');
 assert(xml.includes('Alpha-transparent viewport') || xml.includes('Real alpha-transparent viewport'),name+' declares clear content opening');
 assert(!/<rect[^>]*width="1000"[^>]*height="720"/.test(xml),name+' does not paint over the content opening');
 assert(css.includes('retro-browser-'+name+'-20261029.svg'),name+' border asset actually used');
}
for(const v of ['left:3.4%!important','top:19.03%!important','width:91.2%!important','height:71.39%!important']){
 assert(css.includes(v),'Both live viewports align to transparent cutouts: '+v);
}
assert(css.includes('pointer-events:none!important'),'Decorative SVG never intercepts clicks');
assert(css.includes('pointer-events:auto!important'),'Actual carousel tiles retain interactions');
assert(css.includes('.lwazi-cabinet-open')&&css.includes('top:92.9%!important'),'Lwazi open hitbox stays outside carousel');
assert(css.includes('#studioApp #games.studio-header-only .games-library'),'Games minimizes without phantom space');
assert(css.includes('#studioApp #tools.studio-header-only .lwazi-cabinet-thumb'),'Lwazi minimizes without phantom space');
assert(read('studio-lwazi-thumbnail-20261026.js').includes('openBIGLWAModule'),'Lwazi still uses the live app router');
console.log('PASS: retro browser frames are transparent, responsive and keep Games / Lwazi interactive');
