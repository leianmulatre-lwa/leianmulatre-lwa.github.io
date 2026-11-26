import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import worker from "./cloudflare-worker-instagram.js";

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" }
});

function kv() {
  const data = new Map();
  return {
    async get(key, type) {
      const value = data.get(key);
      return value === undefined ? null : type === "json" ? JSON.parse(value) : value;
    },
    async put(key, value) { data.set(key, value); }
  };
}

function env(overrides = {}) {
  return {
    SITE_URL: "https://biglwa.com",
    FIREBASE_PROJECT_ID: "biglwa",
    FIREBASE_SERVICE_ACCOUNT: JSON.stringify({
      client_email: "svc@biglwa.iam.gserviceaccount.com", private_key: privateKey
    }),
    MAILROOM_WORKER_DELIVERY: "true",
    MAILROOM_SMTP_USER: "smtp-user",
    MAILROOM_SMTP_PASSWORD: "smtp-pass",
    OAUTH_SESSIONS: kv(),
    ...overrides
  };
}

function request(body = { type: "verify" }, headers = {}) {
  return new Request("https://api.biglwa.com/mail/auth-email", {
    method: "POST",
    headers: { Origin: "https://biglwa.com", "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
}

function stubFetch({ tokenEmail = "member@example.com", admin = {}, oob = null } = {}) {
  const calls = [];
  const previous = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const href = String(url);
    calls.push({ href, init });
    if (href.includes("/accounts:lookup?key="))
      return Response.json({ users: [{ localId: "uid-1", email: tokenEmail }] });
    if (href === "https://oauth2.googleapis.com/token")
      return Response.json({ access_token: "service-token", expires_in: 3600 });
    if (href.includes("/projects/biglwa/accounts:lookup"))
      return Response.json({ users: [{
        localId: "uid-1", email: "member@example.com", disabled: false, emailVerified: false,
        providerUserInfo: [{ providerId: "password" }], ...admin
      }] });
    if (href.includes("/accounts:sendOobCode"))
      return Response.json(oob || { oobLink: "https://biglwa.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=abc&apiKey=key" });
    // No reviewed publication in these tests, so delivery stops before SMTP.
    return new Response(null, { status: 404 });
  };
  return { calls, restore: () => { globalThis.fetch = previous; } };
}

test("Worker mail route rejects unsupported origins, bodies, and tokens", async () => {
  let response = await worker.fetch(request(), env({ SITE_URL: "https://biglwa.com" }));
  assert.equal(response.status, 401);
  response = await worker.fetch(request({}, { Origin: "https://evil.example", Authorization: "Bearer token" }), env());
  assert.equal(response.status, 403);
  response = await worker.fetch(request({ type: "verify", email: "attacker@example.com" },
    { Authorization: "Bearer token" }), env());
  assert.equal(response.status, 400);
  response = await worker.fetch(request(), env({ MAILROOM_WORKER_DELIVERY: "false" }));
  assert.equal(response.status, 503);
  response = await worker.fetch(request(), env({ MAILROOM_SMTP_PASSWORD: "" }));
  assert.equal(response.status, 503);
});

test("Worker binds the recipient to Firebase Admin, not the browser", async () => {
  const stub = stubFetch({ tokenEmail: "attacker@example.com" });
  try {
    const response = await worker.fetch(request({ type: "verify" }, { Authorization: "Bearer member.token" }), env());
    assert.equal(response.status, 403);
    const adminCall = stub.calls.find((call) => call.href.includes("/projects/biglwa/accounts:lookup"));
    assert.deepEqual(JSON.parse(adminCall.init.body), { localId: ["uid-1"] });
  } finally { stub.restore(); }
});

test("Worker returns generic success states without sending through Firebase mail", async () => {
  const verified = stubFetch({ admin: { emailVerified: true } });
  try {
    const response = await worker.fetch(request({ type: "verify" }, { Authorization: "Bearer member.token" }), env());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "already_verified", kind: "verify" });
    assert.equal(verified.calls.some((call) => call.href.includes("/accounts:sendOobCode")), false);
  } finally { verified.restore(); }

  const reset = stubFetch({ admin: { providerUserInfo: [{ providerId: "google.com" }] } });
  try {
    const response = await worker.fetch(request({ type: "reset" }, { Authorization: "Bearer member.token" }), env());
    assert.equal(response.status, 400);
  } finally { reset.restore(); }
});

test("Worker asks Firebase for a secure returnable action link", async () => {
  const stub = stubFetch();
  try {
    const response = await worker.fetch(request({ type: "verify" }, { Authorization: "Bearer member.token" }), env());
    // Missing reviewed publication is deliberately a generic 503; the SMTP
    // relay is never reached with unapproved copy.
    assert.equal(response.status, 503);
    const oobCall = stub.calls.find((call) => call.href.includes("/accounts:sendOobCode"));
    assert.ok(oobCall, "Firebase was asked for an action link");
    assert.deepEqual(JSON.parse(oobCall.init.body), {
      requestType: "VERIFY_EMAIL", email: "member@example.com", returnOobLink: true
    });
  } finally { stub.restore(); }
});

test("Worker rate-limits auth email requests per account and type", async () => {
  const stub = stubFetch();
  try {
    const shared = env();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await worker.fetch(request({ type: "verify" }, { Authorization: "Bearer member.token" }), shared);
      assert.equal(response.status, 503);
    }
    const response = await worker.fetch(request({ type: "verify" }, { Authorization: "Bearer member.token" }), shared);
    assert.equal(response.status, 429);
  } finally { stub.restore(); }
});
