#!/usr/bin/env node
// The `design` command: `npx @brignano/design audit [paths]`. See audit.mjs.

import { audit, formatText } from './audit.mjs';

const USAGE = `Usage: npx @brignano/design audit [paths] [--json] [--spacing=warn|error]

  paths      files or folders to scan (default: the current folder)
  --json     print the result as JSON
  --spacing  treat a spacing value that isn't a token as a warning (default)
             or as an error

Exits 1 when there is an error. Skips node_modules, .gitignore matches and
anything listed in design-audit.ignore.`;

const args = process.argv.slice(2);
if (args[0] === 'audit') args.shift();
else if (args.length && !args[0].startsWith('-') && !/[./\\]/.test(args[0])) {
  console.error(`Unknown command "${args[0]}".\n\n${USAGE}`);
  process.exit(2);
}
if (args.includes('--help') || args.includes('-h')) { console.log(USAGE); process.exit(0); }

const json = args.includes('--json');
const flag = args.find((a) => a.startsWith('--spacing='));
const spacing = flag ? flag.slice('--spacing='.length) : 'warn';
if (!['warn', 'error'].includes(spacing)) { console.error(`--spacing takes warn or error.\n\n${USAGE}`); process.exit(2); }
const paths = args.filter((a) => !a.startsWith('--'));

try {
  const result = await audit(paths, { spacing });
  console.log(json ? JSON.stringify(result, null, 2) : formatText(result));
  process.exitCode = result.summary.errors ? 1 : 0; // not exit(): let a piped stdout drain
} catch (e) {
  console.error(e.message);
  process.exit(2);
}
