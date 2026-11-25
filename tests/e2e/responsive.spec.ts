import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

for (const width of [320, 390, 768, 1280]) {
  test(`no horizontal scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await completeOnboarding(page, { name: 'Sample Child With A Fairly Long Name' });
    for (const path of ['./#/home', './#/settings', './#/profiles/new', './#/growth']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
}

test('bottom navigation targets are at least 48px tall', async ({ page }) => {
  await completeOnboarding(page);
  const boxes = await page.locator('.navlink').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  expect(boxes).toHaveLength(5);
  for (const h of boxes) expect(h).toBeGreaterThanOrEqual(48);
});
