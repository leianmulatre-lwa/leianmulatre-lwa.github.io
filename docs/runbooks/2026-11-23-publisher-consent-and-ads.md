# BIG LWA advertising, consent and SEO release — 2026-11-23

## Current state and truth in advertising
The website is hosted by **GitHub Pages**, while the OAuth/API Worker is separate. This change only touches the website.
**Ads are OFF.** No AdSense account, publisher ID, real campaigns, or certified CMP configuration has been inferred. The advertising adapter has three disabled gates; do not flip them just because the local preference form shows a positive choice.
The new first-party privacy panel is for *optional on-device experience preferences only*, NOT an IAB TCF consent-management platform.
An opt-in diagnostics counter is stored in sessionStorage under biglwa:optional-diagnostics:v1; BigLWAPrivacy.report() returns it in the opted-in browser. There is no collection endpoint, network transmission, or admin dashboard for these counters yet. A privacy-reviewed anonymous aggregation service, data-retention limits and reporting access would be a separate next step.
The public photo grid ignores posts with isAd, sponsored or advertisement set true; sponsorships will not masquerade as user images.

## Production AdSense / European consent prerequisites (human account action)
1. Apply for Google AdSense, add/verify biglwa.com, and confirm that ad-adjacent content is original or authorized, age-appropriate and within Google publisher policy.
2. In **AdSense → Privacy & messaging → European regulations**, publish Google's certified CMP message for the domain. Use the actual privacy policy URL and disclosures; configure all vendor and purpose choices. Google's European regulations messages support IAB **TCF v2.4** (2026 update). This is not something the BIG LWA repository can certify on its own.
3. Set up required US state opt-outs and review Global Privacy Control handling, children/minors, imported media and regional legal bases. A local analytics checkbox is not a GDPR TC string or a US sale/share opt-out.
4. Configure ads only after approval and CMP tests. The Google CMP must send valid TCF signals and respect accept, reject and withdraw outcomes for EEA/UK/Switzerland. Check the browser's actual network requests and AdSense Policy center for missing-CMP and other regulatory errors.
5. Keep advertising fail-closed until the CMP is live and the publisher account and campaign inventory are verified. Do not set all three code flags true blindly; implement the compliant runtime Google tag/CMP loading sequence and test it before any change that enables ads.
6. Add a real ads.txt entry only using the assigned publisher ID, never a placeholder. Verify that the site's active deploy contains the expected file.
7. Audit every newly enabled ad placement for rights, privacy, disclosure and exclusion of personal photo feeds or research ranking.

Google documentation: https://support.google.com/adsense/answer/13554116 | https://support.google.com/adsense/answer/10960768 | https://support.google.com/adsense/answer/10961068

## Visual placement and indexing
White + clearly visible Sponsored/Advertisement is the Veve color key for paid placements site-wide. Ad components refuse MyFeed and photo contexts. No sponsored cards are inserted by this change. A separately labeled bottom-of-page MyFeed area can be added *after* approved paid inventory exists.
New truthful SEO guides cover free media-player discovery, free creative customization, and brand partnerships. No paywall refers to BIG LWA's core features; third-party providers may charge or require a separate login. All three routes are linked in sitemap and relevant discovery pages.

## Verify before merging / deployment
- node --test privacy-ads-seo-20261123.test.mjs
- node --test discovery-seo-20261115.test.mjs free-tools-seo-20261114.test.mjs
- node --check privacy-consent-20261123.js
- node --check ads-privacy-config-20261123.js
- Test first-visit Reject optional, accepting, saved preferences on refresh, restoring the dialog from Settings, inaccessible storage, and keyboard focus.
- Verify Google ad scripts are absent and MyFeed photo columns contain no sponsored images. Verify pages/sitemap on the public GitHub Pages hostname after merge. Signed-in Studio and OAuth integrations require separate browser verification.
