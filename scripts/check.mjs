// check.mjs — the rules in DESIGN.md §10 and §12, enforced instead of remembered.
//
//   node scripts/check.mjs        (npm run check)
//
// Fails when:
//   1. a contrast floor is missed, in either theme;
//   2. the two dark blocks (media query and [data-theme]) disagree — CSS makes
//      us write them twice, so this is the check that keeps them one list;
//   3. the forced-dark preview panel has drifted from the dark tokens;
//   4. a hex literal appears outside the token files.
//
// No dependencies on purpose: the package has none, and a check that needs an
// install is a check that stops being run.

import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const failures = [];
const fail = (msg) => failures.push(msg);

// ── A CSS reader just big enough for these files ─────────────────────────────
// Returns [{ selector, decls: Map }], with @media preludes joined onto the
// selector, e.g. "@media (prefers-color-scheme: dark) > :root:not(...)".
function blocks(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  (function walk(text, prefix) {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf('{', i);
      if (open < 0) break;
      const selector = text.slice(i, open).trim().replace(/\s+/g, ' ');
      let depth = 1, j = open + 1;
      while (depth && j < text.length) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        j++;
      }
      const body = text.slice(open + 1, j - 1);
      const path = prefix ? `${prefix} > ${selector}` : selector;
      if (selector.startsWith('@media')) walk(body, path);
      else {
        const decls = new Map();
        for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) decls.set(m[1], m[2].trim());
        out.push({ selector: path, decls });
      }
      i = j;
    }
  })(css, '');
  return out;
}

const norm = (v) => v.replace(/\s+/g, '').replace(/(^|[^\d])0\./g, '$1.').toLowerCase();

const files = ['tokens.css', 'tokens.chart.css'].map((f) => [f, blocks(read(f))]);
const MEDIA_DARK = "@media (prefers-color-scheme: dark) > :root:not([data-theme='light'])";
const ATTR_DARK = ":root[data-theme='dark']";

const light = new Map();
const mediaDark = new Map();
const attrDark = new Map();
for (const [, bs] of files) {
  for (const { selector, decls } of bs) {
    const target = { ':root': light, [MEDIA_DARK]: mediaDark, [ATTR_DARK]: attrDark }[selector];
    if (target) for (const [k, v] of decls) target.set(k, v);
  }
}
const dark = new Map([...light, ...attrDark]);

// ── 2. The two dark blocks are one list ──────────────────────────────────────
for (const k of new Set([...mediaDark.keys(), ...attrDark.keys()])) {
  if (!mediaDark.has(k)) fail(`dark parity: ${k} is in [data-theme='dark'] but not the media query`);
  else if (!attrDark.has(k)) fail(`dark parity: ${k} is in the media query but not [data-theme='dark']`);
  else if (norm(mediaDark.get(k)) !== norm(attrDark.get(k)))
    fail(`dark parity: ${k} is ${mediaDark.get(k)} in the media query, ${attrDark.get(k)} under [data-theme]`);
}

// ── 3. The preview's forced-dark panel matches the dark tokens ───────────────
const panel = blocks(read('previews/_preview.css')).find((b) => b.selector === '.panel.dark');
if (!panel) fail('previews/_preview.css: no .panel.dark block found');
else
  for (const [k, v] of panel.decls)
    if (!dark.has(k)) fail(`preview drift: .panel.dark sets ${k}, which tokens.css doesn't declare`);
    else if (norm(dark.get(k)) !== norm(v)) fail(`preview drift: .panel.dark ${k} is ${v}, tokens.css dark is ${dark.get(k)}`);

// ── Colour maths ─────────────────────────────────────────────────────────────
function hex(h) {
  h = h.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
const toHex = (rgb) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

// Resolves a token to { rgb, alpha }. Handles hex, var() and the one
// color-mix form the tokens use: color-mix(in srgb, X N%, transparent).
function resolve(value, map, seen = new Set()) {
  value = value.trim();
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  if (ref) {
    if (seen.has(ref[1]) || !map.has(ref[1])) throw new Error(`cannot resolve ${ref[1]}`);
    return resolve(map.get(ref[1]), map, new Set([...seen, ref[1]]));
  }
  if (/^#[0-9a-f]{3,6}$/i.test(value)) return { rgb: hex(value), alpha: 1 };
  const mix = value.match(/^color-mix\(in srgb,\s*(.+?)\s+([\d.]+)%,\s*transparent\)$/);
  if (mix) {
    const c = resolve(mix[1], map, seen);
    return { rgb: c.rgb, alpha: c.alpha * (+mix[2] / 100) };
  }
  throw new Error(`unsupported colour value: ${value}`);
}
const over = (fg, bg) => fg.rgb.map((c, i) => c * fg.alpha + bg[i] * (1 - fg.alpha));
const lum = (rgb) =>
  rgb
    .map((c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// ── 1. Contrast floors ───────────────────────────────────────────────────────
// [foreground, background, floor]. A translucent background (a wash) is laid
// over --card first, which is where washes sit.
const TEXT = 4.5, MARK = 3;
const floors = [];
for (const fg of ['--ink', '--ink-soft', '--slate', '--i-ink', '--success-ink', '--attention-ink', '--danger-ink'])
  for (const bg of ['--card', '--bg']) floors.push([fg, bg, TEXT]);
floors.push(['--slate', '--line-soft', TEXT]); // the Idea pill
for (const bg of ['--i', '--i-hover', '--i-pressed']) floors.push(['--on-i', bg, TEXT]);
for (const s of ['success', 'attention', 'danger']) floors.push([`--${s}-ink`, `--${s}-surface`, TEXT]);
floors.push(['--i-ink', '--i-surface', TEXT]);
for (const fg of ['--i', '--success', '--attention', '--danger', '--line-control'])
  for (const bg of ['--card', '--bg']) floors.push([fg, bg, MARK]);
// Chart series: light slots 3–5 are exempt by the relief rule in tokens.chart.css.
for (let n = 1; n <= 8; n++) floors.push([`--chart-${n}`, '--chart-surface', MARK, n >= 3 && n <= 5 ? 'dark' : null]);

let checked = 0;
for (const [theme, map] of [['light', light], ['dark', dark]]) {
  const card = resolve('var(--card)', map).rgb;
  for (const [fg, bg, floor, only] of floors) {
    if (only && only !== theme) continue;
    try {
      const b = resolve(`var(${bg})`, map);
      const bgRgb = b.alpha < 1 ? over(b, card) : b.rgb;
      const f = resolve(`var(${fg})`, map);
      const fgRgb = f.alpha < 1 ? over(f, bgRgb) : f.rgb;
      const r = ratio(fgRgb, bgRgb);
      checked++;
      if (r < floor) fail(`contrast (${theme}): ${fg} on ${bg} is ${r.toFixed(2)}:1 (${toHex(fgRgb)} on ${toHex(bgRgb)}), needs ${floor}:1`);
    } catch (e) {
      fail(`contrast (${theme}): ${fg} on ${bg}: ${e.message}`);
    }
  }
}

// ── 4. No hex outside the token files ────────────────────────────────────────
// The .panel.dark block is the one sanctioned copy, and check 3 holds it to
// tokens.css. `&#8212;` is an entity, not a colour.
const HEX = /(?<![&\w])#[0-9a-f]{3,8}\b/gi;
const scan = (file, text) => {
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(HEX)) fail(`hardcoded hex: ${file}:${i + 1} ${m[0]}`);
  });
};
scan('tailwind.css', read('tailwind.css').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, '')));
scan('previews/_preview.css', read('previews/_preview.css').replace(/\.panel\.dark\s*\{[^}]*\}/, (b) => b.replace(/[^\n]/g, '')));
for (const f of readdirSync(new URL('previews/', root)).filter((f) => f.endsWith('.html')))
  scan(`previews/${f}`, read(`previews/${f}`));

if (failures.length) {
  console.error(failures.map((f) => `✕ ${f}`).join('\n'));
  console.error(`\n${failures.length} problem${failures.length === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log(`✓ ${checked} contrast pairs, dark parity, preview drift, no stray hex`);
