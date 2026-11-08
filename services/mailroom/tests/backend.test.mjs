import assert from "node:assert/strict";
import test from "node:test";
import {
  chooseDisplayName,mailGreeting,interpolate,verifyActionUrl,composeMessage
} from "../compose.mjs";
import {createMailroomApi,createRateLimiter} from "../api.mjs";
import {createAuthDelivery} from "../auth-delivery.mjs";

const developer={
  uid:"developer-123",email:"owner@biglwa.com",displayName:"Leian",
  emailVerified:true,disabled:false
};
const verifyLink="https://biglwa.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=SECRETTEST&apiKey=FAKE";
const resetLink="https://biglwa.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=SECRETTEST&apiKey=FAKE";

test("prefers actual member name and never pretends a username is their name",()=>{
  assert.equal(chooseDisplayName({displayName:"handle123"}, {usernameLower:"handle123"}),"bookini");
  assert.equal(chooseDisplayName({displayName:"Real Name"}, {name:"  Sasha   Jones  "}),"Sasha Jones");
  assert.equal(chooseDisplayName({displayName:"A@example.com"}, {}),"bookini");
  assert.equal(chooseDisplayName({displayName:"Mina",email:"a@b.com"},{}),"Mina");
  assert.equal(mailGreeting("bookini"),"Hey, bookini! 🤎");
  assert.equal(mailGreeting("Mina"),"Hey, Mina! 🤎");
});
test("strict placeholder replacement rejects unknown variables and missing data",()=>{
  assert.equal(interpolate("Hi {{DISPLAY_NAME}}",{DISPLAY_NAME:"Alex"}),"Hi Alex");
  assert.throws(()=>interpolate("{{SECRET}}",{SECRET:"value"}),/Unsupported/);
  assert.throws(()=>interpolate("{{NEW_EMAIL}}",{}),/Missing required/);
});
test("all four test letters are branded, non-actionable and sent only to account email",()=>{
  for(const id of ["verify","reset","email-change","mfa"]){
    const msg=composeMessage({id,account:developer,mode:"test"});
    assert.equal(msg.to,"owner@biglwa.com");
    assert.match(msg.subject,/^\[TEST — NO ACTION\]/);
    assert.ok(msg.html.includes("TEST PREVIEW — NO LIVE ACTION"));
    assert.ok(!msg.html.includes('href="{{ACTION_URL}}"'));
    assert.ok(!msg.html.includes("oobCode="));
    assert.ok(!msg.text.includes("{{ACTION_URL}}"));
    assert.ok(!msg.text.includes("SECRETTEST"));
  }
});
test("all user-controlled names and text are escaped in HTML and cannot create links",()=>{
  const msg=composeMessage({
    id:"verify",account:{email:"person@example.com",displayName:'<img src=x onerror="oops()">' },
    template:{body:"Hey {{DISPLAY_NAME}} & welcome. <script>alert(1)</script>",
      greeting:"Hi, {{DISPLAY_NAME}}!",subject:"Welcome {{DISPLAY_NAME}}"},
    mode:"test"
  });
  assert.ok(!msg.html.includes("<script>"));
  assert.ok(!msg.html.includes("<img src=x"));
  assert.ok(msg.html.includes("&lt;img src=x"));
  assert.ok(msg.html.includes("&lt;script&gt;"));
});
test("a real auth message uses only a validated Firebase action URL",()=>{
  const v=composeMessage({id:"verify",account:developer,mode:"auth",actionUrl:verifyLink});
  assert.equal(v.to,developer.email);
  assert.match(v.html,/href="https:\/\/biglwa\.firebaseapp\.com\/__\/auth\/action\?/);
  assert.match(v.html,/&amp;oobCode=/);
  assert.match(v.text,/oobCode=SECRETTEST/);
  assert.ok(!v.html.includes('href="{{ACTION_URL}}"'));
  assert.equal(verifyActionUrl(resetLink,"reset"),resetLink);
  assert.throws(()=>composeMessage({id:"email-change",account:developer,mode:"auth",actionUrl:verifyLink}),/Only verification/);
  for(const bad of [
    "http://biglwa.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=x&apiKey=y",
    "https://evil.com/__/auth/action?mode=verifyEmail&oobCode=x&apiKey=y",
    "https://biglwa.com.evil.com/__/auth/action?mode=verifyEmail&oobCode=x&apiKey=y",
    "https://biglwa.firebaseapp.com/not-auth?mode=verifyEmail&oobCode=x&apiKey=y",
    resetLink
  ]) assert.throws(()=>verifyActionUrl(bad,"verify"));
});
test("rejects invalid account addresses and never accepts arbitrary destination",()=>{
  assert.throws(()=>composeMessage({id:"verify",account:{email:"evil@example.com\nBCC: all@biglwa.com"}}));
  assert.throws(()=>composeMessage({id:"verify",account:{email:""}}));
  const msg=composeMessage({id:"verify",account:developer,mode:"test",to:"attacker@example.com"});
  assert.equal(msg.to,developer.email);
});
function harness(overrides={}) {
  const sent=[];
  const deps={
    enabled:true,
    verifyToken:async token=>token==="valid"?{uid:developer.uid,email:developer.email,email_verified:true}:null,
    getUser:async uid=>({...developer}),
    getAdmin:async()=>({active:true}),
    getProfile:async()=>({name:"Leian"}),
    getTemplate:async()=>null,
    sendMail:async letter=>{sent.push(letter);return {accepted:true}},
    ...overrides
  };
  const handle=createMailroomApi(deps);
  const request={method:"POST",path:"/v1/admin/test-email",origin:"https://biglwa.com",
    authorization:"Bearer valid",body:{templateId:"verify"}};
  return {handle,request,sent};
}
test("test API is closed unless the owner explicitly enables it",async()=>{
  const {handle,request}=harness({enabled:false});
  assert.equal((await handle(request)).status,503);
});
test("test API blocks untrusted origins, missing auth and injected recipient/URL",async()=>{
  const {handle,request,sent}=harness();
  assert.equal((await handle({...request,origin:"https://attacker.example"})).status,403);
  assert.equal((await handle({...request,authorization:""})).status,401);
  assert.equal((await handle({...request,body:{templateId:"verify",to:"victim@example.com"}})).status,400);
  assert.equal((await handle({...request,body:{templateId:"verify",actionUrl:verifyLink}})).status,400);
  assert.equal((await handle({...request,body:{templateId:"hijack"}})).status,400);
  assert.equal(sent.length,0);
});
test("server-side developer role and email verification are required",async()=>{
  for(const override of [
    {getAdmin:async()=>({active:false})},
    {getUser:async()=>({...developer,emailVerified:false})},
    {verifyToken:async()=>({uid:developer.uid,email:developer.email,email_verified:false})},
    {getUser:async()=>({...developer,email:"somebody@example.com"})},
    {getUser:async()=>({...developer,disabled:true})}
  ]){
    const {handle,request,sent}=harness(override);
    assert.equal((await handle(request)).status,403);
    assert.equal(sent.length,0);
  }
});
test("authorized developer may test only their own verified email and is rate-limited",async()=>{
  let clock=100000;
  const allowAttempt=createRateLimiter({max:2,windowMs:5000,now:()=>clock});
  const {handle,request,sent}=harness({allowAttempt});
  assert.equal((await handle(request)).status,202);
  assert.equal((await handle(request)).status,202);
  assert.equal((await handle(request)).status,429);
  assert.equal(sent.length,2);
  assert.equal(sent[0].to,developer.email);
  clock+=5500;
  assert.equal((await handle(request)).status,202);
});
test("auth delivery is strictly internal and disabled by default",async()=>{
  let sends=0;
  const auth={
    getUser:async()=>({...developer,emailVerified:false}),
    generateEmailVerificationLink:async()=>verifyLink,
    generatePasswordResetLink:async()=>resetLink
  };
  const deps={auth,loadProfile:async()=>({name:"Leian"}),sendMail:async()=>{sends++;return {accepted:true}}};
  const disabled=createAuthDelivery(deps);
  await assert.rejects(()=>disabled({uid:developer.uid,type:"verify"}),/disabled/);
  const enabled=createAuthDelivery({...deps,enabled:true});
  await assert.rejects(()=>enabled({uid:developer.uid,type:"mfa"}),/Unsupported/);
  assert.equal(sends,0);
  const outcome=await enabled({uid:developer.uid,type:"verify"});
  assert.equal(outcome.status,"accepted_by_smtp");
  assert.equal(sends,1);
  const outcome2=await enabled({uid:developer.uid,type:"reset"});
  assert.equal(outcome2.status,"accepted_by_smtp");
  assert.equal(sends,2);
});
