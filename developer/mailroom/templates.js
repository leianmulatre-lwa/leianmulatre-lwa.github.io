/* Big LWA Mailroom: plain-text editable copy, escaped HTML output. No sending logic. */
export const TEMPLATE_IDS = Object.freeze(["verify", "reset", "email-change", "mfa"]);
export const FIELD_LIMITS = Object.freeze({
  subject: 160, preheader: 220, greeting: 160, body: 8000,
  buttonText: 100, closing: 80, signature: 180
});
const BASE = {
  verify: {
    subject: "Psst, bookini... your world is waiting 🤎",
    preheader: "One little step before we pull back the curtains.",
    greeting: "Hey, bookini! 🤎",
    body: "Look who found their way to our little corner of the internet. Welcome to Big LWA, where your people, ideas, sounds, and self can finally have a place to call home. All the little pieces of you, even the ones you haven't discovered yet.\n\nBefore we pull back the curtains, there's just one teeny-tiny thing left to do. Verify your email below, and we'll see you on the other side!\n\nDidn't sign up? No worries. You can safely ignore this little love note.",
    buttonText: "Verify your email", closing: "Warmly,", signature: "L’wazi 🤎 | Big LWA"
  },
  reset: {
    subject: "Lost your key, bookini? 🗝️🤎",
    preheader: "Let's get you back to your little corner of the internet.",
    greeting: "Hey there! 🤎",
    body: "Now, what did we do with that password? Don't worry, even the best of us lose our keys sometimes. We received a request to reset the password for your Big LWA account, and I'm here to help you find your way back.\n\nFollow the link below to choose a new password. Your little corner of the internet is right where you left it, memories, creations, and all.\n\nDidn't request this? You can ignore this email. Your password won't change unless the reset is completed. Take care of yourself (and your passwords, please).",
    buttonText: "Get a new key", closing: "Warmly,", signature: "L’wazi 🤎 | Big LWA"
  },
  "email-change": {
    subject: "New email, who dis? 🤎",
    preheader: "A little update from your corner of the internet.",
    greeting: "Hey there! 🤎",
    body: "Just popping into your inbox with a little update: the email address connected to your Big LWA account has changed.\n\nPrevious email: {{OLD_EMAIL}}\nNew email: {{NEW_EMAIL}}\n\nIf that was you, lovely! There's nothing more to do. But if you're thinking, “Now hold on, L’wazi, I didn't do that...” then we've got something to sort out.\n\nYour digital home should always belong to you. No unexpected guests with the keys, thank you very much.",
    buttonText: "Undo this change", closing: "Warmly,", signature: "L’wazi 🤎 | Big LWA"
  },
  mfa: {
    subject: "Your little world just got safer 🔐🤎",
    preheader: "An extra layer of protection for your account.",
    greeting: "Hey there! 🤎",
    body: "Ooh, look at you, keeping things secure! A new sign-in verification method has been added to your Big LWA account. Think of it as another lock on your little digital home, because your creations and conversations deserve a safe place to exist.\n\nIf you made this change, you're all set! But if you didn't, we don't like surprises of that kind. Use the link below to undo this change and help secure your account.\n\nYour world is yours, and nobody should be wandering around it uninvited. Stay lovely, stay safe, and stay you.",
    buttonText: "Undo this security change", closing: "Warmly,", signature: "L’wazi 🤎 | Big LWA"
  }
};
export function getDefaultTemplate(id) {
  if (!TEMPLATE_IDS.includes(id)) throw new Error("Unknown email template");
  return { ...BASE[id] };
}
export function normalizeTemplate(id, input) {
  const clean = getDefaultTemplate(id);
  for (const field of Object.keys(FIELD_LIMITS)) {
    if (input && typeof input[field] === "string") clean[field] = input[field].slice(0, FIELD_LIMITS[field]);
  }
  return clean;
}
export function validateTemplate(t) {
  return Object.keys(FIELD_LIMITS).every(key =>
    typeof t[key] === "string" && t[key].trim().length > 0 && t[key].length <= FIELD_LIMITS[key]);
}
export function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
const SAMPLE = Object.freeze({
  DISPLAY_NAME: "bookini", OLD_EMAIL: "old@example.com",
  NEW_EMAIL: "new@example.com", ACTION_URL: "{{ACTION_URL}}"
});
export function interpolatePreview(value) {
  return String(value).replace(/\{\{(DISPLAY_NAME|OLD_EMAIL|NEW_EMAIL|ACTION_URL)\}\}/g,
    (_, key) => SAMPLE[key]);
}
function paragraphs(text, preview) {
  return (preview ? interpolatePreview(text) : text).split(/\n\s*\n/).filter(Boolean).map(part =>
    '<p style="margin:0 0 12px;line-height:1.48;font-size:15px;color:#362924">' +
    escapeHtml(part).replace(/\n/g, "<br>") + "</p>").join("");
}
export function renderEmailHtml(template, options = {}) {
  const t = template;
  if (!validateTemplate(t)) throw new Error("Fill in all template fields before exporting.");
  // Never allow an editable template to set a destination; delivery backend owns the action URL.
  const target = options.preview ? "#preview-only" : "{{ACTION_URL}}";
  const display = value => options.preview ? interpolatePreview(value) : value;
  return [
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>',
    '<body style="margin:0;padding:0;background:#f1ebe3;font-family:Arial,Helvetica,sans-serif;color:#362924">',
    '<div style="display:none;font-size:1px;color:#f1ebe3;max-height:0;overflow:hidden;opacity:0">',
      escapeHtml(display(t.preheader)), '</div>',
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1ebe3;padding:28px 12px"><tr><td align="center">',
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;background:#fffaf4;border:1px solid #c9ada0">',
    '<tr><td style="height:12px;background:#7a292b"></td></tr>',
    '<tr><td style="padding:24px 26px 14px;text-align:center;border-bottom:1px dashed #d7c4b6">',
    '<div style="font-weight:800;letter-spacing:3px;font-size:18px;color:#7a292b">BIG LWA</div>',
    '<div style="font-size:10px;letter-spacing:2px;color:#8b7566;padding-top:5px">PEOPLE · IDEAS · SOUNDS · SELF</div>',
    '</td></tr><tr><td style="padding:25px 28px 19px">',
    '<h1 style="font-size:21px;line-height:1.3;margin:0 0 17px;color:#5e2427">',
      escapeHtml(display(t.subject)), '</h1>',
    '<p style="margin:0 0 12px;line-height:1.48;font-weight:bold;color:#362924;font-size:15px">',
      escapeHtml(display(t.greeting)), '</p>',
    paragraphs(t.body, !!options.preview),
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 21px"><tr><td style="background:#682d2b;border:1px solid #4b1f1e">',
    '<a href="', escapeHtml(target), '" style="display:inline-block;padding:11px 18px;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px">',
      escapeHtml(t.buttonText), '</a></td></tr></table>',
    '<p style="margin:0;font-size:14px;line-height:1.45;color:#362924">',
      escapeHtml(t.closing), '<br><strong>', escapeHtml(t.signature),
      '</strong><br><em style="font-size:12px;color:#806b61">Your friend inside the machine.</em></p>',
    '</td></tr><tr><td style="background:#f7eee6;padding:13px 22px;text-align:center;border-top:1px solid #e4d4c6">',
    '<span style="color:#806b61;font-size:11px">A bigger you. Brighter worlds. · biglwa.com</span>',
    '</td></tr></table></td></tr></table></body></html>'
  ].join("");
}
export function renderPlainText(template) {
  if (!validateTemplate(template)) throw new Error("Fill in all template fields before exporting.");
  return [template.subject, "", template.greeting,
    "", template.body, "",
    template.buttonText + ": {{ACTION_URL}}", "",
    template.closing, template.signature, "Your friend inside the machine.",
    "", "BIG LWA · People · Ideas · Sounds · Self"].join("\n");
}
