/* BIGLWA identity chrome
 * Paints the signed-in member's name and picture onto the places the studio repeats them:
 * the top-right chip, the big profile avatar, and the small card avatar.
 *
 * A previewing visitor must see the profile they are looking at rather than their own
 * account, so the preview can hold an override and hand it back when the preview ends.
 */
import { identity, onIdentityChange } from "./account-identity.js";

const CHROME_KEYS = ["biglwa-preview-identity"];

let previewOverride = null;

const clean = (v) => String(v || "").trim();
const initial = (name) => Array.from(clean(name))[0]?.toLocaleUpperCase() || "";

function avatarTargets() {
  return [...document.querySelectorAll("#studioApp .mini-avatar, #studioApp .profile-avatar")];
}

export function renderAvatar(el, url, name) {
  if (!el) return;
  const letter = initial(name);
  const photo = clean(url);
  if(el.textContent !== (photo ? "" : letter))el.textContent = photo ? "" : letter;
  if(!photo)el.style.fontFamily='"CS Bergamot Stitched",Georgia,serif';
  if (photo) {
    el.style.backgroundImage = `url("${photo.replace(/"/g, "")}")`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    el.classList.add("has-photo");
    el.classList.remove("lwa-default-tv-avatar");
  } else {
    // One exact fallback image for the profile rail and top-right chip.
    // The owner's capital initial remains visible above the TV bars.
    el.style.backgroundImage = 'linear-gradient(rgba(10,7,13,.12),rgba(10,7,13,.4)),url("/assets/tv-no-signal.svg")';
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    el.classList.remove("has-photo");
    el.classList.add("lwa-default-tv-avatar");
  }
  el.setAttribute("title", clean(name));
  el.setAttribute("aria-label", clean(name) + " profile picture");
}


/* Every member's Journal cover gets their chosen display-name initial. */
function renderJournalCoverInitial(name){
  const cover=document.querySelector('#studioApp #diary .diary-page');
  if(!cover)return;
  const value=initial(name);
  let mark=cover.querySelector('.studio-journal-initial');
  if(!mark){
    mark=document.createElement('span');mark.className='studio-journal-initial';
    mark.setAttribute('aria-hidden','true');cover.append(mark);
  }
  if(mark.textContent!==value)mark.textContent=value;
}
function installJournalCoverStyle(){
  if(document.getElementById('biglwa-journal-cover-initial-style'))return;
  const style=document.createElement('style');style.id='biglwa-journal-cover-initial-style';
  style.textContent="#studioApp #diary .diary-page{position:relative!important;isolation:isolate}\n#studioApp #diary .studio-journal-initial{\n position:absolute!important;left:50%!important;top:51%!important;transform:translate(-50%,-50%)!important;\n display:grid;place-items:center;font:400 clamp(29px,4.5vw,67px)/1 \"CS Bergamot Stitched\",Georgia,serif!important;\n color:#543448!important;text-shadow:0 2px 0 #e7c7b3!important;pointer-events:none!important;\n z-index:2!important;min-width:35px!important}\nhtml.biglwa-preview-mode #studioApp #diary .studio-journal-initial{display:none!important}";
  document.head.append(style);
}

export function renderIdentityChrome(profile) {
  const who = profile || identity() || {};
  const realName=clean(who.name);
  const username=clean(who.username).replace(/^@/,"");
  const name=realName && realName.toLowerCase()!==username.toLowerCase() ? realName : "";
  // No handle, logo or placeholder monogram can replace the member-chosen name.
  const avatarName=name;
  // Banner and top-right greeting must paint the exact same photo URL and
  // name initial; the @handle is a separate identifier, never the letter.
  avatarTargets().forEach((el) => renderAvatar(el, who.avatarUrl, avatarName));
  installJournalCoverStyle();
  renderJournalCoverInitial(name);
  const welcome = document.querySelector(".profile-mini .welcome strong") || document.querySelector(".welcome strong");
  if (welcome) welcome.textContent = name ? name.charAt(0).toUpperCase() + name.slice(1) : "there";
  const avatar = document.querySelector(".profile-mini .mini-avatar");
  if (avatar) renderAvatar(avatar, who.avatarUrl, avatarName);
  const handle = document.querySelector(".profile-rail-username, .profile-name-line h1");
  if (handle && who.username) handle.textContent = "@" + clean(who.username).replace(/^@/, "");
}

/* Called while previewing somebody else's studio. */
export function showPreviewIdentity(profile) {
  previewOverride = profile ? { ...profile } : null;
  if (previewOverride) renderIdentityChrome(previewOverride);
}

export function clearPreviewIdentity() {
  previewOverride = null;
  renderIdentityChrome(identity());
}

export function isPreviewingIdentity() {
  return previewOverride !== null;
}

export function startChrome() {
  onIdentityChange(() => {
    if (!previewOverride) renderIdentityChrome(identity());
  });
  renderIdentityChrome(identity());
  // Repaint after an asynchronously mounted Journal widget appears.
  let pending=false;
  new MutationObserver(()=>{
    if(pending)return;pending=true;
    requestAnimationFrame(()=>{
      pending=false;
      const who=previewOverride||identity()||{};
      const real=clean(who.name),username=clean(who.username);
      renderJournalCoverInitial(real&&real.toLowerCase()!==username.toLowerCase()?real:"");
    });
  }).observe(document.getElementById('studioApp')||document.body,{childList:true,subtree:true});
  document.addEventListener("biglwa:identity-preview", () => { if (!previewOverride) renderIdentityChrome(identity()); });
}

export default { renderAvatar, renderIdentityChrome, showPreviewIdentity, clearPreviewIdentity, startChrome, isPreviewingIdentity, CHROME_KEYS };
