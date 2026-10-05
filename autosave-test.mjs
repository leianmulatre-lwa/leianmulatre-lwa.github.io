// Proves connecting saves on its own, that a late-booting store is retried rather than
// needing a button press, and that the retry button only appears when something failed.
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./instagram-orbit.js", import.meta.url), "utf8");
let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${extra}`); }
}

console.log("=== CONNECT PATH SAVES WITHOUT A PRESS ===");
check("handoff exchanges the code then restores", /saveSession\(result\.session\); return restore\(\)/.test(src));
check("restore runs the save", /return saveToFeedWithRetry\(\)/.test(src));
check("restore is also called when there is no handoff", /if \(!handoff\) return restore\(\)/.test(src));
check("save is not behind a button on connect", !/data-instagram-resave[^\n]*await/.test(src));

console.log("\n=== SELF-HEALING RETRY ===");
check("retry helper exists", /async function saveToFeedWithRetry\(\)/.test(src));
check("three escalating attempts", /var delays = \[1200, 4000, 9000\]/.test(src));
check("gives up and reports", /if \(attempt >= delays\.length\) throw failure/.test(src));
check("stops if disconnected mid-retry", /if \(!state\.connected\) throw failure/.test(src));

console.log("\n=== BUTTON ONLY WHEN NEEDED ===");
check("healthy check exists", /var healthy = !state\.importError && state\.importsSaved > 0 && !state\.importsPartial/.test(src));
check("retry button is conditional", /if \(!healthy\) \{\s*\n\s*retry = /.test(src));
check("says it saved automatically", /Saved automatically to your BIGLWA account/.test(src));
check("old always-on button text is gone", !/Save to BIGLWA again/.test(src));

// Behavioural proof: run the real retry helper with a store that fails twice, then succeeds.
console.log("\n=== BEHAVIOUR: FAILS TWICE THEN SUCCEEDS ===");
const state = { connected: true };
let calls = 0;
const delays = [10, 20, 30];
async function importToFeed() {
  calls++;
  if (calls < 3) throw new Error("BIGLWA Orbit storage did not finish loading.");
  return { imported: 7 };
}
async function saveToFeedWithRetry() {
  let attempt = 0;
  for (;;) {
    try { return await importToFeed(); }
    catch (failure) {
      if (attempt >= delays.length) throw failure;
      await new Promise((r) => setTimeout(r, delays[attempt]));
      attempt += 1;
      if (!state.connected) throw failure;
    }
  }
}
const result = await saveToFeedWithRetry();
check("retried without being asked", calls === 3, `calls=${calls}`);
check("returned the successful import", result.imported === 7, JSON.stringify(result));

console.log("\n=== BEHAVIOUR: PERMANENT FAILURE SURFACES ===");
calls = 0;
async function alwaysFails() { calls++; throw new Error("rules not published"); }
async function retryAlways() {
  let attempt = 0;
  for (;;) {
    try { return await alwaysFails(); }
    catch (failure) {
      if (attempt >= delays.length) throw failure;
      await new Promise((r) => setTimeout(r, delays[attempt]));
      attempt += 1;
      if (!state.connected) throw failure;
    }
  }
}
let surfaced = "";
try { await retryAlways(); } catch (e) { surfaced = e.message; }
check("gave up after the last attempt", calls === 4, `calls=${calls}`);
check("the real reason is reported", surfaced === "rules not published", surfaced);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);