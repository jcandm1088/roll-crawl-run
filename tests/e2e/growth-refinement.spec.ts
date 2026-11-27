/**
 * Checkpoint 2a — Growth UX refinement (owner-approved): Review → Record → Support → Learn.
 * Fictional data only. Clock fixed at Nov 26, 2026, 10:00 local.
 */
import { expect, test, type Page } from '@playwright/test';
import { seedLegacyPersonalEntry } from './helpers';

const NOW = new Date('2026-11-26T10:00:00');

async function start(page: Page, opts: { name?: string; dob: string; ga?: number; useCorrected?: boolean }) {
  await page.clock.setFixedTime(NOW);
  await page.goto('./');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill(opts.dob);
  await page.getByRole('button', { name: 'Continue' }).click();
  if (opts.name) await page.getByLabel('Name or nickname').fill(opts.name);
  await page.getByRole('button', { name: 'Continue' }).click();
  if (opts.ga) {
    await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
    await page.getByRole('button', { name: 'Weeks at birth' }).click();
    await page.getByLabel('Weeks', { exact: true }).selectOption(String(opts.ga));
    if (opts.useCorrected) await page.getByRole('radio', { name: /Corrected age \(from due date\)/ }).click();
  }
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByTestId('chronological-age')).toBeVisible();
}

async function mark(page: Page, id: string, status: 'Not yet observed' | 'Emerging' | 'Achieved', date: string) {
  await page.goto(`./#/growth/milestone/${id}`);
  await page.getByRole('radio', { name: status }).click();
  await page.getByLabel(status === 'Achieved' ? 'Date achieved' : 'Date', { exact: true }).fill(date);
  await page.getByRole('button', { name: 'Save status' }).click();
  await expect(page.getByTestId('saved')).toBeVisible();
}

async function hide(page: Page, id: string) {
  await page.goto(`./#/growth/milestone/${id}`);
  await page.getByRole('button', { name: 'Hide this milestone' }).click();
  await expect(page.getByTestId('hidden-banner')).toBeVisible();
}

async function addChild(page: Page, name: string, dob: string) {
  await page.goto('./#/profiles/new');
  await page.getByLabel('Name or nickname (optional)').fill(name);
  await page.getByLabel('Date of birth').fill(dob);
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
}

async function switchTo(page: Page, name: string) {
  await page.goto('./#/home');
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: new RegExp(name) }).click();
  await expect(page.getByTestId('child-chip')).toContainText(name);
}

const overall = (page: Page) => page.getByTestId('progress-all').getByTestId('fraction');

/** Every IndexedDB store, serialized (Blobs reduced to their size), for before/after comparison. */
async function snapshotDb(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => new Promise<Record<string, string>>((resolve, reject) => {
    const r = indexedDB.open('roll-crawl-run');
    r.onerror = () => reject(r.error);
    r.onsuccess = () => {
      const db = r.result;
      const names = [...db.objectStoreNames];
      const tx = db.transaction(names, 'readonly');
      const out: Record<string, string> = {};
      for (const n of names) {
        const q = tx.objectStore(n).getAll();
        q.onsuccess = () => { out[n] = JSON.stringify(q.result, (_k, v) => (v instanceof Blob ? `blob:${v.size}` : v)); };
      }
      tx.oncomplete = () => { db.close(); resolve(out); };
    };
  }));
}
const changedStores = (a: Record<string, string>, b: Record<string, string>) => Object.keys({ ...a, ...b }).filter((k) => a[k] !== b[k]);

/**
 * Seed varied records: achieved, emerging, hidden, early achievement, entry (removed), personal entry.
 * Updated for R-005/R-007: the entry uses the unified Notes & Observations section, and the personal
 * entry is seeded as legacy data because the app can no longer create one.
 */
async function seedRecords(page: Page) {
  await mark(page, 'cdc22-m02-se-01', 'Achieved', '2026-11-01');
  await mark(page, 'cdc22-m02-lc-01', 'Emerging', '2026-11-02');
  await mark(page, 'cdc22-m04-se-01', 'Achieved', '2026-11-20'); // early
  await hide(page, 'cdc22-m02-cg-02');
  await page.goto('./#/growth/milestone/cdc22-m02-se-02');
  await page.getByLabel('Note or observation').fill('Fictional observation');
  await page.getByRole('button', { name: 'Add entry' }).click();
  await page.getByRole('button', { name: /^Remove entry/ }).click();
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByTestId('saved')).toBeVisible();
  await seedLegacyPersonalEntry(page, { title: 'Smiles at the cat (fictional)', derivedFromDefId: 'cdc22-m02-se-04', appCategory: 'social-emotional', referenceAgeMonths: 2 });
}

// ---------------------------------------------------------------------------
// Growth landing and parent-facing wording
// ---------------------------------------------------------------------------

test('Growth landing: approved order, subtitles and useful live lines; Goals is a “Coming soon” placeholder', async ({ page }) => {
  await start(page, { dob: '2025-07-10' }); // 16 months
  await page.goto('./#/growth');
  await expect(page.getByText('Tracking your developmental milestones.')).toBeVisible();
  const cards = page.locator('[data-testid="growth-sections"] > *');
  expect(await cards.locator('.title-3').allTextContents()).toEqual(['Progress', 'Milestone Library', 'Goals & Exercises', 'What to Expect at Every Age']);
  expect(await page.getByTestId('section-subtitle').allTextContents()).toEqual(['See how far we’ve come.', 'Record what we’ve accomplished.', 'Know what to work on.', 'Learn what’s ahead.']);
  await expect(page.getByTestId('section-progress').getByTestId('section-live')).toHaveText('0 of 72 recorded as achieved');
  await expect(page.getByTestId('section-library').getByTestId('section-live')).toHaveText('72 milestones apply now');
  await expect(page.getByTestId('section-expect').getByTestId('section-live')).toHaveText('Now: 15–18 months');
  await expect(page.getByTestId('section-goals')).toContainText('Coming soon');
  await expect(page.getByTestId('section-goals').getByRole('link')).toHaveCount(0);
});

test('no development checkpoint terminology appears anywhere in the parent-facing app', async ({ page }) => {
  test.setTimeout(90_000);
  await start(page, { dob: '2025-07-10' });
  const screens = ['./#/home', './#/growth', './#/growth/progress', './#/growth/library', './#/growth/library/all', './#/growth/expect', './#/growth/expect/6',
    './#/growth/about', './#/growth/milestone/cdc22-m15-mp-01', './#/calendar', './#/journal', './#/resources', './#/settings', './#/settings/about', './#/profiles'];
  for (const s of screens) {
    await page.goto(s);
    await page.waitForTimeout(150);
    // Open every visible accordion, repeatedly, so nested ones are revealed too.
    for (let n = 0; n < 20; n++) {
      const closed = page.locator('button.accordion-trigger[aria-expanded="false"]:visible');
      if (!(await closed.count())) break;
      await closed.first().click();
    }
    const text = await page.locator('body').innerText();
    expect(text, s).not.toMatch(/checkpoint|phase [a-c0-9]\b/i);
  }
});

// ---------------------------------------------------------------------------
// Milestone Library — default view, sorting, counts, state
// ---------------------------------------------------------------------------

test('Home “Record a milestone” opens the Library’s Up to now view with the applicable milestones', async ({ page }) => {
  await start(page, { dob: '2025-07-10' }); // 16 months → 72 applicable
  await page.getByTestId('qa-record-milestone').click();
  await expect(page.getByRole('heading', { name: 'Milestone Library', level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/#\/growth\/library$/);
  await expect(page.getByTestId('view-now')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('view-now')).toHaveText('Up to now (72)');
  await expect(page.getByTestId('view-upcoming')).toHaveText('Upcoming (87)');
  await expect(page.getByTestId('view-all')).toHaveText('All (159)'); // R-006: was “All 159”; the count is kept
  await expect(page.getByTestId('result-count')).toHaveText('72 milestones');
  await expect(page.getByTestId('record-guidance')).toContainText('Milestones marked Achieved that apply now count toward Progress');
});

test('Library sorting: Up to now most recent first; Upcoming nearest first; All youngest first', async ({ page }) => {
  await start(page, { dob: '2025-07-10' });
  await page.goto('./#/growth/library');
  const ages = () => page.getByTestId('library-group').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-age'))));
  expect(await ages()).toEqual([15, 12, 9, 6, 4, 2]);
  await page.getByTestId('view-upcoming').click();
  expect(await ages()).toEqual([18, 24, 30, 36, 48, 60]);
  await expect(page.getByTestId('library-group').first()).toContainText('upcoming for');
  await page.getByTestId('view-all').click();
  expect(await ages()).toEqual([2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60]);
  // Within an age: app areas in established order (Gross, Fine, Cognitive, Language, Social).
  const metas = await page.locator('[data-testid="library-group"][data-age="4"] .ms-meta').allTextContents();
  const order = ['Gross motor', 'Fine motor', 'Cognitive', 'Language & communication', 'Social & emotional'];
  const ranks = metas.map((m) => order.indexOf(m));
  expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
});

test('All label distinguishes the full catalog from shown and hidden milestones', async ({ page }) => {
  await start(page, { dob: '2025-07-10' });
  await hide(page, 'cdc22-m02-se-01');
  await hide(page, 'cdc22-m60-cg-01');
  await page.goto('./#/growth/library/all');
  // R-006: was “All 159 CDC milestones · …”; the shown/hidden counts are kept.
  await expect(page.getByTestId('catalog-label')).toHaveText('All milestones · 157 shown · 2 hidden');
  await expect(page.getByTestId('result-count')).toHaveText('157 milestones');
  await expect(page.getByTestId('view-now')).toHaveText('Up to now (71)');
  await page.getByTestId('toggle-hidden').click();
  await expect(page.getByTestId('result-count')).toHaveText('2 hidden');
});

test('search reports matches in another view when the current view has none', async ({ page }) => {
  await start(page, { dob: '2025-07-10' });
  await page.goto('./#/growth/library');
  await page.getByLabel('Search milestones').fill('hops on one foot');
  await expect(page.getByTestId('result-count')).toHaveText('0 milestones');
  await page.getByTestId('matches-upcoming').click();
  await expect(page.getByTestId('view-upcoming')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('milestone-row')).toHaveCount(1);
});

test('returning from a milestone restores the Library’s view, filters, search and scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await start(page, { dob: '2025-07-10' });
  await page.goto('./#/growth/library');
  await page.getByTestId('view-all').click();
  await page.getByRole('button', { name: 'Language & communication', exact: true }).click();
  await page.getByLabel('Search milestones').fill('says');
  const target = page.locator('[data-testid="milestone-row"][data-id="cdc22-m48-lc-01"]');
  await target.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 40));
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThan(300);
  await target.click();
  await expect(page.getByTestId('milestone-title')).toHaveText('Says sentences with four or more words');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByTestId('view-all')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Language & communication', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Search milestones')).toHaveValue('says');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y - 60);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(y + 60);
});

test('switching child never carries Library filters or scroll position over to another child', async ({ page }) => {
  await start(page, { name: 'Sample Child A', dob: '2025-07-10' });
  await addChild(page, 'Sample Child B', '2026-09-10'); // B is now active (2 months)
  await switchTo(page, 'Sample Child A');
  await page.goto('./#/growth/library');
  await page.getByTestId('view-all').click();
  await page.getByRole('button', { name: 'Fine motor', exact: true }).click();
  await page.getByLabel('Search milestones').fill('cup');
  await switchTo(page, 'Sample Child B');
  await page.goto('./#/growth/library');
  await expect(page.getByTestId('view-now')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Search milestones')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'All areas' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('result-count')).toHaveText('11 milestones');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('zero applicable milestones and all applicable hidden show neutral Library and Progress states', async ({ page }) => {
  await start(page, { name: 'Sample Child A', dob: '2026-11-01' }); // under 1 month
  await page.goto('./#/growth/library');
  await expect(page.getByTestId('library-empty')).toContainText('No milestones apply yet. The first are listed “by 2 months.”'); // R-006
  await page.getByTestId('go-upcoming').click();
  await expect(page.getByTestId('result-count')).toHaveText('159 milestones');
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('progress-all').getByTestId('neutral-state')).toHaveText('Nothing to track yet');
  // A 2-month-old with every applicable milestone hidden
  await addChild(page, 'Sample Child B', '2026-09-10');
  for (const id of ['se-01', 'se-02', 'se-03', 'se-04', 'lc-01', 'lc-02', 'cg-01', 'cg-02', 'mp-01', 'mp-02', 'mp-03']) await hide(page, `cdc22-m02-${id}`);
  await page.goto('./#/growth/library');
  await expect(page.getByTestId('library-empty')).toContainText('All the milestones that apply to Sample Child B now are hidden');
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('progress-all').getByTestId('neutral-state')).toHaveText('All hidden');
  await page.getByTestId('acc-by-age').getByRole('button').first().click();
  await expect(page.getByTestId('by-age-row')).toHaveText(['By 2 monthsAll hidden']);
});

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

test('Progress: headline, what updates it, area links into the Library, and the collapsed by-CDC-age breakdown', async ({ page }) => {
  await start(page, { dob: '2025-07-10' }); // 16 months
  await mark(page, 'cdc22-m12-mp-03', 'Achieved', '2026-07-01');
  await mark(page, 'cdc22-m24-mp-01', 'Achieved', '2026-11-01'); // early — not counted
  await page.goto('./#/growth/progress');
  await expect(page.getByRole('heading', { name: 'Milestones recorded as achieved' })).toBeVisible();
  await expect(overall(page)).toHaveText('1 of 72 achieved');
  await expect(page.getByTestId('what-updates')).toContainText('Reading What to Expect doesn’t change Progress.');
  await expect(page.getByTestId('milestone-safeguard')).toContainText('not an assessment of your child’s development');
  await expect(page.getByTestId('coming-soon-note')).toContainText('coming soon');
  // By CDC age: collapsed by default, applicable ages only, newest first.
  await expect(page.getByTestId('by-age')).toBeHidden();
  await page.getByTestId('acc-by-age').getByRole('button').first().click();
  expect(await page.getByTestId('by-age-row').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-age'))))).toEqual([15, 12, 9, 6, 4, 2]);
  await expect(page.locator('[data-testid="by-age-row"][data-age="12"]')).toContainText('1 of 10 achieved');
  // Area link opens the matching filtered Library view.
  await page.getByTestId('area-link-fine-motor').click();
  await expect(page.getByRole('heading', { name: 'Milestone Library', level: 1 })).toBeVisible();
  await expect(page.getByTestId('view-now')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Fine motor', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('result-count')).toHaveText('9 milestones');
  await page.goto('./#/growth/progress');
  await page.getByTestId('record-in-library').click();
  await expect(page.getByRole('button', { name: 'All areas' })).toHaveAttribute('aria-pressed', 'true');
});

// ---------------------------------------------------------------------------
// Recording confirmations
// ---------------------------------------------------------------------------

test('confirmations: a new applicable achievement counts; date corrections and Notes & Observations entries add no achievement', async ({ page }) => {
  await start(page, { name: 'Sample Child A', dob: '2025-07-10' });
  await mark(page, 'cdc22-m15-mp-01', 'Achieved', '2026-10-20');
  await expect(page.getByTestId('saved-text')).toHaveText('Saved as Achieved. It now counts in Sample Child A’s progress. See Progress');
  await page.goto('./#/growth/progress');
  await expect(overall(page)).toHaveText('1 of 72 achieved');
  await page.goto('./#/growth/milestone/cdc22-m15-mp-01');
  await page.getByText('Correct the achievement date').click();
  await page.getByLabel('Correct date').fill('2026-10-18');
  await page.getByRole('button', { name: 'Save corrected date' }).click();
  await expect(page.getByTestId('saved-text')).toHaveText('Achievement date updated. This doesn’t add another achievement; the earlier date stays in the history.');
  // R-007: the separate Note box and Observations form are one Notes & Observations section.
  await page.getByLabel('Note or observation').fill('Fictional observation');
  await page.getByRole('button', { name: 'Add entry' }).click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry added. It doesn’t change the status.');
  await page.getByRole('button', { name: /^Edit entry/ }).click();
  await page.getByLabel('Entry text').fill('Fictional observation, reworded');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry updated. The earlier wording stays in this device’s history until you erase it permanently.');
  await page.goto('./#/growth/progress');
  await expect(overall(page)).toHaveText('1 of 72 achieved'); // still one achievement
});

test('confirmations: early, emerging, reversal, hide and restore describe the actual effect', async ({ page }) => {
  await start(page, { name: 'Sample Child A', dob: '2025-07-10' }); // 16 months, chronological
  await mark(page, 'cdc22-m24-mp-01', 'Achieved', '2026-11-01');
  await expect(page.getByTestId('saved-text')).toHaveText('Saved as Achieved. It will count in progress once Sample Child A’s chronological age reaches 2 years, as long as it’s still marked Achieved and isn’t hidden.');
  await mark(page, 'cdc22-m24-mp-02', 'Emerging', '2026-11-01');
  await expect(page.getByTestId('saved-text')).toHaveText('Saved as Emerging. It isn’t part of current progress yet.');
  await mark(page, 'cdc22-m12-mp-01', 'Emerging', '2026-05-01');
  await expect(page.getByTestId('saved-text')).toContainText('Progress shows it as emerging; it doesn’t count as achieved.');
  await mark(page, 'cdc22-m12-mp-02', 'Achieved', '2026-06-01');
  await mark(page, 'cdc22-m12-mp-02', 'Not yet observed', '2026-11-01');
  await expect(page.getByTestId('saved-text')).toHaveText('Saved as Not yet observed. It no longer counts as achieved in Sample Child A’s progress. Your earlier entry stays in the history. See Progress');
  await mark(page, 'cdc22-m24-mp-01', 'Not yet observed', '2026-11-02');
  await expect(page.getByTestId('saved-text')).toHaveText('Saved as Not yet observed. It wasn’t counted in current progress, so progress is unchanged. Your earlier entry stays in the history.');
  await mark(page, 'cdc22-m15-mp-01', 'Achieved', '2026-10-20');
  await page.getByRole('button', { name: 'Hide this milestone' }).click();
  await expect(page.getByTestId('saved-text')).toHaveText('Hidden. It’s no longer included in progress. Its status and history are kept. See Progress');
  await page.getByTestId('hidden-banner').getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByTestId('saved-text')).toHaveText('Restored. It counts as achieved in progress again. See Progress');
});

// ---------------------------------------------------------------------------
// What to Expect — read-only guide
// ---------------------------------------------------------------------------

test('the guide covers all 20 ranges: 159 milestones exactly once, verbatim, and nine empty-range mappings', async ({ page }) => {
  test.setTimeout(60_000);
  await start(page, { dob: '2025-07-10' });
  const seen: string[] = [];
  const empty: Record<number, [string, string]> = {};
  for (let i = 0; i < 20; i++) {
    await page.goto(`./#/growth/expect/${i}`);
    await expect(page.getByLabel('Age range')).toHaveValue(String(i));
    seen.push(...(await page.getByTestId('guide-milestone').evaluateAll((els) => els.map((e) => e.getAttribute('data-id')!))));
    if (await page.getByTestId('empty-interval').count()) {
      empty[i] = [await page.getByTestId('neighbour-previous').innerText(), await page.getByTestId('neighbour-next').innerText()];
    } else {
      await expect(page.getByTestId('guide-overview')).toContainText('Written for this app from the milestones below.'); // R-006
    }
  }
  expect(seen).toHaveLength(159);
  expect(new Set(seen).size).toBe(159);
  expect(Object.keys(empty).map(Number)).toEqual([6, 8, 10, 12, 13, 14, 16, 17, 18]);
  const want: Record<number, [string, string]> = { 6: ['18 months', '2 years'], 8: ['2 years', '30 months'], 10: ['30 months', '3 years'], 12: ['3 years', '4 years'], 13: ['3 years', '4 years'], 14: ['3 years', '4 years'], 16: ['4 years', '5 years'], 17: ['4 years', '5 years'], 18: ['4 years', '5 years'] };
  for (const [i, [prev, next]] of Object.entries(want)) {
    expect(empty[Number(i)]![0]).toContain(`by ${prev}`);
    expect(empty[Number(i)]![1]).toContain(`by ${next}`);
  }
  // R-004: gender-neutral display wording (was CDC's verbatim “Smiles on his own …”); the catalog itself is unchanged.
  await page.goto('./#/growth/expect/1');
  await expect(page.locator('[data-testid="guide-milestone"][data-id="cdc22-m04-se-01"]')).toHaveText('Smiles on their own to get your attention');
  await expect(page.locator('[data-testid="guide-area"][data-category="fine-motor"]').nth(1)).toContainText('No “by 6 months” milestones are in this area.'); // R-006
  await expect(page.getByTestId('motor-note')).toContainText('Movement/Physical Development');
  await expect(page.getByTestId('guide-about')).toContainText('If you’re concerned about your child’s development, talk with your child’s healthcare provider.');
  await page.goto('./#/growth/expect/19');
  await expect(page.getByTestId('last-age')).toHaveText('“By 5 years” is the last milestone age.'); // R-006
  await expect(page.getByTestId('guide-next')).toBeDisabled();
  await page.goto('./#/growth/expect/0');
  await expect(page.getByTestId('guide-earlier')).toBeDisabled();
});

test('the guide has no recording controls, status, progress, or links to records or the Library', async ({ page }) => {
  test.setTimeout(60_000);
  await start(page, { dob: '2025-07-10' });
  await seedRecords(page);
  for (let i = 0; i < 20; i++) {
    await page.goto(`./#/growth/expect/${i}`);
    const g = page.getByTestId('guide');
    await expect(g).toBeVisible();
    await expect(g.locator('input, textarea, [role="radio"], [role="checkbox"], [role="radiogroup"]')).toHaveCount(0);
    await expect(g.locator('select')).toHaveCount(1); // the age-range selector only
    await expect(g.locator('.status-badge, .meter, [data-testid="fraction"], [data-testid="milestone-row"]')).toHaveCount(0);
    await expect(g.locator('a[href*="#/growth/milestone"], a[href*="#/growth/library"], a[href*="#/growth/progress"]')).toHaveCount(0);
    for (const href of await g.locator('a').evaluateAll((els) => els.map((e) => e.getAttribute('href')))) expect(href).toMatch(/^https:\/\/www\.cdc\.gov\//);
    const buttons = await g.locator('button').allInnerTexts();
    for (const b of buttons) expect(b.trim()).toMatch(/^(Earlier|Next|Back to current age|Open)/);
    const text = await g.innerText();
    expect(text).not.toMatch(/\d+ of \d+ (recorded as )?achieved|Emerging \d|Not yet observed \d/);
    expect(text.replace(/75% or more/g, '')).not.toMatch(/\d+\s?%/); // only CDC’s 75% basis, never a completion percentage
  }
});

test('browsing the guide writes nothing: records, history, progress and preferences are unchanged', async ({ page }) => {
  test.setTimeout(90_000);
  await start(page, { name: 'Sample Child A', dob: '2026-08-20' }); // 3 months
  await seedRecords(page);
  await page.goto('./#/growth/progress');
  const before = { overall: await overall(page).textContent(), history: 0 };
  await page.goto('./#/growth/milestone/cdc22-m02-se-01');
  await expect(page.getByTestId('history')).toBeVisible(); // records loaded (the history renders only after loading)
  before.history = await page.getByTestId('history-entry').count();
  expect(before.history).toBeGreaterThan(0);
  // Control: the app shell alone (navigation between screens) — anything it changes is not attributed to the guide.
  await page.goto('./#/home');
  const s0 = await snapshotDb(page);
  await page.goto('./#/growth');
  await page.goto('./#/home');
  const s1 = await snapshotDb(page);
  const shellChanges = changedStores(s0, s1);
  // Every guide interaction: dropdown over all 20 ranges, Earlier/Next across every boundary, neighbour links, Back to current age.
  await page.goto('./#/growth/expect');
  for (let i = 0; i < 20; i++) await page.getByLabel('Age range').selectOption(String(i));
  for (let i = 0; i < 19; i++) await page.getByTestId('guide-earlier').click();
  for (let i = 0; i < 19; i++) await page.getByTestId('guide-next').click();
  await page.goto('./#/growth/expect/6');
  await page.getByTestId('neighbour-previous').getByRole('button').click();
  await page.getByTestId('looking-ahead').getByRole('button').click();
  await page.getByRole('button', { name: 'Back to current age' }).click();
  await page.getByText('How the age ranges work').click();
  const popup = page.waitForEvent('popup');
  await page.getByTestId('guide-sources').getByRole('link').first().click(); // external CDC link opens a new window
  await (await popup).close();
  await page.goto('./#/home');
  const s2 = await snapshotDb(page);
  const guideChanges = changedStores(s1, s2);
  // Records and preferences must be byte-identical; nothing may change that the shell alone didn't also change.
  for (const store of ['children', 'milestoneRecords', 'milestoneEvents', 'customItems', 'settings', 'photos']) {
    if (store in s1) expect(s2[store], store).toBe(s1[store]);
  }
  expect(guideChanges.filter((s) => !shellChanges.includes(s))).toEqual([]);
  await page.goto('./#/growth/progress');
  expect(await overall(page).textContent()).toBe(before.overall);
  await page.goto('./#/growth/milestone/cdc22-m02-se-01');
  await expect(page.getByTestId('history-entry')).toHaveCount(before.history);
});

test('guide content is identical whatever has been recorded, hidden or personalized (header excluded)', async ({ page }) => {
  test.setTimeout(90_000);
  await start(page, { name: 'Sample Child A', dob: '2026-08-20' });
  await addChild(page, 'Sample Child B', '2026-08-20'); // same age, B active
  await seedRecords(page); // B: achieved, emerging, early, hidden, observation, personal version
  const read = async () => {
    const out: string[] = [];
    for (const i of [0, 1, 2, 6, 19]) {
      await page.goto(`./#/growth/expect/${i}`);
      out.push(await page.getByTestId('guide-content').innerText());
    }
    return out;
  };
  const forB = await read();
  expect(forB.join('\n')).not.toContain('Sample Child');
  expect(forB.join('\n')).toContain('Looks at a toy for several seconds'); // cdc22-m02-cg-02, hidden by B, still in the guide
  expect(forB.join('\n')).not.toContain('Smiles at the cat'); // personal version never appears
  await switchTo(page, 'Sample Child A');
  expect(await read()).toEqual(forB);
  // Header still reflects the child, outside the compared content
  await page.goto('./#/growth/expect');
  await expect(page.getByTestId('guide-header')).toContainText('Sample Child A');
});

test('guide age handling: exact boundary, corrected age, before the due date, and older than five', async ({ page }) => {
  await start(page, { dob: '2026-05-26' }); // exactly 6 months
  await page.goto('./#/growth/expect');
  await expect(page.getByLabel('Age range')).toHaveValue('1');
  await expect(page.getByTestId('range-includes')).toHaveText('This range includes the “by 4 months” and “by 6 months” milestones.'); // R-006
  await expect(page.getByTestId('milestone-age-line')).toContainText('6 months (chronological)');

  // Older than five (corrected age before and after the due date: separate tests below).
  await addChild(page, 'Sample Child C', '2020-09-01');
  await page.goto('./#/growth/expect');
  await expect(page.getByLabel('Age range')).toHaveValue('19');
  await expect(page.getByTestId('over-five-note')).toContainText('The milestone checklists end at age 5');
});

test('guide with corrected age: before the due date and after it', async ({ page }) => {
  await start(page, { dob: '2026-10-29', ga: 30, useCorrected: true });
  await page.goto('./#/growth/expect');
  await expect(page.getByTestId('milestone-age-line')).toContainText('Age used for milestones: Before due date');
  await expect(page.getByTestId('pre-due-note')).toHaveText(/due date hasn’t arrived yet\. No milestones are counted as applicable using corrected age at this time\. You can still explore the developmental guide\./);
  await expect(page.getByLabel('Age range')).toHaveValue('0');
  await expect(page.getByTestId('guide-milestone')).toHaveCount(11); // the guide is still readable
  await page.goto('./#/growth/library');
  await expect(page.getByTestId('library-empty')).toContainText('due date hasn’t arrived');
});

test('guide with corrected age after the due date labels the basis and shows chronological age', async ({ page }) => {
  await start(page, { dob: '2026-05-20', ga: 32, useCorrected: true }); // 6m chronological, 4m corrected
  await page.goto('./#/growth/expect');
  await expect(page.getByTestId('milestone-age-line')).toContainText('4 months (corrected)');
  await expect(page.getByTestId('corrected-note')).toContainText('Chronological age: 6 months, 6 days');
  await expect(page.getByLabel('Age range')).toHaveValue('1');
});

test('the guide renders in all five themes', async ({ page }) => {
  await start(page, { dob: '2026-09-10' });
  for (const theme of ['earth', 'sky', 'blush', 'lavender', 'sage']) {
    await page.goto('./#/settings');
    await page.getByTestId(`theme-${theme}`).click();
    await page.goto('./#/growth/expect');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const [fg, bg] = await page.getByTestId('guide-overview').evaluate((el) => [getComputedStyle(el).color, getComputedStyle(document.body).backgroundColor]);
    expect(fg).not.toBe(bg);
  }
});

test('the guide works offline after the app is cached', async ({ page, context }) => {
  await start(page, { dob: '2025-07-10' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.goto('./#/growth/expect/9');
  await expect(page.getByTestId('guide-overview')).toContainText('By 30 months, milestones include things like');
  await page.goto('./#/growth/library/upcoming');
  await expect(page.getByTestId('result-count')).toHaveText('87 milestones');
  await page.goto('./#/growth/progress');
  await expect(overall(page)).toHaveText('0 of 72 achieved');
  await context.setOffline(false);
});
