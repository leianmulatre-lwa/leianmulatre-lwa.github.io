import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
  authDomain: 'biglwa.firebaseapp.com',
  projectId: 'biglwa',
  storageBucket: 'biglwa.firebasestorage.app',
  messagingSenderId: '83232670555',
  appId: '1:83232670555:web:e04927b20458390b3b507e'
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

const $ = (s) => document.querySelector(s);
const root = document.documentElement;
const loginBackgrounds = [
  new URL('./assets/login-pink-city.gif',import.meta.url).href,
  new URL('./assets/login-future-city.gif',import.meta.url).href,
  new URL('./assets/login-cherry-lake.gif',import.meta.url).href,
  new URL('./assets/login-night-city.gif',import.meta.url).href
];
function selectLoginBackground(){
  const media=$('#loginMedia');
  if(!media)return;
  const last=Number(sessionStorage.getItem('biglwa-login-background'));
  const options=loginBackgrounds.map((_,index)=>index).filter(index=>index!==last);
  const chosenIndex=options[Math.floor(Math.random()*options.length)];
  sessionStorage.setItem('biglwa-login-background',String(chosenIndex));
  media.style.backgroundImage=`url("${loginBackgrounds[chosenIndex]}")`;
}
selectLoginBackground();
function layoutLoginMediaInFrame(){
  const media=$('#loginMedia');
  if(!media)return;
  const w=innerWidth,h=innerHeight,scale=Math.max(w/1905,h/826);
  const renderedWidth=1905*scale,renderedHeight=826*scale;
  const offsetX=(w-renderedWidth)/2,offsetY=(h-renderedHeight)/2;
  media.style.left=(offsetX+359*scale)+'px';
  media.style.top=(offsetY+31*scale)+'px';
  media.style.width=(1184*scale)+'px';
  media.style.height=(647*scale)+'px';
}
layoutLoginMediaInFrame();
const defaults = {
  displayName:'Leian Stanley', handle:'leian', bio:'researcher, creator, entrepreneur, analyst.', mood:'making',
  rank:'statement', track:'imported track', auraStrength:100, profileOpacity:100, projectionGlow:22,
  panelOpacity:100, softBlur:true, roomShadows:true, auraUrl:'', auraX:0, auraY:0, auraScale:100, bg:0, bgCustom:'', bgX:0, bgY:0, bgScale:100
};
let currentUser = null;
let state = {...defaults};
let authMode = 'login';
let theme = localStorage.getItem('biglwa-theme') || (matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
const profileKey = () => currentUser ? `biglwa-profile:${currentUser.uid}` : '';
function loadProfile(){
  const saved=profileKey()&&localStorage.getItem(profileKey());
  state={...defaults,...(saved?JSON.parse(saved):{})};
  if(currentUser?.displayName&&!saved){
    state.handle=currentUser.displayName;
    state.displayName=currentUser.displayName;
  }
}

function activate(view){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('is-active'));
  $(view).classList.add('is-active');
}
function routeTo(path,{replace=false}={}){
  const method=replace?'replaceState':'pushState';
  if(window.location.pathname!==path)history[method](null,'',path);
}
function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>t.classList.remove('show'),1800)}
function setVars(){
  root.style.setProperty('--aura-strength', state.auraStrength/100);
  root.style.setProperty('--profile-opacity', state.profileOpacity/100);
  root.style.setProperty('--glow', state.projectionGlow/100);
  root.style.setProperty('--panel-opacity', state.panelOpacity/100);
}
function layoutAuraInRoomCrop(){
  const view=$('#roomView'), aura=$('#auraLayer');
  if(!view||!aura)return;
  const w=view.clientWidth, h=view.clientHeight, roomTop=h*.09, roomHeight=h*.91;
  const scale=Math.max(w/1905,roomHeight/826);
  const renderedWidth=1905*scale;
  const offsetX=(w-renderedWidth)/2;
  const baseLeft=offsetX+388*scale, baseTop=roomTop+25*scale;
  const baseWidth=1126*scale, baseHeight=691*scale;
  const size=(state.auraScale||100)/100;
  const width=baseWidth*size, height=baseHeight*size;
  aura.style.left=(baseLeft+(baseWidth-width)/2+(state.auraX||0)*baseWidth/100)+'px';
  aura.style.top=(baseTop+(baseHeight-height)/2+(state.auraY||0)*baseHeight/100)+'px';
  aura.style.width=width+'px';
  aura.style.height=height+'px';
}
function render(){
  $('#displayName').textContent=state.displayName || 'Untitled';
  $('#handleText').textContent='@'+(state.handle || 'handle').replace(/^@/,'');
  $('#bioText').textContent=state.bio;
  $('#moodBadge').textContent='mood: '+state.mood;
  $('#rankLabel').textContent=state.rank;
  const ranks=['007','kiki','statement','legend','icon'];
  $('#rankFill').style.width=(12 + ranks.indexOf(state.rank)*21)+'%';
  $('#topUser').textContent='@'+(state.handle || 'handle');
  const inits=(state.displayName||'?').split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?';
  $('#avatar').textContent=inits;$('#doorAvatar').textContent=inits;
  $('#trackLabel').textContent=state.track || 'no soundtrack';
  $('#auraLayer').style.display='block';
  $('#auraLayer').style.backgroundImage=state.auraUrl?`url("${state.auraUrl}")`:'url("assets/nunnn.png")';
  $('#roomView').classList.toggle('no-blur',!state.softBlur);
  $('#roomView').classList.toggle('no-shadow',!state.roomShadows);
  setVars();
  const ids={nameInput:'displayName',handleInput:'handle',bioInput:'bio',moodInput:'mood',rankSelect:'rank',trackInput:'track',auraStrength:'auraStrength',auraX:'auraX',auraY:'auraY',auraScale:'auraScale',profileOpacity:'profileOpacity',projectionGlow:'projectionGlow',panelOpacity:'panelOpacity',bgX:'bgX',bgY:'bgY',bgScale:'bgScale'};
  for(const [id,key] of Object.entries(ids)){const el=$('#'+id);if(el)el.value=state[key]}
  $('#softBlur').checked=state.softBlur;$('#roomShadows').checked=state.roomShadows;
  applyBg();
  layoutAuraInRoomCrop();
}

/* ---- wallpaper paints the whiteboard (login + panels stay fixed) ---- */
function applyBg(){
  const b=$('#screenBoard');
  const art=$('#wallpaperArt');
  const custom=state.bg===-1&&state.bgCustom;
  b.style.background=custom?'none':'url("assets/whiteboard.png") center/contain no-repeat';
  art.style.display=custom?'block':'none';
  art.style.backgroundImage=custom?`url("${state.bgCustom}")`:'none';
  art.style.transform=`translate(${state.bgX||0}%,${state.bgY||0}%) scale(${(state.bgScale||100)/100})`;
}
$('#bgUpload').addEventListener('change',e=>{const f=e.currentTarget.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{state.bg=-1;state.bgCustom=r.result;applyBg();showToast('wallpaper changed')};r.readAsDataURL(f)});

/* ---- top search (home page) ---- */
const search=$('#archiveSearch');
search.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    const q=search.value.trim();
    showToast(q?`searching the archive · "${q}" · mapped for next build`:'type + enter to search the archive');
    search.blur();
  }
});

/* ---- browser tabs + typewriter shortcuts ---- */
const pages=[
  {id:'desktop',k:'D',name:'desk',addr:'room.biglwa/desk',desc:'desktop — profile projection, metrics, soundtrack. home.'},
  {id:'feed',k:'F',name:'feed',addr:'room.biglwa/feed',desc:'archivist find stream — clips, sources and tagged notes. fyp-style.'},
  {id:'connect',k:'C',name:'connect',addr:'room.biglwa/connect',desc:'wires to verified sources, collaborators and citations.'},
  {id:'map',k:'M',name:'map',addr:'room.biglwa/map',desc:'08 rooms mapped — the rail language of everywhere you collect.'},
  {id:'camera',k:'K',name:'camera',addr:'room.biglwa/camera',desc:'new find intake — stills, loops, paper notes into the archive.'},
  {id:'diary',k:'Y',name:'diary',addr:'room.biglwa/diary',desc:'dated research notes with source links, kept in order.'},
  {id:'stream',k:'S',name:'stream',addr:'room.biglwa/stream',desc:'broadcast the current card to the room, captioned.'}
];
const tabBar=$('#tabBar'),addrEl=$('#addrText'),tabBody=$('#tabBody'),ph=$('#tabPlaceholder');
pages.forEach((p,i)=>{
  const t=document.createElement('div');
  t.className='br-tab'+(i===0?' active':'');t.setAttribute('role','tab');t.dataset.page=p.id;
  t.innerHTML='<span class="k">'+p.k+'</span><span>'+p.name+'</span>';
  t.addEventListener('click',()=>selectPage(p.id));
  tabBar.appendChild(t);
});
function selectPage(page){
  const p=pages.find(x=>x.id===page);if(!p)return;
  document.querySelectorAll('.br-tab').forEach(t=>t.classList.toggle('active',t.dataset.page===page));
  document.querySelectorAll('.nav-key').forEach(k=>k.classList.toggle('is-selected',k.dataset.page===page));
  addrEl.textContent=p.addr;
  const desk=page==='desktop';
  tabBody.hidden=!desk;ph.hidden=desk;
  ph.innerHTML='<span class="ph-key">'+p.k+'</span><p class="ph-desc">'+p.desc+'</p>';
}

/* ---- login → signal → room ---- */
function roomBoot(){
  const rv=$('#roomView');
  setTimeout(()=>rv.classList.add('entered'),60);
  setTimeout(()=>rv.classList.add('screen-on'),1500);
  showToast('room connected');
}
function logout(){
  closePanel();
  const rv=$('#roomView');
  rv.classList.remove('entered','screen-on');
  signOut(auth).catch(()=>showToast('could not sign out'));
}
$('#loginForm').addEventListener('submit',async(e)=>{
  e.preventDefault();
  const email=$('#loginEmail').value.trim();
  const password=$('#loginPassword').value;
  const passwordConfirm=$('#loginPasswordConfirm').value;
  const handle=$('#loginHandle').value.trim().replace(/^@/,'');
  const submit=$('#authSubmit');
  setAuthMessage('');
  submit.disabled=true;
  try{
    if(authMode==='recover'){
      await sendPasswordResetEmail(auth,email);
      setAuthMode('recovery-sent');
    }else if(authMode==='signup'){
      if(!/^[a-zA-Z0-9._-]{2,24}$/.test(handle))throw new Error('Handle must be 2–24 letters, numbers, dots, dashes, or underscores.');
      if(password.length<8||!/[a-zA-Z]/.test(password)||!/\d/.test(password))throw new Error('Passkey must be at least 8 characters with a letter and number.');
      if(password!==passwordConfirm)throw new Error('Passkeys do not match.');
      const credential=await createUserWithEmailAndPassword(auth,email,password);
      await updateProfile(credential.user,{displayName:handle});
      currentUser=credential.user;
      state={...defaults,displayName:handle,handle};
      localStorage.setItem(profileKey(),JSON.stringify(state));
      render();
      showRoute('/room',{replace:true});
    }else{
      await signInWithEmailAndPassword(auth,email,password);
    }
  }catch(error){
    setAuthMessage(authErrorMessage(error),true);
  }finally{
    submit.disabled=false;
  }
});
$('#resetFlow')?.addEventListener('click',logout);

/* ---- door + control panel ---- */
function openPanel(){
  const p=$('#controlPanel');
  p.classList.add('is-open');p.setAttribute('aria-hidden','false');
  $('#wallDoor').classList.add('open');
  $('#roomView').classList.add('panel-open');
  showToast('control panel online');
}
function closePanel(){
  const p=$('#controlPanel');
  p.classList.remove('is-open');p.setAttribute('aria-hidden','true');
  $('#wallDoor').classList.remove('open');
  $('#roomView').classList.remove('panel-open');
}
$('#doorCustomise').addEventListener('click',openPanel);
$('#wallDoor').addEventListener('keydown',e=>{
  if(e.target!==$('#wallDoor'))return;
  if(e.key==='Enter'||e.key===' '){e.preventDefault();openPanel()}
});
$('#closePanel').addEventListener('click',closePanel);
$('#signOut').addEventListener('click',logout);

/* ---- profile state ---- */
function readControls(){
  state.displayName=$('#nameInput').value.trim();state.handle=$('#handleInput').value.trim().replace(/^@/,'');state.bio=$('#bioInput').value.trim();state.mood=$('#moodInput').value.trim();
  state.rank=$('#rankSelect').value;state.track=$('#trackInput').value.trim();state.auraStrength=+$(`#auraStrength`).value;state.auraX=+$(`#auraX`).value;state.auraY=+$(`#auraY`).value;state.auraScale=+$(`#auraScale`).value;state.profileOpacity=+$(`#profileOpacity`).value;state.projectionGlow=+$(`#projectionGlow`).value;state.panelOpacity=+$(`#panelOpacity`).value;state.bgX=+$(`#bgX`).value;state.bgY=+$(`#bgY`).value;state.bgScale=+$(`#bgScale`).value;state.softBlur=$('#softBlur').checked;state.roomShadows=$('#roomShadows').checked;
}
function liveUpdate(){readControls();render()}
function fileToData(input,key){const f=input.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{state[key]=r.result;render();showToast(key==='auraUrl'?'aura loaded':'uploaded')};r.readAsDataURL(f)}

$('#saveProfile').addEventListener('click',()=>{readControls();if(profileKey())localStorage.setItem(profileKey(),JSON.stringify(state));render();closePanel();showToast('profile saved · wall sealed')});
$('#resetProfile').addEventListener('click',()=>{state={...defaults};if(profileKey())localStorage.removeItem(profileKey());render();showToast('profile reset')});
['nameInput','handleInput','bioInput','moodInput','rankSelect','trackInput','auraStrength','auraX','auraY','auraScale','profileOpacity','projectionGlow','panelOpacity','bgX','bgY','bgScale','softBlur','roomShadows'].forEach(id=>$('#'+id).addEventListener('input',liveUpdate));
$('#auraInput').addEventListener('change',e=>fileToData(e.currentTarget,'auraUrl'));
$('#removeTrack').addEventListener('click',()=>{state.track='';render();showToast('soundtrack removed')});

/* ---- navigation + keyboard shortcuts ---- */
document.querySelectorAll('.nav-key').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(btn.dataset.page==='logout'){logout();return}
    selectPage(btn.dataset.page);
  });
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closePanel();return}
  if(e.target.closest('input,textarea,select'))return;
  if(e.key==='/'){e.preventDefault();search.focus();return}
  if(!$('#roomView').classList.contains('is-active'))return;
  const map={d:'desktop',f:'feed',c:'connect',m:'map',k:'camera',y:'diary',s:'stream',l:'logout'};
  const page=map[e.key.toLowerCase()];
  if(!page)return;
  e.preventDefault();
  if(page==='logout')logout();else selectPage(page);
});

function showRoute(path,{replace=false}={}){
  const room=path==='/room'&&Boolean(currentUser);
  if(room){
    activate('#roomView');
    routeTo('/room',{replace});
    roomBoot();
  }else{
    closePanel();
    $('#roomView').classList.remove('entered','screen-on');
    activate('#loginView');
    routeTo('/login',{replace});
  }
}

function setAuthMessage(message,isError=false){
  const el=$('#authMessage');
  el.textContent=message;
  el.classList.toggle('is-error',isError);
}
function authErrorMessage(error){
  const messages={
    'auth/email-already-in-use':'That email already has a room. Try logging in.',
    'auth/invalid-credential':'That email or passkey does not match.',
    'auth/invalid-email':'Enter a valid email address.',
    'auth/configuration-not-found':'Account access is not enabled yet. Turn on Email/Password in Firebase Authentication.',
    'auth/operation-not-allowed':'Email/Password sign-in is not enabled in Firebase yet.',
    'auth/weak-password':'Use a passkey with at least 6 characters.',
    'auth/too-many-requests':'Too many attempts. Please wait and try again.',
    'auth/network-request-failed':'Connection lost. Check your internet and try again.'
  };
  return messages[error?.code]||error?.message||'Account access failed. Please try again.';
}
function setAuthMode(mode){
  authMode=mode;
  const signup=mode==='signup';
  const recovery=mode==='recover';
  const sent=mode==='recovery-sent';
  $('#loginForm').hidden=sent;
  $('#loginForm').classList.toggle('is-signup',signup);
  $('#loginForm').classList.toggle('is-recovery',recovery);
  document.querySelectorAll('.signup-only').forEach(el=>el.hidden=!signup);
  $('#loginHandle').required=signup;
  $('#loginPasswordConfirm').required=signup;
  $('#passwordLabel').hidden=recovery;
  $('#loginPassword').required=!recovery;
  $('#loginPassword').autocomplete=signup?'new-password':'current-password';
  $('#authSubmit').textContent=recovery?'send recovery link':signup?'create room':'enter room';
  $('#authTagline').textContent=sent?'check your inbox for the recovery door.':recovery?'we will send a secure recovery link.':signup?'claim your light in the room.':'our room is better with light.';
  $('#forgotPassword').hidden=mode!=='login';
  $('#backToLogin').hidden=!recovery&&!sent;
  $('.auth-switch').hidden=recovery||sent;
  $('#loginMode').classList.toggle('is-active',!signup);
  $('#signupMode').classList.toggle('is-active',signup);
  $('#loginMode').setAttribute('aria-selected',String(!signup));
  $('#signupMode').setAttribute('aria-selected',String(signup));
  setAuthMessage(sent?'Recovery email sent. Use its link to choose a new passkey.':'');
}
$('#loginMode').addEventListener('click',()=>setAuthMode('login'));
$('#signupMode').addEventListener('click',()=>setAuthMode('signup'));
$('#forgotPassword').addEventListener('click',()=>setAuthMode('recover'));
$('#backToLogin').addEventListener('click',()=>setAuthMode('login'));

function applyTheme(){
  root.dataset.theme=theme;
  document.querySelectorAll('.theme-toggle').forEach(button=>{
    button.textContent=theme==='dark'?'☀':'☾';
    button.setAttribute('aria-label',theme==='dark'?'Switch to light mode':'Switch to dark mode');
  });
  document.querySelectorAll('[data-theme-choice]').forEach(button=>{
    const active=button.dataset.themeChoice===theme;
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-pressed',String(active));
  });
}
document.querySelectorAll('.theme-toggle').forEach(button=>button.addEventListener('click',()=>{
  theme=theme==='dark'?'light':'dark';
  localStorage.setItem('biglwa-theme',theme);
  applyTheme();
}));
document.querySelectorAll('[data-theme-choice]').forEach(button=>button.addEventListener('click',()=>{
  theme=button.dataset.themeChoice;
  localStorage.setItem('biglwa-theme',theme);
  applyTheme();
}));

render();
selectPage('desktop');
applyTheme();
setAuthMode('login');
onAuthStateChanged(auth,user=>{
  currentUser=user;
  if(user){
    loadProfile();
    render();
    showRoute('/room',{replace:true});
  }else{
    state={...defaults};
    render();
    showRoute('/login',{replace:true});
  }
});
window.addEventListener('popstate',()=>showRoute(window.location.pathname,{replace:true}));
window.addEventListener('resize',()=>{
  layoutAuraInRoomCrop();
  layoutLoginMediaInFrame();
});
