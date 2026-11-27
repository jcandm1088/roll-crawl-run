/**
 * Checkpoint 2b quality coverage: accessibility, five themes, narrow screens, offline, profile isolation,
 * concurrent copies, edge ages, many sessions, schedule changes, legacy deletion, history corrections.
 * FICTIONAL data only.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { addChild, completeOnboarding, isoDaysAgo, seedLegacyPersonalEntry } from './helpers';

const DOB = isoDaysAgo(400);

async function newExercise(page: Page, title: string, opts: { method?: string; rule?: string; perDay?: string; provider?: boolean } = {}) {
  await page.goto('./#/growth/exercises/new');
  await page.getByLabel('Exercise name').fill(title);
  if (opts.provider) await page.getByTestId('origin-provider').click();
  await page.getByTestId(`method-${opts.method ?? 'simple'}`).click();
  await page.getByTestId(`rule-${opts.rule ?? 'daily'}`).click();
  if (opts.perDay) await page.getByTestId('per-day').fill(opts.perDay);
  await page.getByTestId('save-exercise').click();
  await expect(page.getByTestId('exercise-title')).toHaveText(title);
}

async function newGoal(page: Page, title: string) {
  await page.goto('./#/growth/goals/new');
  await page.getByLabel('Goal name').fill(title);
  await page.getByTestId('save-goal').click();
  await expect(page.getByTestId('goal-title')).toHaveText(title);
}

const fits = async (page: Page, label: string) => {
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), label).toBeLessThanOrEqual(0);
  const over = await page.evaluate(() => [...document.querySelectorAll('input, textarea, select, button, a.btn')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && (r.right > window.innerWidth + 0.5 || r.left < -0.5);
  }).map((el) => el.outerHTML.slice(0, 80)));
  expect(over, label).toEqual([]);
};

const PAGES: Array<[string, (page: Page) => Promise<void>]> = [
  ['goals landing', async (p) => { await p.goto('./#/growth/goals'); }],
  ['my goals', async (p) => { await p.goto('./#/growth/goals/my'); }],
  ['create goal', async (p) => { await p.goto('./#/growth/goals/new'); await p.getByTestId('goal-more').locator('summary').click(); }],
  ['goal detail', async (p) => { await p.goto('./#/growth/goals/my'); await p.getByTestId('goal-row').first().click(); }],
  ['inspiration', async (p) => { await p.goto('./#/growth/goals/ideas'); }],
  ['exercises', async (p) => { await p.goto('./#/growth/exercises'); }],
  ['create exercise', async (p) => { await p.goto('./#/growth/exercises/new'); await p.getByTestId('rule-weekdays').click(); await p.getByTestId('method-stopwatch').click(); }],
  ['exercise detail', async (p) => { await p.goto('./#/growth/exercises'); await p.getByTestId('exercise-row').first().click(); }],
  ['tracker', async (p) => { await p.goto('./#/growth/exercises'); await p.getByTestId('routine-start').click(); }],
  ['browse', async (p) => { await p.goto('./#/growth/exercises/browse/9'); await p.getByTestId('area-gross-motor').locator('button').click(); }],
  ['activity detail', async (p) => { await p.goto('./#/growth/exercises/activity/cdc22-act-a004'); }],
  ['progress', async (p) => { await p.goto('./#/growth/progress'); }],
  ['progress over time', async (p) => { await p.goto('./#/growth/progress/history/exercises'); await p.getByTestId('chart-table').locator('summary').click(); }],
  ['home with exercises card', async (p) => { await p.goto('./#/home'); }],
];

async function seed(page: Page) {
  await newGoal(page, 'Fictional goal for scanning');
  await newExercise(page, 'Fictional stopwatch exercise with a fairly long name', { method: 'stopwatch', rule: 'daily', perDay: '2' });
}

for (const [name, open] of PAGES) {
  test(`accessibility scan: ${name}`, async ({ page }) => {
    await completeOnboarding(page, { dob: DOB, name: 'Sample Child A' });
    await seed(page);
    await open(page);
    await page.waitForTimeout(300);
    const results = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} — ${v.help} — ${v.nodes[0]?.html.slice(0, 120)}`)).toEqual([]);
  });
}

test('narrow phone (320px): every new screen fits without horizontal scrolling', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 640 });
  await completeOnboarding(page, { dob: DOB, name: 'Sample Child With A Long Name' });
  await seed(page);
  await newExercise(page, 'Fictional many sessions', { rule: 'daily', perDay: '24' });
  for (const [name, open] of PAGES) {
    await open(page);
    await fits(page, name);
  }
});

test('all five themes render the new screens with accessible contrast (axe) on the main pages', async ({ page }) => {
  test.setTimeout(120_000);
  await completeOnboarding(page, { dob: DOB, name: 'Sample Child A' });
  await seed(page);
  for (const theme of ['earth', 'sky', 'blush', 'lavender', 'sage']) {
    await page.goto('./#/settings');
    await page.getByTestId(`theme-${theme}`).click();
    for (const path of ['./#/growth/exercises', './#/growth/goals/my', './#/growth/progress/history/milestones', './#/home']) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await page.waitForTimeout(200);
      const r = await new AxeBuilder({ page: page as never }).withRules(['color-contrast']).analyze();
      expect(r.violations.map((v) => `${theme} ${path}: ${v.nodes.length} ${v.nodes[0]?.html.slice(0, 80)}`)).toEqual([]);
    }
  }
});

test('24 sessions a day stays tidy (a count, not 24 controls) and additional sessions never pass 100%', async ({ page }) => {
  await completeOnboarding(page, { dob: DOB });
  await newExercise(page, 'Fictional frequent exercise', { rule: 'daily', perDay: '30' }); // clamped to 24
  await page.goto('./#/growth/exercises');
  await expect(page.getByTestId('daily-count')).toHaveText('0 of 24 sessions done');
  await expect(page.getByTestId('session-count')).toHaveText('0 of 24');
  await expect(page.getByTestId('session-dots')).toHaveCount(0);
  await page.getByTestId('routine-complete').click();
  await expect(page.getByTestId('daily-count')).toHaveText('1 of 24 sessions done');
});

test('schedule change after partial participation: today’s recorded sessions are kept and the bar stays ≤ 100%', async ({ page }) => {
  await completeOnboarding(page, { dob: DOB });
  await newExercise(page, 'Fictional changing routine', { rule: 'daily', perDay: '3' });
  await page.goto('./#/growth/exercises');
  await page.getByTestId('routine-complete').click();
  await page.getByTestId('routine-complete').click();
  await expect(page.getByTestId('daily-count')).toHaveText('2 of 3 sessions done');
  await page.getByTestId('exercise-row').click();
  await page.getByTestId('edit-exercise').click();
  await page.getByTestId('per-day').fill('1');
  await page.getByTestId('save-exercise').click();
  await expect(page.getByTestId('exercise-schedule')).toHaveText('Every day');
  await expect(page.getByTestId('session-row')).toHaveCount(2);
  await page.goto('./#/growth/exercises');
  await expect(page.getByTestId('daily-count')).toHaveText('1 of 1 session done');
  await expect(page.getByTestId('routine-item')).toContainText('+1 more');
});

test('pause and resume; archived exercises leave Today’s routine and the Home card', async ({ page }) => {
  await completeOnboarding(page, { dob: DOB });
  await newExercise(page, 'Fictional pausable', { rule: 'daily' });
  await page.getByTestId('manage-exercise').locator('summary').click();
  await page.getByTestId('pause-exercise').click();
  await expect(page.getByTestId('exercise-schedule')).toContainText('Paused');
  await page.goto('./#/home');
  await expect(page.getByTestId('home-exercises')).toHaveCount(0);
  await page.goto('./#/growth/exercises');
  await page.getByTestId('exercise-row').click();
  await page.getByTestId('manage-exercise').locator('summary').click();
  await page.getByTestId('pause-exercise').click();
  await page.goto('./#/home');
  await expect(page.getByTestId('home-exercises')).toBeVisible();
  await page.goto('./#/growth/exercises');
  await page.getByTestId('exercise-row').click();
  await page.getByTestId('manage-exercise').locator('summary').click();
  await page.getByTestId('archive-exercise').click();
  await page.goto('./#/home');
  await expect(page.getByTestId('home-exercises')).toHaveCount(0);
});

test('backdated and corrected sessions: recorded for the right day; removal and restore update counts', async ({ page }) => {
  await completeOnboarding(page, { dob: DOB });
  await newExercise(page, 'Fictional counted', { method: 'reps', rule: 'asNeeded' });
  await page.getByTestId('record-past').click();
  await page.getByLabel('Date', { exact: true }).fill(isoDaysAgo(2));
  await page.getByLabel('Repetitions').fill('8');
  await page.getByTestId('save-manual-session').click();
  await expect(page.getByTestId('session-row')).toHaveCount(1);
  await expect(page.getByTestId('session-row')).toContainText('8 repetitions');
  await page.getByRole('button', { name: /^Correct session/ }).click();
  await page.getByLabel('Repetitions').fill('9');
  await page.getByTestId('save-session-correction').click();
  await expect(page.getByTestId('session-row').first()).toContainText('9 repetitions');
  await page.getByTestId('remove-session').click();
  await expect(page.getByTestId('session-row').first()).toHaveAttribute('data-reversed', 'true');
  await expect(page.getByTestId('sessions')).toContainText('Sessions (0)');
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByTestId('sessions')).toContainText('Sessions (1)');
});

test('two open copies: the same scheduled session can’t be recorded twice', async ({ page, context }) => {
  await completeOnboarding(page, { dob: DOB });
  await newExercise(page, 'Fictional shared', { rule: 'daily' });
  const other = await context.newPage();
  await other.goto('./#/growth/exercises');
  await page.goto('./#/growth/exercises');
  await expect(other.getByTestId('routine-complete')).toBeVisible();
  await page.getByTestId('routine-complete').click();
  await expect(page.getByTestId('daily-count')).toHaveText('1 of 1 session done');
  await other.getByTestId('routine-complete').click(); // stale copy
  await expect(other.locator('#exercises-error')).toContainText('already recorded');
  await other.reload();
  await expect(other.getByTestId('daily-count')).toHaveText('1 of 1 session done');
});

test('two open copies of a stopwatch: the stale copy shows the newer state instead of overwriting it', async ({ page, context }) => {
  await completeOnboarding(page, { dob: DOB });
  await newExercise(page, 'Fictional shared stopwatch', { method: 'stopwatch', rule: 'daily' });
  const other = await context.newPage();
  await other.goto('./#/growth/exercises');
  await other.getByTestId('routine-start').click();
  await page.goto('./#/growth/exercises');
  await page.getByTestId('routine-start').click();
  await page.getByTestId('sw-start').click();
  await expect(page.getByTestId('sw-pause')).toBeVisible();
  await other.getByTestId('sw-start').click(); // based on an older (empty) state
  await expect(other.getByTestId('tracker-notice')).toContainText('another window');
});

test('profile isolation: each child has their own goals, exercises, routine and theme', async ({ page }) => {
  await completeOnboarding(page, { dob: DOB, name: 'Sample Child A', theme: 'sage' });
  await newGoal(page, 'Fictional goal for A');
  await newExercise(page, 'Fictional exercise for A', { rule: 'daily' });
  await addChild(page, 'Sample Child B', isoDaysAgo(800));
  await page.goto('./#/growth/goals/my');
  await expect(page.getByTestId('goals-empty')).toBeVisible();
  await page.goto('./#/home');
  await expect(page.getByTestId('home-exercises')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'earth');
  await page.goto('./#/growth/exercises/browse');
  await expect(page.getByTestId('browse-age')).toHaveValue('24'); // about 26 months → 2-year tips
  await page.goto('./#/home'); // the child selector is on the main tab screens
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: /Sample Child A/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sage');
  await page.goto('./#/home');
  await expect(page.getByTestId('home-exercises')).toBeVisible();
});

test('Browse for a child under 2 months, and before the due date, shows a calm intro instead of a default', async ({ page }) => {
  await completeOnboarding(page, { dob: isoDaysAgo(20), name: 'Sample Newborn' });
  await page.goto('./#/growth/exercises/browse');
  await expect(page.getByTestId('too-young')).toContainText('younger than 2 months');
  await expect(page.getByTestId('browse-areas')).toHaveCount(0);
  await page.getByTestId('browse-two-months').click();
  await expect(page.getByTestId('browse-age')).toHaveValue('2');
  await expect(page.getByTestId('age-context')).toContainText('A reference age gives context');
});

test('Browse: All ages and every CDC age can be chosen; activity detail shows a different-age note', async ({ page }) => {
  await completeOnboarding(page, { dob: DOB });
  await page.goto('./#/growth/exercises/browse');
  await page.getByTestId('browse-age').selectOption('all');
  await page.getByTestId('area-social-emotional').locator('button').click();
  expect(await page.getByTestId('area-social-emotional').getByTestId('activity-row').count()).toBeGreaterThan(20);
  for (const a of ['2', '4', '6', '9', '12', '15', '18', '24', '30', '36', '48', '60']) {
    await page.getByTestId('browse-age').selectOption(a);
    await expect(page.getByTestId('browse-areas')).toBeVisible();
  }
  await page.goto('./#/growth/exercises/activity/cdc22-act-a004');
  await expect(page.getByTestId('age-differs')).toBeVisible();
});

test('a customized CDC activity is no longer attributed to CDC, but CDC’s original and safety stay available', async ({ page }) => {
  await completeOnboarding(page, { dob: DOB });
  await page.goto('./#/growth/exercises/activity/cdc22-act-a004');
  await page.getByTestId('add-to-my-exercises').click();
  await page.getByLabel('Instructions (optional)').fill('Fictional instructions in my own words.');
  await page.getByTestId('method-stopwatch').click();
  await page.getByTestId('rule-daily').click();
  await page.getByTestId('save-exercise').click();
  await expect(page.getByTestId('exercise-origin')).toHaveText('Adapted by you from a CDC activity');
  await expect(page.getByTestId('exercise-instructions')).toHaveText('Fictional instructions in my own words.');
  await expect(page.getByTestId('activity-safety')).toContainText('Do not leave your baby alone');
  await page.getByTestId('cdc-original').locator(':scope > summary').click();
  await expect(page.getByTestId('cdc-original').getByTestId('activity-instructions')).toContainText('Lay your baby on their tummy');
  await page.goto('./#/growth/exercises');
  await page.getByTestId('routine-start').click();
  await expect(page.getByTestId('tracker-safety')).toContainText('Do not leave your baby alone'); // at the point of use
});

test('offline: goals and exercises can be created and recorded after the app is cached', async ({ page, context }) => {
  await completeOnboarding(page, { dob: DOB, name: 'Sample Child A' });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await newGoal(page, 'Fictional offline goal');
  await newExercise(page, 'Fictional offline exercise', { rule: 'daily' });
  await page.goto('./#/growth/exercises');
  await page.getByTestId('routine-complete').click();
  await expect(page.getByTestId('daily-count')).toHaveText('1 of 1 session done');
  await page.goto('./#/growth/exercises/browse/12');
  await expect(page.getByTestId('browse-areas')).toBeVisible();
  await page.reload();
  await page.goto('./#/growth/goals/my');
  await expect(page.getByTestId('goal-row')).toHaveCount(1);
  await context.setOffline(false);
});

test('legacy personal entry: permanent deletion via two steps; Progress is unchanged', async ({ page }) => {
  await completeOnboarding(page, { dob: '2025-07-10' });
  await page.goto('./#/growth');
  await seedLegacyPersonalEntry(page, { title: 'Fictional legacy to delete', derivedFromDefId: 'cdc22-m12-se-01', appCategory: 'social-emotional', referenceAgeMonths: 12 });
  await page.goto('./#/growth/progress');
  const before = await page.getByTestId('progress-all').getByTestId('fraction').textContent();
  await page.goto('./#/growth/library');
  await page.getByRole('button', { name: /Your personal entries \(1\)/ }).click();
  await page.getByTestId('personal-entry-row').click();
  await page.getByTestId('manage-legacy').locator('summary').click();
  await page.getByTestId('delete-legacy').click();
  await expect(page.getByTestId('delete-effects')).toContainText('never counted in milestone Progress');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByTestId('confirm-delete').click();
  await expect(page.getByTestId('personal-entries')).toHaveCount(0);
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('progress-all').getByTestId('fraction')).toHaveText(before!);
});

test('Progress over time follows corrections and reversals; hidden milestones are excluded with a count', async ({ page }) => {
  await completeOnboarding(page, { dob: '2025-03-10' });
  const mark = async (id: string, date: string) => {
    await page.goto(`./#/growth/milestone/${id}`);
    await page.getByRole('radio', { name: 'Achieved' }).click();
    await page.getByLabel('Date achieved').fill(date);
    await page.getByRole('button', { name: 'Save status' }).click();
    await expect(page.getByTestId('saved')).toBeVisible();
  };
  await mark('cdc22-m02-se-01', isoDaysAgo(1));
  await mark('cdc22-m02-se-02', isoDaysAgo(1));
  await page.getByRole('button', { name: 'Hide this milestone' }).click();
  await page.goto('./#/growth/progress/history/milestones');
  const lastMonthDay = isoDaysAgo(1).slice(0, 7);
  await expect(page.locator(`[data-testid="chart-bar"][data-month="${lastMonthDay}"]`)).toHaveAttribute('data-count', '1');
  await expect(page.getByTestId('hidden-excluded')).toContainText('1 hidden milestone');
  await page.goto('./#/growth/milestone/cdc22-m02-se-01');
  await page.getByRole('radio', { name: 'Not yet observed' }).click();
  await page.getByRole('button', { name: 'Save status' }).click();
  await page.goto('./#/growth/progress/history/milestones');
  await expect(page.locator(`[data-testid="chart-bar"][data-month="${lastMonthDay}"]`)).toHaveAttribute('data-count', '0');
});

test('the stopwatch requires review when the device clock jumps a long way', async ({ page }) => {
  await page.clock.install();
  await completeOnboarding(page, { dob: DOB });
  await newExercise(page, 'Fictional clock check', { method: 'stopwatch', rule: 'daily' });
  await page.goto('./#/growth/exercises');
  await page.getByTestId('routine-start').click();
  await page.getByTestId('sw-start').click();
  await page.clock.runFor(10_000);
  // The wall clock jumps two hours ahead while the page measured only a few seconds.
  await page.clock.setSystemTime(Date.now() + 2 * 60 * 60 * 1000 + 10_000);
  await page.clock.runFor(1_000);
  await page.getByTestId('save-session').click();
  await expect(page.getByTestId('duration-review')).toBeVisible();
  await page.getByRole('button', { name: 'Enter the time instead' }).click();
  await page.getByLabel('Minutes').fill('5');
  await page.getByTestId('save-manual').click();
  await expect(page.getByTestId('undo-banner')).toContainText('5 minutes');
});

test('blocked upgrade: a parent-friendly notice while another copy holds the old database, then the app continues', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(() => new Promise<void>((resolve) => indexedDB.deleteDatabase('roll-crawl-run').onsuccess = () => resolve()));
  const holder = await context.newPage();
  await holder.goto('./licenses/idb-ISC.txt').catch(() => undefined); // any same-origin page that doesn't run the app
  // An older copy: version 2, no versionchange handler (like an old tab), holding the connection open.
  await holder.evaluate(() => new Promise<void>((resolve) => {
    const r = indexedDB.open('roll-crawl-run', 2);
    r.onupgradeneeded = () => {
      const db = r.result;
      for (const s of ['meta', 'settings', 'children']) db.createObjectStore(s, { keyPath: 'id' });
      db.createObjectStore('completions', { keyPath: 'id' }).createIndex('byChild', 'childId');
    };
    r.onsuccess = () => { (window as unknown as { held: IDBDatabase }).held = r.result; resolve(); };
  }));
  await page.reload();
  await expect(page.getByTestId('storage-notice')).toHaveAttribute('data-notice', 'blocked');
  await expect(page.getByTestId('storage-notice')).toContainText('Your information is safe');
  await holder.evaluate(() => (window as unknown as { held: IDBDatabase }).held.close());
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible(); // continued by itself; nothing reset
});

test('superseded: an open copy pauses safely when a newer version needs the database', async ({ page, context }) => {
  await completeOnboarding(page, { dob: DOB });
  const other = await context.newPage();
  await other.goto('./licenses/idb-ISC.txt').catch(() => undefined);
  await other.evaluate(() => new Promise<void>((resolve) => { const r = indexedDB.open('roll-crawl-run', 4); r.onsuccess = () => { r.result.close(); resolve(); }; }));
  await expect(page.getByTestId('storage-notice')).toHaveAttribute('data-notice', 'superseded');
  await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible();
});

test('midnight: Today’s routine and the Home card start fresh for the new day; history is kept', async ({ page }) => {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  await page.clock.install({ time: d });
  await completeOnboarding(page, { dob: DOB });
  await newExercise(page, 'Fictional nightly', { rule: 'daily' });
  await page.goto('./#/growth/exercises');
  await page.getByTestId('routine-complete').click();
  await expect(page.getByTestId('daily-count')).toHaveText('1 of 1 session done');
  await page.goto('./#/home');
  await expect(page.getByTestId('home-exercises').getByTestId('daily-count')).toHaveText('1 of 1 session done');
  await page.clock.runFor(2 * 60_000); // past local midnight
  await expect(page.getByTestId('home-exercises').getByTestId('daily-count')).toHaveText('0 of 1 session done');
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('pp-sessions')).toHaveText(new Date(d.getTime() + 120_000).getMonth() === d.getMonth() ? '1' : '0');
});
