import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {assessDns} from "../check-dns.mjs";

const base={
  a:["203.0.113.80"],ptr:["mail.biglwa.com"],
  mx:[
    {priority:10,exchange:"mx1.titan.email"},
    {priority:20,exchange:"mx2.titan.email"}
  ],
  spf:["v=spf1 include:_spf.firebasemail.com ip4:203.0.113.80 ~all"],
  dmarc:["v=DMARC1;p=none;sp=none"],
  dkim:["v=DKIM1; k=rsa; p=MOCKPUBLICKEY"]
};
const cfg={host:"mail.biglwa.com",ip:"203.0.113.80",selector:"mail2026"};

test("healthy DNS snapshot passes structural checks before network tests",()=>{
 const r=assessDns(base,cfg);
 assert.deepEqual(r.errors,[]);
 assert.equal(r.ready,true);
 assert.match(r.passed.join(";"),/Titan MX inbound routing preserved/);
 assert.match(r.passed.join(";"),/Exactly one apex SPF/);
});
test("changing incoming Titan MX is a hard failure",()=>{
 for(const mx of [[],[{priority:10,exchange:"mail.biglwa.com"}], [{priority:10,exchange:"mx1.titan.email"}]]){
  const r=assessDns({...base,mx},cfg);
  assert.equal(r.ready,false);
  assert.match(r.errors.join(";"),/Titan MX/);
 }
});
test("two SPF records are invalid even if one covers each sender",()=>{
 const r=assessDns({...base,spf:[
  "v=spf1 include:_spf.firebasemail.com ~all",
  "v=spf1 ip4:203.0.113.80 ~all"
 ]},cfg);
 assert.equal(r.ready,false);
 assert.match(r.errors.join(";"),/ONE SPF/);
});
test("warns until the sending IP and real DKIM selector are configured",()=>{
 let r=assessDns({...base,spf:["v=spf1 include:_spf.firebasemail.com ~all"],dkim:[]},cfg);
 assert.equal(r.ready,false);
 assert.match(r.warnings.join(";"),/not yet been included/);
 assert.match(r.warnings.join(";"),/not published/);
 r=assessDns(base,{...cfg,selector:""});
 assert.equal(r.ready,false);
 assert.match(r.warnings.join(";"),/MAIL_DKIM_SELECTOR/);
});
test("mismatched host, no reverse DNS and invalid DKIM selector fail",()=>{
 const r=assessDns({...base,a:["203.0.113.90"],ptr:[]},{...cfg,selector:"invalid selector@"});
 assert.equal(r.ready,false);
 assert.ok(r.errors.some(x=>x.includes("DNS-only A")));
 assert.ok(r.errors.some(x=>x.includes("PTR")));
 assert.ok(r.errors.some(x=>x.includes("invalid format")));
});
test("compose keeps Stalwart data and no inbound mail listener",()=>{
 const file=readFileSync(new URL("../docker-compose.yml",import.meta.url),"utf8");
 assert.match(file,/image:\s*stalwartlabs\/stalwart:v1/);
 assert.match(file,/stalwart-etc:\/etc\/stalwart/);
 assert.match(file,/stalwart-data:\/var\/lib\/stalwart/);
 assert.match(file,/127\.0\.0\.1:8080:8080/);
 assert.match(file,/465:465/);
 assert.match(file,/443:443/);
 for(const port of ["25:25","993:993","995:995","4190:4190"])
  assert.equal(file.includes('"' +port+'"'),false,port);
});
test("runbook preserves Titan and Firebase and demands manual DNS",()=>{
 const doc=readFileSync(new URL("../README.md",import.meta.url),"utf8").toLowerCase();
 for(const value of ["mx1.titan.email","mx2.titan.email","_spf.firebasemail.com","manual dns","outbound tcp/25","ptr/reverse dns","ssl/tls","not yet","@biglwa.com"])
  assert.ok(doc.includes(value),value);
});

test("Windows local sandbox only publishes localhost ports and separate storage",()=>{
 const file=readFileSync(new URL("../docker-compose.local.yml",import.meta.url),"utf8");
 assert.match(file,/image:\s*stalwartlabs\/stalwart:v1/);
 const mappings=[...file.matchAll(/^\s+-\s+"([^"]+)"\s*#/gm)].map(m=>m[1]);
 assert.deepEqual(mappings.sort(),["127.0.0.1:1465:465","127.0.0.1:8080:8080","127.0.0.1:8443:443"].sort());
 assert.ok(!file.includes('"25:25"'));
 assert.ok(!file.includes('"465:465"'));
 assert.match(file,/biglwa-mail-local-etc/);
 assert.match(file,/biglwa-mail-local-data/);
});
test("Windows guide keeps Firebase and DNS unchanged",()=>{
 const text=readFileSync(new URL("../LOCAL-WINDOWS.md",import.meta.url),"utf8");
 assert.match(text,/docker compose -f infra\/mail\/docker-compose\.local\.yml up -d/);
 assert.match(text,/http:\/\/127\.0\.0\.1:8080/);
 assert.match(text,/Do NOT point Firebase at localhost/);
 assert.match(text,/Titan inboxes/);
});
