/* BIG LWA Guest Check: signed-in guestbook with enforced member access.
   Previous local-only visitor logs are NEVER silently made public. */
(()=>{
 'use strict';
 if(window.BigLWAGuestCheck)return;
 const $=(s,r=document)=>r?.querySelector(s);
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n};
 const verified=v=>String(v||'').trim().replace(/^@/,'').toLowerCase();
 const dateOf=t=>{try{const d=t?.toDate?.()||new Date(t||0);return isNaN(+d)?'—':new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(d)}catch{return '—'}};
 const config={apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',appId:'1:83232670555:web:e04927b20458390b3b507e'};
 let sdkPromise=null,opening=false;
 async function sdk(){
  if(!sdkPromise)sdkPromise=Promise.all([
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
  ]).then(([appMod,authMod,fire])=>{
   const app=appMod.getApps()[0]||appMod.initializeApp(config);
   return {auth:authMod.getAuth(app),db:fire.getFirestore(app),...fire};
  }).catch(err=>{sdkPromise=null;throw err});
  const f=await sdkPromise;await f.auth.authStateReady();return f;
 }
 const viewed=()=>window.__biglwaViewedProfile||window.BigLWAStudioPreview?.state?.()?.profile||null;
 async function target(f){
  const shared=viewed(),isPreview=document.documentElement.classList.contains('biglwa-preview-mode');
  if(isPreview&&shared?.uid&&shared?.username){
   return {uid:String(shared.uid),username:verified(shared.username),display:String(shared.name||shared.username),isPreview:true};
  }
  const me=f.auth.currentUser;
  if(!me)return null;
  const doc=await f.getDoc(f.doc(f.db,'users',me.uid));
  const account=doc.data()||{};
  const username=verified(account.usernameLower||account.username||window.__biglwaIdentity?.username);
  return {uid:me.uid,username,display:String(account.name||username||'Your Studio'),isPreview:false};
 }
 function permission(v){return v==='connects'?'connects':'anyone'}
 async function profileDoc(f,t){if(!t?.username)return null;const doc=await f.getDoc(f.doc(f.db,'usernames',t.username));if(!doc.exists()||doc.data()?.uid!==t.uid)return null;return doc}
 async function entries(f,t){
  const ref=f.collection(f.db,'guestCheckEntries',t.uid,'entries');
  const snapshot=await f.getDocs(f.query(ref,f.where('visibility','==','public'),f.limit(80)));
  return snapshot.docs.map(x=>({id:x.id,...x.data()})).filter(x=>x.ownerUid===t.uid&&x.visibility==='public').sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)).slice(0,40);
 }
 function rows(parent,items){
  parent.replaceChildren();
  const headings=el('div','biglwa-guest-v2-head');
  ['WHO WUZ HERE?','NOTE','DATE','EMOJI'].forEach(h=>headings.append(el('b','',h)));parent.append(headings);
  if(!items.length){parent.append(el('p','biglwa-guest-v2-empty','No check-ins yet.'));return}
  for(const item of items){
   const row=el('div','biglwa-guest-v2-row');
   row.append(el('strong','',String(item.name||'Member').slice(0,60)));
   row.append(el('span','',String(item.note||'').slice(0,450)));
   row.append(el('time','',dateOf(item.createdAt)));
   row.append(el('span','biglwa-guest-v2-emoji',String(item.emoji||'✿').slice(0,5)));
   parent.append(row);
  }
 }
 function own(t,f){return !!f.auth.currentUser?.uid&&f.auth.currentUser.uid===t.uid&&!t.isPreview}
 async function savePermission(f,t,val){
  if(!own(t,f))throw Error('Only the owner may change who can check in.');
  const publicRef=f.doc(f.db,'usernames',t.username),ownerRef=f.doc(f.db,'users',t.uid);
  const before=await f.getDoc(publicRef);
  if(!before.exists()||before.data()?.uid!==t.uid)throw Error('Verify your username in Settings first.');
  const batch=f.writeBatch(f.db);
  batch.set(ownerRef,{guestCheckPermission:permission(val),updatedAt:f.serverTimestamp()},{merge:true});
  batch.update(publicRef,{guestCheckPermission:permission(val),updatedAt:f.serverTimestamp()});
  await batch.commit();
 }
 async function add(f,t,name,note,emoji){
  const user=f.auth.currentUser;
  if(!user?.uid)throw Error('Sign in to leave a Guest Check. Signed-out visitors can only read.');
  const author=await f.getDoc(f.doc(f.db,'users',user.uid));
  if(!author.exists())throw Error('Complete your BIG LWA profile before checking in.');
  const who=String(author.data()?.name||author.data()?.usernameLower||'').trim().slice(0,60);
  if(!who)throw Error('Add your name in Settings first.');
  if(!t?.uid||!t?.username)throw Error('This Studio has no verified public username.');
  const message=String(note||'').trim();
  if(!message||message.length>450)throw Error('Write a note of 1–450 characters.');
  const record={ownerUid:t.uid,authorUid:user.uid,name:who,note:message,emoji:String(emoji||'✿').slice(0,5),visibility:'public',createdAt:f.serverTimestamp()};
  await f.addDoc(f.collection(f.db,'guestCheckEntries',t.uid,'entries'),record);
 }
 function makeDialog(){
  let dialog=$('#biglwaGuestCheckV2');if(dialog)return dialog;
  dialog=el('dialog','biglwa-guest-v2');dialog.id='biglwaGuestCheckV2';
  dialog.innerHTML='<header class="biglwa-guest-v2-title"><h2>Guest Check</h2><button type="button" class="biglwa-guest-v2-close" aria-label="Close Guest Check">×</button></header><section class="biglwa-guest-v2-content"><div class="biglwa-guest-v2-permissions" hidden><label for="biglwaGuestPermission">Who can check in?</label><select id="biglwaGuestPermission"><option value="anyone">Anyone</option><option value="connects">Connects only</option></select><small>“Connects only” uses your approved Archive friends list. Visitors can still read published entries.</small></div><p class="biglwa-guest-v2-status" role="status" aria-live="polite"></p><div class="biglwa-guest-v2-entries" aria-label="Published guest check-ins"></div><form class="biglwa-guest-v2-form" hidden><label>Note<textarea name="note" maxlength="450" rows="3" placeholder="Leave a note…" required></textarea></label><label>Emoji<select name="emoji"><option value="💐">💐</option><option value="❤️">❤️</option><option value="✨">✨</option><option value="🖤">🖤</option><option value="✿">✿</option></select></label><button type="submit">Add check-in</button></form></section>';
  dialog.querySelector('.biglwa-guest-v2-close').addEventListener('click',()=>dialog.close());
  document.body.append(dialog);return dialog;
 }
 async function open(explicit){
  if(opening)return;opening=true;
  const dialog=makeDialog(),status=$('.biglwa-guest-v2-status',dialog),controls=$('.biglwa-guest-v2-permissions',dialog),list=$('.biglwa-guest-v2-entries',dialog),form=$('.biglwa-guest-v2-form',dialog);
  status.textContent='Loading published check-ins…';form.hidden=true;controls.hidden=true;
  if(!dialog.open){if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','')}
  try{
   const f=await sdk(),t=explicit||await target(f);if(!t?.uid)throw Error('This profile is not available.');
   const publicDoc=await profileDoc(f,t);if(!publicDoc)throw Error('The public profile could not be verified.');
   const role=permission(publicDoc.data()?.guestCheckPermission);
   const owner=own(t,f);controls.hidden=!owner;
   const dropdown=$('#biglwaGuestPermission',dialog);dropdown.value=role;
   dropdown.onchange=async()=>{
    dropdown.disabled=true;status.textContent='Saving who can check in…';
    try{await savePermission(f,t,dropdown.value);status.textContent='Check-in access saved across your account.'}
    catch(error){dropdown.value=role;status.textContent=error.message||'Could not save access'}
    finally{dropdown.disabled=false}
   };
   const refresh=async()=>rows(list,await entries(f,t));
   await refresh();
   const visitor=f.auth.currentUser?.uid!==t.uid;
   const signedIn=!!f.auth.currentUser;
   // Anyone may view; only signed-in members may write. Firestore rules enforce
   // the selected access setting, even if the browser UI is bypassed.
   form.hidden=!signedIn||(!visitor&&t.isPreview);
   status.textContent=!signedIn?'Viewing only · sign in to check in.':
    role==='connects'&&visitor?'Only approved connects can check in.':
    owner?'These entries are visible on your public preview.':'Only published check-ins are shown.';
   form.onsubmit=async event=>{
    event.preventDefault();
    if(!f.auth.currentUser){status.textContent='Sign in to check in.';return}
    const submit=form.querySelector('button[type="submit"]');
    submit.disabled=true;status.textContent='Adding your check-in…';
    try{
     await add(f,t,'',form.elements.note.value,form.elements.emoji.value);
     form.reset();await refresh();status.textContent='Check-in added.';
    }catch(error){status.textContent=error.code==='permission-denied'?'You are not on this member’s approved connects list.':error.message||'Check-in unavailable'}
    finally{submit.disabled=false}
   };
  }catch(error){status.textContent=error?.message||'Guest Check unavailable.';rows(list,[])}
  finally{opening=false}
 }
 async function summary(node,profile){
  if(!node||!profile?.uid||!profile?.username)return;
  const version=String(profile.uid);
  if(node.dataset.guestOwner===version)return;
  node.dataset.guestOwner=version;
  node.textContent='Loading Guest Check…';
  try{
   const f=await sdk(),t={uid:profile.uid,username:verified(profile.username)};
   const latest=await entries(f,t);
   if(node.dataset.guestOwner!==version)return;
   rows(node,latest.slice(0,3));
  }catch{if(node.dataset.guestOwner===version)node.textContent='Open Guest Check to see published entries.'}
 }
 // Intercept legacy guestbook buttons before the retired local-only renderer.
 document.addEventListener('click',event=>{
  const control=event.target.closest?.('#studioApp .guest-check-card [data-open-guest],#studioApp .guest-check-card .guest-check-sheet,#studioApp .guest-check-card .biglwa-public-guest-open,#studioApp .guest-check-card .visitor-log-actions button,#studioApp .guest-check-card .guest-check-paper');
  if(!control)return;
  event.preventDefault();event.stopImmediatePropagation();open();
 },true);

 function retireLegacy(){
  const old=$('#guestCheckDialog');
  if(!old||old.dataset.guestCheckRedirect==='1')return;
  old.dataset.guestCheckRedirect='1';
  const redirect=()=>{
   if(!old.open)return;
   if(typeof old.close==='function')old.close();else old.removeAttribute('open');
   if(!$('#biglwaGuestCheckV2')?.open)void open();
  };
  new MutationObserver(redirect).observe(old,{attributes:true,attributeFilter:['open']});
  redirect();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
  retireLegacy();
  new MutationObserver(retireLegacy).observe(document.body,{childList:true,subtree:true});
 },{once:true});
 else{
  retireLegacy();
  new MutationObserver(retireLegacy).observe(document.body,{childList:true,subtree:true});
 }
 window.BigLWAGuestCheck=Object.freeze({open,summary,permission});
})();
