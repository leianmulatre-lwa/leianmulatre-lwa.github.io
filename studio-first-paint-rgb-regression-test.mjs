import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const player=readFileSync(new URL('./login-archive-player.js',import.meta.url),'utf8');
const dots=readFileSync(new URL('./studio-loading-dots-20261021.js',import.meta.url),'utf8');
const first=html.match(/<style id="biglwa-first-paint">([\s\S]*?)<\/style>/)?.[1]||'';
const protectedPart=html.slice(html.indexOf("const startupSafety="),html.indexOf("html=html.replace('</head>',startupSafety"));
const previewHtml=html.slice(html.indexOf('const loginLaptop='),html.indexOf('const loginLaptopCss='));
const previewCss=html.slice(html.indexOf('const loginLaptopCss='),html.indexOf('const loginBackdropCss='));
assert.ok(first && protectedPart && previewHtml && previewCss,'All startup and laptop pieces are present');
assert.ok(first.includes('#biglwaStartupScreen')&&first.includes('.dot-floating'),'Loader present on first paint');
assert.ok(protectedPart.includes('html.biglwa-startup-protected #biglwaStartupScreen'),'Protected stage reuses the same loader');
assert.ok(protectedPart.includes('const startupMarkup=')&&protectedPart.includes('html.replace(/<body'),'Protected stage inserts only one startup screen element');
assert.ok(!first.includes('body::before')&&!first.includes('body::after')&&!first.includes('html::after'),'Previous stacked CSS pseudo-screens removed');
assert.ok(!protectedPart.includes('html.biglwa-startup-protected body::before')&&!protectedPart.includes('html.biglwa-startup-protected body::after'),'Protected duplicate pseudo curtain removed');
assert.ok(html.includes('<div id="biglwaStartupScreen" role="status" aria-live="polite">')&&protectedPart.includes('biglwa · loading your studio'),'Both startup DOM screens use lowercase heading');
assert.ok(!first.includes('OPENING YOUR STUDIO'),'No uppercase startup heading');
assert.ok(first.includes('font-family:"CS Bergamot Stitched"')||first.includes('"CS Bergamot Stitched"'));
for(const key of ['@keyframes dot-floating{','@keyframes dot-floating-before{','@keyframes dot-floating-after{']){
 assert.ok(first.includes(key),'Source floating animation '+key);
 assert.ok(protectedPart.includes(key),'Source floating animation persists after HTML rewrite '+key);
}
for(const color of ['#f36b79','#f2cd39','#58aa70']){
 assert.ok(first.includes(color)&&protectedPart.includes(color),'RGB identity preserved '+color);
}
assert.ok(first.includes('3s infinite cubic-bezier(.15,.6,.9,.1)'),'Floating motion matches Three Dots timing');
assert.ok(first.includes('prefers-reduced-motion'),'Reduced motion preference respected');
assert.ok(previewHtml.includes('login-laptop is-preparing')&&previewHtml.includes('login-screen-loading'),'Laptop shows matching loader before playing');
assert.ok(!/<video id=\\"loginArchiveVideo\\" autoplay/.test(previewHtml),'Laptop does not autoplay behind loading preview');
assert.ok(previewCss.includes('login-screen-loading')&&previewCss.includes('login-laptop.is-preparing .login-laptop-copy'),'Programming and headline do not overlap loader');
assert.ok(player.includes('const INTRO_MS = 2600;')&&player.includes('1800')&&player.includes('beginIfVisible'),'Preview waits for visible login before programming');
assert.ok(player.includes("video.addEventListener('playing', revealWhenReady)"),'Programming reveal waits for playable content');
assert.ok(!dots.includes('decorateLegacyStudioLoading();'),'Widget module cannot inject a second startup animation');
assert.ok(html.includes('login-archive-player.js?v=20261116-authentic-symbols-v4'),'Current login player asset loaded with the authentic November Studio preview');
assert.ok(html.includes('studio-loading-dots-20261021.js?v=20261026-curtain-sync-7'),'Fresh nonduplicating widget-loader asset loaded');
assert.ok(dots.includes('lwa-curtain-brand-b')&&dots.includes('lwa-curtain-brand-w'),'Loading modules restore the original stitched text wordmark');
assert.ok(!dots.includes('biglwa-stitched-cubes-loader.avif'),'No stitched block image on module loader');
assert.ok(!html.includes('<img class="biglwa-startup-logo"'),'No block image on initial loading screen');
console.log('PASS one lowercase dot-floating startup, restored stitched wordmark, no competing pseudo-curtains, laptop preload and delayed playback');

// The startup curtain must survive auth and the first stable paint; never
// vanish as soon as a Studio or login node is merely mounted.
assert(html.includes('biglwa:initial-route-ready'),'Initial auth routing participates in loader readiness');
assert(html.includes("document.readyState==='loading'"),'Loader waits for DOM parsing, not slow unrelated assets');
assert(html.includes('Date.now()-quietSince<280'),'Loader waits for layout mutations to settle');
assert(html.includes('biglwa:startup-revealed'),'Startup publishes a single reveal event');
assert(!html.includes('window.setTimeout(finish,8000)'),'Old eight-second premature dismissal is removed');
assert(!html.includes('id="biglwa-startup-reveal"'),'Old stylesheet can no longer forcibly hide the startup curtain');
assert(html.includes('still connecting your studio…')&&html.includes('Reload Studio'),'A stalled startup exposes an explicit retry rather than prematurely displaying broken widgets');
const studio=readFileSync(new URL('./studio/index.html',import.meta.url),'utf8');
const deployedAssets=['module-pages.js','pinterest-orbit.js','pinterest-red-consistency-20261016.css','stream-guide.js','stream-guide.css','studio-myfeed-filmstrip-20261029.css','studio-trophy-versions-symbol-bounds-20261029.css'];
for(const asset of deployedAssets){
 const prefix=asset+'?v=';
 const version=text=>{const start=text.indexOf(prefix);return start<0?'':text.slice(start+prefix.length).split("'")[0]};
 const one=version(html),two=version(studio);
 assert(one&&two&&one===two,'Root and /studio must use the exact same '+asset+' build');
}

// Parse the actual inline boot script exactly where the HTML parser closes
// it. A literal closing script tag inside a string is a fatal HTML error,
// even if the intended full JavaScript text would otherwise be valid.
for(const entry of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
 const source=readFileSync(new URL('./'+entry,import.meta.url),'utf8');
 const match=source.match(/<script>\s*(\(async\(\)=>\{try\{[\s\S]*?)<\/script>/i);
 assert(match,entry+' contains executable bootstrap');
 assert.doesNotThrow(()=>new Script(match[1]),entry+' browser-delimited bootstrap parses');
 assert(source.slice(match.index+match[0].length).trim()==='</body></html>',entry+' bootstrap script is not cut off by generated markup');
 assert(source.includes('privacy-consent-20261123.js?v=4'),entry+' loads current privacy UI');
 assert(source.includes('biglwa:initial-route-ready'),entry+' retains auth route gate');
 assert(source.includes("Date.now()-started<3500"),entry+' bounds optional image waits');
 assert(source.includes("Date.now()-started<6000"),entry+' bounds incidental layout settling');
 assert(!source.includes('window.setTimeout(finish,8000)'),entry+' cannot reveal unverified private UI');
}
const consent=readFileSync(new URL('./privacy-consent-20261123.js',import.meta.url),'utf8');
assert(consent.includes("window.addEventListener('biglwa:startup-revealed',ask,{once:true})"),'Privacy prompt waits for verified startup reveal');
console.log('PASS all four browser-delimited boot scripts, auth gate, bounded optional waits, and deferred privacy prompt');
