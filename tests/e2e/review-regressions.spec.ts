/**
 * Regression tests for issues found in the Checkpoint 1 hands-on review.
 * Fictional data only.
 */
import { expect, test, type Page } from '@playwright/test';
import { addChild, completeOnboarding, isoDaysAgo } from './helpers';

async function expectInsideViewport(page: Page, selector: string) {
  const r = await page.locator(selector).evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { top: b.top, left: b.left, bottom: b.bottom, right: b.right, vw: document.documentElement.clientWidth, vh: window.innerHeight };
  });
  expect(r.top, 'top edge inside viewport').toBeGreaterThanOrEqual(0);
  expect(r.left, 'left edge inside viewport').toBeGreaterThanOrEqual(0);
  expect(r.bottom, 'bottom edge inside viewport').toBeLessThanOrEqual(r.vh);
  expect(r.right, 'right edge inside viewport').toBeLessThanOrEqual(r.vw);
  return r;
}

// ---------------------------------------------------------------------------
// Child selector (observed defect: opened above the top of the window on desktop)
// ---------------------------------------------------------------------------

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 700 },
];

for (const vp of VIEWPORTS) {
  test(`child selector opens downward inside the viewport on every tab at ${vp.width}×${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await completeOnboarding(page, { name: 'Sample Child A' });
    await addChild(page, 'Sample Child B', '2023-04-10');
    for (const tab of ['home', 'growth', 'calendar', 'journal', 'resources']) {
      await page.goto(`./#/${tab}`);
      await page.getByTestId('child-chip').click();
      const panel = page.getByTestId('child-switcher');
      await expect(panel).toBeVisible();
      await page.waitForTimeout(300); // let the open animation finish
      const r = await expectInsideViewport(page, '[data-testid="child-switcher"]');
      const header = await page.locator('.topbar').evaluate((el) => el.getBoundingClientRect().bottom);
      expect(r.top, 'opens below the top bar (downward)').toBeGreaterThanOrEqual(header);
      await page.keyboard.press('Escape');
      await expect(panel).toHaveCount(0);
    }
  });
}

test('child selector stays inside the viewport even if the top bar becomes a positioning container (the original root cause)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await completeOnboarding(page, { name: 'Sample Child A' });
  // Some browsers (observed on the reviewer's Mac) treat the top bar's backdrop blur as the containing block
  // for fixed-position children. A transform forces the same behavior in Chromium.
  await page.addStyleTag({ content: '.topbar { transform: translateZ(0); }' });
  await page.getByTestId('child-chip').click();
  await page.waitForTimeout(300);
  await expectInsideViewport(page, '[data-testid="child-switcher"]');
  // The dimmed backdrop must cover the whole window, not just the top bar.
  const scrim = await page.locator('.popover-scrim').evaluate((el) => el.getBoundingClientRect().height);
  expect(scrim).toBe(800);
});

test('child selector aligns near the top of the profile card on Home', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await completeOnboarding(page, { name: 'Sample Child A' });
  const cardTop = await page.locator('section.card').first().evaluate((el) => el.getBoundingClientRect().top);
  const avatarTop = await page.locator('.child-hero .avatar').evaluate((el) => el.getBoundingClientRect().top);
  await page.getByTestId('child-chip').click();
  await page.waitForTimeout(300);
  const top = await page.getByTestId('child-switcher').evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(cardTop - 24);
  expect(top).toBeLessThanOrEqual(avatarTop + 8);
});

test('child selector with many profiles scrolls inside and every child is reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await completeOnboarding(page, { name: 'Sample Child 1' });
  for (let i = 2; i <= 9; i++) await addChild(page, `Sample Child ${i}`, isoDaysAgo(100 * i));
  await page.goto('./#/growth');
  await page.getByTestId('child-chip').click();
  await page.waitForTimeout(300);
  await expectInsideViewport(page, '[data-testid="child-switcher"]');
  const list = page.locator('.popover-list');
  const { scrollHeight, clientHeight } = await list.evaluate((el) => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));
  expect(scrollHeight).toBeGreaterThan(clientHeight); // internal scrolling is in use
  const last = page.getByRole('radio', { name: /Sample Child 1$/ });
  await last.scrollIntoViewIfNeeded();
  await last.click();
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child 1');
});

test('child selector keyboard: focus starts on the current child, arrows move, Tab is trapped, Escape returns focus', async ({ page }) => {
  await completeOnboarding(page, { name: 'Sample Child A' });
  await addChild(page, 'Sample Child B', '2023-04-10');
  const chip = page.getByTestId('child-chip');
  await chip.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('radio', { name: /Sample Child B/ })).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('radio', { name: /Sample Child A/ })).toBeFocused();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => !!document.activeElement?.closest('[data-testid="child-switcher"]'));
    expect(inside, `focus stays inside after ${i + 1} Tab presses`).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(chip).toBeFocused();
  // Enter on a focused child selects it
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(chip).toContainText('Sample Child A');
});

// ---------------------------------------------------------------------------
// Settings accordions
// ---------------------------------------------------------------------------

// Checkpoint 3: “Calendar & Reminders” became “Calendar” (reminders are not part of the Simplified Calendar).
const SECTIONS = ['Your Data', 'Calendar', 'This Device', 'About'];

test('Settings: Profiles and Appearance are open; the four other sections start collapsed', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('./#/settings');
  await expect(page.getByRole('heading', { name: 'Profiles' })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Color theme' })).toBeVisible();
  for (const name of SECTIONS) {
    const trigger = page.getByRole('button', { name: new RegExp(`^${name.replace('&', '\\&')}`) });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  }
  // Reset is not visible in the primary presentation.
  await expect(page.getByRole('button', { name: /Erase all app data/ })).toHaveCount(0);
});

test('Settings accordions: click anywhere on the header, several open at once, keyboard toggles', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('./#/settings');
  const data = page.getByRole('button', { name: /^Your Data/ });
  // Click on the summary text (not the title) — the whole header is the control.
  await page.getByText('Saving, storage, privacy, and backups').click();
  await expect(data).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('autosave-note')).toBeVisible();
  await expect(page).toHaveURL(/#\/settings$/); // expanded in place, no navigation

  const device = page.getByRole('button', { name: /^This Device/ });
  await device.focus();
  await page.keyboard.press('Enter');
  await expect(device).toHaveAttribute('aria-expanded', 'true');
  await expect(data).toHaveAttribute('aria-expanded', 'true'); // both open
  await page.keyboard.press(' ');
  await expect(device).toHaveAttribute('aria-expanded', 'false');

  // aria-controls points to the panel, and the chevron rotates when open
  const panelId = await data.getAttribute('aria-controls');
  await expect(page.locator(`#${panelId?.replace(/:/g, '\\:')}`)).toBeVisible();
  const rotation = await page.locator('[data-testid="acc-data"] > .accordion-heading .accordion-chevron').evaluate((el) => getComputedStyle(el).transform);
  expect(rotation).not.toBe('none');

  await data.click();
  await expect(data).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('autosave-note')).toBeHidden();
});

test('Settings: device name still saves from inside its accordion', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('./#/settings');
  await page.getByRole('button', { name: /^This Device/ }).click();
  await page.getByLabel('Device name (optional)').fill('Phone A');
  await page.getByRole('button', { name: 'Save device name' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved');
  await page.reload();
  await page.getByRole('button', { name: /^This Device/ }).click();
  await expect(page.getByLabel('Device name (optional)')).toHaveValue('Phone A');
});

// ---------------------------------------------------------------------------
// Destructive actions: restrained, two-step, cancellation changes nothing
// ---------------------------------------------------------------------------

async function storedSnapshot(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const req = indexedDB.open('roll-crawl-run');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const stores = ['children', 'settings', 'meta', 'photos', 'backups'];
          const tx = db.transaction(stores, 'readonly');
          const out: Record<string, unknown> = {};
          let pending = stores.length;
          for (const s of stores) {
            const r = tx.objectStore(s).getAll();
            r.onsuccess = () => {
              out[s] = s === 'settings' ? (r.result as Array<Record<string, unknown>>).map(({ updatedAt: _u, ...rest }) => rest) : r.result.map((x: Record<string, unknown>) => ({ ...x, blob: undefined }));
              if (--pending === 0) {
                db.close();
                resolve(JSON.stringify(out));
              }
            };
          }
        };
      }),
  );
}

test('cancelling a reset at either step leaves all information unchanged', async ({ page }) => {
  await completeOnboarding(page, { name: 'Sample Child A' });
  await addChild(page, 'Sample Child B', '2023-04-10');
  const before = await storedSnapshot(page);
  await page.goto('./#/settings');
  await page.getByRole('button', { name: /^Your Data/ }).click();
  const advanced = page.getByRole('button', { name: 'Advanced data management' });
  await expect(advanced).toHaveAttribute('aria-expanded', 'false');
  await advanced.click();
  // Step 1 → cancel
  await page.getByRole('button', { name: 'Erase all app data…' }).click();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  await page.getByLabel('Type RESET to continue').fill('RESET');
  await page.getByRole('button', { name: 'Cancel — keep my data' }).click();
  expect(await storedSnapshot(page)).toBe(before);
  // Step 2 → cancel
  await page.getByRole('button', { name: 'Erase all app data…' }).click();
  await page.getByLabel('Type RESET to continue').fill('reset');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Final confirmation' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel — keep my data' }).click();
  // Escape also cancels
  await page.getByRole('button', { name: 'Erase all app data…' }).click();
  await page.keyboard.press('Escape');
  expect(await storedSnapshot(page)).toBe(before);
  await page.goto('./#/home');
  await expect(page.getByTestId('child-chip')).toBeVisible();
});

test('profile deletion: hidden under Advanced, identifies the child, needs DELETE PROFILE and a final step; cancel changes nothing', async ({ page }) => {
  await completeOnboarding(page, { name: 'Sample Child A' });
  await addChild(page, 'Sample Child B', '2023-04-10');
  const before = await storedSnapshot(page);
  await page.goto('./#/profiles');
  await page.getByRole('link', { name: 'Edit Sample Child B' }).click();
  await expect(page.getByRole('button', { name: 'Delete this profile…' })).toHaveCount(0); // collapsed by default
  await page.getByRole('button', { name: 'Advanced profile management' }).click();
  await page.getByRole('button', { name: 'Delete this profile…' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByTestId('delete-identity')).toContainText('Sample Child B');
  await expect(dialog.getByTestId('delete-identity')).toContainText('Born April 10, 2023');
  await expect(dialog).toContainText('journal entries');
  await expect(dialog.getByRole('checkbox')).toBeChecked();
  // The old single word is no longer enough
  await page.getByLabel('Type DELETE PROFILE to continue').fill('DELETE');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  await page.getByLabel('Type DELETE PROFILE to continue').fill('DELETE PROFILE');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Final confirmation' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel — keep profile' }).click();
  expect(await storedSnapshot(page)).toBe(before);

  // Unchecking the backup option explains the consequence
  await page.getByRole('button', { name: 'Delete this profile…' }).click();
  await page.getByRole('checkbox').uncheck();
  await expect(page.getByRole('dialog')).toContainText('will stay inside the app’s internal safety copies');
  await page.getByRole('button', { name: 'Cancel — keep profile' }).click();
  expect(await storedSnapshot(page)).toBe(before);
});

// ---------------------------------------------------------------------------
// Keyboard accessibility: focus trapping and radio arrow keys
// ---------------------------------------------------------------------------

test('dialogs trap keyboard focus', async ({ page }) => {
  await completeOnboarding(page, { name: 'Sample Child A' });
  await page.goto('./#/profiles');
  await page.getByRole('link', { name: 'Edit Sample Child A' }).click();
  await page.getByRole('button', { name: 'Advanced profile management' }).click();
  await page.getByRole('button', { name: 'Delete this profile…' }).click();
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(key);
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    }
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Delete this profile…' })).toBeFocused();
});

test('theme picker supports arrow keys with one Tab stop', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('./#/settings');
  const earth = page.getByTestId('theme-earth');
  await expect(earth).toHaveAttribute('tabindex', '0');
  await expect(page.getByTestId('theme-sky')).toHaveAttribute('tabindex', '-1');
  await earth.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('theme-sky')).toBeFocused();
  await expect(page.getByTestId('theme-sky')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sky');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft'); // wraps to the last theme
  await expect(page.getByTestId('theme-sage')).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sage');
  await page.keyboard.press('Home');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'earth');
});

test('corrected-age choices support arrow keys', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill('2025-01-01');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  const no = page.getByRole('radio', { name: /^No/ });
  await no.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: /^Yes/ })).toBeFocused();
  await expect(page.getByRole('radio', { name: /^Yes/ })).toHaveAttribute('aria-checked', 'true');
});

// ---------------------------------------------------------------------------
// Typography, wording, layout
// ---------------------------------------------------------------------------

test('Home shows the child’s name and age in Inter without “Chronological age”', async ({ page }) => {
  await completeOnboarding(page, { name: 'Jules Sample' });
  const nameFont = await page.locator('#child-heading').evaluate((el) => getComputedStyle(el).fontFamily);
  const ageFont = await page.getByTestId('chronological-age').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(nameFont.startsWith('Inter')).toBe(true);
  expect(ageFont.startsWith('Inter')).toBe(true);
  await expect(page.getByText(/Chronological age/i)).toHaveCount(0);
});

test('Growth uses the approved wording and section order', async ({ page }) => {
  // Checkpoint 2a replacement: the placeholder cards became the real Growth landing page; same order and wording.
  await completeOnboarding(page);
  await page.goto('./#/growth');
  await expect(page.getByText('Tracking your developmental milestones.')).toBeVisible();
  const titles = await page.locator('[data-testid="growth-sections"] .title-3').allTextContents();
  // Growth UX refinement: owner-approved new order (Review → Record → Support → Learn); no development terms in the app.
  expect(titles).toEqual(['Progress', 'Milestone Library', 'Goals & Exercises', 'What to Expect at Every Age']);
  // Updated at Checkpoint 2b: Goals & Exercises is live (it was a “Coming soon” placeholder until then).
  await expect(page.getByTestId('section-goals').getByTestId('section-subtitle')).toHaveText('Know what to work on.');
  await page.goto('./#/resources');
  await expect(page.getByText('A curated library of trusted, science-backed resources.')).toBeVisible();
});

for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`privacy step has extra space between heading and information card at ${vp.width}px`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('./');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByLabel('Date of birth').fill('2025-01-01');
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Continue' }).click();
    const gap = await page.evaluate(() => {
      const h = document.querySelector('h1')!.getBoundingClientRect();
      const list = document.querySelector('.privacy-list')!.getBoundingClientRect();
      return list.top - h.bottom;
    });
    expect(gap).toBeGreaterThanOrEqual(40); // was 24px
    expect(gap).toBeLessThanOrEqual(56);
  });
}

test('narrow phone (320px): Home name, age, and Settings fit without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await completeOnboarding(page, { name: 'Jules Sample With A Long Family Name' });
  for (const path of ['./#/home', './#/settings']) {
    await page.goto(path);
    if (path.endsWith('settings')) for (const n of SECTIONS) await page.getByRole('button', { name: new RegExp(`^${n.replace('&', '\\&')}`) }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  }
});
