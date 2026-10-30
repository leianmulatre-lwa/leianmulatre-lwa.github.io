(function(){
'use strict';
if(window.__biglwaPinterest) return;
const API='https://api.biglwa.com/pinterest/';
const KEY='biglwaPinterestSession';
const PENDING_KEY='biglwaPinterestPendingHandoffV2';
const OAUTH_UID_KEY='biglwaPinterestOauthStartingUid';
let handoffPromise=null;
 const hostedPinUrls=new Map(); // Hosted copies from the signed-in user's R2 Orbit import.
 let savedLibrary={version:1,boards:[]}, savedUid='',savedBusy=false,savedError='',boardLocks={};
 const pinById=id=>pins.find(p=>String(p.id)===String(id))||createdPins.find(p=>String(p.id)===String(id))||savedLibrary.boards.flatMap(b=>b.pins||[]).find(p=>String(p.id)===String(id));
 async function savedRequest(method='GET',library){
  const token=await firebaseIdToken();
  if(!token||!authUid)throw new Error('Sign in to save Pinterest Pins on Big LWA.');
  const uid=authUid;
  const response=await fetch(API+'saved',{
   method,headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
   ...(method==='POST'?{body:JSON.stringify(library)}:{})
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.error||'Unable to save collections to your account.');
  if(uid!==authUid)throw new Error('Account changed while saving Pins.');
  return result.library;
 }
 async function loadSaved(){
  if(!authUid)return;
  if(savedUid===authUid)return;
  try{
   const result=await savedRequest();
   savedLibrary=result||{version:1,boards:[]};
   savedUid=authUid;savedError='';
   try{
     const [{getApps},{getAuth},{getFirestore,doc,getDoc}]=await Promise.all([
       import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
       import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
       import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
     ]);
     const app=getApps()[0],user=app&&getAuth(app).currentUser;
     if(user?.uid===authUid){
       const snap=await getDoc(doc(getFirestore(app),'users',authUid));
       boardLocks=(snap.exists()&&snap.data().pinterestBoardLocks)||{};
     }
   }catch(err){console.warn('Big LWA board lock restore:',err);boardLocks={}}
  }catch(error){savedError=error.message||'Saved collections could not load.'}
  render();
 }
 async function editSaved(mutator){
  if(savedBusy)return;
  savedBusy=true;
  try{
   const next=JSON.parse(JSON.stringify(savedLibrary));
   mutator(next);
   const result=await savedRequest('POST',next);
   savedLibrary=result;savedUid=authUid;savedError='';
   document.dispatchEvent(new CustomEvent('biglwa:pinterest-preview-updated'));
   notice('Board updated.');
  }catch(error){savedError=error.message||'Could not update saved Pins.';notice(savedError)}
  finally{savedBusy=false;render()}
 }
 async function toggleSavedBoardLock(id){
   if(savedBusy||!authUid)return;
   const board=savedLibrary.boards.find(b=>b.id===id);if(!board)return;
   const next={...boardLocks,[id]:boardLocks[id]!==true};
   savedBusy=true;render();
   try{
     const [{getApps},{getAuth},{getFirestore,doc,setDoc}]=await Promise.all([
       import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
       import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
       import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')
     ]);
     const app=getApps()[0],user=app&&getAuth(app).currentUser;
     if(!user||user.uid!==authUid)throw Error('Sign in to manage board locks.');
     await setDoc(doc(getFirestore(app),'users',authUid),{pinterestBoardLocks:next},{merge:true});
     boardLocks=next;
     notice(next[id]?'Board locked. Only you can see this collection, and posting its Pins requires unlocking.':'Board unlocked. Publishing still requires your approval.');
   }catch(error){notice('Could not sync lock to your account: '+(error?.message||'try again'))}
   finally{savedBusy=false;render()}
 }
 async function newSavedBoard(){
  const title=window.prompt('New Big LWA board name (private, not on Pinterest):');
  if(title==null)return;
  const clean=title.trim().slice(0,100);
  if(!clean){notice('Add a board name.');return;}
  if(savedLibrary.boards.length>=40){notice('Maximum 40 saved boards.');return;}
  const id='board_'+Array.from(crypto.getRandomValues(new Uint8Array(12))).map(n=>n.toString(16).padStart(2,'0')).join('');
  savedDrawerOpen=true;
  await editSaved(data=>{data.boards.push({id,title:clean,pins:[]})});
 }
 async function addSavedPin(pinId,board){
  const source=pinById(pinId);
  if(!source){notice('Open that board to load this Pin first.');return}
  const target=board||'default_saved';
  await editSaved(data=>{
   let collection=data.boards.find(b=>b.id===target);
   if(!collection){
    if(target!=='default_saved')throw new Error('Choose a valid saved board.');
    collection={id:'default_saved',title:'Saved',pins:[]};
    data.boards.unshift(collection);
   }
   if(collection.pins.some(p=>p.id===String(pinId)))throw new Error('This Pin is already saved to that collection.');
   collection.pins.unshift({id:String(pinId),title:String(source.title||source.description||'Pinterest Pin').slice(0,300),
    image:image(source),url:'https://www.pinterest.com/pin/'+pinId+'/'});
  });
 }

 async function refreshPinStates(){
  const uid=authUid,api=window.__biglwaOrbitPosts;
  if(!uid||typeof api?.loadArchive!=='function')return;
  try{
   // The archive is authoritative; never infer live status from a browser cache.
   const rows=await api.loadArchive(uid,48);
   if(authUid!==uid)return;
   for(const row of rows||[]){
    if(String(row.source||'').toLowerCase()==='pinterest'&&row.sourcePostId)
      profilePinStates.set(String(row.sourcePostId),row.archiveState==='collective'||row.state==='approved'?'live':row.state==='archived'?'archived':'private');
   }
   render();
  }catch(error){console.warn('Pinterest profile status unavailable:',error)}
 }
 async function importSelectedPins(items){
   const uid=authUid;
   if(!uid)throw Error('Sign in before saving Pins to your profile.');
   const usable=items.filter(item=>/^\d+$/.test(String(item?.id||''))&&(image(item)||item.image));
   if(!usable.length)throw Error('No selected Pin images are ready. Load or sync first.');
   const importer=await waitForImporter();
   if(typeof importer!=='function')throw Error('Account import is still loading.');
   let stored=0;
   for(let i=0;i<usable.length;i+=10){
     if(authUid!==uid)throw Error('Account changed during import; action stopped.');
     progress('Importing private copies · '+Math.min(i+10,usable.length)+' / '+usable.length);
     const batch=usable.slice(i,i+10).map(pin=>({...pin,id:String(pin.id),image_url:image(pin)||pin.image,
       url:'https://www.pinterest.com/pin/'+pin.id+'/'}));
     const result=await importer('pinterest',batch,profile,window.__biglwaIdentity||{});
     if(result?.partial)throw Error('Some Pins could not be stored in your account. Retry those Pins.');
     stored+=Number(result?.imported)||0;
     for(const pin of batch)if(!profilePinStates.has(String(pin.id)))profilePinStates.set(String(pin.id),'private');
   }
   window.dispatchEvent(new CustomEvent('biglwa:orbit-imported',{detail:{source:'pinterest',imported:stored}}));
   notice(stored+' Pins stored privately in BIG LWA. Nothing was posted publicly.');
 }
 async function publishOriginalSelection(){
  const picked=createdPins.filter(p=>selectedOriginalPins.has(String(p.id)));
  if(!picked.length){notice('Select original Pins first.');return}
  if(!window.confirm('Post '+picked.length+' selected Pins publicly to the Collective Feed? Veve may feature those posts too.'))return;
  const uid=authUid;
  await run(async()=>{
    const importer=await waitForImporter(),publisher=window.__biglwaOrbitPosts?.publishOrbitPost;
    if(!publisher||!importer)throw Error('Publishing is not available.');
    let published=0,failed=0;
    for(const pin of picked){
      if(uid!==authUid)throw Error('Account changed. Publication stopped.');
      try{await publishOnePin(pin,importer,publisher);published++;profilePinStates.set(String(pin.id),'live');publishedPinIds.add(String(pin.id))}
      catch(err){failed++;console.warn('Original Pin publish failed',pin.id,err)}
      progress('Publishing original Pins · '+(published+failed)+' / '+picked.length);
    }
    selectedOriginalPins.clear();
    if(published)window.dispatchEvent(new CustomEvent('biglwa:orbit-imported',{detail:{source:'pinterest',published}}));
    notice(published+' original Pins posted to the Collective Feed.'+(failed?' '+failed+' failed.':''));
  });
 }
 async function publishOnePin(pin,importer,publisher){
  const id=String(pin?.id||'');
  if(!/^\d+$/.test(id))throw Error('Invalid Pin identifier.');
  const media={...pin,id,image_url:image(pin)||pin.image||'',url:'https://www.pinterest.com/pin/'+id+'/',
    biglwaPinterestOrigin:pin.biglwaPinterestOrigin||'created',
    biglwaPinterestBoardId:pin.biglwaPinterestBoardId||''};
  if(!media.image_url)throw Error('Missing Pin image. Sync this Pin first.');
  const imported=await importer('pinterest',[media],profile,window.__biglwaIdentity||{});
  if(!imported?.imported||imported.partial)throw Error('Pin '+id+' did not finish importing.');
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('pinterest:'+id)));
  const postId='orbit_'+Array.from(digest).map(n=>n.toString(16).padStart(2,'0')).join('').slice(0,40);
  await publisher(postId);
  return postId;
 }
 async function publishBoardToVeve(id,saved,selectedIds=null){
  const board=saved?savedLibrary.boards.find(b=>String(b.id)===String(id)):boards.find(b=>String(b.id)===String(id));
  if(!board){notice('Choose a board to publish.');return}
  if(saved&&boardLocks[id]===true){notice('Unlock this board before publishing.');return}
  const requested=selectedIds instanceof Set&&selectedIds.size?[...selectedIds]:null;
  // Confirm *before* queueing; the action may start after other imports finish.
  const label=String(board.title||board.name||'Board').slice(0,100);
  if(!window.confirm('Publish '+(requested?requested.length+' selected Pins':'all available Pins')+' from "'+label+
    '"? This makes them public in your Collective Feed AND Veve. It will not publish Pins from other boards.'))return;
  const uid=authUid;
  await run(async()=>{
    if(uid!==authUid||!uid)throw Error('Account changed; publishing cancelled.');
    const importer=await waitForImporter(),publisher=window.__biglwaOrbitPosts?.publishOrbitPost;
    if(typeof importer!=='function'||typeof publisher!=='function')throw Error('Account publishing is unavailable. Refresh and retry.');
    let loaded=saved?(board.pins||[]):String(boardId)===String(id)?pins.slice():[];
    // Pinterest paginates board results. Continue until exhausted, never cap at 20.
    if(!saved&&!requested){
      let next=String(boardId)===String(id)?pinsNext:'';
      if(!loaded.length){
        const first=await api('boards/'+encodeURIComponent(id)+'/pins');
        loaded=Array.isArray(first.items)?first.items:[];
        next=first.bookmark||first.next_bookmark||'';
      }
      let page=0;
      while(next&&page<100){
        if(uid!==authUid)throw Error('Account changed; publishing cancelled.');
        progress('Loading board Pins · '+loaded.length+' collected…');
        const data=await api('boards/'+encodeURIComponent(id)+'/pins?bookmark='+encodeURIComponent(next));
        const batch=Array.isArray(data.items)?data.items:[];
        loaded.push(...batch);
        const nextBookmark=data.bookmark||data.next_bookmark||'';
        if(nextBookmark===next)throw Error('Pinterest returned a repeated cursor. Publish only the Pins already loaded by selecting them.');
        next=nextBookmark;page++;
      }
      if(next)throw Error('Pinterest has more than 100 pages of Pins. Choose a smaller selection or contact support.');
    }
    const unique=[...new Map(loaded.filter(p=>/^\d+$/.test(String(p?.id||''))).
       filter(p=>!requested||requested.includes(String(p.id))).map(p=>[String(p.id),p])).values()];
    const list=unique.filter(p=>image(p)||p.image);
    if(!list.length)throw Error('No usable Pin images found. Sync the selected board before publishing.');
    let posted=0,failed=0;
    for(const pin of list){
      if(uid!==authUid)throw Error('Account changed; publishing stopped.');
      if(saved&&boardLocks[id]===true)throw Error('Board locked while publishing.');
      try{await publishOnePin({...pin,biglwaPinterestOrigin:'board',biglwaPinterestBoardId:String(id)},importer,publisher);posted++;publishedPinIds.add(String(pin.id));profilePinStates.set(String(pin.id),'live')}
      catch(err){failed++;console.warn('[BIGLWA] Pinterest publish:',pin.id,err)}
      if((posted+failed)%4===0||posted+failed===list.length)
        progress('Publishing to Collective + Veve · '+(posted+failed)+' / '+list.length+' · '+posted+' live');
    }
    if(posted){
      window.dispatchEvent(new CustomEvent('biglwa:orbit-imported',{detail:{source:'pinterest',published:posted}}));
      window.BigLWAVeve?.refresh?.();
    }
    if(requested)for(const id of requested)selectedBoardPins.delete(id);
    notice(posted+' Pins are live in Collective Feed and Veve.'+(failed?' '+failed+' could not publish; retry them individually.':''));
  });
 }
 async function publishPin(pinId,fromBoard=''){
  if(fromBoard&&boardLocks[fromBoard]===true){notice('Unlock this board before publishing any of its saved Pins.');return;}
  const pin=pinById(pinId);
  if(!pin){notice('Load that Pinterest Pin first.');return}
  await run(async()=>{
   const importer=await waitForImporter();
   const publisher=window.__biglwaOrbitPosts?.publishOrbitPost;
   if(typeof importer!=='function'||typeof publisher!=='function')throw new Error('Collective Feed publisher is not ready. Refresh and try again.');
   await publishOnePin({...pin,biglwaPinterestOrigin:fromBoard?'board':'created',biglwaPinterestBoardId:fromBoard||''},importer,publisher);
   window.dispatchEvent(new CustomEvent('biglwa:orbit-imported',{detail:{source:'pinterest',published:1}}));
   notice('Pin posted to Collective Feed.');
  });
 }
 function savedBoardsMarkup(){
  if(!authUid)return '';
  const boardRows=savedLibrary.boards.map(board=>{
   const cols=(board.pins||[]).slice(0,16).map(pin=>
    '<article class="pn-saved-pin"><button type="button" class="pn-pin-photo" data-pn-preview="'+esc(pin.id)+'" aria-label="Enlarge Pin">'+
    (pin.image?'<img src="'+esc(pin.image)+'" loading="lazy" alt="">':'')+'</button>'+
    '<span>'+esc(pin.title)+'</span>'+
    '<div class="pn-saved-pin-actions"><button type="button" data-pn-edit-saved="'+esc(pin.id)+'" data-pn-saved-from="'+esc(board.id)+'">Edit</button>'+
    '<button type="button" data-pn-remove-saved="'+esc(pin.id)+'" data-pn-saved-from="'+esc(board.id)+'">Remove</button>'+
    '</div></article>').join('');
   return '<section class="pn-saved-board" data-pn-collection="'+esc(board.id)+'" data-locked="'+(boardLocks[board.id]===true?'true':'false')+'">'+
    '<header><h4>'+esc(board.title)+' <small>('+board.pins.length+')</small> '+(boardLocks[board.id]===true?'<span class="pn-board-lock-label">🔒 locked</span>':'')+'</h4>'+
    '<button type="button" data-pn-lock-board="'+esc(board.id)+'" aria-pressed="'+(boardLocks[board.id]===true?'true':'false')+'">'+(boardLocks[board.id]===true?'Unlock board':'Lock board')+'</button>'+

    '<button type="button" data-pn-rename-board="'+esc(board.id)+'">Rename</button>'+
    '<button type="button" data-pn-remove-board="'+esc(board.id)+'">Delete board</button></header>'+
    '<div class="pn-saved-pin-grid">'+(cols||'<p>Save Pins from above to this board.</p>')+'</div></section>';
  }).join('');
  return '<section class="pn-saved-section" aria-label="Your saved Big LWA boards">'+
   '<div class="pn-saved-heading"><div><h3>Your BIGLWA boards</h3><p>Private collections · manage, lock, and edit saved Pins.</p></div></div>'+
   (savedError?'<p role="alert">'+esc(savedError)+'</p>':'')+
   (boardRows||'<p>Save a Pin to start a collection, or create a new board.</p>')+'</section>';
 }

 let savedDrawerOpen=false,showAllBoards=false,activeSavedBoard='',originalView=false,scrollBoardAfterRender=false;
 let workQueue=[],queuedTasks=0,selectedBoardPins=new Set(),selectedOriginalPins=new Set(),publishedPinIds=new Set();
 let operationProgress='',profilePinStates=new Map();
 const progress=label=>{operationProgress=label;render()};

 let connected=false,profile={},boards=[],pins=[],createdPins=[],boardId='',boardsNext='',pinsNext='',createdNext='',busy=false,message='',covers={},restorePromise=null,boardsPromise=null,pinsPromise=null,createdPromise=null;
 let authUid='',lastImport={imported:0,skipped:0,partial:0},importError='',syncingAll=false,diagnostic='Awaiting Pinterest account synchronization';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const scopedKey=uid=>KEY+':'+uid;
 const recentBoardKey=()=>authUid?'biglwaPinterestRecentBoardsV1:'+authUid:'';
 let recentBoardIds=[];
 const restoreBoardOrder=()=>{
  const key=recentBoardKey();
  if(!key){recentBoardIds=[];return}
  try{
   const value=JSON.parse(localStorage.getItem(key)||'[]');
   recentBoardIds=Array.isArray(value)?[...new Set(value.map(String).filter(id=>/^(?:\d+|board_[a-f0-9]+|default_saved)$/.test(id)))].slice(0,30):[];
  }catch{recentBoardIds=[]}
 };
 const orderedBoards=()=>boards.slice().sort((a,b)=>{
  const ai=recentBoardIds.indexOf(String(a.id)),bi=recentBoardIds.indexOf(String(b.id));
  return (ai<0?Number.MAX_SAFE_INTEGER:ai)-(bi<0?Number.MAX_SAFE_INTEGER:bi);
 });
 const rememberBoardSelection=id=>{
  id=String(id||'');
  if(!authUid||!/^\d+$/.test(id)||!boards.some(b=>String(b.id)===id))return false;
  recentBoardIds=[id,...recentBoardIds.filter(old=>old!==id)].slice(0,30);
  try{localStorage.setItem(recentBoardKey(),JSON.stringify(recentBoardIds))}catch{}
  render();
  return true;
 };

 const storageGet=key=>{for(const store of [localStorage,sessionStorage]){try{const value=store.getItem(key);if(value)return value}catch{}}return ''};
 const storageDrop=key=>{for(const store of [localStorage,sessionStorage]){try{store.removeItem(key)}catch{}}};
 const session=()=>{const uid=authUid||window.__biglwaIdentity?.uid||'';return uid?storageGet(scopedKey(uid)):''};
 const save=value=>{
  const uid=authUid||window.__biglwaIdentity?.uid||'';
  if(!uid)return;
  if(value){try{localStorage.setItem(scopedKey(uid),value)}catch{try{sessionStorage.setItem(scopedKey(uid),value)}catch{}}}
  else storageDrop(scopedKey(uid));
  storageDrop(KEY);
 };
 const resetView=()=>{
  document.querySelector('#pnPinPreview')?.close();document.querySelector('#pnBoardDestination')?.close();
  connected=false;profile={};boards=[];pins=[];createdPins=[];boardId='';boardsNext='';pinsNext='';createdNext='';covers={};
  recentBoardIds=[];
  selectedBoardPins.clear();selectedOriginalPins.clear();publishedPinIds.clear();profilePinStates.clear();workQueue=[];queuedTasks=0;operationProgress='';
  hostedPinUrls.clear();
  savedLibrary={version:1,boards:[]};savedUid='';savedError='';boardLocks={};savedDrawerOpen=false;activeSavedBoard='';originalView=false;showAllBoards=false;
  document.dispatchEvent(new CustomEvent('biglwa:pinterest-status',{detail:{connected:false,uid:authUid}}));
  restorePromise=null;boardsPromise=null;pinsPromise=null;createdPromise=null;lastImport={imported:0,skipped:0,partial:0};importError='';
  render();
 };
 async function firebaseIdToken(){
  try{
   const [{getAuth},{initializeApp,getApps}]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js')
   ]);
   const app=getApps()[0]||initializeApp({apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',appId:'1:83232670555:web:e04927b20458390b3b507e'});
   const auth=getAuth(app);
   await auth.authStateReady();
   const user=auth.currentUser;
   // A Pinterest provider failure can never reset the Big LWA UID.
   if(!user || (authUid&&user.uid!==authUid))return '';
   const token=await user.getIdToken();
   if(auth.currentUser?.uid!==user.uid)return '';
   if(!authUid)authUid=user.uid;
   return token;
  }catch(error){
   console.warn('[Big LWA] Pinterest token temporarily unavailable:',error);
   return '';
  }
 }
 async function recoverOrBindPinterestSession(){
  const token=await firebaseIdToken();
  if(!token||!authUid){diagnostic='Pinterest is waiting for the existing Big LWA session. Your login remains unchanged.';return ''}
  // A device-wide legacy credential might belong to another person who used this
  // browser. Never silently claim it for the currently signed-in account.
  const local=session();
  if(storageGet(KEY))storageDrop(KEY);
  if(local){
   try{
    const res=await fetch(API+'session/claim',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+local},body:JSON.stringify({firebaseIdToken:token})});
    const data=await res.json().catch(()=>({}));
    if(res.ok&&data.session){save(data.session);return data.session}
    if(res.status===401||res.status===403){storageDrop(scopedKey(authUid));storageDrop(KEY)}
   }catch{ /* Use account recovery if the claim request is temporarily unavailable. */ }
  }
  try{
   const res=await fetch(API+'session/account',{headers:{Authorization:'Bearer '+token}});
   const data=await res.json().catch(()=>({}));
   if(res.ok&&data.connected&&data.session){save(data.session);return data.session}
  }catch{}
  diagnostic='No Pinterest session is linked to this Big LWA login. Reconnect Pinterest from Orbit.';
  return '';
 }
const encode=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function notice(text){message=text;render();if(!authUid || !document.getElementById('studioApp')?.classList.contains('is-active') || document.getElementById('loginPage')?.classList.contains('is-active')){document.getElementById('pinterestNotice')?.remove();return}let el=document.getElementById('pinterestNotice');if(!el){el=document.createElement('div');el.id='pinterestNotice';el.setAttribute('role','status');el.style.cssText='position:fixed;right:18px;bottom:18px;max-width:360px;padding:16px;background:#fff5eb;color:#302b28;border:1px solid #ccc;border-radius:12px;z-index:15000';document.body.append(el)}el.textContent=text;clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.remove(),10000)}
// A Pinterest token expiring must never affect Firebase login.
async function api(path,body){
 const request=async bearer=>{
  const res=await fetch(API+path,{method:body?'POST':'GET',
   headers:{'Content-Type':'application/json',Authorization:'Bearer '+bearer},
   ...(body?{body:JSON.stringify(body)}:{})});
  return {res,data:await res.json().catch(()=>({}))};
 };
 // Pinterest expiry never means the Firebase session expired.
 if(!session()&&path!=='health'&&path!=='session'&&path!=='disconnect'){
  const recovered=await recoverOrBindPinterestSession().catch(()=>'');
  if(!recovered){
   connected=false;
   diagnostic='Reconnect Pinterest in Orbit. Your Big LWA login is still active.';
   document.dispatchEvent(new CustomEvent('biglwa:pinterest-status',{detail:{connected:false,uid:authUid,needsReconnect:true}}));
   throw Error(diagnostic);
  }
 }
 let response=await request(session());
 if(response.res.status===401&&path!=='disconnect'&&path!=='session'){
  const previous=session();
  const recovered=await recoverOrBindPinterestSession().catch(()=>'');
  if(recovered&&recovered!==previous)response=await request(recovered);
 }
 if(!response.res.ok){
  const reason=String(response.data.error||'Pinterest request rejected.');
  diagnostic='Pinterest '+path+' failed (HTTP '+response.res.status+'): '+reason;
  if(response.res.status===401||response.res.status===403){
   // Clear the provider cache only: saved media and Firebase auth are untouched.
   if(path!=='session')save('');
   connected=false;
   // Do not clear other Orbit connections, owner data or the main account.
   diagnostic='Pinterest authorization expired. You remain signed into Big LWA; reconnect only Pinterest in Orbit.';
   document.dispatchEvent(new CustomEvent('biglwa:pinterest-status',{
    detail:{connected:false,uid:authUid,needsReconnect:true}
   }));
   throw Error(diagnostic);
  }
  throw Error(reason);
 }
 return response.data;
}
async function run(fn,{silent=false}={}){
 if(busy){
   if(workQueue.length>=20){notice('20 actions are already queued (not a 20-Pin import limit). Wait until one completes.');return}
   workQueue.push({fn,silent,uid:authUid});queuedTasks=workQueue.length;
   message='Pinterest is working · '+queuedTasks+' action'+(queuedTasks===1?'':'s')+' queued';render();return;
 }
 busy=true;if(!silent)message='Loading Pinterest…';render();
 try{await fn();if(!silent)message=''}catch(e){diagnostic=e?.message||'Pinterest unavailable. Reconnect in Orbit.';if(!silent)notice(diagnostic);else console.warn('Pinterest background restore:',diagnostic)}
 finally{
   busy=false;operationProgress='';
   const next=workQueue.shift();queuedTasks=workQueue.length;render();
   if(next){if(next.uid===authUid)queueMicrotask(()=>run(next.fn,{silent:next.silent}));else notice('Account changed. Queued action was cancelled.')}
 }
}
async function connect(){await run(async()=>{
  if(!await firebaseIdToken())throw new Error('Pinterest cannot verify the current account yet. Retry without signing out of Big LWA.');
  /* PKCE needs crypto.subtle, which only exists on secure contexts. Instagram never
     needs it, so its connect button worked on any page while Pinterest died silently.
     Say so instead of throwing a dead click. */
  if(!crypto.subtle)throw new Error('Connect Pinterest from a secure page (https) before this browser will allow it.');
  const health=await api('health');
  if(!health.ok)throw new Error('Pinterest Worker settings are incomplete.');
  /* The worker only answers the redirect when the challenge is a real base64url PKCE
     value; any other shape comes back as "Start Pinterest connection from Orbit." and
     the tab lands on a JSON error page that reads as the button doing nothing. */
  const verifier=encode(crypto.getRandomValues(new Uint8Array(32)));
  sessionStorage.setItem('pinterestVerifier',verifier);
  sessionStorage.setItem(OAUTH_UID_KEY,authUid);
  sessionStorage.removeItem(PENDING_KEY);
  const challenge=encode(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
  // Use the canonical Studio route for OAuth return; avoid a login-gated deep link.
  const returnTo=location.origin+'/studio?view=orbit&orbit_return=1';
  location.assign(API+'start?challenge='+encodeURIComponent(challenge)+'&return_to='+encodeURIComponent(returnTo));
 })}

 async function finishPinterestHandoff(){
  if(handoffPromise)return handoffPromise;
  const raw=storageGet(PENDING_KEY);if(!raw)return false;
  handoffPromise=(async()=>{
   let pending;
   try{pending=JSON.parse(raw)}catch{storageDrop(PENDING_KEY);return false}
   if(!pending?.handoff || !/^[A-Za-z0-9_-]{43}$/.test(pending.handoff)) {
    storageDrop(PENDING_KEY);return false;
   }
   if(Date.now()-Number(pending.receivedAt||0)>600000){
    storageDrop(PENDING_KEY);
    throw new Error('Pinterest authorization return expired. Please reconnect.');
   }
   const token=await firebaseIdToken();
   if(!token || !authUid)throw new Error('Pinterest connection is waiting for Big LWA session restoration. Retry without signing out.');
   const startUid=sessionStorage.getItem(OAUTH_UID_KEY)||'';
   if(startUid && startUid!==authUid)throw new Error('Finish connecting Pinterest from the same Big LWA account used to start.');
   const verifier=sessionStorage.getItem('pinterestVerifier')||'';
   if(!/^[A-Za-z0-9_-]{43}$/.test(verifier))throw new Error('Pinterest verification was lost. Connect from the same browser and domain, then try again.');
   const result=await api('session',{handoff:pending.handoff,verifier,firebaseIdToken:token});
   if(!result.connected||!result.persisted||!result.session)throw new Error('Pinterest authorization did not finish binding to your Big LWA account.');
   save(result.session);
   // A successful OAuth callback is not enough: verify the mapping is readable
   // from a fresh account-scoped request, just like on a different device.
   const check=await fetch(API+'session/account',{headers:{Authorization:'Bearer '+token}});
   const mapping=await check.json().catch(()=>({}));
   if(!check.ok||!mapping.connected||mapping.session!==result.session)
    throw new Error('Pinterest approved, but your Big LWA account could not restore the connection.');
   storageDrop(PENDING_KEY);
   sessionStorage.removeItem('pinterestVerifier');
   sessionStorage.removeItem(OAUTH_UID_KEY);
   diagnostic='Pinterest authorization linked to this Big LWA account.';
   return true;
  })();
  try{return await handoffPromise}finally{handoffPromise=null}
 }
 async function loadBoards(more=false){
  if(boardsPromise)return boardsPromise;
  boardsPromise=(async()=>{
   const data=await api('boards'+(more&&boardsNext?'?bookmark='+encodeURIComponent(boardsNext):''));
   const items=Array.isArray(data?.items)?data.items:Array.isArray(data?.boards)?data.boards:Array.isArray(data?.data?.items)?data.data.items:[];
   if(!Array.isArray(data?.items)&&!Array.isArray(data?.boards)&&!Array.isArray(data?.data?.items))console.warn('Pinterest boards payload has no recognized items array:',Object.keys(data||{}));
   boards=more?[...boards,...items]:items;boardsNext=data?.bookmark||data?.next_bookmark||'';
   diagnostic=items.length?'Pinterest returned '+items.length+' boards.':'Pinterest returned zero boards. Confirm the connected account and the Pinterest app board-read permission.';
   document.dispatchEvent(new CustomEvent('biglwa:pinterest-preview-updated'));
   render();
   loadCovers().then(render).catch(()=>{});
   return boards;
  })();
  try{return await boardsPromise}finally{boardsPromise=null}
 }
  /* Six covers is what the preview shows, so asking for more would spend the rate limit on
     tiles nobody sees. The Worker caches per session, so this is cheap after the first call. */
 async function loadCovers(requestedIds=null){
  const ids=(Array.isArray(requestedIds)?requestedIds.map(id=>boards.find(b=>String(b.id)===String(id))).filter(Boolean):orderedBoards().filter(b=>/^\d+$/.test(String(b.id||''))).filter(b=>!covers[b.id]).slice(0,6));
  if(!ids.length)return;
  try{const data=await api('board-covers?ids='+ids.map(b=>b.id).join(','));covers={...covers,...(data.covers||{})};render();document.dispatchEvent(new CustomEvent('biglwa:pinterest-preview-updated'))}catch{}finally{}
 }
 async function importPinsToAccount(items){
  if(!Array.isArray(items)||!items.length)return {imported:0,skipped:0,partial:0};
  const importer=await waitForImporter();
  if(typeof importer!=='function'){
    importError='Pins loaded, but the account importer was unavailable. Refresh to save them.';
    render();return null;
  }
  try{
    const result=await importer('pinterest',items,profile,window.__biglwaIdentity||{});
    lastImport=result||lastImport;
    for(const [id,urls] of Object.entries(result?.hostedById||{})){if(urls.some(Boolean))hostedPinUrls.set(String(id),urls.filter(Boolean));}
    importError=result?.warning||'';
    if(result?.warning)console.warn('BIG LWA Pinterest import:',result.warning);
    window.dispatchEvent(new CustomEvent('biglwa:orbit-imported',{detail:{source:'pinterest',...result}}));
    render();
    return result;
  }catch(error){
    importError=error?.message||'Pinterest pins loaded, but could not be saved to your profile.';
    console.warn('BIG LWA Pinterest account import:',error);
    render();return null;
  }
 }
 async function loadPins(id,more){
  if(!id)return[];
  if(pinsPromise)return pinsPromise;
  pinsPromise=(async()=>{
   const data=await api('boards/'+encodeURIComponent(id)+'/pins'+(more&&pinsNext?'?bookmark='+encodeURIComponent(pinsNext):''));
   const nextItems=Array.isArray(data?.items)?data.items:Array.isArray(data?.pins)?data.pins:Array.isArray(data?.data?.items)?data.data.items:[];
   if(String(boardId)!==String(id))return pins; // A prior board's response must not overwrite the new selection.
   pins=more?[...pins,...nextItems]:nextItems;pinsNext=data?.bookmark||data?.next_bookmark||'';
   diagnostic=nextItems.length?'Pinterest returned '+nextItems.length+' Pins from the selected board.':'Pinterest returned zero Pins for board '+id+'. Check access and whether the board contains Pins.';
   document.dispatchEvent(new CustomEvent('biglwa:pinterest-preview-updated'));
   render();
   // Saved board Pins stay in Boards. A repin is not an original creation
   // on the account owner's public profile.
   render();
   return pins;
  })();
  try{return await pinsPromise}finally{pinsPromise=null}
 }
 async function loadCreatedPins(more=false){
  if(createdPromise)return createdPromise;
  createdPromise=(async()=>{
   const suffix=more&&createdNext?'?bookmark='+encodeURIComponent(createdNext):'';
   const data=await api('pins'+suffix);
   const items=Array.isArray(data?.items)?data.items:[];
   createdPins=more?[...new Map([...createdPins,...items].map(pin=>[String(pin.id),pin])).values()]:items;
   createdNext=data?.bookmark||'';
   // /pins?pin_filter=exclude_repins returns original Pins owned by the token.
   const originals=items.filter(pin=>/^\d+$/.test(String(pin.id||''))).map(pin=>({...pin,biglwaPinterestOrigin:'created'}));
   await importPinsToAccount(originals);
   diagnostic='Found '+createdPins.length+' original Pin'+(createdPins.length===1?'':'s')+
    ' owned by @'+String(profile.username||'your account')+'. Board saves remain in Boards.';
   document.dispatchEvent(new CustomEvent('biglwa:pinterest-preview-updated'));
   render();
   return createdPins;
  })();
  try{return await createdPromise}finally{createdPromise=null}
 }
 // Load complete board and original-Pin catalogs without requiring repeated
 // "Load more" clicks. Requests are sequential to protect Pinterest rate limits.
 // No automatic action here publishes a Pin or changes account privacy.
 let browseHydration=null;
 const browsePause=()=>new Promise(resolve=>setTimeout(resolve,280));
 async function hydrateBrowse({scope='all',uid=authUid,selected=boardId}={}){
  if(!connected||!uid||uid!==authUid)return;
  if(browseHydration){
   if(scope==='pins'){
    const inFlight=browseHydration;
    return inFlight.finally(()=>{
     if(uid===authUid&&selected===boardId)return hydrateBrowse({scope:'pins',uid,selected});
    });
   }
   return browseHydration;
  }
  browseHydration=(async()=>{
   const limits={boards:60,created:60,pins:60};
   const finish=async(type)=>{
    const seen=new Set();let pages=0;
    while(uid===authUid&&connected&&pages<limits[type]){
     if(type==='pins'&&boardId!==selected)return;
     const cursor=String(type==='boards'?boardsNext:type==='created'?createdNext:pinsNext);
     if(!cursor||seen.has(cursor))break;
     seen.add(cursor);
     try{
      if(type==='boards')await loadBoards(true);
      else if(type==='created')await loadCreatedPins(true);
      else await loadPins(selected,true);
     }catch(error){
      console.warn('Pinterest background '+type+' pagination paused:',error);
      break;
     }
     pages++;
     await browsePause();
    }
   };
   if(scope==='all'||scope==='boards')await finish('boards');
   if(scope==='all'||scope==='created')await finish('created');
   if(scope==='all'||scope==='pins')await finish('pins');
   // Covers are fetched six at a time, with no need to press anything.
   if(scope==='all'||scope==='boards'){
    const visited=new Set();
    for(let batch=0;batch<60&&uid===authUid&&connected;batch++){
     const ids=orderedBoards().filter(b=>/^\d+$/.test(String(b.id||''))).filter(b=>!covers[b.id]).slice(0,6).map(b=>String(b.id));
     if(!ids.length||ids.every(id=>visited.has(id)))break;
     ids.forEach(id=>visited.add(id));
     await loadCovers(ids);
     await browsePause();
    }
   }
   if(uid===authUid)render();
  })();
  try{return await browseHydration}finally{browseHydration=null}
 }
 async function restore(){
  await recoverOrBindPinterestSession();
  if(!session()){connected=false;diagnostic='Pinterest needs reconnection; Big LWA sign-in is unchanged.';render();return}
  if(restorePromise)return restorePromise;
  restorePromise=run(async()=>{
    profile=await api('profile');
    if(!profile||typeof profile!=='object'||!profile.username)
     throw new Error('Pinterest did not return a readable authorized profile. Check your Pinterest API permissions.');
    connected=true;
    await loadSaved();
    // Restore media URLs from the signed-in owner's saved posts before trying
    // to fetch Pinterest again; these are account records, not browser storage.
    try{
      const saved=await window.__biglwaOrbitPosts?.storedOrbitImageUrls?.('pinterest');
      for(const [id,urls] of Object.entries(saved||{})){
        if(Array.isArray(urls)&&urls.length)hostedPinUrls.set(id,urls);
      }
      document.dispatchEvent(new CustomEvent('biglwa:pinterest-preview-updated'));
    }catch(error){console.warn('Pinterest hosted photo restore:',error)}
    diagnostic='Pinterest connected as @'+profile.username+'.';
    document.dispatchEvent(new CustomEvent('biglwa:pinterest-status',{detail:{connected:true,uid:authUid,username:profile.username}}));
    render();
    // Persist the connected account's public details, not its bearer token.
    try{await (window.__biglwaConnections?.refreshSource?.('pinterest',authUid) || window.__biglwaConnections?.refresh?.(authUid))}catch(error){console.warn('Pinterest connection mirror:',error)}
    await loadBoards();
    if(!boardId&&boards.length)boardId=String(orderedBoards()[0]?.id||'');
    if(boardId)await loadPins(boardId);
    await loadCreatedPins();
    await refreshPinStates();
    render();
    // Background pages keep populating the view while the first page is usable.
    void hydrateBrowse({scope:'all',uid:authUid,selected:boardId});
  },{silent:true});
  try{return await restorePromise}finally{restorePromise=null}
 }
 async function syncAllBoards(){
  if(!connected)return;
  return run(async()=>{
    if(syncingAll)return;
    const uid=authUid;
    syncingAll=true;importError='';progress('Refreshing Boards and original Pins…');
    try{
      boards=[];boardId='';pins=[];pinsNext='';covers={};
      await loadBoards();
      if(uid!==authUid)throw Error('Account changed during Pinterest sync.');
      if(boards.length){boardId=String(orderedBoards()[0]?.id||'');if(boardId)await loadPins(boardId)}
      await loadCreatedPins(false);
      await refreshPinStates();
      message='Boards refreshed. '+createdPins.length+' original Pins saved privately to your BIGLWA profile.';
      await (window.__biglwaConnections?.refreshSource?.('pinterest',authUid)||window.__biglwaConnections?.refresh?.(authUid));
    }catch(error){importError=error?.message||'Pinterest sync failed. Retry.';message=importError;}
    finally{syncingAll=false;render()}
  });
 }
 async function choose(id,more=false){if(!/^\d+$/.test(id)||!boards.some(b=>String(b.id)===String(id)))return;
  await run(async()=>{
    if(!more){activeSavedBoard='';originalView=false;scrollBoardAfterRender=true;rememberBoardSelection(id);boardId=id;pins=[];pinsNext='';selectedBoardPins.clear();void loadCovers()}
    await loadPins(id,more);
    if(!more)void hydrateBrowse({scope:'pins',uid:authUid,selected:id});
  });
 }
 async function disconnect(){await run(async()=>{
  const token=await firebaseIdToken();
  const body=token?{firebaseIdToken:token}:{};
  await api('disconnect',body);save('');resetView();await window.__biglwaConnections?.forget?.('pinterest');
 })}
 function image(pin){
  if(!pin)return '';
  const imgs=pin.media?.images||pin.media?.items?.[0]?.images||pin.images||{};
  const candidates=[imgs['600x'],imgs['400x300'],imgs['237x'],imgs.originals,imgs.original,...Object.values(imgs),pin.image_url,pin.imageUrl,pin.image?.url,typeof pin.image==='string'?pin.image:'',pin.media?.cover_image_url,pin.media?.image_url,pin.thumbnail_url,pin.media_url];
  for(const entry of candidates){
   const src=typeof entry==='string'?entry:entry?.url||entry?.src;
   try{const url=new URL(src);if(url.protocol==='https:'&&(url.hostname==='i.pinimg.com'||url.hostname.endsWith('.pinimg.com')))return url.href}catch{}
  }
  return '';
 }
 /* Pins reach the feed as cards, and Boards keeps its own grid, so both read this list. */
 function imageAlternates(pin){
  const images=pin?.media?.images||pin?.media?.items?.[0]?.images||pin?.images||{};
  return [...new Set([images.originals,images.original,images['600x'],images['400x300'],images['237x'],...Object.values(images),pin?.image_url,pin?.imageUrl,pin?.image?.url,pin?.thumbnail_url,pin?.media_url].map(x=>typeof x==='string'?x:x?.url||x?.src).filter(x=>{
   try{const u=new URL(x);return u.protocol==='https:'&&(u.hostname==='i.pinimg.com'||u.hostname.endsWith('.pinimg.com'))}catch{return false}
  }))];
 }
 function feedPins(){
  if(!connected)return[];
  const source=boardId?pins:boards.flatMap(b=>(b.pins||[]).map(p=>({...p,boardName:b.name})));
  return source.filter(p=>/^\d+$/.test(String(p.id||''))).slice(0,24);
 }
 function renderFeedList(list){
  // The Feed renders only published account posts. Never inject board saves.
  list=list||document.getElementById('feedPageList');
  if(list)list.querySelectorAll('.pinterest-feed-item:not(.biglwa-pin-post)').forEach(card=>card.remove());
 }
 function boardNameFor(id){return boards.find(b=>String(b.id)===String(id))?.name||''}
  /* The board grid is three across and two down. That is deliberately not the four-column
     feed, so the two grids read as different things. Before a connection it is six empty
     slots rather than a prompt, which shows the shape of what is coming without pretending
     there is something there. A board with no cover yet keeps its slot and waits. */
 function pinActions(id){
  return '<div class="pn-pin-actions pn-compact-actions"><button type="button" data-pn-save-pin="'+esc(id)+'" aria-label="Save Pin to boards" title="Save to boards">⊞</button><a href="https://www.pinterest.com/pin/'+esc(id)+'/" target="_blank" rel="noopener noreferrer" aria-label="Open original Pin on Pinterest" title="Open original Pin">↗</a></div>';
 }
 function selectionActions(original,count){
  const which=original?'original':'board';
  const privateSaveUnavailable=original&&count>0&&createdPins.filter(p=>selectedOriginalPins.has(String(p.id))).every(p=>['private','archived','live'].includes(profilePinStates.get(String(p.id))));
  return '<div class="pn-selection-toolbar" role="group" aria-label="Selected Pin actions">'+
   '<button type="button" data-pn-select-'+which+'-all>Select all</button>'+
   '<span aria-live="polite">'+count+' selected</span>'+
   (count?'<button type="button" data-pn-deselect>Deselect</button>'+
    '<button type="button" data-pn-send-selected="boards" data-pn-selection="'+which+'">⊞ Boards</button>'+
    '<button type="button" data-pn-import-'+which+(privateSaveUnavailable?' disabled aria-disabled="true" title="Already in your private Archive"':'')+'>Keep private in Archive</button>'+
    '<button type="button" data-pn-send-selected="feed" data-pn-selection="'+which+'">Post to MyFeed</button>'+
    '<button type="button" data-pn-send-selected="veve" data-pn-selection="'+which+'">Post to Veve</button>':'')+'</div>';
 }
 function openPinPreview(id){
  const pin=pinById(id);if(!pin)return;
  document.querySelector('#pnPinPreview')?.close();document.querySelector('#pnPinPreview')?.remove();
  const dialog=document.createElement('dialog');dialog.id='pnPinPreview';dialog.className='pn-pin-preview';
  const title=String(pin.title||pin.description||'Pinterest Pin');
  const src=(hostedPinUrls.get(String(id))||[])[0]||image(pin)||pin.image||'';
  const neighbours=[...new Map([...pins,...createdPins].filter(p=>String(p.id)!==String(id)&&image(p)).map(p=>[String(p.id),p])).values()].slice(0,12);
  dialog.setAttribute('aria-label','Pin preview');
  dialog.innerHTML='<button type="button" class="pn-preview-close" aria-label="Close Pin preview">×</button>'+
   '<div class="pn-preview-layout"><div class="pn-preview-image"><img src="'+esc(src)+'" alt="'+esc(title)+'"></div>'+
   '<aside><h2>'+esc(title)+'</h2>'+pinActions(id)+
   (neighbours.length?'<h3>More from your boards</h3><div class="pn-preview-neighbours">'+neighbours.map(p=>'<button type="button" data-pn-preview="'+esc(p.id)+'" aria-label="Enlarge '+esc(p.title||'Pin')+'"><img src="'+esc(image(p))+'" alt="" loading="lazy"></button>').join('')+'</div>':'')+'</aside></div>';
  dialog.querySelector('.pn-preview-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  document.body.append(dialog);dialog.showModal();
 }
 function openBoardPicker(ids){
  const selected=[...new Set(ids.map(String))].filter(id=>pinById(id));
  document.querySelector('#pnBoardDestination')?.close();document.querySelector('#pnBoardDestination')?.remove();
  const dialog=document.createElement('dialog');dialog.id='pnBoardDestination';dialog.className='pn-board-destination';
  dialog.setAttribute('aria-labelledby','pnDestinationTitle');
  dialog.innerHTML='<header><h2 id="pnDestinationTitle">'+(selected.length?'Save '+selected.length+' Pin'+(selected.length===1?'':'s')+' to boards':'Your boards')+'</h2><button type="button" data-pn-picker-close aria-label="Close board picker">×</button></header>'+
   '<p>Choose one or more BIG LWA boards. Pins stay private here.</p><div class="pn-destination-list"></div>'+
   '<form class="pn-destination-create"><label for="pnNewBoardTitle">New board</label><div><input id="pnNewBoardTitle" maxlength="100" placeholder="Board name" required><button type="submit">Create board</button></div></form>'+
   '<footer><button type="button" data-pn-picker-save'+(!selected.length?' hidden':'')+'>Save to selected boards</button>'+
   (selected.length?'<button type="button" data-pn-picker-publish="feed">MyFeed</button><button type="button" data-pn-picker-publish="veve">Veve</button>':'')+'</footer><p class="pn-destination-status" role="status" aria-live="polite"></p>';
  const list=dialog.querySelector('.pn-destination-list'),status=dialog.querySelector('[role="status"]'),picked=new Set();
  const paint=()=>{
   list.innerHTML=savedLibrary.boards.length?savedLibrary.boards.map(b=>'<label><input type="checkbox" value="'+esc(b.id)+'"'+(picked.has(b.id)?' checked':'')+'><span>'+esc(b.title)+'</span><small>'+b.pins.length+' Pins</small></label>').join(''):'<p>No BIG LWA boards yet. Create one below.</p>';
   const save=dialog.querySelector('[data-pn-picker-save]');save.disabled=!picked.size||!selected.length;
  };
  list.addEventListener('change',e=>{if(e.target.checked)picked.add(e.target.value);else picked.delete(e.target.value);paint()});
  dialog.querySelector('[data-pn-picker-close]').onclick=()=>dialog.close();
  dialog.querySelector('form').onsubmit=async e=>{
   e.preventDefault();const input=dialog.querySelector('#pnNewBoardTitle'),button=e.submitter;
   if(!input.value.trim())return;button.disabled=true;status.textContent='Creating board…';
   try{const board=await createVeveBoard(input.value);picked.add(board.id);input.value='';paint();status.textContent='Created “'+board.title+'”.'+(selected.length?' Choose Save to add your Pin'+(selected.length===1?'':'s')+'.':'');}
   catch(error){status.textContent=error.message}finally{button.disabled=false}
  };
  dialog.querySelector('[data-pn-picker-save]').onclick=async e=>{
   const button=e.currentTarget,targets=[...picked];button.disabled=true;status.textContent='Saving…';
   try{
    const uid=authUid;if(!uid)throw Error('Sign in before saving Pins.');
    const names=[];
    for(const target of targets){
     for(const id of selected){
      if(uid!==authUid)throw Error('Account changed; save stopped.');
      const pin=pinById(id);if(!pin)throw Error('This Pin is no longer loaded.');
      const result=await saveVevePin({pinId:id,title:pin.title||pin.description,image:image(pin)||pin.image,url:'https://www.pinterest.com/pin/'+id+'/'},target);
      if(!names.includes(result.board))names.push(result.board);
     }
    }
    status.textContent=selected.length+' Pin'+(selected.length===1?'':'s')+' saved to '+names.map(n=>'“'+n+'”').join(', ')+'.';
    const view=document.createElement('button');view.type='button';view.textContent='View '+names[0];
    view.onclick=()=>{activeSavedBoard=targets[0];recentBoardIds=[activeSavedBoard,...recentBoardIds.filter(id=>id!==activeSavedBoard)];try{localStorage.setItem(recentBoardKey(),JSON.stringify(recentBoardIds))}catch{}originalView=false;selectedBoardPins.clear();scrollBoardAfterRender=true;dialog.close();document.querySelector('#pnPinPreview')?.close();render()};status.append(' ',view);
    selectedBoardPins.clear();selectedOriginalPins.clear();render();
   }catch(error){status.textContent=error.message}finally{button.disabled=false}
  };
  dialog.querySelectorAll('[data-pn-picker-publish]').forEach(button=>button.onclick=()=>{const to=button.dataset.pnPickerPublish;dialog.close();document.querySelector('#pnPinPreview')?.close();publishSelection(selected,to)});
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);paint();dialog.showModal();
  if(savedUid!==authUid)loadSaved().then(()=>{if(dialog.isConnected)paint()});
 }
 async function discoveryDestination(postId,featured){
  const [{getApps},{getAuth},{getFirestore,doc,writeBatch}]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js')]);
  const app=getApps()[0],user=app&&getAuth(app).currentUser;
  if(!user||user.uid!==authUid)throw Error('Account changed; posting stopped.');
  const db=getFirestore(app),batch=writeBatch(db),patch={veveFeatured:featured,veveOptOut:!featured};
  batch.update(doc(db,'posts',postId),patch);batch.set(doc(db,'users',user.uid,'posts',postId),patch,{merge:true});await batch.commit();
 }
 async function publishSelection(ids,destination){
  const picked=ids.map(pinById).filter(Boolean);if(!picked.length){notice('Select Pins first.');return}
  if(activeSavedBoard&&boardLocks[activeSavedBoard]===true){notice('Unlock this board before posting its Pins.');return}
  const label=destination==='veve'?'Veve':'MyFeed';
  if(!window.confirm('Post '+picked.length+' selected Pin'+(picked.length===1?'':'s')+' publicly to '+label+'?'+(destination==='veve'?' Veve posts also appear on MyFeed.':'')))return;
  const uid=authUid;
  await run(async()=>{
   const importer=await waitForImporter(),publisher=window.__biglwaOrbitPosts?.publishOrbitPost;
   if(typeof importer!=='function'||typeof publisher!=='function')throw Error('Posting is still loading. Try again shortly.');
   let posted=0;
   for(const pin of picked){
    if(uid!==authUid)throw Error('Account changed; posting stopped.');
    await publishOnePin({...pin,biglwaPinterestOrigin:originalView?'created':'board',biglwaPinterestBoardId:activeSavedBoard||boardId},importer,async postId=>{
     await discoveryDestination(postId,destination==='veve');await publisher(postId);
    });posted++;profilePinStates.set(String(pin.id),'live');
    progress('Posted '+posted+' / '+picked.length+' to '+label);
   }
   selectedBoardPins.clear();selectedOriginalPins.clear();notice(posted+' Pin'+(posted===1?'':'s')+' posted to '+label+'.');
   window.dispatchEvent(new CustomEvent('biglwa:orbit-imported',{detail:{source:'pinterest',published:posted}}));window.BigLWAVeve?.refresh?.();
  });
 }

 function boardGrid(disabled){
  /* Before a connection the six slots are the connection control itself. They used to be
     inert divs marked aria-hidden, so the tiles that plainly said "Connect Pinterest" did
     nothing when tapped, which read as the button being broken. Each tile now connects. */
  if(!connected&&!savedLibrary.boards.length){
   const tile='<button type="button" class="pinterest-board is-empty" data-pn-connect'+(disabled||'')+'><span>Connect Pinterest</span></button>';
   return '<div class="pinterest-board-grid">'+Array.from({length:6},()=>tile).join('')+'</div>';
  }
  if(!boards.length&&!savedLibrary.boards.length)return'<p role="status">No boards yet. Create a board above.</p>';
  const entries=[...orderedBoards().map(b=>({...b,local:false})),...savedLibrary.boards.map(b=>({...b,name:b.title,pin_count:b.pins.length,local:true}))];
  entries.sort((a,b)=>{const ai=recentBoardIds.indexOf(String(a.id)),bi=recentBoardIds.indexOf(String(b.id));return (ai<0?1e6:ai)-(bi<0?1e6:bi)});
  const tiles=(showAllBoards?entries:entries.slice(0,6)).map(b=>{
   const coverEntry=b.local?{images:b.pins.slice(0,3).map(p=>p.image).filter(Boolean)}:covers[b.id];
   const urls=Array.isArray(coverEntry?.images)?coverEntry.images.filter(Boolean).slice(0,3):[];
   const cover=typeof coverEntry==='string'?coverEntry:coverEntry?.url||image(coverEntry)||image(b);
   if(!urls.length&&cover)urls.push(cover);
   const previews=urls.map((url,index)=>'<img class="pinterest-board-preview pn-cover-'+index+'" loading="lazy" src="'+esc(url)+'" alt="" aria-hidden="true">').join('');
   return '<button type="button" '+(b.local?'data-pn-saved-board':'data-pn-board')+'="'+esc(String(b.id))+'" class="pinterest-board'+(urls.length?'':' is-empty')+'" aria-label="Open '+esc(b.name)+' board">'+
    '<span class="pinterest-board-media">'+(previews||'<span>⊞</span>')+'</span>'+
    '<span class="pinterest-board-copy"><strong>'+esc(b.name)+'</strong><small>'+b.pin_count+' Pins · '+(b.local?'BIG LWA':'Pinterest')+'</small></span></button>';
  });
  /* Fewer than six boards still fill the grid, so the row never looks half drawn. */

  return '<div class="pinterest-board-grid">'+tiles.join('')+'</div>'+((entries.length>6)?'<button type="button" data-pn-toggle-boards>'+(showAllBoards?'Show recent six':'Browse all '+entries.length+' boards')+'</button>':'');
 }
 // Private board saves are not mounted into Collective Feed.
 const waitForImporter=()=>new Promise(resolve=>{
  let attempts=0;
  const check=()=>{
    const fn=window.__biglwaOrbitPosts?.importOrbitMedia;
    if(typeof fn==='function')return resolve(fn);
    if(attempts++>=75)return resolve(null);
    setTimeout(check,200);
  };
  check();
 });

 function render(){
  document.querySelectorAll('[data-orbit-app="pinterest"]').forEach(el=>{el.classList.toggle('orbit-connected',connected);el.setAttribute('aria-label',connected?'Open Pinterest boards':'Connect Pinterest')});
  renderFeedList();
  document.querySelectorAll('[data-orbit-path="pinterest"]').forEach(input=>{
 const actions=input.closest('.module-orbit-row')?.querySelector('.module-actions');if(!actions)return;
 let b=actions.querySelector('[data-pn-open]');if(!b){b=document.createElement('button');b.type='button';b.className='module-action';b.dataset.pnOpen='';actions.prepend(b)}b.textContent=connected?'Boards ↗':'Connect Pinterest';b.disabled=busy;
 });
 const body=document.getElementById('moduleWorkspaceBody');
 if(!body||document.getElementById('moduleRouteName')?.textContent!=='Boards')return;
 let panel=document.getElementById('pinterestBoards');
 if(!panel){panel=document.createElement('section');panel.id='pinterestBoards';panel.className='module-card';panel.style.marginTop='20px';const heading=body.querySelector('.module-heading');if(heading)heading.after(panel);else body.prepend(panel)}
 panel.setAttribute('aria-busy',String(busy));
 // One selected image enters multi-select mode. All other checkboxes appear
 // until the final selection is cleared, on both imported and original Pins.
 panel.classList.toggle('pn-selection-active',selectedBoardPins.size>0||selectedOriginalPins.size>0);
 const disabled=''; // Keep connected controls usable while run() queues work.
 const originalPinsMarkup=
  (connected?'<section class="pinterest-owned-section"><header><h3>Original Pins <small>('+createdPins.length+(createdNext?'+':'')+')</small></h3>'+
    '<p>Original Pins stay private in your BIG LWA profile unless you later choose to publish them from myfeed.</p>'+
    selectionActions(true,selectedOriginalPins.size)+'</header><div class="pinterest-owned-grid">'+
    (createdPins.map(pin=>{const id=String(pin.id||'');const pic=(hostedPinUrls.get(id)||[])[0]||image(pin);
      const status=profilePinStates.get(id)||'unknown';
      return '<article class="pn-owned-pin-choice" data-pn-owned-pin="'+esc(id)+'">'+
       '<label class="pn-pin-check"><input aria-label="Select Pin" type="checkbox" data-pn-original-select="'+esc(id)+'"'+(selectedOriginalPins.has(id)?' checked':'')+'><span>Select</span></label>'+
       '<button type="button" class="pn-pin-photo" data-pn-preview="'+esc(id)+'" aria-label="Enlarge Pin">'+
       (pic?'<img loading="lazy" src="'+esc(pic)+'" alt="'+esc(pin.title||pin.description||'Original Pin')+'">':'<span>Original Pin</span>')+'</button>'+pinActions(id)+
       '<small class="pn-publish-status '+(status==='live'?'is-live':'')+'">'+(status==='live'?'● Shared to myfeed':status==='archived'?'Archived · not live':status==='private'?'Private in Archive':'On Pinterest')+'</small></article>';
    }).join('')||'<p>No original Pins were returned.</p>')+'</div>'+
    (createdNext?'<p class="pn-more-loading">More original Pins are loading automatically.</p>':'')+'</section>':'');
 const connectedName=String(profile.username||profile.business_name||'').trim().replace(/^@/,'');
 const safeName=/^[\w.]{1,80}$/.test(connectedName)?connectedName:'';
 const qwikHref=safeName?'https://www.pinterest.com/'+encodeURIComponent(safeName)+'/':'https://www.pinterest.com/';
 const headerControls=connected
   ?'<button type="button" class="module-action" data-pn-refresh>↻ Refresh</button>'+
    '<span class="pn-synced-hint" title="Pins refresh when you visit Boards">Automatically synced</span>'
   :'<button type="button" class="module-action pn-orbit-connect" data-pn-connect'+disabled+'>🪐 Connect Pinterest</button>';
 const selectedSet=originalView?selectedOriginalPins:selectedBoardPins;
 const activePins=originalView?createdPins:activeSavedBoard?(savedLibrary.boards.find(b=>b.id===activeSavedBoard)?.pins||[]):pins;
 const activeName=originalView?'Original Pins':activeSavedBoard?(savedLibrary.boards.find(b=>b.id===activeSavedBoard)?.title||'Board'):boardNameFor(boardId);
 const allBoardOptions='<option value="">All boards</option>'+orderedBoards().map(b=>'<option value="p:'+esc(String(b.id))+'"'+(!originalView&&!activeSavedBoard&&String(boardId)===String(b.id)?' selected':'')+'>'+esc(b.name)+'</option>').join('')+savedLibrary.boards.map(b=>'<option value="s:'+esc(String(b.id))+'"'+(!originalView&&activeSavedBoard===b.id?' selected':'')+'>'+esc(b.title)+' · BIG LWA</option>').join('');
 const boardPicker='<h3 id="pnActiveBoardTitle">'+esc(activeName||'Pins')+'</h3>';
 const boardActions=selectionActions(false,selectedSet.size);
 panel.innerHTML='<div class="pn-primary-head"><div class="pn-primary-identity"><h2>board</h2>'+
   '<div class="pn-connected-row"><span class="pn-orbit-planet" aria-hidden="true">●</span><span>'+
   (connected?'Pinterest connected'+(safeName?' · @'+esc(safeName):''):'Pinterest not connected')+'</span>'+
   (connected?'<a class="pn-qwiklinkz" href="'+esc(qwikHref)+'" target="_blank" rel="noopener noreferrer" title="Open Pinterest profile in a new tab">↗ Qwiklinkz</a>':'')+
   '</div></div><div class="pn-head-controls">'+headerControls+
   (authUid?'<div class="pn-new-board-combo"><button type="button" class="module-action pn-new-board" data-pn-new-board title="Create a private BIG LWA board">+ New board</button>'+
   '<button type="button" class="pn-manage-board-menu" data-pn-manage-boards aria-controls="pnSavedLibraryDrawer" aria-expanded="'+String(savedDrawerOpen)+'" title="Manage saved boards">▾</button></div>':'')+
   '</div></div>'+
   (authUid&&savedDrawerOpen?'<div class="pn-saved-popover" id="pnSavedLibraryDrawer" role="region" aria-label="Manage BIGLWA saved boards">'+
      '<div class="pn-saved-popover-top"><b>Board management</b><button type="button" data-pn-manage-boards aria-label="Close board management">×</button></div>'+
      '<div class="pn-popover-actions">'+(connected?'<button type="button" class="module-action pn-secondary" data-pn-disconnect>Disconnect Pinterest</button>':'')+'</div>'+
      savedBoardsMarkup()+'</div>':'')+
   (busy||operationProgress||queuedTasks?'<div class="pn-import-progress" role="status" aria-live="polite" data-state="loading"><span class="pn-operation-indicator" aria-hidden="true"></span>'+esc(operationProgress||(queuedTasks?'Queued actions':'Syncing privately in the background'))+'</div>':'')+ 
   (message?'<p class="pn-notice" role="status">'+esc(message)+'</p>':'')+
   (/error|expired|reconnect|zero boards|unavailable|failed|unauthorized/i.test(diagnostic)?'<p class="pinterest-diagnostics" role="status">'+esc(diagnostic)+'</p>':'')+
   (importError?'<p role="alert">'+esc(importError)+'</p>':'')+
  /* The grid sits outside the connected branch on purpose: the shape of what is coming is
     useful before anyone connects, and it is the same six slots either way. */
  (!boards.length&&busy?'<p>Loading boards from Pinterest…</p>':'')+
  boardGrid(disabled)+
  '<div class="pn-browse-tabs"><button type="button" data-pn-original-view aria-pressed="'+originalView+'">Original Pins</button><select id="pinterestAllBoards" aria-label="All boards">'+allBoardOptions+'</select></div>'+
  '<div class="pn-current-board-bar" id="pnActiveBoard">'+boardPicker+(!originalView?boardActions:'')+'</div>'+
  (!boards.length&&connected&&!busy?'<p>No public boards were returned for this account.</p>':'')+
  '<div class="pinterest-pin-grid"'+(originalView?' hidden':'')+'>'+activePins.filter(p=>/^\d+$/.test(String(p.id||''))).map(p=>{
   const src=(hostedPinUrls.get(String(p.id))||[])[0]||image(p);const id=esc(String(p.id));
   const caption=esc(p.title||p.description||p.alt_text||'Pinterest Pin');
   return '<article class="pinterest-pin" data-pn-pin-card="'+id+'">'+
    '<label class="pn-pin-check"><input aria-label="Select Pin" type="checkbox" data-pn-board-select="'+id+'"'+(selectedBoardPins.has(String(p.id))?' checked':'')+'><span>Select</span></label>'+
    '<button type="button" class="pn-pin-photo" data-pn-preview="'+id+'" aria-label="Enlarge '+caption+'">'+
    (src?'<img loading="lazy" src="'+esc(src)+'" alt="'+caption+'">':'<span class="pn-pin-placeholder">Image unavailable</span>')+'</button>'+pinActions(id)+
    (caption?'<p class="pn-pin-caption">'+caption+'</p>':'')+'</article>';
  }).join('')+'</div>'+
 (boardId&&!activePins.length&&!busy?'<p>No Pins in this board yet.</p>':'')+
 (!activeSavedBoard&&pinsNext?'<p class="pn-more-loading">Loading more Pins automatically…</p>':'')+(originalView?originalPinsMarkup:'');
 if(scrollBoardAfterRender){scrollBoardAfterRender=false;requestAnimationFrame(()=>document.getElementById('pnActiveBoard')?.scrollIntoView({behavior:'smooth',block:'start'}))}
}
document.addEventListener('change',e=>{
 const target=e.target;
 if(target?.id==='pinterestAllBoards'){
  originalView=false;selectedBoardPins.clear();selectedOriginalPins.clear();
  if(!target.value){showAllBoards=true;activeSavedBoard='';boardId='';pins=[];pinsNext='';render();return}
  const id=target.value.slice(2);
  if(target.value.startsWith('s:')){activeSavedBoard=id;recentBoardIds=[id,...recentBoardIds.filter(value=>value!==id)];try{localStorage.setItem(recentBoardKey(),JSON.stringify(recentBoardIds))}catch{}scrollBoardAfterRender=true;render()}else choose(id);
  return;
 }
 if(target?.matches?.('[data-pn-board-select],[data-pn-original-select]')){
  const original=target.hasAttribute('data-pn-original-select'),id=target.getAttribute(original?'data-pn-original-select':'data-pn-board-select');
  const set=original?selectedOriginalPins:selectedBoardPins;
  if(target.checked)set.add(id);else set.delete(id);
  render();return;
 }
 if(target?.id==='pinterestBoardPicker'){
  if(!target.value){boardId='';pins=[];pinsNext='';selectedBoardPins.clear();render()}else choose(target.value)
 }
});
document.addEventListener('click',e=>{
 if(!(e.target instanceof Element))return;
 const lock=e.target.closest('[data-pn-lock-board]');
 if(lock){e.preventDefault();e.stopImmediatePropagation();toggleSavedBoardLock(lock.dataset.pnLockBoard);return;}
 const manageBoards=e.target.closest('[data-pn-manage-boards]');
 if(manageBoards){e.preventDefault();e.stopImmediatePropagation();savedDrawerOpen=!savedDrawerOpen;render();return;}
 const newBoard=e.target.closest('[data-pn-new-board]');
 if(newBoard){e.preventDefault();e.stopImmediatePropagation();openBoardPicker([]);return;}
 const preview=e.target.closest('[data-pn-preview]');
 if(preview){e.preventDefault();e.stopImmediatePropagation();openPinPreview(preview.dataset.pnPreview);return}
 const savePin=e.target.closest('[data-pn-save-pin]');
 if(savePin){e.preventDefault();e.stopImmediatePropagation();openBoardPicker([savePin.dataset.pnSavePin]);return}
 const savedTile=e.target.closest('[data-pn-saved-board]');
 if(savedTile){e.preventDefault();e.stopImmediatePropagation();activeSavedBoard=savedTile.dataset.pnSavedBoard;recentBoardIds=[activeSavedBoard,...recentBoardIds.filter(id=>id!==activeSavedBoard)];try{localStorage.setItem(recentBoardKey(),JSON.stringify(recentBoardIds))}catch{}originalView=false;selectedBoardPins.clear();scrollBoardAfterRender=true;render();return}
 if(e.target.closest('[data-pn-toggle-boards]')){e.preventDefault();showAllBoards=!showAllBoards;render();return}
 if(e.target.closest('[data-pn-original-view]')){e.preventDefault();originalView=!originalView;selectedBoardPins.clear();selectedOriginalPins.clear();scrollBoardAfterRender=true;render();return}
 const deselect=e.target.closest('[data-pn-deselect]');
 if(deselect){e.preventDefault();selectedBoardPins.clear();selectedOriginalPins.clear();render();return}
 const destination=e.target.closest('[data-pn-send-selected]');
 if(destination){e.preventDefault();e.stopImmediatePropagation();
   const original=destination.dataset.pnSelection==='original';
   const ids=[...(original?selectedOriginalPins:selectedBoardPins)];
   if(destination.dataset.pnSendSelected==='boards')openBoardPicker(ids);
   else publishSelection(ids,destination.dataset.pnSendSelected);
   return;
 }
 const allSelected=e.target.closest('[data-pn-select-board-all],[data-pn-select-original-all]');
 if(allSelected){e.preventDefault();e.stopImmediatePropagation();
  const original=allSelected.hasAttribute('data-pn-select-original-all');
  const list=original?createdPins:activeSavedBoard?(savedLibrary.boards.find(b=>b.id===activeSavedBoard)?.pins||[]):pins,set=original?selectedOriginalPins:selectedBoardPins;
  const ids=list.map(item=>String(item.id)).filter(id=>/^\d+$/.test(id));
  const all=ids.length&&ids.every(id=>set.has(id));
  for(const id of ids){if(all)set.delete(id);else set.add(id)}
  render();return;
 }
 if(e.target.closest('[data-pn-import-original],[data-pn-import-board]')){
   e.preventDefault();e.stopImmediatePropagation();
   const original=!!e.target.closest('[data-pn-import-original]');
   const picked=(original?createdPins:activeSavedBoard?(savedLibrary.boards.find(b=>b.id===activeSavedBoard)?.pins||[]):pins).filter(pin=>(original?selectedOriginalPins:selectedBoardPins).has(String(pin.id)));
   if(!picked.length){notice('Choose Pins first.');return}
   const unsaved=original?picked.filter(pin=>!['private','archived','live'].includes(profilePinStates.get(String(pin.id)))):picked;
   if(!unsaved.length){notice('Those Pins are already in your private Archive.');return}
   run(async()=>{await importSelectedPins(unsaved.map(pin=>({...pin,
     biglwaPinterestOrigin:original?'created':'board',biglwaPinterestBoardId:original?'':boardId
   })));(original?selectedOriginalPins:selectedBoardPins).clear()});return;
 }
 if(e.target.closest('[data-pn-publish-original]')){e.preventDefault();e.stopImmediatePropagation();notice('Save original Pins privately here; public sharing happens from myfeed.');return}
 const boardPublish=e.target.closest('[data-pn-publish-board]');
 if(boardPublish){e.preventDefault();e.stopImmediatePropagation();
   notice('Boards are private-first. Save Pins privately here, then choose what to share from myfeed.');return;}
 const publish=e.target.closest('[data-pn-publish]');
 if(publish){e.preventDefault();e.stopImmediatePropagation();notice('Save privately here; public sharing happens from myfeed.');return;}
 const rename=e.target.closest('[data-pn-rename-board]');
 if(rename){e.preventDefault();e.stopImmediatePropagation();
  const id=rename.dataset.pnRenameBoard;
  const item=savedLibrary.boards.find(b=>b.id===id);if(!item)return;
  const title=window.prompt('Rename your Big LWA board:',item.title);
  if(title==null)return;
  const clean=title.trim().slice(0,100);if(!clean){notice('Board name cannot be empty.');return;}
  editSaved(data=>{data.boards.find(b=>b.id===id).title=clean});return;}
 const removeBoard=e.target.closest('[data-pn-remove-board]');
 if(removeBoard){e.preventDefault();e.stopImmediatePropagation();
  const id=removeBoard.dataset.pnRemoveBoard;
  if(!window.confirm('Delete this Big LWA saved board and its saved Pin references? This does not delete the original Pinterest Pins.'))return;
  editSaved(data=>{data.boards=data.boards.filter(b=>b.id!==id)});return;}
 const editPin=e.target.closest('[data-pn-edit-saved]');
 if(editPin){e.preventDefault();e.stopImmediatePropagation();
  const bid=editPin.dataset.pnSavedFrom,id=editPin.dataset.pnEditSaved;
  const item=savedLibrary.boards.find(b=>b.id===bid)?.pins.find(p=>p.id===id);if(!item)return;
  const caption=window.prompt('Edit saved Pin caption:',item.title);
  if(caption==null)return;
  editSaved(data=>{data.boards.find(b=>b.id===bid).pins.find(p=>p.id===id).title=caption.trim().slice(0,300)||'Pinterest Pin'});return;}
 const removePin=e.target.closest('[data-pn-remove-saved]');
 if(removePin){e.preventDefault();e.stopImmediatePropagation();
  const bid=removePin.dataset.pnSavedFrom,id=removePin.dataset.pnRemoveSaved;
  editSaved(data=>{const b=data.boards.find(b=>b.id===bid);if(b)b.pins=b.pins.filter(p=>p.id!==id)});return;}
 const tile=e.target.closest('[data-pn-board]');if(tile){e.preventDefault();e.stopImmediatePropagation();choose(tile.dataset.pnBoard);return;}
 const b=e.target.closest('[data-pn-connect],[data-pn-open],[data-orbit-app="pinterest"],[data-pn-disconnect],[data-pn-refresh],[data-pn-more-boards],[data-pn-more-pins],[data-pn-more-created],[data-pn-sync]');
 if(!b)return;e.preventDefault();e.stopImmediatePropagation();
 if(b.hasAttribute('data-pn-disconnect'))disconnect();
 else if(b.hasAttribute('data-pn-sync'))syncAllBoards();
 else if(b.hasAttribute('data-pn-refresh'))run(async()=>{boardId='';pins=[];pinsNext='';boards=[];boardsNext='';await loadBoards();if(boards.length){boardId=String(orderedBoards()[0].id);await loadPins(boardId,false)}void hydrateBrowse({scope:'all',uid:authUid,selected:boardId});},{silent:true});
 else if(b.hasAttribute('data-pn-more-boards'))void hydrateBrowse({scope:'boards',uid:authUid});
 else if(b.hasAttribute('data-pn-more-pins'))void hydrateBrowse({scope:'pins',uid:authUid,selected:boardId});
 else if(b.hasAttribute('data-pn-more-created'))void hydrateBrowse({scope:'created',uid:authUid});
 else if(connected){window.openBIGLWAModule?.('boards');render()}
 else connect();
},true);
document.addEventListener('biglwa:module-open',()=>{
 const route=document.getElementById('moduleRouteName')?.textContent||'';
 if(route==='Boards')showAllBoards=false;
 render();
 if(route==='Boards' && (session()||authUid)){
  restore().catch(()=>{});
 }
});
async function watchAuth(){
 try{
  const [{getAuth},{initializeApp,getApps}]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js')
  ]);
  const app=getApps()[0]||initializeApp({apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',appId:'1:83232670555:web:e04927b20458390b3b507e'});
  const auth=getAuth(app);
  await auth.authStateReady();
  authUid=auth.currentUser?.uid||'';
  restoreBoardOrder();
  // Watch only Firebase transitions; a Pinterest 401 cannot change authUid.
  auth.onAuthStateChanged(user=>{
   const uid=user?.uid||'';
   if(uid===authUid)return;
   authUid=uid;
   resetView();
   restoreBoardOrder();
   if(uid){loadSaved().catch(()=>{});restore().catch(error=>console.warn('Pinterest account restore:',error));}
  });
  return authUid;
 }catch(error){console.warn('Pinterest auth observer:',error);return ''}
}
async function init(){
  const style=document.createElement('style');style.textContent='#pinterestBoards{font-size:16px}#pinterestBoards p,#pinterestBoards label{font-size:16px;line-height:1.5}#pinterestBoards button,#pinterestBoards select{font-size:14px;min-height:42px}#pinterestBoards button:disabled{opacity:.55;cursor:wait}.pinterest-board-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:20px 0}.pinterest-board{position:relative;display:flex;flex-direction:column;justify-content:flex-end;min-height:150px;overflow:hidden;border:1px solid #d8cec5;border-radius:14px;background:#fffaf3;color:#302b28;text-decoration:none;box-shadow:0 10px 22px -16px rgba(48,43,40,.6)}.pinterest-board img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.pinterest-board strong,.pinterest-board small{position:relative;z-index:1;padding:0 12px;color:#fff;background:linear-gradient(180deg,transparent,rgba(24,16,14,.78) 62%);text-shadow:0 1px 3px rgba(0,0,0,.4)}.pinterest-board strong{padding-top:30px;font:600 15px/1.4 system-ui;overflow-wrap:anywhere}.pinterest-board small{padding-bottom:11px;font:600 12px/1.4 system-ui;opacity:.9}.pinterest-board.is-empty{display:grid;place-items:center;min-height:150px;width:100%;cursor:pointer;font:inherit;color:inherit;border-style:dashed;background:repeating-linear-gradient(45deg,#fffaf3,#fffaf3 10px,#fdf3e9 10px,#fdf3e9 20px)}.pinterest-board.is-empty:hover:not(:disabled){border-color:#a53332;border-style:solid}.pinterest-board.is-empty span{font:600 12px/1.4 system-ui;color:#9b8a7c;text-align:center;padding:8px}.pinterest-board:focus-visible{outline:3px solid #a53332}@media (max-width:760px){.pinterest-board-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}.pinterest-pin-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr));gap:16px;margin:20px 0}.pinterest-pin{border:1px solid #d8cec5;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;background:#fffaf3;color:#302b28;text-decoration:none}.pinterest-pin img{width:100%;height:230px;object-fit:cover}.pinterest-pin span,.pinterest-pin small{padding:10px 12px;overflow-wrap:anywhere}.pinterest-pin small{font-size:13px;margin-top:auto}.pinterest-pin:focus-visible{outline:3px solid #a53332}';document.head.append(style);
  if(!document.getElementById('pinterestBoardsStyle')){
   const link=document.createElement('link');
   link.id='pinterestBoardsStyle';link.rel='stylesheet';
   link.href='/pinterest-boards.css?v=20261022-hover-select-7&browse=20261029-destinations-1';
   document.head.append(link);
  }
 const url=new URL(location.href),handoff=url.searchParams.get('pinterest_handoff'),error=url.searchParams.get('pinterest_error');
 if(handoff){
  try{sessionStorage.setItem(PENDING_KEY,JSON.stringify({handoff,receivedAt:Date.now()}))}catch{}
 }
 if(handoff||error){
  url.searchParams.delete('pinterest_handoff');
  url.searchParams.delete('pinterest_error');
  history.replaceState(history.state,'',url.href);
 }
 if(error)notice(error);
 await watchAuth();
 let returning=Boolean(handoff||storageGet(PENDING_KEY));
 if(returning&&authUid){
  try{await finishPinterestHandoff()}
  catch(e){
   diagnostic=e.message||'Pinterest authorization could not be completed.';
   notice(diagnostic);
   // Keep a time-limited pending handoff to allow another attempt after account
   // restoration; do not return before auth and UI listeners are installed.
  }
 }
 render();
 /* Pinterest sends the tab back to the app, not to a module, so after the round trip the
    Boards page was never reopened and the freshly fetched boards stayed invisible. Reopen it
    and let the module-open listener run restore(), so the connection visibly lands. */
 if(returning&&authUid&&typeof window.openBIGLWAModule==='function')window.openBIGLWAModule('boards');
 if(authUid)await restore().catch(error=>console.warn('Pinterest provider restore:',error));
}
window.addEventListener('biglwa:session-verified',event=>{
 if(event.detail?.signedIn)return;
 clearTimeout(notice.timer);
 document.getElementById('pinterestNotice')?.remove();
});
window.addEventListener('biglwa:orbit-connection-save-error',event=>{
 if(event.detail?.source!=='pinterest')return;
 importError='Pinterest connected, but BIG LWA could not save that connection to your account. Check your Firebase access rules and try refreshing.';
 render();
});
// Veve uses the same private, account-backed saved-collection store as Boards.
 // Only verified public Pinterest pin IDs can enter a Pinterest collection;
 // no public feed post is edited or published by this action.
 async function saveVevePin(item,boardId='default_saved'){
   const uid=authUid;
   if(!uid)throw Error('Sign in to BIG LWA before saving a discovery Pin.');
   const id=String(item?.pinId||'');
   const target=String(boardId||'default_saved');
   if(!/^\d{6,25}$/.test(id))throw Error('This post has no valid Pinterest Pin ID.');
   const raw=String(item?.url||'');
   let url;
   try{url=new URL(raw)}catch{throw Error('The original Pinterest link is missing.')}
   if(url.protocol!=='https:'||!['www.pinterest.com','pinterest.com'].includes(url.hostname)||
      url.pathname.replace(/\/$/,'')!=='/pin/'+id)throw Error('This post is not an original Pinterest Pin link.');
   if(savedBusy)throw Error('Your boards are updating. Retry after the current save.');
   if(savedUid!==uid)await loadSaved();
   if(savedUid!==uid)throw Error('Saved boards could not be loaded. Retry without overwriting your existing collections.');
   if(uid!==authUid)throw Error('Account changed; please try again.');
   const next=JSON.parse(JSON.stringify(savedLibrary));
   let board=next.boards.find(b=>b.id===target);
   if(!board){
     if(target!=='default_saved')throw Error('Select an existing BIG LWA board.');
     board={id:'default_saved',title:'Saved',pins:[]};
     next.boards.unshift(board);
   }
   if(board.pins.some(p=>p.id===id))return {saved:true,already:true,board:board.title};
   if(board.pins.length>=400)throw Error('This collection is full (400 Pins).');
   const rawImage=String(item?.image||'');let image='';
   try{const u=new URL(rawImage);if(u.protocol==='https:'&&(u.hostname==='i.pinimg.com'||u.hostname.endsWith('.pinimg.com')))image=u.href}catch{}
   board.pins.unshift({id,title:String(item?.title||'Pinterest Pin').slice(0,300),
      image,url:'https://www.pinterest.com/pin/'+id+'/'});
   savedBusy=true;
   try{
     const result=await savedRequest('POST',next);
     if(uid!==authUid)throw Error('Account changed during save.');
     const found=result?.boards?.find(b=>b.id===target)?.pins?.some(p=>p.id===id);
     if(!found)throw Error('The saved Pin could not be verified. Retry.');
     savedLibrary=result;savedUid=uid;savedError='';
     document.dispatchEvent(new CustomEvent('biglwa:pinterest-preview-updated'));
     return {saved:true,already:false,board:board.title};
   }finally{savedBusy=false;render()}
 }
 async function createVeveBoard(title){
   const uid=authUid,clean=String(title||'').trim().slice(0,100);
   if(!uid)throw Error('Sign in to create a private BIG LWA board.');
   if(!clean)throw Error('Enter a board name.');
   if(savedUid!==uid)await loadSaved();
   if(savedUid!==uid)throw Error('Saved boards could not be loaded. Try again.');
   if(savedBusy)throw Error('Boards are still saving. Try again.');
   const next=JSON.parse(JSON.stringify(savedLibrary));
   if(next.boards.length>=40)throw Error('You have reached the 40-board limit.');
   const id='board_'+Array.from(crypto.getRandomValues(new Uint8Array(12))).map(n=>n.toString(16).padStart(2,'0')).join('');
   next.boards.push({id,title:clean,pins:[]});
   savedBusy=true;
   try{
     const result=await savedRequest('POST',next);
     if(uid!==authUid)throw Error('Account changed during board creation.');
     if(!result?.boards?.some(b=>b.id===id))throw Error('New board was not saved.');
     savedLibrary=result;savedUid=uid;
     document.dispatchEvent(new CustomEvent('biglwa:pinterest-preview-updated'));
     return {id,title:clean};
   }finally{savedBusy=false;render()}
 }
 const veveSavedBoards=()=>authUid?savedLibrary.boards.map(b=>({id:b.id,title:b.title,count:b.pins.length})):[];
window.__biglwaPinterest={connect,restore,syncAllBoards,disconnect,render,saveVevePin,createVeveBoard,veveSavedBoards,loadSaved,
  getPreview(){
   const seen=new Set(),out=[];
   const include=(id,url)=>{
    if(!url||seen.has(url)||out.length>=8)return;
    try{const parsed=new URL(url);if(parsed.protocol!=='https:')return;}catch{return}
    seen.add(url);out.push({id:String(id||''),url});
   };
   pins.forEach(pin=>include(pin.id,(hostedPinUrls.get(String(pin.id))||[])[0]||''));
   orderedBoards().forEach(board=>{
    const cover=covers[board.id];
    const urls=Array.isArray(cover?.images)?cover.images:[cover?.url||cover];
    urls.filter(Boolean).forEach(url=>include(board.id,url));
   });
   savedLibrary.boards.forEach(board=>board.pins.forEach(pin=>include(pin.id,(hostedPinUrls.get(String(pin.id))||[])[0]||'')));
   return out;
  },
  get state(){return {connected,uid:authUid,profile:connected?{...profile}:{}}},diagnostics:()=>({connected,boards:boards.length,pins:pins.length,originalPins:createdPins.length,hasMoreOriginals:Boolean(createdNext),selectedBoard:boardId,recentBoardIds:[...recentBoardIds],hasSession:Boolean(session()),busy,importError,diagnostic})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
}());