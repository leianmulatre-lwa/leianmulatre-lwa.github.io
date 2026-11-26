/* Optional @handle sign-in. This module sits beside the original credential
 * form: it never replaces Firebase Auth, it only resolves a public handle to a
 * verified account on the trusted Worker and hands the resulting custom token
 * back to the Firebase SDK. Email/password sign-in stays the default.
 */
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
  authDomain: 'biglwa.firebaseapp.com',
  projectId: 'biglwa',
  appId: '1:83232670555:web:e04927b20458390b3b507e'
};
const HANDLE_LOGIN_URL = 'https://api.biglwa.com/auth/handle-login';

export function normalizeHandle(value) {
  return String(value || '').trim().replace(/^@+/, '').toLowerCase();
}

export async function requestHandleCustomToken(handle, password, fetchImpl = globalThis.fetch) {
  const name = normalizeHandle(handle);
  if (!/^[a-z0-9._-]{5,24}$/.test(name)) throw new Error('Handles use 5–24 letters, numbers, periods, underscores or hyphens.');
  if (typeof password !== 'string' || !password) throw new Error('Enter your password.');
  let response;
  try {
    response = await fetchImpl(HANDLE_LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: name, password }),
      cache: 'no-store'
    });
  } catch (_) {
    throw new Error('Handle sign-in is unavailable. Check your connection and try again.');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 429) throw new Error('Too many sign-in attempts. Wait a little, then try again.');
    if (response.status === 503) throw new Error('Handle sign-in is unavailable. Try again in a moment.');
    throw new Error(body.error || 'That handle and password did not match.');
  }
  if (typeof body.customToken !== 'string' || !body.customToken)
    throw new Error('Handle sign-in did not return a session. Try again.');
  return body.customToken;
}

async function setup() {
  const form = document.getElementById('loginCard');
  const email = document.getElementById('loginEmail');
  const password = document.getElementById('loginPassword');
  const message = document.getElementById('loginMessage');
  const signInTab = document.getElementById('signInTab');
  if (!form || !email || !password || !message) return;

  let handleMode = false;
  const label = email.closest('label')?.querySelector('span');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'login-link';
  toggle.id = 'handleLoginToggle';
  toggle.textContent = 'Sign in with @handle';
  toggle.setAttribute('aria-pressed', 'false');
  email.closest('label')?.after(toggle);

  function setMode(next) {
    handleMode = next;
    toggle.textContent = next ? 'Use email instead' : 'Sign in with @handle';
    toggle.setAttribute('aria-pressed', String(next));
    if (label) label.textContent = next ? '@handle' : 'Email';
    email.type = next ? 'text' : 'email';
    email.autocomplete = next ? 'username' : 'email';
    email.placeholder = next ? '@username' : 'you@example.com';
    email.value = '';
    message.textContent = '';
  }
  toggle.addEventListener('click', () => setMode(!handleMode));
  email.addEventListener('input', () => {
    if (!handleMode && email.value.trim().startsWith('@')) {
      // Native email validation would otherwise reject a typed @handle.
      email.type = 'text';
    } else if (!handleMode && !email.value.trim().startsWith('@')) {
      email.type = 'email';
    }
  });

  // Capture at document level so this runs before the legacy form listener.
  document.addEventListener('submit', async (event) => {
    if (event.target !== form) return;
    if (signInTab && !signInTab.classList.contains('active')) return;
    const raw = email.value.trim();
    const typedHandle = raw.startsWith('@');
    if (!handleMode && !typedHandle) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const submit = document.getElementById('loginSubmit');
    if (submit) submit.disabled = true;
    message.classList.remove('ok');
    message.textContent = '';
    try {
      const [{ getApps, initializeApp }, { getAuth, signInWithCustomToken }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js')
      ]);
      const app = getApps()[0] || initializeApp(FIREBASE_CONFIG);
      const token = await requestHandleCustomToken(raw, password.value);
      await signInWithCustomToken(getAuth(app), token);
      message.textContent = '';
    } catch (error) {
      message.textContent = (error && error.message) || 'That handle and password did not match.';
    } finally {
      if (submit) submit.disabled = false;
    }
  }, true);
}

setup().catch(() => {});
