# Stream and discovery repair — November 17, 2026

Baseline: `7782dff99cc413af062fc42b9e041a8a332e70c2` (November 17, 13:25:04 Pacific).
Earlier behavior inspected: `3bd5e44f` (November 17, 08:58:07 Pacific, Radio/Boards organization) and `d198021a` (November 17, map preview/audio changes).

## Regressions and repairs

- Boards used the selected board’s cached covers and stopped at three. It now fills five apertures; supplementary temporary inspiration is explicitly labeled and never saved as member content. Broken images try another approved sample. Public-profile isolation remains intact.
- Map styles were selected through hidden radio controls. The picker now calls the map’s layer registry directly, removes the prior base, preserves overlays, updates the saved mode, and avoids an asynchronous initial style overwriting a later selection. Preview Layers expands the real control. A scale remains visible.
- Tunes had a 12px meter limit. The available height is now 28–42px (22px compact), with full-height bars, smoothed measured frequency levels and bottom anchoring. Public account audio requests CORS before assigning its URL. No synthetic pulse is used.

## Programming and discovery

- One radio dial combines the original sixteen campuses, the fifty-state directory and a disclosed twelve-country world starter selection. Entries without a usable HTTPS audio source remain discoverable but are excluded from scheduled playback.
- Hourly, deterministic morning/midday/night rotations use weight 1 per playable station and weight 2 for UCLA. Separate daypart counters avoid permanent time-of-day bias. Exact shares apply over a complete unchanged catalog cycle. Manual selections stop guide following; a dedicated button resumes it.
- Radio subnavigation sits on the right. Search below the heading finds stations, creators, episodes and tagged moods, with optional existing L’wazi classification for unmatched requests. TV separates Entertainment and News.
- The public source snapshot refreshes during Pages deployment and every six hours through the existing Pages workflow. YouTube RSS provides real upload IDs/dates; failures retain that source’s last successful entries. Publisher embedding restrictions still apply.
- Model-free vibe matching searches approved public Veve media, preserving existing visibility and sensitivity filters. Explicit account interests can rank Stream picks; no YouTube watch history is harvested.
- Herstory combines its existing reference section with dated AWIS, NCWIT and AISES stories, prioritizing text that explicitly covers Black, brown and Indigenous communities. These are recent source stories, not a fabricated popularity ranking. Coverage depends on what the sources publish.
- Search widgets reuse Studio/Skeleton Key artwork; tabs use a single horizontal icon/label layout.

## Verification boundary

Behavior tests cover five-image filling, equal daypart shares with UCLA’s double weight, actual frequency-response mapping, catalog merging, News selection and creator-search navigation. Existing release/build checks are also run.

The browser showed real Street↔Satellite switching on the standalone map. Its vector renderer fell back to raster in this environment. The managed preview server injects live-reload script text into the Studio loader’s HTML strings, so full signed-in Studio visual verification is not claimed. Deployment must be confirmed independently from this preview limit.

Organic Maps inspiration: subdued map, compact persistent layer controls, visible scale and keeping place/route context next to the canvas. This does not import its native Android/iOS application or claim offline maps.
