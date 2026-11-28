// Checkpoint 4-R screenshots (FICTIONAL data only): the revised Journal card distinction (R-025) in all five
// themes, the single-selection primary views (R-024), and the narrow layout.
// "Before" images are the Checkpoint 4 set in docs/screenshots/checkpoint-4/.
// Usage: npm run build && (npx vite preview --port 4180 &) && node scripts/checkpoint-4-r-screenshots.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4180/';
const OUT = new URL('../docs/screenshots/checkpoint-4-r/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const NOW = new Date('2026-11-27T10:00:00');
const browser = await chromium.launch();

const ENTRIES = [
  { type: 'care', date: '2026-10-02', title: 'Feeding question', body: 'Fictional note. Asked when to start more textured foods.\n\nResponse at the visit: start slowly, one new food at a time.', tags: 'feeding', question: true, answered: true },
  { date: '2026-11-08', title: 'Park day', body: 'Fictional entry. First time on the baby swing. So much giggling that the whole playground turned to look.', tags: 'family, outings' },
  { type: 'care', date: '2026-11-20', body: 'Fictional note. The provider suggested a little more floor time each day, in short stretches.', tags: 'floor time' },
  { type: 'care', date: '2026-11-25', title: 'Sleep question', body: 'Fictional note. Waking twice most nights this week. Is that expected at this age?', tags: 'sleep', question: true },
  { title: 'First giggles at breakfast', body: 'Fictional entry. A whole morning of laughing at the kitchen table. The spoon was apparently the funniest thing in the world.', tags: 'firsts, family' },
];

async function session(width, height, theme) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true });
  const page = await context.newPage();
  await page.clock.setFixedTime(NOW);
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill('2025-03-14');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill('Sample Child A');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByTestId(`theme-${theme}`).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await page.getByRole('navigation', { name: 'Main' }).waitFor();
  await page.goto(`${BASE}#/journal`);
  let minute = 0;
  for (const e of ENTRIES) {
    await page.clock.setFixedTime(new Date(NOW.getTime() + ++minute * 60_000));
    await page.getByTestId('new-entry').click();
    const form = page.getByTestId('entry-form');
    if (e.type) await page.getByTestId(`entry-type-${e.type}`).click();
    if (e.date) await form.getByLabel('Date', { exact: true }).fill(e.date);
    if (e.title) await form.getByLabel('Title (optional)').fill(e.title);
    await form.getByLabel('Entry', { exact: true }).fill(e.body);
    if (e.tags) await form.getByLabel('Tags (optional)').fill(e.tags);
    if (e.question) await page.getByTestId('entry-question-flag').locator('input').check();
    if (e.answered) await page.getByTestId('entry-answered-flag').locator('input').check();
    await page.getByTestId('save-entry').click();
    await page.getByTestId('saved').waitFor();
  }
  await page.reload();
  await page.getByTestId('journal-feed').waitFor();
  const shot = async (name) => {
    await page.waitForTimeout(450);
    const style = await page.addStyleTag({ content: 'body{position:relative} .bottomnav{position:absolute !important;bottom:0 !important;top:auto !important}' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: new URL(`${name}.png`, OUT).pathname, fullPage: true });
    await style.evaluate((el) => el.remove());
    console.log('saved', name);
  };
  return { context, page, shot };
}

let n = 0;
for (const theme of ['earth', 'sky', 'blush', 'lavender', 'sage']) {
  const { context, page, shot } = await session(390, 844, theme);
  await shot(`0${++n}-mixed-feed-${theme}`);
  if (theme === 'earth') {
    await page.getByTestId('filter-type-care').click();
    await shot('06-care-notes-view-all-care-notes');
    await page.getByTestId('filter-unanswered').click();
    await shot('07-unanswered-questions-view');
  }
  await context.close();
}
{
  const { context, shot } = await session(320, 700, 'lavender');
  await shot('08-narrow-320-mixed-feed');
  await context.close();
}
await browser.close();
