/* BIGLWA account boot
 * One entry point that starts the per-account identity, paints it onto the studio chrome,
 * and loads the stored profile photo. Registered after the studio markup exists.
 */
import { startIdentity, refreshIdentity, identity } from "./account-identity.js";
import { startChrome, renderIdentityChrome } from "./account-chrome.js";
import { loadProfilePhoto } from "./account-photo.js";

function boot() {
  startIdentity();
  startChrome();
  refreshIdentity().then((who) => {
    if (who) {
      renderIdentityChrome(who);
      loadProfilePhoto();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}

export { identity };
export default boot;
