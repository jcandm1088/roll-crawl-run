// Checkpoint 2a Growth UX refinement screenshots (FICTIONAL data, clock fixed to Nov 26, 2026 10:00 local).
// Usage: npm run build && (npx vite preview --port 4181 &) && node scripts/checkpoint-2a-refinement-screenshots.mjs [baseUrl]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4181/';
const DIR = 'docs/screenshots/checkpoint-2a-refinement';
mkdirSync(DIR, { recursive: true });
const NOW = new Date('2026-11-26T10:00:00');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.clock.setFixedTime(NOW);
const shot = async (name, opts = { fullPage: true }) => {
  await page.waitForTimeout(450);
  // Full-page captures: draw the fixed bottom navigation once, at the end of the page, instead of over the content.
  const style = opts.fullPage ? await page.addStyleTag({ content: 'body{position:relative} .bottomnav{position:absolute !important;bottom:0 !important;top:auto !important}' }) : null;
  await page.screenshot({ path: `${DIR}/${name}.png`, ...opts });
  if (style) await style.evaluate((el) => el.remove());
  console.log('saved', name);
};
const go = async (hash) => {
  await page.goto(`${BASE}${hash}`);
  await page.waitForTimeout(300);
};

async function onboard(name, dob, theme, corrected) {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill(dob);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill(name);
  await page.getByRole('button', { name: 'Continue' }).click();
  if (corrected) {
    await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
    await page.getByRole('button', { name: 'Weeks at birth' }).click();
    await page.getByLabel('Weeks', { exact: true }).selectOption(String(corrected));
    await page.getByRole('radio', { name: /Corrected age \(from due date\)/ }).click();
  }
  await page.getByRole('button', { name: 'Continue' }).click();
  if (theme) await page.getByTestId(`theme-${theme}`).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await page.getByRole('navigation', { name: 'Main' }).waitFor();
}
async function addChild(name, dob, theme) {
  await go('#/profiles/new');
  await page.getByLabel('Name or nickname (optional)').fill(name);
  await page.getByLabel('Date of birth').fill(dob);
  if (theme) await page.getByTestId(`theme-${theme}`).click();
  await page.getByRole('button', { name: 'Add child' }).click();
  await page.getByRole('heading', { name }).waitFor();
}
async function mark(id, status, date) {
  await go(`#/growth/milestone/${id}`);
  await page.getByRole('radio', { name: status }).click();
  await page.getByLabel(status === 'Achieved' ? 'Date achieved' : 'Date', { exact: true }).fill(date);
  await page.getByRole('button', { name: 'Save status' }).click();
  await page.getByTestId('saved').waitFor();
}
async function switchTo(name) {
  await go('#/home');
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: new RegExp(name) }).click();
  await page.waitForTimeout(300);
}

// --- Sample Child A: 16 months, some records ----------------------------------
await onboard('Sample Child A', '2025-07-10', 'earth');
for (const [id, s, d] of [
  ['cdc22-m02-se-01', 'Achieved', '2025-09-01'], ['cdc22-m09-mp-04', 'Achieved', '2026-04-01'], ['cdc22-m12-mp-01', 'Achieved', '2026-06-20'],
  ['cdc22-m12-lc-01', 'Achieved', '2026-07-02'], ['cdc22-m15-mp-01', 'Achieved', '2026-10-20'], ['cdc22-m15-lc-01', 'Emerging', '2026-10-01'],
  ['cdc22-m15-se-05', 'Achieved', '2026-09-15'],
]) await mark(id, s, d);

await go('#/growth'); await shot('01-growth-landing', {});
await go('#/growth/progress'); await shot('02-progress');
await page.getByTestId('acc-by-age').getByRole('button').first().click(); await page.getByTestId('acc-by-age').scrollIntoViewIfNeeded(); await shot('03-progress-by-cdc-age', {});
await go('#/growth/library/now'); await shot('04-library-up-to-now', {});
await go('#/growth/library/upcoming'); await shot('05-library-upcoming', {});
await go('#/growth/library/all'); await shot('06-library-all-159', {});
await go('#/growth/library/now/fine-motor'); await shot('07-library-from-progress-fine-motor', {});

// Recording confirmations
await mark('cdc22-m15-cg-02', 'Achieved', '2026-11-20'); await page.getByTestId('saved').scrollIntoViewIfNeeded(); await shot('10-confirm-new-achievement', {});
await mark('cdc22-m24-mp-01', 'Achieved', '2026-11-22'); await page.getByTestId('saved').scrollIntoViewIfNeeded(); await shot('11-confirm-early-achievement', {});
await go('#/growth/milestone/cdc22-m15-cg-02');
await page.getByText('Correct the achievement date').click();
await page.getByLabel('Correct date').fill('2026-11-19');
await page.getByRole('button', { name: 'Save corrected date' }).click();
await page.getByTestId('saved').waitFor(); await page.getByTestId('saved').scrollIntoViewIfNeeded(); await shot('12-confirm-date-corrected', {});
await mark('cdc22-m12-lc-01', 'Not yet observed', '2026-11-25'); await page.getByTestId('saved').scrollIntoViewIfNeeded(); await shot('13-confirm-reversal', {});
await mark('cdc22-m15-lc-02', 'Emerging', '2026-11-25'); await page.getByTestId('saved').scrollIntoViewIfNeeded(); await shot('14-confirm-emerging', {});

// Guide (What to Expect)
await go('#/growth/expect'); await shot('20-guide-current-15-18-months');
await go('#/growth/expect/1'); await shot('21-guide-3-6-months-two-cdc-ages');
await go('#/growth/expect/6'); await shot('22-guide-empty-18-21-months');
await go('#/growth/expect/13'); await shot('23-guide-empty-39-42-months', {});
await go('#/growth/expect/19'); await shot('24-guide-last-range-57-60-months', {});
await go('#/home'); await shot('25-home-record-shortcut', {});

// Edge cases
await addChild('Sample Child B', '2026-11-01', 'sky'); // under 1 month: nothing applies yet
await go('#/growth/library'); await shot('30-library-nothing-applies-yet', {});
await go('#/growth/progress'); await shot('31-progress-nothing-to-track', {});
await addChild('Sample Child C', '2020-09-01', 'sage'); // older than five
await go('#/growth/expect'); await shot('32-guide-older-than-five', {});

// Corrected age before and after the due date (fresh profiles)
await addChild('Sample Child D', '2026-10-29', 'lavender');
await go('#/profiles');
await page.getByRole('link', { name: 'Edit Sample Child D' }).click();
await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
await page.getByRole('button', { name: 'Weeks at birth' }).click();
await page.getByLabel('Weeks', { exact: true }).selectOption('30');
await page.getByRole('radio', { name: /Corrected age \(from due date\)/ }).click();
await page.getByRole('button', { name: /^Save/ }).first().click();
await page.waitForTimeout(400);
await go('#/growth/expect'); await shot('33-guide-before-due-date', {});

// Themes: guide and Progress for Sample Child A in all five themes
await switchTo('Sample Child A');
for (const theme of ['earth', 'sky', 'blush', 'lavender', 'sage']) {
  await go('#/settings');
  await page.getByTestId(`theme-${theme}`).click();
  await go('#/growth/expect/5'); await shot(`40-theme-${theme}-guide`, {});
  await go('#/growth/progress'); await shot(`41-theme-${theme}-progress`, {});
}
await go('#/settings'); await page.getByTestId('theme-earth').click();

// Narrow phone
await page.setViewportSize({ width: 320, height: 640 });
await go('#/growth'); await shot('50-narrow-320-growth', {});
await go('#/growth/expect/1'); await shot('51-narrow-320-guide', {});
await go('#/growth/library'); await shot('52-narrow-320-library', {});

await browser.close();
