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
  expect(boxes).toHaveLength(4); // Checkpoint 4: Resources left the primary navigation (Home, Growth, Calendar, Journal)
  for (const h of boxes) expect(h).toBeGreaterThanOrEqual(48);
});

// ---------------------------------------------------------------------------
// R-029: native date and time controls stay inside their containers (found on a physical iPhone).
// These checks run in Chromium at phone widths. Chromium does not reproduce iOS Safari's intrinsic sizing of
// these controls, so they guard the layout and the corrective styles; they are not iPhone verification.
// ---------------------------------------------------------------------------

async function checkDateTimeControls(page: import('@playwright/test').Page, where: string, expectAtLeast: number) {
  // Wait for the screen that holds the controls, then let entrance animations finish so geometry is read at rest.
  await expect.poll(() => page.locator('input[type="date"]:visible, input[type="time"]:visible').count(), { message: `${where}: date/time controls rendered` }).toBeGreaterThanOrEqual(expectAtLeast);
  await page.evaluate(async () => { await Promise.all(document.getAnimations().filter((a) => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming().endTime as number)).map((a) => a.finished.catch(() => undefined))); });
  const r = await page.evaluate(() => {
    const controls = [...document.querySelectorAll<HTMLInputElement>('input[type="date"], input[type="time"]')].filter((el) => el.getClientRects().length > 0 && !el.closest('details:not([open])'));
    const box = (el: Element) => { const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, w: b.width, h: b.height }; };
    return {
      vw: document.documentElement.clientWidth,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      sheetOverflow: [...document.querySelectorAll('.sheet')].map((s) => s.scrollWidth - s.clientWidth),
      controls: controls.map((el) => {
        const s = getComputedStyle(el);
        const parent = el.parentElement!;
        const ps = getComputedStyle(parent);
        const pb = parent.getBoundingClientRect();
        const scope = el.closest('form, .sheet, .card, main') ?? document.body;
        const inRow = !!el.closest('.input-row');
        // A neighboring single-line field laid out the same way (stacked, full width), to compare edges with.
        const peer = inRow ? null : [...scope.querySelectorAll<HTMLElement>('input.input:not([type="date"]):not([type="time"]), textarea.textarea')].find((x) => x.getClientRects().length > 0 && !x.closest('.input-row, .stepper, .duration-field, .search-field') && x.parentElement && getComputedStyle(x.parentElement).display === ps.display && Math.abs(x.parentElement.getBoundingClientRect().width - pb.width) < 1);
        return {
          type: el.type, id: el.id, value: el.value, ...box(el),
          parentL: pb.left + parseFloat(ps.paddingLeft) + parseFloat(ps.borderLeftWidth), parentR: pb.right - parseFloat(ps.paddingRight) - parseFloat(ps.borderRightWidth),
          minWidth: s.minWidth, maxWidth: s.maxWidth, boxSizing: s.boxSizing, appearance: s.appearance, display: s.display, fontSize: s.fontSize, paddingLeft: s.paddingLeft,
          peer: peer ? box(peer) : null, peerFont: peer ? getComputedStyle(peer).fontSize : null, peerPad: peer ? getComputedStyle(peer).paddingLeft : null,
        };
      }),
    };
  });
  expect(r.controls.length, `${where}: date/time controls found`).toBeGreaterThanOrEqual(expectAtLeast);
  expect(r.pageOverflow, `${where}: no sideways page scrolling`).toBeLessThanOrEqual(0);
  for (const o of r.sheetOverflow) expect(o, `${where}: no sideways scrolling inside a sheet`).toBeLessThanOrEqual(0);
  for (const c of r.controls) {
    const label = `${where}: ${c.type} ${c.id || '(no id)'} ${c.value ? 'filled' : 'empty'}`;
    expect(c.l, label).toBeGreaterThanOrEqual(c.parentL - 0.5); // inside its container
    expect(c.r, label).toBeLessThanOrEqual(c.parentR + 0.5);
    expect(c.r, label).toBeLessThanOrEqual(r.vw + 0.5); // and inside the screen
    expect(c.l, label).toBeGreaterThanOrEqual(-0.5);
    expect(c.h, label).toBeGreaterThanOrEqual(44); // touch target kept
    expect([c.minWidth, c.maxWidth, c.boxSizing, c.appearance, c.display], label).toEqual(['0px', '100%', 'border-box', 'none', 'block']); // the corrective styles are in effect
    if (c.peer) { // lines up with a neighboring field and keeps its type size and padding
      expect(Math.abs(c.l - c.peer.l), label).toBeLessThan(1);
      expect(Math.abs(c.r - c.peer.r), label).toBeLessThan(1);
      expect([c.fontSize, c.paddingLeft], label).toEqual([c.peerFont, c.peerPad]);
    }
  }
  return r.controls;
}

for (const width of [320, 390]) {
  test(`R-029: date and time controls fit their containers and align with other fields at ${width}px, empty and filled`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 760 });
    await page.clock.setFixedTime(new Date('2026-11-27T10:00:00'));
    // Onboarding: date of birth, empty then filled.
    await page.goto('./');
    await page.getByRole('button', { name: 'Get started' }).click();
    await checkDateTimeControls(page, 'onboarding, empty', 1);
    await page.getByLabel('Date of birth').fill('2025-03-14');
    await checkDateTimeControls(page, 'onboarding, filled', 1);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Name or nickname').fill('Sample Child With A Fairly Long Name');
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Start using the app' }).click();
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();

    // Profiles: add and edit.
    await page.goto('./#/profiles/new');
    await checkDateTimeControls(page, 'add a child, empty', 1);
    await page.goto('./#/profiles');
    await page.getByRole('link', { name: /^Edit / }).first().click();
    await checkDateTimeControls(page, 'edit profile, filled', 1);

    // Growth: a milestone's status date and its Notes & Observations date.
    await page.goto('./#/growth/milestone/cdc22-m12-mp-03');
    await page.getByRole('radio', { name: 'Achieved' }).click();
    await checkDateTimeControls(page, 'milestone', 2);

    // Goals and exercises.
    await page.goto('./#/growth/goals/new');
    await checkDateTimeControls(page, 'new goal', 1);
    await page.goto('./#/growth/goals/achievement/new');
    await checkDateTimeControls(page, 'new achievement', 1);
    await page.goto('./#/growth/exercises/new');
    await page.getByTestId('rule-daily').click();
    await checkDateTimeControls(page, 'new exercise', 1);

    // Calendar: date with an empty time, then both filled.
    await page.goto('./#/calendar/add');
    await expect(page.getByTestId('event-form')).toBeVisible();
    const cal = await checkDateTimeControls(page, 'calendar event, time empty', 2);
    expect(cal.map((c) => c.type).sort()).toEqual(['date', 'time']);
    await page.getByLabel('Time (optional)').fill('09:30');
    await page.getByLabel('Title').fill('Fictional checkup');
    await checkDateTimeControls(page, 'calendar event, filled', 2);
    await page.getByTestId('save-event').click();
    await expect(page.getByTestId('saved')).toBeVisible();

    // Journal: the entry form, then the From/To filters (side by side at 390, stacked at 320), empty and filled.
    await page.goto('./#/journal/new');
    await expect(page.getByTestId('entry-form')).toBeVisible();
    await checkDateTimeControls(page, 'journal entry', 1);
    await page.getByTestId('entry-form').getByLabel('Entry', { exact: true }).fill('Fictional entry');
    await page.getByTestId('save-entry').click();
    await expect(page.getByTestId('saved')).toBeVisible();
    await page.getByTestId('more-filters').locator('summary').click();
    await checkDateTimeControls(page, 'journal filters, empty', 2);
    await page.getByLabel('From').fill('2026-11-01');
    await page.getByLabel('To', { exact: true }).fill('2026-11-27');
    const filters = await checkDateTimeControls(page, 'journal filters, filled', 2);
    if (width >= 360) expect(Math.abs(filters[0]!.w - filters[1]!.w)).toBeLessThan(1); // side by side: equal shares of the row
    // The native picker can still be opened from the control.
    expect(await page.getByLabel('From').evaluate((el) => typeof (el as HTMLInputElement).showPicker === 'function' && !(el as HTMLInputElement).disabled && !(el as HTMLInputElement).readOnly)).toBe(true);
  });
}
