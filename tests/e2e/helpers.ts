import { expect, type Page } from '@playwright/test';

/** Fictional test data only. */
export async function completeOnboarding(page: Page, opts: { dob?: string; name?: string; theme?: string } = {}) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill(opts.dob ?? '2025-03-14');
  await page.getByRole('button', { name: 'Continue' }).click();
  if (opts.name) await page.getByLabel('Name or nickname').fill(opts.name);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click(); // corrected age: left unanswered = not used
  if (opts.theme) await page.getByTestId(`theme-${opts.theme}`).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
}

export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
