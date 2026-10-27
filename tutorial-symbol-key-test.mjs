import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const src=read('studio-onboarding.js'),home=read('index.html');
assert.doesNotThrow(()=>new vm.Script(src));
assert.ok(home.includes('studio-onboarding.js?v=20261027-lwazi-tour-1'),
  'new visual tutorial version loads instead of cached text-only guide');
assert.ok(src.includes('"visual":"symbols"')&&src.includes('Symbol key</summary>'),'Skeleton Keys shows visual symbols both in the tutorial and inline hub');
assert.ok(!src.includes('Hanger = Projects, chess piece = Arcade'),
  'old word-only dictionary is not displayed');
assert.ok(src.includes('id="biglwaTourSymbolLegend"')&&src.includes('renderSymbolKey(legend)'));
assert.ok(src.includes('legend.hidden=step.visual!=='),'only symbol step displays visual grid');
assert.ok(src.includes('body.hidden=step.visual'),'old prose hidden on visual page');
assert.ok(src.includes('.sidebar-navigation-row[data-sidebar-route-row='),
  'guide takes actual symbols from the user-visible Big LWA sidebar');
assert.ok(src.includes('.hero-action-bar a[data-shortcut-route='),
  'guide takes current glyphs from customizable Studio shortcuts');

const start=src.indexOf(' const symbolKey=['),end=src.indexOf(' let index=0,card=null',start);
assert.ok(start>0&&end>start);
class El {
 constructor(tag){this.tagName=tag.toUpperCase();this.nodeType=1;this.children=[];this.childNodes=this.children;this.attributes={};this.textContent='';this.className='';this.hidden=false;}
 setAttribute(a,b){this.attributes[a]=b;}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children.splice(0,this.children.length,...children);}
 matches(sel){return this.tagName==='A'&&sel==='a,button';}
 querySelector(sel){return sel==='img,svg'&&this.children.find(ch=>ch.tagName==='IMG'||ch.tagName==='SVG')||null;}
 cloneNode(){const cloned=new El(this.tagName);cloned.className=this.className;cloned.textContent=this.textContent;cloned.children=this.children.map(c=>c.cloneNode(true));cloned.childNodes=cloned.children;cloned.src=this.src;return cloned;}
}
const actualSVG=new El('svg');actualSVG.className='live-projects-icon';
const liveProjects=new El('span');liveProjects.className='sidebar-route-icon';liveProjects.append(actualSVG);
const liveArchive=new El('span');liveArchive.className='sidebar-route-icon';liveArchive.textContent='▥';
const projectSel='#studioApp .sidebar-navigation-row[data-sidebar-route-row="projects"] .sidebar-route-icon';
const archiveSel='#studioApp .sidebar-navigation-row[data-sidebar-route-row="archive"] .sidebar-route-icon';
const lookup=new Map([[projectSel,liveProjects],[archiveSel,liveArchive]]);
const doc={createElement:tag=>new El(tag)};
const snippet=src.slice(start,end);
const helpers=new Function('document','$',snippet+'\nreturn {symbolKey,renderSymbolKey};')(doc,q=>lookup.get(q)||null);
assert.ok(helpers.symbolKey.length>=14,'render meaningful visual coverage of site symbols');
const keys=helpers.symbolKey.map(s=>s.key);
for(const key of ['projects','games','diary','map','orbit','connect','feed','archive','boards','notes','calendar','veve','library'])
  assert.ok(keys.includes(key),key+' has a symbol tile');
const root=new El('ul');
helpers.renderSymbolKey(root);
assert.equal(root.children.length,helpers.symbolKey.length);
const first=root.children.find(c=>c.children.at(-1)?.children?.[0]?.textContent==='Projects');
assert.ok(first,'Projects has a labeled row');
const firstMark=first.children[0].children[0];
assert.equal(firstMark.className,'sidebar-route-icon','clones real project symbol container');
assert.equal(firstMark.children[0].className,'live-projects-icon','clones real project SVG');
const archive=root.children.find(c=>c.children.at(-1)?.children?.[0]?.textContent==='Archive');
assert.equal(archive.children[0].children[0].textContent,'▥','uses live archive icon');
const feed=root.children.find(c=>c.children.at(-1)?.children?.[0]?.textContent==='myfeed');
assert.equal(feed.children[0].children[0].tagName,'IMG','uses Big LWA feed asset when that shortcut is hidden');
assert.equal(feed.children[0].children[0].src,'/assets/feed-symbol-generated.png');
for(const row of root.children)assert.equal(row.children[0].attributes['aria-hidden'],'true');
console.log('PASS · real Studio glyphs, personalized shortcut support, 12 visual legend entries and accessible labels');
