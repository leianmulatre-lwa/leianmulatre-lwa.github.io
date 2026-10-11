// Covers the Pinterest Boards screen: the empty board slots are the connection control
// itself (not inert divs), and the page reopens after the OAuth round trip so the
// freshly loaded boards are actually visible.
import { readFileSync } from "node:fs";

const pinterest = readFileSync(new URL("./pinterest-orbit.js", import.meta.url), "utf8");
const index = readFileSync(new URL("./index.html", import.meta.url), "utf8");

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${extra}`); }
}

console.log("=== THE CONNECT TILES ACTUALLY CONNECT ===");
check("empty board slots are connect buttons, not inert divs", pinterest.includes('class="pinterest-board is-empty" data-pn-connect'));
check("the pre-connect grid is no longer hidden from input", !pinterest.includes('pinterest-board-grid" aria-hidden="true"'));
check("boardGrid receives the busy/disabled state", pinterest.includes("function boardGrid(disabled)") && pinterest.includes("boardGrid(disabled)+"));
check("a busy connection disables the tiles", pinterest.includes("data-pn-connect'+(disabled||'')"));

console.log("\n=== THE ROUND TRIP LANDS BACK ON BOARDS ===");
check("returning from Pinterest reopens the Boards module", pinterest.includes("window.openBIGLWAModule('boards')") && pinterest.includes("if(returning&&typeof window.openBIGLWAModule==='function')"));
check("only a real handoff is treated as returning", pinterest.includes("let returning=false") && pinterest.includes("if(handoff){returning=true;"));

console.log("\n=== THE IMPORT STILL CARRIES IDENTITY ===");
check("Pins import with the Big LWA identity", pinterest.includes('importer("pinterest",items,profile, window.__biglwaIdentity || {})'));

console.log("\n=== CONNECTING SENDS A REAL PKCE CHALLENGE ===");
check("connect guards the secure context it needs for PKCE", pinterest.includes("if(!crypto.subtle)throw new Error('Connect Pinterest from a secure page"));
check("the unsigned-in blocking gate is gone", !pinterest.includes("if(!session())throw new Error('Sign in to Big LWA first"));
check("the worker knock is still checked first", pinterest.includes("await api('health');"));
check("the oauth start is reached with a base64url challenge", pinterest.includes("location.assign(API+'start?challenge='+encodeURIComponent(challenge))"));
check("the old account-session cache-buster is gone", index.includes("pinterest-orbit.js?v=20261008-secure-connect-1"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
