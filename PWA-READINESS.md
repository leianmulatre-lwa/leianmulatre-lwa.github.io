# BIG LWA iOS readiness
Branch-only first pass; not production-ready until device testing. The installable Studio uses the existing codebase. The landscape prompt applies only in installed mobile mode; portrait remains an explicit alternative. The service worker deliberately does not intercept fetches or store private media or auth pages.

## Test on iPhone
Use a HTTPS deployment of this branch. Safari → Share → Add to Home Screen. Launch the app, rotate, open App & notifications and tap Enable notifications / send a test. iOS 16.4+ is required. Confirm alert appearance, focus behavior, portrait escape, OAuth, safe-area spacing and that desktop Studio is unchanged.

## Remote FCM
In the existing Firebase project, Project settings → Cloud Messaging → Web Push certificates, generate or retrieve the **public** VAPID key. Set the public key in biglwa-push-config.js. Enable Firebase Cloud Messaging Registration API if necessary. Never commit a private key or service-account credentials. Test a registration on a physical device; copy the test device token into the Firebase console and send a generic test notification while the app is closed. This branch does not store device tokens in accounts or send automated social alerts. Before enabling those, add a trusted authenticated sender, owner-scoped device registration/revocation, sign-out cleanup, account deletion cleanup, rate limits, and per-category notification preferences. No private content in lock-screen payloads.
