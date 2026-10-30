/* Profile presentation, account media repair and per-widget preview audiences. */
(()=>{'use strict';
const BASE='https://biglwa-instagram-api.leianmulatre-284.workers.dev/media/profile-state';
let authPromise,mediaOwner='',audience={},syncing=false,publicProfile=null;
const $=(s,r=document)=>r?.querySelector(s);
const visitor=()=>document.documentElement.classList.contains('biglwa-preview-mode');
async function auth(){if(!authPromise)authPromise=Promise.all([import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')]).then(([a,f])=>f.getAuth(a.getApps()[0])).catch(e=>{authPromise=null;throw e});const a=await authPromise;await a.authStateReady();return a.currentUser}
async function request(values){const member=await auth();if(!member)throw Error('Sign in to save profile visibility.');const response=await fetch(BASE,{method:values?'POST':'GET',headers:{Authorization:'Bearer '+await member.getIdToken(),...(values?{'Content-Type':'application/json'}:{})},...(values?{body:JSON.stringify(values)}:{})});const data=await response.json();if(!response.ok)throw Error(data.error||'Profile could not be saved.');if((await auth())?.uid!==member.uid)throw Error('Account changed. Try again.');return data}
function moveHeader(){const top=$('#studioApp .topbar'),search=$('.search-wrap',top),weather=$('#studioWeather',top),actions=$('.top-actions',top),loading=$('#lwaProfileLoading',top);if(!top||!search)return;if(loading&&loading.parentElement!==top){search.after(loading)}if(weather&&actions&&weather.nextElementSibling!==actions)actions.before(weather);top.classList.add('profile-header-repaired')}
function profileGeometry(){const card=$('#studioApp .profile-card');if(!card||card.classList.contains('profile-is-editing'))return;const rank=$('.real-rank',card),rail=$('.profile-identity-rail',card);if(!rank||!rail)return;let label=$(':scope > .real-rank-label',rail);if(!label){label=document.createElement('span');label.className='real-rank-label';label.textContent='Real Rank';rail.append(label)}const eyebrow=$('.real-rank-label,.rank-label',rank)||[...rank.children].find(el=>/^real rank$/i.test(el.textContent.trim()));if(eyebrow&&eyebrow!==label)eyebrow.classList.add('rank-duplicate-label');rank.classList.add('rank-under-note');const fill=$('.rank-track>i:not(.rank-marker)',rank);if(fill?.style.width)rank.style.setProperty('--rank-progress',fill.style.width);if(!rank.querySelector('.rank-marker')){const track=$('.rank-track',rank);if(track){const marker=document.createElement('i');marker.className='rank-marker';marker.setAttribute('aria-hidden','true');track.append(marker)}}}
function photoPaint(url,position){if(!url)return;for(const el of document.querySelectorAll('#studioApp .mini-avatar,#studioApp .profile-avatar')){el.style.backgroundImage='url("'+url.replaceAll('"','')+'")';el.style.backgroundSize='cover';el.style.backgroundPosition=(position?.x??50)+'% '+(position?.y??50)+'%';el.classList.add('has-photo');el.classList.remove('lwa-default-tv-avatar');el.textContent=''}}
async function restoreMedia(){if(syncing||visitor())return;syncing=true;try{const me=await auth();if(!me)return;const saved=await request();mediaOwner=me.uid;audience=saved.widgetAudience||{};let photo=saved.profilePhotoUrl;
 // Repair a previously selected, cloud-backed photo without picking a random upload.
 const selected=window.__biglwaIdentity?.avatarUrl||(/url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle($('#studioApp .profile-avatar')||document.body).backgroundImage)?.[1]||'');
 if(!Object.hasOwn(saved,'profilePhotoUrl')&&selected.includes('/media/profile-photo/'+me.uid+'/')){const recovered=await request({profilePhotoUrl:selected});photo=recovered.profilePhotoUrl}
 if(!visitor()){if(photo)photoPaint(photo,saved.profilePhotoPosition);if(saved.wallpaperMedia?.url)window.BIGLWAStudioAppearance?.apply?.({media:saved.wallpaperMedia});paintLocks()}
}catch(error){console.warn('[BIGLWA] Account media repair:',error.message)}finally{syncing=false}}
function previewFaces(profile){if(!visitor()||!profile)return;publicProfile=profile;const grid=$('#studioApp .masonry');if(!grid)return;const personalized=new Set(['boards','orbit','diary','archive','projects','library','closet','trophies','notes','calendar','map','camera','stream']);
 for(const card of grid.querySelectorAll(':scope > .card,:scope > article,:scope > [data-widget-id]')){
  const key=String(card.dataset.widgetId||card.id||'');if(!key)continue;
  card.dataset.biglwaPublicVisible='1';card.classList.add('public-widget-face');
  const access=profile.widgetAudience?.[key]||'everyone';card.dataset.widgetAudience=access;
  const restricted=access==='private'||(access==='members'&&!document.documentElement.classList.contains('biglwa-profile-viewer-member'));
  card.classList.toggle('public-widget-locked',restricted);
  if((personalized.has(key)&&card.dataset.publicFaceSanitized!=='1')||restricted){
   const head=$('.card-head',card);if(!head)continue;
   if(!['boards','orbit','diary'].includes(key)||restricted){
    for(const child of [...card.children]){if(child===head||child.matches('.widget-window-controls,[data-studio-drag-handle]'))continue;child.hidden=true;child.dataset.privatePreviewHidden='1'}
    let face=$('.public-widget-safe-face',card);if(!face){face=document.createElement('div');face.className='public-widget-safe-face';card.append(face)}face.hidden=false;
    face.textContent=restricted?'🔒 '+(access==='members'?'Members only':'Private widget'):({notes:'Sqwidz · thoughts, stories & conversations',calendar:'Calendar',projects:'Visualeyez · Visualslidez',archive:'Archive',library:'Library',closet:'Closet',trophies:'Achievements',map:'Shared places'}[key]||'Read-only preview');
   }
   if(key==='camera'&&!restricted){const face=$('.public-widget-safe-face',card);if(face){face.textContent='';const image=document.createElement('img');image.className='public-booth-image';image.src='/assets/booth-light-20261029.webp';image.alt='Booth curtains';face.append(image)}}
   card.dataset.publicFaceSanitized='1';
  }
 }
}
function paintLocks(){
 if(visitor())return;
 document.querySelectorAll('.sidebar-navigation-row .widget-audience-lock').forEach(button=>button.remove());
 const list=$('#biglwaSkeletonSymbols');if(!list)return;
 const rows=document.querySelectorAll('#studioApp .sidebar-navigation-row[data-sidebar-route-row]');
 for(const row of rows){
  const key=row.dataset.sidebarRouteRow;if(!key||key==='home')continue;
  let item=list.querySelector('[data-widget-audience-key="'+CSS.escape(key)+'"]');
  if(!item){
   // Keep control of every widget, including those not in the short symbol guide.
   item=document.createElement('li');item.className='tour-symbol-item';item.dataset.widgetAudienceKey=key;
   const mark=document.createElement('span');mark.className='tour-symbol-mark';mark.setAttribute('aria-hidden','true');
   const icon=row.querySelector('.sidebar-route-icon')?.cloneNode(true);
   if(icon){icon.removeAttribute('id');mark.append(icon)}else mark.textContent='◈';
   const info=document.createElement('span');info.className='tour-symbol-description';
   const label=document.createElement('strong');label.textContent=row.querySelector('.sidebar-route-label')?.textContent||key;
   const help=document.createElement('small');help.textContent='Widget visibility';info.append(label,help);
   item.append(mark,info);list.append(item);
  }
  let button=item.querySelector('.widget-audience-lock');
  if(!button){
   button=document.createElement('button');button.type='button';button.dataset.widgetAudience=key;
   button.className='widget-audience-lock';button.onclick=e=>{e.stopPropagation();openAudience(key)};
   item.append(button);
  }
  const level=audience[key]||'everyone';
  button.textContent=level==='everyone'?'🔓':'🔒';
  button.title={everyone:'Everyone can see the preview',members:'Members only',private:'Only you'}[level];
  button.setAttribute('aria-label','Who can see '+key+' widget: '+level);
 }
}
function openAudience(key){let dialog=$('#widgetAudienceDialog');if(dialog)dialog.remove();dialog=document.createElement('dialog');dialog.id='widgetAudienceDialog';const name=document.querySelector('[data-sidebar-route-row="'+CSS.escape(key)+'"] .sidebar-route-label')?.textContent||key;const title=document.createElement('h2');title.textContent=name+' · visibility';const help=document.createElement('p');help.textContent='Choose who sees this widget preview. Private drafts and editing tools remain protected.';const select=document.createElement('select');select.setAttribute('aria-label','Widget audience');for(const [value,label]of [['everyone','Everyone'],['members','Signed-in members'],['private','Only me']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option)}select.value=audience[key]||'everyone';const save=document.createElement('button');save.textContent='Save';const close=document.createElement('button');close.textContent='Close';close.onclick=()=>dialog.close();const status=document.createElement('p');status.setAttribute('role','status');save.onclick=async()=>{save.disabled=true;try{const next={...audience,[key]:select.value},result=await request({widgetAudience:next});audience=result.widgetAudience;paintLocks();status.textContent='Saved to your account.'}catch(e){status.textContent=e.message}finally{save.disabled=false}};dialog.append(title,help,select,save,close,status);document.body.append(dialog);dialog.showModal()}
function run(){moveHeader();profileGeometry();paintLocks();if(visitor())previewFaces(publicProfile||window.__biglwaViewedProfile)}
window.BigLWAProfileRepair={restoreMedia,request,previewFaces,paintLocks};
window.addEventListener('biglwa:public-profile-ended',()=>{publicProfile=null;for(const el of document.querySelectorAll('[data-private-preview-hidden]')){delete el.dataset.privatePreviewHidden;el.hidden=false}document.querySelectorAll('.public-widget-safe-face').forEach(el=>el.remove());document.querySelectorAll('.public-widget-face').forEach(el=>{el.classList.remove('public-widget-face','public-widget-locked');delete el.dataset.publicFaceSanitized})});
window.addEventListener('biglwa:public-mirror-ready',e=>{previewFaces(e.detail?.profile);run()});
window.addEventListener('biglwa:identity-updated',()=>{restoreMedia();run()});
window.addEventListener('biglwa:user-directory-ready',restoreMedia);window.addEventListener('biglwa:profile-metrics',profileGeometry);
document.addEventListener('biglwa:widget-symbols-ready',paintLocks);
document.addEventListener('biglwa:module-close',run);document.addEventListener('biglwa:module-open',run);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
import('/account-identity.js').then(m=>m.onIdentityChange(()=>{run();restoreMedia()})).catch(()=>{});
auth().then(member=>document.documentElement.classList.toggle('biglwa-profile-viewer-member',!!member)).catch(()=>{});
for(const delay of [500,1500,4000,9000])setTimeout(()=>{run();restoreMedia()},delay);
})();
