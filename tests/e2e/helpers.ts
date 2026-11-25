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

/** From a profile's edit screen: open Advanced profile management and delete through both confirmation steps. */
export async function deleteProfile(page: Page, phrase = 'DELETE PROFILE') {
  await page.getByRole('button', { name: 'Advanced profile management' }).click();
  await page.getByRole('button', { name: 'Delete this profile…' }).click();
  const cont = page.getByRole('button', { name: 'Continue' });
  await expect(cont).toBeDisabled();
  await expect(page.getByRole('checkbox')).toBeChecked(); // remove from internal copies: checked by default
  await page.getByLabel('Type DELETE PROFILE to continue').fill(phrase);
  await cont.click();
  await page.getByRole('button', { name: /^Yes, delete/ }).click();
}

export async function addChild(page: Page, name: string, dob: string) {
  await page.goto('./#/profiles/new');
  await page.getByLabel('Name or nickname (optional)').fill(name);
  await page.getByLabel('Date of birth').fill(dob);
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
}
