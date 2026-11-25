// Captures phone-size screenshots of the production build with FICTIONAL data.
// Usage: npm run build && (npx vite preview --port 4180 &) && npm run screenshots
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4180/';
const OUT = new URL('../docs/screenshots/checkpoint-1/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
const page = await context.newPage();
const shot = async (name, opts = {}) => {
  await page.waitForTimeout(450);
  await page.screenshot({ path: new URL(`${name}.png`, OUT).pathname, ...opts });
  console.log('saved', name);
};

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

await page.goto(BASE);
await shot('01-welcome');
await page.getByRole('button', { name: 'Get started' }).click();
await page.getByLabel('Date of birth').fill(daysAgo(200));
await shot('02-date-of-birth');
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByLabel('Name or nickname').fill('Sample Child A');
await shot('03-name-photo');
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
await page.getByRole('button', { name: 'Weeks at birth' }).click();
await page.getByLabel('Weeks', { exact: true }).selectOption('32');
await page.getByRole('radio', { name: /Corrected age \(from due date\)/ }).click();
await shot('04-corrected-age', { fullPage: true });
await page.getByRole('button', { name: 'Continue' }).click();
await shot('05-theme-picker');
await page.getByRole('button', { name: 'Continue' }).click();
await shot('06-privacy');
await page.getByRole('button', { name: 'Start using the app' }).click();
await page.getByRole('navigation', { name: 'Main' }).waitFor();
await shot('07-home-earth');

for (const theme of ['sky', 'blush', 'lavender', 'sage']) {
  await page.evaluate(async (t) => {
    document.documentElement.dataset.theme = t; // preview only; persisted change below
  }, theme);
  await page.goto(`${BASE}#/settings`);
  await page.getByTestId(`theme-${theme}`).click();
  await page.goto(`${BASE}#/home`);
  await shot(`08-home-${theme}`);
}
await page.goto(`${BASE}#/settings`);
await page.getByTestId('theme-earth').click();

await page.goto(`${BASE}#/profiles/new`);
await page.getByLabel('Name or nickname (optional)').fill('Sample Child B');
await page.getByLabel('Date of birth').fill(daysAgo(900));
await page.getByRole('button', { name: 'Add child' }).click();
await page.getByTestId('child-chip').click();
await shot('09-child-switcher');
await page.keyboard.press('Escape');

await page.goto(`${BASE}#/growth`);
await shot('10-growth-placeholder');
await page.goto(`${BASE}#/settings`);
await shot('11-settings', { fullPage: true });
await page.goto(`${BASE}#/settings/storage`);
await shot('12-storage');
await page.goto(`${BASE}#/profiles`);
await shot('13-profiles');
await page.getByRole('link', { name: 'Edit Sample Child B' }).click();
await page.getByRole('button', { name: 'Delete profile…' }).click();
await shot('14-delete-confirmation');

await browser.close();
