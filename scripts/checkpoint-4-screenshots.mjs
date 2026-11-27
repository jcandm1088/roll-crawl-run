// Checkpoint 4 screenshots (FICTIONAL data only): the Journal at phone, narrow-phone and desktop widths.
// Usage: npm run build && (npx vite preview --port 4180 &) && node scripts/checkpoint-4-screenshots.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4180/';
const OUT = new URL(`../docs/screenshots/${process.env.SHOT_DIR ?? 'checkpoint-4'}/`, import.meta.url);
mkdirSync(OUT, { recursive: true });
const NOW = new Date('2026-11-27T10:00:00');
const browser = await chromium.launch();

async function session(width, height = 844) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: width < 700 });
  const page = await context.newPage();
  await page.clock.setFixedTime(NOW);
  const shot = async (name, full = true) => {
    await page.waitForTimeout(450);
    const style = full ? await page.addStyleTag({ content: 'body{position:relative} .bottomnav{position:absolute !important;bottom:0 !important;top:auto !important}' }) : null;
    if (full) await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: new URL(`${name}.png`, OUT).pathname, fullPage: full });
    if (style) await style.evaluate((el) => el.remove());
    console.log('saved', name);
  };
  return { context, page, shot };
}

async function onboard(page, name, dob, theme) {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill(dob);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill(name);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  if (theme) await page.getByTestId(`theme-${theme}`).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await page.getByRole('navigation', { name: 'Main' }).waitFor();
}

let minute = 0;
async function fill(page, e) {
  const form = page.getByTestId('entry-form');
  if (e.type) await page.getByTestId(`entry-type-${e.type}`).click();
  if (e.date) await form.getByLabel('Date', { exact: true }).fill(e.date);
  if (e.title) await form.getByLabel('Title (optional)').fill(e.title);
  if (e.body) await form.getByLabel('Entry', { exact: true }).fill(e.body);
  if (e.tags) await form.getByLabel('Tags (optional)').fill(e.tags);
  if (e.question) await page.getByTestId('entry-question-flag').locator('input').check();
  if (e.answered) await page.getByTestId('entry-answered-flag').locator('input').check();
}
async function addEntry(page, e) {
  await page.clock.setFixedTime(new Date(NOW.getTime() + ++minute * 60_000));
  await page.getByTestId('new-entry').click();
  await fill(page, e);
  await page.getByTestId('save-entry').click();
  await page.getByTestId('saved').waitFor();
}

const ENTRIES = [
  { type: 'care', date: '2026-10-02', title: 'Feeding question', body: 'Fictional note. Asked when to start more textured foods.\n\nResponse at the visit: start slowly, one new food at a time.', tags: 'feeding', question: true, answered: true },
  { date: '2026-11-08', title: 'Park day', body: 'Fictional entry. First time on the baby swing. So much giggling that the whole playground turned to look.', tags: 'family, outings' },
  { type: 'care', date: '2026-11-20', body: 'Fictional note. The provider suggested a little more floor time each day, in short stretches.', tags: 'floor time' },
  { type: 'care', date: '2026-11-25', title: 'Sleep question', body: 'Fictional note. Waking twice most nights this week. Is that expected at this age, and should the bedtime routine change?', tags: 'sleep', question: true },
  { title: 'First giggles at breakfast', body: 'Fictional entry. A whole morning of laughing at the kitchen table. The spoon was apparently the funniest thing in the world.\n\nWe want to remember this one.', tags: 'firsts, family' },
];

// Phone (390): empty state, feed, both entry types, editing, the unanswered filter, the discard question, Home.
{
  const { context, page, shot } = await session(390);
  await onboard(page, 'Sample Child A', '2025-03-14');
  await page.goto(`${BASE}#/journal`);
  await page.getByTestId('journal-empty').waitFor();
  await shot('01-journal-empty');
  for (const e of ENTRIES) await addEntry(page, e);
  await page.reload();
  await page.getByTestId('journal-feed').waitFor();
  await shot('02-journal-feed');
  await page.getByTestId('journal-entry').filter({ hasText: 'First giggles' }).getByTestId('entry-open').click();
  await shot('03-personal-reflection-open', false);
  await page.getByTestId('entry-close').click();
  await page.getByTestId('journal-entry').filter({ hasText: 'Sleep question' }).getByTestId('entry-open').click();
  await shot('04-care-note-open', false);
  await page.getByTestId('entry-close').click();
  await page.getByTestId('filter-unanswered').click();
  await shot('05-unanswered-questions-filter');
  await page.getByTestId('clear-filters').click();
  await page.getByRole('searchbox', { name: 'Search journal' }).fill('giggl');
  await page.getByTestId('more-filters').locator('summary').click();
  await page.getByTestId('filter-tag').filter({ hasText: 'family' }).click();
  await shot('06-search-and-tag-filter');
  await page.getByTestId('clear-filters').click();
  await page.goto(`${BASE}#/home`);
  await page.getByTestId('qa-journal-entry').waitFor();
  await shot('07-home-four-tabs', false);
  await context.close();
}

// Tall phone-width window so the whole editor is visible in one image.
{
  const { context, page, shot } = await session(390, 1180);
  await onboard(page, 'Sample Child A', '2025-03-14');
  await page.goto(`${BASE}#/journal`);
  for (const e of ENTRIES.slice(2, 5)) await addEntry(page, e);
  await page.getByTestId('journal-entry').filter({ hasText: 'Sleep question' }).getByTestId('entry-open').click();
  await page.getByTestId('entry-edit').click();
  await shot('08-entry-editing-care-note', false);
  await page.getByTestId('entry-form').getByLabel('Entry', { exact: true }).fill('Fictional note. Waking twice most nights this week. Is that expected at this age?\n\nA change that has not been saved yet.');
  await page.getByTestId('cancel-entry').click();
  await shot('09-discard-changes-question', false);
  await context.close();
}

// Narrow phone (320): feed and editor.
{
  const { context, page, shot } = await session(320, 700);
  await onboard(page, 'Sample Child A', '2025-03-14', 'sage');
  await page.goto(`${BASE}#/journal`);
  for (const e of ENTRIES.slice(2, 5)) await addEntry(page, e);
  await page.reload();
  await page.getByTestId('journal-feed').waitFor();
  await shot('10-narrow-320-feed');
  await page.getByTestId('new-entry').click();
  await fill(page, { type: 'care', title: 'Fictional question', body: 'Fictional note typed on a narrow phone.', tags: 'sleep', question: true });
  await page.getByTestId('entry-form').getByLabel('Title (optional)').scrollIntoViewIfNeeded();
  await shot('11-narrow-320-editor', false);
  await context.close();
}

// Desktop (1280).
{
  const { context, page, shot } = await session(1280, 900);
  await onboard(page, 'Sample Child A', '2025-03-14', 'sky');
  await page.goto(`${BASE}#/journal`);
  for (const e of ENTRIES) await addEntry(page, e);
  await page.reload();
  await page.getByTestId('journal-feed').waitFor();
  await shot('12-desktop-feed');
  await context.close();
}

await browser.close();
