/* Firebase-native Auth email export, derived from the existing Mailroom letter.
 * No send access, SMTP credentials, or Firebase administrative permissions.
 * Publish support deliberately limited to verification and password reset:
 * account recovery / MFA have different security event semantics.
 */
import {getDefaultTemplate, normalizeTemplate, validateTemplate, renderEmailHtml} from "./templates.js";

export const FIREBASE_READY_IDS = Object.freeze(["verify", "reset"]);
export const FIREBASE_TARGETS = Object.freeze({
  verify: "verifyEmailTemplate",
  reset: "resetPasswordTemplate"
});
const TOKENS = Object.freeze({
  DISPLAY_NAME: "%DISPLAY_NAME%",
  NEW_EMAIL: "%NEW_EMAIL%",
  ACTION_URL: "%LINK%"
});
function migrateVariables(value, id) {
  return String(value).replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (key === "OLD_EMAIL") {
      // Firebase does not provide an explicit OLD_EMAIL variable.
      // Never mislabel the recipient email as an old account email.
      throw new Error("Firebase cannot safely replace {{OLD_EMAIL}}. Use the custom backend for that message.");
    }
    if (!Object.hasOwn(TOKENS,key)) throw new Error("Unsupported variable: {{" + key + "}}");
    if (key === "NEW_EMAIL" && id !== "email-change")
      throw new Error("{{NEW_EMAIL}} is not supported for " + id + " messages.");
    return TOKENS[key];
  });
}
export function buildFirebaseNativeTemplate(id, input) {
  if (!FIREBASE_READY_IDS.includes(id))
    throw new Error("Firebase publishing is available for verification and password reset only. Email-change and MFA require a reviewed security-event mapping.");
  const data = input ? normalizeTemplate(id,input) : getDefaultTemplate(id);
  if (!validateTemplate(data)) throw new Error("Complete all template fields before preparing Firebase copy.");
  // The HTML is generated from escaped plaintext by the same renderer as the editor.
  // The *only* live link placeholder is a Firebase %LINK% in the CTA.
  const subject = migrateVariables(data.subject,id);
  let body = migrateVariables(renderEmailHtml(data),id);
  if (body.includes("{{") || /\{\{[A-Z_]+\}\}/.test(subject) ||
      body.includes("href=\"{{ACTION_URL}}\""))
    throw new Error("Unresolved Mailroom variables in the Firebase email.");
  const links = body.match(/href="%LINK%"/g) || [];
  if(links.length !== 1) throw new Error("Firebase email needs exactly one account action link.");
  return {
    target:FIREBASE_TARGETS[id],
    subject,
    body,
    bodyFormat:"HTML",
    senderNote:"Uses the existing Firebase SMTP sender; this export does not change it."
  };
}
export function previewFirebasePublish(id,template) {
  const ready=buildFirebaseNativeTemplate(id,template);
  return {id, subject:ready.subject, body:ready.body, bodyFormat:ready.bodyFormat};
}
