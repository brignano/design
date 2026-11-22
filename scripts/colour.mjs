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

// ── OKLCH, for the theme generator (scripts/theme.mjs) ───────────────────────
// A theme is authored as a hue and a few named steps of lightness and chroma.
// These turn a step into the sRGB hex the rest of the system reads.
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function oklchToLinear(l, c, h) {
  const a = c * Math.cos((h * Math.PI) / 180), b = c * Math.sin((h * Math.PI) / 180);
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}
const inGamut = (rgb) => rgb.every((c) => c >= -0.0005 && c <= 1.0005);

// OKLCH to hex. A colour sRGB can't show keeps its lightness and hue and
// gives up chroma until it fits, so a step never changes how light it is.
export function oklchToHex(l, c, h) {
  let lin = oklchToLinear(l, c, h);
  if (!inGamut(lin)) {
    let lo = 0, hi = c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear(l, mid, h))) lo = mid; else hi = mid;
    }
    lin = oklchToLinear(l, lo, h);
  }
  return toHex(lin.map((v) => Math.min(255, Math.max(0, toSrgb(Math.min(1, Math.max(0, v))) * 255))));
}

// WCAG contrast between two hexes.
export function contrast(a, b) {
  const lum = (h) => {
    const [r, g, bl] = hex(h).map((c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
