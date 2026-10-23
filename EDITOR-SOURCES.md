# Licensed editor source copies

The four upstream editor source trees are saved in a dedicated branch of this BIG LWA repository, rather than the published main site.

Source browse link: https://github.com/leianmulatre-lwa/leianmulatre-lwa.github.io/tree/editor-sources/vendor/editors

The snapshot workflow is .github/workflows/save-editor-sources.yml and the locked, verified release SHAs are in .github/editor-sources.lock.json.

Editors: PhotoCraft (Pixel Lab), VectorCraft (Vector Studio), EffectCraft (Motion Room), PdfCraft (Paper Desk).

The code is licensed MIT or Apache-2.0, at your option; the original copyright remains with the upstream developers. Copyright notices and attribution files are preserved. Upstream trademarked ArtCraft branding and original app icons are excluded. Having source copies does not itself produce new BIG LWA builds, change the currently hosted WebAssembly release packages or imply ownership of the upstream engines.

To refresh source snapshots, intentionally change the pinned versions and commits and run the workflow.
