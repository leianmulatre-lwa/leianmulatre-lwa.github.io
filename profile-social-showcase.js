/* BIG LWA: connected Snapchat Spotlight and Instagram Highlight showcase.
 * Connected public sources and owner-requested, username-matched imports.
 */
(()=>{
 'use strict';
 const uid=()=>String(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'');
 const active=(which)=>{
  if(!uid())return false;
  if(which==='snapchat')return !!window.BigLWAOrbitOAuth?.get?.('snapchat')?.verifiedFromProvider;
  const row=window.__biglwaConnections?.connections?.()?.instagram;
  return !!(row?.username||window.__biglwaInstagramOrbit?.state?.connected);
 };
 const key=()=>uid()?'biglwaPublicShowcaseV1:'+uid():'';
 const saved=()=>{if(!key())return [];try{const a=JSON.parse(localStorage.getItem(key())||'[]');return Array.isArray(a)?a.slice(0,8):[]}catch{return []}};
 const clean=raw=>{
  try{
   const u=new URL(String(raw||'').trim());if(u.protocol!=='https:'||u.port||u.username||u.password)return null;
   const host=u.hostname.toLowerCase().replace(/^www\./,'');
   if(host==='snapchat.com'){
    if(!/^\/(?:spotlight|add|p)\/[A-Za-z0-9_-]{3,180}\/?$/.test(u.pathname))return null;
    return {platform:'snapchat',kind:'Spotlight',url:'https://www.snapchat.com'+u.pathname};
   }
   if(host==='instagram.com'){
    if(!/^\/(?:stories\/highlights\/[0-9]{6,32}|stories\/[A-Za-z0-9._]+\/[0-9]{6,32})\/?$/.test(u.pathname))return null;
    return {platform:'instagram',kind:'Highlight',url:'https://www.instagram.com'+u.pathname};
   }
   return null;
  }catch{return null}
 };
 const PUBLIC='https://biglwa-public-tiktok-snapshots.leianmulatre-284.workers.dev';
 const validHandle=h=>/^[a-zA-Z0-9._]{2,40}$/.test(h||'');
 const fromLink=(raw,provider)=>{
  try{
   const url=new URL(String(raw||''));
   if(url.protocol!=='https:'||url.port||url.username||url.password)return '';
   const host=url.hostname.toLowerCase().replace(/^www\./,'');
   const path=decodeURIComponent(url.pathname);
   const match=provider==='instagram'&&host==='instagram.com'?
     path.match(/^\/([A-Za-z0-9._]{2,40})\/?$/):
     provider==='snapchat'&&['snapchat.com','story.snapchat.com'].includes(host)?
       path.match(/^\/(?:add\/@?|@)([A-Za-z0-9._]{2,40})\/?$/):null;
   return match&&validHandle(match[1])?match[1]:'';
  }catch{return ''}
 };
 const accountHandles=()=>{
  const links=window.BigLWAOrbitAccountLinks?.get?.()||{};
  const snap=window.BigLWAOrbitOAuth?.get?.('snapchat');
  const instagram=window.__biglwaInstagramOrbit?.state?.profile;
  const connected=window.__biglwaConnections?.connections?.()?.instagram;
  const instagramOAuth=String(instagram?.username||connected?.username||'').replace(/^@/,'').trim();
  const instagramLinked=fromLink(links.instagram,'instagram');
  const snapchatOAuth=String(snap?.username||'').replace(/^@/,'').trim();
  const snapchatLinked=fromLink(snap?.link,'snapchat')||fromLink(links.snapchat,'snapchat');
  // An OAuth handle wins over an old manually stored link. Never use a display
  // name as an account handle, and don't borrow another logged-in member's links.
  return {
   instagram:active('instagram')&&(validHandle(instagramOAuth)||validHandle(instagramLinked))?
     (validHandle(instagramOAuth)?instagramOAuth:instagramLinked):'',
   snapchat:active('snapchat')&&(validHandle(snapchatOAuth)||validHandle(snapchatLinked))?
     (validHandle(snapchatOAuth)?snapchatOAuth:snapchatLinked):'',
   instagramOAuth:validHandle(instagramOAuth)?instagramOAuth:'',
   snapchatProviderLink:active('snapchat')?fromLink(snap?.link,'snapchat'):''
  };
 };
 // Once a provider reports its own public identity, keep that canonical URL
 // on the signed-in BIG LWA member's Orbit record (not browser-only storage).
 const savingLinks=new Set(),attemptedLinks=new Set();
 function persistProviderLinks(handles,who){
  const links=window.BigLWAOrbitAccountLinks;
  if(!who||!links?.ready?.()||links.owner?.()!==who)return;
  const records=links.get?.()||{};
  for(const [provider,handle] of [['instagram',handles.instagramOAuth],['snapchat',handles.snapchatProviderLink]]){
   const attempt=who+':'+provider+':'+handle.toLowerCase();
   if(!handle||savingLinks.has(provider)||records[provider]||attemptedLinks.has(attempt))continue;
   attemptedLinks.add(attempt);
   const canonical=provider==='instagram'?'https://www.instagram.com/'+handle+'/':
     'https://www.snapchat.com/add/'+handle;
   savingLinks.add(provider);
   Promise.resolve(links.save(provider,canonical)).catch(error=>{
    console.info('Profile shortcut sync deferred:',error?.message||error);
   }).finally(()=>savingLinks.delete(provider));
  }
 }
 let snapSource={key:'',status:'',items:[],message:'',checkedAt:0},signature='';
 function refreshPublicSnapchat(handle,who){
  const next=who+':'+handle.toLowerCase();
  if(snapSource.key===next&&(snapSource.status==='loading'||Date.now()-snapSource.checkedAt<15*60*1000))return;
  snapSource={key:next,status:'loading',items:[],message:''};
  fetch(PUBLIC+'/snapchat/'+encodeURIComponent(handle),{credentials:'omit',mode:'cors',cache:'no-store'})
   .then(r=>{if(!r.ok)throw Error('Public source unavailable');return r.json()})
   .then(data=>{
    if(snapSource.key!==next||uid()!==who)return;
    if(data?.handle?.toLowerCase()!==handle.toLowerCase()||data?.matchedHandle!==true)
      throw Error('Public username did not match');
    const items=Array.isArray(data.items)?data.items.filter(v=>
     v?.kind==='Spotlight'&&typeof v.mediaUrl==='string'&&
     /^https:\/\/cf-st\.sc-cdn\.net\//.test(v.mediaUrl)).slice(0,8):[];
    snapSource={key:next,status:items.length?'ready':'empty',checkedAt:Date.now(),items,
     message:items.length?'Public @'+handle+' matched · '+items.length+' Spotlight preview(s)':
     'No public Spotlight media available for @'+handle};
    schedule();
   }).catch(e=>{
    if(snapSource.key!==next)return;
    snapSource={key:next,status:'error',checkedAt:Date.now(),items:[],message:'Snapchat public lookup unavailable; Storyclone viewer remains accessible.'};
    schedule();
   });
 }

 // Some connected sources may return genuine pinned-Highlight permalink IDs.
 // They are safe to auto-display; ordinary media posts are never mislabeled.
 function instagramSourceHighlights(handle){
  const state=window.__biglwaInstagramOrbit?.state;
  if(!state?.connected||!Array.isArray(state.media)||!handle)return [];
  const found=new Set();
  return state.media.flatMap(item=>{
   const raw=String(item?.permalink||'');
   const resolved=clean(raw);
   if(!resolved||resolved.platform!=='instagram'||found.has(resolved.url))return [];
   const observed=String(item?.username||state.profile?.username||'').replace(/^@/,'').trim();
   if(observed.toLowerCase()!==handle.toLowerCase())return [];
   found.add(resolved.url);
   return [{...resolved,autoDiscovered:true}];
  }).slice(0,8);
 }
 const storyStyle=()=>{
  if(document.getElementById('biglwa-story-circles-style'))return;
  const css=document.createElement('style');css.id='biglwa-story-circles-style';
  css.textContent=[
   '#studioApp .profile-card .biglwa-stories-by-likes{display:flex!important;gap:12px!important;align-items:center!important;width:100%!important;min-width:0!important;margin:0!important}',
   '#studioApp .profile-card .biglwa-stories-by-likes>.stats{flex:0 1 51%!important;width:auto!important;min-width:215px!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:2px!important;padding-top:10px!important;margin:0!important}',
   '#studioApp .profile-card .biglwa-stories-by-likes>.stats>[data-profile-stat]{font-size:9px!important;min-width:0!important;padding-right:3px!important;white-space:normal!important;border:0!important}',
   '#studioApp .profile-card .biglwa-stories-by-likes>.stats b{font-size:13px!important}',
   '#studioApp .profile-card .biglwa-stories-ribbon{flex:1 1 40%!important;min-width:0!important;width:auto!important;max-width:440px!important;display:flex!important;gap:4px!important;align-items:center!important;margin-top:-11px!important;overflow:hidden!important}',
   '#studioApp .profile-card .biglwa-stories-track{display:flex!important;flex:1 1 auto!important;gap:8px!important;align-items:flex-start!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important;min-width:0!important;padding:2px!important}',
   '#studioApp .profile-card .biglwa-stories-track::-webkit-scrollbar{display:none}',
   '#studioApp .profile-card .biglwa-story-bubble{border:0!important;background:transparent!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:2px!important;flex:0 0 51px!important;width:51px!important;padding:0!important;cursor:pointer!important;color:#462d3c!important}',
   '#studioApp .profile-card .biglwa-story-ring{width:42px!important;height:42px!important;padding:3px!important;border-radius:50%!important;display:grid!important;place-items:center!important;box-sizing:border-box!important;background:conic-gradient(#eeb069,#e5729b,#9051b4,#eeb069)!important;transition:transform .15s ease!important}',
   '#studioApp .profile-card .biglwa-story-bubble[data-source="snapchat"] .biglwa-story-ring{background:conic-gradient(#f2d250,#ffe97c,#e5b528,#f2d250)!important}',
   '#studioApp .profile-card .biglwa-story-bubble[data-source="new"] .biglwa-story-ring{background:#e4dcd6!important}',
   '#studioApp .profile-card .biglwa-story-bubble:hover .biglwa-story-ring,#studioApp .profile-card .biglwa-story-bubble:focus-visible .biglwa-story-ring{transform:scale(1.055)!important}',
   '#studioApp .profile-card .biglwa-story-inner{width:100%!important;height:100%!important;box-sizing:border-box!important;display:grid!important;place-items:center!important;border-radius:50%!important;border:2px solid #fff8f1!important;background:#fff3ed!important;color:#673b57!important;font:700 17px Georgia,serif!important}',
   '#studioApp .profile-card .biglwa-story-inner img{width:17px!important;height:17px!important;object-fit:contain!important}',
   '#studioApp .profile-card .biglwa-story-name{width:100%!important;max-width:100%!important;display:block!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;text-align:center!important;font:650 8px/1.15 system-ui!important}',
   '#studioApp .profile-card .biglwa-story-scroll{flex:0 0 17px!important;width:17px!important;height:22px!important;padding:0!important;border:0!important;border-radius:50%!important;background:#fff9f1d9!important;color:#57364a!important;cursor:pointer!important;font:700 14px system-ui!important}',
   '#studioApp .profile-card .biglwa-story-scroll:disabled{opacity:.25!important;cursor:default!important}',
   'body .biglwa-showcase-editor:not([open]){display:none!important}',
   'body .biglwa-showcase-editor[open]{display:block!important;position:fixed!important;z-index:999998!important;top:50%!important;left:50%!important;transform:translate(-50%,-50%)!important;width:min(560px,calc(100vw - 28px))!important;max-height:83vh!important;overflow:auto!important;background:#fff8ef!important;border:1px solid #e5c9d4!important;border-radius:17px!important;box-shadow:0 20px 60px #1c0912aa!important;padding:17px!important;color:#4a2b3c!important}',
   'body .biglwa-showcase-editor[open]>summary{font:25px "CS Bergamot Stitched",Georgia,serif!important;margin-bottom:11px!important}',
   'body .biglwa-story-shade{position:fixed;inset:0;z-index:999997;background:rgba(25,10,22,.68)}',
   'body .biglwa-story-popup{position:fixed;z-index:999999;top:50%;left:50%;transform:translate(-50%,-50%);width:min(380px,calc(100vw - 28px));max-height:85vh;overflow:auto;background:#fff8f0;color:#452c3c;border-radius:18px;padding:16px;box-shadow:0 20px 70px #1c0915a9}',
   'body .biglwa-story-popup video{width:100%;max-height:59vh;object-fit:contain;background:#2b1826;border-radius:10px}',
   'body .biglwa-story-popup a{display:inline-block;margin:8px 0;font:650 12px system-ui;color:#793b51}',
   'body .biglwa-story-popup strong{font:22px "CS Bergamot Stitched",Georgia,serif;display:block;margin:2px 0 12px}',
   'body .biglwa-story-popup small{display:block;font:500 10px/1.4 system-ui;color:#79636e}',
   'body .biglwa-story-close{float:right;cursor:pointer;border:0;border-radius:50%;height:28px;width:28px;background:#f4e0e4;color:#66374e;font:700 18px system-ui}',
   '@media(max-width:1050px){#studioApp .profile-card .biglwa-stories-by-likes{flex-wrap:wrap!important;gap:7px!important}#studioApp .profile-card .biglwa-stories-by-likes>.stats{flex:1 1 100%!important;max-width:none!important}#studioApp .profile-card .biglwa-stories-ribbon{flex:1 1 100%!important;max-width:none!important;margin-top:0!important}}',
   '@media(max-width:620px){#studioApp .profile-card .biglwa-stories-by-likes>.stats{min-width:0!important;grid-template-columns:repeat(3,minmax(0,1fr))!important}#studioApp .profile-card .biglwa-story-ring{width:36px!important;height:36px!important}#studioApp .profile-card .biglwa-story-bubble{flex-basis:44px!important;width:44px!important}#studioApp .profile-card .biglwa-stories-track{gap:5px!important}}',
   '#studioApp.profile-editor-wallpaper .biglwa-stories-ribbon,#studioApp .profile-card.profile-is-editing .biglwa-stories-ribbon{display:none!important}'
  ].join('\n');
  css.textContent+='\n'+[
   '#studioApp .profile-card{position:relative!important}',
   '#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon{position:static!important;inset:auto!important;z-index:auto!important;width:100%!important;max-width:none!important;min-width:0!important;margin:10px 0 0!important;display:flex!important;align-items:center!important;gap:6px!important;overflow:hidden!important}',
   '#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-stories-track{display:flex!important;flex:1 1 auto!important;gap:clamp(5px,1vw,12px)!important;justify-content:flex-start!important;align-items:center!important;min-width:0!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important;padding:1px!important}',
   '#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-story-bubble{flex:0 0 44px!important;width:44px!important;display:flex!important;flex-direction:column!important;gap:1px!important;align-items:center!important;cursor:pointer!important;border:0!important;background:transparent!important;padding:0!important}',
   '#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-story-ring{display:grid!important;place-items:center!important;width:35px!important;height:35px!important;box-sizing:border-box!important;border-radius:50%!important;padding:3px!important;background:conic-gradient(#eeb069,#e5729b,#9051b4,#eeb069)!important}',
   '#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-story-bubble[data-source="snapchat"] .biglwa-story-ring{background:conic-gradient(#f2d250,#ffe97c,#e5b528,#f2d250)!important}',
   '#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-story-bubble[data-source="new"] .biglwa-story-ring{background:#e4dcd6!important}',
   '#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-story-inner{display:grid!important;place-items:center!important;width:100%!important;height:100%!important;box-sizing:border-box!important;border-radius:50%!important;border:2px solid #fff8f1!important;background:#fff3ed!important;color:#673b57!important;font:700 17px Georgia,serif!important}',
   '#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-story-name{font:650 8px/1.1 system-ui!important;max-width:50px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#462d3c!important;text-align:center!important}',
   '#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-story-scroll{flex:0 0 15px!important;cursor:pointer!important;border:0!important;background:#fff9f1d9!important;color:#57364a!important}',
   '@media(max-width:640px){#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon{left:6px!important;right:6px!important;bottom:4px!important}#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-story-bubble{flex-basis:40px!important;width:40px!important}}',
   '#studioApp.profile-editor-wallpaper .profile-card .profile-copy>.biglwa-stories-ribbon,#studioApp .profile-card.profile-is-editing .profile-copy>.biglwa-stories-ribbon{display:none!important}'
   ,'#studioApp:not(.profile-editor-wallpaper) .profile-card:not(.profile-is-editing) .profile-copy>.stats.stats{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;width:100%!important;max-width:none!important;gap:6px!important;margin:0!important}#studioApp .profile-card .profile-copy>.stats.stats>*{min-width:0!important;padding:0 6px 0 0!important}#studioApp .profile-card .profile-copy>.stats.stats b{font-size:clamp(13px,1.2vw,18px)!important}'
   ,'#studioApp:not(.profile-editor-wallpaper) .hero .profile-card:not(.profile-is-editing) .profile-copy>.real-rank.real-rank{position:static!important;inset:auto!important;display:grid!important;grid-template-columns:auto auto minmax(60px,1fr) auto!important;align-items:center!important;gap:8px!important;width:100%!important;max-width:none!important;margin:12px 0 0!important;padding:10px 0 0!important}.profile-copy>.real-rank .rank-track{display:block!important;min-width:60px}.profile-copy>.real-rank .rank-track i{display:block!important}'
   ,'#studioApp:not(.profile-editor-wallpaper) .hero .profile-card.profile-card:not(.profile-is-editing){height:auto!important;min-height:334px!important;max-height:none!important;overflow:visible!important}#studioApp:not(.profile-editor-wallpaper) .hero .profile-card:not(.profile-is-editing) .profile-copy{min-width:0!important;padding-bottom:18px!important;overflow:visible!important}#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-stories-track{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(58px,1fr))!important;gap:10px!important;overflow:visible!important;width:100%!important}#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-story-bubble{justify-self:center!important}#studioApp .profile-card .profile-copy>.real-rank .real-rank-explanation{display:none!important}#studioApp .profile-card .profile-copy>.real-rank .rank-track{height:8px!important;overflow:hidden!important}#studioApp .profile-card .profile-copy>.real-rank .rank-track i{height:100%!important}'
   ,'#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-story-ring{width:46px!important;height:46px!important;padding:1px!important;box-shadow:3px 3px 0 #f36b21!important}#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon [data-source="snapchat"] .biglwa-story-ring{box-shadow:3px 3px 0 #e8c923!important}#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon [data-source="new"] .biglwa-story-ring{box-shadow:none!important}#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-story-inner{border-width:1px!important;overflow:hidden!important}#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-story-inner img{width:100%!important;height:100%!important;object-fit:cover!important;transform:scale(1.13)}#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon .biglwa-story-bubble{width:52px!important;gap:5px!important}#studioApp .profile-card .profile-copy>.biglwa-stories-ribbon{padding:3px 5px 5px 0!important}'
  ].join('\n');document.head.append(css);
 };
 function closeStory(){
  document.querySelectorAll('.biglwa-story-shade,.biglwa-story-popup').forEach(el=>el.remove());
  const editor=document.querySelector('[data-biglwa-public-showcase-editor]');if(editor)editor.open=false;
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeStory()});
 function storyShade(){
  closeStory();const shade=document.createElement('div');shade.className='biglwa-story-shade';
  shade.addEventListener('click',closeStory);document.body.append(shade);
 }
 function storyEditor(section){
  storyShade();section.open=true;
  let btn=section.querySelector('.biglwa-story-close');
  if(!btn){btn=document.createElement('button');btn.className='biglwa-story-close';btn.type='button';
   btn.textContent='×';btn.setAttribute('aria-label','Close highlight editor');btn.onclick=closeStory;
   section.insertBefore(btn,section.firstChild);}
  btn.focus();
 }
 function storyPreview(item,platform){
  storyShade();
  const pop=document.createElement('div');pop.className='biglwa-story-popup';
  pop.setAttribute('role','dialog');pop.setAttribute('aria-modal','true');
  const x=document.createElement('button');x.type='button';x.className='biglwa-story-close';
  x.textContent='×';x.setAttribute('aria-label','Close story');x.onclick=closeStory;
  const title=document.createElement('strong');title.textContent=platform==='snapchat'?'Spotlight':'Instagram Highlight';
  pop.append(x,title);
  if(typeof item.mediaUrl==='string'&&/^https:\/\/cf-st\.sc-cdn\.net\//.test(item.mediaUrl)){
   const video=document.createElement('video');video.controls=true;video.preload='metadata';video.playsInline=true;
   video.referrerPolicy='no-referrer';video.src=item.mediaUrl;pop.append(video);
  }
  const a=document.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';
  a.textContent=(platform==='snapchat'?'Open Storyclone':'View original Highlight')+' ↗';pop.append(a);
  const notice=document.createElement('small');notice.textContent='Source-hosted public story · availability may change';
  pop.append(notice);document.body.append(pop);x.focus();
 }
 function storyBubble(platform,label,fn){
  const b=document.createElement('button');b.type='button';b.className='biglwa-story-bubble';b.dataset.source=platform;
  b.setAttribute('aria-label',label);
  const ring=document.createElement('span');ring.className='biglwa-story-ring';
  const inner=document.createElement('span');inner.className='biglwa-story-inner';
  if(platform==='snapchat'){
   inner.textContent='↗';
  }else if(platform==='instagram'){
   const photo=window.__biglwaInstagramOrbit?.state?.profile?.profile_picture_url||'';
   if(/^https:\/\//.test(String(photo))){
    const img=document.createElement('img');img.src=photo;img.alt='';
    img.style.cssText='width:100%;height:100%;border-radius:50%;object-fit:cover';
    inner.append(img);
   }else inner.textContent='◌';
  }else inner.textContent='+';
  ring.append(inner);
  const title=document.createElement('span');title.className='biglwa-story-name';title.textContent=label;
  b.append(ring,title);b.onclick=fn;return b;
 }
 // Highlight circles link directly to the username-addressed public viewer.
 // Do not send OAuth tokens or background requests to third-party viewers.
 const highlightViewerUrl=handle=>'https://igexport.com/en/instagram-highlights-viewer/?username='+encodeURIComponent(handle);
 const snapchatViewerUrl=handle=>'https://o.storyclone.com/u/'+encodeURIComponent(handle)+'/';
 function viewerBubble(platform,handle){
  const bubble=storyBubble(platform,platform==='instagram'?'Highlights':'Stories',()=>{});
  const link=document.createElement('a');
  for(const attribute of bubble.attributes)link.setAttribute(attribute.name,attribute.value);
  link.href=platform==='instagram'?highlightViewerUrl(handle):snapchatViewerUrl(handle);
  link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';
  link.setAttribute('aria-label','View '+platform+' highlights for @'+handle);
  link.append(...bubble.childNodes);return link;
 }
 function mountStoryCircles(root,section,entries,snapItems,handles){
  const copy=root.querySelector('.profile-copy'),stats=copy?.querySelector('.stats');if(!copy||!stats)return;
  storyStyle();
  // Banner highlights must not relocate the profile's stats.
  root.querySelector('.biglwa-stories-ribbon')?.remove();
  const rail=document.createElement('div');rail.className='biglwa-stories-ribbon';rail.dataset.biglwaPublicShowcase='1';
  rail.setAttribute('aria-label','Highlights and Spotlights on banner');
  const track=document.createElement('div');track.className='biglwa-stories-track';
  track.setAttribute('role','group');track.setAttribute('aria-label','Story highlights');
  if(active('snapchat')&&!window.BigLWAImportedHighlights?.match(handles.instagram)?.highlights.some(g=>g.platform==='snapchat')){
   if(snapItems.length)snapItems.forEach((item,i)=>track.append(storyBubble('snapchat','Spotlight '+(i+1),
    ()=>storyPreview({...item,url:snapchatViewerUrl(handles.snapchat)},'snapchat'))));
   else if(handles.snapchat)track.append(viewerBubble('snapchat',handles.snapchat));
  }
  const imported=window.BigLWAImportedHighlights?.match(handles.instagram);
  const ig=imported?[]:entries.filter(x=>x.platform==='instagram'&&active('instagram'));
  imported?.highlights.forEach(group=>track.append(window.BigLWAImportedHighlights.bubble(group)));
   (window.BIGLWAHighlightEditor?.current?.()||[]).forEach(group=>track.append(window.BigLWAImportedHighlights?.bubble?.(group)||storyBubble('new',group.title,()=>{})));
  // Keep the approved username-addressed viewer available when the source
  // cannot return individual Highlight media. Do not invent imported records.
  if(handles.instagram&&!ig.length&&!imported){

   track.append(viewerBubble('instagram',handles.instagram));
  }
  ig.forEach((item,i)=>{const link=viewerBubble('instagram',handles.instagram);link.querySelector('.biglwa-story-name').textContent='Highlight '+(i+1);track.append(link)});
  entries.filter(x=>x.platform==='snapchat'&&active('snapchat')).forEach((item,i)=>
   track.append(storyBubble('snapchat','Spotlight '+(snapItems.length+i+1),()=>storyPreview(item,'snapchat'))));
  if(uid()&&section)track.append(storyBubble('new','New',()=>storyEditor(section)));
  const prev=document.createElement('button'),next=document.createElement('button');
  prev.className=next.className='biglwa-story-scroll';prev.type=next.type='button';prev.textContent='‹';next.textContent='›';
  prev.setAttribute('aria-label','Previous story highlights');next.setAttribute('aria-label','Next story highlights');
  const arrows=()=>{prev.disabled=track.scrollLeft<=2;next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-2};
  prev.onclick=()=>{track.scrollBy({left:-140,behavior:'smooth'});setTimeout(arrows,250)};
  next.onclick=()=>{track.scrollBy({left:140,behavior:'smooth'});setTimeout(arrows,250)};
  track.addEventListener('scroll',arrows,{passive:true});
  rail.append(track);stats.insertAdjacentElement('afterend',rail);requestAnimationFrame(arrows);
 }

 function show(){
  const root=document.querySelector('#studioApp .profile-card');
  storyStyle();
  const copy=root?.querySelector('.profile-copy');
  const rank=root?.querySelector('.real-rank')||document.querySelector('#skeletonRankMount .real-rank');
  if(copy&&rank&&rank.parentElement!==copy)copy.append(rank);
  const who=uid(),handles=accountHandles(),customGroups=window.BIGLWAHighlightEditor?.current?.()||[];
  const imported=window.BigLWAImportedHighlights?.match(handles.instagram);
  if(root&&imported&&location.pathname.replace(/\/$/,'')==='/leian'){mountStoryCircles(root,null,[],[],handles);return;}
  root?.querySelectorAll('[data-biglwa-bio-highlights]').forEach(el=>el.remove());
  const entries=[...instagramSourceHighlights(handles.instagram),...saved()]
    .filter((item,i,list)=>list.findIndex(other=>other.url===item.url)===i).slice(0,8);
  persistProviderLinks(handles,who);
  if(handles.snapchat)refreshPublicSnapchat(handles.snapchat,who);
  else if(snapSource.key)snapSource={key:'',status:'',items:[],message:''};
  const snapItems=handles.snapchat&&snapSource.key===who+':'+handles.snapchat.toLowerCase()?snapSource.items:[];
  if(!root||!who||(!active('snapchat')&&!active('instagram')&&!customGroups.length&&!imported)){root?.querySelectorAll('[data-biglwa-bio-highlights]').forEach(el=>el.remove());root?.querySelector('[data-biglwa-public-showcase]')?.remove();document.querySelector('[data-biglwa-public-showcase-editor]')?.remove();signature='';return}
  const tag=Boolean(imported)+'|'+who+'|'+entries.map(x=>x.url).join('|')+'|'+handles.snapchat+'|'+handles.instagram+'|'+snapSource.status+'|'+snapItems.map(x=>x.mediaUrl||'').join('|')+'|'+JSON.stringify(window.BIGLWAHighlightEditor?.get?.()||{}).slice(0,12000);
  if(signature===tag&&root.querySelector('[data-biglwa-public-showcase]'))return;
  signature=tag;
  root.querySelector('[data-biglwa-public-showcase]')?.remove();
  document.querySelector('[data-biglwa-public-showcase-editor]')?.remove();
  const section=document.createElement('details');section.dataset.biglwaPublicShowcaseEditor='1';section.className='biglwa-showcase-editor';
  section.style.cssText='margin:8px 0 0;padding:6px 0 0;border-top:1px solid #dfcfce;min-width:0';
  const title=document.createElement('summary');title.textContent='Spotlight & Highlights';
  title.style.cssText='cursor:pointer;font:700 11px/1.5 system-ui;color:#762e4b';
  section.append(title);
  const discovery=document.createElement('div');
  discovery.style.cssText='padding:5px 0 8px;font:500 10px/1.55 system-ui;color:#705364;display:grid;gap:5px';
  if(active('snapchat')){
   const a=document.createElement('a');a.target='_blank';a.rel='noopener noreferrer';
   a.href=handles.snapchat?snapchatViewerUrl(handles.snapchat):'https://o.storyclone.com/';
   a.textContent=handles.snapchat?'Snapchat · @'+handles.snapchat+' ↗':'Snapchat · provider did not supply a public @username';
   discovery.append(a);
   if(handles.snapchat){
    const status=document.createElement('small');status.textContent=snapSource.status==='loading'
     ?'Checking public Spotlight index for an exact username match…':
     (snapSource.message||'No public Spotlight preview yet.');
    discovery.append(status);
   }
  }
  if(active('instagram')){
   const a=document.createElement('a');
   a.href=handles.instagram?highlightViewerUrl(handles.instagram):'https://igexport.com/en/instagram-highlights-viewer/';
   a.target='_blank';a.rel='noopener noreferrer';
   a.textContent=handles.instagram?'Instagram connected · @'+handles.instagram:'Instagram connected';
   discovery.append(a);
   const note=document.createElement('small');
   note.textContent=handles.instagram?
    'Profile link recognized automatically. Individual pinned Highlights will appear when a source returns their IDs; no second login needed.':
    'Your Instagram login is connected; waiting for a readable public profile handle.';
   discovery.append(note);
   if(validHandle(handles.instagram)){
    const automatic=document.createElement('a');
    automatic.href=highlightViewerUrl(handles.instagram);
    automatic.textContent='View public Highlights for @'+handles.instagram+' ↗';
    automatic.target='_blank';automatic.rel='noopener noreferrer';automatic.referrerPolicy='no-referrer';
    discovery.append(automatic);

   }
  }
  section.append(discovery);
  const advanced=document.createElement('details');advanced.style.marginTop='6px';
  const advancedTitle=document.createElement('summary');
  advancedTitle.textContent='Optional · add an individual Highlight or Spotlight link';
  advancedTitle.style.cssText='cursor:pointer;font:650 11px system-ui;color:#7f425a';
  advanced.append(advancedTitle);section.append(advanced);
  const form=document.createElement('form');form.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin:9px 0';
  const input=document.createElement('input');input.type='url';input.placeholder='Snapchat Spotlight or Instagram Highlight URL';
  input.setAttribute('aria-label','Public Spotlight or Highlight URL');input.required=true;input.maxLength=500;
  input.style.cssText='box-sizing:border-box;flex:1 1 180px;min-width:0;border:1px solid #c7a7b0;border-radius:7px;padding:8px;background:#fffaf7;color:#3b2734;font:11px system-ui';
  const button=document.createElement('button');button.type='submit';button.textContent='Add link';
  button.style.cssText='padding:6px 9px;border:1px solid #8c6072;background:#8a4261;color:white;border-radius:7px;font:700 11px system-ui;cursor:pointer';
  const notice=document.createElement('small');notice.role='status';notice.style.cssText='display:block;flex-basis:100%;font:500 10px system-ui;color:#714759';
  form.append(input,button,notice);advanced.append(form);
  form.onsubmit=e=>{
   e.preventDefault();const item=clean(input.value);
   if(!item){notice.textContent='Use an original public Snapchat Spotlight or Instagram Highlight link.';return}
   if(!active(item.platform)){notice.textContent='Connect '+item.platform+' in Orbit before adding its links.';return}
   const items=saved();
   if(items.some(x=>x.url===item.url)){notice.textContent='Already saved.';return}
   if(items.length>=8){notice.textContent='Remove an older highlight before adding another (maximum 8).';return}
   try{localStorage.setItem(key(),JSON.stringify([...items,{...item,date:new Date().toISOString().slice(0,10)}]));render()}
   catch{notice.textContent='Browser storage unavailable.'}
  };
  const container=document.createElement('div');container.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px';
  snapItems.forEach((item,i)=>{
    const wrap=document.createElement('div');
    wrap.style.cssText='min-width:0;border:1px solid #ead7a8;border-radius:9px;overflow:hidden;background:#fff9f0';
    const a=document.createElement('a');
    a.href=snapchatViewerUrl(handles.snapchat);
    a.target='_blank';a.rel='noopener noreferrer';
    a.textContent='Spotlight · @'+handles.snapchat+' ↗';
    a.style.cssText='display:block;padding:6px;color:#6e3d19;font:700 10px system-ui';
    const video=document.createElement('video');
    video.controls=true;video.preload='none';video.playsInline=true;
    video.referrerPolicy='no-referrer';
    video.src=item.mediaUrl;video.setAttribute('aria-label','Public Spotlight preview '+(i+1));
    video.style.cssText='display:block;width:100%;max-height:210px;background:#231b19;object-fit:contain';
    const info=document.createElement('small');
    info.textContent='External source preview · not imported or ownership-verified';
    info.style.cssText='display:block;padding:5px;font:500 9px/1.3 system-ui';
    wrap.append(a,video,info);container.append(wrap);
  });
  entries.forEach((item,i)=>{
   const wrap=document.createElement('div');wrap.style.cssText='min-width:0;border:1px solid #debbc6;border-radius:9px;overflow:hidden;background:#fff9f4';
   const bar=document.createElement('div');bar.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:5px;gap:3px';
   const a=document.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=item.kind+' ↗';
   a.style.cssText='font:700 10px system-ui;color:#763548;text-decoration:none;min-width:0';
   const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remove '+item.kind);
   remove.style.cssText='background:transparent;border:0;font-size:17px;cursor:pointer;color:#714659';
   remove.onclick=()=>{localStorage.setItem(key(),JSON.stringify(saved().filter(x=>x.url!==item.url)));render()};
   bar.append(a,remove);wrap.append(bar);
   if(item.platform==='snapchat'&&item.url.includes('/spotlight/')){
    const preview=document.createElement('button');preview.type='button';preview.textContent='▶ Preview Spotlight';
    preview.style.cssText='width:100%;min-height:62px;border:0;background:#f5e4a9;color:#3f2c0d;font:700 11px system-ui;cursor:pointer';
    preview.onclick=()=>{
     const iframe=document.createElement('iframe');iframe.loading='lazy';
     iframe.title='Snapchat Spotlight · source hosted';iframe.src=item.url.replace(/\/$/,'')+'/embed';
     iframe.referrerPolicy='no-referrer';iframe.allow='encrypted-media;fullscreen;picture-in-picture';
     iframe.style.cssText='width:100%;aspect-ratio:9/16;border:0;min-height:210px';
     preview.replaceWith(iframe);
    };
    wrap.append(preview);
   }else{
    const label=document.createElement('small');label.textContent='Public highlight · open on Instagram';
    label.style.cssText='display:block;padding:12px 5px;font:500 10px system-ui';wrap.append(label);
   }
   const date=document.createElement('button');date.type='button';date.textContent='Add to Calendar';
   date.style.cssText='margin:3px 5px 7px;padding:4px;border:1px solid #dcb5bf;background:transparent;border-radius:6px;color:#6e3348;font:650 9px system-ui;cursor:pointer';
   date.onclick=()=>{
    try{
     const k='biglwaCalendarEvents',prev=JSON.parse(localStorage.getItem(k)||'[]');
     const items=Array.isArray(prev)?prev:[];
     if(!items.some(x=>x.url===item.url&&x.date===item.date))items.push({date:item.date,title:item.kind+' · shared link',url:item.url,source:item.platform,meta:item.url});
     localStorage.setItem(k,JSON.stringify(items));date.textContent='Added ✓';
    }catch{date.textContent='Could not save'}
   };wrap.append(date);container.append(wrap);
  });
  section.append(container);
  const foot=document.createElement('small');foot.textContent='Connected profiles appear automatically. Optional individual story links stay in this browser; source media stays on its original platform.';
  foot.style.cssText='display:block;font:500 9px/1.4 system-ui;color:#766369;margin-top:7px';section.append(foot);
  document.body.append(section);
  mountStoryCircles(root,section,entries,snapItems,handles);
 }
 function render(){
  const open=document.querySelector('[data-biglwa-public-showcase-editor]')?.open;
  signature='';show();
  if(open){const section=document.querySelector('[data-biglwa-public-showcase-editor]');if(section)section.open=true}
 }
 let timer;function schedule(){clearTimeout(timer);timer=setTimeout(show,90)}
 for(const event of ['biglwa:public-profile-ready','biglwa:highlights-imported','biglwa:new-orbit-status','biglwa:identity-updated','biglwa:session-verified','biglwa:orbit-links-synced'])
  (event==='biglwa:new-orbit-status'?document:window).addEventListener(event,schedule);
 document.addEventListener('biglwa:new-orbit-status',schedule);
  window.addEventListener('biglwa:highlight-config-changed',()=>{signature='';schedule()});
 // Refresh source-hosted Spotlight previews periodically while the member is present.
 setInterval(()=>{if(uid())schedule()},15*60*1000);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
