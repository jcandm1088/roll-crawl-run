/**
 * Checkpoint 2a — verified milestone tracking. Fictional data only.
 * The clock is fixed (Nov 26, 2026, 10:00 local) so ages and dates are exact.
 */
import { expect, test, type Page } from '@playwright/test';
import { seedLegacyPersonalEntry } from './helpers';
import AxeBuilder from '@axe-core/playwright';

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

const overall = (page: Page) => page.getByTestId('progress-all').getByTestId('fraction');

// ---------------------------------------------------------------------------
// Navigation & layout
// ---------------------------------------------------------------------------

test('Growth landing shows the four sections in order; each opens its own screen with a way back', async ({ page }) => {
  await start(page, { name: 'Sample Child A', dob: '2025-07-10' });
  await page.getByRole('link', { name: 'Growth', exact: true }).click();
  await expect(page.getByTestId('page-title')).toHaveText('Growth');
  const titles = await page.locator('[data-testid="growth-sections"] .title-3').allTextContents();
  // Growth UX refinement (owner-approved requirements change, not a regression): Review → Record → Support → Learn.
  expect(titles).toEqual(['Progress', 'Milestone Library', 'Goals & Exercises', 'What to Expect at Every Age']);
  await expect(page.getByTestId('section-goals')).toContainText('Coming soon');
  await expect(page.getByTestId('section-goals').getByRole('link')).toHaveCount(0); // placeholder is not clickable
  for (const [id, title] of [['section-progress', 'Progress'], ['section-expect', 'What to Expect'], ['section-library', 'Milestone Library']] as const) {
    await page.getByTestId(id).click();
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Growth', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByTestId('page-title')).toHaveText('Growth');
  }
});

// ---------------------------------------------------------------------------
// What to Expect: current interval, preview, empty intervals, cumulative view
// ---------------------------------------------------------------------------

test('opens on the current interval; previewing never changes Home progress; Back to current age', async ({ page }) => {
  await start(page, { name: 'Sample Child A', dob: '2025-07-10' }); // 16 months
  await mark(page, 'cdc22-m02-se-01', 'Achieved', '2025-08-20');
  await page.goto('./#/home');
  const homeGross = await page.getByTestId('home-progress').getByTestId('progress-social-emotional').getByTestId('fraction').textContent();
  // Refinement: Home's "Record a milestone" opens the Library (tested in growth-refinement.spec.ts); the guide opens on the current range.
  await page.goto('./#/growth/expect');
  await expect(page.getByLabel('Age range')).toHaveValue('5'); // 15–18 months
  await expect(page.locator('#interval-select option:checked')).toHaveText('15–18 months (current)');
  await expect(page.getByTestId('preview-banner')).toHaveCount(0);
  await page.getByLabel('Age range').selectOption('12'); // 36–39 (future, empty)
  await expect(page.getByTestId('preview-banner')).toContainText('doesn’t change Sample Child A’s records');
  await page.goto('./#/home');
  await expect(page.getByTestId('home-progress').getByTestId('progress-social-emotional').getByTestId('fraction')).toHaveText(homeGross!);
  await page.goto('./#/growth/expect/12');
  await page.getByRole('button', { name: 'Back to current age' }).click();
  await expect(page.getByLabel('Age range')).toHaveValue('5');
});

test('exact boundary: at exactly 6 months the "By 6 months" milestones are in the current interval', async ({ page }) => {
  await start(page, { dob: '2026-05-26' }); // exactly 6 months on Nov 26
  await page.goto('./#/growth/expect');
  await expect(page.getByLabel('Age range')).toHaveValue('1'); // 3–6 months
  await expect(page.getByRole('heading', { name: 'By 6 months' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /By 6 months.*upcoming/ })).toHaveCount(0);
});

test('empty interval shows no invented milestones and links to the neighbouring milestone ages', async ({ page }) => {
  // Refinement: the guide is read-only — no progress summary, no "everything up to now" link (decision D-1).
  await start(page, { dob: '2025-07-10' });
  await page.goto('./#/growth/expect/6'); // 18–21
  // R-006 wording (was “CDC doesn’t publish a milestone checklist… Its checklists go from…”); the source is still named once.
  await expect(page.getByTestId('empty-interval')).toContainText('There’s no milestone checklist for this range');
  await expect(page.getByTestId('empty-interval')).toContainText('CDC’s checklists go from 18 months to 2 years');
  await expect(page.getByTestId('guide-milestone')).toHaveCount(0);
  await expect(page.getByTestId('progress-all')).toHaveCount(0);
  await expect(page.getByTestId('neighbour-previous')).toContainText('Most recent milestone age: by 18 months'); // R-006
  await expect(page.getByTestId('neighbour-previous')).toContainText('Shown in 15–18 months');
  await page.getByTestId('neighbour-previous').getByRole('button', { name: 'Open 15–18 months' }).click();
  await expect(page.getByLabel('Age range')).toHaveValue('5');
  await page.goto('./#/growth/expect/6');
  await page.getByTestId('neighbour-next').getByRole('button', { name: 'Open 21–24 months' }).click();
  await expect(page.getByLabel('Age range')).toHaveValue('7');
});

test('the superseded "everything up to now" address opens the Library’s Up to now view, with status and area filters', async ({ page }) => {
  // Refinement: the cumulative tracking view moved from What to Expect to the Library (decision D-1).
  await start(page, { dob: '2025-07-10' }); // 16 months → 72 applicable
  await mark(page, 'cdc22-m12-lc-01', 'Emerging', '2026-08-15');
  await page.goto('./#/growth/expect/all');
  await expect(page.getByRole('heading', { name: 'Milestone Library', level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/#\/growth\/library$/);
  await expect(page.getByTestId('view-now')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('result-count')).toHaveText('72 milestones');
  await page.getByLabel('Status').selectOption('emerging');
  await expect(page.getByTestId('milestone-row')).toHaveCount(1);
  await page.getByLabel('Status').selectOption('all');
  await page.getByRole('button', { name: 'Fine motor', exact: true }).click();
  await expect(page.getByTestId('result-count')).toHaveText('9 milestones');
});

// ---------------------------------------------------------------------------
// Milestone detail: status, history, corrections, observations, hide/restore
// ---------------------------------------------------------------------------

test('status changes, reversals and date corrections persist with full history', async ({ page }) => {
  await start(page, { name: 'Sample Child A', dob: '2025-07-10' });
  const id = 'cdc22-m15-mp-01';
  await mark(page, id, 'Emerging', '2026-09-20');
  await mark(page, id, 'Achieved', '2026-10-30');
  await page.getByText('Correct the achievement date').click();
  await page.getByLabel('Correct date').fill('2026-10-28');
  await page.getByRole('button', { name: 'Save corrected date' }).click();
  await mark(page, id, 'Emerging', '2026-11-02'); // reversal
  await page.reload();
  await expect(page.getByTestId('history-entry')).toHaveCount(4);
  const types = await page.getByTestId('history-entry').evaluateAll((els) => els.map((e) => e.getAttribute('data-type')));
  expect(types).toEqual(['status', 'achieved-date-corrected', 'status', 'status']); // newest first
  await expect(page.getByTestId('history')).toContainText('Achieved → Emerging');
  await expect(page.getByTestId('history')).toContainText('Achievement date corrected from October 30, 2026 to October 28, 2026');
  await expect(page.locator('.status-badge').first()).toHaveText('Emerging');
});

test('future and pre-birth dates are rejected', async ({ page }) => {
  await start(page, { dob: '2025-07-10' });
  await page.goto('./#/growth/milestone/cdc22-m02-se-01');
  await page.getByRole('radio', { name: 'Achieved' }).click();
  await page.getByLabel('Date achieved').fill('2026-12-01');
  await page.getByRole('button', { name: 'Save status' }).click();
  await expect(page.getByRole('alert')).toContainText('can’t be in the future');
  await page.getByLabel('Date achieved').fill('2025-07-01');
  await page.getByRole('button', { name: 'Save status' }).click();
  await expect(page.getByRole('alert')).toContainText('before your child was born');
});

// Updated for R-007: the separate Note box and Observations form became one Notes & Observations section.
test('Notes & Observations: add (no status change), edit, remove with marker, erase permanently in two steps', async ({ page }) => {
  await start(page, { dob: '2025-07-10' });
  await page.goto('./#/growth/milestone/cdc22-m15-lc-02');
  await expect(page.getByLabel('Date observed')).toHaveValue('2026-11-26'); // defaults to today
  await page.getByLabel('Note or observation').fill('Fictional: looked at the ball when named');
  await page.getByRole('button', { name: 'Add entry' }).click();
  await expect(page.getByTestId('entries')).toContainText('looked at the ball');
  await expect(page.getByTestId('entry-date')).toHaveText('November 26, 2026');
  await expect(page.getByLabel('Note or observation')).toHaveValue('');
  await expect(page.locator('.status-badge').first()).toHaveText('Not yet observed');
  await page.getByRole('button', { name: /^Edit entry/ }).click();
  await page.getByLabel('Date observed').nth(1).fill('2026-11-20');
  await page.getByLabel('Entry text').fill('Fictional: looked at the red ball when named');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByTestId('entry-date')).toHaveText('November 20, 2026 · edited');
  await expect(page.getByTestId('entry-text')).toHaveText('Fictional: looked at the red ball when named');
  await expect(page.getByTestId('history')).toContainText('date changed from November 26, 2026 to November 20, 2026');
  await page.getByRole('button', { name: /^Remove entry/ }).click();
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByTestId('entries')).toHaveCount(0);
  await expect(page.getByTestId('history')).toContainText('Removed from view. This text is still stored in this device’s history.');
  // Erasing one version erases the whole entry, including its earlier wording.
  await page.getByRole('button', { name: 'Erase permanently…' }).first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Yes, erase permanently' }).click();
  await expect(page.getByTestId('history').getByText('Text permanently erased.')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Erase permanently…' })).toHaveCount(0);
  const stored = await page.evaluate(() => new Promise<string>((resolve) => {
    const r = indexedDB.open('roll-crawl-run');
    r.onsuccess = () => { const q = r.result.transaction('milestoneEvents').objectStore('milestoneEvents').getAll(); q.onsuccess = () => { resolve(JSON.stringify(q.result)); r.result.close(); }; };
  }));
  expect(stored).not.toContain('looked at the');
});

test('hidden milestones are excluded from progress and keep their status when restored', async ({ page }) => {
  await start(page, { dob: '2026-09-10' }); // 2 months → 11 applicable
  await mark(page, 'cdc22-m02-se-01', 'Achieved', '2026-11-01');
  await page.goto('./#/growth/progress');
  await expect(overall(page)).toHaveText('1 of 11 achieved');
  await page.goto('./#/growth/milestone/cdc22-m02-se-01');
  await page.getByRole('button', { name: 'Hide this milestone' }).click();
  await page.goto('./#/growth/progress');
  await expect(overall(page)).toHaveText('0 of 10 achieved');
  await expect(page.getByTestId('progress-all').getByTestId('counts')).toContainText('1 hidden (not counted)');
  await page.goto('./#/growth/library');
  await page.getByTestId('toggle-hidden').click();
  await expect(page.getByTestId('milestone-row')).toHaveCount(1);
  await page.getByTestId('milestone-row').click();
  await page.getByTestId('hidden-banner').getByRole('button', { name: 'Restore' }).click();
  await expect(page.locator('.status-badge').first()).toHaveText('Achieved');
  await page.goto('./#/growth/progress');
  await expect(overall(page)).toHaveText('1 of 11 achieved');
});

test('when every applicable milestone in an area is hidden, progress is neutral (not 0% or 100%)', async ({ page }) => {
  await start(page, { dob: '2026-09-10' }); // 2 months: gross motor has 2 milestones
  for (const id of ['cdc22-m02-mp-01', 'cdc22-m02-mp-02']) {
    await page.goto(`./#/growth/milestone/${id}`);
    await page.getByRole('button', { name: 'Hide this milestone' }).click();
    await expect(page.getByTestId('hidden-banner')).toBeVisible();
  }
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('progress-gross-motor').getByTestId('neutral-state')).toHaveText('All hidden');
});

test('early recordings are saved but not counted until the reference age; nothing is inferred', async ({ page }) => {
  await start(page, { dob: '2026-09-10' }); // 2 months
  await page.goto('./#/growth/milestone/cdc22-m06-mp-01');
  await expect(page.getByTestId('applicability')).toContainText('Upcoming');
  await mark(page, 'cdc22-m06-mp-01', 'Achieved', '2026-11-20');
  await page.goto('./#/growth/progress');
  await expect(overall(page)).toHaveText('0 of 11 achieved'); // nothing inferred for earlier milestones either
});

// ---------------------------------------------------------------------------
// Personal entries (R-005: creation removed; existing ones preserved and reachable)
// ---------------------------------------------------------------------------

// Replaces “personal versions are separate, findable, editable, labelled, and not counted”: creating
// personal versions was removed (R-005), so that test's creation steps no longer apply. Existing
// (legacy) entries are seeded directly, then checked for the same properties.
test('personal entries: no way to create one; existing ones are kept, reachable, editable, labelled, and not counted', async ({ page }) => {
  await start(page, { dob: '2026-09-10' });
  await page.goto('./#/growth/milestone/cdc22-m02-se-04');
  await expect(page.getByTestId('milestone-detail')).toBeVisible();
  await expect(page.getByRole('button', { name: /personal version/i })).toHaveCount(0);
  await page.goto('./#/growth/library');
  await expect(page.getByRole('button', { name: 'Your versions' })).toHaveCount(0);
  await expect(page.getByTestId('personal-entries')).toHaveCount(0); // nothing to show, so no section at all
  // An entry created with an earlier version of the app
  await seedLegacyPersonalEntry(page, { title: 'Smiles at the cat (fictional)', derivedFromDefId: 'cdc22-m02-se-04', appCategory: 'social-emotional', referenceAgeMonths: 2 });
  await page.goto('./#/growth/library');
  await expect(page.getByTestId('milestone-row').filter({ hasText: 'Smiles at the cat' })).toHaveCount(0); // not mixed into the milestones
  await page.getByRole('button', { name: /Your personal entries \(1\)/ }).click();
  await page.getByTestId('personal-entry-row').click();
  await expect(page.getByTestId('milestone-title')).toHaveText('Smiles at the cat (fictional)');
  await expect(page.getByTestId('provenance')).toContainText('based on the milestone Smiles when you talk to or smile at them (by 2 months)');
  await expect(page.getByTestId('provenance')).toContainText('isn’t counted in Progress');
  await mark(page, page.url().split('/').pop()!, 'Achieved', '2026-11-20');
  await page.getByRole('button', { name: 'Edit this personal entry' }).click();
  await page.getByLabel('Title').fill('Smiles at the cat');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByTestId('milestone-title')).toHaveText('Smiles at the cat');
  // Original milestone unchanged
  await page.goto('./#/growth/milestone/cdc22-m02-se-04');
  await expect(page.locator('.status-badge').first()).toHaveText('Not yet observed');
  // Not counted
  await page.goto('./#/growth/progress');
  await expect(overall(page)).toHaveText('0 of 11 achieved');
  await expect(page.getByTestId('what-updates')).toContainText('neither are your personal entries');
});

// ---------------------------------------------------------------------------
// Library search and filters
// ---------------------------------------------------------------------------

test('library: 159 milestones, search, area, age and status filters', async ({ page }) => {
  await start(page, { dob: '2025-07-10' });
  await mark(page, 'cdc22-m12-mp-03', 'Achieved', '2026-07-01');
  await page.goto('./#/growth/library');
  // Refinement: the Library opens on "Up to now"; the full catalog is the "All (159)" view.
  await expect(page.getByTestId('result-count')).toHaveText('72 milestones');
  await page.getByTestId('view-all').click();
  await expect(page.getByTestId('result-count')).toHaveText('159 milestones');
  await page.getByLabel('Search milestones').fill('cup');
  await expect(page.getByTestId('result-count')).toHaveText('4 milestones');
  await page.getByLabel('Search milestones').fill('');
  await page.getByRole('button', { name: 'Gross motor' }).click();
  await expect(page.getByTestId('result-count')).toHaveText('20 milestones');
  await page.getByRole('button', { name: 'All areas' }).click();
  await page.getByLabel('Age', { exact: true }).selectOption('48'); // R-006: the filter was labelled “Reference age”
  await expect(page.getByTestId('result-count')).toHaveText('17 milestones');
  await page.getByLabel('Age', { exact: true }).selectOption('all');
  await page.getByLabel('Status').selectOption('achieved');
  await expect(page.getByTestId('result-count')).toHaveText('1 milestone');
});

// ---------------------------------------------------------------------------
// Ages: corrected, before due date, older than five
// ---------------------------------------------------------------------------

test('corrected age before the due date: nothing applies; Home and Progress are neutral; ages are labelled', async ({ page }) => {
  await start(page, { dob: '2026-10-29', ga: 30, useCorrected: true });
  await expect(page.getByTestId('home-progress-empty')).toContainText('start counting at the due date');
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('panel-milestone-age')).toContainText('Not yet (before due date)');
  await expect(page.getByTestId('age-panel')).toContainText('before due date');
  await expect(page.getByTestId('progress-all').getByTestId('neutral-state')).toHaveText('Nothing to track yet');
  await page.goto('./#/growth/expect');
  await expect(page.getByLabel('Age range')).toHaveValue('0');
});

test('corrected age after the due date drives applicability; chronological stays visible', async ({ page }) => {
  await start(page, { dob: '2026-05-20', ga: 32, useCorrected: true }); // 6m chronological, 4m corrected
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('panel-chronological')).toHaveText('6 months, 6 days');
  await expect(page.getByTestId('panel-milestone-age')).toContainText('4 months');
  await expect(page.getByTestId('panel-milestone-age')).toContainText('corrected age');
  await expect(overall(page)).toHaveText('0 of 24 achieved'); // 2- and 4-month milestones only
  await expect(page.getByTestId('chronological-age')).toHaveCount(0);
});

test('children older than five keep tracking, with an explanation and no invented milestones', async ({ page }) => {
  await start(page, { dob: '2020-09-01' });
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('over-five-note')).toContainText('go up to age 5');
  await expect(overall(page)).toHaveText('0 of 159 achieved');
  await page.goto('./#/growth/expect');
  await expect(page.getByLabel('Age range')).toHaveValue('19');
});

// ---------------------------------------------------------------------------
// Isolation, deletion, settings
// ---------------------------------------------------------------------------

test('milestone records are isolated per child and removed when a profile is deleted', async ({ page }) => {
  await start(page, { name: 'Sample Child A', dob: '2026-09-10' });
  await mark(page, 'cdc22-m02-se-01', 'Achieved', '2026-11-01');
  await page.goto('./#/profiles/new');
  await page.getByLabel('Name or nickname (optional)').fill('Sample Child B');
  await page.getByLabel('Date of birth').fill('2026-09-10');
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByRole('heading', { name: 'Sample Child B' })).toBeVisible();
  await page.goto('./#/growth/progress');
  await expect(overall(page)).toHaveText('0 of 11 achieved');
  // Delete child A → its records and history are gone from storage
  await page.goto('./#/profiles');
  await page.getByRole('link', { name: 'Edit Sample Child A' }).click();
  await page.getByRole('button', { name: 'Advanced profile management' }).click();
  await page.getByRole('button', { name: 'Delete this profile…' }).click();
  await page.getByLabel('Type DELETE PROFILE to continue').fill('DELETE PROFILE');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /^Yes, delete/ }).click();
  await expect(page.getByRole('heading', { name: 'Child profiles' })).toBeVisible();
  const counts = await page.evaluate(() => new Promise<number[]>((resolve) => {
    const r = indexedDB.open('roll-crawl-run');
    r.onsuccess = () => {
      const tx = r.result.transaction(['milestoneRecords', 'milestoneEvents']);
      const a = tx.objectStore('milestoneRecords').count();
      const b = tx.objectStore('milestoneEvents').count();
      tx.oncomplete = () => { resolve([a.result, b.result]); r.result.close(); };
    };
  }));
  expect(counts).toEqual([0, 0]);
});

test('Settings → Milestone Viewing Preferences reflects and links to the single corrected-age setting', async ({ page }) => {
  await start(page, { name: 'Sample Child A', dob: '2026-05-20', ga: 32, useCorrected: true });
  await page.goto('./#/settings');
  const trigger = page.getByRole('button', { name: /^Milestone Viewing Preferences/ });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await expect(page.getByTestId('prefs-basis')).toHaveText('corrected age');
  await page.getByRole('link', { name: 'Change in Sample Child A’s profile' }).click();
  await page.getByRole('radio', { name: /Chronological age \(from date of birth\)/ }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'Child profiles' })).toBeVisible();
  await page.goto('./#/settings');
  await page.getByRole('button', { name: /^Milestone Viewing Preferences/ }).click();
  await expect(page.getByTestId('prefs-basis')).toHaveText('chronological age');
});

// ---------------------------------------------------------------------------
// Attribution, safeguards, links
// ---------------------------------------------------------------------------

test('CDC attribution, free-availability and non-endorsement statements, and safeguards are present', async ({ page }) => {
  await start(page, { dob: '2025-07-10' });
  // Refinement (decision Q-5): the unsourced "Children develop at different rates" was replaced by the approved 75%-basis wording.
  await expect(page.getByTestId('home-progress').getByTestId('milestone-safeguard')).toContainText('isn’t a screening or an assessment of your child’s development');
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('milestone-safeguard')).toContainText('not an assessment of your child’s development');
  await expect(page.getByTestId('milestone-safeguard')).toContainText('an age isn’t a deadline');
  await expect(page.getByTestId('milestone-safeguard')).toContainText('talk with your child’s healthcare provider');
  // R-006: screens carry one concise source note; the full attribution card is on About these milestones.
  await expect(page.getByTestId('source-note')).toContainText('Not endorsed by CDC, HHS, or the U.S. Government');
  await page.goto('./#/growth/library');
  await expect(page.getByTestId('source-note')).toContainText('based on CDC’s “Learn the Signs. Act Early.” checklists');
  await expect(page.getByTestId('source-note')).toContainText('Not endorsed by CDC, HHS, or the U.S. Government');
  await page.getByTestId('about-link').click();
  const attr = page.getByTestId('cdc-attribution');
  await expect(attr).toContainText('Source: CDC');
  await expect(attr).toContainText('available free from CDC');
  await expect(attr).toContainText('not endorsed by CDC, the U.S. Department of Health and Human Services (HHS), or the U.S. Government');
  await expect(attr).toContainText('each milestone’s page shows CDC’s original wording');
  const about = page.getByTestId('about-milestones');
  await expect(about).toContainText('Gross motor and fine motor are this app’s own grouping');
  await expect(about).toContainText('not a clinical classification');
  await expect(about).toContainText('aren’t developmental guidelines or standards');
  await expect(about).toContainText('February 2022');
  await expect(page.getByTestId('about-sources').getByRole('link')).toHaveCount(14);
  for (const link of await page.locator('a[href^="https://www.cdc.gov"]').all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  }
  await expect(page.locator('img')).toHaveCount(0); // no CDC logos, photos or videos
});

// ---------------------------------------------------------------------------
// Offline, accessibility, narrow screens, themes
// ---------------------------------------------------------------------------

test('milestone tracking works offline after the app is cached', async ({ page, context }) => {
  await start(page, { dob: '2026-09-10' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await mark(page, 'cdc22-m02-lc-01', 'Achieved', '2026-11-25');
  await page.goto('./#/growth/library'); // Refinement: opens on Up to now (11 apply at 2 months)
  await expect(page.getByTestId('result-count')).toHaveText('11 milestones');
  await page.getByTestId('view-all').click();
  await expect(page.getByTestId('result-count')).toHaveText('159 milestones');
  await page.goto('./#/growth/expect/1');
  await expect(page.getByTestId('guide-milestone')).toHaveCount(25);
  await page.goto('./#/growth/about');
  await expect(page.getByTestId('about-milestones')).toContainText('What these milestones are');
  await page.goto('./#/growth/progress');
  await expect(overall(page)).toHaveText('1 of 11 achieved');
  await context.setOffline(false);
});

for (const [name, path] of [
  ['growth landing', './#/growth'], ['progress', './#/growth/progress'], ['what to expect', './#/growth/expect'], ['guide 3–6 months', './#/growth/expect/1'], ['library upcoming', './#/growth/library/upcoming'], ['library all', './#/growth/library/all'],
  ['empty interval', './#/growth/expect/6'], ['library', './#/growth/library'], ['about', './#/growth/about'], ['milestone detail', './#/growth/milestone/cdc22-m15-mp-01'],
] as const) {
  test(`accessibility scan: ${name}`, async ({ page }) => {
    await start(page, { name: 'Sample Child A', dob: '2025-07-10' });
    await page.goto(path);
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} — ${v.help}`)).toEqual([]);
  });
}

test('narrow phone (320px): Growth screens fit without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await start(page, { name: 'Sample Child With A Long Name', dob: '2025-07-10' });
  for (const p of ['./#/growth', './#/growth/progress', './#/growth/expect', './#/growth/expect/1', './#/growth/library/all', './#/growth/expect/6', './#/growth/library', './#/growth/about', './#/growth/milestone/cdc22-m15-lc-04']) {
    await page.goto(p);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), p).toBeLessThanOrEqual(0);
  }
});

test('progress renders in all five themes and switches with the child’s theme', async ({ page }) => {
  await start(page, { dob: '2026-09-10' });
  await mark(page, 'cdc22-m02-se-01', 'Achieved', '2026-11-01');
  for (const theme of ['earth', 'sky', 'blush', 'lavender', 'sage']) {
    await page.goto('./#/settings');
    await page.getByTestId(`theme-${theme}`).click();
    await page.goto('./#/growth/progress');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const fill = await page.getByTestId('progress-all').locator('.meter-fill').evaluate((el) => getComputedStyle(el).backgroundColor);
    const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim());
    expect(fill).not.toBe('rgba(0, 0, 0, 0)');
    expect(primary).toMatch(/^#/);
  }
});
