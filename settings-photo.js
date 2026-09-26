/* BIGLWA settings: profile photo controls.
 * Kept apart from settings-account.js because the photo pipeline is a module that shares
 * the account identity and chrome with the studio.
 */
import { uploadProfilePhoto, removeProfilePhoto, loadProfilePhoto } from "./account-photo.js";
import { onIdentityChange, identity, startIdentity } from "./account-identity.js";

const el = (id) => document.getElementById(id);
const say = (node, text, tone) => {
  if (!node) return;
  node.textContent = text;
  node.className = "status" + (tone ? " " + tone : "");
};

function paintPreview(url) {
  const preview = el("photoPreview");
  if (!preview) return;
  preview.textContent = "";
  if (url) {
    preview.style.backgroundImage = 'url("' + url + '")';
    preview.style.background = "";
  } else {
    preview.style.backgroundImage = "none";
    preview.style.background = "linear-gradient(145deg,#2c2523,#d18d6b)";
  }
}

function showFor(who) {
  const card = el("photoCard");
  if (!card) return;
  card.hidden = !who;
  if (!who) return;
  const name = el("photoName");
  if (name) name.textContent = (who.name || who.username || who.email || "Your profile");
  loadProfilePhoto().then((url) => paintPreview(url));
}

function start() {
  const input = el("photoInput");
  const remove = el("photoRemove");
  const status = el("photoStatus");
  if (!input) return;

  onIdentityChange(showFor);
  startIdentity();
  showFor(identity());

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    say(status, "Uploading your photo...", "");
    input.disabled = true;
    try {
      const saved = await uploadProfilePhoto(file);
      paintPreview(saved.url);
      say(status, "Photo saved. It now shows on your studio and in the top-right avatar.", "good");
    } catch (err) {
      say(status, err && err.message ? err.message : "That photo could not be saved.", "bad");
    } finally {
      input.disabled = false;
      input.value = "";
    }
  });

  if (remove) {
    remove.addEventListener("click", async () => {
      say(status, "Removing your photo...", "");
      try {
        await removeProfilePhoto();
        paintPreview("");
        say(status, "Photo removed. Your initials are back.", "good");
      } catch (err) {
        say(status, err && err.message ? err.message : "That photo could not be removed.", "bad");
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}

export default start;
