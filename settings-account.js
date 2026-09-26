/* BIGLWA settings: confirm, change, and reset the account email for a signed-in member. */
(() => {
  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyAPUT8_pLNxdh5tbGpAmXBJiID3jVcA9DY',
    authDomain: 'biglwa.firebaseapp.com',
    projectId: 'biglwa',
    appId: '1:83232670555:web:e04927b20458390b3b507e'
  };

  const el = (id) => document.getElementById(id);
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const PROVIDER_LABELS = {
    'google.com': 'Google',
    'apple.com': 'Apple',
    'password': 'Email and password',
    'phone': 'Phone number'
  };

  let authPromise = null;

  function firebase() {
    if (!authPromise) {
      authPromise = import('https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js')
        .then((sdk) => sdk.getApps()[0] || sdk.initializeApp(FIREBASE_CONFIG))
        .then((app) => import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js').then((auth) => auth.getAuth(app)));
    }
    return authPromise;
  }

  const say = (node, message, tone) => {
    if (!node) return;
    node.textContent = message;
    node.classList.toggle('good', tone === 'good');
    node.classList.toggle('bad', tone === 'bad');
  };

  const friendly = (error) => {
    const code = String(error && error.code || '');
    if (code === 'auth/requires-recent-login') return 'For your security, sign in again first, then make that change.';
    if (code === 'auth/invalid-email') return 'That does not look like a valid email address.';
    if (code === 'auth/email-already-in-use') return 'That address is already attached to another account.';
    if (code === 'auth/missing-password') return 'That account signs in with a provider, so it has no password to reset.';
    if (code === 'auth/too-many-requests') return 'Too many attempts. Wait a little, then try again.';
    if (code === 'auth/network-request-failed') return 'The network did not respond. Check your connection and try again.';
    if (code === 'auth/operation-not-allowed') return 'This sign-in method is not enabled for the account.';
    return (error && error.message) || 'That did not work. Try again.';
  };

  const describeProvider = (user) => {
    const names = (user.providerData || [])
      .map((entry) => PROVIDER_LABELS[entry.providerId] || entry.providerId)
      .filter(Boolean);
    if (!names.length) return 'Signed in with an unrecognised method.';
    return `Signed in with ${[...new Set(names)].join(' and ')}.`;
  };

  function render(auth, user) {
    const signedOut = el('signedOut');
    const signedIn = el('signedIn');
    const outStatus = el('accountStatusSignedOut');
    if (outStatus) outStatus.hidden = true;

    if (!user) {
      if (signedOut) signedOut.hidden = false;
      if (signedIn) signedIn.hidden = true;
      return;
    }

    if (signedOut) signedOut.hidden = true;
    if (signedIn) signedIn.hidden = false;

    const email = el('accountEmail');
    if (email) email.textContent = user.email || 'No email on this account';

    const badge = el('accountBadge');
    if (badge) {
      const verified = user.emailVerified === true;
      badge.textContent = verified ? 'Confirmed' : 'Not confirmed';
      badge.className = 'badge ' + (verified ? 'ok' : 'warn');
    }

    const provider = el('accountProvider');
    if (provider) provider.textContent = describeProvider(user);

    const verify = el('verifyEmail');
    if (verify) {
      const verified = user.emailVerified === true;
      verify.disabled = verified;
      verify.textContent = verified ? 'Email already confirmed' : 'Send confirmation email';
    }

    const reset = el('resetPassword');
    if (reset) {
      const hasPassword = (user.providerData || []).some((entry) => entry.providerId === 'password');
      reset.disabled = !hasPassword || !user.email;
      reset.title = hasPassword ? '' : 'This account signs in with a provider, so it has no password.';
    }
  }

  function wire(auth) {
    const status = el('accountStatus');
    const guard = async (button, work) => {
      const buttons = [el('verifyEmail'), el('resetPassword'), el('changeEmail'), el('signOut')].filter(Boolean);
      buttons.forEach((node) => { node.disabled = true; });
      say(status, 'Working…');
      try {
        await work();
      } catch (error) {
        say(status, friendly(error), 'bad');
      } finally {
        buttons.forEach((node) => { node.disabled = false; });
        render(auth, auth.currentUser);
      }
    };

    el('verifyEmail')?.addEventListener('click', () => guard(null, async () => {
      const current = auth.currentUser;
      if (!current) throw new Error('You are signed out.');
      if (current.emailVerified) return say(status, 'That address is already confirmed.', 'good');
      const api = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js');
      await api.sendEmailVerification(current);
      say(status, `Confirmation sent to ${current.email}. Open that email and click the link.`, 'good');
    }));

    el('resetPassword')?.addEventListener('click', () => guard(null, async () => {
      const current = auth.currentUser;
      if (!current || !current.email) throw new Error('You are signed out.');
      const api = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js');
      await api.sendPasswordResetEmail(auth, current.email);
      say(status, `Password reset sent to ${current.email}. The link expires and can be used once.`, 'good');
    }));

    el('changeEmail')?.addEventListener('click', () => guard(null, async () => {
      const current = auth.currentUser;
      if (!current) throw new Error('You are signed out.');
      const input = el('newEmail');
      const next = String(input && input.value || '').trim();
      if (!EMAIL.test(next)) {
        say(status, 'Enter a valid email address first.', 'bad');
        return;
      }
      if (next === current.email) {
        say(status, 'That is already your email address.', 'bad');
        return;
      }
      const api = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js');
      await api.verifyBeforeUpdateEmail(current, next);
      if (input) input.value = '';
      say(status, `Confirmation sent to ${next}. Your email changes once you click that link.`, 'good');
    }));

    el('signOut')?.addEventListener('click', () => guard(null, async () => {
      const api = await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js');
      await api.signOut(auth);
      say(status, 'Signed out.', 'good');
    }));
  }

  async function start() {
    const intro = el('accountIntro');
    let auth;
    try {
      auth = await firebase();
      if (typeof auth.authStateReady === 'function') await auth.authStateReady();
    } catch {
      if (intro) intro.textContent = 'Account controls could not load. Email leian@biglwa.com and we will help by hand.';
      return;
    }

    const apply = (user) => render(auth, user);

    wire(auth);
    apply(auth.currentUser);
    auth.onAuthStateChanged(apply);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
