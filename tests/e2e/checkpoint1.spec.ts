import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { completeOnboarding, deleteProfile, isoDaysAgo } from './helpers';

test('first-run onboarding leads to Home and is not repeated after reload', async ({ page }) => {
  await completeOnboarding(page, { name: 'Sample Child A' });
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  await expect(page.getByTestId('chronological-age')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Get started' })).toHaveCount(0);
});

test('date of birth: future and empty dates are rejected', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Please enter a date of birth.')).toBeVisible();
  const tomorrow = isoDaysAgo(-1);
  await page.getByLabel('Date of birth').fill(tomorrow);
  await expect(page.getByText('The date of birth can’t be in the future.')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'When was your child born?' })).toBeVisible();
});

test('name, photo, and corrected age before the due date', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill(isoDaysAgo(10));
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill('Sample Child B');
  // Fictional 1×1 PNG photo
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  await page.getByTestId('photo-input').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByRole('button', { name: 'Remove photo' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
  await page.getByRole('button', { name: 'Weeks at birth' }).click();
  await page.getByLabel('Weeks', { exact: true }).selectOption('30');
  await expect(page.getByText(/before due date/)).toBeVisible();
  await page.getByRole('radio', { name: /Corrected age \(from due date\)/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();

  await expect(page.getByTestId('chronological-age')).toHaveText('1 week, 3 days');
  // 30w0d at birth → due 70 days after birth; 10 days old → 60 days (8 weeks, 4 days) before due date.
  await expect(page.getByTestId('corrected-age')).toHaveText('8 weeks, 4 days before due date');
  await expect(page.getByText('corrected', { exact: true })).toBeVisible();
  await expect(page.getByText('Chronological age')).toHaveCount(0);
  await expect(page.locator('.child-hero .avatar img')).toBeVisible();
});

test('out-of-range due date is rejected, not altered', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill('2025-01-01');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
  await page.getByLabel('Estimated due date').fill('2025-07-01');
  await expect(page.getByText(/more than 20 weeks after the date of birth/)).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Corrected age' })).toBeVisible();
  await expect(page.getByLabel('Estimated due date')).toHaveValue('2025-07-01');
});

test('theme selection applies everywhere and persists', async ({ page }) => {
  await completeOnboarding(page, { theme: 'sage' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sage');
  await page.getByRole('link', { name: 'Profiles and settings' }).click();
  await page.getByTestId('theme-lavender').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lavender');
  // Lavender --bg #F5F2FA (polled: the background color transitions smoothly)
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(245, 242, 250)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lavender');
});

test('multiple profiles: add, switch, edit, and delete with confirmation', async ({ page }) => {
  await completeOnboarding(page, { name: 'Sample Child A' });
  // Add a second child from the switcher
  await page.getByTestId('child-chip').click();
  await page.getByRole('link', { name: 'Add a child' }).click();
  await page.getByLabel('Name or nickname (optional)').fill('Sample Child B');
  await page.getByLabel('Date of birth').fill('2023-06-01');
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByRole('heading', { name: 'Sample Child B' })).toBeVisible();
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child B');

  // Switching keeps the selection across tabs and reloads
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: /Sample Child A/ }).click();
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  await page.getByRole('link', { name: 'Growth' }).click();
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child A');
  await page.reload();
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child A');

  // Edit
  await page.goto('./#/profiles');
  await page.getByRole('link', { name: 'Edit Sample Child B' }).click();
  await page.getByLabel('Name or nickname (optional)').fill('Sample Child C');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Sample Child C')).toBeVisible();

  // Delete requires typed confirmation
  await page.getByRole('link', { name: 'Edit Sample Child C' }).click();
  await deleteProfile(page, 'delete profile'); // case-insensitive phrase
  await expect(page.getByText('Sample Child C')).toHaveCount(0);
  await expect(page.getByText('Sample Child A')).toBeVisible();
});

test('deleting the only profile asks for a new child instead of breaking', async ({ page }) => {
  await completeOnboarding(page, { name: 'Sample Child A' });
  await page.goto('./#/profiles');
  await page.getByRole('link', { name: 'Edit Sample Child A' }).click();
  await deleteProfile(page);
  await expect(page.getByRole('heading', { name: 'When was your child born?' })).toBeVisible();
  await expect(page.getByText('Add a child')).toBeVisible();
});

test('later-checkpoint tabs are clearly marked as not available', async ({ page }) => {
  await completeOnboarding(page);
  for (const tab of ['Growth', 'Calendar', 'Journal', 'Resources']) {
    await page.getByRole('link', { name: tab, exact: true }).click();
    await expect(page.getByRole('heading', { name: tab, level: 1 })).toBeVisible();
    await expect(page.getByText('Preview only.', { exact: false }).first()).toBeVisible();
  }
});

test('reset erases all data after typed confirmation', async ({ page }) => {
  await completeOnboarding(page, { name: 'Sample Child A' });
  await page.goto('./#/settings');
  await page.getByRole('button', { name: /Your Data/ }).click();
  await page.getByRole('button', { name: 'Advanced data management' }).click();
  await page.getByRole('button', { name: 'Erase all app data…' }).click();
  await page.getByLabel('Type RESET to continue').fill('RESET');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Yes, erase everything' }).click();
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
});

test('storage and privacy disclosures are present', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('./#/settings/storage');
  await expect(page.getByTestId('persist-status')).toBeVisible();
  await expect(page.getByText(/isn’t encrypted or password-protected/)).toBeVisible();
  await page.goto('./#/settings/privacy');
  await expect(page.getByText(/Not a medical record/)).toBeVisible();
});

test('works offline after the first load (service worker)', async ({ page, context }) => {
  await completeOnboarding(page, { name: 'Sample Child A' });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Ensure the page is controlled and the cache is populated.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  await page.getByRole('link', { name: 'Calendar' }).click();
  await expect(page.getByRole('heading', { name: 'Calendar', level: 1 })).toBeVisible();
  // Creating a profile works offline.
  await page.goto('./#/profiles/new').catch(() => undefined);
  await page.getByLabel('Date of birth').fill('2024-05-05');
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByTestId('chronological-age')).toBeVisible();
  await context.setOffline(false);
});

test('manifest is valid for installation', async ({ request }) => {
  const res = await request.get('./manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.name).toBe('Roll, Crawl, RUN: Tracking Growth Together');
  expect(m.short_name).toBe('Roll, Crawl, RUN');
  expect(m.display).toBe('standalone');
  expect(m.start_url).toBe('./');
  for (const icon of m.icons) expect((await request.get(`./${icon.src}`)).ok()).toBe(true);
  expect(m.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true);
});

test('no requests leave the app’s own origin', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (!['localhost', '127.0.0.1'].includes(u.hostname) && !u.protocol.startsWith('data') && !u.protocol.startsWith('blob')) external.push(r.url());
  });
  await completeOnboarding(page, { name: 'Sample Child A' });
  await page.goto('./#/settings');
  expect(external).toEqual([]);
});

for (const [name, path] of [
  ['onboarding', null],
  ['home', './#/home'],
  ['settings', './#/settings'],
  ['profile form', './#/profiles/new'],
  ['growth placeholder', './#/growth'],
] as const) {
  test(`accessibility scan: ${name}`, async ({ page }) => {
    if (path) {
      await completeOnboarding(page, { name: 'Sample Child A' });
      await page.goto(path);
    } else {
      await page.goto('./');
    }
    await page.waitForTimeout(300);
    // `as never`: type-only mismatch between @axe-core/playwright's Page type and Playwright 1.63.
    const results = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} — ${v.help}`)).toEqual([]);
  });
}
