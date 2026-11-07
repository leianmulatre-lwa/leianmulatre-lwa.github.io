/* BIG LWA L’wazi · SoundCloud discovery and linked Tunes
 * SoundCloud's authenticated Search API requires developer credentials. This adapter
 * uses only SoundCloud's own search page and its public oEmbed endpoint.
 * No track data is scraped, audio is not downloaded or copied, and saved links
 * are account-keyed browser bookmarks (not cloud-backed profile uploads).
 */
(function(){
'use strict';
if(window.BigLWAMusicDiscovery)return;
const KEY='biglwaExternalTunesV1:';
const $=(q,r=document)=>r.querySelector(q);
const text=v=>String(v==null?'':v).trim();
const enc=v=>text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function memberId(){
 const uid=text(window.__biglwaIdentity?.uid||window.BigLWAAccountStorage?.uid);
 return /^[a-zA-Z0-9:_-]{5,145}$/.test(uid)?uid:'';
}
function validateUrl(raw){
 try{
  const u=new URL(text(raw));
  if(u.protocol!=='https:')return '';
  if(!['soundcloud.com','www.soundcloud.com','m.soundcloud.com'].includes(u.hostname.toLowerCase()))return '';
  if(u.username||u.password)return '';
  if(u.pathname.split('/').filter(Boolean).length<2)return '';
  // Never persist campaign tracking or private secret tokens in public bookmarks.
  return 'https://soundcloud.com'+u.pathname.replace(/\/+$/,'');
 }catch{return ''}
}
const searchUrl=q=>'https://soundcloud.com/search/sounds?q='+encodeURIComponent(text(q).slice(0,160));
function getSaved(){
 const uid=memberId();if(!uid)return [];
 try{
  const data=JSON.parse(localStorage.getItem(KEY+uid)||'[]');
  return Array.isArray(data)?data.filter(x=>validateUrl(x?.url)).slice(0,80):[];
 }catch{return []}
}
function setSaved(rows){
 const uid=memberId();if(!uid)throw Error('Sign in to save track links to Tunes.');
 try{localStorage.setItem(KEY+uid,JSON.stringify(rows.slice(-80)));return true}
 catch{throw Error('Browser storage is unavailable; this track was not saved.')}
}
function saveTrack(row){
 const url=validateUrl(row?.url);if(!url)throw Error('Paste a public SoundCloud track URL.');
 if(!memberId())throw Error('Sign in to BIG LWA to save this link to Tunes.');
 const old=getSaved();
 if(old.some(x=>x.url===url))return {saved:false,message:'Already saved in Tunes on this browser.'};
 const record={url,title:text(row?.title).slice(0,140)||url.split('/').pop()?.replace(/-/g,' ')||'SoundCloud track',artist:text(row?.artist).slice(0,100),art:text(row?.art).slice(0,350),provider:'soundcloud',savedAt:new Date().toISOString()};
 setSaved([...old,record]);
 window.dispatchEvent(new CustomEvent('biglwa:tunes-links-changed'));
 return {saved:true,message:'Added to Tunes on this browser. It is a link, not an uploaded audio file.'};
}
function searchMarkup(query){
 const href=searchUrl(query);
 return '<article class="bl-search-card bl-search-music-find">'+
 '<div class="bl-search-music-vinyl" aria-hidden="true"><span></span></div>'+
 '<div class="bl-search-music-content"><span class="bl-search-kicker veve-eyebrow">SoundCloud · Public music discovery</span>'+
 '<h3>Find more sounds</h3>'+
 '<p>Search SoundCloud, then paste a public track link to play it here or add its reference to Tunes.</p>'+
 '<a class="bl-search-go bl-search-primary-action" href="'+enc(href)+'" target="_blank" rel="noopener noreferrer">Search SoundCloud ↗</a>'+
 '<form class="bl-search-soundcloud-form"><label>Public SoundCloud track URL<input type="url" name="trackUrl" required placeholder="https://soundcloud.com/artist/track" autocomplete="off"></label><button type="submit">Preview track</button></form>'+
 '<p class="bl-soundcloud-status" role="status" aria-live="polite"></p>'+
 '<div class="bl-soundcloud-preview" hidden></div></div></article>';
}
async function resolveTrack(url){
 // The official oEmbed JSON endpoint supports cross-origin requests and exposes
 // only public metadata. Never inject its HTML; embed only the trusted player.
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),5500);
 try{
  const response=await fetch('https://soundcloud.com/oembed?format=json&url='+encodeURIComponent(url),{signal:controller.signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('This track could not be previewed. It may be private or unavailable.');
  const data=await response.json();
  if(data?.provider_name!=='SoundCloud')throw Error('SoundCloud did not confirm this track.');
  return {url,title:text(data.title).slice(0,140),art:/^https:\/\/[a-z0-9.-]+\/.+/i.test(data.thumbnail_url||'')?data.thumbnail_url:'',artist:text(data.author_name).slice(0,100)};
 }finally{clearTimeout(timeout)}
}
async function preview(form){
 const card=form.closest('.bl-search-music-find'),status=$('.bl-soundcloud-status',card),box=$('.bl-soundcloud-preview',card);
 const raw=String(new FormData(form).get('trackUrl')||'');
 const url=validateUrl(raw);
 if(!url){status.textContent='Use a public soundcloud.com artist/track link. No external links or private tokens.';return}
 const submit=form.querySelector('[type=submit]');submit.disabled=true;
 status.textContent='Preparing SoundCloud player…';
 try{
  // oEmbed may be inaccessible to some browsers due to cross-origin restrictions.
  // Player/bookmarking only need the public track URL supplied by the user.
  let track,verified=false;
  try{track=await resolveTrack(url);verified=true}
  catch{track={url,title:url.split('/').filter(Boolean).pop().replace(/-/g,' '),artist:'',art:''}}
  const frame=document.createElement('iframe');
  frame.title='SoundCloud player: '+(track.title||'Public track');
  frame.src='https://w.soundcloud.com/player/?url='+encodeURIComponent(url)+'&color=%238c4054&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false';
  frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';
  frame.allow='autoplay';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
  box.replaceChildren();
  const label=document.createElement('p');label.className='bl-soundcloud-track-meta';label.textContent=track.title+(track.artist?' · '+track.artist:'');
  const save=document.createElement('button');save.type='button';save.className='bl-soundcloud-save';save.textContent='+ Add to Tunes';
  save.addEventListener('click',()=>{try{const saved=saveTrack(track);status.textContent=saved.message;}catch(e){status.textContent=e.message}});
  const external=document.createElement('a');external.href=url;external.target='_blank';external.rel='noopener noreferrer';external.textContent='Open original on SoundCloud ↗';
  box.append(label,frame,save,external);box.hidden=false;
  status.textContent=verified?'SoundCloud details verified. Playback stays with SoundCloud.':'SoundCloud metadata could not be verified. You can try this official embed and save the link, but playback or availability may depend on its owner.';
 }catch(error){box.replaceChildren();box.hidden=true;status.textContent=error.message||'SoundCloud preview unavailable.'}
 finally{submit.disabled=false}
}
function attachSearch(root){
 if(!root||root.__blSoundcloudBound)return;
 root.__blSoundcloudBound=true;
 root.addEventListener('submit',e=>{
  const form=e.target.closest('.bl-search-soundcloud-form');if(!form)return;
  e.preventDefault();preview(form);
 });
}
function attachTunes(dialog){
 if(!dialog||!dialog.querySelector('#profileMusicSongList'))return;
 let section=dialog.querySelector('#biglwaLinkedTunes');
 if(!section){
  section=document.createElement('section');section.id='biglwaLinkedTunes';
  section.className='music-linked-tunes';
  const list=dialog.querySelector('#profileMusicSongList');
  list?.insertAdjacentElement('afterend',section);
  section.addEventListener('click',e=>{
   const action=e.target.closest('[data-linked-action]');if(!action)return;
   const rows=getSaved(),idx=Number(action.dataset.index);
   if(!Number.isInteger(idx)||idx<0||idx>=rows.length)return;
   const target=rows[idx];
   if(action.dataset.linkedAction==='open')window.open(target.url,'_blank','noopener,noreferrer');
   if(action.dataset.linkedAction==='remove'){
    setSaved(rows.filter((_,i)=>i!==idx));window.dispatchEvent(new CustomEvent('biglwa:tunes-links-changed'));
   }
  });
 }
 const rows=getSaved();
 section.replaceChildren();
 const title=document.createElement('h3');title.textContent='Linked sounds · SoundCloud';section.appendChild(title);
 const note=document.createElement('p');note.textContent='Saved on this browser for your signed-in account. These are SoundCloud links, not uploaded music or cross-device backups.';section.appendChild(note);
 if(!rows.length){const empty=document.createElement('small');empty.textContent='No linked sounds saved yet. Search with L’wazi to add one.';section.appendChild(empty)}
 rows.forEach((x,i)=>{
  const li=document.createElement('div');li.className='music-linked-song';
  const meta=document.createElement('span');meta.textContent=x.title+(x.artist?' · '+x.artist:'');li.appendChild(meta);
  const open=document.createElement('button');open.type='button';open.dataset.linkedAction='open';open.dataset.index=String(i);open.textContent='▶ SoundCloud';li.appendChild(open);
  const remove=document.createElement('button');remove.type='button';remove.dataset.linkedAction='remove';remove.dataset.index=String(i);remove.textContent='Remove';li.appendChild(remove);
  section.appendChild(li);
 });
}
window.addEventListener('biglwa:tunes-links-changed',()=>{const d=$('#profileMusicDialog');if(d)attachTunes(d)});
window.BigLWAMusicDiscovery={searchMarkup,searchUrl,validateUrl,saveTrack,getSaved,attachSearch,attachTunes};
})();
