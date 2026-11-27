// Checkpoint 3 screenshots (FICTIONAL data only): the Simplified Calendar at desktop and narrow-mobile widths.
// Usage: npm run build && (npx vite preview --port 4180 &) && node scripts/checkpoint-3-screenshots.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4180/';
const OUT = new URL('../docs/screenshots/checkpoint-3/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const NOW = new Date('2026-11-26T10:00:00');
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
  if (theme) await page.getByRole('radio', { name: new RegExp(theme, 'i') }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await page.getByRole('navigation', { name: 'Main' }).waitFor();
}

async function addEvent(page, { kind, title, date, time, location, notes }) {
  await page.getByTestId('add-event').click();
  await page.getByTestId(`event-kind-${kind}`).click();
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Date', { exact: true }).fill(date);
  if (time) await page.getByLabel('Time (optional)').fill(time);
  if (location) await page.getByLabel('Location (optional)').fill(location);
  if (notes) await page.getByLabel('Notes (optional)').fill(notes);
  await page.getByTestId('save-event').click();
  await page.getByTestId('saved').waitFor();
}

const EVENTS = [
  { kind: 'medical', title: 'Fictional checkup', date: '2026-11-30', time: '09:30', location: 'Sample Clinic, Room 2', notes: 'Bring the fictional question list.' },
  { kind: 'medical', title: 'Fictional therapy session', date: '2026-12-03', time: '14:00', location: 'Sample Therapy Center' },
  { kind: 'personal', title: 'Fictional family visit', date: '2026-11-26' },
  { kind: 'personal', title: 'Fictional play group', date: '2026-11-30', time: '16:00' },
];

async function populated(width, height, theme) {
  const s = await session(width, height);
  await onboard(s.page, 'Sample Child A', '2026-07-20', theme); // a 4-month-old on Nov 26, 2026
  await s.page.goto(`${BASE}#/calendar`);
  for (const e of EVENTS) await addEvent(s.page, e);
  await s.page.getByTestId('cal-today').click().catch(() => undefined);
  return s;
}

// 1–4: phone (390 px), Earth theme
{
  const s = await populated(390, 844);
  await s.page.getByTestId('cal-today').click().catch(() => undefined);
  await s.shot('01-calendar-month-390');
  await s.page.getByTestId('overlay-vaccines').click();
  await s.page.locator('[data-date="2026-11-20"]').click(); // the 4-month reference age
  await s.page.getByTestId('vax-discuss').locator('summary').click();
  await s.page.getByTestId('vax-source').locator('summary').click();
  await s.shot('02-calendar-vaccine-overlay-390');
  await s.page.locator('[data-date="2026-11-30"]').click();
  await s.page.getByTestId('day-events').getByTestId('event-row').first().click();
  await s.shot('03-event-details-390', false);
  await s.page.getByTestId('event-edit').click();
  await s.shot('04-event-edit-390', false);
  await s.context.close();
}
// 5–6: narrow phone (320 px), Sage theme
{
  const s = await populated(320, 760, 'Sage');
  await s.page.getByTestId('overlay-vaccines').click();
  await s.shot('05-calendar-vaccine-overlay-320-sage');
  await s.page.getByTestId('add-event').click();
  await s.shot('06-add-event-320-sage', false);
  await s.context.close();
}
// 7: desktop (1280 px), Lavender theme
{
  const s = await populated(1280, 900, 'Lavender');
  await s.page.getByTestId('overlay-vaccines').click();
  await s.shot('07-calendar-desktop-1280-lavender');
  await s.context.close();
}
await browser.close();
