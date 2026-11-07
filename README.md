# KanyevaUnreleasder Thumbnail Generator (beta 0.2)

A browser-based thumbnail maker built from the `Kanyeva_Thumbnail_Template_V47.psd` template.
It is made only for the **KanyevaUnreleasder** channel. Nothing is uploaded anywhere; everything runs in the visitor's browser.

## What's new in 0.2

- **Grid, rulers and snapping.** Equal divisions (3x3, 4x4, 6x6, 8x8, 12x12, 16x9 or any columns/rows) or square cells that grow from the center. Margin, color, opacity and thickness are adjustable. Layers snap by their edges, centers and text baselines to the grid, to other layers, to the canvas and to your own guides. Rulers show template pixels; pull guide lines out of them.
- **Animated gradient background** replaces the old backgrounds. Drifting blurred color shapes with adjustable colors, speed, blur, lighting, brightness, dark edges and film grain. **Match album cover** picks the cover's colors for you, and can do it automatically whenever you change the cover. Pause on the frame you like and download it.
- **Helvetica Rounded Bold** is now the generator's font. The stock fonts are gone; **Use my own font** still lets you load any .ttf, .otf, .woff or .woff2.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| G | Show or hide the grid |
| S | Turn snapping on or off |
| R | Show or hide the rulers |
| Arrow keys | Nudge the selected layer 1 px |
| Shift + arrow keys | Move one grid cell (or 10 px if snapping is off) |
| Alt while dragging | Move without snapping |
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

PNG or JPG at 5000x2812 (template size), 4K, Full HD or 1280x720. JPG at 1920 wide or smaller is auto-compressed under YouTube's 2 MB limit.
Film grain makes PNG files much larger, so use JPG for YouTube uploads, or turn the grain down.

## Album cover presets

Put a square `.png` or `.jpg` into `assets/presets/`, then add a line to `js/presets.js`:

```js
{ name: 'My album', src: 'assets/presets/my-album.png' },
```

## Files

```
index.html          page layout
css/style.css       interface styling and the font-face rule
js/app.js           the editor (rendering, grid, rulers, panels, export)
js/presets.js       album cover preset list
assets/logo.png     channel logo from the PSD
assets/presets/     preset covers
```
