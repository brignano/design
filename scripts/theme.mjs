// theme.mjs — a product's theme file in, the tokens it sets out.
//
// A theme is a few lines a person can read (themes/<product>.theme):
//
//   kit: larch            # split, ledger or larch: the look it starts from
//   ground: wash          # plain (the kit's), bright or wash
//   scheme: dark          # leave out for both; dark pins the product dark
//   hue: 355              # what acts, as an OKLCH hue, 0 to 360
//   typeface: onest       # headings; `mono` sets everything in the kit's mono
//   heading-weight: 500
//   corners: 16           # px, or `pill`
//   shell: conversation   # the shape of the main screen (ADR-0019)
//
// A key left out takes the kit's value. scripts/build.mjs lays what this
// returns over the kit and writes themes/<product>.css; it refuses a theme
// whose colours miss a contrast floor (gate(), below).
//
// THE STEPS. Every derived colour is a fixed lightness and chroma at the
// theme's hue, [light, dark]. They are written out here, once, so a theme is
// a hue and never a palette. Measured results for the five shipped themes are
// in DESIGN.md §11.
import { oklchToHex, contrast } from './colour.mjs';

export const KEYS = ['kit', 'ground', 'scheme', 'hue', 'typeface', 'heading-weight', 'corners', 'shell'];
const KITS = ['split', 'ledger', 'larch'];
const GROUNDS = ['plain', 'bright', 'wash'];
const SHELLS = ['console', 'canvas', 'player', 'conversation', 'document'];
const FACES = {
  archivo: "'Archivo', system-ui, sans-serif",
  'martian-mono': "'Martian Mono', ui-monospace, monospace",
  newsreader: "'Newsreader', Georgia, serif",
  'instrument-sans': "'Instrument Sans', system-ui, sans-serif",
  'bricolage-grotesque': "'Bricolage Grotesque', system-ui, sans-serif",
  onest: "'Onest', system-ui, sans-serif",
  'ibm-plex-mono': "'IBM Plex Mono', ui-monospace, monospace",
};

// Ground, by hue. [l, c] light then dark. The card is lighter than the page
// in light: state marks and chart series need a surface near white (ADR-0020).
const GROUND = {
  bright: {
    bg: [[0.975, 0.008], [0.17, 0.02]], card: [[0.995, 0.003], [0.225, 0.026]],
    'surface-hover': [[0.96, 0.012], [0.265, 0.03]], 'surface-active': [[0.935, 0.016], [0.3, 0.032]],
  },
  wash: {
    bg: [[0.95, 0.032], [0.19, 0.025]], card: [[0.985, 0.012], [0.24, 0.03]],
    'surface-hover': [[0.96, 0.02], [0.28, 0.034]], 'surface-active': [[0.935, 0.026], [0.315, 0.036]],
  },
};
// Text and lines on a hued ground.
const TEXT = {
  ink: [[0.21, 0.03], [0.96, 0.012]], 'ink-soft': [[0.38, 0.033], [0.84, 0.02]], slate: [[0.46, 0.033], [0.74, 0.025]],
  line: [[0.9, 0.02], [0.32, 0.03]], 'line-soft': [[0.93, 0.018], [0.27, 0.028]], 'line-strong': [[0.8, 0.024], [0.42, 0.034]],
  'line-control': [[0.56, 0.045], [0.63, 0.045]], 'disabled-ink': [[0.62, 0.025], [0.52, 0.025]],
};
// The action colour, two ways.
//   signal: a bright fill with an ink label (Split). The same in both schemes.
//   deep:   a deep fill with a light label in light, a pale fill with a dark
//           label in dark (Ledger, Larch).
const SIGNAL = { action: [0.84, 0.12], 'action-hover': [0.78, 0.115], 'action-pressed': [0.72, 0.11] };
const DEEP = {
  action: [[0.5, 0.2], [0.8, 0.12]], 'action-hover': [[0.44, 0.19], [0.74, 0.12]], 'action-pressed': [[0.38, 0.17], [0.68, 0.115]],
  'action-ink-hover': [[0.4, 0.18], [0.89, 0.08]],
};

export function parse(name, text) {
  const out = {};
  text.split('\n').forEach((raw, i) => {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) return;
    const m = line.match(/^([a-z-]+):\s*(.+)$/);
    if (!m) throw new Error(`themes/${name}.theme:${i + 1}: expected \`key: value\`, got \`${raw.trim()}\``);
    if (!KEYS.includes(m[1])) throw new Error(`themes/${name}.theme:${i + 1}: \`${m[1]}\` is not a theme key (${KEYS.join(', ')})`);
    if (m[1] in out) throw new Error(`themes/${name}.theme:${i + 1}: \`${m[1]}\` is set twice`);
    out[m[1]] = m[2].trim();
  });
  const need = (ok, key, hint) => { if (!ok) throw new Error(`themes/${name}.theme: \`${key}: ${out[key]}\` ${hint}`); };
  if (!out.kit) throw new Error(`themes/${name}.theme: a theme names its \`kit\` (${KITS.join(', ')})`);
  need(KITS.includes(out.kit), 'kit', `is not a kit (${KITS.join(', ')})`);
  if ('ground' in out) need(GROUNDS.includes(out.ground), 'ground', `is not a ground (${GROUNDS.join(', ')})`);
  if ('scheme' in out) need(out.scheme === 'dark', 'scheme', 'must be `dark`; leave the key out for both schemes');
  if ('hue' in out) need(/^\d+(\.\d+)?$/.test(out.hue) && +out.hue <= 360, 'hue', 'must be a number from 0 to 360');
  if ('typeface' in out) need(out.typeface === 'mono' || out.typeface in FACES, 'typeface', `is not a face this system ships (mono, ${Object.keys(FACES).join(', ')})`);
  if ('heading-weight' in out) need(/^[1-9]00$/.test(out['heading-weight']), 'heading-weight', 'must be 100 to 900');
  if ('corners' in out) need(out.corners === 'pill' || /^\d+$/.test(out.corners), 'corners', 'must be a number of px, or `pill`');
  if ('shell' in out) need(SHELLS.includes(out.shell), 'shell', `is not a shell (${SHELLS.join(', ')})`);
  if ((out.ground ?? 'plain') !== 'plain' && !('hue' in out)) throw new Error(`themes/${name}.theme: \`ground: ${out.ground}\` is tinted with the theme's hue, so it needs a \`hue\``);
  return out;
}

// One light-dark() declaration from two [l, c] steps at a hue.
const pair = ([light, dark], h) => `light-dark(${oklchToHex(light[0], light[1], h)}, ${oklchToHex(dark[0], dark[1], h)})`;
const sides = (value) => {
  const m = value.match(/^light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)$/i);
  if (!m) throw new Error(`expected light-dark(#hex, #hex), got ${value}`);
  return [m[1], m[2]];
};
const wash = ([l, d], lp, dp) => `light-dark(color-mix(in srgb, ${l} ${lp}%, transparent), color-mix(in srgb, ${d} ${dp}%, transparent))`;

// The tokens a theme sets on top of its kit. `kit` is the kit's own tokens,
// name -> value, so a step can read what it sits on (the ink, the page).
export function derive(theme, kit) {
  const set = new Map();
  const h = +theme.hue;
  const ground = theme.ground ?? 'plain';

  if (ground !== 'plain') {
    for (const [k, steps] of Object.entries({ ...GROUND[ground], ...TEXT })) set.set(k, pair(steps, h));
    const [cardLight] = sides(set.get('card')), [, bgDark] = sides(set.get('bg'));
    set.set('surface-sticky', `light-dark(color-mix(in srgb, ${cardLight} 92%, transparent), color-mix(in srgb, ${bgDark} 92%, transparent))`);
    set.set('on-dark', set.get('bg'));
    set.set('disabled', set.get('surface-active'));
    // charts sit on the lightest paper in light, the card in dark
    set.set('chart-surface', `light-dark(${oklchToHex(0.995, 0.003, h)}, ${sides(set.get('card'))[1]})`);
  }
  const now = (k) => set.get(k) ?? kit.get(k);

  if ('hue' in theme) {
    if (theme.kit === 'split') {
      // signal: one bright fill, the kit's ink as its label, in both schemes.
      const [inkLight] = sides(kit.get('ink'));
      for (const [k, [l, c]] of Object.entries(SIGNAL)) { const x = oklchToHex(l, c, h); set.set(k, `light-dark(${x}, ${x})`); }
      const [fill] = sides(set.get('action'));
      set.set('on-action', `light-dark(${inkLight}, ${inkLight})`);
      // the fill carries itself where it can be found on the page; else ink does
      const edge = sides(now('bg')).map((bg, i) => (contrast(fill, bg) >= 3 ? fill : sides(now('ink'))[i]));
      set.set('action-edge', `light-dark(${edge[0]}, ${edge[1]})`);
      set.set('accent', set.get('action'));
      set.set('on-accent', set.get('on-action'));
    } else {
      for (const [k, steps] of Object.entries(DEEP)) set.set(k, pair(steps, h));
      const [, bgDark] = sides(now('bg'));
      set.set('on-action', `light-dark(${oklchToHex(0.99, 0.004, h)}, ${bgDark})`);
      set.set('action-edge', set.get('action'));
      set.set('action-ink', set.get('action'));
    }
    const fills = sides(set.get('action'));
    set.set('action-surface', wash(fills, 12, 20));
    set.set('action-line', wash(fills, 32, 44));
    set.set('action-selection', wash(fills, 26, 30));
  }

  if (theme.typeface === 'mono') {
    set.set('sans', kit.get('mono'));
    set.set('display', kit.get('mono'));
    set.set('display-stretch', 'normal');
  } else if (theme.typeface) set.set('display', FACES[theme.typeface]);
  if (theme['heading-weight']) set.set('weight-heavy', theme['heading-weight']);
  if (theme.corners === 'pill') { set.set('button-radius', '999px'); set.set('pill-radius', '999px'); }
  else if (theme.corners) {
    const n = +theme.corners;
    set.set('radius-sm', `${Math.round(n / 2)}px`);
    set.set('radius-control', `${n}px`);
    set.set('radius-card', `${Math.round(n * 1.5)}px`);
    set.set('radius-lg', `${n * 2}px`);
  }
  return set;
}

// The generator's own gate: the floors a theme can break by its hue or
// ground. `npm run check` then holds the built file to every token floor.
// Returns the failures as sentences; none means the theme may be written.
export function gate(name, tokens, schemes) {
  const TEXT_FLOOR = 4.5, EDGE_FLOOR = 3;
  const get = (k, i) => {
    let v = tokens.get(k);
    for (let n = 0; n < 8 && /^var\(--/.test(v); n++) v = tokens.get(v.slice(6, -1));
    return sides(v)[i];
  };
  const pairs = [];
  for (const bg of ['bg', 'card']) {
    for (const fg of ['ink', 'ink-soft', 'slate', 'action-ink', 'action-ink-hover']) pairs.push([fg, bg, TEXT_FLOOR]);
    pairs.push(['line-control', bg, EDGE_FLOOR]);
  }
  for (const bg of ['action', 'action-hover', 'action-pressed']) pairs.push(['on-action', bg, TEXT_FLOOR]);
  pairs.push(['on-accent', 'accent', TEXT_FLOOR], ['ink', 'surface-hover', TEXT_FLOOR], ['ink', 'surface-active', TEXT_FLOOR]);
  const out = [];
  for (const [label, i] of schemes) {
    for (const [fg, bg, floor] of pairs) {
      const r = contrast(get(fg, i), get(bg, i));
      if (r < floor) out.push(`themes/${name}.theme (${label}): --${fg} on --${bg} is ${r.toFixed(2)}:1 (${get(fg, i)} on ${get(bg, i)}), needs ${floor}:1`);
    }
    for (const bg of ['bg', 'card']) {
      const r = Math.max(contrast(get('action', i), get(bg, i)), contrast(get('action-edge', i), get(bg, i)));
      if (r < EDGE_FLOOR) out.push(`themes/${name}.theme (${label}): neither --action nor --action-edge reaches ${EDGE_FLOOR}:1 on --${bg} (${r.toFixed(2)}:1)`);
    }
  }
  return out;
}
