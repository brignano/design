// render-check.mjs — render every gallery page and fail on what a rule-reading check can't see.
//
//   node scripts/render-check.mjs <base-url> [--only <page-substring>]
//   e.g. node scripts/render-check.mjs http://localhost:8080
//
// `npm run check` reads files; it never renders a page. A page can pass every
// rule and still be unreadable (a class collision once squashed the content
// guidelines page, live and unnoticed). This opens index.html and every
// previews/*.html (not previews/wireframes/) at 390px and 1280px, light and
// dark, and fails on:
//
//   1. a console error or an uncaught page error;
//   2. a failed request, or a 4xx/5xx response;
//   3. the page scrolling sideways;
//   4. a block with visible overflow whose content is more than 12px taller
//      or wider than its box (a squashed or spilling block).
//
// Deliberate cases go in ALLOW below, each with a reason. It is run in CI and
// by hand; the package stays dependency-free (like fold.mjs). Needs
// playwright or playwright-core, and CHROME_PATH for an installed Chrome.

import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('playwright-core'); } })();

const TOLERANCE = 12;
const WIDTHS = [390, 1280];
const SCHEMES = ['light', 'dark'];

// Each entry: the page (substring of its path), a CSS selector the overflow
// rule skips on that page ('*' for every page), and why it is deliberate.
const ALLOW = [
  { page: 'product-page', selector: '.pp-media, .pp-media *', reason: 'the product pages tilt the phone in the hero on purpose; its corners poke past the frame' },
  { page: 'product-page', selector: '.pp-thesis, .pp-hero h1, .pp-hero h2', reason: 'display headlines use a tight line height, so glyphs sit slightly outside the line box' },
  { page: 'product-page-sites', selector: '.pp-wrap', reason: 'the hero grid holds the tilted phone; its box is the text column, the phone hangs below it' },
  { page: 'product-page-guidebook', selector: 'h2', reason: 'the band headline uses a tight display line height, so its lines sit outside the line box' },
  { page: 'site-chrome', selector: '.site-brand', reason: 'the desktop example is shown in a phone-width frame at 390px, where the brand outgrows its link box' },
  { page: '*', selector: '.sr-only, .skip, .skip-link, [data-render-check="skip"]', reason: 'visually hidden by design' },
];

const args = process.argv.slice(2);
const onlyAt = args.indexOf('--only');
const only = onlyAt >= 0 ? args.splice(onlyAt, 2)[1] : null;
const base = (args[0] || '').replace(/\/$/, '');
if (!base) {
  console.error('usage: node scripts/render-check.mjs <base-url> [--only <page-substring>]');
  process.exit(2);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', ...readdirSync(join(root, 'previews')).filter((f) => f.endsWith('.html')).map((f) => `previews/${f}`)]
  .filter((p) => !only || p.includes(only));

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
let failures = 0;

for (const colorScheme of SCHEMES) {
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme });
    await ctx.route(/googletagmanager|google-analytics|plausible|cloudflareinsights/, (r) => r.abort());
    for (const path of pages) {
      const label = `${path} @${width} ${colorScheme}`;
      const problems = [];
      const page = await ctx.newPage();
      page.on('console', (m) => { if (m.type() === 'error') problems.push(`console error: ${m.text()}`); });
      page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
      page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()} (${r.failure()?.errorText})`));
      page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
      await page.goto(`${base}/${path}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const allow = ALLOW.filter((a) => a.page === '*' || path.includes(a.page)).map((a) => a.selector);
      const found = await page.evaluate(({ allow, TOLERANCE }) => {
        const out = [];
        const de = document.documentElement;
        if (de.scrollWidth > de.clientWidth + 1) out.push(`scrolls sideways: content ${de.scrollWidth}px in a ${de.clientWidth}px window`);
        const skipped = allow.length ? new Set(document.querySelectorAll(allow.join(','))) : new Set();
        const name = (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/).join('.')}` : '');
        for (const el of document.body.querySelectorAll('*')) {
          if (skipped.has(el)) continue;
          const cs = getComputedStyle(el);
          if (cs.display === 'inline' || cs.display === 'none' || cs.display === 'contents' || cs.position === 'fixed') continue;
          if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') continue;
          // Table parts and replaced elements report their own sizes.
          if (/^(tr|td|th|svg|img|video|canvas|iframe|table|tbody|thead)$/i.test(el.tagName) || el.closest('svg')) continue;
          const w = el.clientWidth, h = el.clientHeight;
          if (!w && !h) continue;
          const dh = el.scrollHeight - h, dw = el.scrollWidth - w;
          if (h && dh > TOLERANCE) out.push(`overflows ${dh}px tall: ${name(el)} (box ${w}×${h}, content ${el.scrollWidth}×${el.scrollHeight})`);
          else if (w && dw > TOLERANCE) out.push(`overflows ${dw}px wide: ${name(el)} (box ${w}×${h}, content ${el.scrollWidth}×${el.scrollHeight})`);
        }
        return out;
      }, { allow, TOLERANCE });
      problems.push(...found);
      // Report an element once even when its ancestors overflow with it.
      const unique = [...new Set(problems)].slice(0, 12);
      if (unique.length) { failures++; console.error(`FAIL ${label}\n  ${unique.join('\n  ')}`); }
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();
const total = pages.length * WIDTHS.length * SCHEMES.length;
console.log(failures ? `${failures} of ${total} renders failed` : `ok: ${pages.length} pages × ${WIDTHS.join('/')}px × ${SCHEMES.join('/')} (${total} renders)`);
process.exit(failures ? 1 : 0);
