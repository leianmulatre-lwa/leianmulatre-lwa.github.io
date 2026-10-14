// Arcade regression checks: an embedded website can refuse frames.
// Ensure our screen renders an internal launcher rather than a blocked iframe by default.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const pages = readFileSync(new URL('./module-pages.js', import.meta.url), 'utf8');
const shell = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const start = pages.indexOf('  function renderGames(){');
const end = pages.indexOf('  const dykQuestions=[',start);
assert.ok(start > 0 && end > start, 'renderGames exists');
const arcade = pages.slice(start,end);

const cases=[
 ['one shared cabinet screen', (arcade.match(/id="arcadeScreen"/g)||[]).length===1],
 ['no second game cabinet', !arcade.includes('id="arcadeEmulator"')],
 ['no ARCADE wordmark image reappears', !arcade.includes('arcade-wordmark-transparent.png')],
 ['culture quiz available inside screen', arcade.includes('emulatorScreen.append(culturePanel)')],
 ['game tiles select from catalogue', arcade.includes('data-play-external') && arcade.includes('showGameLinks(gameLibrary[Number(target.dataset.playExternal)])')],
 ['third-party game opens link launcher', arcade.includes('const showGameLinks=game=>')],
 ['thumbnail and provider are displayed', arcade.includes('arcade-game-cover') && arcade.includes('providerName(uri)')],
 ['blocked hosts are recognized', arcade.includes('restrictsEmbed=uri=>') && arcade.includes('coolmathgames') && arcade.includes('nytimes') && arcade.includes('chess')],
 ['no automatic iframe for a blocked provider', arcade.includes("if(!blocked && !steam) actions.append(makeAction('Try in this screen'") && arcade.includes('if(uri.protocol!==\'https:\' || restrictsEmbed(uri))return showGameLinks(selectedGame)')],
 ['popout opens from click event', arcade.includes('const popOutGame=()=>') && arcade.includes("if(target.matches('[data-arcade-popup]')){popOutGame()")],
 ['new tab fallback is safe', arcade.includes("link.target='_blank'") && arcade.includes("link.rel='noopener noreferrer'")],
 ['links remain visible inside the cabinet', arcade.includes('arcade-game-quicklinks')],
 ['game preview can be restored', arcade.includes("if(target.matches('[data-arcade-preview]')){if(selectedGame)showGameLinks(selectedGame)")],
 ['quit restores animated carousel', arcade.includes('emulatorScreen.innerHTML=previewMarkup')],
 ['media loads from same site', arcade.includes("cover.src=game.image")],
 ['updated script version used', shell.includes('module-pages.js?v=20261013-safe-game-launcher-2')]
];
let failed=0;
for (const [name,ok] of cases){
 console.log((ok?'PASS':'FAIL')+' '+name);
 if(!ok)failed++;
}
assert.equal(failed,0,failed+' arcade regressions');
console.log(cases.length+' checks passed');
