// Covers TikTok's Connect button speaking up on insecure pages and reaching the
// /tiktok/start redirect with a valid PKCE challenge, mirroring how Pinterest now
// works.
import { readFileSync } from "node:fs";

const tiktok = readFileSync(new URL("./tiktok-orbit.js", import.meta.url), "utf8");
const index = readFileSync(new URL("./index.html", import.meta.url), "utf8");

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${extra}`); }
}

console.log("=== TIKTOK CONNECT DOES NOT DIE SILENTLY ===");
check("connect guards the secure context it needs for PKCE", tiktok.includes("if (!crypto.subtle) throw new Error('TikTok needs a secure page"));
check("health is still checked first", tiktok.includes("const health = await api('health');"));
check("the oauth start is reached with a base64url challenge", tiktok.includes("location.assign(API + '/tiktok/start?challenge=' + encodeURIComponent(challenge))"));
check("the verifier is remembered for the handoff", tiktok.includes("sessionStorage.setItem('tt_verifier', verifier)"));

console.log("\n=== THE NEW SCRIPT IS SERVED ===");
check("the tiktok script cache-buster was bumped", index.includes("tiktok-orbit.js?v=20261008-secure-connect-1"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);