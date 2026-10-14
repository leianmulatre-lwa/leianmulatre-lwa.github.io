(function(){
'use strict';
if(window.__biglwaPinterest) return;
const API='https://biglwa-instagram-api.leianmulatre-284.workers.dev/pinterest/';
const KEY='biglwaPinterestSession';
const PENDING_KEY='biglwaPinterestPendingHandoffV2';
const OAUTH_UID_KEY='biglwaPinterestOauthStartingUid';
let handoffPromise=null;
 let savedLibrary={version:1,boards:[]}, savedUid='',savedBusy=false,savedError='';
 const pinById=id=>pins.find(p=>String(p.id)===String(id))||savedLibrary.boards.flatMap(b=>b.pins||[]).find(p=>String(p.id)===String(id));
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
   notice('Saved to your Big LWA collections.');
  }catch(error){savedError=error.message||'Could not update saved Pins.';notice(savedError)}
  finally{savedBusy=false;render()}
 }
 async function newSavedBoard(){
  const title=window.prompt('New Big LWA board name (private, not on Pinterest):');
  if(title==null)return;
  const clean=title.trim().slice(0,100);
  if(!clean){notice('Add a board name.');return;}
  if(savedLibrary.boards.length>=40){notice('Maximum 40 saved boards.');return;}
  const id='board_'+Array.from(crypto.getRandomValues(new Uint8Array(12))).map(n=>n.toString(16).padStart(2,'0')).join('');
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
 async function publishPin(pinId){
  const pin=pinById(pinId);
  if(!pin){notice('Load that Pinterest Pin first.');return}
  await run(async()=>{
   const importer=await waitForImporter();
   const publisher=window.__biglwaOrbitPosts?.publishOrbitPost;
   if(typeof importer!=='function'||typeof publisher!=='function')throw new Error('Collective Feed publisher is not ready. Refresh and try again.');
   const source={...pin,id:String(pinId),image_url:image(pin)||pin.image||'',
     url:'https://www.pinterest.com/pin/'+pinId+'/'};
   const imported=await importer('pinterest',[source],profile,window.__biglwaIdentity||{});
   if(!imported||!imported.imported||imported.partial)throw new Error('Pinterest card was not fully saved to your account. Try Sync Pins first.');
   const input=new TextEncoder().encode('pinterest:'+pinId);
   const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',input));
   const postId='orbit_'+Array.from(digest).map(n=>n.toString(16).padStart(2,'0')).join('').slice(0,40);
   await publisher(postId);
   window.dispatchEvent(new CustomEvent('biglwa:orbit-imported',{detail:{source:'pinterest',published:1}}));
   notice('Pin posted to Collective Feed.');
  });
 }
 function savedBoardsMarkup(){
  if(!connected)return '';
  const boardRows=savedLibrary.boards.map(board=>{
   const cols=(board.pins||[]).slice(0,16).map(pin=>
    '<article class="pn-saved-pin"><a href="'+esc(pin.url)+'" target="_blank" rel="noopener noreferrer">'+
    (pin.image?'<img src="'+esc(pin.image)+'" loading="lazy" alt="">':'')+'</a>'+
    '<span>'+esc(pin.title)+'</span>'+
    '<div class="pn-saved-pin-actions"><button type="button" data-pn-edit-saved="'+esc(pin.id)+'" data-pn-saved-from="'+esc(board.id)+'">Edit</button>'+
    '<button type="button" data-pn-remove-saved="'+esc(pin.id)+'" data-pn-saved-from="'+esc(board.id)+'">Remove</button>'+
    '<button type="button" data-pn-publish="'+esc(pin.id)+'">Post to Feed</button></div></article>').join('');
   return '<section class="pn-saved-board" data-pn-collection="'+esc(board.id)+'">'+
    '<header><h4>'+esc(board.title)+' <small>('+board.pins.length+')</small></h4>'+
    '<button type="button" data-pn-rename-board="'+esc(board.id)+'">Rename</button>'+
    '<button type="button" data-pn-remove-board="'+esc(board.id)+'">Delete board</button></header>'+
    '<div class="pn-saved-pin-grid">'+(cols||'<p>Save Pins from above to this board.</p>')+'</div></section>';
  }).join('');
  return '<section class="pn-saved-section" aria-label="Your saved Big LWA boards">'+
   '<div class="pn-saved-heading"><div><h3>Saved on Big LWA</h3><p>Your private collections sync to your account. They do not modify Pinterest boards.</p></div>'+
   '<button type="button" class="module-action" data-pn-new-board>+ New board</button></div>'+
   (savedError?'<p role="alert">'+esc(savedError)+'</p>':'')+
   (boardRows||'<p>Save a Pin to start a collection, or create a new board.</p>')+'</section>';
 }

 let connected=false,profile={},boards=[],pins=[],boardId='',boardsNext='',pinsNext='',busy=false,message='',covers={},restorePromise=null,boardsPromise=null,pinsPromise=null;
 let authUid='',lastImport={imported:0,skipped:0,partial:0},importError='',syncingAll=false,diagnostic='Awaiting Pinterest account synchronization';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const scopedKey=uid=>KEY+':'+uid;
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
  connected=false;profile={};boards=[];pins=[];boardId='';boardsNext='';pinsNext='';covers={};
  savedLibrary={version:1,boards:[]};savedUid='';savedError='';
  document.dispatchEvent(new CustomEvent('biglwa:pinterest-status',{detail:{connected:false,uid:authUid}}));
  restorePromise=null;boardsPromise=null;pinsPromise=null;lastImport={imported:0,skipped:0,partial:0};importError='';
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
   authUid=user?.uid||'';
   return user?await user.getIdToken():'';
  }catch{return ''}
 }
 async function recoverOrBindPinterestSession(){
  const token=await firebaseIdToken();
  if(!token||!authUid){resetView();return ''}
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
function notice(text){message=text;render();let el=document.getElementById('pinterestNotice');if(!el){el=document.createElement('div');el.id='pinterestNotice';el.setAttribute('role','status');el.style.cssText='position:fixed;right:18px;bottom:18px;max-width:360px;padding:16px;background:#fff5eb;color:#302b28;border:1px solid #ccc;border-radius:12px;z-index:15000';document.body.append(el)}el.textContent=text;clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.remove(),10000)}
async function api(path,body){
 const res=await fetch(API+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session()},...(body?{body:JSON.stringify(body)}:{})});
 const data=await res.json().catch(()=>({}));
 if(!res.ok){diagnostic='Pinterest '+path+' failed (HTTP '+res.status+'): '+String(data.error||'API request rejected');if(res.status===401){save('');resetView()}throw new Error(data.error||'Pinterest is not ready yet. Please try again after setup.')}
 return data;
}
async function run(fn){
 if(busy)return;busy=true;message='Loading Pinterest…';render();
 try{await fn();message=''}catch(e){notice(e.message)}
 finally{busy=false;render()}
}
async function connect(){await run(async()=>{
  if(!await firebaseIdToken())throw new Error('Sign in to BIG LWA before connecting Pinterest.');
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
  const returnTo=location.origin+'/studio/boards';
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
   if(!token || !authUid)throw new Error('Sign in to Big LWA to finish linking Pinterest.');
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
   render();
   loadCovers().then(render).catch(()=>{});
   return boards;
  })();
  try{return await boardsPromise}finally{boardsPromise=null}
 }
  /* Six covers is what the preview shows, so asking for more would spend the rate limit on
     tiles nobody sees. The Worker caches per session, so this is cheap after the first call. */
 async function loadCovers(){
  const ids=boards.filter(b=>/^\d+$/.test(String(b.id||''))).slice(0,6);
  if(!ids.length)return;
  try{const data=await api('board-covers?ids='+ids.map(b=>b.id).join(','));covers={...covers,...(data.covers||{})};render()}catch{}finally{}
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
   pins=more?[...pins,...nextItems]:nextItems;pinsNext=data?.bookmark||data?.next_bookmark||'';
   diagnostic=nextItems.length?'Pinterest returned '+nextItems.length+' Pins from the selected board.':'Pinterest returned zero Pins for board '+id+'. Check access and whether the board contains Pins.';
   render();
   /* Pinterest was previously only held in this renderer. Persist every page of returned
      Pins into the same account/profile/Archive records as the other Orbit sources. */
   await importPinsToAccount(nextItems);
   render();
   return pins;
  })();
  try{return await pinsPromise}finally{pinsPromise=null}
 }
 async function restore(){
  await recoverOrBindPinterestSession();
  if(!session()){resetView();diagnostic='No linked Pinterest authorization found for this Big LWA account.';render();return}
  if(restorePromise)return restorePromise;
  restorePromise=run(async()=>{
    profile=await api('profile');
    if(!profile||typeof profile!=='object'||!profile.username)
     throw new Error('Pinterest did not return a readable authorized profile. Check your Pinterest API permissions.');
    connected=true;
    await loadSaved();
    diagnostic='Pinterest connected as @'+profile.username+'.';
    document.dispatchEvent(new CustomEvent('biglwa:pinterest-status',{detail:{connected:true,uid:authUid,username:profile.username}}));
    render();
    // Persist the connected account's public details, not its bearer token.
    try{await (window.__biglwaConnections?.refreshSource?.('pinterest',authUid) || window.__biglwaConnections?.refresh?.(authUid))}catch(error){console.warn('Pinterest connection mirror:',error)}
    await loadBoards();
    if(!boardId&&boards.length)boardId=String(boards[0].id||'');
    if(boardId)await loadPins(boardId);
    render();
  });
  try{return await restorePromise}finally{restorePromise=null}
 }
 async function syncAllBoards(){
  if(!connected||syncingAll)return;
  syncingAll=true;importError='';message='Syncing Pinterest boards to your profile…';render();
  let count=0,processed=0;
  try{
   // Do not exhaust the API or upload thousands of records in one click.
   // Up to six boards, first page of 25 Pins each. Selecting a board syncs more.
   for(const board of boards.slice(0,6)){
    if(!/^\d+$/.test(String(board?.id||'')))continue;
    const data=await api('boards/'+board.id+'/pins');
    const items=Array.isArray(data?.items)?data.items:[];
    if(!items.length)continue;
    const result=await importPinsToAccount(items);
    count+=result?.imported||0;
    processed++;
    message='Saved '+count+' Pins from '+processed+' boards to your profile…';
    render();
   }
   message='Synced '+count+' Pins from '+processed+' boards. Open individual boards to sync additional pages.';
   await (window.__biglwaConnections?.refreshSource?.('pinterest',authUid) || window.__biglwaConnections?.refresh?.(authUid));
  }catch(error){
   importError=error?.message||'Pinterest sync failed. Try again.';
   message='';
  }finally{syncingAll=false;render()}
 }
 async function choose(id,more=false){if(!/^\d+$/.test(id))return;await run(async()=>{
  if(!more){boardId=id;pins=[];pinsNext=''}
  await loadPins(id,more);
 })}
 async function disconnect(){await run(async()=>{
  const token=await firebaseIdToken();
  const body=token?{firebaseIdToken:token}:{};
  await api('disconnect',body);save('');resetView();await window.__biglwaConnections?.forget?.('pinterest');
 })}
 function image(pin){
  if(!pin)return '';
  const imgs=pin.media?.images||pin.media?.items?.[0]?.images||pin.images||{};
  const candidates=[imgs['600x'],imgs['400x300'],imgs['237x'],imgs.originals,imgs.original,...Object.values(imgs),pin.image_url,pin.imageUrl,pin.image?.url,pin.media?.cover_image_url,pin.media?.image_url,pin.thumbnail_url,pin.media_url];
  for(const entry of candidates){
   const src=typeof entry==='string'?entry:entry?.url||entry?.src;
   try{const url=new URL(src);if(url.protocol==='https:'&&(url.hostname==='i.pinimg.com'||url.hostname.endsWith('.pinimg.com')))return url.href}catch{}
  }
  return '';
 }
 /* Pins reach the feed as cards, and Boards keeps its own grid, so both read this list. */
 function feedPins(){
  if(!connected)return[];
  const source=boardId?pins:boards.flatMap(b=>(b.pins||[]).map(p=>({...p,boardName:b.name})));
  return source.filter(p=>/^\d+$/.test(String(p.id||''))).slice(0,24);
 }
 function renderFeedList(list){
  list=list||document.getElementById('feedPageList');if(!list)return;
  const durable=list.querySelectorAll('.biglwa-pin-post.pinterest-feed-item');
  list.querySelectorAll('.pinterest-feed-item:not(.biglwa-pin-post)').forEach(el=>el.remove());
  if(durable.length)return;
  const cards=feedPins().map(p=>{
   const src=image(p);
   const label=p.boardName||boardNameFor(p.board_id);
   return '<article class="module-list-item pinterest-feed-item" data-post-id="pinterest_'+esc(p.id)+'"><div style="width:100%"><small>Pinterest'+(label?' · '+esc(label):'')+'</small><b style="display:block;margin:4px 0 8px">'+esc(p.title||p.description||p.alt_text||'Pinterest Pin')+'</b>'+
   (src?'<img loading="lazy" src="'+esc(src)+'" alt="'+esc(p.alt_text||p.title||'Pinterest Pin')+'" style="display:block;width:100%;max-height:520px;object-fit:cover;border-radius:12px">':'')+
   '<a class="module-action ghost" href="https://www.pinterest.com/pin/'+esc(p.id)+'/" target="_blank" rel="noopener noreferrer" style="display:inline-flex;margin-top:9px">View on Pinterest</a></div></article>';
  });
  if(!cards.length)return;
  list.insertAdjacentHTML('afterbegin',cards.join(''));
 }
 function boardNameFor(id){return boards.find(b=>String(b.id)===String(id))?.name||''}
  /* The board grid is three across and two down. That is deliberately not the four-column
     feed, so the two grids read as different things. Before a connection it is six empty
     slots rather than a prompt, which shows the shape of what is coming without pretending
     there is something there. A board with no cover yet keeps its slot and waits. */
 function boardGrid(disabled){
  /* Before a connection the six slots are the connection control itself. They used to be
     inert divs marked aria-hidden, so the tiles that plainly said "Connect Pinterest" did
     nothing when tapped, which read as the button being broken. Each tile now connects. */
  if(!connected){
   const tile='<button type="button" class="pinterest-board is-empty" data-pn-connect'+(disabled||'')+'><span>Connect Pinterest</span></button>';
   return '<div class="pinterest-board-grid">'+Array.from({length:6},()=>tile).join('')+'</div>';
  }
  if(!boards.length)return'<p role="status">No Pinterest boards were returned. Use Refresh boards to retry.</p>';
  const tiles=boards.slice(0,6).map(b=>{
   const coverEntry=covers[b.id];
   const urls=Array.isArray(coverEntry?.images)?coverEntry.images.filter(Boolean).slice(0,3):[];
   const cover=typeof coverEntry==='string'?coverEntry:coverEntry?.url||image(coverEntry)||image(b);
   if(!urls.length&&cover)urls.push(cover);
   const previews=urls.map((url,index)=>
    '<img class="pinterest-board-preview pn-cover-'+index+'" loading="lazy" src="'+esc(url)+'" alt="" aria-hidden="true">').join('');
   return '<button type="button" data-pn-board="'+esc(String(b.id))+'" class="pinterest-board'+(cover?'':' is-empty')+'" aria-label="Open '+esc(b.name)+' board">'+
    '<span class="pinterest-board-media">'+(previews||'<span>No cover yet</span>')+'</span>'+
    '<span class="pinterest-board-copy"><strong>'+esc(b.name)+'</strong>'+
    '<small>'+(b.pin_count!=null?esc(String(b.pin_count))+' Pins':'View Pins')+'</small></span>'+
    '<span class="pinterest-board-stack" aria-hidden="true">▧ '+(b.pin_count||'')+'</span></button>';
  });
  /* Fewer than six boards still fill the grid, so the row never looks half drawn. */
  while(tiles.length<6)tiles.push('<div class="pinterest-board is-empty"><span>&nbsp;</span></div>');
  return '<div class="pinterest-board-grid">'+tiles.join('')+'</div>';
 }
 if(window.BIGLWAFeedMount)window.BIGLWAFeedMount('Pinterest','pinterest-feed-item',renderFeedList);
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
 let b=actions.querySelector('[data-pn-open]');if(!b){b=document.createElement('button');b.type='button';b.className='module-action';b.dataset.pnOpen='';actions.prepend(b)}b.textContent=connected?'View Pinterest boards':'Connect Pinterest';b.disabled=busy;
 });
 const body=document.getElementById('moduleWorkspaceBody');
 if(!body||document.getElementById('moduleRouteName')?.textContent!=='Boards')return;
 let panel=document.getElementById('pinterestBoards');
 if(!panel){panel=document.createElement('section');panel.id='pinterestBoards';panel.className='module-card';panel.style.marginTop='20px';const heading=body.querySelector('.module-heading');if(heading)heading.after(panel);else body.prepend(panel)}
 panel.setAttribute('aria-busy',String(busy));
 const disabled=busy?' disabled':'';
 panel.innerHTML='<h2>Pinterest boards</h2><p>'+(connected?'Connected as '+esc(profile.username||profile.business_name||'your Pinterest account'):'Connect Pinterest to browse your public boards and Pins here.')+'</p><div class="module-actions">'+
 (connected?'<button type="button" class="module-action" data-pn-refresh'+disabled+'>Refresh boards</button><button type="button" class="module-action" data-pn-sync'+(busy||syncingAll?' disabled':'')+'>Sync Pins to my profile</button><button type="button" class="module-action" data-pn-disconnect'+disabled+'>Disconnect</button>':'<button type="button" class="module-action" data-pn-connect'+disabled+'>Connect Pinterest</button>')+
  '</div><p role="status">'+esc(message)+'</p><p class="pinterest-diagnostics" role="status">'+esc(diagnostic)+'</p>'+(importError?'<p role="alert">'+esc(importError)+'</p>':'')+
  /* The grid sits outside the connected branch on purpose: the shape of what is coming is
     useful before anyone connects, and it is the same six slots either way. */
  (!boards.length&&busy?'<p>Loading boards from Pinterest…</p>':'')+
  boardGrid(disabled)+
  (connected?'<label for="pinterestBoardPicker">Choose a board</label><select id="pinterestBoardPicker" class="module-input"'+disabled+'><option value="">Select a public board</option>'+boards.map(b=>'<option value="'+esc(b.id)+'"'+(b.id===boardId?' selected':'')+'>'+esc(b.name)+'</option>').join('')+'</select>'+
  (boardsNext?'<button type="button" class="module-action" data-pn-more-boards'+disabled+'>Load more boards</button>':'')+
  (!boards.length&&!busy?'<p>No public boards were returned for this account.</p>':'')+
  '<div class="pinterest-pin-grid">'+pins.filter(p=>/^\d+$/.test(String(p.id||''))).map(p=>{
   const src=image(p);const id=esc(String(p.id));
   const caption=esc(p.title||p.description||p.alt_text||'Pinterest Pin');
   const opts='<option value="default_saved">Saved</option>'+
    savedLibrary.boards.filter(b=>b.id!=='default_saved').map(b=>'<option value="'+esc(b.id)+'">'+esc(b.title)+'</option>').join('');
   return '<article class="pinterest-pin" data-pn-pin-card="'+id+'">'+
    '<a class="pn-pin-photo" href="https://www.pinterest.com/pin/'+id+'/" target="_blank" rel="noopener noreferrer" aria-label="View '+caption+' on Pinterest">'+
    (src?'<img loading="lazy" src="'+esc(src)+'" alt="'+caption+'">':'<span class="pn-pin-placeholder">Image unavailable</span>')+'</a>'+
    '<div class="pn-pin-meta">'+(caption?'<p>'+caption+'</p>':'')+
    '<div class="pn-pin-actions"><button type="button" data-pn-publish="'+id+'">Post to Collective</button>'+
    '<label class="pn-save-select"><span>Board</span><select data-pn-target-board="'+id+'" aria-label="Save Pin into Big LWA board">'+opts+'</select></label>'+
    '<button type="button" data-pn-save-pin="'+id+'">Save</button>'+
    '<a href="https://www.pinterest.com/pin/'+id+'/" target="_blank" rel="noopener noreferrer" aria-label="View on Pinterest">↗</a></div></div></article>';
  }).join('')+'</div>'+
  savedBoardsMarkup()+
 (boardId&&!pins.length&&!busy?'<p>No Pins were returned for this board.</p>':'')+
 (pinsNext?'<button type="button" class="module-action" data-pn-more-pins'+disabled+'>Load more Pins</button>':''):'');
}
document.addEventListener('change',e=>{if(e.target.id==='pinterestBoardPicker'){if(!e.target.value){boardId='';pins=[];pinsNext='';render()}else choose(e.target.value)}});
document.addEventListener('click',e=>{
 if(!(e.target instanceof Element))return;
 const newBoard=e.target.closest('[data-pn-new-board]');
 if(newBoard){e.preventDefault();e.stopImmediatePropagation();newSavedBoard();return;}
 const savePin=e.target.closest('[data-pn-save-pin]');
 if(savePin){e.preventDefault();e.stopImmediatePropagation();
  const id=savePin.dataset.pnSavePin;
  const target=document.querySelector('[data-pn-target-board="'+id+'"]')?.value||'default_saved';
  addSavedPin(id,target);return;}
 const publish=e.target.closest('[data-pn-publish]');
 if(publish){e.preventDefault();e.stopImmediatePropagation();publishPin(publish.dataset.pnPublish);return;}
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
 const b=e.target.closest('[data-pn-connect],[data-pn-open],[data-orbit-app="pinterest"],[data-pn-disconnect],[data-pn-refresh],[data-pn-more-boards],[data-pn-more-pins],[data-pn-sync]');
 if(!b)return;e.preventDefault();e.stopImmediatePropagation();
 if(b.hasAttribute('data-pn-disconnect'))disconnect();
 else if(b.hasAttribute('data-pn-sync'))syncAllBoards();
 else if(b.hasAttribute('data-pn-refresh'))run(async()=>{boardId='';pins=[];pinsNext='';boards=[];boardsNext='';await loadBoards()});
 else if(b.hasAttribute('data-pn-more-boards'))run(()=>loadBoards(true));
 else if(b.hasAttribute('data-pn-more-pins'))choose(boardId,true);
 else if(connected){window.openBIGLWAModule?.('boards');render()}
 else connect();
},true);
document.addEventListener('biglwa:module-open',()=>{
 render();
 const route=document.getElementById('moduleRouteName')?.textContent||'';
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
  getAuth(app).onAuthStateChanged(user=>{
   const uid=user?.uid||'';
   if(uid===authUid)return;
   authUid=uid;
   resetView();
   if(uid)restore().catch(error=>console.warn('Pinterest account restore:',error));
  });
 }catch(error){console.warn('Pinterest auth observer:',error)}
}
async function init(){
  const style=document.createElement('style');style.textContent='#pinterestBoards{font-size:16px}#pinterestBoards p,#pinterestBoards label{font-size:16px;line-height:1.5}#pinterestBoards button,#pinterestBoards select{font-size:14px;min-height:42px}#pinterestBoards button:disabled{opacity:.55;cursor:wait}.pinterest-board-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:20px 0}.pinterest-board{position:relative;display:flex;flex-direction:column;justify-content:flex-end;min-height:150px;overflow:hidden;border:1px solid #d8cec5;border-radius:14px;background:#fffaf3;color:#302b28;text-decoration:none;box-shadow:0 10px 22px -16px rgba(48,43,40,.6)}.pinterest-board img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.pinterest-board strong,.pinterest-board small{position:relative;z-index:1;padding:0 12px;color:#fff;background:linear-gradient(180deg,transparent,rgba(24,16,14,.78) 62%);text-shadow:0 1px 3px rgba(0,0,0,.4)}.pinterest-board strong{padding-top:30px;font:600 15px/1.4 system-ui;overflow-wrap:anywhere}.pinterest-board small{padding-bottom:11px;font:600 12px/1.4 system-ui;opacity:.9}.pinterest-board.is-empty{display:grid;place-items:center;min-height:150px;width:100%;cursor:pointer;font:inherit;color:inherit;border-style:dashed;background:repeating-linear-gradient(45deg,#fffaf3,#fffaf3 10px,#fdf3e9 10px,#fdf3e9 20px)}.pinterest-board.is-empty:hover:not(:disabled){border-color:#a53332;border-style:solid}.pinterest-board.is-empty span{font:600 12px/1.4 system-ui;color:#9b8a7c;text-align:center;padding:8px}.pinterest-board:focus-visible{outline:3px solid #a53332}@media (max-width:760px){.pinterest-board-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}.pinterest-pin-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr));gap:16px;margin:20px 0}.pinterest-pin{border:1px solid #d8cec5;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;background:#fffaf3;color:#302b28;text-decoration:none}.pinterest-pin img{width:100%;height:230px;object-fit:cover}.pinterest-pin span,.pinterest-pin small{padding:10px 12px;overflow-wrap:anywhere}.pinterest-pin small{font-size:13px;margin-top:auto}.pinterest-pin:focus-visible{outline:3px solid #a53332}';document.head.append(style);
  if(!document.getElementById('pinterestBoardsStyle')){
   const link=document.createElement('link');
   link.id='pinterestBoardsStyle';link.rel='stylesheet';
   link.href='/pinterest-boards.css?v=20261014-masonry-collections-1';
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
 let returning=Boolean(handoff||storageGet(PENDING_KEY));
 if(returning){
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
 if(returning&&typeof window.openBIGLWAModule==='function')window.openBIGLWAModule('boards');
 await restore();
 watchAuth().catch(()=>{});
}
window.addEventListener('biglwa:orbit-connection-save-error',event=>{
 if(event.detail?.source!=='pinterest')return;
 importError='Pinterest connected, but BIG LWA could not save that connection to your account. Check your Firebase access rules and try refreshing.';
 render();
});
window.__biglwaPinterest={connect,restore,syncAllBoards,disconnect,render,get state(){return {connected,uid:authUid,profile:connected?{...profile}:{}}},diagnostics:()=>({connected,boards:boards.length,pins:pins.length,selectedBoard:boardId,hasSession:Boolean(session()),busy,importError,diagnostic})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
}());