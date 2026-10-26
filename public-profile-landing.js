/* Public Studio landing presentation. Strictly read-only; never reuse the visitor's
   authenticated localStorage, provider tokens, or private editable widget state. */
(()=>{
 'use strict';
 let publicProfile=null,boardImages=[],boardOwner='',fetching=false;
 const $=(s,r=document)=>r?.querySelector(s),all=(s,r=document)=>[...r.querySelectorAll(s)];
 const preview=()=>document.documentElement.classList.contains('biglwa-preview-mode');
 const signedIn=()=>Boolean(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid);
 const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
 const imageUrl=raw=>{try{const u=new URL(String(raw||''));return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}};
 function decorateJournal(){
  const card=$('#studioApp #diary'),button=$('.diary-page',card);if(!card||!button)return;
  let initial=$('.biglwa-public-journal-initial',button);
  if(!initial){initial=make('span','','biglwa-public-journal-initial');initial.setAttribute('aria-hidden','true');button.append(initial)}
  const title=String(publicProfile?.name||publicProfile?.username||'L').trim();
  initial.textContent=title.slice(0,1).toUpperCase();
  const privateJournal=publicProfile?.journalVisibility!=='public';
  button.setAttribute('aria-label',privateJournal?'Journal cover · locked':'Open public Journal');
  card.dataset.publicJournal=privateJournal?'locked':'shared';
 }
 let mannequinPromise=null;
 function mannequin(){
  if(window.BigLWAMinecraftViewer?.mount)return Promise.resolve(window.BigLWAMinecraftViewer);
  if(!mannequinPromise)mannequinPromise=new Promise((resolve,reject)=>{
   const src='/avatar/minecraft-mannequin.js?v=20261014-model-4';
   const existing=document.querySelector('script[src^="/avatar/minecraft-mannequin.js"]');
   if(existing&&window.BigLWAMinecraftViewer?.mount)return resolve(window.BigLWAMinecraftViewer);
   const script=make('script');script.src=src;script.async=true;
   script.onload=()=>window.BigLWAMinecraftViewer?.mount?resolve(window.BigLWAMinecraftViewer):reject(Error('3D renderer unavailable'));
   script.onerror=()=>reject(Error('3D renderer unavailable'));
   document.head.append(script);
  }).catch(error=>{mannequinPromise=null;throw error});
  return mannequinPromise;
 }
 function decorateAvatar(){
  const card=$('#studioAvatarCard');if(!card)return;
  const published=publicProfile?.studioAvatarPublic;
  const url=imageUrl(published?.url||publicProfile?.profilePhotoUrl);
  let photo=$('.biglwa-public-avatar-preview',card);
  if(!photo){photo=make('div','','biglwa-public-avatar-preview');card.append(photo)}
  const sig=(published?.type||'photo')+':'+url;
  if(photo.dataset.avatarSource===sig)return;
  photo.dataset.avatarSource=sig;
  if(url&&published?.type==='minecraft'){
   photo.textContent='Rendering member character…';
   mannequin().then(viewer=>{
    if(!photo.isConnected||photo.dataset.avatarSource!==sig)return;
    photo.replaceChildren();
    const model=viewer.mount(photo,url,{large:false});
    if(model?.ready)Promise.resolve(model.ready).catch(()=>{
     if(photo.dataset.avatarSource===sig)photo.textContent='This character could not be displayed.';
    });
   }).catch(()=>{if(photo.dataset.avatarSource===sig)photo.textContent='3D character unavailable'});
  }else if(url){
   photo.replaceChildren();
   const img=make('img');img.src=url;img.alt=(publicProfile?.name||'Member')+' '+(published?'avatar preview':'profile picture');img.loading='lazy';
   photo.append(img);
  }else{
   photo.textContent='◉';
   photo.setAttribute('aria-label','Character preview not shared');
  }
  card.dataset.publicAvatar='1';
 }
 async function boardMedia(){
  const profile=publicProfile,who=profile?.uid;if(!who||fetching||boardOwner===who)return;
  fetching=true;const expected=who;let found=[];
  try{
   const entries=await window.BigLWAUserDirectory?.loadArchiveForUsername?.(profile.username);
   for(const p of Array.isArray(entries)?entries:[]){
    if(String(p.state||'')!=='approved')continue;
    if(String(p.source||'').toLowerCase()!=='pinterest'&&!/pinterest\./i.test(String(p.sourceUrl||'')))continue;
    const url=imageUrl(p.thumbnailUrl||p.imageUrl||p.photo||p.media?.[0]?.url||p.images?.[0]?.url||p.images?.[0]);
    if(url&&!found.includes(url))found.push(url);if(found.length===6)break;
   }
  }catch{}
  if(publicProfile?.uid===expected){boardOwner=expected;boardImages=found;decorateBoards()}
  fetching=false;
 }
 function decorateBoards(){
  const card=$('#studioApp #boards');if(!card)return;
  card.classList.add('biglwa-public-boards-card');
  let home=$('.biglwa-public-boards-home',card);
  if(!home){home=make('section','','biglwa-public-boards-home');home.setAttribute('aria-label','Public Boards preview');card.append(home)}
  const sig=boardImages.join('|')+'|'+String(publicProfile?.uid);
  if(home.dataset.signature===sig)return;
  home.dataset.signature=sig;home.replaceChildren();
  home.append(make('p','Collect. Curate. Be inspired.','biglwa-public-boards-tagline'));
  const grid=make('div','','biglwa-public-boards-grid');
  for(let i=0;i<6;i++){
   const tile=make('span','','biglwa-public-board-slot');
   if(boardImages[i]){
    const img=make('img');img.src=boardImages[i];img.alt='Published Pinterest preview '+(i+1);img.loading='lazy';tile.append(img);
   }else{tile.classList.add('placeholder');tile.setAttribute('aria-label','Board artwork placeholder')}
   grid.append(tile);
  }
  home.append(grid);
  home.append(make('small',boardImages.length?'Shared, published Pins only · private imports remain private.':'Public Pins will appear when this member publishes them.','biglwa-public-boards-note'));
 }
 function showGuestSheet(){
  if(!publicProfile)return;
  $('#biglwaPublicGuestSheet')?.remove();
  const dialog=make('dialog','','biglwa-public-guest-dialog');dialog.id='biglwaPublicGuestSheet';
  const heading=make('h2','Who wuz here?');
  const close=make('button','×');close.type='button';close.className='biglwa-public-guest-close';close.setAttribute('aria-label','Close Guest Sheet');
  close.onclick=()=>dialog.close();
  const copy=make('p','You’re viewing @'+publicProfile.username+'’s guest sheet. This preview does not write messages into another account.');
  const detail=make('p','Sign in to BIG LWA to use member-only guest features.');
  const actions=make('div','','biglwa-public-guest-actions');
  const join=make('button','Create account');join.type='button';join.onclick=()=>{dialog.close();window.BigLWAStudioPreview?.prompt?.('leave a guest-sheet note')};
  const cancel=make('button','Got it');cancel.type='button';cancel.onclick=()=>dialog.close();
  actions.append(join,cancel);dialog.append(close,heading,copy,detail,actions);
  dialog.onclose=()=>dialog.remove();document.body.append(dialog);
  if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
 }
 function decorateGuest(){
  const card=$('#studioApp .guest-check-card')||$('#studioApp #guestCheckWidget');if(!card)return;
  let btn=$('.biglwa-public-guest-open',card);
  if(!btn){btn=make('button','Open guest sheet','biglwa-public-guest-open');btn.type='button';card.append(btn)}
  btn.onclick=showGuestSheet;
 }
 function decorateMap(){
  const card=$('#studioApp #map');if(!card)return;
  let button=$('.biglwa-public-map-open',card);
  if(!button){button=make('button','View shared places','biglwa-public-map-open');button.type='button';card.append(button)}
  button.onclick=()=>{
   if(!signedIn()){window.BigLWAStudioPreview?.prompt?.('view public shared locations');return}
   if(typeof window.openBIGLWAModule==='function')window.openBIGLWAModule('map');
   else window.BigLWAStudioPreview?.prompt?.('view public shared locations');
  };
  card.dataset.publicMap='1';
 }
 function sync(){
  if(!preview()||!publicProfile)return;
  decorateBoards();decorateJournal();decorateAvatar();decorateGuest();decorateMap();
 }
 let pending=false;
 function schedule(){if(pending)return;pending=true;setTimeout(()=>{pending=false;sync()},120)}
 window.addEventListener('biglwa:public-profile-ready',event=>{
  publicProfile=event.detail?.profile||null;boardImages=[];boardOwner='';
  schedule();void boardMedia();
 });
 window.addEventListener('biglwa:public-mirror-ready',schedule);
 window.addEventListener('biglwa:public-profile-ended',()=>{
  publicProfile=null;boardImages=[];boardOwner='';
  $('#biglwaPublicGuestSheet')?.remove();
  all('.biglwa-public-boards-home,.biglwa-public-avatar-preview,.biglwa-public-journal-initial,.biglwa-public-guest-open,.biglwa-public-map-open').forEach(e=>e.remove());
  all('.biglwa-public-boards-card').forEach(e=>e.classList.remove('biglwa-public-boards-card'));
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
 const style=make('style');style.id='biglwa-public-landing-style';
 style.textContent=`
 html.biglwa-preview-mode #studioApp .biglwa-public-boards-card>.biglwa-public-boards-home{display:grid!important;gap:8px;padding:3px 0 4px}
 html.biglwa-preview-mode #studioApp .biglwa-public-boards-card>:not(.card-head):not(.biglwa-public-boards-home){display:none!important}
 .biglwa-public-boards-tagline{margin:0;color:#8c817a;font:500 12px/1.4 system-ui}
 .biglwa-public-boards-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
 .biglwa-public-board-slot{position:relative;overflow:hidden;aspect-ratio:1;border-radius:10px;background:linear-gradient(145deg,#d99e85,#483439)}
 .biglwa-public-board-slot img{width:100%;height:100%;object-fit:cover;display:block}
 .biglwa-public-board-slot.placeholder:nth-child(6n+2){background:#f4d6c4}
 .biglwa-public-board-slot.placeholder:nth-child(6n+3){background:repeating-radial-gradient(circle,#252120 0 8px,#686263 9px 13px)}
 .biglwa-public-board-slot.placeholder:nth-child(6n+4){background:linear-gradient(125deg,#d4d1bf,#838577)}
 .biglwa-public-board-slot.placeholder:nth-child(6n+5){background:radial-gradient(circle,#dd7fa2 0 16%,#a45173 17% 32%,#654355 33% 60%)}
 .biglwa-public-board-slot.placeholder:nth-child(6n+6){background:linear-gradient(144deg,#282328 0 53%,#ab7962 54%)}
 .biglwa-public-boards-note{font:500 10px system-ui;color:#83716c}
 html.biglwa-preview-mode #studioAvatarCard[data-public-avatar]{position:relative}
 html.biglwa-preview-mode #studioAvatarCard[data-public-avatar] .biglwa-public-avatar-preview{position:absolute;inset:46px 12px 10px;display:grid;place-items:center;border-radius:12px;overflow:hidden;background:#eadcce;color:#513943;font:40px Georgia,serif}
 html.biglwa-preview-mode #studioAvatarCard[data-public-avatar] .biglwa-public-avatar-preview img{width:100%;height:100%;object-fit:contain}
 .biglwa-public-guest-open,.biglwa-public-map-open{border:1px solid #b78b8c;border-radius:8px;background:#fff8f0;color:#573648;padding:8px 12px;font:700 11px system-ui;cursor:pointer;z-index:2;position:relative}
 html.biglwa-preview-mode #studioApp .guest-check-card .biglwa-public-guest-open{display:inline-flex!important;margin:10px}
 .biglwa-public-guest-dialog{border:1px solid #dfc1c9;border-radius:18px;padding:24px;width:min(440px,calc(100vw - 24px));background:#fff8ee;color:#3c2b33;box-shadow:0 22px 70px #1c1019a6}
 .biglwa-public-guest-dialog::backdrop{background:#130b1599}
 .biglwa-public-guest-dialog h2{font:26px 'CS Bergamot Stitched',Georgia,serif}
 .biglwa-public-guest-dialog p{font:13px/1.5 system-ui}
 .biglwa-public-guest-close{float:right;cursor:pointer;background:none;border:0;font-size:25px}
 .biglwa-public-guest-actions{display:flex;gap:8px}
 .biglwa-public-guest-actions button{background:#d95a6d;border:0;border-radius:10px;padding:10px 14px;color:white;font:700 12px system-ui;cursor:pointer}
 .biglwa-public-guest-actions button:last-child{background:#e9dbd7;color:#392c34}
 `;
 document.head.append(style);
})();
