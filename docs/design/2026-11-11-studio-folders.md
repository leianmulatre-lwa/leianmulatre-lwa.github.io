# BIG LWA Folders · discovery and first-pass interaction spec
Date: 2026-11-11 | Stage: visual prototype, not live account feature

## Reference and intent
- User-provided visual refs: familiar flat yellow folder silhouette; bright macOS layered blue Finder folder and alternate colors; BIG LWA Studio's four-column widget grid.
- BIG LWA folders should feel like personal desk objects inside Studio, not an imitation macOS app or another storage provider.
- Visual emphasis: tactile folder geometry, restrained embossed/stitched detail, aura-tinted color, handwritten tab, old-internet folder browser when opened.
- Do **not** use the elaborate Stream frame as default folder chrome. The Stream frame is reserved for the movable Stream Dock; Studio Stream returns to the earlier unframed player dimensions.
- Visual-only QA preview: `/qa/folders-preview.html`. It uses dummy entries and does not access accounts.

## Three visual proposals
1. **Signature / cream-gold (recommended default)** — rounded clean folder front, offset tab, soft fold shadow, small label on paper tape, subtle stitch seam at lower edge. This is most legible across day and night modes.
2. **Aura / tinted** — same silhouette with color based on the member's aura, not a high-saturation full gradient. Aura color belongs on trim, label, and tab; preserve contrast and make identity colors optional.
3. **Archive / dark velvet** — muted oxblood/ink folder with a cream label. Best for collections and nighttime visual variation, *not* default for every folder.

## Studio closed state
- A folder is one standard Studio card (one `data-widget-id` once implemented), not one draggable card for each item.
- Closed icon centered in familiar 4:3-ish aspect; title in existing stitched header family; item count and one understated preview strip of 2–3 symbols/cards, avoiding private photo leaks.
- Standard widget dots remain on the **outer card**, and Skeleton Key visibility controls remain canonical.
- Hover lifts the front flap by a few pixels; reduced-motion preference removes that animation. Focus ring and a real button make keyboard access equivalent.
- No full-screen backdrop or floating context menu on first tap.

## Folder opened state
- First click opens a folder *within the Studio context* as a compact expandable tray / window; never silently navigate to a different app.
- Header includes location breadcrumb (Studio / Folder), folder name, and the existing window dots. Folder contents are a compact grid, optionally switched to list.
- Each content item is an explicit reference with type and original destination: existing widget shortcut, Project, board, saved item, song, media, or user link.
- Opening a shortcut invokes the **original destination**, rather than cloning or mounting another instance of a player/widget.
- Empty state invites adding existing items, not uploading arbitrary files immediately.
- For folders containing sensitive media, display permissions must be enforced at the item source. Guest previews are read-only, and private references are hidden entirely.

## Interaction priorities
### V1 essentials
- Create new folder from Studio / a single add action (no second sidebar).
- Rename, recolor, choose icon, move folder by existing Studio drag, toggle visibility via Skeleton Key.
- Add a reference to existing widget/project/bookmark through the source's existing action menu (proposed “Add to folder”), including create new folder in the picker.
- Open/close folder and select content to open the original item.
- Reorder contents within folder without repositioning underlying Studio widgets.
- Remove reference from folder, distinct from delete original. Folder deletion requires explicit confirmation and does not delete member content.
- Account-scoped persistence; clear read-only handling in preview mode.

### V2 after V1 testing
- Folder preview thumbnails chosen from allowed public/member content.
- Search and filter within contents; simple shortcuts in Veve/L’wazi results (“Save to folder”).
- Share a folder as a curated collection if every contained item is allowed to be shared, with independently scoped permissions.
- Optional folders inside folders with cycle protection and depth cap, after interaction design is validated.

## Existing implementation touchpoints and constraints
- `studio-spatial-drag-20261029.js` buckets whole DOM cards by `data-widget-id`, uses `data-biglwa-grid-position`, and positions them based on measured heights. A folder must be one stable widget to prevent layout cycles.
- `studio-spatial-drag-20261029.css` enforces absolute placement and auto card height. Avoid portals that grow on every ResizeObserver pass, and avoid moving a live widget's DOM into an open folder.
- `stream-guide.js` uses **one persistent** video/audio portal across Stream/Studio/Dock. Folder items referencing Stream MUST be shortcuts and must not clone/embed the same player.
- `ui-coherence.js` supplies the existing Studio card / widget chrome; `studio-widget-visibility-music-20261102.css` and Skeleton Key rules handle minimization/visibility. Reuse canonical states instead of separate folder hide/close controls.
- `module-pages.js` owns route-level destinations; where an item has a route, open the existing route.
- Existing uses of “folder” in Arcade and Workshop are decorative. There is no confirmed general account-persistent folder registry yet; new persistence must be designed rather than inferred.
- Do not write folder preferences or contents into a global localStorage key that can leak across accounts. Model ownership/visibility first; persist securely under the authenticated UID with server authorization.
- Avoid a second drag handler on the folder wrapper. Folder **items** can drag inside an opened tray if the drag starts on their own handle; stop propagation before Studio's card drag listener.

## Draft schema (proposal, not deployed)
```json
{
  "id": "stable-folder-id",
  "ownerUid": "<authenticated user UID>",
  "name": "my ideas",
  "theme": "cream",
  "auraTint": true,
  "visibility": "private",
  "position": {"row": 2, "col": 1},
  "items": [
    {"id":"stable-entry-id","kind":"widgetShortcut","targetId":"stream","sortIndex":0},
    {"id":"stable-entry-id-2","kind":"projectShortcut","targetId":"project-123","sortIndex":1}
  ],
  "updatedAt": "server timestamp"
}
```
Neither target content nor OAuth tokens are copied into the folder record; IDs are examples only.

## Acceptance checks for future implementation
- Sign-in / account switch does not mix owners' folder entries.
- Guest / public preview reads only permitted folder and permitted item metadata; absent sources render no preview.
- Add/remove/move/reorder remains stable after page reload and compact/mobile resize.
- Folder open/close doesn't rebuild or restart a video/audio iframe.
- Studio spatial drag still fills columns and retains gutters after a folder expands.
- Skeleton Key shows folder as one reversible widget with no orphaned button.
- Deleting folder does not delete Archive, Projects, Library, or imported media.
- Light/night and varied Aura contrast verified; keyboard and reduced motion verified.
