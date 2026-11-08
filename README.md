# KanyevaUnreleasder Thumbnail Generator (beta 0.3)

A browser-based thumbnail maker built from the `Kanyeva_Thumbnail_Template_V47.psd` template.
It is made only for the **KanyevaUnreleasder** channel. Nothing is uploaded anywhere; everything runs in the visitor's browser.

## What's new in 0.3

- **Template lines are on by default.** The amber dashed lines show where the PSD puts the text edge, baselines, cover edges and logo. Layers snap to them.
- **Resize from the dot you grab.** Drag any corner dot and the opposite corner stays put. The dragged corner snaps to the grid, guides, template lines and other layers (hold Alt to turn that off).
- **Text stays in place.** Each text has a *Keep in place* switch (on by default). Text never overlaps the cover, logo or other text, and never leaves the canvas. Long text shrinks to fit and grows back (up to the size you chose) when you shorten it. You can still move, rotate and resize; the text just stops at other layers and at the edge. *Back to original position* restores a text's template spot.
- **Transparent background, PNG only.** The animated background is gone. Downloads are transparent PNGs. The checkerboard in the preview stands for transparency and is not exported.
- **Snapping sliders.** Position, size and rotation sliders stick to grid lines, template lines, guides and other layers; rotation sticks to 15 degree steps. Typed numbers are always exact.

Earlier in 0.2: grid with 3x3 to 12x12 and square cells, rulers with pull-out guides, and the Helvetica Rounded Bold font.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| G | Show or hide the grid |
| S | Turn snapping on or off |
| R | Show or hide the rulers |
| Arrow keys | Nudge the selected layer 1 px |
| Shift + arrow keys | Move one grid cell (or 10 px if snapping is off) |
| Alt while dragging | Move or resize without snapping |
| Shift while rotating | Rotate in 15 degree steps |
| Ctrl/Cmd + Z, Ctrl/Cmd + Shift + Z | Undo, redo |

## Guides

Drag down from the top ruler for a horizontal guide, or right from the left ruler for a vertical one.
Drag a guide to move it, or drag it off the canvas to delete it. **Grid settings > Clear guides** removes them all.

## The font file

The font must be at exactly this path in the repository (the name is case sensitive on GitHub Pages):

```
assets/Helvetica Rounded Bold/Helvetica Rounded Bold.otf
```

If it cannot be loaded, the page shows a message and falls back to Helvetica or Arial.
The three template texts are sized to match the ink of the original PSD once the font loads, so the layout stays faithful.

## Put it online with GitHub Pages

1. Upload everything in this folder to your repository (keep your existing `assets/Helvetica Rounded Bold` folder).
2. Go to **Settings > Pages**, set *Source* to **Deploy from a branch**, pick `main` and `/ (root)`, then save.
3. Your site is live at `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

> Open the site through that link (or a local server), not by double-clicking `index.html`.
> Browsers block exporting images from pages opened straight from a file.
> To test locally: run `python3 -m http.server` in this folder and visit `http://localhost:8000`.

## Exporting

Transparent PNG at 5000x2812 (template size), 4K, Full HD or 1280x720. Place it over any video frame or design.
YouTube thumbnails uploaded directly must be under 2 MB; the 1280x720 size is usually well under that.

## Album cover presets

Put a square `.png` or `.jpg` into `assets/presets/`, then add a line to `js/presets.js`:

```js
{ name: 'My album', src: 'assets/presets/my-album.png' },
```

## Files

```
index.html          page layout
css/style.css       interface styling and the font-face rule
js/app.js           the editor (rendering, grid, rulers, keep-in-place rules, panels, export)
js/presets.js       album cover preset list
assets/logo.png     channel logo from the PSD
assets/presets/     preset covers
```
