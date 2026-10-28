# BIG LWA — SEO surface and legacy-runtime scan
**Reviewed:** October 28, 2026 (Pacific).
**Source:** worktree at `origin/main` `3ce28dd6`, clean before this pass; release marker `20261027-lwazi-flagged-queue-v2` matches the live `index.html`.
**Method:** source and static-file inspection, live HTTP requests against `https://biglwa.com`, and one guest Chromium render of `/` and `/leian-mulatre/`. No Lighthouse, PageSpeed, Search Console, or authenticated Studio session was used. Claims below are limited to what those methods can show.

## Executive state
- Live deployment matches the current source release marker; the guest homepage boots to the login hero, and the founder page renders as a static document.
- Five of the requested UI items were already on `origin/main` and are cited below. Two small gaps were still open and are patched in this pass (uncommitted).
- Four follow-ups from the first pass were approved and applied the same day: `/affidavit` is now a real page, the dead `runtime-stable.js` bundle is removed, private accounts clear their public stats mirror, and internal affidavit links use the final URL.
- One public-facing defect is **not** a repo-code defect: `www.biglwa.com` fails TLS on every request.

## Changes made in this pass (uncommitted)
1. `studio-account-insights.js:191` — the Pinterest segment now renders only when a `monthlyViews` value exists. Previously a null value printed `Not supplied monthly views (not reach)`.
2. `studio-onboarding.js:472` — `Hide hover hints and previews` moved to the last position in the Skeleton Key hub, after Symbol key and Important/Legal, as requested.
3. `affidavit/index.html` — new static, crawlable page carrying the same affidavit text the SPA already renders, with unique title/description/canonical/OG/Twitter metadata and a `WebPage` JSON-LD graph. Added to `sitemap.xml`, and the four internal links plus `policy-card-cohesion.js` now point at `/affidavit/`.
4. `runtime-stable.js` — removed from `index.html` and deleted. It never executed (see the code-scan section), and its decoded payload is a superseded Studio runtime.
5. `studio-account-insights.js:153-163` — a private account now deletes `publicStats` from its public `usernames` document with `deleteField()`, instead of leaving a stale mirror behind. The signature guard prevents repeat writes, and going public again still republishes.

Verification: `node --check` on every changed JavaScript file, and `node site-integrity-test.mjs` exits `0`.

## Requested UI items — status on `origin/main`
| Item | Status | Evidence |
| --- | --- | --- |
| Pinterest stats say "reach" | **Deliberately not relabelled.** Pinterest reports monthly views/impressions, which are not reach. The banner already shows aggregated `Reach`; provider rows keep the guarded `monthly views (not reach)` wording, now omitted when absent. | `c43712be`, `studio-account-insights.js:168-192` |
| Topbar symbol: current widget at rest, tipi on hover, click returns to Studio | Present | `60cd0750`, `30855597` |
| Uniform symbol sizing against the crest | Present | `studio-tipi-navigation-20261026.css` |
| Studio landing shows crest; crest click is a home action, not Veve | Present | `30855597` |
| Studio symbol replaces the journals symbol | Present | `71c66011`, `studio-onboarding.js:459-472` |
| Preview mode shows the visitor view with a banner above the search bar | Present in source; **not verified signed in** | `d283075c`, `studio-preview.js:507+` |
| Hide hints last in the Skeleton Key; Likes also shown | Likes present (`c43712be`, `b3f7ef5a`); ordering was still wrong and is patched here | `studio-onboarding.js:470`, `studio-account-insights.js:168` |
| Archive Highlights button recovery + Snapchat migration source | Present | `e7a415d4`, `d2843aa1`, `ac27c74d` |

## Live SEO surface (HTTP, October 28, 2026)
| URL | Status | Title len | Desc len | Canonical | Robots meta | OG image | JSON-LD |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 200 | 58 | 149 | yes | `index,follow` | yes | WebSite, Organization, Person |
| `/about/` | 200 | 43 | 140 | yes | `index,follow` | yes | AboutPage, Organization |
| `/leian-mulatre/` | 200 | 50 | 163 | yes | `index,follow` | yes | ProfilePage, Person, Organization |
| `/terms/` | 200 | 22 | 121 | yes | `index,follow` | yes | none |
| `/rights/` | 200 | 35 | 125 | yes | `index,follow` | yes | none |
| `/privacy/` | 200 | 24 | 107 | yes | **missing** | **missing** | none |
| `/data-deletion/` | 200 | 36 | 135 | yes | **missing** | **missing** | none |
| `/sitemap.xml` | 200 | — | — | — | — | — | 7 URLs, no `lastmod` |
| `/robots.txt` | 200 | — | — | — | — | — | allows public, disallows `/settings`, `/studio`, `/archive` |
| `/assets/brand/og-biglwa.png` | 200 | — | — | — | — | 26 KB, 1200×630 | — |
| `/studio` | **404** | — | — | — | — | — | served by `404.html` shell that rewrites the document |
| `/affidavit` | **404 at scan time** (fixed in this pass; pending deploy) | — | — | — | — | — | — | was rendered only after the 404 shell booted the SPA |
| `https://www.biglwa.com/` | **TLS failure** | — | — | — | — | — | certificate SAN does not include `www.biglwa.com` |

## Findings
### P1 — `www.biglwa.com` is unreachable over HTTPS
The apex certificate does not cover the `www` host, so every `https://www.biglwa.com` request fails before HTTP. `index.html` tries to redirect `www` to the apex, but that script only runs after a successful TLS handshake. This is a DNS/GitHub Pages custom-domain setting, not a code fix; it needs the `www` CNAME and the certificate to include the host, plus a redirect rule at the edge.

### P1 — the crawlable homepage is thin and structurally noisy
- Raw HTML carries **53 words** of readable text; the product itself is behind authentication and client-side boot.
- **Three `<h1>` elements** exist in source: the `noscript` fallback, the login-laptop hero, and the load-failure fallback. Only the login hero is visible in a guest render (`a bigger you, a brighter world.`).
- No `<meta name="theme-color">`, so mobile browser chrome does not match the `#27060e` brand background.
- The guest page spends its first render on a loading state, then shows the login hero. This is a legitimate design choice, but it leaves search engines with very little topical text to rank.

### P2 — `/affidavit` was linked publicly but never materialized — **fixed**
`/affidavit` was linked from `about/index.html` (twice), `terms/index.html`, `rights/index.html`, and `policy-card-cohesion.js`, with no `affidavit/` directory. The content existed only inside `index.html` (`#affidavitPage`) and `policy-canonical.js`, so visitors saw the page only after the `404.html` shell booted the SPA, while crawlers and link previews saw HTTP 404. `affidavit/index.html` now serves the same text as a static page and is listed in the sitemap. Verify the live URL returns 200 after deploy.

### P2 — privacy and data-deletion pages lack robots and social metadata
Both pages have titles, descriptions, and canonicals, but no `meta robots`, no Open Graph, and no Twitter card, unlike `terms/` and `rights/`. Sharing either URL produces no preview image.

### P3 — no structured data on legal routes
`terms/`, `rights/`, `privacy/`, and `data-deletion/` have no JSON-LD. A `WebPage`/`BreadcrumbList` graph with the existing Organization `@id` would be consistent with the other pages and cheap to add.

### P3 — sitemap has no `lastmod`
Seven URLs, all valid, but no change timestamps, so recrawl prioritization is left to the crawler. `lastmod` can be generated from file mtimes at build time rather than hand-maintained.

### P3 — SPA routes return 404
`/studio` and `/login` returning 404 is intentional and blocked in `robots.txt`, but it means any external link or social share to those paths shows a 404 preview. `/affidavit` is the only SPA route that is a public policy page and should not be in this category.

## Code scan
- **JavaScript syntax:** 164 in-repo `.js` files (excluding `node_modules`, `.git`, and the two skipped scrape folders) all pass `node --check`.
- **Local asset references:** across the eight static entry documents (`index`, `404`, `about`, `terms`, `rights`, `privacy`, `data-deletion`, `leian-mulatre`), 174 local `src`/`href` references resolve except `/studio`, `/login`, and `/affidavit`. The first two are routes by design; `/affidavit` is the P2 above.
- **Shell payload:** the boot shell references 118 distinct local script/style assets. All exist and none is included twice.
- **Legacy runtime (`runtime-stable.js`) — removed on October 28:**
  - The file was a single `eval` of a base64 gzip blob. The blob's gzip trailer was corrupt: `zlib` inflated 43,856 bytes but reported `incorrect data check`, and Chromium's `DecompressionStream` rejected it with `TypeError: Failed to fetch`.
  - Confirmed on the live page before removal: `window.__biglwaCanonicalRuntime` was `false`, so the bundle never executed. Nothing else in the repo reads that flag.
  - The decoded payload (obtained by ignoring the checksum) is a **complete legacy Studio runtime**: it rebuilds widget docks, rewrites policy cards, replaces profile card markup, and intercepts `#loginCard` submit with `stopImmediatePropagation`. Had the checksum been "fixed," it would have run alongside `studio-tipi-navigation-20261026.js`, `module-pages.js`, `account-boot.js`, `profile-module-sharing.js`, `policy-canonical.js`, and the current search/login handlers.
  - The tag is gone from `index.html` and the file is deleted. Do not restore it; if a canonical runtime is still wanted, rebuild it from current sources behind a build step that verifies the gzip checksum.

## Firestore notes (from `firestore.rules`, not deployed-rule verification)
- `usernames/{username}` allows `read: if true`. The document includes `uid` and `publicStats`, so privacy is enforced by the client (`firebase-directory.js:328` nulls `publicStats` when `accountVisibility === 'private'`), not by the rules. A direct REST read still exposes the raw values.
- `sharePublicMetrics()` used to return early when the account was private (`studio-account-insights.js:154`) without clearing an existing `publicStats` field, so the raw aggregate mirror survived a switch to private even though the UI hid it. It now deletes the field.
- `usernames` updates only require the owner and an unchanged `uid`; field shape (including `publicStats`) is unrestricted, so a modified client can write arbitrary public stats.
- `sharedModules` reads are privacy-gated server-side; that path is sound.

## Not verified
- Signed-in Studio behavior: preview banner placement, masthead hover/click, tipi sizing, Skeleton Key ordering and Likes, Archive Highlights recovery, Snapchat import.
- Mobile widths and pointer/touch behavior.
- Lighthouse, Core Web Vitals, Search Console coverage.
- Which Firestore rules version is actually deployed to the project.
- Cloudflare Worker health (`api.biglwa.com/*/health` responded during the guest render but was not asserted).

## Recommended next steps
1. Point the `www` host at GitHub Pages and reissue the certificate; add an edge redirect to the apex.
2. Add `meta robots`, OG/Twitter, and a small JSON-LD graph to `privacy/` and `data-deletion/`; add `WebPage` JSON-LD to `terms/` and `rights/` for parity with the new affidavit page.
3. Add `theme-color`, reduce the homepage to one `<h1>`, and add a short static description block for crawlers.
4. Add `lastmod` to `sitemap.xml` from file timestamps at build time, and add the sitemap URL to Search Console.
5. Verify `/affidavit/` returns 200 and is indexable after this deploy; then check the remaining signed-in UI items in the "Not verified" list.
