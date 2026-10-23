# BIG LWA Workshop — code lineage and licensing

## Built and controlled by BIG LWA

- **BIG LWA Workshop** (`tools-craft.js`, `tools-craft.css`): BIG LWA-authored design and launch layer.
- **BIG LWA sqwibblR** (`tools/image-desk.html`): BIG LWA's original in-browser canvas editor. Layers, drawing, text, transforms, local photo import, local editable `.lwa.json` projects, PNG/JPEG export, and undo/redo. sqwibblR does **not** incorporate PhotoCraft source code, make external requests, or automatically upload a person's files.
- The original Workshop is part of BIG LWA Tools alongside its independently implemented file conversion utilities.

## Open-source Storytold engines used as optional advanced tools

| BIG LWA entry label | Engine | Repository | Installed release | License |
|---|---|---|---|---|
| lightR | PhotoCraft | https://github.com/storytold/photocraft | 0.7.0 | MIT OR Apache-2.0 |
| paintR | VectorCraft | https://github.com/storytold/vectorcraft | 0.9.0 | MIT OR Apache-2.0 |
| keyframeR | EffectCraft | https://github.com/storytold/effectcraft | 0.8.0 | MIT OR Apache-2.0 |
| fileR | PdfCraft | https://github.com/storytold/pdfcraft | 0.6.0 | MIT OR Apache-2.0 |

The **licensed editors are not BIG LWA-owned engines**. BIG LWA's build script `.github/scripts/stage-craft-apps.py` stages original, version-pinned WebAssembly releases from GitHub only when available and SHA-256 verified. Source terms from each original repository are copied to each staged engine under `/craftapps/<engine>/upstream-licenses/`. Availability is defined by `/craftapps/manifest.json`; a missing build must not be shown as working.

The following are being researched for future independent BIG LWA integrations and are **not claimed to be deployed**: FilmCraft, LightCraft, DesignCraft, FigCraft and SoundCraft.

### Attribution and trademark rules

The upstream teams retain their copyrights. Their `LICENSE-MIT`, `LICENSE-APACHE`, `NOTICE` and third-party `ATTRIBUTION.md` must be honored when building modified editions, as appropriate to the actual files redistributed. ArtCraft names, original trademarks, logo and protected branding are **not** part of the permissive license. Do not reuse or rebrand those assets in BIG LWA's own product.

This is a first-party Workshop with original native editing plus attributed hosted upstream engines, **not** a claim that BIG LWA has produced new clean-room forks of all of their Rust applications. To make a true independent Rust fork: pin a reviewed upstream commit, remove protected marks, apply BIG LWA's own new UI resources, build signed/static WASM artifacts in CI, retain licenses and third-party notices, and test file round trips, undo/redo and exports before deployment.

No affiliation with Adobe Inc. or the ArtCraft Team is implied. User media belongs to its respective rights holders; importing it locally does not change copyright.
