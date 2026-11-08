/* KanyevaUnreleasder Thumbnail Generator, beta 0.3
   Everything runs in the browser. The template geometry comes from
   Kanyeva_Thumbnail_Template_V47.psd (5000 x 2812). */
(() => {
'use strict';

/* =====================================================================
   Constants and helpers
   ===================================================================== */
const W = 5000, H = 2812;              // template size in px
const PREVIEW_W = 1920;                // on-screen canvas resolution
const PS = PREVIEW_W / W;              // preview scale
const YT_LIMIT = 2 * 1024 * 1024;      // YouTube thumbnail size limit

const $ = (s, root = document) => root.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const deg = r => r * 180 / Math.PI;
const rad = d => d * Math.PI / 180;
const clone = o => JSON.parse(JSON.stringify(o));
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return e;
}

/* Small icon set (stroke icons, 24px grid) */
const ICONS = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M10.7 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.6 3.5M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-8 8"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 19h16"/>',
  save: '<path d="M5 3h11l3 3v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  folder: '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/>',
  grid: '<path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><rect x="3" y="3" width="18" height="18" rx="2"/>',
  ruler: '<path d="m3 17 14-14 4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  magnet: '<path d="M6 3v9a6 6 0 0 0 12 0V3"/><path d="M6 8h4M14 8h4"/>',
  sliders: '<path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  alignL: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
  alignC: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
  alignR: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
  type: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  play: '<path d="M7 5v14l12-7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>'
};
function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}
function label(iconName, text) { return `${iconName ? icon(iconName) : ''}${text ? `<span>${text}</span>` : ''}`; }

/* =====================================================================
   Fonts: Helvetica Rounded Bold (from assets/) plus anything the user uploads
   ===================================================================== */
const MAIN_FONT = 'Helvetica Rounded Bold';
const FONT_URL = 'assets/Helvetica Rounded Bold/Helvetica Rounded Bold.otf';
const FONTS = [{ name: MAIN_FONT, weights: [700] }];
const customFonts = [];
const allFonts = () => FONTS.concat(customFonts);
const fontInfo = name => allFonts().find(f => f.name === name) || { name, weights: [400, 700] };
const WEIGHT_NAMES = { 400: 'Regular', 700: 'Bold' };

function fontString(o, size = o.size) {
  return `${o.italic ? 'italic ' : ''}${o.weight} ${size}px "${o.font}", "Helvetica Neue", Helvetica, Arial, sans-serif`;
}
async function ensureFont(o) {
  try { await document.fonts.load(fontString(o, 100), 'Aa'); } catch (e) { /* ignore, fall back */ }
}
async function mainFontAvailable() {
  try { const faces = await document.fonts.load(`700 100px "${MAIN_FONT}"`, 'Aa'); return faces.length > 0; }
  catch (e) { return false; }
}

/* =====================================================================
   Image registry (keeps big images out of the undo history)
   ===================================================================== */
const images = new Map();   // id -> { src, img, w, h }
function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('Could not load image'));
    i.src = src;
  });
}
async function registerImage(src, id) {
  id = id || ('u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  if (images.has(id)) return id;
  const img = await loadImage(src);
  let draw = img, w = img.naturalWidth, hh = img.naturalHeight;
  const MAX = 3600;
  if (Math.max(w, hh) > MAX) {
    const k = MAX / Math.max(w, hh);
    const c = document.createElement('canvas');
    c.width = Math.round(w * k); c.height = Math.round(hh * k);
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, c.width, c.height);
    draw = c; w = c.width; hh = c.height;
  }
  images.set(id, { src, img: draw, w, h: hh });
  return id;
}
function readFileAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error('Could not read file'));
    r.readAsDataURL(file);
  });
}

/* =====================================================================
   State
   ===================================================================== */
const PRESETS = window.KU_PRESETS || [];
const presetId = p => 'preset:' + p.src;
const DEFAULT_COVER_ID = PRESETS[0] ? presetId(PRESETS[0]) : null;

function textObj(extra) {
  const o = Object.assign({
    type: 'text', name: 'Text', visible: true,
    text: 'Text', font: MAIN_FONT, weight: 700, italic: false, caps: false,
    size: 160, color: '#ffffff', fill: 'solid', color2: '#ffb524', gradAngle: 90,
    align: 'right', x: 2168, y: 2050, lh: 1, ls: 0, rot: 0, opacity: 1,
    stroke: { on: false, width: 14, color: '#000000' },
    shadow: { on: false, color: '#000000', opacity: 0.55, blur: 30, x: 14, y: 14 },
    keep: true          // keep clear of other layers and inside the canvas
  }, extra);
  if (o.want == null) o.want = o.size;   // the size the user asked for; o.size may be smaller so the text fits
  return o;
}

/* Geometry measured from the PSD:
   cover  = rounded square 2586px at (2314,120), corner radius 200px
   shadow = black 45%, shifted right/down, 99% of the cover size
   texts  = right-aligned bold, white. Size and position are fitted to the
            PSD's ink bounds once the font has loaded (see fitTemplateText)
   logo   = 1532 x 257 white logo at bottom left */
function makeDefaultState() {
  return {
    nextText: 1,
    guides: { v: [], h: [] },
    order: ['cover', 'albumTitle', 'artist', 'track', 'logo'],
    objects: {
      cover: {
        type: 'cover', name: 'Album cover', visible: true,
        cx: 3607, cy: 1413, size: 2586, rot: 0, opacity: 1, radius: 0.0773,
        imgId: DEFAULT_COVER_ID, zoom: 1, panX: 0, panY: 0,
        border: { on: false, width: 24, color: '#ffffff' },
        shadow: { on: true, color: '#000000', opacity: 0.45, x: 0.01875, y: 0.0199, scale: 0.99, blur: 0 }
      },
      albumTitle: textObj({ name: 'Album title', text: 'Album Title Here', size: 160, x: 2168, y: 2048 }),
      artist: textObj({ name: 'Artist name', text: 'Artist Name Here', size: 185, x: 2168, y: 1833 }),
      track: textObj({ name: 'Track title', text: 'Track Title\nHere', size: 422, x: 2201, y: 1168 }),
      logo: { type: 'logo', name: 'Channel logo', visible: true, cx: 827, cy: 2640, scale: 1, rot: 0, opacity: 1, tintOn: false, tint: '#ffffff' }
    }
  };
}

/* Fit a template text so its ink matches the PSD: the width of its first line
   and the right edge. This works with whatever font is loaded, so the layout
   stays faithful to the template even if the font's metrics differ. */
function fitTemplateText(o, line, inkWidth, inkRight) {
  const ctx = mc;
  ctx.font = fontString(o, 1000);
  ctx.textAlign = 'right';
  const m = ctx.measureText(line);
  const ink = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  if (!ink) return;
  o.size = Math.round(1000 * inkWidth / ink * 10) / 10;
  o.want = o.size;
  ctx.font = fontString(o);
  const m2 = ctx.measureText(line);
  o.x = Math.round((inkRight - m2.actualBoundingBoxRight) * 10) / 10;
  ctx.textAlign = 'start';
}
function calibrateState(st) {
  const O = st.objects;
  fitTemplateText(O.albumTitle, 'Album Title Here', 1300, 2163);
  fitTemplateText(O.artist, 'Artist Name Here', 1542, 2162);
  fitTemplateText(O.track, 'Track Title', 2063, 2187);
}

let state = null;
let TEMPLATE = null;                   // calibrated default state (JSON string)
let sel = 'cover';                     // selected layer id or 'background'
const obj = id => state.objects[id];
const cur = () => (sel === 'background' ? null : state.objects[sel]);

/* =====================================================================
   Text layout
   ===================================================================== */
const mc = document.createElement('canvas').getContext('2d');

function textLines(o) { return (o.caps ? o.text.toUpperCase() : o.text).split('\n'); }
function lineWidth(line, o, ctx = mc) {
  ctx.font = fontString(o);
  if (!o.ls) return ctx.measureText(line).width;
  const sp = o.ls / 1000 * o.size;
  let w = 0, n = 0;
  for (const ch of line) { w += ctx.measureText(ch).width; n++; }
  return w + sp * Math.max(0, n - 1);
}
function layoutText(o) {
  const lines = textLines(o);
  const widths = lines.map(l => lineWidth(l, o));
  const w = Math.max(20, ...widths);
  const left = o.align === 'left' ? o.x : o.align === 'center' ? o.x - w / 2 : o.x - w;
  const top = o.y - o.size * 0.78;
  const bottom = o.y + (lines.length - 1) * o.lh * o.size + o.size * 0.22;
  return { lines, widths, w, h: bottom - top, left, top, cx: left + w / 2, cy: (top + bottom) / 2 };
}

/* =====================================================================
   Drawing
   ===================================================================== */
function rrPath(ctx, x, y, w, hh, r) {
  r = Math.max(0, Math.min(r, w / 2, hh / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + hh, r);
  ctx.arcTo(x + w, y + hh, x, y + hh, r);
  ctx.arcTo(x, y + hh, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* Fill a shape with a blurred shadow-like fill. The shape is drawn far off
   canvas and only its shadow lands on screen, which works in every browser. */
function fillBlurred(ctx, s, blur, color, alpha, pathFn) {
  if (blur <= 0) { pathFn(); ctx.fillStyle = rgba(color, alpha); ctx.fill(); return; }
  const m = ctx.getTransform(), BIG = 30000;
  ctx.save();
  ctx.setTransform(m.a, m.b, m.c, m.d, m.e - BIG, m.f);
  ctx.shadowColor = rgba(color, alpha);
  ctx.shadowBlur = blur * s;
  ctx.shadowOffsetX = BIG; ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#000';
  pathFn(); ctx.fill();
  ctx.restore();
}

/* ---------- Cover, text, logo ---------- */
function drawCover(ctx, o, s, opts) {
  const half = o.size / 2, r = o.radius * o.size, rot = rad(o.rot);
  if (o.shadow.on && o.shadow.opacity > 0) {
    ctx.save();
    ctx.translate(o.cx + o.shadow.x * o.size, o.cy + o.shadow.y * o.size);
    ctx.rotate(rot);
    const sz = o.size * o.shadow.scale, sr = r * o.shadow.scale;
    fillBlurred(ctx, s, o.shadow.blur, o.shadow.color, o.shadow.opacity * o.opacity, () => rrPath(ctx, -sz / 2, -sz / 2, sz, sz, sr));
    ctx.restore();
  }
  ctx.save();
  ctx.translate(o.cx, o.cy); ctx.rotate(rot);
  ctx.globalAlpha = o.opacity;
  rrPath(ctx, -half, -half, o.size, o.size, r);
  ctx.save();
  ctx.clip();
  const reg = images.get(o.imgId);
  if (reg) {
    ctx.imageSmoothingQuality = 'high';
    const base = Math.max(o.size / reg.w, o.size / reg.h) * o.zoom;
    const dw = reg.w * base, dh = reg.h * base;
    ctx.drawImage(reg.img, -dw / 2 + o.panX * o.size, -dh / 2 + o.panY * o.size, dw, dh);
  } else {
    ctx.fillStyle = '#23262f'; ctx.fillRect(-half, -half, o.size, o.size);
    if (opts.preview) {
      ctx.fillStyle = '#8c94a8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${o.size * 0.07}px Arial, sans-serif`;
      ctx.fillText('Choose an album cover', 0, 0);
    }
  }
  ctx.restore();
  if (o.border.on && o.border.width > 0) {
    const bw = o.border.width;
    rrPath(ctx, -half + bw / 2, -half + bw / 2, o.size - bw, o.size - bw, Math.max(0, r - bw / 2));
    ctx.lineWidth = bw; ctx.strokeStyle = o.border.color; ctx.stroke();
  }
  ctx.restore();
}

function drawTextLine(ctx, text, o, y, mode) {
  const fn = mode === 'stroke' ? 'strokeText' : 'fillText';
  if (!o.ls) { ctx.textAlign = o.align; ctx[fn](text, o.x, y); return; }
  const sp = o.ls / 1000 * o.size;
  const w = lineWidth(text, o, ctx);
  ctx.font = fontString(o);
  let x = o.align === 'left' ? o.x : o.align === 'center' ? o.x - w / 2 : o.x - w;
  ctx.textAlign = 'left';
  for (const ch of text) { ctx[fn](ch, x, y); x += ctx.measureText(ch).width + sp; }
}

function drawText(ctx, o, s) {
  if (!o.text.trim()) return;
  const L = layoutText(o);
  ctx.save();
  ctx.translate(L.cx, L.cy); ctx.rotate(rad(o.rot)); ctx.translate(-L.cx, -L.cy);
  ctx.globalAlpha = o.opacity;
  ctx.font = fontString(o);
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  let fill = o.color;
  if (o.fill === 'gradient') {
    const a = rad(o.gradAngle), dx = Math.cos(a), dy = Math.sin(a);
    const half = Math.abs(L.w / 2 * dx) + Math.abs(L.h / 2 * dy);
    fill = ctx.createLinearGradient(L.cx - dx * half, L.cy - dy * half, L.cx + dx * half, L.cy + dy * half);
    fill.addColorStop(0, o.color); fill.addColorStop(1, o.color2);
  }
  const setShadow = () => {
    if (!o.shadow.on) return;
    ctx.shadowColor = rgba(o.shadow.color, o.shadow.opacity);
    ctx.shadowBlur = o.shadow.blur * s;
    ctx.shadowOffsetX = o.shadow.x * s; ctx.shadowOffsetY = o.shadow.y * s;
  };
  const clearShadow = () => { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; };
  const paint = mode => L.lines.forEach((ln, i) => drawTextLine(ctx, ln, o, o.y + i * o.lh * o.size, mode));
  if (o.stroke.on && o.stroke.width > 0) {
    setShadow();
    ctx.strokeStyle = o.stroke.color; ctx.lineWidth = o.stroke.width * 2;
    paint('stroke');
    clearShadow();
    ctx.fillStyle = fill; paint('fill');
  } else {
    setShadow(); ctx.fillStyle = fill; paint('fill');
  }
  ctx.restore();
}

const tintCache = new Map();
function logoSource(o) {
  const reg = images.get('logo');
  if (!reg || !o.tintOn) return reg && reg.img;
  const key = o.tint;
  if (!tintCache.has(key)) {
    const c = document.createElement('canvas'); c.width = reg.w; c.height = reg.h;
    const x = c.getContext('2d');
    x.drawImage(reg.img, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = o.tint; x.fillRect(0, 0, c.width, c.height);
    tintCache.set(key, c);
  }
  return tintCache.get(key);
}
function drawLogo(ctx, o) {
  const reg = images.get('logo'); if (!reg) return;
  const w = reg.w * o.scale, hh = reg.h * o.scale;
  ctx.save();
  ctx.translate(o.cx, o.cy); ctx.rotate(rad(o.rot)); ctx.globalAlpha = o.opacity;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(logoSource(o), -w / 2, -hh / 2, w, hh);
  ctx.restore();
}

function renderScene(ctx, s, opts = {}) {
  // the background is transparent: clear, then draw the layers
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, Math.round(W * s), Math.round(H * s));
  ctx.restore();
  ctx.save();
  ctx.setTransform(s, 0, 0, s, 0, 0);
  for (const id of state.order) {
    const o = obj(id);
    if (!o || !o.visible) continue;
    if (o.type === 'cover') drawCover(ctx, o, s, opts);
    else if (o.type === 'text') drawText(ctx, o, s);
    else if (o.type === 'logo') drawLogo(ctx, o);
  }
  ctx.restore();
}

/* =====================================================================
   Geometry helpers for selection, snapping and rulers
   ===================================================================== */
const stage = $('#stage');
const sctx = stage.getContext('2d');
const unit = () => W / stage.getBoundingClientRect().width;   // template px per CSS px
const ROT_OFFSET = 44;                                          // CSS px

function boxOf(o) {
  if (o.type === 'cover') return { cx: o.cx, cy: o.cy, w: o.size, h: o.size, rot: o.rot };
  if (o.type === 'logo') { const r = images.get('logo'); return { cx: o.cx, cy: o.cy, w: r.w * o.scale, h: r.h * o.scale, rot: o.rot }; }
  const L = layoutText(o);
  return { cx: L.cx, cy: L.cy, w: L.w, h: L.h, rot: o.rot };
}
function toWorld(b, lx, ly) {
  const a = rad(b.rot), c = Math.cos(a), s = Math.sin(a);
  return { x: b.cx + lx * c - ly * s, y: b.cy + lx * s + ly * c };
}
function toLocal(b, p) {
  const a = -rad(b.rot), dx = p.x - b.cx, dy = p.y - b.cy;
  return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
}
function aabb(b, cx = b.cx, cy = b.cy) {
  const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => toWorld({ ...b, cx, cy }, sx * b.w / 2, sy * b.h / 2));
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return { minx: Math.min(...xs), maxx: Math.max(...xs), miny: Math.min(...ys), maxy: Math.max(...ys) };
}

/* =====================================================================
   View settings: grid, rulers, snapping (remembered between visits)
   ===================================================================== */
const VIEW_KEY = 'ku-thumb-view-v3';   // bumped in 0.3 so template lines are on for everyone
const VIEW_DEFAULTS = {
  rulers: true, grid: false, snapGrid: true, smart: true,
  template: true, center: false, ytZone: false,
  gridMode: 'divisions', cols: 8, rows: 8, cell: 250, margin: 0,
  gridColor: '#ffffff', gridOpacity: 0.35, gridWidth: 1, snapPx: 10
};
const view = Object.assign({}, VIEW_DEFAULTS);
try { Object.assign(view, JSON.parse(localStorage.getItem(VIEW_KEY) || '{}')); } catch (e) { /* ignore */ }
function saveView() { try { localStorage.setItem(VIEW_KEY, JSON.stringify(view)); } catch (e) { /* ignore */ } }

/* Lines of the grid in template px. */
function gridLines() {
  const m = clamp(view.margin, 0, Math.min(W, H) / 2 - 10);
  const x0 = m, x1 = W - m, y0 = m, y1 = H - m, xs = [], ys = [];
  if (view.gridMode === 'divisions') {
    const c = Math.max(1, Math.round(view.cols)), r = Math.max(1, Math.round(view.rows));
    for (let i = 0; i <= c; i++) xs.push(x0 + (x1 - x0) * i / c);
    for (let i = 0; i <= r; i++) ys.push(y0 + (y1 - y0) * i / r);
  } else {
    // square cells that grow out from the centre, so the grid stays symmetric
    const sz = Math.max(20, view.cell);
    const grow = (mid, lo, hi, out) => {
      out.push(mid);
      for (let k = 1; mid + k * sz <= hi + 0.5 || mid - k * sz >= lo - 0.5; k++) {
        if (mid + k * sz <= hi + 0.5) out.push(mid + k * sz);
        if (mid - k * sz >= lo - 0.5) out.push(mid - k * sz);
      }
    };
    grow(W / 2, x0, x1, xs); grow(H / 2, y0, y1, ys);
    if (m > 0) { xs.push(x0, x1); ys.push(y0, y1); }
    xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
  }
  return { xs, ys };
}
function gridStep(axis) {
  if (view.gridMode === 'divisions') {
    const m = clamp(view.margin, 0, 1000);
    return axis === 'x' ? (W - 2 * m) / Math.max(1, view.cols) : (H - 2 * m) / Math.max(1, view.rows);
  }
  return Math.max(20, view.cell);
}

/* Lines that belong to the PSD layout (text right edge, baselines, cover edges, logo edge). */
let templateLines = { xs: [], ys: [] };
function buildTemplateLines(st) {
  const O = st.objects, c = O.cover, lg = images.get('logo');
  const xs = [O.albumTitle.x, c.cx - c.size / 2, c.cx + c.size / 2];
  if (lg) xs.push(O.logo.cx - lg.w * O.logo.scale / 2);
  const ys = [c.cy - c.size / 2, c.cy + c.size / 2, O.albumTitle.y, O.artist.y, O.track.y, O.track.y + O.track.lh * O.track.size];
  templateLines = { xs: [...new Set(xs.map(Math.round))], ys: [...new Set(ys.map(Math.round))] };
}

/* =====================================================================
   Keep-in-place rules for text
   A text with "keep in place" on may not overlap any other layer and may
   not leave the canvas. Other layers may not be pushed onto such a text either.
   ===================================================================== */
const KEEP_GAP = 8;       // minimum clear space between a text and another layer (template px)
const KEEP_EDGE = 20;     // minimum clear space between a text and the canvas edge
const keepOn = o => !!o && o.type === 'text' && o.keep !== false;

function rotatePts(pts, cx, cy, rot) {
  const a = rad(rot), c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => ({ x: cx + (x - cx) * c - (y - cy) * s, y: cy + (x - cx) * s + (y - cy) * c }));
}
/* The ink of a text (tighter than its selection box), as a rotated rectangle. */
function textPoly(o) {
  const L = layoutText(o);
  let i0 = L.lines.findIndex(l => l.trim()), i1 = -1;
  L.lines.forEach((l, i) => { if (l.trim()) i1 = i; });
  if (i0 < 0) return null;
  mc.font = fontString(o);
  const asc = Math.max(mc.measureText(L.lines[i0]).actualBoundingBoxAscent || 0, o.size * 0.3);
  const desc = Math.max(mc.measureText(L.lines[i1]).actualBoundingBoxDescent || 0, 0);
  const top = o.y + i0 * o.lh * o.size - asc, bottom = o.y + i1 * o.lh * o.size + desc;
  return rotatePts([[L.left, top], [L.left + L.w, top], [L.left + L.w, bottom], [L.left, bottom]], L.cx, L.cy, o.rot);
}
function polyOf(o) {
  if (o.type === 'text') return textPoly(o);
  const b = boxOf(o);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => toWorld(b, sx * b.w / 2, sy * b.h / 2));
}
/* Separating-axis test with a minimum gap. */
function polysConflict(A, B, gap) {
  for (const P of [A, B]) {
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[(i + 1) % P.length];
      let ax = -(q.y - p.y), ay = q.x - p.x;
      const len = Math.hypot(ax, ay) || 1; ax /= len; ay /= len;
      const proj = poly => { let mn = Infinity, mx = -Infinity; for (const v of poly) { const d = v.x * ax + v.y * ay; mn = Math.min(mn, d); mx = Math.max(mx, d); } return [mn, mx]; };
      const [a0, a1] = proj(A), [b0, b1] = proj(B);
      if (a1 + gap <= b0 || b1 + gap <= a0) return false;
    }
  }
  return true;
}
/* Is this layer allowed where it currently is? */
function placementValid(id) {
  const o = obj(id);
  if (!o || !o.visible) return true;
  const A = polyOf(o);
  if (!A) return true;
  if (keepOn(o) && A.some(v => v.x < KEEP_EDGE || v.x > W - KEEP_EDGE || v.y < KEEP_EDGE || v.y > H - KEEP_EDGE)) return false;
  for (const oid of state.order) {
    if (oid === id) continue;
    const q = obj(oid);
    if (!q || !q.visible) continue;
    if (!keepOn(o) && !keepOn(q)) continue;
    const B = polyOf(q);
    if (B && polysConflict(A, B, KEEP_GAP)) return false;
  }
  return true;
}
/* Apply a change; if it would put the layer somewhere not allowed, undo it.
   (If the layer was already somewhere not allowed, the change is let through so it can be fixed.) */
function tryChange(id, fn) {
  const o = obj(id), before = clone(o), wasOk = placementValid(id);
  fn(o);
  if (wasOk && !placementValid(id)) { Object.assign(o, before); return false; }
  return true;
}
/* Size a text as large as the user asked for, shrinking only as far as needed to fit. */
function fitText(id) {
  const o = obj(id);
  if (!o || o.type !== 'text') return;
  const want = o.want || o.size;
  o.size = want;
  if (!keepOn(o) || placementValid(id)) return;
  let lo = 8, hi = want;
  o.size = lo;
  if (!placementValid(id)) { o.size = want; return; }   // the anchor itself is blocked, so shrinking can't help
  for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; o.size = mid; if (placementValid(id)) lo = mid; else hi = mid; }
  o.size = Math.round(lo * 10) / 10;
}
/* Put a text back on a spot where it is allowed to be. */
function placeText(id) {
  const o = obj(id), want = o.want || 200;
  o.align = 'right'; o.rot = 0;
  for (const [x, y] of [[2187, 560], [2187, 330], [2187, 770], [1500, 240]]) {
    o.x = x; o.y = y; o.size = want; fitText(id);
    if (placementValid(id) && o.size >= Math.min(want, 90)) return;
  }
}
function settleText(id) {
  const o = obj(id);
  fitText(id);
  if (placementValid(id)) return;
  const t = TEMPLATE && JSON.parse(TEMPLATE).objects[id];
  if (t) { ['x', 'y', 'rot', 'align'].forEach(k => { o[k] = t[k]; }); o.want = t.want; fitText(id); }
  if (!placementValid(id)) placeText(id);
}
function resetTextPlacement(id) {
  const o = obj(id), t = TEMPLATE && JSON.parse(TEMPLATE).objects[id];
  if (!t) { placeText(id); return; }
  ['x', 'y', 'rot', 'align', 'lh'].forEach(k => { o[k] = t[k]; });
  o.want = t.want;
  fitText(id);
}

/* =====================================================================
   Snapping helpers shared by dragging and by the sliders
   ===================================================================== */
function snapCandidates(excludeId) {
  const xs = [], ys = [];
  if (view.smart) {
    xs.push(0, W / 2, W); ys.push(0, H / 2, H);
    xs.push(...state.guides.v); ys.push(...state.guides.h);
    for (const id of state.order) {
      if (id === excludeId) continue;
      const o = obj(id);
      if (!o || !o.visible) continue;
      const a = aabb(boxOf(o));
      xs.push(a.minx, (a.minx + a.maxx) / 2, a.maxx);
      ys.push(a.miny, (a.miny + a.maxy) / 2, a.maxy);
      if (o.type === 'text' && o.rot === 0) { const L = layoutText(o); L.lines.forEach((_, i) => ys.push(o.y + i * o.lh * o.size)); }
    }
  }
  if (view.snapGrid) { const g = gridLines(); xs.push(...g.xs); ys.push(...g.ys); }
  if (view.template) { xs.push(...templateLines.xs); ys.push(...templateLines.ys); }
  return { xs, ys };
}
function bestSnap(feats, cands, thr) {
  let best = null;
  for (const f of feats) for (const c of cands) {
    const d = c - f;
    if (Math.abs(d) < thr && (best === null || Math.abs(d) < Math.abs(best))) best = d;
  }
  return best;
}
const snapThreshold = () => view.snapPx * unit();

/* Position slider: snap the layer's edges, center and baselines. axis is 'x' or 'y'. */
function snapPos(id, key, v, axis) {
  const o = obj(id), orig = o[key];
  o[key] = v;
  const b = boxOf(o), ab = aabb(b);
  const feats = axis === 'x' ? [ab.minx, b.cx, ab.maxx] : [ab.miny, b.cy, ab.maxy];
  if (axis === 'y' && o.type === 'text' && o.rot === 0) textLines(o).forEach((_, i) => feats.push(o.y + i * o.lh * o.size));
  o[key] = orig;
  const cand = snapCandidates(id), list = axis === 'x' ? cand.xs : cand.ys;
  const d = bestSnap(feats, list, snapThreshold());
  if (d === null) return { value: v, guides: [] };
  const guides = [];
  feats.forEach(f => list.forEach(c => { if (Math.abs(c - (f + d)) < 0.6) guides.push({ axis: axis === 'x' ? 'v' : 'h', pos: c }); }));
  return { value: v + d, guides };
}
/* Size slider: snap the edges that move when the size changes. applyFn(value) sets the size. */
function snapSize(id, v, applyFn, orig) {
  const o = obj(id), edges = () => { const a = aabb(boxOf(o)); return { x: [a.minx, a.maxx], y: [a.miny, a.maxy] }; };
  applyFn(v); const e0 = edges();
  applyFn(v + 1); const e1 = edges();
  applyFn(orig);
  const cand = snapCandidates(id), thr = snapThreshold();
  let best = null;
  for (const axis of ['x', 'y']) {
    for (let i = 0; i < 2; i++) {
      const slope = e1[axis][i] - e0[axis][i];
      if (Math.abs(slope) < 1e-6) continue;
      for (const g of (axis === 'x' ? cand.xs : cand.ys)) {
        const d = g - e0[axis][i];
        if (Math.abs(d) < thr && (!best || Math.abs(d) < best.abs)) best = { abs: Math.abs(d), dv: d / slope, guide: { axis: axis === 'x' ? 'v' : 'h', pos: g } };
      }
    }
  }
  return best ? { value: v + best.dv, guides: [best.guide] } : { value: v, guides: [] };
}
/* Rotation slider: stick to 15 degree steps. */
function snapRot(v) {
  const r = Math.round(v / 15) * 15;
  return Math.abs(v - r) < 4 ? { value: r, guides: [] } : { value: v, guides: [] };
}

/* =====================================================================
   Overlay (selection, grid, guides) and rulers: preview only, never exported
   ===================================================================== */
let dragGuides = [];       // snap lines shown while dragging: { axis:'v'|'h', pos }
let liveGuide = null;      // ruler guide being pulled out: { axis, pos }
let mouse = null;          // pointer position in template px
let exporting = false, rafId = 0;

function drawOverlay() {
  const u = unit();
  sctx.save();
  sctx.setTransform(PS, 0, 0, PS, 0, 0);
  const seg = (x1, y1, x2, y2) => { sctx.moveTo(x1, y1); sctx.lineTo(x2, y2); };

  if (view.grid) {
    const g = gridLines(), m = clamp(view.margin, 0, Math.min(W, H) / 2 - 10);
    sctx.save();
    sctx.beginPath();
    g.xs.forEach(x => seg(x, m, x, H - m));
    g.ys.forEach(y => seg(m, y, W - m, y));
    sctx.globalAlpha = view.gridOpacity * 0.55; sctx.strokeStyle = '#000000'; sctx.lineWidth = (view.gridWidth + 1.6) * u;   // dark edge keeps lines visible on light images
    sctx.stroke();
    sctx.globalAlpha = view.gridOpacity; sctx.strokeStyle = view.gridColor; sctx.lineWidth = view.gridWidth * u;
    sctx.stroke();
    if (m > 0) { sctx.setLineDash([8 * u, 6 * u]); sctx.strokeRect(m, m, W - 2 * m, H - 2 * m); }
    sctx.restore();
  }
  if (view.center) {
    sctx.save(); sctx.strokeStyle = 'rgba(255,255,255,.6)'; sctx.lineWidth = 1.5 * u; sctx.setLineDash([10 * u, 8 * u]);
    sctx.beginPath(); seg(W / 2, 0, W / 2, H); seg(0, H / 2, W, H / 2); sctx.stroke(); sctx.restore();
  }
  if (view.template) {
    sctx.save(); sctx.strokeStyle = 'rgba(255,181,36,.9)'; sctx.lineWidth = 1.5 * u; sctx.setLineDash([14 * u, 8 * u]);
    sctx.beginPath();
    templateLines.xs.forEach(x => seg(x, 0, x, H)); templateLines.ys.forEach(y => seg(0, y, W, y));
    sctx.stroke(); sctx.restore();
  }
  if (view.ytZone) {
    // area covered by the YouTube video-length badge (about 10% x 7% in the bottom right)
    const zw = W * 0.105, zh = H * 0.075, zx = W - zw - W * 0.006, zy = H - zh - H * 0.012;
    sctx.save();
    sctx.fillStyle = 'rgba(255,60,60,.28)'; sctx.strokeStyle = 'rgba(255,90,90,.9)'; sctx.lineWidth = 2 * u;
    sctx.fillRect(zx, zy, zw, zh); sctx.strokeRect(zx, zy, zw, zh);
    sctx.fillStyle = '#fff'; sctx.font = `700 ${12 * u}px DM Sans, Arial, sans-serif`; sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
    sctx.fillText('video length', zx + zw / 2, zy + zh / 2);
    sctx.restore();
  }

  // user guides pulled from the rulers
  sctx.save(); sctx.strokeStyle = '#19d3da'; sctx.lineWidth = 1.5 * u; sctx.beginPath();
  state.guides.v.forEach(x => seg(x, 0, x, H)); state.guides.h.forEach(y => seg(0, y, W, y));
  if (liveGuide) { if (liveGuide.axis === 'v') seg(liveGuide.pos, 0, liveGuide.pos, H); else seg(0, liveGuide.pos, W, liveGuide.pos); }
  sctx.stroke(); sctx.restore();

  if (dragGuides.length) {
    sctx.save(); sctx.strokeStyle = '#ff4fa3'; sctx.lineWidth = 2 * u; sctx.beginPath();
    dragGuides.forEach(g => g.axis === 'v' ? seg(g.pos, 0, g.pos, H) : seg(0, g.pos, W, g.pos));
    sctx.stroke(); sctx.restore();
  }

  const o = cur();
  if (o && o.visible && !exporting) {
    const b = boxOf(o);
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => toWorld(b, sx * b.w / 2, sy * b.h / 2));
    sctx.lineWidth = 2 * u; sctx.strokeStyle = '#2ea8ff';
    sctx.beginPath(); pts.forEach((p, i) => i ? sctx.lineTo(p.x, p.y) : sctx.moveTo(p.x, p.y)); sctx.closePath(); sctx.stroke();
    // text baselines, so alignment to the grid is easy to judge
    if (o.type === 'text' && o.rot === 0) {
      const L = layoutText(o);
      sctx.save(); sctx.strokeStyle = 'rgba(46,168,255,.7)'; sctx.lineWidth = 1 * u; sctx.setLineDash([6 * u, 5 * u]); sctx.beginPath();
      L.lines.forEach((_, i) => seg(L.left, o.y + i * o.lh * o.size, L.left + L.w, o.y + i * o.lh * o.size));
      sctx.stroke(); sctx.restore();
    }
    // rotate handle
    const top = toWorld(b, 0, -b.h / 2), rh = toWorld(b, 0, -b.h / 2 - ROT_OFFSET * u);
    sctx.beginPath(); sctx.moveTo(top.x, top.y); sctx.lineTo(rh.x, rh.y); sctx.stroke();
    sctx.fillStyle = '#fff';
    sctx.beginPath(); sctx.arc(rh.x, rh.y, 8 * u, 0, Math.PI * 2); sctx.fill(); sctx.stroke();
    // corner handles
    pts.forEach(p => { sctx.beginPath(); sctx.rect(p.x - 7 * u, p.y - 7 * u, 14 * u, 14 * u); sctx.fill(); sctx.stroke(); });
  }
  sctx.restore();
}

/* ---------- Rulers ---------- */
const rulerH = $('#rulerH'), rulerV = $('#rulerV');
let rulerKey = '';
function paintRuler(c, axis, bb) {
  const r = c.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const d = window.devicePixelRatio || 1, cw = Math.round(r.width * d), chh = Math.round(r.height * d);
  if (c.width !== cw || c.height !== chh) { c.width = cw; c.height = chh; }
  const ctx = c.getContext('2d');
  ctx.setTransform(d, 0, 0, d, 0, 0);
  const hor = axis === 'h', len = hor ? r.width : r.height, thick = hor ? r.height : r.width;
  const total = hor ? W : H, u = total / len;
  ctx.fillStyle = '#1c1f27'; ctx.fillRect(0, 0, r.width, r.height);
  if (bb) {                                     // extent of the selected layer
    const a = hor ? bb.minx : bb.miny, b2 = hor ? bb.maxx : bb.maxy;
    ctx.fillStyle = 'rgba(46,168,255,.30)';
    if (hor) ctx.fillRect(a / u, 0, (b2 - a) / u, thick); else ctx.fillRect(0, a / u, thick, (b2 - a) / u);
  }
  const step = [10, 20, 25, 50, 100, 200, 250, 500, 1000].find(s => s / u >= 70) || 1000, minor = step / 5;
  ctx.strokeStyle = '#6b7388'; ctx.lineWidth = 1; ctx.beginPath();
  for (let v = 0; v <= total + 0.1; v += minor) {
    const pos = Math.round(v / u) + 0.5;
    const major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
    const mid = !major && Math.abs(v / (step / 2) - Math.round(v / (step / 2))) < 1e-6;
    const tl = major ? thick : mid ? thick * 0.55 : thick * 0.3;
    if (hor) { ctx.moveTo(pos, thick); ctx.lineTo(pos, thick - tl); } else { ctx.moveTo(thick, pos); ctx.lineTo(thick - tl, pos); }
  }
  ctx.stroke();
  ctx.fillStyle = '#98a1b5'; ctx.font = '10px "DM Sans", Arial, sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  for (let v = 0; v <= total + 0.1; v += step) {
    const pos = v / u;
    if (hor) ctx.fillText(String(Math.round(v)), pos + 3, 2);
    else { ctx.save(); ctx.translate(thick - 2, pos + 3); ctx.rotate(Math.PI / 2); ctx.fillText(String(Math.round(v)), 0, 0); ctx.restore(); }
  }
  // user guides and pointer position
  const mark = (v, col) => { ctx.strokeStyle = col; ctx.beginPath(); const p = Math.round(v / u) + 0.5; if (hor) { ctx.moveTo(p, 0); ctx.lineTo(p, thick); } else { ctx.moveTo(0, p); ctx.lineTo(thick, p); } ctx.stroke(); };
  (hor ? state.guides.v : state.guides.h).forEach(v => mark(v, '#19d3da'));
  if (mouse) mark(hor ? mouse.x : mouse.y, '#ffffff');
}
function drawRulers() {
  $('#stageFrame').classList.toggle('no-rulers', !view.rulers);
  if (!view.rulers) return;
  const rect = stage.getBoundingClientRect(), o = cur();
  const bb = o && o.visible ? aabb(boxOf(o)) : null;
  const key = [Math.round(rect.width), Math.round(rect.height), bb ? [bb.minx, bb.maxx, bb.miny, bb.maxy].map(Math.round).join() : '',
    mouse ? Math.round(mouse.x) + ',' + Math.round(mouse.y) : '', JSON.stringify(state.guides), window.devicePixelRatio].join('|');
  if (key === rulerKey) return;
  rulerKey = key;
  paintRuler(rulerH, 'h', bb); paintRuler(rulerV, 'v', bb);
}

function renderPreview() {
  rafId = 0;
  renderScene(sctx, PS, { preview: true });
  drawOverlay();
  drawRulers();
}
function requestRender() { if (!rafId) rafId = requestAnimationFrame(renderPreview); }

/* =====================================================================
   History (undo / redo)
   ===================================================================== */
const hist = { stack: [], i: -1 };
let pushTimer = 0;
function pushHistory() {
  clearTimeout(pushTimer);
  const s = JSON.stringify(state);
  if (hist.stack[hist.i] === s) return;
  hist.stack = hist.stack.slice(0, hist.i + 1);
  hist.stack.push(s);
  if (hist.stack.length > 100) hist.stack.shift();
  hist.i = hist.stack.length - 1;
  updateHistoryButtons();
}
function schedulePush() { clearTimeout(pushTimer); pushTimer = setTimeout(pushHistory, 350); }
function updateHistoryButtons() {
  $('#undoBtn').disabled = hist.i <= 0;
  $('#redoBtn').disabled = hist.i >= hist.stack.length - 1;
}
function gotoHistory(i) {
  pushHistory();   // flush pending edits first
  if (i < 0 || i >= hist.stack.length) return;
  hist.i = i;
  state = JSON.parse(hist.stack[i]);
  if (sel !== 'background' && !state.objects[sel]) sel = 'cover';
  updateHistoryButtons();
  ensureAllFonts().then(requestRender);
  renderLayers(); renderPanel(); requestRender();
}
const undo = () => { pushHistory(); gotoHistory(hist.i - 1); };
const redo = () => gotoHistory(hist.i + 1);

/* =====================================================================
   Controls (shared by the inspector and the grid panel)
   ===================================================================== */
let refreshers = [];
let UI = { reg: () => refreshers, fire: () => changed(), rebuild: () => renderPanel() };
function withUI(ui, fn) { const prev = UI; UI = ui; try { fn(); } finally { UI = prev; } }
function changed() {
  requestRender();
  schedulePush();
  refreshers.forEach(f => f());
}
function refreshAll() { refreshers.forEach(f => f()); }

function slider({ label: lab, min, max, step = 1, digits = 0, get, set, snap }) {
  const reg = UI.reg(), fire = UI.fire;
  const range = h('input', { type: 'range', min, max, step, 'aria-label': lab });
  const num = h('input', { type: 'number', class: 'num', step, 'aria-label': lab + ' value' });
  const refresh = () => {
    const v = get();
    range.value = v;
    if (document.activeElement !== num) num.value = Number(v).toFixed(digits);
  };
  range.addEventListener('input', () => {
    let v = parseFloat(range.value);
    if (snap && view.snapGrid) { const r = snap(v); v = r.value; dragGuides = r.guides || []; }   // sliders stick to the grid
    set(v); fire();
  });
  range.addEventListener('change', () => { dragGuides = []; requestRender(); });
  num.addEventListener('input', () => { const v = parseFloat(num.value); if (!isNaN(v)) { set(v); fire(); } });   // typed numbers are exact, never snapped
  num.addEventListener('blur', refresh);
  reg.push(refresh); refresh();
  return h('div', { class: 'field' }, h('label', {}, lab), h('div', { class: 'slider' }, range, num));
}

function colorField({ label: lab, get, set }) {
  const reg = UI.reg(), fire = UI.fire;
  const input = h('input', { type: 'color', 'aria-label': lab });
  const hex = h('span', { class: 'hex' });
  const refresh = () => { input.value = get(); hex.textContent = get(); };
  input.addEventListener('input', () => { set(input.value); fire(); });
  reg.push(refresh); refresh();
  return h('div', { class: 'field' }, h('label', {}, lab), h('div', { class: 'color' }, input, hex));
}

function selectField({ label: lab, options, get, set, rebuild = false }) {
  const reg = UI.reg(), fire = UI.fire, rb = UI.rebuild;
  const s = h('select', { 'aria-label': lab }, options.map(([v, t]) => h('option', { value: v }, t)));
  const refresh = () => { s.value = String(get()); };
  s.addEventListener('change', () => { set(s.value); fire(); if (rebuild) rb(); });
  reg.push(refresh); refresh();
  return h('div', { class: 'field' }, h('label', {}, lab), h('div', {}, s));
}

function segField({ label: lab, options, get, set, rebuild = false, stack = false }) {
  const reg = UI.reg(), fire = UI.fire, rb = UI.rebuild;
  const wrap = h('div', { class: 'seg', role: 'group', 'aria-label': lab });
  const btns = options.map(([v, content, title]) => {
    const b = h('button', { type: 'button', title: title || '', 'aria-label': title || String(v), html: content });
    b.addEventListener('click', () => { set(v); fire(); if (rebuild) rb(); });
    wrap.append(b); return [v, b];
  });
  const refresh = () => btns.forEach(([v, b]) => b.setAttribute('aria-pressed', String(get() === v)));
  reg.push(refresh); refresh();
  return h('div', { class: 'field' + (stack ? ' stack' : '') }, stack ? null : h('label', {}, lab), wrap);
}

function toggleField({ label: lab, get, set, rebuild = true }) {
  const reg = UI.reg(), fire = UI.fire, rb = UI.rebuild;
  const input = h('input', { type: 'checkbox', role: 'switch', 'aria-label': lab });
  const refresh = () => { input.checked = !!get(); };
  input.addEventListener('change', () => { set(input.checked); fire(); if (rebuild) rb(); });
  reg.push(refresh); refresh();
  return h('label', { class: 'switch', title: lab }, input, h('span'));
}
function switchRow(lab, opts) { return h('div', { class: 'field' }, h('label', {}, lab), h('div', {}, toggleField(opts))); }

function toggleButton(content, get, set) {
  const reg = UI.reg(), fire = UI.fire;
  const b = h('button', { type: 'button', html: content });
  b.addEventListener('click', () => { set(!get()); fire(); });
  const refresh = () => b.setAttribute('aria-pressed', String(!!get()));
  reg.push(refresh); refresh();
  return b;
}

function group(title, ...kids) { return h('section', { class: 'group' }, title ? h('h3', {}, title) : null, ...kids); }
function groupWithSwitch(title, sw, ...kids) {
  return h('section', { class: 'group' }, h('h3', {}, h('span', { class: 'grow' }, title), sw), ...kids);
}
function button(text, iconName, onclick, cls = '') { return h('button', { type: 'button', class: 'btn ' + cls, html: label(iconName, text), onclick }); }

/* =====================================================================
   Layers list and property panels
   ===================================================================== */
function renderLayers() {
  const ul = $('#layers');
  ul.innerHTML = '';
  const ids = state.order.slice().reverse();
  ids.forEach(id => {
    const o = obj(id);
    const li = h('li', { class: 'layer' + (sel === id ? ' sel' : '') + (o.visible ? '' : ' off'), 'data-id': id });
    const eye = h('button', { class: 'mini-btn', title: o.visible ? 'Hide layer' : 'Show layer', 'aria-label': (o.visible ? 'Hide ' : 'Show ') + o.name, html: icon(o.visible ? 'eye' : 'eyeoff') });
    eye.addEventListener('click', e => { e.stopPropagation(); o.visible = !o.visible; pushHistory(); renderLayers(); requestRender(); });
    const idx = state.order.indexOf(id);
    const up = h('button', { class: 'mini-btn', title: 'Bring forward', 'aria-label': 'Bring ' + o.name + ' forward', html: icon('up') });
    up.disabled = idx === state.order.length - 1;
    up.addEventListener('click', e => { e.stopPropagation(); moveLayer(id, 1); });
    const down = h('button', { class: 'mini-btn', title: 'Send backward', 'aria-label': 'Send ' + o.name + ' backward', html: icon('down') });
    down.disabled = idx === 0;
    down.addEventListener('click', e => { e.stopPropagation(); moveLayer(id, -1); });
    li.append(eye, h('span', { class: 'name' }, o.name), h('span', { class: 'tools' }, up, down));
    li.addEventListener('click', () => select(id));
    ul.append(li);
  });
  const bgLi = h('li', { class: 'layer' + (sel === 'background' ? ' sel' : ''), 'data-id': 'background' },
    h('span'), h('span', { class: 'name' }, 'Background (transparent)'), h('span'));
  bgLi.addEventListener('click', () => select('background'));
  ul.append(bgLi);
}
function moveLayer(id, dir) {
  const i = state.order.indexOf(id), j = i + dir;
  if (j < 0 || j >= state.order.length) return;
  [state.order[i], state.order[j]] = [state.order[j], state.order[i]];
  pushHistory(); renderLayers(); requestRender();
}
function select(id) {
  sel = id;
  renderLayers(); renderPanel(); requestRender();
}

function renderPanel() {
  const box = $('#props');
  const keep = box.scrollTop;
  refreshers = [];
  box.innerHTML = '';
  if (sel === 'background') panelInfo(box);
  else {
    const o = cur();
    if (o.type === 'cover') panelCover(box, o);
    else if (o.type === 'text') panelText(box, o, sel);
    else panelLogo(box, o);
  }
  box.scrollTop = keep;
}

/* ---------- Shared: position / rotation / opacity ---------- */
/* Every change goes through tryChange so a text can't be pushed onto another layer or off the canvas,
   and the position, size and rotation sliders stick to the grid, guides and other layers. */
function transformGroup(o, { xKey, yKey, xLabel = 'Position X', yLabel = 'Position Y' }) {
  const id = sel, guard = fn => v => tryChange(id, () => fn(v));
  return group('Position',
    slider({ label: xLabel, min: -500, max: W + 500, step: 1, get: () => o[xKey], set: guard(v => { o[xKey] = v; }), snap: v => snapPos(id, xKey, v, 'x') }),
    slider({ label: yLabel, min: -500, max: H + 500, step: 1, get: () => o[yKey], set: guard(v => { o[yKey] = v; }), snap: v => snapPos(id, yKey, v, 'y') }),
    slider({ label: 'Rotation', min: -180, max: 180, step: 1, get: () => o.rot, set: guard(v => { o.rot = v; }), snap: snapRot }),
    slider({ label: 'Opacity', min: 0, max: 100, step: 1, get: () => Math.round(o.opacity * 100), set: v => o.opacity = clamp(v, 0, 100) / 100 })
  );
}

/* ---------- Cover panel ---------- */
function panelCover(box, o) {
  box.append(
    group('Album cover',
      h('div', { class: 'row-btns' },
        button('Presets', 'image', openPresets, 'primary wide'),
        button('Upload PNG', 'upload', () => $('#coverFile').click(), 'wide')),
      h('p', { class: 'note' }, 'You can also drag an image onto the preview or paste one with Ctrl+V.'),
      slider({ label: 'Size', min: 300, max: 5000, step: 1, get: () => o.size, set: v => tryChange(sel, () => { o.size = Math.max(50, v); }), snap: v => snapSize(sel, v, x => { o.size = x; }, o.size) }),
      slider({ label: 'Corner round', min: 0, max: 50, step: 0.5, digits: 1, get: () => o.radius * 100, set: v => o.radius = clamp(v, 0, 50) / 100 })
    ),
    transformGroup(o, { xKey: 'cx', yKey: 'cy', xLabel: 'Center X', yLabel: 'Center Y' }),
    group('Image inside the frame',
      slider({ label: 'Zoom', min: 1, max: 4, step: 0.01, digits: 2, get: () => o.zoom, set: v => o.zoom = Math.max(0.2, v) }),
      slider({ label: 'Shift left/right', min: -60, max: 60, step: 0.5, digits: 1, get: () => o.panX * 100, set: v => o.panX = v / 100 }),
      slider({ label: 'Shift up/down', min: -60, max: 60, step: 0.5, digits: 1, get: () => o.panY * 100, set: v => o.panY = v / 100 }),
      button('Reset image position', 'reset', () => { o.zoom = 1; o.panX = 0; o.panY = 0; changed(); }, 'small')
    ),
    groupWithSwitch('Border', toggleField({ label: 'Border', get: () => o.border.on, set: v => o.border.on = v }),
      ...(o.border.on ? [
        slider({ label: 'Width', min: 2, max: 200, step: 1, get: () => o.border.width, set: v => o.border.width = Math.max(1, v) }),
        colorField({ label: 'Color', get: () => o.border.color, set: v => o.border.color = v })
      ] : [])),
    groupWithSwitch('Shadow', toggleField({ label: 'Shadow', get: () => o.shadow.on, set: v => o.shadow.on = v }),
      ...(o.shadow.on ? [
        colorField({ label: 'Color', get: () => o.shadow.color, set: v => o.shadow.color = v }),
        slider({ label: 'Opacity', min: 0, max: 100, step: 1, get: () => Math.round(o.shadow.opacity * 100), set: v => o.shadow.opacity = clamp(v, 0, 100) / 100 }),
        slider({ label: 'Distance X', min: -600, max: 600, step: 1, get: () => Math.round(o.shadow.x * o.size), set: v => o.shadow.x = v / o.size }),
        slider({ label: 'Distance Y', min: -600, max: 600, step: 1, get: () => Math.round(o.shadow.y * o.size), set: v => o.shadow.y = v / o.size }),
        slider({ label: 'Softness', min: 0, max: 400, step: 1, get: () => o.shadow.blur, set: v => o.shadow.blur = Math.max(0, v) }),
        slider({ label: 'Shadow size', min: 80, max: 120, step: 0.5, digits: 1, get: () => o.shadow.scale * 100, set: v => o.shadow.scale = v / 100 })
      ] : []))
  );
}

/* ---------- Text panel ---------- */
function panelText(box, o, id) {
  const isCustom = id.startsWith('text');
  const ta = h('textarea', { rows: 3, 'aria-label': 'Text' });
  ta.value = o.text;
  ta.addEventListener('input', () => { o.text = ta.value; fitText(id); changed(); });

  const fontOpts = allFonts().map(f => [f.name, f.name + (f.note ? ` (${f.note})` : '')]);
  if (!allFonts().some(f => f.name === o.font)) fontOpts.push([o.font, o.font + ' (not loaded)']);
  const info = fontInfo(o.font);
  const weightOpts = info.weights.map(w => [w, `${WEIGHT_NAMES[w] || w} (${w})`]);

  box.append(
    group('Text',
      h('div', { class: 'field stack' }, ta),
      switchRow('Keep in place', { label: 'Keep this text clear of other layers and inside the canvas', get: () => o.keep !== false, set: v => { o.keep = v; if (v) settleText(id); }, rebuild: true }),
      h('p', { class: 'note' }, o.keep !== false
        ? 'Long text shrinks to fit instead of covering the cover, logo or other text. You can still move, rotate and resize it, but it stops at other layers and at the canvas edge.'
        : 'Free mode: this text can go anywhere, including over other layers.'),
      o.keep !== false && o.size < o.want - 0.5 ? h('p', { class: 'note' }, `Shrunk to ${Math.round(o.size)} px so it fits. Your chosen size is ${Math.round(o.want)} px.`) : null,
      segField({ label: 'Align', stack: true, options: [['left', icon('alignL'), 'Align left'], ['center', icon('alignC'), 'Align center'], ['right', icon('alignR'), 'Align right']], get: () => o.align, set: v => { setAlign(o, v); fitText(id); } })
    ),
    group('Font',
      selectField({
        label: 'Typeface', options: fontOpts, rebuild: true, get: () => o.font,
        set: v => { o.font = v; const ws = fontInfo(v).weights; if (!ws.includes(o.weight)) o.weight = ws.reduce((a, b) => Math.abs(b - o.weight) < Math.abs(a - o.weight) ? b : a); fitText(id); ensureFont(o).then(() => { fitText(id); requestRender(); }); }
      }),
      weightOpts.length > 1 ? selectField({ label: 'Weight', options: weightOpts, get: () => o.weight, set: v => { o.weight = parseInt(v, 10); fitText(id); ensureFont(o).then(() => { fitText(id); requestRender(); }); } }) : null,
      h('div', { class: 'field stack' },
        h('div', { class: 'seg' },
          toggleButton('<i>Italic</i>', () => o.italic, v => { o.italic = v; fitText(id); ensureFont(o).then(() => { fitText(id); requestRender(); }); }),
          toggleButton('UPPERCASE', () => o.caps, v => { o.caps = v; fitText(id); }),
          button('Use my own font', 'upload', () => $('#fontFile').click(), 'small'))),
      slider({ label: 'Size', min: 20, max: 900, step: 1, get: () => o.size, set: v => { o.want = Math.max(8, v); fitText(id); }, snap: v => snapSize(id, v, x => { o.size = x; }, o.size) }),
      slider({ label: 'Line height', min: 0.6, max: 2, step: 0.01, digits: 2, get: () => o.lh, set: v => { o.lh = v; fitText(id); } }),
      slider({ label: 'Letter spacing', min: -100, max: 500, step: 1, get: () => o.ls, set: v => { o.ls = v; fitText(id); } })
    ),
    group('Color',
      segField({ label: 'Fill', options: [['solid', 'Solid'], ['gradient', 'Gradient']], get: () => o.fill, set: v => o.fill = v, rebuild: true }),
      colorField({ label: o.fill === 'gradient' ? 'Color 1' : 'Color', get: () => o.color, set: v => o.color = v }),
      ...(o.fill === 'gradient' ? [
        colorField({ label: 'Color 2', get: () => o.color2, set: v => o.color2 = v }),
        slider({ label: 'Angle', min: -180, max: 180, step: 1, get: () => o.gradAngle, set: v => o.gradAngle = v })
      ] : [])
    ),
    transformGroup(o, { xKey: 'x', yKey: 'y', xLabel: 'Position X', yLabel: 'Baseline Y' }),
    groupWithSwitch('Outline', toggleField({ label: 'Outline', get: () => o.stroke.on, set: v => o.stroke.on = v }),
      ...(o.stroke.on ? [
        slider({ label: 'Thickness', min: 1, max: 120, step: 1, get: () => o.stroke.width, set: v => o.stroke.width = Math.max(0, v) }),
        colorField({ label: 'Color', get: () => o.stroke.color, set: v => o.stroke.color = v })
      ] : [])),
    groupWithSwitch('Shadow', toggleField({ label: 'Shadow', get: () => o.shadow.on, set: v => o.shadow.on = v }),
      ...(o.shadow.on ? [
        colorField({ label: 'Color', get: () => o.shadow.color, set: v => o.shadow.color = v }),
        slider({ label: 'Opacity', min: 0, max: 100, step: 1, get: () => Math.round(o.shadow.opacity * 100), set: v => o.shadow.opacity = clamp(v, 0, 100) / 100 }),
        slider({ label: 'Softness', min: 0, max: 200, step: 1, get: () => o.shadow.blur, set: v => o.shadow.blur = Math.max(0, v) }),
        slider({ label: 'Distance X', min: -150, max: 150, step: 1, get: () => o.shadow.x, set: v => o.shadow.x = v }),
        slider({ label: 'Distance Y', min: -150, max: 150, step: 1, get: () => o.shadow.y, set: v => o.shadow.y = v })
      ] : [])),
    group('',
      h('div', { class: 'row-btns' },
        button('Back to original position', 'reset', () => { resetTextPlacement(id); pushHistory(); renderPanel(); requestRender(); }, 'wide'),
        isCustom
          ? button('Delete this text', 'trash', () => deleteText(id), 'danger wide')
          : button('Reset this text', 'reset', () => resetObject(id), 'wide')))
  );
}
function setAlign(o, v) {
  // keep the text where it is on screen when the alignment changes
  const L = layoutText(o);
  o.align = v;
  o.x = v === 'left' ? L.left : v === 'center' ? L.left + L.w / 2 : L.left + L.w;
}

/* ---------- Logo panel ---------- */
function panelLogo(box, o) {
  box.append(
    group('Channel logo',
      slider({ label: 'Size', min: 5, max: 400, step: 1, get: () => Math.round(o.scale * 100), set: v => tryChange(sel, () => { o.scale = Math.max(0.02, v / 100); }), snap: v => snapSize(sel, v, x => { o.scale = x / 100; }, o.scale * 100) }),
      switchRow('Recolor', { label: 'Recolor logo', get: () => o.tintOn, set: v => o.tintOn = v }),
      ...(o.tintOn ? [colorField({ label: 'Color', get: () => o.tint, set: v => o.tint = v })] : [])
    ),
    transformGroup(o, { xKey: 'cx', yKey: 'cy', xLabel: 'Center X', yLabel: 'Center Y' }),
    group('', h('div', { class: 'row-btns' }, button('Reset logo', 'reset', () => resetObject('logo'), 'wide')))
  );
}

/* ---------- Background info (the background is always transparent) ---------- */
function panelInfo(box) {
  box.append(
    group('Transparent background',
      h('p', { class: 'note' }, 'The thumbnail has no background of its own. Your download is a PNG with a transparent background, so you can place it over any video frame or design.'),
      h('p', { class: 'note' }, 'The checkerboard in the preview only stands for transparency. It is not part of the file.')),
    group('Placing things correctly',
      h('p', { class: 'note' }, 'The amber dashed template lines show where the PSD template puts the text edge, text baselines, cover edges and logo. Layers snap to them, so dragging close to a line lines everything up.'),
      h('p', { class: 'note' }, 'Texts stay clear of other layers and inside the canvas. Use Back to original position in a text layer if you ever want to restore its template spot.'))
  );
}

/* ---------- Object helpers ---------- */
function resetObject(id) {
  const d = clone(JSON.parse(TEMPLATE).objects[id]);
  if (!d) return;
  if (id === 'cover') d.imgId = state.objects.cover.imgId;   // keep the chosen image
  state.objects[id] = d;
  pushHistory(); ensureFont(d).then(requestRender); renderPanel(); requestRender();
}
function addText() {
  const id = 'text' + state.nextText++;
  state.objects[id] = textObj({ name: 'Extra text ' + (state.nextText - 1), text: 'New text', size: 200, x: 2187, y: 560, align: 'right' });
  state.order.push(id);
  placeText(id);                         // find a free spot that doesn't touch any other layer
  pushHistory(); select(id);
}
function deleteText(id) {
  delete state.objects[id];
  state.order = state.order.filter(x => x !== id);
  sel = 'cover';
  pushHistory(); renderLayers(); renderPanel(); requestRender();
}

/* =====================================================================
   Grid, rulers and snapping settings panel
   ===================================================================== */
let gridRefreshers = [];
function syncToolbar() {
  $('#gridBtn').setAttribute('aria-pressed', String(view.grid));
  $('#snapBtn').setAttribute('aria-pressed', String(view.snapGrid));
  $('#rulerBtn').setAttribute('aria-pressed', String(view.rulers));
}
function viewChanged() {
  saveView(); syncToolbar(); rulerKey = '';
  requestRender();
  gridRefreshers.forEach(f => f());
}
const QUICK_GRIDS = [[3, 3, '3×3'], [4, 4, '4×4'], [6, 6, '6×6'], [8, 8, '8×8'], [12, 12, '12×12'], [16, 9, '16×9']];

function buildGridPanel() {
  const box = $('#gridPanel');
  box.innerHTML = ''; gridRefreshers = [];
  withUI({ reg: () => gridRefreshers, fire: viewChanged, rebuild: buildGridPanel }, () => {
    const readout = h('p', { class: 'note' });
    gridRefreshers.push(() => {
      const g = gridLines();
      readout.textContent = view.gridMode === 'divisions'
        ? `${Math.round(view.cols)} columns by ${Math.round(view.rows)} rows. Each cell is ${Math.round(gridStep('x'))} by ${Math.round(gridStep('y'))} px.`
        : `Square cells of ${Math.round(view.cell)} px, ${g.xs.length - 1} columns by ${g.ys.length - 1} rows, centered on the canvas.`;
    });
    const head = h('div', { class: 'gp-head' }, h('h2', {}, 'Grid, rulers and snapping'),
      h('button', { type: 'button', class: 'mini-btn', 'aria-label': 'Close', html: icon('close'), onclick: closeGridPanel }));

    const quick = segField({
      label: 'Quick grids', stack: true,
      options: QUICK_GRIDS.map(([c, r, t]) => [t, t, `${t} grid`]),
      get: () => (view.gridMode === 'divisions' ? (QUICK_GRIDS.find(([c, r]) => c === Math.round(view.cols) && r === Math.round(view.rows)) || [0, 0, ''])[2] : ''),
      set: t => { const q = QUICK_GRIDS.find(x => x[2] === t); view.gridMode = 'divisions'; view.cols = q[0]; view.rows = q[1]; view.grid = true; },
      rebuild: true
    });

    box.append(head,
      group('Layout',
        quick,
        segField({ label: 'Type', options: [['divisions', 'Equal divisions'], ['square', 'Square cells']], get: () => view.gridMode, set: v => { view.gridMode = v; }, rebuild: true }),
        ...(view.gridMode === 'divisions' ? [
          slider({ label: 'Columns', min: 1, max: 48, step: 1, get: () => view.cols, set: v => view.cols = clamp(Math.round(v), 1, 200) }),
          slider({ label: 'Rows', min: 1, max: 48, step: 1, get: () => view.rows, set: v => view.rows = clamp(Math.round(v), 1, 200) })
        ] : [
          slider({ label: 'Cell size', min: 20, max: 1000, step: 1, get: () => view.cell, set: v => view.cell = clamp(Math.round(v), 20, 5000) })
        ]),
        slider({ label: 'Margin', min: 0, max: 600, step: 1, get: () => view.margin, set: v => view.margin = clamp(Math.round(v), 0, 1200) }),
        readout
      ),
      group('Snapping',
        switchRow('Snap to grid', { label: 'Snap to grid', get: () => view.snapGrid, set: v => { view.snapGrid = v; if (v) view.grid = true; }, rebuild: false }),
        switchRow('Smart guides', { label: 'Snap to other layers, text baselines, canvas edges and your guides', get: () => view.smart, set: v => view.smart = v, rebuild: false }),
        slider({ label: 'Snap distance', min: 2, max: 40, step: 1, get: () => view.snapPx, set: v => view.snapPx = clamp(Math.round(v), 1, 80) }),
        h('p', { class: 'note' }, 'Edges, centers and text baselines stick to grid lines, other layers, the canvas and your guides. Hold Alt while dragging to turn snapping off.')
      ),
      group('Show',
        switchRow('Grid', { label: 'Show grid', get: () => view.grid, set: v => view.grid = v, rebuild: false }),
        switchRow('Rulers', { label: 'Show rulers', get: () => view.rulers, set: v => view.rulers = v, rebuild: false }),
        switchRow('Center lines', { label: 'Show center lines', get: () => view.center, set: v => view.center = v, rebuild: false }),
        switchRow('Template lines', { label: 'Show the PSD template alignment lines (text edge, baselines, cover edges)', get: () => view.template, set: v => view.template = v, rebuild: false }),
        switchRow('YouTube badge area', { label: 'Show the area YouTube covers with the video length', get: () => view.ytZone, set: v => view.ytZone = v, rebuild: false })
      ),
      group('Grid look',
        colorField({ label: 'Color', get: () => view.gridColor, set: v => view.gridColor = v }),
        slider({ label: 'Opacity', min: 5, max: 100, step: 1, get: () => Math.round(view.gridOpacity * 100), set: v => view.gridOpacity = clamp(v, 1, 100) / 100 }),
        slider({ label: 'Line thickness', min: 0.5, max: 4, step: 0.5, digits: 1, get: () => view.gridWidth, set: v => view.gridWidth = clamp(v, 0.5, 8) })
      ),
      h('div', { class: 'row-btns gp-foot' },
        button('Clear guides', 'trash', () => { state.guides = { v: [], h: [] }; pushHistory(); requestRender(); }, 'small'),
        button('Reset grid settings', 'reset', () => { Object.assign(view, VIEW_DEFAULTS); viewChanged(); buildGridPanel(); }, 'small'))
    );
  });
  gridRefreshers.forEach(f => f());
}
function openGridPanel() {
  buildGridPanel();
  $('#gridPanel').hidden = false;
  $('#gridSettingsBtn').setAttribute('aria-expanded', 'true');
}
function closeGridPanel() {
  $('#gridPanel').hidden = true;
  $('#gridSettingsBtn').setAttribute('aria-expanded', 'false');
}
function toggleGridPanel() { $('#gridPanel').hidden ? openGridPanel() : closeGridPanel(); }

/* =====================================================================
   Canvas interaction
   ===================================================================== */
function ptr(e) {
  const r = stage.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
function hitObj(p) {
  for (let i = state.order.length - 1; i >= 0; i--) {
    const o = obj(state.order[i]);
    if (!o.visible) continue;
    const b = boxOf(o), l = toLocal(b, p);
    if (Math.abs(l.x) <= b.w / 2 && Math.abs(l.y) <= b.h / 2) return state.order[i];
  }
  return null;
}
function handleAt(p) {
  const o = cur(); if (!o || !o.visible) return null;
  const b = boxOf(o), l = toLocal(b, p), u = unit(), r = 13 * u;
  if (Math.hypot(l.x, l.y + b.h / 2 + ROT_OFFSET * u) < r) return { kind: 'rotate' };
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    if (Math.hypot(l.x - sx * b.w / 2, l.y - sy * b.h / 2) < r) return { kind: 'scale', sx, sy };
  }
  return null;
}
function guideAt(p) {
  const r = 6 * unit();
  for (let i = 0; i < state.guides.v.length; i++) if (Math.abs(p.x - state.guides.v[i]) < r) return { axis: 'v', i };
  for (let i = 0; i < state.guides.h.length; i++) if (Math.abs(p.y - state.guides.h[i]) < r) return { axis: 'h', i };
  return null;
}

/* ---------- Snapping ---------- */
function snapMove(o, start, b0, tx, ty, thr) {
  const cand = snapCandidates(sel);
  const ab = aabb(b0, tx, ty);
  const fx = [ab.minx, tx, ab.maxx], fy = [ab.miny, ty, ab.maxy];
  const baseCount = o.type === 'text' && o.rot === 0 ? textLines(o).length : 0;
  const baseline = i => start.y + (ty - b0.cy) + i * start.lh * start.size;
  for (let i = 0; i < baseCount; i++) fy.push(baseline(i));
  const dx = bestSnap(fx, cand.xs, thr), dy = bestSnap(fy, cand.ys, thr);
  const guides = [], seen = new Set();
  const collect = (axis, feats, cands, d) => {
    if (d === null) return;
    feats.forEach(f => cands.forEach(c => {
      if (Math.abs(c - (f + d)) < 0.6 && !seen.has(axis + Math.round(c))) { seen.add(axis + Math.round(c)); guides.push({ axis, pos: c }); }
    }));
  };
  collect('v', fx, cand.xs, dx); collect('h', fy, cand.ys, dy);
  return { dx: dx || 0, dy: dy || 0, guides };
}
function snapGridPos(axis, pos, ev) {
  if (!view.snapGrid || (ev && ev.altKey)) return pos;
  const g = gridLines(), thr = view.snapPx * unit(), arr = axis === 'v' ? g.xs : g.ys;
  const d = bestSnap([pos], arr, thr);
  return d === null ? pos : pos + d;
}

/* ---------- Pointer handling ---------- */
let drag = null;
stage.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const p = ptr(e);
  let hd = sel !== 'background' ? handleAt(p) : null;
  if (!hd) {
    const g = guideAt(p);
    if (g) {
      stage.setPointerCapture(e.pointerId);
      drag = { kind: 'guide', axis: g.axis, i: g.i };
      e.preventDefault(); return;
    }
    const id = hitObj(p);
    if (!id) { if (sel !== 'background') select('background'); return; }
    if (id !== sel) select(id);
    hd = { kind: 'move' };
  }
  const o = cur();
  stage.setPointerCapture(e.pointerId);
  drag = { kind: hd.kind, sx: hd.sx, sy: hd.sy, id: sel, p0: p, start: clone(o), box0: boxOf(o), enforce: placementValid(sel), okK: 1 };
  e.preventDefault();
});

const coordsEl = $('#coords');
function setCoords(p) {
  coordsEl.innerHTML = p ? `X ${Math.round(p.x)}&nbsp;&nbsp;Y ${Math.round(p.y)}` : 'X –&nbsp;&nbsp;Y –';
}
stage.addEventListener('pointermove', e => {
  const p = ptr(e);
  mouse = p; setCoords(p);
  if (!drag) {
    const hd = sel !== 'background' ? handleAt(p) : null;
    const g = !hd && guideAt(p);
    if (hd) stage.style.cursor = hd.kind === 'rotate' ? 'grab' : ((hd.sx * hd.sy > 0) ? 'nwse-resize' : 'nesw-resize');
    else if (g) stage.style.cursor = g.axis === 'v' ? 'col-resize' : 'row-resize';
    else stage.style.cursor = hitObj(p) ? 'move' : 'default';
    requestRender();
    return;
  }
  const u = unit();
  if (drag.kind === 'guide') {
    const pos = snapGridPos(drag.axis, drag.axis === 'v' ? p.x : p.y, e);
    state.guides[drag.axis][drag.i] = Math.round(pos);
    requestRender(); return;
  }
  const o = obj(drag.id), st = drag.start, b0 = drag.box0;
  dragGuides = [];
  if (drag.kind === 'move') {
    let tx = b0.cx + (p.x - drag.p0.x), ty = b0.cy + (p.y - drag.p0.y);
    if (!e.altKey) {
      const sn = snapMove(o, st, b0, tx, ty, snapThreshold());
      tx += sn.dx; ty += sn.dy; dragGuides = sn.guides;
    }
    const dx = tx - b0.cx, dy = ty - b0.cy;
    const kx = o.type === 'text' ? 'x' : 'cx', ky = o.type === 'text' ? 'y' : 'cy';
    if (!drag.enforce) { o[kx] = st[kx] + dx; o[ky] = st[ky] + dy; }
    else {
      // slide along obstacles: try each axis on its own and keep whichever is allowed
      const px = o[kx], py = o[ky];
      o[kx] = st[kx] + dx; if (!placementValid(drag.id)) o[kx] = px;
      o[ky] = st[ky] + dy; if (!placementValid(drag.id)) o[ky] = py;
    }
  } else if (drag.kind === 'scale') {
    // Resize from the dot you grabbed: the opposite corner stays where it is.
    const sx = drag.sx, sy = drag.sy;
    const aL = { x: -sx * b0.w / 2, y: -sy * b0.h / 2 }, cL = { x: sx * b0.w / 2, y: sy * b0.h / 2 };   // anchor and dragged corner, in the box's own space
    const dvx = cL.x - aL.x, dvy = cL.y - aL.y, len2 = dvx * dvx + dvy * dvy || 1;
    const pl = toLocal(b0, p);
    let k = clamp(((pl.x - aL.x) * dvx + (pl.y - aL.y) * dvy) / len2, 0.05, 25);
    if (!e.altKey && b0.rot === 0) {
      // snap the dragged corner to the grid, guides, template lines and other layers
      const A = toWorld(b0, aL.x, aL.y), C = toWorld(b0, cL.x, cL.y), cand = snapCandidates(drag.id), thr = snapThreshold();
      let best = null;
      const consider = (axis, lines) => {
        const a0 = axis === 'x' ? A.x : A.y, c0 = axis === 'x' ? C.x : C.y, span = c0 - a0;
        if (Math.abs(span) < 1) return;
        const cur2 = a0 + span * k;
        for (const g of lines) {
          const d = Math.abs(g - cur2), kk = (g - a0) / span;
          if (d < thr && kk > 0.05 && kk < 25 && (!best || d < best.d)) best = { d, k: kk, guide: { axis: axis === 'x' ? 'v' : 'h', pos: g } };
        }
      };
      consider('x', cand.xs); consider('y', cand.ys);
      if (best) { k = best.k; dragGuides = [best.guide]; }
    }
    const applyK = kk => {
      const cn = { x: aL.x + (cL.x - aL.x) * kk / 2, y: aL.y + (cL.y - aL.y) * kk / 2 };   // new center, still in the old box's space
      const cw = toWorld(b0, cn.x, cn.y);
      if (o.type === 'cover') { o.size = clamp(st.size * kk, 80, 20000); o.cx = cw.x; o.cy = cw.y; }
      else if (o.type === 'logo') { o.scale = clamp(st.scale * kk, 0.02, 20); o.cx = cw.x; o.cy = cw.y; }
      else {
        o.x = st.x; o.y = st.y;
        o.size = clamp(st.size * kk, 8, 4000);
        const b1 = layoutText(o);
        o.x += cw.x - b1.cx; o.y += cw.y - b1.cy;
        o.stroke.width = st.stroke.width * kk;
        o.shadow.blur = st.shadow.blur * kk; o.shadow.x = st.shadow.x * kk; o.shadow.y = st.shadow.y * kk;
      }
    };
    applyK(k);
    if (drag.enforce) {
      if (placementValid(drag.id)) drag.okK = k;
      else {
        // stop growing at the first obstacle
        let lo = drag.okK, hi = k;
        if (hi > lo) { for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; applyK(mid); if (placementValid(drag.id)) lo = mid; else hi = mid; } }
        applyK(lo); drag.okK = lo;
      }
    }
  } else if (drag.kind === 'rotate') {
    let a = deg(Math.atan2(p.y - b0.cy, p.x - b0.cx)) + 90;
    a = ((a + 540) % 360) - 180;
    if (e.shiftKey) a = Math.round(a / 15) * 15;
    else if (view.snapGrid && !e.altKey) { const r = Math.round(a / 15) * 15; if (Math.abs(a - r) < 4) a = r; }
    else for (const t of [0, 90, -90, 180, -180]) if (Math.abs(a - t) < 3) a = t;
    const prev = o.rot;
    o.rot = Math.round(a * 10) / 10;
    if (drag.enforce && !placementValid(drag.id)) o.rot = prev;      // can't rotate into another layer or off the canvas
  }
  refreshAll();
  requestRender();
});
stage.addEventListener('pointerleave', () => { if (!drag) { mouse = null; setCoords(null); requestRender(); } });
function endDrag() {
  if (!drag) return;
  if (drag.kind === 'guide') {
    const arr = state.guides[drag.axis], v = arr[drag.i], lim = drag.axis === 'v' ? W : H;
    if (v <= 0 || v >= lim) arr.splice(drag.i, 1);     // dragged off the canvas: remove it
  }
  if (drag.kind === 'scale') { const o = obj(drag.id); if (o && o.type === 'text') o.want = o.size; }
  drag = null; dragGuides = [];
  pushHistory(); requestRender();
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);

/* pull guides out of the rulers: top ruler makes horizontal lines, left ruler vertical ones */
function startRulerDrag(axis, e) {
  if (e.button !== 0) return;
  e.preventDefault();
  const el = e.currentTarget;
  el.setPointerCapture(e.pointerId);
  const move = ev => {
    const p = ptr(ev);
    liveGuide = { axis, pos: snapGridPos(axis, axis === 'v' ? p.x : p.y, ev) };
    mouse = p; setCoords(p); requestRender();
  };
  const up = () => {
    el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
    const g = liveGuide; liveGuide = null;
    if (g && g.pos > 0 && g.pos < (axis === 'v' ? W : H)) { state.guides[axis].push(Math.round(g.pos)); pushHistory(); }
    requestRender();
  };
  el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  move(e);
}
rulerH.addEventListener('pointerdown', e => startRulerDrag('h', e));
rulerV.addEventListener('pointerdown', e => startRulerDrag('v', e));

/* ---------- Keyboard ---------- */
document.addEventListener('keydown', e => {
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  const typing = /INPUT|TEXTAREA|SELECT/.test(tag) && document.activeElement.type !== 'range' && document.activeElement.type !== 'checkbox';
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); return; }
  if (e.key === 'Escape') {
    if (!$('#presetModal').hidden) { closePresets(); return; }
    if (!$('#gridPanel').hidden) { closeGridPanel(); return; }
  }
  if (typing || mod || tag === 'SELECT') return;
  if (!e.shiftKey && !e.altKey) {
    const k = e.key.toLowerCase();
    if (k === 'g') { view.grid = !view.grid; viewChanged(); return; }
    if (k === 's') { view.snapGrid = !view.snapGrid; if (view.snapGrid) view.grid = true; viewChanged(); return; }
    if (k === 'r') { view.rulers = !view.rulers; viewChanged(); return; }
  }
  const o = cur();
  if (!o) return;
  const gridMove = view.snapGrid && view.grid;
  const stepX = e.shiftKey ? (gridMove ? gridStep('x') : 10) : 1, stepY = e.shiftKey ? (gridMove ? gridStep('y') : 10) : 1;
  const mv = { ArrowLeft: [-stepX, 0], ArrowRight: [stepX, 0], ArrowUp: [0, -stepY], ArrowDown: [0, stepY] }[e.key];
  if (mv && document.activeElement.type !== 'range') {
    e.preventDefault();
    tryChange(sel, () => { if (o.type === 'text') { o.x += mv[0]; o.y += mv[1]; } else { o.cx += mv[0]; o.cy += mv[1]; } });
    changed();
  } else if ((e.key === 'Delete' || e.key === 'Backspace') && sel.startsWith('text')) {
    e.preventDefault(); deleteText(sel);
  }
});

/* =====================================================================
   Images: presets, uploads, drag and drop, paste
   ===================================================================== */
async function setCoverFromSrc(src, id) {
  try {
    const rid = await registerImage(src, id);
    const o = obj('cover');
    o.imgId = rid; o.zoom = 1; o.panX = 0; o.panY = 0;
    pushHistory(); requestRender();
    if (sel === 'background') renderPanel(); else refreshAll();
    return true;
  } catch (e) { toast('That image could not be opened. Try a PNG or JPG file.', true); return false; }
}
async function handleCoverFile(file) {
  if (!file || !/^image\//.test(file.type)) { toast('Please choose an image file (PNG works best).', true); return; }
  const src = await readFileAsDataURL(file);
  if (await setCoverFromSrc(src)) { select('cover'); toast('Album cover updated.'); }
}
$('#coverFile').addEventListener('change', e => { handleCoverFile(e.target.files[0]); e.target.value = ''; closePresets(); });
$('#fontFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  const o = cur();
  if (!f || !o || o.type !== 'text') return;
  try {
    const name = 'Custom ' + f.name.replace(/\.[^.]+$/, '').replace(/[^\w ]+/g, ' ').trim();
    const face = new FontFace(name, await f.arrayBuffer(), { weight: '100 900' });
    await face.load(); document.fonts.add(face);
    if (!customFonts.find(c => c.name === name)) customFonts.push({ name, weights: [400, 700] });
    o.font = name; if (![400, 700].includes(o.weight)) o.weight = 700;
    pushHistory(); renderPanel(); requestRender();
    toast(`Font loaded: ${name.replace('Custom ', '')}. Custom fonts last until you reload the page.`);
  } catch (err) { toast('That font file could not be loaded.', true); }
});

const wrap = $('#canvasWrap');
['dragenter', 'dragover'].forEach(t => wrap.addEventListener(t, e => { if ([...(e.dataTransfer.types || [])].includes('Files')) { e.preventDefault(); wrap.classList.add('dragging'); } }));
['dragleave', 'drop'].forEach(t => wrap.addEventListener(t, e => { if (t === 'dragleave' && wrap.contains(e.relatedTarget)) return; wrap.classList.remove('dragging'); }));
wrap.addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCoverFile(f); });
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());
document.addEventListener('paste', e => {
  const typing = /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '');
  if (typing) return;
  const item = [...(e.clipboardData ? e.clipboardData.items : [])].find(i => i.type.startsWith('image/'));
  if (item) { e.preventDefault(); handleCoverFile(item.getAsFile()); }
});

/* Preset gallery */
function buildPresetGrid() {
  const g = $('#presetGrid'); g.innerHTML = '';
  const up = h('button', { class: 'preset upload', type: 'button' },
    h('div', { class: 'thumb', html: `<div>${icon('upload')}Upload your own PNG</div>` }), h('span', { class: 'label' }, 'From your computer'));
  up.addEventListener('click', () => $('#coverFile').click());
  g.append(up);
  PRESETS.forEach(p => {
    const b = h('button', { class: 'preset', type: 'button' },
      h('div', { class: 'thumb' }, h('img', { src: p.src, alt: '', loading: 'lazy' })), h('span', { class: 'label' }, p.name));
    b.addEventListener('click', async () => { if (await setCoverFromSrc(p.src, presetId(p))) { select('cover'); closePresets(); } });
    g.append(b);
  });
}
let lastFocus = null;
function openPresets() { lastFocus = document.activeElement; $('#presetModal').hidden = false; const f = $('#presetGrid .preset'); f && f.focus(); }
function closePresets() { const m = $('#presetModal'); if (m.hidden) return; m.hidden = true; lastFocus && lastFocus.focus && lastFocus.focus(); }
$('#presetModal').addEventListener('click', e => { if (e.target.closest('[data-close]')) closePresets(); });

/* =====================================================================
   Export, projects, toolbar
   ===================================================================== */
let toastTimer = 0;
function toast(msg, isErr) {
  const t = $('#toast');
  t.textContent = msg; t.classList.toggle('err', !!isErr); t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), isErr ? 6500 : 3200);
}
async function ensureAllFonts() {
  await Promise.all(Object.values(state.objects).filter(o => o.type === 'text').map(ensureFont));
}
const canvasToBlob = (c, type, q) => new Promise(res => c.toBlob(res, type, q));
function download(blob, name) {
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const slug = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

async function exportImage() {
  const w = parseInt($('#expSize').value, 10);
  const btn = $('#downloadBtn');
  btn.disabled = true; toast('Rendering your thumbnail...');
  exporting = true;
  try {
    await ensureAllFonts();
    const s = w / W, c = document.createElement('canvas');
    c.width = w; c.height = Math.round(H * s);
    renderScene(c.getContext('2d'), s, {});          // transparent background, so the PNG keeps its alpha channel
    const blob = await canvasToBlob(c, 'image/png');
    if (!blob) throw new Error('blocked');
    download(blob, `KanyevaUnreleasder-${slug(obj('track').text) || 'thumbnail'}-${c.width}x${c.height}.png`);
    toast(`Saved a ${(blob.size / 1048576).toFixed(2)} MB transparent PNG.` + (blob.size > YT_LIMIT ? ' If you upload it to YouTube directly, note that thumbnails must be under 2 MB.' : ''));
  } catch (err) {
    const local = location.protocol === 'file:';
    toast(local
      ? 'The browser blocked the export because the page was opened from a file. Open it through GitHub Pages or a local web server (see the README).'
      : 'The export failed. Try a smaller size or a different browser.', true);
  } finally {
    exporting = false; btn.disabled = false; requestRender();
  }
}

function saveProject() {
  const used = new Set();
  const addId = id => { if (id && images.has(id) && id !== 'logo') used.add(id); };
  addId(obj('cover').imgId);
  const imgs = {};
  used.forEach(id => { imgs[id] = images.get(id).src; });
  const blob = new Blob([JSON.stringify({ app: 'ku-thumbnail-generator', version: 3, state, images: imgs })], { type: 'application/json' });
  download(blob, `KanyevaUnreleasder-project-${slug(obj('track').text) || 'thumbnail'}.json`);
  toast('Project saved. Open it later with "Open project".');
}
async function openProject(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'ku-thumbnail-generator') throw new Error('bad');
    for (const [id, src] of Object.entries(data.images || {})) await registerImage(src, id);
    const st = data.state;
    delete st.bg;                                   // older projects had a background; it is transparent now
    if (!st.guides) st.guides = { v: [], h: [] };
    Object.values(st.objects).forEach(o => { if (o.type === 'text') { if (o.want == null) o.want = o.size; if (o.keep == null) o.keep = true; } });
    state = st;
    sel = 'cover';
    await ensureAllFonts();
    pushHistory(); renderLayers(); renderPanel(); requestRender();
    toast('Project opened.');
  } catch (e) { toast('That is not a project file from this generator.', true); }
}

/* toolbar wiring */
$('#undoBtn').innerHTML = icon('undo');
$('#redoBtn').innerHTML = icon('redo');
$('#gridBtn').innerHTML = label('grid', 'Grid');
$('#snapBtn').innerHTML = label('magnet', 'Snap');
$('#rulerBtn').innerHTML = label('ruler', 'Rulers');
$('#gridSettingsBtn').innerHTML = label('sliders', 'Grid settings');
$('#resetBtn').innerHTML = label('reset', 'Reset');
$('#saveProject').innerHTML = label('save', 'Save project');
$('#openProject').innerHTML = label('folder', 'Open project');
$('#downloadBtn').innerHTML = label('download', 'Download thumbnail');
$('#addTextBtn').innerHTML = label('plus', 'Add text');
document.querySelectorAll('.dialog-head [data-close]').forEach(b => b.innerHTML = icon('close'));

$('#undoBtn').addEventListener('click', undo);
$('#redoBtn').addEventListener('click', redo);
$('#gridBtn').addEventListener('click', () => { view.grid = !view.grid; viewChanged(); });
$('#snapBtn').addEventListener('click', () => { view.snapGrid = !view.snapGrid; if (view.snapGrid) view.grid = true; viewChanged(); });
$('#rulerBtn').addEventListener('click', () => { view.rulers = !view.rulers; viewChanged(); });
$('#gridSettingsBtn').addEventListener('click', toggleGridPanel);
document.addEventListener('pointerdown', e => {
  const gp = $('#gridPanel');
  if (!gp.hidden && !gp.contains(e.target) && !$('#gridSettingsBtn').contains(e.target)) closeGridPanel();
});
$('#resetBtn').addEventListener('click', () => {
  if (!confirm('Reset everything back to the template? You can still undo this.')) return;
  state = JSON.parse(TEMPLATE); sel = 'cover';
  pushHistory(); renderLayers(); renderPanel(); requestRender();
});
$('#addTextBtn').addEventListener('click', addText);
$('#downloadBtn').addEventListener('click', exportImage);
$('#saveProject').addEventListener('click', saveProject);
$('#openProject').addEventListener('click', () => $('#projectFile').click());
$('#projectFile').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) openProject(f); });
window.addEventListener('resize', () => { rulerKey = ''; requestRender(); });

/* =====================================================================
   Start
   ===================================================================== */
(async function init() {
  buildPresetGrid();
  const fontOk = await mainFontAvailable();
  try { await registerImage('assets/logo.png', 'logo'); } catch (e) { /* logo missing, ignore */ }
  if (PRESETS[0]) { try { await registerImage(PRESETS[0].src, DEFAULT_COVER_ID); } catch (e) { /* ignore */ } }

  // build the calibrated template once, then work from copies of it
  const st = makeDefaultState();
  if (!images.has(st.objects.cover.imgId)) st.objects.cover.imgId = null;
  await Promise.all(Object.values(st.objects).filter(o => o.type === 'text').map(ensureFont));
  calibrateState(st);
  buildTemplateLines(st);
  TEMPLATE = JSON.stringify(st);

  state = JSON.parse(TEMPLATE);
  pushHistory();
  syncToolbar(); setCoords(null);
  renderLayers(); renderPanel(); renderPreview();
  requestRender();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { rulerKey = ''; requestRender(); });
  if (!fontOk) toast('Helvetica Rounded Bold could not be loaded. Check that the file is at assets/Helvetica Rounded Bold/Helvetica Rounded Bold.otf (the name is case sensitive).', true);
  window.__ku = { get state() { return state; }, view, placementValid, fitText, render: renderScene, W, H, ensureAllFonts, exportImage, gridLines, templateLines: () => templateLines };  // handy for debugging
})();

})();
