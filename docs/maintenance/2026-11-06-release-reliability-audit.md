# BIG LWA — release and reliability audit
**Review date:** November 6, 2026 (Pacific)  
**Scope:** Github canonical site, Cloudflare Pages and Instagram/Orbit Worker, L'wazi, Studio loader, Orbit controls, TikTok, release workflows, imported Tweepy.

## Release contract
1. `main` is the only canonical website release. Pull requests do not become production until merged and a **successful Pages production deployment is observed for their commit**.
2. Website and OAuth/media Worker have **independent releases**. Never equate a Pages build with a Worker build.
3. Never deploy a Worker without confirming all nine encrypted OAuth secrets, `OAUTH_SESSIONS` KV and `WALLPAPER_BUCKET` R2 bindings. User-specific tokens are not shared application secrets.
4. Stage Worker versions (non-activating upload) then verify and promote deliberately; preserve existing production while unknown.
5. No mass deletion of history, credentials, buckets, account documents or unmerged backup branches.
6. Do not claim signed-in browser functionality from source tests or health responses alone.

## Verified findings and fixes in this release

| Area | Inspection / cause | Change | Verification |
| --- | --- | --- | --- |
| Pixel curtain | readiness recomputed on every DOM mutation or delayed image, so after hiding it could reappear briefly | latch reveal per module only after ~450ms stable ready; reset on real module transition; keep Veve and bypass behavior | regression tests incl. JSDOM Veve curtain |
| Orbit actions | fixed 140px card + 34px nowrap flex shrink and overflow could hide buttons | keyboard-accessible horizontally scrollable action strip with unshrunk buttons | source regression and syntax |
| TikTok Orbit card | TikTok script injected a **second** Connect, Disconnect and status label into the same packed Orbit action strip | Orbit owns controls; TikTok publishes status without extra buttons; new **Sync now** action refreshes authorized profile/posts without restarting OAuth | tiktok-connect regression + release test |
| TikTok content | Worker health advertises `basicProfileOnly: true` and only requests `user.info.basic` unless TikTok developer approval enables `video.list` | display truthful limited-scope status; retain public-post link import fallback | signed-in TikTok sync remains **unverified** until actual provider approval and user session |
| GitHub readability | Tweepy 4.17.0 Python library was uploaded as root README, LICENSE, pyproject, tests and package, misrepresenting the site as Tweepy | exact Git tree/blob preservation under `third_party/tweepy`; restore first-party BIG LWA README; document navigation and release contract | files, license and tests preserved by original Git object SHA |
| OAuth Worker release risk | CI automatic `npx wrangler deploy` could activate a version even though its nine required secret values aren't present at build time | Cloudflare builds set to `npx wrangler versions upload --config wrangler.toml` (stage-only), triggered only for Worker/TOML paths; preview path filter aligned | Cloudflare API PATCH + GET confirmed in account |
| OAuth recovery | local 9-secret file, accurate Worker config, KV/R2 values already established but source audit was in isolated PR #65 | carry forward config test, no-deploy workflow, local recovery runbook | CI config assertions |
| Pinterest CI | assertions expected old six-tile board preview after site intentionally shipped portrait + four squares | update assertions to compare canonical current gallery and honest linked/not-linked behavior | GitHub Pinterest workflow (must pass before release) |
| L'wazi voice | main `lwazi/policy.mjs` already addresses privacy, rigorous Black/feminist knowledge, founder's Three Body method, and rejects canned stereotype slang | preserve existing contract; do not overwrite with a generic persona | inspected source only; **real model conversational behavior not verified** |
| X user token | PR #66 would add private manual token entry; founder explicitly worried about cross-member credential sharing | **keep draft, do not merge**; standard per-user OAuth remains preferred | no live deploy for PR #66 |

## Cloudflare operations
- The live `biglwa-instagram-api` Worker was most recently inspected with 17 bindings (9 encrypted text secrets, KV, R2), a 100% active version, and `api.biglwa.com` configured.
- User corrected `INSTAGRAM_APP_SECRET` in private Mac file `~/.config/biglwa/oauth-secrets.env`. **This does not update Cloudflare automatically**. Its production secret value cannot be read through Cloudflare or verified from this repository. Next authorized local step: stage a fresh version using a **known-good current** Worker source and the corrected private file, inspect bindings/preview, then promote. Do **not** overwrite with an older branch or send the value to chat.
- Automatic Worker builds may still **fail** because GitHub/Workers Builds do not hold all nine secrets, but stage-only deploy command prevents them from unexpectedly activating. A future dedicated release workflow should provide secure deploy-time secrets or use a securely authenticated manual owner deployment, never a public file.
- Cloudflare Pages `biglwa-web-staging` has successfully deployed prior main commits; compare the final merge SHA to its production record before reporting any new release.

## Open PR disposition (no destructive merges)
- **#67** — release reliability candidate; merge only after source CI verifies and current main has not drifted.
- **#65** — OAuth preflight drafted; its three safe files are incorporated into #67. Once #67 merged, close #65 as superseded, keeping branch/history.
- **#66** — manual X user token; founder wants user-scoped logins without entering developer credentials; **do not merge**. Close as superseded if no future manual-token use is desired, but preserve branch.
- **#58** — older L'wazi Studio search, merge conflict; compare with merged #61 before closing superseded PR; do not merge wholesale.
- **#54** — project vault R2 private storage. Security-sensitive and substantive; dedicated review required before merge.
- **#42** — SEO metadata and public social previews; old merge conflict. Review recovered work and compare to `main`.
- **#13** — auth session privacy/Pinterest card changes; old branch with possible useful protections; inspect for regressions before any merge.
- **#10** — 2026-09 old boot rollback, conflicts with current Studio; do not merge/revert current layout.

## Backlog and security boundaries
- **#63 ArtCraft**: photocraft release test fails because staged editor lacks a real WASM artifact. Do not fabricate a .wasm or silence the test.
- **#57**: authenticated private backup download vs public media GET. Requires a separate security audit, not a wholesale backend merge.
- **#56**: independent private R2 backup and restore still pending. Never delete primary R2 objects.
- **#55**: highlights discovery/migration still requires consented provider integration.
- **TikTok**: verify Login Kit Web approval, exact callback, `video.list` / `user.info.profile` scopes and developer consent. Source checks cannot issue approval.
- **L'wazi**: compare live `biglwa-lwazi-pilot` version against `lwazi/policy.mjs`, test actual greetings, questions, source grounding, tool actions and load. Repo prompt wording alone is not proof.
- **Privacy**: validate Firebase UID/session guards for all provider routes, signed-out preview, authorization expiry, R2 paths and OAuth callback replay protection in a dedicated threat-model review.
- **UI**: actual browser smoke check of signed-in Studio loader, responsive Orbit actions, TikTok connection, MyFeed, Boards, Stream Dock, Trophy spacing and guest preview. CI tests do not replace these checks.

## Branch organization
- Repository has ~80 branches (many backup and October checkpoints). **No branches deleted**, since preserving earlier art/assets or unmerged changes may matter. Use PRs for current work; postpone deleting branches until owner approves an explicit proposed list and confirms backups. Keep `main`, release branch until merged, historical `backup/` + `checkpoint/` until reviewed.
- Third-party Tweepy source is now isolated and preserved under `third_party/tweepy/`. Moving it does not run it on JavaScript Cloudflare Workers; its MIT license does not waive X API access charges.

## Release validation checklist
- [ ] Dedicated release CI green
- [ ] Pages preflight green
- [ ] Pinterest CI matches current five-photo gallery
- [ ] Artifact release issue acknowledged and tracked rather than suppressed
- [ ] Merge current verified PR to `main`
- [ ] Cloudflare Pages shows production success on merged SHA
- [ ] Confirm Cloudflare Worker production version and bindings unchanged
- [ ] Owner stages corrected Instagram secret in inactive version after separately verified source checkout
- [ ] Signed-in manual smoke test for Instagram, Pinterest, TikTok, Orbit, loader and preview
