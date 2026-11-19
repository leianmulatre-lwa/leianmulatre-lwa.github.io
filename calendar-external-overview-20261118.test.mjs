import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const source=read('module-pages.js');
const css=read('calendar-editorial-20261116.css');

function helpers(){
 const code=source.slice(source.indexOf("  const calendarSourceLinkHtml ="),source.indexOf("  const safeOpen ="));
 const scope={console,URL,esc:value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
 vm.runInNewContext(code+'\nglobalThis.__helpers={calendarSourceLinkHtml,calendarExternalOverviewHtml};',scope,{timeout:2000});
 return scope.__helpers;
}

test('Calendar renders Google and UN external links from first-party event data',()=>{
 const {calendarSourceLinkHtml}=helpers();
 const google=calendarSourceLinkHtml({title:'Study group',meta:'Google · 6:00 PM',google:true,url:'https://calendar.google.com/calendar/event?eid=abc'});
 assert.match(google,/Source: calendar\.google\.com/);
 assert.match(google,/href="https:\/\/calendar\.google\.com\/calendar\/event\?eid=abc"/);
 assert.match(google,/Open in Google Calendar ↗/);
 assert.match(google,/target="_blank" rel="noopener noreferrer"/);
 const un=calendarSourceLinkHtml({title:'World Braille Day',meta:'UN observance · All day',un:true,url:'https://www.un.org/en/observances/braille-day'});
 assert.match(un,/Read United Nations source ↗/);
 assert.match(un,/href="https:\/\/www\.un\.org\/en\/observances\/braille-day"/);
 assert.doesNotMatch(calendarSourceLinkHtml({title:'No link',meta:'Local'}),/<a /);
});

test('Calendar external overview reports only curated sources and does not fetch pages',()=>{
 const {calendarExternalOverviewHtml}=helpers();
 const html=calendarExternalOverviewHtml([
  {title:'Google event',meta:'Google',url:'https://calendar.google.com/event/1'},
  {title:'UN day',meta:'UN',url:'https://www.un.org/en/observances/day'},
  {title:'Pop history',meta:'Source · 2001',pop:true,url:'https://writerofpop.com/article'},
  {title:'Local event',meta:'Personal'}
 ]);
 assert.match(html,/External overview/);
 assert.match(html,/calendar\.google\.com · 1/);
 assert.match(html,/un\.org · 1/);
 assert.match(html,/writerofpop\.com · 1/);
 assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g)||[]).length,3);
 assert.doesNotMatch(html,/<iframe|\bfetch\s*\(|Generated summary|AI summary/i);
});

test('Calendar read-only renderer uses the external link and overview helpers',()=>{
 assert.match(source,/readOnlyRows\.filter\(e=>!e\.pop\)\.map\(e=>'[^\n]*calendarSourceLinkHtml\(e\)/);
 assert.match(source,/\+calendarExternalOverviewHtml\(readOnlyRows\)\+/);
 assert.doesNotMatch(source,/readOnlyRows\.filter\(e=>!e\.pop\)[\s\S]{0,400}e\.pop\?'<small>/);
 assert.match(css,/\.calendar-external-overview/);
 assert.match(css,/\.calendar-external-list a/);
});
