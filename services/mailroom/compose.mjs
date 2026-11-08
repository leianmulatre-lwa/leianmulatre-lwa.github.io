// Shared mail composition for Big LWA. Pure module: no credentials, network or Firebase SDK.
import {
  TEMPLATE_IDS, getDefaultTemplate, normalizeTemplate, validateTemplate,
  renderEmailHtml, renderPlainText, escapeHtml
} from "../../developer/mailroom/templates.js";

const PLACEHOLDERS = new Set(["DISPLAY_NAME","OLD_EMAIL","NEW_EMAIL","ACTION_URL"]);
const ALLOWED_LINKS = Object.freeze({
  verify: "verifyEmail",
  reset: "resetPassword"
});
const LINK_HOSTS = new Set(["biglwa.firebaseapp.com","biglwa.com"]);

function cleanName(value) {
  if (typeof value !== "string") return "";
  const text = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!text || text.includes("@") || /^https?:\/\//i.test(text)) return "";
  return text;
}

// Account profile "name" is the preferred source. Firebase auth.displayName
// may contain a username from older signup flows; do not call that a person's name.
export function chooseDisplayName(account = {}, profile = {}) {
  const handle = String(profile.usernameLower || profile.username || "").replace(/^@/, "").toLowerCase();
  const profileName = cleanName(profile.name);
  if (profileName && profileName.toLowerCase() !== handle) return profileName;
  const authName = cleanName(account.displayName);
  if (authName && authName.toLowerCase() !== handle) return authName;
  return "bookini";
}
export function mailGreeting(name) {
  return name === "bookini" ? "Hey, bookini! 🤎" : "Hey, " + name + "! 🤎";
}
export function verifyActionUrl(url, id) {
  if (!Object.hasOwn(ALLOWED_LINKS,id)) throw new Error("Only verification and password reset may be delivered.");
  let u;
  try { u = new URL(url); } catch { throw new Error("Invalid email action URL."); }
  if (u.protocol !== "https:" || !LINK_HOSTS.has(u.hostname.toLowerCase()) ||
      u.username || u.password || u.port ||
      !["/__/auth/action","/auth/action"].includes(u.pathname) ||
      u.searchParams.get("mode") !== ALLOWED_LINKS[id] ||
      !u.searchParams.get("oobCode") || !u.searchParams.get("apiKey"))
    throw new Error("Email action URL is not a recognized Firebase action.");
  return u.toString();
}

export function interpolate(value, vars) {
  return String(value).replace(/\{\{([A-Z_]+)\}\}/g, (whole, key) => {
    if (!PLACEHOLDERS.has(key)) throw new Error("Unsupported template variable: " + key);
    if (!Object.hasOwn(vars,key) || typeof vars[key] !== "string" || !vars[key])
      throw new Error("Missing required template variable: " + key);
    return vars[key];
  });
}
function interpolateFields(template, vars) {
  const data = {};
  for (const key of ["subject","preheader","greeting","body","buttonText","closing","signature"])
    data[key] = interpolate(template[key],vars);
  return data;
}
function formatAccount(account, profile, template) {
  const name = chooseDisplayName(account,profile);
  // Only replace the default generic salutation if it is still the stock copy.
  // Authored greetings and explicit {{DISPLAY_NAME}} variables are respected.
  const stock = getDefaultTemplate("verify").greeting;
  return {
    ...template,
    greeting: template.greeting === stock ? mailGreeting(name) : template.greeting
  };
}
const TEST_PILL = '<span style="display:inline-block;padding:11px 18px;background:#7b6662;color:#ffffff;font-size:14px;font-weight:700">TEST PREVIEW — NO LIVE ACTION</span>';

export function composeMessage({id,account,profile = {},template,mode = "test",actionUrl}) {
  if (!TEMPLATE_IDS.includes(id)) throw new Error("Unknown letter type.");
  if (!account || typeof account.email !== "string" ||
      !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(account.email) ||
      /[\r\n]/.test(account.email)) throw new Error("No valid verified recipient email.");
  if (!["test","auth"].includes(mode)) throw new Error("Unsupported message mode.");
  const base = template ? normalizeTemplate(id,template) : getDefaultTemplate(id);
  if (!validateTemplate(base)) throw new Error("Template is incomplete.");
  const name = chooseDisplayName(account,profile);
  const vars = mode === "test" ? {
    DISPLAY_NAME:name, OLD_EMAIL:"old@example.com", NEW_EMAIL:"new@example.com", ACTION_URL:"[TEST ONLY]"
  } : {DISPLAY_NAME:name,ACTION_URL:verifyActionUrl(actionUrl,id)};
  const data = interpolateFields(formatAccount(account,profile,base),vars);
  const subject = mode === "test" ? "[TEST — NO ACTION] " + data.subject : data.subject;
  // Reuse the actual editor HTML/CSS with all user/profile fields already escaped
  // by renderEmailHtml. A test email has NO live verification/password reset link.
  let html = renderEmailHtml(data);
  let text = renderPlainText(data);
  if (mode === "test") {
    html = html.replace(/<a href="\{\{ACTION_URL\}\}"[^>]*>[\s\S]*?<\/a>/,TEST_PILL);
    text = text.replace(/: \{\{ACTION_URL\}\}/,": [TEST ONLY — no action link]");
    if (html.includes('href="{{ACTION_URL}}"') || text.includes("{{ACTION_URL}}"))
      throw new Error("Test message contains a live-looking action placeholder.");
  } else {
    // Firebase created this URL, not an editor or HTTP caller.
    // Text and HTML get distinct escaping. Literal ampersands in URLs need HTML entities.
    html = html.replace('href="{{ACTION_URL}}"','href="'+escapeHtml(vars.ACTION_URL)+'"');
    text = text.replace("{{ACTION_URL}}", vars.ACTION_URL);
  }
  if (/\{\{[A-Z_]+\}\}/.test(subject + text + html))
    throw new Error("An unresolved template placeholder remains.");
  return {
    to:account.email.trim(),
    subject,
    html: mode === "test" ? html.replace("</body>","<p style=\"text-align:center;font-size:12px;color:#803d43\">This is a private test message from Big LWA Mailroom.</p></body>") : html,
    text,
    headers:{"X-BigLWA-Mailroom":mode==="test"?"test":"transactional"}
  };
}
