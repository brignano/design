// fold.mjs — the first phone screen of a product page, checked instead of hoped for.
//
//   node scripts/fold.mjs <url> [<url> ...] [--shots <dir>]
//
// Opens each page at iPhone size (390 × 844) and fails when a stranger
// glancing at it would not get what it is and what to do (DESIGN.md §13):
//
//   1. the thesis (h1.pp-thesis) is not wholly on the first screen, or runs
//      past 8 words, or the hero has no audience line (.pp-audience);
//   2. the hero subhead runs past 25 words;
//   3. less than 160px of the proof (.pp-hero .pp-media) is on the first
//      screen, or the proof is wider than its box (cropped on a phone);
//   4. no primary action (.pp-button) is visible on the first screen;
//   5. the page scrolls sideways;
//   6. the page is longer than 7 phone screens, the length at which it has
//      become a case study;
//   7. the words are over budget: more than 40 words of copy on the first
//      screen, or 180 on the whole page. Copy is what the reader has to read:
//      the words inside pictures (.pp-media, .pp-get-media), the form, the
//      header and the footer don't count, nor anything marked
//      data-fold="skip" (the preview site's own bar);
//   8. the status (.pp-status) shows more than once on the first screen.
//
// It can't tell whether a stranger gets it. That is the stranger test in
// DESIGN.md §13: hand the first-screen shot (--shots) to someone, or a fresh
// agent with no context, and compare what they say to the page's brief.
//
// Needs Playwright with Chromium (`npm i --no-save playwright` and
// `npx playwright install chromium`, or set CHROME_PATH); the design package itself stays
// dependency-free, so this script is run in CI and by the sites that copy it,
// not by `npm run check`. --shots writes a first-screen PNG per page.

import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('playwright-core'); } })();

const args = process.argv.slice(2);
const shotsAt = args.indexOf('--shots');
const shots = shotsAt >= 0 ? args.splice(shotsAt, 2)[1] : null;
if (!args.length) {
  console.error('usage: node scripts/fold.mjs <url> [<url> ...] [--shots <dir>]');
  process.exit(2);
}
if (shots) mkdirSync(shots, { recursive: true });

const W = 390, H = 844;
const LIMITS = { thesisWords: 8, subheadWords: 25, proofVisible: 160, screens: 7, foldWords: 40, pageWords: 180 };

// CHROME_PATH points at an installed Chrome instead of Playwright's own
// download (CI uses the runner's Chrome, which tracks new OS images).
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.route(/googletagmanager|google-analytics|plausible|cloudflareinsights/, (r) => r.abort());

let failed = 0;
for (const url of args) {
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(({ W, H }) => {
    const words = (el) => (el ? el.textContent.trim().split(/\s+/).filter(Boolean).length : 0);
    const box = (el) => (el ? el.getBoundingClientRect() : null);
    const thesis = document.querySelector('h1.pp-thesis');
    const subhead = document.querySelector('.pp-hero .pp-subhead');
    const media = document.querySelector('.pp-hero .pp-media');
    const buttons = [...document.querySelectorAll('.pp-button')].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.top >= 0 && r.bottom <= H;
    });
    const audience = document.querySelector('.pp-hero .pp-audience');
    // Copy words: text the reader has to read, outside pictures, form, header, footer.
    const skip = '.pp-media, .pp-get-media, .pp-form, .pp-done, .pp-header, .pp-footer, .pp-skip, script, style, [hidden], [data-fold="skip"]';
    let foldWords = 0, pageWords = 0;
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) {
      const el = walk.currentNode.parentElement;
      if (!el || el.closest(skip)) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const n = walk.currentNode.textContent.split(/\s+/).filter(Boolean).length;
      pageWords += n;
      if (r.top < H && r.bottom > 0) foldWords += n;
    }
    const statuses = [...document.querySelectorAll('.pp-status')].filter((s) => {
      const r = s.getBoundingClientRect();
      return r.width > 0 && r.top < H && r.bottom > 0;
    }).length;
    const tb = box(thesis), mb = box(media);
    return {
      thesis: thesis ? { words: words(thesis), bottom: tb.bottom } : null,
      audience: audience ? audience.textContent.trim() : '',
      subheadWords: words(subhead),
      media: media ? { visible: Math.max(0, Math.min(mb.bottom, H) - mb.top), overflow: media.scrollWidth - media.clientWidth } : null,
      buttons: buttons.length,
      foldWords, pageWords, statuses,
      scrollWidth: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    };
  }, { W, H });

  const problems = [];
  if (!r.thesis) problems.push('no h1.pp-thesis');
  else {
    if (r.thesis.bottom > H) problems.push(`thesis ends at ${Math.round(r.thesis.bottom)}px, below the first screen (${H}px)`);
    if (r.thesis.words > LIMITS.thesisWords) problems.push(`thesis is ${r.thesis.words} words (max ${LIMITS.thesisWords})`);
  }
  if (!r.audience) problems.push('no audience line (.pp-hero .pp-audience) saying who it is for');
  if (r.subheadWords > LIMITS.subheadWords) problems.push(`hero subhead is ${r.subheadWords} words (max ${LIMITS.subheadWords})`);
  if (!r.media) problems.push('no proof (.pp-hero .pp-media)');
  else {
    if (r.media.visible < LIMITS.proofVisible) problems.push(`only ${Math.round(r.media.visible)}px of the proof is on the first screen (min ${LIMITS.proofVisible})`);
    if (r.media.overflow > 1) problems.push(`the proof is ${r.media.overflow}px wider than its box, so it is cropped on a phone`);
  }
  if (!r.buttons) problems.push('no .pp-button visible on the first screen');
  if (r.scrollWidth > W) problems.push(`page scrolls sideways (${r.scrollWidth}px wide)`);
  if (r.foldWords > LIMITS.foldWords) problems.push(`${r.foldWords} words of copy on the first screen (max ${LIMITS.foldWords}): let the proof say it`);
  if (r.pageWords > LIMITS.pageWords) problems.push(`${r.pageWords} words of copy on the page (max ${LIMITS.pageWords}): move the argument to the docs`);
  if (r.statuses > 1) problems.push(`the status shows ${r.statuses} times on the first screen (once is enough)`);
  const screens = r.height / H;
  if (screens > LIMITS.screens) problems.push(`page is ${screens.toFixed(1)} phone screens long (max ${LIMITS.screens})`);

  if (shots) {
    const name = new URL(url).pathname.split('/').filter(Boolean).pop()?.replace(/\.html$/, '') || 'index';
    await page.screenshot({ path: `${shots}/${name}-fold.png` });
  }
  if (problems.length) {
    failed++;
    console.log(`✗ ${url}\n${problems.map((p) => `    ${p}`).join('\n')}`);
  } else {
    console.log(`✓ ${url} · thesis ${r.thesis.words} words, ${r.foldWords} words on screen one, ${r.pageWords} on the page, ${Math.round(r.media.visible)}px of proof, ${screens.toFixed(1)} screens`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
