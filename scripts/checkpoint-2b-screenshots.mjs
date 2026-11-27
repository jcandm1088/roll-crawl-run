// Checkpoint 2b screenshots (FICTIONAL data only): Goals & Exercises, tracker, Browse, Progress over time, Home.
// Usage: npm run build && (npx vite preview --port 4180 &) && node scripts/checkpoint-2b-screenshots.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4180/';
const OUT = new URL('../docs/screenshots/checkpoint-2b/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const browser = await chromium.launch();

async function session(width, scale = 2) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: scale, hasTouch: true });
  const page = await context.newPage();
  const shot = async (name, opts = { fullPage: true }) => {
    await page.waitForTimeout(450);
    // Full-page captures: keep the fixed bars at their place in the page instead of over the content.
    if (opts.fullPage) await page.evaluate(() => window.scrollTo(0, 0));
    const style = opts.fullPage ? await page.addStyleTag({ content: 'body{position:relative} .bottomnav{position:absolute !important;bottom:0 !important;top:auto !important}' }) : null;
    await page.screenshot({ path: new URL(`${name}.png`, OUT).pathname, ...opts });
    if (style) await style.evaluate((el) => el.remove());
    console.log('saved', name);
  };
  return { context, page, shot };
}

async function onboard(page, name, dob) {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill(dob);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill(name);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await page.getByRole('navigation', { name: 'Main' }).waitFor();
}

async function seed(page) {
  const goal = async (title, accomplish) => {
    await page.goto(`${BASE}#/growth/goals/new`);
    await page.getByLabel('Goal name').fill(title);
    await page.getByLabel('Area').selectOption('fine-motor');
    await page.getByTestId('save-goal').click();
    await page.getByTestId('goal-title').waitFor();
    if (accomplish) {
      await page.getByTestId('mark-accomplished').click();
      await page.getByTestId('confirm-accomplished').click();
      await page.getByTestId('saved').waitFor();
    }
  };
  await goal('Stack three blocks', false);
  await goal('Say “more” at snack time', false);
  await goal('Roll a ball back and forth', true);
  await page.goto(`${BASE}#/growth/goals/achievement/new`);
  await page.getByLabel('What happened?').fill('First steps on the beach');
  await page.getByLabel('Date', { exact: true }).fill(daysAgo(20));
  await page.getByTestId('save-achievement').click();
  await page.getByTestId('goal-title').waitFor();
  // Exercises: a CDC activity, a parent activity and a specialist-directed one.
  await page.goto(`${BASE}#/growth/exercises/activity/cdc22-act-a057`);
  await page.getByTestId('add-to-my-exercises').click();
  await page.getByTestId('rule-daily').click();
  await page.getByTestId('save-exercise').click();
  await page.getByTestId('exercise-title').waitFor();
  await page.goto(`${BASE}#/growth/exercises/new`);
  await page.getByLabel('Exercise name').fill('Floor play');
  await page.getByTestId('method-stopwatch').click();
  await page.getByLabel('Minutes').fill('10');
  await page.getByTestId('rule-daily').click();
  await page.getByTestId('per-day').fill('2');
  await page.getByTestId('save-exercise').click();
  await page.getByTestId('exercise-title').waitFor();
  await page.goto(`${BASE}#/growth/exercises/new`);
  await page.getByLabel('Exercise name').fill('Heel cord stretches');
  await page.getByTestId('origin-provider').click();
  await page.getByLabel('Provider name or specialty (optional)').fill('Dr. Sample, physical therapy');
  await page.getByLabel('Instructions (optional)').fill('As shown at the fictional clinic visit.');
  await page.getByTestId('method-reps').click();
  await page.getByLabel('Target repetitions (optional)').fill('10');
  await page.getByTestId('rule-weekdays').click();
  for (const d of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) await page.getByRole('button', { name: d, exact: true }).click();
  await page.getByTestId('save-exercise').click();
  await page.getByTestId('exercise-title').waitFor();
  await page.goto(`${BASE}#/growth/exercises`);
  await page.getByTestId('routine-complete').first().click();
  await page.getByTestId('undo-banner').waitFor();
}

// --- Main phone captures (390 px) ---------------------------------------------------------------
{
  const { context, page, shot } = await session(390);
  await onboard(page, 'Sample Child A', daysAgo(400));
  await seed(page);
  await page.goto(`${BASE}#/growth`);
  await shot('01-growth-landing');
  await page.goto(`${BASE}#/growth/goals`);
  await shot('02-goals-and-exercises');
  await page.goto(`${BASE}#/growth/goals/my`);
  await shot('03-my-goals');
  await page.goto(`${BASE}#/growth/goals/new`);
  await page.getByTestId('goal-more').locator('summary').click();
  await shot('04-create-goal');
  await page.goto(`${BASE}#/growth/goals/my`);
  await page.getByTestId('goal-row').first().click();
  await shot('05-goal-detail');
  await page.goto(`${BASE}#/growth/goals/achievement/new`);
  await shot('06-record-achievement');
  await page.goto(`${BASE}#/growth/goals/ideas`);
  await shot('07-inspiration');
  await page.goto(`${BASE}#/growth/exercises`);
  await shot('10-exercises');
  await page.goto(`${BASE}#/growth/exercises/new`);
  await page.getByTestId('method-stopwatch').click();
  await page.getByTestId('rule-weekdays').click();
  await shot('11-create-exercise');
  await page.goto(`${BASE}#/growth/exercises`);
  await page.getByTestId('routine-item').filter({ hasText: 'Floor play' }).getByTestId('routine-start').click();
  await page.getByTestId('sw-start').click();
  await page.waitForTimeout(3200);
  await page.getByTestId('sw-pause').click();
  await shot('12-stopwatch', { fullPage: false });
  await page.keyboard.press('Escape');
  await page.getByTestId('routine-item').filter({ hasText: 'Heel cord' }).getByTestId('routine-start').click();
  for (let i = 0; i < 7; i++) await page.getByTestId('rep-plus').click();
  await shot('13-repetition-counter', { fullPage: false });
  await page.keyboard.press('Escape');
  await page.getByTestId('exercise-row').filter({ hasText: 'Heel cord' }).click();
  await shot('14-provider-exercise');
  await page.goto(`${BASE}#/growth/exercises`);
  await page.getByTestId('exercise-row').first().click();
  await shot('15-adopted-cdc-exercise');
  await page.goto(`${BASE}#/growth/exercises/browse`);
  await shot('20-browse');
  await page.getByTestId('area-gross-motor').locator('button').click();
  await shot('21-browse-gross-motor-open');
  await page.goto(`${BASE}#/growth/exercises/activity/cdc22-act-a004`);
  await shot('22-activity-tummy-time');
  await page.goto(`${BASE}#/growth/exercises/browse/2`);
  await page.getByTestId('area-fine-motor').locator('button').click();
  await shot('23-browse-empty-area', { fullPage: false });
  await page.goto(`${BASE}#/home`);
  await shot('30-home-todays-exercises');
  await page.goto(`${BASE}#/growth/progress`);
  await shot('31-progress-personal-summary');
  await page.goto(`${BASE}#/growth/progress/history/goals`);
  await shot('32-progress-over-time-goals');
  await page.goto(`${BASE}#/growth/progress/history/exercises`);
  await page.getByTestId('chart-table').locator('summary').click();
  await shot('33-progress-over-time-exercises-table');
  await page.goto(`${BASE}#/growth/progress/history/milestones`);
  await shot('34-progress-over-time-milestones');
  for (const theme of ['earth', 'sky', 'blush', 'lavender', 'sage']) {
    await page.goto(`${BASE}#/settings`);
    await page.getByTestId(`theme-${theme}`).click();
    await page.goto(`${BASE}#/growth/exercises`);
    await shot(`40-theme-${theme}-exercises`, { fullPage: false });
    await page.goto(`${BASE}#/growth/goals/my`);
    await shot(`41-theme-${theme}-my-goals`, { fullPage: false });
  }
  await context.close();
}

// --- Younger child: Browse intro ------------------------------------------------------------------
{
  const { context, page, shot } = await session(390);
  await onboard(page, 'Sample Newborn', daysAgo(25));
  await page.goto(`${BASE}#/growth/exercises/browse`);
  await shot('24-browse-under-two-months', { fullPage: false });
  await context.close();
}

// --- Narrow phone (320 px) ------------------------------------------------------------------------
{
  const { context, page, shot } = await session(320);
  await onboard(page, 'Sample Child With A Long Name', daysAgo(400));
  await seed(page);
  await page.goto(`${BASE}#/growth/exercises`);
  await shot('50-narrow-exercises');
  await page.goto(`${BASE}#/growth/goals/my`);
  await shot('51-narrow-my-goals');
  await page.goto(`${BASE}#/growth/exercises`);
  await page.getByTestId('routine-item').filter({ hasText: 'Floor play' }).getByTestId('routine-start').click();
  await shot('52-narrow-stopwatch', { fullPage: false });
  await page.keyboard.press('Escape');
  await page.goto(`${BASE}#/growth/progress/history/milestones`);
  await shot('53-narrow-progress-over-time');
  await context.close();
}

await browser.close();
