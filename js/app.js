/* KanyevaUnreleasder Thumbnail Generator, beta 0.1
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
const FILTER_OK = (typeof CanvasRenderingContext2D !== 'undefined') && ('filter' in CanvasRenderingContext2D.prototype) && !window.__KU_NO_FILTER;

const $ = (s, root = document) => root.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
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
  grid: '<path d="M12 3v18M3 12h18"/><rect x="3" y="3" width="18" height="18" rx="2"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  alignL: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
  alignC: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
  alignR: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
  type: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>'
};
function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}
function label(iconName, text) { return `${iconName ? icon(iconName) : ''}${text ? `<span>${text}</span>` : ''}`; }

/* =====================================================================
   Fonts
   ===================================================================== */
const FONTS = [
  { name: 'Arimo', note: 'template default', weights: [400, 700] },
  { name: 'Inter', weights: [300, 400, 500, 600, 700, 800, 900] },
  { name: 'Montserrat', weights: [400, 500, 600, 700, 800, 900] },
  { name: 'Poppins', weights: [400, 500, 600, 700, 800, 900] },
  { name: 'Roboto', weights: [400, 500, 700, 900] },
  { name: 'Raleway', weights: [400, 500, 600, 700, 800, 900] },
  { name: 'Space Grotesk', weights: [400, 500, 600, 700] },
  { name: 'Oswald', weights: [400, 500, 600, 700] },
  { name: 'Anton', weights: [400] },
  { name: 'Bebas Neue', weights: [400] },
  { name: 'Archivo Black', weights: [400] },
  { name: 'Russo One', weights: [400] },
  { name: 'Righteous', weights: [400] },
  { name: 'Bangers', weights: [400] },
  { name: 'Permanent Marker', weights: [400] },
  { name: 'Pacifico', weights: [400] },
  { name: 'Playfair Display', weights: [400, 500, 600, 700, 800, 900] }
];
const customFonts = [];
const allFonts = () => FONTS.concat(customFonts);
const fontInfo = name => allFonts().find(f => f.name === name) || { name, weights: [400, 700] };
const WEIGHT_NAMES = { 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra bold', 900: 'Black' };

function fontString(o, size = o.size) {
  return `${o.italic ? 'italic ' : ''}${o.weight} ${size}px "${o.font}", Arial, Helvetica, sans-serif`;
}
async function ensureFont(o) {
  try { await document.fonts.load(fontString(o, 100), 'Aa'); } catch (e) { /* ignore, fall back */ }
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
  let draw = img, w = img.naturalWidth, h = img.naturalHeight;
  const MAX = 3600;
  if (Math.max(w, h) > MAX) {
    const k = MAX / Math.max(w, h);
    const c = document.createElement('canvas');
    c.width = Math.round(w * k); c.height = Math.round(h * k);
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, c.width, c.height);
    draw = c; w = c.width; h = c.height;
  }
  images.set(id, { src, img: draw, w, h });
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
  return Object.assign({
    type: 'text', name: 'Text', visible: true,
    text: 'Text', font: 'Arimo', weight: 700, italic: false, caps: false,
    size: 160, color: '#ffffff', fill: 'solid', color2: '#ffb524', gradAngle: 90,
    align: 'right', x: 2168, y: 2050, lh: 1, ls: 0, rot: 0, opacity: 1,
    stroke: { on: false, width: 14, color: '#000000' },
    shadow: { on: false, color: '#000000', opacity: 0.55, blur: 30, x: 14, y: 14 }
  }, extra);
}

/* Geometry measured from the PSD:
   cover  = rounded square 2586px at (2314,120), corner radius 200px
   shadow = black 45%, shifted right/down, 99% of the cover size
   texts  = right-aligned Arial/Helvetica Bold, white
   logo   = 1532 x 257 white logo at bottom left */
function makeDefaultState() {
  return {
    nextText: 1,
    bg: { mode: 'gradient', color: '#16181f', color2: '#3a2a52', angle: 135, imgId: null, zoom: 1, blur: 80, dim: 0.35 },
    order: ['cover', 'albumTitle', 'artist', 'track', 'logo'],
    objects: {
      cover: {
        type: 'cover', name: 'Album cover', visible: true,
        cx: 3607, cy: 1413, size: 2586, rot: 0, opacity: 1, radius: 0.0773,
        imgId: DEFAULT_COVER_ID, zoom: 1, panX: 0, panY: 0,
        border: { on: false, width: 24, color: '#ffffff' },
        shadow: { on: true, color: '#000000', opacity: 0.45, x: 0.01875, y: 0.0199, scale: 0.99, blur: 0 }
      },
      albumTitle: textObj({ name: 'Album title', text: 'Album Title Here', size: 160, x: 2168, y: 2048, ls: 16 }),
      artist: textObj({ name: 'Artist name', text: 'Artist Name Here', size: 185, x: 2168, y: 1833, ls: 18 }),
      track: textObj({ name: 'Track title', text: 'Track Title\nHere', size: 422, x: 2201, y: 1168 }),
      logo: { type: 'logo', name: 'Channel logo', visible: true, cx: 827, cy: 2640, scale: 1, rot: 0, opacity: 1, tintOn: false, tint: '#ffffff' }
    }
  };
}

let state = null;
let sel = 'cover';                     // selected layer id or 'background'
let showGuides = false;
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
function rrPath(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
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

function drawImageCover(ctx, reg, boxW, boxH, cx, cy, zoom) {
  const base = Math.max(boxW / reg.w, boxH / reg.h) * zoom;
  const dw = reg.w * base, dh = reg.h * base;
  ctx.drawImage(reg.img, cx - dw / 2, cy - dh / 2, dw, dh);
}

/* Cheap blur for browsers without ctx.filter: shrink then grow in steps */
function softBlurDraw(ctx, reg, s, blurPx, zoom) {
  const f = clamp(blurPx / 5, 1, 70);
  const tw = Math.max(8, Math.round(W * s / f)), th = Math.max(8, Math.round(H * s / f));
  let c = document.createElement('canvas'); c.width = tw; c.height = th;
  let x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
  const base = Math.max(tw / reg.w, th / reg.h) * zoom * 1.12;
  x.drawImage(reg.img, tw / 2 - reg.w * base / 2, th / 2 - reg.h * base / 2, reg.w * base, reg.h * base);
  while (c.width < W * s) {
    const n = document.createElement('canvas');
    n.width = Math.min(Math.round(c.width * 2), Math.round(W * s)); n.height = Math.min(Math.round(c.height * 2), Math.round(H * s));
    const nx = n.getContext('2d'); nx.imageSmoothingEnabled = true; nx.imageSmoothingQuality = 'high';
    nx.drawImage(c, 0, 0, n.width, n.height); c = n;
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(c, 0, 0, W * s, H * s);
  ctx.restore();
}

function drawBackgroundRaw(ctx, s, exportFill) {
  const b = state.bg;
  if (b.mode === 'transparent') {
    if (exportFill) { ctx.fillStyle = exportFill; ctx.fillRect(0, 0, W, H); }
    return;
  }
  if (b.mode === 'solid') { ctx.fillStyle = b.color; ctx.fillRect(0, 0, W, H); return; }
  if (b.mode === 'gradient') {
    const a = rad(b.angle), dx = Math.cos(a), dy = Math.sin(a);
    const half = Math.abs(W / 2 * dx) + Math.abs(H / 2 * dy);
    const g = ctx.createLinearGradient(W / 2 - dx * half, H / 2 - dy * half, W / 2 + dx * half, H / 2 + dy * half);
    g.addColorStop(0, b.color); g.addColorStop(1, b.color2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); return;
  }
  // image or blurred cover
  let reg = null, blur = 0;
  if (b.mode === 'image') reg = images.get(b.imgId);
  if (b.mode === 'blur') { reg = images.get(obj('cover').imgId); blur = b.blur; }
  ctx.fillStyle = '#101117'; ctx.fillRect(0, 0, W, H);
  if (reg) {
    if (blur > 0 && !FILTER_OK) softBlurDraw(ctx, reg, s, blur, b.zoom);
    else if (blur > 0) {
      ctx.save();
      ctx.filter = `blur(${blur * s}px)`;
      drawImageCover(ctx, reg, W, H, W / 2, H / 2, b.zoom * (1 + blur * 4 / Math.min(W, H)));
      ctx.restore();
    } else drawImageCover(ctx, reg, W, H, W / 2, H / 2, b.zoom);
  }
  if (b.dim > 0) { ctx.fillStyle = rgba('#000000', b.dim); ctx.fillRect(0, 0, W, H); }
}

let bgCache = { key: '', canvas: null };
function backgroundKey() {
  const b = state.bg;
  let k = JSON.stringify(b);
  if (b.mode === 'blur') { const c = obj('cover'); k += c.imgId; }
  return k;
}
function drawBackground(ctx, s, opts) {
  if (opts.preview) {
    const k = backgroundKey();
    if (bgCache.key !== k || !bgCache.canvas) {
      const c = bgCache.canvas || document.createElement('canvas');
      c.width = Math.round(W * s); c.height = Math.round(H * s);
      const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height);
      x.save(); x.setTransform(s, 0, 0, s, 0, 0); drawBackgroundRaw(x, s, null); x.restore();
      bgCache = { key: k, canvas: c };
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bgCache.canvas, 0, 0); ctx.restore();
  } else {
    drawBackgroundRaw(ctx, s, opts.exportFill);
  }
}

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
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W * s, H * s);
  ctx.restore();
  drawBackground(ctx, s, opts);
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

/* ---------- Selection overlay (preview only) ---------- */
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

let dragGuides = [];
function drawOverlay() {
  const u = unit();
  sctx.save();
  sctx.setTransform(PS, 0, 0, PS, 0, 0);

  if (showGuides) {
    sctx.save();
    sctx.strokeStyle = 'rgba(255,255,255,.55)'; sctx.lineWidth = 1.5 * u; sctx.setLineDash([10 * u, 8 * u]);
    sctx.beginPath(); sctx.moveTo(W / 2, 0); sctx.lineTo(W / 2, H); sctx.moveTo(0, H / 2); sctx.lineTo(W, H / 2); sctx.stroke();
    sctx.setLineDash([]);
    // area covered by the YouTube video-length badge (about 10% x 7% in the bottom right)
    const zw = W * 0.105, zh = H * 0.075, zx = W - zw - W * 0.006, zy = H - zh - H * 0.012;
    sctx.fillStyle = 'rgba(255,60,60,.28)'; sctx.strokeStyle = 'rgba(255,90,90,.9)'; sctx.lineWidth = 2 * u;
    sctx.fillRect(zx, zy, zw, zh); sctx.strokeRect(zx, zy, zw, zh);
    sctx.fillStyle = '#fff'; sctx.font = `700 ${12 * u}px DM Sans, Arial, sans-serif`; sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
    sctx.fillText('video length', zx + zw / 2, zy + zh / 2);
    sctx.restore();
  }

  if (dragGuides.length) {
    sctx.save(); sctx.strokeStyle = '#ff4fa3'; sctx.lineWidth = 2 * u;
    sctx.beginPath();
    if (dragGuides.includes('v')) { sctx.moveTo(W / 2, 0); sctx.lineTo(W / 2, H); }
    if (dragGuides.includes('h')) { sctx.moveTo(0, H / 2); sctx.lineTo(W, H / 2); }
    sctx.stroke(); sctx.restore();
  }

  const o = cur();
  if (o && o.visible && !exporting) {
    const b = boxOf(o);
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => toWorld(b, sx * b.w / 2, sy * b.h / 2));
    sctx.lineWidth = 2 * u; sctx.strokeStyle = '#2ea8ff';
    sctx.beginPath(); pts.forEach((p, i) => i ? sctx.lineTo(p.x, p.y) : sctx.moveTo(p.x, p.y)); sctx.closePath(); sctx.stroke();
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

let exporting = false, rafId = 0;
function renderPreview() {
  rafId = 0;
  renderScene(sctx, PS, { preview: true });
  drawOverlay();
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
   Inspector (layers list + property panel)
   ===================================================================== */
let refreshers = [];
function changed() {
  requestRender();
  schedulePush();
  refreshers.forEach(f => f());
}
function refreshAll() { refreshers.forEach(f => f()); }

function field(labelText, ...ctl) { return h('div', { class: 'field' }, h('label', {}, labelText), h('div', {}, ...ctl)); }

function slider({ label: lab, min, max, step = 1, digits = 0, get, set }) {
  const range = h('input', { type: 'range', min, max, step });
  const num = h('input', { type: 'number', class: 'num', step });
  const refresh = () => {
    const v = get();
    range.value = v;
    if (document.activeElement !== num) num.value = Number(v).toFixed(digits);
  };
  range.addEventListener('input', () => { set(parseFloat(range.value)); changed(); });
  num.addEventListener('input', () => { const v = parseFloat(num.value); if (!isNaN(v)) { set(v); changed(); } });
  num.addEventListener('blur', refresh);
  refreshers.push(refresh); refresh();
  return h('div', { class: 'field' }, h('label', {}, lab), h('div', { class: 'slider' }, range, num));
}

function colorField({ label: lab, get, set }) {
  const input = h('input', { type: 'color' });
  const hex = h('span', { class: 'hex' });
  const refresh = () => { input.value = get(); hex.textContent = get(); };
  input.addEventListener('input', () => { set(input.value); changed(); });
  refreshers.push(refresh); refresh();
  return h('div', { class: 'field' }, h('label', {}, lab), h('div', { class: 'color' }, input, hex));
}

function selectField({ label: lab, options, get, set, rebuild = false }) {
  const sel2 = h('select', {}, options.map(([v, t]) => h('option', { value: v }, t)));
  const refresh = () => { sel2.value = String(get()); };
  sel2.addEventListener('change', () => { set(sel2.value); changed(); if (rebuild) renderPanel(); });
  refreshers.push(refresh); refresh();
  return h('div', { class: 'field' }, h('label', {}, lab), h('div', {}, sel2));
}

function segField({ label: lab, options, get, set, rebuild = false, stack = false }) {
  const wrap = h('div', { class: 'seg', role: 'group', 'aria-label': lab });
  const btns = options.map(([v, content, title]) => {
    const b = h('button', { type: 'button', title: title || '', 'aria-label': title || String(v), html: content });
    b.addEventListener('click', () => { set(v); changed(); if (rebuild) renderPanel(); });
    wrap.append(b); return [v, b];
  });
  const refresh = () => btns.forEach(([v, b]) => b.setAttribute('aria-pressed', String(get() === v)));
  refreshers.push(refresh); refresh();
  return h('div', { class: 'field' + (stack ? ' stack' : '') }, stack ? null : h('label', {}, lab), wrap);
}

function toggleField({ label: lab, get, set, rebuild = true }) {
  const input = h('input', { type: 'checkbox', role: 'switch' });
  const refresh = () => { input.checked = !!get(); };
  input.addEventListener('change', () => { set(input.checked); changed(); if (rebuild) renderPanel(); });
  refreshers.push(refresh); refresh();
  return h('label', { class: 'switch', title: lab }, input, h('span'));
}

function group(title, ...kids) { return h('section', { class: 'group' }, title ? h('h3', {}, title) : null, ...kids); }
function groupWithSwitch(title, sw, ...kids) {
  return h('section', { class: 'group' }, h('h3', {}, h('span', { class: 'grow' }, title), sw), ...kids);
}
function button(text, iconName, onclick, cls = '') { return h('button', { type: 'button', class: 'btn ' + cls, html: label(iconName, text), onclick }); }

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
    h('span'), h('span', { class: 'name' }, 'Background'), h('span'));
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
  if (sel === 'background') panelBackground(box);
  else {
    const o = cur();
    if (o.type === 'cover') panelCover(box, o);
    else if (o.type === 'text') panelText(box, o, sel);
    else panelLogo(box, o);
  }
  box.scrollTop = keep;
}

/* ---------- Shared: position / rotation / opacity ---------- */
function transformGroup(o, { xKey, yKey, xLabel = 'Position X', yLabel = 'Position Y' }) {
  return group('Position',
    slider({ label: xLabel, min: -500, max: W + 500, step: 1, get: () => o[xKey], set: v => o[xKey] = v }),
    slider({ label: yLabel, min: -500, max: H + 500, step: 1, get: () => o[yKey], set: v => o[yKey] = v }),
    slider({ label: 'Rotation', min: -180, max: 180, step: 1, get: () => o.rot, set: v => o.rot = v }),
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
      slider({ label: 'Size', min: 300, max: 5000, step: 1, get: () => o.size, set: v => o.size = Math.max(50, v) }),
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
  ta.addEventListener('input', () => { o.text = ta.value; changed(); });

  const fontOpts = allFonts().map(f => [f.name, f.name + (f.note ? ` (${f.note})` : '')]);
  const info = fontInfo(o.font);
  const weightOpts = info.weights.map(w => [w, `${WEIGHT_NAMES[w] || w} (${w})`]);

  box.append(
    group('Text',
      h('div', { class: 'field stack' }, ta),
      segField({ label: 'Align', stack: true, options: [['left', icon('alignL'), 'Align left'], ['center', icon('alignC'), 'Align center'], ['right', icon('alignR'), 'Align right']], get: () => o.align, set: v => setAlign(o, v) })
    ),
    group('Font',
      selectField({
        label: 'Typeface', options: fontOpts, rebuild: true, get: () => o.font,
        set: v => { o.font = v; const ws = fontInfo(v).weights; if (!ws.includes(o.weight)) o.weight = ws.reduce((a, b) => Math.abs(b - o.weight) < Math.abs(a - o.weight) ? b : a); ensureFont(o).then(requestRender); }
      }),
      selectField({ label: 'Weight', options: weightOpts, get: () => o.weight, set: v => { o.weight = parseInt(v, 10); ensureFont(o).then(requestRender); } }),
      h('div', { class: 'field stack' },
        h('div', { class: 'seg' },
          (() => { const b = h('button', { type: 'button', html: '<i>Italic</i>' }); b.addEventListener('click', () => { o.italic = !o.italic; ensureFont(o).then(requestRender); changed(); }); refreshers.push(() => b.setAttribute('aria-pressed', String(o.italic))); b.setAttribute('aria-pressed', String(o.italic)); return b; })(),
          (() => { const b = h('button', { type: 'button', html: 'UPPERCASE' }); b.addEventListener('click', () => { o.caps = !o.caps; changed(); }); refreshers.push(() => b.setAttribute('aria-pressed', String(o.caps))); b.setAttribute('aria-pressed', String(o.caps)); return b; })(),
          button('Use my own font', 'upload', () => $('#fontFile').click(), 'small'))),
      slider({ label: 'Size', min: 20, max: 900, step: 1, get: () => o.size, set: v => resizeText(o, Math.max(8, v)) }),
      slider({ label: 'Line height', min: 0.6, max: 2, step: 0.01, digits: 2, get: () => o.lh, set: v => o.lh = v }),
      slider({ label: 'Letter spacing', min: -100, max: 500, step: 1, get: () => o.ls, set: v => o.ls = v })
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
function resizeText(o, size) {
  const b0 = layoutText(o);
  const k = size / o.size;
  o.size = size;
  const b1 = layoutText(o);
  o.x += b0.cx - b1.cx; o.y += b0.cy - b1.cy;
  return k;
}

/* ---------- Logo panel ---------- */
function panelLogo(box, o) {
  box.append(
    group('Channel logo',
      slider({ label: 'Size', min: 5, max: 400, step: 1, get: () => Math.round(o.scale * 100), set: v => o.scale = Math.max(0.02, v / 100) }),
      h('div', { class: 'field' }, h('label', {}, 'Recolor'), h('div', {}, toggleField({ label: 'Recolor logo', get: () => o.tintOn, set: v => o.tintOn = v }))),
      ...(o.tintOn ? [colorField({ label: 'Color', get: () => o.tint, set: v => o.tint = v })] : [])
    ),
    transformGroup(o, { xKey: 'cx', yKey: 'cy', xLabel: 'Center X', yLabel: 'Center Y' }),
    group('', h('div', { class: 'row-btns' }, button('Reset logo', 'reset', () => resetObject('logo'), 'wide')))
  );
}

/* ---------- Background panel ---------- */
function panelBackground(box) {
  const b = state.bg;
  const modes = [['transparent', 'Transparent'], ['solid', 'Solid'], ['gradient', 'Gradient'], ['image', 'Image'], ['blur', 'Blurred cover']];
  const parts = [
    segField({ label: 'Type', stack: true, options: modes, get: () => b.mode, set: v => { b.mode = v; }, rebuild: true })
  ];
  if (b.mode === 'transparent') parts.push(h('p', { class: 'note' }, 'Exports as a transparent PNG. JPG exports use a dark fill instead, since the text is white.'));
  if (b.mode === 'solid') parts.push(colorField({ label: 'Color', get: () => b.color, set: v => b.color = v }));
  if (b.mode === 'gradient') parts.push(
    colorField({ label: 'Color 1', get: () => b.color, set: v => b.color = v }),
    colorField({ label: 'Color 2', get: () => b.color2, set: v => b.color2 = v }),
    slider({ label: 'Angle', min: -180, max: 180, step: 1, get: () => b.angle, set: v => b.angle = v })
  );
  if (b.mode === 'image') parts.push(
    h('div', { class: 'row-btns' }, button(b.imgId ? 'Change background image' : 'Upload background image', 'upload', () => $('#bgFile').click(), 'wide')),
    slider({ label: 'Zoom', min: 1, max: 4, step: 0.01, digits: 2, get: () => b.zoom, set: v => b.zoom = Math.max(1, v) }),
    slider({ label: 'Darken', min: 0, max: 90, step: 1, get: () => Math.round(b.dim * 100), set: v => b.dim = clamp(v, 0, 100) / 100 })
  );
  if (b.mode === 'blur') parts.push(
    h('p', { class: 'note' }, 'Uses your album cover, stretched and blurred behind everything.'),
    slider({ label: 'Blur', min: 0, max: 250, step: 1, get: () => b.blur, set: v => b.blur = Math.max(0, v) }),
    slider({ label: 'Zoom', min: 1, max: 3, step: 0.01, digits: 2, get: () => b.zoom, set: v => b.zoom = Math.max(1, v) }),
    slider({ label: 'Darken', min: 0, max: 90, step: 1, get: () => Math.round(b.dim * 100), set: v => b.dim = clamp(v, 0, 100) / 100 })
  );
  box.append(group('Background', ...parts));
}

/* ---------- Object helpers ---------- */
function resetObject(id) {
  const d = makeDefaultState().objects[id];
  if (!d) return;
  if (id === 'cover') d.imgId = state.objects.cover.imgId;   // keep the chosen image
  state.objects[id] = d;
  pushHistory(); ensureFont(d).then(requestRender); renderPanel(); requestRender();
}
function addText() {
  const id = 'text' + state.nextText++;
  state.objects[id] = textObj({ name: 'Extra text ' + (state.nextText - 1), text: 'New text', size: 220, x: 2500, y: 1400, align: 'center' });
  state.order.push(id);
  pushHistory(); select(id);
}
function deleteText(id) {
  delete state.objects[id];
  state.order = state.order.filter(x => x !== id);
  sel = 'cover';
  pushHistory(); renderLayers(); renderPanel(); requestRender();
}

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

let drag = null;
stage.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const p = ptr(e);
  let hd = sel !== 'background' ? handleAt(p) : null;
  if (!hd) {
    const id = hitObj(p);
    if (!id) { if (sel !== 'background') select('background'); return; }
    if (id !== sel) select(id);
    hd = { kind: 'move' };
  }
  const o = cur();
  stage.setPointerCapture(e.pointerId);
  drag = { kind: hd.kind, sx: hd.sx, sy: hd.sy, id: sel, p0: p, start: clone(o), box0: boxOf(o) };
  e.preventDefault();
});

stage.addEventListener('pointermove', e => {
  const p = ptr(e);
  if (!drag) {
    const hd = sel !== 'background' ? handleAt(p) : null;
    if (hd) stage.style.cursor = hd.kind === 'rotate' ? 'grab' : ((hd.sx * hd.sy > 0) ? 'nwse-resize' : 'nesw-resize');
    else stage.style.cursor = hitObj(p) ? 'move' : 'default';
    return;
  }
  const o = obj(drag.id), st = drag.start, b0 = drag.box0, u = unit();
  dragGuides = [];
  if (drag.kind === 'move') {
    let tx = b0.cx + (p.x - drag.p0.x), ty = b0.cy + (p.y - drag.p0.y);
    if (!e.altKey) {
      const thr = 9 * u;
      if (Math.abs(tx - W / 2) < thr) { tx = W / 2; dragGuides.push('v'); }
      if (Math.abs(ty - H / 2) < thr) { ty = H / 2; dragGuides.push('h'); }
    }
    const dx = tx - b0.cx, dy = ty - b0.cy;
    if (o.type === 'text') { o.x = st.x + dx; o.y = st.y + dy; } else { o.cx = st.cx + dx; o.cy = st.cy + dy; }
  } else if (drag.kind === 'scale') {
    const r0 = Math.hypot(drag.p0.x - b0.cx, drag.p0.y - b0.cy) || 1;
    const k = clamp(Math.hypot(p.x - b0.cx, p.y - b0.cy) / r0, 0.05, 25);
    if (o.type === 'cover') o.size = clamp(st.size * k, 80, 20000);
    else if (o.type === 'logo') o.scale = clamp(st.scale * k, 0.02, 20);
    else {
      o.x = st.x; o.y = st.y;
      o.size = clamp(st.size * k, 8, 4000);
      const b1 = layoutText(o);
      o.x += b0.cx - b1.cx; o.y += b0.cy - b1.cy;
      o.stroke.width = st.stroke.width * k;
      o.shadow.blur = st.shadow.blur * k; o.shadow.x = st.shadow.x * k; o.shadow.y = st.shadow.y * k;
    }
  } else if (drag.kind === 'rotate') {
    let a = deg(Math.atan2(p.y - b0.cy, p.x - b0.cx)) + 90;
    a = ((a + 540) % 360) - 180;
    if (e.shiftKey) a = Math.round(a / 15) * 15;
    else for (const t of [0, 90, -90, 180, -180]) if (Math.abs(a - t) < 3) a = t;
    o.rot = Math.round(a * 10) / 10;
  }
  refreshAll();
  requestRender();
});
function endDrag() {
  if (!drag) return;
  drag = null; dragGuides = [];
  pushHistory(); requestRender();
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);

/* keyboard */
document.addEventListener('keydown', e => {
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  const typing = /INPUT|TEXTAREA|SELECT/.test(tag) && document.activeElement.type !== 'range' && document.activeElement.type !== 'checkbox';
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); return; }
  if (e.key === 'Escape' && !$('#presetModal').hidden) { closePresets(); return; }
  if (typing || mod) return;
  const o = cur();
  if (!o) return;
  const step = e.shiftKey ? 20 : 1;
  const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (mv && tag !== 'SELECT' && document.activeElement.type !== 'range') {
    e.preventDefault();
    if (o.type === 'text') { o.x += mv[0]; o.y += mv[1]; } else { o.cx += mv[0]; o.cy += mv[1]; }
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
    pushHistory(); requestRender(); refreshAll();
    return true;
  } catch (e) { toast('That image could not be opened. Try a PNG or JPG file.', true); return false; }
}
async function handleCoverFile(file) {
  if (!file || !/^image\//.test(file.type)) { toast('Please choose an image file (PNG works best).', true); return; }
  const src = await readFileAsDataURL(file);
  if (await setCoverFromSrc(src)) { select('cover'); toast('Album cover updated.'); }
}
async function handleBgFile(file) {
  if (!file || !/^image\//.test(file.type)) { toast('Please choose an image file.', true); return; }
  try {
    const src = await readFileAsDataURL(file);
    state.bg.imgId = await registerImage(src);
    state.bg.mode = 'image';
    pushHistory(); renderPanel(); requestRender();
  } catch (e) { toast('That image could not be opened.', true); }
}
$('#coverFile').addEventListener('change', e => { handleCoverFile(e.target.files[0]); e.target.value = ''; closePresets(); });
$('#bgFile').addEventListener('change', e => { handleBgFile(e.target.files[0]); e.target.value = ''; });
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
  const w = parseInt($('#expSize').value, 10), fmt = $('#expFmt').value;
  const btn = $('#downloadBtn');
  btn.disabled = true; toast('Rendering your thumbnail...');
  exporting = true;
  try {
    await ensureAllFonts();
    const s = w / W, c = document.createElement('canvas');
    c.width = w; c.height = Math.round(H * s);
    const ctx = c.getContext('2d');
    renderScene(ctx, s, { exportFill: fmt === 'jpg' ? '#14161c' : null });
    if (fmt === 'jpg') {
      // JPG can't hold transparency, so put it on a solid base first
      const flat = document.createElement('canvas'); flat.width = c.width; flat.height = c.height;
      const fx = flat.getContext('2d'); fx.fillStyle = '#14161c'; fx.fillRect(0, 0, flat.width, flat.height); fx.drawImage(c, 0, 0);
      let q = 0.95, blob = await canvasToBlob(flat, 'image/jpeg', q);
      while (blob && blob.size > YT_LIMIT && w <= 1920 && q > 0.5) { q -= 0.05; blob = await canvasToBlob(flat, 'image/jpeg', q); }
      if (!blob) throw new Error('blocked');
      download(blob, `KanyevaUnreleasder-${slug(obj('track').text) || 'thumbnail'}-${c.width}x${c.height}.jpg`);
      toast(`Saved a ${(blob.size / 1048576).toFixed(2)} MB JPG.` + (blob.size > YT_LIMIT ? ' YouTube allows up to 2 MB, so pick a smaller size.' : ''));
    } else {
      const blob = await canvasToBlob(c, 'image/png');
      if (!blob) throw new Error('blocked');
      download(blob, `KanyevaUnreleasder-${slug(obj('track').text) || 'thumbnail'}-${c.width}x${c.height}.png`);
      toast(`Saved a ${(blob.size / 1048576).toFixed(2)} MB PNG.` + (blob.size > YT_LIMIT && w <= 1920 ? ' It is over YouTube\'s 2 MB limit, so try JPG.' : ''));
    }
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
  addId(state.bg.imgId); addId(obj('cover').imgId);
  const imgs = {};
  used.forEach(id => { imgs[id] = images.get(id).src; });
  const blob = new Blob([JSON.stringify({ app: 'ku-thumbnail-generator', version: 1, state, images: imgs })], { type: 'application/json' });
  download(blob, `KanyevaUnreleasder-project-${slug(obj('track').text) || 'thumbnail'}.json`);
  toast('Project saved. Open it later with "Open project".');
}
async function openProject(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'ku-thumbnail-generator') throw new Error('bad');
    for (const [id, src] of Object.entries(data.images || {})) await registerImage(src, id);
    state = data.state;
    sel = 'cover';
    await ensureAllFonts();
    pushHistory(); renderLayers(); renderPanel(); requestRender();
    toast('Project opened.');
  } catch (e) { toast('That is not a project file from this generator.', true); }
}

/* toolbar wiring */
$('#undoBtn').innerHTML = icon('undo');
$('#redoBtn').innerHTML = icon('redo');
$('#guidesBtn').innerHTML = label('grid', 'Guides');
$('#resetBtn').innerHTML = label('reset', 'Reset');
$('#saveProject').innerHTML = label('save', 'Save project');
$('#openProject').innerHTML = label('folder', 'Open project');
$('#downloadBtn').innerHTML = label('download', 'Download thumbnail');
$('#addTextBtn').innerHTML = label('plus', 'Add text');
document.querySelectorAll('.dialog-head [data-close]').forEach(b => b.innerHTML = icon('close'));

$('#undoBtn').addEventListener('click', undo);
$('#redoBtn').addEventListener('click', redo);
$('#guidesBtn').addEventListener('click', e => { showGuides = !showGuides; e.currentTarget.setAttribute('aria-pressed', String(showGuides)); requestRender(); });
$('#resetBtn').addEventListener('click', async () => {
  if (!confirm('Reset everything back to the template? You can still undo this.')) return;
  state = makeDefaultState(); sel = 'cover';
  pushHistory(); renderLayers(); renderPanel(); requestRender();
});
$('#addTextBtn').addEventListener('click', addText);
$('#downloadBtn').addEventListener('click', exportImage);
$('#saveProject').addEventListener('click', saveProject);
$('#openProject').addEventListener('click', () => $('#projectFile').click());
$('#projectFile').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) openProject(f); });
window.addEventListener('resize', requestRender);

/* =====================================================================
   Start
   ===================================================================== */
(async function init() {
  buildPresetGrid();
  try { await registerImage('assets/logo.png', 'logo'); } catch (e) { /* logo missing, ignore */ }
  if (PRESETS[0]) { try { await registerImage(PRESETS[0].src, DEFAULT_COVER_ID); } catch (e) { /* ignore */ } }
  state = makeDefaultState();
  if (!images.has(state.objects.cover.imgId)) state.objects.cover.imgId = null;
  pushHistory();
  renderLayers(); renderPanel(); renderPreview();
  await ensureAllFonts();
  requestRender();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestRender);
  window.__ku = { get state() { return state; }, render: renderScene, W, H, ensureAllFonts, exportImage };  // handy for debugging
})();

})();
