/* Developer Console landing. Read-only server-enforced gate; no sending or admin writes. */
const CONFIG = {
  apiKey:"AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY",
  authDomain:"biglwa.firebaseapp.com",projectId:"biglwa",
  appId:"1:83232670555:web:e04927b20458390b3b507e"
};
const el = id => document.getElementById(id);
let check = 0;
function denied(title, detail, showLink = false, status = "RESTRICTED") {
  el("developerHome").hidden = true;
  el("accessPanel").hidden = false;
  el("accessTitle").textContent = title;
  el("accessMessage").textContent = detail;
  el("accessLink").hidden = !showLink;
  el("sessionState").textContent = status;
}
function allowed() {
  el("accessPanel").hidden = true;
  el("developerHome").hidden = false;
  el("sessionState").textContent = "DEVELOPER ACCESS ✓";
}
async function boot() {
  try {
    const [appSdk, authSdk, storeSdk] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js")
    ]);
    const app = appSdk.getApps().find(a => a.options.projectId === "biglwa") ||
      appSdk.initializeApp(CONFIG);
    const auth = authSdk.getAuth(app);
    const db = storeSdk.getFirestore(app);
    authSdk.onAuthStateChanged(auth, async member => {
      const token = ++check;
      if (!member) {
        denied("This door needs a key.", "Sign in to Big LWA first, then return to the Developer Console.", true, "SIGNED OUT");
        return;
      }
      el("sessionState").textContent = "CHECKING PERMISSIONS";
      try {
        const doc = await storeSdk.getDoc(storeSdk.doc(db, "developerAdmins", member.uid));
        if (token !== check) return;
        if (!doc.exists() || doc.data().active !== true) {
          denied("Staff only, bookini.", "This account is not authorized for the Developer Console.");
          return;
        }
        allowed();
      } catch {
        if (token !== check) return;
        denied("Couldn't check your key.", "We couldn't verify developer permission. Check your connection and Firestore rules, then refresh.", false, "ACCESS ERROR");
      }
    }, () => denied("Authentication unavailable.", "Big LWA couldn't restore your session. Please reload the page.",false,"ACCESS ERROR"));
  } catch {
    denied("The key desk is offline.", "Firebase couldn't load. Your ordinary Big LWA login remains unchanged.",false,"OFFLINE");
  }
}
boot();
