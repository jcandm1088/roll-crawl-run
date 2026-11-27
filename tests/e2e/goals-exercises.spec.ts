/**
 * Checkpoint 2b end-to-end: My Goals, Exercises, tracking, Today's routine, Home card, Progress.
 * FICTIONAL data only.
 */
import { expect, test, type Page } from '@playwright/test';
import { completeOnboarding, isoDaysAgo } from './helpers';

const DOB = isoDaysAgo(400); // about 13 months old

async function createGoal(page: Page, title: string) {
  await page.goto('./#/growth/goals/my');
  await page.getByTestId('create-goal').click();
  await page.getByLabel('Goal name').fill(title);
  await page.getByTestId('save-goal').click();
  await expect(page.getByTestId('goal-title')).toHaveText(title);
}

async function createExercise(page: Page, opts: { title: string; method?: 'simple' | 'stopwatch' | 'reps'; rule?: 'asNeeded' | 'daily' | 'weekdays'; perDay?: number; provider?: boolean }) {
  await page.goto('./#/growth/exercises/new');
  await page.getByLabel('Exercise name').fill(opts.title);
  if (opts.provider) {
    await page.getByTestId('origin-provider').click();
    await page.getByLabel('Provider name or specialty (optional)').fill('Fictional therapist');
  }
  await page.getByTestId(`method-${opts.method ?? 'simple'}`).click();
  await page.getByTestId(`rule-${opts.rule ?? 'daily'}`).click();
  if (opts.perDay) await page.getByTestId('per-day').fill(String(opts.perDay));
  await page.getByTestId('save-exercise').click();
  await expect(page.getByTestId('exercise-title')).toHaveText(opts.title);
}

test.beforeEach(async ({ page }) => {
  await completeOnboarding(page, { dob: DOB, name: 'Sample Child A' });
});

test('Growth → Goals & Exercises is live and leads to My Goals and Exercises, in order', async ({ page }) => {
  await page.goto('./#/growth');
  await expect(page.getByTestId('growth-sections').locator('.title-3')).toHaveText(['Progress', 'Milestone Library', 'Goals & Exercises', 'What to Expect at Every Age']);
  await page.getByTestId('section-goals').click();
  await expect(page).toHaveURL(/#\/growth\/goals$/);
  const cards = page.getByTestId('goals-sections');
  // Retrying assertions (a non-waiting read right after navigation was intermittently empty).
  await expect(cards.locator('.title-3')).toHaveText(['My Goals', 'Exercises']);
  await expect(cards.getByTestId('section-subtitle')).toHaveText(['Set personal goals and celebrate achievements.', 'Discover activities and build your own routines.']);
  await expect(page.getByTestId('section-my-goals').getByTestId('section-live')).toHaveText('Nothing added yet');
  await expect(page.getByTestId('section-exercises').getByTestId('section-live')).toHaveText('Nothing scheduled today');
});

test('goal lifecycle: create, accomplish, correct, reopen, archive and delete; no progress bars on goals', async ({ page }) => {
  await createGoal(page, 'Fictional goal: stack blocks');
  await expect(page.getByTestId('goal-status')).toHaveText('Working toward');
  await expect(page.locator('.meter')).toHaveCount(0);
  await page.getByTestId('mark-accomplished').click();
  await page.getByLabel('Date accomplished').fill(isoDaysAgo(0));
  await page.getByTestId('confirm-accomplished').click();
  await expect(page.getByTestId('goal-status')).toHaveText('Accomplished');
  await page.goto('./#/growth/goals/my');
  await expect(page.getByTestId('accomplishment-row')).toHaveCount(1);
  await expect(page.getByTestId('working-toward').getByTestId('goal-row')).toHaveCount(0);
  await page.getByTestId('accomplishment-row').click();
  await page.getByTestId('reopen-goal').click();
  await expect(page.getByTestId('goal-status')).toHaveText('Working toward');
  await page.getByTestId('manage-item').locator('summary').click();
  await page.getByTestId('archive-item').click();
  await page.goto('./#/growth/goals/my');
  await expect(page.getByTestId('working-toward').getByTestId('goal-row')).toHaveCount(0);
  await page.getByTestId('archived-goals').locator('summary').click();
  await page.getByTestId('archived-goals').getByTestId('goal-row').click();
  await page.getByTestId('manage-item').locator('summary').click();
  await page.getByTestId('delete-item').click();
  await expect(page.getByTestId('delete-effects')).toContainText('permanently deleted');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByTestId('confirm-delete').click();
  await expect(page.getByTestId('saved-text')).toContainText('permanently deleted');
  await expect(page.getByTestId('goals-empty')).toBeVisible();
});

test('a standalone achievement has no goal or start date and is counted once', async ({ page }) => {
  await page.goto('./#/growth/goals/achievement/new');
  await page.getByLabel('What happened?').fill('Fictional first steps on the beach');
  await page.getByLabel('Date', { exact: true }).fill(isoDaysAgo(3));
  await page.getByTestId('save-achievement').click();
  await expect(page.getByTestId('goal-status')).toHaveText('Achievement');
  await expect(page.getByTestId('goal-dates')).toHaveCount(0);
  await page.goto('./#/growth/goals/my');
  await expect(page.getByTestId('accomplishment-row')).toHaveCount(1);
  await expect(page.getByTestId('working-toward').getByTestId('goal-row')).toHaveCount(0);
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('pp-accomplishments')).toHaveText('1');
  await expect(page.getByTestId('pp-active')).toHaveText('0');
});

test('inspiration: starting from a milestone links it without changing the milestone', async ({ page }) => {
  await page.goto('./#/growth/goals/ideas');
  // R-010: the generic examples became age-responsive ideas; the disclaimer is kept (reworded).
  await expect(page.getByTestId('idea-disclaimer')).toContainText('aren’t CDC milestones, recommendations from CDC or any medical organization');
  await page.getByLabel('Search milestones').fill('Walks');
  await page.getByTestId('idea-milestones').locator('a').first().click();
  await expect(page.getByLabel('Goal name')).not.toHaveValue('');
  await page.getByTestId('save-goal').click();
  await expect(page.getByTestId('related-milestone')).toBeVisible();
  await page.getByTestId('related-milestone').locator('a').click();
  await expect(page.getByTestId('milestone-detail')).toBeVisible();
  await expect(page.locator('.status-badge')).toHaveText('Not yet observed');
});

test('simple exercise: Today’s routine, one tap, undo, and the Home card use the same numbers', async ({ page }) => {
  await createExercise(page, { title: 'Fictional block play', method: 'simple', rule: 'daily', perDay: 2 });
  await page.goto('./#/growth/exercises');
  await expect(page.getByTestId('daily-count')).toHaveText('0 of 2 sessions done');
  await page.getByTestId('routine-complete').click();
  await expect(page.getByTestId('daily-count')).toHaveText('1 of 2 sessions done');
  await page.getByTestId('undo').click();
  await expect(page.getByTestId('daily-count')).toHaveText('0 of 2 sessions done');
  await page.getByTestId('routine-complete').click();
  await page.getByTestId('routine-complete').click();
  await expect(page.getByTestId('daily-count')).toHaveText('2 of 2 sessions done');
  await expect(page.getByTestId('routine-done')).toBeVisible();
  await page.getByTestId('routine-another').click(); // additional session never inflates the bar
  await expect(page.getByTestId('daily-count')).toHaveText('2 of 2 sessions done');
  await page.goto('./#/home');
  await expect(page.getByTestId('home-exercises').getByTestId('daily-count')).toHaveText('2 of 2 sessions done');
  await expect(page.getByTestId('home-exercises')).not.toContainText('Fictional block play');
  await page.getByTestId('view-todays-routine').click();
  await expect(page).toHaveURL(/#\/growth\/exercises\/today$/);
  await expect(page.getByTestId('todays-routine')).toBeInViewport();
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('pp-sessions')).toHaveText('3');
});

test('no Home card and a friendly empty routine when nothing is scheduled today', async ({ page }) => {
  await createExercise(page, { title: 'Fictional as-needed play', method: 'simple', rule: 'asNeeded' });
  await page.goto('./#/home');
  await expect(page.getByTestId('home-progress')).toBeVisible();
  await expect(page.getByTestId('home-exercises')).toHaveCount(0);
  await page.goto('./#/growth/exercises');
  await expect(page.getByTestId('routine-empty')).toBeVisible();
  await expect(page.getByTestId('daily-bar')).toHaveCount(0);
});

test('stopwatch: start, pause, resume, target reached without stopping, save captures the time', async ({ page }) => {
  await page.clock.install();
  await page.goto('./#/growth/exercises/new');
  await page.getByLabel('Exercise name').fill('Fictional tummy time');
  await page.getByTestId('method-stopwatch').click();
  await page.getByLabel('Minutes').fill('0');
  await page.getByLabel('Seconds').fill('30');
  await page.getByTestId('rule-daily').click();
  await page.getByTestId('save-exercise').click();
  await expect(page.getByTestId('exercise-title')).toHaveText('Fictional tummy time');
  await page.goto('./#/growth/exercises');
  await page.getByTestId('routine-start').click();
  await expect(page.getByTestId('stopwatch')).toHaveText('00:00');
  await page.getByTestId('sw-start').click();
  await page.clock.runFor(20_000);
  await page.getByTestId('sw-pause').click();
  await expect(page.getByTestId('stopwatch')).toHaveText('00:20');
  await page.clock.runFor(60_000); // paused: no change
  await expect(page.getByTestId('stopwatch')).toHaveText('00:20');
  await page.getByTestId('sw-resume').click();
  await page.clock.runFor(15_000);
  await expect(page.getByTestId('stopwatch')).toHaveText('00:35');
  await expect(page.getByTestId('stopwatch-sub')).toContainText('Target reached');
  await page.clock.runFor(5_000);
  await expect(page.getByTestId('stopwatch')).toHaveText('00:40'); // keeps counting
  await expect(page.getByTestId('daily-count')).toHaveText('0 of 1 session done'); // nothing recorded automatically
  await page.getByTestId('save-session').click();
  await expect(page.getByTestId('undo-banner')).toContainText('40 seconds');
  await expect(page.getByTestId('daily-count')).toHaveText('1 of 1 session done');
});

test('stopwatch keeps running across a reload and offers recovery options', async ({ page }) => {
  await page.clock.install();
  await createExercise(page, { title: 'Fictional stretch', method: 'stopwatch', rule: 'daily' });
  await page.goto('./#/growth/exercises');
  await page.getByTestId('routine-start').click();
  await page.getByTestId('sw-start').click();
  await page.clock.runFor(10_000);
  await page.reload();
  await page.clock.runFor(5_000);
  await expect(page.getByTestId('routine-start')).toHaveText('Continue');
  await page.getByTestId('routine-start').click();
  await expect(page.getByTestId('recovery-notice')).toBeVisible();
  await expect(page.getByTestId('stopwatch')).toHaveText(/00:1[5-6]/);
  await page.getByRole('button', { name: 'Pause' }).first().click();
  await expect(page.getByTestId('sw-resume')).toBeVisible();
});

test('repetition counter: never negative, persists, target prompts without saving', async ({ page }) => {
  await page.goto('./#/growth/exercises/new');
  await page.getByLabel('Exercise name').fill('Fictional leg exercise');
  await page.getByTestId('origin-provider').click();
  await page.getByTestId('method-reps').click();
  await page.getByLabel('Target repetitions (optional)').fill('3');
  await page.getByTestId('rule-daily').click();
  await page.getByTestId('save-exercise').click();
  await expect(page.getByTestId('provider-note')).toBeVisible();
  await page.goto('./#/growth/exercises');
  await page.getByTestId('routine-start').click();
  await expect(page.getByTestId('rep-minus')).toBeDisabled();
  for (let i = 0; i < 3; i++) await page.getByTestId('rep-plus').click();
  await expect(page.getByTestId('counter')).toContainText('Count: 3 /');
  await expect(page.getByTestId('counter-sub')).toContainText('Target reached');
  // Test defect fixed at 2b-R (BUILD_LOG #52): wait until the third tap is stored before reloading, and
  // check the exact count (the target “/ 3” alone used to satisfy toContainText('3')).
  await expect.poll(() => page.evaluate(() => new Promise<number>((resolve) => {
    const r = indexedDB.open('roll-crawl-run');
    r.onsuccess = () => {
      const q = r.result.transaction('trackerState', 'readonly').objectStore('trackerState').getAll();
      q.onsuccess = () => { r.result.close(); resolve((q.result as Array<{ count: number }>)[0]?.count ?? -1); };
    };
  }))).toBe(3);
  await page.reload();
  await page.getByTestId('routine-start').click();
  await expect(page.getByTestId('counter')).toContainText('Count: 3 /');
  await page.getByTestId('rep-minus').click();
  await page.getByTestId('save-session').click();
  await expect(page.getByTestId('undo-banner')).toContainText('2 repetitions');
});

test('Browse Exercises defaults to the most recent CDC age, areas collapsed; adopting keeps CDC safety', async ({ page }) => {
  await page.goto('./#/growth/exercises/browse');
  await expect(page.getByTestId('browse-age')).toHaveValue('12');
  for (const id of ['gross-motor', 'fine-motor', 'cognitive', 'language-communication', 'social-emotional']) {
    await expect(page.getByTestId(`area-${id}`).locator('button[aria-expanded]')).toHaveAttribute('aria-expanded', 'false');
  }
  await page.getByTestId('browse-age').selectOption('2');
  await page.getByTestId('area-gross-motor').locator('button').click();
  await page.getByTestId('area-gross-motor').getByTestId('activity-row').first().click();
  await expect(page.getByTestId('activity-title')).toHaveText('Tummy time with toys');
  await expect(page.getByTestId('safety-sentence').first()).toContainText('Do not leave your baby alone');
  // Parent-facing wording is gender-neutral (CDC's original is available, collapsed, for reference).
  await expect(page.getByTestId('activity-instructions')).not.toContainText(/\b(he|she|him|his|her)\b/);
  await expect(page.getByTestId('page-guidance')).not.toContainText(/\b(he|she|him|his|her)\b/);
  await page.getByTestId('add-to-my-exercises').click();
  await page.getByTestId('save-exercise').click();
  await expect(page.getByTestId('exercise-origin')).toHaveText('From CDC’s activity tips');
  await expect(page.getByTestId('activity-safety')).toContainText('Do not leave your baby alone');
});

test('a fine-motor area with no CDC tip says so instead of inventing one', async ({ page }) => {
  await page.goto('./#/growth/exercises/browse/2');
  await page.getByTestId('area-fine-motor').locator('button').click();
  await expect(page.getByTestId('area-fine-motor').getByTestId('area-empty')).toBeVisible();
});

test('Progress keeps its cards and adds Personal progress and Progress over time', async ({ page }) => {
  await page.goto('./#/growth/progress');
  await expect(page.getByTestId('progress-headline')).toBeVisible();
  await expect(page.getByTestId('personal-progress')).toBeVisible();
  await page.getByTestId('view-over-time').click();
  await expect(page.getByTestId('progress-history')).toHaveAttribute('data-view', 'milestones');
  await expect(page.getByTestId('chart-bar')).toHaveCount(6);
  await page.getByTestId('history-period').getByRole('button', { name: '1 year' }).click();
  await expect(page.getByTestId('chart-bar')).toHaveCount(12);
  await page.getByTestId('history-views').getByRole('button', { name: 'Exercises' }).click();
  await expect(page.getByTestId('progress-history')).toHaveAttribute('data-view', 'exercises');
  await page.getByTestId('chart-table').locator('summary').click();
  await expect(page.getByTestId('chart-table')).toContainText('Not tracked yet');
});
