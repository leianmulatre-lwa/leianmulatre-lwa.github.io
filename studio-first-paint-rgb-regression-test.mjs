import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
assert.ok(html.includes('login-archive-player.js?v=20261022-floating-laptop-2'),'Fresh login player asset loaded');
assert.ok(html.includes('studio-loading-dots-20261021.js?v=20261026-stitched-loading-2'),'Fresh nonduplicating widget-loader asset loaded');
assert.ok(dots.includes('biglwa-stitched-cubes-loader.avif'),'Loading modules use uploaded stitched-cubes logo');
console.log('PASS one lowercase dot-floating startup, uploaded stitched logo, no competing pseudo-curtains, laptop preload and delayed playback');
