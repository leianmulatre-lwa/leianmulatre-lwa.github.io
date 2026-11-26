/* Pure validation and MIME helpers for Worker-side Mailroom delivery.
 * No credentials, network calls, Node-only APIs, or sockets live here. */
export const MAILROOM_LIVE_TYPES = Object.freeze(["verify", "reset"]);
export const MAILROOM_FIELD_LIMITS = Object.freeze({
  subject: 160, preheader: 220, greeting: 160, body: 8000,
  buttonText: 100, closing: 80, signature: 180
});
const SINGLE_LINE = Object.freeze([
  "subject", "preheader", "greeting", "buttonText", "closing", "signature"
]);
const FIELDS = Object.freeze(Object.keys(MAILROOM_FIELD_LIMITS));
const CRLF = "\r\n";
const ALLOWED_PORTS = new Set([465, 587]);
const SENDER_NAME = "L’wazi 🤎 | Big LWA";
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const encoder = new TextEncoder();

export function validatePublishedCopy(id, input) {
  if (!MAILROOM_LIVE_TYPES.includes(id)) throw new Error("Unsupported live authentication message");
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Missing letter");
  const copy = {};
  for (const key of FIELDS) {
    const value = input[key];
    if (typeof value !== "string" || !value.trim() || value.length > MAILROOM_FIELD_LIMITS[key])
      throw new Error("Invalid Mailroom field: " + key);
    if (SINGLE_LINE.includes(key) && /[\r\n\u0000-\u001f\u007f]/.test(value))
      throw new Error("Control characters are not allowed in header and single-line fields");
    const unknown = [...value.matchAll(/\{\{([A-Z_]+)\}\}/g)]
      .map((match) => match[1]).filter((name) => name !== "DISPLAY_NAME");
    if (unknown.length) throw new Error("Unsupported live Mailroom variable: " + unknown[0]);
    copy[key] = value;
  }
  return copy;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function publicationDigest(id, revision, copy) {
  if (!Number.isSafeInteger(revision) || revision < 1) throw new Error("Invalid saved revision");
  return sha256Hex(JSON.stringify({ id, revision, copy: validatePublishedCopy(id, copy) }));
}

export async function requireApprovedCopy(id, published) {
  if (!published || published.schema !== 1 || published.status !== "published" ||
      published.type !== id || typeof published.publishedBy !== "string" || !published.publishedBy.trim())
    throw new Error("No approved Mailroom publication");
  const copy = validatePublishedCopy(id, published.copy);
  const digest = await publicationDigest(id, published.sourceRevision, copy);
  if (digest !== String(published.sha256 || "").toLowerCase())
    throw new Error("Mailroom published revision hash mismatch");
  return copy;
}

export function mailSmtpConfig(env = {}) {
  const host = String(env.MAILROOM_SMTP_HOST || "smtp.titan.email").trim();
  const port = Number(env.MAILROOM_SMTP_PORT || 465);
  const user = String(env.MAILROOM_SMTP_USER || "").trim();
  const pass = String(env.MAILROOM_SMTP_PASSWORD || "");
  const from = String(env.MAILROOM_FROM || "lwazi@biglwa.com").trim().toLowerCase();
  if (!/^[a-z0-9.-]+$/i.test(host) || !ALLOWED_PORTS.has(port) || !user || !pass ||
      from !== "lwazi@biglwa.com" || /[\r\n\0]/.test(user + pass + from))
    throw new Error("Invalid SMTP transport configuration.");
  return { host, port, user, pass, from };
}

export function base64Utf8(value) {
  const bytes = encoder.encode(String(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function smtpAuthPlain(user, pass) {
  return base64Utf8("\0" + user + "\0" + pass);
}

function base64Wrapped(value) {
  const encoded = base64Utf8(value);
  return (encoded.match(/.{1,76}/g) || [""]).join(CRLF);
}

function headerSafe(value, name) {
  const text = String(value || "");
  if (/[\r\n\0]/.test(text)) throw new Error("Invalid mail header: " + name);
  return text;
}

function utf8Header(value) {
  return "=?UTF-8?B?" + base64Utf8(value) + "?=";
}

function randomBoundary() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return "biglwa-" + [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createSmtpMessage({ from, to, subject, text, html, headers = {} }) {
  const recipient = String(to || "").trim().toLowerCase();
  if (!EMAIL_RE.test(recipient) || /[\r\n\0]/.test(recipient))
    throw new Error("No valid verified recipient email.");
  if (!EMAIL_RE.test(String(from || ""))) throw new Error("Invalid sender address.");
  if (!String(text || "") || !String(html || "")) throw new Error("Mail body is incomplete.");
  const safeSubject = headerSafe(subject, "subject");
  const extra = [];
  for (const [name, value] of Object.entries(headers || {})) {
    if (!/^X-BigLWA-[A-Za-z0-9-]+$/.test(name)) continue;
    extra.push(name + ": " + headerSafe(value, name));
  }
  const boundary = randomBoundary();
  const lines = [
    "From: " + utf8Header(SENDER_NAME) + " <" + from + ">",
    "To: <" + recipient + ">",
    "Subject: " + utf8Header(safeSubject),
    "Date: " + new Date().toUTCString(),
    "Message-ID: <" + randomBoundary() + "@biglwa.com>",
    "MIME-Version: 1.0",
    "Content-Type: multipart/alternative; boundary=\"" + boundary + "\"",
    ...extra,
    "Auto-Submitted: auto-generated",
    CRLF,
    "--" + boundary,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    CRLF,
    base64Wrapped(String(text)),
    CRLF,
    "--" + boundary,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    CRLF,
    base64Wrapped(String(html)),
    CRLF,
    "--" + boundary + "--",
    ""
  ];
  return lines.join(CRLF);
}

export function dotStuff(message) {
  return String(message).replace(/\r?\n/g, CRLF).replace(/^\./gm, "..").replace(/\r?\n$/, "") + CRLF;
}
