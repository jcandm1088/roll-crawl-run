// Checkpoint 1 final refinement screenshots (FICTIONAL data only).
// Usage: node scripts/final-screenshots.mjs <baseUrl>
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4181/';
const DIR = 'docs/screenshots/checkpoint-1-final';
mkdirSync(DIR, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const shot = async (name, opts = {}) => {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/${name}.png`, ...opts });
  console.log('saved', name);
};
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const switchTo = async (name) => {
  await page.goto(`${BASE}#/home`);
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: new RegExp(name) }).click();
};

await page.goto(BASE);
await shot('01-welcome-logo');
await page.getByRole('button', { name: 'Get started' }).click();
await page.getByLabel('Date of birth').fill(daysAgo(220));
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByLabel('Name or nickname').fill('Jules Sample');
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByTestId('theme-sage').click();
await shot('02-onboarding-theme-for-child');
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: 'Start using the app' }).click();
await page.getByRole('navigation', { name: 'Main' }).waitFor();

await page.goto(`${BASE}#/profiles/new`);
await page.getByLabel('Name or nickname (optional)').fill('Sample Child B');
await page.getByLabel('Date of birth').fill(daysAgo(900));
await page.getByTestId('theme-blush').click();
await page.locator('.card', { hasText: 'Theme' }).first().scrollIntoViewIfNeeded();
await shot('03-new-child-theme-choice');
await page.getByRole('button', { name: 'Add child' }).click();
await page.getByRole('navigation', { name: 'Main' }).waitFor();

// Switching between two children with different themes
await switchTo('Jules Sample');
await shot('04-child-A-sage-home');
await page.getByTestId('child-chip').click();
await shot('05-switching-from-A');
await page.getByRole('radio', { name: /Sample Child B/ }).click();
await shot('06-child-B-blush-home');
await page.goto(`${BASE}#/settings`);
await shot('07-child-B-appearance');
await switchTo('Jules Sample');
await page.goto(`${BASE}#/settings`);
await shot('08-child-A-appearance');

// Primary headings across tabs
for (const tab of ['growth', 'calendar', 'journal', 'resources']) {
  await page.goto(`${BASE}#/${tab}`);
  await shot(`10-heading-${tab}`);
}
await page.goto(`${BASE}#/home`);
await shot('09-home');
await ctx.close();

// Boards
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
async function board(file, title, items, cols) {
  const p = await browser.newPage({ viewport: { width: 330 * cols + 80, height: 800 } });
  await p.setContent(`<html><body style="margin:0;padding:24px 40px;background:#EDE6DD;font-family:system-ui,sans-serif">
  <h2 style="margin:0 0 16px;color:#2E241C">${title}</h2>
  <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:20px">${items.map(([label, src]) => `<figure style="margin:0"><figcaption style="font:600 13px system-ui;letter-spacing:.05em;text-transform:uppercase;color:#67564A;margin-bottom:8px">${label}</figcaption><img src="${b64(src)}" style="width:100%;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,.12)"></figure>`).join('')}</div></body></html>`);
  await p.screenshot({ path: `${DIR}/${file}`, fullPage: true });
  await p.close();
  console.log('board', file);
}
await board('board-per-child-themes.png', 'Two children, two themes — switching applies each child’s own theme', [
  ['Jules (Sage)', `${DIR}/04-child-A-sage-home.png`],
  ['Switching…', `${DIR}/05-switching-from-A.png`],
  ['Sample Child B (Blush)', `${DIR}/06-child-B-blush-home.png`],
  ['Appearance · Child B', `${DIR}/07-child-B-appearance.png`],
  ['Appearance · Jules', `${DIR}/08-child-A-appearance.png`],
  ['New child: choose a theme', `${DIR}/03-new-child-theme-choice.png`],
], 3);
await board('board-primary-headings.png', 'Primary tab headings — one shared style (Inter)', ['growth', 'calendar', 'journal', 'resources'].map((t) => [t, `${DIR}/10-heading-${t}.png`]), 4);

// Logo and icons
const icons = ['icon-512.png', 'icon-maskable-512.png', 'icon-192.png', 'apple-touch-icon.png'];
const ip = await browser.newPage({ viewport: { width: 1300, height: 700 }, deviceScaleFactor: 2 });
const icon = (f) => b64(`public/icons/${f}`);
const fav = readFileSync('public/icons/favicon.svg', 'utf8');
const themes = [['Earth', '#EBDCCB', '#7A4F33', '#C08A5E'], ['Sky', '#D6E6F3', '#2D6290', '#86B6D9'], ['Blush', '#FAD0E2', '#A93669', '#F5A5C8'], ['Lavender', '#E2D9F2', '#664C99', '#B4A0D8'], ['Sage', '#DAE7D5', '#466749', '#9BBB96']];
const themed = (bg, p, a) => fav.replace(/#EBDCCB/g, bg).replace(/#7A4F33/g, p).replace(/#C08A5E/g, a).replace('<svg ', '<svg width="64" height="64" ');
await ip.setContent(`<html><body style="margin:0;padding:32px 40px;background:#F6F0E8;font-family:system-ui;color:#2E241C">
<h2 style="margin:0 0 6px">Adopted logo: Growing Together (Concept 5)</h2>
<p style="margin:0 0 24px;color:#67564A">Installed icons use fixed brand colors. The in-app mark follows the active child's theme.</p>
<div style="display:flex;gap:28px;align-items:flex-end">
${icons.map((f) => `<figure style="margin:0;text-align:center"><img src="${icon(f)}" style="width:${f.includes('192') ? 96 : f.includes('apple') ? 90 : 160}px;border-radius:${f.includes('maskable') ? '50%' : '22%'};box-shadow:0 2px 10px rgba(0,0,0,.15)"><figcaption style="font-size:12px;color:#67564A;margin-top:8px">${f}${f.includes('maskable') ? '<br>(circle mask preview)' : ''}</figcaption></figure>`).join('')}
<figure style="margin:0;text-align:center"><div style="display:flex;gap:10px;align-items:flex-end"><img src="${b64('docs/branding/icon-check-32.png')}" style="width:32px"><img src="${b64('docs/branding/icon-check-16.png')}" style="width:16px"></div><figcaption style="font-size:12px;color:#67564A;margin-top:8px">32 px · 16 px<br>(actual size)</figcaption></figure>
</div>
<h3 style="margin:32px 0 12px">In-app mark in all five themes</h3>
<div style="display:flex;gap:16px">${themes.map(([n, bg, p, a]) => `<figure style="margin:0;text-align:center">${themed(bg, p, a)}<figcaption style="font-size:12px;color:#67564A">${n}</figcaption></figure>`).join('')}</div>
</body></html>`);
await ip.screenshot({ path: `${DIR}/board-logo-and-icons.png`, fullPage: true });
console.log('board logo');
await browser.close();
