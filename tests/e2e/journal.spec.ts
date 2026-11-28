/**
 * Checkpoint 4 — Journal, and the removal of Resources from the primary navigation. FICTIONAL data only.
 * One feed with two entry types · create, view, edit, delete · optional titles and tags · dates and order ·
 * long entries · search and combined filters · provider questions · validation and failed writes ·
 * unsaved-change confirmation · profile isolation, deletion and reset · persistence · offline ·
 * themes, accessibility, keyboard and focus · narrow layouts · four-tab navigation · source attribution.
 * Automated in headless Chromium only; this is not Safari or iPhone testing.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { addChild, completeOnboarding, deleteProfile } from './helpers';

const NOW = new Date('2026-11-27T10:00:00'); // a Friday
const TODAY = '2026-11-27';

async function start(page: Page, opts: { name?: string; theme?: string } = {}) {
  await page.clock.setFixedTime(NOW);
  await completeOnboarding(page, { dob: '2025-03-14', name: opts.name ?? 'Sample Child A', theme: opts.theme });
  await page.goto('./#/journal');
  await expect(page.getByTestId('journal')).toBeVisible();
}

interface En { type?: 'reflection' | 'care'; date?: string; title?: string; body?: string; tags?: string; question?: boolean; answered?: boolean }
const form = (page: Page) => page.getByTestId('entry-form');
const bodyField = (page: Page) => form(page).getByLabel('Entry', { exact: true });
const titleField = (page: Page) => form(page).getByLabel('Title (optional)');
const dateField = (page: Page) => form(page).getByLabel('Date', { exact: true });
const tagsField = (page: Page) => form(page).getByLabel('Tags (optional)');
async function fillEntry(page: Page, e: En) {
  if (e.type) await page.getByTestId(`entry-type-${e.type}`).click();
  if (e.date !== undefined) await dateField(page).fill(e.date);
  if (e.title !== undefined) await titleField(page).fill(e.title);
  if (e.body !== undefined) await bodyField(page).fill(e.body);
  if (e.tags !== undefined) await tagsField(page).fill(e.tags);
  if (e.question !== undefined) await page.getByTestId('entry-question-flag').locator('input').setChecked(e.question);
  if (e.answered !== undefined) await page.getByTestId('entry-answered-flag').locator('input').setChecked(e.answered);
}
let minute = 0;
/** Each entry is written a minute after the last one (the clock is fixed, so creation times would otherwise tie). */
async function addEntry(page: Page, e: En) {
  await page.clock.setFixedTime(new Date(NOW.getTime() + ++minute * 60_000));
  await page.getByTestId('new-entry').click();
  await fillEntry(page, e);
  await page.getByTestId('save-entry').click();
  await expect(form(page)).toHaveCount(0);
  await expect(page.getByTestId('saved')).toBeVisible();
}
test.beforeEach(() => { minute = 0; });

const stored = (page: Page) => page.evaluate(() => new Promise<Array<Record<string, unknown>>>((resolve) => {
  const r = indexedDB.open('roll-crawl-run');
  r.onsuccess = () => {
    const q = r.result.transaction('journal').objectStore('journal').getAll();
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
  const over = await page.evaluate(() => [...document.querySelectorAll('input, select, textarea, button, a.btn, .card, .chip, .tag-mini, .badge, .info-note')].filter((el) => {
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
/** The feed as the parent reads it: each card's title, or the start of its text when it has no title. */
const feed = (page: Page) => page.getByTestId('journal-entry').evaluateAll((els) => els.map((el) => (el.querySelector('[data-testid="entry-title"]') ?? el.querySelector('[data-testid="entry-excerpt"]'))!.textContent ?? ''));
const card = (page: Page, text: string) => page.getByTestId('journal-entry').filter({ hasText: text });
const failWrites = (page: Page) => page.evaluate(() => {
  const put = IDBObjectStore.prototype.put;
  const del = IDBObjectStore.prototype.delete;
  (window as unknown as { restoreAll: () => void }).restoreAll = () => { IDBObjectStore.prototype.put = put; IDBObjectStore.prototype.delete = del; };
  const fail = (): never => { throw new DOMException('Simulated storage failure', 'QuotaExceededError'); };
  IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) { return this.name === 'journal' ? fail() : put.apply(this, args); };
  IDBObjectStore.prototype.delete = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['delete']>) { return this.name === 'journal' ? fail() : del.apply(this, args); };
});
const restoreWrites = (page: Page) => page.evaluate(() => (window as unknown as { restoreAll: () => void }).restoreAll());

// ---------------------------------------------------------------------------
// Navigation and the empty Journal
// ---------------------------------------------------------------------------

test('four primary tabs: Home, Growth, Calendar, Journal; Resources is gone and its old address opens Home', async ({ page }) => {
  await start(page);
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link')).toHaveText(['Home', 'Growth', 'Calendar', 'Journal']);
  await expect(nav.getByRole('link', { name: 'Journal' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: /Resources/ })).toHaveCount(0);
  for (const tab of ['Home', 'Growth', 'Calendar', 'Journal']) {
    await nav.getByRole('link', { name: tab, exact: true }).click();
    await expect(nav.getByRole('link', { name: tab, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link')).toHaveCount(4);
    await expect(page.locator('body')).not.toContainText(/Resources|Preview only|Coming soon/);
  }
  // Settings is still reached from the top bar, and has no Resources entry either.
  await page.getByRole('link', { name: 'Profiles and settings' }).click();
  await expect(page.locator('.topbar-title')).toHaveText('Settings');
  await expect(page.locator('body')).not.toContainText('Resources');
  // An old bookmark doesn't break: it opens Home with the same four tabs.
  await page.goto('./#/resources');
  await expect(page.getByRole('heading', { name: 'Quick actions' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link')).toHaveText(['Home', 'Growth', 'Calendar', 'Journal']);
  // The four tabs share the width evenly.
  const widths = await page.locator('.bottomnav li').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
  expect(widths).toHaveLength(4);
  for (const w of widths) expect(Math.abs(w - widths[0]!)).toBeLessThan(1);
});

test('an empty Journal shows the shared heading, one New Journal Entry action, an empty state and the privacy notice', async ({ page }) => {
  await start(page);
  await expect(page.getByTestId('page-title')).toHaveText('Journal');
  await expect(page.locator('.page-intro')).toHaveText('Memories and care notes for Sample Child A.');
  await expect(page.getByRole('button', { name: 'New Journal Entry' })).toHaveCount(1);
  await expect(page.getByTestId('journal-empty')).toContainText('No journal entries yet');
  await expect(page.getByTestId('journal-filters')).toHaveCount(0); // nothing to search yet
  await expect(page.getByTestId('journal-feed')).toHaveCount(0);
  expect(await stored(page)).toEqual([]);
  expect(await dbVersion(page)).toBe(3);
  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/checkpoint|IndexedDB|coming soon|preview only/i);
});

test('the privacy notice says where entries are kept and what the app does not do, once, without overclaiming', async ({ page }) => {
  await start(page);
  const notice = page.getByTestId('journal-privacy');
  await expect(notice).toHaveCount(1);
  await expect(notice).toHaveText('Journal entries are kept on this device only. The app doesn’t encrypt or password-protect them, so anyone who can use this unlocked device may be able to read them. This version can’t back up or restore entries.');
  await addEntry(page, { body: 'Fictional entry' });
  await expect(page.getByTestId('journal-privacy')).toHaveCount(1); // still once, with entries
  // No claim of protection, compliance, permanence or sharing anywhere on the screen or in the forms.
  const forbidden = /HIPAA|compliant|certified|secure|permanent|always be here|shared with|export|send to/i;
  expect(await page.locator('main').innerText()).not.toMatch(forbidden);
  await page.getByTestId('new-entry').click();
  expect(await page.getByRole('dialog').innerText()).not.toMatch(forbidden);
  await page.keyboard.press('Escape');
  // The app-wide Privacy page agrees: nothing can be shared or backed up in this version.
  await page.goto('./#/settings/privacy');
  await expect(page.getByTestId('privacy-sharing')).toContainText('The app can’t share, export, back up or restore what you enter.');
  await expect(page.getByTestId('privacy-sharing')).toContainText('Personal Reflections in the Journal will be left out unless you choose to include them');
});

// ---------------------------------------------------------------------------
// Creating, viewing, editing and deleting
// ---------------------------------------------------------------------------

test('a Personal Reflection needs only some writing: no title, no tags, dated today', async ({ page }) => {
  await start(page);
  await page.getByTestId('new-entry').click();
  await expect(page.getByRole('dialog', { name: 'New journal entry' })).toBeVisible();
  await expect(page.getByTestId('entry-type-reflection').locator('input')).toBeChecked(); // the default type
  await expect(dateField(page)).toHaveValue(TODAY);
  await expect(dateField(page)).toHaveAttribute('max', TODAY);
  await expect(page.getByTestId('question-controls')).toHaveCount(0); // no provider-question controls on a reflection
  await bodyField(page).fill('Fictional: a quiet morning and a very long nap.');
  await page.getByTestId('save-entry').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry saved.');
  await expect(page.getByTestId('journal-empty')).toHaveCount(0);
  const c = page.getByTestId('journal-entry');
  await expect(c).toHaveCount(1);
  await expect(c).toHaveAttribute('data-type', 'reflection');
  await expect(c.getByTestId('entry-type')).toHaveText('Personal Reflection');
  await expect(c.getByTestId('entry-date')).toHaveText('Today');
  await expect(c.getByTestId('entry-title')).toHaveCount(0);
  await expect(c.getByTestId('entry-excerpt')).toHaveText('Fictional: a quiet morning and a very long nap.');
  await expect(c.getByTestId('entry-tags')).toHaveCount(0);
  await expect(c.getByTestId('entry-question')).toHaveCount(0);
  const [rec] = await stored(page);
  expect(rec).toMatchObject({ recordType: 'journalEntry', type: 'reflection', date: TODAY, title: '', body: 'Fictional: a quiet morning and a very long nap.', tags: [], isProviderQuestion: false, answered: false, deletedAt: null, rev: 1 });
  // Viewing it: the type names it when there is no title, and there are no provider-question controls.
  await c.getByTestId('entry-open').click();
  const view = page.getByRole('dialog', { name: 'Personal Reflection' });
  await expect(view.getByTestId('entry-view-date')).toHaveText('Friday, November 27, 2026');
  await expect(view.getByTestId('entry-view-body')).toHaveText('Fictional: a quiet morning and a very long nap.');
  await expect(view.getByTestId('entry-view-question')).toHaveCount(0);
  await view.getByTestId('entry-close').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a Care Note with a title, tags and an earlier date: create, view, edit every field, then delete with confirmation', async ({ page }) => {
  await start(page);
  await addEntry(page, { type: 'care', date: '2026-11-10', title: 'Fictional checkup notes', body: 'Fictional: weight and length recorded.\nNext visit in two months.', tags: 'Checkup,  growth chart , checkup' });
  const c = page.getByTestId('journal-entry');
  await expect(c).toHaveAttribute('data-type', 'care');
  await expect(c.getByTestId('entry-type')).toHaveText('Care Note');
  await expect(c.getByTestId('entry-date')).toHaveText('November 10, 2026');
  await expect(c.getByTestId('entry-title')).toHaveText('Fictional checkup notes');
  await expect(c.getByTestId('entry-tags').locator('li')).toHaveText(['Checkup', 'growth chart']); // trimmed; the repeat is dropped
  await expect(c.getByTestId('entry-question')).toHaveCount(0); // not flagged as a question
  const [created] = await stored(page);

  await c.getByTestId('entry-open').click();
  const view = page.getByRole('dialog', { name: 'Fictional checkup notes' });
  await expect(view.getByTestId('entry-type')).toHaveText('Care Note');
  await expect(view.getByTestId('entry-view-date')).toHaveText('Tuesday, November 10, 2026');
  expect(await view.getByTestId('entry-view-body').innerText()).toBe('Fictional: weight and length recorded.\nNext visit in two months.'); // line break kept
  await expect(view.getByTestId('entry-view-tags').locator('li')).toHaveText(['Checkup', 'growth chart']);

  await view.getByTestId('entry-edit').click();
  await expect(page.getByRole('dialog', { name: 'Edit entry' })).toBeVisible();
  await expect(page.getByTestId('entry-type-care').locator('input')).toBeChecked();
  await expect(dateField(page)).toHaveValue('2026-11-10');
  await expect(titleField(page)).toHaveValue('Fictional checkup notes');
  await expect(bodyField(page)).toHaveValue('Fictional: weight and length recorded.\nNext visit in two months.');
  await expect(tagsField(page)).toHaveValue('Checkup, growth chart');
  await fillEntry(page, { type: 'reflection', date: '2026-11-12', title: 'Fictional day out', body: 'Fictional: an afternoon at the park.', tags: 'outings' });
  await page.getByTestId('save-entry').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry updated.');
  await expect(c).toHaveAttribute('data-type', 'reflection');
  await expect(c.getByTestId('entry-title')).toHaveText('Fictional day out');
  await expect(c.getByTestId('entry-date')).toHaveText('November 12, 2026');
  await expect(c.getByTestId('entry-tags').locator('li')).toHaveText(['outings']);
  const [edited] = await stored(page);
  expect(edited).toMatchObject({ id: created!.id, createdAt: created!.createdAt, rev: 2, type: 'reflection', date: '2026-11-12', title: 'Fictional day out', body: 'Fictional: an afternoon at the park.', tags: ['outings'] });

  // Deleting asks first. Cancelling keeps the entry; confirming removes it completely.
  await c.getByTestId('entry-open').click();
  await page.getByTestId('entry-delete').click();
  await expect(page.getByRole('dialog', { name: 'Delete this entry?' })).toBeVisible();
  await expect(page.getByTestId('delete-entry-text')).toHaveText('“Fictional day out”, the Personal Reflection dated November 12, 2026, will be permanently removed from the journal. This can’t be undone.');
  await page.getByTestId('delete-entry-cancel').click();
  await expect(page.getByTestId('entry-view')).toBeVisible(); // back to the entry, unchanged
  expect(await stored(page)).toEqual([edited]);
  await page.getByTestId('entry-delete').click();
  await page.getByTestId('delete-entry-confirm').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry deleted.');
  await expect(page.getByTestId('journal-empty')).toBeVisible();
  expect(await stored(page)).toEqual([]); // nothing of it is kept
  await expect(page.getByTestId('new-entry')).toBeFocused(); // focus lands somewhere useful
});

test('the two entry types stay distinct in one feed; Personal Reflections never show provider-question controls', async ({ page }) => {
  await start(page);
  await addEntry(page, { body: 'Fictional reflection text' });
  await addEntry(page, { type: 'care', body: 'Fictional care note text', question: true });
  await expect(page.getByTestId('journal-entry')).toHaveCount(2); // one combined feed
  const reflection = card(page, 'Fictional reflection text');
  const care = card(page, 'Fictional care note text');
  await expect(reflection.getByTestId('entry-type')).toHaveText('Personal Reflection');
  await expect(care.getByTestId('entry-type')).toHaveText('Care Note');
  const look = (c: ReturnType<typeof card>) => c.evaluate((el) => {
    const badge = el.querySelector('[data-testid="entry-type"]')!;
    return { edge: getComputedStyle(el).borderLeftColor, badge: getComputedStyle(badge).backgroundColor, icon: badge.querySelector('svg')!.innerHTML };
  });
  const [r, k] = [await look(reflection), await look(care)];
  expect(r.icon).not.toBe(k.icon); // different icons
  expect(r.edge).not.toBe(k.edge);
  expect(r.badge).not.toBe(k.badge);
  // R-025: the whole Care Note card is tinted; the Personal Reflection keeps the light card.
  const cardBg = (c: ReturnType<typeof card>) => c.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await cardBg(care)).not.toBe(await cardBg(reflection));
  // Provider-question controls: on the Care Note only.
  await expect(care.getByTestId('entry-question')).toBeVisible();
  await expect(reflection.getByTestId('entry-question')).toHaveCount(0);
  await expect(reflection.getByTestId('toggle-answered')).toHaveCount(0);
  await reflection.getByTestId('entry-open').click();
  await expect(page.getByTestId('entry-view-question')).toHaveCount(0);
  await page.getByTestId('entry-edit').click();
  await expect(page.getByTestId('question-controls')).toHaveCount(0);
  // Choosing Care Note reveals the flag; going back to Personal Reflection removes it, and nothing of it is saved.
  await page.getByTestId('entry-type-care').click();
  await page.getByTestId('entry-question-flag').locator('input').check();
  await expect(page.getByTestId('entry-answered-flag')).toBeVisible();
  await page.getByTestId('entry-type-reflection').click();
  await expect(page.getByTestId('question-controls')).toHaveCount(0);
  await bodyField(page).fill('Fictional reflection text, edited');
  await page.getByTestId('save-entry').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry updated.');
  const rec = (await stored(page)).find((e) => e.body === 'Fictional reflection text, edited')!;
  expect(rec).toMatchObject({ type: 'reflection', isProviderQuestion: false, answered: false });
  await expect(card(page, 'Fictional reflection text, edited').getByTestId('entry-question')).toHaveCount(0);
});

test('entries are listed newest date first, backdated ones in their place, same-day ones most recently written first', async ({ page }) => {
  await start(page);
  await addEntry(page, { title: 'Fictional written first, today', body: 'Fictional' });
  await addEntry(page, { title: 'Fictional backdated a year', body: 'Fictional', date: '2025-11-27' });
  await addEntry(page, { title: 'Fictional written third, today', body: 'Fictional', type: 'care' });
  await addEntry(page, { title: 'Fictional last week', body: 'Fictional', date: '2026-11-20' });
  await addEntry(page, { title: 'Fictional yesterday', body: 'Fictional', date: '2026-11-26' });
  const expected = ['Fictional written third, today', 'Fictional written first, today', 'Fictional yesterday', 'Fictional last week', 'Fictional backdated a year'];
  expect(await feed(page)).toEqual(expected);
  await expect(page.getByTestId('entry-date')).toHaveText(['Today', 'Today', 'November 26, 2026', 'November 20, 2026', 'November 27, 2025']);
  // Editing an entry's date moves it; the order is the same after reloading.
  await card(page, 'Fictional last week').getByTestId('entry-open').click();
  await page.getByTestId('entry-edit').click();
  await dateField(page).fill('2024-02-29');
  await page.getByTestId('save-entry').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry updated.');
  const moved = [...expected.filter((t) => t !== 'Fictional last week'), 'Fictional last week'];
  expect(await feed(page)).toEqual(moved);
  await expect(card(page, 'Fictional last week').getByTestId('entry-date')).toHaveText('February 29, 2024');
  await page.reload();
  await expect(page.getByTestId('journal-entry')).toHaveCount(5);
  expect(await feed(page)).toEqual(moved);
});

test('a long entry is saved whole, shortened in the feed and shown in full when opened', async ({ page }) => {
  await start(page);
  const long = Array.from({ length: 120 }, (_, i) => `Fictional paragraph ${i + 1}: an ordinary day with several small moments worth remembering.`).join('\n\n');
  expect(long.length).toBeGreaterThan(9000);
  await addEntry(page, { title: 'Fictional long entry', body: long });
  expect((await stored(page))[0]!.body).toBe(long);
  const c = page.getByTestId('journal-entry');
  const shown = (await c.getByTestId('entry-excerpt').textContent())!;
  expect(shown.length).toBeLessThan(400);
  expect(shown.endsWith('…')).toBe(true);
  expect(long.startsWith(shown.slice(0, -1))).toBe(true);
  await expect(c).toContainText('Read the whole entry');
  expect((await c.boundingBox())!.height).toBeLessThan(420); // the card stays compact
  await c.getByTestId('entry-open').click();
  expect(await page.getByTestId('entry-view-body').textContent()).toBe(long);
  // The sheet scrolls inside the window, and its actions can be reached.
  await settle(page);
  const sheet = await page.locator('.sheet').evaluate((el) => ({ h: el.getBoundingClientRect().height, scroll: el.scrollHeight, vh: window.innerHeight }));
  expect(sheet.h).toBeLessThanOrEqual(sheet.vh);
  expect(sheet.scroll).toBeGreaterThan(sheet.h);
  await page.getByTestId('entry-edit').scrollIntoViewIfNeeded();
  await page.getByTestId('entry-edit').click();
  await expect(bodyField(page)).toHaveValue(long);
  await bodyField(page).press('End');
  await page.keyboard.press('Control+End');
  await page.keyboard.type('\n\nFictional addition at the end.');
  await page.getByTestId('save-entry').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry updated.');
  expect((await stored(page))[0]!.body).toBe(`${long}\n\nFictional addition at the end.`);
});

// ---------------------------------------------------------------------------
// Validation, failed writes and unsaved changes
// ---------------------------------------------------------------------------

test('validation: some writing and a real date that isn’t in the future are required; what was typed is kept', async ({ page }) => {
  await start(page);
  await page.getByTestId('new-entry').click();
  await fillEntry(page, { type: 'care', title: 'Fictional title only', tags: 'sleep' });
  await page.getByTestId('save-entry').click();
  await expect(page.getByRole('alert')).toHaveText('Please write something before saving.');
  await bodyField(page).fill('   \n  ');
  await page.getByTestId('save-entry').click();
  await expect(page.getByRole('alert')).toHaveText('Please write something before saving.');
  await bodyField(page).fill('Fictional note text');
  await dateField(page).fill('2026-11-28'); // tomorrow
  await page.getByTestId('save-entry').click();
  await expect(page.getByRole('alert')).toHaveText('Please choose today or an earlier date.');
  await dateField(page).fill('');
  await page.getByTestId('save-entry').click();
  await expect(page.getByRole('alert')).toHaveText('Please enter a valid date.');
  await dateField(page).fill('1989-12-31');
  await page.getByTestId('save-entry').click();
  await expect(page.getByRole('alert')).toHaveText('Please enter a date in 1990 or later.');
  // Everything typed is still in the form, and nothing has been stored.
  await expect(titleField(page)).toHaveValue('Fictional title only');
  await expect(bodyField(page)).toHaveValue('Fictional note text');
  await expect(tagsField(page)).toHaveValue('sleep');
  await expect(page.getByTestId('entry-type-care').locator('input')).toBeChecked();
  expect(await stored(page)).toEqual([]);
  await expect(titleField(page)).toHaveAttribute('maxlength', '120');
  await tagsField(page).fill(Array.from({ length: 11 }, (_, i) => `tag${i}`).join(', '));
  await dateField(page).fill('2026-11-26');
  await page.getByTestId('save-entry').click();
  await expect(page.getByRole('alert')).toHaveText('Please use 10 tags or fewer.');
  await tagsField(page).fill('sleep');
  await page.getByTestId('save-entry').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry saved.');
  expect(await stored(page)).toHaveLength(1);
  expect((await stored(page))[0]).toMatchObject({ date: '2026-11-26', title: 'Fictional title only', body: 'Fictional note text', tags: ['sleep'] });
});

test('a failed save, edit, answered change or deletion changes nothing and keeps what was typed; trying again works', async ({ page }) => {
  await start(page);
  await addEntry(page, { type: 'care', title: 'Fictional existing question', body: 'Fictional existing text', question: true });
  const before = await stored(page);
  await failWrites(page); // the browser refuses the write (for example, storage is full)
  await page.getByTestId('new-entry').click();
  const long = 'Fictional unsaved writing. '.repeat(60).trim();
  await fillEntry(page, { type: 'care', date: '2026-11-20', title: 'Fictional unsaved title', body: long, tags: 'unsaved, tags', question: true });
  await page.getByTestId('save-entry').click();
  await expect(page.getByRole('alert')).toHaveText('That couldn’t be saved. What you wrote is still here. Please try again.');
  await expect(titleField(page)).toHaveValue('Fictional unsaved title');
  await expect(bodyField(page)).toHaveValue(long);
  await expect(dateField(page)).toHaveValue('2026-11-20');
  await expect(tagsField(page)).toHaveValue('unsaved, tags');
  await expect(page.getByTestId('entry-type-care').locator('input')).toBeChecked();
  await expect(page.getByTestId('entry-question-flag').locator('input')).toBeChecked();
  expect(await stored(page)).toEqual(before);
  await restoreWrites(page);
  await page.getByTestId('save-entry').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry saved.');
  const after = await stored(page);
  expect(after).toHaveLength(2); // the retry did not create a duplicate
  expect(after.find((e) => e.id === before[0]!.id)).toEqual(before[0]);

  // A failed edit, a failed answered change and a failed deletion leave the stored entries exactly as they were.
  const snapshot = await stored(page);
  await failWrites(page);
  await card(page, 'Fictional existing question').getByTestId('toggle-answered').click();
  await expect(page.getByRole('alert')).toHaveText('That couldn’t be saved. Nothing was changed. Please try again.');
  await expect(card(page, 'Fictional existing question').getByTestId('question-status')).toHaveText('Question for the provider · Unanswered');
  await card(page, 'Fictional existing question').getByTestId('entry-open').click();
  await page.getByTestId('entry-edit').click();
  await bodyField(page).fill('Fictional changed text');
  await page.getByTestId('save-entry').click();
  await expect(page.getByRole('alert')).toContainText('That couldn’t be saved.');
  await expect(bodyField(page)).toHaveValue('Fictional changed text');
  expect(await stored(page)).toEqual(snapshot);
  await page.getByTestId('cancel-entry').click();
  await page.getByTestId('discard-confirm').click();
  await card(page, 'Fictional existing question').getByTestId('entry-open').click();
  await page.getByTestId('entry-delete').click();
  await page.getByTestId('delete-entry-confirm').click();
  await expect(page.getByRole('alert')).toHaveText('That couldn’t be deleted. Nothing was changed. Please try again.');
  expect(await stored(page)).toEqual(snapshot);
  await restoreWrites(page);
  await page.getByTestId('delete-entry-confirm').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry deleted.');
  expect((await stored(page)).map((e) => e.title)).toEqual(['Fictional unsaved title']);
});

test('closing an editor with unsaved writing asks first: keep writing, or discard; an untouched editor just closes', async ({ page }) => {
  await start(page);
  // Untouched: Cancel, Escape and a tap outside close it straight away.
  await page.getByTestId('new-entry').click();
  await page.getByTestId('cancel-entry').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByTestId('new-entry').click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Escape right after typing into a freshly opened form asks too (it must see what was typed since it opened).
  await page.getByTestId('new-entry').click();
  await bodyField(page).fill('Fictional text typed just now');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Discard your changes?' })).toBeVisible();
  await page.getByTestId('discard-keep').click();
  await expect(bodyField(page)).toHaveValue('Fictional text typed just now');
  await page.keyboard.press('Escape');
  await page.getByTestId('discard-confirm').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // With writing: Cancel asks. “Keep writing” returns to the form with everything still there.
  await page.getByTestId('new-entry').click();
  await fillEntry(page, { type: 'care', title: 'Fictional draft title', body: 'Fictional draft text that should not be lost.', tags: 'draft', question: true });
  await page.getByTestId('cancel-entry').click();
  const confirm = page.getByRole('dialog', { name: 'Discard your changes?' });
  await expect(confirm).toBeVisible();
  await expect(page.getByTestId('discard-text')).toHaveText('This entry hasn’t been saved.');
  await expect(page.getByTestId('discard-keep')).toBeFocused(); // the safe choice is first
  await page.getByTestId('discard-keep').click();
  await expect(page.getByRole('dialog', { name: 'New journal entry' })).toBeVisible();
  await expect(titleField(page)).toHaveValue('Fictional draft title');
  await expect(bodyField(page)).toHaveValue('Fictional draft text that should not be lost.');
  await expect(tagsField(page)).toHaveValue('draft');
  await expect(page.getByTestId('entry-type-care').locator('input')).toBeChecked();
  await expect(page.getByTestId('entry-question-flag').locator('input')).toBeChecked();
  // Escape asks too; Escape on the question means “keep writing”.
  await page.keyboard.press('Escape');
  await expect(confirm).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(bodyField(page)).toHaveValue('Fictional draft text that should not be lost.');
  // A tap outside the form asks too; a tap outside the question keeps writing.
  const chip = (await page.getByTestId('child-chip').boundingBox())!;
  await page.mouse.click(chip.x + chip.width / 2, chip.y + chip.height / 2);
  await expect(confirm).toBeVisible();
  await expect(page.getByTestId('child-switcher')).toHaveCount(0); // the child selector can't be reached through the form
  await page.mouse.click(chip.x + chip.width / 2, chip.y + chip.height / 2);
  await expect(bodyField(page)).toHaveValue('Fictional draft text that should not be lost.');
  // Discarding closes the form and stores nothing.
  await page.getByTestId('cancel-entry').click();
  await page.getByTestId('discard-confirm').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await stored(page)).toEqual([]);
  await page.getByTestId('new-entry').click();
  await expect(bodyField(page)).toHaveValue(''); // no draft is kept
  await expect(titleField(page)).toHaveValue('');
  await page.keyboard.press('Escape');

  // Editing: an unchanged entry closes without asking; a changed one asks, and discarding leaves it as it was.
  await addEntry(page, { title: 'Fictional saved title', body: 'Fictional saved text' });
  const before = await stored(page);
  await page.getByTestId('entry-open').click();
  await page.getByTestId('entry-edit').click();
  await page.getByTestId('cancel-entry').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByTestId('entry-open').click();
  await page.getByTestId('entry-edit').click();
  await bodyField(page).fill('Fictional saved text, with a change');
  await bodyField(page).fill('Fictional saved text'); // typed back to the original: nothing to lose
  await page.getByTestId('cancel-entry').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByTestId('entry-open').click();
  await page.getByTestId('entry-edit').click();
  await bodyField(page).fill('Fictional saved text, with a change');
  await page.getByTestId('cancel-entry').click();
  await expect(page.getByTestId('discard-text')).toHaveText('The changes you made to this entry haven’t been saved.');
  await page.getByTestId('discard-confirm').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await stored(page)).toEqual(before);
  await expect(page.getByTestId('entry-excerpt')).toHaveText('Fictional saved text');
});

// ---------------------------------------------------------------------------
// Search and filters
// ---------------------------------------------------------------------------

async function seedFive(page: Page) {
  await addEntry(page, { title: 'First giggles', body: 'Fictional: a whole afternoon of laughing at the kitchen table.', tags: 'firsts, family' });
  await addEntry(page, { type: 'care', date: '2026-11-25', title: 'Sleep question', body: 'Fictional: waking twice most nights. Is that expected?', tags: 'sleep', question: true });
  await addEntry(page, { type: 'care', date: '2026-11-20', body: 'Fictional: the provider suggested more floor time.', tags: 'therapy, sleep' });
  await addEntry(page, { type: 'care', date: '2026-10-02', title: 'Feeding question', body: 'Fictional: asked about solid foods. Answer: start slowly.', tags: 'feeding', question: true, answered: true });
  await addEntry(page, { date: '2026-09-15', title: 'Park day', body: 'Fictional: giggles on the swings.', tags: 'Family' });
}
const FLOOR = 'Fictional: the provider suggested more floor time.';

test('search by title and text, and filter by type, date and tags, alone and combined', async ({ page }) => {
  await start(page);
  await seedFive(page);
  const all = ['First giggles', 'Sleep question', FLOOR, 'Feeding question', 'Park day'];
  expect(await feed(page)).toEqual(all);
  await expect(page.getByTestId('journal-count')).toHaveCount(0); // nothing filtered yet
  const search = page.getByRole('searchbox', { name: 'Search journal' });

  // Text: title and body, any capitals, every word.
  await search.fill('GIGGLES');
  await expect.poll(() => feed(page)).toEqual(['First giggles', 'Park day']);
  await expect(page.getByTestId('journal-count')).toHaveText('Showing 2 of 5 entries');
  await search.fill('giggles swings');
  await expect.poll(() => feed(page)).toEqual(['Park day']);
  await search.fill('floor time');
  await expect.poll(() => feed(page)).toEqual([FLOOR]);
  await search.fill('question');
  await expect.poll(() => feed(page)).toEqual(['Sleep question', 'Feeding question']);

  // Type, combined with the text.
  await page.getByTestId('filter-type-reflection').click();
  await expect(page.getByTestId('journal-no-results')).toContainText('Nothing matches the current search and filters.');
  await expect(page.getByTestId('journal-count')).toHaveText('Showing 0 of 5 entries');
  await expect(page.getByTestId('journal-feed')).toHaveCount(0);
  await search.fill('');
  await expect.poll(() => feed(page)).toEqual(['First giggles', 'Park day']);
  await expect(page.getByTestId('filter-type-reflection')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('filter-type-all')).toHaveAttribute('aria-pressed', 'false');
  await page.getByTestId('filter-type-care').click();
  await expect.poll(() => feed(page)).toEqual(['Sleep question', FLOOR, 'Feeding question']);

  // Dates (inclusive), combined with the type.
  await page.getByTestId('more-filters').locator('summary').click();
  await page.getByLabel('From').fill('2026-11-20');
  await expect.poll(() => feed(page)).toEqual(['Sleep question', FLOOR]);
  await page.getByLabel('To', { exact: true }).fill('2026-11-20');
  await expect.poll(() => feed(page)).toEqual([FLOOR]);
  await page.getByTestId('filter-type-all').click();
  await page.getByLabel('From').fill('');
  await page.getByLabel('To', { exact: true }).fill('2026-10-02');
  await expect.poll(() => feed(page)).toEqual(['Feeding question', 'Park day']);
  await page.getByLabel('To', { exact: true }).fill('');
  await expect.poll(() => feed(page)).toEqual(all);

  // Tags: each of the child's tags once (capitals don't make a second tag); every chosen tag must match.
  const tagChips = page.getByTestId('filter-tag');
  expect((await tagChips.allInnerTexts()).map((t) => t.trim().toLowerCase())).toEqual(['family', 'feeding', 'firsts', 'sleep', 'therapy']);
  await tagChips.filter({ hasText: /family/i }).click();
  await expect.poll(() => feed(page)).toEqual(['First giggles', 'Park day']);
  await tagChips.filter({ hasText: /family/i }).click();
  await tagChips.filter({ hasText: 'sleep' }).click();
  await expect.poll(() => feed(page)).toEqual(['Sleep question', FLOOR]);
  await tagChips.filter({ hasText: 'therapy' }).click();
  await expect.poll(() => feed(page)).toEqual([FLOOR]);
  await expect(page.getByTestId('more-filters').locator('summary')).toHaveText('Dates and tags (2 in use)');
  await tagChips.filter({ hasText: 'therapy' }).click();

  // Everything together: text + date + tag + the unanswered view (which replaces the Care Notes view, R-024).
  await search.fill('expected');
  await page.getByTestId('filter-type-care').click();
  await page.getByLabel('From').fill('2026-11-01');
  await page.getByTestId('filter-unanswered').click();
  await expect(page.getByTestId('filter-type-care')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => feed(page)).toEqual(['Sleep question']);
  await expect(page.getByTestId('journal-count')).toHaveText('Showing 1 of 5 entries');
  await search.fill('giggles');
  await expect(page.getByTestId('journal-no-results')).toBeVisible();

  // Clearing restores the whole feed. Filtering changed no record.
  await page.getByTestId('clear-filters').click();
  await expect.poll(() => feed(page)).toEqual(all);
  await expect(search).toHaveValue('');
  await expect(page.getByTestId('filter-type-all')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('filter-unanswered')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('journal-count')).toHaveCount(0);
  expect(await stored(page)).toHaveLength(5);
});

test('an entry saved while filters are on says so when it doesn’t match them', async ({ page }) => {
  await start(page);
  await addEntry(page, { type: 'care', title: 'Fictional care note', body: 'Fictional' });
  await page.getByTestId('filter-type-care').click();
  await addEntry(page, { title: 'Fictional reflection', body: 'Fictional' });
  await expect(page.getByTestId('saved-text')).toHaveText('Entry saved. It doesn’t match the current search or filters, so it isn’t shown below.');
  expect(await feed(page)).toEqual(['Fictional care note']);
  await page.getByTestId('clear-filters').click();
  await expect.poll(() => feed(page)).toEqual(['Fictional reflection', 'Fictional care note']);
});

// ---------------------------------------------------------------------------
// Provider questions
// ---------------------------------------------------------------------------

test('provider questions: flag a Care Note, review unanswered ones, mark answered and back; the note is never removed or altered', async ({ page }) => {
  await start(page);
  await seedFive(page);
  const unanswered = page.getByTestId('filter-unanswered');
  await expect(unanswered).toHaveText('Unanswered questions (1)'); // one click from the top of the Journal
  await expect(unanswered).toBeVisible();
  await expect(card(page, 'Sleep question').getByTestId('question-status')).toHaveText('Question for the provider · Unanswered');
  await expect(card(page, 'Feeding question').getByTestId('question-status')).toHaveText('Question for the provider · Answered');
  await expect(card(page, FLOOR).getByTestId('entry-question')).toHaveCount(0); // a Care Note that isn't a question

  // Flag another note as a question by editing it.
  await card(page, FLOOR).getByTestId('entry-open').click();
  await page.getByTestId('entry-edit').click();
  await page.getByTestId('entry-question-flag').locator('input').check();
  await page.getByTestId('save-entry').click();
  await expect(unanswered).toHaveText('Unanswered questions (2)');
  await unanswered.click();
  await expect(unanswered).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => feed(page)).toEqual(['Sleep question', FLOOR]);

  // Mark one answered from the feed. It leaves the unanswered list, and stays in the Journal unchanged.
  const before = (await stored(page)).find((e) => e.title === 'Sleep question')!;
  await card(page, 'Sleep question').getByTestId('toggle-answered').click();
  await expect.poll(() => feed(page)).toEqual([FLOOR]);
  await expect(unanswered).toHaveText('Unanswered questions (1)');
  await page.getByTestId('filter-type-all').click(); // R-024: another view is chosen; pressing the same one again changes nothing
  await expect(unanswered).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => feed(page)).toEqual(['First giggles', 'Sleep question', FLOOR, 'Feeding question', 'Park day']); // still in the ordinary feed, in its place
  const sleep = card(page, 'Sleep question');
  await expect(sleep.getByTestId('question-status')).toHaveText('Question for the provider · Answered');
  await expect(sleep.getByTestId('entry-excerpt')).toHaveText('Fictional: waking twice most nights. Is that expected?');
  await expect(sleep.getByTestId('entry-tags').locator('li')).toHaveText(['sleep']);
  const after = (await stored(page)).find((e) => e.id === before.id)!;
  expect(after).toEqual({ ...before, answered: true, rev: (before.rev as number) + 1, updatedAt: after.updatedAt, lastModifiedBy: after.lastModifiedBy });
  expect(await stored(page)).toHaveLength(5);

  // The parent can add the provider's response by editing the note; it stays answered.
  await sleep.getByTestId('entry-open').click();
  await expect(page.getByTestId('view-question-status')).toHaveText('Question for the provider · Answered');
  await page.getByTestId('entry-edit').click();
  await expect(page.getByTestId('entry-answered-flag').locator('input')).toBeChecked();
  await bodyField(page).fill('Fictional: waking twice most nights. Is that expected?\n\nFictional response: yes, and it usually settles.');
  await page.getByTestId('save-entry').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry updated.');
  expect((await stored(page)).find((e) => e.id === before.id)).toMatchObject({ answered: true, isProviderQuestion: true, body: 'Fictional: waking twice most nights. Is that expected?\n\nFictional response: yes, and it usually settles.' });

  // Back to unanswered, from the open entry.
  await card(page, 'Sleep question').getByTestId('entry-open').click();
  await page.getByTestId('view-toggle-answered').click();
  await expect(page.getByTestId('view-question-status')).toHaveText('Question for the provider · Unanswered');
  await page.getByTestId('entry-close').click();
  await expect(unanswered).toHaveText('Unanswered questions (2)');

  // When every question is answered, the filter says so plainly.
  for (const t of ['Sleep question', FLOOR]) await card(page, t).getByTestId('toggle-answered').click();
  await expect(unanswered).toHaveText('Unanswered questions (0)');
  await unanswered.click();
  await expect(page.getByTestId('journal-no-results')).toContainText('There are no unanswered questions for the provider.');
  expect(await stored(page)).toHaveLength(5); // nothing was deleted along the way
});

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

test('each child has their own journal; search, tags and an open editor never cross profiles', async ({ page, context }) => {
  await start(page);
  await addEntry(page, { title: 'Fictional A memory', body: 'Fictional: only for A, marmalade.', tags: 'a-only' });
  await addChild(page, 'Sample Child B', '2025-01-15');
  await page.goto('./#/journal');
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child B');
  await expect(page.locator('.page-intro')).toHaveText('Memories and care notes for Sample Child B.');
  await expect(page.getByTestId('journal-empty')).toBeVisible(); // B starts with an empty journal
  await addEntry(page, { type: 'care', title: 'Fictional B question', body: 'Fictional: only for B, tangerine.', tags: 'b-only', question: true });

  // B's journal: nothing of A's can be found by search or by tag.
  await page.getByRole('searchbox', { name: 'Search journal' }).fill('marmalade');
  await expect(page.getByTestId('journal-no-results')).toBeVisible();
  await page.getByTestId('more-filters').locator('summary').click();
  await expect(page.getByTestId('filter-tag')).toHaveText([/b-only/]);
  await page.getByRole('searchbox', { name: 'Search journal' }).fill('tangerine');
  await expect.poll(() => feed(page)).toEqual(['Fictional B question']);

  // Switching refreshes the Journal, and the search, filters and selected view start again.
  await page.getByTestId('filter-unanswered').click();
  await expect.poll(() => feed(page)).toEqual(['Fictional B question']);
  await switchTo(page, 'Sample Child A');
  await expect(page.getByTestId('filter-type-all')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('filter-unanswered')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.page-intro')).toHaveText('Memories and care notes for Sample Child A.');
  await expect.poll(() => feed(page)).toEqual(['Fictional A memory']);
  await expect(page.getByRole('searchbox', { name: 'Search journal' })).toHaveValue('');
  await expect(page.getByTestId('filter-unanswered')).toHaveText('Unanswered questions (0)'); // B's question isn't counted for A
  await page.getByRole('searchbox', { name: 'Search journal' }).fill('tangerine');
  await expect(page.getByTestId('journal-no-results')).toBeVisible();
  await page.getByTestId('clear-filters').click();
  await page.getByTestId('more-filters').locator('summary').click();
  await expect(page.getByTestId('filter-tag')).toHaveText([/a-only/]);

  // An editor for A is modal: the child selector can't be used through it, and nothing typed for A reaches B.
  await page.getByTestId('new-entry').click();
  await expect(page.getByTestId('known-tag')).toHaveText([/a-only/]); // tag suggestions are A's own
  await fillEntry(page, { title: 'Fictional unsaved for A', body: 'Fictional private draft' });
  const chip = (await page.getByTestId('child-chip').boundingBox())!;
  await page.mouse.click(chip.x + chip.width / 2, chip.y + chip.height / 2); // lands on the scrim: asks before closing
  await expect(page.getByTestId('child-switcher')).toHaveCount(0);
  await page.getByTestId('discard-confirm').click();
  await switchTo(page, 'Sample Child B');
  await expect(page.getByText('Fictional unsaved for A')).toHaveCount(0);
  await page.getByTestId('new-entry').click();
  await expect(titleField(page)).toHaveValue(''); // nothing carried over from the other profile
  await expect(bodyField(page)).toHaveValue('');
  await expect(page.getByTestId('known-tag')).toHaveText([/b-only/]);
  await page.keyboard.press('Escape');

  // The active child changes somewhere else (another window of the app) while an editor for B is open here.
  await page.getByTestId('new-entry').click();
  await fillEntry(page, { title: 'Fictional written for B', body: 'Fictional: started while B was active.' });
  const other = await context.newPage();
  await other.clock.setFixedTime(NOW);
  await other.goto('./#/journal');
  await switchTo(other, 'Sample Child A');
  await other.close();
  await page.clock.setFixedTime(new Date(NOW.getTime() + 30 * 60_000)); // written later than B's first entry
  await page.getByTestId('save-entry').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry saved.');
  const all = await stored(page);
  const idOf = (title: string) => all.find((e) => e.title === title)!.childId;
  expect(idOf('Fictional written for B')).toBe(idOf('Fictional B question')); // saved for the child it was written for
  expect(idOf('Fictional written for B')).not.toBe(idOf('Fictional A memory'));
  // After reloading, the app shows the child chosen in the other window, with only their entries.
  await page.reload();
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child A');
  await expect.poll(() => feed(page)).toEqual(['Fictional A memory']);
  await switchTo(page, 'Sample Child B');
  await expect.poll(() => feed(page)).toEqual(['Fictional written for B', 'Fictional B question']);
  expect(new Set((await stored(page)).map((e) => e.childId)).size).toBe(2);
});

test('deleting a profile erases that child’s journal only; a full reset erases everything', async ({ page }) => {
  await start(page);
  await addEntry(page, { title: 'Fictional A memory', body: 'Fictional A text', tags: 'a-tag' });
  await addChild(page, 'Sample Child B', '2025-01-15');
  await page.goto('./#/journal');
  await addEntry(page, { type: 'care', title: 'Fictional B question', body: 'Fictional B text', tags: 'b-tag', question: true });
  await addEntry(page, { title: 'Fictional B memory', body: 'Fictional B text' });
  const all = await stored(page);
  const bId = all.find((e) => e.title === 'Fictional B question')!.childId as string;
  await page.goto(`./#/profiles/${bId}`);
  await deleteProfile(page);
  await expect.poll(async () => (await stored(page)).map((e) => e.title)).toEqual(['Fictional A memory']);
  await expect(page.getByRole('heading', { name: 'Child profiles' })).toBeVisible(); // the deletion has finished and returned to the list
  expect(JSON.stringify(await stored(page))).not.toMatch(/Fictional B|b-tag/);
  await page.goto('./#/journal');
  await expect.poll(() => feed(page)).toEqual(['Fictional A memory']);
  await expect(page.getByTestId('filter-unanswered')).toHaveText('Unanswered questions (0)');

  await page.goto('./#/settings');
  await page.getByRole('button', { name: /Your Data/ }).click();
  await page.getByRole('button', { name: 'Advanced data management' }).click();
  await page.getByRole('button', { name: 'Erase all app data…' }).click();
  await page.getByLabel('Type RESET to continue').fill('RESET');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Yes, erase everything' }).click();
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
  expect(await stored(page)).toEqual([]);
  await completeOnboarding(page, { dob: '2025-03-14', name: 'Sample Child C' });
  await page.goto('./#/journal');
  await expect(page.getByTestId('journal-empty')).toBeVisible();
  expect(await dbVersion(page)).toBe(3);
});

// ---------------------------------------------------------------------------
// Persistence and offline
// ---------------------------------------------------------------------------

test('entries are still there after reloading and after reopening the app', async ({ page, context }) => {
  await start(page);
  await addEntry(page, { type: 'care', date: '2026-11-20', title: 'Fictional kept question', body: 'Fictional line one.\nFictional line two.', tags: 'sleep, kept', question: true });
  await addEntry(page, { body: 'Fictional kept reflection' });
  const before = await stored(page);
  await page.reload();
  await expect.poll(() => feed(page)).toEqual(['Fictional kept reflection', 'Fictional kept question']);
  await page.close();
  const again = await context.newPage(); // reopening: a new page in the same browser profile
  await again.clock.setFixedTime(NOW);
  await again.goto('./#/journal');
  await expect.poll(() => feed(again)).toEqual(['Fictional kept reflection', 'Fictional kept question']);
  const c = card(again, 'Fictional kept question');
  await expect(c.getByTestId('entry-type')).toHaveText('Care Note');
  await expect(c.getByTestId('entry-date')).toHaveText('November 20, 2026');
  await expect(c.getByTestId('entry-tags').locator('li')).toHaveText(['sleep', 'kept']);
  await expect(c.getByTestId('question-status')).toHaveText('Question for the provider · Unanswered');
  await c.getByTestId('entry-open').click();
  expect(await again.getByTestId('entry-view-body').innerText()).toBe('Fictional line one.\nFictional line two.');
  expect(await stored(again)).toEqual(before);
  expect(await dbVersion(again)).toBe(3);
});

test('works offline: the Journal opens, and entries can be created, edited, answered, filtered and deleted', async ({ page, context }) => {
  await start(page);
  await addEntry(page, { title: 'Fictional online entry', body: 'Fictional written online' });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('journal')).toBeVisible();
  await expect.poll(() => feed(page)).toEqual(['Fictional online entry']);
  // Create, edit, answer and delete while offline.
  await addEntry(page, { type: 'care', title: 'Fictional offline question', body: 'Fictional written offline', tags: 'offline', question: true });
  await card(page, 'Fictional offline question').getByTestId('entry-open').click();
  await page.getByTestId('entry-edit').click();
  await fillEntry(page, { title: 'Fictional offline question, edited', date: '2026-11-21' });
  await page.getByTestId('save-entry').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry updated.');
  await page.getByTestId('filter-unanswered').click();
  await expect.poll(() => feed(page)).toEqual(['Fictional offline question, edited']);
  await page.getByTestId('toggle-answered').click();
  await expect(page.getByTestId('journal-no-results')).toBeVisible();
  await page.getByTestId('clear-filters').click();
  await card(page, 'Fictional online entry').getByTestId('entry-open').click();
  await page.getByTestId('entry-delete').click();
  await page.getByTestId('delete-entry-confirm').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry deleted.');
  // Move between all four tabs and reload, still offline: everything persisted.
  for (const tab of ['Home', 'Growth', 'Calendar', 'Journal']) {
    await page.getByRole('link', { name: tab, exact: true }).click();
    await expect(page.getByRole('link', { name: tab, exact: true })).toHaveAttribute('aria-current', 'page');
  }
  await page.reload();
  await expect.poll(() => feed(page)).toEqual(['Fictional offline question, edited']);
  await expect(page.getByTestId('question-status')).toHaveText('Question for the provider · Answered');
  // Home's shortcut works offline too.
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByTestId('qa-journal-entry').click();
  await expect(form(page)).toBeVisible();
  await context.setOffline(false);
});

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

test('Home’s Journal entry shortcut opens a new entry for the active child; no placeholders remain on Home', async ({ page }) => {
  await start(page);
  await page.goto('./#/home');
  const qa = page.getByTestId('qa-journal-entry');
  await expect(qa).toHaveText('Journal entry');
  await expect(qa).toHaveAttribute('href', '#/journal/new');
  await expect(page.locator('main')).not.toContainText(/Coming soon|Coming next|Daily encouragement/);
  await expect(page.locator('.quick-action')).toHaveCount(3);
  await expect(page.locator('.quick-action[aria-disabled]')).toHaveCount(0);
  await qa.click();
  await expect(page.getByRole('dialog', { name: 'New journal entry' })).toBeVisible();
  await expect(page).toHaveURL(/#\/journal$/); // a reload or the Back button won't reopen the form
  await bodyField(page).fill('Fictional entry from Home');
  await page.getByTestId('save-entry').click();
  await expect.poll(() => feed(page)).toEqual(['Fictional entry from Home']);
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // The other two quick actions still go where they did.
  await page.goto('./#/home');
  await expect(page.getByTestId('qa-record-milestone')).toHaveAttribute('href', '#/growth/library/now');
  await expect(page.getByTestId('qa-new-event')).toHaveAttribute('href', '#/calendar/add');
});

// ---------------------------------------------------------------------------
// Source attribution after the removal of Resources
// ---------------------------------------------------------------------------

test('source attribution and original-source links are still reachable without the Resources tab', async ({ page }) => {
  await start(page);
  // Settings → About: sources summary and third-party licenses.
  await page.goto('./#/settings');
  await page.getByRole('button', { name: /About/ }).click();
  await page.getByRole('link', { name: /About, sources & version/ }).click();
  await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  await expect(page.locator('main')).toContainText('CDC’s “Learn the Signs. Act Early.”');
  await expect(page.getByTestId('third-party-licenses')).toBeVisible();
  // Growth → About these milestones: the full source list with links to the originals.
  await page.goto('./#/growth/about');
  const sources = page.getByTestId('about-sources');
  await expect(sources.getByRole('heading', { name: 'Sources' })).toBeVisible();
  expect(await sources.locator('a[href^="https://www.cdc.gov"]').count()).toBeGreaterThan(0);
  // A milestone still shows where it comes from.
  await page.goto('./#/growth/milestone/cdc22-m12-mp-03');
  await expect(page.locator('main')).toContainText('CDC');
  // Calendar: the vaccine schedule's source line and link.
  await page.goto('./#/calendar');
  await page.getByTestId('overlay-vaccines').click();
  await expect(page.getByTestId('vax-source-summary')).toContainText('Based on the CDC childhood immunization schedule');
  await page.getByTestId('vax-source-details').locator('summary').click();
  await expect(page.getByTestId('vax-source-link')).toHaveAttribute('href', /cdc\.gov/);
});

// ---------------------------------------------------------------------------
// Keyboard, focus, themes, accessibility and narrow layouts
// ---------------------------------------------------------------------------

test('keyboard and focus: write, open, answer and delete an entry without a pointer; focus stays in dialogs and returns', async ({ page }) => {
  await start(page);
  const newEntry = page.getByTestId('new-entry');
  await newEntry.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'New journal entry' });
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('entry-type-reflection').locator('input')).toBeFocused(); // focus moves into the form
  await page.keyboard.press('ArrowDown'); // radio group: Care Note
  await expect(page.getByTestId('entry-type-care').locator('input')).toBeChecked();
  // Tab never leaves the dialog: forward from the last control wraps to the first, and back again.
  await page.getByTestId('cancel-entry').focus();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  await expect(page.getByTestId('entry-type-reflection').locator('input')).toBeFocused();
  await expect(page.getByTestId('entry-type-care').locator('input')).toBeChecked(); // moving focus didn't change the choice
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('cancel-entry')).toBeFocused();
  // Escape with nothing written (only the type changed counts as a change, so it asks; Escape again keeps writing).
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('discard-keep')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await titleField(page).focus();
  await page.keyboard.type('Fictional keyboard question');
  await page.keyboard.press('Tab');
  await expect(bodyField(page)).toBeFocused();
  await page.keyboard.type('Fictional: typed without a pointer.');
  await page.keyboard.press('Tab');
  await expect(tagsField(page)).toBeFocused();
  await page.keyboard.type('keyboard');
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('entry-question-flag').locator('input')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('entry-question-flag').locator('input')).toBeChecked();
  await titleField(page).focus();
  await page.keyboard.press('Enter'); // Enter in a single-line field saves
  await expect(page.getByTestId('saved-text')).toHaveText('Entry saved.');
  await expect(newEntry).toBeFocused(); // focus returns to where the form was opened from

  // Open the entry from the feed, mark it answered and close: focus returns to the entry.
  const open = page.getByTestId('entry-open');
  await open.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Fictional keyboard question' })).toBeVisible();
  await page.getByTestId('view-toggle-answered').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('view-question-status')).toHaveText('Question for the provider · Answered');
  await expect(page.getByTestId('view-toggle-answered')).toBeFocused(); // focus isn't lost by the change
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(open).toBeFocused();
  // The answered control in the feed is a real button with a name that says which entry it is for.
  await expect(page.getByRole('button', { name: /^Mark unanswered\s+for Fictional keyboard question$/ })).toBeVisible();
  await page.getByTestId('toggle-answered').focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('question-status')).toHaveText('Question for the provider · Unanswered');

  // Filters are buttons with a pressed state; search is a labelled search box.
  await page.getByTestId('filter-unanswered').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('filter-unanswered')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status').filter({ hasText: 'Showing' })).toHaveText('Showing 1 of 1 entry');
  await page.keyboard.press('Enter'); // pressing the selected view again leaves it selected (one is always chosen)
  await expect(page.getByTestId('filter-unanswered')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('filter-type-all').focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('filter-type-all')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('filter-unanswered')).toHaveAttribute('aria-pressed', 'false');

  // Delete by keyboard: Cancel is first; confirming moves focus to New Journal Entry.
  await open.focus();
  await page.keyboard.press('Enter');
  await page.getByTestId('entry-delete').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('delete-entry-cancel')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('delete-entry-confirm')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('saved-text')).toHaveText('Entry deleted.');
  await expect(newEntry).toBeFocused();
  expect(await stored(page)).toEqual([]);
});

for (const theme of ['earth', 'sky', 'blush', 'lavender', 'sage']) {
  test(`accessibility checks pass and the two types stay distinct in the ${theme} theme (feed, filters, entry, forms)`, async ({ page }) => {
    await start(page, { theme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const tags = ['wcag2a', 'wcag2aa', 'wcag21aa'];
    const scan = async (scope?: string) => {
      await settle(page);
      const b = new AxeBuilder({ page: page as never }).withTags(tags);
      return (await (scope ? b.include(scope) : b).analyze()).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`);
    };
    expect(await scan(), 'empty journal').toEqual([]);
    await addEntry(page, { title: 'Fictional reflection', body: 'Fictional reflection text', tags: 'family, firsts' });
    await addEntry(page, { type: 'care', title: 'Fictional question', body: 'Fictional question text', tags: 'sleep', question: true });
    await addEntry(page, { type: 'care', date: '2026-11-01', body: 'Fictional answered text', question: true, answered: true });
    // Distinct in this theme: label, icon, edge and badge colors all differ, using the theme's own colors.
    const look = (text: string) => card(page, text).evaluate((el) => {
      const badge = el.querySelector('[data-testid="entry-type"]')!;
      const s = getComputedStyle(badge);
      return { label: badge.textContent!.trim(), edge: getComputedStyle(el).borderLeftColor, bg: s.backgroundColor, fg: s.color, icon: badge.querySelector('svg')!.innerHTML };
    });
    const [r, k] = [await look('Fictional reflection text'), await look('Fictional question text')];
    expect([r.label, k.label]).toEqual(['Personal Reflection', 'Care Note']);
    expect(r.icon).not.toBe(k.icon);
    expect(r.edge).not.toBe(k.edge);
    expect(r.bg).not.toBe(k.bg);
    const primary = await page.evaluate(() => { const p = document.createElement('span'); p.style.color = 'var(--primary)'; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; });
    expect(r.edge).toBe(primary);
    // R-025: in this theme the whole Care Note card (every Care Note, question or not) is the theme's soft tint and
    // clearly darker than the Personal Reflection's light card; the question strip is a lighter panel inside it.
    const shade = await page.evaluate(() => {
      const token = (name: string) => { const p = document.createElement('span'); p.style.color = `var(${name})`; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
      const lum = (rgb: string) => { const [r, g, b] = rgb.match(/[\d.]+/g)!.slice(0, 3).map((v) => { const s = Number(v) / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
      const bg = (el: Element) => getComputedStyle(el).backgroundColor;
      const cards = [...document.querySelectorAll('[data-testid="journal-entry"]')];
      const care = cards.filter((c) => c.getAttribute('data-type') === 'care');
      const refl = cards.filter((c) => c.getAttribute('data-type') === 'reflection');
      const strip = care[0]!.querySelector('[data-testid="entry-question"]')!;
      return {
        soft: token('--primary-soft'), surface: token('--surface'),
        care: care.map(bg), refl: refl.map(bg), strip: bg(strip),
        ratio: (lum(bg(refl[0]!)) + 0.05) / (lum(bg(care[0]!)) + 0.05),
        text: care.map((c) => getComputedStyle(c.querySelector('[data-testid="entry-excerpt"]')!).color), textToken: token('--text'),
      };
    });
    expect(shade.care).toEqual([shade.soft, shade.soft]);
    expect(shade.refl).toEqual([shade.surface]);
    expect(shade.strip).toBe(shade.surface);
    expect(shade.ratio).toBeGreaterThan(1.25); // a visible step in lightness, not a near-identical shade
    expect(shade.text).toEqual([shade.textToken, shade.textToken]);

    await page.getByTestId('more-filters').locator('summary').click();
    await page.getByTestId('filter-tag').first().click();
    expect(await scan(), 'feed with filters').toEqual([]);
    await page.getByRole('searchbox', { name: 'Search journal' }).fill('zzz');
    await expect(page.getByTestId('journal-no-results')).toBeVisible();
    expect(await scan(), 'no results').toEqual([]);
    await page.getByTestId('clear-filters').click();

    await card(page, 'Fictional question text').getByTestId('entry-open').click();
    expect(await scan('[role="dialog"]'), 'entry view').toEqual([]);
    await page.getByTestId('entry-edit').click();
    expect(await scan('[role="dialog"]'), 'editor').toEqual([]);
    await bodyField(page).fill('');
    await page.getByTestId('save-entry').click();
    await expect(page.getByRole('alert')).toBeVisible();
    expect(await scan('[role="dialog"]'), 'editor with an error').toEqual([]);
    await page.getByTestId('cancel-entry').click();
    await expect(page.getByTestId('discard-keep')).toBeVisible();
    expect(await scan('[role="dialog"]'), 'discard confirmation').toEqual([]);
    await page.getByTestId('discard-confirm').click();
    await card(page, 'Fictional reflection text').getByTestId('entry-open').click();
    await page.getByTestId('entry-delete').click();
    expect(await scan('[role="dialog"]'), 'delete confirmation').toEqual([]);
  });
}

for (const width of [320, 390]) {
  test(`narrow layout at ${width}px: the feed, filters, entry and editor fit, and controls are touch-sized`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await start(page);
    const unbroken = 'Fictionalwordwithnospaces'.repeat(8);
    // The title is at the 120-character limit, with one long unbroken word.
    await addEntry(page, { title: `Fictional title that is deliberately long ${'Fictionalwordwithnospaces'.repeat(3)}`.padEnd(120, 'x'), body: `Fictional text with one very long unbroken word: ${unbroken}. ${'More fictional text. '.repeat(40)}`, tags: 'a deliberately long tag name, second tag, third, fourth tag, fifth' });
    await addEntry(page, { type: 'care', title: 'Fictional question', body: 'Fictional short question?', tags: 'sleep', question: true });
    await addEntry(page, { type: 'care', date: '2026-11-01', body: 'Fictional answered note', question: true, answered: true });
    await noOverflow(page, 'feed');
    await page.getByTestId('more-filters').locator('summary').click();
    await page.getByTestId('filter-unanswered').click();
    await noOverflow(page, 'feed with filters open');
    const g = await page.evaluate(() => {
      const r = (e: Element) => { const b = e.getBoundingClientRect(); return { w: b.width, h: b.height, l: b.left, r: b.right }; };
      return {
        chips: [...document.querySelectorAll('[data-testid="journal-filters"] .chip')].map(r),
        inputs: [...document.querySelectorAll('[data-testid="journal-filters"] input')].map(r),
        buttons: [...document.querySelectorAll('[data-testid="new-entry"], [data-testid="toggle-answered"], [data-testid="clear-filters"], [data-testid="entry-open"]')].map(r),
        nav: [...document.querySelectorAll('.navlink')].map(r),
        vw: window.innerWidth,
      };
    });
    for (const b of [...g.chips, ...g.buttons]) expect(b.h).toBeGreaterThanOrEqual(40);
    for (const b of g.inputs) expect(b.h).toBeGreaterThanOrEqual(44);
    expect(g.nav).toHaveLength(4);
    for (const b of g.nav) { expect(b.h).toBeGreaterThanOrEqual(48); expect(b.w).toBeGreaterThanOrEqual(64); }
    for (const b of [...g.chips, ...g.inputs, ...g.buttons, ...g.nav]) { expect(b.l).toBeGreaterThanOrEqual(0); expect(b.r).toBeLessThanOrEqual(g.vw + 0.5); }
    await page.getByTestId('clear-filters').click();

    // The opened entry, the editor and both confirmations fit too.
    await card(page, 'Fictional title that is deliberately long').getByTestId('entry-open').click();
    await noOverflow(page, 'entry view');
    const sheet = await page.locator('.sheet').evaluate((el) => { const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, h: b.height, sw: el.scrollWidth, cw: el.clientWidth }; });
    expect(sheet.l).toBeGreaterThanOrEqual(0);
    expect(sheet.r).toBeLessThanOrEqual(width);
    expect(sheet.sw).toBeLessThanOrEqual(sheet.cw); // no sideways scrolling inside the sheet
    expect(sheet.h).toBeLessThanOrEqual(700);
    await page.getByTestId('entry-edit').click();
    await noOverflow(page, 'editor');
    const fields = await form(page).evaluate((el) => [...el.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), textarea, button, label.choice')].map((e) => { const b = e.getBoundingClientRect(); return { h: b.height, r: b.right, l: b.left }; }));
    for (const f of fields) {
      expect(f.h).toBeGreaterThanOrEqual(40);
      expect(f.r).toBeLessThanOrEqual(width);
      expect(f.l).toBeGreaterThanOrEqual(0);
    }
    expect((await bodyField(page).boundingBox())!.height).toBeGreaterThanOrEqual(180); // room to write
    await page.getByTestId('entry-type-care').click();
    await page.getByTestId('entry-question-flag').locator('input').check();
    await noOverflow(page, 'editor with question controls');
    await page.getByTestId('cancel-entry').click();
    await noOverflow(page, 'discard confirmation');
    await page.getByTestId('discard-confirm').click();
    await card(page, 'Fictional short question?').getByTestId('entry-open').click();
    await page.getByTestId('entry-delete').click();
    await noOverflow(page, 'delete confirmation');
  });
}

// ---------------------------------------------------------------------------
// Checkpoint 4-R: acceptance refinements R-024 (primary views), R-025 (card distinction), R-026 (shortcut state)
// ---------------------------------------------------------------------------

async function seedFour(page: Page) {
  await addEntry(page, { date: '2026-11-10', title: 'Reflection', body: 'Fictional reflection, marmalade.', tags: 'shared' });
  await addEntry(page, { type: 'care', date: '2026-11-12', title: 'Ordinary note', body: 'Fictional ordinary care note, marmalade.', tags: 'shared' });
  await addEntry(page, { type: 'care', date: '2026-11-14', title: 'Open question', body: 'Fictional unanswered question, marmalade?', tags: 'shared, q', question: true });
  await addEntry(page, { type: 'care', date: '2026-11-16', title: 'Answered question', body: 'Fictional answered question.', tags: 'q', question: true, answered: true });
}
const VIEWS = ['filter-type-all', 'filter-type-reflection', 'filter-type-care', 'filter-unanswered'] as const;
const pressed = (page: Page) => Promise.all(VIEWS.map((v) => page.getByTestId(v).getAttribute('aria-pressed')));

test('R-024: four primary views, one selected at a time; unanswered questions are a subset of Care Notes, never a separate kind', async ({ page }) => {
  await start(page);
  await seedFour(page);
  const [all, reflections, careNotes, unanswered] = VIEWS.map((v) => page.getByTestId(v));
  await expect(page.getByRole('group', { name: 'Show (one at a time)' }).getByRole('button')).toHaveText(['All', 'Personal Reflections', 'Care Notes', 'Unanswered questions (1)']);
  expect(await pressed(page)).toEqual(['true', 'false', 'false', 'false']);

  // The inclusion table, view by view. Exactly one view is selected after every click.
  const everything = ['Answered question', 'Open question', 'Ordinary note', 'Reflection'];
  expect(await feed(page)).toEqual(everything); // All: every type and question status
  await unanswered!.click();
  expect(await pressed(page)).toEqual(['false', 'false', 'false', 'true']);
  await expect.poll(() => feed(page)).toEqual(['Open question']);
  // Personal Reflections straight after Unanswered questions: no contradiction, no empty feed.
  await reflections!.click();
  expect(await pressed(page)).toEqual(['false', 'true', 'false', 'false']);
  await expect.poll(() => feed(page)).toEqual(['Reflection']);
  await expect(page.getByTestId('journal-no-results')).toHaveCount(0);
  // Care Notes straight after Unanswered questions: all Care Notes together (ordinary, answered and unanswered).
  await unanswered!.click();
  await careNotes!.click();
  expect(await pressed(page)).toEqual(['false', 'false', 'true', 'false']);
  await expect.poll(() => feed(page)).toEqual(['Answered question', 'Open question', 'Ordinary note']);
  await expect(page.getByTestId('journal-entry').getByTestId('entry-type')).toHaveText(['Care Note', 'Care Note', 'Care Note']);
  await all!.click();
  expect(await pressed(page)).toEqual(['true', 'false', 'false', 'false']);
  await expect.poll(() => feed(page)).toEqual(everything);
  // Pressing the selected view again keeps it selected: there is always exactly one.
  await all!.click();
  expect(await pressed(page)).toEqual(['true', 'false', 'false', 'false']);
  await unanswered!.click();
  await unanswered!.click();
  expect(await pressed(page)).toEqual(['false', 'false', 'false', 'true']);

  // Marking answered: leaves the unanswered view, stays in Care Notes and All, and nothing else about it changes.
  const before = (await stored(page)).find((e) => e.title === 'Open question')!;
  await card(page, 'Open question').getByTestId('toggle-answered').click();
  await expect(unanswered!).toHaveText('Unanswered questions (0)');
  await expect(page.getByTestId('journal-no-results')).toContainText('There are no unanswered questions for the provider.');
  await careNotes!.click();
  await expect.poll(() => feed(page)).toEqual(['Answered question', 'Open question', 'Ordinary note']);
  await expect(card(page, 'Open question').getByTestId('question-status')).toHaveText('Question for the provider · Answered');
  await all!.click();
  await expect.poll(() => feed(page)).toEqual(everything);
  const answered = (await stored(page)).find((e) => e.id === before.id)!;
  expect(answered).toEqual({ ...before, answered: true, rev: (before.rev as number) + 1, updatedAt: answered.updatedAt, lastModifiedBy: answered.lastModifiedBy });
  expect(answered).toMatchObject({ type: 'care', date: '2026-11-14', body: before.body, tags: ['shared', 'q'], isProviderQuestion: true });
  // Marking unanswered again: back in the unanswered view; still in Care Notes and All.
  await card(page, 'Open question').getByTestId('toggle-answered').click();
  await expect(unanswered!).toHaveText('Unanswered questions (1)');
  await unanswered!.click();
  await expect.poll(() => feed(page)).toEqual(['Open question']);
  await careNotes!.click();
  await expect.poll(() => feed(page)).toEqual(['Answered question', 'Open question', 'Ordinary note']);
  const back = (await stored(page)).find((e) => e.id === before.id)!;
  expect(back).toMatchObject({ type: 'care', answered: false, date: before.date, body: before.body, title: before.title, tags: before.tags, isProviderQuestion: true });
  // The stored representation is unchanged: two entry types only, with the same fields as before.
  const records = await stored(page);
  expect(new Set(records.map((e) => e.type))).toEqual(new Set(['reflection', 'care']));
  for (const e of records) expect(Object.keys(e).sort()).toEqual(['answered', 'body', 'childId', 'createdAt', 'date', 'deletedAt', 'id', 'isProviderQuestion', 'lastModifiedBy', 'originDeviceId', 'recordType', 'rev', 'tags', 'title', 'type', 'updatedAt']);
});

test('R-024: search, dates and tags combine with each of the four views and are kept when the view changes', async ({ page }) => {
  await start(page);
  await seedFour(page);
  const [all, reflections, careNotes, unanswered] = VIEWS.map((v) => page.getByTestId(v));
  const search = page.getByRole('searchbox', { name: 'Search journal' });
  await page.getByTestId('more-filters').locator('summary').click();
  const from = page.getByLabel('From');
  const tag = (t: string) => page.getByTestId('filter-tag').filter({ hasText: new RegExp(`^\\s*${t}\\s*$`) });
  const kept = async (text: string, date: string, tags: string[]) => {
    await expect(search).toHaveValue(text);
    await expect(from).toHaveValue(date);
    for (const t of ['shared', 'q']) await expect(tag(t)).toHaveAttribute('aria-pressed', String(tags.includes(t)));
  };

  // Search with every view.
  await search.fill('marmalade');
  await expect.poll(() => feed(page)).toEqual(['Open question', 'Ordinary note', 'Reflection']);
  await reflections!.click();
  await expect.poll(() => feed(page)).toEqual(['Reflection']);
  await careNotes!.click();
  await expect.poll(() => feed(page)).toEqual(['Open question', 'Ordinary note']);
  await unanswered!.click();
  await expect.poll(() => feed(page)).toEqual(['Open question']);
  await kept('marmalade', '', []);
  // Add a date and a tag; switch through all four views: the three extra filters stay exactly as set.
  await from.fill('2026-11-12');
  await tag('shared').click();
  await kept('marmalade', '2026-11-12', ['shared']);
  await expect.poll(() => feed(page)).toEqual(['Open question']);
  await all!.click();
  await kept('marmalade', '2026-11-12', ['shared']);
  await expect.poll(() => feed(page)).toEqual(['Open question', 'Ordinary note']); // the reflection is before the date
  await reflections!.click();
  await kept('marmalade', '2026-11-12', ['shared']);
  await expect(page.getByTestId('journal-no-results')).toContainText('Nothing matches the current search and filters.'); // empty because of the date, and it says so
  await careNotes!.click();
  await kept('marmalade', '2026-11-12', ['shared']);
  await expect.poll(() => feed(page)).toEqual(['Open question', 'Ordinary note']);
  await expect(page.getByTestId('journal-count')).toHaveText('Showing 2 of 4 entries');
  // Dates alone and tags alone, with different views.
  await search.fill('');
  await tag('shared').click();
  await from.fill('2026-11-13');
  await expect.poll(() => feed(page)).toEqual(['Answered question', 'Open question']);
  await unanswered!.click();
  await expect.poll(() => feed(page)).toEqual(['Open question']);
  await from.fill('');
  await tag('q').click();
  await careNotes!.click();
  await expect.poll(() => feed(page)).toEqual(['Answered question', 'Open question']);
  await reflections!.click();
  await expect(page.getByTestId('journal-no-results')).toBeVisible();
  await kept('', '', ['q']);
  // Clearing resets the view and every extra filter together.
  await page.getByTestId('clear-filters').click();
  expect(await pressed(page)).toEqual(['true', 'false', 'false', 'false']);
  await kept('', '', []);
  await expect.poll(() => feed(page)).toEqual(['Answered question', 'Open question', 'Ordinary note', 'Reflection']);
  expect(await stored(page)).toHaveLength(4);
});

test('R-025: in a mixed feed every Care Note card is tinted and every Personal Reflection card is light, with labels and icons kept', async ({ page }) => {
  await start(page);
  await seedFour(page);
  const cards = await page.getByTestId('journal-entry').evaluateAll((els) => els.map((el) => ({
    type: el.getAttribute('data-type'), bg: getComputedStyle(el).backgroundColor,
    label: el.querySelector('[data-testid="entry-type"]')!.textContent!.trim(), icon: !!el.querySelector('[data-testid="entry-type"] svg'),
    strip: el.querySelector('[data-testid="entry-question"]') ? getComputedStyle(el.querySelector('[data-testid="entry-question"]')!).backgroundColor : null,
  })));
  const care = cards.filter((c) => c.type === 'care');
  const refl = cards.filter((c) => c.type === 'reflection');
  expect(care).toHaveLength(3);
  expect(new Set(care.map((c) => c.bg)).size).toBe(1); // ordinary, answered and unanswered Care Notes look alike: one type
  expect(refl[0]!.bg).not.toBe(care[0]!.bg);
  for (const c of cards) { expect(c.icon).toBe(true); expect(c.label).toBe(c.type === 'care' ? 'Care Note' : 'Personal Reflection'); }
  for (const c of care.filter((x) => x.strip)) expect(c.strip).not.toBe(c.bg); // the question strip stands apart from the note's text
  // The opened entry and the editor are unchanged sheets; the tint is a feed treatment.
  await card(page, 'Ordinary note').getByTestId('entry-open').click();
  await expect(page.getByTestId('entry-view').getByTestId('entry-type')).toHaveText('Care Note');
});

for (const finish of ['save', 'cancel'] as const) {
  test(`R-026: after the Home shortcut (${finish}), switching children never opens an editor; the shortcut still works every time`, async ({ page }) => {
    await start(page);
    await addChild(page, 'Sample Child B', '2025-01-15');
    const hash = () => page.evaluate(() => window.location.hash);
    const openFromHome = async () => {
      await page.goto('./#/home');
      await page.getByTestId('qa-journal-entry').click();
      await expect(page.getByRole('dialog', { name: 'New journal entry' })).toBeVisible();
      await expect.poll(hash).toBe('#/journal'); // the one-time address has been used
    };
    const finishIt = async (text: string) => {
      if (finish === 'save') {
        await bodyField(page).fill(text);
        await page.getByTestId('save-entry').click();
        await expect(page.getByTestId('saved-text')).toHaveText('Entry saved.');
      } else {
        await page.getByTestId('cancel-entry').click();
      }
      await expect(page.getByRole('dialog')).toHaveCount(0);
    };
    const noEditor = async () => {
      await expect(page.getByTestId('journal')).toBeVisible();
      await page.waitForTimeout(250); // anything that was going to open has opened
      await expect(page.getByRole('dialog')).toHaveCount(0);
      expect(await hash()).toBe('#/journal');
    };

    // B is active. Open through the shortcut, finish, stay on the Journal, switch both ways.
    await openFromHome();
    await finishIt('Fictional B entry from Home');
    await switchTo(page, 'Sample Child A');
    await noEditor();
    await expect(page.locator('.page-intro')).toHaveText('Memories and care notes for Sample Child A.');
    await switchTo(page, 'Sample Child B');
    await noEditor();
    await switchTo(page, 'Sample Child A');
    await noEditor();

    // The shortcut opens a new entry again, each time it is used, for whichever child is active.
    await openFromHome();
    await finishIt('Fictional A entry from Home');
    await switchTo(page, 'Sample Child B');
    await noEditor();
    await openFromHome();
    // Unsaved-change protection still applies to a shortcut-opened form.
    await bodyField(page).fill('Fictional unsaved text');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Discard your changes?' })).toBeVisible();
    await page.getByTestId('discard-confirm').click();
    await switchTo(page, 'Sample Child A');
    await noEditor();

    // Ordinary navigation: the tab, a reload and the browser's Back button never open an editor.
    await page.getByRole('link', { name: 'Growth', exact: true }).click();
    await page.getByRole('link', { name: 'Journal', exact: true }).click();
    await noEditor();
    await switchTo(page, 'Sample Child B');
    await noEditor();
    await page.reload();
    await noEditor();
    await page.goBack(); // to Growth: the one-time address was replaced, so it isn't in the history
    await expect(page).not.toHaveURL(/journal\/new/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.goForward();
    await noEditor();

    // Each entry belongs to the child who was active when it was written.
    const records = await stored(page);
    if (finish === 'save') {
      expect(records.map((e) => e.body).sort()).toEqual(['Fictional A entry from Home', 'Fictional B entry from Home']);
      expect(new Set(records.map((e) => e.childId)).size).toBe(2);
      await expect.poll(() => feed(page)).toEqual(['Fictional B entry from Home']);
    } else {
      expect(records).toEqual([]);
    }
  });
}

test('R-026: the Journal tab’s own New Journal Entry button is unaffected, and switching afterwards opens nothing', async ({ page }) => {
  await start(page);
  await addChild(page, 'Sample Child B', '2025-01-15');
  await page.getByRole('link', { name: 'Journal', exact: true }).click();
  await addEntry(page, { body: 'Fictional B entry from the tab' });
  await switchTo(page, 'Sample Child A');
  await page.waitForTimeout(250);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByTestId('new-entry').click();
  await page.getByTestId('cancel-entry').click();
  await switchTo(page, 'Sample Child B');
  await page.waitForTimeout(250);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => feed(page)).toEqual(['Fictional B entry from the tab']);
});

// ---------------------------------------------------------------------------
// Checkpoint 4-R3: R-028 — an open entry form survives the entry list finishing its load
// ---------------------------------------------------------------------------

/**
 * Holds every read of the journal list until `release()` is called, so a test controls exactly when the
 * list “finishes loading” (no timers, no production delay: the hold exists only in this test page).
 */
async function holdJournalLoads(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __held: Array<() => void>; __holding: boolean };
    w.__held = [];
    w.__holding = true;
    const original = IDBIndex.prototype.getAll;
    IDBIndex.prototype.getAll = function (this: IDBIndex, ...args: Parameters<IDBIndex['getAll']>) {
      const request = original.apply(this, args);
      if (this.objectStore.name === 'journal') {
        const add = request.addEventListener.bind(request);
        request.addEventListener = ((type: string, fn: EventListener, opts?: boolean | AddEventListenerOptions) =>
          add(type, type === 'success' ? (e: Event) => (w.__holding ? w.__held.push(() => fn(e)) : fn(e)) : fn, opts)) as typeof request.addEventListener;
      }
      return request;
    };
  });
  return {
    release: () => page.evaluate(() => {
      const w = window as unknown as { __held: Array<() => void>; __holding: boolean };
      w.__holding = false;
      w.__held.splice(0).forEach((run) => run());
    }),
    held: () => page.evaluate(() => (window as unknown as { __held: unknown[] }).__held.length),
  };
}

for (const path of ['Home shortcut', 'Journal tab'] as const) {
  for (const journal of ['empty', 'populated'] as const) {
    test(`R-028: a form opened from the ${path} keeps everything typed, and focus, when the ${journal} journal finishes loading behind it`, async ({ page }) => {
      await start(page);
      if (journal === 'populated') {
        await addEntry(page, { title: 'Fictional earlier entry', body: 'Fictional earlier text', tags: 'earlier' });
        await addEntry(page, { type: 'care', title: 'Fictional earlier question', body: 'Fictional earlier question?', question: true });
      }
      const before = await stored(page);
      await page.getByRole('link', { name: 'Home', exact: true }).click();
      await expect(page.getByTestId('qa-journal-entry')).toBeVisible();
      const load = await holdJournalLoads(page);

      // Open the form while the list is still loading.
      if (path === 'Home shortcut') {
        await page.getByTestId('qa-journal-entry').click();
      } else {
        await page.getByRole('link', { name: 'Journal', exact: true }).click();
        await page.getByTestId('new-entry').click();
      }
      await expect(form(page)).toBeVisible();
      await expect(page.getByTestId('journal').getByText('Loading…')).toBeVisible(); // the list has not arrived yet
      await expect(page.getByTestId('journal-empty')).toHaveCount(0);
      await expect(page.getByTestId('journal-feed')).toHaveCount(0);
      await expect.poll(() => load.held()).toBeGreaterThan(0); // the read has been issued and is being held

      // Fill every field, finishing with the keyboard in the text area.
      await fillEntry(page, { type: 'care', date: '2026-11-20', title: 'Fictional title typed while loading', tags: 'loading, kept', question: true, answered: true });
      await bodyField(page).focus();
      await page.keyboard.type('Fictional words typed while the list was loading.');
      await expect(bodyField(page)).toBeFocused();
      await page.getByRole('dialog').evaluate((el) => el.setAttribute('data-same-dialog', 'yes')); // a mark that a rebuilt dialog would not carry

      // The list finishes loading behind the form.
      await load.release();
      await expect(page.getByTestId(journal === 'empty' ? 'journal-empty' : 'journal-feed')).toBeAttached();
      await expect(page.getByTestId('journal').getByText('Loading…')).toHaveCount(0);

      // Nothing was rebuilt or reset: every value, the dialog itself and the keyboard focus are as they were.
      await expect(page.getByRole('dialog')).toHaveAttribute('data-same-dialog', 'yes');
      await expect(page.getByRole('dialog')).toHaveCount(1);
      await expect(page.getByTestId('entry-type-care').locator('input')).toBeChecked();
      await expect(dateField(page)).toHaveValue('2026-11-20');
      await expect(titleField(page)).toHaveValue('Fictional title typed while loading');
      await expect(bodyField(page)).toHaveValue('Fictional words typed while the list was loading.');
      await expect(tagsField(page)).toHaveValue('loading, kept');
      await expect(page.getByTestId('entry-question-flag').locator('input')).toBeChecked();
      await expect(page.getByTestId('entry-answered-flag').locator('input')).toBeChecked();
      await expect(bodyField(page)).toBeFocused();
      await page.keyboard.type(' And these after it finished.'); // typing simply continues
      await expect(bodyField(page)).toHaveValue('Fictional words typed while the list was loading. And these after it finished.');
      if (journal === 'populated') await expect(page.getByTestId('known-tag')).toHaveText([/earlier/]); // suggestions arrive without disturbing the form

      // Discard protection still knows there is unsaved writing; saving works and stores exactly what was typed.
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog', { name: 'Discard your changes?' })).toBeVisible();
      await page.getByTestId('discard-keep').click();
      await expect(bodyField(page)).toHaveValue('Fictional words typed while the list was loading. And these after it finished.');
      await page.getByTestId('save-entry').click();
      await expect(page.getByTestId('saved-text')).toHaveText('Entry saved.');
      const after = await stored(page);
      expect(after).toHaveLength(before.length + 1);
      expect(after.find((e) => e.title === 'Fictional title typed while loading')).toMatchObject({
        type: 'care', date: '2026-11-20', body: 'Fictional words typed while the list was loading. And these after it finished.',
        tags: ['loading', 'kept'], isProviderQuestion: true, answered: true,
      });
      for (const e of before) expect(after.find((x) => x.id === e.id)).toEqual(e); // earlier entries untouched
      await expect(card(page, 'Fictional title typed while loading')).toBeVisible();
      await expect(page.getByTestId('journal-entry')).toHaveCount(before.length + 1);
    });
  }
}
