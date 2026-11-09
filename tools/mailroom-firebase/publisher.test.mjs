import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {getDefaultTemplate} from "../../developer/mailroom/templates.js";
import {FIREBASE_READY_IDS,buildFirebaseNativeTemplate} from "../../developer/mailroom/firebase-native.js";
import {planPublish,verifyPublishConfirmation} from "./publish-plan.mjs";
import {formatProviderFailure} from "./provider-error.mjs";

const firebase={
  name:"projects/biglwa/config",
  notification:{sendEmail:{
    method:"CUSTOM_SMTP",
    smtp:{host:"smtp.titan.email",username:"lwazi@biglwa.com",password:"MUST_NOT_APPEAR"},
    verifyEmailTemplate:{subject:"Old verification",body:"<p>Old verification body</p>",bodyFormat:"HTML"},
    resetPasswordTemplate:{subject:"Old reset",body:"<p>Old reset body</p>",bodyFormat:"HTML"}
  }}
};
test("verification and reset use Firebase native HTML format and an actual Firebase action token",()=>{
 assert.deepEqual(FIREBASE_READY_IDS,["verify","reset"]);
 for(const id of FIREBASE_READY_IDS) {
  const exported=buildFirebaseNativeTemplate(id,getDefaultTemplate(id));
  assert.equal(exported.bodyFormat,"HTML");
  assert.match(exported.body,/<table role="presentation"/);
  assert.match(exported.body,/href="%LINK%"/);
  assert.ok(!exported.body.includes("{{ACTION_URL}}"));
  assert.match(exported.body,/L’wazi 🤎/);
  assert.equal((exported.body.match(/href="%LINK%"/g)||[]).length,1);
 }
});
test("converts profile name token to Firebase Auth displayName without inventing an old email value",()=>{
 const t=getDefaultTemplate("verify");
 t.greeting="Hey, {{DISPLAY_NAME}}! 🤎";
 const exported=buildFirebaseNativeTemplate("verify",t);
 assert.match(exported.body,/Hey, %DISPLAY_NAME%!/);
 t.greeting="{{OLD_EMAIL}}";
 assert.throws(()=>buildFirebaseNativeTemplate("verify",t),/OLD_EMAIL/);
 t.greeting="{{DOES_NOT_EXIST}}";
 assert.throws(()=>buildFirebaseNativeTemplate("verify",t),/Unsupported variable/);
});
test("email change and MFA are fail closed until recovery-event mappings are reviewed",()=>{
 for(const id of ["email-change","mfa"]){
  assert.throws(()=>buildFirebaseNativeTemplate(id,getDefaultTemplate(id)),/security-event mapping/);
 }
});
test("draft markup is escaped in native Firebase HTML; CTA remains controlled",()=>{
 const t=getDefaultTemplate("reset");
 t.body="Please <script>alert(1)</script> confirm.";
 t.subject="<script>wrong</script>";
 const e=buildFirebaseNativeTemplate("reset",t);
 assert.ok(!e.body.includes("<script>"));
 assert.match(e.body,/&lt;script&gt;/);
 assert.equal(e.body.match(/href=/g)?.length,1);
});
test("plan is exact and never includes SMTP credentials or other Auth configuration",()=>{
 const d={...getDefaultTemplate("reset"),revision:4,updatedBy:"account123"};
 const p=planPublish("reset",d,firebase);
 assert.equal(p.target,"resetPasswordTemplate");
 assert.equal(p.revision,4);
 assert.deepEqual(Object.keys(p.request.notification.sendEmail),["resetPasswordTemplate"]);
 assert.ok(!Object.hasOwn(p.request,"name"));
 assert.deepEqual(Object.keys(p.request.notification.sendEmail.resetPasswordTemplate).sort(),["body","bodyFormat","subject"]);
 assert.equal(p.updateMask,"notification.sendEmail.resetPasswordTemplate.subject,notification.sendEmail.resetPasswordTemplate.body,notification.sendEmail.resetPasswordTemplate.bodyFormat");
 assert.ok(!JSON.stringify(p.request).includes("MUST_NOT_APPEAR"));
 assert.ok(!JSON.stringify(p).includes("smtp.titan.email"));
 assert.ok(!JSON.stringify(p).includes("MUST_NOT_APPEAR"));
 assert.match(p.fingerprint,/^[0-9a-f]{64}$/);
});
test("numeric Identity Toolkit resource name is accepted only for the Big LWA project",()=>{
 const d={...getDefaultTemplate("verify"),revision:3,updatedBy:"account123"};
 const numeric={...firebase,name:"projects/83232670555/config"};
 const p=planPublish("verify",d,numeric);
 assert.ok(!Object.hasOwn(p.request,"name"));
 assert.throws(()=>planPublish("verify",d,{...numeric,name:"projects/83232670556/config"}),/does not match/);
});
test("publishing refuses wrong project, missing SMTP, missing saved revision and stale fingerprint",()=>{
 const d={...getDefaultTemplate("verify"),revision:2};
 for(const bad of [
  {...firebase,name:"projects/other/config"},
  {name:"projects/biglwa/config",notification:{sendEmail:{...firebase.notification.sendEmail,method:"DEFAULT"}}},
  {name:"projects/biglwa/config",notification:{sendEmail:{method:"CUSTOM_SMTP"}}}
 ]) assert.throws(()=>planPublish("verify",d,bad));
 assert.throws(()=>planPublish("verify",getDefaultTemplate("verify"),firebase),/revision/);
 const p=planPublish("verify",d,firebase);
 assert.equal(verifyPublishConfirmation(p,{project:"biglwa",revision:2,fingerprint:p.fingerprint}),true);
 assert.throws(()=>verifyPublishConfirmation(p,{project:"another",revision:2,fingerprint:p.fingerprint}));
 assert.throws(()=>verifyPublishConfirmation(p,{project:"biglwa",revision:3,fingerprint:p.fingerprint}));
 assert.throws(()=>verifyPublishConfirmation(p,{project:"biglwa",revision:2,fingerprint:"old-hash"}));
});
test("page keeps HTML export separate from administrative publishing and protects credentials",()=>{
 const app=readFileSync(new URL("../../developer/mailroom/app.js",import.meta.url),"utf8");
 const page=readFileSync(new URL("../../developer/mailroom/index.html",import.meta.url),"utf8");
 const publisher=readFileSync(new URL("./publish.mjs",import.meta.url),"utf8");
 assert.match(app,/firebaseHtmlButton/);
 assert.match(page,/firebaseJsonButton/);
 assert.match(publisher,/firebase-admin\/firestore/);
 assert.match(publisher,/updateMask=/);
 assert.match(publisher,/--confirm-fingerprint=/);
 assert.match(readFileSync(new URL("./publish-plan.mjs",import.meta.url),"utf8"),/CUSTOM_SMTP/);
 assert.ok(!app.includes("smtpPassword"));
 assert.ok(!page.includes('type="password"'));
});
test("provider diagnostics expose validation reason while redacting private values",()=>{
 const message=formatProviderFailure("PATCH",400,{error:{
  status:"INVALID_ARGUMENT",
  message:'Invalid email template body <p>secret</p> for https://private.example/path and owner@example.com'
 }});
 assert.match(message,/400; INVALID_ARGUMENT/);
 assert.match(message,/Invalid email template body/);
 assert.ok(!message.includes("secret"));
 assert.ok(!message.includes("private.example"));
 assert.ok(!message.includes("owner@example.com"));
 assert.equal(
  formatProviderFailure("PATCH",500,{error:{status:"INTERNAL",message:"opaque provider data"}}),
  "Identity Toolkit PATCH failed (500; INTERNAL). Provider response details were withheld."
 );
});
