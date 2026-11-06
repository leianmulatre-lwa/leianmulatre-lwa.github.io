# BIG LWA — October regression, release, and technical SEO review
**Reviewed:** October 24, 2026 Pacific (October 25 UTC).
**Scope:** current GitHub `main`, October commit delta, staging Cloudflare Pages metadata, static landing and public-route source, limited unauthenticated browser rendering, and supplied profile editor screenshot. This is a partial audit, **not** a verified full-site interactive crawl or a full Lighthouse/Google Search Console report.

## Executive state
- **No deletion or rewrite of legacy shell, user records, imports, R2 storage, or Firestore collections.**
- Main is the staging Pages production branch; successful staging deployments cannot by themselves prove a newly built version is active at `biglwa.com` or verify authenticated behavior.
- Browser Rendering returned HTTP 200 for `biglwa.com/`, with usable title/description/OG metadata, but exposed only the `biglwa · loading your studio` text; further authenticated/rendered checks were blocked by rate limits and no user session.
- October compare `a006fe73` (Oct 2) to the review head returned **2,250 commits** and its **first 300 changed files**, not a complete 2,250-commit file inventory. Unsupported to claim every untouched October file was checked.

## Root-causes and safe code corrections
1. **Veve failure:** `veve.js` constructed `videoMarkup` using `validRatio` and `displayRatio` before those `const` values were initialized. Changed evaluation order; a regression assertion now checks this ordering.
2. **Phantom top-right B:** the inappropriate B fallback existed in more than one live path: `account-chrome.js`, `ui-coherence.js`, and the startup `studio-account-boundary-20261019.js`. The chrome also called a placeholder name `BIG LWA`, and `account-photo.js` could pass the handle as avatar name. All now derive the letter only from the member-chosen display name; an uploaded photo renders instead of the letter. `studio-preview.js` and the account entrypoint were version-aligned.
3. **Inconsistent source shadows:** `source-shadow-key-20261025.js/.css` contained brown `Other source`, three-body miniature face colors, and a separate source key from the actual feed. The key now has a neutral bone-ivory face; the explicit categories are personal website/Aura, native BIG LWA rainbow, and advertisements white, plus real source platforms. `feed-view.js` and `orbit-feed.js` now use a single offset shadow instead of multi-layer glows. For authored imports, feed attempts to read the **author's public** `usernames/{username}.look.auraColor` without reading owner-private data or substituting the viewer's Aura. The lookup is capped to 24 unique usernames per load to bound public Firestore reads; an unavailable public Aura uses neutral ivory, not another user's color.
4. **Website Orbit:** added a named `My website` link-only planet, HTTPS validation and existing duplicate/account-scoped Firestore behavior. No invented OAuth verification for arbitrary domains.
5. **Release wiring:** entrypoint import and index asset query versions were updated to avoid stale JS and style caching. CI assertions cover key markup, account B fallback, Veve render order, and actual feed provenance.

## Preserve / do not remove without tracing
- `index.html`, `bootstrap-v2.html`, `base-v1.html`, `site-*.txt` and the `404.html` shell are **runtime-connected**; direct user routes may rely on them. Current search shows `bootstrap-v2.html` and `base-v1.html` referenced by the index loader and existing tests.
- Previous GitHub compare showed four removed `archive/assets/room-*-reference.png` images; search of current code found no string references, but **absence of a code text reference alone is not proof of safe deletion**. Do not purge media / backups / older sources.
- The very large October delta means dormant/obsolete code cannot be certified by simple string or commit searches. A true unused-code purge needs runtime route coverage, dependency graph, data migrations, visual regression snapshots, and a rollback plan.
- Protected provider OAuth, Firestore security rules, and account-owned media require authenticated end-to-end tests; none were performed on a member account in this review.

## Two separate pending integration tracks
- **#55 Automatic consented Highlights migration:** current `profile-social-showcase.js` supports verified public handles / source-hosted Spotlight and manually entered Highlight links, but browser-only optional links are not migrated automatically and provider access to historical Instagram Highlights remains unverified. Do not scrape restricted provider media. Complete only with permitted API access or owner-provided export, metadata sync, and owner permission.
- **#56 Permanent private backup/restore:** existing selected Orbit R2 media copies do not establish a verified full backup. Needs hash-checked owner-only uploads, manifests, idempotent backfill, export/restore/delete, and read-after-write verification independent of source Highlight discovery.
- Neither track is marked finished.

## Technical SEO scan (source + limited public rendering)
| Check | Result |
| --- | --- |
| Homepage title | Present: `Big LWA | Creative Social Network for Art, Music & Culture` |
| Homepage description | Present, ~150 characters, reads as a general discovery/creation pitch |
| Homepage canonical | `https://biglwa.com/` |
| Language / meta robots | `lang=en`; `index,follow,max-image-preview:large` |
| Open Graph | `og:type`, `og:title`, `og:description` present; **`og:image` missing** |
| Structured data | WebSite JSON-LD detected on homepage |
| About | Standalone indexable HTML, unique title/description/canonical, H1; no OG image |
| Legal metadata | Privacy and data deletion have titles/descriptions/canonical/H1; legal route indexing policy must be decided |
| Robots | `/studio`, `/settings`, `/archive` excluded; sitemap declared |
| Sitemap | Four URLs: home, About, Privacy, Data deletion |
| Public profiles and unmaterialized legal routes | Dynamic shell fallback means `/<username>` may HTTP-404 despite client-side display; no static `/terms/index.html` or `/rights/index.html` verified. Existing links need HTTP/DOM testing |
| Dynamic rendering | Auth-free browser render showed only loading screen; **critical content-indexing risk**. Must test fully rendered visitor homepage and stable fallbacks on a real browser |
| Search Console, Lighthouse, Core Web Vitals | **Not run**; no authenticated access or completed Lighthouse crawl |
| Production domain | Homepage 200 via Cloudflare Browser Rendering, but this alone does not prove fresh source release is published to the custom domain |

## Recommended next verification
1. Check latest GitHub Pages workflow, all test jobs, and Cloudflare Pages source commit match the intended deployed version.
2. In a logged-out and logged-in real browser at desktop and mobile widths, inspect Orbit, myfeed, Veve, profile photo upload/removal, preview profiles, Shadows Key and the Skeleton Key; check runtime console/network.
3. Inspect `/terms`, `/rights`, direct `/<username>` responses and JSON-LD; add an appropriately licensed 1200×630 Open Graph image, then run Lighthouse/PageSpeed and Search Console URL Inspection.
4. Verify Firestore public Aura reads, fallback behavior, R2 object integrity and owner-only backup access without weakening Firestore security rules.

**Disposition:** targeted fixes committed with regression guards, no destructive cleanup; broad audit and outstanding integrations explicitly remain open.
