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
- Internal-only Firebase Admin pipeline for verification/password reset links, DISABLED by default and not exposed through HTTP. For live auth, reviewed default templates are used until a publishing workflow is built.
- Isolated localhost HTTP listener, bounded JSON requests, required TLS on SMTP submission, no secrets committed.
- Offline Node tests for safety, fallback and authorization.

## Host requirements

Provision an SMTP-capable VPS or an existing reliable host with an outbound port-25 policy compatible with internet mail delivery, stable hostname and PTR/reverse DNS. Operate a properly secured Stalwart SMTP service; receive submission on port 465 (implicit TLS) or 587 (STARTTLS configured). DNS and mail hygiene: SPF, DKIM, DMARC, TLS, abuse limits, delivery bounce monitoring and an active postmaster inbox.

Self-hosting removes per-email API costs, not hosting costs or deliverability maintenance. New IPs may have poor sending reputation initially.

Run in services/mailroom: npm install; then npm start on the intended host. Firebase Admin credentials must come from workload identity or server-only secrets.

## Server-only environment variable names (values NOT included in GitHub)

- FIREBASE_PROJECT_ID=biglwa
- GOOGLE_APPLICATION_CREDENTIALS=path supplied ONLY on your host (or workload identity)
- MAILROOM_LISTEN_HOST=127.0.0.1
- MAILROOM_LISTEN_PORT=8789
- MAILROOM_SMTP_HOST=mail.biglwa.com
- MAILROOM_SMTP_PORT=465 (or 587 with STARTTLS)
- MAILROOM_SMTP_TLS_SERVERNAME=mail.biglwa.com (set if host is an IP)
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
There is deliberately NO publicly accessible member signup/reset sender yet.

## Before real authentication emails are switched on

1. Authenticate the admin-only test endpoint on a staging host, configure mail server credentials without exposing secrets, and deliver a test to the correct inbox. Verify there is no actionable link in the test message.
2. Add a durable queue with idempotent jobs, retry/backoff, bounce/DSN processing, distributed rate limits, abuse controls, server-side logs with no secrets, and alerts.
3. Integrate trusted Firebase Admin action generation for verification/password resets, and test full real-account recovery paths. Email-change rollback and MFA reversal require their own verified provider events; do NOT treat the same link as interchangeable.
4. Build draft approval/publishing before production sends use freely edited Mailroom templates.
5. Keep Firebase default auth emails active until every replacement has passed end-to-end and inbox deliverability tests.

Run tests:
node --test services/mailroom/tests/backend.test.mjs
node --test developer/mailroom/mailroom.test.mjs developer/developer-shell.test.mjs

Do not change the OAuth Worker or public Studio auth flow for this early backend stage.
