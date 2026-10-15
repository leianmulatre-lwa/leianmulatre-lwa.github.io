/* BIG LWA · Profile music, stored in R2 by Firebase identity, not Orbit.
 * Member uploads are private until explicitly made public. */
(()=>{
'use strict';
if(window.__biglwaProfileMusic)return;window.__biglwaProfileMusic=true;
const API='https://biglwa-instagram-api.leianmulatre-284.workers.dev/media/profile-music';
const $=q=>document.querySelector(q);
const state={uid:'',owner:false,tracks:[],loading:false,selected:'',dialog:null};
async function currentUser(){
 const {getApps}=await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js');
 const {getAuth}=await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js');
 const app=getApps()[0];if(!app)return null;
 const auth=getAuth(app);await auth.authStateReady();return auth.currentUser;
}
async function api(path='',options={},privateRequest=false){
 const headers=new Headers(options.headers||{});
 if(privateRequest){const user=await currentUser();if(!user)throw Error('Sign in to manage profile music.');
   headers.set('Authorization','Bearer '+await user.getIdToken());}
 const response=await fetch(API+path,{...options,headers,cache:'no-store'});
 if(!response.ok){const body=await response.json().catch(()=>null);throw Error(body?.error||'Music storage unavailable.');}
 return response;
}
async function data(path='',options={},privateRequest=false){
 return (await api(path,options,privateRequest)).json();
}
function status(message){
 const place=$('#profileMusicCloudStatus');if(place)place.textContent=message;
 if(state.owner){const existing=$('#studioMusicStatus');if(existing)existing.textContent=message}
}
function style(){
 if($('#biglwaMusicCloudStyle'))return;
 const sheet=document.createElement('style');sheet.id='biglwaMusicCloudStyle';
 sheet.textContent=[
 '#studioApp .music-card #profileMusicOpen{position:absolute;top:9px;left:93px;z-index:12;min-height:24px;padding:3px 8px;cursor:pointer;color:#91fda0;background:#19271d;border:1px solid #627467;border-radius:5px;font:750 9px system-ui}',
 '#profileMusicDialog{width:min(550px,calc(100vw - 24px));max-height:84vh;overflow:auto;border:1px solid #bd9887;border-radius:17px;padding:21px;background:#fff5eb;color:#302625;box-shadow:0 23px 65px #210e1780}',
 '#profileMusicDialog::backdrop{background:#1c141bb0}',
 '#profileMusicDialog .music-head{display:flex;justify-content:space-between;align-items:center;gap:10px}',
 '#profileMusicDialog h2{margin:0;font:500 27px Georgia,serif}',
 '#profileMusicDialog button{cursor:pointer;padding:7px 9px;border:1px solid #b9a099;border-radius:7px;background:#fffaf5;color:#34252b;font:700 11px system-ui}',
 '#profileMusicDialog .music-song-list{display:grid;gap:8px;list-style:none;padding:0;margin:15px 0}',
 '#profileMusicDialog .music-song{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:9px;padding:10px;border:1px solid #dfcbc1;border-radius:11px}',
 '#profileMusicDialog .music-song-label strong{display:block;font:700 14px system-ui}',
 '#profileMusicDialog .music-song-label small{display:block;font:500 11px system-ui;color:#765d60;margin-top:3px}',
 '#profileMusicDialog .music-song-actions{display:flex;gap:5px;flex-wrap:wrap}',
 '#profileMusicDialog [data-track-action=play]{background:#462831;color:#fff}',
 '#profileMusicDialog .music-footer{display:flex;gap:9px;flex-wrap:wrap}',
 '#profileMusicDialog #profileMusicCloudStatus{font:500 12px/1.45 system-ui}',
 '#profileMusicDialog button:focus-visible,#profileMusicOpen:focus-visible{outline:3px solid #b46e89;outline-offset:2px}'
 ].join('\n');
 document.head.append(sheet);
}
function ensure(){
 const card=$('#studioApp .music-card');if(!card)return false;
 style();
 if(!$('#profileMusicOpen')){
  const button=document.createElement('button');button.type='button';button.id='profileMusicOpen';
  button.textContent='♫ SONGS';button.setAttribute('aria-label','Choose a profile song');
  button.addEventListener('click',()=>open());card.append(button);
 }
 if(!state.dialog){
  const dialog=document.createElement('dialog');dialog.id='profileMusicDialog';
  dialog.setAttribute('aria-label','Profile song library');
  dialog.innerHTML='<div class="music-head"><h2>profile songs</h2><button type="button" data-track-action="close">×</button></div>'+
   '<p id="profileMusicCloudStatus" role="status"></p>'+
   '<ul class="music-song-list" id="profileMusicSongList"></ul>'+
   '<div class="music-footer" id="profileMusicOwnerButtons" hidden>'+
   '<button type="button" data-track-action="add">Add another song</button>'+
   '<button type="button" data-track-action="backup">Back up current device song</button></div>';
  dialog.addEventListener('click',event=>clickDialog(event).catch(error=>status(error.message)));
  document.body.append(dialog);state.dialog=dialog;
 }
 return true;
}
function render(){
 if(!ensure())return;
 const ownerActions=$('#profileMusicOwnerButtons');ownerActions.hidden=!state.owner;
 const list=$('#profileMusicSongList');list.replaceChildren();
 if(!state.tracks.length){
  const item=document.createElement('li');
  item.textContent=state.owner?'No account songs yet. All uploads start private.':'No songs published on this profile yet.';
  list.append(item);return;
 }
 for(const track of state.tracks){
  const li=document.createElement('li');li.className='music-song';
  const label=document.createElement('div');label.className='music-song-label';
  const name=document.createElement('strong');name.textContent=track.title||'Untitled song';
  const sub=document.createElement('small');sub.textContent=(track.artist||'Unknown artist')+' · '+(track.public?'Public':'Private');
  label.append(name,sub);
  const actions=document.createElement('div');actions.className='music-song-actions';
  const button=(action,text)=>{
   const b=document.createElement('button');b.type='button';b.dataset.trackAction=action;b.dataset.trackId=track.id;
   b.textContent=text;actions.append(b);
  };
  button('play','▶ Play');
  if(state.owner){button('share',track.public?'Make private':'Publish');button('delete','Delete');}
  li.append(label,actions);list.append(li);
 }
}
function open(){if(!ensure())return;render();if(!state.dialog.open)state.dialog.showModal();}
function selectPublic(track){
 const audio=$('#studioAudio');if(!audio)return;
 audio.pause();audio.src=track.url;audio.load();state.selected=track.id;
 const title=$('#studioMusicTitle'),artist=$('#studioMusicArtist');
 if(title)title.textContent=track.title||'Untitled song';
 if(artist)artist.textContent=track.artist||'Unknown artist';
}
async function refresh(){
 if(!state.uid||state.loading)return;
 state.loading=true;
 try{
  const response=await data(state.owner?'/me':'/'+encodeURIComponent(state.uid),{},state.owner);
  state.tracks=response.tracks||[];
  render();
  const first=state.tracks.find(t=>t.public);
  if(!state.owner&&first&&!state.selected)selectPublic(first);
  status(state.owner?'Your account songs are private until you press Publish.':
    state.tracks.length?'Select a song to play.':'No public songs yet.');
 }finally{state.loading=false}
}
async function upload(file,title,artist){
 if(!state.owner)throw Error('Only the profile owner can upload.');
 if(!file||file.size>75*1024*1024)throw Error('Audio files must be under 75 MB.');
 status('Uploading private song to your Big LWA account…');
 const params=new URLSearchParams({title:String(title||file.name).slice(0,100),artist:String(artist||'Unknown artist').slice(0,100)});
 await data('?'+params.toString(),{method:'POST',headers:{'Content-Type':file.type||'audio/mpeg'},body:file},true);
 status('Uploaded privately. Press Publish to make this song playable on your profile.');
 await refresh();
}
async function play(track){
 const player=window.BigLWAStudioMusic?.playCloudTrack;
 if(!player)throw Error('The stereo is still loading.');
 if(track.public)await player(track);
 else await player(track,async()=>(await api('/'+state.uid+'/'+track.id,{},true)).blob());
 state.selected=track.id;state.dialog?.close();
}
async function clickDialog(event){
 const target=event.target.closest('button');if(!target)return;
 const action=target.dataset.trackAction;
 if(action==='close'){state.dialog.close();return}
 if(action==='add'){$('#studioTrackInput')?.click();return}
 if(action==='backup'){
  const saved=await window.BigLWAStudioMusic?.getLocalRecord?.();
  if(!saved?.audioBlob){status('No locally saved track found. Choose a file first.');return}
  await upload(saved.audioBlob,saved.title,saved.artist);return;
 }
 const track=state.tracks.find(item=>item.id===target.dataset.trackId);
 if(!track)return;
 target.disabled=true;
 try{
  if(action==='play')await play(track);
  if(state.owner&&action==='share'){
   await data('/'+state.uid+'/'+track.id,{
    method:'PATCH',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({public:!track.public})},true);
   await refresh();
  }
  if(state.owner&&action==='delete'&&confirm('Remove this song from your profile?')){
   await data('/'+state.uid+'/'+track.id,{method:'DELETE'},true);await refresh();
  }
 }finally{target.disabled=false}
}
async function owner(){
 const user=await currentUser();if(!user)return;
 if(state.owner&&state.uid===user.uid)return;
 state.uid=user.uid;state.owner=true;state.selected='';await refresh();
}
async function visitor(profile){
 const uid=String(profile?.uid||'');if(!uid)return;
 state.uid=uid;state.owner=false;state.selected='';state.tracks=[];
 // A public profile must not inherit a song saved in the visitor's browser.
 const audio=$('#studioAudio');if(audio){audio.pause();audio.removeAttribute('src');audio.load()}
 const title=$('#studioMusicTitle'),artist=$('#studioMusicArtist');
 if(title)title.textContent='Profile songs';if(artist)artist.textContent='Choose a published track';
 await refresh();
}
async function boot(){
 if(!ensure())return;
 const info=window.BigLWAStudioPreview?.state?.();
 if(info?.active&&info.username){
  const profile=await window.BigLWAUserDirectory?.loadPublicProfile?.(info.username);
  if(profile?.uid)return visitor(profile);
 }
 await owner();
}
window.addEventListener('biglwa:public-profile-ready',e=>visitor(e.detail).catch(err=>status(err.message)));
window.addEventListener('biglwa:music-local-upload',e=>{
 const {file,title,artist}=e.detail||{};
 owner().then(()=>upload(file,title,artist)).catch(err=>status(err.message));
});
window.addEventListener('biglwa:session-verified',e=>{
 if(!e.detail?.signedIn){state.uid='';state.owner=false;state.tracks=[];state.selected='';render()}
 else boot().catch(()=>{});
});
document.addEventListener('biglwa:module-close',ensure);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>boot().catch(()=>{}),{once:true});
else boot().catch(()=>{});
setTimeout(()=>boot().catch(()=>{}),1000);
})();
