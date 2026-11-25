# BIG LWA independent Web Push pilot

This Node 22 sender is provider-independent at the application layer. It uses standard Web Push via web-push and BIG LWA-owned VAPID keys; Firebase Admin only verifies existing accounts and records a per-UID test rate limit. Apple, Google, Mozilla and Microsoft operate the browser delivery gateways. No subscription SaaS or Firebase Messaging SDK is necessary.

## Private pilot setup (not a deployment)
- npm install; npm test; audit dependencies and commit a generated lockfile before deploying.
- Generate a dedicated persistent VAPID key pair in a trusted terminal (npm run keys). Store the private key in the host's secret manager, not Git or ChatGPT. Use a valid contact URI for VAPID_SUBJECT.
- Deploy this private package only to an HTTPS Node runtime, e.g. the existing Cloud Run workflow with a dedicated least-privilege service identity. Application Default Credentials must point to the BIG LWA Firebase project. Configure ALLOWED_ORIGIN (exact preview HTTPS origin), PILOT_UIDS (explicit testers), FIREBASE_PROJECT_ID, VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY. No paid resources have been provisioned.
- Set ONLY the public VAPID key and HTTPS API origin in the PWA branch's biglwa-push-config.js. Install that preview as a home-screen web app on iOS 16.4+. Tap Enable remote push / send a remote test. A 200 means the browser gateway accepted a push, not that the user saw it.
- Verify receipt in foreground and with the app closed; test unsubscribe, expired subscription, unauthenticated requests, different accounts, rate limiting and privacy. Use a separate preview environment before any production launch.

The pilot is limited to a generic authenticated self-test, no arbitrary notification text, no recipient targeting, no persistent device subscription registry. Rate limits are stored server-only in Firestore (existing catch-all rules deny client access). No keys or subscription endpoints should be logged. Before opening to other members implement a verified owner-scoped device registry, sign-out/revocation and deletion lifecycle, preferences, trusted domain events, idempotent delivery jobs, quotas, retries and monitoring. A future paid/hosted provider for other apps would also need tenant isolation, billing and abuse controls. Do not enable those services from this pilot.

Local test and remote test are separate buttons: the remote button appears only when config, authentication and service worker are ready so the browser can subscribe directly on tap. Test using a fresh account session; a signed-out or revoked token must be rejected by the sender.
