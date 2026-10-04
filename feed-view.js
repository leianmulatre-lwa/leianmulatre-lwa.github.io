async function deletePost(post, action) {
  if (!window.confirm("Delete this post and its photos?")) return;
  action.disabled = true;
  try {
    const { db, doc, deleteDoc } = await firebase();
    await deleteDoc(doc(db, "posts", post.id));
    if (identity()?.uid === post.uid) await deleteDoc(doc(db, "users", post.uid, "posts", post.id));
    const keys = Array.isArray(post.imageKeys)
      ? post.imageKeys.filter(Boolean)
      : (post.imageKey ? [post.imageKey] : []);
    for (const key of keys) await removeImage(key);
    posts = posts.filter((p) => p.id !== post.id);
    renderPosts();
    say("Post removed.", "good");
  } catch (error) {
    action.disabled = false;
    say(error.message || "That post could not be removed.", "bad");
  }
}
async function deletePost(post, action) {
  if (!window.confirm("Remove this post from the Collective Feed? It will stay in your Archive for 30 days before deletion.")) return;
  action.disabled = true;
  try {
    const orbit = window.__biglwaOrbitPosts;
    if (post.orbitImported && orbit?.removeOrbitPost) {
      await orbit.removeOrbitPost(post.id);
    } else {
      const { db, doc, updateDoc, setDoc, getDoc, serverTimestamp } = await firebase();
      const rootSnap = await getDoc(doc(db, "posts", post.id));
      const current = rootSnap.exists() ? rootSnap.data() || {} : {};
      const deletionAt = current.deletionAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const stamp = serverTimestamp();
      await updateDoc(doc(db, "posts", post.id), { state: "pending_delete", deletionAt, updatedAt: stamp });
      await setDoc(doc(db, "users", post.uid || identity().uid, "posts", post.id), { state: "pending_delete", deletionAt, updatedAt: stamp }, { merge: true });
      await setDoc(doc(db, "users", post.uid || identity().uid, "archive", post.id), {
        ...current,
        state: "pending_delete",
        archiveState: "pending_delete",
        deletionAt,
        updatedAt: stamp
      }, { merge: true });
    }
    posts = posts.filter((p) => p.id !== post.id);
    renderPosts(true);
    renderHero(true);
    say("Removed from Collective Feed. Your Archive now shows a 30-day deletion warning.", "good");
    window.dispatchEvent(new CustomEvent("biglwa:orbit-state-changed", { detail: { id: post.id, state: "pending_delete" } }));
  } catch (error) {
    action.disabled = false;
    say(error.message || "That post could not be scheduled for deletion.", "bad");
  }
}
/* Green opens the post large. A link opens whichever picture is showing at full size. */
let lightbox = null;
function openLightbox(post, index) {
  closeLightbox();
  const urls = slideUrls(post);
  if (!urls.length) return;
  const many = urls.length > 1;
  const box = document.createElement("div");
  box.className = "biglwa-lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Show photo");
  box.innerHTML =
    '<button type="button" class="biglwa-lightbox-close" data-lightbox-close aria-label="Close">&#215;</button>' +
    '<div class="biglwa-lightbox-stage">' +
    '<img src="" alt="">' +
    '<span class="biglwa-lightbox-count"></span>' +
    (many
      ? '<button type="button" class="biglwa-lightbox-arrow prev" data-lightbox-step="-1" aria-label="Previous photo">&#8249;</button>' +
        '<button type="button" class="biglwa-lightbox-arrow next" data-lightbox-step="1" aria-label="Next photo">&#8250;</button>'
      : "") +
    "</div>" +
    '<div class="biglwa-lightbox-meta">' +
    '<a class="biglwa-lightbox-view" target="_blank" rel="noopener noreferrer">View full size</a>' +
    "</div>";
  document.body.appendChild(box);
  lightbox = { box, urls, index: 0 };

  const img = box.querySelector("img");

  const go = (next) => {
    if (!lightbox) return;
    lightbox.index = (next + urls.length) % urls.length;
    const url = urls[lightbox.index];
    img.src = url;
    img.alt = "Collective feed media (" + (lightbox.index + 1) + "/" + urls.length + ")";
    box.querySelectorAll("[data-lightbox-step]").forEach((button) => {
      button.disabled = !many;
      button.style.display = many ? "" : "none";
    });
    const count = box.querySelector(".biglwa-lightbox-count");
    count.textContent = (lightbox.index + 1) + " / " + urls.length;
    count.hidden = !many;
    const view = box.querySelector(".biglwa-lightbox-view");
    view.href = url;
  };

  box.addEventListener("click", (event) => {
    const step = event.target.closest("[data-lightbox-step]");
    if (step) { go(lightbox.index + Number(step.dataset.lightboxStep)); return; }
    if (event.target === box || event.target.closest("[data-lightbox-close]")) closeLightbox();
  });

  go(index || 0);
  box.querySelector(".biglwa-lightbox-close").focus({ preventScroll: true });
  document.documentElement.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.box.remove();
  lightbox = null;
  document.documentElement.style.overflow = "";
}

/* Wires the composer and the three card actions exactly once per rendered feed, and only
   when the element is a new one. The route re-renders its markup on every visit, so
   identity of the element is what tells a fresh form from one that is already wired. */
let wiredList = null;
async function wire(list, form) {
  installStyle();
  if (!list) return;
  if (form) upgradeComposer(form);
  const draftPanel = document.getElementById("biglwaOrbitDrafts");
  if (draftPanel && !draftPanel.dataset.bigWired) {
    draftPanel.dataset.bigWired = "1";
    draftPanel.addEventListener("click", async (event) => {
      const bulk = event.target.closest("[data-orbit-publish-selected]");
      if (!bulk) return;
      const ids = Array.from(draftPanel.querySelectorAll("[data-orbit-draft-check]:checked")).map((input) => input.value);
      if (!ids.length) { say("Choose at least one imported post.", "bad"); return; }
      bulk.disabled = true;
      try {
        for (const id of ids) await publishDraft(id);
        say(ids.length + (ids.length === 1 ? " post" : " posts") + " added to the collective feed.", "good");
        await loadPosts();
      } catch (error) {
        say(error.message || "Those posts could not be published.", "bad");
      } finally {
        bulk.disabled = false;
      }
    });
  }
  if (list !== wiredList) {
    wiredList = list;
    list.addEventListener("click", (event) => {
      const instaTab = event.target.closest("[data-instagram-slide]");
      if (instaTab) {
        const card = instaTab.closest(".biglwa-instagram-card");
        const post = card && posts.find((p) => p.id === card.dataset.postId);
        const index = Number(instaTab.dataset.instagramSlide);
        const frame = card && card.querySelector("[data-biglwa-slideshow]");
        if (post && frame && Number.isInteger(index)) {
          const photos = Array.from(frame.querySelectorAll("img"));
          const dots = Array.from(frame.querySelectorAll(".biglwa-slide-dot i"));
          const count = frame.querySelector(".biglwa-slide-count");
          if (photos[index]) {
            photos.forEach((img, i) => img.classList.toggle("is-on", i === index));
            dots.forEach((dot, i) => dot.classList.toggle("is-on", i === index));
            if (count) count.textContent = (index + 1) + " / " + photos.length;
            card.querySelectorAll("[data-instagram-slide]").forEach((tab) => tab.classList.toggle("is-active", tab === instaTab));
          }
        }
        return;
      }
      const action = event.target.closest("[data-post-enlarge],[data-post-archive],[data-post-delete]");
      if (action) {
        const card = action.closest(".biglwa-pin-post");
        const post = card && posts.find((p) => p.id === card.dataset.postId);
        if (!post) return;
        if (action.hasAttribute("data-post-enlarge")) openLightbox(post, 0);
        else if (action.hasAttribute("data-post-archive")) archivePost(post, action);
        else if (action.hasAttribute("data-post-delete")) deletePost(post, action);
        return;
      }
      const card = event.target.closest(".biglwa-pin-post");
      if (!card || !event.target.closest("img,.biglwa-pin-empty")) return;
      const post = posts.find((p) => p.id === card.dataset.postId);
      if (post) openLightbox(post, 0);
    });
    if (!window.__biglwaMenuCloser) {
      window.__biglwaMenuCloser = true;
      /* A single shared handler gives the lightbox one Escape key and its own arrows. */
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeLightbox();
        if (!lightbox) return;
        if (event.key === "ArrowLeft") {
          const prev = lightbox.box.querySelector("[data-lightbox-step='-1']");
          if (prev) prev.click();
        }
        if (event.key === "ArrowRight") {
          const next = lightbox.box.querySelector("[data-lightbox-step='1']");
          if (next) next.click();
        }
      });
    }
  }
  renderPosts();
}

/* The feed is a route the studio renders on demand, so the composer does not exist yet when
   this module starts and nothing further would ever arrive to wake it. Watching for the
   form is what makes the picture picker turn up when the feed is opened.

   The observer is deliberately narrow. It fires on every mutation, including the ones this
   module makes itself when it draws a card, so it must not do any work unless it is looking
   at a form it has not seen before. Otherwise drawing a post triggers a load, which draws a
   post, and the feed never stops. */
let seenForm = null;
function observeFeed() {
  const tick = () => {
    const form = document.getElementById("feedComposer");
    if (!form || form === seenForm) return;
    seenForm = form;
    wire(document.getElementById("feedPageList"), form);
    if (identity()) loadPosts();
  };
  new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });
  tick();
}

function watch() {
  const form = document.getElementById("feedComposer");
  if (form && form !== seenForm) {
    seenForm = form;
    wire(document.getElementById("feedPageList"), form);
  }
  if (typeof window.BIGLWAFeedMount === "function") {
    /* Source cards join the same masonry. The marker keeps the shared mount from
       treating our own cards as a source that failed to render. */
    window.BIGLWAFeedMount("Feed posts", "biglwa-pin-post", () => renderPosts());
  }
}

/* The composer and the masonry are set up the moment the module evaluates. None of that
   needs an account: a visitor should see the same feed, and waiting on the identity to
   resolve is what previously left the picture picker missing for a signed-out reader.
   Only the parts that read or write posts wait for the account. */
installStyle();
observeFeed();

let booted = false;
export async function startFeed() {
  /* account-boot also starts this, so starting twice must not leave two observers and
     two sets of listeners fighting over the same list. */
  if (booted) return window.__biglwaFeed;
  booted = true;
  startIdentity();
  onIdentityChange((who) => {
    watch();
    if (who) loadPosts();
    else {
      posts = [];
      draftPosts = [];
      renderPosts(true);
    }
  });
  watch();
  if (identity()) await loadPosts();
  window.__biglwaFeed = { loadPosts, renderPosts, refresh: loadPosts };
  return window.__biglwaFeed;
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startFeed, { once: true });
else startFeed();

export default startFeed;
