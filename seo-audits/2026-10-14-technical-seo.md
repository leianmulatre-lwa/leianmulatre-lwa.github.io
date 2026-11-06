# Big LWA — Technical SEO and publishing audit
**Date:** October 14, 2026
**Scope:** GitHub Pages source files and deployment configuration (not an external Lighthouse crawl).

## Summary
- **Static HTML title:** Big LWA | Creative Social Network for Art, Music & Culture (58 characters)
- **Static description:** 149 characters. Present.
- **Primary canonical:** https://biglwa.com/ (present).
- **HTML language:** Added `lang="en"` to the public shell; added a no-JavaScript fallback with descriptive content.
- **Structured data:** Homepage includes WebSite JSON-LD.
- **Open Graph:** Homepage title, description, URL and type present. Public About page metadata improved.
- **Robots/sitemap:** Robots file references a valid-format sitemap with the homepage and About page. Studio, settings and archive routes are excluded from crawling.
- **Account privacy:** Settings page now includes a noindex directive.
- **Runtime path inventory:** Checked 37 JS, CSS and HTML references in the homepage loader; **all 37 were present** in the GitHub repository. Checked five `site-*.txt` base-page chunks; all present.
- **Studio regression:** Found and fixed a syntax error (`electionPanel++categories`) in `module-pages.js`. Index loader, module script and recovery script subsequently passed JavaScript syntax parsing.
- **Deployment:** Pages workflow now validates required assets and politc/calendar wiring before publishing. Publish artifact excludes development-only paths (`.github/`, `*-test.mjs`, Markdown audit/docs, .env, log and OS metadata).
- **Preservation:** All user-generated media, saved data, Pinterest/Orbit integrations, legacy runtime loaders, route fallbacks and current widget files remain intact. Nothing was removed from a user data store.

## Still to verify / recommended follow-ups
1. **Live crawl:** Automated fetching of `https://biglwa.com/`, `robots.txt`, `sitemap.xml` and `/studio/politc` was unavailable in this session. HTTP status codes, rendered DOM, redirect chains, PageSpeed/Core Web Vitals and real-world indexing remain **unverified**. Check with Google Search Console URL Inspection and PageSpeed Insights.
2. **Social preview:** No `og:image` is declared in the inspected homepage metadata. Add a correctly sized, verified public image when one is chosen.
3. **Favicon:** No standard root favicon was verified from the tested candidate paths; supply a site icon and verify it loads.
4. **Public profile URLs:** `404.html` provides a JavaScript SPA fallback. GitHub Pages may still return HTTP 404 for direct `/username` requests. If public creator profiles should be indexed, use an HTTP 200 route or server-rendered profile pages with unique title, description, canonical and structured data.
5. **Dynamic content:** Homepage app content is assembled through JavaScript and a legacy bootstrap/base loader. Static metadata and no-JS fallback were improved, but fully server-rendered landing-page text would further strengthen crawl reliability.
6. **Search Console:** Submit `https://biglwa.com/sitemap.xml`, verify ownership, review Pages indexing and Core Web Vitals reports, and request indexing of the public homepage/About pages.

## Publishing controls
- Source integrity: `site-integrity-test.mjs` (run by `.github/workflows/pages.yml`).
- Public artifact cleanup: staged with `rsync`, excluding only development-only files.
- Preserve existing runtime assets: `bootstrap-v2.html`, `base-v1.html`, `site-*.txt`, `module-pages.js`, `studio-recovery.js`, and account media paths.
- Do not delete or migrate old data/cache keys until their runtime references and storage ownership are audited.

**Overall:** SEO fundamentals are in place in source, but a live rendering/crawl and Search Console data are needed for any verified indexing or performance score.
