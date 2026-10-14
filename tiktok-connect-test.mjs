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
check("the oauth start is reached with a base64url challenge", tiktok.includes("location.assign(API + '/tiktok/start?challenge=' + encodeURIComponent(challenge) + '&return_to=' + encodeURIComponent(location.origin + '/studio'))"));
check("the verifier is remembered for the handoff", tiktok.includes("sessionStorage.setItem('tt_verifier', verifier)"));

console.log("\n=== THE NEW SCRIPT IS SERVED ===");
check("the tiktok script cache-buster was bumped", index.includes("tiktok-orbit.js?v=20261014-baseline-scope-binding-2"));

const worker = readFileSync(new URL('./cloudflare-worker-instagram.js',import.meta.url),'utf8');
const connections = readFileSync(new URL('./orbit-connections.js',import.meta.url),'utf8');
const pages = readFileSync(new URL('./module-pages.js',import.meta.url),'utf8');
check("base TikTok login uses basic scope until video.list approval",
 worker.includes("scope: env.TIKTOK_VIDEO_LIST_APPROVED==='true'?'user.info.basic,video.list':'user.info.basic'"));
check("secure TikTok callback uses original trusted domain",
 worker.includes("const destination = new URL(ttReturnUrl(saved.returnTo,env))"));
check("TikTok returns meaningful provider error",
 worker.includes("url.searchParams.get('error_description')"));
check("handoff must attach to a verified Firebase user",
 worker.includes("if(!firebaseUid)ttFail('Sign in to Big LWA"));
check("TikTok account can restore its session across devices",
 worker.includes("path === '/tiktok/session/account'"));
check("session handoff includes Firebase ID token",
 tiktok.includes("handoff:pending.handoff,verifier,firebaseIdToken:token"));
check("frontend verifies server-side account mapping",
 tiktok.includes("verified.session!==result.session"));
check("TikTok session is tied to signed-in UID",
 tiktok.includes("KEY + ':' + authUid"));
check("Orbit updates from verified TikTok session",
 pages.includes("biglwa:tiktok-status")&&pages.includes("tt?.connected&&tt.uid"));
check("connection hub can recover TikTok session by Firebase UID",
 connections.includes("async function recoverTikTokSession(uid)")&&connections.includes('source.id === "tiktok"'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);