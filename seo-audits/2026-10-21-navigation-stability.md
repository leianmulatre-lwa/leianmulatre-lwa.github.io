# Skeleton Key and navigation repair — 2026-10-21

Baseline: remote main 91b3a7eb1ff2a4c7212b935fcb1b791bc55cd953, including the owner's SubwayGraph-R7V.ttf upload. Preserves the prior optical widget heading rule and restored original docking/shortcut interactions.

Changes:
- Reconcile existing toolbar and banner nodes by destination instead of detaching every target on refresh. Preserve hovered/focused buttons through startup and account updates.
- Do not replace the UI stylesheet repeatedly, rewrite Archive artwork repeatedly, or apply delayed account appearance values over an active profile editor.
- Banner controls use 52px height and 18px artwork slots. Toolbar art uses 16px slots. Nested images/SVGs retain aspect ratio. Collapsed Skeleton Key hides auxiliary controls and prevents horizontal overflow.
- Skeleton Key is singular. Its ankh launcher remains in the toolbar. Its Body indicators checkbox defaults on and saves per account on the current browser. Off hides body labels/filters/rings and clears filtering; on restores them. Body labels use an absolute corner slot and do not add a content row.
- Widget/navigation: Sqwidz. Individual note/editor: Sqwib. Storage identifiers and existing documents unchanged. Dark note surfaces use #062b40 with #e1f2fa text.
- Subwaygraph applies only to the Sqwidz widget heading. Politic widget heading uses the same Stars and Stripes font as its page.

Verification:
- All 69 commands in the Pages deployment workflow passed locally; the production DOM regression test also passed.
- DOM checks cover retained hover targets after 9 seconds of startup refreshes, original drag and three-dot docking, saved navigation reload, default-on/body-toggle persistence, access to the Skeleton Key launcher, and an active color draft surviving an incoming account appearance update.
- The header rule stays at 21px slot / 18px maximum artwork / 20.25px type / 4.5px gap.
- qa/skeleton-navigation.html is a data-free visual specimen generated from the production DOM test. It is not an authenticated Studio session. Its two display buttons only switch specimen collapsed/dark views.
- Signed-in native hover/color-picker behavior is not claimed as browser verified.

Live Chrome specimen measurements:
- Nine banner controls: each 52px high.
- All eight rail symbol slots: 16 × 16px.
- Collapsed rail: clientWidth 47px, scrollWidth 47px (no horizontal overflow).
- Dark Sqwidz background: rgb(6,43,64), matching #062b40.
- Sqwidz computed font: Subwaygraph, 20.25px. Politic: Stars and Stripes, 20.25px.
- Visual review caught an interaction with the late directory-symbol loader that inserted a second Journal/myfeed symbol outside the new slot. The loader now writes into the slot; DOM regression requires exactly one image after late loading and scheduled refresh.
- Two older Feed/Archive source assertions were stale on baseline main: source color now correctly follows displaySource, and repeat copy says “additional copies.” Assertions updated to the existing behavior; 36 Feed and 58 Archive checks pass.
- Follow-up visual inspection found that the inner sidebar-top scroller could still show a horizontal scrollbar even when the outer sidebar did not overflow. The collapsed rule now sizes and constrains both scroll containers and their sections, retaining the 16px symbol slot. Sqwidz's symbol is light on its dark ocean background.
- Navigation now reuses the same alpha-bound optical normalization as widget headers. This removes transparent asset padding before fitting artwork: rail 16px square / 14px visible ink; banner 18px square / 16px visible ink. Header geometry remains unchanged.

Final browser verification (current stylesheet layout-navigation-10 and optical-navigation-3):
- Both outer rail and inner sidebar-top/section/nav compute overflow-x:hidden. All symbols remain fully visible; no horizontal scrollbar appears in the captured collapsed view. Transparent raster margins may extend scrollWidth without creating a visible scrollbar or clipping visible artwork.
- Rail slots are 16px, with image ink bounded to 14px; banner slots are 18px with ink bounded to 16px. Narrow glyphs preserve their original ratio.
- No duplicate banner images. All 18 widget heading font sizes remain 20.25px.
- Final dark Sqwidz background is rgb(6,43,64); its symbol uses brightness(0) invert(1) for contrast.
- Pages deployment run 39669808996 succeeded. Screenshot: skeleton-navigation-final-20261021.jpg.
- These browser measurements are from the data-free visual specimen. Native tooltips and color-picker interactions in an authenticated account remain unverified; the production DOM behavior and draft-protection regression checks pass.
