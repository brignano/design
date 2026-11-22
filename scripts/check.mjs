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
//   5. a hex literal appears outside the token files (product-page.css,
//      the previews and index.html included);
//   6. index.html, the hosted preview site's landing page, misses a preview;
//   7. a preview skips the shared header script, previews/_site.js lists the
//      pages differently from the files, or index.html orders them differently;
//   8. a class defined in components.css or templates/*.css appears on no
//      preview page (DESIGN.md §14: if it isn't shown, it isn't reviewed).
//      Their rules that set both a text colour and a background from tokens
//      join the contrast floors in (1), and so does a text colour in a rule
//      nested under one that sets a background (#98);
//   9. templates/email.html names a colour token that tokens.css can't
//      resolve to a light-theme value, or carries a hex of its own;
//  10. a component or template page misses part of the docs shape (#86):
//      data-status on <html>, and .docs sections tagged data-doc="usage"
//      (with a snippet), "use-when", "dont-use" and "a11y"; or its card on
//      index.html shows a different status;
//  11. icons/ and the icon list on previews/icons.html disagree, an icon's
//      name isn't lower-case kebab, or an icon leaves the set's shape: a
//      fill or stroke other than none or currentColor, any style= or color=,
//      any hex, a stroke-width other than 2, or a size other than 24.
//  12. DESIGN.md §15 (Content) and previews/writing.html disagree: a rule
//      without exactly one "- Do:" and one "- Don't:" line; a rule with no
//      section of the same name, or a section with no rule; a duplicate; a
//      different order; a section without one Do and one Don't panel, or a
//      panel that doesn't show the quoted examples from its rule.
//  13. the card stage (.card-stage in components.css) and the product-page
//      stage (--pp-stage in product-page.css) mix the mark at different
//      strengths: a product looks the same on its card and its page (ADR-0018).
//  14. controls.css is not exactly what scripts/controls.mjs makes from
//      components.css (it is generated, never edited).
//  15. tokens.css, tokens.chart.css, tailwind.css, tokens/names.d.ts or a
//      kits/*.css is not exactly what scripts/build.mjs makes from tokens/
//      (they are generated: edit the JSON, then `npm run build`).
//  17. the theme generator's gate lets through a pair just under its floor,
//      the build writes a theme the gate faults, or any hue on any kit and
//      ground produces a theme that misses a floor.
//  16. a kit (kits/*.css) or a product's theme (themes/*.css; ADR-0019) misses
//      a contrast floor in either scheme,
//      sets a name :root doesn't define, lets a wash drift from the colour it
//      mixes, or uses one hue for both "you can act on this" and "settled".
//
// No dependencies on purpose: the package has none, and a check that needs an
// install is a check that stops being run.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { hex, toHex, resolve } from './colour.mjs';
import { TOKEN, resolveLight } from './email-tokens.mjs';
import { controls } from './controls.mjs';
import { build, rootTokenMap, theme as buildTheme } from './build.mjs';
import { derive, gate, parse } from './theme.mjs';

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

const SCALE_BLOCKS = ['.tier-marketing', '@media (pointer: coarse) > :root:not(.tier-marketing)', "[data-density='compact']"];
// [data-mark] points --mark-current at an existing mark token (ADR-0014). Same
// terms as the blocks above: a var() to a token, never a colour of its own.
const MARK_BLOCKS = ["[data-mark='teal']", "[data-mark='violet']", "[data-mark='magenta']"];
const tokens = new Map();
for (const f of ['tokens.css', 'tokens.chart.css'])
  for (const { selector, decls } of blocks(read(f)))
    for (const [k, v] of decls) {
      if (selector === ':root') tokens.set(k, v);
      // .tier-marketing re-declares type and rhythm, never colour. So does
      // the tool tier's coarse-pointer block (a larger smallest step on a phone).
      else if (MARK_BLOCKS.includes(selector) && /^--mark-(current|fill|fill-hover|fill-pressed|surface)$/.test(k) && /^var\(--mark-[a-z-]+\)$/.test(v)) continue;
      else if (!SCALE_BLOCKS.includes(selector) || /light-dark|#|rgb|color-mix/.test(v))
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
// hex, toHex and resolve live in colour.mjs, shared with email-tokens.mjs.
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
  const m = k.match(/^--(action|success|attention|danger)-(surface|line|selection)$/);
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
const STEPS = { '--bg': ['--neutral-25', '--neutral-0'], '--card': ['--neutral-0', '--neutral-50'], '--on-dark': ['--neutral-25', '--neutral-0'],
  '--slate': ['--neutral-600', '--neutral-500'], '--line-control': ['--neutral-500', null],
  '--device': ['--neutral-900', '--neutral-300'],
  // The danger button's fills are the state hue in light; only dark has its own.
  '--danger-fill': ['--danger', null], '--danger-fill-hover': ['--danger-ink', null], '--danger-fill-pressed': ['--danger-ink', null],
  // A product's fill is its mark in light; only dark has its own (ADR-0017).
  '--mark-teal-fill': ['--mark-teal', null], '--mark-violet-fill': ['--mark-violet', null], '--mark-magenta-fill': ['--mark-magenta', null] };
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
  [/^--neutral-\d+$/, 286, 'ramp temperature'],
  [/^--action(-ink|-ink-hover|-hover|-pressed)?$/, 256, 'cobalt hue'],
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

// A mark's fills and its page ground sit at that mark's own hue, theme by
// theme (ADR-0017). '' is the family amber, whose mark is --mark.
const MARK_FAMILIES = ['', '-teal', '-violet', '-magenta'];
for (const f of MARK_FAMILIES)
  for (const step of ['fill', 'fill-hover', 'fill-pressed', 'surface'])
    for (const [theme, map] of [['light', light], ['dark', dark]]) {
      const k = `--mark${f}-${step}`, src = `--mark${f}`;
      if (!tokens.has(k)) { fail(`mark hue: ${k} is missing`); continue; }
      const want = oklch(resolve(`var(${src})`, map).rgb).H, got = oklch(resolve(`var(${k})`, map).rgb).H;
      const off = Math.min(Math.abs(got - want), 360 - Math.abs(got - want));
      if (off > HUE_TOLERANCE)
        fail(`mark hue (${theme}): ${k} ${hexOf(k, map)} sits at hue ${got.toFixed(1)}°, but ${src} is ${want.toFixed(1)}° ±${HUE_TOLERANCE}°`);
    }

// ── 1. Contrast floors ───────────────────────────────────────────────────────
// [foreground, background, floor]. A translucent background (a wash) is laid
// over --card first, which is where washes sit.
const TEXT = 4.5, MARK = 3;
const floors = [];
for (const fg of ['--ink', '--ink-soft', '--slate', '--action-ink', '--action-ink-hover', '--success-ink', '--attention-ink', '--danger-ink'])
  for (const bg of ['--card', '--bg']) floors.push([fg, bg, TEXT]);
floors.push(['--slate', '--line-soft', TEXT]); // the Idea pill
floors.push(['--ink', '--surface-sticky', TEXT], ['--ink-soft', '--surface-sticky', TEXT]); // sticky bars
floors.push(['--action', '--surface-sticky', MARK], ['--action-ink', '--surface-sticky', MARK]); // aria-current underline, ghost icon and focus ring on the site header
for (const bg of ['--action', '--action-hover', '--action-pressed']) floors.push(['--on-action', bg, TEXT]);
// Buttons (#47): labels on the fills a hover or press swaps in, which no
// single rule pairs with its colour.
for (const bg of ['--danger-fill', '--danger-fill-hover', '--danger-fill-pressed']) floors.push(['--on-danger', bg, TEXT]);
for (const bg of ['--card', '--bg']) floors.push(['--danger-fill', bg, MARK]); // the button has to be found on the surface it sits on
// A product page's primary button and ground (ADR-0017): the label on each
// fill, the button found on every ground it can sit on, and text on the ground.
for (const f of MARK_FAMILIES) {
  for (const step of ['fill', 'fill-hover', 'fill-pressed']) floors.push(['--on-mark', `--mark${f}-${step}`, TEXT]);
  for (const bg of ['--card', '--bg', `--mark${f}-surface`]) floors.push([`--mark${f}-fill`, bg, MARK]);
  for (const fg of ['--ink', '--ink-soft', '--action-ink']) floors.push([fg, `--mark${f}-surface`, TEXT]);
}
// product-page.css: an ink primary button (data-button="ink", or no mark)
// takes a --card label on --ink, --neutral-800 (hover) and --neutral-700 (pressed).
for (const bg of ['--ink', '--neutral-800', '--neutral-700']) floors.push(['--card', bg, TEXT]);
for (const bg of ['--surface-hover', '--surface-active']) floors.push(['--ink', bg, TEXT]);
for (const s of ['success', 'attention', 'danger']) floors.push([`--${s}-ink`, `--${s}-surface`, TEXT]);
floors.push(['--action-ink', '--action-surface', TEXT]);
// Messages and banners (#50): title and body on each wash, the icon on it as a
// mark, and the neutral info banner's strip.
for (const s of ['success', 'attention', 'danger']) {
  for (const fg of ['--ink', '--ink-soft']) floors.push([fg, `--${s}-surface`, TEXT]);
  floors.push([`--${s}`, `--${s}-surface`, MARK]);
}
floors.push(['--ink-soft', '--surface-hover', TEXT], ['--action', '--surface-hover', MARK]);
// Tooltip (#57): the inverted chip.
floors.push(['--card', '--ink', TEXT]);
// Pills (#51): the info pill's dot on its wash.
floors.push(['--action', '--action-surface', MARK]);
// --line-control is not paired with the washes: it is under 3:1 there, so an
// outlined button in .msg-actions gets a --card fill (floored above).
// Code on a highlighted line (components.css .line-highlight). A comment there
// takes --code-string, so --code-comment is not paired with the wash.
for (const fg of ['--code-ink', '--code-keyword', '--code-string']) floors.push([fg, '--code-highlight', TEXT]);
for (const fg of ['--code-ink', '--code-keyword', '--code-string', '--code-comment']) floors.push([fg, '--code-surface', TEXT]);
for (const fg of ['--action', '--success', '--attention', '--danger', '--line-control', '--mark', '--mark-current', '--mark-teal', '--mark-violet', '--mark-magenta'])
  for (const bg of ['--card', '--bg']) floors.push([fg, bg, MARK]);
// Chart series: light slots 3–5 are exempt by the relief rule in tokens.chart.css.
for (let n = 1; n <= 8; n++) floors.push([`--chart-${n}`, '--chart-surface', MARK, n >= 3 && n <= 5 ? 'dark' : null]);

// The floors that come from tokens alone, before the component layer adds its
// own pairs. Every kit is held to these too (section 16).
const TOKEN_FLOORS = floors.slice();

// Component layer (DESIGN.md §14): components.css and templates/*.css.
const LAYER_FILES = ['components.css'];
if (existsSync(new URL('templates/', root)))
  for (const f of readdirSync(new URL('templates/', root))) if (f.endsWith('.css')) LAYER_FILES.push(`templates/${f}`);
// Every rule with all its declarations, at-rule wrappers (@layer, @media,
// @supports, @container) walked through. `@layer x;` statements are dropped.
function rules(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@layer\s+[\w.,\s-]+;/g, '');
  const out = [];
  (function walk(text) {
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
      if (/^@(layer|media|supports|container)\b/.test(selector)) walk(body);
      else if (!selector.startsWith('@')) {
        const decls = new Map();
        for (const m of body.matchAll(/([\w-]+)\s*:\s*([^;]+);?/g)) decls.set(m[1], m[2].trim());
        out.push({ selector, decls });
      }
      i = j;
    }
  })(css);
  return out;
}
const layerRules = LAYER_FILES.map((f) => [f, rules(read(f))]);
// A pair registered at a lower floor (a mark or an edge at 3:1) is still
// checked at 4.5:1 when a component uses it as text: the key carries the floor.
const pairKey = new Set(floors.map(([fg, bg, floor]) => `${fg} ${bg} ${floor}`));
const addFloor = (fg, bg, floor) => {
  if (!pairKey.has(`${fg} ${bg} ${floor}`)) {
    pairKey.add(`${fg} ${bg} ${floor}`);
    floors.push([fg, bg, floor]);
  }
};
const INACTIVE = /:disabled|\[aria-disabled=['"]?true['"]?\]/;
const DIVIDERS = new Set(['--line', '--line-soft', '--line-strong']);
const tokenOf = (v) => v?.match(/var\((--[\w-]+)\)/g)?.length === 1 ? v.match(/var\((--[\w-]+)\)/)[1] : undefined;
for (const [, rs] of layerRules)
  for (const { selector, decls } of rs) {
    const bg = tokenOf(decls.get('background-color') ?? decls.get('background'));
    if (!bg) continue;
    // Text on its own background: 4.5:1. The one exception is a really
    // inactive control (WCAG 1.4.3, DESIGN.md §4): a rule keyed on :disabled
    // or aria-disabled may set exactly --disabled-ink on --disabled, and
    // nothing else escapes the floor.
    const fg = decls.get('color')?.match(/^var\((--[\w-]+)\)$/)?.[1];
    const inactive = INACTIVE.test(selector);
    if (fg && inactive && fg === '--disabled-ink' && bg === '--disabled') {
      /* exempt: inactive control */
    } else if (fg) addFloor(fg, bg, TEXT);
    // A control's edge on its own background: 3:1 (DESIGN.md §4). The divider
    // tokens are exempt by definition: they are hairlines between surfaces,
    // "too faint to tell you a control is there", and a control must not use
    // them for its edge.
    for (const prop of ['border', 'border-color', 'outline', 'outline-color']) {
      const edge = tokenOf(decls.get(prop));
      if (edge && !DIVIDERS.has(edge)) addFloor(edge, bg, MARK);
    }
  }

// An ink on a wash its parent sets (#98). A rule that sets a background pairs
// with the text colour of every rule nested under it in the same file: a
// selector that starts with the background rule's selector, then a descendant
// or child combinator. The nearest such background wins, so an ink on an inner
// wash isn't also held to an outer one it never touches. Prefix matching, not
// a cascade resolver: `.a .b` nests under `.a`, `.b` alone does not.
const parts = (selector) => selector.split(',').map((s) => s.trim()).filter(Boolean);
function nestedPairs(rs) {
  const washes = [];
  for (const { selector, decls } of rs) {
    const bg = tokenOf(decls.get('background-color') ?? decls.get('background'));
    if (bg) for (const sel of parts(selector)) washes.push([sel, bg]);
  }
  const out = [];
  for (const { selector, decls } of rs) {
    const fg = decls.get('color')?.match(/^var\((--[\w-]+)\)$/)?.[1];
    if (!fg || tokenOf(decls.get('background-color') ?? decls.get('background'))) continue;
    for (const sel of parts(selector)) {
      let near;
      for (const [w, bg] of washes)
        if (sel.length > w.length && sel.startsWith(w) && /^[\s>]/.test(sel.slice(w.length)) && (!near || w.length > near[0].length))
          near = [w, bg];
      if (near) out.push([fg, near[1], sel]);
    }
  }
  return out;
}
for (const [, rs] of layerRules)
  for (const [fg, bg, sel] of nestedPairs(rs)) {
    // The same exemption as above: a really inactive control's ink.
    if (fg === '--disabled-ink' && INACTIVE.test(sel)) continue;
    // An icon is a graphic, not text: 3:1 (WCAG 1.4.11), as a control's edge.
    addFloor(fg, bg, /(^|[\s>])(svg|\.icon)$/.test(sel) ? MARK : TEXT);
  }

// Self-check: the #97 case. Slate comments on the cobalt highlight measured
// 4.2–4.3:1 and passed, because no rule set both. The pairing must still
// find that pair; whether it passes is the contrast loop's job, so tuning
// either token later can't break this.
{
  const fixture = rules(`.line-highlight { background: var(--code-highlight); }
    .line-highlight .tok-comment { color: var(--code-comment); }
    .tok-comment { color: var(--code-comment); }`);
  const found = nestedPairs(fixture);
  const caught = found.length === 1 && found[0][0] === '--code-comment' && found[0][1] === '--code-highlight';
  if (!caught) fail('self-check: a nested ink on a parent wash (.line-highlight .tok-comment) is no longer paired');
}

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
for (const f of LAYER_FILES) scan(f, read(f));
scan('previews/_preview.css', read('previews/_preview.css'));
scan('previews/_site.css', read('previews/_site.css'));
const previews = readdirSync(new URL('previews/', root)).filter((f) => f.endsWith('.html'));
for (const f of previews) scan(`previews/${f}`, read(`previews/${f}`));
scan('index.html', read('index.html'));
scan('templates/email.html', read('templates/email.html'));

// ── 9. The email's colour tokens resolve ─────────────────────────────────────
for (const [, name] of read('templates/email.html').matchAll(TOKEN)) {
  try { resolveLight(name); } catch (e) { fail(`email: ${e.message}`); }
}

// ── 6. The hosted index links every preview ──────────────────────────────────
// index.html is the landing page of the preview site (wrangler.jsonc); a
// preview it doesn't list is one nobody finds from a PR link.
const index = read('index.html');
for (const f of previews)
  if (!index.includes(`href="previews/${f}"`)) fail(`index.html does not link previews/${f}`);

// ── 7. One script, one page order ────────────────────────────────────────────
// previews/_site.js holds the order the header's previous/next links follow;
// index.html must list the same order, and every preview must load the script.
for (const f of previews)
  if (!read(`previews/${f}`).includes('<script src="_site.js"></script>'))
    fail(`previews/${f} does not load <script src="_site.js"></script>`);
const pages = [...read('previews/_site.js').matchAll(/\['([\w-]+\.html)'/g)].map((m) => m[1]);
for (const f of previews) {
  const n = pages.filter((p) => p === f).length;
  if (n !== 1) fail(`previews/_site.js PAGES lists ${f} ${n} times; it must be exactly once`);
}
for (const p of new Set(pages))
  if (!previews.includes(p)) fail(`previews/_site.js PAGES lists ${p}, which is not in previews/`);
const indexOrder = [...index.matchAll(/href="previews\/([\w-]+\.html)"/g)].map((m) => m[1]);
if (indexOrder.join() !== pages.join())
  fail(`order: index.html links\n    ${indexOrder.join(', ')}\n  but previews/_site.js PAGES is\n    ${pages.join(', ')}`);

// ── 8. Every component class is on a preview page ───────────────────────────
const shown = new Set();
for (const f of previews)
  for (const m of read(`previews/${f}`).matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) shown.add(c);
for (const [f, rs] of layerRules)
  for (const { selector } of rs)
    for (const m of selector.matchAll(/\.([a-z][\w-]*)/gi))
      if (!shown.has(m[1]) && shown.add(m[1])) fail(`not shown: .${m[1]} (${f}) appears on no preview page`);

// ── 10. Every component page is a docs page ─────────────────────────────────
// The shape a builder (or an agent) can use without reading CSS: a status, a
// copy-paste snippet, when to use it and when not, and what accessibility
// asks of the consumer. Foundations are specimens, and the product page
// skeleton and its examples are documented in DESIGN.md §13.
const NOT_DOCS = new Set(['color.html', 'type.html', 'elevation.html', 'components.html',
  'diagram.html', 'product-page.html', 'product-page-example.html', 'product-page-guidebook.html',
  'product-page-sites.html', 'product-media.html', 'writing.html']);
const STATUSES = ['stable', 'beta', 'planned'];
const DOCS = { usage: 'Use it', 'use-when': 'Use when', 'dont-use': "Don't use when", a11y: 'Accessibility' };
const cardStatus = new Map(
  [...index.matchAll(/<a class="gallery-card" href="previews\/([\w-]+\.html)">([\s\S]*?)<\/a>/g)]
    .map(([, f, body]) => [f, body.match(/data-status="([\w-]+)"/)?.[1]]));
for (const f of previews) {
  const html = read(`previews/${f}`);
  const status = html.match(/<html[^>]*\sdata-status="([\w-]+)"/)?.[1];
  if (NOT_DOCS.has(f)) {
    if (status) fail(`previews/${f}: a foundation or product-page example carries data-status; drop it or take it off the exempt list`);
    if (cardStatus.get(f)) fail(`index.html: the card for previews/${f} shows a status, but the page is exempt`);
    continue;
  }
  if (!STATUSES.includes(status)) { fail(`previews/${f}: <html> needs data-status="${STATUSES.join('|')}"`); continue; }
  if (cardStatus.get(f) !== status)
    fail(`index.html: the card for previews/${f} shows status ${cardStatus.get(f) ?? 'none'}, but the page says ${status}`);
  // Comments and escaped snippets can't stand in for a section: strip
  // comments, then match the attribute only on a real <section> tag.
  const page = html.replace(/<!--[\s\S]*?-->/g, '');
  const docs = page.search(/class="(?:[^"]*\s)?docs(?:\s[^"]*)?"/);
  if (docs < 0) { fail(`previews/${f}: no .docs block`); continue; }
  const after = page.slice(docs);
  const order = [];
  for (const [key, heading] of Object.entries(DOCS)) {
    const at = after.search(new RegExp(`<section\\b[^>]*\\sdata-doc="${key}"`));
    if (at < 0) { fail(`previews/${f}: .docs has no <section data-doc="${key}"> ("${heading}")`); continue; }
    order.push(at);
    const section = after.slice(at, after.indexOf('</section>', at));
    if (!section.includes(`>${heading}</h2>`))
      fail(`previews/${f}: the data-doc="${key}" section's heading must read "${heading}"`);
    if (key === 'usage' && !section.includes('<pre')) fail(`previews/${f}: "Use it" has no copy-paste snippet (<pre>)`);
    else if (key !== 'usage' && !/<(li|p)\b/.test(section)) fail(`previews/${f}: "${heading}" is empty`);
  }
  if (order.length === 4 && order.some((at, i) => i && at < order[i - 1]))
    fail(`previews/${f}: the docs sections must run Use it, Use when, Don't use when, Accessibility`);
}

// ── 11. One icon set, all of it shown, all of it in currentColor ────────────
const iconFiles = readdirSync(new URL('icons/', root)).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)).sort();
const iconPage = read('previews/icons.html').match(/const ICONS = \[([\s\S]*?)\];/);
const iconList = iconPage ? [...iconPage[1].matchAll(/'([\w-]+)'/g)].map((m) => m[1]) : [];
if (!iconPage) fail('previews/icons.html: no ICONS list');
if ([...iconList].sort().join() !== iconFiles.join())
  fail(`icons: previews/icons.html lists ${iconList.length}, icons/ holds ${iconFiles.length}; they must match`);
if (!existsSync(new URL('icons/LICENSE', root))) fail('icons/LICENSE is missing');
for (const n of iconFiles) {
  const svg = read(`icons/${n}.svg`);
  const head = svg.match(/<svg\b[^>]*>/)?.[0] ?? '';
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(n)) fail(`icons/${n}.svg: names are lower-case kebab, as Lucide's are`);
  for (const m of svg.matchAll(/\b(fill|stroke)\s*=\s*(["'])(.*?)\2/g))
    if (!['none', 'currentColor'].includes(m[3])) fail(`icons/${n}.svg: ${m[1]}="${m[3]}"; icons take currentColor`);
  if (/\s(style|color)\s*=|<style\b/.test(svg)) fail(`icons/${n}.svg: carries style= or color=; icons take currentColor from the text`);
  if (/#[0-9a-fA-F]{3,8}\b/.test(svg)) fail(`icons/${n}.svg: carries a hex colour`);
  if (!/viewBox="0 0 24 24"/.test(head)) fail(`icons/${n}.svg: not on the 24px grid`);
  if (!/\swidth="24"/.test(head) || !/\sheight="24"/.test(head)) fail(`icons/${n}.svg: must be width="24" height="24"`);
  if ([...svg.matchAll(/stroke-width\s*=\s*["']([^"']*)["']/g)].some((m) => m[1] !== '2') || !/stroke-width="2"/.test(head))
    fail(`icons/${n}.svg: one stroke width, 2`);
}

// ── 12. One set of content rules, written once and shown once ──────────────
const design = read('DESIGN.md');
const content = design.match(/\n## 15\. Content\n([\s\S]*?)(?=\n## |$)/)?.[1];
if (!content) fail('DESIGN.md: no "## 15. Content" section');
else {
  const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const quotes = (line) => [...line.matchAll(/"([^"]+)"|`([^`]+)`/g)].map((m) => m[1] ?? m[2]);
  const rules = content.split(/\n### /).slice(1).map((r) => {
    const title = r.split('\n')[0].trim();
    const dos = r.match(/^\s*[-*] Do: .*$/gm) || [];
    const donts = r.match(/^\s*[-*] Don't: .*$/gm) || [];
    return { title, slug: slug(title), dos, donts };
  });
  const page = read('previews/writing.html');
  const text = (h) => h.replace(/\splaceholder="([^"]*)"/g, '>$1<').replace(/<[^>]+>/g, ' ')
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  const shown = [...page.matchAll(/<section class="guideline"[^>]*>([\s\S]*?)<\/section>/g)].map(([, body]) => {
    const h = body.match(/<h2[^>]*\sid="([\w-]+)"[^>]*>([^<]+)<\/h2>/);
    const part = (cls) => [...body.matchAll(new RegExp(`<div class="ex ${cls}">`, 'g'))].length;
    const panel = (cls) => body.split(`<div class="ex ${cls}">`)[1]?.split('<div class="ex ')[0] ?? '';
    return { id: h?.[1], title: h?.[2].trim(), dos: part('ex-do'), donts: part('ex-dont'), doText: text(panel('ex-do')), dontText: text(panel('ex-dont')) };
  });
  const sections = (page.match(/<section\b/g) || []).length;
  if (sections !== shown.length) fail(`previews/writing.html: ${sections} sections, ${shown.length} of them <section class="guideline">; every section is a rule`);
  const dup = (xs) => xs.filter((x, i) => xs.indexOf(x) !== i);
  for (const d of dup(rules.map((r) => r.slug))) fail(`DESIGN.md §15: rule "${d}" appears twice`);
  for (const d of dup(shown.map((h) => h.id))) fail(`previews/writing.html: section "${d}" appears twice`);
  for (const r of rules) {
    if (r.dos.length !== 1 || r.donts.length !== 1) fail(`DESIGN.md §15 "${r.title}": needs exactly one "- Do:" and one "- Don't:" (has ${r.dos.length} and ${r.donts.length})`);
    const h = shown.find((x) => x.id === r.slug);
    if (!h || h.title !== r.title) { fail(`previews/writing.html: no <h2 id="${r.slug}">${r.title}</h2> for DESIGN.md §15`); continue; }
    if (h.dos !== 1 || h.donts !== 1) fail(`previews/writing.html "${r.title}": needs exactly one .ex-do and one .ex-dont panel`);
    for (const q of quotes(r.dos.join(' '))) if (!h.doText.includes(q)) fail(`previews/writing.html "${r.title}": the Do panel doesn't show "${q}"`);
    for (const q of quotes(r.donts.join(' '))) if (!h.dontText.includes(q)) fail(`previews/writing.html "${r.title}": the Don't panel doesn't show "${q}"`);
  }
  for (const h of shown) if (!h.id || !rules.some((r) => r.slug === h.id)) fail(`previews/writing.html: section "${h.title ?? h.id ?? '?'}" has no rule in DESIGN.md §15`);
  if (rules.map((r) => r.slug).join() !== shown.map((h) => h.id).join())
    fail('previews/writing.html: the rules must run in the same order as DESIGN.md §15');
}

// ── 13. One stage strength ───────────────────────────────────────────────────
{
  const strength = (css, re) => css.match(re)?.[1];
  const page = strength(read('product-page.css'), /--pp-stage:\s*color-mix\(in srgb,\s*var\(--pp-mark\)\s+([\d.]+%)/);
  const card = strength(read('components.css'), /\.card-stage\s*\{[^}]*color-mix\(in srgb,\s*var\(--mark-current\)\s+([\d.]+%)/);
  if (!page || !card) fail('one stage: no --pp-stage mix in product-page.css or no .card-stage mix in components.css');
  else if (page !== card) fail(`one stage: .card-stage mixes the mark at ${card}, --pp-stage at ${page}; they must match (ADR-0018)`);
}

// ── 14. controls.css is generated ────────────────────────────────────────────
if (!existsSync(new URL('controls.css', root)) || read('controls.css') !== controls(read('components.css')))
  fail('controls.css is out of date with components.css: run `npm run controls` and commit it');

// ── 16. Every kit holds the floors ───────────────────────────────────────────
// A kit re-declares :root's colours under [data-kit], so it is measured the
// way :root is: its values laid over :root's, each scheme on its own, against
// every token floor in section 1 (TOKEN_FLOORS). State, code, mark and chart
// colours are the same tokens in every kit, so they are measured again on the
// kit's surfaces.
//
// Two named differences from :root, and no others:
//   - `--action` as a MARK (3:1) passes if `--action` OR `--action-edge`
//     reaches it. A kit whose fill can't be found on its page (Split's lime
//     in light) names the colour that stands in: its button's border, and
//     what #183 must draw an action-coloured mark with (ADR-0020).
//   - the pairs the check reads out of components.css are not here yet. They
//     are measured against the default look only until #183 restyles the
//     components for the kits, and join then.
const STATE_TOKEN = /^--(success|attention|danger)(-|$)/;

let kitsChecked = 0;
// A product's theme (themes/*.css, generated from themes/*.theme) is a kit
// with a hue, a ground and a face laid over it, so it is held to the same
// floors. A theme pinned dark (`color-scheme: dark`) is measured dark only.
const cssIn = (dir) => (existsSync(new URL(dir, root)) ? readdirSync(new URL(dir, root)).filter((f) => f.endsWith('.css')).map((f) => [dir, f]) : []);
const kitFiles = [...cssIn('kits/'), ...cssIn('themes/')];
for (const [dir, file] of kitFiles) {
  const isTheme = dir === 'themes/';
  const name = `${isTheme ? 'theme ' : ''}${file.slice(0, -4)}`;
  const selector = isTheme ? `[data-product='${file.slice(0, -4)}']` : `[data-kit='${file.slice(0, -4)}']`;
  const text = read(dir + file);
  const darkOnly = /^\s*color-scheme:\s*dark;/m.test(text);
  const decls = new Map();
  for (const b of blocks(text)) {
    if (b.selector !== selector) fail(`kit ${name}: ${dir}${file} has a rule for \`${b.selector}\`; it is scoped to ${selector} and nothing else`);
    for (const [k, v] of b.decls) decls.set(k, v);
  }
  for (const k of decls.keys()) {
    if (!tokens.has(k)) fail(`kit ${name}: ${k} is not a token :root defines`);
    // State hues are the same in every kit (ADR-0020).
    if (STATE_TOKEN.test(k)) fail(`kit ${name}: ${k} is a state colour; a kit may not set one`);
  }
  [['light', light], ['dark', dark]].forEach(([theme, base], i) => {
    if (darkOnly && theme === 'light') return;
    const map = new Map([...base, ...[...decls].map(([k, v]) => [k, side(v, i)])]);
    const at = (token, under) => {
      const c = resolve(`var(${token})`, map);
      return c.alpha < 1 ? over(c, under) : c.rgb;
    };
    const measure = (fg, bg) => {
      const b = at(bg, at('--card', [255, 255, 255]));
      return [ratio(at(fg, b), b), b];
    };
    try {
      for (const [fg, bg, floor, only] of [...TOKEN_FLOORS, ['--on-accent', '--accent', TEXT]]) {
        if (only && only !== theme) continue;
        const [r, b] = measure(fg, bg);
        kitsChecked++;
        if (r >= floor) continue;
        if (fg === '--action' && floor === MARK) {
          const edge = measure('--action-edge', bg)[0];
          if (edge < MARK) fail(`kit ${name} (${theme}): neither --action (${r.toFixed(2)}:1) nor --action-edge (${edge.toFixed(2)}:1) reaches ${MARK}:1 on ${bg}; an action can't be found there`);
        } else fail(`kit ${name} (${theme}): ${fg} on ${bg} is ${r.toFixed(2)}:1 (${toHex(at(fg, b))} on ${toHex(b)}), needs ${floor}:1`);
      }
      // A wash still mixes the colour it is named for.
      for (const [wash, src] of [['--action-surface', '--action'], ['--action-line', '--action'], ['--action-selection', '--action'], ['--surface-sticky', i ? '--bg' : '--card']]) {
        const base = map.get(wash)?.match(/^color-mix\(in srgb,\s*(#[0-9a-f]{3,6})\s/i)?.[1];
        if (decls.has(wash) && (!base || toHex(hex(base)) !== hexOf(src, map)))
          fail(`kit ${name} (${theme}): ${wash} mixes ${base ?? 'no hex'}, but ${src} is ${hexOf(src, map)}`);
      }
      // One hue acts and another says "settled" (ADR-0004). A fill with almost
      // no chroma (ink, paper) has no hue to confuse.
      const act = oklch(at('--action', [255, 255, 255]));
      const ok = oklch(at('--success', [255, 255, 255]));
      const apart = Math.min(Math.abs(act.H - ok.H), 360 - Math.abs(act.H - ok.H));
      if (act.C > 0.04 && apart < 25) fail(`kit ${name} (${theme}): --action sits ${apart.toFixed(0)}° from --success; within 25° the two read as one colour`);
    } catch (e) {
      fail(`kit ${name} (${theme}): ${e.message}`);
    }
  });
}

// ── 17. The theme generator refuses what it should, and nothing it shouldn't ──
// build.mjs won't write a theme that gate() faults. Three self-checks keep
// that honest:
//   a. each pair the gate owes is refused when it sits JUST under its floor
//      (so a loosened floor or a dropped pair is noticed, not only a gate
//      that has been switched off);
//   b. the build's own theme() refuses such a theme, so the refusal can't be
//      unhooked from the build;
//   c. every hue, on every kit and ground, passes: "a theme is a hue" can't
//      produce a bad palette.
{
  const kitTokens = (kit) => {
    const [, body] = read(`kits/${kit}.css`).match(/\{([\s\S]*?)\}/);
    return new Map([...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
  };
  const sidesOf = (v) => v.match(/#[0-9a-f]{6}/gi);
  // The grey that comes closest to `floor` against `bg` without reaching it.
  const justUnder = (bg, floor) => {
    let best = null;
    for (let g = 0; g < 256; g++) {
      const c = toHex([g, g, g]), r = ratio(hex(c), hex(bg));
      if (r < floor && (!best || r > best[1])) best = [c, r];
    }
    return best;
  };
  const both = [['light', 0], ['dark', 1]];
  try {
    const split = kitTokens('split');
    if (gate('self-check', split, both).length) fail('self-check: the theme gate faults the Split kit itself, so its fixtures prove nothing');
    // a. The pairs the gate owes, written out here on purpose: reading them
    //    from theme.mjs would let a pair be dropped there unnoticed.
    const OWED = [];
    for (const bg of ['bg', 'card']) {
      for (const fg of ['ink', 'ink-soft', 'slate', 'action-ink', 'action-ink-hover']) OWED.push([fg, bg, 4.5]);
      OWED.push(['line-control', bg, 3]);
    }
    for (const bg of ['action', 'action-hover', 'action-pressed']) OWED.push(['on-action', bg, 4.5]);
    OWED.push(['on-accent', 'accent', 4.5], ['ink', 'surface-hover', 4.5], ['ink', 'surface-active', 4.5]);
    for (const [fg, bg, floor] of OWED) {
      const under = sidesOf(split.get(bg)).map((c) => justUnder(c, floor));
      if (under.some(([, r]) => r < floor - 0.4)) fail(`self-check: no grey sits just under ${floor}:1 on --${bg}; the fixture is too easy`);
      const doctored = new Map([...split, [fg, `light-dark(${under[0][0]}, ${under[1][0]})`]]);
      const said = gate('self-check', doctored, both).filter((f) => f.includes(`--${fg} on --${bg} `));
      if (said.length !== 2) fail(`self-check: the theme gate lets --${fg} on --${bg} through at ${under[0][1].toFixed(2)}:1 and ${under[1][1].toFixed(2)}:1; it must refuse under ${floor}:1 in both schemes`);
    }
    for (const bg of ['bg', 'card']) {
      const under = sidesOf(split.get(bg)).map((c) => justUnder(c, 3));
      const v = `light-dark(${under[0][0]}, ${under[1][0]})`;
      const said = gate('self-check', new Map([...split, ['action', v], ['action-edge', v]]), both).filter((f) => f.includes('neither --action nor --action-edge') && f.includes(`--${bg} `));
      if (said.length !== 2) fail(`self-check: the theme gate lets a primary button through that can't be found on --${bg}`);
    }
    // b. Through the build's own path.
    const [slateLight, slateDark] = sidesOf(split.get('card')).map((c) => justUnder(c, 4.5)[0]);
    let refused = false;
    try {
      buildTheme('self-check', 'kit: split\n', rootTokenMap(), new Map([...split, ['slate', `light-dark(${slateLight}, ${slateDark})`]]));
    } catch (e) {
      refused = /--slate on --card/.test(e.message);
    }
    if (!refused) fail('self-check: scripts/build.mjs wrote a theme whose muted text is under 4.5:1; the gate is no longer hooked to the build');
    // c. Every hue.
    let swept = 0;
    for (const kit of ['split', 'ledger', 'larch']) {
      const base = kitTokens(kit);
      for (const ground of ['plain', 'bright', 'wash'])
        for (let hue = 0; hue < 360; hue += 5) {
          const t = parse('sweep', `kit: ${kit}\nground: ${ground}\nhue: ${hue}`);
          const faults = gate('sweep', new Map([...base, ...derive(t, base)]), both);
          swept++;
          if (faults.length) fail(`theme steps: kit ${kit}, ground ${ground}, hue ${hue} misses a floor: ${faults[0].replace('themes/sweep.theme ', '')}`);
        }
    }
    if (swept !== 648) fail(`self-check: the hue sweep ran ${swept} combinations, expected 648`);
  } catch (e) {
    fail(`theme generator: ${e.message}`);
  }
}

// ── 15. The token files are generated ────────────────────────────────────────
// tokens/ is the source. A hand edit to a generated file, or a JSON change
// without a rebuild, would ship a file that disagrees with its source.
try {
  for (const [file, text] of Object.entries(build()))
    if (!existsSync(new URL(file, root)) || read(file) !== text)
      fail(`${file} is not what scripts/build.mjs makes from tokens/; edit the JSON and run \`npm run build\``);
} catch (e) {
  fail(`build: ${e.message}`);
}

if (failures.length) {
  console.error(failures.map((f) => `✕ ${f}`).join('\n'));
  console.error(`\n${failures.length} problem${failures.length === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log(`✓ ${checked} contrast pairs, one list, no drift, every family on its hue, no stray hex, every preview indexed, one page order, every component shown, every page documented, one icon set, one set of content rules, one stage strength, controls.css and the token files in step, ${kitFiles.length} kits and themes on ${kitsChecked} pairs`);
