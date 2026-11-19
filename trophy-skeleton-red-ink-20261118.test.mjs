import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];
const ink='studio-symbol-header-ink-20261118.css';

test('Trophies has one canonical widget identity in all Studio shells',()=>{
  for(const shell of shells){
    const html=read(shell);
    assert.match(html,/<article class="card trophies-card" id="trophies" data-widget-id="trophies" data-widget-route="trophies"/,shell);
    assert(html.includes('/'+ink+'?v=20261118-symbol-header-ink-1'),shell+' loads the unique ink build');
    assert.equal((html.match(/<article[^>]* id="trophies"/g)||[]).length,1,shell+' has one trophy card');
  }
  assert(existsSync(new URL('./'+ink,import.meta.url)),ink+' exists as a first-party file');
});

test('Trophies is restored to the left red widget dock and Skeleton Key',()=>{
  const ui=read('ui-coherence.js'),tour=read('studio-onboarding.js');
  const fallback=ui.match(/const SIDEBAR_ROUTE_FALLBACKS=\[([\s\S]*?)\n  \];/)?.[1]||'';
  assert.equal((fallback.match(/\['trophies','Trophies','♛'\]/g)||[]).length,1,'One red-dock fallback, no duplicate');
  assert.match(tour,/\{label:'Trophies',key:'trophies'/);
  assert.match(ui,/fullWidgetRoutes=new Set\(\[[^\]]*'trophies'/);
});

test('Symbols and widget headers follow black day and white night ink',()=>{
  const css=read(ink);
  assert.match(css,/unique build 20261118-symbol-header-ink-1/);
  assert.match(css,/#studioApp \.card :is\(\.card-head h1,\.card-head h2,\.card-head h3[^}]*color:#171514!important/);
  assert.match(css,/body\.night-mode #studioApp \.card :is\(\.card-head h1,\.card-head h2,\.card-head h3[^}]*color:#fff!important/);
  assert.match(css,/filter:brightness\(0\)!important/);
  assert.match(css,/body\.night-mode[^{]+\{filter:brightness\(0\) invert\(1\)!important\}/);
});

test('Profile number stats keep Alarm Clock digits and gain a scoreboard frame',()=>{
  const css=read(ink);
  assert.match(css,/font-family:"Alarm Clock","AlarmClock","alarm clock",monospace!important/);
  assert.match(css,/font-variant-numeric:tabular-nums lining-nums!important/);
  assert.match(css,/border:1px solid rgba\(62,50,45,\.18\)!important/);
  for(const shell of shells)assert.match(read(shell),/profile-stats-row-20261116\.css\?v=20261116-roles-stats-row-v2/,shell+' keeps the established stat layout');
});
