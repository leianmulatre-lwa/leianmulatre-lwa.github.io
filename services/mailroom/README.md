# BIG LWA / L’wazi Mailroom — self-hosted backend (phase 2 foundation)

This is an isolated Node 22+ service, not the GitHub Pages Studio or the Cloudflare Orbit/OAuth Worker. The existing Developer Console and Firestore draft editor remain unchanged.

**State: code only. No server or SMTP delivery deployed. Firebase security emails remain active.**

## Implemented

- Backend composition reusing the real Mailroom HTML and copy, HTML escaping, and allowlisted placeholders.
- Personalization: account profile name first, then genuine Firebase Auth displayName (but not a username alias), otherwise bookini. No guesses from email addresses.
- Test emails have NO usable security-action link and clearly say TEST.
- Admin-only POST /v1/admin/test-email endpoint:
  - accepts only a templateId from verify / reset / email-change / mfa;
  - verifies Firebase ID token with revoked-token check; requires developerAdmins role and confirmed account email;
  - forces recipient to the same signed-in developer account email (no arbitrary To, HTML, links or other parameters);
  - reads the existing Firestore Mailroom draft and sends using an SMTP adapter;
  - returns 202 for SMTP acceptance only, not actual inbox delivery;
  - checks exact Origin and has a temporary in-memory test-only throttle of three per five minutes.
- Firebase Admin link generation backed by separately approved, revision-hashed Mailroom publications. The delivery gate is disabled by default.
- Signed-in member endpoint for verification/password reset delivery through Titan. It accepts only an action type, derives the recipient from the verified Firebase ID token, uses reviewed Mailroom publications, and is protected by a durable Firestore rate limit. It remains disabled until staging succeeds.
- Isolated localhost HTTP listener, bounded JSON requests, required TLS on SMTP submission, no secrets committed.
- Offline Node tests for safety, fallback and authorization.

## Host requirements

Run the service on a trusted Node host such as Cloud Run and submit mail to the existing Titan account over port 465 (implicit TLS) or 587 (STARTTLS). Keep SPF, DKIM and DMARC aligned with Titan, and maintain bounce monitoring and an active postmaster inbox.

Run in services/mailroom: npm install; then npm start on the intended host. Firebase Admin credentials must come from workload identity or server-only secrets.

## Server-only environment variable names (values NOT included in GitHub)

- FIREBASE_PROJECT_ID=biglwa
- GOOGLE_APPLICATION_CREDENTIALS=path supplied ONLY on your host (or workload identity)
- MAILROOM_LISTEN_HOST=127.0.0.1
- MAILROOM_LISTEN_PORT=8789
- MAILROOM_SMTP_HOST=smtp.titan.email
- MAILROOM_SMTP_PORT=465 (or 587 with STARTTLS)
- MAILROOM_SMTP_TLS_SERVERNAME=smtp.titan.email
- MAILROOM_SMTP_USER=(secret)
- MAILROOM_SMTP_PASSWORD=(secret)
- MAILROOM_FROM=lwazi@biglwa.com
- MAILROOM_ENABLE_TEST_SEND=false (default; must be deliberately turned on after network/access checks)
- MAILROOM_ENABLE_AUTH_DELIVERY=false (default, keep until trusted workflows have been built and approved)

The HTTP listener binds to localhost only; add a restricted TLS reverse proxy for authorized browser calls.

## API contract — not currently live

GET /health returns a minimal status only.
POST /v1/admin/test-email takes JSON containing only templateId, Authorization: Bearer a verified developer's Firebase ID token, and Origin: https://biglwa.com. It sends only to that developer's current verified account email.
OPTIONS /v1/admin/test-email supports the same origin for browser preflight.
POST /v1/auth/email-action takes JSON containing only `{"type":"verify"}` or `{"type":"reset"}`, a signed-in member's Firebase ID token, and Origin: https://biglwa.com. It sends only to that Firebase account's email when MAILROOM_ENABLE_AUTH_DELIVERY=true.
There is deliberately no signed-out custom reset sender yet. The public Forgot password flow keeps Firebase as its rollback until a bot challenge and enumeration-safe durable limits are configured.

## Before real authentication emails are switched on

1. Authenticate the admin-only test endpoint on staging and deliver a non-actionable test through Titan to the correct inbox.
2. Publish reviewed `verify` and `reset` snapshots from the saved Mailroom drafts.
3. Enable the auth gate in staging and test both real Firebase action links through the signed-in endpoint.
4. Verify delivery monitoring and rollback. Add a durable queue with idempotent jobs and retry/backoff before higher-volume use.
5. Keep Firebase default auth emails as fallback until every replacement has passed end-to-end and inbox deliverability tests. Email-change rollback and MFA reversal remain separate security events.

Run tests:
node --test services/mailroom/tests/backend.test.mjs
node --test developer/mailroom/mailroom.test.mjs developer/developer-shell.test.mjs

Do not change the OAuth Worker or public Studio auth flow for this early backend stage.
