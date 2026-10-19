// Arcade regression checks: an embedded website can refuse frames.
// Every game opens inside the cabinet first; an original site can still forbid framing.
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
 ['game tiles attempt in-screen game', arcade.includes('data-play-external') && arcade.includes('playGame(gameLibrary[Number(target.dataset.playExternal)])')],
 ['third-party game opens link launcher', arcade.includes('const showGameLinks=game=>')],
 ['thumbnail and provider are displayed', arcade.includes('arcade-game-cover') && arcade.includes('providerName(uri)')],
 ['formerly blocked hosts now receive an iframe attempt', arcade.includes('restrictsEmbed=uri=>') && arcade.includes('coolmathgames') && arcade.includes('nytimes') && !arcade.includes("|| restrictsEmbed(uri))return showGameLinks")],
 ['restricted hosts retain a fallback menu', arcade.includes("makeAction('Local games','arcadeLocal'") && arcade.includes("if(!steam&&!blocked) actions.append") && arcade.includes("showGameLinks=game=>")],
 ['all HTTPS games attempt the cabinet before showing links', arcade.includes('const playGame=game=>') && arcade.includes("target.protocol==='https:'") && arcade.includes('tryEmbedded();') && !arcade.includes("if(target.hostname!=='store.steampowered.com'")],
 ['iframe uses original game URL with a compact mode for own puzzles', arcade.includes('frame.src=framed.href') && arcade.includes("framed.searchParams.set('embed','1')") && !arcade.includes('frame.src=proxy')],
 ['provider restrictions are not bypassed', !arcade.includes("uri.protocol!=='https:' || restrictsEmbed(uri)") && arcade.includes('providerName(uri)')],
 ['in-cabinet web view offers browser controls', arcade.includes("makeAction('Reload view','arcadeReload'") && arcade.includes("createOpenLink(uri,'Open original ↗'") && arcade.includes("if(target.matches('[data-arcade-reload]'))")],
 ['full directory uses keyboard-accessible details and summary', arcade.includes('<details id="arcadeDirectoryDetails"><summary class="arcade-directory-toggle">') && arcade.includes('</div></details></section>')],
 ['full directory begins collapsed by default', !arcade.includes('<details id="arcadeDirectoryDetails" open') && !arcade.includes('<details open id="arcadeDirectoryDetails"')],
 ['directory game buttons play inside the cabinet', arcade.includes('data-directory-play>Play in screen') && arcade.includes('()=>playGame(gameLibrary[Number(button.closest(')],

 ['arcade never opens popups', !arcade.includes('window.open(') && !arcade.includes('arcadePopup')],
 ['external references open separately while local games stay in studio', arcade.includes("link.target=uri.origin===location.origin?'_self':'_blank'")],
 ['links remain visible inside the cabinet', arcade.includes('arcade-game-quicklinks')],
 ['game preview can be restored', arcade.includes("if(target.matches('[data-arcade-preview]')){if(selectedGame)showGameLinks(selectedGame)")],
 ['quit restores animated carousel', arcade.includes('emulatorScreen.innerHTML=previewMarkup')],
 ['media loads from same site', arcade.includes("cover.src=game.image")],
 ['updated script version used', shell.includes('module-pages.js?v=')]
];
let failed=0;
for (const [name,ok] of cases){
 console.log((ok?'PASS':'FAIL')+' '+name);
 if(!ok)failed++;
}
assert.equal(failed,0,failed+' arcade regressions');
console.log(cases.length+' checks passed');
