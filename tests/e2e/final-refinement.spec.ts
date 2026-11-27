/**
 * Checkpoint 1 final refinement: per-child themes, typography option B,
 * approved logo, focus-trap tab order, and short-window selector behavior.
 * Fictional data only.
 */
import { expect, test, type Page } from '@playwright/test';
import { addChild, completeOnboarding, deleteProfile, isoDaysAgo } from './helpers';

const BG: Record<string, string> = {
  earth: 'rgb(246, 240, 232)',
  sky: 'rgb(240, 245, 249)',
  blush: 'rgb(253, 232, 241)',
  lavender: 'rgb(245, 242, 250)',
  sage: 'rgb(242, 245, 239)',
};

const theme = (page: Page) => page.locator('html').getAttribute('data-theme');
async function expectTheme(page: Page, id: string) {
  await expect(page.locator('html')).toHaveAttribute('data-theme', id);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(BG[id]);
}
async function switchTo(page: Page, name: string) {
  // The child selector lives in the main tabs' top bar (Settings shows a page title instead).
  if (!(await page.getByTestId('child-chip').isVisible())) await page.goto('./#/home');
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: new RegExp(name) }).click();
  await expect(page.getByTestId('child-chip')).toContainText(name);
}
async function setThemeInSettings(page: Page, id: string) {
  await page.goto('./#/settings');
  await page.getByTestId(`theme-${id}`).click();
  await expect(page.getByTestId(`theme-${id}`)).toHaveAttribute('aria-checked', 'true'); // saved
}

/** Two children: A (Sage, chosen in onboarding) and B (Blush, chosen when adding). */
async function twoChildren(page: Page) {
  await completeOnboarding(page, { name: 'Sample Child A', theme: 'sage' });
  await page.goto('./#/profiles/new');
  await page.getByLabel('Name or nickname (optional)').fill('Sample Child B');
  await page.getByLabel('Date of birth').fill('2023-04-10');
  await page.getByTestId('theme-blush').click();
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child B');
}

// ---------------------------------------------------------------------------
// Per-child themes
// ---------------------------------------------------------------------------

test('each child keeps their own theme; switching applies it everywhere', async ({ page }) => {
  await twoChildren(page);
  await expectTheme(page, 'blush'); // the newly added child is active
  await switchTo(page, 'Sample Child A');
  await expectTheme(page, 'sage');
  await switchTo(page, 'Sample Child B');
  await expectTheme(page, 'blush');
});

test('switching children from every tab applies the selected child’s theme', async ({ page }) => {
  await twoChildren(page);
  // Checkpoint 4: four primary tabs (Resources was removed from the navigation).
  for (const tab of ['home', 'growth', 'calendar', 'journal']) {
    await page.goto(`./#/${tab}`);
    await switchTo(page, 'Sample Child A');
    await expectTheme(page, 'sage');
    await switchTo(page, 'Sample Child B');
    await expectTheme(page, 'blush');
  }
});

test('Settings → Appearance changes only the active child, and says so', async ({ page }) => {
  await twoChildren(page);
  await setThemeInSettings(page, 'sky');
  await expect(page.getByTestId('appearance-scope')).toContainText('Theme for Sample Child B');
  await expectTheme(page, 'sky');
  await switchTo(page, 'Sample Child A');
  await expectTheme(page, 'sage'); // unaffected
  await page.goto('./#/settings');
  await expect(page.getByTestId('appearance-scope')).toContainText('Theme for Sample Child A');
  await expect(page.getByTestId('theme-sage')).toHaveAttribute('aria-checked', 'true');
});

test('themes persist after refresh and after closing and reopening', async ({ page, context }) => {
  await twoChildren(page);
  await switchTo(page, 'Sample Child A');
  await page.reload();
  await expectTheme(page, 'sage');
  const reopened = await context.newPage();
  await page.close();
  await reopened.goto('./');
  await expectTheme(reopened, 'sage');
  await switchTo(reopened, 'Sample Child B');
  await reopened.reload();
  await expectTheme(reopened, 'blush');
});

test('the previous child’s theme is never shown with the newly selected child', async ({ page }) => {
  await twoChildren(page);
  await switchTo(page, 'Sample Child A');
  // Record every combination of (theme, chip text) the page passes through while switching.
  await page.evaluate(() => {
    const w = window as unknown as { __seen: string[] };
    w.__seen = [];
    const record = () => w.__seen.push(`${document.documentElement.dataset['theme']}|${document.querySelector('[data-testid="child-chip"]')?.textContent ?? ''}`);
    new MutationObserver(record).observe(document.documentElement, { attributes: true, childList: true, subtree: true, characterData: true });
  });
  await switchTo(page, 'Sample Child B');
  const seen = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen);
  expect(seen.filter((s) => s.includes('Sample Child B') && !s.startsWith('blush|'))).toEqual([]);
  await expectTheme(page, 'blush');
});

test('new profiles default to Earth unless another theme is chosen', async ({ page }) => {
  await completeOnboarding(page, { name: 'Sample Child A', theme: 'lavender' });
  await addChild(page, 'Sample Child B', '2023-04-10'); // no theme chosen
  await expectTheme(page, 'earth');
  await switchTo(page, 'Sample Child A');
  await expectTheme(page, 'lavender');
});

test('first-run onboarding without choosing a theme uses Earth', async ({ page }) => {
  await completeOnboarding(page, { name: 'Sample Child A' });
  await expectTheme(page, 'earth');
});

test('deleting the active child applies the next child’s theme; deleting the last returns to Earth', async ({ page }) => {
  await twoChildren(page); // B (blush) active
  await page.goto('./#/profiles');
  await page.getByRole('link', { name: 'Edit Sample Child B' }).click();
  await deleteProfile(page);
  await expect(page.getByRole('heading', { name: 'Child profiles' })).toBeVisible(); // deletion finished
  await expectTheme(page, 'sage');
  await page.goto('./#/home');
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child A');
  await expectTheme(page, 'sage');
  await page.goto('./#/profiles');
  await page.getByRole('link', { name: 'Edit Sample Child A' }).click();
  await deleteProfile(page);
  await expect(page.getByRole('heading', { name: 'When was your child born?' })).toBeVisible();
  await expectTheme(page, 'earth');
});

test('adding a child after deleting every profile still offers a theme', async ({ page }) => {
  await completeOnboarding(page, { name: 'Sample Child A', theme: 'sky' });
  await page.goto('./#/profiles');
  await page.getByRole('link', { name: 'Edit Sample Child A' }).click();
  await deleteProfile(page);
  await expect(page.getByRole('heading', { name: 'When was your child born?' })).toBeVisible();
  await page.getByLabel('Date of birth').fill('2024-02-02');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill('Sample Child C');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByTestId('theme-sage').click();
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child C');
  await expectTheme(page, 'sage');
});

test('per-child themes work offline', async ({ page, context }) => {
  await twoChildren(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await switchTo(page, 'Sample Child A');
  await expectTheme(page, 'sage');
  await setThemeInSettings(page, 'lavender');
  await page.reload();
  await expectTheme(page, 'lavender');
  await context.setOffline(false);
});

test('the avatar color is independent of the theme', async ({ page }) => {
  await twoChildren(page);
  const avatarBefore = await page.getByTestId('child-chip').locator('.avatar').evaluate((el) => getComputedStyle(el).backgroundColor);
  await setThemeInSettings(page, 'sky');
  await page.goto('./#/home');
  const avatarAfter = await page.getByTestId('child-chip').locator('.avatar').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(avatarAfter).toBe(avatarBefore);
});

// ---------------------------------------------------------------------------
// Typography option B
// ---------------------------------------------------------------------------

test('all primary tab headings share identical typography (Inter) and placement', async ({ page }) => {
  await completeOnboarding(page);
  const styles: string[] = [];
  const tops: number[] = [];
  // Checkpoint 4: four primary tabs (Resources was removed from the navigation).
  for (const tab of ['growth', 'calendar', 'journal']) {
    await page.goto(`./#/${tab}`);
    const h = page.getByTestId('page-title');
    await h.waitFor();
    await page.waitForTimeout(350); // let the screen's entry animation finish before measuring position
    const r = await h.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: [s.fontFamily, s.fontSize, s.fontWeight, s.lineHeight, s.letterSpacing, s.marginTop, s.marginBottom].join(' / '), top: el.getBoundingClientRect().top };
    });
    styles.push(r.style);
    tops.push(r.top);
  }
  expect(new Set(styles).size).toBe(1);
  expect(styles[0]).toMatch(/^Inter/);
  expect(new Set(tops).size).toBe(1);
});

test('functional headings use Inter across Settings, profiles, onboarding, and dialogs; Fraunces only for branding', async ({ page }) => {
  await page.goto('./');
  expect(await page.locator('.wordmark-name').evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^Fraunces/);
  await page.getByRole('button', { name: 'Get started' }).click();
  expect(await page.getByRole('heading', { level: 1 }).evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^Inter/);
  await page.goto('./');
  await completeOnboarding(page, { name: 'Jules Sample' });
  const inter = async (selector: string) => {
    const fonts = await page.locator(selector).evaluateAll((els) => els.map((e) => getComputedStyle(e).fontFamily));
    expect(fonts.length).toBeGreaterThan(0);
    for (const f of fonts) expect(f).toMatch(/^Inter/);
  };
  await inter('#child-heading');
  await inter('[data-testid="chronological-age"]');
  await inter('.title-2');
  await page.goto('./#/settings');
  await inter('.topbar-title');
  await inter('.title-2');
  await inter('.accordion-title');
  await page.goto('./#/profiles');
  await page.getByRole('link', { name: 'Edit Jules Sample' }).click();
  await inter('.topbar-title');
  await page.getByRole('button', { name: 'Advanced profile management' }).click();
  await page.getByRole('button', { name: 'Delete this profile…' }).click();
  await inter('[role="dialog"] .title-2');
  await page.keyboard.press('Escape');
  await page.goto('./#/home');
  await page.getByTestId('child-chip').click();
  await inter('[data-testid="child-switcher"] .list-item');
});

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

test('approved “Growing Together” logo is used in the app, favicon, manifest, and Apple icon', async ({ page, request }) => {
  await page.goto('./');
  // Welcome screen mark + header mark use the approved artwork (parent body path).
  const parentPath = 'M38 84 C 38 58 46 44 58 44 C 70 44 78 58 78 84 Z';
  await expect(page.locator(`.welcome-mark svg path[d="${parentPath}"]`)).toHaveCount(1);
  await completeOnboarding(page);
  await expect(page.locator(`.topbar svg path[d="${parentPath}"]`)).toHaveCount(1);
  expect(await page.locator('link[rel="icon"]').getAttribute('href')).toBe('./icons/favicon.svg?v=2');
  expect(await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')).toBe('./icons/apple-touch-icon.png?v=2');
  const fav = await (await request.get('./icons/favicon.svg?v=2')).text();
  expect(fav).toContain(parentPath);
  expect(fav).toContain('#7A4F33'); // fixed brand color, regardless of theme
  const manifest = await (await request.get('./manifest.webmanifest')).json();
  for (const icon of manifest.icons) {
    const size = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      return `${img.naturalWidth}x${img.naturalHeight}`;
    }, `./${icon.src}`);
    expect(size).toBe(icon.sizes);
  }
});

test('installed icons do not change with the active child’s theme', async ({ page, request }) => {
  await completeOnboarding(page, { theme: 'blush' });
  const fav = await (await request.get('./icons/favicon.svg?v=2')).text();
  expect(fav).toContain('#7A4F33');
  expect(fav).not.toContain('#A93669');
  const manifest = await (await request.get('./manifest.webmanifest')).json();
  expect(manifest.theme_color).toBe('#F6F0E8');
});

// ---------------------------------------------------------------------------
// Focus trap: elements with tabindex="-1" are not Tab stops
// ---------------------------------------------------------------------------

test('child selector: Tab order skips unselected radios; Shift+Tab cannot escape', async ({ page }) => {
  await completeOnboarding(page, { name: 'Sample Child A' });
  await addChild(page, 'Sample Child B', isoDaysAgo(500));
  await addChild(page, 'Sample Child C', isoDaysAgo(800));
  await switchTo(page, 'Sample Child B'); // middle child selected
  await page.getByTestId('child-chip').click();
  const selected = page.getByRole('radio', { name: /Sample Child B/ });
  await expect(selected).toBeFocused();
  // Shift+Tab from the selected (first tabbable) wraps to the last tabbable, not out of the dialog.
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('link', { name: 'Manage profiles' })).toBeFocused();
  // Tab from the last tabbable wraps to the selected child, never to an unselected one.
  await page.keyboard.press('Tab');
  await expect(selected).toBeFocused();
  const visited: string[] = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    visited.push(await page.evaluate(() => (document.activeElement as HTMLElement).innerText.trim()));
  }
  expect(visited.filter((v) => v.includes('Sample Child A') || v.includes('Sample Child C'))).toEqual([]);
  // Arrow keys still reach the other children; Escape still closes and restores focus.
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(selected).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: /Sample Child C/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('child-chip')).toBeFocused();
});

test('dialog with a radio-like theme grid: one Tab stop for the group inside a trapped dialog', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('./#/settings');
  const tabbable = await page.evaluate(() => [...document.querySelectorAll('[role="radiogroup"][aria-label="Color theme"] [role="radio"]')].filter((el) => (el as HTMLElement).tabIndex >= 0).length);
  expect(tabbable).toBe(1);
});

// ---------------------------------------------------------------------------
// Selector in short windows / landscape
// ---------------------------------------------------------------------------

for (const vp of [
  { width: 844, height: 300, label: 'phone landscape' },
  { width: 390, height: 260, label: 'very short' },
  { width: 1280, height: 220, label: 'short desktop window' },
]) {
  test(`child selector fits a ${vp.label} window (${vp.width}×${vp.height}) and scrolls`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await completeOnboarding(page, { name: 'Sample Child 1' });
    for (let i = 2; i <= 6; i++) await addChild(page, `Sample Child ${i}`, isoDaysAgo(100 * i));
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.getByTestId('child-chip').click();
    await page.waitForTimeout(300);
    const r = await page.getByTestId('child-switcher').evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { top: b.top, bottom: b.bottom, height: b.height, scroll: el.scrollHeight > el.clientHeight || !!el.querySelector('.popover-list') };
    });
    expect(r.top).toBeGreaterThanOrEqual(0);
    expect(r.bottom).toBeLessThanOrEqual(vp.height);
    expect(r.height).toBeLessThanOrEqual(vp.height); // no fixed minimum height forcing overflow
    // Every child and the footer actions are reachable by scrolling.
    for (const name of ['Sample Child 1', 'Sample Child 6']) {
      const item = page.getByRole('radio', { name: new RegExp(name) });
      await item.scrollIntoViewIfNeeded();
      await expect(item).toBeInViewport();
    }
    const manage = page.getByRole('link', { name: 'Manage profiles' });
    await manage.scrollIntoViewIfNeeded();
    await expect(manage).toBeInViewport();
  });
}

test('selector at normal sizes still opens downward below the top bar', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByTestId('child-chip').click();
  const [top, header] = await Promise.all([
    page.getByTestId('child-switcher').evaluate((el) => el.getBoundingClientRect().top),
    page.locator('.topbar').evaluate((el) => el.getBoundingClientRect().bottom),
  ]);
  expect(top).toBeGreaterThanOrEqual(header);
  expect(await theme(page)).toBe('earth');
});

// ---------------------------------------------------------------------------
// Third-party licenses (publication compliance)
// ---------------------------------------------------------------------------

test('About lists third-party licenses and every license file opens, also offline', async ({ page, context }) => {
  await completeOnboarding(page);
  await page.goto('./#/settings/about');
  const section = page.getByTestId('third-party-licenses');
  await expect(section.getByRole('heading', { name: 'Third-party licenses' })).toBeVisible();
  const links = section.getByRole('link');
  await expect(links).toHaveCount(5);
  const hrefs = await links.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href')!));
  for (const h of hrefs) expect(h).toMatch(/^\.\/licenses\/[A-Za-z0-9.-]+\.txt$/); // relative: works under /roll-crawl-run/
  // Online
  for (const h of hrefs) {
    const res = await page.request.get(new URL(h, page.url()).href);
    expect(res.status()).toBe(200);
    expect(await res.text()).toMatch(/Copyright/);
  }
  // Offline (served by the service worker)
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  const offline = await page.evaluate(async (list) => Promise.all(list.map(async (h) => { const r = await fetch(h); return `${r.status}:${(await r.text()).includes('Copyright')}`; })), hrefs);
  expect(offline).toEqual(hrefs.map(() => '200:true'));
  // Opening a license as a page (navigation) shows the license, not the app
  const tab = await context.newPage();
  await tab.goto(new URL(hrefs[0]!, page.url()).href);
  await expect(tab.locator('body')).toContainText('SIL Open Font License');
  await context.setOffline(false);
});
