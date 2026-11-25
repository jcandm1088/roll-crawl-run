// Generates the app icons from the approved logo artwork (src/ui/brand/growing-together.json),
// in the fixed brand colors — installed icons never change with a child's theme.
// Uses the pre-installed Playwright Chromium. Run: npm run icons
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const art = JSON.parse(readFileSync(new URL('../src/ui/brand/growing-together.json', import.meta.url), 'utf8'));
const C = art.brandColors;
const out = new URL('../public/icons/', import.meta.url);
mkdirSync(out, { recursive: true });

const shapes = art.shapes
  .map((s) => {
    const stroke = s.stroke ? ` stroke="${C[s.stroke]}" stroke-width="${s.strokeWidth}"${s.strokeLinejoin ? ` stroke-linejoin="${s.strokeLinejoin}"` : ''}` : '';
    return s.type === 'circle' ? `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${C[s.fill]}"${stroke}/>` : `<path d="${s.d}" fill="${C[s.fill]}"${stroke}/>`;
  })
  .join('');

/** @param {{ rounded: boolean, inset: number }} o  inset = fraction of padding (maskable safe zone) */
function svg({ rounded, inset }) {
  const scale = 1 - inset * 2;
  const t = inset * 100;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" ${rounded ? `rx="${art.cornerRadius}"` : ''} fill="${C.background}"/><g transform="translate(${t} ${t}) scale(${scale})">${shapes}</g></svg>`;
}

writeFileSync(new URL('favicon.svg', out), svg({ rounded: true, inset: 0 }));
const targets = [
  { file: 'icon-192.png', size: 192, rounded: false, inset: 0.04 },
  { file: 'icon-512.png', size: 512, rounded: false, inset: 0.04 },
  // Maskable: artwork inside the central safe zone (platforms crop to circles/squircles).
  { file: 'icon-maskable-512.png', size: 512, rounded: false, inset: 0.14 },
  // iOS applies its own rounded mask; provide a square, full-bleed icon.
  { file: 'apple-touch-icon.png', size: 180, rounded: false, inset: 0.04 },
  // Small-size legibility checks (documentation only, not shipped in the manifest).
  { file: '../../docs/branding/icon-check-32.png', size: 32, rounded: true, inset: 0 },
  { file: '../../docs/branding/icon-check-16.png', size: 16, rounded: true, inset: 0 },
];
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(t).replace('<svg ', `<svg width="${t.size}" height="${t.size}" `)}</body></html>`);
  writeFileSync(new URL(t.file, out), await page.locator('svg').screenshot({ omitBackground: true }));
  console.log('wrote', t.file);
}
await browser.close();
