// The A|B logo as path data, for a page that inlines it (React, satori, a
// template) instead of loading logo/mark.svg or logo/tile.svg as an image.
//
// Inline, the letters take the ink and the bar takes the mark in force:
//
//   <svg viewBox={MARK.viewBox} role="img" aria-label="Anthony Brignano">
//     <path d={MARK.letters} style="fill: var(--ink)" />
//     <path d={MARK.bar} style="fill: var(--mark-current)" />
//   </svg>
//
// The letters are Geist at weight 800 (OFL, fonts/LICENSE-geist.txt),
// outlined so the logo doesn't wait on the font. DESIGN.md §5, "The logo".

/** The mark on its own, 41.33 × 24 with no padding: header, share card, footer. */
export const MARK = {
  width: 41.33,
  height: 24,
  viewBox: '0 0 41.33 24',
  letters: 'M0 20.44 6.08 3.56H10.87L16.96 20.44H12.71L11.61 17.25H5.33L4.23 20.44ZM6.45 13.96H10.5L8.49 8.03ZM27.17 20.44V3.56H34Q37.18 3.56 38.9 4.67Q40.61 5.77 40.61 8.16Q40.61 9.2 40.21 9.95Q39.8 10.71 38.99 11.15Q38.19 11.6 37.04 11.71L37.03 11.72Q39.16 11.89 40.24 12.95Q41.33 14.01 41.33 15.78Q41.33 18.14 39.62 19.29Q37.92 20.44 34.76 20.44ZM31.31 17.18H34.51Q35.68 17.18 36.43 16.71Q37.17 16.23 37.17 15.25Q37.17 14.26 36.43 13.77Q35.7 13.27 34.51 13.27H31.31ZM31.31 10.44H33.85Q35.02 10.44 35.74 9.99Q36.46 9.53 36.46 8.64Q36.46 7.68 35.76 7.25Q35.05 6.82 33.85 6.82H31.31Z',
  bar: 'M20.52 0h3.09v24h-3.09z',
};

/** The mark in a 24 × 24 tile with 5.5 corners: favicon and app icon. */
export const TILE = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  radius: 5.5,
  letters: 'M3 15.67 5.65 8.33H7.74L10.39 15.67H8.53L8.06 14.29H5.32L4.84 15.67ZM5.81 12.85H7.57L6.7 10.27ZM14.84 15.67V8.33H17.81Q19.2 8.33 19.94 8.81Q20.69 9.29 20.69 10.33Q20.69 10.78 20.51 11.11Q20.33 11.44 19.98 11.63Q19.63 11.82 19.13 11.87L19.13 11.88Q20.05 11.95 20.53 12.41Q21 12.87 21 13.65Q21 14.68 20.26 15.18Q19.51 15.67 18.14 15.67ZM16.64 14.26H18.03Q18.54 14.26 18.86 14.05Q19.19 13.84 19.19 13.41Q19.19 12.98 18.87 12.77Q18.55 12.55 18.03 12.55H16.64ZM16.64 11.32H17.74Q18.25 11.32 18.57 11.12Q18.88 10.93 18.88 10.53Q18.88 10.12 18.57 9.93Q18.27 9.74 17.74 9.74H16.64Z',
  bar: 'M11.94 6.77h1.35v10.45h-1.35z',
};
