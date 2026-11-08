import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve,join} from "node:path";
import test from "node:test";

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,"..");
const read=relative=>readFileSync(join(root,relative),"utf8");
const home=read("developer/index.html");
const mailroom=read("developer/mailroom/index.html");
const css=read("developer/console.css");
const mailCss=read("developer/mailroom/mailroom.css");
const auth=read("developer/console.js");
const editor=read("developer/mailroom/app.js");

test("both developer routes inherit the actual Studio crest, font and console shell",()=>{
  for(const html of [home,mailroom]){
    assert.match(html, /href="\/stitched-crest\.css"/);
    assert.match(html, /href="\/developer\/console\.css"/);
    assert.match(html, /class="dev-topbar"/);
    assert.match(html, /class="dev-brand"/);
    assert.match(html, /biglwa-stitched-crest/);
    assert.match(html, /src="\/assets\/studio-tipi-symbol\.svg"/);
    assert.match(html, /href="\/developer\/"/);
    assert.match(html, /href="\/developer\/mailroom\/"/);
    assert.match(html, /id="sessionState"/);
    assert.match(html, /id="accessPanel"/);
    assert.match(html, /content="noindex,nofollow,noarchive"/);
  }
  assert.match(css, /font-family:"CS Bergamot Stitched"/);
  assert.match(css, /login-curtain-film-grain-v2\.webp/);
  assert.match(css, /biglwa-stitched-crest/);
  assert.match(css, /\.dev-lights i:nth-child\(1\)/);
  assert.match(css, /\.dev-lights i:nth-child\(2\)/);
  assert.match(css, /\.dev-lights i:nth-child\(3\)/);
  assert.match(mailCss, /shared Big LWA Developer shell/);
  assert.ok(!mailCss.includes(".sidebar"));
});
test("all referenced branding files exist in this repository, not external placeholders",()=>{
  const re=/\/assets\/[a-zA-Z0-9._~/-]+/g;
  const refs=[...home.matchAll(re),...mailroom.matchAll(re),...css.matchAll(re),...mailCss.matchAll(re)].map(m=>m[0]);
  assert.ok(refs.length>=10, "expected several repository assets");
  for(const asset of new Set(refs)) assert.ok(existsSync(join(root,asset.slice(1))),"missing asset "+asset);
  assert.ok(existsSync(join(root,"stitched-crest.css")));
});
test("developer homepage is private, read-only and does not fake future features",()=>{
  assert.match(home, /id="developerHome" hidden/);
  assert.match(auth, /developerAdmins/);
  assert.match(auth, /getDoc/);
  assert.match(auth, /active !== true/);
  assert.ok(!auth.includes("setDoc("));
  assert.ok(!auth.includes("sendEmail("));
  assert.match(home,/href="\/developer\/mailroom\/"/);
  assert.match(home,/Planned · providers and connection settings/);
});
test("Mailroom retains all controls referenced by the existing editor",()=>{
  for(const id of [
    "mailroom","letterForm","templateSelect","subject","preheader","greeting",
    "body","buttonText","closing","signature","saveButton","restoreButton",
    "editorStatus","emailPreview","copyButton","htmlButton","textButton",
    "jsonButton","accessTitle","accessMessage","accessLink"
  ]) assert.ok(mailroom.includes('id="'+id+'"'),"missing "+id);
  assert.match(editor,/runTransaction/);
  assert.match(editor,/developerAdmins/);
  assert.match(mailroom,/<iframe id="emailPreview"[^>]* sandbox=""/);
  assert.match(mailroom, /Saved drafts stay private until published/);
  assert.match(mailroom, /Copying or downloading does <strong>not<\/strong> change live emails/);
  assert.ok(!editor.includes("sendPasswordResetEmail("));
});
