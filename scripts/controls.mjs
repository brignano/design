// controls.mjs — writes controls.css: components.css without the layout
// primitives (#53), for a site that already has a utility framework.
//
//   node scripts/controls.mjs     (npm run controls)
//
// .container, .stack, .cluster, .grid, .section, .divider and .gap-2 … .gap-6
// share their names with Tailwind utilities. Imported whole, components.css
// gives every Tailwind `grid` auto-fit columns and moves every `gap-4` onto
// the --s scale. controls.css is the same file with those two blocks left out,
// so a Tailwind site keeps its own layout and takes only the controls.
// It is generated, never edited: `npm run check` fails if it has drifted.

import { readFileSync, writeFileSync } from 'node:fs';

const BLOCKS = ['/* ── Layout primitives (#53)', '/* ── Gap modifiers (#53)'];

const HEADER = `/* controls.css — GENERATED from components.css by scripts/controls.mjs.
   Do not edit: change components.css and run \`npm run controls\`.
   The same components without the layout primitives (.container, .stack,
   .cluster, .grid, .section, .divider, .gap-2 … .gap-6), for a site whose
   utility framework already owns those names. DESIGN.md §14. */

`;

// Cut a block from its banner comment to the close of the @layer that follows.
function cut(css, banner) {
  const start = css.indexOf(banner);
  if (start < 0) throw new Error(`controls.mjs: "${banner}" not found in components.css`);
  const open = css.indexOf('{', css.indexOf('@layer', start));
  let depth = 1, i = open + 1;
  while (depth && i < css.length) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  while (css[i] === '\n') i++;
  return css.slice(0, start) + css.slice(i);
}

export function controls(components) {
  return HEADER + BLOCKS.reduce(cut, components);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = new URL('../', import.meta.url);
  writeFileSync(new URL('controls.css', root), controls(readFileSync(new URL('components.css', root), 'utf8')));
  console.log('wrote controls.css');
}
