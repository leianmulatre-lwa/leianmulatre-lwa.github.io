# BIG LWA R-series · Source & notices

This file documents the source history of the four advanced BIG LWA editing tools. It is a technical and legal reference, not the branding or display copy for Lwazi.

| BIG LWA editor | Original engine lineage | Source branch |
|---|---|---|
| **lightR** | PhotoCraft | `editor-sources`, `biglwa-native-editors` |
| **paintR** | VectorCraft | `editor-sources`, `biglwa-native-editors` |
| **keyframeR** | EffectCraft | `editor-sources`, `biglwa-native-editors` |
| **fileR** | PdfCraft | `editor-sources`, `biglwa-native-editors` |

BIG LWA's design system, editing chrome, integration code, modified Rust interfaces, original artwork and member-facing product experience are distinct from the underlying source lineage. The current release mode (BIG LWA native versus checksum-verified upstream release) is recorded in the runtime manifest and the pinned provenance and promotion workflows.

Some pre-existing modules are offered under MIT OR Apache-2.0 licensing, with copyright retained by their original authors. Those notices remain available in each distributed editor's `upstream-licenses` directory and must be preserved regardless of the public app name. Owning a customized BIG LWA edition does not automatically convey ownership of pre-existing third-party code.

Source snapshots: https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io/tree/editor-sources/vendor/editors

The snapshot and provenance workflows are `.github/workflows/save-editor-sources.yml`, `.github/scripts/prepare-native-release.py`, and `.github/scripts/stage-craft-apps.py`. The source verification lock is `.github/editor-sources.lock.json`.

Visible editor startup titles, nav labels and R-series artwork are supplied by BIG LWA. Historical source identifiers persist only where required for import compatibility, auditability, licensing, or existing redirects.
