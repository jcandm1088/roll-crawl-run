/**
 * Checkpoint 3 — Simplified Calendar. FICTIONAL data only.
 * Month view and navigation · events (create, view, edit, delete) · three independent overlays ·
 * vaccine schedule reference (single ages, inclusive ranges, undated provider-discussion items) ·
 * profile isolation, deletion and reset · failed writes · persistence · offline · accessibility,
 * themes and narrow layouts.
 * Automated in headless Chromium only; this is not Safari or iPhone testing.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { addChild, completeOnboarding, deleteProfile } from './helpers';

const NOW = new Date('2026-11-26T10:00:00'); // a Thursday
const FOUR_MONTHS = '2026-07-20'; // 4 months old on Nov 20, 2026

async function start(page: Page, opts: { dob?: string; name?: string; theme?: string } = {}) {
  await page.clock.setFixedTime(NOW);
  await completeOnboarding(page, { dob: opts.dob ?? FOUR_MONTHS, name: opts.name ?? 'Sample Child A', theme: opts.theme });
  await page.goto('./#/calendar');
  await expect(page.getByTestId('calendar')).toBeVisible();
}

interface Ev { kind?: 'medical' | 'personal'; title: string; date: string; time?: string; location?: string; notes?: string }
async function fillEvent(page: Page, e: Partial<Ev>) {
  if (e.kind) await page.getByTestId(`event-kind-${e.kind}`).click();
  if (e.title !== undefined) await page.getByLabel('Title').fill(e.title);
  if (e.date !== undefined) await page.getByLabel('Date', { exact: true }).fill(e.date);
  if (e.time !== undefined) await page.getByLabel('Time (optional)').fill(e.time);
  if (e.location !== undefined) await page.getByLabel('Location (optional)').fill(e.location);
  if (e.notes !== undefined) await page.getByLabel('Notes (optional)').fill(e.notes);
}
async function addEvent(page: Page, e: Ev) {
  await page.getByTestId('add-event').click();
  await fillEvent(page, e);
  await page.getByTestId('save-event').click();
  await expect(page.getByTestId('event-form')).toHaveCount(0);
  await expect(page.getByTestId('saved')).toBeVisible();
}
const day = (page: Page, date: string) => page.locator(`[data-date="${date}"]`);
const storedEvents = (page: Page) => page.evaluate(() => new Promise<Array<Record<string, unknown>>>((resolve) => {
  const r = indexedDB.open('roll-crawl-run');
  r.onsuccess = () => {
    const q = r.result.transaction('events').objectStore('events').getAll();
    q.onsuccess = () => { r.result.close(); resolve(q.result as Array<Record<string, unknown>>); };
  };
}));
const dbVersion = (page: Page) => page.evaluate(() => new Promise<number>((resolve) => {
  const r = indexedDB.open('roll-crawl-run');
  r.onsuccess = () => { const v = r.result.version; r.result.close(); resolve(v); };
}));
/** Waits for running entrance animations to finish (no fixed delay), so geometry is read at rest. */
const settle = (page: Page) => page.evaluate(async () => {
  const running = document.getAnimations().filter((a) => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming().endTime as number));
  await Promise.all(running.map((a) => a.finished.catch(() => undefined)));
});
const noOverflow = async (page: Page, label: string) => {
  await settle(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), label).toBeLessThanOrEqual(0);
  const over = await page.evaluate(() => [...document.querySelectorAll('input, select, textarea, button, a.btn, table, .card, .chip')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && (r.right > window.innerWidth + 0.5 || r.left < -0.5);
  }).length);
  expect(over, label).toBe(0);
};
async function switchTo(page: Page, name: string) {
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: new RegExp(name) }).click();
  await expect(page.getByTestId('child-chip')).toContainText(name);
}

// ---------------------------------------------------------------------------
// Month view and navigation
// ---------------------------------------------------------------------------

test('opens on the current month with today marked and selected, and nothing prepopulated', async ({ page }) => {
  await start(page);
  await expect(page.getByRole('heading', { name: 'Calendar', level: 1 })).toBeVisible();
  await expect(page.getByText('Preview only.')).toHaveCount(0);
  await expect(page.getByTestId('cal-month')).toHaveText('November 2026');
  await expect(page.locator('.cal-day')).toHaveCount(30);
  const today = day(page, '2026-11-26');
  await expect(today).toHaveAttribute('aria-current', 'date');
  await expect(today).toHaveAttribute('aria-pressed', 'true');
  await expect(today).toHaveAttribute('aria-label', 'Thursday, November 26, 2026, today');
  await expect(page.locator('.cal-day[aria-current="date"]')).toHaveCount(1);
  await expect(page.locator('.cal-day[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.getByTestId('selected-date')).toContainText('Thursday, November 26, 2026');
  await expect(page.getByTestId('selected-date')).toContainText('Today');
  await expect(page.getByTestId('no-events')).toBeVisible();
  await expect(page.getByTestId('no-upcoming')).toBeVisible();
  // Today is told apart from the selected day by more than color: an outline and an underlined number.
  const todayStyle = await today.evaluate((el) => ({ border: getComputedStyle(el).borderTopColor, underline: getComputedStyle(el.querySelector('.cal-num')!).textDecorationLine }));
  expect(todayStyle.underline).toContain('underline');
  // Exactly three overlays; the vaccine schedule is off, and nothing is stored or shown for it.
  await expect(page.getByTestId('overlays').getByRole('button')).toHaveText(['Medical appointments', 'Personal', 'Recommended vaccine schedule']);
  await expect(page.getByTestId('overlay-medical')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('overlay-personal')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('overlay-vaccines')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('vaccine-info')).toHaveCount(0);
  await expect(page.locator('.cal-mark-vaccines')).toHaveCount(1); // only the legend chip
  await expect(page.locator('.cal-grid .cal-mark')).toHaveCount(0);
  expect(await storedEvents(page)).toEqual([]);
});

test('previous and next move one month at a time, across years, and “Go to today” returns', async ({ page }) => {
  await start(page);
  await expect(page.getByTestId('cal-today')).toHaveCount(0); // already on today
  await page.getByTestId('cal-next').click();
  await expect(page.getByTestId('cal-month')).toHaveText('December 2026');
  await expect(page.locator('.cal-day')).toHaveCount(31);
  await expect(page.locator('.cal-day[aria-current="date"]')).toHaveCount(0); // today is not in this month
  await expect(page.getByTestId('selected-date')).toHaveText('Tuesday, December 1, 2026');
  await page.getByTestId('cal-next').click();
  await expect(page.getByTestId('cal-month')).toHaveText('January 2027');
  await expect(day(page, '2027-01-01')).toHaveAttribute('aria-label', 'Friday, January 1, 2027');
  for (let i = 0; i < 13; i++) await page.getByTestId('cal-next').click();
  await expect(page.getByTestId('cal-month')).toHaveText('February 2028');
  await expect(page.locator('.cal-day')).toHaveCount(29); // leap year
  await expect(day(page, '2028-02-29')).toHaveAttribute('aria-label', 'Tuesday, February 29, 2028');
  await page.getByTestId('cal-today').click();
  await expect(page.getByTestId('cal-month')).toHaveText('November 2026');
  await expect(day(page, '2026-11-26')).toHaveAttribute('aria-pressed', 'true');
  for (let i = 0; i < 2; i++) await page.getByTestId('cal-prev').click();
  await expect(page.getByTestId('cal-month')).toHaveText('September 2026');
  await page.getByTestId('cal-prev').click();
  await page.getByTestId('cal-next').click();
  await expect(page.getByTestId('cal-month')).toHaveText('September 2026');
  // Selecting a day shows that day.
  await day(page, '2026-09-15').click();
  await expect(page.getByTestId('selected-date')).toHaveText('Tuesday, September 15, 2026');
  await expect(day(page, '2026-09-15')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.cal-day[aria-pressed="true"]')).toHaveCount(1);
});

test('the date rolls over at midnight: today moves to the next day', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-30T23:59:30') });
  await completeOnboarding(page, { dob: FOUR_MONTHS, name: 'Sample Child A' });
  await page.goto('./#/calendar');
  await expect(day(page, '2026-11-30')).toHaveAttribute('aria-current', 'date');
  await page.clock.runFor(61_000);
  await expect(day(page, '2026-11-30')).not.toHaveAttribute('aria-current', 'date');
  await page.getByTestId('cal-next').click();
  await expect(day(page, '2026-12-01')).toHaveAttribute('aria-current', 'date');
});

// ---------------------------------------------------------------------------
// Events: create, view, edit, delete
// ---------------------------------------------------------------------------

test('create with a title and date only, view it, edit every field, then delete it', async ({ page }) => {
  await start(page);
  await day(page, '2026-11-30').click();
  await page.getByTestId('add-event').click();
  await expect(page.getByRole('dialog', { name: 'Add event' })).toBeVisible();
  await expect(page.getByLabel('Date', { exact: true })).toHaveValue('2026-11-30'); // the selected day
  await expect(page.getByTestId('event-kind-medical').locator('input')).toBeChecked();
  await page.getByLabel('Title').fill('Fictional checkup');
  await page.getByTestId('save-event').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Event saved for November 30, 2026.');
  await expect(page.getByTestId('day-events').getByTestId('event-row')).toHaveText(/Fictional checkup\s*Medical appointment/);
  await expect(day(page, '2026-11-30')).toHaveAttribute('aria-label', 'Monday, November 30, 2026, 1 medical appointment');
  await expect(day(page, '2026-11-30').locator('.cal-mark-medical')).toHaveCount(1);
  await expect(page.getByTestId('upcoming-events').getByTestId('event-row')).toContainText('Mon, Nov 30');

  // View: optional fields that were left empty are not shown.
  await page.getByTestId('day-events').getByTestId('event-row').click();
  const view = page.getByTestId('event-view');
  await expect(page.getByRole('dialog', { name: 'Fictional checkup' })).toBeVisible();
  await expect(view.getByTestId('event-view-date')).toHaveText('Monday, November 30, 2026');
  await expect(view.getByTestId('event-view-time')).toHaveCount(0);
  await expect(view.getByTestId('event-view-location')).toHaveCount(0);
  await expect(view.getByTestId('event-view-notes')).toHaveCount(0);

  // Edit every field, including the type and the date.
  await page.getByTestId('event-edit').click();
  await expect(page.getByLabel('Title')).toHaveValue('Fictional checkup');
  await fillEvent(page, { kind: 'personal', title: 'Fictional family visit', date: '2026-12-05', time: '14:05', location: 'Sample Park, Gate 2', notes: 'Fictional note, line one\nline two' });
  await page.getByTestId('save-event').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Event updated.');
  await expect(page.getByTestId('cal-month')).toHaveText('December 2026'); // follows the event to its new date
  await expect(page.getByTestId('selected-date')).toHaveText('Saturday, December 5, 2026');
  await expect(day(page, '2026-12-05')).toHaveAttribute('aria-label', 'Saturday, December 5, 2026, 1 personal event');
  await expect(day(page, '2026-12-05').locator('.cal-mark-personal')).toHaveCount(1);
  await page.getByTestId('day-events').getByTestId('event-row').click();
  await expect(view.getByTestId('event-view-time')).toHaveText('2:05 PM');
  await expect(view.getByTestId('event-view-location')).toHaveText('Sample Park, Gate 2');
  await expect(view.getByTestId('event-view-notes')).toHaveText('Fictional note, line one\nline two');
  await expect(view).toContainText('Personal event');
  const stored = await storedEvents(page);
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({ recordType: 'calendarEvent', kind: 'personal', title: 'Fictional family visit', date: '2026-12-05', time: '14:05', location: 'Sample Park, Gate 2', rev: 2 });

  // Delete asks first; Cancel keeps it; confirming removes it everywhere.
  await page.getByTestId('event-delete').click();
  await expect(page.getByTestId('delete-event-text')).toContainText('“Fictional family visit” on December 5, 2026 will be permanently removed');
  await expect(page.getByTestId('delete-event-cancel')).toBeFocused();
  await page.getByTestId('delete-event-cancel').click();
  await expect(view).toBeVisible();
  expect(await storedEvents(page)).toHaveLength(1);
  await page.getByTestId('event-delete').click();
  await page.getByTestId('delete-event-confirm').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Event deleted.');
  await expect(page.getByTestId('no-events')).toBeVisible();
  await expect(page.getByTestId('no-upcoming')).toBeVisible();
  await expect(page.locator('.cal-grid .cal-mark')).toHaveCount(0);
  expect(await storedEvents(page)).toEqual([]); // removed outright: nothing about the event is kept
  await page.goto('./#/calendar');
  await expect(page.getByText('Fictional family visit')).toHaveCount(0);
});

test('validation: a title and a real date are required; what was typed is kept', async ({ page }) => {
  await start(page);
  await page.getByTestId('add-event').click();
  await fillEvent(page, { location: 'Sample Clinic', notes: 'Fictional question list' });
  await page.getByTestId('save-event').click();
  await expect(page.getByRole('alert')).toHaveText('Please enter a title.');
  await expect(page.getByLabel('Location (optional)')).toHaveValue('Sample Clinic');
  await page.getByLabel('Title').fill('Fictional therapy session');
  await page.getByLabel('Date', { exact: true }).fill('');
  await page.getByTestId('save-event').click();
  await expect(page.getByRole('alert')).toHaveText('Please enter a valid date.');
  await expect(page.getByLabel('Title')).toHaveValue('Fictional therapy session');
  expect(await storedEvents(page)).toEqual([]);
  await page.getByLabel('Date', { exact: true }).fill('2028-02-29'); // a leap day is accepted exactly
  await page.getByTestId('save-event').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Event saved for February 29, 2028.');
  await expect(page.getByTestId('selected-date')).toHaveText('Tuesday, February 29, 2028');
  expect((await storedEvents(page))[0]).toMatchObject({ date: '2028-02-29', title: 'Fictional therapy session', kind: 'medical' });
  // Cancel and tapping outside both close without saving.
  await page.getByTestId('add-event').click();
  await page.getByLabel('Title').fill('Fictional discarded');
  await page.getByTestId('cancel-event').click();
  await page.getByTestId('add-event').click();
  await expect(page.getByLabel('Title')).toHaveValue('');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('event-form')).toHaveCount(0);
  expect(await storedEvents(page)).toHaveLength(1);
});

test('a failed save changes nothing and keeps what was typed; saving again works', async ({ page }) => {
  await start(page);
  await addEvent(page, { title: 'Fictional existing event', date: '2026-11-27' });
  const before = await storedEvents(page);
  // Simulate the browser refusing the write (for example, storage full).
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    (window as unknown as { restorePut: () => void }).restorePut = () => { IDBObjectStore.prototype.put = original; };
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'events') throw new DOMException('Simulated storage failure', 'QuotaExceededError');
      return original.apply(this, args);
    };
  });
  await page.getByTestId('add-event').click();
  await fillEvent(page, { kind: 'personal', title: 'Fictional unsaved event', date: '2026-12-10', time: '08:15', location: 'Sample Hall', notes: 'Fictional unsaved note' });
  await page.getByTestId('save-event').click();
  await expect(page.getByRole('alert')).toHaveText('That couldn’t be saved. What you entered is still here. Please try again.');
  await expect(page.getByLabel('Title')).toHaveValue('Fictional unsaved event');
  await expect(page.getByLabel('Date', { exact: true })).toHaveValue('2026-12-10');
  await expect(page.getByLabel('Time (optional)')).toHaveValue('08:15');
  await expect(page.getByLabel('Location (optional)')).toHaveValue('Sample Hall');
  await expect(page.getByLabel('Notes (optional)')).toHaveValue('Fictional unsaved note');
  await expect(page.getByTestId('event-kind-personal').locator('input')).toBeChecked();
  expect(await storedEvents(page)).toEqual(before);
  await page.evaluate(() => (window as unknown as { restorePut: () => void }).restorePut());
  await page.getByTestId('save-event').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Event saved for December 10, 2026.');
  const after = await storedEvents(page);
  expect(after).toHaveLength(2); // the retry did not create a duplicate
  expect(after.find((e) => e.id === before[0]!.id)).toEqual(before[0]);

  // A failed edit and a failed delete also leave the stored event exactly as it was.
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    const del = IDBObjectStore.prototype.delete;
    (window as unknown as { restoreAll: () => void }).restoreAll = () => { IDBObjectStore.prototype.put = put; IDBObjectStore.prototype.delete = del; };
    const fail = function (this: IDBObjectStore): never { throw new DOMException('Simulated storage failure', 'UnknownError'); };
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) { return this.name === 'events' ? fail.call(this) : put.apply(this, args); };
    IDBObjectStore.prototype.delete = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['delete']>) { return this.name === 'events' ? fail.call(this) : del.apply(this, args); };
  });
  const snapshot = await storedEvents(page);
  await page.getByTestId('day-events').getByTestId('event-row').click();
  await page.getByTestId('event-edit').click();
  await page.getByLabel('Title').fill('Fictional changed title');
  await page.getByTestId('save-event').click();
  await expect(page.getByRole('alert')).toContainText('That couldn’t be saved.');
  await expect(page.getByLabel('Title')).toHaveValue('Fictional changed title');
  expect(await storedEvents(page)).toEqual(snapshot);
  await page.getByTestId('cancel-event').click();
  await page.getByTestId('day-events').getByTestId('event-row').click();
  await page.getByTestId('event-delete').click();
  await page.getByTestId('delete-event-confirm').click();
  await expect(page.getByRole('alert')).toContainText('That couldn’t be deleted. Nothing was changed.');
  expect(await storedEvents(page)).toEqual(snapshot);
  await page.evaluate(() => (window as unknown as { restoreAll: () => void }).restoreAll());
  await page.getByTestId('delete-event-confirm').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Event deleted.');
  expect(await storedEvents(page)).toHaveLength(1);
});

test('upcoming lists today and later in order (all-day first, then by time) and leaves out the past', async ({ page }) => {
  await start(page);
  const events: Ev[] = [
    { title: 'Fictional therapy session', date: '2026-12-03', time: '14:00', location: 'Sample Therapy Center' },
    { title: 'Fictional play group', date: '2026-11-30', time: '16:00', kind: 'personal' },
    { title: 'Fictional checkup', date: '2026-11-30', time: '09:30' },
    { title: 'Fictional all-day visit', date: '2026-11-30', kind: 'personal' },
    { title: 'Fictional past visit', date: '2026-11-25' },
    { title: 'Fictional today event', date: '2026-11-26', kind: 'personal' },
    { title: 'Fictional next-year visit', date: '2027-01-04', time: '10:00' },
  ];
  for (const e of events) await addEvent(page, e);
  const rows = page.getByTestId('upcoming-events').getByTestId('event-row');
  await expect(rows).toHaveCount(5);
  await expect(rows.locator('.cal-event-title')).toHaveText(['Fictional today event', 'Fictional all-day visit', 'Fictional checkup', 'Fictional play group', 'Fictional therapy session']);
  await expect(rows.nth(0)).toContainText('Today');
  await expect(rows.nth(2)).toContainText('Mon, Nov 30 · 9:30 AM · Medical appointment');
  await expect(rows.nth(4)).toContainText('Thu, Dec 3 · 2:00 PM · Medical appointment · Sample Therapy Center');
  await expect(page.getByTestId('upcoming-toggle')).toHaveText('Show all 6');
  await page.getByTestId('upcoming-toggle').click();
  await expect(rows).toHaveCount(6);
  await expect(rows.nth(5)).toContainText('Mon, Jan 4, 2027 · 10:00 AM'); // the year is shown when it differs
  await expect(page.getByTestId('upcoming')).not.toContainText('Fictional past visit');
  // The past event is still on its day.
  await page.getByTestId('cal-today').click();
  await day(page, '2026-11-25').click();
  await expect(page.getByTestId('day-events')).toContainText('Fictional past visit');
  // A day with several events lists them in the same order and counts them on the grid.
  await day(page, '2026-11-30').click();
  await expect(page.getByTestId('day-events').locator('.cal-event-title')).toHaveText(['Fictional all-day visit', 'Fictional checkup', 'Fictional play group']);
  await expect(day(page, '2026-11-30')).toHaveAttribute('aria-label', 'Monday, November 30, 2026, 1 medical appointment, 2 personal events');
  // Opening an upcoming event shows it.
  await rows.nth(5).click();
  await expect(page.getByTestId('event-view-date')).toHaveText('Monday, January 4, 2027');
});

// ---------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------

test('the three overlays switch independently, hiding never deletes, and the choice is remembered', async ({ page }) => {
  await start(page);
  await addEvent(page, { title: 'Fictional checkup', date: '2026-11-30', time: '09:30' });
  await addEvent(page, { title: 'Fictional play group', date: '2026-11-30', kind: 'personal' });
  const stored = await storedEvents(page);
  const d30 = day(page, '2026-11-30');
  await expect(d30.locator('.cal-mark')).toHaveCount(2);

  await page.getByTestId('overlay-medical').click();
  await expect(page.getByTestId('overlay-medical')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('overlay-personal')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('overlay-vaccines')).toHaveAttribute('aria-pressed', 'false');
  await expect(d30).toHaveAttribute('aria-label', 'Monday, November 30, 2026, 1 personal event');
  await expect(d30.locator('.cal-mark-medical')).toHaveCount(0);
  await expect(page.getByTestId('day-events').locator('.cal-event-title')).toHaveText(['Fictional play group']);
  await expect(page.getByTestId('upcoming-events').locator('.cal-event-title')).toHaveText(['Fictional play group']);
  await expect(page.getByTestId('hidden-note')).toContainText('1 event on this day is hidden.');
  expect(await storedEvents(page)).toEqual(stored);

  await page.getByTestId('overlay-personal').click();
  await expect(page.locator('.cal-grid .cal-mark')).toHaveCount(0);
  await expect(page.getByTestId('no-events')).toBeVisible();
  await expect(page.getByTestId('hidden-note')).toContainText('2 events on this day are hidden.');
  await expect(page.getByTestId('no-upcoming')).toBeVisible();
  expect(await storedEvents(page)).toEqual(stored);

  // The choice is kept across a reload, and an event saved into a hidden group says so.
  await page.reload();
  await expect(page.getByTestId('overlay-medical')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('overlay-personal')).toHaveAttribute('aria-pressed', 'false');
  await addEvent(page, { title: 'Fictional hidden appointment', date: '2026-12-01' });
  await expect(page.getByTestId('saved-text')).toContainText('Medical appointments are hidden right now, so it isn’t shown.');
  expect(await storedEvents(page)).toHaveLength(3);

  // Turning the vaccine schedule on does not bring the hidden events back, and vice versa.
  await page.getByTestId('overlay-vaccines').click();
  await expect(page.getByTestId('vaccine-info')).toBeVisible();
  await expect(page.locator('.cal-grid .cal-mark-medical, .cal-grid .cal-mark-personal')).toHaveCount(0);
  await page.getByTestId('overlay-medical').click();
  await page.getByTestId('overlay-personal').click();
  await page.getByTestId('overlay-vaccines').click();
  await expect(page.getByTestId('vaccine-info')).toHaveCount(0);
  await page.getByTestId('cal-prev').click();
  await day(page, '2026-11-30').click();
  await expect(page.getByTestId('day-events').locator('.cal-event-title')).toHaveText(['Fictional play group', 'Fictional checkup']);
  expect((await storedEvents(page)).filter((e) => stored.some((s) => s.id === e.id))).toEqual(stored); // unchanged throughout
});

test('markers differ by shape, not only color: plus, heart and diamond, used consistently', async ({ page }) => {
  await start(page);
  await page.getByTestId('overlay-vaccines').click();
  await addEvent(page, { title: 'Fictional checkup', date: '2026-11-20' });
  await addEvent(page, { title: 'Fictional visit', date: '2026-11-20', kind: 'personal' });
  const cell = day(page, '2026-11-20');
  await expect(cell.locator('.cal-mark')).toHaveCount(3);
  // R-020: a plus with four equal arms (medical), a heart (personal), a hollow diamond (recommended vaccinations).
  const shapes = await cell.locator('.cal-mark').evaluateAll((els) => els.map((el) => {
    const cs = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    const n = (r: Element, a: string) => Number(r.getAttribute(a));
    const rects = [...el.querySelectorAll('rect')].map((r) => ({ x: n(r, 'x'), y: n(r, 'y'), w: n(r, 'width'), h: n(r, 'height') }));
    return { shape: el.getAttribute('data-shape'), tag: el.tagName.toLowerCase(), hidden: el.getAttribute('aria-hidden'), fill: cs.fill, bg: cs.backgroundColor, rotated: cs.transform !== 'none', outlined: parseFloat(cs.borderTopWidth) > 0, w: b.width, h: b.height, rects, paths: el.querySelectorAll('path').length, viewBox: el.getAttribute('viewBox') };
  }));
  expect(shapes.map((x) => x.shape)).toEqual(['plus', 'heart', 'diamond']);
  expect(shapes.every((x) => x.hidden === 'true')).toBe(true); // decorative: the day's name carries the meaning
  // Plus: a vertical and a horizontal bar of equal length and equal thickness, crossing at the exact midpoint
  // of both, centred in a square box. Four equal arms.
  expect(shapes[0]!.viewBox).toBe('0 0 12 12');
  expect(shapes[0]!.rects).toHaveLength(2);
  const [upright, bar] = shapes[0]!.rects as [{ x: number; y: number; w: number; h: number }, { x: number; y: number; w: number; h: number }];
  expect(upright.h).toBe(bar.w); // equal length
  expect(upright.w).toBe(bar.h); // uniform thickness
  expect(upright.x + upright.w / 2).toBe(6); // both bars centred on the middle of the box…
  expect(upright.y + upright.h / 2).toBe(6);
  expect(bar.x + bar.w / 2).toBe(6);
  expect(bar.y + bar.h / 2).toBe(6); // …so they cross at the midpoint of each
  const arm = (upright.h - bar.h) / 2;
  expect((bar.w - upright.w) / 2).toBe(arm); // left/right arms equal the top/bottom arms
  expect(upright.w).toBeLessThanOrEqual(upright.h / 4); // thin bars: not the thick-armed emblem
  expect(Math.abs(shapes[0]!.w - shapes[0]!.h)).toBeLessThan(0.5); // drawn square, so the arms stay equal on screen
  expect(shapes[1]).toMatchObject({ tag: 'svg', paths: 1 }); // heart: a single filled path
  expect(shapes[2]).toMatchObject({ tag: 'span', bg: 'rgba(0, 0, 0, 0)', rotated: true, outlined: true }); // hollow diamond, unchanged
  // Theme colors only, and not red on white.
  const colors = await page.evaluate(() => { const cs = getComputedStyle(document.documentElement); const probe = document.createElement('span'); document.body.append(probe); const read = (v: string) => { probe.style.color = `var(${v})`; return getComputedStyle(probe).color; }; const out = { primary: read('--primary'), text: read('--text') }; probe.remove(); void cs; return out; });
  expect(shapes[0]!.fill).toBe(colors.primary);
  expect(shapes[1]!.fill).toBe(colors.text);
  // Readable and compact: each mark is 8–12 px, and the three sit side by side inside the day without overlap.
  const boxes = await cell.locator('.cal-mark').evaluateAll((els) => els.map((el) => { const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; }));
  const cellBox = await cell.evaluate((el) => { const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; });
  for (const [n, b] of boxes.entries()) {
    expect(b.r - b.l).toBeGreaterThanOrEqual(8);
    expect(b.r - b.l).toBeLessThanOrEqual(13);
    expect(b.l).toBeGreaterThanOrEqual(cellBox.l);
    expect(b.r).toBeLessThanOrEqual(cellBox.r);
    expect(b.b).toBeLessThanOrEqual(cellBox.b);
    if (n > 0) expect(b.l).toBeGreaterThanOrEqual(boxes[n - 1]!.r - 0.5);
  }
  // The same symbols lead the overlay controls and the event rows.
  await expect(page.getByTestId('overlay-medical').locator('[data-shape="plus"]')).toHaveCount(1);
  await expect(page.getByTestId('overlay-personal').locator('[data-shape="heart"]')).toHaveCount(1);
  await expect(page.getByTestId('overlay-vaccines').locator('[data-shape="diamond"]')).toHaveCount(1);
  await cell.click();
  await expect(page.getByTestId('day-events').getByTestId('event-row').nth(0).locator('[data-shape="plus"]')).toHaveCount(1); // Fictional checkup
  await expect(page.getByTestId('day-events').getByTestId('event-row').nth(1).locator('[data-shape="heart"]')).toHaveCount(1); // Fictional visit
  await expect(page.getByTestId('vax-on-day').locator('[data-shape="diamond"]')).toHaveCount(1);
  await page.getByTestId('day-events').getByTestId('event-row').nth(0).click();
  await expect(page.getByTestId('event-view').locator('[data-shape="plus"]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(cell).toHaveAttribute('aria-label', 'Friday, November 20, 2026, 1 medical appointment, 1 personal event, recommended vaccinations');
});

// ---------------------------------------------------------------------------
// Recommended vaccine schedule (reference)
// ---------------------------------------------------------------------------

test('vaccine overlay: single ages mark one day, ranges are never repeated across their days', async ({ page }) => {
  await start(page);
  await page.getByTestId('overlay-vaccines').click();
  // November 2026 for a child born July 20, 2026: exactly one marked day (4 months), not a month of labels.
  await expect(page.locator('.cal-grid .cal-mark-vaccines')).toHaveCount(1);
  await expect(day(page, '2026-11-20')).toHaveAttribute('aria-label', 'Friday, November 20, 2026, recommended vaccinations');
  await expect(page.getByTestId('vax-on-day')).toHaveCount(0); // nothing for today (Nov 26)
  await day(page, '2026-11-20').click();
  const ref = page.getByTestId('vax-on-day');
  await expect(ref).toContainText('Recommended vaccinations: 4 months');
  await expect(ref).not.toContainText('CDC'); // R-019: attribution lives in the Source section, not beside each recommendation
  await expect(ref).not.toContainText('not an appointment');
  await expect(ref.getByTestId('vax-item')).toHaveCount(5);
  await expect(ref.getByTestId('vax-item')).toContainText(['Rotavirus — dose 2 · 4 months', 'DTaP — dose 2 · 4 months', 'Hib — dose 2 · 4 months', 'Pneumococcal — dose 2 · 4 months', 'Polio — dose 2 · 4 months']);
  await expect(ref).toContainText('two or three doses, depending on the vaccine used');
  await expect(ref).toContainText('maximum age for the final dose is 8 months, 0 days');
  await expect(page.getByTestId('no-events')).toBeVisible(); // a reference is not an event
  await expect(page.getByTestId('upcoming-events').getByTestId('event-row')).toHaveCount(0);

  // The day after a single age has no reference: it is one day, not a window.
  await day(page, '2026-11-21').click();
  await expect(page.getByTestId('vax-on-day')).toHaveCount(0);

  // Next reference age: 6 months on January 20, 2027.
  await expect(page.getByTestId('vax-next')).toHaveText(/^Next recommended vaccinations: 6 months\s*January 20, 2027$/);
  await page.getByTestId('vax-next').click();
  await expect(page.getByTestId('cal-month')).toHaveText('January 2027');
  await expect(page.locator('.cal-grid .cal-mark-vaccines')).toHaveCount(1);
  const jan = page.getByTestId('vax-on-day');
  await expect(jan.getByTestId('vax-item')).toHaveCount(4);
  await expect(jan).toContainText('Hepatitis B — dose 3 · 6–18 months');
  await expect(jan).toContainText('By date of birth: January 20, 2027 through February 19, 2028'); // inclusive: through the last day of 18 months
  await expect(jan).toContainText('DTaP — dose 3 · 6 months');
  await expect(jan).toContainText('Polio — dose 3 · 6–18 months');

  // Inside the 6–18 month ranges: no grid marks at all, and the ranges appear only as context.
  for (let i = 0; i < 2; i++) await page.getByTestId('cal-next').click();
  await expect(page.getByTestId('cal-month')).toHaveText('March 2027');
  await expect(page.locator('.cal-grid .cal-mark-vaccines')).toHaveCount(0);
  await day(page, '2027-03-15').click();
  const mid = page.getByTestId('vax-on-day');
  await expect(mid).toContainText('Recommended age ranges that include this day');
  await expect(mid).not.toContainText('Recommended vaccinations:');
  await expect(mid.getByTestId('vax-item')).toHaveCount(2);
  await expect(page.getByTestId('vax-month').locator('summary')).toHaveText('Recommended age ranges that include March 2027 (2)');

  // 4–6 years runs to the day before the 7th birthday, not to age five.
  for (let i = 0; i < 4; i++) await page.getByTestId('cal-next').click();
  await expect(page.locator('.cal-grid .cal-mark-vaccines')).toHaveCount(1);
  await day(page, '2027-07-20').click();
  await expect(page.getByTestId('selected-date')).toHaveText('Tuesday, July 20, 2027'); // 12 months
  const twelve = page.getByTestId('vax-on-day');
  await expect(twelve).toContainText('Hib — dose 3 or 4 · 12–15 months');
  await expect(twelve).toContainText('This is the third or fourth dose, depending on the vaccine used.');
  await expect(twelve).toContainText('Hepatitis A — 2 doses · 12–23 months');
  await expect(twelve).toContainText('By date of birth: July 20, 2027 through July 19, 2028');
  await expect(twelve).toContainText('The app does not work out a date for either dose.');
  for (let i = 0; i < 36; i++) await page.getByTestId('cal-next').click();
  await expect(page.getByTestId('cal-month')).toHaveText('July 2030');
  await day(page, '2030-07-20').click();
  await expect(page.getByTestId('vax-on-day')).toContainText('Recommended vaccinations: 4 years');
  await expect(page.getByTestId('vax-on-day')).toContainText('DTaP — dose 5 · 4–6 years');
  await expect(page.getByTestId('vax-on-day')).toContainText('By date of birth: July 20, 2030 through July 19, 2033');
  await expect(page.getByTestId('vax-next')).toHaveCount(1);
  // Nothing was written to the database for any of this.
  expect(await storedEvents(page)).toEqual([]);
});

test('the birth-dose reference keeps its qualifications and is shown on the date of birth', async ({ page }) => {
  await start(page);
  await page.getByTestId('overlay-vaccines').click();
  for (let i = 0; i < 4; i++) await page.getByTestId('cal-prev').click();
  await expect(page.getByTestId('cal-month')).toHaveText('July 2026');
  await expect(page.locator('.cal-grid .cal-mark-vaccines')).toHaveCount(1);
  await day(page, '2026-07-20').click();
  const ref = page.getByTestId('vax-on-day');
  await expect(ref).toContainText('Recommended vaccinations: birth');
  await expect(ref).toContainText('Hepatitis B — dose 1 · birth');
  await expect(ref).toContainText('weigh less than 2,000 grams at birth');
  await expect(ref).not.toContainText('notes for health care providers');
  await expect(ref).toContainText('when the mother has, or may have, hepatitis B');
  await expect(ref).toContainText('The birth hospital and your child’s provider decide this.');
});

test('conditional recommendations are listed for a provider conversation with no dates, and the source is disclosed', async ({ page }) => {
  await start(page);
  await page.getByTestId('overlay-vaccines').click();
  const info = page.getByTestId('vaccine-info');
  // R-019: one visible statement, in the owner's wording, and no separate introduction or tracking sentence.
  await expect(info.getByTestId('vax-provider')).toHaveText('Your child’s healthcare provider determines their individual vaccination schedule. The dates shown are general recommendations, not scheduled appointments or confirmation of eligibility.');
  await expect(info.getByTestId('vax-intro')).toHaveCount(0);
  await expect(info).not.toContainText('doesn’t track vaccines given');
  await expect(info).not.toContainText('marks ages on CDC’s recommended schedule');
  // Attribution and non-endorsement are visible without expanding anything.
  await expect(info.getByRole('heading', { name: 'Source', exact: true })).toBeVisible();
  const summary = info.getByTestId('vax-source-summary');
  await expect(summary).toBeVisible();
  await expect(summary).toHaveText('Based on the CDC childhood immunization schedule, July 2, 2025. This app is not endorsed by CDC, HHS or the U.S. Government and has not been clinically reviewed.');
  await expect(info.getByTestId('vax-source-details')).not.toHaveAttribute('open', '');
  await expect(info.getByTestId('vax-source-link')).toBeHidden(); // the detailed record stays collapsed until asked for
  await info.getByTestId('vax-discuss').locator('summary').click();
  const items = info.getByTestId('vax-discuss-item');
  await expect(items).toHaveCount(6);
  await expect(items).toContainText([
    'RSV antibody · Birth through 7 months', 'RSV antibody · 8 through 19 months', 'Rotavirus, dose 3 · 6 months', 'Hib, dose 3 · 6 months', 'Influenza (flu) · 6 months and older', 'COVID-19 · 6 months and older',
  ]);
  await expect(items.nth(0)).toContainText('Depends on mother’s RSV vaccine status');
  await expect(items.nth(0)).toContainText('Timing also depends on the RSV season and the month your child was born.');
  await expect(items.nth(1)).toContainText('Depends on child’s health status');
  await expect(items.nth(2)).toContainText('depends on the vaccine used');
  await expect(items.nth(3)).toContainText('depends on the vaccine used');
  await expect(items.nth(4)).toContainText('Every year. Two doses for some children');
  await expect(items.nth(5)).toContainText('talk to their health care provider to decide if this vaccine is right for their child');
  const discussText = await info.getByTestId('vax-discuss').innerText();
  expect(discussText).not.toMatch(/\b20\d\d\b/); // no year, so no date, anywhere in this section
  expect(discussText).not.toMatch(/January|February|March|April|June|July|August|September|October|November|December/);
  expect(discussText).not.toMatch(/Moderna|Pfizer|Novavax/);
  // No institutional framing here (R-019). The one remaining mention is the name of a resource in CDC's own
  // sentence (“Visit CDC Travelers’ Health…”), kept word for word.
  expect(discussText).toContain('Visit CDC Travelers’ Health for more information.');
  expect(discussText.replace('CDC Travelers’ Health', '')).not.toMatch(/\bCDC\b|notes for health care providers/);
  expect(discussText).toMatch(/Talk to your child’s health care provider for more guidance if:/);
  expect(discussText).toMatch(/higher risk for infection/);
  expect(discussText).toMatch(/traveling outside the United States/);
  // None of these reaches the calendar grid, in any month of the first seven years.
  const labels = new Set<string>();
  for (let i = 0; i < 3; i++) {
    for (const l of await page.locator('.cal-day[aria-label*="recommended vaccinations"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-date')!))) labels.add(l);
    await page.getByTestId('cal-next').click();
  }
  expect([...labels]).toEqual(['2026-11-20', '2027-01-20']);

  // Outside the Source section the overlay never names CDC, whatever is expanded or selected.
  await page.getByTestId('cal-today').click();
  await day(page, '2026-11-20').click();
  await info.getByTestId('vax-month').locator('summary').click();
  const outside = await page.evaluate(() => {
    const clone = document.querySelector('[data-testid="calendar"]')!.cloneNode(true) as HTMLElement;
    clone.querySelector('[data-testid="vax-source"]')!.remove();
    return (clone.textContent ?? '').replace('CDC Travelers’ Health', ''); // a resource named in a verbatim sentence
  });
  expect(outside).not.toMatch(/\bCDC\b/);
  expect(outside).not.toMatch(/not an appointment|reference age/i);

  // The complete record is in the expandable details.
  await info.getByTestId('vax-source-details').locator('summary').click();
  const src = info.getByTestId('vax-source');
  await expect(src).toContainText('“Recommended Immunizations for Birth Through 6 Years Old, United States, 2025” (July 2, 2025)');
  await expect(src).toContainText('checked against CDC’s schedule, notes and addendum for health care providers');
  await expect(src).toContainText('Retrieved November 27, 2026.');
  await expect(src).toContainText('available free of charge at cdc.gov');
  await expect(src).toContainText('this copy does not update itself');
  await expect(src).toContainText('some are CDC’s own words and some are reworded');
  await expect(src).toContainText('from the date of birth (not a corrected age)');
  await expect(src).toContainText('through the last day of its last age');
  const link = src.getByTestId('vax-source-link');
  await expect(link).toHaveAttribute('href', 'https://www.cdc.gov/vaccines/imz-schedules/child-easyread.html');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
  await expect(link).toContainText('opens in a new window');
  await expect(page.locator('[data-testid="vaccine-info"] img')).toHaveCount(0); // no CDC logo or imagery
  // No runtime request leaves the app for vaccine information.
  const requests: string[] = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://localhost')) requests.push(r.url()); });
  await page.reload();
  await expect(page.getByTestId('vaccine-info')).toBeVisible();
  expect(requests).toEqual([]);
});

test('vaccine reference dates use the date of birth even when corrected age is in use', async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await page.goto('./');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill(FOUR_MONTHS);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill('Sample Child A');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
  await page.getByRole('button', { name: 'Weeks at birth' }).click();
  await page.getByLabel('Weeks', { exact: true }).selectOption('32');
  await page.getByRole('radio', { name: /Corrected age \(from due date\)/ }).click();
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await expect(page.getByText(/corrected/i).first()).toBeVisible(); // corrected age really is in use on Home
  await page.goto('./#/calendar');
  await page.getByTestId('overlay-vaccines').click();
  await expect(page.locator('.cal-day[aria-label*="recommended vaccinations"]')).toHaveAttribute('data-date', '2026-11-20'); // 4 months from the date of birth
  await expect(page.getByTestId('vax-next')).toContainText('Next recommended vaccinations: 6 months');
  await expect(page.getByTestId('vax-next')).toContainText('January 20, 2027');
});

test('month-end and leap-day birthdays place references on real calendar dates', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2024-03-10T10:00:00'));
  await completeOnboarding(page, { dob: '2023-12-31', name: 'Sample Child A' });
  await page.goto('./#/calendar');
  await page.getByTestId('overlay-vaccines').click();
  await page.getByTestId('cal-prev').click();
  await expect(page.getByTestId('cal-month')).toHaveText('February 2024');
  // 2 months after December 31 is February 29 in a leap year (the month's last day).
  await expect(page.locator('.cal-day[aria-label*="recommended vaccinations"]')).toHaveAttribute('data-date', '2024-02-29');
  await expect(page.getByTestId('vax-next')).toContainText('Next recommended vaccinations: 4 months');
  await expect(page.getByTestId('vax-next')).toContainText('April 30, 2024');
});

// ---------------------------------------------------------------------------
// Profiles: isolation, switching, deletion, reset
// ---------------------------------------------------------------------------

test('each child has their own calendar; switching with an editor open cannot save into the other profile', async ({ page }) => {
  await start(page);
  await addChild(page, 'Sample Child B', '2025-01-15');
  await page.goto('./#/calendar');
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child B');
  await addEvent(page, { title: 'Fictional B appointment', date: '2026-11-27' });
  await switchTo(page, 'Sample Child A');
  await expect(page.getByTestId('calendar')).toContainText('Appointments and events for Sample Child A');
  await expect(page.getByText('Fictional B appointment')).toHaveCount(0);
  await expect(page.getByTestId('no-upcoming')).toBeVisible();
  await addEvent(page, { title: 'Fictional A appointment', date: '2026-11-27' });

  // Open an editor for A and type. The form is modal: the child selector cannot be used through it.
  await page.getByTestId('add-event').click();
  await fillEvent(page, { title: 'Fictional unsaved for A', date: '2026-11-28', notes: 'Fictional private note' });
  const chip = (await page.getByTestId('child-chip').boundingBox())!;
  await page.mouse.click(chip.x + chip.width / 2, chip.y + chip.height / 2); // lands on the scrim: closes the form, unsaved
  await expect(page.getByTestId('event-form')).toHaveCount(0);
  await expect(page.getByTestId('child-switcher')).toHaveCount(0);
  await switchTo(page, 'Sample Child B');
  await expect(page.getByTestId('event-form')).toHaveCount(0);
  await expect(page.getByText('Fictional unsaved for A')).toHaveCount(0);
  await page.getByTestId('add-event').click();
  await expect(page.getByLabel('Title')).toHaveValue(''); // nothing carried over from the other profile
  await expect(page.getByLabel('Notes (optional)')).toHaveValue('');
  await page.keyboard.press('Escape');

  // Open an event of B's, switch away mid-view by navigating, and confirm nothing of B's shows for A.
  await page.getByTestId('upcoming-events').getByTestId('event-row').click();
  await page.getByTestId('event-edit').click();
  await page.getByLabel('Title').fill('Fictional edited but not saved');
  await page.keyboard.press('Escape');
  await switchTo(page, 'Sample Child A');
  await expect(page.getByTestId('upcoming-events').locator('.cal-event-title')).toHaveText(['Fictional A appointment']);

  const stored = await storedEvents(page);
  expect(stored.map((e) => e.title).sort()).toEqual(['Fictional A appointment', 'Fictional B appointment']);
  expect(new Set(stored.map((e) => e.childId)).size).toBe(2);
  // Home shows the active child's events only.
  await page.goto('./#/home');
  await expect(page.getByTestId('home-coming-up')).toContainText('Fictional A appointment');
  await expect(page.getByTestId('home-coming-up')).not.toContainText('Fictional B appointment');
});

test('deleting a profile erases that child’s events only; a full reset erases everything', async ({ page }) => {
  await start(page);
  await addEvent(page, { title: 'Fictional A appointment', date: '2026-11-27', notes: 'Fictional A note' });
  await addChild(page, 'Sample Child B', '2025-01-15');
  await page.goto('./#/calendar');
  await addEvent(page, { title: 'Fictional B appointment', date: '2026-11-28' });
  const all = await storedEvents(page);
  const bId = all.find((e) => e.title === 'Fictional B appointment')!.childId as string;
  await page.goto(`./#/profiles/${bId}`);
  await deleteProfile(page);
  await expect.poll(async () => (await storedEvents(page)).map((e) => e.title)).toEqual(['Fictional A appointment']);
  await expect(page.getByRole('heading', { name: 'Child profiles' })).toBeVisible(); // the deletion has finished and returned to the list
  await page.goto('./#/calendar');
  await expect(page.getByTestId('upcoming-events').locator('.cal-event-title')).toHaveText(['Fictional A appointment']);

  await page.goto('./#/settings');
  await page.getByRole('button', { name: /Your Data/ }).click();
  await page.getByRole('button', { name: 'Advanced data management' }).click();
  await page.getByRole('button', { name: 'Erase all app data…' }).click();
  await page.getByLabel('Type RESET to continue').fill('RESET');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Yes, erase everything' }).click();
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
  expect(await storedEvents(page)).toEqual([]);
  // Starting again shows an empty calendar with the default overlays.
  await completeOnboarding(page, { dob: FOUR_MONTHS, name: 'Sample Child C' });
  await page.goto('./#/calendar');
  await expect(page.getByTestId('no-upcoming')).toBeVisible();
  await expect(page.getByTestId('overlay-vaccines')).toHaveAttribute('aria-pressed', 'false');
  expect(await dbVersion(page)).toBe(3);
});

// ---------------------------------------------------------------------------
// Persistence and offline
// ---------------------------------------------------------------------------

test('events and overlay choices are still there after reloading and reopening the app', async ({ page, context }) => {
  await start(page);
  await addEvent(page, { title: 'Fictional checkup', date: '2026-11-30', time: '09:30', location: 'Sample Clinic', notes: 'Fictional note' });
  await page.getByTestId('overlay-vaccines').click();
  await expect(page.getByTestId('vaccine-info')).toBeVisible(); // shown once the choice has been saved
  await page.reload();
  await expect(page.getByTestId('upcoming-events').getByTestId('event-row')).toContainText('Fictional checkup');
  await expect(page.getByTestId('overlay-vaccines')).toHaveAttribute('aria-pressed', 'true');
  await page.close();
  const again = await context.newPage(); // reopening: a new page in the same browser profile
  await again.clock.setFixedTime(NOW);
  await again.goto('./#/calendar');
  await expect(again.getByTestId('upcoming-events').getByTestId('event-row')).toContainText('Mon, Nov 30 · 9:30 AM · Medical appointment · Sample Clinic');
  await again.getByTestId('upcoming-events').getByTestId('event-row').click();
  await expect(again.getByTestId('event-view-notes')).toHaveText('Fictional note');
  await expect(again.getByTestId('vaccine-info')).toBeVisible();
  expect(await dbVersion(again)).toBe(3);
});

test('works offline: the calendar opens, and events can be added, edited and deleted', async ({ page, context }) => {
  await start(page);
  await addEvent(page, { title: 'Fictional online event', date: '2026-11-27' });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('calendar')).toBeVisible();
  await expect(page.getByTestId('upcoming-events')).toContainText('Fictional online event');
  // The bundled vaccine schedule reference is available offline.
  await page.getByTestId('overlay-vaccines').click();
  await expect(page.getByTestId('vaccine-info')).toBeVisible();
  await day(page, '2026-11-20').click();
  await expect(page.getByTestId('vax-on-day').getByTestId('vax-item')).toHaveCount(5);
  // Create, edit and delete while offline.
  await addEvent(page, { title: 'Fictional offline event', date: '2026-11-29', kind: 'personal', time: '11:00' });
  await page.getByTestId('day-events').getByTestId('event-row').click();
  await page.getByTestId('event-edit').click();
  await fillEvent(page, { title: 'Fictional offline event, edited', location: 'Sample Park' });
  await page.getByTestId('save-event').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Event updated.');
  await page.getByTestId('upcoming-events').getByText('Fictional online event').click();
  await page.getByTestId('event-delete').click();
  await page.getByTestId('delete-event-confirm').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Event deleted.');
  // Navigate between tabs and reload, still offline: everything persisted.
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByTestId('home-coming-up')).toContainText('Fictional offline event, edited');
  await page.reload();
  await page.getByRole('link', { name: 'Calendar', exact: true }).click();
  await expect(page.getByTestId('upcoming-events').locator('.cal-event-title')).toHaveText(['Fictional offline event, edited']);
  await expect(page.getByTestId('upcoming-events')).toContainText('Sun, Nov 29 · 11:00 AM · Personal event · Sample Park');
  await context.setOffline(false);
});

// ---------------------------------------------------------------------------
// Home and Settings
// ---------------------------------------------------------------------------

test('Home’s New event opens the add form, Upcoming Appointments lists the next events, and Settings describes the Calendar as it is', async ({ page }) => {
  await start(page);
  await page.goto('./#/home');
  await expect(page.getByTestId('home-coming-up').getByRole('heading', { level: 2 })).toHaveText('Upcoming Appointments'); // R-021
  await expect(page.getByText('Coming up', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('home-coming-up')).toContainText('No upcoming events.');
  await page.getByTestId('qa-new-event').click();
  await expect(page.getByRole('dialog', { name: 'Add event' })).toBeVisible();
  await expect(page).toHaveURL(/#\/calendar$/);
  await fillEvent(page, { title: 'Fictional checkup', date: '2026-11-30', time: '09:30' });
  await page.getByTestId('save-event').click();
  await expect(page.getByTestId('saved')).toBeVisible();
  for (const e of [{ title: 'Fictional visit', date: '2026-11-27', kind: 'personal' as const }, { title: 'Fictional therapy', date: '2026-12-02' }, { title: 'Fictional later event', date: '2026-12-20' }, { title: 'Fictional past event', date: '2026-11-01' }]) await addEvent(page, e);
  await page.goto('./#/home');
  const coming = page.getByTestId('home-coming-up');
  await expect(coming.locator('.cal-event-title')).toHaveText(['Fictional visit', 'Fictional checkup', 'Fictional therapy']); // the next three: medical and personal together
  await expect(coming.getByTestId('event-row').nth(0).locator('[data-shape="heart"]')).toHaveCount(1);
  await expect(coming.getByTestId('event-row').nth(1).locator('[data-shape="plus"]')).toHaveCount(1);
  await expect(coming).not.toContainText('vaccine');
  await coming.getByTestId('home-open-calendar').click();
  await expect(page.getByTestId('calendar')).toBeVisible();
  // Home follows the overlay choice.
  await page.getByTestId('overlay-personal').click();
  await page.goto('./#/home');
  await expect(page.getByTestId('home-coming-up').locator('.cal-event-title')).toHaveText(['Fictional checkup', 'Fictional therapy', 'Fictional later event']);

  await page.goto('./#/settings');
  const trigger = page.getByRole('button', { name: /^Calendar/ });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  const panel = page.getByTestId('settings-calendar');
  await expect(panel).toContainText('medical appointments and personal events you enter for each child');
  await expect(panel).toContainText('that is off until you turn it on');
  await expect(panel).toContainText('doesn’t send reminders or add events to your phone’s calendar');
  await expect(page.getByTestId('acc-calendar')).not.toContainText('Coming soon');
  await expect(page.getByText('Calendar & Reminders')).toHaveCount(0);
  await expect(panel.getByRole('link', { name: 'Open Calendar' })).toHaveAttribute('href', '#/calendar');
});

// ---------------------------------------------------------------------------
// Accessibility, keyboard, themes and narrow layouts
// ---------------------------------------------------------------------------

test('keyboard: arrow keys move between days and months; an event can be added and deleted without a pointer', async ({ page }) => {
  await start(page);
  // One day is in the tab order; the rest are reached with the arrow keys.
  expect(await page.locator('.cal-day[tabindex="0"]').count()).toBe(1);
  await day(page, '2026-11-26').focus();
  await page.keyboard.press('ArrowRight');
  await expect(day(page, '2026-11-27')).toBeFocused();
  await expect(day(page, '2026-11-27')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByTestId('cal-month')).toHaveText('December 2026'); // crossed into the next month
  await expect(day(page, '2026-12-04')).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(day(page, '2026-11-27')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(day(page, '2026-11-26')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(day(page, '2026-11-01')).toBeFocused();
  await page.keyboard.press('End');
  await expect(day(page, '2026-11-30')).toBeFocused();
  await page.keyboard.press('PageDown');
  await expect(day(page, '2026-12-30')).toBeFocused();
  await page.keyboard.press('PageDown');
  await page.keyboard.press('PageDown');
  await expect(day(page, '2027-02-28')).toBeFocused(); // clamped to the end of a shorter month
  await page.keyboard.press('PageUp');
  await expect(day(page, '2027-01-28')).toBeFocused();
  await expect(page.getByTestId('selected-date')).toHaveText('Thursday, January 28, 2027');

  // Add with the keyboard only.
  await page.getByTestId('add-event').focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Add event' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('radio', { name: 'Medical appointment' })).toBeFocused();
  await page.keyboard.press('ArrowDown'); // Personal
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Title')).toBeFocused();
  await page.keyboard.type('Fictional keyboard event');
  await page.keyboard.press('Enter'); // submits the form
  await expect(page.getByTestId('saved-text')).toHaveText('Event saved for January 28, 2027.');
  await expect(page.getByTestId('day-events')).toContainText('Personal event');
  // Focus stays trapped inside an open dialog, and Escape closes it.
  await page.getByTestId('day-events').getByTestId('event-row').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Fictional keyboard event' })).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  }
  await page.getByTestId('event-delete').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('delete-event-cancel')).toBeFocused(); // the safe choice has focus
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('saved-text')).toHaveText('Event deleted.');
  expect(await storedEvents(page)).toEqual([]);
});

for (const theme of ['earth', 'sky', 'blush', 'lavender', 'sage']) {
  test(`accessibility checks pass in the ${theme} theme (calendar, vaccine overlay, forms)`, async ({ page }) => {
    await start(page, { theme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await addEvent(page, { title: 'Fictional checkup', date: '2026-11-20', time: '09:30', location: 'Sample Clinic' });
    await addEvent(page, { title: 'Fictional visit', date: '2026-11-26', kind: 'personal' });
    await page.getByTestId('overlay-vaccines').click();
    // The medical plus takes this theme's own primary color (never a fixed red), in the month grid and the control.
    const themed = await page.evaluate(() => {
      const probe = document.createElement('span'); probe.style.color = 'var(--primary)'; document.body.append(probe);
      const primary = getComputedStyle(probe).color; probe.remove();
      const fills = [...document.querySelectorAll('[data-shape="plus"]')].map((el) => getComputedStyle(el).fill);
      return { primary, fills };
    });
    expect(themed.fills.length).toBeGreaterThanOrEqual(2);
    expect(new Set(themed.fills)).toEqual(new Set([themed.primary]));
    expect(themed.primary).not.toBe('rgb(255, 0, 0)');
    await day(page, '2026-11-20').click();
    for (const id of ['vax-month', 'vax-discuss', 'vax-source-details']) await page.getByTestId(id).locator('summary').click();
    await settle(page);
    const tags = ['wcag2a', 'wcag2aa', 'wcag21aa'];
    expect((await new AxeBuilder({ page: page as never }).withTags(tags).analyze()).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    await page.getByTestId('day-events').getByTestId('event-row').click();
    await settle(page);
    expect((await new AxeBuilder({ page: page as never }).include('[role="dialog"]').withTags(tags).analyze()).violations.map((v) => v.id)).toEqual([]);
    await page.getByTestId('event-edit').click();
    await settle(page);
    expect((await new AxeBuilder({ page: page as never }).include('[role="dialog"]').withTags(tags).analyze()).violations.map((v) => v.id)).toEqual([]);
    await page.getByLabel('Title').fill('');
    await page.getByTestId('save-event').click();
    await expect(page.getByRole('alert')).toBeVisible();
    expect((await new AxeBuilder({ page: page as never }).include('[role="dialog"]').withTags(tags).analyze()).violations.map((v) => v.id)).toEqual([]);
    await page.getByTestId('cancel-event').click();
    await page.getByTestId('day-events').getByTestId('event-row').click();
    await page.getByTestId('event-delete').click();
    await settle(page);
    expect((await new AxeBuilder({ page: page as never }).include('[role="dialog"]').withTags(tags).analyze()).violations.map((v) => v.id)).toEqual([]);
  });
}

for (const width of [320, 390]) {
  test(`narrow layout at ${width}px: nothing overflows, days are touch-sized, the form fits`, async ({ page }) => {
    await page.setViewportSize({ width, height: 760 });
    await start(page);
    await addEvent(page, { title: 'Fictional appointment with a deliberately long title to check wrapping on narrow screens', date: '2026-11-30', time: '09:30', location: 'Sample Clinic with a long fictional location name, Building 4, Room 212' });
    await addEvent(page, { title: 'Fictional visit', date: '2026-11-30', kind: 'personal' });
    await page.getByTestId('overlay-vaccines').click();
    await day(page, '2026-11-20').click();
    for (const id of ['vax-month', 'vax-discuss', 'vax-source-details']) await page.getByTestId(id).locator('summary').click();
    await noOverflow(page, 'calendar with the vaccine overlay');
    // All geometry is read together, after entrance animations.
    await settle(page);
    const g = await page.evaluate(() => {
      const r = (e: Element) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right }; };
      return {
        days: [...document.querySelectorAll('.cal-day')].map(r),
        heads: [...document.querySelectorAll('.cal-grid th')].map(r),
        nav: [...document.querySelectorAll('.cal-nav .icon-btn')].map(r),
        chips: [...document.querySelectorAll('[data-testid="overlays"] .chip')].map(r),
        month: r(document.querySelector('[data-testid="cal-month"]')!),
        add: r(document.querySelector('[data-testid="add-event"]')!),
        vw: window.innerWidth,
      };
    });
    expect(g.days).toHaveLength(30);
    for (const d of g.days) {
      expect(d.h).toBeGreaterThanOrEqual(44);
      expect(d.w).toBeGreaterThanOrEqual(36);
      expect(Math.abs(d.w - g.days[0]!.w)).toBeLessThan(1); // seven equal columns
      expect(d.r).toBeLessThanOrEqual(g.vw);
    }
    expect(g.heads).toHaveLength(7);
    for (const b of [...g.nav, ...g.chips, g.add]) expect(b.h).toBeGreaterThanOrEqual(40);
    for (const b of g.nav) expect(b.w).toBeGreaterThanOrEqual(44);
    expect(g.month.h).toBeLessThan(40); // the month name stays on one line
    // Symbols at this width: the plus is drawn square (equal arms on screen), readable, and inside its day beside the heart.
    const marks = await day(page, '2026-11-30').evaluate((el) => { const c = el.getBoundingClientRect(); return { cell: { l: c.left, r: c.right, b: c.bottom }, m: [...el.querySelectorAll('.cal-mark')].map((x) => { const b = x.getBoundingClientRect(); return { shape: x.getAttribute('data-shape'), l: b.left, r: b.right, w: b.width, h: b.height, b: b.bottom }; }) }; });
    expect(marks.m.map((x) => x.shape)).toEqual(['plus', 'heart']);
    expect(Math.abs(marks.m[0]!.w - marks.m[0]!.h)).toBeLessThan(0.5);
    for (const x of marks.m) {
      expect(x.w).toBeGreaterThanOrEqual(8);
      expect(x.w).toBeLessThanOrEqual(13);
      expect(x.l).toBeGreaterThanOrEqual(marks.cell.l);
      expect(x.r).toBeLessThanOrEqual(marks.cell.r);
      expect(x.b).toBeLessThanOrEqual(marks.cell.b);
    }
    expect(marks.m[1]!.l).toBeGreaterThanOrEqual(marks.m[0]!.r - 0.5); // no overlap
    // The form and the details fit too.
    await day(page, '2026-11-30').click();
    await page.getByTestId('day-events').getByTestId('event-row').first().click();
    await noOverflow(page, 'event details');
    await page.getByTestId('event-edit').click();
    await noOverflow(page, 'event form');
    const fields = await page.getByTestId('event-form').evaluate((el) => [...el.querySelectorAll('input:not([type="radio"]), textarea, button')].map((e) => { const b = e.getBoundingClientRect(); return { h: b.height, r: b.right, l: b.left }; }));
    for (const f of fields) {
      expect(f.h).toBeGreaterThanOrEqual(44);
      expect(f.r).toBeLessThanOrEqual(width);
      expect(f.l).toBeGreaterThanOrEqual(0);
    }
  });
}

test('the Calendar uses the shared page heading and no development wording', async ({ page }) => {
  await start(page);
  await page.getByTestId('overlay-vaccines').click();
  for (const id of ['vax-month', 'vax-discuss', 'vax-source-details']) await page.getByTestId(id).locator('summary').click();
  await expect(page.getByTestId('page-title')).toHaveText('Calendar');
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/checkpoint|overlay|IndexedDB|coming soon|preview only/i);
  expect(text).not.toMatch(/AAP|HealthyChildren|Pathways/i);
  // Nothing in the app claims tracking, reminders or clinical review.
  expect(text).not.toMatch(/up to date|overdue|due on|reminder set/i);
});

// R-022: the Calendar section in Settings uses the same inner spacing as the other Settings sections.
for (const vp of [{ width: 320, height: 760 }, { width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  test(`Settings → Calendar: text and link are inset like the other sections (${vp.width}px)`, async ({ page }) => {
    await page.setViewportSize(vp);
    await start(page);
    await page.goto('./#/settings');
    await page.getByRole('button', { name: /^Calendar/ }).click();
    await page.getByRole('button', { name: /^This Device/ }).click();
    await settle(page);
    const g = await page.evaluate(() => {
      const r = (e: Element) => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; };
      const pad = (sel: string) => { const e = document.querySelector(`[data-testid="${sel}"] .panel-pad`)!; const cs = getComputedStyle(e); return [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '); };
      const cal = document.querySelector('[data-testid="acc-calendar"]')!;
      const panel = document.querySelector('[data-testid="settings-calendar"]')!;
      return {
        card: r(cal), panel: r(panel), paras: [...panel.querySelectorAll('p')].map(r), link: r(panel.querySelector('a')!),
        title: r(cal.querySelector('.accordion-title')!), calPad: pad('acc-calendar'), devicePad: pad('acc-device'),
        deviceField: r(document.querySelector('[data-testid="acc-device"] .field')!), deviceCard: r(document.querySelector('[data-testid="acc-device"]')!),
      };
    });
    expect(g.calPad).toBe(g.devicePad); // the shared Settings panel padding, not a one-off value
    for (const p of g.paras) {
      expect(p.l - g.card.l).toBeGreaterThanOrEqual(16); // clear of the card's edges
      expect(g.card.r - p.r).toBeGreaterThanOrEqual(16);
    }
    expect(Math.abs((g.paras[0]!.l - g.card.l) - (g.deviceField.l - g.deviceCard.l))).toBeLessThan(1); // same inset as “This Device”
    expect(Math.abs(g.paras[0]!.l - g.title.l)).toBeLessThan(1); // text lines up under the section title
    expect(g.link.l - g.card.l).toBeGreaterThanOrEqual(16);
    expect(g.card.b - g.link.b).toBeGreaterThanOrEqual(16); // the link is clear of the bottom edge
    expect(g.paras[0]!.t - g.panel.t).toBeGreaterThanOrEqual(12);
    await noOverflow(page, 'settings calendar section');
    await expect(page.getByTestId('settings-calendar')).toContainText('The Calendar keeps the medical appointments and personal events you enter for each child.');
    await page.getByTestId('settings-calendar').getByRole('link', { name: 'Open Calendar' }).click();
    await expect(page.getByTestId('calendar')).toBeVisible();
  });
}
