/* BIGLWA public studio preview
 * A signed-out visitor who opens biglwa.com/<username> gets a read-only look at
 * that member's studio. Browsing stays open, profile music keeps playing, and
 * anything that would change or personalise the space asks for an account first.
 */
const PREVIEW_RESERVED = new Set([
  "studio","login","privacy","terms","rights","photo-booth","map-app",
  "bootstrap-v2","base-v1","index","404","favicon","assets"
]);
const PREVIEW_PATH = /^\/([a-z0-9._-]{5,24})\/?$/;
const APPEARANCE_KEYS = ["biglwaWidgetStyle","biglwaWallpaperSettings","biglwaDockedWidgetsV3","biglwaWidgetOrder"];

const preview = {
  username:"",
  path:"",
  profile:null,
  active:false,
  signedIn:false,
  snapshot:null,
  timer:0,
  checking:false,
  lastCheck:0,
  promptOpen:false
};

const $ = (sel,root=document)=>root.querySelector(sel);
const entryPath = ()=>window.__biglwaEntryPath||location.pathname;
const pathUsername = (path=entryPath())=>{
  let segment="";
  try{segment=decodeURIComponent(String(path||"")).replace(/^\/+|\/+$/g,"").toLowerCase()}catch{}
  if(!segment || PREVIEW_RESERVED.has(segment) || segment.includes(".")) return "";
  return PREVIEW_PATH.test("/"+segment) ? segment : "";
};
const clean = v=>String(v==null?"":v).trim();

async function waitFor(test,timeout=20000){
  const started=Date.now();
  while(Date.now()-started<timeout){
    let value=null;
    try{value=test()}catch{}
    if(value) return value;
    await new Promise(resolve=>setTimeout(resolve,60));
  }
  return null;
}

const directory = ()=>window.BigLWAUserDirectory||null;
const studioApp = ()=>document.getElementById("studioApp");
const loginPage = ()=>document.getElementById("loginPage");

function showStudioScreen(){
  const app=studioApp();
  if(!app) return false;
  ["loginPage","privacyPage","termsPage","rightsPage"].forEach(id=>{
    const page=document.getElementById(id);
    if(page) page.classList.remove("is-active");
  });
  app.classList.add("is-active");
  document.body.classList.add("biglwa-identity-ready");
  return true;
}

function showLoginScreen(){
  const app=studioApp(),login=loginPage();
  if(app) app.classList.remove("is-active");
  if(login) login.classList.add("is-active");
  if(!login) return;
  const tabs={create:"#createTab",signin:"#signInTab"};
  $(tabs[preview.nextMode||"create"]||"#createTab",login)?.click();
  preview.nextMode="";
  setTimeout(()=>$("#loginEmail",login)?.focus(),60);
}

function renderAuraCopy(text){
  const copy=$("#studioApp .aura-card p");
  if(!copy) return;
  const lines=clean(text).split(/\n+/).map(line=>line.trim()).filter(Boolean);
  if(!lines.length) return;
  copy.replaceChildren();
  const lead=document.createElement("strong");
  lead.textContent=lines.shift();
  copy.appendChild(lead);
  if(lines.length) copy.appendChild(document.createElement("br"),document.createTextNode(lines.join(" ")));
}

function applyIdentity(data){
  const card=$("#studioApp .profile-card");
  if(!card || !data) return false;
  const display=$(".profile-display-name",card),handle=$(".profile-name-line h1",card),bio=$(".bio",card),meta=$(".meta-row",card);
  const name=clean(data.name)||clean(data.username);
  if(display && name) display.textContent=name;
  if(handle && data.username) handle.textContent="@"+clean(data.username).replace(/^@/,"");
  if(bio && data.bio!=null) bio.textContent=clean(data.bio);
  if(meta && data.location!=null){
    const spot=$("span",meta);
    if(spot) spot.textContent=clean(data.location)?"⌖ "+clean(data.location):"";
    const rail=$(".profile-rail-location",card);
    if(rail) rail.textContent=clean(data.location);
  }
  if(meta && data.website!=null){
    const link=$("a",meta),site=clean(data.website);
    if(link){ link.textContent=site; link.href=site?(/^https?:\/\//.test(site)?site:"https://"+site):"#"; link.classList.toggle("is-empty",!site); }
  }
  const moodCard=$("#weeklyMoodCard",card);
  if(moodCard && data.mood!=null){
    const value=$(".weekly-mood-value",moodCard);
    if(value) value.textContent=clean(data.mood)||"add this week's #mood";
    if(clean(data.moodStyle)) moodCard.dataset.moodStyle=clean(data.moodStyle);
  }
  if(data.auraText!=null) renderAuraCopy(data.auraText);
  const welcome=$("#studioApp .welcome strong");
  if(welcome && name) welcome.textContent=name.charAt(0).toUpperCase()+name.slice(1);
  const avatar=$("#studioApp .mini-avatar");
  if(avatar && name) avatar.textContent=name.charAt(0).toUpperCase();
  document.body.classList.add("biglwa-identity-ready");
  return true;
}

function localProfile(){
  let saved=null;
  try{saved=JSON.parse(localStorage.getItem("biglwaProfileDetails")||"null")}catch{}
  return saved&&typeof saved==="object"?saved:{};
}

function snapshotAppearance(){
  const snap={};
  APPEARANCE_KEYS.forEach(key=>{ try{snap[key]=localStorage.getItem(key)}catch{} });
  preview.snapshot=snap;
}

function restoreAppearance(){
  const snap=preview.snapshot;
  if(!snap) return;
  APPEARANCE_KEYS.forEach(key=>{
    try{
      if(snap[key]==null) localStorage.removeItem(key);
      else localStorage.setItem(key,snap[key]);
    }catch{}
  });
  preview.snapshot=null;
  window.BIGLWAStudioAppearance?.apply?.();
}

function applyLook(look){
  if(!look || typeof look!=="object") return;
  const mirror=look.appearance||{},wallpaper=look.wallpaper||{};
  const appearance={};
  if(mirror.widgetColor) appearance.color=mirror.widgetColor;
  if(mirror.widgetRadius!=null) appearance.radius=mirror.widgetRadius;
  if(mirror.widgetOpacity!=null) appearance.opacity=mirror.widgetOpacity;
  if(mirror.widgetBlur!=null) appearance.blur=mirror.widgetBlur;
  if(mirror.auraColor) appearance.aura=mirror.auraColor;
  const hasAppearance=Object.keys(appearance).length>0;
  const hasWallpaper=Object.keys(wallpaper).some(key=>wallpaper[key]!==""&&wallpaper[key]!=null);
  if(!hasAppearance && !hasWallpaper) return;
  snapshotAppearance();
  window.BIGLWAStudioAppearance?.apply?.({appearance,wallpaper});
  }

/* ---------- banner ---------- */
const PREVIEW_CSS = `
.biglwa-preview-banner{position:fixed;top:0;left:0;right:0;z-index:100000;display:flex;align-items:center;gap:12px;padding:9px 14px;background:rgba(23,23,23,.96);color:#fbf8f2;font:500 12px/1.3 Inter,ui-sans-serif,system-ui,sans-serif;box-shadow:0 10px 30px rgba(20,14,12,.24);backdrop-filter:blur(6px)}
.biglwa-preview-banner p{margin:0;display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.biglwa-preview-banner strong{font-weight:700;font-size:12px}
.biglwa-preview-banner p span{color:#c9c2ba;font-size:11px}
.biglwa-preview-dot{width:9px;height:9px;border-radius:50%;background:#ef5f78;box-shadow:0 0 0 4px rgba(239,95,120,.22);flex:none}
.biglwa-preview-actions{display:flex;align-items:center;gap:7px;flex:none}
.biglwa-preview-actions button{border:1px solid rgba(251,248,242,.28);border-radius:999px;background:transparent;color:#fbf8f2;padding:6px 12px;font:700 10px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
.biglwa-preview-actions button:hover{background:rgba(251,248,242,.12)}
.biglwa-preview-actions .biglwa-preview-join{background:#ef5f78;border-color:#ef5f78;color:#fff}
.biglwa-preview-actions .biglwa-preview-join:hover{background:#e04a66}
.biglwa-preview-actions .biglwa-preview-close{border:0;font-size:15px;line-height:1;padding:4px 8px;text-transform:none;letter-spacing:0}
html.biglwa-preview-mode #studioApp [data-expand-widget],
html.biglwa-preview-mode #studioApp [data-open-widget-settings],
html.biglwa-preview-mode #studioApp [data-dock-widget],
html.biglwa-preview-mode #studioApp [data-rearrange-widget],
html.biglwa-preview-mode #studioApp #editProfileBtn{cursor:not-allowed}
.biglwa-prompt-backdrop{position:fixed;inset:0;z-index:100001;display:grid;place-items:center;padding:20px;background:rgba(28,20,18,.52);backdrop-filter:blur(3px)}
.biglwa-prompt-card{width:min(430px,100%);border-radius:20px;background:#fbf8f2;color:#171717;padding:24px 22px 18px;box-shadow:0 26px 70px rgba(20,14,12,.34);border:1px solid rgba(23,23,23,.08)}
.biglwa-prompt-card h3{margin:0 0 8px;font:700 19px/1.2 "CS Bergamot Stitched",Georgia,serif}
.biglwa-prompt-card p{margin:0 0 16px;font:400 13px/1.55 Inter,ui-sans-serif,system-ui,sans-serif;color:#4c443f}
.biglwa-prompt-handle{font:700 10px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a2958c}
.biglwa-prompt-card .biglwa-prompt-handle{display:block;margin-bottom:9px}
.biglwa-prompt-actions{display:flex;flex-wrap:wrap;gap:8px}
.biglwa-prompt-actions button{border-radius:999px;padding:10px 16px;font:700 11px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;border:1px solid rgba(23,23,23,.16);background:transparent;color:#171717}
.biglwa-prompt-actions .biglwa-prompt-join{background:#171717;border-color:#171717;color:#fbf8f2}
.biglwa-prompt-actions .biglwa-prompt-join:hover{background:#ef5f78;border-color:#ef5f78}
.biglwa-prompt-actions .biglwa-prompt-skip{margin-left:auto;border:0;color:#8d837c;text-transform:none;letter-spacing:0}
`;

function ensureStyles(){
  if($("#biglwaPreviewStyles")) return;
  const style=document.createElement("style");
  style.id="biglwaPreviewStyles";
  style.textContent=PREVIEW_CSS;
  document.head.appendChild(style);
}

function buildBanner(){
  ensureStyles();
  let banner=$("#biglwaPreviewBanner");
  if(banner) banner.remove();
  const handle="@"+(preview.profile?.username||preview.username);
  banner=document.createElement("div");
  banner.id="biglwaPreviewBanner";
  banner.className="biglwa-preview-banner";
  banner.setAttribute("role","status");
  banner.innerHTML='<span class="biglwa-preview-dot" aria-hidden="true"></span>'+
    "<p><strong>Previewing "+handle+"'s studio</strong><span>Look around. Making it yours takes a free BIGLWA account.</span></p>"+
    '<div class="biglwa-preview-actions">'+
      '<button type="button" class="biglwa-preview-join" data-preview-join>Create account</button>'+
      '<button type="button" data-preview-signin>Sign in</button>'+
      '<button type="button" class="biglwa-preview-close" data-preview-leave aria-label="Leave preview">×</button>'+
    '</div>';
  document.body.appendChild(banner);
  banner.addEventListener("click",event=>{
    const button=event.target.closest("button");
    if(!button) return;
    if(button.hasAttribute("data-preview-join")){ leaveToAuth("create"); return; }
    if(button.hasAttribute("data-preview-signin")){ leaveToAuth("signin"); return; }
    if(button.hasAttribute("data-preview-leave")){ standDown(); history.replaceState({},"","/"); showLoginScreen(); }
  });
}

function removeBanner(){
  $("#biglwaPreviewBanner")?.remove();
}

/* ---------- account prompt ---------- */
function promptCopy(reason){
  const handle="@"+(preview.profile?.username||preview.username);
  return {
    handle:reason,
    body:"You are browsing "+handle+"'s studio as a guest. Create a free account to "+reason.toLowerCase()+" and make the space your own."
  };
}

function openPrompt(reason){
  if(!preview.active || preview.promptOpen) return;
  closePrompt(true);
  preview.lastReason=reason||"";
  preview.promptOpen=true;
  const copy=promptCopy(reason);
  let backdrop=$("#biglwaPrompt");
  if(!backdrop){
    backdrop=document.createElement("div");
    backdrop.id="biglwaPrompt";
    document.body.appendChild(backdrop);
  }
  backdrop.className="biglwa-prompt-backdrop";
  backdrop.innerHTML='<div class="biglwa-prompt-card" role="dialog" aria-modal="true" aria-labelledby="biglwaPromptTitle">'+
    '<span class="biglwa-prompt-handle">'+copy.handle+'</span>'+
    '<h3 id="biglwaPromptTitle">Create an account to continue</h3>'+
    '<p>'+copy.body+'</p>'+
    '<div class="biglwa-prompt-actions">'+
      '<button type="button" class="biglwa-prompt-join" data-prompt-join>Create account</button>'+
      '<button type="button" data-prompt-signin>Sign in</button>'+
      '<button type="button" class="biglwa-prompt-skip" data-prompt-skip>Not now</button>'+
    '</div></div>';
  backdrop.addEventListener("click",event=>{
    if(event.target===backdrop){ closePrompt(); return; }
    const button=event.target.closest("button");
    if(!button) return;
    if(button.hasAttribute("data-prompt-join")) leaveToAuth("create");
    else if(button.hasAttribute("data-prompt-signin")) leaveToAuth("signin");
    else closePrompt();
  });
  $("[data-prompt-join]",backdrop)?.focus();
}

function closePrompt(silent){
  const backdrop=$("#biglwaPrompt");
  if(backdrop) backdrop.remove();
  preview.promptOpen=false;
  if(silent) return;
}

/* ---------- interaction gate ---------- */
function gateReason(target,kind){
  if(!target || !target.closest) return "";
  if(target.closest("#biglwaPreviewBanner,#biglwaPrompt")) return "";
  /* Profile music stays free for guests. Its file pickers are rendered inside the
     profile editor, and the card's play button opens them programmatically. */
  if(target.closest(".music-card,.music-file-actions,#studioTrackInput,#studioCoverInput")) return "";
  const app=studioApp();
  if(!app || !app.contains(target)) return "";
  const widgetControl=target.closest("[data-expand-widget],[data-open-widget-settings],[data-minimize-widget],[data-dock-widget],[data-rearrange-widget],[data-restore-widget],[data-add-shortcut],[data-remove-shortcut],[data-studio-drag-handle]");
  if(widgetControl) return "enlarge and arrange widgets";
  if(target.closest("[data-open-guest]")) return "leave a message";
  if(target.closest("#editProfileBtn,[data-profile-editor-tab],[data-profile-editor-pane],.profile-editor")) return "edit profiles";
  const form=target.closest("form");
  if(form){
    if(kind==="focus") return "leave a message";
    return "post in modules";
  }
  if(target.closest("[contenteditable]")) return "edit widgets";
  if(kind==="focus" && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName||"")) return "fill in details";
  return "";
}

function stopEvent(event){
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function gateEvent(kind){
  return event=>{
    if(!preview.active || preview.signedIn || preview.promptOpen) return;
    const reason=gateReason(event.target,kind);
    if(!reason) return;
    stopEvent(event);
    openPrompt(reason);
  };
}

/* Typing into member-only fields, and shortcuts on widget controls, both need an account. */
function gateKeydown(event){
  if(!preview.active || preview.signedIn) return;
  if(event.key==="Escape"){
    if(preview.promptOpen){ stopEvent(event); closePrompt(); }
    return;
  }
  const typing=event.key.length===1 || event.key==="Backspace" || event.key==="Delete";
  if(!typing) return;
  const field=event.target?.closest?.("#studioApp input,#studioApp textarea,#studioApp select,#studioApp [contenteditable],.music-file-actions");
  const control=event.target?.closest?.("[data-expand-widget],[data-open-widget-settings],[data-minimize-widget],[data-dock-widget],[data-rearrange-widget],[data-restore-widget],[data-add-shortcut],[data-remove-shortcut],[data-studio-drag-handle]");
  const gated=field||control;
  if(!gated) return;
  const reason=gateReason(gated,field?"focus":"key");
  if(!reason) return;
  stopEvent(event);
  openPrompt(reason);
}

function bindGate(){
  unbindGate();
  preview.abort=new AbortController();
  const signal=preview.abort.signal;
  ["click","submit","focusin"].forEach(type=>window.addEventListener(type,gateEvent(type),{capture:true,signal}));
  window.addEventListener("keydown",gateKeydown,{capture:true,signal});
}

function unbindGate(){
  if(!preview.abort) return;
  preview.abort.abort();
  preview.abort=null;
}

/* ---------- lifecycle ---------- */
function standDown(){
  if(!preview.active) return;
  preview.active=false;
  clearInterval(preview.timer);
  preview.timer=0;
  unbindGate();
  closePrompt(true);
  removeBanner();
  document.documentElement.classList.remove("biglwa-preview-mode");
  restoreAppearance();
  const me=localProfile();
  applyIdentity({
    name:clean(me.name)||"BIGLWA",
    username:clean(me.username),
    bio:clean(me.bio),
    location:clean(me.location),
    website:clean(me.website),
    mood:clean(me.mood),
    moodStyle:clean(me.moodStyle),
    auraText:me.auraText!=null?clean(me.auraText):"Focused\nbut dreaming."
  });
}

function leaveToAuth(mode){
  standDown();
  preview.nextMode=mode;
  history.replaceState({},"","/");
  showLoginScreen();
}

async function checkSignedIn(){
  if(!preview.active || preview.signedIn || preview.checking) return;
  if(Date.now()-preview.lastCheck<4000) return;
  preview.checking=true;
  preview.lastCheck=Date.now();
  try{
    const profile=await directory()?.loadProfile?.();
    if(profile){ preview.signedIn=true; standDown(); }
  }catch{}
  preview.checking=false;
}

/* The live router treats every /name route as the signed-in owner, so label the guest
   affordance correctly while the account gate keeps the action itself closed. */
function decorateGuestCard(){
  const card=$("#guestCheckWidget")||$("#studioApp .guest-check-card");
  if(!card) return;
  card.dataset.profileRelationship="visitor";
  const action=$(".visitor-log-actions [data-open-guest=check]",card)||$("[data-open-guest=check]",card);
  if(!action) return;
  if($(".visitor-log-actions",card)) action.textContent="Say you wuz here";
  action.setAttribute("aria-label","Leave a Guest Check entry on this profile");
  action.setAttribute("title","Leave a Guest Check entry on this profile");
}

function enforce(){
  if(!preview.active) return;
  const app=studioApp();
  if(!app) return;
  const live=pathUsername(location.pathname);
  if(live!==preview.username){
    if(location.pathname==="/studio"){
      preview.lastCheck=0;
      checkSignedIn();
      if(preview.signedIn){ standDown(); return; }
    }else if(live){
      standDown();
      return;
    }
  }
  if(!app.classList.contains("is-active") || loginPage()?.classList.contains("is-active")) showStudioScreen();
  if(location.pathname!==preview.path) history.replaceState({},"",preview.path);
  if(preview.title && document.title!==preview.title) document.title=preview.title;
  decorateGuestCard();
  checkSignedIn();
}

function activate(profile){
  preview.profile=profile;
  preview.username=profile.username||preview.username;
  preview.path=entryPath();
  preview.title="@"+preview.username+"'s Studio - BIGLWA";
  preview.active=true;
  document.documentElement.classList.add("biglwa-preview-mode");
  showStudioScreen();
  applyIdentity(profile);
  applyLook(profile.look);
  buildBanner();
  bindGate();
  window.addEventListener("pagehide",restoreAppearance,{once:true});
  document.title=preview.title;
  enforce();
  preview.timer=setInterval(enforce,700);
  window.addEventListener("popstate",standDown);
  document.addEventListener("biglwa:user-directory-ready",checkSignedIn);
  setTimeout(checkSignedIn,1200);
}

function noticeMissing(username){
  const message=$("#loginMessage");
  if(message){
    message.textContent="We could not find @"+username+" on BIGLWA. Check the spelling, or make an account and claim it.";
  }
}

async function boot(){
  const username=pathUsername();
  if(!username) return;
  preview.username=username;
  const moved=()=>{const live=pathUsername(location.pathname);return !!live && live!==username;};
  const dir=await waitFor(()=>window.BigLWAUserDirectory?.loadPublicProfile?window.BigLWAUserDirectory:null);
  if(!dir || moved()) return;
  let mine=null;
  try{ mine=await dir.loadProfile(); }catch{}
  if(mine){ preview.signedIn=true; return; }
  const profile=await dir.loadPublicProfile(username);
  if(moved()) return;
  if(!profile){ noticeMissing(username); return; }
  const app=await waitFor(()=>studioApp()&&$("#studioApp .profile-card")?studioApp():null);
  if(!app || moved()) return;
  activate(profile);
}

window.BigLWAStudioPreview={
  state:()=>({active:preview.active,username:preview.username,promptOpen:preview.promptOpen,lastReason:preview.lastReason}),
  standDown,
  prompt:reason=>openPrompt(reason||"use the studio")
};

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
