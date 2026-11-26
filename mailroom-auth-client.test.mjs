import assert from "node:assert/strict";
import test from "node:test";
import { requestMailroomAuthEmail, MAILROOM_API_ORIGIN } from "./mailroom-auth-client.js";

const user = { getIdToken: async () => "member.token" };

test("Mailroom browser bridge sends only an authenticated action type to the Worker", async () => {
  let captured;
  const result = await requestMailroomAuthEmail(user, "verify", {
    fetchImpl: async (url, init) => {
      captured = { url: String(url), init };
      return { ok: true, status: 202, json: async () => ({ status: "accepted_by_smtp" }) };
    }
  });
  assert.equal(captured.url, MAILROOM_API_ORIGIN + "/mail/auth-email");
  assert.equal(captured.init.headers.Authorization, "Bearer member.token");
  assert.deepEqual(JSON.parse(captured.init.body), { type: "verify" });
  assert.deepEqual(result, { fallback: false, status: "accepted_by_smtp" });
});

test("already-verified is a successful Worker result, not a fallback", async () => {
  const result = await requestMailroomAuthEmail(user, "verify", {
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ status: "already_verified" }) })
  });
  assert.deepEqual(result, { fallback: false, status: "already_verified" });
});

test("Firebase fallback is used only for network failure", async () => {
  const offline = await requestMailroomAuthEmail(user, "reset", {
    fetchImpl: async () => { throw new Error("offline"); }
  });
  assert.equal(offline.fallback, true);
  for (const status of [404, 500, 502, 503, 530]) {
    await assert.rejects(() => requestMailroomAuthEmail(user, "reset", {
      fetchImpl: async () => ({ ok: false, status, json: async () => ({}) })
    }), /could not send/);
  }
  await assert.rejects(() => requestMailroomAuthEmail(user, "reset", {
    fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({}) })
  }), /Too many/);
});

test("Mailroom bridge rejects unsupported actions and insecure origins", async () => {
  await assert.rejects(() => requestMailroomAuthEmail(user, "mfa"), /Unsupported/);
  await assert.rejects(() => requestMailroomAuthEmail(user, "verify", {
    origin: "http://mailroom.biglwa.com"
  }), /HTTPS/);
});
