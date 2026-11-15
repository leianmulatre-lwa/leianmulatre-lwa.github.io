# BIG LWA — Public discoverability and login-voice release audit
**Reviewed:** November 15, 2026 (Pacific). **Scope:** GitHub source, public marketing pages, and staged deployment tests. Search Console / Bing analytics and production-domain DNS were **not** available for authenticated validation.

## What this release changes
1. Login laptop headline: “a bigger you, with control.” Supporting copy connects optional social platforms and the user's broader social body; “one rule: the law starts with you” sits as a smaller manifesto line, not a claim about legal obligations.
2. Public /discover/ hub linking six distinct search-intent guides plus existing /free-tools/. Every guide has a unique H1, title, description, canonical, OG/Twitter metadata, accessible copy and WebPage/BreadcrumbList JSON-LD.
3. /online-games/ — browser arcade and third-party multiplayer listings, without implying BIG LWA native multiplayer matchmaking.
4. /fare-checker/ — route-model distance/time and Uber/Lyft and delivery provider handoffs, **not** live fare or delivery quote APIs.
5. /live-shows/ — Stream/curated broadcasts without inventing current live status.
6. /free-knowledge/ — publicly accessible books, encyclopedias, official records and source-verification workflow.
7. /power-and-politics/ — contextual explanation of “eat the rich” and evidence-based wealth/power research; no violent endorsement or guilt-by-listing.
8. /connect-social-platforms/ — Orbit connection choices, API permissions, and import limitations, without blanket promises of all-platform access.
9. Public About and free-tools navigation cross-link the hub and guides; home login contains unobtrusive crawlable HTML anchors in the rendered laptop scene. sitemap.xml includes all seven URLs; robots.txt already permits these public routes and disallows authenticated Studio routes.
10. Privacy and Data Deletion pages receive missing robots meta, OG/Twitter image and basic WebPage schema. Home obtains a brand-colored mobile theme-color.
11. In-app L’wazi maps closely matching searches for games, fare checking, live shows, wealth/political rhetoric, encyclopedias, and social connection into the relevant first-party guide and Studio module. Generic questions do not trigger promotional cards.

## Technical choices
- Public guides are **static HTML** (no login, data fetch, or client rendering needed to read the content). JavaScript is not required to render their primary body, links or metadata.
- Shared CSS supports dark system appearance, visible keyboard focus and reduced motion.
- Legal and privacy statements are not exaggerated; providers determine live availability and rights. No fabricated Review, Offer, FAQ rich results, app scores, prices or current traffic.
- Titles and descriptions are not filled with endless query synonyms; each page addresses a distinct user task and is interlinked from the topical directory.

## Outstanding work that source code cannot establish
- **Google Search Console:** Verify domain ownership and submit https://biglwa.com/sitemap.xml, inspect indexing, enhancements, Core Web Vitals and actual organic queries. A page being crawlable does not guarantee indexing or search rank.
- **Bing Webmaster Tools:** Verify the domain and submit the sitemap. Consider IndexNow only after obtaining and configuring a domain-specific key.
- **Production DNS/TLS:** The October 28 audit reported broken HTTPS for www.biglwa.com. Revalidate the production CNAME, certificate and canonical redirect before promising the alternate hostname works. No DNS records were changed in this release.
- **Public homepage rendering:** The root still relies on a large login/Studio boot script; earlier scan found thin initial HTML and multiple fallback H1 elements. Public static guides mitigate discovery for feature-specific searches, but a full server-rendered marketing homepage is the better future improvement.
- **Measure rather than guess:** After indexing, examine impressions, CTR, indexed pages and real terms by feature; update titles/content based on observed demand, not fabricated traffic estimates.
- **Accounted source status:** Live fares, arbitrary third-party multiplayer, current broadcaster status and full social-platform sync require provider approvals/capabilities. The pages explicitly distinguish what works from what is planned.

## Regression expectations
`node --test discovery-seo-20261115.test.mjs` validates unique public metadata, sitemap and internal links, content caveats, login voice, dark/keyboard style support, and matching L’wazi search intents. GitHub Pages preflight and deploy workflows require this test.
