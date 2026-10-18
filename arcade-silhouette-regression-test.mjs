import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const shell=get('index.html');
const published=shell.match(/\/(arcade-(?:silhouette-corrected|folder-unified)[a-z0-9-]*\.css)(?:\?v=[a-z0-9-]+)?/i)?.[1];
assert.ok(published,'A versioned Arcade silhouette asset must be loaded');
const css=get(published);
const baseline=get('arcade-veve-refine-20261016.css');
const game=get('module-pages.js');
assert.ok(shell.includes('/'+published),
  'Latest Studio Arcade silhouette stylesheet must load');
assert.ok(shell.indexOf(published)>
  shell.indexOf('arcade-playability-20261016.css'), 'New silhouette must override old Arcade layout');
assert.ok(css.includes('#studioApp #games .games-library.games-library'),
  'Fix is attached to Studio cabinet, not only the full Games module');
assert.ok(css.includes('--arcade-outline:inset(0 round 28px)')&&!css.includes('88% 50%'),
  'Reference cabinet uses a rounded rectangular housing');
assert.ok(css.includes('aspect-ratio:0.72!important')&&css.includes('max-height:520px!important'),
  'Studio cabinet has deliberate compact aspect ratio and maximum height');
assert.ok(css.includes('clip-path:none!important')&&css.includes('.games-library.games-library::before')&&
  css.includes('clip-path:var(--arcade-outline)!important'),
  'Only decorative shell is shaped; playable screen is never clipped');
assert.ok(css.includes('.arcade-library-viewport.arcade-library-viewport')&&
  css.includes('flex:1 1 0!important')&&css.includes('overflow:hidden!important'),
  'Game previews get stable rectangular space inside shell');
assert.ok(css.includes('.arcade-control-deck.arcade-control-deck')&&
  css.includes('.arcade-joystick.arcade-joystick > i'),
  'Joysticks and their recessed holes remain in the integrated base');
assert.ok(css.includes('.module-game-stage::before')&&
  css.includes('#studioApp #moduleWorkspace[data-module-key="games"]'),
  'Full-screen Arcade matches the Studio silhouette');
assert.ok(game.includes('id="arcadeScreen"')&&game.includes("framed.searchParams.set('embed','1')"),
  'Existing emulator/playable iframe wiring remains intact');
assert.ok(baseline.includes('#studioApp #games .games-library.games-library'),
  'This regression is guarding against the original wrong, narrow shell');
assert.ok(css.includes('--stick:#efc548')&&css.includes('--stick:#5ca975'),'Reference has yellow and green controls alongside pink');
assert.ok(css.includes('position:static!important;inset:auto!important;transform:none!important'),'Legacy absolute logo positioning is reset');
assert.ok(css.includes('inset:38% -2% 0')&&css.includes('left:10%!important;top:7%'),'Folder has a front pocket and a separate ARCADE back tab');
assert.ok(css.includes('inset:23px 0 0!important')&&css.includes('bottom:8px!important'),'Joystick sockets sit on the deck and shafts rise above it');
console.log('PASS folder Arcade Studio cabinet, uncut viewport, integrated joysticks, full-page matching shape');
