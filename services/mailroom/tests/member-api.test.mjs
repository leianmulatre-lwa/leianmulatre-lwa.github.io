import assert from "node:assert/strict";
import test from "node:test";
import {createMemberAuthApi} from "../member-api.mjs";
import {nextRateLimitState} from "../rate-limit.mjs";

const account={
  uid:"member-123",email:"member@example.com",emailVerified:false,disabled:false,
  providerData:[{providerId:"password"}]
};
const request=(overrides={})=>({
  method:"POST",path:"/v1/auth/email-action",origin:"https://biglwa.com",
  authorization:"Bearer valid.token",body:{type:"verify"},...overrides
});
const build=(overrides={})=>createMemberAuthApi({
  verifyToken:async()=>({uid:account.uid,email:account.email}),
  getUser:async()=>account,
  deliverAuth:async({type})=>({status:type==="verify"?"accepted_by_smtp":"accepted_by_smtp"}),
  allowAttempt:async()=>true,enabled:true,...overrides
});

test("signed-in members can request only their own verification or password reset email",async()=>{
  const delivered=[];
  const api=build({deliverAuth:async event=>{delivered.push(event);return {status:"accepted_by_smtp"};}});
  for(const type of ["verify","reset"]){
    const response=await api(request({body:{type}}));
    assert.equal(response.status,202);
    assert.deepEqual(response.body,{status:"accepted_by_smtp",kind:type});
  }
  assert.deepEqual(delivered,[
    {uid:"member-123",type:"verify"},{uid:"member-123",type:"reset"}
  ]);
});

test("member endpoint rejects foreign origins, missing auth, extra input, and mismatched accounts",async()=>{
  const api=build();
  assert.equal((await api(request({origin:"https://evil.example"}))).status,403);
  assert.equal((await api(request({authorization:""}))).status,401);
  assert.equal((await api(request({body:{type:"reset",email:"victim@example.com"}}))).status,400);
  assert.equal((await api(request({body:{type:"mfa"}}))).status,400);
  assert.equal((await build({getUser:async()=>({...account,email:"other@example.com"})})(request())).status,403);
});

test("member delivery remains gated, rate limited, and password-provider aware",async()=>{
  assert.equal((await build({enabled:false})(request())).status,503);
  assert.equal((await build({allowAttempt:async()=>false})(request())).status,429);
  assert.equal((await build({getUser:async()=>({...account,providerData:[{providerId:"google.com"}]})})(
    request({body:{type:"reset"}}))).status,400);
  assert.equal((await build({deliverAuth:async()=>{throw new Error("private failure");}})(request())).body.error,
    "mailroom_service_unavailable");
});

test("verification short-circuits for an already verified account",async()=>{
  let delivered=false;
  const api=build({
    getUser:async()=>({...account,emailVerified:true}),
    deliverAuth:async()=>{delivered=true;return {status:"accepted_by_smtp"};}
  });
  const response=await api(request());
  assert.equal(response.status,200);
  assert.deepEqual(response.body,{status:"already_verified",kind:"verify"});
  assert.equal(delivered,false);
});

test("durable limiter retains only the active window and blocks the fourth request",()=>{
  const minute=60_000,now=20*minute;
  const cleaned=nextRateLimitState([now-16*minute,now-minute],now);
  assert.deepEqual(cleaned,{allowed:true,attempts:[now-minute,now]});
  const blocked=nextRateLimitState([now-3*minute,now-2*minute,now-minute],now);
  assert.equal(blocked.allowed,false);
  assert.equal(blocked.attempts.length,3);
});
