
(function () {
  'use strict';
  if (window.__biglwaTikTokOrbit) return;
  const API = 'https://biglwa-instagram-api.leianmulatre-284.workers.dev';
  const KEY = 'biglwaTikTokSession';
  let connected = false, profile = {}, videos = [];
  const getSession = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
  const save = value => { if (value) localStorage.setItem(KEY, value); else localStorage.removeItem(KEY); };
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function notice(message) {
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
      const health = await api('health');
      if (!health.ok) throw new Error('TikTok setup is incomplete.');
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const verifier = Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('');
      sessionStorage.setItem('tt_verifier', verifier);
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
      const challenge = btoa(String.fromCharCode(...digest)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
      location.assign(API + '/tiktok/start?challenge=' + encodeURIComponent(challenge));
    } catch (e) { notice(e.message); }
  }
  async function restore() {
    if (!getSession()) return;
    try {
      profile = await api('profile'); connected = true;
      try { videos = (await api('videos')).videos || []; } catch (e) { notice(e.message); }
      render();
    } catch (e) { connected = false; render(); notice(e.message); }
  }
  async function disconnect() {
    try { await api('disconnect', {}); save(''); connected=false; profile={}; videos=[]; render(); notice('TikTok disconnected from Orbit.'); }
    catch(e) { notice(e.message); }
  }
  function render() {
    document.querySelectorAll('[data-orbit-app="tiktok"]').forEach(el => { el.classList.toggle('orbit-connected',connected); el.setAttribute('aria-label',connected?'Refresh TikTok':'Connect TikTok'); });
    document.querySelectorAll('[data-orbit-path="tiktok"]').forEach(input => {
      const actions = input.closest('.module-orbit-row')?.querySelector('.module-actions');
      if (!actions) return;
      let area = actions.querySelector('[data-tt-actions]');
      if (!area) { area = document.createElement('span'); area.dataset.ttActions=''; actions.prepend(area); }
      area.innerHTML='<button type="button" class="module-action" data-tt-connect>' + (connected?'Refresh TikTok':'Connect TikTok') + '</button>' + (connected?'<button type="button" class="module-action" data-tt-disconnect>Disconnect</button>':'');
    });
    const list = document.getElementById('feedPageList');
    if (!list) return;
    list.querySelectorAll('.tiktok-feed-item').forEach(el=>el.remove());
    if (!connected) return;
    const cards = videos.map(v => {
      let href=''; try { const u=new URL(v.share_url); if(u.protocol==='https:' && (u.hostname==='www.tiktok.com'||u.hostname==='tiktok.com')) href=u.href; } catch {}
      let cover=''; try { const u=new URL(v.cover_image_url); if(u.protocol==='https:') cover=u.href; } catch {}
      return '<article class="module-list-item tiktok-feed-item"><div><small>TikTok · '+esc(profile.display_name)+'</small><b>'+esc(v.title||v.video_description||'TikTok video')+'</b>'+(cover?'<img loading="lazy" style="max-width:100%;max-height:460px;object-fit:contain" src="'+esc(cover)+'" alt="">':'')+(href?'<a class="module-action" target="_blank" rel="noopener noreferrer" href="'+esc(href)+'">Watch on TikTok</a>':'')+'</div></article>';
    });
    list.insertAdjacentHTML('afterbegin',cards.join('')||'<article class="module-list-item tiktok-feed-item">TikTok connected. No videos to display.</article>');
  }
  async function init() {
    const url = new URL(location.href), handoff=url.searchParams.get('tiktok_handoff'), error=url.searchParams.get('tiktok_error');
    if (handoff||error) { url.searchParams.delete('tiktok_handoff'); url.searchParams.delete('tiktok_error'); history.replaceState(history.state,'',url.href); }
    if(error) notice(error);
    if(handoff) {
      try { const result=await api('session',{handoff,verifier:sessionStorage.getItem('tt_verifier')||''}); save(result.session); sessionStorage.removeItem('tt_verifier'); }
      catch(e) { notice(e.message); return; }
    }
    render(); await restore();
  }
  document.addEventListener('click',e=>{
    if (!(e.target instanceof Element)) return;
    if(e.target.closest('[data-tt-disconnect]')) { e.preventDefault(); e.stopImmediatePropagation(); disconnect(); }
    else if(e.target.closest('[data-orbit-app="tiktok"],[data-tt-connect]')) { e.preventDefault(); e.stopImmediatePropagation(); connected?restore():connect(); }
    else if(e.target.closest('[data-open="orbit"],[data-open="feed"]')) setTimeout(render,100);
  },true);
  window.__biglwaTikTokOrbit={connect,restore,disconnect,render};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
}());
