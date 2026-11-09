// email-tokens.mjs — fills an email template's colours from tokens.css.
//
//   node scripts/email-tokens.mjs [template] > email.html
//
// Email clients can't read CSS custom properties, so templates/email.html
// names each colour as a token in double braces, like {{--ink}}, and this
// script swaps each one for the token's light-theme value (email is light
// only: client dark modes rewrite colours unpredictably). Translucent tokens are flattened onto --card, the
// email's surface. Content placeholders ({{heading}}, {{button_url}}, …) are
// left for your app to fill. Exits non-zero, naming the token, if one can't be
// resolved, so a renamed token fails loudly instead of sending a blank colour.
//
// No dependencies; the colour maths is colour.mjs, shared with check.mjs,
// which also imports resolveLight and TOKEN from here.

import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, split, toHex } from './colour.mjs';

const here = (p) => new URL(`../${p}`, import.meta.url);
export const TOKEN = /\{\{(--[\w-]+)\}\}/g;

// The first declaration of each custom property in tokens.css (the :root block).
export function tokenMap(css = readFileSync(here('tokens.css'), 'utf8')) {
  const map = new Map();
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) if (!map.has(m[1])) map.set(m[1], m[2].trim());
  return map;
}

// Light-theme value of a token as #rrggbb, flattened onto --card when translucent.
export function resolveLight(name, map = tokenMap()) {
  if (!map.has(name)) throw new Error(`${name} is not a token in tokens.css`);
  const light = new Map([...map].map(([k, v]) => {
    const ld = v.match(/^light-dark\((.*)\)$/s);
    return [k, ld ? split(ld[1])[0] : v];
  }));
  const c = resolve(`var(${name})`, light);
  if (c.alpha === 1) return toHex(c.rgb);
  const card = resolve('var(--card)', light).rgb;
  return toHex(c.rgb.map((v, i) => v * c.alpha + card[i] * (1 - c.alpha)));
}

export function fill(html, map = tokenMap()) {
  return html.replace(TOKEN, (_, name) => resolveLight(name, map));
}

// argv[1] keeps a symlinked path (pnpm, npm link, workspaces) while
// import.meta.url is the real file, so compare real paths.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2] ?? fileURLToPath(here('templates/email.html'));
  try {
    process.stdout.write(fill(readFileSync(file, 'utf8')));
  } catch (e) {
    console.error(`email-tokens: ${e.message}`);
    process.exit(1);
  }
}
