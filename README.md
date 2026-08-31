# Big LWA

Canonical static-site repository for **biglwa.com**.

This repo was rebuilt from the latest preserved Big LWA visual assets and UI decisions after the later site-editor source bundle was no longer directly recoverable. It is intentionally plain HTML/CSS/JS so it can deploy for free on GitHub Pages and remain easy to edit from ChatGPT + GitHub.

## Current canonical behavior

- Full-room warm shoji / projector / typewriter composition.
- Profile information lives on the main whiteboard/projection surface.
- The screen beside the whiteboard is the **Control Panel**.
- **Edit Profile** mechanically slides the Control Panel into the room on its rail system.
- Aura, profile identity, Realness, soundtrack label, opacity and projection controls live inside the Control Panel.
- Changes preview live; **Save Profile** stores the local prototype state and retracts the Control Panel.
- The Control Panel can disappear completely in normal profile-view mode.
- Typewriter keys are the navigation metaphor.
- Dark mode is intentionally not part of this canonical build.

## Files

- `index.html` — site structure
- `styles.css` — visual system, room placement and Control Panel animation
- `app.js` — profile editing, preview, local save state and navigation prototype
- `assets/` — preserved Big LWA room/typewriter/control-panel art
- `CNAME` — custom domain target (`biglwa.com`)
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow
- `docs/STATE.md` — canonical UI state / decisions to preserve

## GitHub Pages setup

1. Create a GitHub repository named `biglwa`.
2. Upload the contents of this ZIP to the repository root.
3. In GitHub: **Settings → Pages → Source → GitHub Actions**.
4. Push/commit to `main`; the included workflow publishes automatically.
5. In your WordPress domain DNS, point `biglwa.com` to the GitHub Pages site. Keep WordPress as the domain registrar; no transfer is required.

Once GitHub is connected to ChatGPT, this repository should be treated as the permanent master copy for future changes.
