# BIG LWA · Performance foundation and mindful repository cleanup
**Status:** Working branch only — no production change or deletion
**Captured:** November 16, 2026
**Preserved base:** `snapshot/2026-11-16-pre-performance-cleanup` at `1a10358b521ee912ac193638c5035d647aa56861`
**Working branch:** `refactor/2026-11-16-performance-foundation`

## Principles

1. **Preserve user content before changing delivery.** Keep author originals, accessibility text, attribution, public/private state, import provenance, and existing thumbnails until replacement is independently verified. Never turn an imported user's original or social account data into a globally shared deduplicated object.
2. **Measure, then simplify.** Compare cold and warm load, TTFB, FCP, LCP, INP, CLS, main-thread JS execution, peak memory, network bytes, and map/boards render behavior. A green deploy alone does not mean the browser is fast.
3. **One page, not one giant script.** A lean Studio shell plus independently loaded feature bundles is better than eagerly loading every widget or one enormous combined JavaScript blob.
4. **Two quality tiers, one authentic source.** A tiny preview may *look sharp at its intended display size*, but it cannot recreate discarded original pixels. Preserve a high-quality master in authorized storage and deliver the right resolution on demand.
5. **Privacy is the default optimization.** Do not prefetch unpublished albums, hidden boards, private pins, full contact lists, geolocation, OAuth tokens, or protected account media.
6. **Do not remove evidence or needed history.** Snapshot and test every public path, user import source, legacy OAuth callback, and copyright notice before moving or retiring a file. Do not rewrite Git history casually.

## Source audit and working hypotheses

At this baseline the tracked repository contains **2,747 files / 138,595,724 bytes**. This is repository size, *not* the size loaded by a visitor. Major tracked areas include `assets/` (~67 MB), `archive/` (~24 MB), and several legacy scraped or third-party directories. There are 27 MP4 files (~48.4 MB) under repository history. Do not bulk-delete them without ownership, provenance and live reference checks.

The landing HTML source references **110 unique JS paths (~2.5 MB uncompressed)** and **87 CSS paths (~832 KB uncompressed)**. The Studio entry references **108 unique JS** and **86 CSS** paths. Some are placed into the boot-generated HTML: treat these counts as load candidates, not a verified network waterfall. The page reconstructs its shell dynamically and contains an `eval` bootstrap. That architectural layering should be measured carefully and retired in stages—not with a one-line rewrite.

High-impact entry files include `module-pages.js` (~420 KB), `ui-coherence.js` (~177 KB), `studio-experience.js` (~135 KB), `stream-guide.js`, `user-search-results.js`, and `pinterest-orbit.js`. Their size and startup effects are the first performance investigation, rather than assuming imported photos are the only problem.

## Proposed architecture

```text
static landing / login (minimum critical CSS + JS)
  -> signed-in Studio shell: profile, Skeleton Key, search bar, widget registry
       -> Studio feature loader (module JS/CSS loaded on first open)
            -> Orbit providers (only after explicit connect or view)
            -> Boards, Archive, Feed
            -> Map + route provider(s) (only when opened)
            -> Stream, Radio + visualizer
            -> Politic + Calendar, community, legal
            -> L'wazi + tools, editors, jobs, scraping/search
       -> data APIs: Firebase account state, Cloudflare Worker OAuth, R2 media
            -> original media object (authorized access)
            -> generated widths/format variants and blur placeholders
            -> compact metadata records (URLs, dimensions, hashes, labels)
```

Use route-aware chunks with a stable dependency graph, one controlled initialization per widget, clear teardown when leaving an expensive view, explicit error states, and no duplicate listeners. Lazy-load only components that are not required for page accessibility or startup controls. Dynamic `import()` and build-time splitting need regression tests to preserve the many existing implicit global dependencies; do not convert `module-pages.js` wholesale in one commit.

## Phased work with exit criteria

### 0 · Preserve and protect (created)
- [x] Read-only baseline branch from exact main SHA.
- [x] Separate optimization branch based on the same SHA.
- [x] Landing paths, core artwork references and staging deployment recorded in a source-controlled manifest.
- [ ] Verify screenshot and keyboard navigation for login/Studio/Map/Boards/Legal on both desktop and mobile, signed in and signed out.
- [ ] Confirm GitHub Pages public SHA independently from Cloudflare Pages staging SHA.
- [ ] Record last green GitHub Actions checks, Cloudflare Worker health and private-bucket ownership policies.

### 1 · Instrument and triage
- [ ] Measure cold + warm loads for `/`, `/studio/`, `/legal/` and an opened Studio Map, Boards, Stream and L'wazi instance.
- [ ] Build a dependency graph of the boot-generated script/css links; mark critical, interaction, background, and legacy-only resources.
- [ ] Audit repeated listeners, timers, observers, iframe layouts, large animations, map tile requests, and failed or duplicated OAuth calls.
- [ ] Record production-safe error and latency sampling without storing queries, raw user media or secret-bearing URLs.

### 2 · Startup cleanup
- [ ] Preload only the actually visible login/Studio hero assets; avoid eager imports for hidden modules.
- [ ] Extract cohesive feature bundles, remove overlapping CSS overrides only after screenshot comparison.
- [ ] Stop loading full editors, Map tiles, video frames, visualizers and catalogs at login when they are not used.
- [ ] Move expensive observer and animation work behind visibility checks; tear it down on widget close/minimize.
- [ ] Introduce performance budgets in CI and compare metrics before merging; preserve a rollback path.

### 3 · Media import and delivery
- [ ] Identify each provider's authoritative original, user's requested import scope, permitted caching and deletion behavior.
- [ ] Reject oversized/unsupported uploads early; strip unneeded metadata **only when safe and consent-compatible**.
- [ ] Store canonical originals in private/account-owned R2 paths (or preserve approved source URL when importing is unnecessary). Use per-account SHA-256 to avoid duplicate upload bodies; avoid cross-account existence leaks.
- [ ] Generate tiny blurred placeholders, grid thumbnails and larger viewer variants. Serve `srcset`/`sizes`, AVIF/WebP where supported, and original file only when explicitly requested.
- [ ] Generate a poster for videos; defer MP4 playback and do not convert every media object to base64 JSON/Firestore.
- [ ] Keep browser uploads resumable where needed, and preserve user deletion/export guarantees.

### 4 · Search, scraping and providers
- [ ] Cache public *permitted* third-party results at the server with TTL, ETag / If-None-Match, rate limits and origin attribution.
- [ ] Deduplicate concurrent identical public search requests. Refresh popular catalogs in scheduled batches, not on every member page load.
- [ ] Scrape only where permitted by source terms/robots/rate limits; prefer official APIs/feeds. No unauthorized scraping of social accounts or personal media.
- [ ] Separate page rendering from ingestion. Never block Studio first paint on a scraping job or L'wazi model fallback.
- [ ] Scope authenticated or personalized cache entries to the account; no shared public caching of private responses.

### 5 · Cleanup and release
- [ ] Build an owner-approved removal list with references, checksums, legal/licensing and rollback pointers.
- [ ] Move or archive one unused family at a time; update imports and tests before deleting source paths.
- [ ] Validate rights/legal index and every OAuth return route with exact URLs.
- [ ] Merge only after passing a pull request checklist and confirming no first-load, user-data, color/theme or navigation regressions.
- [ ] Deploy staging, verify release SHA, then publish to the public GitHub Pages site; retain snapshots.

## Operational constraints

The repository README says **biglwa.com is served via GitHub Pages**, whereas **Cloudflare Pages `biglwa-web-staging` is staging**. The `wrangler.toml` describes a separate API Worker with production OAuth/KV/R2 bindings and isolated preview bindings. Do not deploy the API Worker to test a website script or alter its bindings without a dedicated API release review.

Until the file reference graph and provenance are complete, `archive/`, `third_party/`, provider mirror folders (including copied web assets), user media, `assets/`, and historical screenshots are **review-only candidates, not confirmed deletions**.

## First risk register

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Monolithic dynamically rebuilt boot document | Startup latency, hard-to-debug duplicate initialization | Reproduce boot first; route-aware modules, observability, incremental tests |
| Heavy asset and media history | Repository checkout/deploy weight; may include original rights-bound files | Move future media to scoped object storage; verify ownership before cleanup |
| User image quality illusion | Small files cannot equal original pixel detail | Small preview + responsive derivatives + protected master |
| Provider scraping | Rate limits, latency, rights and privacy | API/feeds first, caching, scheduled retries, source attribution |
| Public and staging divergence | “Deployed” may mean only Cloudflare staging | Verify GitHub Pages and canonical domain independently |
| Legal and OAuth route regressions | Redirects can accidentally hide public pages or callbacks | Route inventory, signed-out smoke tests, immutable rollback commit |

See `2026-11-16-landing-route-and-deployment-snapshot.json` and the performance audit script before modifying startup dependencies.
