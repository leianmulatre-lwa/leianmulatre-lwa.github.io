/* BIG LWA community profile · private self-declared age/location, owner role badges.
   Not age verification. Does not geolocate or publish sensitive fields.
   Data is stored in the signed-in account's private Firestore profile;
   previous UID-scoped browser entries are migration drafts only. */
(()=>{
 'use strict';
 if(window.BigLWACommunityProfile)return;
 const ROLES=['Student','Researcher','Creative','Freelancer','Educator','Artist','Organizer','Developer','Music maker','Producer','Writer','Director','Creator','Stylist','Founder','Other'];
 const AGES=['Under 18','18–24','25–34','35–44','45+'];
 const FIREBASE_CONFIG={apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
  authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',
  appId:'1:83232670555:web:e04927b20458390b3b507e'};
 const SDK='https://www.gstatic.com/firebasejs/12.18.0/';
 const empty=()=>({roles:[],age:'',location:'',showRoles:false});
 const uid=()=>String(window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid||'').trim();
 const owner=()=>Boolean(uid())&&!document.documentElement.classList.contains('biglwa-preview-mode')&&!window.__biglwaPublicStorageView;
 const clean=value=>String(value||'').trim().slice(0,72);
 const parse=value=>{try{return JSON.parse(value||'null')}catch{return null}};
 const normalize=raw=>{
  const d=raw&&typeof raw==='object'?raw:{};
  return {roles:Array.isArray(d.roles)?[...new Set(d.roles.filter(role=>ROLES.includes(role)))].slice(0,3):[],
   age:AGES.includes(d.age)?d.age:'',location:clean(d.location),showRoles:d.showRoles!==false};
 };
 // Only an owner-verified, UID-scoped legacy browser draft can be offered for
 // migration. It never grants Room/Lounge access and is deleted after a verified
 // cloud save. Unscoped shared-device keys are never read or claimed.
 const legacyDraftFor=id=>{
  try{
   const own=parse(localStorage.getItem('biglwaCommunityProfileV2:'+id));
   if(own)return normalize(own);
   const old=parse(localStorage.getItem('biglwaRoomRolesV1:'+id));
   return old?normalize({...old,location:'',showRoles:true}):null;
  }catch{return null}
 };
 let currentUid='',confirmed=null,draft=null,cloudState='loading',cloudError='';
 let sdkPromise=null,loadPromise=null,generation=0,saving=false;
 const syncIdentity=()=>{
  const id=owner()?uid():'';
  if(id!==currentUid){
   currentUid=id;confirmed=null;draft=null;cloudState='loading';
   cloudError='';loadPromise=null;generation++;
  }
  return id;
 };
 const get=()=>{
  const id=syncIdentity();
  return id?normalize(confirmed||draft):empty();
 };
 const isReady=()=>{
  const id=syncIdentity(),d=get();
  return Boolean(id&&confirmed&&cloudState==='ready'&&d.roles.length&&d.age&&d.location.length>=2);
 };
 const canUseLounge=()=>isReady()&&get().age!=='Under 18';
 const missing=()=>{
  if(!syncIdentity())return 'Sign in to complete your community profile.';
  if(cloudState==='loading')return 'Loading your community profile from your account…';
  if(cloudState==='error')return 'Account sync unavailable: '+cloudError+'. Retry loading or try saving again.';
  const d=get(),parts=[];
  if(!d.roles.length)parts.push('a community role');
  if(!d.age)parts.push('an age range');
  if(d.location.length<2)parts.push('a broad location');
  if(!confirmed&&draft)return 'Previously saved on this browser only. Review and select Save to account to sync.';
  return parts.length?'Add '+parts.join(', ')+'.':'Saved to your BIG LWA account.';
 };
 const el=(tag,cls,text)=>{
  const node=document.createElement(tag);if(cls)node.className=cls;
  if(text!=null)node.textContent=text;return node;
 };
 async function firebase(){
  if(!sdkPromise){
   sdkPromise=Promise.all([
    import(SDK+'firebase-app.js'),import(SDK+'firebase-auth.js'),
    import(SDK+'firebase-firestore.js')
   ]).then(([appSdk,authSdk,fs])=>{
    const app=appSdk.getApps()[0]||appSdk.initializeApp(FIREBASE_CONFIG);
    return {auth:authSdk.getAuth(app),db:fs.getFirestore(app),fs};
   }).catch(error=>{sdkPromise=null;throw error});
  }
  return sdkPromise;
 }
 const announce=()=>{
  renderBadges();syncEditor();
  document.dispatchEvent(new CustomEvent('biglwa:community-profile-updated',
   {detail:{ready:isReady(),cloud:cloudState==='ready'}}));
 };
 async function load({force=false}={}){
  const id=syncIdentity();
  if(!id)return null;
  if(loadPromise&&!force)return loadPromise;
  if(confirmed&&cloudState==='ready'&&!force)return get();
  const token=++generation;cloudState='loading';cloudError='';
  const task=(async()=>{
   const {auth,db,fs}=await firebase();
   await auth.authStateReady();
   if(auth.currentUser?.uid!==id)throw Error('The signed-in account changed');
   // Never mistake the local Firestore cache for a successful server restore.
   const snapshot=await fs.getDocFromServer(fs.doc(db,'users',id));
   if(token!==generation||syncIdentity()!==id||auth.currentUser?.uid!==id)return null;
   const raw=snapshot.exists()?snapshot.data()?.communityProfile:null;
   confirmed=raw&&typeof raw==='object'?normalize(raw):null;
   draft=confirmed?null:legacyDraftFor(id);
   cloudState='ready';cloudError='';
   announce();
   return get();
  })().catch(error=>{
   if(token===generation&&syncIdentity()===id){
    cloudState='error';cloudError=String(error?.message||'Unable to read Firebase').slice(0,140);
    announce();
   }
   return null;
  }).finally(()=>{if(token===generation)loadPromise=null});
  loadPromise=task;
  return task;
 }
 async function save(data){
  const id=syncIdentity();
  if(!id)return {ok:false,message:'Sign in to save Community Roles to your account.'};
  if(saving)return {ok:false,message:'Community profile is already saving.'};
  const roles=Array.isArray(data.roles)?[...new Set(data.roles)]:[];
  if(roles.length<1||roles.length>3||roles.some(role=>!ROLES.includes(role)))
   return {ok:false,message:'Choose between one and three community roles.'};
  if(!AGES.includes(data.age))return {ok:false,message:'Choose an age range before entering community spaces.'};
  const location=clean(data.location);
  if(location.length<2)return {ok:false,message:'Enter a broad location (city/region or country). Do not share an address.'};
  const payload={roles,age:data.age,location,showRoles:data.showRoles!==false};
  saving=true;
  // Invalidate an older account read so it cannot overwrite the new save.
  // Clear its promise as well, otherwise an old pending load could block retry.
  const token=++generation;
  loadPromise=null;
  try{
   const {auth,db,fs}=await firebase();
   await auth.authStateReady();
   if(auth.currentUser?.uid!==id||syncIdentity()!==id)throw Error('The signed-in account changed.');
   const ref=fs.doc(db,'users',id);
   await fs.setDoc(ref,{communityProfile:{...payload,updatedAt:fs.serverTimestamp()},
    updatedAt:fs.serverTimestamp()},{merge:true});
   // Only server-acknowledged content gets the "saved" label. No success on
   // local cache write, offline queue, or a rejected permission.
   const snapshot=await fs.getDocFromServer(ref);
   const actual=snapshot.exists()?normalize(snapshot.data()?.communityProfile):empty();
   if(actual.roles.join('|')!==payload.roles.join('|')||actual.age!==payload.age||
       actual.location!==payload.location||actual.showRoles!==payload.showRoles)
    throw Error('Could not verify your saved settings on the server.');
   if(token!==generation||auth.currentUser?.uid!==id||syncIdentity()!==id)
    throw Error('Account changed before save confirmation.');
   confirmed=actual;draft=null;cloudState='ready';cloudError='';
   try{
    localStorage.removeItem('biglwaCommunityProfileV2:'+id);
    localStorage.removeItem('biglwaRoomRolesV1:'+id);
   }catch{}
   announce();
   return {ok:true,message:'Saved to your BIG LWA account. Roles are on your banner; age and broad location are private.'};
  }catch(error){
   if(token===generation&&syncIdentity()===id){
    cloudState=confirmed?'ready':'error';
    cloudError=String(error?.message||'Account save failed').slice(0,140);
   }
   return {ok:false,message:'Could not save to your account: '+String(error?.message||'Connection unavailable')+'. Your changes have not been confirmed on the server.'};
  }finally{saving=false}
 }
 function syncEditor(){
  const section=document.getElementById('biglwaCommunityProfileEditor');
  if(!section||section.dataset.uid!==currentUid)return;
  const status=section.querySelector('.biglwa-community-status');
  const retry=section.querySelector('[data-community-retry]');
  if(retry)retry.hidden=cloudState!=='error';
  if(section.dataset.dirty==='1'){
   if(status&&cloudState==='error')status.textContent=missing();
   return;
  }
  const data=get();
  section.querySelectorAll('input[name="communityRole"]').forEach(input=>{
   input.checked=data.roles.includes(input.value);
  });
  const age=section.querySelector('[name="communityAge"]');
  const location=section.querySelector('[name="communityLocation"]');
  const visible=section.querySelector('[name="showRoles"]');
  if(age)age.value=data.age;
  if(location)location.value=data.location;
  if(visible)visible.checked=data.showRoles;
  if(status)status.textContent=missing();
 }
 function renderBadges(){
  const card=document.querySelector('#studioApp .profile-card');
  if(!card)return;
  let row=card.querySelector('#biglwaCommunityRoleBadges');
  if(!owner()){
   row?.remove();return;
  }
  const parent=card.querySelector('.profile-copy')||card;
  if(!row){
   row=el('div','biglwa-community-badges');row.id='biglwaCommunityRoleBadges';
   row.setAttribute('aria-label','My community roles');
   const bio=parent.querySelector('.biglwa-profile-role-statline')||parent.querySelector('.bio');
   if(bio)bio.insertAdjacentElement('afterend',row);
   else parent.append(row);
  }
  const data=confirmed&&cloudState==='ready'?get():empty();
  row.replaceChildren();
  if(!data.roles.length||!data.showRoles){
   const help=el('button','biglwa-community-edit-mini','+ Add community roles');
   help.type='button';help.addEventListener('click',openEditor);row.append(help);
  }else{
   data.roles.forEach(role=>row.append(el('span','biglwa-community-badge',role)));
   const edit=el('button','biglwa-community-edit-mini','Edit roles');
   edit.type='button';edit.addEventListener('click',openEditor);row.append(edit);
  }
 }
 function renderEditor(){
  if(!owner())return;
  const details=document.querySelector('#profileDetailsEditor');
  if(!details)return;
  let section=details.querySelector('#biglwaCommunityProfileEditor');
  if(section&&section.dataset.uid===uid()){syncEditor();return;}
  if(section)section.remove();
  section=el('section','biglwa-community-profile-editor');
  section.id='biglwaCommunityProfileEditor';section.dataset.uid=uid();
  section.append(el('h3','','Community roles'));
  section.append(el('p','biglwa-community-hint','Choose up to three roles for your profile. Age and broad location are private, self-declared settings for community access—not verified identity or public badges.'));
  const form=el('form','biglwa-community-form');form.id='biglwaCommunityRoleForm';
  const rolesField=el('fieldset','biglwa-community-fieldset');
  const legend=el('legend','','Community roles (choose 1–3)');rolesField.append(legend);
  const choices=el('div','biglwa-community-role-choices');
  const data=get();
  ROLES.forEach(role=>{
   const label=el('label','biglwa-community-role-option');
   const input=el('input');input.type='checkbox';input.name='communityRole';input.value=role;
   input.checked=data.roles.includes(role);label.append(input,document.createTextNode(' '+role));
   choices.append(label);
  });
  rolesField.append(choices);form.append(rolesField);
  const ageLabel=el('label','biglwa-community-select-label','Age range (private)');
  const ageSelect=el('select','biglwa-community-field');ageSelect.name='communityAge';ageSelect.required=true;
  const placeholder=el('option','','Select age range');placeholder.value='';ageSelect.append(placeholder);
  AGES.forEach(band=>{
   const option=el('option','',band);option.value=band;ageSelect.append(option);
  });ageSelect.value=data.age;ageLabel.append(ageSelect);form.append(ageLabel);
  const locationLabel=el('label','biglwa-community-select-label','Broad location (private)');
  const locationInput=el('input','biglwa-community-field');
  locationInput.type='text';locationInput.name='communityLocation';locationInput.maxLength=72;
  locationInput.placeholder='City / region or country — never a street address';
  locationInput.autocomplete='off';locationInput.value=data.location;
  locationInput.required=true;locationLabel.append(locationInput);form.append(locationLabel);
  const publicLabel=el('label','biglwa-community-visibility');
  const visible=el('input');visible.type='checkbox';visible.name='showRoles';
  visible.checked=data.showRoles;publicLabel.append(visible,document.createTextNode(' Show role badges on my profile banner (age and location never appear)'));
  form.append(publicLabel);
  const status=el('p','biglwa-community-status',missing());status.setAttribute('role','status');
  const actions=el('div','biglwa-community-actions');
  const button=el('button','biglwa-community-save','Save to my account');button.type='submit';
  const retry=el('button','biglwa-community-edit-mini','Retry loading account data');
  retry.type='button';retry.dataset.communityRetry='';retry.hidden=true;
  retry.addEventListener('click',()=>load({force:true}));
  actions.append(button,retry);form.append(actions,status);
  const markDirty=()=>{section.dataset.dirty='1'};
  form.addEventListener('input',markDirty);
  form.addEventListener('change',markDirty);
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   const savingUid=currentUid;
   const selected=[...form.querySelectorAll('input[name="communityRole"]:checked')].map(node=>node.value);
   button.disabled=true;
   status.textContent='Saving to your BIG LWA account…';
   status.dataset.state='saving';
   const result=await save({roles:selected,age:ageSelect.value,location:locationInput.value,showRoles:visible.checked});
   if(currentUid!==savingUid||!section.isConnected)return;
   status.textContent=result.message;
   status.dataset.state=result.ok?'saved':'error';
   if(result.ok){section.dataset.dirty='';syncEditor();}
   button.disabled=false;
  });
  section.append(form);details.append(section);
  syncEditor();
 }
 function openEditor(){
  if(!owner())return false;
  const back=document.getElementById('moduleBack');
  const workspace=document.querySelector('#studioApp #moduleWorkspace');
  if(workspace&&!workspace.hidden&&workspace.dataset.moduleKey==='rooms')back?.click();
  const button=document.getElementById('editProfileBtn');
  if(!button)return false;
  if(!document.querySelector('#studioApp .profile-card.profile-is-editing'))button.click();
  renderEditor();
  document.querySelector('#profileEditorTabs [data-profile-editor-tab="profile"]')?.click();
  const editor=document.getElementById('biglwaCommunityProfileEditor');
  if(editor)editor.scrollIntoView({block:'nearest',behavior:'auto'});
  return Boolean(editor);
 }
 let scheduled=false;
 const sync=()=>{
  scheduled=false;
  if(!owner()){document.getElementById('biglwaCommunityRoleBadges')?.remove();return}
  renderBadges();renderEditor();
  if(cloudState==='loading'&&!loadPromise)load();
  const flag='biglwaCommunityOnboardV1:'+uid();
  if(sessionStorage.getItem(flag)==='new'){
   const button=document.getElementById('editProfileBtn');
   if(button){
    sessionStorage.setItem(flag,'shown');
    openEditor();
   }
  }
 };
 const schedule=()=>{
  if(scheduled)return;scheduled=true;requestAnimationFrame(sync);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
 else schedule();
 document.addEventListener('biglwa:session-verified',schedule);
 window.addEventListener('biglwa:session-verified',schedule);
 window.addEventListener('biglwa:new-account-created',event=>{
  const member=String(event.detail?.uid||'');
  if(member)sessionStorage.setItem('biglwaCommunityOnboardV1:'+member,'new');
  schedule();
 });
 document.addEventListener('biglwa:module-open',schedule);
 const observer=new MutationObserver(records=>{
  if(records.some(record=>
   [...record.addedNodes].some(node=>node.nodeType===1&&(
    node.id==='studioApp'||node.id==='profileDetailsEditor'||
    node.id==='editProfileBtn'||node.matches?.('.profile-card,#wallpaperPanel')))))schedule();
 });
 observer.observe(document.documentElement,{childList:true,subtree:true});
 window.BigLWACommunityProfile=Object.freeze({get,save,load,isReady,canUseLounge,missing,openEditor,refresh:schedule,
  get syncStatus(){return cloudState},get cloudUid(){return currentUid}});
 window.addEventListener('biglwa:identity-updated',schedule);
 window.addEventListener('biglwa:user-directory-ready',schedule);
})();
