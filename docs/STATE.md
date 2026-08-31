# Big LWA — Canonical UI State

## CURRENT LAYER GEOMETRY (FAVOURITE / SAVED — Aug 30)

| Layer | ID / class | Position / size | z | Notes |
|---|---|---|---|---|
| Top search bar | `.room-search` | `top:0`, `height:var(--topbar-h)=64px` | 9 | brand · archive search · sign out |
| Room background photo | `#roomBg` `.room-bg` | `left:0 top:9% bottom:0 width:100%` `object-fit:cover 50% 0%` | — | `assets/home-bg.png` (from `Downloads\homr ng.png`), opaque |
| Whiteboard (wallpaper surface) | `#screenBoard` `.screen-board` | `left:6% top:5% width:80% height:84%` | 2 | `assets/whiteboard.png` (from `Downloads\white board me.png`) `center/cover`, fades in on `.screen-on`; background replaced by the `change background` upload |
| Aura layer | `#auraLayer` `.aura-layer` | `left:15% top:23% width:70% height:54%` | 3 | AR ≈ 1900×828 (2.30) so uploaded auras fill the same crop as the room photo, no zoom/letterbox; `opacity:var(--aura-strength)` |
| Browser UI (profile projection) | `#profileProjection` `.profile-projection.browser` | `left:19% top:17% width:46% height:52%` | 3 | tabs + address bar, sits on the whiteboard |
| Sliding door panel | `#wallDoor` `.wall-door` | `left:0 top:7.5% bottom:7.5% width:25%` | 7 | `assets/door-pane.png` `left center/contain`, avatar + customize profile; `.open` slides `-92%` |
| Control panel (edit profile) | `#controlPanel` `.control-panel` | `left:1.5vw top:9vh width:10vw height:66vh` | 5 | translucent (`.16/.10` + blur), appears behind the door |
| Control panel inner UI | `.panel-ui` | inside panel, `left/right 4% top/bottom 5%` | — | form groups |
| Projector | `.projector` | `left:73.5% bottom:.7% width:9.6%` | 5 | `assets/projector-stool.webp`, slides in on `.entered` |
| Wall tag | `.wall-tag` | `right:1.4% top:3.5%` | 4 | "hd wall · active" |

- **Beam cone removed** (fixed the "two light rays"); projector remains.
- **Login wall** `#wallSlot` `.wall-slot` = static `assets/login-wall.png` (from `Downloads\new bg.png`) — never changes.
- Door box keeps `contain` so the whole `door-pane.png` is always visible (never trimmed).
- **Opacities default to full**: `--aura-strength`, `--profile-opacity`, `--panel-opacity` = `1` (JS default `100`) so uploaded photos render at 100%.
- Upload guidlines: aura images should be **1900×828** (matches the room crop ratio) to fill the aura box exactly.

## Edit Profile / Control Panel

The **Control Panel** is the screen beside the main whiteboard. It is not the whiteboard itself and it is not a floating website modal.

Normal profile view: Control Panel is retracted / absent so the room remains clean.

Edit Profile interaction:
1. User activates **Edit Profile** from the profile projection.
2. Control Panel mechanically slides into the room using the rail language of the scene.
3. Previous customization functions live *inside* the Control Panel: Aura, identity fields, Realness, soundtrack, projection settings, wallpaper.
4. Changes preview live on the room/profile.
5. Save / close retracts the Control Panel.

Do not replace this with the old floating customization menu.

## Visual rules

- Warm, light, old-cartoon / pixel illustration direction; avoid overly dark gothic treatment.
- Far-left and far-right room geometry should feel intentional and crop at page edges rather than adding arbitrary borders.
- Projector and typewriter need functional visual logic; wires/connections should make sense.
- Red/yellow/green signal wiring belongs to the machinery language.
- User decoration should be foregrounded; base room stays relatively clean.
- Dark mode is a **door toggle**: the door face carries light/dark mode buttons; dark mode dims the art (saturate/brightness filter) and deepens screen/panel backgrounds. Default is light. Persisted in localStorage (`biglwa-theme`).
- Animation rule: move only `transform` and `opacity`; signal dots / lens / static may pulse via opacity loops. Honor `prefers-reduced-motion`.

## Main page flow (login → room)

1. **Login — home page.** The login shows the **same picture every visit** (`assets/login-wall.png` — the original 1900×828 background, full-page, never changes). No bottom strip, no import button. No search bar here — search lives in the room.
2. **Enter room — straight in.** Login goes **directly** to the room. The tv no-signal static effect is **removed** — the room just boots the projector beam + browser screen on. The projector itself never displayed the no-signal state.
3. **Top bar = search (whole section of the top).** Once in, a full-width header strip fills the top of the room: brand (stitched "big lwa") · archive search pill (`/` focuses; Enter maps the query — search is build 2) · signed-in handle + **sign out** (same as the L power key). The room photo is a **full-viewport backdrop** behind the bar (top:0) so its top edge **touches the bottom of the search bar** exactly — no gap.
4. **Projector slides in from behind the left panel door out to the right.** The real rig (`assets/projector-stool.webp`) travels from the far-left edge (behind the door) and settles on the right of the room, then throws its beam onto the wall.
5. **Projection screen is browser-inspired.** The whiteboard shows a browser chrome: tab strip + address bar. The **seven typewriter keys are the keyboard shortcuts**: D desk, F feed, C connect, M map, K camera, Y diary, S stream. Click a keycap and its browser tab activates (and vice-versa); physical D/F/C/M/K/Y/S work too. L is the **power key** (logout).
6. **Login stays fixed; the whiteboard is the only surface, framed to the clear middle window.** The room backdrop (`assets/home-bg.png`, `opacity:1`) never changes. **Everything is pinned to the middle window** (`left:16% top:16% 56%×44%`, right edge at 72% — well clear of the right panel): the **whiteboard** (`assets/whiteboard.png`, `#screenBoard`), the **aura layer**, and the uploaded **change background** which paints the whiteboard itself. The **browser UI** sits inside that window (`left:20% top:20% 45%×34%`). Nothing extends to or gets cropped by the right panel territory. Preserved with the saved profile.
7. **Left sliding door = customize profile.** The door on the left wall is a **panel face** (real art: `assets/door-pane.png`): top **round avatar (profile picture)** → **customize profile** (the trigger — the only thing that animates the door open). Clicking **customize profile** slides the door left on the rails to reveal the Control Panel UI (identity, aura, projection settings, status, wallpaper). **Save** retracts the panel and the door slides back over the wall ("wall sealed"). The **wallpaper / change background** group is the **bottom-most section** of the Control Panel. The banner layer is **removed for now** (it clipped with the aura) — that implementation window is closed; aura is the only ambient layer, kept as-is.

## Typography

- **Bergamot Stitched** (`assets/fonts/cs-bergamot-stitched.otf`) is the display voice — headings, nav keycaps, browser tabs, coverbar label, door label, wall tag, panel titles. Body text stays serif; micro-meta tags stay mono.

## Keycap map (canonical, distinct glyphs)

D desk · F feed · C connect · M map · K camera · Y diary · S stream · L power/logout.
