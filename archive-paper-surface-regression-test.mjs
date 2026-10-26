import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('./module-pages.js',import.meta.url),'utf8');
const index=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const at=page.indexOf('/* Archive — one coherent opaque paper shelf');
assert.ok(at>=0,'Archive has a single, final unified surface treatment');
const prefix=page.slice(0,at);
const styleStart=prefix.lastIndexOf('style.textContent += ');
assert.ok(styleStart>=0,'Archive polish is in the actual module CSS loaded by the site');
const token=page.slice(styleStart+'style.textContent += '.length);
const match=token.match(/^("(?:\\.|[^"\\])*");\s*\n\s*document\.head\.appendChild\(style\)/);
assert.ok(match,'Archive styles append at the end of all existing module styles');
const css=JSON.parse(match[1]);
const rule=sel=>{
 const index=css.indexOf(sel);
 assert.ok(index>=0,'Missing Archive selector: '+sel);
 return css.slice(css.indexOf('{',index)+1,css.indexOf('}',index));
};
const root='#studioApp #moduleWorkspace[data-module-key="archive"] ';
assert.match(rule(root+'.archive-wall-shell'),/background:#faf6ef!important/,'Parent shelf has ONE opaque paper background');
assert.match(rule(root+'.archive-wall-shell'),/padding:16px 17px 18px!important/,'Toolbar and sections share one interior gutter');
assert.match(rule(root+'.archive-app-compartment'),/background:transparent!important/,'Platform groups cannot overlay translucent paper');
assert.match(rule(root+'.archive-app-compartment'),/border:1px solid #ded4ca!important/,'Every platform uses the same thin border');
assert.match(rule(root+'.archive-app-compartment>.archive-group-head'),/box-shadow:inset 3px 0 0 var\(--archive-section-accent\)/,'Source color remains only a slim accent');
assert.match(rule(root+'.archive-app-compartment>.instagram-archive-grid'),/background:transparent!important/,'Expanded rows continue the same surface');
for(const [platform,rim] of [['facebook','#1658be'],['instagram','#f36b21'],['pinterest','#e60023'],['tiktok','#772dcc']]){
 assert.match(rule(root+'.archive-app-compartment[data-archive-app="'+platform+'"]'),new RegExp(rim),'Source color retained for '+platform);
}
assert.ok(index.includes('module-pages.js?v='),'Archive rendering is delivered by live Studio loader');
assert.match(page,/class="archive-source-group"/,'Source grouping retained');
assert.match(page,/class="archive-app-compartment"/,'Native details accordion retained');
assert.match(page,/data-archive-live-input/,'Live controls remain present');
assert.match(page,/data-archive-source-filter/,'Archive source filters preserved');
assert.match(page,/archive-carousel-actions/,'Archive carousel controls preserved');
console.log('PASS Archive: one opaque shared paper, consistent toolbar/accordion spacing, source accent lines, unchanged stored-card interactions.');
