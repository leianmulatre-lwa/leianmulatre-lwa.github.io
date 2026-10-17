# Public metadata and crawl audit — October 17, 2026

## Findings and changes

The public homepage and About page both returned HTTP 200 from GitHub Pages during the live audit. The homepage initially supplied useful metadata, but the bootstrap/site-chunk loader subsequently replaced the document with a legacy head. The replacement contained a generic title and omitted the public metadata.

- Preserve the homepage title, description, canonical, robots directive, WebSite structured data and social tags through the legacy document replacement.
- On client-side navigation to account, callback and unknown/profile routes, remove homepage canonical/social/structured data and apply noindex. Restore the public metadata when navigating home. This does not make private data public or implement profile indexing.
- Add a 1200 × 630 PNG share image, image descriptions, large-image Twitter cards and a favicon derived from the existing stitched crest to the homepage and About page.
- Add AboutPage structured data describing the existing visible About content.
- Allow crawling of Settings so crawlers can read its existing noindex directive; retain the existing Studio and archive crawl restrictions.
- Add metadata, social image dimensions, sitemap/canonical consistency and Settings crawling checks to Pages deployment and PR preflight.

## Validation

- All 44 Node checks used by the Pages/preflight workflows passed locally.
- Full homepage loaded in the in-app browser: the login UI mounted and the final DOM retained the expected title, canonical, robots and social image.
- Isolated DOM integration exercised the actual decompressed legacy document: body/scripts preserved, legacy title overrides corrected, private route transitions excluded, homepage restored, repeated preparation kept one canonical.
- Social preview PNG visually inspected; 1200 × 630 dimensions verified.
- No Search Console account or search ranking data was available. No indexing or ranking outcome is claimed.

## Remaining work

- `/privacy` and `/studio` returned HTTP 404 on direct live requests despite their client-side app routes. Public legal/profile routes need real static responses or carefully scoped server routing. An all-path HTTP 200 rewrite would create soft-404 risks and is not part of this patch.
- Public creator profiles need individual metadata, visibility checks and real HTTP statuses before adding them to the sitemap. Unknown/profile routes do not inherit homepage metadata.
- Submit the existing sitemap and inspect rendered URLs in Search Console after deployment.
- This patch does not claim a Core Web Vitals or Lighthouse improvement. The multistage legacy loader remains a separate performance task.

## References

- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/block-indexing
- https://developers.google.com/search/docs/essentials/technical
