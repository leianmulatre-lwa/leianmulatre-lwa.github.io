# L’wazi Mailroom → Firebase authentication templates

This is an intentionally separated **draft → review → publish** bridge. It reads the Firebase Firestore drafts saved by the Developer Console and prepares/submits the selected native Firebase Auth HTML template through Google's Identity Toolkit Admin API. Titan SMTP configuration is never edited.

**Status: source code only.** Merging this PR does not publish emails. Firebase continues sending its current templates until an administrator deliberately executes the publish command.

## Current scope

- Mailroom Email verification becomes Firebase verifyEmailTemplate.
- Mailroom Password reset becomes Firebase resetPasswordTemplate.
- Existing saved subject, greeting, body, button and signature are compiled into Big LWA's escaped HTML letter. The button has Firebase's %LINK% token.
- {{DISPLAY_NAME}} maps to Firebase %DISPLAY_NAME%, which uses the Firebase Auth account display name. Firestore profile names are NOT automatically injected into Firebase's native messages.
- Email-change and MFA messages deliberately remain drafts until their separate security-event and recovery-link semantics are validated. Publishing them now could misrepresent who gets the email or what an action undoes.

## From the Developer Console

On /developer/mailroom/, SAVE your letter. For verification or reset, the Firebase section can copy the Firebase-ready subject, copy the rendered HTML or download a Firebase template JSON. Those exports do NOT modify live authentication emails.

## Administrator publishing (Windows PC or trusted server)

Prerequisites: Node.js 22+, npm, and trusted Google Cloud Application Default Credentials with Identity Toolkit config get/update and Firestore read permission. Do not store account credentials, service-account files or Titan app passwords in GitHub. Use a dedicated administrative account and least privilege.

From the root of the repository:

    cd tools/mailroom-firebase
    npm install

Configure Google Application Default Credentials through the official guide:

https://cloud.google.com/docs/authentication/provide-credentials-adc

For a local machine with Google Cloud CLI installed:

    gcloud auth application-default login
    gcloud config set project biglwa

Step 1 — preview the actual saved Firestore draft and current remote template. No changes are made.

    node publish.mjs --id=reset

The preview displays saved revision, target, changed fields, subject and a SHA-256 confirmation fingerprint. It does not print the full remote Firebase configuration, which can include sensitive SMTP details.

Step 2 — deliberate publish ONLY after reviewing. Replace REVISION and FINGERPRINT with the previewed values:

    node publish.mjs --id=reset --apply --confirm-project=biglwa --confirm-revision=REVISION --confirm-fingerprint=FINGERPRINT

The command re-reads the Firestore draft and Firebase template immediately before patching; it rejects revisions or remote content that changed. It writes a private backup containing ONLY the previous subject, body and bodyFormat in the current administrator's home directory, .biglwa-mailroom-backups. It applies a precise PATCH field mask to the three fields of ONE email template, not the SMTP relay, DNS, action URL, sender or other authentication settings. It requires that Firebase's current email method be CUSTOM_SMTP.

After publishing, inspect the Firebase Authentication Templates UI and request one verification or password-reset message using an account you own. Confirm the message arrives from lwazi@biglwa.com, the action works and authentication headers pass. Keep the prior template backup for rollback.

## Safety limitations

- No public browser admin API can publish. The developer Firestore role alone does not grant Identity Toolkit administrative permissions.
- The Identity Platform REST API defines HTML templates, but the actual project may reject some changes depending on features and configuration; an error should halt the process, not prompt bypasses.
- Firebase's native %DISPLAY_NAME% comes from Firebase Auth. Personalized Big LWA Firestore profile data requires an additional trusted backend and account-scoped logic.
- Do not conflate preview with delivery, nor live SMTP with auto-published templates.
- Old exported links and test placeholders are not production links. Firebase injects %LINK% into the actual event email.
- Existing SMTP infrastructure PRs are independent, and Stalwart is not required for the native Firebase publishing route.

Official documentation:
https://docs.cloud.google.com/identity-platform/docs/reference/rest/v2/Config
https://docs.cloud.google.com/identity-platform/docs/reference/rest/v2/projects/getConfig
https://docs.cloud.google.com/identity-platform/docs/reference/rest/v2/projects/updateConfig
https://support.google.com/firebase/answer/7000714
