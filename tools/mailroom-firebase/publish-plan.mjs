/* Firebase Mailroom publication plan. This module is pure and safe to test offline.
 * Only three leaf fields of one template are changed. SMTP credentials,
 * callback URL, sender, DNS verification and unrelated Auth settings are never included.
 */
import {createHash} from "node:crypto";
import {buildFirebaseNativeTemplate, FIREBASE_READY_IDS} from "../../developer/mailroom/firebase-native.js";

const TEMPLATE_FIELDS = Object.freeze(["subject","body","bodyFormat"]);
export function planPublish(id,draft,config) {
  if(!FIREBASE_READY_IDS.includes(id))throw new Error("Unsupported Firebase template type.");
  if(!draft||!Number.isSafeInteger(draft.revision)||draft.revision<1)
    throw new Error("No saved Firestore Mailroom revision found.");
  if(!config || config.name!=="projects/biglwa/config")
    throw new Error("Firebase project does not match biglwa.");
  if(config.notification?.sendEmail?.method!=="CUSTOM_SMTP")
    throw new Error("Refusing to change templates while Firebase custom SMTP is not enabled.");
  const ready=buildFirebaseNativeTemplate(id,draft);
  const target=ready.target;
  const saved=config.notification?.sendEmail?.[target];
  if(!saved||typeof saved!=="object")throw new Error("Current Firebase template unavailable. Cannot verify before publishing.");
  const desired={subject:ready.subject,body:ready.body,bodyFormat:ready.bodyFormat};
  const fingerprint=createHash("sha256").update(JSON.stringify({
    id,revision:draft.revision,desired
  })).digest("hex");
  return {
    id,revision:draft.revision,target,
    fingerprint,
    changedFields:TEMPLATE_FIELDS.filter(k=>saved[k]!==desired[k]),
    updateMask:TEMPLATE_FIELDS.map(k=>"notification.sendEmail."+target+"."+k).join(","),
    request:{name:"projects/biglwa/config",notification:{sendEmail:{[target]:desired}}},
    // Deliberately omit all SMTP configuration and its password.
    previous:{subject:saved.subject??"",body:saved.body??"",bodyFormat:saved.bodyFormat??"BODY_FORMAT_UNSPECIFIED"}
  };
}
export function verifyPublishConfirmation(plan,{project,revision,fingerprint}) {
  if(project!=="biglwa")throw new Error("Explicit project confirmation required.");
  if(!Number.isSafeInteger(revision)||revision!==plan.revision)
    throw new Error("Draft revision changed or was not confirmed.");
  if(fingerprint!==plan.fingerprint)
    throw new Error("Review fingerprint changed. Re-run preview and confirm.");
  return true;
}
