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
//      become a case study.
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
const LIMITS = { thesisWords: 8, subheadWords: 25, proofVisible: 160, screens: 7 };

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
    const tb = box(thesis), mb = box(media);
    return {
      thesis: thesis ? { words: words(thesis), bottom: tb.bottom } : null,
      audience: audience ? audience.textContent.trim() : '',
      subheadWords: words(subhead),
      media: media ? { visible: Math.max(0, Math.min(mb.bottom, H) - mb.top), overflow: media.scrollWidth - media.clientWidth } : null,
      buttons: buttons.length,
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
    console.log(`✓ ${url} · thesis ${r.thesis.words} words, ${Math.round(r.media.visible)}px of proof on screen one, ${screens.toFixed(1)} screens`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
