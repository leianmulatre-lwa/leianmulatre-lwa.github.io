# X Orbit: manual OAuth 2.0 user-token connection

**Release status:** On PR #66; do not paste a live token into the website until the PR's frontend and Worker have both been activated.

## Where the token comes from

X Developer Console > Apps > Big LWA > **Keys & Tokens** > **OAuth 2.0 Keys** > **Access Token** > Generate. If X offers a **Refresh Token** for the same grant, save it too. This is NOT the app-only Bearer Token and NOT the OAuth 1.0a Consumer Key / Access Token and Secret pair. Tokens cannot grant scopes your X project does not already permit.

## Where it gets pasted in BIG LWA after deployment

1. Sign into your own account at https://biglwa.com.
2. Open **Studio > Orbit**.
3. Find the **X** card, select **Use X token**.
4. Paste **OAuth 2.0 User Access Token** in the password-style first field; paste its matching **Refresh Token** in the optional second field if X provided one.
5. Select **Verify & connect**.

The Worker calls X `GET /2/users/me` to verify the token's actual account identity. It rejects app-only Bearer tokens, accepts only the signed-in BIG LWA member, stores the token in account-scoped `OAUTH_SESSIONS` KV, and returns only the verified public X profile. It does not save browser-local secrets. The refresh token stays server-side and renews when supported. Without a refresh token, the manual session is conservatively limited to one hour. X still enforces endpoint scopes and API access on imports; this feature does not enable posting or write permissions.

## Deployment sequencing (owner)

Keep this PR unmerged until the matching Worker version has been staged using the original nine encrypted credentials stored locally in `~/.config/biglwa/oauth-secrets.env`. Upload via `wrangler versions upload --secrets-file` (not immediate `deploy`). Verify the new preview health, then merge frontend and activate the new backend version. Production `api.biglwa.com` must not be overwritten by a static-only/no-secrets deployment.

Do not paste the token into Cloudflare's X_CLIENT_SECRET, wrangler.toml, public repository, account public link, or this chat. Treat it as a sensitive user-specific credential.
