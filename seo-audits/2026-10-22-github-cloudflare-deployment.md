# BIG LWA: Deploy Cloudflare Worker from GitHub Actions

Created 2026-10-22. This replaces the need for the **ChatGPT Cloudflare connector** to deploy code. It does **not** bypass Cloudflare account authorization. One-time GitHub secrets are necessary.

## What is already committed

- Workflow: [`.github/workflows/cloudflare-worker-manual.yml`](../.github/workflows/cloudflare-worker-manual.yml)
- Worker entrypoint: `cloudflare-worker-instagram.js`
- Existing Wrangler configuration: `wrangler.toml`
- Existing production Worker name: `biglwa-instagram-api`
- Existing bindings: `OAUTH_SESSIONS` KV, `WALLPAPER_BUCKET` R2.
- Production deploy is **manual only**, **main branch only**, and guarded by the `cloudflare-production` GitHub Actions environment.
- No Cloudflare token, OAuth secret, or provider credential is committed.

## First: run validation, which does not need a Cloudflare token

1. Open **GitHub → leianmulatre-lwa/leianmulatre-lwa.github.io → Actions**.
2. Open **BIG LWA Worker — check or deploy**.
3. Choose **Run workflow** on branch **main**. Leave **operation** as **validate**.
4. Open the run and confirm source checks, integration tests and **Wrangler compilation only** pass.
5. If anything fails, inspect the failing step. **Do not select deploy** until validation passes. An older regression test may need repair before first publish.

## One-time Cloudflare credential setup

When you can access the Cloudflare dashboard (or obtain an existing scoped token from the authorized Cloudflare account owner):

1. Open **Cloudflare → My Profile → API Tokens → Create Token** (or the account's API token administration view). Select the **Edit Cloudflare Workers** template or a custom token with permissions sufficient to deploy the existing Worker. Limit the token to the correct Cloudflare account and narrow resources where supported. Do not use a Global API Key.
2. Copy the **Cloudflare account ID** for the account that owns `biglwa-instagram-api`.
3. In GitHub, open **Settings → Secrets and variables → Actions → New repository secret**.
4. Create two secrets with **exactly** these names:
   - `CLOUDFLARE_API_TOKEN` — the newly created, scoped Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID
5. Do not paste token values in issues, commits, chat messages, scripts, test logs or workflow inputs. Existing Tumblr/TikTok/X/Instagram provider secrets should remain encrypted **on the Cloudflare Worker**, not copied into GitHub.
6. Recommended extra protection: **GitHub Settings → Environments → cloudflare-production → Required reviewers** (if your plan/repository supports environment protection). This provides an additional confirmation before a publish.

If Cloudflare is still unavailable **and no prior appropriate API token exists**, you can run **validate**, but **deploy cannot succeed yet**. There is no legitimate credential-free workaround.

## Publish through GitHub, after validation and secrets exist

1. Open **Actions → BIG LWA Worker — check or deploy → Run workflow**.
2. Select **main** and operation **deploy**.
3. Wait for both jobs: **Validate Worker + existing Orbit flows** and then **Publish existing Cloudflare Worker**.
4. The publish job refuses missing credentials and preserves `wrangler.toml`'s defined bindings and `keep_vars` behavior. It does not add new Cloudflare routes or domains.
5. The workflow probes both the existing workers.dev `/health` endpoint and `api.biglwa.com/health`. It confirms only that the public Worker responds, **not** that signed-in OAuth/media imports work.
6. For X, Tumblr and TikTok, test their real authorized sign-in and content imports using your account after deployment; collect reproducible (non-sensitive) errors if anything fails.

## Safety and troubleshooting

- This workflow does **not** deploy the GitHub Pages/Studio frontend: the existing `pages.yml` remains responsible for the website.
- Changes to Worker code do **not** automatically publish. You must explicitly choose **deploy**.
- The Worker uses `keep_vars = true` to avoid replacing dashboard-managed variables. Required secrets are declared in `wrangler.toml`; Wrangler can refuse the deployment if a required provider secret is missing. That is safer than silently breaking connections.
- A deploy can fail if the selected Cloudflare API token lacks access to the Worker or bound resources. Use the error to adjust narrowly scoped permissions; do not broaden account access unnecessarily.
- If a public health check fails, investigate the deployed Worker, route configuration and dashboard logs. Do not report successful signed-in integrations based on a green build alone.
- To roll back, use an earlier Worker version through Cloudflare when available, or deploy a known-good Git commit via an audited, main-branch restoration PR. Avoid deleting the Worker or changing OAuth callback URLs in a rollback.

References:
- https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
- https://developers.cloudflare.com/workers/wrangler/commands/workers/
- https://github.com/cloudflare/wrangler-action
