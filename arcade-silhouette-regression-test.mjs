import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=name=>readFileSync(new URL('./'+name,import.meta.url),'utf8');
const css=get('arcade-silhouette-corrected-20261017.css');
const shell=get('index.html');
const baseline=get('arcade-veve-refine-20261016.css');
const game=get('module-pages.js');
assert.ok(shell.includes('/arcade-silhouette-corrected-20261017.css?v=20261017-compact-shell-1'),
  'Latest Studio Arcade silhouette stylesheet must load');
assert.ok(shell.indexOf('arcade-silhouette-corrected-20261017.css')>
  shell.indexOf('arcade-playability-20261016.css'), 'New silhouette must override old Arcade layout');
assert.ok(css.includes('#studioApp #games .games-library.games-library'),
  'Fix is attached to Studio cabinet, not only the full Games module');
assert.ok(css.includes('--arcade-outline:polygon(')&&css.includes('88% 50%'),
  'Broad shoulders and base narrow to an hourglass waist');
assert.ok(css.includes('aspect-ratio:0.86!important')&&css.includes('max-height:425px!important'),
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
console.log('PASS compact hourglass Arcade Studio cabinet, uncut viewport, integrated joysticks, full-page matching shape');
