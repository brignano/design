// email-tokens.mjs — fills an email template's colours from tokens.css.
//
//   node scripts/email-tokens.mjs [template] > email.html
//
// Email clients can't read CSS custom properties, so templates/email.html
// names each colour as a token in double braces, like {{--ink}}, and this
// script swaps each one for the token's light-theme value (email is light only: client dark modes rewrite
// colours unpredictably). Translucent tokens are flattened onto --card, the
// email's surface. Content placeholders ({{heading}}, {{button_url}}, …) are
// left for your app to fill. Exits non-zero, naming the token, if one can't be
// resolved, so a renamed token fails loudly instead of sending a blank colour.
//
// No dependencies. Also imported by scripts/check.mjs (resolveLight, TOKEN).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => new URL(`../${p}`, import.meta.url);
export const TOKEN = /\{\{(--[\w-]+)\}\}/g;

// Top-level comma split, so light-dark(color-mix(…, x), y) splits once.
const split = (s) => {
  const out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    else if (s[i] === ',' && depth === 0) { out.push(s.slice(start, i).trim()); start = i + 1; }
  }
  out.push(s.slice(start).trim());
  return out;
};

const hex = (h) => {
  h = h.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const toHex = (rgb) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

// The first declaration of each custom property in tokens.css (the :root block).
export function tokenMap(css = readFileSync(here('tokens.css'), 'utf8')) {
  const map = new Map();
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) if (!map.has(m[1])) map.set(m[1], m[2].trim());
  return map;
}

// Light-theme value of a token as #rrggbb, flattened onto --card when translucent.
export function resolveLight(name, map = tokenMap()) {
  const walk = (value, seen) => {
    value = value.trim();
    const ld = value.match(/^light-dark\((.*)\)$/s);
    if (ld) return walk(split(ld[1])[0], seen);
    const ref = value.match(/^var\((--[\w-]+)\)$/);
    if (ref) {
      if (seen.has(ref[1]) || !map.has(ref[1])) throw new Error(`cannot resolve ${ref[1]}`);
      return walk(map.get(ref[1]), new Set([...seen, ref[1]]));
    }
    if (/^#[0-9a-f]{3,6}$/i.test(value)) return { rgb: hex(value), alpha: 1 };
    const mix = value.match(/^color-mix\(in srgb,\s*(.+?)\s+([\d.]+)%,\s*transparent\)$/);
    if (mix) {
      const c = walk(mix[1], seen);
      return { rgb: c.rgb, alpha: c.alpha * (+mix[2] / 100) };
    }
    throw new Error(`unsupported colour value: ${value}`);
  };
  if (!map.has(name)) throw new Error(`${name} is not a token in tokens.css`);
  const c = walk(map.get(name), new Set([name]));
  if (c.alpha === 1) return toHex(c.rgb);
  const card = walk(map.get('--card'), new Set(['--card'])).rgb;
  return toHex(c.rgb.map((v, i) => v * c.alpha + card[i] * (1 - c.alpha)));
}

export function fill(html, map = tokenMap()) {
  return html.replace(TOKEN, (_, name) => resolveLight(name, map));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2] ?? fileURLToPath(here('templates/email.html'));
  try {
    process.stdout.write(fill(readFileSync(file, 'utf8')));
  } catch (e) {
    console.error(`email-tokens: ${e.message}`);
    process.exit(1);
  }
}
