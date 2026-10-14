/* Shared, compact feed-card chrome and resilient external thumbnails. */
(()=>{
 if(window.__biglwaFeedPolishV1)return;window.__biglwaFeedPolishV1=true;
 const styles=`
 #feedPageList>.biglwa-pin-post,#feedPageList>.pinterest-feed-item,#feedPageList>.biglwa-instagram-card{
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
     const source=card.querySelector('[data-instagram-open]')?.getAttribute('href')||
        (card.dataset.sourceId?'https://www.pinterest.com/pin/'+encodeURIComponent(card.dataset.sourceId)+'/':'');
     const markup=window.__biglwaFeed?.sendBarMarkup?.(false,source)||fallbackMarkup(sanitizeUrl(source));
     card.insertAdjacentHTML('beforeend',markup);
     details=card.querySelector('details.biglwa-card-options');
   }
   if(!details)return;
   const summary=details.querySelector('summary');
   if(summary){summary.textContent='+';summary.setAttribute('aria-label','More actions: Save, post, or share');summary.setAttribute('title','More actions');}
   const tray=details.querySelector('.biglwa-send-tray');
   if(card.classList.contains('pinterest-feed-item')&&!card.classList.contains('biglwa-pin-post')&&tray&&!tray.querySelector('[data-publish-connected]')){
     const btn=document.createElement('button');btn.type='button';btn.textContent='Post to Collective Feed';btn.dataset.publishConnected='pinterest';
     tray.insertBefore(btn,tray.firstChild);
   }
   if(card.classList.contains('biglwa-instagram-card')&&tray&&!tray.dataset.instagramMoved){
     const actions=card.querySelector('.biglwa-instagram-actions');
     if(actions){
       const hide=actions.querySelector('[data-instagram-hide]');if(hide){hide.textContent='Archive / hide from Feed';hide.setAttribute('aria-label','Archive or hide');tray.appendChild(hide);}
       const original=actions.querySelector('[data-instagram-open]');if(original){original.textContent='Open on Instagram ↗';tray.appendChild(original);}
     }
     tray.dataset.instagramMoved='1';
   }
   if(card.dataset.sendRecord&&!card.dataset.polishRegistered&&window.__biglwaFeed?.registerSendCard){
     try{window.__biglwaFeed.registerSendCard(card);card.dataset.polishRegistered='1';}catch{}
   }
   card.querySelectorAll('img[data-biglwa-external-media]').forEach(img=>{
     if(img.dataset.biglwaGuarded)return;img.dataset.biglwaGuarded='1';
     img.addEventListener('error',()=>{
       // This image came directly from a connected service. Don't draw a blank card when its signed CDN URL expires.
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
 function scan(){queued=false;document.querySelectorAll('#feedPageList .biglwa-pin-post,#feedPageList .pinterest-feed-item,#feedPageList .biglwa-instagram-card').forEach(normalizeCard);}
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(scan);}
 const obs=new MutationObserver(muts=>{if(muts.some(m=>m.addedNodes.length||m.removedNodes.length))schedule();});
 function boot(){obs.observe(document.body,{childList:true,subtree:true});schedule();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 document.addEventListener('biglwa:feed-ready',schedule);
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
