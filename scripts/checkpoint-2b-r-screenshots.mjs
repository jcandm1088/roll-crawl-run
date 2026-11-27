// Checkpoint 2b-R screenshots (FICTIONAL data only): goal ideas, reduced attribution, exercise form and
// duration fields, session deletion, stopwatch recovery notice, 6- and 12-month charts at narrow widths.
// Usage: npm run build && (npx vite preview --port 4180 &) && node scripts/checkpoint-2b-r-screenshots.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4180/';
const OUT = new URL('../docs/screenshots/checkpoint-2b-r/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const NOW = new Date('2026-11-26T10:00:00');

const browser = await chromium.launch();

async function session(width, opts = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const page = await context.newPage();
  if (opts.clock === 'install') await page.clock.install({ time: NOW });
  else await page.clock.setFixedTime(NOW);
  const shot = async (name, target) => {
    await page.waitForTimeout(450);
    if (target) {
      // Element captures: keep the sticky top bar and the bottom navigation out of the picture.
      const style = await page.addStyleTag({ content: '.topbar{position:static !important} .bottomnav{display:none !important}' });
      await target.scrollIntoViewIfNeeded();
      await target.screenshot({ path: new URL(`${name}.png`, OUT).pathname });
      await style.evaluate((el) => el.remove());
    }
    else {
      await page.evaluate(() => window.scrollTo(0, 0));
      const style = await page.addStyleTag({ content: 'body{position:relative} .bottomnav{position:absolute !important;bottom:0 !important;top:auto !important}' });
      await page.screenshot({ path: new URL(`${name}.png`, OUT).pathname, fullPage: true });
      await style.evaluate((el) => el.remove());
    }
    console.log('saved', name);
  };
  return { context, page, shot };
}

async function onboard(page, name, dob, ga) {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill(dob);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill(name);
  await page.getByRole('button', { name: 'Continue' }).click();
  if (ga) {
    await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
    await page.getByRole('button', { name: 'Weeks at birth' }).click();
    await page.getByLabel('Weeks', { exact: true }).selectOption(String(ga));
    await page.getByRole('radio', { name: /Corrected age \(from due date\)/ }).click();
  }
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await page.getByRole('navigation', { name: 'Main' }).waitFor();
}

async function newExercise(page, title, method, rule) {
  await page.goto(`${BASE}#/growth/exercises/new`);
  await page.getByLabel('Exercise name').fill(title);
  await page.getByTestId(`method-${method}`).click();
  await page.getByTestId(`rule-${rule}`).click();
  await page.getByTestId('save-exercise').click();
  await page.getByTestId('exercise-title').waitFor();
}

// 1. Goal ideas for a 4-month-old, another range, and before the due date.
{
  const { context, page, shot } = await session(390);
  await onboard(page, 'Robin', '2026-07-20');
  await page.goto(`${BASE}#/growth/goals/ideas`);
  await shot('01-goal-ideas-4-month-old');
  await page.goto(`${BASE}#/growth/goals/ideas/r24-36`);
  await shot('02-goal-ideas-24-to-36-months');
  await page.goto(`${BASE}#/growth/goals/ideas/r0-6`);
  await page.locator('[data-idea="gi-r0-6-04"] a.ms-item').click();
  await shot('03-goal-from-idea-editable');
  // 2. Reduced attribution on an activity page.
  await page.goto(`${BASE}#/growth/exercises/activity/cdc22-act-a004`);
  await shot('05-activity-page-attribution');
  // 3. Exercise form: headings and target fields.
  await page.goto(`${BASE}#/growth/exercises/new`);
  await page.getByLabel('Exercise name').fill('Floor play');
  await page.getByTestId('method-stopwatch').click();
  await page.getByTestId('rule-daily').click();
  await shot('06-add-exercise-tracking', page.locator('.card', { has: page.getByTestId('ex-tracking') }));
  await shot('07-add-exercise-schedule', page.locator('.card', { has: page.getByTestId('ex-schedule') }));
  // 4. Charts (fixed clock: Nov 2026, born Jul 2026).
  await page.goto(`${BASE}#/growth/progress/history/goals`);
  await shot('13-chart-6-months-390', page.locator('section.card', { has: page.getByTestId('chart') }));
  await context.close();
}
{
  const { context, page, shot } = await session(390);
  await onboard(page, 'Avery', '2026-10-29', 30);
  await page.goto(`${BASE}#/growth/goals/ideas`);
  await shot('04-goal-ideas-before-due-date', page.getByTestId('original-ideas'));
  await context.close();
}
// 5. Narrow: form at 320, session correction, deletion confirmation, 12-month chart with table, themes.
{
  const { context, page, shot } = await session(320);
  await onboard(page, 'Robin', '2026-07-20');
  await page.goto(`${BASE}#/growth/exercises/new`);
  await page.getByTestId('method-stopwatch').click();
  await shot('08-add-exercise-target-320', page.locator('.card', { has: page.getByTestId('ex-tracking') }));
  await newExercise(page, 'Floor play', 'stopwatch', 'asNeeded');
  for (const [m, s, note] of [['2', '5', 'Fictional: rolled to reach a toy'], ['4', '0', '']]) {
    await page.getByTestId('record-past').click();
    await page.getByLabel('Minutes').fill(m);
    await page.getByLabel('Seconds').fill(s);
    if (note) await page.getByLabel('Note (optional)').fill(note);
    await page.getByTestId('save-manual-session').click();
    await page.getByTestId('saved').waitFor();
  }
  await page.getByRole('button', { name: /^Correct session/ }).first().click();
  await shot('09-session-correction-320', page.getByRole('dialog'));
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByTestId('delete-session').first().click();
  await shot('10-delete-session-confirmation-320', page.getByRole('dialog'));
  await page.getByTestId('confirm-delete-session').click();
  await page.getByTestId('saved').waitFor();
  await shot('11-sessions-after-deletion-320', page.getByTestId('sessions'));
  await page.goto(`${BASE}#/growth/progress/history/milestones`);
  await page.getByTestId('history-period').getByRole('button', { name: '1 year' }).click();
  await page.getByTestId('chart-table').locator('summary').click();
  await shot('14-chart-12-months-320-with-table', page.locator('section.card', { has: page.getByTestId('chart') }));
  for (const theme of ['sky', 'blush', 'lavender', 'sage']) {
    await page.goto(`${BASE}#/settings`);
    await page.getByTestId(`theme-${theme}`).click();
    await page.goto(`${BASE}#/growth/progress/history/exercises`);
    await page.getByTestId('history-period').getByRole('button', { name: '1 year' }).click();
    await shot(`15-chart-12-months-320-${theme}`, page.getByTestId('chart'));
  }
  await context.close();
}
// 6. Stopwatch recovery notice (simulated clock), at 390 and 320.
for (const width of [390, 320]) {
  const { context, page, shot } = await session(width, { clock: 'install' });
  await onboard(page, 'Robin', '2026-07-20');
  await newExercise(page, 'Tummy time', 'stopwatch', 'daily');
  await page.goto(`${BASE}#/growth/exercises`);
  await page.getByTestId('routine-start').click();
  await page.getByTestId('sw-start').click();
  await page.clock.runFor(65_000);
  await page.reload();
  await page.clock.runFor(5_000);
  await page.getByTestId('routine-start').click();
  await page.getByTestId('recovery-notice').waitFor();
  await shot(`12-stopwatch-recovery-${width}`, page.getByRole('dialog'));
  await context.close();
}
await browser.close();
