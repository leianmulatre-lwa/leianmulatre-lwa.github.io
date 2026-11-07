# BIG LWA — release reliability and lighter-repository path
Updated November 6, 2026. No secrets or personal account data in this report.

## Confirmed blocking error: Cloudflare biglwa-instagram-api

Cloudflare Workers Builds attempted to deploy main using npx wrangler deploy (Wrangler 4.158.0). Consecutive builds b104221b-533a-4380-a3f7-788a1b865e35 and 5a2a467e-b774-45ff-a9a9-381b2ab2a545 failed on the same encrypted-secret validation, not a transient compilation error.

The required names in wrangler.toml are:
FACEBOOK_PERSONAL_APP_SECRET, INSTAGRAM_APP_SECRET, PINTEREST_APP_SECRET, SNAPCHAT_CLIENT_SECRET, STATE_SECRET, TIKTOK_CLIENT_SECRET, TUMBLR_CONSUMER_KEY, TUMBLR_CONSUMER_SECRET and X_CLIENT_SECRET.

Cloudflare returned no names via the Worker secrets API, no bindings via its settings API, and no resource bindings on inspected deployed Worker version 6282f36d-6964-46a8-8b7d-5eda93574a91. This does not establish that the public API hostname or existing OAuth flows are healthy. The checked-in wrangler.toml separately declares a KV binding OAUTH_SESSIONS, an R2 binding WALLPAPER_BUCKET and multiple non-secret public variables.

### Safe recovery
1. In the correct Cloudflare account and Worker environment, restore all nine encrypted secrets using authentic original provider credentials. Never paste their values in GitHub, logs, chat or this report.
2. Before rotating STATE_SECRET or application secrets, investigate continuity of in-flight OAuth and previously connected accounts.
3. Confirm KV and R2 bindings, callback origins and provider configuration; do not deploy a bare Worker script that removes managed resources.
4. Rerun the guarded Worker build and verify API health, OAuth returns and import/storage paths under test accounts.
5. Do not remove the secrets.required check or invent placeholder values to make a red build appear green.

Tracked separately in GitHub issue #60. No production OAuth secrets or bindings were changed in this update. The biglwa-lwazi-pilot Worker is separate; it uses free-first Cloudflare inference with paid providers disabled.

## Repo health and lighter migration

More than 4,000 commits is history, not 4,000 browser-loaded scripts. Measure startup loading, large source/assets, widget rendering, API retries and cache behavior separately.

Run GitHub Actions workflow BIG LWA source and deployment inventory to produce a JSON report of the currently checked-out tree, top-size paths, number of scripts referenced by index.html, local missing assets and required secret NAMES. The workflow reads files, uploads a report artifact and never edits source, reads secret VALUES or rewrites Git history.

For a lighter repository, export a tested tagged main snapshot using git archive or a shallow clone instead of rewriting the current production history. Record all route/versioned script dependencies; package/optimize verified files; retain third-party licenses and legal pages; define separate staging environment, Firebase configuration and Cloudflare bindings. Preserve private user media out of public archives. Check signed-in and signed-out UX, OAuth, Firestore and R2 migrations before any DNS transfer. Do not bulk merge unrelated branches or claims from old PRs.

Open security/media issues #57 and #56 and original Workshop vault PR #54 need independent authenticated integration review. Green page checks alone cannot close them.

## Visual-Life and SoundCloud

- werk-main is a vendored copy of JobSpy 1.4.1, MIT (copyright Cullen Watson and contributors). Its Python scrape_jobs yields a pandas DataFrame.
- Visual-Life's default JSON is explicitly NOT published. One manual GitHub Actions workflow, Visual-Life jobs · manual vetted feed, can run a bounded single-board search (no proxies, ten results, no extra description fetch). Valid postings are saved with original employer/source links and a timestamp. Failed or empty scrapes must not overwrite previously validated data.
- The UI discards jobs feed older than 96 hours. Do not schedule continuous scraping until source policies, rate limits, attribution, resources and quality are independently reviewed.
- SoundCloud developer API search requires an authorized app; the app instead offers SoundCloud search-page links and official user-selected oEmbed players. Add to Tunes saves account-keyed browser bookmarks, not copyrighted audio, and does not synchronize to cloud storage.

## Release checklist

1. GitHub tests: Lwazi, Pages, login/Studio, Visual-Life, ArtCraft, media and Stream. Fix source or update obsolete expectations only when current behavior is verified.
2. Confirm Cloudflare Pages commit matches merged main; independently verify the biglwa.com GitHub Pages/custom-domain release.
3. Check desktop, mobile, night mode, Skeleton Key collapse, music embeds, Tunes saves and Visual-Life with actual browser interaction.
4. After restoring secrets, validate OAuth Worker settings, provider callbacks and private/public media access under real signed-in accounts.
5. Check legal disclosure, third-party license notices, accessibility, user privacy and rollback steps.
