import assert from "node:assert/strict";
import test from "node:test";
import {requestMailroomAuthEmail,MAILROOM_API_ORIGIN} from "./mailroom-auth-client.js";

const user={getIdToken:async()=>"member.token"};
test("Mailroom browser bridge sends only an authenticated action type",async()=>{
  let captured;
  const result=await requestMailroomAuthEmail(user,"verify",{fetchImpl:async(url,init)=>{
    captured={url:String(url),init};
    return {ok:true,status:202,json:async()=>({status:"accepted_by_smtp"})};
  }});
  assert.equal(captured.url,MAILROOM_API_ORIGIN+"/v1/auth/email-action");
  assert.equal(captured.init.headers.Authorization,"Bearer member.token");
  assert.deepEqual(JSON.parse(captured.init.body),{type:"verify"});
  assert.deepEqual(result,{fallback:false,status:"accepted_by_smtp"});
});
test("Mailroom bridge falls back only while service is unavailable",async()=>{
  for(const status of [404,500,502,503,530]){
    const result=await requestMailroomAuthEmail(user,"reset",{
      fetchImpl:async()=>({ok:false,status})
    });
    assert.equal(result.fallback,true);
  }
  assert.equal((await requestMailroomAuthEmail(user,"reset",{
    fetchImpl:async()=>{throw new Error("offline");}
  })).fallback,true);
  await assert.rejects(()=>requestMailroomAuthEmail(user,"reset",{
    fetchImpl:async()=>({ok:false,status:429})
  }),/Too many/);
});
test("Mailroom bridge rejects unsupported actions and insecure origins",async()=>{
  await assert.rejects(()=>requestMailroomAuthEmail(user,"mfa"),/Unsupported/);
  await assert.rejects(()=>requestMailroomAuthEmail(user,"verify",{
    origin:"http://mailroom.biglwa.com"
  }),/HTTPS/);
});
