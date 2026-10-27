/* L'wazi welcome: first signup -> informed conduct check -> optional identity -> interests
   -> content preferences -> existing Studio tour.
   Identity/roots never drive recommendations; only explicitly selected interests do. */
(()=>{
 'use strict';
 if(window.BigLWALwaziWelcome)return;
 const APP={apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',appId:'1:83232670555:web:e04927b20458390b3b507e'};
 const LABELS=['Style & fashion','Music','Visual art','Photography','Film & television','Games','Books & literature','Writing & poetry','Politics & civic life','History','Education','Culture & heritage','Technology','Design','Beauty','Sports','Food','DIY & making','Comedy','Nature'];
 const ROOTS=['Haitian','Dominican','American','Taíno','West African','Yoruba','Igbo','Akan','Ewe','Fulani','Wolof','Manding','Ga','Hausa','Jamaican','Trinidadian','Barbadian','Bahamian','Guyanese','Cuban','Puerto Rican','Brazilian','Mexican','Colombian','Garifuna','Afro-Latino','African American','Nigerian','Ghanaian','Senegalese','Cameroonian','Ethiopian','Somali','South African','Kenyan','Filipino','Indian','Punjabi','Tamil','Vietnamese','Chinese','Korean','Japanese','Arab','Amazigh','Kurdish','Palestinian','Lebanese','Irish','Scottish','Romani','Ojibwe','Dakota','Cherokee','Navajo (Diné)','Maya','Quechua','Mapuche','Inuit','Sámi'];
 const SENS=['general','mature','permitted'];
 const blank=()=>({gender:'',pronouns:'',roots:[],interests:[],sensitivity:'general',complete:false});
 const $=(q,root=document)=>root.querySelector(q);
 const firstName=user=>{
  const raw=String(window.__biglwaIdentity?.name||user?.displayName||user?.email?.split('@')[0]||'friend').trim();
  return raw.replace(/^@/,'').split(/\s+/)[0].slice(0,35)||'friend';
 };
 let fbPromise,session=null,dialog=null,step=0,data=blank(),mode='signup',busy=false;
 async function firebase(){
  if(!fbPromise)fbPromise=Promise.all([
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
  ]).then(([app,auth,db])=>{
   const instance=app.getApps()[0]||app.initializeApp(APP);
   return {auth:auth.getAuth(instance),onAuthStateChanged:auth.onAuthStateChanged,db:db.getFirestore(instance),doc:db.doc,getDoc:db.getDoc,setDoc:db.setDoc,serverTimestamp:db.serverTimestamp};
  }).catch(error=>{fbPromise=null;throw error});
  return fbPromise;
 }
 const clampList=(items,options,max)=>Array.isArray(items)?[...new Set(items.map(x=>String(x).trim()).filter(x=>options?options.includes(x):x.length>0&&x.length<=65))].slice(0,max):[];
 function sanitize(raw){
  const d=raw&&typeof raw==='object'?raw:{};
  return {
   gender:String(d.gender||'').slice(0,80),
   pronouns:String(d.pronouns||'').slice(0,80),
   roots:clampList(d.roots,null,12),
   interests:clampList(d.interests,LABELS,12),
   sensitivity:SENS.includes(d.sensitivity)?d.sensitivity:'general',
   complete:d.complete===true
  };
 }
 async function read(){
  const f=await firebase(),user=f.auth.currentUser;
  if(!user)return null;
  const snap=await f.getDoc(f.doc(f.db,'users',user.uid));
  return sanitize(snap.exists()?snap.data()?.lwaOnboarding:null);
 }
 function make(tag,className,text){
  const el=document.createElement(tag);if(className)el.className=className;
  if(text!==undefined)el.textContent=text;return el;
 }
 function p(text,className=''){return make('p',className,text)}
 function choiceButtons(values,selected,onClick){
  const grid=make('div','lwa-choice-grid');
  values.forEach(value=>{
   const btn=make('button','lwa-option',value);btn.type='button';
   btn.setAttribute('aria-pressed',String(value===selected));
   btn.addEventListener('click',()=>{onClick(value);grid.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)))});
   grid.append(btn);
  });return grid;
 }
 function addInput(container,label,value,handler,hint){
  const wrap=make('label','lwa-field',label),field=make('input');
  field.type='text';field.maxLength=80;field.value=value;field.placeholder=hint||'Your words';field.autocomplete='off';
  field.addEventListener('input',()=>handler(field.value.trim()));
  wrap.append(field);container.append(wrap);return field;
 }
 function ensure(){
  if(dialog)return;
  const link=make('link');link.rel='stylesheet';link.href='/lwa-welcome.css?v=20261027-first-lwazi-1';document.head.append(link);
  dialog=make('dialog');dialog.id='lwaWelcomeDialog';dialog.setAttribute('aria-labelledby','lwaWelcomeTitle');
  dialog.innerHTML='<header class="lwa-head"><span class="lwa-mark" aria-hidden="true">L</span><h2 id="lwaWelcomeTitle">Hello from L’wazi</h2><span class="lwa-step-counter" id="lwaCounter"></span></header><div class="lwa-progress"><i id="lwaProgress"></i></div><div class="lwa-body" id="lwaBody"></div><p class="lwa-error" id="lwaError" role="alert"></p><footer class="lwa-actions"><button id="lwaBack" type="button">Back</button><button id="lwaNext" class="lwa-next" type="button">Next →</button></footer>';
  document.body.append(dialog);
  $('#lwaBack',dialog).addEventListener('click',()=>{if(step>0){step--;render()}});
  $('#lwaNext',dialog).addEventListener('click',next);
  dialog.addEventListener('cancel',e=>{e.preventDefault();$('#lwaError',dialog).textContent='Finish the conduct acknowledgment to enter Studio; everything else is optional.'});
 }
 function genderPage(body){
  body.append(p('Next, who are you? Choose a label if you want to. Your answer is private and does not control what Veve shows you.','lwa-note'));
  body.append(choiceButtons(['Man','Woman','Non-conforming','Self-describe','Prefer not to say'],data.gender,value=>{data.gender=value==='Prefer not to say'?'':value}));
  if(!['Man','Woman','Non-conforming'].includes(data.gender)){
   addInput(body,'Your own description (optional)',data.gender==='Self-describe'?'':data.gender,value=>{data.gender=value},'Describe yourself, or leave blank');
  }
 }
 function pronounPage(body){
  body.append(p('Do not groan; this matters. Imagine a reporter repeatedly calling LeBron James “she,” or Hunter Schafer “he.” Names and pronouns are a small part of treating people like people. If you are unsure, ask!'));
  body.append(choiceButtons(['he/him','she/her','they/them','ask me','my own'],data.pronouns,value=>{data.pronouns=value==='my own'?'':value}));
  addInput(body,'Use your own pronouns (optional)',data.pronouns==='my own'?'':data.pronouns,value=>{data.pronouns=value},'e.g. she/they, he/they, ask me');
 }
 function rootsPage(body){
  body.append(p('Ancestry is not one neat checkbox. Race categories have been used to enforce anti-Blackness; your cultural roots, communities and family stories deserve more care. You should know where you come from if you can. And if you cannot, that is okay too.'));
  body.append(p('For example, Leian names West African, Taíno, Dominican, Haitian and American roots—in that order 💅🏾. This is optional, private identifying information, not a prediction of what you like.','lwa-note'));
  const wrap=make('div','lwa-roots-field'),field=make('input');field.setAttribute('list','lwaRootsList');field.setAttribute('aria-label','Cultural roots, ethnicities or tribes');field.placeholder='Search or type a community';
  const list=make('datalist');list.id='lwaRootsList';
  ROOTS.forEach(label=>{const opt=make('option');opt.value=label;list.append(opt)});
  const add=make('button','','Add +');add.type='button';
  const selected=make('div','lwa-roots-chips');
  const renderRoots=()=>{
   selected.replaceChildren();
   data.roots.forEach((v,i)=>{const chip=make('button','',v+' ×');chip.type='button';chip.setAttribute('aria-label','Remove '+v);chip.addEventListener('click',()=>{data.roots.splice(i,1);renderRoots()});selected.append(chip)});
  };
  const commit=()=>{
   const value=field.value.trim().replace(/\s+/g,' ').slice(0,65);
   if(value&&data.roots.length<12&&!data.roots.some(x=>x.toLowerCase()===value.toLowerCase()))data.roots.push(value);
   field.value='';renderRoots();
  };
  add.addEventListener('click',commit);
  field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit()}});
  wrap.append(field,add,list);body.append(wrap,selected);renderRoots();
 }
 function interestsPage(body){
  body.append(p('What catches your eye? Pick up to 12. These are your early Veve signals: public posts with matching topics, tags and captions get a little more attention. You can edit this anytime in Settings.'));
  const grid=make('div','lwa-interests');
  LABELS.forEach(label=>{
   const chip=make('button','lwa-option',label);chip.type='button';
   const refresh=()=>chip.setAttribute('aria-pressed',String(data.interests.includes(label)));
   refresh();
   chip.addEventListener('click',()=>{
    if(data.interests.includes(label))data.interests=data.interests.filter(v=>v!==label);
    else if(data.interests.length<12)data.interests.push(label);
    refresh();
   });
   grid.append(chip);
  });body.append(grid);
  body.append(p('No interests selected? Veve stays chronological. Your ancestry and gender are never used to guess your interests.','lwa-note'));
 }
 function sensitivityPage(body){
  body.append(p('Last thing: how much sensitive material do you want Veve to show? These settings affect eligible, labeled public posts only. They never override platform rules or age restrictions.'));
  const options=[
   ['general','General · everyday content','Hide posts labeled with mature or sensitive themes.'],
   ['mature','Mature themes · with warnings','Allow some posts labeled sensitive, such as serious news or heavier artistic themes.'],
   ['permitted','All permitted · widest view','Show everything permitted for your age and the platform, still subject to safety rules.']
  ];
  const group=make('div','lwa-sensitivity');
  options.forEach(([id,title,help])=>{
   const label=make('label');const input=make('input');input.type='radio';input.name='lwaSensitivity';input.value=id;input.checked=data.sensitivity===id;
   input.addEventListener('change',()=>data.sensitivity=id);
   const text=make('span');text.append(make('strong','',title),p(help,'lwa-note'));
   label.append(input,text);group.append(label);
  });body.append(group);
 }
 function render(){
  ensure();
  const body=$('#lwaBody',dialog);body.replaceChildren();
  const isEdit=mode==='edit';
  const steps=['Our mutual responsibility','Who are you?','Pronouns matter','Culture & lineage','Build your Veve','Sensitive content'];
  $('#lwaCounter',dialog).textContent=(step+1)+' / '+steps.length;
  $('#lwaWelcomeTitle',dialog).textContent=steps[step];
  $('#lwaProgress',dialog).style.setProperty('--progress',(100*(step+1)/steps.length)+'%');
  $('#lwaError',dialog).textContent='';
  $('#lwaBack',dialog).disabled=step===0||busy;
  $('#lwaNext',dialog).disabled=busy;
  $('#lwaNext',dialog).textContent=step===5?(isEdit?'Save preferences':'Meet your Studio →'):step===0?'Got it →':'Next →';
  if(step===0){
   body.append(p('Hey '+firstName(session)+', I’m L’wazi, your agent—but you can call me Leian.'));
   body.append(p('In case you skimmed Terms and Privacy: being part of BIG LWA comes with a responsibility to each other. Harassment, abuse, stealing other people’s work and bad-faith behavior can lead to temporary suspension or a permanent ban, under our published policies.'));
   body.append(p('There are plenty of platforms for careless conformity. If you do not want to respect people here, use those instead. We are building something different.'));
   const agreement=make('label','lwa-conduct-check'),check=make('input');check.type='checkbox';check.id='lwaAgreed';check.checked=mode==='edit';
   const text=make('span','','I understand the BIG LWA conduct expectations and agree to follow the ');
   const a=make('a','','Terms and Good Faith');a.href='/terms';a.target='_blank';a.rel='noopener';
   text.append(a,document.createTextNode(' standards.'));agreement.append(check,text);body.append(agreement);
   body.append(p('Privacy is the bare minimum. Personal identity questions are optional, not public, and not used for automatic identity-based recommendations.','lwa-note'));
  }else if(step===1)genderPage(body);
  else if(step===2)pronounPage(body);
  else if(step===3)rootsPage(body);
  else if(step===4)interestsPage(body);
  else sensitivityPage(body);
 }
 async function finish(){
  if(!session||busy)return;
  busy=true;$('#lwaNext',dialog).disabled=true;$('#lwaError',dialog).textContent='';
  try{
   const f=await firebase(),user=f.auth.currentUser;
   if(!user||user.uid!==session.uid)throw Error('Sign in to your account to save preferences.');
   const payload=sanitize({...data,complete:true});
   await f.setDoc(f.doc(f.db,'users',user.uid),{lwaOnboarding:{
    version:1,complete:true,conductAgreedAt:f.serverTimestamp(),gender:payload.gender,pronouns:payload.pronouns,
    roots:payload.roots,interests:payload.interests,sensitivity:payload.sensitivity,updatedAt:f.serverTimestamp()
   }},{merge:true});
   data={...payload};dialog.close();
   window.dispatchEvent(new CustomEvent('biglwa:discovery-preferences-updated',{detail:{interests:payload.interests,sensitivity:payload.sensitivity}}));
   if(mode==='signup'&&document.querySelector('#studioApp')){
    if(typeof window.BigLWASiteGuide?.open==='function')window.BigLWASiteGuide.open();
    else window.addEventListener('load',()=>window.BigLWASiteGuide?.open?.(),{once:true});
   }
  }catch(error){$('#lwaError',dialog).textContent=error?.message||'Preferences were not saved. Try again.'}
  finally{busy=false;$('#lwaNext',dialog).disabled=false}
 }
 function next(){
  if(busy)return;
  if(step===0&&!$('#lwaAgreed',dialog)?.checked){$('#lwaError',dialog).textContent='Please acknowledge the community rules before proceeding.';return}
  if(step===5){finish();return}
  step++;render();
 }
 async function open({edit=false,start=0}={}){
  try{
   const f=await firebase();await f.auth.authStateReady();
   if(!f.auth.currentUser)throw Error('Please sign in before choosing preferences.');
   session=f.auth.currentUser;
   const saved=await read();data={...blank(),...(saved||{})};
   mode=edit?'edit':'signup';step=edit?Math.max(1,Math.min(5,Number(start)||4)):0;
   ensure();render();if(!dialog.open)dialog.showModal();
  }catch(error){const note=document.querySelector('#lwaSettingsStatus');if(note)note.textContent=error?.message||'Sign in to edit preferences.';}
 }
 function eligible(user,saved){
  if(!user||saved?.complete)return false;
  const created=Date.parse(user.metadata?.creationTime||'');
  if(!Number.isFinite(created)||Date.now()-created<0||Date.now()-created>7*86400000)return false;
  return true;
 }
 let activeUid='',opening=false;
 async function autoOpen(user){
  if(!user||opening||!document.querySelector('#studioApp')||document.documentElement.classList.contains('biglwa-preview-mode'))return;
  if(activeUid===user.uid)return;
  activeUid=user.uid;opening=true;
  try{
   const stored=await read();if(!eligible(user,stored))return;
   // The page may still be showing its login curtains while the account settles.
   await new Promise(resolve=>setTimeout(resolve,850));
   if((await firebase()).auth.currentUser?.uid!==user.uid)return;
   await open({edit:false});
  }catch{}finally{opening=false}
 }
 async function start(){
  if(document.querySelector('#lwaEditPreferences')){
   const btn=$('#lwaEditPreferences');
   btn.addEventListener('click',()=>open({edit:true,start:4}));
  }
  try{
   const f=await firebase();
   f.onAuthStateChanged(f.auth,user=>{
    if(!user){activeUid='';return}
    if(document.querySelector('#studioApp'))autoOpen(user);
   });
  }catch{/* No auth, no private preference collection. */}
 }
 window.BigLWALwaziWelcome={open,labels:LABELS,read,sanitize};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
