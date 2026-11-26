# Worker auth mail relay

Signed-in members request verification/reset mail through the BIG LWA Worker at
`POST /mail/auth-email`. Firebase still creates and validates the secure action
link, and the Worker delivers the reviewed letter through the BIG LWA Titan
mailbox using `cloudflare:sockets` on port `465`. Firebase's own outbound mail
sender and the paid Cloudflare Email Sending product are not used.

## Cloudflare dashboard setup

Add these as encrypted Worker secrets in the Cloudflare dashboard. Never paste
them into GitHub, Wrangler config, chat, or a commit.

| Name | Required | Notes |
| --- | --- | --- |
| `MAILROOM_SMTP_USER` | yes | Titan mailbox user |
| `MAILROOM_SMTP_PASSWORD` | yes | Titan mailbox app password |
| `MAILROOM_SMTP_HOST` | no | Defaults to `smtp.titan.email` |
| `MAILROOM_SMTP_PORT` | no | Defaults to `465`; `587` also works, `25` is blocked |
| `FIREBASE_SERVICE_ACCOUNT` | yes | Also required by handle sign-in and the Firestore mirror |

`MAILROOM_FROM` is fixed to `lwazi@biglwa.com` in code. `MAILROOM_WORKER_DELIVERY`
is a plain var set to `"true"` in `wrangler.toml`; branch previews set it to
`"false"`. Until the two SMTP secrets exist, the endpoint returns a generic
`503` and no mail is sent.

The reviewed letters must exist in Firestore at
`developerMailPublished/verify` and `developerMailPublished/reset` with
`status: "published"` and a matching `sha256` digest. Drafts are never sent.

## Safety contract

- The browser sends only `{ "type": "verify" | "reset" }` plus its Firebase ID token.
- The Worker verifies the token, reads the account through Firebase Admin, and
  binds the recipient to that account's stored email.
- The action URL comes from Firebase's `accounts:sendOobCode` with
  `returnOobLink: true`; no caller-supplied URL, body, or recipient is accepted.
- Requests are limited to 3 attempts per account and type in 15 minutes through
  the `OAUTH_SESSIONS` KV namespace.
- Failures return generic messages. The browser falls back to Firebase native
  mail only when the Worker is unreachable, not on a deliberate server response.

## Verify after deploy

Send a signed-in request with the site origin:

```text
POST https://api.biglwa.com/mail/auth-email
Origin: https://biglwa.com
Authorization: Bearer <Firebase ID token>
Content-Type: application/json

{"type":"verify"}
```

Expected results: `202 accepted_by_smtp`, `200 already_verified`, `400` for an
unsupported action or a non-password reset, `401` for a bad token, `403` for a
recipient mismatch, `429` when rate-limited, and `503` while unconfigured or
delivery fails.
