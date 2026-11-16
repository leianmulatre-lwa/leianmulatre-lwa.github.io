# BIG LWA Orbit / Map / Tunes — provider registration handoff (2026-11-15)

This file is an implementation handoff, **not** evidence that any provider OAuth, map estimates, or playlist synchronization is running. The client identifiers in `config/orbit-provider-apps-20261115.json` were provided by the product owner, not independently verified against provider dashboards.

## Record status

| Provider | Public identifier recorded | Callback to reserve in developer dashboard | Secret binding after server OAuth implementation |
|---|---|---|---|
| Uber | supplied application identifier | `https://api.biglwa.com/uber/callback` | `UBER_CLIENT_SECRET` |
| Lyft | supplied developer identifier; confirm it is an OAuth client ID | `https://api.biglwa.com/lyft/callback` | `LYFT_CLIENT_SECRET` |
| Spotify | supplied Spotify Client ID | `https://api.biglwa.com/spotify/callback` | `SPOTIFY_CLIENT_SECRET` |
| SoundCloud | **Client ID still missing** | `https://api.biglwa.com/soundcloud/callback` | `SOUNDCLOUD_CLIENT_SECRET` |

The paths above are **reserved/planned callback URLs**, based on the existing `api.biglwa.com/{provider}/callback` convention. They are **not deployed/working OAuth callbacks** in this change. Do not start authorization flows or place private secrets in a URL. A subsequent backend PR must implement start/callback, state+PKCE, per-account token storage/refresh, consent and disconnect, then deploy and test each path before using it in production.

Public client IDs can be exposed through an approved configuration API or runtime binding if needed. Private client secrets MUST be stored as encrypted Cloudflare Worker secrets in the actual API worker, not GitHub, HTML, JavaScript, query parameters, test fixtures or screenshots. Recommended future *public* Worker runtime bindings: `UBER_CLIENT_ID`, `LYFT_CLIENT_ID`, `SPOTIFY_CLIENT_ID`, `SOUNDCLOUD_CLIENT_ID`.

## OAuth design to complete after secrets and provider approval

1. Browser asks authenticated, same-origin BIG LWA API to initiate an OAuth flow.
2. Server verifies current Firebase user and provider app configuration, creates cryptographically random state, and stores it with the initiating user and expiration in private KV/Durable Object storage. Use PKCE S256 where supported/required.
3. Provider redirects the user to its exact registered callback on `https://api.biglwa.com`.
4. Server validates state and caller, exchanges authorization code from Cloudflare using the private client secret and PKCE verifier, stores tokens scoped to the account, and issues a single-use handoff back to Studio Orbit. Never append access/refresh tokens to frontend return URLs.
5. Orbit queries authenticated connection status; only real token-backed sessions say *Connected*. Separate *App configured* / *API approval pending* / *Reconnect required*.
6. All authorized imports require the minimum approved scopes and explicit user consent; implement revoke and deletion.

### Provider-specific notes
- **Uber**: Riders API access and any estimate permission must be approved; do not construct an Uber-vs-Lyft cost comparison using restricted Uber fare data without explicit authorization. Existing Uber ride deep links may remain available without authentication.
- **Lyft**: Confirm which product API is granted and whether the supplied identifier is a valid OAuth Client ID; do not claim availability, generate prices, or scrape Lyft.
- **Spotify**: Register the exact HTTPS redirect URI. Use the approved authorization code with PKCE or confidential server flow, validate `state`, and request only needed user-library/playlist scopes.
- **SoundCloud**: An API app with an issued Client ID and Client Secret is still required. SoundCloud docs currently specify OAuth 2.1 authorization code + mandatory PKCE; single-use refresh tokens require careful server-side rotation.
- **Google**: The *existing* `google-orbit.js` uses Google Identity Services **token client with a JavaScript callback**, not a server redirect. Enter `https://biglwa.com` (and any actually served HTTPS origin such as `https://www.biglwa.com`) in **Authorized JavaScript origins** for the Google OAuth client. A redirect URI should not be invented for that existing token-client flow. Google access tokens are intentionally not persisted; after expiry or reload, a fresh Google grant can be required.

Site privacy policy: `https://biglwa.com/privacy/` (verify public availability when registering).

Official setup references:
- Uber: https://developer.uber.com/docs/consumer-identity/setup/configure-application
- Spotify redirect rules: https://developer.spotify.com/documentation/web-api/concepts/redirect_uri
- SoundCloud OAuth: https://developers.soundcloud.com/docs/api/guide

Do not place actual secret values in commits or PR comments.
