# BIG LWA native editor editions — source pilot

This branch is a **source-only workbench**, branched from the pinned `editor-sources` snapshots. It must not be deployed as a Pages website, or described as a verified native WebAssembly release, until editor builds pass.

## Native Rust/egui changes started

| BIG LWA app | Upstream engine | Current source change |
| --- | --- | --- |
| **lightR** | PhotoCraft 0.7.0 | New gold stitched-block-inspired native egui mark replaces the upstream icon; web canvas and browser-window names use lightR |
| **paintR** | VectorCraft 0.9.0 | Native browser title and window naming use paintR; original icon remains a separate branding task |
| **keyframeR** | EffectCraft 0.8.0 | The canvas-native header/credits mark is newly painted in purple, with BIG LWA RGB dots; About tooltip names keyframeR in browser |
| **fileR** | PdfCraft 0.6.0 | Native PDF editor home screen welcome text and empty-state help use fileR on web |

The existing menus, editing operations and native document formats remain unchanged. Source-code changes in this branch do **not** modify `main` or the deployed verified upstream releases.

## Build and release gates

1. Retain all upstream `LICENSE-MIT`, `LICENSE-APACHE`, `NOTICE`, and third-party assets/attribution obligations. Never claim ownership of upstream editing engines.
2. Audit source imports and `include_bytes!` references omitted by the source snapshot workflow (in particular `assets/app-icon` and `docs/brand`). Supply separately licensed, BIG LWA-created substitutes or remove references; do not silently copy third-party marks.
3. Compile each pinned Rust/egui app to wasm32 with matching locked compiler/toolchain and Trunk settings. A textual edit is *not* a compiled fork.
4. Run smoke tests in real browsers for pointer input, menus, open/close, undo/redo, project round trips, image export, PDF text/forms, SVG/vector export, and video keyframes.
5. Compare WASM artifacts and preserve sources and license notices. Promote any passing fork by immutable version/SHA through a controlled build manifest with upstream release fallback; never replace the production editor with a failed or unverified build.
6. For cloud project saving, add an authenticated binary-object store and ownership-scoped metadata first. **Firestore's current small preview shelf is not suitable for layered project files**. Preserve local native download/export and do not advertise account sync for native projects before round-trip testing on two devices.

## Live-site snapshot work (main branch)

The HTML-based BIG LWA Workshop separately supports opt-in, **flattened** image previews in a signed-in user's account collection, not layered native editor files. Its response protocol now returns a matching `requestId` plus separate `ok` and `synced` fields so the editor can distinguish local staging from completed cloud sync. The live build must be verified independently.

## Editor titles, native mark and menus

The original developers and licenses remain credited through their preserved source and in-product credits. The entire native UI, settings, logo inventory, and project-save dialogs are **not yet** rebranded. Further changes should proceed one app at a time, with compiled proof.
