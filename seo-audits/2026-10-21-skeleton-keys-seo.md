# Big LWA — Skeleton Keys layout and technical SEO scan

Date: October 21, 2026 (Los Angeles). Baseline production commit: `3486addf90a920950375c4f530d40e29e23d841b`.

## Layout changes

- Skeleton Keys is the first text control above the widgets; removed the duplicate body heading and top ankh launcher.
- Tour and close controls occupy their own row above the title.
- Hidden symbol legend takes no space until opened.
- Tile symbols use invisible 30px square cells beside wrapping labels. Widget-header symbols use 32px cells with contained 28px artwork.
- Existing body filters, navigation, docking, account layout and tutorial actions are preserved.

## Verification

- Production-shell DOM test covers the first text launcher, opening the hub, static action-row positioning, hidden/open/closed legend, square icon wrappers and nonempty labels.
- Existing toolbar runtime covers docking, drag, save/reload and late symbols.
- 69 repository workflow commands passed before the metadata-only cleanup.
- This is not an authenticated visual-browser verification. Screenshots supplied by the owner were reviewed.

## Live HTTP and source scan

- 95 live URLs checked: 15 page/route/robots/sitemap probes, 73 active script/style URLs and 7 bootstrap/chunk files.
- All 73 active scripts/styles returned HTTP 200; all exist in the repository. All bootstrap/chunk files returned HTTP 200.
- All 15 repository HTML entry points inspected for title, description, canonical, robots and H1.
- Homepage and About have distinct title/description, a single canonical, index/follow directives and Open Graph metadata. Homepage JSON-LD is present. Homepage H1 is in the no-JavaScript fallback; the interactive app depends on client rendering.
- robots.txt and sitemap.xml returned 200. Studio/settings/archive remain excluded from crawling. Settings has noindex,nofollow.
- Unknown URL probe correctly returned HTTP 404.

| URL | HTTP status | Canonical |
|---|---:|---|
| `/` | 200 | https://biglwa.com/ |
| `/about/` | 200 | https://biglwa.com/about/ |
| `/privacy/` | 200 | https://biglwa.com/privacy/ |
| `/data-deletion/` | 200 | https://biglwa.com/data-deletion/ |
| `/settings/` | 200 | https://biglwa.com/settings/ |
| `/studio` | 404 | — |
| `/studio?view=orbit` | 404 | — |
| `/studio/map` | 404 | — |
| `/studio/politc` | 404 | — |
| `/terms` | 404 | — |
| `/rights` | 404 | — |
| `/affidavit` | 404 | — |
| `/robots.txt` | 200 | — |
| `/sitemap.xml` | 200 | — |
| `/does-not-exist-seo-check` | 404 | — |

## Small corrections in this release

- Added the missing description to Data Deletion.
- Added existing public Privacy and Data Deletion canonical URLs to sitemap.xml.
- Advanced changed asset versions and the release marker.

## Remaining SEO findings

1. Direct Studio routes and public Terms/Rights/Affidavit routes return server HTTP 404 and rely on the JavaScript fallback. This is a hosting/route architecture issue, not evidence that their app content was deleted. Public policy routes need real static pages or server rewrites before they can reliably be indexed. No routing or authentication redesign was bundled into this layout change.
2. Homepage/About do not declare og:image; a deliberate public share image is still needed.
3. Runtime loaders and standalone map/Booth/arcade/avatar tools have sparse metadata; their indexing policy should be decided separately from public landing pages. Do not delete the old-named loaders: current index actively depends on them.
4. No Search Console indexing data, real-user Core Web Vitals, Lighthouse score, or authenticated rendered crawl was available. HTTP/source checks do not establish those results.
5. Redirect-hop counts were not captured by the HTTP client; final URLs and response status were checked.

## Scope

This scan covers public technical SEO, current entry-point assets and route status. It does not claim a full external-backlink audit, search ranking audit, or account-data audit.
