# Big LWA Developer Console — site-coherent shell

The admin tool lives inside BIG LWA at /developer/. The HTML and CSS on GitHub Pages are public resources; private developer content is accessible only after a Firebase session and the server-enforced developerAdmins/{uid}.active === true Firestore rule.

## Routes
- /developer/ — gated overview and actual navigation.
- /developer/mailroom/ — gated, draft-only transactional email editor. Existing Firebase draft-save behavior, preview and exports are unchanged.

## Reused site assets
- /stitched-crest.css — same crest mask used in Studio masthead and login.
- /assets/fonts/cs-bergamot-stitched.otf — same display type as Big LWA.
- /assets/studio-tipi-symbol.svg — existing masthead hover symbol.
- /assets/login-curtain-film-grain-v2.webp — actual curtain texture used by landing/login.
- /assets/loading-blocks-pixel-20261029.png and /assets/loading-globe-pixel-20261029.png — pixel loader art.
- /assets/skeleton-key-pin-32.png, /assets/composition-texture.webp, /assets/lwazi-rainbow-stitch.svg and /assets/projects-symbol.svg — existing Studio motifs.

Shared styling is isolated to developer/console.css; Mailroom-specific styles remain in developer/mailroom/mailroom.css. Reuse Big LWA's existing visual vocabulary before creating new standalone admin styles. Avoid importing huge Studio CSS bundles whose selectors expect #studioApp.

## Security / release
The overview checks the same Firestore role as Mailroom. It is not a second login system and grants no extra privileges. Do not put private data, API keys, or mail credentials in static HTML/JS. Unimplemented future areas are visibly planned and do not have fake buttons.

Both routes render on biglwa.com, so the existing origin-specific Firebase session can be restored. A future developer subdomain would need a session-sharing or sign-in plan.

Checks:
- node --test developer/mailroom/mailroom.test.mjs developer/developer-shell.test.mjs
- node --check developer/mailroom/app.js
- node --check developer/console.js
- Check both routes at desktop and mobile breakpoints and recheck Mailroom draft saving and reloading with a legitimate developer account. Unauthorised and signed-out accounts must remain denied.

This changes presentation and navigation only. No Firestore rules, email sending, SMTP credentials, authentication flows, or Studio UI files are changed.
