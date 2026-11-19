import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const original=read('community-profile-roles-20261114.js');
const roles=original
 .replaceAll("import(SDK+'firebase-app.js')","__mockImport('app')")
 .replaceAll("import(SDK+'firebase-auth.js')","__mockImport('auth')")
 .replaceAll("import(SDK+'firebase-firestore.js')","__mockImport('firestore')");
const css=read('community-profile-roles-20261114.css');
const policyCss=read('policy-standalone-repair-20261114.css');
const room=read('module-pages.js');

function setup({db=new Map(),uid='member-one',disk=new Map()}={}){
 const listener={},writes=[],reads=[],removed=[];
 const auth={currentUser:uid?{uid}:null,authStateReady:async()=>{}};
 let readError='',writeError='';
 let publicView=false;
 const storage={
  getItem:key=>disk.get(key)??null,
  setItem:(key,value)=>disk.set(key,String(value)),
  removeItem:key=>{removed.push(key);disk.delete(key)}
 };
 const win={__biglwaIdentity:uid?{uid}:null,__biglwaPublicStorageView:false,
  addEventListener:(key,fn)=>{listener[key]=fn}};
 win.parent=win;
 const doc={readyState:'loading',
  documentElement:{classList:{contains:()=>publicView}},
  querySelector:()=>null,getElementById:()=>null,
  addEventListener:(key,fn)=>{listener[key]=fn},
  dispatchEvent:event=>{listener[event.type]?.(event)}
 };
 const dbSdk={
  getFirestore:()=>({}),
  doc:(_,collection,id)=>{
   assert.equal(collection,'users','All community data must remain owner-only');
   return {collection,id};
  },
  serverTimestamp:()=>({timestamp:true}),
  async setDoc(ref,data,options){
   writes.push({uid:ref.id,data,options});
   if(writeError)throw Error(writeError);
   if(auth.currentUser?.uid!==ref.id)throw Error('permission-denied');
   const original=db.get(ref.id)||{};
   db.set(ref.id,{...original,...data});
  },
  async getDocFromServer(ref){
   reads.push(ref.id);
   if(readError)throw Error(readError);
   if(auth.currentUser?.uid!==ref.id)throw Error('permission-denied');
   const value=db.get(ref.id);
   return {exists:()=>value!==undefined,data:()=>value||{}};
  }
 };
 const sdk={
  app:{getApps:()=>[{}],initializeApp:()=>({})},
  auth:{getAuth:()=>auth},firestore:dbSdk
 };
 const sandbox={
  window:win,document:doc,localStorage:storage,sessionStorage:storage,
  __mockImport:async kind=>sdk[kind],
  requestAnimationFrame:()=>1,MutationObserver:class{observe(){}},
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},
  console,Math,Date,String,Array,Set,JSON,Promise
 };
 vm.runInNewContext(roles,sandbox,{timeout:3000});
 const changeUid=next=>{
  auth.currentUser=next?{uid:next}:null;
  win.__biglwaIdentity=next?{uid:next}:null;
 };
 return {api:win.BigLWACommunityProfile,db,auth,disk,reads,writes,removed,
  changeUid,setPublic:flag=>{publicView=flag;win.__biglwaPublicStorageView=flag},
  setReadError:error=>{readError=error},setWriteError:error=>{writeError=error},
  win,listener};
}
const profile={roles:['Student','Artist'],age:'18–24',location:'California',showRoles:true};

test('Roles save under signed-in Firestore users/{uid}, with server read-back, not localStorage',async()=>{
 const e=setup();e.db.set('member-one',{name:'Existing Member',bio:'Keep this'});
 await e.api.load();
 assert.equal(e.api.isReady(),false);
 const result=await e.api.save(profile);
 assert.equal(result.ok,true,result.message);
 assert.match(result.message,/Saved to your BIG LWA account/);
 assert.equal(e.writes.length,1);
 assert.equal(e.writes[0].uid,'member-one');
 assert.equal(e.writes[0].options.merge,true,'Profile write must preserve existing account fields');
 assert.equal(e.db.get('member-one').name,'Existing Member');
 assert.equal(e.db.get('member-one').bio,'Keep this');
 assert.deepEqual(Array.from(e.db.get('member-one').communityProfile.roles),['Student','Artist']);
 assert.equal(e.db.get('member-one').communityProfile.age,'18–24');
 assert.equal(e.db.get('member-one').communityProfile.location,'California');
 assert.equal(e.disk.has('biglwaCommunityProfileV2:member-one'),false,'No new browser-only saves');
 assert(e.reads.length>=2,'Save requires a confirmed server read-back');
 assert.equal(e.api.isReady(),true);
 assert.equal(e.api.canUseLounge(),true);
});

test('New device restores saved roles, age and region using the same authenticated UID',async()=>{
 const cloud=new Map();
 const first=setup({db:cloud});
 await first.api.load();
 assert.equal((await first.api.save(profile)).ok,true);
 const second=setup({db:cloud,disk:new Map()});
 const retrieved=await second.api.load();
 assert.deepEqual(Array.from(retrieved.roles),['Student','Artist']);
 assert.equal(retrieved.age,'18–24');
 assert.equal(retrieved.location,'California');
 assert.equal(second.api.syncStatus,'ready');
 assert.equal(second.api.isReady(),true);
 assert.equal(second.writes.length,0,'Restoring never publishes a new account write');
});

test('Switching accounts cannot see or change a previous account’s private community profile',async()=>{
 const e=setup();
 await e.api.load();
 await e.api.save(profile);
 e.changeUid('member-two');
 assert.equal(e.api.isReady(),false);
 assert.deepEqual(Array.from(e.api.get().roles),[]);
 await e.api.load();
 assert.equal(e.db.has('member-two'),false);
 assert.equal(e.api.isReady(),false);
 assert.equal((await e.api.save({roles:['Developer'],age:'Under 18',location:'Canada'})).ok,true);
 assert.deepEqual(Array.from(e.db.get('member-one').communityProfile.roles),['Student','Artist']);
 assert.equal(e.api.canUseLounge(),false);
 e.setPublic(true);
 assert.equal((await e.api.save(profile)).ok,false,'A visitor cannot modify saved private roles');
 assert.equal(e.api.isReady(),false);
});

test('Offline/denied writes never report success or grant new Room access',async()=>{
 const e=setup();
 await e.api.load();
 e.setWriteError('permission-denied');
 const failed=await e.api.save(profile);
 assert.equal(failed.ok,false);
 assert.match(failed.message,/Could not save to your account/);
 assert.equal(e.api.isReady(),false);
 assert.equal(e.db.has('member-one'),false);
 e.setWriteError('');
 assert.equal((await e.api.save(profile)).ok,true);
 assert.equal(e.api.isReady(),true);
});

test('Failed account restore reports an error, then a retry reads the server correctly',async()=>{
 const e=setup({db:new Map([['member-one',{communityProfile:profile}]])});
 e.setReadError('offline');
 assert.equal(await e.api.load(),null);
 assert.equal(e.api.syncStatus,'error');
 assert.equal(e.api.isReady(),false);
 assert.match(e.api.missing(),/Account sync unavailable/);
 e.setReadError('');
 assert.equal((await e.api.load({force:true})).location,'California');
 assert.equal(e.api.isReady(),true);
});

test('Older UID-specific browser settings become a draft, not account access; removed after cloud save',async()=>{
 const disk=new Map([['biglwaCommunityProfileV2:member-one',JSON.stringify(profile)]]);
 const e=setup({disk});
 await e.api.load();
 assert.deepEqual(Array.from(e.api.get().roles),['Student','Artist']);
 assert.equal(e.api.isReady(),false,'Local values cannot pass account-backed access gate');
 assert.match(e.api.missing(),/saved on this browser only/i);
 assert.equal((await e.api.save(e.api.get())).ok,true);
 assert.equal(e.api.isReady(),true);
 assert(!disk.has('biglwaCommunityProfileV2:member-one'));
 assert(e.removed.includes('biglwaRoomRolesV1:member-one'));
 const old=setup({disk:new Map([['biglwaRoomRolesV1:member-one',
  JSON.stringify({roles:['Artist'],age:'18–24'})]])});
 await old.api.load();
 assert.equal(old.api.get().location,'');
 assert.equal(old.api.isReady(),false,'No broad location means migration remains incomplete');
});

test('Invalid roles, age and location cannot be written to Firestore',async()=>{
 const e=setup();await e.api.load();
 for(const input of [
  {roles:[],age:'18–24',location:'USA'},
  {roles:['Artist'],age:'',location:'USA'},
  {roles:['Artist'],age:'Under 18',location:''},
  {roles:['Artist','Student','Developer','Other'],age:'25–34',location:'USA'}
 ])assert.equal((await e.api.save(input)).ok,false);
 assert.equal(e.writes.length,0);
});

test('UI awaits account save and role editor lives on Profile, not Room/Lounge',()=>{
 assert.match(original,/const details=document\.querySelector\('#profileDetailsEditor'\)/);
 assert.match(original,/button\.disabled=true/);
 assert.match(original,/const result=await save\(/);
 assert.match(original,/getDocFromServer/);
 assert.match(original,/setDoc\(ref,\{communityProfile:/);
 assert.match(original,/if\(auth\.currentUser\?\.uid!==id/);
 assert.match(original,/biglwa:community-profile-updated/);
 assert.match(room,/document\.addEventListener\('biglwa:community-profile-updated'/);
 assert.match(original,/Age range \(private\)/);
 assert.match(original,/Broad location \(private\)/);
 assert.match(original,/Do not share an address/);
 assert.doesNotMatch(room,/id="roomRolePanel"/);
 assert.match(room,/BigLWACommunityProfile\?\.isReady\?\.\(\)/);
 assert.match(css,/html\.biglwa-preview-mode #studioApp #biglwaCommunityRoleBadges/);
 assert.match(css,/body\.night-mode #studioApp \.biglwa-community-field/);
 assert.doesNotMatch(original,/localStorage\.setItem\(/,'No locally-only personal details save');
});

test('Every Studio entrypoint cache-busts account-backed roles and keeps signup onboarding',()=>{
 for(const file of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const s=read(file);
  assert.match(s,/community-profile-roles-20261114\.js\?v=account-cloud-save-v2/,file);
  assert.match(s,/community-profile-roles-20261114\.css\?v=profile-onboarding-1/,file);
  assert.match(s,/communityprofile=20261115-cloud-save-v2/,file);
  assert.match(s,/biglwaCommunityOnboardV1:/,file);
  assert(s.indexOf('ui-coherence.js?v=')<s.indexOf('community-profile-roles-20261114.js'),file);
 }
});

test('Rules protect account documents; policy discloses cloud persistence and sensitive fields',()=>{
 const rules=read('firestore.rules');
 assert.match(rules,/match \/users\/\{userId\} \{[\s\S]*?allow read, create, delete: if isOwner\(userId\)/);
 assert.match(rules,/allow update: if isOwner\(userId\)/);
 const privacy=read('privacy/index.html');
 assert.match(privacy,/Community profile and safety preferences/);
 assert.match(privacy,/owner-only Firebase account profile/);
 assert.match(privacy,/broad location/);
 assert.doesNotMatch(privacy,/these self-declared settings are currently stored locally/);
 for(const path of ['privacy/index.html','terms/index.html','rights/index.html','affidavit/index.html']){
  const s=read(path);
  assert.match(s,/stitched-crest\.css\?v=20261114-policy-mask-fix-1/);
  assert.match(s,/policy-standalone-repair-20261114\.css\?v=20261114-important-layout-1/);
  assert.match(s,/<main[\s>]/);
  assert.match(s,/<section class="policy-page[^"]*" id="[^"]+" aria-label="[^"]+">\s*<div class="policy-shell">\s*<header class="policy-top"><a class="login-brand" href="\/" aria-label="BIG LWA home"><span class="biglwa-policy-emblem" aria-hidden="true"><\/span><\/a><a class="policy-back" href="\/studio">/);
  assert.match(s,/<div class="window-lights" aria-hidden="true"><i class="window-light"><\/i><i class="window-light yellow"><\/i><i class="window-light green"><\/i><\/div>/);
 }
 assert.match(read('stitched-crest.css'),/:root\{--biglwa-stitched-crest-mask:url\("data:image\/png;base64,/);
 assert.match(policyCss,/mask-image:var\(--biglwa-stitched-crest-mask,none\)!important/);
});
