# README Demo Video — Design Spec

**Date:** 2026-03-21
**Status:** Approved

---

## Goal

Add a short gameplay demo video to the README so visitors immediately see the game in action before reading anything else.

---

## Format

**MP4 video**, embedded with a `<video>` tag in the README.

- `autoplay loop muted playsinline` attributes for silent, auto-playing loop
- `width="800"` to match the game's native canvas width
- Centered with `<div align="center">`

## Content

**~8 seconds of clean gameplay** — no death, no game over screen.

Captures:
- Player running with parallax background scrolling
- 2–3 smooth obstacle jumps
- Score incrementing in the top-left corner
- Natural loop point (cut at a moment where playback restart feels seamless)

## Recording

1. Run `npm run dev`, open `http://localhost:5173`
2. Use QuickTime (File → New Screen Recording, crop to game canvas) or OBS
3. Trim to the best ~8s window with a clean entry and exit

## Hosting

Upload the `.mp4` to GitHub's CDN by dragging it into any GitHub issue comment. Copy the resulting URL (`https://github.com/user-attachments/assets/...`).

## README Change

Insert the following block in `README.md` directly after the badge line and before the `---` separator:

```html
<div align="center">
  <video src="GITHUB_CDN_URL" autoplay loop muted playsinline width="800"></video>
</div>
```

Replace `GITHUB_CDN_URL` with the actual URL after uploading.

## Out of Scope

- Audio in the video (muted by default for autoplay compatibility)
- GIF fallback
- Hosted demo site / live playable link
