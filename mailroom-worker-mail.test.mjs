import assert from "node:assert/strict";
import test from "node:test";
import { getDefaultTemplate } from "./developer/mailroom/templates.js";
import {
  base64Utf8, createSmtpMessage, dotStuff, mailSmtpConfig,
  publicationDigest, requireApprovedCopy, smtpAuthPlain, validatePublishedCopy
} from "./mailroom-worker-mail.mjs";

const copy = getDefaultTemplate("verify");

async function published(overrides = {}) {
  return {
    schema: 1, type: "verify", sourceRevision: 3, publishedBy: "admin-uid",
    status: "published", copy,
    sha256: await publicationDigest("verify", 3, copy),
    ...overrides
  };
}

test("Worker publication validation matches the reviewed Mailroom snapshot", async () => {
  assert.deepEqual(validatePublishedCopy("verify", copy), copy);
  assert.deepEqual(await requireApprovedCopy("verify", await published()), copy);
  await assert.rejects(async () => requireApprovedCopy("verify", await published({ sha256: "forged" })),
    /hash mismatch/);
  await assert.rejects(async () => requireApprovedCopy("verify", await published({ status: "draft" })),
    /No approved/);
});

test("Worker publication validation rejects injected copy", async () => {
  await assert.rejects(async () => validatePublishedCopy("verify", { ...copy, subject: "hi\r\nBcc: x@y.com" }),
    /Control characters/);
  await assert.rejects(async () => validatePublishedCopy("verify", { ...copy, body: copy.body + " {{ACTION_URL}}" }),
    /Unsupported live Mailroom variable/);
});

test("SMTP transport only accepts approved Titan-style settings", () => {
  assert.deepEqual(mailSmtpConfig({ MAILROOM_SMTP_USER: "u", MAILROOM_SMTP_PASSWORD: "p" }), {
    host: "smtp.titan.email", port: 465, user: "u", pass: "p", from: "lwazi@biglwa.com"
  });
  assert.equal(mailSmtpConfig({
    MAILROOM_SMTP_USER: "u", MAILROOM_SMTP_PASSWORD: "p", MAILROOM_SMTP_PORT: "587"
  }).port, 587);
  assert.throws(() => mailSmtpConfig({ MAILROOM_SMTP_USER: "u", MAILROOM_SMTP_PASSWORD: "p", MAILROOM_SMTP_PORT: "25" }),
    /Invalid SMTP/);
  assert.throws(() => mailSmtpConfig({ MAILROOM_SMTP_USER: "u", MAILROOM_SMTP_PASSWORD: "p", MAILROOM_FROM: "other@example.com" }),
    /Invalid SMTP sender/);
  assert.throws(() => mailSmtpConfig({ MAILROOM_SMTP_USER: "u" }), /Invalid SMTP credentials/);
  assert.deepEqual(mailSmtpConfig({
    MAILROOM_SMTP_USER: " u\n", MAILROOM_SMTP_PASSWORD: "p\n", MAILROOM_SMTP_PORT: " 465 "
  }), { host: "smtp.titan.email", port: 465, user: "u", pass: "p", from: "lwazi@biglwa.com" });
  assert.throws(() => mailSmtpConfig({ MAILROOM_SMTP_USER: "u", MAILROOM_SMTP_PASSWORD: "p\nq" }),
    /Invalid SMTP credentials/);
});

test("SMTP message encodes UTF-8 safely and never trusts header input", () => {
  const message = createSmtpMessage({
    from: "lwazi@biglwa.com", to: "Member@Example.com", subject: "Verify 🤎",
    text: "Hello member", html: "<p>Hello member</p>",
    headers: { "X-BigLWA-Mailroom": "transactional", "Bcc": "attacker@example.com" }
  });
  assert.match(message, /To: <member@example\.com>/);
  assert.match(message, /X-BigLWA-Mailroom: transactional/);
  assert.doesNotMatch(message, /Bcc:/);
  assert.match(message, new RegExp(base64Utf8("Hello member")));
  assert.match(message, /=\?UTF-8\?B\?/);
  assert.throws(() => createSmtpMessage({
    from: "lwazi@biglwa.com", to: "member@example.com\r\nBcc: other@example.com",
    subject: "x", text: "x", html: "x"
  }), /valid verified recipient/);
});

test("SMTP helper shapes authentication and dot-stuffed body data", () => {
  assert.equal(atob(smtpAuthPlain("user", "pass")), "\0user\0pass");
  assert.equal(dotStuff("one\n.two\n"), "one\r\n..two\r\n");
});
