/* BIGLWA account boot
 * One entry point that starts the per-account identity, paints it onto the studio chrome,
 * loads the stored profile photo, and mirrors the connected Orbit sources onto the
 * account. Registered after the studio markup exists.
 */
import { startIdentity, refreshIdentity, identity } from "./account-identity.js";
import { startChrome, renderIdentityChrome } from "./account-chrome.js?v=20261026-journal-cover-init-1";
import { loadProfilePhoto } from "./account-photo.js?v=20261027-adjust-position-1";
import { startConnections } from "./orbit-connections.js?v=20261022-verified-followers-3&fix=public-youtube-1";
import { startFeed } from "./feed-view.js?v=20261023-tiktok-collective-refresh-9&fix=single-owner-shadow-1&viewport=2";

function boot() {
  startIdentity();
  startChrome();
  window.BigLWALoadingDots?.profile(true);
  refreshIdentity().then((who) => {
    if (who) {
      renderIdentityChrome(who);
      return Promise.resolve(loadProfilePhoto()).catch(()=>{});
    }
  }).catch(error=>{console.warn('Profile refresh failed',error)}).finally(()=>window.BigLWALoadingDots?.ready());
  /* Independent of the photo: a member with a connected source and no profile picture
     still needs their connections recorded and the feed available. */
  startConnections();
  startFeed();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}

export { identity };
export default boot;
