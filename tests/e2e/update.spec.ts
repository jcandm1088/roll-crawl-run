/**
 * Verifies that installing a new version of the app keeps everything the
 * parent has entered. Two real production builds (version A and B) are
 * served from the same address; the test switches the server from A to B,
 * waits for the "new version" banner, taps Refresh, and checks the data.
 */
import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { rmSync, mkdirSync, symlinkSync } from 'node:fs';

/** The previously approved version (Checkpoint 1 review commit), built from git history. */
const PREVIOUS_COMMIT = 'ade3171d830ae753e97c76f2389666a8db82ace4';
/** The accepted, deployed Checkpoint 1 (docs-only commit on top of the deployed e40287f). */
const DEPLOYED_CHECKPOINT_1 = 'aa8c869352cdd734eafb0ed8b7219069d4457241';
/** The original Checkpoint 2a implementation, before the Growth UX refinement. */
const ORIGINAL_CHECKPOINT_2A = '73d9f6fc356b3f792a9f71cc8f38ff421e13581d';
/** The Checkpoint 2a Growth UX refinement, before the human acceptance refinements (R-004–R-008). */
const GROWTH_UX_REFINEMENT = '170cc9911322c9aa7f4bb8c973dc6d62e07d549d';

const ROOT = join(process.cwd(), '.tmp-update-test');
const PORT = 4190;
const TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json',
};

let server: Server;
let current = 'a';

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  rmSync(ROOT, { recursive: true, force: true });
  for (const tag of ['a', 'b']) {
    execFileSync('npx', ['vite', 'build', '--outDir', join(ROOT, tag), '--emptyOutDir'], { env: { ...process.env, RCR_BUILD_TAG: `update-test-${tag}` }, stdio: 'ignore' });
  }
  // Real previous release: extract the committed source and build it unchanged.
  const prevSrc = join(ROOT, 'prev-src');
  mkdirSync(prevSrc, { recursive: true });
  execFileSync('sh', ['-c', `git archive ${PREVIOUS_COMMIT} | tar -x -C "${prevSrc}"`]);
  symlinkSync(join(process.cwd(), 'node_modules'), join(prevSrc, 'node_modules'));
  execFileSync('npx', ['vite', 'build', '--outDir', join(ROOT, 'prev'), '--emptyOutDir'], { cwd: prevSrc, stdio: 'ignore' });
  const depSrc = join(ROOT, 'deployed-src');
  mkdirSync(depSrc, { recursive: true });
  execFileSync('sh', ['-c', `git archive ${DEPLOYED_CHECKPOINT_1} | tar -x -C "${depSrc}"`]);
  symlinkSync(join(process.cwd(), 'node_modules'), join(depSrc, 'node_modules'));
  execFileSync('npx', ['vite', 'build', '--outDir', join(ROOT, 'deployed'), '--emptyOutDir'], { cwd: depSrc, stdio: 'ignore' });
  const cp2aSrc = join(ROOT, 'cp2a-src');
  mkdirSync(cp2aSrc, { recursive: true });
  execFileSync('sh', ['-c', `git archive ${ORIGINAL_CHECKPOINT_2A} | tar -x -C "${cp2aSrc}"`]);
  symlinkSync(join(process.cwd(), 'node_modules'), join(cp2aSrc, 'node_modules'));
  execFileSync('npx', ['vite', 'build', '--outDir', join(ROOT, 'cp2a'), '--emptyOutDir'], { cwd: cp2aSrc, stdio: 'ignore' });
  const uxSrc = join(ROOT, 'ux-src');
  mkdirSync(uxSrc, { recursive: true });
  execFileSync('sh', ['-c', `git archive ${GROWTH_UX_REFINEMENT} | tar -x -C "${uxSrc}"`]);
  symlinkSync(join(process.cwd(), 'node_modules'), join(uxSrc, 'node_modules'));
  execFileSync('npx', ['vite', 'build', '--outDir', join(ROOT, 'ux'), '--emptyOutDir'], { cwd: uxSrc, stdio: 'ignore' });
  server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]!)).replace(/^(\.\.[/\\])+/, '');
    const file = join(ROOT, current, path.endsWith('/') ? `${path}index.html` : path);
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise<void>((resolve) => server.listen(PORT, resolve));
});

test.afterAll(() => {
  server?.close();
  rmSync(ROOT, { recursive: true, force: true });
});

test('profiles, photo, theme, and settings survive an app update', async ({ page }) => {
  test.setTimeout(120_000);
  current = 'a';
  const base = `http://localhost:${PORT}/`;
  await page.goto(base);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill('2024-09-15');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill('Sample Child A');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  await page.getByTestId('photo-input').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByTestId('theme-sage').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.goto(`${base}#/settings/about`);
  await expect(page.getByTestId('app-version')).toHaveText(/update-test-a/);

  // Publish version B and let the app discover it.
  current = 'b';
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
  await expect(page.getByText('A new version is available.')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Refresh' }).click();
  await expect(page.getByTestId('app-version')).toHaveText(/update-test-b/, { timeout: 20_000 });

  // Everything entered before the update is still there.
  await page.goto(`${base}#/home`);
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  await expect(page.locator('.child-hero .avatar img')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sage');
  await expect(page.getByRole('button', { name: 'Get started' })).toHaveCount(0);
});

test('updating from the previous approved version keeps all data and gives each child the old app-wide theme', async ({ page }) => {
  test.setTimeout(120_000);
  current = 'prev';
  const base = `http://localhost:${PORT}/`;
  // --- Previous version: one app-wide theme (Lavender), two children, a device name.
  await page.goto(base);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill('2024-09-15');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill('Sample Child A');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByTestId('theme-lavender').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  await page.goto(`${base}#/profiles/new`);
  await page.getByLabel('Name or nickname (optional)').fill('Sample Child B');
  await page.getByLabel('Date of birth').fill('2022-03-03');
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByRole('heading', { name: 'Sample Child B' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lavender');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const dbVersionBefore = await page.evaluate(() => new Promise<number>((r) => { const q = indexedDB.open('roll-crawl-run'); q.onsuccess = () => { r(q.result.version); q.result.close(); }; }));
  expect(dbVersionBefore).toBe(1);

  // --- Publish the current version and accept the update.
  current = 'b';
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
  await expect(page.getByText('A new version is available.')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Refresh' }).click();
  await expect(page.locator('.topbar svg path[d^="M38 84"]')).toHaveCount(1, { timeout: 20_000 }); // new logo = new version running

  // --- Everything survived; both children inherited Lavender; themes are now independent.
  await expect(page.getByRole('heading', { name: 'Sample Child B' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lavender');
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: /Sample Child A/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lavender');
  await page.goto(`${base}#/settings`);
  await page.getByTestId('theme-sky').click();
  await expect(page.getByTestId('theme-sky')).toHaveAttribute('aria-checked', 'true');
  await page.goto(`${base}#/home`);
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: /Sample Child B/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lavender'); // B unaffected
  const dbVersionAfter = await page.evaluate(() => new Promise<number>((r) => { const q = indexedDB.open('roll-crawl-run'); q.onsuccess = () => { r(q.result.version); q.result.close(); }; }));
  expect(dbVersionAfter).toBe(2);
});

test('updating from the deployed Checkpoint 1 keeps profiles, photo, themes and settings, and milestone tracking works', async ({ page }) => {
  test.setTimeout(120_000);
  current = 'deployed';
  const base = `http://localhost:${PORT}/`;
  await page.goto(base);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill('2025-07-10');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill('Sample Child A');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  await page.getByTestId('photo-input').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByTestId('theme-lavender').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  await page.goto(`${base}#/settings`);
  await page.getByRole('button', { name: /^This Device/ }).click();
  await page.getByLabel('Device name (optional)').fill('Phone A');
  await page.getByRole('button', { name: 'Save device name' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  current = 'b';
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
  await expect(page.getByText('A new version is available.')).toBeVisible({ timeout: 20_000 });
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Refresh' }).click()]);
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible(); // reloaded in place
  await page.goto(`${base}#/growth`);
  await expect(page.getByTestId('growth-sections')).toBeVisible({ timeout: 20_000 }); // new version running

  await page.goto(`${base}#/home`);
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  await expect(page.locator('.child-hero .avatar img')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lavender');
  await page.goto(`${base}#/settings`);
  await page.getByRole('button', { name: /^This Device/ }).click();
  await expect(page.getByLabel('Device name (optional)')).toHaveValue('Phone A');
  // Milestone tracking works on the migrated data.
  await page.goto(`${base}#/growth/milestone/cdc22-m02-se-01`);
  await page.getByRole('radio', { name: 'Achieved' }).click();
  await page.getByLabel('Date achieved').fill('2025-09-01');
  await page.getByRole('button', { name: 'Save status' }).click();
  await expect(page.getByTestId('saved')).toBeVisible();
  await page.goto(`${base}#/growth/progress`);
  await expect(page.getByTestId('progress-all').getByTestId('fraction')).toContainText('1 of');
});

test('updating from the original Checkpoint 2a keeps milestone records, history and personal versions unchanged', async ({ page }) => {
  test.setTimeout(150_000);
  current = 'cp2a';
  const base = `http://localhost:${PORT}/`;
  await page.clock.setFixedTime(new Date('2026-11-26T10:00:00'));
  await page.goto(base);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill('2025-07-10');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill('Sample Child A');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  const save = async (id: string, status: string, label: string, date: string) => {
    await page.goto(`${base}#/growth/milestone/${id}`);
    await page.getByRole('radio', { name: status }).click();
    await page.getByLabel(label, { exact: true }).fill(date);
    await page.getByRole('button', { name: 'Save status' }).click();
    await expect(page.getByTestId('saved')).toBeVisible();
  };
  await save('cdc22-m12-mp-03', 'Achieved', 'Date achieved', '2026-07-01');
  await save('cdc22-m15-lc-01', 'Emerging', 'Date', '2026-10-01');
  await save('cdc22-m24-mp-01', 'Achieved', 'Date achieved', '2026-11-01'); // early
  await page.goto(`${base}#/growth/milestone/cdc22-m02-se-01`);
  await page.getByRole('button', { name: 'Hide this milestone' }).click();
  await page.goto(`${base}#/growth/milestone/cdc22-m15-se-02`);
  await page.getByLabel('What you noticed').fill('Fictional observation');
  await page.getByRole('button', { name: 'Add observation' }).click();
  await page.goto(`${base}#/growth/milestone/cdc22-m15-se-05`);
  await page.getByRole('button', { name: 'Make a personal version' }).click();
  await page.getByLabel('Title').fill('Fictional personal version');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByTestId('provenance')).toBeVisible();
  const dump = () => page.evaluate(() => new Promise<string>((resolve) => {
    const r = indexedDB.open('roll-crawl-run');
    r.onsuccess = () => {
      const names = ['milestoneRecords', 'milestoneEvents', 'customItems', 'children'];
      const tx = r.result.transaction(names, 'readonly');
      const out: Record<string, unknown> = { version: r.result.version };
      for (const n of names) { const q = tx.objectStore(n).getAll(); q.onsuccess = () => { out[n] = q.result; }; }
      tx.oncomplete = () => { r.result.close(); resolve(JSON.stringify(out)); };
    };
  }));
  await page.goto(`${base}#/growth/progress`);
  const progressBefore = await page.getByTestId('progress-all').getByTestId('fraction').textContent();
  const before = await dump();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  current = 'b';
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
  await expect(page.getByText('A new version is available.')).toBeVisible({ timeout: 20_000 });
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Refresh' }).click()]);
  await page.goto(`${base}#/growth`);
  await expect(page.getByTestId('section-subtitle').first()).toHaveText('See how far we’ve come.', { timeout: 20_000 }); // refined version running
  expect(await dump()).toBe(before); // byte-identical records, events, personal versions and profile; same database version
  expect(JSON.parse(before).version).toBe(2);
  await page.goto(`${base}#/growth/progress`);
  await expect(page.getByTestId('progress-all').getByTestId('fraction')).toHaveText(progressBefore!);
  await page.goto(`${base}#/growth/library`);
  await page.getByLabel('Status').selectOption('emerging');
  await expect(page.getByTestId('milestone-row')).toHaveCount(1);
  // Updated for R-007 / R-006: observations now appear in Notes & Observations; the guide overview wording changed.
  await page.goto(`${base}#/growth/milestone/cdc22-m15-se-02`);
  await expect(page.getByTestId('entries')).toContainText('Fictional observation');
  await page.goto(`${base}#/growth/expect`);
  await expect(page.getByTestId('guide-overview')).toContainText('By 18 months, milestones include things like');
  // The personal version made in the original 2a is still reachable (R-005).
  await page.goto(`${base}#/growth/library`);
  await page.getByRole('button', { name: /Your personal entries \(1\)/ }).click();
  await expect(page.getByTestId('personal-entry-row')).toContainText('Fictional personal version');
});

test('updating from the Growth UX refinement (170cc99) keeps notes, observations, history and personal entries; Notes & Observations shows them honestly', async ({ page }) => {
  test.setTimeout(240_000);
  current = 'ux';
  const base = `http://localhost:${PORT}/`;
  await page.clock.setFixedTime(new Date('2026-11-26T10:00:00'));
  await page.goto(base);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill('2025-07-10');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill('Sample Child A');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  const open = (id: string) => page.goto(`${base}#/growth/milestone/${id}`);
  const saved = () => expect(page.getByTestId('saved')).toBeVisible();
  const save = async (id: string, status: string, label: string, date: string) => {
    await open(id);
    await page.getByRole('radio', { name: status }).click();
    await page.getByLabel(label, { exact: true }).fill(date);
    await page.getByRole('button', { name: 'Save status' }).click();
    await saved();
  };
  // --- Representative fictional data, created with the 170cc99 interface ---
  await save('cdc22-m12-mp-03', 'Achieved', 'Date achieved', '2026-07-01');
  await page.getByText('Correct the achievement date').click();
  await page.getByLabel('Correct date').fill('2026-06-28');
  await page.getByRole('button', { name: 'Save corrected date' }).click();
  await saved();
  await save('cdc22-m15-lc-01', 'Emerging', 'Date', '2026-10-01');
  await save('cdc22-m24-mp-01', 'Achieved', 'Date achieved', '2026-11-01'); // early
  await open('cdc22-m02-se-01');
  await page.getByRole('button', { name: 'Hide this milestone' }).click();
  await saved();
  await open('cdc22-m15-se-02');
  await page.getByRole('textbox', { name: 'Note' }).fill('Fictional note, first version');
  await page.getByRole('button', { name: 'Save note' }).click();
  await saved();
  await page.getByRole('textbox', { name: 'Note' }).fill('Fictional note, second version');
  await page.getByRole('button', { name: 'Save note' }).click();
  await saved();
  const observe = async (date: string, text: string) => {
    await page.getByLabel('Observation date').fill(date);
    await page.getByLabel('What you noticed').fill(text);
    await page.getByRole('button', { name: 'Add observation' }).click();
    await saved();
  };
  await observe('2026-10-05', 'Fictional observation kept');
  await observe('2026-10-12', 'Fictional observation removed');
  await observe('2026-10-19', 'Fictional observation erased');
  await page.getByRole('button', { name: 'Remove observation from October 12, 2026' }).click();
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await saved();
  await page.getByTestId('history-entry').filter({ hasText: 'Fictional observation erased' }).getByRole('button', { name: 'Erase permanently…' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Yes, erase permanently' }).click();
  await saved();
  await open('cdc22-m15-se-05');
  await page.getByRole('button', { name: 'Make a personal version' }).click();
  await page.getByLabel('Title').fill('Fictional personal version');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByTestId('provenance')).toBeVisible();
  const personalUrl = page.url();
  await page.getByRole('radio', { name: 'Emerging' }).click();
  await page.getByLabel('Date', { exact: true }).fill('2026-11-02');
  await page.getByRole('button', { name: 'Save status' }).click();
  await saved();
  await page.getByRole('textbox', { name: 'Note' }).fill('Fictional personal note');
  await page.getByRole('button', { name: 'Save note' }).click();
  await saved();
  await observe('2026-11-03', 'Fictional personal observation');
  // A second child with their own note (data isolation)
  await page.goto(`${base}#/profiles/new`);
  await page.getByLabel('Name or nickname (optional)').fill('Sample Child B');
  await page.getByLabel('Date of birth').fill('2024-02-01');
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByRole('heading', { name: 'Sample Child B' })).toBeVisible();
  await open('cdc22-m30-se-02');
  await page.getByRole('textbox', { name: 'Note' }).fill('Fictional note for B');
  await page.getByRole('button', { name: 'Save note' }).click();
  await saved();
  await page.goto(`${base}#/growth/progress`);
  await expect(page.getByTestId('progress-all').getByTestId('fraction')).toHaveText(/^0 of \d+ achieved$/);
  const progressB = await page.getByTestId('progress-all').getByTestId('fraction').textContent();
  const switchTo = async (name: string) => {
    await page.goto(`${base}#/home`);
    await page.getByTestId('child-chip').click();
    await page.getByRole('radio', { name: new RegExp(name) }).click();
    await expect(page.getByTestId('child-chip')).toContainText(name);
  };
  await switchTo('Sample Child A');
  await page.goto(`${base}#/growth/progress`);
  // Wait for the records to load before capturing (16 months: 72 apply, 1 hidden → 71; 1 achieved; the early one isn't counted).
  await expect(page.getByTestId('progress-all').getByTestId('fraction')).toHaveText('1 of 71 achieved');
  const progressA = await page.getByTestId('progress-all').getByTestId('fraction').textContent();
  const byAreaA = await page.locator('[data-testid^="area-link-"]').allInnerTexts();

  const dump = () => page.evaluate(() => new Promise<string>((resolve) => {
    const r = indexedDB.open('roll-crawl-run');
    r.onsuccess = () => {
      const names = [...r.result.objectStoreNames];
      const tx = r.result.transaction(names, 'readonly');
      const out: Record<string, unknown> = { version: r.result.version, stores: names };
      for (const n of names) { const q = tx.objectStore(n).getAll(); q.onsuccess = () => { out[n] = JSON.parse(JSON.stringify(q.result, (_k, v) => (v instanceof Blob ? `blob:${v.size}` : v))); }; }
      tx.oncomplete = () => { r.result.close(); resolve(JSON.stringify(out)); };
    };
  }));
  const before = await dump();
  expect(before).not.toContain('Fictional observation erased'); // erased before the update
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  // --- Update to this version ---
  current = 'b';
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
  await expect(page.getByText('A new version is available.')).toBeVisible({ timeout: 20_000 });
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Refresh' }).click()]);
  await page.goto(`${base}#/growth/milestone/cdc22-m15-se-02`);
  await expect(page.getByTestId('notes-observations')).toBeVisible({ timeout: 20_000 }); // new version running
  expect(await dump()).toBe(before); // every store byte-identical: nothing migrated, converted, merged or deleted
  expect(JSON.parse(before).version).toBe(2);

  // Notes & Observations for A's milestone: the undated note is labelled honestly; dated entries keep their dates.
  const entries = page.getByTestId('entry');
  await expect(entries).toHaveCount(2);
  await expect(entries.nth(0)).toHaveAttribute('data-kind', 'undated-note');
  await expect(entries.nth(0).getByTestId('entry-date')).toHaveText('No observation date · saved November 26, 2026');
  await expect(entries.nth(0).getByTestId('entry-text')).toHaveText('Fictional note, second version');
  await expect(entries.nth(1).getByTestId('entry-date')).toHaveText('October 5, 2026');
  await expect(entries.nth(1).getByTestId('entry-text')).toHaveText('Fictional observation kept');
  const history = page.getByTestId('history');
  await expect(history).toContainText('Fictional note, first version'); // earlier note version kept in history
  await expect(history.locator('.removed-text')).toHaveText('Fictional observation removed');
  await expect(history).toContainText('Text permanently erased.');
  await expect(history).not.toContainText('Fictional observation erased');
  await expect(page.getByLabel('Note or observation')).toHaveValue('');
  await expect(page.getByRole('textbox', { name: 'Note', exact: true })).toHaveCount(0); // no separate Note box

  // Status and date controls stay distinct and unchanged.
  await page.goto(`${base}#/growth/milestone/cdc22-m12-mp-03`);
  await expect(page.getByText('Achieved on')).toContainText('June 28, 2026');
  await expect(page.getByTestId('history')).toContainText('Achievement date corrected from July 1, 2026 to June 28, 2026');

  // Progress is unchanged, including by area.
  await page.goto(`${base}#/growth/progress`);
  await expect(page.getByTestId('progress-all').getByTestId('fraction')).toHaveText(progressA!);
  expect(await page.locator('[data-testid^="area-link-"]').allInnerTexts()).toEqual(byAreaA);

  // The personal version is preserved and reachable, with its own status, note and observation; no way to make a new one.
  await page.goto(`${base}#/growth/library`);
  await page.getByRole('button', { name: /Your personal entries \(1\)/ }).click();
  await page.getByTestId('personal-entry-row').click();
  await expect(page).toHaveURL(personalUrl);
  await expect(page.getByTestId('milestone-title')).toHaveText('Fictional personal version');
  await expect(page.locator('.status-badge').first()).toHaveText('Emerging');
  await expect(page.getByTestId('entries')).toContainText('Fictional personal note');
  await expect(page.getByTestId('entries')).toContainText('Fictional personal observation');
  await open('cdc22-m15-se-05');
  await expect(page.getByRole('button', { name: /personal version/i })).toHaveCount(0);

  // Editing the undated note after the update keeps the earlier text in history and invents no date.
  await open('cdc22-m15-se-02');
  await page.getByRole('button', { name: 'Edit entry: No observation date' }).click();
  await page.getByLabel('Entry text').fill('Fictional note, third version');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await saved();
  await expect(page.getByTestId('entry').nth(0).getByTestId('entry-date')).toHaveText('No observation date · saved November 26, 2026');
  await expect(page.getByTestId('history')).toContainText('Fictional note, second version');

  // Profile isolation after the update.
  await switchTo('Sample Child B');
  await page.goto(`${base}#/growth/progress`);
  await expect(page.getByTestId('progress-all').getByTestId('fraction')).toHaveText(progressB!);
  await open('cdc22-m30-se-02');
  await expect(page.getByTestId('entries')).toContainText('Fictional note for B');
  await open('cdc22-m15-se-02');
  await expect(page.getByTestId('entries')).toHaveCount(0);
  await page.goto(`${base}#/growth/library`);
  await expect(page.getByTestId('personal-entries')).toHaveCount(0);
});
