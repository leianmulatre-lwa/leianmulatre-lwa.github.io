/* BIG LWA community profile · private self-declared age/location, owner role badges.
   Not age verification. Does not geolocate or publish sensitive fields.
   Account-isolated local preferences until a permissioned cloud profile API exists. */
(()=>{
 'use strict';
 if(window.BigLWACommunityProfile)return;
 const ROLES=['Student','Researcher','Creative','Freelancer','Educator','Artist','Organizer','Developer','Music maker','Other'];
 const AGES=['Under 18','18–24','25–34','35–44','45+'];
 const uid=()=>String(window.BigLWAAccountStorage?.uid||window.__biglwaIdentity?.uid||'').trim();
 const owner=()=>Boolean(uid())&&!document.documentElement.classList.contains('biglwa-preview-mode')&&!window.__biglwaPublicStorageView;
 const key=()=>uid()?'biglwaCommunityProfileV2:'+uid():'';
 const clean=v=>String(v||'').trim().slice(0,72);
 const parse=v=>{try{return JSON.parse(v||'null')}catch{return null}};
 const get=()=>{
  if(!owner())return {roles:[],age:'',location:'',showRoles:false};
  let data=parse(localStorage.getItem(key()));
  if(!data){
   const legacy=parse(localStorage.getItem('biglwaRoomRolesV1:'+uid()))||{};
   data={roles:legacy.roles||[],age:legacy.age||'',location:'',showRoles:true};
  }
  return {
   roles:Array.isArray(data.roles)?[...new Set(data.roles.filter(r=>ROLES.includes(r)))].slice(0,3):[],
   age:AGES.includes(data.age)?data.age:'',
   location:clean(data.location),
   showRoles:data.showRoles!==false
  };
 };
 const isReady=()=>{
  const d=get();return owner()&&d.roles.length>0&&AGES.includes(d.age)&&d.location.length>=2;
 };
 const canUseLounge=()=>isReady()&&get().age!=='Under 18';
 const missing=()=>{
  if(!owner())return 'Sign in to complete your community profile.';
  const d=get(),parts=[];
  if(!d.roles.length)parts.push('a community role');
  if(!d.age)parts.push('an age range');
  if(d.location.length<2)parts.push('a broad location');
  return parts.length?'Add '+parts.join(', ')+'.':'Community profile complete.';
 };
 const el=(tag,cls,text)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!=null)node.textContent=text;
  return node;
 };
 const save=(data)=>{
  if(!owner())return {ok:false,message:'Sign in to update your profile.'};
  const roles=Array.isArray(data.roles)?[...new Set(data.roles)]:[];
  if(roles.length<1||roles.length>3||roles.some(r=>!ROLES.includes(r)))
   return {ok:false,message:'Choose between one and three community roles.'};
  if(!AGES.includes(data.age))return {ok:false,message:'Choose an age range before entering community spaces.'};
  const location=clean(data.location);
  if(location.length<2)return {ok:false,message:'Enter a broad location (city/region or country). Do not share an address.'};
  try{localStorage.setItem(key(),JSON.stringify({roles,age:data.age,location,
   showRoles:data.showRoles!==false,updatedAt:Date.now()}));}
  catch{return {ok:false,message:'Could not save on this browser. Check storage permissions.'}}
  document.dispatchEvent(new CustomEvent('biglwa:community-profile-updated',{detail:{ready:true}}));
  renderBadges();
  return {ok:true,message:'Saved. Roles appear on your own profile banner. Age and location remain private on this browser.'};
 };
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
   const bio=parent.querySelector('.bio');
   if(bio)bio.insertAdjacentElement('afterend',row);
   else parent.append(row);
  }
  const data=get();
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
  if(section&&section.dataset.uid===uid())return;
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
  const button=el('button','biglwa-community-save','Save community profile');button.type='submit';
  actions.append(button);form.append(actions,status);
  form.addEventListener('submit',event=>{
   event.preventDefault();
   const selected=[...form.querySelectorAll('input[name="communityRole"]:checked')].map(node=>node.value);
   const result=save({roles:selected,age:ageSelect.value,location:locationInput.value,showRoles:visible.checked});
   status.textContent=result.message;
   status.dataset.state=result.ok?'saved':'error';
  });
  section.append(form);details.append(section);
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
 window.BigLWACommunityProfile=Object.freeze({get,save,isReady,canUseLounge,missing,openEditor,refresh:schedule});
})();
