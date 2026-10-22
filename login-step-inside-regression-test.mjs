import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('jsdom');
const assert=require('node:assert/strict');
const fs=require('node:fs'),zlib=require('node:zlib');
const read=file=>fs.readFileSync(new URL('./'+file,import.meta.url),'utf8');
const legacy=zlib.gunzipSync(Buffer.from([1,2,3,4,5].map(i=>read('site-'+i+'.txt')).join(''),'base64')).toString('utf8');
const index=read('index.html');
// Replay the production Name/username HTML replacements, not a hand-written login fixture.
const start=index.indexOf('// Account setup needs both a real/display name');
const end=index.indexOf('// Retire intermediate legacy frames',start);
assert(start>=0 && end>start,'Actual startup signup patch exists');
const fragment=index.slice(start,end);
const generated=new Function('html',fragment+'\nreturn html;')(legacy);
const dom=new JSDOM(generated.replace(/<script\\b[^>]*>[\\s\\S]*?<\\/script>/gi,''),{
 url:'https://biglwa.com/',runScripts:'outside-only'
});
const d=dom.window.document,form=d.querySelector('#loginCard');
const name=d.querySelector('#loginRealName'),username=d.querySelector('#loginUsername');
const email=d.querySelector('#loginEmail'),password=d.querySelector('#loginPassword');
const submit=d.querySelector('#loginSubmit');
assert(form && name && username && email && password && submit,'Real login form and its inputs exist');
assert.equal(submit.form,form,'Step Inside is a REAL form submit, not a fake button');
assert.equal(submit.type,'submit');
email.value='test@example.com';password.value='valid-test-password';
assert.equal(name.value,'');
assert.equal(name.required,false,'Name is not required when hidden on Sign In');
assert.equal(form.checkValidity(),true,'Valid credentials must not be blocked by hidden signup Name');
let submitted=0;
form.addEventListener('submit',event=>{event.preventDefault();submitted++});
submit.click();
assert.equal(submitted,1,'Clicking Step Inside must dispatch an actual form submit event');
assert(generated.includes('loginUsername.required = creating; if(loginRealName) loginRealName.required = creating;'),
 'Production mode-switch toggles Name and username requirements only in Create Account');
name.required=true;username.required=true;
assert.equal(form.checkValidity(),false,'Create Account requires both the display name and username');
name.value='Demo User';username.value='demouser';
assert.equal(form.checkValidity(),true,'A completed Create Account form can submit');
submit.click();
assert.equal(submitted,2,'Account creation retains working submit behavior');
console.log('PASS Step Inside: original source form button dispatches native submit with valid credentials');
console.log('PASS Sign in: hidden Name field never blocks submit');
console.log('PASS Create account: display name and username required only in create mode');
