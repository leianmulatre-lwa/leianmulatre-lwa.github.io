/* Reviewed snapshots only. Freeform drafts must never become authentication
 * email content just because someone clicked Save draft. */
import {createHash} from "node:crypto";
import {FIELD_LIMITS} from "../../developer/mailroom/templates.js";

export const LIVE_MAIL_TYPES=Object.freeze(["verify","reset"]);
const FIELDS=Object.freeze(Object.keys(FIELD_LIMITS));
export function validateLiveCopy(id,input) {
  if(!LIVE_MAIL_TYPES.includes(id))throw new Error("Unsupported live authentication message");
  if(!input || typeof input!=="object" || Array.isArray(input))throw new Error("Missing letter");
  const copy={};
  for(const key of FIELDS) {
    const value=input[key];
    if(typeof value!=="string" || !value.trim() || value.length>FIELD_LIMITS[key])
      throw new Error("Invalid Mailroom field: "+key);
    if(["subject","preheader","greeting","buttonText","closing","signature"].includes(key) &&
      /[\r\n\u0000-\u001f\u007f]/.test(value))
      throw new Error("Control characters are not allowed in header and single-line fields");
    const unknown=[...value.matchAll(/\{\{([A-Z_]+)\}\}/g)].map(m=>m[1])
      .filter(v=>v!=="DISPLAY_NAME");
    if(unknown.length)throw new Error("Unsupported live Mailroom variable: "+unknown[0]);
    copy[key]=value;
  }
  return copy;
}
export function publicationDigest(id,revision,copy) {
  if(!Number.isSafeInteger(revision)||revision<1)throw new Error("Invalid saved revision");
  return createHash("sha256").update(JSON.stringify({
    id,revision,copy:validateLiveCopy(id,copy)
  })).digest("hex");
}
export function planPublication({id,draft,adminUid}) {
  if(typeof adminUid!=="string"||!adminUid.trim())throw new Error("Missing approving admin");
  const revision=draft?.revision;
  const copy=validateLiveCopy(id,draft);
  const digest=publicationDigest(id,revision,copy);
  return {schema:1,type:id,sourceRevision:revision,sha256:digest,
    copy,publishedBy:adminUid,status:"published"};
}
export function requireApprovedCopy(id,published) {
  if(!published || published.schema!==1 || published.status!=="published" ||
    published.type!==id || typeof published.publishedBy!=="string" || !published.publishedBy.trim())
    throw new Error("No approved Mailroom publication");
  const copy=validateLiveCopy(id,published.copy);
  if(publicationDigest(id,published.sourceRevision,copy)!==published.sha256)
    throw new Error("Mailroom published revision hash mismatch");
  return copy;
}
