# Big LWA Developer Console — Mailroom (phase 1)

An **isolated, draft-only** L’wazi email editor with a responsive HTML preview and Firestore-backed developer drafts. Designed to grow into Big LWA's own developer console. Uses the existing Firebase project; does **not** replace sign-in, run SMTP, install FluentSMTP, or send any message.

## What works
- Four draft templates: email verification, password reset, email change, and multi-factor notifications.
- Tight letter layout, compact “Warmly,” signature, brown heart, sender name L’wazi.
- Inline-styled email HTML and plain-text exports; preheader, subject, body, CTA label and signature editing.
- Safe preview in a script-disabled sandboxed iframe. Admin-entered text is HTML escaped.
- Server-checked Firestore role (developerAdmins/{uid}), separate from moderationAdmins.
- Drafts saved to private developerMailTemplates/{templateId} with revisions and last-editor metadata; transaction rejects stale revisions.
- HTML exports include **literal** {{ACTION_URL}} placeholders — not real links.

## Important limits / security
- Pages hosted on GitHub Pages are **public static assets**. Anyone can fetch the UI source. Private developer data is protected by Firestore rules, not by hiding the page.
- NO credentials, SMTP passwords, personal user data, or Firebase Admin SDK service-account keys belong in this repository or in exported templates.
- Client-side copy is plain text; sender action URLs must be created and validated on a trusted future backend.
- Preview is not a delivery test. No queued emails, no action-link generation, no SMTP connection, no logs, no email-sending API.
- Existing Firebase Auth transactional email settings and action URLs stay untouched. Do not switch them off yet.

## Admin bootstrap (requires trusted console access)
1. Review the firestore.rules changes and deploy rules intentionally with a trusted Firebase CLI/session: firebase deploy --only firestore:rules --project biglwa. This branch does not deploy them automatically.
2. From Firebase Console → Firestore Database, create developerAdmins/{your Firebase Auth UID} with a boolean field active set to true. Create using the Firebase Console or trusted Admin SDK only; clients are explicitly denied role writes. Never use an email address in place of the UID.
3. Sign into Big LWA on the same browser origin (biglwa.com) using that account; open /developer/mailroom/ once the page is deployed. If the role isn't configured, access remains denied.
4. Edit a sample and press Save draft. Refresh and verify the revision reloads. Test on another browser/device using the same account.
5. Run: node --test developer/mailroom/mailroom.test.mjs.

## Proposed phase 2 (deliberately not deployed)
- Standalone SMTP service on a suitable host, **not** in the OAuth/Orbit Worker or GitHub Pages.
- Domain authorization: SPF, DKIM, DMARC, reverse DNS, TLS; host that allows outbound TCP/25; bounce and feedback handling, rate limits and monitoring.
- A trusted mail API that verifies Firebase ID tokens and administrator permissions server-side and stores credentials exclusively as secrets. Do not allow arbitrary recipient, HTML, or action URL input to an unauthenticated endpoint.
- Auth email integration via a trusted Firebase Admin backend generating one-time action links. Use provider-neutral delivery adapters, idempotent queues, retries, audit logging, and a tested fallback.
- Only after verified full-flow testing: integrate with Firebase verification/reset/recovery, update DNS, and consider a dedicated developer.biglwa.com domain with Cloudflare Access if desired.

## Repository / release
This lives at /developer/mailroom/ to avoid touching the Studio's historically layered page shell. Open a PR; validate the new page separately. Do not merge it merely to test SMTP: none has been deployed. Run node tests before requesting review. The firestore.rules file update is source control only until deployed separately.
