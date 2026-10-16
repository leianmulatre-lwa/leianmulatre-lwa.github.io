import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('./writing-collections.js',import.meta.url),'utf8');
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const moduleCode=readFileSync(new URL('./module-pages.js',import.meta.url),'utf8');
const css=readFileSync(new URL('./writing-collections.css',import.meta.url),'utf8');

assert.match(html,/writing-collections\.js\?v=/);
assert.match(html,/writing-collections\.css\?v=/);
assert.ok(html.indexOf('/writing-collections.js?v=')<html.indexOf('/module-pages.js?v='),'Collections load before module pages');
assert.match(moduleCode,/BigLWAWritingCollections\.mount/);
assert.match(moduleCode,/collection\?\.saveCurrent\(\)/);
assert.match(css,/grid-template-columns:minmax\(176px,230px\)/);

class Element {
 constructor(tag){
  this.tag=tag;this.children=[];this.dataset={};this.attributes={};
  this.listeners={};this.value='';this.textContent='';this.className='';
  this.classList={add(){},remove(){}};
 }
 append(...nodes){for(const node of nodes){node.parentNode=this;this.children.push(node)}}
 insertBefore(node,reference){
  const i=this.children.indexOf(reference);
  if(i<0)throw Error('Invalid reference node');
  node.parentNode=this;this.children.splice(i,0,node);
 }
 replaceChildren(...nodes){this.children=[];this.append(...nodes)}
 setAttribute(k,v){this.attributes[k]=v}
 getAttribute(k){return this.attributes[k]}
 addEventListener(t,f){(this.listeners[t]??=[]).push(f)}
 fire(t,event={}){for(const f of this.listeners[t]||[])f(event)}
 focus(){this.focused=true}
 querySelector(s){if(s==='.module-actions')return this.children.find(x=>x.className==='module-actions')||null;return null}
 closest(s){if(s==='button[data-entry-id]'&&this.dataset.entryId)return this;return null}
}
const store=new Map([['biglwaDraft_notes','Original draft from old Sqwib'],['biglwaDraft_diary','Old journal entry']]);
const storage={
 getItem(k){return store.has(k)?store.get(k):null},
 setItem(k,v){store.set(k,String(v))},
 removeItem(k){store.delete(k)}
};
const events=[];
const window={__biglwaIdentity:{uid:'alice'},confirm(){return true}};
const document={createElement(tag){return new Element(tag)},dispatchEvent(event){events.push(event)}};
const ctx=vm.createContext({window,document,localStorage:storage,CustomEvent:class{constructor(type,opt){this.type=type;this.detail=opt.detail}},Date,Math});
vm.runInContext(source,ctx,{filename:'writing-collections.js'});
function formWithArea(){
 const parent=new Element('section'),form=new Element('form'),area=new Element('textarea'),actions=new Element('div'),status=new Element('p');
 actions.className='module-actions';form.append(area,actions);parent.append(form);
 return {parent,form,area,status};
}
const n=formWithArea();
const notes=window.BigLWAWritingCollections.mount({kind:'notes',...n});
assert.equal(n.area.value,'Original draft from old Sqwib','Migrate original draft');
assert.equal(notes.count(),1);
const sidebar=n.parent.children[0];
assert.equal(sidebar.tag,'aside');
const head=sidebar.children[0],newButton=head.children[1];
newButton.fire('click');
assert.equal(notes.count(),2);
assert.equal(n.area.value,'');
n.area.value='A second private note';
notes.saveCurrent();
assert.equal(storage.getItem('biglwaDraft_notes'),'A second private note','Studio mirror uses the selected entry');
let saved=JSON.parse(storage.getItem('biglwaWritingCollectionV1:alice:notes'));
assert.equal(saved.entries.length,2);
assert.ok(saved.entries.every(x=>x.createdAt&&x.updatedAt));
const list=sidebar.children[2],oldButton=list.children.find(x=>x.textContent==='')||list.children.find(x=>x.dataset.entryId===saved.entries[0].id);
list.fire('click',{target:oldButton});
assert.equal(n.area.value,'Original draft from old Sqwib','Switching restores previous entry');
assert.equal(storage.getItem('biglwaDraft_notes'),'Original draft from old Sqwib');
const remove=n.form.children.find(x=>x.className==='writing-collection-remove');
remove.fire('click');
assert.equal(notes.count(),1,'Remove only selected entry');
assert.equal(store.has('biglwaDraft_notes'),true,'Never delete original draft key');

const j=formWithArea();
const journal=window.BigLWAWritingCollections.mount({kind:'diary',...j});
assert.equal(j.area.value,'Old journal entry');
j.parent.children[0].children[0].children[1].fire('click');
assert.equal(journal.count(),2);
j.area.value='New dated journal page';
journal.saveCurrent();
const journalEntries=JSON.parse(storage.getItem('biglwaWritingCollectionV1:alice:diary')).entries;
assert.equal(journalEntries[1].content,'New dated journal page');
assert.ok(j.form.children.find(x=>x.className==='writing-collection-dateline')?.textContent.includes('Journal page'));

window.__biglwaIdentity.uid='bob';
const other=formWithArea();
const otherNotes=window.BigLWAWritingCollections.mount({kind:'notes',...other});
assert.equal(otherNotes.count(),1);
assert.equal(other.area.value,'','Different signed-in user must not inherit Alice’s draft');
assert.ok(events.some(e=>e.type==='biglwa:writing-saved'));
console.log('Writing collections: migration, new notes, dates, selection, deletion, journal pages, account isolation PASS');
