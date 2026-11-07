// colour.mjs — the one colour resolver, shared by check.mjs and
// email-tokens.mjs so the two can't drift. No dependencies.

export function hex(h) {
  h = h.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
export const toHex = (rgb) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

// Resolves a value to { rgb, alpha } against a map of one theme's tokens.
// Handles hex, var() and the one color-mix form the tokens use:
// color-mix(in srgb, X N%, transparent).
export function resolve(value, map, seen = new Set()) {
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

// Splits on top-level commas, so light-dark(color-mix(…, x), y) splits once.
export function split(s) {
  const out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    else if (s[i] === ',' && depth === 0) { out.push(s.slice(start, i).trim()); start = i + 1; }
  }
  out.push(s.slice(start).trim());
  return out;
}
