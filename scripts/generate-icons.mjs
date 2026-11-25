// Generates the app icons from one SVG source (Earth palette) using the pre-installed Playwright Chromium.
// Run: npm run icons
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const out = new URL('../public/icons/', import.meta.url);
mkdirSync(out, { recursive: true });

const COLORS = { bg: '#EBDCCB', path: '#C08A5E', mark: '#7A4F33' };

/** @param {{ rounded: boolean, inset: number }} o inset = fraction of padding for maskable safe zone */
function svg({ rounded, inset }) {
  const s = 1 - inset * 2;
  const t = inset * 100;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" ${rounded ? 'rx="22"' : ''} fill="${COLORS.bg}"/>
  <g transform="translate(${t} ${t}) scale(${s})">
    <path d="M18 74 C 38 80, 58 72, 82 44" fill="none" stroke="${COLORS.path}" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="27" cy="66" r="6.5" fill="${COLORS.mark}" opacity="0.55"/>
    <circle cx="49" cy="61" r="9.5" fill="${COLORS.mark}" opacity="0.78"/>
    <circle cx="72" cy="42" r="13.5" fill="${COLORS.mark}"/>
  </g>
</svg>`;
}

// Favicon (rounded, vector).
writeFileSync(new URL('favicon.svg', out), svg({ rounded: true, inset: 0 }));

const targets = [
  { file: 'icon-192.png', size: 192, rounded: false, inset: 0.04 },
  { file: 'icon-512.png', size: 512, rounded: false, inset: 0.04 },
  // Maskable: keep artwork inside the central 80% safe zone.
  { file: 'icon-maskable-512.png', size: 512, rounded: false, inset: 0.12 },
  // iOS applies its own rounded mask; provide a square, full-bleed icon.
  { file: 'apple-touch-icon.png', size: 180, rounded: false, inset: 0.04 },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(`<html><body style="margin:0">${svg(t).replace('<svg ', `<svg width="${t.size}" height="${t.size}" `)}</body></html>`);
  const buf = await page.locator('svg').screenshot({ omitBackground: false });
  writeFileSync(new URL(t.file, out), buf);
  console.log('wrote', t.file);
}
await browser.close();
