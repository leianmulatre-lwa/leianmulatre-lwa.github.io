/* The Mailroom UI never sends emails or stores SMTP credentials. */
import {
  TEMPLATE_IDS, FIELD_LIMITS, getDefaultTemplate, normalizeTemplate,
  validateTemplate, renderEmailHtml, renderPlainText
} from "./templates.js";
import {FIREBASE_READY_IDS,buildFirebaseNativeTemplate} from "./firebase-native.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY",
  authDomain: "biglwa.firebaseapp.com",
  projectId: "biglwa",
  appId: "1:83232670555:web:e04927b20458390b3b507e"
}; // Firebase browser config is public, NOT a service-account credential.
const $ = id => document.getElementById(id);
const form = $("letterForm");
const fields = Object.keys(FIELD_LIMITS);
const cache = new Map();
let activeId = "verify";
let activeRevision = 0;
let user = null;
let dbApi = null;
let dirty = false;
let requestId = 0;
let saving = false;

function message(text, isError = false) {
  const node = $("editorStatus");
  node.textContent = text;
  node.style.color = isError ? "#a32a36" : "#704e41";
}
function access(title, messageText, link = false) {
  $("mailroom").hidden = true;
  $("accessPanel").hidden = false;
  $("accessTitle").textContent = title;
  $("accessMessage").textContent = messageText;
  $("accessLink").hidden = !link;
}
function granted() {
  $("accessPanel").hidden = true;
  $("mailroom").hidden = false;
  $("sessionState").textContent = "DEVELOPER ACCESS ✓";
}
function lockEditor(locked) {
  for (const control of form.querySelectorAll('input,textarea,button')) control.disabled = locked;
  $('templateSelect').disabled = locked;
}
function currentData() {
  const t = {};
  for (const key of fields) t[key] = $(key).value;
  return t;
}
function fill(t) {
  for (const key of fields) $(key).value = t[key];
  dirty = false;
  message("");
  refreshPreview();
  updateFirebaseBridge();
}
function updateFirebaseBridge() {
  const supported = FIREBASE_READY_IDS.includes(activeId);
  for (const id of ["firebaseSubjectButton","firebaseHtmlButton","firebaseJsonButton"]) {
    const button = $(id);
    if (button) {
      button.disabled = !supported;
      button.title = supported ? "Creates copy only; does not publish" :
        "This security-event type needs a reviewed Firebase mapping before publication.";
    }
  }
}
function firebaseExport() {
  if (dirty) {
    message("Save your changes first so the publishing tool receives this exact cloud draft.",true);
    return null;
  }
  try {return buildFirebaseNativeTemplate(activeId,currentData());}
  catch(error) {message(error.message || "Could not prepare Firebase template.",true);return null;}
}
function refreshPreview() {
  const t = currentData();
  try {
    $("emailPreview").srcdoc = renderEmailHtml(t, {preview:true});
  } catch {
    $("emailPreview").srcdoc = '<!doctype html><meta charset="utf-8"><body style="font:14px Arial;padding:35px;color:#5e2427">Complete each field to preview your letter. 🤎</body>';
  }
}
async function loadTemplate(id) {
  const seq = ++requestId;
  activeId = id;
  $("templateSelect").value = id;
  if (cache.has(id)) {
    const item = cache.get(id);
    activeRevision = item.revision;
    fill(item.template);
    return;
  }
  fill(getDefaultTemplate(id));
  activeRevision = 0;
  if (!dbApi || !user) return;
  lockEditor(true);
  try {
    const snap = await dbApi.getDoc(dbApi.doc(dbApi.db, "developerMailTemplates", id));
    if (seq !== requestId || !user) return;
    const saved = snap.exists() ? snap.data() : null;
    const template = normalizeTemplate(id, saved);
    const revision = saved && Number.isSafeInteger(saved.revision) ? saved.revision : 0;
    cache.set(id, {template, revision});
    activeRevision = revision;
    fill(template);
    if (revision) message("Cloud draft loaded · revision " + revision);
    else message("Starting from L’wazi's default letter. Save to create a cloud draft.");
  } catch (error) {
    if (seq !== requestId) return;
    message("Cloud drafts unavailable. Check the Firestore rules deployment. " +
      (error.code === "permission-denied" ? "Permission denied." : "Please retry."), true);
  } finally {
    if (seq === requestId) lockEditor(false);
  }
}
async function saveDraft(event) {
  event.preventDefault();
  if (saving || !user || !dbApi) return;
  const template = currentData();
  if (!validateTemplate(template)) {
    message("Please complete all letter fields before saving.", true);
    return;
  }
  saving = true;
  $("saveButton").disabled = true;
  const id = activeId;
  const expectedRevision = activeRevision;
  try {
    const ref = dbApi.doc(dbApi.db, "developerMailTemplates", id);
    const revision = await dbApi.runTransaction(dbApi.db, async transaction => {
      const snapshot = await transaction.get(ref);
      const revisionNow = snapshot.exists() ? snapshot.data().revision : 0;
      if (revisionNow !== expectedRevision) {
        throw new Error("A newer cloud draft exists. Reload this template before editing again.");
      }
      const next = revisionNow + 1;
      transaction.set(ref, {
        ...template, revision: next, updatedBy: user.uid, updatedAt: dbApi.serverTimestamp()
      });
      return next;
    });
    activeRevision = revision;
    cache.set(id, {template:{...template},revision});
    dirty = false;
    message("Saved to the private developer collection · revision " + revision +
      ". This does not change Firebase's live email templates.");
  } catch (error) {
    message(error.message && error.message.includes("newer cloud") ? error.message :
      "Draft not saved. Check developer access, Firestore rules, and your connection.", true);
  } finally {
    saving = false;
    $("saveButton").disabled = false;
  }
}
function fileDownload(filename, mime, body) {
  const objectUrl = URL.createObjectURL(new Blob([body], {type:mime}));
  const a = document.createElement("a");
  a.href = objectUrl; a.download = filename; a.hidden = true;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
function exportData(kind) {
  const template = currentData();
  if (!validateTemplate(template)) {
    message("Fill in each field before exporting.", true); return;
  }
  const basename = "biglwa-" + activeId + "-draft";
  if (kind === "html") {
    fileDownload(basename + ".html", "text/html;charset=utf-8", renderEmailHtml(template));
  } else if (kind === "text") {
    fileDownload(basename + ".txt", "text/plain;charset=utf-8", renderPlainText(template));
  } else if (kind === "json") {
    fileDownload(basename + ".json", "application/json;charset=utf-8",
      JSON.stringify({id:activeId, schema:1, delivery:"not-connected", template},null,2));
  }
  message("Draft exported. The action link is intentionally a placeholder.");
}
form.addEventListener("input", () => { dirty = true; refreshPreview(); message("Unsaved changes — select Save draft to keep them in Firestore."); });
form.addEventListener("submit", saveDraft);
$("templateSelect").addEventListener("change", event => {
  const id = event.target.value;
  if (!TEMPLATE_IDS.includes(id)) return;
  if (dirty && !window.confirm("Discard your unsaved changes to this letter?")) {
    event.target.value = activeId; return;
  }
  loadTemplate(id);
});
$("restoreButton").addEventListener("click", () => {
  if (!window.confirm("Restore the default words for this letter? You can still save your changes afterward.")) return;
  fill(getDefaultTemplate(activeId));
  dirty = true;
  message("Default words restored in the editor. Not yet saved.");
});
$("copyButton").addEventListener("click", async () => {
  const t = currentData();
  if (!validateTemplate(t)) { message("Complete all fields before copying.",true); return; }
  try {
    await navigator.clipboard.writeText(renderEmailHtml(t));
    message("HTML copied with a placeholder for the security action URL.");
  } catch {
    message("Clipboard unavailable. Use Download HTML instead.", true);
  }
});
$("htmlButton").addEventListener("click", () => exportData("html"));
$("textButton").addEventListener("click", () => exportData("text"));
$("jsonButton").addEventListener("click", () => exportData("json"));

$("firebaseSubjectButton").addEventListener("click", async () => {
  const prepared=firebaseExport();if(!prepared)return;
  try {await navigator.clipboard.writeText(prepared.subject);
    message("Firebase subject copied. This has not changed the live email.");}
  catch {message("Clipboard unavailable.",true);}
});
$("firebaseHtmlButton").addEventListener("click", async () => {
  const prepared=firebaseExport();if(!prepared)return;
  try {await navigator.clipboard.writeText(prepared.body);
    message("Firebase HTML copied with its %LINK% action placeholder. This is not yet live.");}
  catch {message("Clipboard unavailable. Download Firebase template instead.",true);}
});
$("firebaseJsonButton").addEventListener("click", () => {
  const prepared=firebaseExport();if(!prepared)return;
  fileDownload("biglwa-"+activeId+"-firebase-preview.json","application/json;charset=utf-8",
    JSON.stringify({id:activeId,revision:activeRevision,
      target:prepared.target,subject:prepared.subject,
      body:prepared.body,bodyFormat:prepared.bodyFormat,
      delivery:"NOT_PUBLISHED",smtp:"UNMODIFIED"},null,2));
  message("Firebase-format letter exported. Not published; live email unchanged.");
});


async function boot() {
  try {
    const [appSdk, authSdk, storeSdk] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js")
    ]);
    const firebaseApp = appSdk.getApps().find(a => a.options.projectId === "biglwa") ||
      appSdk.initializeApp(FIREBASE_CONFIG);
    const auth = authSdk.getAuth(firebaseApp);
    dbApi = {
      db:storeSdk.getFirestore(firebaseApp), doc:storeSdk.doc,
      getDoc:storeSdk.getDoc, runTransaction:storeSdk.runTransaction,
      serverTimestamp:storeSdk.serverTimestamp
    };
    authSdk.onAuthStateChanged(auth, async signedIn => {
      const seq = ++requestId;
      user = null; cache.clear();
      if (!signedIn) {
        $("sessionState").textContent = "SIGNED OUT";
        access("This door needs a key.", "Sign in to Big LWA first, then come back to the Mailroom.",true);
        return;
      }
      $("sessionState").textContent = "CHECKING PERMISSIONS";
      try {
        const gate = await dbApi.getDoc(dbApi.doc(dbApi.db, "developerAdmins", signedIn.uid));
        if (seq !== requestId) return;
        if (!gate.exists() || gate.data().active !== true) {
          $("sessionState").textContent = "RESTRICTED";
          access("Staff only, bookini.", "Your account does not have developer-console access. This space is separate from ordinary Studio and moderation permissions.");
          return;
        }
        user = signedIn;
        granted();
        loadTemplate(activeId);
      } catch {
        if (seq !== requestId) return;
        $("sessionState").textContent = "ACCESS ERROR";
        access("We couldn't check your key.", "Confirm the developer Firestore rules were deployed, then refresh this page.");
      }
    });
  } catch {
    $("sessionState").textContent = "OFFLINE";
    access("Couldn't reach the key desk.", "Firebase is temporarily unavailable. Your existing Big LWA sign-in is unchanged.");
  }
}
boot();
