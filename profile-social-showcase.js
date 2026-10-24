/* BIG LWA: connected Snapchat Spotlight and Instagram Highlight showcase.
 * User-selected public links only. No scraping, hidden downloads or reposts.
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
 const accountHandles=()=>{
  const snap=window.BigLWAOrbitOAuth?.get?.('snapchat');
  let snapchat=String(snap?.username||'').replace(/^@/,'').trim();
  if(!validHandle(snapchat)){
   try{const link=new URL(window.BigLWAOrbitAccountLinks?.get?.()?.snapchat||'');
    if(link.hostname==='www.snapchat.com'||link.hostname==='snapchat.com'){
     snapchat=link.pathname.match(/^\/add\/([a-zA-Z0-9._]{2,40})\/?$/)?.[1]||'';
    }
   }catch{}
  }
  const ig=window.__biglwaConnections?.connections?.()?.instagram;
  const instagram=String(ig?.username||window.__biglwaInstagramOrbit?.state?.profile?.username||'').replace(/^@/,'').trim();
  return {snapchat:active('snapchat')&&validHandle(snapchat)?snapchat:'',
   instagram:active('instagram')&&validHandle(instagram)?instagram:''};
 };
 let snapSource={key:'',status:'',items:[],message:''},signature='';
 function refreshPublicSnapchat(handle,who){
  const next=who+':'+handle.toLowerCase();
  if(snapSource.key===next)return;
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
    snapSource={key:next,status:items.length?'ready':'empty',items,
     message:items.length?'Public @'+handle+' matched · '+items.length+' Spotlight preview(s)':
     'No public Spotlight media available for @'+handle};
    schedule();
   }).catch(e=>{
    if(snapSource.key!==next)return;
    snapSource={key:next,status:'error',items:[],message:'Snapchat public lookup unavailable; original profile remains accessible.'};
    schedule();
   });
 }
 function show(){
  const root=document.querySelector('#studioApp .profile-card');
  const who=uid(),entries=saved(),handles=accountHandles();
  if(handles.snapchat)refreshPublicSnapchat(handles.snapchat,who);
  else if(snapSource.key)snapSource={key:'',status:'',items:[],message:''};
  const snapItems=handles.snapchat&&snapSource.key===who+':'+handles.snapchat.toLowerCase()?snapSource.items:[];
  if(!root||!who||(!active('snapchat')&&!active('instagram'))){root?.querySelector('[data-biglwa-public-showcase]')?.remove();signature='';return}
  const tag=who+'|'+entries.map(x=>x.url).join('|')+'|'+handles.snapchat+'|'+handles.instagram+'|'+snapSource.status+'|'+snapItems.length;
  if(signature===tag&&root.querySelector('[data-biglwa-public-showcase]'))return;
  signature=tag;
  root.querySelector('[data-biglwa-public-showcase]')?.remove();
  const section=document.createElement('details');section.dataset.biglwaPublicShowcase='1';
  section.style.cssText='margin:8px 0 0;padding:6px 0 0;border-top:1px solid #dfcfce;min-width:0';
  const title=document.createElement('summary');title.textContent='Spotlight & Highlights · '+(entries.length+snapItems.length);
  title.style.cssText='cursor:pointer;font:700 11px/1.5 system-ui;color:#762e4b';
  section.append(title);
  const discovery=document.createElement('div');
  discovery.style.cssText='padding:5px 0 8px;font:500 10px/1.55 system-ui;color:#705364;display:grid;gap:5px';
  if(active('snapchat')){
   const a=document.createElement('a');a.target='_blank';a.rel='noopener noreferrer';
   a.href=handles.snapchat?'https://story.snapchat.com/add/@'+encodeURIComponent(handles.snapchat):'https://www.snapchat.com';
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
   a.href='https://igexport.com/en/instagram-highlights-viewer/';
   a.target='_blank';a.rel='noopener noreferrer';
   a.textContent=handles.instagram?'Instagram Highlights · @'+handles.instagram+' · public viewer ↗':
    'Instagram Highlights · provider has not returned a public @username';
   discovery.append(a);
   const note=document.createElement('small');
   note.textContent='Instagram viewer is external; no automatic Highlight import API verified.';
   discovery.append(note);
  }
  section.append(discovery);
  const form=document.createElement('form');form.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin:9px 0';
  const input=document.createElement('input');input.type='url';input.placeholder='Snapchat Spotlight or Instagram Highlight URL';
  input.setAttribute('aria-label','Public Spotlight or Highlight URL');input.required=true;input.maxLength=500;
  input.style.cssText='box-sizing:border-box;flex:1 1 180px;min-width:0;border:1px solid #c7a7b0;border-radius:7px;padding:8px;background:#fffaf7;color:#3b2734;font:11px system-ui';
  const button=document.createElement('button');button.type='submit';button.textContent='Add link';
  button.style.cssText='padding:6px 9px;border:1px solid #8c6072;background:#8a4261;color:white;border-radius:7px;font:700 11px system-ui;cursor:pointer';
  const notice=document.createElement('small');notice.role='status';notice.style.cssText='display:block;flex-basis:100%;font:500 10px system-ui;color:#714759';
  form.append(input,button,notice);section.append(form);
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
    a.href='https://story.snapchat.com/add/@'+encodeURIComponent(handles.snapchat);
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
  const foot=document.createElement('small');foot.textContent='Public links saved to this browser for your BIG LWA account. Original media stays on its platform.';
  foot.style.cssText='display:block;font:500 9px/1.4 system-ui;color:#766369;margin-top:7px';section.append(foot);
  root.append(section);
 }
 function render(){
  const open=document.querySelector('#studioApp .profile-card [data-biglwa-public-showcase]')?.open;
  signature='';show();
  if(open){const section=document.querySelector('#studioApp .profile-card [data-biglwa-public-showcase]');if(section)section.open=true}
 }
 let timer;function schedule(){clearTimeout(timer);timer=setTimeout(show,90)}
 for(const event of ['biglwa:new-orbit-status','biglwa:identity-updated','biglwa:session-verified','biglwa:orbit-links-synced'])
  (event==='biglwa:new-orbit-status'?document:window).addEventListener(event,schedule);
 document.addEventListener('biglwa:new-orbit-status',schedule);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
