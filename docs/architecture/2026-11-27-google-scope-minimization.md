# Google scope minimization (2026-11-27)

## Decision

BIG LWA is a hosting platform first. Member media, profile links, drafts, and public
pages belong in BIG LWA-owned storage (Firebase/Firestore plus CDN-backed assets),
not in a member's personal Google Drive. Third-party OAuth is an optional preview
or import layer, never the source of truth for hosted content.

Consequences for the Google integration:

- Google Identity requests only `youtube.readonly` and `calendar.readonly`.
- `drive.metadata.readonly` was removed. It was a restricted scope used only to
  list three recent file names in a private Orbit preview, and Google's only
  Drive use-case categories (backup, productivity, sync client) do not describe
  that behavior.
- Google Drive remains available in Orbit as a saved public profile link. It no
  longer renders as an OAuth-connected row.
- YouTube and Calendar stay OAuth-backed because Orbit and the Calendar module
  already use those read-only feeds. They are sensitive scopes but not
  restricted, which removes the Drive verification category problem.

## Verification strategy

The production consent screen is already public with External user type. Shipping
unverified scopes to live users would disrupt them and consume the unverified
user quota, so verification is prepared in a staging route or separate test
project first:

1. Record a demo that shows the read-only YouTube and Calendar previews for the
   signed-in member, including the expected unverified-app screen for the test
   account.
2. Include every OAuth client assigned to the Google Cloud project in the demo.
3. Submit verification for the two read-only scopes.
4. After approval, add the approved scopes to the production consent screen.

No secrets, client IDs beyond the existing public browser client, or provider
credentials are stored in this document.

## Long-term direction

A Roku-like channel should consume BIG LWA's own public JSON/RSS-style feed and
CDN video URLs. Provider connections should remain optional account-linking and
import affordances. This keeps moderation, durability, privacy boundaries, and
delivery under BIG LWA's control while keeping OAuth consent narrow enough for
external members to understand and approve.
