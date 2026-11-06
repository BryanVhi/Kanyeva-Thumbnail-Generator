# KanyevaUnreleasder Thumbnail Generator (beta 0.1)

A browser-based thumbnail maker built from the `Kanyeva_Thumbnail_Template_V47.psd` template.
It is made only for the **KanyevaUnreleasder** channel. Nothing is uploaded anywhere; everything runs in the visitor's browser.

## What it does

- Swap the **album cover** with presets, an uploaded PNG/JPG, drag and drop, or paste (Ctrl+V)
- Type the **album title**, **artist name** and **track title**, and add extra text layers
- Drag, resize, rotate, recolor everything (gradient fill, outline, shadow, 17 fonts, or upload your own font)
- Cover options: size, corner roundness, zoom and pan the image, border, shadow
- Background: transparent, solid, gradient, your own image, or the blurred album cover
- Move or recolor the channel logo
- Undo/redo, center snapping, a guide for the area YouTube covers with the video length badge
- Download as PNG or JPG at 5000x2812 (template size), 4K, Full HD or 1280x720 (YouTube). JPG at 1920 wide or smaller is auto-compressed under YouTube's 2 MB limit
- Save and reopen projects

## Put it online with GitHub Pages

1. Create a new repository on GitHub (for example `kanyeva-thumbnail-generator`).
2. Upload **everything inside this folder** (`index.html`, `css`, `js`, `assets`, `.nojekyll`, `README.md`) to the repository root.
3. Go to **Settings > Pages**. Under *Build and deployment*, set *Source* to **Deploy from a branch**, pick the `main` branch and the `/ (root)` folder, then save.
4. After a minute your site is live at `https://YOUR-USERNAME.github.io/kanyeva-thumbnail-generator/`.

> Open the site through that link (or a local server), not by double-clicking `index.html`.
> Browsers block exporting images from pages opened straight from a file.
> To test locally: run `python3 -m http.server` in this folder and visit `http://localhost:8000`.

## Add your own album cover presets

1. Put a square `.png` or `.jpg` into `assets/presets/`.
2. Add one line to `js/presets.js`:
   ```js
   { name: 'My album', src: 'assets/presets/my-album.png' },
   ```
The first entry in the list is the cover that loads when the page opens.
The included covers (other than "Template sample", which comes from your PSD) are generated placeholders. Replace or delete them.

## Files

```
index.html          page layout
css/style.css       interface styling
js/app.js           the editor (rendering, dragging, panels, export)
js/presets.js       album cover preset list
assets/logo.png     channel logo from the PSD
assets/presets/     preset covers
```

## Notes on the template

The layout (cover position and size, 200px corner radius, 45% black shadow, white right-aligned text, logo placement)
was measured directly from the layers in the PSD. The text in the PSD is rasterized, so the generator uses an
Arial/Helvetica-style bold font (Arimo) tuned to match. If your original font is different, use
**Text > Use my own font** to load it (.ttf, .otf, .woff, .woff2). Uploaded fonts last until the page is reloaded.

## Roadmap ideas for future updates

Layered PSD export, saved font choices, more presets, more templates.
