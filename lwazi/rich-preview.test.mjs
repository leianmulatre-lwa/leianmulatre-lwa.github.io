import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const search=readFileSync(new URL('../user-search-results.js',import.meta.url),'utf8');
const start=search.indexOf('    function lwaziInline(raw){');
const stop=search.indexOf('\n    // Bounded, first-party conversational responses.',start);
assert(start>0&&stop>start,'Formatting and preview helpers can be extracted');
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://biglwa.com/'});
const doc=dom.window.document;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plainSnippet=s=>String(s).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const formatters=new Function('document','esc','plainSnippet',search.slice(start,stop)+';return {renderAnswer,renderLwaziPhotoPreview}')(doc,esc,plainSnippet);

test('Lwazi formats Markdown bold, italic, numbered and unordered lists without exposing asterisks',()=>{
 const host=doc.createElement('div');
 formatters.renderAnswer(host,'Try **bold** and *italics*.\n- **First** item\n- Second item\n\n1. **Third** item');
 assert.match(host.innerHTML,/<strong>bold<\/strong>/);
 assert.match(host.innerHTML,/<em>italics<\/em>/);
 assert.match(host.innerHTML,/<ul>/);
 assert.match(host.innerHTML,/<strong>First<\/strong>/);
 assert.doesNotMatch(host.textContent,/\*\*bold\*\*/);
});
test('Markdown rendering escapes unsafe HTML and does not turn Javascript URLs into live links',()=>{
 const host=doc.createElement('div');
 formatters.renderAnswer(host,'**<script>alert(1)</script>** [bad](javascript:alert(1)) [good](https://example.org/x?q=1&z=2)');
 assert.equal(host.querySelector('script'),null);
 assert.match(host.innerHTML,/&lt;script&gt;/);
 assert.equal(host.querySelectorAll('a').length,1);
 assert.match(host.querySelector('a').href,/^https:\/\/example\.org\//);
});
test('Wiki photos render in-page, with source links and no invented ratings',()=>{
 const host=doc.createElement('div');
 formatters.renderLwaziPhotoPreview(host,'museums near Los Angeles',[
  {title:'The Broad',snippet:'An art museum in <b>California</b>.'},
  {title:'Unillustrated',snippet:'No photo'}
 ],{'The Broad':'https://upload.wikimedia.org/wikipedia/commons/a/aa/example.jpg'});
 assert.equal(host.querySelectorAll('img').length,1);
 assert.equal(host.querySelectorAll('.bl-lwazi-photo-card').length,1);
 assert.match(host.textContent,/The Broad/);
 assert.match(host.textContent,/Yelp reviews/);
 assert.match(host.textContent,/not imported into BIG LWA/);
 assert.equal(host.querySelector('a').getAttribute('target'),'_blank');
 assert.equal(host.querySelector('iframe'),null);
});
