/* Shared, compact feed-card chrome and resilient external thumbnails. */
(()=>{
 if(window.__biglwaFeedPolishV1)return;window.__biglwaFeedPolishV1=true;
 const styles=`
 #feedPageList>.biglwa-pin-post,#feedPageList>.pinterest-feed-item,#feedPageList>.biglwa-instagram-card,#feedPageList>.facebook-feed-item{
   box-sizing:border-box!important;position:relative!important;display:inline-block!important;vertical-align:top!important;
   padding:0!important;margin:0 0 18px!important;width:100%!important;min-width:0!important;
   border-radius:15px!important;border:1px solid #e4d4c8!important;background:#fff8ef!important;
   box-shadow:var(--feed-card-shadow,3px 3px 0 var(--feed-card-rim,#be4154))!important;
   overflow:visible!important;break-inside:avoid!important;isolation:isolate
 }
 #feedPageList .biglwa-unified-media{position:relative!important;padding:0!important;margin:0!important;line-height:0!important;
  overflow:hidden!important;border-radius:14px!important;background:#eee8df!important;min-height:0!important}
 #feedPageList .biglwa-unified-media>img,
 #feedPageList .biglwa-unified-media>video{display:block!important;width:100%!important;height:auto!important;
   max-height:none!important;object-fit:cover!important;margin:0!important;padding:0!important;border-radius:14px!important}
 #feedPageList .biglwa-instagram-card>div:first-child{padding:0!important;margin:0!important;position:static!important}
 #feedPageList .biglwa-instagram-strip{position:absolute!important;left:9px!important;bottom:9px!important;top:auto!important;
   z-index:9!important;width:auto!important;min-height:0!important;max-height:34px!important;padding:0!important;
   border:0!important;background:transparent!important;box-shadow:none!important}
 #feedPageList .biglwa-instagram-actions{display:none!important}
 #feedPageList .biglwa-instagram-tabs{margin:0!important;padding:0!important;min-height:0!important}
 #feedPageList .biglwa-instagram-tab{height:26px!important;min-width:22px!important}
 #feedPageList .biglwa-unified-source{position:absolute!important;left:9px!important;top:9px!important;
   z-index:8!important;font:750 9px/1 ui-monospace,monospace!important;color:#fffdf7!important;
   background:#302829d9!important;border:1px solid #ffffff8a!important;border-radius:30px!important;
   padding:7px 9px!important;pointer-events:none!important}
 #feedPageList .biglwa-card-options{display:block!important;position:absolute!important;right:8px!important;bottom:8px!important;
   top:auto!important;left:auto!important;z-index:20!important;width:auto!important;height:auto!important;min-height:0!important;
   margin:0!important;padding:0!important;border:0!important;background:transparent!important;overflow:visible!important}
 #feedPageList .biglwa-card-options>summary{display:grid!important;place-items:center!important;width:34px!important;height:34px!important;
   padding:0!important;box-sizing:border-box!important;list-style:none!important;font:800 24px/1 system-ui!important;
   border-radius:50%!important;border:1px solid #ffffffd9!important;cursor:pointer!important;
   background:#292525eb!important;color:#fff!important;box-shadow:0 2px 8px #0004!important}
 #feedPageList .biglwa-card-options>summary::-webkit-details-marker{display:none!important}
 #feedPageList .biglwa-card-options .biglwa-send-tray{display:none!important;position:absolute!important;
   right:0!important;bottom:42px!important;top:auto!important;width:max-content!important;
   min-width:188px!important;max-width:min(260px,80vw)!important;max-height:min(60vh,360px)!important;
   overflow-y:auto!important;box-sizing:border-box!important;z-index:99!important;padding:9px!important;
   border-radius:12px!important;border:1px solid #c8b0a1!important;background:#fffaf1!important;
   color:#352b26!important;box-shadow:0 10px 25px #17100b5c!important;gap:5px!important;flex-direction:column!important}
 #feedPageList .biglwa-card-options[open] .biglwa-send-tray{display:flex!important}
 #feedPageList .biglwa-send-tray button,#feedPageList .biglwa-send-tray a{
   display:block!important;width:100%!important;padding:9px 10px!important;border:0!important;
   border-radius:7px!important;background:#f4e9df!important;color:#382c2a!important;
   font:700 11px/1.3 system-ui!important;text-align:left!important;text-decoration:none!important;cursor:pointer!important}
 #feedPageList .biglwa-send-tray button:disabled{opacity:.6;cursor:default!important}
 #feedPageList .biglwa-send-tray input{width:100%!important;box-sizing:border-box!important}
 #feedPageList .biglwa-unavailable-media{display:grid;place-items:center;min-height:145px;line-height:1.45;
   padding:20px;text-align:center;color:#5e5148;font:600 12px/1.5 system-ui;background:#ede4da}
 #feedPageList .biglwa-send-status{font:11px/1.4 system-ui!important;white-space:normal!important}
 /* Small + appears on image hover or keyboard focus, not constantly over the artwork. */
 #feedPageList .biglwa-card-options{right:auto!important;left:8px!important;bottom:8px!important;opacity:0;pointer-events:none;transition:opacity .13s ease!important}
 #feedPageList .biglwa-card-options>summary{width:25px!important;height:25px!important;font:800 17px/1 system-ui!important;border-radius:50%!important}
 #feedPageList :is(.biglwa-pin-post,.pinterest-feed-item,.biglwa-instagram-card,.facebook-feed-item):is(:has(.biglwa-unified-media:hover),:focus-within)>.biglwa-card-options,
 #feedPageList .biglwa-card-options[open]{opacity:1!important;pointer-events:auto!important}
 #feedPageList .biglwa-card-options .biglwa-send-tray{right:auto!important;left:0!important;bottom:34px!important}
 @media(hover:none){#feedPageList .biglwa-card-options{opacity:1!important;pointer-events:auto!important}}
 /* Three tiny window controls: only the owner can archive/remove a saved post. */
 #feedPageList .biglwa-feed-lights{position:absolute;top:8px;right:8px;left:auto!important;z-index:25;display:flex!important;gap:3px;align-items:center;
   padding:3px 5px;background:#faf5ecce;border:1px solid #e1d2c5a9;border-radius:30px;box-shadow:0 3px 12px #0002}
 #feedPageList .biglwa-feed-lights>button{display:block!important;flex:none!important;width:8px!important;height:8px!important;
   min-height:8px!important;border:1px solid #0002!important;border-radius:50%!important;cursor:pointer!important;
   padding:0!important;min-width:8px!important;line-height:0!important;font-size:0!important;box-shadow:0 1px 2px #0002!important}
 #feedPageList .biglwa-feed-lights [data-feed-light="delete"]{background:#dc5c63!important}
 #feedPageList .biglwa-feed-lights [data-feed-light="archive"]{background:#eec449!important}
 #feedPageList .biglwa-feed-lights [data-feed-light="enlarge"]{background:#50ab77!important}
 #feedPageList .biglwa-feed-lights button:disabled{opacity:.4!important;cursor:not-allowed!important}
 #feedPageList .biglwa-feed-lights button:focus-visible{outline:3px solid #fff!important;outline-offset:2px!important}
 #feedPageList .biglwa-unified-source{left:9px!important;right:auto!important;top:9px!important}
 #biglwaFeedLightbox{border:0;padding:20px;border-radius:18px;background:#191716;color:#fff;max-height:90vh;max-width:min(88vw,1050px);box-shadow:0 18px 65px #0009}
 #biglwaFeedLightbox::backdrop{background:#000b}
 #biglwaFeedLightbox img,#biglwaFeedLightbox video{display:block;max-width:100%;max-height:78vh;margin:auto;object-fit:contain}
 #biglwaFeedLightbox button{float:right;border:0;border-radius:9px;background:#fff;color:#292525;padding:5px 11px;cursor:pointer}
 
 `;
 const style=document.createElement('style');style.id='biglwaFeedPolishStyles';style.textContent=styles;document.head.appendChild(style);
 const fallbackMarkup=(url)=>'<details class="biglwa-send biglwa-card-options"><summary aria-label="More actions">+</summary>'+
 '<div class="biglwa-send-tray"><button type="button" data-send-to="boards">Save to Boards</button>'+
 '<button type="button" data-send-to="projects">Add to Projects</button>'+
 '<input type="text" data-send-map-field aria-label="Place on map" placeholder="Place or location">'+
 '<button type="button" data-send-map>Pin on Map</button>'+
 (url?'<a target="_blank" rel="noopener noreferrer" href="'+url+'">Original post ↗</a>':'')+
 '<span data-send-status class="biglwa-send-status" role="status"></span></div></details>';
 function sanitizeUrl(url){try{const u=new URL(url,location.href);return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}}
 function normalizeCard(card){
   if(!card.isConnected)return;
   let details=card.querySelector('details.biglwa-card-options');
   if(!details){
     let data={};try{data=JSON.parse(card.dataset.sendRecord||'{}')}catch{}
     const source=data.sourceUrl||card.querySelector('[data-instagram-open]')?.getAttribute('href')||
        (card.classList.contains('pinterest-feed-item')&&card.dataset.sourceId?'https://www.pinterest.com/pin/'+encodeURIComponent(card.dataset.sourceId)+'/':'');
     const markup=window.__biglwaFeed?.sendBarMarkup?.(false,source)||fallbackMarkup(sanitizeUrl(source));
     card.insertAdjacentHTML('beforeend',markup);
     details=card.querySelector('details.biglwa-card-options');
   }
   if(!details)return;
   if(!card.querySelector('.biglwa-feed-lights')){
     const owned=card.dataset.feedOwned==='1';
     const lights=document.createElement('div');lights.className='biglwa-feed-lights';
     lights.setAttribute('role','group');lights.setAttribute('aria-label','Post window controls');
     for(const [name,title] of [['delete','Remove post (30-day recovery)'],['archive','Archive post'],['enlarge','Enlarge image']]){
       const button=document.createElement('button');button.type='button';
       button.dataset.feedLight=name;
       button.setAttribute('aria-label',title);button.title=title;
       if(owned){
         button.setAttribute('data-post-'+name,'');
       }else{
         button.dataset.liveFeedOp=name;
       }
       if(!owned&&(card.classList.contains('biglwa-pin-post')||card.classList.contains('facebook-feed-item'))&&name!=='enlarge'){
         button.disabled=true;button.title='Only the owner can archive or remove this post.';
       }
       lights.append(button);
     }
     card.append(lights);
   }
   const summary=details.querySelector('summary');
   if(summary){if(summary.textContent.trim()!=='+')summary.textContent='+';summary.setAttribute('aria-label','More actions: Save, post, or share');summary.setAttribute('title','More actions');}
   const tray=details.querySelector('.biglwa-send-tray');
   if(card.classList.contains('pinterest-feed-item')&&!card.classList.contains('biglwa-pin-post')&&tray&&!tray.querySelector('[data-publish-connected]')){
     const btn=document.createElement('button');btn.type='button';btn.textContent='Post to Collective Feed';btn.dataset.publishConnected='pinterest';
     tray.insertBefore(btn,tray.firstChild);
   }
   if(card.classList.contains('biglwa-instagram-card')&&tray&&!tray.dataset.instagramMoved){
     const actions=card.querySelector('.biglwa-instagram-actions');
     if(actions){
       // The shared top-right lights handle delete/archive/enlarge. Keep only
       // the provider link in the + tray, avoiding duplicate hidden actions.
       const original=actions.querySelector('[data-instagram-open]');
       if(original){original.textContent='Open on Instagram ↗';tray.appendChild(original);}
       actions.remove();
     }
     tray.dataset.instagramMoved='1';
   }
   if(card.dataset.sendRecord&&!card.dataset.polishRegistered&&window.__biglwaFeed?.registerSendCard){
     try{window.__biglwaFeed.registerSendCard(card);card.dataset.polishRegistered='1';}catch{}
   }
   card.querySelectorAll('img[data-biglwa-external-media]').forEach(img=>{
     if(img.dataset.biglwaGuarded)return;img.dataset.biglwaGuarded='1';
     const alternates=(()=>{try{return JSON.parse(img.dataset.biglwaImageAlternates||'[]')}catch{return[]}})();
     const seen=new Set([img.getAttribute('src')]);
     img.addEventListener('error',()=>{
       const nextImage=alternates.find(src=>typeof src==='string'&&!seen.has(src));
       if(nextImage){seen.add(nextImage);img.src=nextImage;return;}
       // All available embed resolutions failed: keep the card and its original-source link.
       const source=card.dataset.sourceId?'https://www.pinterest.com/pin/'+encodeURIComponent(card.dataset.sourceId)+'/':'';
       const panel=document.createElement('div');panel.className='biglwa-unavailable-media';
       panel.textContent='Source image unavailable — try reconnecting or syncing this account.';
       img.replaceWith(panel);card.classList.add('biglwa-image-unavailable');
       if(source&&!tray?.querySelector('[href="'+source+'"]')){
          const link=document.createElement('a');link.href=source;link.rel='noopener noreferrer';link.target='_blank';link.textContent='View original ↗';tray?.appendChild(link);
       }
     });
     if(img.complete&&!img.naturalWidth)img.dispatchEvent(new Event('error'));
   });
 }
 let queued=false;
 function scan(){queued=false;document.querySelectorAll('#feedPageList .biglwa-pin-post,#feedPageList .pinterest-feed-item,#feedPageList .biglwa-instagram-card,#feedPageList .facebook-feed-item').forEach(normalizeCard);}
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(scan);}
 const obs=new MutationObserver(muts=>{if(muts.some(m=>m.addedNodes.length||m.removedNodes.length))schedule();});
 function boot(){obs.observe(document.body,{childList:true,subtree:true});schedule();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 document.addEventListener('biglwa:feed-ready',schedule);
 const lightbox=()=>{
   let dialog=document.getElementById('biglwaFeedLightbox');
   if(!dialog){
     dialog=document.createElement('dialog');dialog.id='biglwaFeedLightbox';
     dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
     document.body.append(dialog);
   }
   return dialog;
 };
 async function findImportedCard(card) {
   const api=window.__biglwaOrbitPosts;
   if(!api?.loadArchive||!api?.setOrbitState)throw Error('Sign in to BIGLWA and sync Orbit first.');
   let record={};try{record=JSON.parse(card.dataset.sendRecord||'{}')}catch{}
   const source=String(record.source||(card.classList.contains('facebook-feed-item')?'facebook':card.classList.contains('pinterest-feed-item')?'pinterest':'instagram')).toLowerCase();
   const sourceId=String(record.sourcePostId||card.dataset.sourceId||'');
   if(!sourceId)throw Error('This post has no saved Orbit identifier.');
   let cursor=null;
   for(let page=0;page<15;page++){
     const batch=await api.loadArchive(null,48,cursor);
     const found=batch.find(row=>String(row.sourcePostId||'')===sourceId&&String(row.source||'').toLowerCase()===source);
     if(found)return found;
     if(!batch.hasMore||!batch.nextCursor)break;
     cursor=batch.nextCursor;
   }
   throw Error('This image is not saved to your account yet. Sync it in Orbit first.');
 }
 function showFeedNotice(card,message){
   let msg=card.querySelector('.biglwa-feed-light-status');
   if(!msg){msg=document.createElement('span');msg.className='biglwa-feed-light-status';msg.setAttribute('role','status');msg.style.cssText='display:block;padding:6px 9px;font:600 10px/1.3 system-ui;color:#48332b;background:#fff8e9';card.append(msg);}
   msg.textContent=message;
 }
 document.addEventListener('click',async event=>{
   const button=event.target.closest?.('#feedPageList [data-live-feed-op]');
   if(!button)return;
   event.preventDefault();event.stopPropagation();
   const card=button.closest('.biglwa-pin-post,.pinterest-feed-item,.biglwa-instagram-card,.facebook-feed-item');
   if(!card)return;
   const op=button.dataset.liveFeedOp;
   if(op==='enlarge'){
     // Source metadata can contain a playable video even when the visible card is only a poster.
     if(window.__biglwaFeed?.previewPost?.(card.dataset.postId))return;
     let record={};try{record=JSON.parse(card.dataset.sendRecord||'{}')}catch{}
     const link=String(record.sourceUrl||card.querySelector('[data-instagram-open]')?.href||'');
     const video=String(record.videoUrl||record.video_url||record.mediaUrl||
       (Array.isArray(record.mediaItems)?record.mediaItems.find(x=>x?.isPicture===false)?.url:'')||'');
     let embed='';
     try{
       const u=new URL(link);
       if(['youtube.com','www.youtube.com','youtu.be','m.youtube.com'].includes(u.hostname)){
         const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.pathname.startsWith('/shorts/')?u.pathname.split('/')[2]:u.searchParams.get('v');
         if(/^[A-Za-z0-9_-]{11}$/.test(id||''))embed='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1';
       }else if(['tiktok.com','www.tiktok.com','m.tiktok.com'].includes(u.hostname)){
         const m=u.pathname.match(/\/video\/(\d{9,25})/);
         if(m)embed='https://www.tiktok.com/player/v1/'+m[1];
       }else if(['instagram.com','www.instagram.com'].includes(u.hostname)){
         const m=u.pathname.match(/^\/(reel|p|tv)\/([A-Za-z0-9_-]+)\/?/);
         if(m&&(m[1]!=='p'||record.isVideo===true||(record.mediaItems||[]).some(x=>x?.isPicture===false||/^video/i.test(x?.mediaType||''))))embed='https://www.instagram.com/'+m[1]+'/'+m[2]+'/embed/';
       }
     }catch{}
     const photo=card.querySelector('.biglwa-unified-media img,.biglwa-unified-media video,img[data-instagram-media],img[data-biglwa-external-media]');
     if(!photo&&!video&&!embed){showFeedNotice(card,'Playable media not available for this source.');return;}
     const dialog=lightbox();
     let view;
     if(/^https:\/\//.test(video)&&/\.(mp4|webm|m4v)(\?|#|$)/i.test(video)){
       view=document.createElement('video');view.src=video;view.controls=true;view.autoplay=true;view.playsInline=true;
       if(photo?.tagName==='IMG')view.poster=photo.src;
     }else if(embed){
       view=document.createElement('iframe');view.src=embed;view.title='Video preview';
       view.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';view.allowFullscreen=true;
       view.style.cssText='display:block;width:min(86vw,850px);height:min(75vh,480px);border:0';
     }else{
       view=photo.cloneNode(true);view.removeAttribute('loading');view.style.cssText='';
       if(view.tagName==='VIDEO')view.controls=true;
     }
     dialog.replaceChildren();
     const close=document.createElement('button');close.textContent='Close ×';close.onclick=()=>dialog.close();
     dialog.append(close,view);dialog.showModal();return;
   }
   if(op==='delete'&&!window.confirm('Remove this imported post from Collective Feed? It will remain recoverable in your Archive for 30 days.'))return;
   button.disabled=true;
   showFeedNotice(card,op==='archive'?'Archiving account post…':'Moving account post to recovery…');
   try{
     const record=await findImportedCard(card);
     if(op==='delete'&&record.archiveState==='pending_delete')throw Error('This post is already pending deletion.');
     await window.__biglwaOrbitPosts.setOrbitState(record.id,op==='archive'?'archived':'pending_delete');
     card.remove();window.__biglwaFeed?.refresh?.();
   }catch(error){showFeedNotice(card,error?.message||'Could not update this post.');}
   finally{button.disabled=false}
 });
  document.addEventListener('click',async event=>{
   const publish=event.target.closest('[data-publish-connected]');
   if(publish){
     event.preventDefault();event.stopPropagation();
     const card=publish.closest('.pinterest-feed-item'),sourceId=card?.dataset.sourceId;
     const api=window.__biglwaOrbitPosts;
     const status=publish.closest('.biglwa-send-tray')?.querySelector('[data-send-status]');
     const show=message=>{if(status)status.textContent=message;};
     if(!sourceId||!api?.loadArchive||!api?.publishOrbitPost){show('Connect Pinterest and sign in to publish.');return;}
     publish.disabled=true;show('Finding your saved Pin…');
     try{
       let cursor=null,found=null;
       for(let page=0;page<6;page++){
         const batch=await api.loadArchive(null,48,cursor);
         found=batch.find(row=>String(row.sourcePostId)===String(sourceId)&&String(row.source).toLowerCase()==='pinterest');
         if(found||!batch.hasMore)break;
         cursor=batch.nextCursor;
       }
       if(!found)throw Error('This Pin is not saved to your Big LWA account. Open Boards and sync Pins first.');
       if(found.state==='approved'||found.archiveState==='collective'){show('Already posted to Collective Feed.');return;}
       await api.publishOrbitPost(found.id);
       show('Published to Collective Feed.');publish.textContent='Posted to Collective';
       window.__biglwaFeed?.refresh?.();
     }catch(error){show(error?.message||'Could not publish this Pin.');}finally{publish.disabled=false;}
     return;
   }
   const summary=event.target.closest('#feedPageList details.biglwa-card-options > summary');
   if(summary){
     document.querySelectorAll('#feedPageList details.biglwa-card-options[open]').forEach(open=>{
       if(open!==summary.parentElement)open.open=false;
     });
   }else if(!event.target.closest('#feedPageList details.biglwa-card-options')){
     document.querySelectorAll('#feedPageList details.biglwa-card-options[open]').forEach(el=>el.open=false);
   }
 });
 document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('#feedPageList details.biglwa-card-options[open]').forEach(el=>el.open=false);});
})();
