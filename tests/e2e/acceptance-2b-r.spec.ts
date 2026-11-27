/**
 * Checkpoint 2b-R — Human Acceptance Refinements R-010 to R-017. FICTIONAL data only.
 * R-010 age-responsive goal ideas · R-011 less repetitive CDC attribution · R-012 exercise form headings ·
 * R-013/R-014 duration fields · R-015 deleting a session · R-016 stopwatch recovery notice ·
 * R-017 full 6- and 12-month reporting periods.
 * Automated in headless Chromium only; this is not Safari or iPhone testing.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const NOW = new Date('2026-11-26T10:00:00');
const FOUR_MONTHS = '2026-07-20'; // the owner's test case: a 4-month-old on Nov 26, 2026

async function start(page: Page, opts: { dob: string; name?: string; ga?: number; useCorrected?: boolean; fixed?: boolean } ) {
  if (opts.fixed !== false) await page.clock.setFixedTime(NOW);
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
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
}

async function newExercise(page: Page, title: string, opts: { method?: string; rule?: string; perDay?: string } = {}) {
  await page.goto('./#/growth/exercises/new');
  await page.getByLabel('Exercise name').fill(title);
  await page.getByTestId(`method-${opts.method ?? 'simple'}`).click();
  await page.getByTestId(`rule-${opts.rule ?? 'daily'}`).click();
  if (opts.perDay) await page.getByTestId('per-day').fill(opts.perDay);
  await page.getByTestId('save-exercise').click();
  await expect(page.getByTestId('exercise-title')).toHaveText(title);
}

/**
 * Waits until no finite CSS animation is still running anywhere in the document. Sheets slide in over
 * 240 ms (`sheet-in`, 24 px) and screens over the same time (`screen-in`, 6 px); a rectangle read while
 * one is running is a moving target. This waits on the animations themselves (no fixed delay).
 */
const settle = (page: Page) => page.evaluate(async () => {
  const running = document.getAnimations().filter((a) => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming().endTime as number));
  await Promise.all(running.map((a) => a.finished.catch(() => undefined)));
});
/** Bounding box after entrance animations have finished. */
const box = async (l: Locator) => {
  await settle(l.page());
  return (await l.boundingBox())!;
};
const noOverflow = async (page: Page, label: string) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), label).toBeLessThanOrEqual(0);
  const over = await page.evaluate(() => [...document.querySelectorAll('input, select, button, a.btn, svg')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && (r.right > window.innerWidth + 0.5 || r.left < -0.5);
  }).length);
  expect(over, label).toBe(0);
};
/** Duration inputs: same height, same top, equal widths, inside the viewport, touch-sized. */
async function expectAlignedDuration(page: Page, group: Locator, count: number) {
  const inputs = group.locator('input');
  await expect(inputs).toHaveCount(count);
  // All rectangles are read together, in one browser evaluation and after entrance animations, so
  // every field and label is measured in the same frame (R-014 timing correction, Checkpoint 3).
  await settle(page);
  const rects = await group.evaluate((el) => {
    const r = (e: Element) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
    return { boxes: [...el.querySelectorAll('input')].map(r), labels: [...el.querySelectorAll('label')].map(r) };
  });
  const { boxes, labels } = rects;
  expect(boxes).toHaveLength(count);
  expect(labels).toHaveLength(count);
  const vw = page.viewportSize()!.width;
  for (const b of boxes) {
    expect(Math.abs(b.y - boxes[0]!.y)).toBeLessThan(1);
    expect(Math.abs(b.height - boxes[0]!.height)).toBeLessThan(1);
    expect(Math.abs(b.width - boxes[0]!.width)).toBeLessThan(1.5);
    expect(b.height).toBeGreaterThanOrEqual(44);
    expect(b.x + b.width).toBeLessThanOrEqual(vw);
  }
  for (const [i, l] of labels.entries()) {
    expect(Math.abs(l.y - labels[0]!.y)).toBeLessThan(1); // labels on one line
    expect(l.y + l.height).toBeLessThanOrEqual(boxes[i]!.y + 1); // label above its own field
    expect(Math.abs(l.x - boxes[i]!.x)).toBeLessThan(2); // left-aligned with its field
  }
}

// ---------------------------------------------------------------------------
// R-010
// ---------------------------------------------------------------------------

test('R-010: a 4-month-old gets ideas for birth to under 6 months, not ideas for older children', async ({ page }) => {
  await start(page, { dob: FOUR_MONTHS, name: 'Sample Child A' });
  await page.goto('./#/growth/goals/ideas');
  await expect(page.getByTestId('idea-range')).toHaveValue('r0-6');
  await expect(page.getByTestId('idea-age-context')).toContainText('4 months (chronological age)');
  const ideas = page.getByTestId('idea-list').getByTestId('idea');
  expect(await ideas.count()).toBeGreaterThanOrEqual(8);
  await expect(page.getByTestId('idea-list')).toContainText('Get comfortable with tummy time');
  await expect(page.getByTestId('idea-list')).not.toContainText(/library|art activity|outdoor game/i);
  // Safety qualifications travel with the idea.
  await expect(page.locator('[data-idea="gi-r0-6-01"]').getByTestId('idea-safety')).toContainText('Do not leave your baby alone');
  // Clearly not CDC milestones, not expectations; Start from a milestone is kept.
  await expect(page.getByTestId('idea-disclaimer')).toContainText('aren’t CDC milestones');
  await expect(page.getByRole('heading', { name: 'Start from a milestone' })).toBeVisible();
  // Parents can browse any other range independently of the default.
  await page.getByTestId('idea-range').selectOption('r36-48');
  await expect(page.getByTestId('original-ideas')).toHaveAttribute('data-range', 'r36-48');
  await expect(page.getByTestId('idea-age-context')).toContainText('another age range');
  await expect(page.getByTestId('idea-list')).toContainText('Talk about stories after reading them');
});

test('R-010: an idea only fills in an editable goal; nothing is saved, dated or assigned until the parent saves', async ({ page }) => {
  await start(page, { dob: FOUR_MONTHS });
  await page.goto('./#/growth/goals/ideas');
  await page.locator('[data-idea="gi-r0-6-04"] a.ms-item').click();
  await expect(page.getByLabel('Goal name')).toHaveValue('Enjoy calm cuddle time together');
  await expect(page.getByLabel('Area')).toHaveValue('social-emotional');
  await expect(page.getByLabel('Target date (optional)')).toHaveValue(''); // no deadline
  await expect(page.getByTestId('idea-prefill-note')).toBeVisible();
  // Not saved yet.
  await page.goto('./#/growth/goals/my');
  await expect(page.getByTestId('goal-row')).toHaveCount(0);
  // Edit before adopting.
  await page.goto('./#/growth/goals/ideas/r0-6');
  await page.locator('[data-idea="gi-r0-6-04"] a.ms-item').click();
  await page.getByLabel('Goal name').fill('Fictional cuddle and song time');
  await page.getByTestId('save-goal').click();
  await expect(page.getByTestId('goal-title')).toHaveText('Fictional cuddle and song time');
  await expect(page.getByTestId('goal-dates')).not.toContainText('Target');
  await expect(page.getByTestId('related-milestone')).toHaveCount(0); // no milestone link is made for the parent
});

test('R-010: before the due date no range is chosen; the parent can still browse', async ({ page }) => {
  await start(page, { dob: '2026-10-29', ga: 30, useCorrected: true });
  await page.goto('./#/growth/goals/ideas');
  await expect(page.getByTestId('idea-before-due')).toContainText('due date hasn’t arrived yet');
  await expect(page.getByTestId('idea-list')).toHaveCount(0);
  await expect(page.getByTestId('idea-range')).toHaveValue('');
  await page.getByTestId('idea-browse-first').click();
  await expect(page.getByTestId('idea-range')).toHaveValue('r0-6');
  await expect(page.getByTestId('idea-list').getByTestId('idea').first()).toBeVisible();
});

test('R-010: older than five uses the last range and explains the coverage; a newborn uses the first range', async ({ page }) => {
  await start(page, { dob: '2021-05-01' });
  await page.goto('./#/growth/goals/ideas');
  await expect(page.getByTestId('idea-range')).toHaveValue('r48-60');
  await expect(page.getByTestId('idea-over-five')).toContainText('go up to age 5');
});

test('R-010: a newborn (6 days old) uses the first range', async ({ page }) => {
  await start(page, { dob: '2026-11-20' });
  await page.goto('./#/growth/goals/ideas');
  await expect(page.getByTestId('idea-range')).toHaveValue('r0-6');
  await expect(page.getByTestId('idea-age-context')).toContainText('0 months');
});

// ---------------------------------------------------------------------------
// R-011
// ---------------------------------------------------------------------------

test('R-011: an activity page names CDC only in its source section, with neutral reference-age wording and all safety text', async ({ page }) => {
  await start(page, { dob: FOUR_MONTHS });
  await page.goto('./#/growth/exercises/activity/cdc22-act-a004');
  await expect(page.getByTestId('activity-meta')).toHaveText('Gross motor · Reference age: 2 months');
  const main = page.getByTestId('activity-detail');
  const safety = page.getByTestId('activity-safety');
  const source = page.getByTestId('activity-source');
  await expect(safety).toContainText('This app doesn’t review whether an activity suits a particular child.');
  await expect(safety.getByTestId('page-guidance')).toContainText('Try these simple tips and activities in a safe way');
  await expect(page.getByTestId('safety-sentence').first()).toContainText('Do not leave your baby alone');
  // Attribution, original wording and links are kept in the dedicated Source section.
  await expect(source.getByRole('heading', { name: 'Source' })).toBeVisible();
  await expect(source).toContainText('Not endorsed by CDC, HHS, or the U.S. Government');
  await expect(source.getByRole('link')).toHaveCount(1);
  await expect(source.getByTestId('activity-original')).toBeAttached();
  // Outside the Source section, no screen text names CDC.
  const outside = await main.evaluate((el) => {
    const c = el.cloneNode(true) as HTMLElement;
    c.querySelector('[data-testid="activity-source"]')?.remove();
    return c.innerText;
  });
  expect(outside).not.toMatch(/\bCDC\b/);
  // The Browse page keeps the general attribution and non-endorsement statement.
  await page.goto('./#/growth/exercises/browse/2');
  await expect(page.getByTestId('activity-source-note')).toContainText('Not endorsed by CDC, HHS, or the U.S. Government');
});

test('R-011: after adoption the provenance, source and safety are kept; the tracker’s safety line has no agency tag', async ({ page }) => {
  await start(page, { dob: FOUR_MONTHS, fixed: false });
  await page.goto('./#/growth/exercises/activity/cdc22-act-a004');
  await page.getByTestId('add-to-my-exercises').click();
  await page.getByTestId('method-stopwatch').click();
  await page.getByTestId('rule-daily').click();
  await page.getByTestId('save-exercise').click();
  await expect(page.getByTestId('exercise-origin')).toHaveText('From CDC’s activity tips');
  await expect(page.getByTestId('activity-safety')).toContainText('Do not leave your baby alone');
  await page.getByTestId('cdc-original').locator(':scope > summary').click();
  await expect(page.getByTestId('cdc-original').getByTestId('activity-source')).toContainText('Not endorsed by CDC');
  await page.goto('./#/growth/exercises');
  await page.getByTestId('routine-start').click();
  await expect(page.getByTestId('tracker-safety')).toContainText('Do not leave your baby alone');
  await expect(page.getByTestId('tracker-safety')).not.toContainText('CDC');
});

// ---------------------------------------------------------------------------
// R-012, R-013, R-014
// ---------------------------------------------------------------------------

for (const width of [320, 390]) {
  test(`R-012/R-013: Add exercise headings sit inside their groups and the target fields align (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await start(page, { dob: FOUR_MONTHS });
    await page.goto('./#/growth/exercises/new');
    await page.getByTestId('method-stopwatch').click();
    for (const id of ['ex-tracking', 'ex-schedule']) {
      const group = page.getByTestId(id);
      const card = page.locator('.card', { has: group });
      const legend = await box(group.locator(':scope > legend'));
      const first = await box(group.locator('label.choice').first());
      const c = await box(card);
      expect(Math.abs(legend.x - first.x), `${id} heading left edge`).toBeLessThan(1);
      expect(legend.y, `${id} heading inside the card`).toBeGreaterThan(c.y + 8);
      expect(first.y - (legend.y + legend.height), `${id} heading-to-options gap`).toBeGreaterThanOrEqual(8);
      expect(first.y - (legend.y + legend.height), `${id} heading-to-options gap`).toBeLessThanOrEqual(24);
    }
    await expectAlignedDuration(page, page.getByTestId('target-time'), 2);
    await noOverflow(page, 'add exercise');
    // Validation and the optional target are unchanged.
    await page.getByLabel('Exercise name').fill('Fictional timed play');
    await page.getByLabel('Minutes').fill('70');
    await page.getByTestId('rule-daily').click();
    await page.getByTestId('save-exercise').click();
    await expect(page.locator('#ex-error')).toContainText('target time');
    await page.getByLabel('Minutes').fill('');
    await page.getByTestId('save-exercise').click();
    await expect(page.getByTestId('exercise-title')).toHaveText('Fictional timed play');
    // The edit form uses the same layout.
    await page.getByTestId('edit-exercise').click();
    await expectAlignedDuration(page, page.getByTestId('target-time'), 2);
  });
}

test('R-014: session correction and manual entry use the same aligned duration fields; calculations unchanged (320px)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await start(page, { dob: FOUR_MONTHS, fixed: false });
  await newExercise(page, 'Fictional floor play', { method: 'stopwatch', rule: 'asNeeded' });
  await page.getByTestId('record-past').click();
  await expectAlignedDuration(page, page.getByTestId('manual-session').getByTestId('duration-fields'), 3);
  await page.getByLabel('Minutes').fill('2');
  await page.getByLabel('Seconds').fill('5');
  await page.getByTestId('save-manual-session').click();
  await expect(page.getByTestId('session-row')).toContainText('2 minutes, 5 seconds');
  await page.getByRole('button', { name: /^Correct session/ }).click();
  const fields = page.getByTestId('edit-session').getByTestId('duration-fields');
  await expectAlignedDuration(page, fields, 3);
  await expect(page.getByLabel('Minutes')).toHaveValue('2');
  await expect(page.getByLabel('Seconds')).toHaveValue('5');
  await page.getByLabel('Hours').fill('1');
  await page.getByTestId('save-session-correction').click();
  await expect(page.getByTestId('session-row')).toContainText('1 hour, 2 minutes, 5 seconds');
  // The stopwatch's manual entry too.
  await page.getByTestId('start-tracker').click();
  await page.getByTestId('tracker').getByText('Enter duration manually').click();
  await expectAlignedDuration(page, page.getByTestId('manual-entry').getByTestId('duration-fields'), 3);
  await noOverflow(page, 'tracker manual entry');
});

// ---------------------------------------------------------------------------
// R-015
// ---------------------------------------------------------------------------

test('R-015: deleting a session asks first, leaves no placeholder, updates every total and frees the slot', async ({ page }) => {
  await start(page, { dob: FOUR_MONTHS, fixed: false });
  await newExercise(page, 'Fictional tummy time', { rule: 'daily', perDay: '2' });
  await newExercise(page, 'Fictional unrelated', { rule: 'daily' });
  await page.goto('./#/growth/exercises');
  await page.locator('[data-exercise="Fictional tummy time"]').getByTestId('routine-complete').click();
  await page.locator('[data-exercise="Fictional tummy time"]').getByTestId('routine-complete').click();
  await page.locator('[data-exercise="Fictional unrelated"]').getByTestId('routine-complete').click();
  await expect(page.getByTestId('daily-count')).toHaveText('3 of 3 sessions done');
  await page.goto('./#/home');
  await expect(page.getByTestId('home-exercises')).toContainText('3 of 3');
  await page.goto('./#/growth/exercises');
  await page.getByTestId('exercise-row').filter({ hasText: 'Fictional tummy time' }).click();
  await expect(page.getByTestId('session-row')).toHaveCount(2);
  // Confirmation, with Cancel as the safe default.
  await page.getByTestId('delete-session').first().click();
  const sheet = page.getByRole('dialog', { name: 'Delete this session?' });
  await expect(sheet).toContainText('This session will be removed from your exercise history and progress totals.');
  await expect(page.getByTestId('cancel-delete-session')).toBeFocused();
  await page.getByTestId('cancel-delete-session').click();
  await expect(page.getByTestId('session-row')).toHaveCount(2);
  await page.getByTestId('delete-session').first().click();
  await page.getByTestId('confirm-delete-session').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Session deleted.');
  await expect(page.getByTestId('session-row')).toHaveCount(1);
  await expect(page.getByTestId('sessions')).toContainText('Sessions (1)');
  await expect(page.getByTestId('sessions')).not.toContainText(/Removed|Restore|deleted/i);
  await page.getByTestId('item-history').locator('summary').click();
  await expect(page.getByTestId('item-history')).not.toContainText(/Session deleted|Session removed/);
  await expect(page.getByTestId('item-history').locator('[data-type="session-recorded"]')).toHaveCount(1);
  // Today's routine and Home recalculate; the slot is available again; the other exercise is untouched.
  await page.goto('./#/growth/exercises');
  await expect(page.getByTestId('daily-count')).toHaveText('2 of 3 sessions done');
  await expect(page.locator('[data-exercise="Fictional tummy time"]').getByTestId('routine-complete')).toBeVisible();
  await expect(page.locator('[data-exercise="Fictional unrelated"]').getByTestId('routine-done')).toBeVisible();
  await page.goto('./#/home');
  await expect(page.getByTestId('home-exercises')).toContainText('2 of 3');
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('pp-sessions')).toHaveText('2');
  await page.goto('./#/growth/exercises');
  await page.locator('[data-exercise="Fictional tummy time"]').getByTestId('routine-complete').click();
  await expect(page.getByTestId('daily-count')).toHaveText('3 of 3 sessions done');
});

test('R-015: the deleted session’s note and duration are not kept on the device', async ({ page }) => {
  await start(page, { dob: FOUR_MONTHS, fixed: false });
  await newExercise(page, 'Fictional timed', { method: 'stopwatch', rule: 'asNeeded' });
  await page.getByTestId('record-past').click();
  await page.getByLabel('Minutes').fill('7');
  await page.getByLabel('Note (optional)').fill('Fictional private session note');
  await page.getByTestId('save-manual-session').click();
  await page.getByTestId('delete-session').click();
  await page.getByTestId('confirm-delete-session').click();
  await expect(page.getByTestId('session-row')).toHaveCount(0);
  const stored = await page.evaluate(() => new Promise<string>((resolve) => {
    const r = indexedDB.open('roll-crawl-run');
    r.onsuccess = () => {
      const tx = r.result.transaction(['completions', 'itemEvents'], 'readonly');
      const a = tx.objectStore('completions').getAll();
      const b = tx.objectStore('itemEvents').getAll();
      tx.oncomplete = () => { resolve(JSON.stringify([a.result, b.result])); r.result.close(); };
    };
  }));
  expect(stored).not.toContain('Fictional private session note');
  expect(stored).not.toContain('"durationSeconds":420');
  expect(stored).toContain('"deletedSlotKey"');
});

// ---------------------------------------------------------------------------
// R-016
// ---------------------------------------------------------------------------

test('R-016: the recovery notice uses the theme’s button hierarchy with equal widths, and all three options still work', async ({ page }) => {
  await page.clock.install();
  await start(page, { dob: FOUR_MONTHS, fixed: false });
  await newExercise(page, 'Fictional stretch', { method: 'stopwatch', rule: 'daily' });
  const reopen = async () => {
    await page.goto('./#/growth/exercises');
    await page.getByTestId('routine-start').click();
    await page.getByTestId('sw-start').click();
    await page.clock.runFor(8_000);
    await page.reload();
    await page.clock.runFor(4_000);
    await page.getByTestId('routine-start').click();
    await expect(page.getByTestId('recovery-notice')).toBeVisible();
  };
  await reopen();
  const notice = page.getByTestId('recovery-notice');
  await expect(notice).toContainText('kept running while the app was closed or in the background');
  const keep = notice.getByTestId('recovery-keep');
  const pause = notice.getByTestId('recovery-pause');
  const manual = notice.getByTestId('recovery-manual');
  await expect(keep).toHaveClass(/btn-primary/);
  const [k, p, m] = [await box(keep), await box(pause), await box(manual)];
  for (const b of [p, m]) {
    expect(Math.abs(b.x - k.x)).toBeLessThan(1);
    expect(Math.abs(b.width - k.width)).toBeLessThan(1);
  }
  for (const b of [k, p, m]) expect(b.height).toBeGreaterThanOrEqual(44);
  expect(p.y).toBeGreaterThan(k.y + k.height - 1);
  expect(m.y).toBeGreaterThan(p.y + p.height - 1);
  const results = await new AxeBuilder({ page: page as never }).include('[data-testid="recovery-notice"]').analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
  // Keep running: it continues.
  await keep.click();
  await expect(notice).toHaveCount(0);
  await expect(page.getByTestId('sw-pause')).toBeVisible();
  // Pause.
  await page.getByTestId('discard-tracker').click();
  await reopen();
  await page.getByTestId('recovery-pause').click();
  await expect(page.getByTestId('sw-resume')).toBeVisible();
  // Enter duration manually.
  await page.getByTestId('discard-tracker').click();
  await reopen();
  await page.getByTestId('recovery-manual').click();
  await expect(page.getByTestId('manual-entry')).toBeVisible();
  await expect(page.getByTestId('sw-resume')).toBeVisible();
});

// ---------------------------------------------------------------------------
// R-017
// ---------------------------------------------------------------------------

test('R-017: 6 months and 1 year show exactly 6 and 12 months; before birth is “not applicable”, not zero; chart and table match', async ({ page }) => {
  await start(page, { dob: FOUR_MONTHS, name: 'Sample Child A' });
  await page.goto('./#/growth/progress/history/goals');
  const bars = page.getByTestId('chart-bar');
  await expect(bars).toHaveCount(6);
  await expect(page.locator('[data-testid="chart-bar"][data-status="before-birth"]')).toHaveCount(1); // June
  await expect(page.locator('[data-testid="chart-bar"][data-month="2026-06"]')).toHaveAttribute('data-status', 'before-birth');
  await expect(page.locator('[data-testid="chart-bar"][data-month="2026-07"]')).toHaveAttribute('data-status', 'counted'); // birth month applies
  await expect(page.locator('[data-testid="chart-bar"][data-month="2026-07"]')).toContainText('0');
  await expect(page.getByTestId('legend-birth')).toBeVisible();
  await page.getByTestId('history-period').getByRole('button', { name: '1 year' }).click();
  await expect(bars).toHaveCount(12);
  await expect(page.locator('[data-testid="chart-bar"][data-status="before-birth"]')).toHaveCount(7);
  await page.getByTestId('chart-table').locator('summary').click();
  const rows = page.getByTestId('chart-row');
  await expect(rows).toHaveCount(12);
  await expect(rows.first()).toContainText('December 2025');
  await expect(rows.first()).toContainText('Before birth (not applicable)');
  await expect(rows.last()).toContainText('November 2026 (so far)');
  await expect(rows.last()).toContainText('0');
  expect(await page.locator('[data-testid="chart-row"][data-status="before-birth"]').count()).toBe(7);
  // The same periods in every view.
  for (const view of ['milestones', 'exercises']) {
    await page.goto(`./#/growth/progress/history/${view}`);
    await page.getByTestId('history-period').getByRole('button', { name: '6 months' }).click();
    await expect(bars).toHaveCount(6);
    await page.getByTestId('history-period').getByRole('button', { name: '1 year' }).click();
    await expect(bars).toHaveCount(12);
  }
});

test('R-017: a backdated session before the exercise existed is counted; months before tracking are “not tracked”', async ({ page }) => {
  await start(page, { dob: '2025-01-10', fixed: false });
  await newExercise(page, 'Fictional backdated', { rule: 'asNeeded' });
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 3);
  const backdated = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-05`;
  await page.getByTestId('record-past').click();
  await page.getByLabel('Date', { exact: true }).fill(backdated);
  await page.getByTestId('save-manual-session').click();
  await page.goto('./#/growth/progress/history/exercises');
  const month = backdated.slice(0, 7);
  await expect(page.locator(`[data-testid="chart-bar"][data-month="${month}"]`)).toHaveAttribute('data-count', '1');
  await expect(page.locator(`[data-testid="chart-bar"][data-month="${month}"]`)).toHaveAttribute('data-status', 'counted');
  await expect(page.locator('[data-testid="chart-bar"][data-status="not-tracked"]')).toHaveCount(2);
  await expect(page.getByTestId('legend-not-tracked')).toBeVisible();
  await page.getByTestId('chart-table').locator('summary').click();
  await expect(page.getByTestId('chart-table')).toContainText('Not tracked yet');
});

test('R-017: the 12-month chart fits and passes contrast at 320 px and phone width in all five themes', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 320, height: 700 });
  await start(page, { dob: FOUR_MONTHS });
  for (const theme of ['earth', 'sky', 'blush', 'lavender', 'sage']) {
    await page.goto('./#/settings');
    await page.getByTestId(`theme-${theme}`).click();
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('./#/growth/progress/history/milestones');
      await page.getByTestId('history-period').getByRole('button', { name: '1 year' }).click();
      await expect(page.getByTestId('chart-bar')).toHaveCount(12);
      await page.waitForTimeout(250);
      await noOverflow(page, `${theme} ${width}`);
      // Month labels don't overlap each other.
      const labels = await page.locator('.chart-label').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.right]; }));
      for (let i = 1; i < labels.length; i++) expect(labels[i]![0]!, `${theme} ${width} label ${i}`).toBeGreaterThan(labels[i - 1]![1]! - 0.5);
      const r = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(r.violations.map((v) => `${theme} ${width}: ${v.id} ${v.nodes[0]?.html.slice(0, 80)}`)).toEqual([]);
    }
  }
});

// ---------------------------------------------------------------------------
// Accessibility and offline for the refined screens
// ---------------------------------------------------------------------------

test('accessibility: goal ideas, the delete-session confirmation and the exercise form pass axe', async ({ page }) => {
  await start(page, { dob: FOUR_MONTHS, fixed: false });
  await page.goto('./#/growth/goals/ideas');
  await page.waitForTimeout(300);
  let r = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(r.violations.map((v) => `ideas: ${v.id} ${v.nodes[0]?.html.slice(0, 80)}`)).toEqual([]);
  await page.goto('./#/growth/exercises/new');
  await page.getByTestId('method-stopwatch').click();
  await page.waitForTimeout(300);
  r = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(r.violations.map((v) => `form: ${v.id} ${v.nodes[0]?.html.slice(0, 80)}`)).toEqual([]);
  await newExercise(page, 'Fictional simple', { rule: 'asNeeded' });
  await page.getByTestId('record-now').click();
  await page.getByTestId('delete-session').click();
  await page.waitForTimeout(300);
  r = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(r.violations.map((v) => `delete: ${v.id} ${v.nodes[0]?.html.slice(0, 80)}`)).toEqual([]);
});

test('offline: goal ideas and session deletion work after the app is cached', async ({ page, context }) => {
  await start(page, { dob: FOUR_MONTHS, fixed: false });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await newExercise(page, 'Fictional offline exercise', { rule: 'asNeeded' });
  await context.setOffline(true);
  await page.goto('./#/growth/goals/ideas/r6-12');
  await expect(page.getByTestId('idea-list')).toContainText('Practice sitting, with support at first');
  await page.goto('./#/growth/exercises');
  await page.getByTestId('exercise-row').click();
  await page.getByTestId('record-now').click();
  await expect(page.getByTestId('session-row')).toHaveCount(1);
  await page.getByTestId('delete-session').click();
  await page.getByTestId('confirm-delete-session').click();
  await expect(page.getByTestId('session-row')).toHaveCount(0);
  await context.setOffline(false);
});
