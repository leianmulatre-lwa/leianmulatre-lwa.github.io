
(function () {
  'use strict';
  if (window.__biglwaTikTokOrbit) return;
  const API = 'https://api.biglwa.com';
  const KEY = 'biglwaTikTokSession';
  const PENDING_KEY = 'biglwaTikTokPendingHandoffV2';
  const START_UID = 'biglwaTikTokStartingUid';
  // Capture OAuth response before module-pages rewrites the Studio URL.
  const CALLBACK_HANDOFF=(()=>{try{return new URL(location.href).searchParams.get('tiktok_handoff')||''}catch{return''}})();
  const CALLBACK_ERROR=(()=>{try{return new URL(location.href).searchParams.get('tiktok_error')||''}catch{return''}})();
  let connected = false, profile = {}, videos = [], authUid = '', restoreBusy = false;
  let lastError='',videoPermissionPending=false,videoLoadError='',lastCollectiveSync='';
  const scopedKey = () => authUid ? KEY + ':' + authUid : '';
  const getSession = () => { try { return scopedKey() ? localStorage.getItem(scopedKey()) || '' : ''; } catch { return ''; } };
  const save = value => { if (!scopedKey()) return; try { if (value) localStorage.setItem(scopedKey(), value); else localStorage.removeItem(scopedKey()); } catch {} };
  async function firebaseIdToken() {
    try {
      const [{ getAuth }, { initializeApp, getApps }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js')
      ]);
      const app = getApps()[0] || initializeApp({
        apiKey:'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
        authDomain:'biglwa.firebaseapp.com',projectId:'biglwa',
        appId:'1:83232670555:web:e04927b20458390b3b507e'
      });
      const auth = getAuth(app);
      await auth.authStateReady();
      authUid = auth.currentUser?.uid || '';
      return auth.currentUser ? auth.currentUser.getIdToken() : '';
    } catch { authUid = ''; return ''; }
  }
  function statusUpdate() {
    document.dispatchEvent(new CustomEvent('biglwa:tiktok-status', {
      detail:{ connected, uid:authUid, profile:connected?{...profile}:{} }
    }));
  }
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function privateTikTokLog(message,title='TikTok'){
    const text=String(message||'').trim().slice(0,340);
    if(!text||!authUid)return;
    const detail={title,source:'TikTok',detail:text,notified:false};
    // Logs are scoped to the currently authenticated BIG LWA member.
    // This event never creates a public Feed post or a follower notification.
    if(window.BIGLWAActivity?.record)window.BIGLWAActivity.record(detail);
    else window.dispatchEvent(new CustomEvent('biglwa:studio-update',{detail}));
  }
  function notice(message) {
    lastError=String(message||'');
    statusUpdate();
    document.getElementById('tiktok-status')?.remove();
    privateTikTokLog(lastError,'TikTok connection');
  }

  function profileFromLink(raw){
    try{
      const u=new URL(String(raw||'').trim());
      if(u.protocol!=='https:'||u.port||!['tiktok.com','www.tiktok.com','m.tiktok.com'].includes(u.hostname))return '';
      const m=u.pathname.match(/^\/@([A-Za-z0-9._-]{1,80})\/?$/);
      return m?m[1]:'';
    }catch{return ''}
  }
  async function api(path, data) {
    const response = await fetch(API + '/tiktok/' + path, { method: data ? 'POST' : 'GET', headers: { 'Content-Type':'application/json', Authorization:'Bearer ' + getSession() }, ...(data ? {body:JSON.stringify(data)} : {}) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'TikTok Worker needs to be deployed or configured.');
    return body;
  }
  // TikTok's official oEmbed supplies public post metadata independently of
  // OAuth video.list. This is a user-initiated private import, never a scraper
  // or a claim that the post belongs to the connected account.
  async function publicVideo(url) {
    const token=await firebaseIdToken();
    if(!token||!authUid)throw Error('Sign in to BIG LWA to save a TikTok video.');
    // A manually pasted, strict TikTok URL is enough for a private draft:
    // the post and playback stay with TikTok. Never fetch CDN video bytes.
    let parsed,match;
    try{parsed=new URL(String(url||''))}catch{throw Error('Paste the full public TikTok post link.')}
    match=parsed.pathname.match(/^\/@([A-Za-z0-9._-]{1,80})\/video\/(\d{10,30})\/?$/);
    if(parsed.protocol!=='https:'||!['www.tiktok.com','tiktok.com','m.tiktok.com'].includes(parsed.hostname)||parsed.port||!match)
      throw Error('Use a full tiktok.com/@creator/video/123... link.');
    const fallback={id:match[2],share_url:'https://www.tiktok.com'+parsed.pathname.replace(/\/$/,''),
      title:'TikTok video · @'+match[1],author_name:match[1],embed_url:'https://www.tiktok.com/player/v1/'+match[2],
      metadataUnavailable:true};
    let response;
    try{
      response=await fetch(API+'/tiktok/oembed?url='+encodeURIComponent(fallback.share_url),{
        headers:{Authorization:'Bearer '+token},cache:'no-store'
      });
    }catch{return fallback}
    if(!response.ok){
      // A private link can still be kept as an unverified private bookmark,
      // but an explicit auth failure should never be masked by a fallback.
      if(response.status===401)throw Error('Sign in to BIG LWA before importing TikTok.');
      if(response.status===422)throw Error('TikTok rejected that video URL. Check the post and try again.');
      return fallback;
    }
    const data=await response.json().catch(()=>({}));
    return data?.id&&data?.share_url?data:fallback;
  }
  // Keep both TikTok import tools collapsed unless someone actively chooses them.
  // No independent modal, tall panel or extra onboarding banner on MyFeed.
  function ensureTikTokImportStyles(){
    if(document.getElementById('biglwa-tiktok-import-compact'))return;
    const style=document.createElement('style');
    style.id='biglwa-tiktok-import-compact';
    style.textContent=[
      '[data-tiktok-public-import]{min-width:0}',
      '[data-tiktok-public-import] .biglwa-tiktok-import-details{display:block;min-width:0}',
      '[data-tiktok-public-import] .biglwa-tiktok-import-details>summary{display:list-item;cursor:pointer;font:650 11px/1.3 system-ui;list-style-position:inside;color:#71364e;padding:3px 1px;user-select:none}',
      '[data-tiktok-public-import] .biglwa-tiktok-import-details:not([open]){max-height:28px;overflow:hidden}',
      '[data-tiktok-public-import] .biglwa-tiktok-import-fields{display:grid;gap:7px;margin-top:9px;min-width:0}',
      '[data-tiktok-public-import] .biglwa-tiktok-import-details:focus-visible>summary{outline:2px solid #a54d69;outline-offset:3px}'
    ].join('');
    document.head.append(style);
  }
  // Orbit cards show connection state only. The single optional importer lives in MyFeed.
  function renderTikTokLinkImporter(){
    document.querySelectorAll('#moduleWorkspace[data-module-key="orbit"] [data-tiktok-public-import]').forEach(node=>node.remove());
  }

  function renderTikTokFeedImporter(){
    const host=document.querySelector('#moduleWorkspace[data-module-key="feed"] .biglwa-feed-compose-card');
    if(!host||host.querySelector('[data-tiktok-public-import]'))return;
    const panel=document.createElement('section');
    panel.setAttribute('data-tiktok-public-import','');
    panel.setAttribute('aria-label','Import TikTok into myfeed');
    panel.style.cssText='display:grid;gap:6px;margin:8px 0;padding:9px 11px;border:1px solid #baa5c2;border-radius:10px;background:#f9efff;color:#362440';
    panel.innerHTML='<details class="biglwa-tiktok-import-details"><summary>Import from TikTok</summary><div class="biglwa-tiktok-import-fields">'+
     '<label for="tiktokFeedVideoLink">TikTok video or profile URL</label>'+
     '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px"><input id="tiktokFeedVideoLink" class="module-input" style="flex:1 1 215px;min-width:0" type="url" inputmode="url" placeholder="https://www.tiktok.com/@creator/video/..." data-tiktok-public-url>'+
     '<button class="module-action" type="button" data-tiktok-public-save>Save to myfeed drafts</button></div>'+
     '<small data-tiktok-public-message role="status" aria-live="polite"></small>'+
     '<details class="biglwa-tiktok-batch"><summary>Import multiple public links</summary><textarea class="module-input" data-tiktok-batch-links rows="2" maxlength="6000" placeholder="One public TikTok video URL per line (up to 20)"></textarea><button class="module-action secondary" type="button" data-tiktok-batch-save>Save private drafts</button><small data-tiktok-batch-status role="status"></small></details>'+
     '<div data-tiktok-public-preview hidden></div></div></details>';
    (host.querySelector('#biglwaFeedImportStatusRail')||host.querySelector('.biglwa-feed-compose-head'))?.after(panel);
  }

  async function connect() {
    try {
      if (!crypto.subtle) throw new Error('TikTok needs a secure page (https) to connect from this browser.');
      if (!await firebaseIdToken() || !authUid) throw new Error('Sign in to Big LWA before connecting TikTok.');
      lastError='';statusUpdate();
      const health = await api('health');
      if(!health.ok)throw Error('TikTok Worker setup is incomplete: '+(health.missing||[]).join(', '));
      const expected='https://api.biglwa.com/tiktok/callback';
      if(health.callback!==expected)throw Error('TikTok callback mismatch: '+(health.callback||'unknown')+'. Check the Login Kit Web redirect URI.');
      // A configured client key is not proof TikTok has approved the app.
      // An authorization-page "check client key" error may mean Login Kit
      // is not enabled for Web or its app is still in review.
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const verifier = Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('');
      sessionStorage.setItem('tt_verifier', verifier);
      sessionStorage.setItem(START_UID,authUid);
      sessionStorage.removeItem(PENDING_KEY);
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
      const challenge = btoa(String.fromCharCode(...digest)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
      location.assign(API + '/tiktok/start?challenge=' + encodeURIComponent(challenge) + '&return_to=' + encodeURIComponent(location.origin + '/studio?view=orbit'));
    } catch (e) { notice(e.message); }
  }
  async function syncTikTokDrafts(){
    if(videoPermissionPending||!videos.length)return;
    const expectedUid=authUid;
    const writer=(window.__biglwaOrbitPosts||await import('/orbit-posts.js?v=20261017-personal-first-import-3')).saveExternalOrbitDraft;
    if(typeof writer!=='function')throw Error('Feed importer unavailable. Retry TikTok sync.');
    let saved=0,failed=0,firstError='',alreadyPublished=0;
    for(let i=0;i<videos.length;i+=4){
      const results=await Promise.allSettled(videos.slice(i,i+4).map(v=>writer('tiktok',{
        id:v.id,sourcePostId:v.id,sourceUrl:v.share_url,expectedUid,
        caption:v.title||v.video_description||'TikTok video',
        cover_image_url:v.cover_image_url,
        sourceUsername:profile.username||(String(v.share_url||'').match(/\/@([^/]+)\/video\//)?.[1]||'')||profile.display_name||'',
        authorizedFromTikTokVideoList:true,
        mediaType:'VIDEO'
      },{publishToCollective:true})));
      saved+=results.filter(x=>x.status==='fulfilled'&&(x.value?.created||x.value?.published)).length;
      alreadyPublished+=results.filter(x=>x.status==='fulfilled'&&x.value?.state==='approved'&&!x.value?.created&&!x.value?.published).length;
      for(const result of results)if(result.status==='rejected'){failed++;firstError ||= result.reason?.message||'Save failed';}
    }
    lastCollectiveSync=(saved+alreadyPublished)+' authorized videos in Collective Feed'
      +(failed?' · '+failed+' failed to sync':'');
    if(saved||failed)notice(saved+' authorized TikTok video(s) published to Collective Feed.'+
      (failed?' '+failed+' could not be published: '+firstError+'. Retry sync.':''));
    document.dispatchEvent(new CustomEvent('biglwa:tiktok-collective-synced',{
      detail:{uid:expectedUid,newlyPublished:saved,alreadyPublished,failed}
    }));
  }

  async function restore() {
    if(restoreBusy)return;
    restoreBusy=true;
    try{
      const token=await firebaseIdToken();
      if(!token||!authUid){connected=false;profile={};videos=[];videoPermissionPending=false;videoLoadError='';render();statusUpdate();return;}
      if(!getSession()){
        const response=await fetch(API+'/tiktok/session/account',{headers:{Authorization:'Bearer '+token}});
        const result=await response.json().catch(()=>({}));
        if(response.ok&&result.connected&&result.session)save(result.session);
      }
      if(!getSession()){connected=false;profile={};videos=[];videoPermissionPending=false;videoLoadError='';render();statusUpdate();return;}
      profile=await api('profile');
      if(!profile?.open_id)throw new Error('TikTok profile authorization could not be verified.');
      const newlyConnected=!connected;
      connected=true;render();statusUpdate();
      if(newlyConnected)privateTikTokLog('TikTok account authenticated and connected to Orbit.','TikTok connection');
      try{
        const result=await api('videos');
        videos=Array.isArray(result.videos)?result.videos:[];
        videoPermissionPending=Boolean(result.videoPermissionPending);
        videoLoadError='';
        if(videoPermissionPending){
          videoLoadError='TikTok connected, but video.list permission is not granted. The saved SSSTik page only accepts individual video URLs and cannot enumerate your profile.';
          console.info(videoLoadError);
        }else await syncTikTokDrafts();
      }catch(e){
        videos=[];videoLoadError=String(e.message||'TikTok video list unavailable.');
        console.warn('TikTok optional video listing:',e.message);
      }
      render();statusUpdate();
      window.__biglwaConnections?.refreshSource?.('tiktok',authUid)?.catch?.(()=>{});
    }catch(e){connected=false;profile={};videos=[];videoPermissionPending=false;videoLoadError='';render();statusUpdate();notice(e.message);}
    finally{restoreBusy=false;}
  }
  async function disconnect() {
    try {
      if(getSession())await api('disconnect', {});
      save('');connected=false;profile={};videos=[];videoPermissionPending=false;videoLoadError='';render();statusUpdate();
      window.__biglwaConnections?.forget?.('tiktok')?.catch?.(()=>{});
      notice('TikTok disconnected from Orbit.');
    }catch(e){notice(e.message);}
  }
  function render() {
    renderFeedList();
    renderTikTokLinkImporter();
    renderTikTokFeedImporter();
    document.querySelectorAll('[data-orbit-app="tiktok"]').forEach(el => { el.classList.toggle('orbit-connected',connected); el.setAttribute('aria-label',connected?'Refresh TikTok':'Connect TikTok'); });
    document.querySelectorAll('[data-orbit-path="tiktok"]').forEach(input => {
      const actions = input.closest('.module-orbit-row')?.querySelector('.module-actions');
      if (!actions) return;
      let feedback=actions.querySelector('[data-tiktok-video-sync-status]');
      if(!feedback){feedback=document.createElement('small');feedback.dataset.tiktokVideoSyncStatus='1';
        feedback.style.cssText='display:block;flex-basis:100%;font:500 10px/1.3 system-ui;color:#735166;margin:3px 0 0';actions.append(feedback);}
      feedback.textContent=!connected?'':videoPermissionPending?
        'Videos not synced · TikTok video.list permission unavailable. SSSTik needs individual URLs.':
        (videoLoadError||lastCollectiveSync||(videos.length?'Preparing authorized videos for Collective Feed.':'No public TikTok videos returned by the authorized account.'));
      let area = actions.querySelector('[data-tt-actions]');
      if (!area) { area = document.createElement('span'); area.dataset.ttActions=''; actions.prepend(area); }
      area.innerHTML='<button type="button" class="module-action" data-tt-connect>' + (connected?'Refresh TikTok':'Connect TikTok') + '</button>' + (connected?'<button type="button" class="module-action" data-tt-disconnect>Disconnect</button>':'');
    });
  }
  function renderFeedList(list){
    list=list||document.getElementById('feedPageList');
    if(!list)return;
    const signature=[connected,videoPermissionPending,videoLoadError,videos.map(v=>v.id).join(',')].join('|');
    if(list.dataset.tiktokMediaSignature===signature&&(!connected||videoPermissionPending||!videos.length||list.querySelector('.tiktok-feed-item')))return;
    list.dataset.tiktokMediaSignature=signature;
    list.querySelectorAll('.tiktok-feed-item').forEach(el=>el.remove());
    // Permission diagnostics belong to Orbit, not a banner above every feed.
    // The public-URL importer works independently of video.list approval.
    if(!connected||videoPermissionPending||!videos.length)return;
    const cards=videos.map(v=>{
      let href='',cover='';
      try{
        const u=new URL(v.share_url||'');
        if(u.protocol==='https:'&&['www.tiktok.com','tiktok.com','m.tiktok.com'].includes(u.hostname))href=u.href;
      }catch{}
      try{const u=new URL(v.cover_image_url||'');if(u.protocol==='https:')cover=u.href}catch{}
      if(!href)return '';
      const title=esc(v.title||v.video_description||'TikTok video');
      const id=/^\d{10,30}$/.test(String(v.id||''))?String(v.id):'';
      const photo=cover?'<img loading="lazy" decoding="async" src="'+esc(cover)+'" alt="TikTok video cover" style="width:100%;height:auto;object-fit:contain">':'';
      const player=id?'<button type="button" class="module-action secondary" data-tiktok-play-video="'+id+'">▶ Play video here</button><div data-tiktok-player-host></div>':'';
      return '<article class="module-list-item tiktok-feed-item" data-tiktok-video="'+esc(v.id||'')+'"><div>'+photo+player+
        '<small>TikTok · '+esc(profile.display_name)+'</small><b>'+title+'</b>'+
        '<a class="module-action" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">Watch on TikTok ↗</a>'+
        '<button type="button" class="module-action secondary" data-tiktok-save-video="'+esc(href)+'" data-tiktok-video-title="'+title+'">Save private feed draft</button>'+
        '<small>Video stays on TikTok; posting to Collective Feed is a separate choice.</small></div></article>';
    }).filter(Boolean);
    list.insertAdjacentHTML('afterbegin',cards.join(''));
  }
  if(window.BIGLWAFeedMount)window.BIGLWAFeedMount('TikTok','tiktok-feed-item',renderFeedList);
  async function init() {
    const url=new URL(location.href),handoff=url.searchParams.get('tiktok_handoff')||CALLBACK_HANDOFF,error=url.searchParams.get('tiktok_error')||CALLBACK_ERROR;
    if(handoff)sessionStorage.setItem(PENDING_KEY,JSON.stringify({handoff,receivedAt:Date.now()}));
    if(handoff||error){
      url.searchParams.delete('tiktok_handoff');url.searchParams.delete('tiktok_error');
      history.replaceState(history.state,'',url.href);
    }
    if(error){
      const explanation=/client.?key|invalid.?client/i.test(error)
        ? 'TikTok rejected the app credentials on its authorization page. The Worker key exists; check that the TikTok app has Login Kit enabled for Web, production approval or a permitted test account, and the exact redirect URI.'
        : error;
      notice(explanation);
      console.warn('[Big LWA TikTok Login Kit]',error);
    }
    const pendingRaw=sessionStorage.getItem(PENDING_KEY)||'';
    if(pendingRaw){
      try{
        const pending=JSON.parse(pendingRaw);
        if(Date.now()-Number(pending.receivedAt||0)>600000)throw new Error('TikTok sign-in expired. Please reconnect.');
        const token=await firebaseIdToken();
        if(!token||!authUid)throw new Error('Sign in to Big LWA to finish linking TikTok.');
        const startedBy=sessionStorage.getItem(START_UID)||'';
        if(startedBy&&startedBy!==authUid)throw new Error('Finish TikTok authorization with the same Big LWA account.');
        const verifier=sessionStorage.getItem('tt_verifier')||'';
        if(!/^[a-f0-9]{64}$/.test(verifier))throw new Error('TikTok verification was lost. Start again from the same browser and domain.');
        const result=await api('session',{handoff:pending.handoff,verifier,firebaseIdToken:token});
        if(!result.session||!result.persisted)throw new Error('TikTok authorized but could not link to this Big LWA account.');
        save(result.session);
        const check=await fetch(API+'/tiktok/session/account',{headers:{Authorization:'Bearer '+token}});
        const verified=await check.json().catch(()=>({}));
        if(!check.ok||!verified.connected||verified.session!==result.session)
          throw new Error('TikTok connection is not recoverable on your Big LWA account yet.');
        sessionStorage.removeItem(PENDING_KEY);
        sessionStorage.removeItem('tt_verifier');
        sessionStorage.removeItem(START_UID);
      }catch(e){
        notice(e.message);
        // Keep the short-lived handoff for login restoration; the user can retry.
      }
    }
    render();await restore();
  }
  document.addEventListener('input',e=>{
    if(!e.target.matches?.('[data-tiktok-public-url]'))return;
    const panel=e.target.closest('[data-tiktok-public-import]');
    const status=panel?.querySelector('[data-tiktok-public-message]');
    const username=profileFromLink(e.target.value);
    if(status)status.textContent=username?'TikTok profile @'+username+' detected. Sync requires authorized video.list access.':'';
    const button=panel?.querySelector('[data-tiktok-public-save]');
    if(button)button.textContent=username?'Sync profile videos':'Save private video draft';
  });
  document.addEventListener('click',e=>{
    if (!(e.target instanceof Element)) return;
    const play=e.target.closest('[data-tiktok-play-video]');
    if(play){
      e.preventDefault();
      const id=play.dataset.tiktokPlayVideo,host=play.parentElement?.querySelector('[data-tiktok-player-host]');
      if(!host||!/^\d{10,30}$/.test(id||''))return;
      if(host.firstChild){host.replaceChildren();play.textContent='▶ Play video here';return}
      const frame=document.createElement('iframe');
      frame.title='TikTok video';frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';
      frame.allow='fullscreen; encrypted-media; picture-in-picture';
      frame.style.cssText='display:block;width:100%;height:480px;max-height:75vh;border:0;border-radius:12px';
      frame.src='https://www.tiktok.com/player/v1/'+id;
      host.append(frame);play.textContent='Close video';return;
    }
    const batch=e.target.closest('[data-tiktok-batch-save]');
    if(batch){
      e.preventDefault();e.stopImmediatePropagation();
      if(batch.disabled)return;
      const wrap=batch.closest('.biglwa-tiktok-batch');
      const input=wrap?.querySelector('[data-tiktok-batch-links]');
      const status=wrap?.querySelector('[data-tiktok-batch-status]');
      const links=[...new Set(String(input?.value||'').split(/[\s,]+/).map(s=>s.trim()).filter(Boolean))];
      if(!links.length||links.length>20){if(status)status.textContent='Choose 1–20 public video links.';return;}
      batch.disabled=true;
      (async()=>{
        const writer=window.__biglwaOrbitPosts?.saveExternalOrbitDraft ||
          (await import('/orbit-posts.js?v=20261017-personal-first-import-3')).saveExternalOrbitDraft;
        if(typeof writer!=='function')throw Error('Private drafts are unavailable.');
        let count=0,skipped=0;
        for(const link of links){
          try{
            const video=await publicVideo(link);
            if(!video?.id)throw Error('Invalid public video');
            const result=await writer('tiktok',{id:video.id,sourcePostId:video.id,
              sourceUrl:video.share_url,expectedUid:authUid,
              caption:video.title||'TikTok video',cover_image_url:video.cover_image_url,
              sourceUsername:video.author_name||'',embedUrl:video.embed_url,mediaType:'VIDEO'});
            if(result?.created)count++;else skipped++;
          }catch{skipped++}
        }
        if(status)status.textContent=count+' private video drafts saved'+(skipped?'; '+skipped+' skipped or already saved':'')+'. Review before publishing.';
        document.dispatchEvent(new CustomEvent('biglwa:tiktok-draft-ready',{detail:{source:'tiktok'}}));
      })().catch(err=>{if(status)status.textContent=err.message||'Import unavailable.'}).finally(()=>{batch.disabled=false;});
      return;
    }
    const publicSave=e.target.closest('[data-tiktok-public-save]');
    if(publicSave){
      e.preventDefault();e.stopImmediatePropagation();
      if(publicSave.disabled)return;
      const panel=publicSave.closest('[data-tiktok-public-import]');
      const input=panel?.querySelector('[data-tiktok-public-url]');
      const status=panel?.querySelector('[data-tiktok-public-message]');
      const preview=panel?.querySelector('[data-tiktok-public-preview]');
      const original=publicSave.textContent;
      publicSave.disabled=true;publicSave.textContent='Importing…';
      Promise.resolve().then(async()=>{
        const handle=profileFromLink(input?.value||'');
        if(handle){
          if(!connected)throw Error('Profile link detected. Connect TikTok in Orbit first.');
          // A connected member may attach their public creator URL without requiring
          // TikTok's optional profile/video scopes. When TikTok supplies the actual
          // @username, reject a mismatch; display_name is NOT the account handle.
          if(profile.username&&String(profile.username).replace(/^@/,'').toLowerCase()!==handle.toLowerCase())
            throw Error('Could not verify: username does not match your connected TikTok username.');
          const links=window.BigLWAOrbitAccountLinks;
          if(!links?.ready?.())throw Error('Orbit profile links are still loading. Try again.');
          await links.save('tiktok','https://www.tiktok.com/@'+handle);
          document.dispatchEvent(new CustomEvent('biglwa:tiktok-creator-link-saved',{detail:{handle}}));
          if(status)status.textContent='Profile linked.';
          privateTikTokLog('Public @'+handle+' linked to your profile.','TikTok profile');
          if(!videoPermissionPending){
            await restore().catch(()=>{});
            if(videos.length&&status)status.textContent+=' '+videos.length+' authorized videos are also ready as drafts.';
          }
          return;
        }
        const video=await publicVideo(String(input?.value||'').trim());
        const writer=window.__biglwaOrbitPosts?.saveExternalOrbitDraft ||
          (await import('/orbit-posts.js?v=20261017-personal-first-import-3')).saveExternalOrbitDraft;
        if(typeof writer!=='function')throw Error('Your private Orbit archive is not ready.');
        const saved=await writer('tiktok',{
          id:video.id,sourcePostId:video.id,sourceUrl:video.share_url,expectedUid:authUid,
          caption:video.title||'TikTok video',cover_image_url:video.cover_image_url,
          sourceUsername:video.author_name||'',embedUrl:video.embed_url,mediaType:'VIDEO'
        });
        if(status)status.textContent=saved.created
          ?(video.metadataUnavailable?'TikTok link saved privately. Preview it before publishing; TikTok details could not be verified.':'Saved in myfeed drafts. Choose when to post.')
          :'This video is already saved in your BIG LWA drafts.';
        if(panel?.closest('#moduleWorkspace[data-module-key="feed"]'))document.dispatchEvent(new CustomEvent('biglwa:tiktok-draft-ready',{detail:{source:'tiktok'}}));
        if(preview&&/^\d{10,30}$/.test(String(video.id||''))){
          const frame=document.createElement('iframe');
          frame.title='TikTok post preview';frame.loading='lazy';
          frame.referrerPolicy='strict-origin-when-cross-origin';
          frame.allow='fullscreen; encrypted-media; picture-in-picture';
          frame.style.cssText='display:block;width:min(100%,350px);height:600px;border:0;border-radius:12px';
          frame.src='https://www.tiktok.com/player/v1/'+video.id;
          preview.replaceChildren(frame);preview.hidden=false;
        }
      }).catch(error=>{if(status)status.textContent='Import failed. See Logs.';privateTikTokLog(error.message||'Import failed.','TikTok import')})
        .finally(()=>{publicSave.disabled=false;publicSave.textContent=profileFromLink(input?.value||'')?'Sync profile videos':original});
      return;
    }
    const draft=e.target.closest('[data-tiktok-save-video]');
    if(draft){
      e.preventDefault();e.stopImmediatePropagation();
      if(draft.disabled)return;
      draft.disabled=true;const previous=draft.textContent;
      draft.textContent='Saving…';
      Promise.resolve().then(async()=>{
        const save=window.__biglwaOrbitPosts?.saveExternalOrbitDraft;
        if(typeof save!=='function')throw Error('Orbit drafts are loading. Please try again.');
        const url=draft.dataset.tiktokSaveVideo;
        const video=videos.find(v=>v.share_url===url);
        if(!video)throw Error('Refresh your TikTok videos before saving this draft.');
        await save('tiktok',{
          id:video.id,sourcePostId:video.id,sourceUrl:url,
          caption:video.title||video.video_description||'TikTok video',
          cover_image_url:video.cover_image_url,
          sourceUsername:profile.display_name||profile.username||'',
          mediaType:'VIDEO'
        });
        draft.textContent='Saved as private draft';
      }).catch(e=>{draft.disabled=false;draft.textContent=previous;notice(e.message||'Could not save TikTok draft.')});
      return;
    }
    if(e.target.closest('[data-tt-disconnect]')) { e.preventDefault(); e.stopImmediatePropagation(); disconnect(); }
    else if(e.target.closest('[data-orbit-app="tiktok"],[data-tt-connect]')) { e.preventDefault(); e.stopImmediatePropagation(); connected?restore():connect(); }
    else if(e.target.closest('[data-open="orbit"],[data-open="feed"]')) setTimeout(render,100);
  },true);
  // Orbit is mounted after this script on some routes. Recreate the optional
  // importer after page mounts without leaving duplicate controls.
  document.addEventListener('biglwa:module-open',()=>setTimeout(()=>{renderTikTokLinkImporter();renderTikTokFeedImporter();renderFeedList();},70));
  document.addEventListener('biglwa:new-orbit-status',()=>setTimeout(()=>{renderTikTokLinkImporter();renderTikTokFeedImporter();},70));
  window.__biglwaTikTokOrbit={connect,restore,disconnect,render,publicVideo,renderTikTokFeedImporter,
    get state(){return {connected,uid:authUid,profile:connected?{...profile}:{},lastError,videoPermissionPending,videoLoadError,videoCount:videos.length}}};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
}());
