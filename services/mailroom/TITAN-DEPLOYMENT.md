# L’wazi Mailroom → Titan delivery (staging integration)

This separate Node 22 backend is designed to run alongside the GitHub Pages Studio. GitHub Pages itself **cannot** hold Titan SMTP credentials or Firebase Admin permissions. No VPS or Stalwart SMTP server is needed: Titan already sends and receives mail for lwazi@biglwa.com.

**Release rule:** Merging this code does NOT turn on custom Firebase authentication delivery. Keep Firebase's working native SMTP email sender until a real authenticated deployment, test-to-self, production rate limiting and controlled cutover are completed.

## What is wired in this release

1. Private saved drafts: Firestore developerMailTemplates/{verify,reset}; edited from /developer/mailroom/ and never automatically published.
2. Reviewed snapshots: developerMailPublished/{verify,reset}, stored only by trusted Firebase Admin CLI. Source revision and SHA-256 hash are checked before writing and on every auth send.
3. Trusted internal sender: Firebase Admin generates real event-specific verification/reset links. It uses only approved published copy, with the recipient read from the user's Firebase account, and relays via Titan SMTP. Never accepts a custom recipient or externally supplied action link.
4. Existing restricted admin test endpoint: POST /v1/admin/test-email sends a non-actionable preview only to the verified developer's own account email, when MAILROOM_ENABLE_TEST_SEND=true.
5. A secret-free Dockerfile and Cloud Build recipe permit an isolated Google Cloud Run staging service. The listener remains localhost-only by default.

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

## Live mail is not enabled yet

MAILROOM_ENABLE_AUTH_DELIVERY=false must remain false in staging until member-facing endpoints, robust distributed throttles and abuse prevention are deployed and tested. The current authentication action sender is intentionally **internal-only**, not a public URL; it cannot send account verification or reset emails just because this code is merged.

Before production cutover: implement authenticated verification dispatch, a Turnstile-protected enumeration-safe public reset request, durable per-account/IP rate limits and a queue, delivery outcome monitoring, on-call/rollback, and full link-expiry tests. Change the Studio login/settings callers only after the backend proves successful. Firebase's current native emails are the rollback and remain active until then.

MFA and email-change reversals are distinct security operations and are deliberately out of scope; do not send an ordinary password-reset link to implement them.

Documentation: https://firebase.google.com/docs/auth/admin/email-action-links
