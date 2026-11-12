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
//      join the contrast floors in (1);
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
//
// No dependencies on purpose: the package has none, and a check that needs an
// install is a check that stops being run.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { hex, toHex, resolve } from './colour.mjs';
import { TOKEN, resolveLight } from './email-tokens.mjs';

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
floors.push(['--i', '--surface-sticky', MARK], ['--i-ink', '--surface-sticky', MARK]); // aria-current underline, ghost icon and focus ring on the site header
for (const bg of ['--i', '--i-hover', '--i-pressed']) floors.push(['--on-i', bg, TEXT]);
// Buttons (#47): labels on the fills a hover or press swaps in, which no
// single rule pairs with its colour.
for (const bg of ['--danger', '--danger-ink']) floors.push(['--on-i', bg, TEXT]);
for (const bg of ['--surface-hover', '--surface-active']) floors.push(['--ink', bg, TEXT]);
for (const s of ['success', 'attention', 'danger']) floors.push([`--${s}-ink`, `--${s}-surface`, TEXT]);
floors.push(['--i-ink', '--i-surface', TEXT]);
// Messages and banners (#50): title and body on each wash, the icon on it as a
// mark, and the neutral info banner's strip.
for (const s of ['success', 'attention', 'danger']) {
  for (const fg of ['--ink', '--ink-soft']) floors.push([fg, `--${s}-surface`, TEXT]);
  floors.push([`--${s}`, `--${s}-surface`, MARK]);
}
floors.push(['--ink-soft', '--surface-hover', TEXT], ['--i', '--surface-hover', MARK]);
// Tooltip (#57): the inverted chip.
floors.push(['--card', '--ink', TEXT]);
// Pills (#51): the info pill's dot on its wash.
floors.push(['--i', '--i-surface', MARK]);
// --line-control is not paired with the washes: it is under 3:1 there, so an
// outlined button in .msg-actions gets a --card fill (floored above).
// Code on a highlighted line (components.css .line-highlight). A comment there
// takes --code-string, so --code-comment is not paired with the wash.
for (const fg of ['--code-ink', '--code-keyword', '--code-string']) floors.push([fg, '--code-highlight', TEXT]);
for (const fg of ['--code-ink', '--code-keyword', '--code-string', '--code-comment']) floors.push([fg, '--code-surface', TEXT]);
for (const fg of ['--i', '--success', '--attention', '--danger', '--line-control', '--mark-teal', '--mark-violet', '--mark-magenta'])
  for (const bg of ['--card', '--bg']) floors.push([fg, bg, MARK]);
// Chart series: light slots 3–5 are exempt by the relief rule in tokens.chart.css.
for (let n = 1; n <= 8; n++) floors.push([`--chart-${n}`, '--chart-surface', MARK, n >= 3 && n <= 5 ? 'dark' : null]);

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
const DIVIDERS = new Set(['--line', '--line-soft', '--line-strong']);
const tokenOf = (v) => v?.match(/var\((--[\w-]+)\)/g)?.length === 1 ? v.match(/var\((--[\w-]+)\)/)[1] : undefined;
for (const [, rs] of layerRules)
  for (const { selector, decls } of rs) {
    const bg = tokenOf(decls.get('background-color') ?? decls.get('background'));
    if (!bg) continue;
    // Text on its own background: 4.5:1. The one exception is a really
    // inactive control (WCAG 1.4.3, DESIGN.md §4): a rule keyed on :disabled
    // or aria-disabled may set exactly --i-disabled-ink on --i-disabled-bg, and
    // nothing else escapes the floor.
    const fg = decls.get('color')?.match(/^var\((--[\w-]+)\)$/)?.[1];
    const inactive = /:disabled|\[aria-disabled=['"]?true['"]?\]/.test(selector);
    if (fg && inactive && fg === '--i-disabled-ink' && bg === '--i-disabled-bg') {
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
  'diagram.html', 'product-page.html', 'product-page-example.html', 'product-media.html', 'writing.html']);
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
  const shown = [...page.matchAll(/<section class="rule"[^>]*>([\s\S]*?)<\/section>/g)].map(([, body]) => {
    const h = body.match(/<h2[^>]*\sid="([\w-]+)"[^>]*>([^<]+)<\/h2>/);
    const part = (cls) => [...body.matchAll(new RegExp(`<div class="ex ${cls}">`, 'g'))].length;
    const panel = (cls) => body.split(`<div class="ex ${cls}">`)[1]?.split('<div class="ex ')[0] ?? '';
    return { id: h?.[1], title: h?.[2].trim(), dos: part('ex-do'), donts: part('ex-dont'), doText: text(panel('ex-do')), dontText: text(panel('ex-dont')) };
  });
  const sections = (page.match(/<section\b/g) || []).length;
  if (sections !== shown.length) fail(`previews/writing.html: ${sections} sections, ${shown.length} of them <section class="rule">; every section is a rule`);
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

if (failures.length) {
  console.error(failures.map((f) => `✕ ${f}`).join('\n'));
  console.error(`\n${failures.length} problem${failures.length === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log(`✓ ${checked} contrast pairs, one list, no drift, every family on its hue, no stray hex, every preview indexed, one page order, every component shown, every page documented, one icon set, one set of content rules`);
