// audit.mjs — the check an app runs on itself: did it style around the system?
//
//   npx @brignano/design audit [paths] [--json] [--spacing=warn|error]
//
// Scans CSS, HTML, JSX/TSX, Astro and Svelte files. A finding is a colour
// literal, a font-family / border-radius / box-shadow / spacing value that
// isn't a token, a Tailwind arbitrary colour, or a var(--name) the package
// doesn't define. One escape hatch, on or above the line:
//
//   /* design-exception: brignano/design#123 */
//
// It passes while that issue is open and fails once it is closed. A lookup
// that fails passes with a warning, so CI never breaks on a network error.
// ADR-0021 in DESIGN.md §12; the docs page is previews/audit.html.
//
// No dependencies on purpose, like the rest of the package. This file reads
// no network and no cwd by itself: the CLI (cli.mjs) wires those in, and
// tests inject the issue lookup.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = fileURLToPath(new URL('../', import.meta.url));
export const EXTENSIONS = new Set(['.css', '.html', '.htm', '.jsx', '.tsx', '.astro', '.svelte']);
const ALWAYS_SKIP = new Set(['node_modules', '.git']);
const JS_LIKE = new Set(['.jsx', '.tsx', '.astro', '.svelte']);

// ── What the package defines ─────────────────────────────────────────────────
// Every custom property declared in the token files, the kits and the themes.
export function tokenNames(pkg = PKG) {
  const names = new Set();
  const files = ['tokens.css', 'tokens.chart.css'];
  for (const dir of ['kits', 'themes'])
    if (existsSync(join(pkg, dir)))
      for (const f of readdirSync(join(pkg, dir))) if (f.endsWith('.css')) files.push(`${dir}/${f}`);
  for (const f of files) {
    if (!existsSync(join(pkg, f))) continue;
    const css = readFileSync(join(pkg, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/(?<![\w-])(--[\w-]+)\s*:/g)) names.add(m[1]);
  }
  return names;
}
// Tailwind's own internals are not the app's to define.
const FOREIGN = /^--tw-/;

// ── Reading a source file ────────────────────────────────────────────────────
const blank = (s) => s.replace(/[^\n]/g, ' ');
// Comments out, positions kept, so a line number in the stripped text is the
// line number in the file. Exceptions are read from the raw text instead.
const stripComments = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/<!--[\s\S]*?-->/g, blank);

function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}
function where(starts, index) {
  let lo = 0, hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= index) lo = mid; else hi = mid - 1;
  }
  return { line: lo + 1, column: index - starts[lo] + 1 };
}

// The value after `prop:` up to its end. CSS ends at ; or }. In a JS-like file
// a top-level comma also ends it, because there it separates object keys
// (`{ padding: 12, margin: 0 }`); a comma inside quotes or parens never does.
function readValue(text, from, jsLike) {
  let depth = 0, quote = null, quoted = false, i = from;
  for (; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === quote) { quote = null; } continue; }
    if (c === '"' || c === "'" || c === '`') {
      if (i === from || /^\s*$/.test(text.slice(from, i))) { quote = c; quoted = true; continue; }
      if (depth === 0) break; // the quote that closes the attribute this value sits in
      quote = c; continue;
    }
    if (c === '(') depth++;
    else if (c === ')') { if (depth === 0) break; depth--; }
    else if (depth === 0 && (c === ';' || c === '}' || c === '{')) break;
    else if (depth === 0 && c === '\n' && jsLike && !quoted) break;
    else if (depth === 0 && c === ',' && jsLike && (quoted || /^\s*[\w.-]+\s*$/.test(text.slice(from, i)))) break;
  }
  return { raw: text.slice(from, i), end: i };
}
const unquote = (v) => v.trim().replace(/^(["'`])([\s\S]*)\1$/, '$2').replace(/\s*!important\s*$/i, '').trim();

// Top-level split on a character, ignoring any inside parens or quotes.
function splitTop(value, sep) {
  const out = [];
  let depth = 0, quote = null, last = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (depth === 0 && (sep === ' ' ? /\s/.test(c) : c === sep)) {
      if (i > last || sep !== ' ') out.push(value.slice(last, i).trim());
      last = i + 1;
    }
  }
  out.push(value.slice(last).trim());
  return out.filter((s) => s !== '');
}

// ── The rules ────────────────────────────────────────────────────────────────
const KEYWORDS = /^(inherit|initial|unset|revert|revert-layer|none|auto|normal)$/i;
const LENGTH = /^[+-]?(\d+\.?\d*|\.\d+)(px|rem|em|ch|ex|vw|vh|vmin|vmax|pt|pc|cm|mm|in|cqw|cqh|cqi|cqb)?$/i;
const isZero = (s) => /^[+-]?0*\.?0+(px|rem|em)?$/i.test(s);

// A length that is not zero, not a percentage and not read from a token.
function literalLength(part) {
  if (part.includes('var(') || part.startsWith('env(')) return false;
  if (/^(calc|min|max|clamp)\(/i.test(part)) return /\d(px|rem|em)\b/i.test(part);
  if (part.endsWith('%')) return false;
  return LENGTH.test(part) && !isZero(part);
}

// font-family / box-shadow: the whole value is a token, or a list of them.
function onlyTokens(value) {
  const items = splitTop(value, ',');
  return items.length > 0 && items.every((s) => KEYWORDS.test(s) || /^var\(.*\)$/.test(s));
}

const SPACING = /^(padding|margin)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$|^(gap|row-gap|column-gap|grid-gap)$/;
const RADIUS = /^border(-(top|bottom|start|end)(-(left|right|start|end))?)?-radius$/;
const kebab = (p) => p.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

// Each check returns a message or null for one declaration's value.
function checkDeclaration(prop, value) {
  if (prop === 'font-family')
    return onlyTokens(value) ? null : 'font-family is not a token (use var(--sans), var(--mono) or var(--display))';
  if (prop === 'box-shadow')
    return onlyTokens(value) ? null : 'box-shadow is not a token (use var(--shadow-1), var(--shadow-2) or var(--shadow-3))';
  if (RADIUS.test(prop)) {
    const bad = splitTop(value.replace(/\//g, ' '), ' ').find(literalLength);
    return bad ? `${prop} ${bad} is not a token (use var(--radius-sm), var(--radius-control), var(--radius-card) or var(--radius-lg))` : null;
  }
  if (SPACING.test(prop)) {
    const bad = splitTop(value, ' ').find(literalLength);
    return bad ? `${prop} ${bad} is not a token (use var(--space-1) to var(--space-9))` : null;
  }
  return null;
}
const PROPS = [
  'font-family', 'box-shadow', 'gap', 'row-gap', 'column-gap', 'grid-gap',
  'padding(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?',
  'margin(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?',
  'border(?:-(?:top|bottom|start|end)(?:-(?:left|right|start|end))?)?-radius',
];
const camel = (p) => p.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const DECL = new RegExp(
  `(?<![\\w-])(${PROPS.join('|')}|${PROPS.map(camel).join('|')})["']?\\s*:\\s*`, 'g');

const COLOR_FN = /(?<![\w-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/gi;
const TAILWIND_COLOR = /(?<![\w-])(?:[\w-]+:)*-?(?:bg|text|border(?:-[trblxyse])?|ring|ring-offset|fill|stroke|from|via|to|outline|decoration|accent|caret|shadow|divide|placeholder)-\[(?:#|rgba?\(|hsla?\(|hwb\(|lab\(|lch\(|oklab\(|oklch\()[^\]]*\]/g;
const HEX = /#[0-9a-f]{3,8}(?![\w-])/gi;

// A hex that is a colour, not an anchor, an id, a selector or an issue number.
function isColourHex(text, index, token) {
  const before = text.slice(Math.max(0, index - 40), index);
  const after = text.slice(index + token.length);
  if (/(?<![\w-])(?:href|id|for|xlink:href|aria-[\w-]+)\s*=\s*["']?\s*$/i.test(before) || /url\(\s*["']?$/.test(before)) return false;
  if (/&$/.test(before)) return false; // &#8212;
  if (/[\w-]$/.test(before)) return false;
  if (token.length !== 4 && token.length !== 5 && token.length !== 7 && token.length !== 9) return false;
  // Straight after : ( , or a quote, it is a value.
  if (/[:(,"'`=]\s*$/.test(before)) return !/^\s*[{]/.test(after);
  // After a space it is a value only inside a declaration (`border: 1px solid <hex>`).
  const lineBefore = before.slice(before.lastIndexOf('\n') + 1);
  return /[\w-]\s*:\s*[^;{}]*\s$/.test(lineBefore) && !/^\s*[{]/.test(after);
}

export function scanSource(text, ext, names) {
  const jsLike = JS_LIKE.has(ext);
  const clean = stripComments(text);
  const starts = lineStarts(clean);
  const found = [];
  const add = (index, rule, message, severity = 'error') =>
    found.push({ ...where(starts, index), rule, message, severity, _i: index });

  // Tailwind arbitrary colours first, so the literal inside them isn't reported twice.
  const spans = [];
  for (const m of clean.matchAll(TAILWIND_COLOR)) {
    spans.push([m.index, m.index + m[0].length]);
    add(m.index, 'tailwind-colour', `${m[0]} is an arbitrary colour (use a colour token class)`);
  }
  const inSpan = (i) => spans.some(([a, b]) => i >= a && i < b);

  for (const m of clean.matchAll(HEX))
    if (!inSpan(m.index) && isColourHex(clean, m.index, m[0]))
      add(m.index, 'colour', `colour literal ${m[0]} (use a colour token)`);
  for (const m of clean.matchAll(COLOR_FN)) {
    if (inSpan(m.index)) continue;
    const { raw } = readValue(clean, m.index + m[0].length - 1, false);
    // rgb(var(--x) / 50%) and rgb(from var(--x) r g b) read a token.
    const args = clean.slice(m.index + m[0].length, clean.indexOf(')', m.index));
    if (/var\(|\bfrom\b/.test(args) || raw === '') continue;
    add(m.index, 'colour', `colour literal ${m[1]}() (use a colour token)`);
  }

  for (const m of clean.matchAll(DECL)) {
    const prop = kebab(m[1]);
    const { raw } = readValue(clean, m.index + m[0].length, jsLike);
    const value = unquote(raw);
    if (value === '') continue;
    // A bare number in an object (`padding: 12`) is pixels.
    const message = checkDeclaration(prop, /^[+-]?\d+(\.\d+)?$/.test(value) && !isZero(value) ? `${value}px` : value);
    if (message) add(m.index, SPACING.test(prop) ? 'spacing' : prop === 'font-family' ? 'font-family' : prop === 'box-shadow' ? 'box-shadow' : 'border-radius', message);
  }

  for (const m of clean.matchAll(/var\(\s*(--[\w-]+)/g))
    if (!names.has(m[1]) && !FOREIGN.test(m[1])) add(m.index, 'unknown-token', `${m[1]} is not defined by @brignano/design`);

  // One finding per place and rule.
  const seen = new Set();
  return found
    .sort((a, b) => a._i - b._i)
    .filter((f) => { const k = `${f.line}:${f.column}:${f.rule}`; return seen.has(k) ? false : (seen.add(k), true); })
    .map(({ _i, ...f }) => f);
}

// ── The escape hatch ─────────────────────────────────────────────────────────
const EXCEPTION = /design-exception:\s*([\w.-]+\/[\w.-]+)#(\d+)/;
export function exceptionsIn(text) {
  const out = new Map();
  text.split('\n').forEach((line, i) => {
    const m = line.match(EXCEPTION);
    if (m) out.set(i + 1, { repo: m[1], number: Number(m[2]) });
  });
  return out;
}

// 'open' | 'closed'; throws when it can't tell. No token: the issues are public.
export async function githubIssueState(repo, number) {
  const res = await fetch(`https://api.github.com/repos/${repo}/issues/${number}`, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'brignano-design-audit' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  return (await res.json()).state === 'closed' ? 'closed' : 'open';
}

// ── Which files ──────────────────────────────────────────────────────────────
// A small .gitignore reader: names, dir/, globs, anchored paths. No negation.
export function ignoreMatcher(lines) {
  const rules = [];
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('!')) continue;
    const dirOnly = line.endsWith('/');
    const anchored = line.includes('/') && !/^\*\*\//.test(line) ? true : false;
    const body = line.replace(/^\/+|\/+$/g, '').replace(/^\*\*\//, '');
    const re = body
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]').replace(/\u0000/g, '.*');
    rules.push({ dirOnly, re: new RegExp(anchored ? `^${re}(/.*)?$` : `(^|/)${re}(/.*)?$`) });
  }
  return (rel) => rules.some((r) => r.re.test(rel));
}
const readLines = (p) => (existsSync(p) ? readFileSync(p, 'utf8').split('\n') : []);

export function collectFiles(paths, cwd) {
  const ignored = ignoreMatcher([...readLines(join(cwd, '.gitignore')), ...readLines(join(cwd, 'design-audit.ignore'))]);
  const files = [];
  const walk = (abs, explicit) => {
    const rel = relative(cwd, abs).split(sep).join('/');
    const st = statSync(abs);
    if (st.isDirectory()) {
      if (ALWAYS_SKIP.has(abs.split(sep).pop())) return;
      if (rel && ignored(rel)) return;
      for (const f of readdirSync(abs).sort()) walk(join(abs, f), false);
    } else if (EXTENSIONS.has(extname(abs).toLowerCase()) && (explicit || !ignored(rel))) {
      files.push(abs);
    }
  };
  for (const p of paths) {
    const abs = resolve(cwd, p);
    if (!existsSync(abs)) throw new Error(`no such path: ${p}`);
    walk(abs, true);
  }
  return files;
}

// ── The audit ────────────────────────────────────────────────────────────────
// options: { cwd, spacing: 'warn' | 'error', lookup(repo, number), names }
export async function audit(paths, options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const spacing = options.spacing ?? 'warn';
  const lookup = options.lookup ?? githubIssueState;
  const names = options.names ?? tokenNames();
  const files = collectFiles(paths.length ? paths : ['.'], cwd);

  const findings = [], exceptions = [], warnings = [];
  const states = new Map();
  const stateOf = async (repo, number) => {
    const key = `${repo}#${number}`;
    if (!states.has(key)) {
      try { states.set(key, await lookup(repo, number)); }
      catch (e) { states.set(key, 'unknown'); warnings.push(`could not look up ${key} (${e.message}); treating the exception as open`); }
    }
    return states.get(key);
  };

  for (const abs of files) {
    const file = relative(cwd, abs).split(sep).join('/');
    const text = readFileSync(abs, 'utf8');
    const marks = exceptionsIn(text);
    for (const [line, { repo, number }] of marks) {
      const state = await stateOf(repo, number);
      exceptions.push({ file, line, issue: `${repo}#${number}`, state });
    }
    for (const f of scanSource(text, extname(abs).toLowerCase(), names)) {
      const severity = f.rule === 'spacing' && spacing !== 'error' ? 'warning' : 'error';
      const mark = marks.get(f.line) ?? marks.get(f.line - 1);
      if (mark) {
        const state = await stateOf(mark.repo, mark.number);
        if (state === 'closed') {
          findings.push({ file, ...f, severity: 'error', message: `${f.message}; its exception ${mark.repo}#${mark.number} is closed` });
        }
        continue; // open or unknown: passes
      }
      findings.push({ file, ...f, severity });
    }
  }

  const errors = findings.filter((f) => f.severity === 'error').length;
  const open = exceptions.filter((e) => e.state !== 'closed').length;
  return {
    findings, exceptions, warnings,
    summary: {
      files: files.length, errors, warnings: findings.length - errors,
      openExceptions: open, closedExceptions: exceptions.length - open,
    },
  };
}

export function formatText(result) {
  const out = [];
  for (const f of result.findings)
    out.push(`${f.file}:${f.line}:${f.column}  ${f.severity === 'error' ? 'error' : 'warning'}  ${f.rule}  ${f.message}`);
  for (const w of result.warnings) out.push(`warning  ${w}`);
  const s = result.summary;
  out.push('');
  out.push(`${s.files} file${s.files === 1 ? '' : 's'} scanned: ${s.errors} error${s.errors === 1 ? '' : 's'}, ${s.warnings} warning${s.warnings === 1 ? '' : 's'}, ${s.openExceptions} open exception${s.openExceptions === 1 ? '' : 's'}.`);
  return out.join('\n');
}
