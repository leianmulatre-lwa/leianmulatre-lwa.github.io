import assert from "node:assert/strict";
import test from "node:test";
import {getDefaultTemplate} from "../../../developer/mailroom/templates.js";
import {planPublication,requireApprovedCopy} from "../published.mjs";
import {createApprovedAuthDelivery} from "../approved-delivery.mjs";

const user={uid:"one",email:"member@example.com",emailVerified:false,disabled:false,displayName:"Mina"};
const verifyLink="https://biglwa.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=TESTNOTREAL&apiKey=TEST";
const resetLink="https://biglwa.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=TESTNOTREAL&apiKey=TEST";
const draft=(id,revision=3)=>({...getDefaultTemplate(id),revision});
test("publications are revision-hashed, typed and immutable snapshots",()=>{
 const doc=planPublication({id:"verify",draft:draft("verify"),adminUid:"dev"});
 assert.equal(doc.sourceRevision,3);
 assert.equal(doc.status,"published");
 assert.equal(doc.copy.subject,getDefaultTemplate("verify").subject);
 assert.match(doc.sha256,/^[0-9a-f]{64}$/);
 assert.equal(requireApprovedCopy("verify",doc).subject,doc.copy.subject);
 assert.throws(()=>requireApprovedCopy("reset",doc),/approved/);
 assert.throws(()=>requireApprovedCopy("verify",{...doc,copy:{...doc.copy,subject:"changed"}}),/hash mismatch/);
 assert.throws(()=>planPublication({id:"verify",draft:{...draft("verify"),revision:0},adminUid:"dev"}),/revision/);
});
test("unsafe variables, blank copy and control characters are rejected before approval",()=>{
 assert.throws(()=>planPublication({id:"reset",draft:{...draft("reset"),body:"Send to {{OLD_EMAIL}}"},adminUid:"dev"}),/variable/);
 assert.throws(()=>planPublication({id:"reset",draft:{...draft("reset"),subject:"Bad\nBcc: hello@example.com"},adminUid:"dev"}),/Control/);
 assert.throws(()=>planPublication({id:"mfa",draft:draft("mfa"),adminUid:"dev"}),/Unsupported/);
 assert.throws(()=>planPublication({id:"verify",draft:{...draft("verify"),greeting:""},adminUid:"dev"}),/Invalid/);
});
test("real authentication delivery is disabled by default and never uses raw drafts",async()=>{
 const sent=[],links=[];
 const auth={
  getUser:async()=>user,
  generateEmailVerificationLink:async()=>{links.push("verify");return verifyLink},
  generatePasswordResetLink:async()=>{links.push("reset");return resetLink}
 };
 const published=planPublication({id:"verify",draft:{...draft("verify"),body:"A custom saved message for {{DISPLAY_NAME}}."},adminUid:"dev"});
 const deps={auth,loadProfile:async()=>({name:"Mina"}),
  loadPublishedTemplate:async id=>id==="verify"?published:null,
  sendMail:async mail=>{sent.push(mail);return {accepted:true}}};
 const disabled=createApprovedAuthDelivery(deps);
 await assert.rejects(()=>disabled({uid:"one",type:"verify"}),/disabled/);
 assert.equal(links.length,0);
 const enabled=createApprovedAuthDelivery({...deps,enabled:true});
 await assert.rejects(()=>enabled({uid:"one",type:"reset"}),/approved/);
 assert.equal(links.length,0);
 const ok=await enabled({uid:"one",type:"verify"});
 assert.equal(ok.status,"accepted_by_smtp");
 assert.equal(links.length,1);
 assert.equal(sent.length,1);
 assert.equal(sent[0].to,user.email);
 assert.match(sent[0].html,/A custom saved message for Mina/);
 assert.match(sent[0].html,/oobCode=TESTNOTREAL/);
 assert.ok(!sent[0].html.includes("{{ACTION_URL}}"));
 await assert.rejects(()=>enabled({uid:"one",type:"mfa"}),/Unsupported/);
});
test("published copy change rejects before generating action link",async()=>{
 let generated=0;
 const auth={getUser:async()=>user,
  generateEmailVerificationLink:async()=>{generated++;return verifyLink},
  generatePasswordResetLink:async()=>{generated++;return resetLink}};
 const doc=planPublication({id:"verify",draft:draft("verify"),adminUid:"dev"});
 const s=createApprovedAuthDelivery({auth,enabled:true,loadProfile:async()=>({}),
   loadPublishedTemplate:async()=>({...doc,sha256:"forged"}),
   sendMail:async()=>{throw new Error("Should never send")}});
 await assert.rejects(()=>s({uid:"one",type:"verify"}),/hash mismatch/);
 assert.equal(generated,0);
});
