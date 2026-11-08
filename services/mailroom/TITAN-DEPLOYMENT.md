# L’wazi Mailroom → Titan delivery (staging integration)

This separate Node 22 backend is designed to run alongside the GitHub Pages Studio. GitHub Pages itself **cannot** hold Titan SMTP credentials or Firebase Admin permissions. No VPS or Stalwart SMTP server is needed: Titan already sends and receives mail for lwazi@biglwa.com.

**Release rule:** Merging this code does NOT turn on custom Firebase authentication delivery. Keep Firebase's working native SMTP email sender until a real authenticated deployment, test-to-self, production rate limiting and controlled cutover are completed.

## What is wired in this release

1. Private saved drafts: Firestore developerMailTemplates/{verify,reset}; edited from /developer/mailroom/ and never automatically published.
2. Reviewed snapshots: developerMailPublished/{verify,reset}, stored only by trusted Firebase Admin CLI. Source revision and SHA-256 hash are checked before writing and on every auth send.
3. Trusted internal sender: Firebase Admin generates real event-specific verification/reset links. It uses only approved published copy, with the recipient read from the user's Firebase account, and relays via Titan SMTP. Never accepts a custom recipient or externally supplied action link.
4. Existing restricted admin test endpoint: POST /v1/admin/test-email sends a non-actionable preview only to the verified developer's own account email, when MAILROOM_ENABLE_TEST_SEND=true.
5. A secret-free Dockerfile and Cloud Build recipe permit an isolated Google Cloud Run staging service. The listener remains localhost-only by default.
6. A signed-in member route can request that account's own verification or password-reset letter. The browser never supplies a recipient, HTML, or link, and Firestore enforces a durable three-per-fifteen-minute action limit.

## Start with safe preview (requires a trusted machine with Firebase Admin ADC)

Save the intended letter in Mailroom. From repository root with Node 22 and dependencies installed inside services/mailroom:

    node services/mailroom/publish-draft.mjs --id=reset --admin-uid=YOUR_FIREBASE_UID

Preview prints the saved revision, subject and SHA-256. Nothing is sent or published. When you have independently reviewed those values, repeat with:

    node services/mailroom/publish-draft.mjs --id=reset --admin-uid=YOUR_FIREBASE_UID --apply --confirm-revision=REVISION --confirm-sha256=SHA256

Repeat for verify. The script rechecks the developer's active role, the draft revision and exact content in a Firestore transaction.

## Titan SMTP configuration on the backend

Variables (provided in the hosting environment, not GitHub):

    FIREBASE_PROJECT_ID=biglwa
    MAILROOM_SMTP_HOST=smtp.titan.email
    MAILROOM_SMTP_PORT=465
    MAILROOM_SMTP_USER=lwazi@biglwa.com
    MAILROOM_FROM=lwazi@biglwa.com

Inject MAILROOM_SMTP_PASSWORD as a **server-only secret**. It must be the appropriate current Titan third-party SMTP password (app password when 2FA requires it). Do not reveal the password in GitHub, Cloud Build build args, browser source, this chat, or a JSON export.

Google Cloud Run is one possible Node 22 host. Its runtime service identity should use application-default credentials and the least privileges needed to read relevant Firestore docs, fetch Firebase users and generate action links. Billing must be enabled and the service deployed by a project administrator; there is no authorized Google Cloud deployment connection in this chat.

For staging, configure K_SERVICE (automatically supplied by Cloud Run) and MAILROOM_EXPOSED_STAGE=true to permit 0.0.0.0:$PORT. All other deployments bind loopback only by default.

### Hosting check

GET /health returns the service state. It does not test Titan credentials or Firebase action emails.

Staging test: enable MAILROOM_ENABLE_TEST_SEND=true only after configuring Titan credentials and Google Cloud workload identity; POST /v1/admin/test-email from the trusted Developer Console origin with a valid verified developer Firebase ID token and JSON {"templateId":"reset"}. Response 202 confirms SMTP acceptance, not inbox delivery. Verify the message arrives from L’wazi and includes no live security link. The test endpoint does not accept arbitrary recipient addresses.

After both `verify` and `reset` drafts have approved `developerMailPublished` snapshots, enable `MAILROOM_ENABLE_AUTH_DELIVERY=true` in staging. From a signed-in Big LWA Settings page, POST `/v1/auth/email-action` with the member's Firebase ID token and JSON `{"type":"verify"}` or `{"type":"reset"}`. The service generates the one-time link with Firebase Admin, places it in the approved Mailroom HTML, and submits it through Titan. Confirm the received link completes the intended Firebase action before directing production traffic to the service.

The browser bridge targets `https://mailroom.biglwa.com`. Until that hostname reaches a healthy enabled service, Settings deliberately falls back to Firebase's native sender. A 429 or account/authentication rejection never falls back, so the browser cannot bypass the Mailroom rate limit.

## Live mail is not enabled yet

MAILROOM_ENABLE_AUTH_DELIVERY=false must remain false until the signed-in route, published copy, Titan acceptance and full action links have been tested in staging. The signed-out Forgot password flow remains on Firebase until its separate bot challenge is ready.

Before a signed-out production reset cutover: implement a Turnstile-protected enumeration-safe public reset request, durable per-account/IP limits and a queue. For the signed-in Settings route, verify delivery outcomes, rollback behavior and full link-expiry tests before removing the Firebase fallback.

MFA and email-change reversals are distinct security operations and are deliberately out of scope; do not send an ordinary password-reset link to implement them.

Documentation: https://firebase.google.com/docs/auth/admin/email-action-links
