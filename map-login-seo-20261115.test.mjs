import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const js=read('map-purposes-20261115.js'),css=read('map-purposes-20261115.css');
class Element {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.className='';this.id='';this.dataset={};this.attributes={};this.children=[];this.parentNode=null;this.events={};this.hidden=false;this._text='';}
 set textContent(x){this._text=String(x);this.children=[]}
 get textContent(){return this._text+this.children.map(x=>x.textContent).join('')}
 append(...nodes){for(const node of nodes){node.parentNode=this;this.children.push(node)}}
 prepend(node){node.parentNode=this;this.children.unshift(node)}
 replaceChildren(...nodes){this._text='';this.children=[];this.append(...nodes)}
 insertAdjacentElement(position,node){assert.equal(position,'afterend');const siblings=this.parentNode.children;const i=siblings.indexOf(this);siblings.splice(i+1,0,node);node.parentNode=this.parentNode}
 setAttribute(k,v){this.attributes[k]=String(v)}
 getAttribute(k){return this.attributes[k]??null}
 addEventListener(k,fn){this.events[k]=fn}
 click(){this.events.click?.({target:this})}
 focus(){}
 matches(selector){if(selector.startsWith('.'))return this.className.split(' ').includes(selector.slice(1));if(selector.startsWith('#'))return this.id===selector.slice(1);return false}
 querySelector(selector){return descendants(this).find(node=>node.matches(selector))||null}
 querySelectorAll(selector){return descendants(this).filter(node=>node.matches(selector))}
}
function descendants(node){return node.children.flatMap(child=>[child,...descendants(child)])}
function fixture(preview=false){
 const side=new Element('section');side.className='map-side';
 const brand=new Element('div');brand.className='map-brand-strip';side.append(brand);
 const planner=new Element('div');planner.id='mapTripPlanner';
 const events=[],tabs={};
 for(const id of ['plan','nearby','saved']){
  const b=new Element('button');b.id='mapTab'+id;b.addEventListener('click',()=>events.push(id));tabs[b.id]=b;
 }
 const doc={createElement:tag=>new Element(tag),querySelector:s=>s==='.map-side'?side:null,
  getElementById:id=>id==='mapTripPlanner'?planner:tabs[id]||null};
 const w={};w.parent=w;
 vm.runInNewContext(js,{window:w,document:doc,location:{search:preview?'?preview=1':''},URLSearchParams,URL,console});
 const rail=side.querySelector('#mapPurposeRail'),all=rail?descendants(rail):[];
 const controls=all.filter(n=>n.dataset.mapPurpose);
 const content=rail?.querySelector('#mapPurposePanel');
 return {w,rail,controls,content,events,all:()=>descendants(rail)};
}
test('Map modes use existing route, place and saved-pin interfaces',()=>{
 const f=fixture();assert(f.rail,'Map purpose rail mounts');
 assert.deepEqual(f.controls.map(x=>x.dataset.mapPurpose),['routes','places','culture','saved','music','connections']);
 for(const id of ['places','saved','routes'])f.controls.find(x=>x.dataset.mapPurpose===id).click();
 assert.deepEqual(f.events,['nearby','saved','plan']);
 assert.equal(f.controls[0].getAttribute('aria-pressed'),'true');
 assert.equal(f.content.hidden,true);
});
test('Spotify Uber Lyft buttons show accurate readiness and working Studio links',()=>{
 const f=fixture();f.controls.find(x=>x.dataset.mapPurpose==='connections').click();
 assert.equal(f.content.hidden,false);
 assert.match(f.content.textContent,/Uber/);
 assert.match(f.content.textContent,/Lyft/);
 assert.match(f.content.textContent,/Spotify/);
 assert.match(f.content.textContent,/OAuth setup required/);
 const links=f.all().filter(n=>n.tagName==='A');
 assert.equal(links.filter(n=>n.href==='/studio/orbit').length,3);
 assert(links.filter(n=>n.href.startsWith('https://')).every(n=>n.rel==='noopener noreferrer'));
 f.controls.find(x=>x.dataset.mapPurpose==='music').click();
 assert.match(f.content.textContent,/college radio by state/);
 assert(f.all().some(n=>n.tagName==='A'&&n.href==='/studio/stream'));
 assert(!/access_token|client_secret/.test(f.content.textContent));
});
test('Public profile previews never show account connect controls',()=>{
 const f=fixture(true);
 assert.equal(f.rail,null);
 assert.equal(f.w.BigLWAMapPurposes,undefined);
});
test('Map assets load once, below the existing real transport planner',()=>{
 const map=read('map-app.html');
 assert.equal(map.split('/map-purposes-20261115.js?v=').length-1,1);
 assert.equal(map.split('/map-purposes-20261115.css?v=').length-1,1);
 assert(map.indexOf('map-transport-hub-20261114.js')<map.indexOf('map-purposes-20261115.js'));
 assert(!/\bfetch\s*\(/.test(js));
 assert.match(css,/\.map-purpose-connections/);
});
test('Login shows public Studio mock after video controls; no personal account content',()=>{
 const source=read('login-archive-player.js');
 for(const token of ['login-studio-desktop','login-mini-aura','login-mini-feed','login-mini-stream','login-mini-map','login-mini-orbit','login-mini-tunes'])
  assert(source.includes(token),token);
 assert.match(source,/setCartoonWindow\('minimized'\)/);
 assert.match(source,/setCartoonWindow\('closed'\)/);
 assert.match(source,/setCartoonWindow\(laptop\.dataset\.cartoonWindow==='open'\?'minimized':'open'\)/);
 assert.match(source,/video\.pause\(\)/);
 assert.doesNotMatch(source,/localStorage\.setItem\(|access_token|refresh_token/);
});
test('Public homepage has descriptive SEO metadata, canonical and indexable discovery pages',()=>{
 const home=read('index.html'),sitemap=read('sitemap.xml');
 assert.match(home,/<meta name="twitter:title"/);
 assert.match(home,/<meta name="twitter:description"/);
 assert.match(home,/login-explore-intro/);
 assert.match(home,/Discover the platform/);
 for(const p of ['discover','online-games','fare-checker','live-shows','free-knowledge','free-tools']){
  assert(home.includes('href="/'+p+'/'),p+' visible link');
  assert(sitemap.includes('https://biglwa.com/'+p+'/'),p+' in sitemap');
 }
 assert.match(home,/<link rel="canonical" href="https:\/\/biglwa.com\/">/);
});
