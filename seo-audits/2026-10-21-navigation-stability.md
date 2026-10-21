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
