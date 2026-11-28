import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const read=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const pages=read('module-pages.js');
const google=read('google-orbit.js');
const loader=read('studio-loading-dots-20261021.js');
const keyCss=read('source-shadow-key-20261025.css');
const keyJs=read('source-shadow-key-20261025.js');
const orbitCss=read('orbit-space-20261114.css');
const preview=read('orbit-preview-eight-20261016.js');
const root=read('index.html');
const studio=read('studio/index.html');
const notFound=read('404.html');
const liveStudio=read('live-studio-shell.html');
const routeGuard=read('politc-route-guard.js');
const workerConfigTest=read('scripts/oauth-worker-config.test.mjs');
const audit=read('scripts/performance/audit.mjs');

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
  // The day-mode skin has a more specific !important background, so this
  // override must come after it and include an equally specific selector.
  const daySkin=orbitCss.indexOf('body:not(.night-mode) #studioApp #orbit #orbitGrid>button[data-orbit-app]{\n background:rgba(255,252,254,.68)!important');
  const sourceOverride=orbitCss.indexOf('#studioApp #orbit #orbitGrid>button[data-orbit-app]{\n background:var(--orbit-source,#e6d7ff)!important');
  assert.ok(daySkin>=0&&sourceOverride>daySkin);
  assert.match(orbitCss,/body:not\(\.night-mode\) #studioApp #orbit #orbitGrid>button\[data-orbit-app\],[\s\S]{0,500}background:var\(--orbit-source,#e6d7ff\)!important/);
  assert.match(orbitCss,/module-orbit-row\[data-orbit-row\]>\.module-actions>\.orbit-platform-badge,[\s\S]{0,500}background:var\(--orbit-source,#d9c6ee\)!important/);
});

test('DeviantArt is available as a saved public profile in Orbit',()=>{
  assert.match(pages,/\["deviantart","DeviantArt","#45ad47","#8bd48d"\]/);
  assert.match(pages,/\['deviantart','DA','DeviantArt','#45ad47'\]/);
  assert.match(pages,/<option value="deviantart">DeviantArt<\/option>/);
  assert.match(preview,/\['deviantart','DA','DeviantArt'\]/);
  assert.match(preview,/deviantart:\['deviantart\.com','www\.deviantart\.com'\]/);
});

test('Google requests only read-only YouTube and Calendar; Drive stays a public link',()=>{
  assert.doesNotMatch(google,/drive\.metadata\.readonly/);
  assert.match(google,/auth\/youtube\.readonly[\s\S]{0,120}auth\/calendar\.readonly/);
  assert.doesNotMatch(google,/state\.drive|api\/drive\/v3/);
  assert.match(pages,/new Set\(\['instagram','tiktok','pinterest','facebook','youtube','calendar'\]\)/);
  assert.match(pages,/for\(const id of \['youtube','calendar'\]\)/);
  assert.match(pages,/\['drive','GD','Google Drive','#e7be31'\]/);
  for(const shell of [root,studio,notFound,liveStudio]){
    assert.match(shell,/google-orbit\.js\?v=[^"']*googlelite=20261127-1/, 'Google helper is cache-busted in '+shell);
  }
});

test('shell cache keys bust every edited Orbit asset in every shell and self-loader',()=>{
  for(const shell of [root,studio,notFound,liveStudio]){
    assert.ok(!/orbitex=20261127-1/.test(shell));
    assert.match(shell,/orbitex=20261127-3/);
  }
  assert.equal((root.match(/orbitpolish=20261127-2/g)||[]).length,5);
  assert.equal((studio.match(/orbitpolish=20261127-2/g)||[]).length,5);
  assert.match(pages,/orbitex=20261127-3&orbitpolish=20261127-2/);
  assert.match(routeGuard,/orbitex=20261127-3/);
  assert.match(workerConfigTest,/const key='orbitex=20261127-3';/);
});

test('performance budgets include the current WLA shell references',()=>{
  assert.match(audit,/landingJsRefs:119,landingCssRefs:96/);
  assert.match(audit,/landingJsRawBytes:2900000,landingCssRawBytes:1040000/);
  assert.match(audit,/studioJsRefs:118,studioCssRefs:95/);
  assert.match(audit,/studioJsRawBytes:2900000,studioCssRawBytes:1040000/);
});
