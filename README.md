# BIG LWA

**People · Ideas · Sounds · Self — A bigger you. Brighter worlds.**

BIG LWA is a creative social Studio where members can bring their own social profiles, projects, media, sounds, writing, and interests together on their terms. **Privacy should be the bare minimum.**

**Website:** https://biglwa.com

## Find your way around the repository

| Area | Where | What it does |
| --- | --- | --- |
| Studio / website | `index.html`, `studio/`, `module-pages.js`, `studio-*.js` | Interactive site shell and widgets |
| Orbit connections | `orbit-*.js`, `instagram-*.js`, `pinterest-*.js`, `tiktok-orbit.js` | Account-specific provider integrations |
| OAuth and media API | `cloudflare-worker-instagram.js`, `new-orbit-oauth.js`, `wrangler.toml` | Cloudflare Worker, Firebase identity checks, private KV/R2 bindings |
| L’wazi | `lwazi/`, `lwazi-*.js` | Assistant policy, discovery, model orchestration, and interface |
| Static assets | `assets/` | Images, fonts references, and bundled visual media |
| Tests and release checks | `*-test.mjs`, `scripts/`, `.github/workflows/` | Regression, security, and deployment checks |
| Third-party source | `third_party/` | Attribution-preserved upstream libraries, **not** the BIG LWA application |
| Documentation | `docs/`, `seo-audits/` | Runbooks, architecture and release audits |

This is an active, historically layered codebase. Some older names are retained to keep existing page links and browser caches compatible. **Do not remove a file merely because it has an older date in its name.**

## Safe release flow

1. Start work in a short-lived feature or maintenance branch, then open a pull request targeting `main`.
2. Run the source checks and confirm changes against the current Studio, not an old isolated page.
3. Treat the **website** and the **OAuth/API Worker** as distinct releases. A green Pages build does **not** mean the Worker is healthy.
4. Do not commit OAuth access tokens, developer secrets, Firebase service credentials, or real account data. OAuth secrets are encrypted Worker bindings and are not recoverable from this repository.
5. For the API Worker, stage versions first and inspect their secrets, `OAUTH_SESSIONS` KV and `WALLPAPER_BUCKET` R2 bindings **before** promoting one to production. Never use an unreviewed root `wrangler deploy`.
6. Do not infer a successful social connection from an OAuth health endpoint; verify a signed-in, account-scoped connection and content import separately.

**Deployment:** `biglwa.com` is served via **GitHub Pages** (the Cloudflare DNS zone points its apex to GitHub Pages IPs and `www` to `leianmulatre-lwa.github.io`). The separate **Cloudflare Pages staging** project `biglwa-web-staging.pages.dev` builds `main` via GitHub Actions. A successful Cloudflare staging build does **not** prove the public GitHub Pages hostname has published the same commit; verify live asset freshness separately. The `biglwa-instagram-api` Worker and `api.biglwa.com` have their own deployment history; see `docs/runbooks/`.

## Current review and maintenance

Look at [GitHub pull requests](https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io/pulls) for release candidates and [issues](https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io/issues) for work not yet verified. Do not merge unrelated older branches merely to reduce branch counts.

## Third-party software

Third-party packages are preserved with their own README and licenses under `third_party/`. In particular, Tweepy is a **Python client library for the X API**, not the Studio itself. The library's license does not include free access to X's paid or metered endpoints. See `third_party/tweepy/`.
