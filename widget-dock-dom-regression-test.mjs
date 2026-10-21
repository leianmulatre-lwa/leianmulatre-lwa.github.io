import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';
const src=readFileSync(new URL('./ui-coherence.js',import.meta.url),'utf8');
const a=src.indexOf('  const PINNED_WIDGET_GROUPS=');
const b=src.indexOf('  function syncPrimaryWidgetDock(app){',a);
assert.ok(a>0&&b>a,'Real widget-dock renderer must be present');
class Element{
 constructor(tag='div'){this.tagName=tag.toLowerCase();this.className='';this.id='';this.dataset={};this.hidden=false;this.children=[];this.attributes={};this._innerHTML='';this.textContent='';this.parentElement=null;}
 append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node)}}
 appendChild(node){this.append(node);return node}
 replaceChildren(...nodes){this.children=[];this.append(...nodes)}
 setAttribute(name,value){this.attributes[name]=value}
 getAttribute(name){return this.attributes[name]}
 set innerHTML(html){this._innerHTML=String(html)}
 get innerHTML(){return this._innerHTML}
}
const app=new Element('main'),green=new Element(),yellow=new Element(),primary=new Element(),pins=new Element();
const byId={'#studioSidebarGreenPins':green,'#studioSidebarYellowPins':yellow,'#studioSidebarPrimary':primary,'#studioSidebarPinned':pins};
const isClass=(el,name)=>el.className.split(/\s+/).includes(name);
const descend=(root,check)=>{
 for(const item of root.children){if(check(item))return item;const nested=descend(item,check);if(nested)return nested}
 return null;
};
const $=(sel,root=app)=>{
 if(sel in byId)return byId[sel];
 if(/^\[data-widget-id=/.test(sel))return null;
 if(sel.startsWith('#'))return null;
 if(sel.startsWith('.'))return descend(root,item=>isClass(item,sel.slice(1)));
 if(sel==='button')return descend(root,item=>item.tagName==='button');
 return null;
};
const context=createContext({
 document:{createElement:tag=>new Element(tag)},
 CSS:{escape:value=>String(value)},
 $,
 scopedLayout:()=>null,
 addWidgetSwapControl:()=>{},
 widgetIconMarkup:widget=>widget?.icon||'',
 console
});
new Script(src.slice(a,b)+'\nthis.renderPinnedWidgetDock=renderPinnedWidgetDock;',{
 filename:'ui-coherence.js:pinnedDock'
}).runInContext(context);
const render=context.renderPinnedWidgetDock;
render(app);
assert.equal(green.children.length,3,'Green widget dock must not be empty for a new account');
assert.equal(yellow.children.length,2,'Yellow pinned widgets must not disappear without docked records');
for(const [dock,expected] of [[green,['aura','music','guest-check']],[yellow,['politc','tools']]]){
 assert.deepEqual(dock.children.map(el=>el.dataset.pinnedWidget),expected);
 for(const row of dock.children){
  const button=$('button',row),mark=$('.sidebar-route-icon',row),name=$('.sidebar-widget-name',row);
  assert.ok(button,'Each pinned row has an actionable widget button');
  assert.equal(button.dataset.sidebarWidget,row.dataset.pinnedWidget,'Button opens its actual widget');
  assert.ok(mark?.innerHTML,'Every widget has a real fallback symbol before hydration');
  assert.ok(name?.textContent,'Every widget has an identifying name');
  assert.equal(button.getAttribute('aria-label'),'Open '+name.textContent+' widget');
 }
}
render(app);
assert.equal(green.children.length,3,'Rehydration must not duplicate green widgets');
assert.equal(yellow.children.length,2,'Rehydration must not duplicate yellow widgets');
assert.ok(src.includes("const minimized=Array.isArray(scoped?.docked)?scoped.docked:readWidgetShortcuts()"),'Signed-in account scoped red-dock source');
assert.ok(src.includes("controls.innerHTML=\`<button class=\"window-light green\""),'Three-dot window control is canonical');
assert.ok(src.includes("data-dock-widget"),'Red control stores its widget into the sidebar');
assert.ok(src.includes("targetDock.appendChild(shortcutButtonMarkup(widget))"),'Red-docked widgets render restore rows');
assert.ok(src.includes("ensureControls();\n    ensureWidgetActions();\n    syncPrimaryWidgetDock(app);"),'Remote saved dock rebuilds rows instead of only toggling visibility');
assert.ok(src.includes("primary.hidden=false"),'No-docked account cannot hide the green pinned section');
assert.ok(!src.includes("shortcutDock.replaceChildren(...shortcuts.map"),'Left dock cannot become a duplicate site navigation list');
console.log('PASS: empty-account left dock renders five working pinned widget buttons, holds consistent labels/icons, survives rehydration, and red docking remains tied to 3-dot controls');
