import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  TEMPLATE_IDS, FIELD_LIMITS, getDefaultTemplate, normalizeTemplate,
  validateTemplate, escapeHtml, interpolatePreview, renderEmailHtml, renderPlainText
} from "./templates.js";

test("four secure email types have compact, valid starter letters", () => {
  assert.deepEqual(TEMPLATE_IDS, ["verify", "reset", "email-change", "mfa"]);
  for (const id of TEMPLATE_IDS) {
    const t = getDefaultTemplate(id);
    assert.equal(validateTemplate(t), true, id);
    assert.match(t.closing, /^Warmly,/);
    assert.match(t.signature, /L’wazi 🤎/);
    const html = renderEmailHtml(t);
    assert.ok(html.includes("{{ACTION_URL}}"), id);
    assert.ok(html.includes("BIG LWA"));
    assert.ok(html.includes('max-width:580px'));
    assert.ok(!html.includes("firebaseapp.com"));
    assert.ok(!html.includes("javascript:"));
    const text = renderPlainText(t);
    assert.match(text, /\{\{ACTION_URL\}\}/);
  }
});
test("preview action is inert and production export is a placeholder", () => {
  const t = getDefaultTemplate("reset");
  assert.match(renderEmailHtml(t,{preview:true}), /href="#preview-only"/);
  assert.match(renderEmailHtml(t), /href="\{\{ACTION_URL\}\}"/);
});
test("all editable fields are escaped before rendering", () => {
  const t = getDefaultTemplate("verify");
  t.subject = '<img src=x onerror=alert(1)>';
  t.greeting = '<script>alert(1)</script>';
  t.body = 'Hi <b>sweetie</b>\n\nA second paragraph & "words".';
  t.buttonText = '<a href="javascript:alert(1)">bad</a>';
  t.signature = '<svg onload=alert(1)>';
  const html = renderEmailHtml(t);
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<svg "));
  assert.ok(!html.includes("<img src=x"));
  assert.ok(!html.includes('href="javascript:'));
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;b&gt;sweetie&lt;\/b&gt;/);
  assert.match(html, /&amp; &quot;words&quot;/);
  assert.equal(escapeHtml('<>&"\''), '&lt;&gt;&amp;&quot;&#39;');
});
test("template schema clamps untrusted edits and rejects empty fields", () => {
  const t = normalizeTemplate("verify",{subject:"x".repeat(300),body:42});
  assert.equal(t.subject.length, FIELD_LIMITS.subject);
  assert.equal(typeof t.body, "string");
  assert.equal(validateTemplate({...t,closing:""}), false);
  assert.throws(() => getDefaultTemplate("rogue"));
});
test("only documented sample placeholders are previewed", () => {
  assert.equal(interpolatePreview("{{OLD_EMAIL}} {{NEW_EMAIL}} {{DISPLAY_NAME}}"),
    "old@example.com new@example.com bookini");
  assert.equal(interpolatePreview("{{UNTRUSTED}}"), "{{UNTRUSTED}}");
});
test("application is draft-only and developer security rules fail closed", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url),"utf8");
  const rules = readFileSync(new URL("../../firestore.rules", import.meta.url),"utf8");
  assert.match(app,/developerAdmins/);
  assert.match(app,/developerMailTemplates/);
  assert.match(app,/runTransaction/);
  assert.ok(!app.includes("sendEmailVerification("));
  assert.ok(!app.includes("sendPasswordResetEmail("));
  assert.ok(!app.includes("smtpPassword"));
  assert.match(rules,/match \/developerAdmins\/\{uid\}/);
  assert.match(rules,/allow list, create, update, delete: if false;/);
  assert.match(rules,/match \/developerMailTemplates\/\{templateId\}/);
  assert.match(rules,/request\.resource\.data\.revision == resource\.data\.revision \+ 1/);
});
