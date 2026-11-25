// Checkpoint 1 review: Settings states, typography options A/B, and side-by-side comparison boards.
// Fictional data only. Usage: node scripts/review-comparisons.mjs <baseUrl>
// Option B typography is applied ONLY inside this script (injected stylesheet) — the app is unchanged.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4181/';
const DIR = 'docs/screenshots/checkpoint-1-review';
mkdirSync(`${DIR}/after`, { recursive: true });
mkdirSync(`${DIR}/compare`, { recursive: true });
const browser = await chromium.launch();

const OPTION_B_CSS = `
  .title-1, .title-2, .accordion-title, .section-title, .heading-ui {
    font-family: var(--font-ui) !important; font-weight: 600 !important; letter-spacing: -0.02em !important; }
  .title-1 { font-size: 1.625rem !important; } .title-2, .accordion-title { font-size: 1.25rem !important; }
  /* Fraunces retained for branding: wordmark, welcome screen, and the top-bar screen titles. */`;

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(BASE);
await page.getByRole('button', { name: 'Get started' }).click();
await page.getByLabel('Date of birth').fill(daysAgo(200));
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByLabel('Name or nickname').fill('Jules Sample');
for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: 'Start using the app' }).click();
await page.getByRole('navigation', { name: 'Main' }).waitFor();
const shot = async (path, opts = {}) => {
  await page.waitForTimeout(350);
  await page.screenshot({ path, ...opts });
  console.log('saved', path);
};

// Settings: collapsed (default) and expanded
await page.goto(`${BASE}#/settings`);
await shot(`${DIR}/after/settings-collapsed.png`, { fullPage: true });
for (const n of ['Your Data', 'Calendar & Reminders', 'This Device', 'About']) await page.getByRole('button', { name: new RegExp(`^${n}`) }).click();
await page.getByRole('button', { name: 'Advanced data management' }).click();
await shot(`${DIR}/after/settings-expanded.png`, { fullPage: true });
await page.getByRole('button', { name: 'Erase all app data…' }).click();
await shot(`${DIR}/after/reset-step-1.png`);
await page.getByLabel('Type RESET to continue').fill('RESET');
await page.getByRole('button', { name: 'Continue' }).click();
await shot(`${DIR}/after/reset-step-2.png`);
await page.getByRole('button', { name: 'Cancel — keep my data' }).click();

// Profile deletion flow
await page.goto(`${BASE}#/profiles`);
await page.getByRole('link', { name: /^Edit / }).click();
await page.getByRole('button', { name: 'Advanced profile management' }).click();
await page.getByRole('button', { name: 'Delete this profile…' }).click();
await page.getByLabel('Type DELETE PROFILE to continue').fill('DELETE PROFILE');
await shot(`${DIR}/after/delete-step-1.png`);
await page.getByRole('button', { name: 'Continue' }).click();
await shot(`${DIR}/after/delete-step-2.png`);
await page.getByRole('button', { name: 'Cancel — keep profile' }).click();

// Typography A (as built) and B (alternative, injected)
for (const [label, css] of [['A', ''], ['B', OPTION_B_CSS]]) {
  for (const path of ['home', 'growth', 'journal', 'settings']) {
    await page.goto(`${BASE}#/${path}`);
    if (css) await page.addStyleTag({ content: css });
    await shot(`${DIR}/compare/typography-${label}-${path}.png`);
  }
  await page.reload(); // drop injected style
}
await ctx.close();

// Comparison boards
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
async function board(file, title, columns, rows) {
  const p = await browser.newPage({ viewport: { width: 400 * columns.length + 80, height: 800 }, deviceScaleFactor: 1 });
  const cells = rows
    .map((r) => `<div class="r">${r.map((src) => `<img src="${b64(src)}">`).join('')}</div>`)
    .join('');
  await p.setContent(`<html><body style="margin:0;padding:24px 40px;background:#EDE6DD;font-family:system-ui,sans-serif">
    <h2 style="margin:0 0 12px;font-weight:600;color:#2E241C">${title}</h2>
    <div class="r">${columns.map((c) => `<div class="h">${c}</div>`).join('')}</div>${cells}
    <style>.r{display:grid;grid-template-columns:repeat(${columns.length},1fr);gap:24px;margin-bottom:24px;align-items:start}
    .h{font-weight:700;color:#67564A;letter-spacing:.06em;text-transform:uppercase;font-size:14px}
    img{width:100%;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,.12)}</style></body></html>`);
  await p.screenshot({ path: `${DIR}/compare/${file}`, fullPage: true });
  await p.close();
  console.log('saved board', file);
}
const B = `${DIR}/before`, A = `${DIR}/after`, C = `${DIR}/compare`;
await board('typography-A-vs-B.png', 'Typography: A (built — selective Inter) vs B (alternative — Inter for functional headings, Fraunces for branding)', ['A · Built', 'B · Alternative'],
  ['home', 'growth', 'journal', 'settings'].map((s) => [`${C}/typography-A-${s}.png`, `${C}/typography-B-${s}.png`]));
await board('blush-before-after.png', 'Blush theme: before vs after', ['Before', 'After'], [
  [`${B}/mobile-home-blush.png`, `${A}/mobile-home-blush.png`],
  [`${B}/mobile-settings-blush.png`, `${A}/mobile-settings-blush.png`],
]);
await board('home-before-after.png', 'Home: before vs after', ['Before', 'After'], [[`${B}/mobile-home.png`, `${A}/mobile-home.png`]]);
await board('privacy-before-after.png', 'Onboarding privacy step: before vs after', ['Before', 'After'], [[`${B}/mobile-privacy-step.png`, `${A}/mobile-privacy-step.png`]]);
await board('tabs-before-after.png', 'Growth, Journal, Resources, Calendar: before vs after', ['Before', 'After'],
  ['growth', 'journal', 'resources', 'calendar'].map((t) => [`${B}/mobile-${t}.png`, `${A}/mobile-${t}.png`]));
await board('settings-before-after.png', 'Settings: before vs after (collapsed by default)', ['Before', 'After'], [[`${B}/mobile-settings.png`, `${A}/settings-collapsed.png`]]);
await board('profile-edit-before-after.png', 'Profile editing: before vs after (deletion moved under Advanced)', ['Before', 'After'], [[`${B}/mobile-profile-edit.png`, `${A}/mobile-profile-edit.png`]]);
await board('destructive-flows.png', 'Revised destructive-action flows (two steps each)', ['Reset · step 1', 'Reset · step 2', 'Delete · step 1', 'Delete · step 2'], [
  [`${A}/reset-step-1.png`, `${A}/reset-step-2.png`, `${A}/delete-step-1.png`, `${A}/delete-step-2.png`],
]);
await browser.close();
