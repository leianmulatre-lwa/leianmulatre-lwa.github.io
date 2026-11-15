import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const roles=read('community-profile-roles-20261114.js');
const css=read('community-profile-roles-20261114.css');
const policyCss=read('policy-standalone-repair-20261114.css');
const room=read('module-pages.js');

function setup(){
 const data=new Map(),listeners={};
 let identity={uid:'member-one'},publicView=false;
 const storage={
  getItem:k=>data.get(k)??null,
  setItem:(k,v)=>data.set(k,String(v))
 };
 const win={__biglwaIdentity:identity,__biglwaPublicStorageView:false,
  addEventListener:(key,fn)=>{listeners[key]=fn}};
 const doc={readyState:'loading',
  documentElement:{classList:{contains:()=>publicView}},
  querySelector:()=>null,getElementById:()=>null,
  addEventListener:(key,fn)=>{listeners[key]=fn},
  dispatchEvent(event){listeners[event.type]?.(event)}
 };
 const sandbox={window:win,document:doc,localStorage:storage,sessionStorage:storage,
  requestAnimationFrame:()=>1,MutationObserver:class{observe(){}},
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},
  console,Math,Date,String,Array,Set,JSON};
 vm.runInNewContext(roles,sandbox,{timeout:2000});
 return {api:win.BigLWACommunityProfile,win,data,setIdentity:uid=>{identity={uid};win.__biglwaIdentity=identity},setPublic:view=>{publicView=view;win.__biglwaPublicStorageView=view}};
}

test('Community roles are account-scoped private preferences and cannot leak to visitors',()=>{
 const e=setup(),a=e.api;
 assert.equal(a.isReady(),false);
 assert.match(a.missing(),/community role/);
 let saved=a.save({roles:['Student','Artist'],age:'18–24',location:'California',showRoles:true});
 assert.equal(saved.ok,true);
 assert.equal(a.isReady(),true);
 assert.equal(a.canUseLounge(),true);
 assert.equal(a.get().location,'California');
 assert.equal(e.data.has('biglwaCommunityProfileV2:member-one'),true);
 e.setIdentity('member-two');
 assert.equal(a.isReady(),false);
 assert.deepEqual(Array.from(a.get().roles),[]);
 e.setPublic(true);
 assert.equal(a.save({roles:['Student'],age:'25–34',location:'USA'}).ok,false);
 assert.equal(a.isReady(),false);
});

test('Community access requires a role, age band and broad location; minors are not sent to unmoderated lounges',()=>{
 const e=setup(),a=e.api;
 assert.equal(a.save({roles:[],age:'18–24',location:'California'}).ok,false);
 assert.equal(a.save({roles:['Artist'],age:'',location:'California'}).ok,false);
 assert.equal(a.save({roles:['Artist'],age:'18–24',location:' '}).ok,false);
 assert.equal(a.save({roles:['Artist'],age:'Under 18',location:'Ontario'}).ok,true);
 assert.equal(a.isReady(),true);
 assert.equal(a.canUseLounge(),false);
 assert.equal(a.save({roles:['Artist','Student','Developer','Other'],age:'25–34',location:'Ontario'}).ok,false);
 assert.deepEqual(Array.from(a.get().roles),['Artist']);
});

test('Legacy device roles migrate without silently granting access to incomplete profiles',()=>{
 const e=setup();
 e.data.set('biglwaRoomRolesV1:member-one',JSON.stringify({roles:['Student'],age:'18–24'}));
 assert.deepEqual(Array.from(e.api.get().roles),['Student']);
 assert.equal(e.api.get().age,'18–24');
 assert.equal(e.api.isReady(),false,'Missing region means entry remains gated');
});

test('Editor is in the profile banner and contains age/location privacy labels, no Room role panel',()=>{
 assert.match(roles,/const details=document\.querySelector\('#profileDetailsEditor'\)/);
 assert.match(roles,/biglwaCommunityRoleBadges/);
 assert.match(roles,/profile-copy/);
 assert.match(roles,/Age range \(private\)/);
 assert.match(roles,/Broad location \(private\)/);
 assert.match(roles,/Do not share an address/);
 assert.match(roles,/biglwa:new-account-created/);
 assert.match(roles,/biglwaCommunityOnboardV1:/);
 assert.doesNotMatch(room,/id="roomRolePanel"/);
 assert.doesNotMatch(room,/id="roomRoleForm"/);
 assert.match(room,/BigLWACommunityProfile\?\.isReady\?\.\(\)/);
 assert.match(room,/profileReady&&\(mode==='room'\|\|loungeReady\)/);
 assert.match(css,/html\.biglwa-preview-mode #studioApp #biglwaCommunityRoleBadges/);
 assert.match(css,/body\.night-mode #studioApp \.biglwa-community-field/);
});

test('Every live Studio shell includes the editor and onboarding marker; the module is cache-busted',()=>{
 for(const file of ['index.html','studio/index.html','404.html','live-studio-shell.html']){
  const s=read(file);
  assert.match(s,/community-profile-roles-20261114\.js\?v=profile-onboarding-1/,file);
  assert.match(s,/community-profile-roles-20261114\.css\?v=profile-onboarding-1/,file);
  assert.match(s,/communityprofile=20261114-v1/,file);
  assert.match(s,/biglwaCommunityOnboardV1:/,file);
  assert(s.indexOf('ui-coherence.js?v=')<s.indexOf('community-profile-roles-20261114.js'),file+' loads after original profile UI');
 }
});

test('Standalone important pages import the stitched crest and responsive common shell',()=>{
 for(const path of ['privacy/index.html','terms/index.html','rights/index.html','affidavit/index.html']){
  const s=read(path);
  assert.match(s,/stitched-crest\.css\?v=20261114-policy-mask-fix-1/,path);
  assert.match(s,/policy-standalone-repair-20261114\.css\?v=20261114-important-layout-1/,path);
  assert.match(s,/<main[\s>]/,path);
 }
 assert.match(read('stitched-crest.css'),/:root\{--biglwa-stitched-crest-mask:url\("data:image\/png;base64,/);
 assert.match(policyCss,/width:min\(100%,1180px\)!important/);
 assert.match(policyCss,/grid-template-columns:minmax\(0,1fr\)!important/);
 assert.match(policyCss,/mask-image:var\(--biglwa-stitched-crest-mask,none\)!important/);
 assert.doesNotMatch(policyCss,/display:block!important;background:#171514/);
});
