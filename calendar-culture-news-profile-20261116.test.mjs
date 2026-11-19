import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const get=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const pop=get('pop-culture-calendar-20261114.js');
const pages=get('module-pages.js');
const css=get('calendar-editorial-20261116.css');
const profileCss=get('profile-stats-row-20261116.css');
const recovery=get('studio-recovery.js');
const shells=['index.html','studio/index.html','404.html','live-studio-shell.html'];

test('existing and additional pop culture anniversaries are dated and attributed',()=>{
 const scope={window:{}};
 vm.runInNewContext(pop,scope,{timeout:1500});
 const calendar=scope.window.BigLWAPopCultureCalendar;
 assert.equal(calendar.onDay('2026-01-20').length,6);
 assert.equal(calendar.onDay('2026-11-15').length,1);
 assert.equal(calendar.onDay('2026-11-16').length,2);
 assert.equal(calendar.onDay('2026-11-17').length,0);
 assert.equal(calendar.onDay('2026-11-20').length,0);
 const film=calendar.onDay('2026-11-16');
 assert(film.every(e=>e.pop&&e.readOnly&&e.month===11&&e.day===16));
 assert(film.some(e=>/Home Alone/.test(e.title)&&/20thcenturystudios.com/.test(e.url)));
 assert(film.some(e=>/Harry Potter/.test(e.title)&&/catalog.afi.com/.test(e.url)));
 const article=calendar.onDay('2026-11-15')[0];
 assert.equal(article.year,2006);
 assert.match(article.url,/aljazeera.com\/news\/2026\/11\/15/);
 assert(film.every(e=>e.description.length<220));
 assert(!/localStorage|sessionStorage|fetch\(/.test(pop));
});

test('calendar Events show dated cultural history separately from future/current news',()=>{
 for(const pattern of [
  /const historyRows=readOnlyRows.filter\(e=>e.pop\)/,
  /class="calendar-pop-history-shelf"/,
  /class="calendar-news-shelf"/,
  /data-calendar-pop-history="1"/,
  /Read original article/,
  /Associated Press/,
  /Reuters/,
  /Al Jazeera/,
  /readOnlyRows.filter\(e=>!e.pop\)/,
  /not a claim of political neutrality or a live news feed/
 ])assert.match(pages,pattern);
 assert.match(pages,/window.BigLWAPopCultureCalendar\?\.onDay\(key\)/);
 assert(!/\bfetch\(\s*['"]https:\/\/www\.aljazeera\.com/.test(pages),'No browser-side RSS scraping or cross-origin assumptions');
});

test('Crush Day headings use exact Politic Stars and Stripes font but body remains readable',()=>{
 const politc=get('politc-orbit-tight-20261016.css');
 assert.match(politc,/font-family:"Stars and Stripes"/);
 assert.match(css,/StarsAndStripes-A4XM\.ttf/);
 assert.match(css,/\.calendar-crushes>h2/);
 assert.match(css,/\.calendar-crushes \.politc-panel h3/);
 assert.match(css,/\.calendar-crush-chip/);
 assert.match(css,/\.calendar-crush-agenda strong/);
 assert.match(css,/font-display:swap/);
 assert(existsSync(new URL('./stars-and-stripes-font/StarsAndStripes-A4XM.ttf',import.meta.url)));
});

test('both two-week calendar previews expose the MCM, TCT and WCW day colors',()=>{
  for(const pattern of [
   /function calendarCrushOnDay\(key\)/,
   /data-calendar-crush=/,
   /class="calendar-crush-chip"/,
   /\.calendar-mini-grid span\[data-calendar-crush\]/,
   /--crush-dark-tint:#5a3045/
  ])assert.match(pages,pattern,'module preview keeps '+pattern);
  for(const pattern of [
   /const crushByDay = \{/,
   /1:\{id:'mcm',short:'MCM',title:'Man Crush Monday'\}/,
   /2:\{id:'tct',short:'TCT',title:'Tea Crush Tuesday'\}/,
   /3:\{id:'wcw',short:'WCW',title:'Woman Crush Wednesday'\}/,
   /data-calendar-crush=/,
   /class="calendar-crush-chip"/,
   /--crush-dark-tint:#5a3045/
  ])assert.match(recovery,pattern,'recovery preview keeps '+pattern);
});

test('profile statistics share the biography line, with highlights beneath',()=>{
 const layout=get('profile-stats-row-20261116.js');
 const highlight=get('profile-social-showcase.js');
 assert.match(layout,/let left=line\.querySelector\(':scope > \.biglwa-profile-bio-roles'\)/);
 assert.match(layout,/left\.prepend\(bio\)/);
 assert.match(layout,/biglwa-profile-scoreboard/);
 assert.match(layout,/board\.append\(stats\)/);
 assert.match(layout,/line\.after\(highlights\)/);
 assert.match(profileCss,/grid-template-columns:minmax\(0,1fr\) auto/);
 assert.match(profileCss,/justify-content:flex-end!important/);
 assert.match(highlight,/stats\.closest\('.biglwa-profile-role-statline'\)/);
 assert(!/setDoc|localStorage|sessionStorage/.test(layout));
});

test('all Studio shells bust cached culture, editorial CSS, previews and profile assets',()=>{
 for(const path of shells){
  const html=get(path);
  assert.match(html,/calendar-editorial-20261116\.css\?v=20261116-stars-history-news-v1/,path);
  assert.match(html,/pop-culture-calendar-20261114\.js\?v=20261116-sourced-history-v2/,path);
  assert.match(html,/profile-stats-row-20261116\.css\?v=20261116-roles-stats-row-v2&scoreboard=20261118-1/,path);
  assert.match(html,/module-pages\.js\?v=[^"']+&calendar=20261116-events-news&crushpreview=20261118-1/,path);
  assert.match(html,/studio-recovery\.js\?v=[^"']+&crush=20261118-1/,path);
 }
});
