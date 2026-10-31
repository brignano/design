// check.mjs — the rules in DESIGN.md §10 and §12, enforced instead of remembered.
//
//   node scripts/check.mjs        (npm run check)
//
// Fails when:
//   1. a contrast floor is missed, in either theme;
//   2. a colour is declared anywhere but once, as light-dark(), on :root —
//      a theme block or a preview copy is a second list, and second lists drift;
//   3. a light-dark() or color-mix() argument is a var() (tokens.css rule 2),
//      or a value repeated to honour that rule has drifted from its source;
//   4. a colour family leaves its hue: the neutral ramp 286°, cobalt 256°;
//   5. a hex literal appears outside the token files (product-page.css and
//      the previews included).
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

// Calls of `fn(` in a value, as { start, end, args } with top-level args split.
function calls(value, fn) {
  const out = [];
  for (let i = value.indexOf(fn + '('); i >= 0; i = value.indexOf(fn + '(', i + 1)) {
    if (/[\w-]/.test(value[i - 1] ?? '')) continue;
    let depth = 0, from = i + fn.length + 1;
    const args = [];
    for (let j = from - 1; j < value.length; j++) {
      if (value[j] === '(') depth++;
      else if (value[j] === ')' && --depth === 0) {
        args.push(value.slice(from, j).trim());
        out.push({ start: i, end: j + 1, args });
        break;
      } else if (value[j] === ',' && depth === 1) {
        args.push(value.slice(from, j).trim());
        from = j + 1;
      }
    }
  }
  return out;
}
// One theme's side of a value: every light-dark(a, b) replaced by a or b.
function side(value, i) {
  const [c] = calls(value, 'light-dark');
  return c ? side(value.slice(0, c.start) + c.args[i] + value.slice(c.end), i) : value;
}

const tokens = new Map();
for (const f of ['tokens.css', 'tokens.chart.css'])
  for (const { selector, decls } of blocks(read(f)))
    for (const [k, v] of decls) {
      if (selector === ':root') tokens.set(k, v);
      // .tier-marketing re-declares type and rhythm, never colour.
      else if (selector !== '.tier-marketing' || /light-dark|#|rgb|color-mix/.test(v))
        fail(`one list: ${f} declares ${k} under \`${selector}\`; colours live once, on :root, as light-dark()`);
    }
const light = new Map([...tokens].map(([k, v]) => [k, side(v, 0)]));
const dark = new Map([...tokens].map(([k, v]) => [k, side(v, 1)]));

// ── 2. The preview's dark panel is a color-scheme, not a copy ───────────────
const panel = blocks(read('previews/_preview.css')).find((b) => b.selector === '.panel.dark');
if (!panel) fail('previews/_preview.css: no .panel.dark block found');
else for (const k of panel.decls.keys()) fail(`one list: .panel.dark re-declares ${k}; color-scheme: dark is all it needs`);

// ── 3. Arguments are concrete colours ────────────────────────────────────────
for (const [k, v] of tokens)
  for (const fn of ['light-dark', 'color-mix'])
    for (const { args } of calls(v, fn))
      if (args.some((a) => /var\(|light-dark\(/.test(a)))
        fail(`nesting: ${k} passes a var() or light-dark() into ${fn}() — write the concrete colour (tokens.css rule 2)`);

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

// ── 3b. Repeated values match their source ───────────────────────────────────
// A wash repeats its hue; a role on a different step per theme repeats the
// step. Each copy must still equal what it copies.
const hexOf = (name, map) => toHex(resolve(`var(${name})`, map).rgb);
// Each wash and the token it mixes, [light, dark]. State washes mix their own
// hue; --surface-sticky mixes the surface it sits on, which differs by theme.
const WASHES = { '--surface-sticky': ['--card', '--bg'] };
for (const [k] of tokens) {
  const m = k.match(/^--(i|success|attention|danger)-(surface|line|selection)$/);
  if (m) WASHES[k] = [`--${m[1]}`, `--${m[1]}`];
}
for (const [k, sources] of Object.entries(WASHES))
  [['light', light], ['dark', dark]].forEach(([theme, map], i) => {
    const src = sources[i];
    const base = map.get(k)?.match(/^color-mix\(in srgb,\s*(#[0-9a-f]{3,6})\s/i)?.[1];
    if (!base) fail(`drift (${theme}): ${k} is not a color-mix() of a hex`);
    else if (toHex(hex(base)) !== hexOf(src, map))
      fail(`drift (${theme}): ${k} mixes ${base}, but ${src} is ${hexOf(src, map)}`);
  });
const STEPS = { '--bg': ['--n-25', '--n-0'], '--card': ['--n-0', '--n-50'], '--on-dark': ['--n-25', '--n-0'],
  '--slate': ['--n-600', '--n-500'], '--line-control': ['--n-500', null],
  '--device': ['--n-900', '--n-300'] };
for (const [k, steps] of Object.entries(STEPS))
  steps.forEach((step, i) => {
    const [theme, map] = i ? ['dark', dark] : ['light', light];
    if (step && hexOf(k, map) !== hexOf(step, map)) fail(`drift (${theme}): ${k} is ${hexOf(k, map)}, but ${step} is ${hexOf(step, map)}`);
  });

// ── 3c. Each family holds its hue ────────────────────────────────────────────
// The neutral ramp is one temperature, OKLCH 286° (ADR-0007). Cobalt — the
// interactive steps and the sequential ramp built from it — is 256°, our own
// rather than Tailwind's blue-600 at 263° (ADR-0008). Near-zero chroma has no
// meaningful hue, so pure white is exempt.
const HUES = [
  [/^--n-\d+$/, 286, 'ramp temperature'],
  [/^--i(-ink|-hover|-pressed)?$/, 256, 'cobalt hue'],
  [/^--seq-[1-9]$/, 256, 'cobalt hue'],
];
const HUE_TOLERANCE = 3;
function oklch([r, g, b]) {
  const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  [r, g, b] = [r, g, b].map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { C: Math.hypot(A, B), H: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}
for (const [k] of tokens) {
  const rule = HUES.find(([re]) => re.test(k));
  if (!rule) continue;
  const [, hue, label] = rule;
  for (const [theme, map] of [['light', light], ['dark', dark]]) {
    const { C, H } = oklch(resolve(`var(${k})`, map).rgb);
    if (C < 0.001) continue;
    if (Math.abs(H - hue) > HUE_TOLERANCE)
      fail(`${label} (${theme}): ${k} ${hexOf(k, map)} sits at hue ${H.toFixed(1)}°, not ${hue}° ±${HUE_TOLERANCE}°`);
  }
}

// ── 1. Contrast floors ───────────────────────────────────────────────────────
// [foreground, background, floor]. A translucent background (a wash) is laid
// over --card first, which is where washes sit.
const TEXT = 4.5, MARK = 3;
const floors = [];
for (const fg of ['--ink', '--ink-soft', '--slate', '--i-ink', '--success-ink', '--attention-ink', '--danger-ink'])
  for (const bg of ['--card', '--bg']) floors.push([fg, bg, TEXT]);
floors.push(['--slate', '--line-soft', TEXT]); // the Idea pill
floors.push(['--ink', '--surface-sticky', TEXT], ['--ink-soft', '--surface-sticky', TEXT]); // sticky bars
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
// `&#8212;` is an entity, not a colour.
const HEX = /(?<![&\w])#[0-9a-f]{3,8}\b/gi;
const scan = (file, text) => {
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(HEX)) fail(`hardcoded hex: ${file}:${i + 1} ${m[0]}`);
  });
};
scan('tailwind.css', read('tailwind.css').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, '')));
scan('product-page.css', read('product-page.css'));
scan('previews/_preview.css', read('previews/_preview.css'));
for (const f of readdirSync(new URL('previews/', root)).filter((f) => f.endsWith('.html')))
  scan(`previews/${f}`, read(`previews/${f}`));

if (failures.length) {
  console.error(failures.map((f) => `✕ ${f}`).join('\n'));
  console.error(`\n${failures.length} problem${failures.length === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log(`✓ ${checked} contrast pairs, one list, no drift, every family on its hue, no stray hex`);
