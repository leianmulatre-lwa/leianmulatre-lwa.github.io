/* Public TikTok creator profile, using TikTok's documented Creator Profile Embed.
 * Uses only an active BIG LWA owner's TikTok connection and a user-provided
 * or provider-reported public @handle. Never downloads or duplicates media.
 */
(()=>{
 'use strict';
 const q=(s,r=document)=>r?.querySelector(s),clean=s=>String(s||'').replace(/^@/,'').trim();
 const valid=s=>/^[a-zA-Z0-9._]{2,40}$/.test(s);
 let currentKey='',loadedFor='',bound=false;
 function activeAccount(){
  const uid=String(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid||'');
  const t=window.__biglwaTikTokOrbit?.state;
  return uid&&t?.connected&&t.uid===uid?{uid,profile:t.profile||{}}:null;
 }
 function creator(){
  const user=activeAccount();if(!user)return null;
  const oauthName=clean(user.profile.username);
  let saved='';
  try{const u=new URL(String(window.BigLWAOrbitAccountLinks?.get?.()?.tiktok||''));
   if(u.protocol==='https:'&&['www.tiktok.com','tiktok.com','m.tiktok.com'].includes(u.hostname)){
    saved=decodeURIComponent(u.pathname).match(/^\/@([a-zA-Z0-9._]{2,40})\/?$/)?.[1]||'';
   }
  }catch{}
  if(oauthName&&saved&&oauthName.toLowerCase()!==saved.toLowerCase())return null;
  const handle=oauthName||saved;
  if(!valid(handle))return null;
  return {handle,verified:!!oauthName,uid:user.uid};
 }
 function display(){
  // Creator browsing lives in myfeed, never on the banner.
  document.querySelectorAll('#studioApp .profile-card [data-biglwa-tiktok-creator]').forEach(node=>node.remove());
  const profile=q('#moduleWorkspace[data-module-key="feed"] .biglwa-feed-compose-card')||
    q('#moduleWorkspace[data-module-key="feed"] .module-shell');
  if(!profile){currentKey='';return}
  const data=creator(),prior=q('[data-biglwa-tiktok-creator]',profile);
  if(!data){prior?.remove();currentKey='';return}
  const key=data.uid+':'+data.handle.toLowerCase();
  if(prior&&currentKey===key)return;
  prior?.remove();currentKey=key;
  const wrap=document.createElement('details');wrap.dataset.biglwaTiktokCreator='1';
  wrap.className='biglwa-tiktok-creator';
  wrap.style.cssText='border:1px solid #e5cdca;padding:9px 11px;border-radius:10px;margin:8px 0;min-width:0';
  const summary=document.createElement('summary');summary.textContent='My TikTok · @'+data.handle+' · public profile & videos';
  summary.style.cssText='cursor:pointer;color:#6e2d47;font:700 11px/1.5 system-ui;list-style-position:inside';
  const container=document.createElement('div');container.className='biglwa-tiktok-creator-content';
  container.style.cssText='max-width:100%;min-width:0;overflow:hidden;padding:6px 1px 3px';
  const info=document.createElement('p');
  info.style.cssText='margin:3px 0;font:500 10px/1.4 system-ui;color:#735b64';
  info.textContent=data.verified?'Matched to TikTok-reported @username · public videos provided by TikTok':
    'Linked by account owner · public TikTok embed (not a verified OAuth handle)';
  const anchor=document.createElement('a');anchor.href='https://www.tiktok.com/@'+encodeURIComponent(data.handle);
  anchor.target='_blank';anchor.rel='noopener noreferrer';anchor.textContent='Open original TikTok profile ↗';
  anchor.style.cssText='display:inline-block;margin:3px 0 8px;font:650 11px system-ui;color:#76364b';
  const embed=document.createElement('div');embed.dataset.biglwaTiktokFrame='1';
  container.append(info,anchor,embed);wrap.append(summary,container);profile.append(wrap);
  wrap.addEventListener('toggle',()=>{
   if(!wrap.open||embed.firstChild||!creator()||creator().handle.toLowerCase()!==data.handle.toLowerCase())return;
   const url='https://www.tiktok.com/@'+data.handle;
   const block=document.createElement('blockquote');block.className='tiktok-embed';block.cite=url;
   block.dataset.uniqueId=data.handle;block.dataset.embedType='creator';
   block.style.cssText='min-width:0!important;max-width:100%!important;margin:0 auto;min-height:140px';
   const section=document.createElement('section'),a=document.createElement('a');
   a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='@'+data.handle;
   section.append(a);block.append(section);embed.append(block);
   // TikTok's script transforms the official blockquote into its interactive
   // creator player. Re-execute only when a new user actively opens it.
   if(loadedFor!==key){
    const script=document.createElement('script');script.async=true;
    script.src='https://www.tiktok.com/embed.js';script.referrerPolicy='no-referrer';
    script.onerror=()=>{info.textContent='TikTok preview is unavailable here. Open the original profile instead.'};
    embed.append(script);loadedFor=key;
   }
  });
 }
 let pending=false;
 function refresh(){
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{pending=false;display()});
 }
 for(const event of ['biglwa:tiktok-status','biglwa:orbit-links-synced','biglwa:identity-updated',
                      'biglwa:tiktok-creator-link-saved','biglwa:profile-metrics','biglwa:session-verified']){
   (event==='biglwa:tiktok-status'?document:window).addEventListener(event,refresh);
 }
 document.addEventListener('biglwa:tiktok-status',refresh);
 document.addEventListener('biglwa:module-open',refresh);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();
