/* BIGLWA account boot
 * One entry point that starts the per-account identity, paints it onto the studio chrome,
 * loads the stored profile photo, and mirrors the connected Orbit sources onto the
 * account. Registered after the studio markup exists.
 */
import { startIdentity, refreshIdentity, identity } from "./account-identity.js";
import { startChrome, renderIdentityChrome } from "./account-chrome.js";
import { loadProfilePhoto } from "./account-photo.js";
import { startConnections } from "./orbit-connections.js";
import { startFeed } from "./feed-view.js?v=20261002-source-colors-strip-1";

function boot() {
  startIdentity();
  startChrome();
  refreshIdentity().then((who) => {
    if (who) {
      renderIdentityChrome(who);
      loadProfilePhoto();
    }
  });
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
