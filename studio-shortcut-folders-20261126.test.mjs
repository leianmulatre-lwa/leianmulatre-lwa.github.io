import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const ui=read('ui-coherence.js');
test('original shortcut drag and intentional grouping are published together with account storage',()=>{
 for(const path of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const html=read(path);
  assert.match(html,/ui-coherence\.js\?[^"']+&shortcutfolders=20261126-2/,path);
  assert.match(html,/account-storage-policy\.js[^\n]+&shortcutfolders=20261126-2/,path);
 }
 assert.match(read('account-storage-policy.js'),/biglwaShortcutFoldersV1/);
 assert.match(ui,/cue\.textContent='📁 Drop to group'/);
 assert.match(ui,/document\.body\.append\(cue\)\},600\)/);
 assert.match(ui,/else moveNavigationShortcut\(bar\.closest\('#studioApp'\),key,true,dest\)/);
 assert.match(ui,/group\.slice\(0,4\)/);
 assert.match(ui,/shortcutsReadOnly\(\)\?\['Close'\]:\['Ungroup','Close'\]/);
 assert.match(ui,/localStorage\.setItem\(folderKey,JSON\.stringify\(groups\)\)/);
 assert.match(ui,/app\.draggable=false/);
 assert.match(ui,/lostpointercapture/);
 assert.match(ui,/data-shortcut-drag-handle/);
});

test('installed iOS reads saved folders but cannot edit shortcut order or membership',()=>{
 assert.match(ui,/function shortcutsReadOnly\(\)/);
 assert.match(ui,/if\(persist&&shortcutsReadOnly\(\)\)return readNavigationShortcuts/);
 assert.match(ui,/function canArrange\(\)\{return canReadFolders\(\)&&!shortcutsReadOnly\(\)\}/);
 assert.match(ui,/function readFolders\(\)\{\s*if\(!canReadFolders\(\)\)return \[\]/);
 assert.match(ui,/if\(shortcutsReadOnly\(\)\|\|!navigationCatalog.has\(key\)\)return false/);
 assert.match(ui,/if\(!handle\|\|shortcutsReadOnly\(\)\)return/);
});
