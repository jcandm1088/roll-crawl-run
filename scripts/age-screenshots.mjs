// Precise-age screenshots (FICTIONAL data, clock fixed to 25 Nov 2026 for exact results).
// Usage: node scripts/age-screenshots.mjs <baseUrl>
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4181/';
const DIR = 'docs/screenshots/checkpoint-1-precise-age';
mkdirSync(DIR, { recursive: true });
const CASES = [
  ['2026-11-08', 'Sample Newborn'],
  ['2026-05-13', 'Sample Baby'],
  ['2025-05-20', 'Sample Toddler'],
  ['2024-08-11', 'Sample Two'],
  ['2023-11-24', 'Sample Three'],
  ['2022-03-24', 'Sample Four'],
];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 600 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.clock.setFixedTime(new Date('2026-11-25T10:00:00'));
await page.goto(BASE);
await page.getByRole('button', { name: 'Get started' }).click();
await page.getByLabel('Date of birth').fill(CASES[0][0]);
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByLabel('Name or nickname').fill(CASES[0][1]);
for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: 'Start using the app' }).click();
const files = [];
for (const [i, [dob, name]] of CASES.entries()) {
  if (i > 0) {
    await page.goto(`${BASE}#/profiles/new`);
    await page.getByLabel('Name or nickname (optional)').fill(name);
    await page.getByLabel('Date of birth').fill(dob);
    await page.getByRole('button', { name: 'Add child' }).click();
  }
  await page.getByRole('heading', { name }).waitFor();
  await page.waitForTimeout(350);
  const f = `${DIR}/home-${i + 1}-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
  await page.screenshot({ path: f, clip: { x: 0, y: 0, width: 390, height: 300 } });
  files.push([name, f]);
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}#/profiles`);
await page.waitForTimeout(350);
await page.screenshot({ path: `${DIR}/profiles-list.png` });

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
const bp = await browser.newPage({ viewport: { width: 1180, height: 800 } });
await bp.setContent(`<html><body style="margin:0;padding:24px 32px;background:#EDE6DD;font-family:system-ui">
<h2 style="margin:0 0 4px;color:#2E241C">Precise ages on Home (today fixed to November 25, 2026)</h2>
<p style="margin:0 0 16px;color:#67564A">Years, months, and days to the calendar day; zero parts omitted; no weeks or rounding.</p>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">${files.map(([n, f]) => `<img src="${b64(f)}" style="width:100%;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.12)">`).join('')}</div></body></html>`);
await bp.screenshot({ path: `${DIR}/board-precise-ages.png`, fullPage: true });
console.log('done');
await browser.close();
