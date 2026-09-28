/* BIGLWA settings: profile photo controls.
 * Kept apart from settings-account.js because the photo pipeline is a module that shares
 * the account identity and chrome with the studio.
 */
import { uploadProfilePhoto, removeProfilePhoto, loadProfilePhoto } from "./account-photo.js";
import { onIdentityChange, identity, startIdentity } from "./account-identity.js";
import { onConnectionsChange, forget, startConnections } from "./orbit-connections.js";

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

const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function counts(stats) {
  if (!stats) return "";
  const part = (label, value) => (value == null ? "" : label + " " + Number(value).toLocaleString());
  const bits = [part("followers", stats.followers), part("posts", stats.mediaCount),
    part("boards", stats.boards), part("pins", stats.pins)].filter(Boolean);
  return bits.length ? " · " + bits.join(" · ") : "";
}

function showConnections(list) {
  const card = document.getElementById("connectionsCard");
  const box = document.getElementById("connectionsList");
  if (!card || !box) return;
  const who = identity();
  const rows = Object.values(list || {});
  /* Connections live on the account, so they are only meaningful to a signed-in member.
     A visitor sees nothing rather than an empty panel that looks broken. */
  card.hidden = !who || !rows.length;
  if (card.hidden) return;
  box.innerHTML = rows.map((row) => {
    const name = esc(row.name || row.username || row.label);
    const handle = row.username ? "@" + esc(row.username) : "";
    const picture = row.avatarUrl
      ? '<img src="' + esc(row.avatarUrl) + '" alt="" width="52" height="52" style="border-radius:50%;object-fit:cover;flex:0 0 auto">'
      : '<span aria-hidden="true" style="width:52px;height:52px;border-radius:50%;flex:0 0 auto;background:#e6dcd1"></span>';
    return '<div class="identity" style="margin:12px 0 0" data-connection="' + esc(row.id) + '">' + picture +
      "<span><b>" + name + "</b> " + handle +
      '<span class="email">' + esc(row.label) + counts(row.stats) + "</span></span>" +
      '<button type="button" class="secondary" data-unlink="' + esc(row.id) + '">Unlink</button></div>';
  }).join("");
}

function start() {
  const input = el("photoInput");
  const remove = el("photoRemove");
  const status = el("photoStatus");
  if (!input) return;

  onIdentityChange(showFor);
  startIdentity();
  showFor(identity());

  onConnectionsChange(showConnections);
  startConnections();

  document.addEventListener("click", async (event) => {
    const button = event.target && event.target.closest ? event.target.closest("[data-unlink]") : null;
    if (!button) return;
    button.disabled = true;
    const previous = button.textContent;
    button.textContent = "Unlinking…";
    await forget(button.dataset.unlink);
    /* The row is removed by the connections change, so this only has to cover the case
       where it stays put, and say why nothing appeared to happen. */
    if (button.isConnected) {
      button.textContent = "Unlinked";
      setTimeout(() => { button.textContent = previous; button.disabled = false; }, 1600);
    }
  });

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
