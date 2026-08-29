const $ = (s) => document.querySelector(s);
const root = document.documentElement;
const defaults = {
  displayName:'Leian Stanley', handle:'leian', bio:'researcher, creator, entrepreneur, analyst.', mood:'making',
  rank:'statement', track:'imported track', auraStrength:28, bannerOpacity:38, profileOpacity:96, projectionGlow:22,
  panelOpacity:96, softBlur:true, roomShadows:true, auraUrl:'', bannerUrl:''
};
let state = {...defaults, ...JSON.parse(localStorage.getItem('biglwa-profile') || '{}')};

function activate(view){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('is-active'));
  $(view).classList.add('is-active');
}
function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>t.classList.remove('show'),1800)}
function setVars(){
  root.style.setProperty('--aura-strength', state.auraStrength/100);
  root.style.setProperty('--banner-opacity', state.bannerOpacity/100);
  root.style.setProperty('--profile-opacity', state.profileOpacity/100);
  root.style.setProperty('--glow', state.projectionGlow/100);
  root.style.setProperty('--panel-opacity', state.panelOpacity/100);
}
function render(){
  $('#displayName').textContent=state.displayName || 'Untitled';
  $('#handleText').textContent='@'+(state.handle || 'handle').replace(/^@/,'');
  $('#bioText').textContent=state.bio;
  $('#moodBadge').textContent='mood: '+state.mood;
  $('#rankLabel').textContent=state.rank;
  const ranks=['007','kiki','statement','legend','icon'];
  $('#rankFill').style.width=(12 + ranks.indexOf(state.rank)*21)+'%';
  $('#trackLabel').textContent=state.track || 'no soundtrack';
  $('#auraLayer').style.backgroundImage=state.auraUrl?`url("${state.auraUrl}")`:'none';
  $('#bannerLayer').style.backgroundImage=state.bannerUrl?`url("${state.bannerUrl}")`:'none';
  $('#roomView').classList.toggle('no-blur',!state.softBlur);
  $('#roomView').classList.toggle('no-shadow',!state.roomShadows);
  setVars();
  const ids={nameInput:'displayName',handleInput:'handle',bioInput:'bio',moodInput:'mood',rankSelect:'rank',trackInput:'track',auraStrength:'auraStrength',bannerOpacity:'bannerOpacity',profileOpacity:'profileOpacity',projectionGlow:'projectionGlow',panelOpacity:'panelOpacity'};
  for(const [id,key] of Object.entries(ids)){const el=$('#'+id);if(el)el.value=state[key]}
  $('#softBlur').checked=state.softBlur;$('#roomShadows').checked=state.roomShadows;
}
function openPanel(){const p=$('#controlPanel');p.classList.add('is-open');p.setAttribute('aria-hidden','false');$('#roomView').classList.add('panel-open');showToast('control panel online')}
function closePanel(){const p=$('#controlPanel');p.classList.remove('is-open');p.setAttribute('aria-hidden','true');$('#roomView').classList.remove('panel-open')}
function readControls(){
  state.displayName=$('#nameInput').value.trim();state.handle=$('#handleInput').value.trim().replace(/^@/,'');state.bio=$('#bioInput').value.trim();state.mood=$('#moodInput').value.trim();
  state.rank=$('#rankSelect').value;state.track=$('#trackInput').value.trim();state.auraStrength=+$(`#auraStrength`).value;state.bannerOpacity=+$(`#bannerOpacity`).value;state.profileOpacity=+$(`#profileOpacity`).value;state.projectionGlow=+$(`#projectionGlow`).value;state.panelOpacity=+$(`#panelOpacity`).value;state.softBlur=$('#softBlur').checked;state.roomShadows=$('#roomShadows').checked;
}
function liveUpdate(){readControls();render()}
function fileToData(input,key){const f=input.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{state[key]=r.result;render();showToast(key==='auraUrl'?'aura loaded':'banner loaded')};r.readAsDataURL(f)}

$('#loginForm').addEventListener('submit',(e)=>{e.preventDefault();activate('#roomView');showToast('room connected')});
$('#editProfile').addEventListener('click',openPanel);$('#closePanel').addEventListener('click',closePanel);
$('#saveProfile').addEventListener('click',()=>{readControls();localStorage.setItem('biglwa-profile',JSON.stringify(state));render();closePanel();showToast('profile saved')});
$('#resetProfile').addEventListener('click',()=>{state={...defaults};localStorage.removeItem('biglwa-profile');render();showToast('profile reset')});
['nameInput','handleInput','bioInput','moodInput','rankSelect','trackInput','auraStrength','bannerOpacity','profileOpacity','projectionGlow','panelOpacity','softBlur','roomShadows'].forEach(id=>$('#'+id).addEventListener('input',liveUpdate));
$('#bannerInput').addEventListener('change',e=>fileToData(e.currentTarget,'bannerUrl'));$('#auraInput').addEventListener('change',e=>fileToData(e.currentTarget,'auraUrl'));
$('#removeTrack').addEventListener('click',()=>{state.track='';render();showToast('soundtrack removed')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel()});
document.querySelectorAll('.nav-key').forEach(btn=>btn.addEventListener('click',()=>{const page=btn.dataset.page;if(page==='logout'){closePanel();activate('#loginView');return}document.querySelectorAll('.nav-key').forEach(b=>b.classList.toggle('is-selected',b===btn));if(page==='desktop')showToast('desktop');else showToast(page+' is mapped for the next build')}));
render();
