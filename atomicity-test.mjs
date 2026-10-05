import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./orbit-posts.js", import.meta.url), "utf8");

const start = src.indexOf("async function writePostRecords");
if (start < 0) throw new Error("writePostRecords not found");

const open = src.indexOf("(", start);
let pd = 0, close = -1;
for (let n = open; n < src.length; n++) {
  if (src[n] === "(") pd++;
  else if (src[n] === ")") { pd--; if (pd === 0) { close = n; break; } }
}
const start2 = src.indexOf("{", close);

let depth = 0, end = -1;
for (let n = start2; n < src.length; n++) {
  if (src[n] === "{") depth++;
  else if (src[n] === "}") { depth--; if (depth === 0) { end = n + 1; break; } }
}
if (end < 0) throw new Error("could not find end of writePostRecords");
const body = src.slice(start, end);

const postRefs = (store, uid, postId) => ({
  root: { path: `posts/${postId}` },
  profile: { path: `users/${uid}/posts/${postId}` },
  archive: { path: `users/${uid}/archive/${postId}` }
});

const writePostRecords = new Function("postRefs", `return (${body})`)(postRefs);

function fakeStore(deny = []) {
  const written = [];
  return {
    written,
    setDoc: async (ref, payload) => {
      const hit = deny.some((d) => (d[0] === "=" ? ref.path === d.slice(1) : ref.path.includes(d)));
      if (hit) {
        const e = new Error("PERMISSION_DENIED: missing or insufficient permissions.");
        e.code = "permission-denied";
        throw e;
      }
      written.push(ref.path);
    }
  };
}

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}`); }
}

console.log("Case 1: no denials - all three land");
{
  const s = fakeStore();
  const r = await writePostRecords(s, "u1", "p1", { a: 1 }, { b: 2 });
  check("three writes", s.written.length === 3);
  check("archive first", s.written[0].includes("/archive/"));
  check("profile second", s.written[1].includes("/posts/"));
  check("root last", s.written[2] === "posts/p1");
  check("denied empty", r.denied.length === 0);
  check("refs returned", !!r.refs.root);
}

console.log("Case 2: archive denied - card must still reach feed + profile");
{
  const s = fakeStore(["/archive/"]);
  const r = await writePostRecords(s, "u1", "p1", { a: 1 }, {});
  check("two writes survive", s.written.length === 2);
  check("root still written", s.written.includes("posts/p1"));
  check("no throw", true);
  check("archive reported denied", r.denied.includes("archive"));
}

console.log("Case 3: root denied - owner indexes still land (repair can promote)");
{
  const s = fakeStore(["=posts/p1"]);
  const r = await writePostRecords(s, "u1", "p1", { a: 1 }, {});
  check("archive + profile written", s.written.length === 2);
  check("root reported denied", r.denied.includes("root"));
}

console.log("Case 4: every path denied - must throw, not silently report success");
{
  const s = fakeStore(["posts/p1", "/archive/"]);
  let threw = null;
  try { await writePostRecords(s, "u1", "p1", { a: 1 }, {}); } catch (e) { threw = e; }
  check("threw", !!threw);
  check("code is post-write-failed", threw && threw.code === "post-write-failed");
  check("denied lists all three", threw && threw.denied.length === 3);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) Deno.exit(1);