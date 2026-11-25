// Tests for scripts/audit.mjs:  npm test
// Fixtures are written to a temp folder, so this repo's own no-hex check never
// sees them. The issue lookup is injected: nothing here calls GitHub.

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { audit, formatText, tokenNames } from './audit.mjs';

const names = tokenNames();
const lookupOf = (table) => async (repo, n) => {
  const s = table[`${repo}#${n}`];
  if (s === 'throw') throw new Error('offline');
  return s ?? 'open';
};

async function run(files, options = {}) {
  const cwd = mkdtempSync(join(tmpdir(), 'audit-'));
  try {
    for (const [f, body] of Object.entries(files)) {
      mkdirSync(dirname(join(cwd, f)), { recursive: true });
      writeFileSync(join(cwd, f), body);
    }
    return await audit(options.paths ?? [], { cwd, names, lookup: lookupOf(options.issues ?? {}), ...options });
  } finally { rmSync(cwd, { recursive: true, force: true }); }
}
const rules = (r) => r.findings.map((f) => `${f.rule}@${f.line}`);

test('the package defines the names an app is told to use', () => {
  for (const n of ['--ink', '--action', '--space-3', '--radius-card', '--shadow-2', '--sans', '--mono', '--s1'])
    assert.ok(names.has(n), n);
});

test('a clean file passes', async () => {
  const r = await run({
    'clean.css': `.card { color: var(--ink); background: var(--card); padding: var(--space-4) 0;
  margin: 0 auto; border-radius: var(--radius-card); box-shadow: var(--shadow-2);
  font-family: var(--sans); gap: var(--space-2); border: 1px solid var(--line); }
#hero { color: var(--ink); }
.pill { border-radius: 50%; width: calc(var(--space-4) * 2); }`,
    'page.html': `<a href="#abc">Issue #123</a> <svg><use href="#def"/></svg>
<p style="color: var(--ink-soft); padding: var(--space-2)">hi &#8212; there</p>`,
  });
  assert.deepEqual(r.findings, []);
  assert.equal(r.summary.errors, 0);
});

test('one finding per rule, with file and line', async () => {
  const r = await run({
    'colour.css': `a { color: #1a2b3c; }\nb { background: rgb(1 2 3 / 50%); }\nc { border: 1px solid #fff; }\nd { color: oklch(60% 0.1 256); }\ne { color: rgb(var(--ink) / 50%); }`,
    'font.css': `a { font-family: Inter, sans-serif; }\nb { font-family: var(--mono); }`,
    'radius.css': `a { border-radius: 6px; }\nb { border-top-left-radius: 0.5rem; }\nc { border-radius: var(--radius-sm); }`,
    'shadow.css': `a { box-shadow: 0 1px 2px rgba(0,0,0,.2); }\nb { box-shadow: var(--shadow-1); }\nc { box-shadow: none; }`,
    'space.css': `a { padding: 12px 16px; }\nb { margin: -4px; }\nc { gap: 8px; }\nd { padding: 0 var(--space-2); }`,
    'var.css': `a { color: var(--brand-blue); }\nb { color: var(--ink); }\nc { color: var(--tw-ring-color); }`,
    'tw.tsx': `export const A = () => <div className="bg-[#123456] text-[var(--ink)] hover:bg-[rgb(1,2,3)] p-4" />;`,
  });
  const by = Object.fromEntries(['colour', 'font', 'radius', 'shadow', 'space', 'var', 'tw'].map((k) => [k, r.findings.filter((f) => f.file.startsWith(k))]));
  assert.deepEqual(by.colour.map((f) => f.line), [1, 2, 3, 4]);
  assert.deepEqual(by.font.map((f) => [f.rule, f.line]), [['font-family', 1]]);
  assert.deepEqual(by.radius.map((f) => f.line), [1, 2]);
  assert.deepEqual(by.shadow.map((f) => f.line), [1, 1]); // the shadow and the colour inside it
  assert.deepEqual(by.space.map((f) => f.line), [1, 2, 3]);
  assert.deepEqual(by.var.map((f) => [f.rule, f.line]), [['unknown-token', 1]]);
  assert.deepEqual(by.tw.map((f) => f.rule), ['tailwind-colour', 'tailwind-colour']);
  assert.ok(by.tw.every((f) => f.line === 1));
});

test('spacing is a warning unless asked to be an error', async () => {
  const files = { 'a.css': `a { padding: 12px; }\nb { color: red; border-radius: 4px; }` };
  const soft = await run(files);
  assert.equal(soft.summary.errors, 1);
  assert.equal(soft.summary.warnings, 1);
  const hard = await run(files, { spacing: 'error' });
  assert.equal(hard.summary.errors, 2);
});

test('markup: inline styles, style blocks, JSX objects, SVG attributes', async () => {
  const r = await run({
    'a.html': `<div style="padding: 12px; color: var(--ink)"></div>\n<svg><path fill="#ff00aa"/></svg>\n<style>\n.x { font-family: Arial; }\n</style>`,
    'b.jsx': `const s = { borderRadius: 8, padding: 'var(--space-2)', margin: 0, fontFamily: "'Geist', sans-serif" };`,
    'c.svelte': `<div style="box-shadow: 0 0 0 2px var(--action)">x</div>`,
    'd.astro': `---\n---\n<p class="text-[#abc]">x</p>`,
  });
  const flat = (f) => r.findings.filter((x) => x.file === f).map((x) => `${x.rule}@${x.line}`).sort();
  assert.deepEqual(flat('a.html'), ['colour@2', 'font-family@4', 'spacing@1']);
  assert.deepEqual(flat('b.jsx'), ['border-radius@1', 'font-family@1']);
  assert.deepEqual(flat('c.svelte'), ['box-shadow@1']);
  assert.deepEqual(flat('d.astro'), ['tailwind-colour@3']);
});

test('comments and SVG files are not findings', async () => {
  const r = await run({
    'a.css': `/* old: #123456 and border-radius: 9px */\na { color: var(--ink); }`,
    'b.html': `<!-- color: #fff -->\n<p>ok</p>`,
    'logo.svg': `<svg><path fill="#123456"/></svg>`,
  });
  assert.deepEqual(r.findings, []);
  assert.equal(r.summary.files, 2);
});

test('an exception on an open issue passes and is counted', async () => {
  const r = await run({
    'a.css': `/* design-exception: brignano/design#123 */\na { color: #123456; }\nb { color: #abcdef; /* design-exception: brignano/design#123 */ }\n\nc { color: #fedcba; }`,
  }, { issues: { 'brignano/design#123': 'open' } });
  assert.deepEqual(rules(r), ['colour@5']);
  assert.equal(r.summary.openExceptions, 2);
});

test('an exception on a closed issue fails', async () => {
  const r = await run({ 'a.css': `/* design-exception: brignano/design#9 */\na { color: #123456; }` },
    { issues: { 'brignano/design#9': 'closed' } });
  assert.equal(r.findings.length, 1);
  assert.match(r.findings[0].message, /brignano\/design#9 is closed/);
  assert.equal(r.summary.openExceptions, 0);
  assert.equal(r.summary.closedExceptions, 1);
});

test('a lookup that fails passes with a warning', async () => {
  const r = await run({ 'a.css': `/* design-exception: brignano/design#5 */\na { color: #123456; }` },
    { issues: { 'brignano/design#5': 'throw' } });
  assert.deepEqual(r.findings, []);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /offline/);
});

test('.gitignore, node_modules and design-audit.ignore are skipped; explicit paths are not', async () => {
  const bad = `a { color: #123456; }`;
  const files = {
    '.gitignore': 'dist/\n*.generated.css\n',
    'design-audit.ignore': 'vendor\n',
    'src/a.css': bad, 'dist/b.css': bad, 'src/c.generated.css': bad,
    'node_modules/x/d.css': bad, 'vendor/e.css': bad,
  };
  const r = await run(files);
  assert.deepEqual([...new Set(r.findings.map((f) => f.file))], ['src/a.css']);
  const explicit = await run(files, { paths: ['dist/b.css'] });
  assert.deepEqual(explicit.findings.map((f) => f.file), ['dist/b.css']);
});

test('text output names file:line and counts exceptions', async () => {
  const r = await run({ 'a.css': `a {\n  color: #123456;\n}` });
  const text = formatText(r);
  assert.match(text, /^a\.css:2:\d+ {2}error {2}colour/);
  assert.match(text, /1 error, 0 warnings, 0 open exceptions/);
});
