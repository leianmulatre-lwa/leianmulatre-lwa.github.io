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
check("the oauth start uses the stable Studio Orbit return route", tiktok.includes("location.assign(API + '/tiktok/start?challenge=' + encodeURIComponent(challenge) + '&return_to=' + encodeURIComponent(location.origin + '/studio?view=orbit&orbit_return=1'))"));
check("the verifier is remembered for the handoff", tiktok.includes("sessionStorage.setItem('tt_verifier', verifier)"));

console.log("\n=== THE NEW SCRIPT IS SERVED ===");
check("the TikTok script has a cache-busting version", /tiktok-orbit\.js\?v=/.test(index));

const worker = readFileSync(new URL('./cloudflare-worker-instagram.js',import.meta.url),'utf8');
const connections = readFileSync(new URL('./orbit-connections.js',import.meta.url),'utf8');
const pages = readFileSync(new URL('./module-pages.js',import.meta.url),'utf8');
check("base TikTok login stays basic until optional scopes are approved",
 worker.includes("const approved=['user.info.basic']")&&
 worker.includes("if(env.TIKTOK_VIDEO_LIST_APPROVED==='true')approved.push('video.list')")&&
 worker.includes("if(env.TIKTOK_USER_STATS_APPROVED==='true')approved.push('user.info.stats')"));
check("unapproved TikTok audience stays unknown, with verified-stats fallback",
 worker.includes("const identityFields=profileScoped?basic+',username,profile_deep_link':basic")&&
 worker.includes("scoped?identityFields+',follower_count,following_count,likes_count,video_count':identityFields")&&
 worker.includes("response=await fetch('https://open.tiktokapis.com/v2/user/info/?fields='+basic"));
check("TikTok token request explicitly sends form encoding",
 worker.includes("'Content-Type':'application/x-www-form-urlencoded'")&&worker.includes("body.set('redirect_uri', String(params.redirect_uri))"));
check("token errors preserve TikTok support log ID but no secrets",
 worker.includes("TikTok log ID: ")&&worker.includes("token.log_id"));
check("failed code exchanges redirect back to Orbit instead of raw JSON",
 worker.includes("destination.searchParams.set('tiktok_error', (error.publicMessage")&&worker.includes("return ttRedirect(destination.href, '');"));
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

check("TikTok-only myfeed panel is retired",tiktok.includes("function renderTikTokFeedImporter()")&&!tiktok.includes("Save to myfeed drafts")&&tiktok.includes("forEach(node=>node.remove())"));
check("TikTok inline videos use the official embedded player",tiktok.includes("data-tiktok-play-video")&&tiktok.includes("https://www.tiktok.com/player/v1/"));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);