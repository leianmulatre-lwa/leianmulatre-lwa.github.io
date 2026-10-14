(function(){
'use strict';
if(window.__biglwaPinterest) return;
const API='https://biglwa-instagram-api.leianmulatre-284.workers.dev/pinterest/';
const KEY='biglwaPinterestSession';
 let connected=false,profile={},boards=[],pins=[],boardId='',boardsNext='',pinsNext='',busy=false,message='',covers={},restorePromise=null,boardsPromise=null,pinsPromise=null;
 let authUid='',lastImport={imported:0,skipped:0,partial:0},importError='',syncingAll=false;
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
  const local=session()||storageGet(KEY); // Legacy browser key only after server verifies ownership.
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
  return '';
 }
const encode=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function notice(text){message=text;render();let el=document.getElementById('pinterestNotice');if(!el){el=document.createElement('div');el.id='pinterestNotice';el.setAttribute('role','status');el.style.cssText='position:fixed;right:18px;bottom:18px;max-width:360px;padding:16px;background:#fff5eb;color:#302b28;border:1px solid #ccc;border-radius:12px;z-index:15000';document.body.append(el)}el.textContent=text;clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.remove(),10000)}
async function api(path,body){
 const res=await fetch(API+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session()},...(body?{body:JSON.stringify(body)}:{})});
 const data=await res.json().catch(()=>({}));
 if(!res.ok){if(res.status===401){save('');resetView()}throw new Error(data.error||'Pinterest is not ready yet. Please try again after setup.')}
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
  await api('health');
  /* The worker only answers the redirect when the challenge is a real base64url PKCE
     value; any other shape comes back as "Start Pinterest connection from Orbit." and
     the tab lands on a JSON error page that reads as the button doing nothing. */
  const verifier=encode(crypto.getRandomValues(new Uint8Array(32)));
  sessionStorage.setItem('pinterestVerifier',verifier);
  const challenge=encode(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
  location.assign(API+'start?challenge='+encodeURIComponent(challenge));
 })}
 async function loadBoards(more=false){
  if(boardsPromise&&!more)return boardsPromise;
  boardsPromise=(async()=>{
   const data=await api('boards'+(more&&boardsNext?'?bookmark='+encodeURIComponent(boardsNext):''));
   const items=Array.isArray(data?.items)?data.items:Array.isArray(data?.boards)?data.boards:Array.isArray(data?.data?.items)?data.data.items:[];
   boards=more?[...boards,...items]:items;boardsNext=data?.bookmark||data?.next_bookmark||'';
   render();
   loadCovers().then(render).catch(()=>{});
   return boards;
  })();
  try{return await boardsPromise}finally{boardsPromise=null}
 }
  /* Six covers is what the preview shows, so asking for more would spend the rate limit on
     tiles nobody sees. The Worker caches per session, so this is cheap after the first call. */
 async function loadCovers(){
  const ids=boards.filter(b=>/^\d+$/.test(b.id)).slice(0,6);
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
  if(pinsPromise&&!more)return pinsPromise;
  pinsPromise=(async()=>{
   const data=await api('boards/'+id+'/pins'+(more&&pinsNext?'?bookmark='+encodeURIComponent(pinsNext):''));
   const nextItems=Array.isArray(data?.items)?data.items:Array.isArray(data?.pins)?data.pins:Array.isArray(data?.data?.items)?data.data.items:[];
   pins=more?[...pins,...nextItems]:nextItems;pinsNext=data?.bookmark||data?.next_bookmark||'';
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
  if(!session()){resetView();return}
  if(restorePromise)return restorePromise;
  restorePromise=run(async()=>{
    profile=await api('profile');
    connected=true;render();
    // Persist the connected account's public details, not its bearer token.
    try{await window.__biglwaConnections?.refresh?.(authUid)}catch(error){console.warn('Pinterest connection mirror:',error)}
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
   await window.__biglwaConnections?.refresh?.(authUid);
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
  return source.filter(p=>/^\d+$/.test(p.id)).slice(0,24);
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
  if(!boards.length)return'';
  const tiles=boards.slice(0,6).map(b=>{
   const coverEntry=covers[b.id];const cover=typeof coverEntry==='string'?coverEntry:coverEntry?.url||image(coverEntry);
   /* Boards are addressed by owner, so a profile with no username yet would otherwise
      produce a link with a hole in it. Falling back to the account root still opens
      Pinterest rather than a broken address. */
   const owner=profile.username||profile.business_name;
   const href=owner?'https://www.pinterest.com/'+encodeURIComponent(owner)+'/'+encodeURIComponent(b.id)+'/':'https://www.pinterest.com/';
   return '<a class="pinterest-board'+(cover?'':' is-empty')+'" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+
    (cover?'<img loading="lazy" src="'+esc(cover)+'" alt="">':'<span>No cover yet</span>')+
    '<strong>'+esc(b.name)+'</strong>'+
    (b.pin_count!=null?'<small>'+b.pin_count+' Pins</small>':'')+'</a>';
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
  '</div><p role="status">'+esc(message)+'</p>'+(importError?'<p role="alert">'+esc(importError)+'</p>':'')+
  /* The grid sits outside the connected branch on purpose: the shape of what is coming is
     useful before anyone connects, and it is the same six slots either way. */
  (!boards.length&&busy?'<p>Loading boards from Pinterest…</p>':'')+
  boardGrid(disabled)+
  (connected?'<label for="pinterestBoardPicker">Choose a board</label><select id="pinterestBoardPicker" class="module-input"'+disabled+'><option value="">Select a public board</option>'+boards.map(b=>'<option value="'+esc(b.id)+'"'+(b.id===boardId?' selected':'')+'>'+esc(b.name)+'</option>').join('')+'</select>'+
  (boardsNext?'<button type="button" class="module-action" data-pn-more-boards'+disabled+'>Load more boards</button>':'')+
  (!boards.length&&!busy?'<p>No public boards were returned for this account.</p>':'')+
  '<div class="pinterest-pin-grid">'+pins.filter(p=>/^\d+$/.test(p.id)).map(p=>{const src=image(p);return '<a class="pinterest-pin" href="https://www.pinterest.com/pin/'+p.id+'/" target="_blank" rel="noopener noreferrer">'+(src?'<img loading="lazy" src="'+esc(src)+'" alt="'+esc(p.alt_text||p.title||'Pinterest Pin')+'">':'')+'<span>'+esc(p.title||p.description||'View Pin')+'</span><small>View on Pinterest ↗</small></a>'}).join('')+'</div>'+
 (boardId&&!pins.length&&!busy?'<p>No Pins were returned for this board.</p>':'')+
 (pinsNext?'<button type="button" class="module-action" data-pn-more-pins'+disabled+'>Load more Pins</button>':''):'');
}
document.addEventListener('change',e=>{if(e.target.id==='pinterestBoardPicker'){if(!e.target.value){boardId='';pins=[];pinsNext='';render()}else choose(e.target.value)}});
document.addEventListener('click',e=>{
 if(!(e.target instanceof Element))return;
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
 const url=new URL(location.href),handoff=url.searchParams.get('pinterest_handoff'),error=url.searchParams.get('pinterest_error');
 if(handoff||error){url.searchParams.delete('pinterest_handoff');url.searchParams.delete('pinterest_error');history.replaceState(history.state,'',url.href)}
 if(error)notice(error);
 let returning=false;
 if(handoff){returning=true;try{
  const token=await firebaseIdToken();
  const result=await api('session',{handoff,verifier:sessionStorage.getItem('pinterestVerifier')||'',firebaseIdToken:token});
  save(result.session);sessionStorage.removeItem('pinterestVerifier');
 }catch(e){notice(e.message);return}}
 render();
 /* Pinterest sends the tab back to the app, not to a module, so after the round trip the
    Boards page was never reopened and the freshly fetched boards stayed invisible. Reopen it
    and let the module-open listener run restore(), so the connection visibly lands. */
 if(returning&&typeof window.openBIGLWAModule==='function')window.openBIGLWAModule('boards');
 await restore();
 watchAuth().catch(()=>{});
}
window.__biglwaPinterest={connect,restore,disconnect,render};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
}());