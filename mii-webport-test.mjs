// Big LWA: source-level Mii webport and Arcade integration regression.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');
const editor=read('avatar/mii-editor.html');
const studio=read('avatar-studio.js');
const arcade=read('arcade-puzzles.html');
const quest=read('avatar/arcade-character.js');
const modules=read('module-pages.js');
const veve=read('veve.js');
const htmlScript=src=>{
  const match=src.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match,'Expected inline JavaScript');
  return match[1];
};
assert.doesNotThrow(()=>new Script(htmlScript(editor)),'Character editor JS parses');
assert.doesNotThrow(()=>new Script(htmlScript(arcade)),'Arcade JS parses');
assert.doesNotThrow(()=>new Script(studio),'Studio avatar bridge JS parses');
assert.doesNotThrow(()=>new Script(quest),'Character game JS parses');
assert.ok(existsSync(new URL('./MiiEditor/classicGUI.swf',import.meta.url)),'Keep legacy Adobe AIR Mii archive');
const tests=[
 ['Original uploaded Adobe AIR SWF preserved',existsSync(new URL('./MiiEditor/classicGUI.swf',import.meta.url))],
 ['Original editor mounted through Ruffle',editor.includes('/MiiEditor/classicGUI.swf')&&editor.includes('RufflePlayer.newest')&&editor.includes('ruffle.js')],
 ['No misleading browser-native Mii format claims',editor.includes('AIR-only')&&editor.includes('may not work')],
 ['Studio embeds original Mii editor',studio.includes('<iframe id="biglwaMiiEditorFrame"')&&studio.includes('20261016-mii-opt-in')],
 ['PNG image import remains available',studio.includes('Import Mii image')&&studio.includes('data-avatar-kind="mii"')],
 ['Account avatar upload still authenticated',studio.includes('getIdToken')&&studio.includes('studioAvatar:')],
 ['Previously saved avatars can still restore',studio.includes('sendSavedMiiToFrame()')&&studio.includes('Saved avatar restored')],
 ['Only active puzzle tabs exposed',!arcade.includes('data-tab="quest"')&&arcade.includes('data-tab="2048"')&&arcade.includes('data-tab="crossword"')],
 ['Arcade account character',quest.includes(".data()?.studioAvatar")&&quest.includes('playing as')],
 ['Quest accessible controls',quest.includes("grid.addEventListener('touchstart'")&&quest.includes("document.addEventListener('keydown'")&&arcade.includes('role="grid"')],
 ['Arcade directory and Veve linked',modules.includes('biglwa:arcade-request-game')&&veve.includes('biglwa:arcade-request-game')&&!veve.includes("id:'quest'")],
 ['Artwork',existsSync(new URL('./assets/arcade/character-quest.svg',import.meta.url))]
];
for(const [label,ok] of tests)console.log((ok?'PASS':'FAIL')+' · '+label);
assert.ok(tests.every(([,ok])=>ok),'Original Mii / Arcade integration checks failed.');
// Ensure each hand-authored Quest map allows reaching every collectible and exit.
const match=quest.match(/const levels=(\[[\s\S]*?\]);\s*const rows=/);
assert.ok(match,'Quest map definitions not found');
const levels=runInNewContext(match[1]);
for(const [index,level] of levels.entries()){
 const walls=new Set(level.walls),seen=new Set([0]),todo=[0];
 for(let p=0;p<todo.length;p++){
   const pos=todo[p],x=pos%7,y=Math.floor(pos/7);
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
     const a=x+dx,b=y+dy,k=b*7+a;
     if(a<0||b<0||a>6||b>6||walls.has(k)||seen.has(k))continue;
     seen.add(k);todo.push(k);
   }
 }
 for(const target of [...level.stars,level.exit])
   assert.ok(seen.has(target),'Quest level '+(index+1)+' has unreachable star or exit '+target);
}
console.log('PASS · All three Quest maps have reachable stars and exits.');
