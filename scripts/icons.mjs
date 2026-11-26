// Gives every file in icons/ the stroke rule as tokens (ADR-0025).
//
// Lucide's files carry stroke-width="2" stroke-linecap="round"
// stroke-linejoin="round" on the <svg>. A kit draws its own rule (Split 1.5
// square/miter, Ledger 1.5 butt/miter, Larch 1.75 round), so the files read
// --icon-stroke, --icon-cap and --icon-join instead, with Lucide's values as
// the fallback for an <img> or a page without the tokens.
//
//   node scripts/icons.mjs        rewrite icons/*.svg (safe to re-run)
//   node scripts/icons.mjs --check   exit 1 if any file would change
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

export const ICON_STYLE = 'stroke-width: var(--icon-stroke, 2); stroke-linecap: var(--icon-cap, round); stroke-linejoin: var(--icon-join, round)';

export function applyRule(svg) {
  return svg.replace(/<svg\b[^>]*>/, (head) => {
    const clean = head
      .replace(/\s+(stroke-width|stroke-linecap|stroke-linejoin|style)\s*=\s*(["']).*?\2/g, '')
      .replace(/\s*>$/, '');
    return `${clean}\n  style="${ICON_STYLE}"\n>`;
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = new URL('../icons/', import.meta.url);
  let changed = 0;
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.svg'))) {
    const before = readFileSync(new URL(f, dir), 'utf8');
    const after = applyRule(before);
    if (after !== before) { changed++; if (!process.argv.includes('--check')) writeFileSync(new URL(f, dir), after); }
  }
  console.log(process.argv.includes('--check') ? `${changed} icons out of step` : `rewrote ${changed} icons`);
  if (process.argv.includes('--check') && changed) process.exit(1);
}
