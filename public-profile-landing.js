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
  const card=$('#studioApp #diary'),button=$('.diary-page',card);
  if(!card||!button||!publicProfile)return;
  // Keep the REAL composition-book cover fixed through scrolling, focus,
  // and module navigation. Never inject a private browser draft or swap
  // the cover for an async "checking visibility" message.
  const owner=String(publicProfile.uid||publicProfile.username||'');
  if(button.dataset.publicJournalOwner!==owner){
    const covers=[...button.querySelectorAll('img[src]')].filter(img=>{
      try{const u=new URL(img.src,location.origin);return u.origin===location.origin&&u.pathname.startsWith('/assets/')}catch{return false}
    });
    button.replaceChildren(...covers);
    button.dataset.publicJournalOwner=owner;
  }
  let initial=$('.biglwa-public-journal-initial',button);
  if(!initial){
    initial=make('span','','biglwa-public-journal-initial');
    initial.setAttribute('aria-hidden','true');
    button.append(initial);
  }
  const title=String(publicProfile.name||publicProfile.username||'L').trim();
  const letter=Array.from(title)[0]?.toLocaleUpperCase()||'L';
  if(initial.textContent!==letter)initial.textContent=letter;
  const publicJournal=publicProfile.journalVisibility==='public'&&Boolean(publicProfile.publicJournal);
  button.setAttribute('aria-label',publicJournal?'Open '+title+'’s public Journal':'Journal cover · private');
  card.dataset.publicJournal=publicJournal?'shared':'locked';
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
  const sig=(published?.type||'photo')+':'+url+':'+String(published?.slim===true);
  if(photo.dataset.avatarSource===sig)return;
  photo.dataset.avatarSource=sig;
  if(url&&published?.type==='minecraft'){
   photo.textContent='Rendering member character…';
   mannequin().then(viewer=>{
    if(!photo.isConnected||photo.dataset.avatarSource!==sig)return;
    photo.replaceChildren();
    const model=viewer.mount(photo,url,{large:false,slim:published?.slim===true});
    if(model?.ready)Promise.resolve(model.ready).catch(()=>{
     if(photo.dataset.avatarSource===sig)photo.textContent='This character could not be displayed.';
    });
   }).catch(()=>{if(photo.dataset.avatarSource===sig)photo.textContent='3D character unavailable'});
  }else if(url&&published?.type==='sona360'){
   photo.replaceChildren();
   const frame=make('iframe');frame.src=url;frame.title=(publicProfile?.name||'Member')+' 360sona avatar';
   frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';
   frame.setAttribute('allow','fullscreen');frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups');
   frame.className='biglwa-public-sona-frame';photo.append(frame);
  }else if(url){
   photo.replaceChildren();
   const img=make('img');img.src=url;img.alt=(publicProfile?.name||'Member')+' '+(published?'avatar preview':'profile picture');img.loading='lazy';
   photo.append(img);
  }else{
   // Never put someone's monogram in the Avatar: initials belong on the Journal cover.
   photo.replaceChildren();
   photo.append(make('span','Avatar not shared','biglwa-public-avatar-empty'));
   photo.setAttribute('aria-label','This member has not published an Avatar');
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
 function publicGuestEntries(){
  // Public notes must be explicitly published; never expose private guest logs.
  if(publicProfile?.publicGuestEntriesVisibility!=='public')return [];
  return (Array.isArray(publicProfile?.publicGuestEntries)?publicProfile.publicGuestEntries:[]).slice(0,8).map(item=>{
   const date=new Date(String(item?.createdAt||''));
   return {who:String(item?.name||item?.who||'Guest').trim().slice(0,42),
    note:String(item?.note||'').trim().slice(0,160),
    date:Number.isFinite(date.getTime())?new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric'}).format(date):'—'};
  }).filter(x=>x.note);
 }
 function guestPaper(){
  const paper=make('div','','biglwa-public-guest-paper');
  paper.setAttribute('aria-label','Guest Check visitor, note and date');
  for(const heading of ['WHO WUZ HERE?','NOTE','DATE'])paper.append(make('b',heading,'biglwa-guest-paper-head'));
  const entries=publicGuestEntries();
  for(const item of entries){
   paper.append(make('span',item.who,'biglwa-public-guest-who'));
   paper.append(make('span',item.note,'biglwa-public-guest-message'));
   paper.append(make('time',item.date,'biglwa-public-guest-date'));
  }
  if(!entries.length)paper.append(make('small','No Guest Check notes have been published.','biglwa-public-guest-note'));
  return paper;
 }
 function showGuestSheet(){
  if(!publicProfile)return;
  $('#biglwaPublicGuestSheet')?.remove();
  const dialog=make('dialog','','biglwa-public-guest-dialog');dialog.id='biglwaPublicGuestSheet';
  const heading=make('h2','Who wuz here?');
  const close=make('button','×');close.type='button';close.className='biglwa-public-guest-close';close.setAttribute('aria-label','Close Guest Sheet');
  close.onclick=()=>dialog.close();
  const copy=make('p','@'+publicProfile.username+' · Guest Check');
  const detail=make('p','Only published entries appear; private visitor notes remain private.');
  const actions=make('div','','biglwa-public-guest-actions');
  const join=make('button','Leave a note');join.type='button';join.onclick=()=>{dialog.close();window.BigLWAStudioPreview?.prompt?.('leave a guest-sheet note')};
  const cancel=make('button','Close');cancel.type='button';cancel.onclick=()=>dialog.close();
  actions.append(join,cancel);dialog.append(close,heading,copy,guestPaper(),detail,actions);
  dialog.onclose=()=>dialog.remove();document.body.append(dialog);
  if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
 }
 function decorateGuest(){
  const card=$('#studioApp .guest-check-card')||$('#studioApp #guestCheckWidget');if(!card)return;
  card.dataset.publicGuestSheet='1';
  const old=$('.biglwa-public-guest-paper',card),paper=guestPaper();
  if(old)old.replaceWith(paper);else card.append(paper);
  let btn=$('.biglwa-public-guest-open',card);
  if(!btn){btn=make('button','Open Guest Check','biglwa-public-guest-open');btn.type='button';card.append(btn)}
  btn.onclick=showGuestSheet;
 }
 function decorateOrbit(){
  // The actual Orbit widget is the member's eight public planet tiles.
  // Do not draw a duplicate "View Orbit" CTA on the Connect widget.
  all('#studioApp .biglwa-public-orbit-open').forEach(button=>button.remove());
  const card=$('#studioApp #orbit');
  if(card)card.dataset.publicOrbitPlanets='1';
 }
 function decorateMap(){
  const card=$('#studioApp #map');if(!card)return;
  // The original Map card already has one "Open Map" action. The old guest
  // decorator added an additional, contradictory View shared places button.
  all('.biglwa-public-map-open',card).forEach(el=>el.remove());
  card.dataset.publicMap='1';
  let tile=$('.biglwa-public-map-card',card);
  if(!tile){
    tile=make('div','','biglwa-public-map-card');
    tile.setAttribute('aria-label','Map preview; exact locations are not shared');
    const label=make('div','⌖','biglwa-public-map-mark');
    const message=make('p','Shared places · read-only preview');
    tile.append(label,message);
    const original=card.querySelector('.map-preview,.map-thumb,.map-widget-preview');
    if(original)original.setAttribute('aria-hidden','true');
    const button=card.querySelector('[data-open="map"],[data-widget-route="map"],.card-cta');
    if(button)button.before(tile);else card.append(tile);
  }
  const entry=card.querySelector('[data-open="map"],[data-widget-route="map"],.card-cta');
  if(entry&&!entry.dataset.publicMapBound){
    entry.dataset.publicMapBound='1';
    entry.addEventListener('click',event=>{
      if(!preview())return;
      if(!signedIn()){
        event.preventDefault();event.stopImmediatePropagation();
        window.BigLWAStudioPreview?.prompt?.('view this member’s published map');
      }
    },true);
  }
 }

 function sync(){
  if(!preview()||!publicProfile)return;
  decorateBoards();decorateJournal();decorateAvatar();decorateGuest();decorateOrbit();decorateMap();
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
  all('.biglwa-public-boards-home,.biglwa-public-avatar-preview,.biglwa-public-journal-initial,.biglwa-public-guest-open,.biglwa-public-guest-paper,.biglwa-public-map-card,.biglwa-public-map-open,.biglwa-public-orbit-open').forEach(e=>e.remove());
  all('.biglwa-public-boards-card').forEach(e=>e.classList.remove('biglwa-public-boards-card'));
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
 const style=make('style');style.id='biglwa-public-landing-style';
 style.textContent=`
 html.biglwa-preview-mode #studioApp #diary .diary-page .studio-journal-initial{display:none!important}
 html.biglwa-preview-mode #studioApp #diary .diary-page .biglwa-public-journal-initial{display:grid!important}
 html.biglwa-preview-mode #studioApp #orbit .orbit-grid button.orbit-public-unlinked{cursor:default!important;opacity:.78!important}
 html.biglwa-preview-mode #studioApp #orbit .orbit-grid button.orbit-public-unlinked small{color:#6e6162!important}
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
 .biglwa-public-guest-open,.biglwa-public-map-open,.biglwa-public-orbit-open{border:1px solid #b78b8c;border-radius:8px;background:#fff8f0;color:#573648;padding:8px 12px;font:700 11px system-ui;cursor:pointer;z-index:2;position:relative}
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
 style.textContent+=`
 html.biglwa-preview-mode #studioAvatarCard .biglwa-public-sona-frame{width:100%;height:100%;border:0;border-radius:11px;background:transparent}
 html.biglwa-preview-mode #studioAvatarCard .biglwa-public-avatar-empty{font:600 13px/1.3 system-ui;color:#6b5961;text-align:center;padding:18px}
 html.biglwa-preview-mode #studioApp .guest-check-card .biglwa-public-guest-paper,
 html.biglwa-preview-mode .biglwa-public-guest-dialog .biglwa-public-guest-paper{
  display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,2.2fr) minmax(68px,.85fr)!important;
  grid-auto-rows:minmax(30px,auto)!important;align-items:center!important;gap:0 7px!important;
  background:#fffaf0!important;border-radius:10px!important;min-height:170px!important;overflow:auto!important
 }
 html.biglwa-preview-mode .biglwa-public-guest-paper .biglwa-guest-paper-head{
  white-space:normal!important;font:700 9px/1.25 system-ui!important;padding:8px 3px!important;
  border-bottom:2px solid #d980a2!important;color:#5a3a51!important
 }
 html.biglwa-preview-mode .biglwa-public-guest-paper :is(.biglwa-public-guest-who,.biglwa-public-guest-message,.biglwa-public-guest-date){
  font:500 11px/1.4 system-ui!important;padding:7px 3px!important;border-bottom:1px solid #b8cfdf!important;
  color:#594851!important;overflow-wrap:anywhere!important
 }
 html.biglwa-preview-mode .biglwa-public-guest-paper .biglwa-public-guest-note{
  grid-column:1/-1!important;margin:0!important;padding:15px 4px!important;
  font:500 11px/1.4 system-ui!important
 }
`;
 style.textContent+=`

 html.biglwa-preview-mode #studioAvatarCard .biglwa-public-avatar-initial{font:400 64px/1 "CS Bergamot Stitched",Georgia,serif;color:#61364d;opacity:.8}
 html.biglwa-preview-mode #studioApp .guest-check-card[data-public-guest-sheet="1"]{position:relative!important}
 html.biglwa-preview-mode #studioApp .biglwa-public-guest-paper{
  display:grid!important;align-content:start!important;gap:0!important;
  min-height:170px!important;padding:12px 15px 16px!important;margin:0 10px!important;
  background:#fffaf3!important;border-radius:8px!important;
  border:1px solid #e1becd!important
 }
 html.biglwa-preview-mode #studioApp .biglwa-public-guest-paper .biglwa-guest-paper-head{
  display:block;color:#655260;font:750 10px/1.3 system-ui!important;
  padding:6px 0;border-bottom:2px solid #dca3bb
 }
 html.biglwa-preview-mode #studioApp .biglwa-guest-paper-line{
  display:block;min-height:29px;border-bottom:1px solid #abc9dd
 }
 html.biglwa-preview-mode #studioApp .biglwa-public-guest-note{
  padding-top:8px;color:#8d7e83;font:500 10px/1.3 system-ui
 }
 html.biglwa-preview-mode .biglwa-guest-paper{
  background:#fffaf1;padding:10px 14px;border:1px solid #ceacb3;border-radius:12px;
  margin:10px 0
 }
 html.biglwa-preview-mode .biglwa-guest-paper-head{font:700 10px/1.5 system-ui;color:#614459;padding:4px}
 html.biglwa-preview-mode #studioApp #map .biglwa-public-map-card{
  display:flex!important;flex-direction:column!important;align-items:center!important;
  justify-content:center!important;gap:9px!important;
  min-height:150px!important;padding:16px!important;margin:12px 0!important;
  border:1px solid #8ca9a0!important;border-radius:14px!important;
  background:repeating-linear-gradient(25deg,#e6eee5 0 16px,#d4ded2 17px 18px,#e6eee5 19px 34px)!important;
  color:#34545c!important;text-align:center!important
 }
 html.biglwa-preview-mode #studioApp #map .biglwa-public-map-mark{font:400 40px Georgia,serif!important}
 html.biglwa-preview-mode #studioApp #map .biglwa-public-map-card p{font:700 12px/1.4 system-ui!important;margin:0!important}
 html.biglwa-preview-mode #studioApp #map .biglwa-public-map-open,
 html.biglwa-preview-mode #studioApp #map iframe,
 html.biglwa-preview-mode #studioApp #map .map-widget-frame{display:none!important}
 html.biglwa-preview-mode #studioApp #map .biglwa-public-map-card{width:100%!important;box-sizing:border-box!important}
 
`;
 document.head.append(style);
})();
