# BIG LWA — integration candidates (October 22, 2026)

This is a design backlog, **not** an assertion that unimplemented features are live.
Before changing the app, test the source license, provider terms, access controls,
file permissions and actual behavior using the current `main` deployment.

## Canonical user flow

1. **Orbit** manages optional, explicit provider connections and imports.
   Private by default; no forced publication, no covert collection.
2. **MyFeed** is the controlled personal publishing surface. **Veve** is
   discovery of explicitly public posts and media.
3. **LWA TV** starts with the actual directory's videos/channels as seeds.
   User-controlled mood dials (genre, duration, topic, new vs. familiar)
   generate an editorial lineup, with deliberately mixed source diversity
   and a "Hidden Gems" carousel. Never require Google account connection.
4. **Radio / Jam** may open authorized Spotify/SoundCloud players and show
   saved public playlists. Do not copy audio or impersonate native clients.
5. **Library** can surface books and cinema lists, with optional import and
   no implicit release of private reading/watching activity.
6. **Politic** can host voluntary civic reflection quizzes and source
   comparisons; do not infer or advertise sensitive beliefs from user content.
7. **Arcade** may offer an on-demand virtual retro PC, separated from the
   ordinary inline game emulator. Boot only lawful disk images.
8. **Tools** is the home for PhotoCraft and other image editors.

## Candidate sources and product choice

| Candidate | Destination | Integration decision |
|---|---|---|
| `storytold/photocraft` | Tools | **Already integrated** as a checksum-pinned ArtCraft WebAssembly editor. Improve direct launch and local editing, avoid duplicate implementation. |
| `imputnet/cobalt` | Tools | **Already linked externally**. Self-hosting would require a protected server and AGPL compliance; only user-authorized media. |
| `copy/v86` | Arcade | Prototype a separate "Retro Desktop" modal/route. Browser x86 emulation does not embed arbitrary websites or replace today's HTML games. BSD-2-Clause, licensed guest OS/disk required. |
| `hyez/Deep-Youtube-Recommendations` | LWA TV | Treat as an old educational architecture reference, **not** a ready-to-use recommendation service (last pushed 2021). Develop small, explainable curated reranking based on current LWA TV channel/video metadata. |
| `Qwen/WebWorld-32B` | Research only | Browser world-model/simulation research, **not** a user-video recommender. Do not deploy a 32B model client-side or give it unsupervised access to accounts. |
| `drawrowfly/tiktok-scraper` | Orbit | Old, last pushed May 2023; do **not** wire to authenticated production accounts. Prefer the existing TikTok OAuth and authorized endpoints. |
| `yt-dlp/yt-dlp/issues/12015` | Tools | Issue discusses Snapchat downloads without watermarks, **not** an integration API. Do not silently ingest or strip ownership marks. |
| `johnholdun/1124603` | Sqwidz / Orbit | Tumblr post-notes PHP gist created in 2011; use as a conceptual reference only, not an embedded script. Prefer maintained authorized Tumblr API routes. |
| Spotify desktop-client GitHub topic | Radio / Jam | Topic index, not a single reusable component. Favor official Spotify OAuth/embeds and permissioned playlist metadata. |
| matthewwolfe SoundCloud Desktop Client | Radio / Jam | Desktop application, not a browser plugin. Use allowed SoundCloud embeds/API instead. |
| `yuyangchee98/your_letterboxd` | Library / Orbit | Optional private film diary, import from user data; validate licensing (AGPL-3.0), IMDb/TMDB attribution/terms and source export mechanisms. |
| `nesaku/BiblioReads` | Library | Discover book metadata and public references; library shelf with private opt-in; AGPL-3.0 and respect upstream limitations. |
| `vladkens/twscrape` | Orbit / Sqwidz | Account-rotating scraper; **not a default production ingestion method**. Use supported X API and/or user file export for imports. |
| `rightvaluestest/rightvaluestest.github.io` | Politic / Arcade | Optional clearly labeled political-perspective quiz; not a factual bias score, and never used for hidden recommendation profiling. |
| `imvu/cal3d` | Avatar | Skeletal animation library (LGPL-2.1), not an IMVU login or ready-made viewer. Evaluate asset-format pipeline and WebGL rendering feasibility first. |

## Proposed LWA TV data flow

- Store curator-approved **channel/video IDs and metadata**, not downloaded media.
- Build a catalog from existing programmed channels using authorized public
  YouTube Data API metadata, title/description/channel/category/captions **only
  when permitted**, daily rotation and a manually curated fallback.
- Rank via transparent signals: current seed channels, explicit mood choices,
  user's thumbs up/down or save, diversity/freshness and duplicate suppression.
- `Hidden Gems` should be an explicit editorial shelf, not inferred from
  unconsented viewing history or disguised advertising.
- Optional Google authorization should ask for minimal scopes and list exactly
  what is available; generic Google login does **not** grant YouTube watch history.
  Support playlists/subscriptions only to the extent allowed by the API and
  user's granted permissions, or consented imports such as Takeout.
- Playback uses authorized YouTube embeds, not third-party extraction.
- Tokens stay server-side; include revoke/delete functionality and no cross-user
  personal-data leakage.

## Release gates

1. **Fix scrolling and Sqwidz title first**; visual DOM acceptance with
   actual toolbar, header and modal states.
2. Add feature flags and self-contained adapters instead of global overrides.
3. Require attribution/license review, source reliability, OAuth permissions,
   privacy defaults and rate limits before marking a provider connected.
4. Add reproducible tests that exercise one genuine user journey per source;
   passing GitHub Pages only confirms publishing, not authenticated UX.
