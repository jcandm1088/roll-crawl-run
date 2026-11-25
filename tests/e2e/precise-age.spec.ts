/**
 * Precise personal age on Home (usability defect found in the owner's acceptance testing:
 * a 2-year-3-month-old was shown as "27 months"). Fictional data; the clock is fixed so
 * results are exact.
 */
import { expect, test, type Page } from '@playwright/test';

const TODAY = new Date('2026-11-25T10:00:00'); // local time

async function onboard(page: Page, dob: string, name: string) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill(dob);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill(name);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
}
async function addChild(page: Page, dob: string, name: string) {
  await page.goto('./#/profiles/new');
  await page.getByLabel('Name or nickname (optional)').fill(name);
  await page.getByLabel('Date of birth').fill(dob);
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
}

const CASES: Array<[string, string]> = [
  ['2026-11-25', '0 days'],
  ['2026-11-08', '17 days'],
  ['2026-10-28', '28 days'],
  ['2026-05-13', '6 months, 12 days'],
  ['2025-11-25', '1 year'],
  ['2025-05-20', '1 year, 6 months, 5 days'],
  ['2024-11-25', '2 years'],
  ['2024-08-25', '2 years, 3 months'],
  ['2024-08-11', '2 years, 3 months, 14 days'],
  ['2023-11-24', '3 years, 1 day'],
  ['2022-03-24', '4 years, 8 months, 1 day'],
];

test('Home shows precise years, months, and days for every age group', async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(TODAY);
  await onboard(page, CASES[0]![0], 'Sample Child 0');
  await expect(page.getByTestId('chronological-age')).toHaveText(CASES[0]![1]);
  for (const [i, [dob, expected]] of CASES.entries()) {
    if (i === 0) continue;
    await addChild(page, dob, `Sample Child ${i}`);
    await expect(page.getByTestId('chronological-age'), dob).toHaveText(expected);
  }
  // The profile list uses the same precise wording.
  await page.goto('./#/profiles');
  await expect(page.getByText('2 years, 3 months, 14 days')).toBeVisible();
  await expect(page.getByText(/\b\d+ months?, \d+ days?\b/).first()).toBeVisible();
  await expect(page.getByText(/\b2[0-9] months\b/)).toHaveCount(0); // never "27 months"
  await expect(page.getByText(/weeks?/)).toHaveCount(0);
});

test('leap-day birthday shows “1 year” on February 28 of a non-leap year', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2025-02-28T09:00:00'));
  await onboard(page, '2024-02-29', 'Sample Leap Child');
  await expect(page.getByTestId('chronological-age')).toHaveText('1 year');
});

test('corrected age uses precise wording and the chronological age stays visible', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-05-10T09:00:00'));
  await page.goto('./');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill('2025-01-01');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill('Sample Child P');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
  await page.getByRole('button', { name: 'Weeks at birth' }).click();
  await page.getByLabel('Weeks', { exact: true }).selectOption('32');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByTestId('chronological-age')).toHaveText('1 year, 4 months, 9 days');
  await expect(page.getByTestId('corrected-age')).toHaveText('1 year, 2 months, 14 days');
  await expect(page.getByText('corrected', { exact: true })).toBeVisible();
});

test('pre-due-date display is unchanged', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-25T09:00:00'));
  await page.goto('./');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill('2026-11-15');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
  await page.getByRole('button', { name: 'Weeks at birth' }).click();
  await page.getByLabel('Weeks', { exact: true }).selectOption('30');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByTestId('chronological-age')).toHaveText('10 days');
  await expect(page.getByTestId('corrected-age')).toHaveText('8 weeks, 4 days before due date');
});

test('age updates at local midnight while the app stays open', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-05-31T23:59:00') });
  await onboard(page, '2025-06-01', 'Sample Child M');
  await expect(page.getByTestId('chronological-age')).toHaveText('11 months, 30 days');
  await page.clock.runFor('02:00'); // cross local midnight
  await expect(page.getByTestId('chronological-age')).toHaveText('1 year');
});

test('age updates when the app resumes after being suspended past midnight', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-05-31T22:00:00') });
  await onboard(page, '2025-06-01', 'Sample Child R');
  await expect(page.getByTestId('chronological-age')).toHaveText('11 months, 30 days');
  // Simulate suspension: the clock jumps forward without timers firing (as when a phone sleeps).
  await page.clock.pauseAt(new Date('2026-05-31T22:00:30'));
  await page.clock.setSystemTime(new Date('2026-06-01T07:30:00'));
  await expect(page.getByTestId('chronological-age')).toHaveText('11 months, 30 days'); // nothing has run yet
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByTestId('chronological-age')).toHaveText('1 year');
});
