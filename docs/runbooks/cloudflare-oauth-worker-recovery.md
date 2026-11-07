# BIG LWA: OAuth Worker recovery (safe runbook)

**Status: Prepared, not deployed.** Updated November 6, 2026.

## Root cause

The active Cloudflare `biglwa-instagram-api` deployment behaves as static-assets-only. Its dashboard disables Runtime Variables and Bindings. The current version reports zero Worker secret/KV/R2 bindings. Domain `api.biglwa.com` is assigned, but this does not prove that API routes function.

The checked-in `wrangler.toml` already correctly declares an executable entry point (`cloudflare-worker-instagram.js`), production `OAUTH_SESSIONS` KV, `WALLPAPER_BUCKET` R2, callback origins, and names of nine required encrypted secrets. Cloudflare's deployment is inconsistent with that intent.

Wrangler's `[secrets].required` check prevents deploy/version upload until those secrets exist. **Do not remove these checks or invent credentials.**

## Changes on this branch

- Correct the Wrangler comment claiming its bindings are already live; preserve every actual production configuration value.
- Add `scripts/oauth-worker-config.test.mjs` and a read-only PR check that verify the entry point, bindings, secret names and callback.
- Do **not** merge this branch until credentials are restored: editing `wrangler.toml` on main intentionally triggers a new Cloudflare Worker build.

## Terminal for beginners (no production changes)

1. On your Mac, open **Terminal** with Command + Space, then type Terminal.
2. Run separately: `node --version`, `git --version`, `npm --version`. If Node/npm is missing, install a current LTS version from https://nodejs.org/en/download.
3. Download the review branch without thousands of commits:

   `git clone --depth 1 --branch fix/oauth-worker-recovery-preflight-20261106 https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io.git ~/Documents/BIGLWA-API-Recovery`

4. `cd ~/Documents/BIGLWA-API-Recovery`
5. Run the offline safety check: `node --test scripts/oauth-worker-config.test.mjs`
6. Verify Wrangler: `npx wrangler@4.158.0 --version`
7. Optionally test compilation without uploading: `npx wrangler@4.158.0 deploy --config wrangler.toml --dry-run`
8. When ready to authenticate: `npx wrangler@4.158.0 whoami`; it may open a browser authorization page.

**Do not run** `wrangler deploy`, `wrangler versions deploy`, or `wrangler secret put` until the full plan is checked: ordinary secret put can activate a production change immediately. Never paste a token, full secret, or plaintext credentials in chat or GitHub.

## How the actual recovery can work

Collect all nine original developer-app credentials privately, and preserve the old STATE_SECRET if it can be recovered. Never blindly rotate active credentials. With the correct account, original credentials and storage bindings verified, Wrangler supports `versions upload --secrets-file <private-file>` to stage Worker code and encrypted secrets together **without switching production traffic**. This may solve the static-only dashboard/required-secrets catch-22. Only after staging should we inspect the version, validate the KV/R2 bindings and test API/OAuth paths with a test account. Production activation needs a separate decision and rollback plan.

The plaintext secrets file, if used, belongs outside the public repo and must have restricted filesystem permissions. Do not generate or paste it yet; we'll walk through that step after the required credentials are accounted for.

## Other context

The isolated `biglwa-lwazi-pilot` Worker and the BIG LWA website are separate and must remain unchanged during this repair. See issue #60 for the missing original OAuth credential list.

Official Cloudflare references:
https://developers.cloudflare.com/workers/configuration/secrets/
https://developers.cloudflare.com/workers/wrangler/configuration/
https://developers.cloudflare.com/workers/wrangler/commands/workers/
