// Browser bridge for the Worker-hosted L’wazi Mailroom. Firebase is the rollback
// sender only when the Worker itself cannot be reached, never on a deliberate
// server response: Firebase's outbound mail quota is the failure we are replacing.
export const MAILROOM_API_ORIGIN = "https://api.biglwa.com";
const AUTH_EMAIL_PATH = "/mail/auth-email";

export async function requestMailroomAuthEmail(user, type, {
  origin = MAILROOM_API_ORIGIN, fetchImpl = globalThis.fetch
} = {}) {
  if (!user || typeof user.getIdToken !== "function") throw new Error("Sign in again to send this email.");
  if (!["verify", "reset"].includes(type)) throw new Error("Unsupported email action.");
  if (typeof fetchImpl !== "function") return { fallback: true };
  const endpoint = new URL(AUTH_EMAIL_PATH, origin);
  if (endpoint.protocol !== "https:") throw new Error("Mailroom requires HTTPS.");
  const token = await user.getIdToken();
  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST", mode: "cors", cache: "no-store",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ type })
    });
  } catch {
    // A network outage is the only case where the Firebase rollback is used.
    return { fallback: true };
  }
  if (response.ok) {
    const result = await response.json().catch(() => ({}));
    const status = String(result.status || "accepted_by_smtp");
    if (status === "accepted_by_smtp" || status === "already_verified")
      return { fallback: false, status };
    throw new Error("L’wazi Mailroom could not send that email. Please try again.");
  }
  if (response.status === 429)
    throw new Error("Too many email requests. Wait a little, then try again.");
  if (response.status === 401 || response.status === 403)
    throw new Error("Sign in again to send this email.");
  if (response.status === 400 && type === "reset")
    throw new Error("This account does not use an email-and-password sign-in.");
  // 503 means the relay is not configured or delivery failed. Falling back to
  // Firebase here would reintroduce the exhausted-quota failure silently.
  throw new Error("L’wazi Mailroom could not send that email. Please try again.");
}
