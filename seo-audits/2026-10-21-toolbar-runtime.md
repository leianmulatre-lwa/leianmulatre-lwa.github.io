# Toolbar and route audit — October 21, 2026

Base: main at 4098acb19ff18343392e215ea9f88ed4dfadade7.

## Reproduced live
The current /studio route served ui-coherence.js version 20261021-widget-dock-verified-22. Console errors showed syncBoothWidget calling forEach on a querySelector result, aborting run before syncVeveLauncher, controls and saved-layout hydration. rescueSidebar also accessed length on querySelector results. This was a current-release runtime failure, not evidence of a deployment rollback.

## Repairs
Use querySelectorAll wrappers for all four affected collection operations. Run the VEVE update before optional caption updates, and isolate caption failures. Keep green/yellow/red widget sections and the separate banner shortcut row. Add accessible swap controls to pinned and docked widget entries. Store pinned selections in the existing account-scoped layout order; retain red-dot docking and restore behavior. Cache-bust the UI script and update the release marker.

## Routes and SEO
Reviewed the October 14 SEO audit, index loader, 404 shell, base loader, and active-route checks. bootstrap-v2.html, base-v1.html and site-*.txt remain required loader inputs; deleting them would break startup. The 404 shell fetches the current index with no-store. The entry loads the local bootstrap and replaces its historical raw-GitHub base URL with the local base. Current UI patches remain applied. Corrected the duplicate-JS/CSS asset test regex, which previously matched no assets. Public SEO/source integrity and active route checks pass. No Search Console access, external SEO score, or index-coverage claim is made.

## Verification
Added a full UI-runtime test using decompressed production HTML with jsdom, covering startup, VEVE, red-dot docking/restoring, pinned swapping, dock swapping, delayed recovery, and a fresh-page restore. Existing deployment checks also run. The browser was signed out: authenticated production interactions still require verification after deployment. No user media or account records were deleted.
