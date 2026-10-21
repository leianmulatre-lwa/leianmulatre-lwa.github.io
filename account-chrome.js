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
const initial = (name) => clean(name).replace(/^@/, "").charAt(0).toLocaleUpperCase() || "B";

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
  } else {
    el.style.backgroundImage = "";
    el.classList.remove("has-photo");
  }
  el.setAttribute("title", clean(name));
  el.setAttribute("aria-label", clean(name) + " profile picture");
}

export function renderIdentityChrome(profile) {
  const who = profile || identity() || {};
  const realName=clean(who.name);
  const username=clean(who.username).replace(/^@/,"");
  const name=realName && realName.toLowerCase()!==username.toLowerCase() ? realName : "";
  const avatarName=name || "BIG LWA";
  // Banner and top-right greeting must paint the exact same photo URL and
  // name initial; the @handle is a separate identifier, never the letter.
  avatarTargets().forEach((el) => renderAvatar(el, who.avatarUrl, avatarName));
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
  document.addEventListener("biglwa:identity-preview", () => { if (!previewOverride) renderIdentityChrome(identity()); });
}

export default { renderAvatar, renderIdentityChrome, showPreviewIdentity, clearPreviewIdentity, startChrome, isPreviewingIdentity, CHROME_KEYS };
