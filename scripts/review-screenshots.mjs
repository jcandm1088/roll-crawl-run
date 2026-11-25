// Captures the screens discussed in the Checkpoint 1 review, using FICTIONAL data only.
// Usage: node scripts/review-screenshots.mjs <baseUrl> <outDir>
// Works against both the original Checkpoint 1 build and the revised build, so the
// "before" and "after" images show the same screens.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:4180/';
const OUT = resolve(process.argv[3] ?? 'docs/screenshots/review');
mkdirSync(OUT, { recursive: true });

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const browser = await chromium.launch();

async function onboard(page, { name, dob, corrected }) {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill(dob);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill(name);
  await page.getByRole('button', { name: 'Continue' }).click();
  if (corrected) {
    await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
    await page.getByRole('button', { name: 'Weeks at birth' }).click();
    await page.getByLabel('Weeks', { exact: true }).selectOption('32');
  }
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function addChild(page, name, dob) {
  await page.goto(`${BASE}#/profiles/new`);
  await page.getByLabel('Name or nickname (optional)').fill(name);
  await page.getByLabel('Date of birth').fill(dob);
  await page.getByRole('button', { name: 'Add child' }).click();
  await page.getByRole('navigation', { name: 'Main' }).waitFor();
}

async function session(viewport, prefix, work) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const shot = async (name, opts = {}) => {
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${prefix}-${name}.png`, ...opts });
    console.log('saved', `${prefix}-${name}`);
  };
  await work(page, shot);
  await context.close();
}

await session({ width: 390, height: 844 }, 'mobile', async (page, shot) => {
  await onboard(page, { name: 'Jules Sample', dob: daysAgo(200), corrected: true });
  await shot('privacy-step');
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await page.getByRole('navigation', { name: 'Main' }).waitFor();
  await shot('home');
  await addChild(page, 'Sample Child B', daysAgo(900));
  await page.getByTestId('child-chip').click();
  await shot('selector-home');
  await page.keyboard.press('Escape');
  for (const tab of ['growth', 'journal', 'resources', 'calendar']) {
    await page.goto(`${BASE}#/${tab}`);
    await shot(tab);
  }
  await page.goto(`${BASE}#/settings`);
  await shot('settings', { fullPage: true });
  await page.goto(`${BASE}#/profiles`);
  await page.getByRole('link', { name: 'Edit Sample Child B' }).click();
  await shot('profile-edit', { fullPage: true });
  await page.goto(`${BASE}#/settings`);
  await page.getByTestId('theme-blush').click();
  await page.goto(`${BASE}#/home`);
  await shot('home-blush');
  await page.goto(`${BASE}#/settings`);
  await shot('settings-blush');
});

await session({ width: 1280, height: 800 }, 'desktop', async (page, shot) => {
  await onboard(page, { name: 'Jules Sample', dob: daysAgo(420), corrected: false });
  await shot('privacy-step');
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await page.getByRole('navigation', { name: 'Main' }).waitFor();
  await addChild(page, 'Sample Child B', daysAgo(900));
  await page.getByTestId('child-chip').click();
  await shot('selector-home');
  await page.keyboard.press('Escape');
  await page.goto(`${BASE}#/growth`);
  await page.getByTestId('child-chip').click();
  await shot('selector-growth');
});

await browser.close();
