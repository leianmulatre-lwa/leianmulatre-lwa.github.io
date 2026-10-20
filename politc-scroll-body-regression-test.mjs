import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const pages=read('module-pages.js'),body=read('studio-three-bodies-20261019.js'),
      scroll=read('section-scroll-assistant-20261020.js'),home=read('index.html');
for(const [name,value] of [['module pages',pages],['three-body widgets',body],['scroll assistant',scroll]])
 assert.doesNotThrow(()=>new Script(value),name+' must parse');
assert.ok(pages.includes("const openedKey=key"),'Module opening tracks destination for automatic scroll');
assert.ok(pages.includes("if(workspace.hidden||activeModuleKey!==openedKey)return"),'Do not jump to closed or replaced widgets');
assert.ok(pages.includes("target.getBoundingClientRect().top+window.scrollY-88"),'Widget scroll lands just beneath header');
assert.ok(pages.includes("reduced?'instant':'smooth'"),'Module scroll respects reduced motion');
assert.ok(!pages.includes("window.scrollTo({top:0,behavior:'instant'})"),'Remove top-of-Studio reset');
assert.ok(body.includes('margin:3px 0 6px;padding:5px 8px'),'Three-body key fits snugly between toolbar and grid');
assert.ok(body.includes('box-shadow:4px 5px 0 color-mix('),'Every three-body card has category-color shadow');
assert.ok(body.includes('box-shadow:6px 8px 0 var(--three-body-color'),'Widget hover shadow uses model color');
for(const key of ['individual','social','political'])
 assert.ok(body.includes('data-body-model="'+key+'"'),'Category '+key+' is styled');
assert.ok(scroll.includes("window.addEventListener('scroll',schedule,{passive:true})"),'Scroll assistant observes but never intercepts wheel/touch');
assert.ok(scroll.includes("window.matchMedia?.('(prefers-reduced-motion: reduce)')"),'Assistant respects reduced motion');
assert.ok(scroll.includes("next.setAttribute('aria-label','Next heading')"),'Next heading shortcut has an accessible name');
assert.ok(scroll.includes('if(label.textContent!==text)label.textContent=text;'),'Scroll assistant avoids self-triggered render loops');
assert.ok(home.includes('section-scroll-assistant-20261020.js?v='),'Studio loads scrolling assistant');
for(const path of ['privacy/index.html','about/index.html','data-deletion/index.html','settings/index.html'])
 assert.ok(read(path).includes('/section-scroll-assistant-20261020.js?v='),path+' loads the same accessible assistant');
assert.ok(pages.includes("image.loading='eager'"),'Curated Wikimedia portraits preload even before insertion');
assert.ok(pages.includes("const fallback=cache.get(host.dataset.politcWiki)"),'Old broken image links retry exact Wikipedia title');
assert.ok(pages.includes("data-politc-wiki"),'Curated people use exact named image sources only');
assert.ok(pages.includes("input name=\"photo\" type=\"file\" accept=\"image/*\""),'New nominees may upload their own photos');
assert.ok(pages.includes('politc-poster-monogram'),'Initials remain safe if a photo is missing');
assert.ok(pages.includes("biglwaPolitcNominationsV2:'+ownerUid"),'Private nominations are scoped to Firebase UID');
assert.ok(!pages.includes("const storageKey='biglwaPolitcNominationsV1'"),'Unscoped nomination collection is not reused');
console.log('PASS widget scroll anchors, accessible legal section navigation, compact three-body shadows, owner-scoped user photos and automatic curated Wikimedia portrait fallback');
