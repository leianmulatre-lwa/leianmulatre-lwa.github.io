# BIG LWA · Lwazi Workshop / R-seriez

Lwazi Workshop is the BIG LWA-designed creative workspace. BIG LWA authors and maintains its visual language, stitched blocks, navigation, account-linked snapshot workflow, in-browser sqwibblR editor, and integration surfaces for visualizr and the R-series tools.

## The BIG LWA product experience

- **sqwibblR** is BIG LWA's original layered in-browser image editor (`tools/image-desk.html`), with local edit/export and explicit optional account snapshot saves.
- **visualizr** is part of BIG LWA Studio, offering BIG LWA-designed creative boards and slides.
- **lightR, paintR, keyframeR and fileR** have BIG LWA identities, self-hosted browser interfaces, and customized Rust/WebAssembly editions when the provenance-verified native build is activated. Otherwise, the deployment gate may stage licensed, checksum-verified third-party releases. The manifest at `/bigapps/manifest.json` is the source of truth for availability and build type.

BIG LWA's original product design, new code, and branding belong to their respective rightsholder(s). That does not reassign ownership of pre-existing third-party code merely because it has been customized, compiled, or incorporated into a BIG LWA edition.

## Technical source lineage and required notices

The four advanced editions retain historical source identifiers in their package and manifest metadata for compatibility. Their source lineage is recorded here (not displayed as a competing product identity in the main Workshop UI):

| Current BIG LWA name | Underlying upstream project | Version tracked | License |
|---|---|---|---|
| lightR | [PhotoCraft](https://github.com/storytold/photocraft) | 0.7.0 | MIT OR Apache-2.0 |
| paintR | [VectorCraft](https://github.com/storytold/vectorcraft) | 0.9.0 | MIT OR Apache-2.0 |
| keyframeR | [EffectCraft](https://github.com/storytold/effectcraft) | 0.8.0 | MIT OR Apache-2.0 |
| fileR | [PdfCraft](https://github.com/storytold/pdfcraft) | 0.6.0 | MIT OR Apache-2.0 |

Copyright remains with the applicable original authors and with BIG LWA for its new contributions. The licenses and notices distributed with an advanced editor remain available under its `upstream-licenses/` directory, including `SOURCE.txt`, `LICENSE-MIT`, `LICENSE-APACHE`, and `NOTICE` as applicable. These required documents must not be deleted or misrepresented.

Verified native releases use source branch `biglwa-native-editors` and the explicit build/provenance checks defined in `.github/scripts/prepare-native-release.py` and `.github/scripts/stage-craft-apps.py`. No change to labels is a claim of full independent authorship of all underlying engine code.

## Privacy and saving

Editing is performed in the user's browser in supported tools. BIG LWA account snapshots require an explicit save action; snapshots are flattened previews, while editable/native project formats are separately exported or downloaded. Third-party links and optional graphics/WebGL/WebGPU capabilities may have additional requirements.

For other source-specific legal notices, use each advanced editor's **Source & notices** link. This document remains public for transparency, separate from the member-facing Lwazi introduction.
