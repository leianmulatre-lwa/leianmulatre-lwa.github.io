// Covers the Arcade running its games in an in-page emulator screen instead of
// sending the reader to a whole new site, and the Tools-page-style directory that
// keeps each game as a normal link on the side.
import { readFileSync } from "node:fs";

const pages = readFileSync(new URL("./module-pages.js", import.meta.url), "utf8");

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${extra}`); }
}

console.log("=== GAMES OPEN IN THE ARCADE, NOT A NEW SITE ===");
check("external game tiles are play buttons, not anchors", pages.includes('data-play-external="\'+index+\'"') && pages.includes('module-game-tile module-game-action" type="button"'));
check("the small print says play, not open", pages.includes('<small>play ▶</small>'));
check("no tile links straight out to the game site", !pages.includes('<small>open ↗</small>'));
check("the tile reaches its game by index", pages.includes('gameLibrary[Number(button.dataset.playExternal)]'));
check("the status line explains games run here", pages.includes("Games run right here, in the arcade screen"));

console.log("\n=== THE EMULATOR SCREEN ===");
check("a hidden player stage exists", pages.includes('id="arcadeEmulator"') && pages.includes('id="arcadeScreen"'));
check("playing drops a same-page iframe into the screen", pages.includes("emulatorScreen.replaceChildren(frame)") && pages.includes('frame.src=game.href'));
check("a chosen game is named on the marquee", pages.includes("emulatorTitle.textContent='now playing · '+game.title"));
check("fullscreen is offered on the screen, not the site", pages.includes("await emulatorScreen.requestFullscreen()") && pages.includes("await document.exitFullscreen()"));
check("closing unloads the game", pages.includes("emulatorScreen.replaceChildren();emulatorOpen.removeAttribute('href')"));
check("the fallback reminder is honest about embedding blockers", pages.includes("won't load") || pages.includes("won\u2019t load") || /won['\u2019]t load/.test(pages) || /won[^\s]*t load/.test(pages));

console.log("\n=== A DIRECTORY, STYLED LIKE THE CONVERTERS PAGE ===");
check("every game is listed under a Tools-page-style directory", pages.includes('class="module-card module-game-directory wide"') && pages.includes('id="arcadeDirectory"') && pages.includes('all games'));
check("the directory is built from the library", pages.includes("gameLibrary.map(seeAlso)"));
check("external rows pair in-arcade play with a regular Open link", pages.includes("data-directory-play") && pages.includes('<a class="module-action ghost" href="\'+href+\'" target="_blank" rel="noopener noreferrer">Open ↗</a>'));
check("culture quiz keeps its own in-arcade play from the directory", pages.includes("data-directory-culture"));
check("the copy says Open ↗ is a normal link, like the converters page", pages.includes("like on the converters page") && pages.includes("A simple directory, like the converters page"));
check("the old new-tab-only wording is gone", !pages.includes("External games open in a new tab."));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);