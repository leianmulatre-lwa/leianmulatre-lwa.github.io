
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
  let lastError='',videoPermissionPending=false,videoLoadError='';
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
  function notice(message) {
    lastError=String(message||'');statusUpdate();
    let el = document.getElementById('tiktok-status');
    if (!el) { el = document.createElement('div'); el.id = 'tiktok-status'; el.setAttribute('role','status'); el.style.cssText='position:fixed;bottom:20px;right:20px;z-index:15000;max-width:360px;background:#fff5eb;color:#292322;padding:16px;border-radius:12px;box-shadow:0 5px 24px #0003'; document.body.appendChild(el); }
    el.textContent = message; clearTimeout(notice.timer); notice.timer = setTimeout(() => el.remove(), 12000);
  }
  async function api(path, data) {
    const response = await fetch(API + '/tiktok/' + path, { method: data ? 'POST' : 'GET', headers: { 'Content-Type':'application/json', Authorization:'Bearer ' + getSession() }, ...(data ? {body:JSON.stringify(data)} : {}) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'TikTok Worker needs to be deployed or configured.');
    return body;
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
    let saved=0,failed=0,firstError='';
    for(let i=0;i<videos.length;i+=4){
      const results=await Promise.allSettled(videos.slice(i,i+4).map(v=>writer('tiktok',{
        id:v.id,sourcePostId:v.id,sourceUrl:v.share_url,expectedUid,
        caption:v.title||v.video_description||'TikTok video',
        cover_image_url:v.cover_image_url,
        sourceUsername:profile.display_name||profile.username||'',
        mediaType:'VIDEO'
      },{publishToCollective:true})));
      saved+=results.filter(x=>x.status==='fulfilled'&&(x.value?.created||x.value?.published)).length;
      for(const result of results)if(result.status==='rejected'){failed++;firstError ||= result.reason?.message||'Save failed';}
    }
    notice(saved+' TikTok video(s) added to Collective Feed.'+(failed?' '+failed+' failed: '+firstError+'. Reconnect or retry sync.':''));
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
      connected=true;render();statusUpdate();
      try{
        const result=await api('videos');
        videos=Array.isArray(result.videos)?result.videos:[];
        videoPermissionPending=Boolean(result.videoPermissionPending);
        videoLoadError='';
        if(videoPermissionPending)console.info('TikTok connected. Display API video.list permission is required to show videos.');
        else await syncTikTokDrafts();
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
    document.querySelectorAll('[data-orbit-app="tiktok"]').forEach(el => { el.classList.toggle('orbit-connected',connected); el.setAttribute('aria-label',connected?'Refresh TikTok':'Connect TikTok'); });
    document.querySelectorAll('[data-orbit-path="tiktok"]').forEach(input => {
      const actions = input.closest('.module-orbit-row')?.querySelector('.module-actions');
      if (!actions) return;
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
    const rail=document.getElementById('biglwaFeedImportStatusRail');
    let info=rail&&rail.querySelector('[data-tiktok-video-status]');
    if(rail&&!info){
      info=document.createElement('p');
      info.setAttribute('data-tiktok-video-status','');
      info.setAttribute('role','status');
      rail.append(info);
    }
    if(info){
      const message=!connected?'':videoPermissionPending
        ? 'TikTok connected, but the Display API video.list permission is not approved or granted. Videos cannot be imported until TikTok approves it and you reconnect.'
        : videoLoadError?'TikTok videos: '+videoLoadError
        : videos.length?videos.length+' TikTok video preview'+(videos.length===1?'':'s')+' available. Choose which to save as a private draft.'
        : 'TikTok connected. No public videos were returned by the authorized API.';
      if(info.textContent!==message)info.textContent=message;
      if(info.hidden===connected)info.hidden=!connected;
      const shouldHide=!Array.from(rail.children).some(el=>!el.hidden);
      if(rail.hidden!==shouldHide)rail.hidden=shouldHide;
    }
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
      const photo=cover?'<img loading="lazy" decoding="async" src="'+esc(cover)+'" alt="TikTok video cover" style="width:100%;height:auto;object-fit:contain">':'';
      return '<article class="module-list-item tiktok-feed-item" data-tiktok-video="'+esc(v.id||'')+'"><div>'+photo+
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
  document.addEventListener('click',e=>{
    if (!(e.target instanceof Element)) return;
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
  window.__biglwaTikTokOrbit={connect,restore,disconnect,render,get state(){return {connected,uid:authUid,profile:connected?{...profile}:{},lastError,videoPermissionPending,videoLoadError,videoCount:videos.length}}};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
}());
