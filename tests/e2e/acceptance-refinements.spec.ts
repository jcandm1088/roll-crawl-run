/**
 * Checkpoint 2a — human acceptance refinements R-004 to R-008 (owner-discovered usability findings).
 * R-004 gender-neutral wording · R-005 no personal-milestone creation · R-006 less CDC terminology ·
 * R-007 one Notes & Observations section · R-008 age settings explanation on Progress.
 * Fictional data only. Clock fixed at Nov 26, 2026, 10:00 local.
 */
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedLegacyNote, seedLegacyPersonalEntry } from './helpers';

const NOW = new Date('2026-11-26T10:00:00');
/** Gendered words, ignoring a pronoun quoted on its own (“he”) in an explanation of the wording. */
const GENDERED = /(?<![\w’'“])(he|she|his|her|hers|him|himself|herself)(?![\w’'”])/i;

async function start(page: Page, opts: { name?: string; dob: string; ga?: number; useCorrected?: boolean; theme?: string }) {
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
  if (opts.theme) await page.getByTestId(`theme-${opts.theme}`).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByTestId('chronological-age')).toBeVisible();
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

async function addEntry(page: Page, text: string, date?: string) {
  if (date) await page.getByLabel('Date observed').first().fill(date);
  await page.getByLabel('Note or observation').fill(text);
  await page.getByRole('button', { name: 'Add entry' }).click();
  await expect(page.getByTestId('saved')).toBeVisible();
}

const bodyText = (page: Page) => page.locator('#app, body').first().innerText();

// ---------------------------------------------------------------------------
// R-004 — gender-neutral wording
// ---------------------------------------------------------------------------

test('R-004: every milestone the parent sees is gender-neutral — guide (all 20 ranges), Library, Home, Progress and About', async ({ page }) => {
  test.setTimeout(90_000);
  await start(page, { dob: '2025-07-10' });
  for (let i = 0; i < 20; i++) {
    await page.goto(`./#/growth/expect/${i}`);
    await expect(page.getByLabel('Age range')).toHaveValue(String(i));
    expect(await bodyText(page), `guide range ${i}`).not.toMatch(GENDERED);
  }
  await page.goto('./#/growth/library/all');
  await expect(page.getByTestId('result-count')).toHaveText('159 milestones');
  const rows = await page.getByTestId('milestone-row').allInnerTexts();
  expect(rows).toHaveLength(159);
  for (const r of rows) expect(r).not.toMatch(GENDERED);
  for (const s of ['./#/home', './#/growth', './#/growth/progress', './#/growth/about', './#/settings/about']) {
    await page.goto(s);
    await page.waitForTimeout(150);
    expect(await bodyText(page), s).not.toMatch(GENDERED);
  }
});

test('R-004: a milestone page shows the gender-neutral wording, says it was adapted, and offers CDC’s original wording', async ({ page }) => {
  await start(page, { dob: '2025-07-10' });
  await page.goto('./#/growth/milestone/cdc22-m15-lc-03');
  await expect(page.getByTestId('milestone-title')).toHaveText('Follows directions given with both a gesture and words. For example, they give you a toy when you hold out your hand and say, “Give me the toy.”');
  const orig = page.getByTestId('original-wording');
  await expect(orig.locator('summary')).toHaveText('Wording adapted to be gender-neutral');
  await expect(orig.getByText(/CDC’s original wording/)).toBeHidden(); // collapsed by default
  await orig.locator('summary').click();
  await expect(orig).toContainText('CDC’s original wording: “Follows directions given with both a gesture and words. For example, he gives you a toy when you hold out your hand and say, “Give me the toy.””');
  await expect(page.getByTestId('milestone-meta')).toHaveText('By 15 months · Language & communication'); // reference age and area unchanged
  // A milestone CDC already words neutrally: no adaptation notice.
  await page.goto('./#/growth/milestone/cdc22-m02-se-01');
  await expect(page.getByTestId('milestone-title')).toHaveText('Calms down when spoken to or picked up');
  await expect(page.getByTestId('original-wording')).toHaveCount(0);
  // The same wording on Home's recent milestones
  await page.goto('./#/growth/milestone/cdc22-m15-mp-01');
  await page.getByRole('radio', { name: 'Achieved' }).click();
  await page.getByLabel('Date achieved').fill('2026-11-01');
  await page.getByRole('button', { name: 'Save status' }).click();
  await page.goto('./#/home');
  await expect(page.getByTestId('home-recent')).toContainText('Takes a few steps on their own');
});

test('R-004: Library search matches the wording shown, not the replaced pronouns', async ({ page }) => {
  await start(page, { dob: '2025-07-10' });
  await page.goto('./#/growth/library/all');
  await page.getByLabel('Search milestones').fill('on their own');
  await expect(page.getByTestId('result-count')).toHaveText('2 milestones');
  await page.getByLabel('Search milestones').fill('on his own');
  await expect(page.getByTestId('result-count')).toHaveText('0 milestones');
});

// ---------------------------------------------------------------------------
// R-005 — personal milestone creation removed; legacy entries preserved
// ---------------------------------------------------------------------------

test('R-005: no milestone page offers a personal version; hidden legacy entries stay reachable and labelled', async ({ page }) => {
  await start(page, { dob: '2026-09-10' });
  for (const id of ['cdc22-m02-se-01', 'cdc22-m04-mp-02', 'cdc22-m60-cg-05']) {
    await page.goto(`./#/growth/milestone/${id}`);
    await expect(page.getByTestId('milestone-detail')).toBeVisible();
    expect(await bodyText(page)).not.toMatch(/personal version|your version|make a personal/i);
  }
  const pid = await seedLegacyPersonalEntry(page, { title: 'Fictional personal entry', derivedFromDefId: 'cdc22-m02-se-01', appCategory: 'social-emotional', referenceAgeMonths: 2 });
  await page.goto(`./#/growth/milestone/p-${pid}`);
  await expect(page.getByText('Personal entry', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Hide this milestone' }).click();
  await expect(page.getByTestId('saved-text')).toHaveText('Hidden. Its status and history are kept.');
  await page.goto('./#/growth/library');
  await page.getByRole('button', { name: /Your personal entries \(1\)/ }).click();
  await expect(page.getByTestId('acc-personal-entries')).toContainText('aren’t counted in Progress');
  await expect(page.getByTestId('personal-entry-row')).toContainText('Personal entry · by 2 months · hidden');
  await page.getByTestId('personal-entry-row').click();
  await page.getByTestId('hidden-banner').getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByTestId('hidden-banner')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// R-006 — concise terminology, disclosures kept
// ---------------------------------------------------------------------------

test('R-006: parent-facing screens use plain terms; required source, non-endorsement and safeguard disclosures remain', async ({ page }) => {
  test.setTimeout(60_000);
  await start(page, { name: 'Sample Child A', dob: '2025-07-10' });
  const superseded = /CDC milestones?|CDC age|CDC area|CDC progress|CDC reference age|reference age|By CDC age|word for word|word-for-word|without changes|Your versions?/i;
  const screens: Array<[string, number]> = [['./#/home', 0], ['./#/growth', 0], ['./#/growth/progress', 1], ['./#/growth/library', 1], ['./#/growth/library/all', 1],
    ['./#/growth/milestone/cdc22-m15-mp-01', 2], ['./#/growth/expect/5', 6]];
  for (const [s, maxCdc] of screens) {
    await page.goto(s);
    await page.waitForTimeout(150);
    const text = await bodyText(page);
    expect(text, s).not.toMatch(superseded);
    // Mentions of CDC are limited to the concise source disclosure, plus, in the guide, the movement
    // note (1), the sources card (3) and the safeguard (2). (Was 13 on the guide before R-006.)
    expect((text.match(/\bCDC\b/g) ?? []).length, s).toBeLessThanOrEqual(maxCdc + (s.includes('expect') ? 0 : 1));
  }
  // Disclosures still present
  await page.goto('./#/growth/progress');
  await expect(page.getByRole('button', { name: 'By age' })).toBeVisible();
  await expect(page.getByTestId('source-note')).toContainText('Not endorsed by CDC, HHS, or the U.S. Government');
  await expect(page.getByTestId('milestone-safeguard')).toContainText('talk with your child’s healthcare provider');
  await page.goto('./#/growth/library');
  await expect(page.getByTestId('source-note').getByRole('link', { name: 'Sources' })).toHaveAttribute('href', '#/growth/about');
  await page.goto('./#/growth/milestone/cdc22-m15-mp-01');
  await expect(page.getByTestId('detail-source')).toContainText('Not endorsed by CDC, HHS, or the U.S. Government');
  await expect(page.getByTestId('detail-source').getByRole('link')).toHaveAttribute('href', 'https://www.cdc.gov/act-early/milestones/15-months.html');
  await expect(page.getByTestId('motor-grouping-note')).toContainText('not a clinical classification');
  await page.goto('./#/growth/expect/5');
  await expect(page.getByTestId('guide-sources')).toContainText('This app is not endorsed by CDC, HHS, or the U.S. Government.');
  await expect(page.getByTestId('guide-sources')).toContainText('with gender-neutral wording in place of “he” and “she.”');
  await expect(page.getByTestId('guide-safeguard')).toContainText('aren’t screening or diagnostic tools');
  await page.goto('./#/growth/about');
  await expect(page.getByTestId('cdc-attribution')).toContainText('It is not endorsed by CDC, the U.S. Department of Health and Human Services (HHS), or the U.S. Government.');
  await expect(page.getByTestId('about-wording')).toContainText('each milestone’s page shows CDC’s original wording');
  await expect(page.getByTestId('about-sources').getByRole('link')).toHaveCount(14);
  await page.goto('./#/settings/about');
  await expect(page.locator('body')).toContainText('not endorsed by CDC, HHS, or the U.S. Government');
});

// ---------------------------------------------------------------------------
// R-007 — Notes & Observations
// ---------------------------------------------------------------------------

test('R-007: one Notes & Observations section, separate from status and achievement date; entries newest first', async ({ page }) => {
  await start(page, { dob: '2025-07-10' });
  await page.goto('./#/growth/milestone/cdc22-m12-lc-01');
  await expect(page.getByRole('heading', { name: 'Notes & Observations' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Note', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Observations', exact: true })).toHaveCount(0);
  await expect(page.locator('textarea:visible')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Add entry' })).toBeDisabled();
  await addEntry(page, 'Fictional: waved at the window', '2026-11-10');
  await expect(page.getByLabel('Date observed')).toHaveValue('2026-11-26'); // back to today after each entry
  await addEntry(page, 'Fictional: waved bye-bye to a neighbour'); // today by default
  await addEntry(page, 'Fictional: older entry', '2026-09-01');
  await expect(page.getByTestId('entry-date')).toHaveText(['November 26, 2026', 'November 10, 2026', 'September 1, 2026']);
  // Status is untouched, and the status/date controls are a separate section.
  await expect(page.locator('.status-badge').first()).toHaveText('Not yet observed');
  await expect(page.getByRole('heading', { name: 'Update status' })).toBeVisible();
  await expect(page.getByTestId('notes-observations').getByRole('radio')).toHaveCount(0);
  // A rejected date keeps what was typed.
  await page.getByLabel('Date observed').first().fill('2026-12-01');
  await page.getByLabel('Note or observation').fill('Fictional: kept after an error');
  await page.getByRole('button', { name: 'Add entry' }).click();
  await expect(page.getByRole('alert')).toContainText('can’t be in the future');
  await expect(page.getByLabel('Note or observation')).toHaveValue('Fictional: kept after an error');
  await expect(page.getByTestId('entry')).toHaveCount(3);
});

test('R-007: an undated note from an earlier version is shown honestly and can be edited, removed and erased', async ({ page }) => {
  await start(page, { dob: '2025-07-10' });
  await page.goto('./#/growth');
  await seedLegacyNote(page, 'cdc22-m12-lc-02', 'Fictional undated note');
  await page.goto('./#/growth/milestone/cdc22-m12-lc-02');
  const note = page.getByTestId('entry').first();
  await expect(note).toHaveAttribute('data-kind', 'undated-note');
  await expect(note.getByTestId('entry-date')).toHaveText('No observation date · saved November 26, 2026');
  await addEntry(page, 'Fictional dated entry', '2026-11-01');
  await expect(page.getByTestId('entry').first()).toHaveAttribute('data-kind', 'undated-note');
  // Edit: no date is invented
  await page.getByRole('button', { name: 'Edit entry: No observation date' }).click();
  await expect(page.getByTestId('entry').first()).toContainText('This note was saved without an observation date.');
  await page.getByLabel('Entry text').fill('Fictional undated note, edited');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByTestId('saved-text')).toHaveText('Note saved.');
  await expect(page.getByTestId('entry').first().getByTestId('entry-date')).toHaveText('No observation date · saved November 26, 2026');
  // Remove: gone from the list, kept in history
  await page.getByRole('button', { name: 'Remove entry: No observation date' }).click();
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByTestId('saved-text')).toContainText('Note removed from view');
  await expect(page.getByTestId('entry')).toHaveCount(1);
  await expect(page.getByTestId('history')).toContainText('Fictional undated note, edited');
  await expect(page.getByTestId('history')).toContainText('Note removed from view');
  // Erase both earlier versions permanently: nothing recoverable in storage
  for (const t of ['Fictional undated note, edited', 'Fictional undated note']) {
    await page.getByTestId('history-entry').filter({ has: page.getByText(t, { exact: true }) }).getByRole('button', { name: 'Erase permanently…' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Yes, erase permanently' }).click();
    await expect(page.getByTestId('saved-text')).toHaveText('Text permanently erased.');
  }
  const stored = await page.evaluate(() => new Promise<string>((resolve) => {
    const r = indexedDB.open('roll-crawl-run');
    r.onsuccess = () => { const tx = r.result.transaction(['milestoneEvents', 'milestoneRecords']); const out: unknown[] = []; for (const n of ['milestoneEvents', 'milestoneRecords']) { const q = tx.objectStore(n).getAll(); q.onsuccess = () => out.push(q.result); } tx.oncomplete = () => { r.result.close(); resolve(JSON.stringify(out)); }; };
  }));
  expect(stored).not.toContain('Fictional undated note');
  expect(stored).toContain('Fictional dated entry');
});

test('R-007: entries are isolated per child', async ({ page }) => {
  await start(page, { name: 'Sample Child A', dob: '2025-07-10' });
  await page.goto('./#/growth/milestone/cdc22-m12-lc-01');
  await addEntry(page, 'Fictional entry for A');
  await addChild(page, 'Sample Child B', '2025-01-10');
  await page.goto('./#/growth/milestone/cdc22-m12-lc-01');
  await expect(page.getByTestId('notes-observations')).toBeVisible();
  await expect(page.getByTestId('entries')).toHaveCount(0);
  await addEntry(page, 'Fictional entry for B');
  await switchTo(page, 'Sample Child A');
  await page.goto('./#/growth/milestone/cdc22-m12-lc-01');
  await expect(page.getByTestId('entry-text')).toHaveText(['Fictional entry for A']);
});

test('R-007: Notes & Observations work offline after the app is cached', async ({ page, context }) => {
  await start(page, { dob: '2025-07-10' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.goto('./#/growth/milestone/cdc22-m12-lc-01');
  await addEntry(page, 'Fictional offline entry', '2026-11-20');
  await page.getByRole('button', { name: /^Edit entry/ }).click();
  await page.getByLabel('Entry text').fill('Fictional offline entry, edited');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByTestId('saved-text')).toContainText('Entry updated');
  await page.reload();
  await expect(page.getByTestId('entry-text')).toHaveText('Fictional offline entry, edited');
  await context.setOffline(false);
});

// ---------------------------------------------------------------------------
// R-008 — age settings explanation on Progress
// ---------------------------------------------------------------------------

test('R-008: Progress explains how to change the age basis and opens the selected child’s age settings', async ({ page }) => {
  test.setTimeout(60_000);
  await start(page, { name: 'Sample Child A', dob: '2025-07-10' }); // corrected age not set up
  await page.goto('./#/growth/progress');
  const note = page.getByTestId('age-settings-note');
  await expect(note).toContainText('Milestones are based on chronological age. If Sample Child A was born early, you can turn on corrected age in Sample Child A’s profile settings.');
  const before = await page.getByTestId('progress-all').getByTestId('fraction').textContent();
  await page.getByRole('link', { name: 'Manage age settings' }).click();
  const childA = decodeURIComponent(page.url().match(/#\/profiles\/([^/]+)\/age$/)![1]!);
  await expect(page.getByRole('heading', { name: 'Edit profile', level: 1 })).toBeVisible();
  await expect(page.getByLabel('Name or nickname (optional)')).toHaveValue('Sample Child A');
  await expect(page.locator('#age-settings-heading')).toBeFocused();
  await expect(page.locator('#age-settings-heading')).toBeInViewport();
  await page.getByRole('link', { name: 'Cancel' }).click();
  await expect(page).toHaveURL(/#\/growth\/progress$/);
  await expect(page.getByTestId('progress-all').getByTestId('fraction')).toHaveText(before!);
  await page.getByRole('link', { name: 'Manage age settings' }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveURL(/#\/growth\/progress$/);

  // A second child born early, using corrected age: different wording, and the link opens THAT child.
  await addChild(page, 'Sample Child B', '2026-05-20');
  await page.goto('./#/profiles');
  await page.getByRole('link', { name: 'Edit Sample Child B' }).click();
  await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
  await page.getByRole('button', { name: 'Weeks at birth' }).click();
  await page.getByLabel('Weeks', { exact: true }).selectOption('32');
  await page.getByRole('radio', { name: /Corrected age \(from due date\)/ }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'Child profiles', level: 1 })).toBeVisible();
  await switchTo(page, 'Sample Child B');
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('age-settings-note')).toContainText('You can change whether milestones are based on chronological or corrected age in Sample Child B’s profile settings.');
  await expect(page.getByTestId('panel-milestone-age')).toContainText('4 months');
  await page.getByRole('link', { name: 'Manage age settings' }).click();
  expect(decodeURIComponent(page.url().match(/#\/profiles\/([^/]+)\/age$/)![1]!)).not.toBe(childA);
  await expect(page.getByLabel('Name or nickname (optional)')).toHaveValue('Sample Child B');
  // Choosing chronological there and saving returns to Progress, which then uses it (existing engine).
  await page.getByRole('radio', { name: /Chronological age \(from date of birth\)/ }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page).toHaveURL(/#\/growth\/progress$/);
  await expect(page.getByTestId('panel-milestone-age')).toContainText('6 months');
  await expect(page.getByTestId('panel-milestone-age')).toContainText('chronological age');
});

test('R-008: before a corrected due date the explanation and link are still offered', async ({ page }) => {
  await start(page, { name: 'Sample Child A', dob: '2026-10-29', ga: 30, useCorrected: true });
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('panel-milestone-age')).toContainText('Not yet (before due date)');
  await expect(page.getByTestId('age-settings-note')).toContainText('chronological or corrected age');
  await expect(page.getByRole('link', { name: 'Manage age settings' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Accessibility, narrow screens, themes
// ---------------------------------------------------------------------------

async function seedDetail(page: Page) {
  await page.goto('./#/growth/milestone/cdc22-m12-lc-01');
  await seedLegacyNote(page, 'cdc22-m12-lc-01', 'Fictional undated note from an earlier version');
  await addEntry(page, 'Fictional: said “dada” while looking at a photo', '2026-11-20');
}

for (const [name, setup] of [
  ['milestone detail with Notes & Observations', async (page: Page) => { await seedDetail(page); }],
  ['entry being edited', async (page: Page) => { await seedDetail(page); await page.getByRole('button', { name: /^Edit entry: November/ }).click(); }],
  ['adapted wording disclosure open', async (page: Page) => { await page.goto('./#/growth/milestone/cdc22-m15-lc-03'); await page.getByTestId('original-wording').locator('summary').click(); }],
  ['progress with age settings', async (page: Page) => { await page.goto('./#/growth/progress'); }],
  ['library with personal entries', async (page: Page) => {
    await page.goto('./#/growth');
    await seedLegacyPersonalEntry(page, { title: 'Fictional personal entry', derivedFromDefId: 'cdc22-m12-se-01', appCategory: 'social-emotional', referenceAgeMonths: 12 });
    await page.goto('./#/growth/library');
    await page.getByRole('button', { name: /Your personal entries/ }).click();
  }],
  ['profile age settings', async (page: Page) => { await page.goto('./#/growth/progress'); await page.getByRole('link', { name: 'Manage age settings' }).click(); }],
] as const) {
  test(`accessibility scan: ${name}`, async ({ page }) => {
    await start(page, { name: 'Sample Child A', dob: '2025-07-10' });
    await setup(page);
    await page.waitForTimeout(300);
    const results = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} — ${v.help}`)).toEqual([]);
  });
}

test('narrow phone (320px): refined screens fit without horizontal scrolling or overflowing controls', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await start(page, { name: 'Sample Child With A Long Name', dob: '2025-07-10' });
  await seedDetail(page);
  await seedLegacyPersonalEntry(page, { title: 'Fictional personal entry with a fairly long title to wrap', derivedFromDefId: 'cdc22-m12-se-01', appCategory: 'social-emotional', referenceAgeMonths: 12 });
  const fits = async (label: string) => {
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), label).toBeLessThanOrEqual(0);
    const over = await page.evaluate(() => [...document.querySelectorAll('input, textarea, select, button, a.btn')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.right > window.innerWidth + 0.5 || r.left < -0.5);
    }).map((el) => el.outerHTML.slice(0, 80)));
    expect(over, label).toEqual([]);
  };
  await page.goto('./#/growth/milestone/cdc22-m12-lc-01');
  await fits('detail');
  await page.getByRole('button', { name: /^Edit entry: November/ }).click();
  await fits('detail editing');
  await page.goto('./#/growth/milestone/cdc22-m15-lc-03');
  await page.getByTestId('original-wording').locator('summary').click();
  await fits('adapted wording');
  await page.goto('./#/growth/progress');
  await fits('progress');
  await page.goto('./#/growth/library');
  await page.getByRole('button', { name: /Your personal entries/ }).click();
  await fits('library personal entries');
  await page.goto('./#/growth/progress');
  await page.getByRole('link', { name: 'Manage age settings' }).click();
  await fits('profile age settings');
});

test('the refined screens render in all five themes', async ({ page }) => {
  await start(page, { dob: '2025-07-10' });
  await seedDetail(page);
  for (const theme of ['earth', 'sky', 'blush', 'lavender', 'sage']) {
    await page.goto('./#/settings');
    await page.getByTestId(`theme-${theme}`).click();
    await page.goto('./#/growth/milestone/cdc22-m12-lc-01');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.getByTestId('entry')).toHaveCount(2);
    const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim());
    const link = await page.getByTestId('detail-source').getByRole('link').evaluate((el) => getComputedStyle(el).color);
    expect(primary).toMatch(/^#/);
    expect(link).not.toBe('rgba(0, 0, 0, 0)');
    await page.goto('./#/growth/progress');
    await expect(page.getByTestId('manage-age-settings')).toBeVisible();
  }
});
