/**
 * Verifies that installing a new version of the app keeps everything the
 * parent has entered. Two real production builds (version A and B) are
 * served from the same address; the test switches the server from A to B,
 * waits for the "new version" banner, taps Refresh, and checks the data.
 */
import { expect, test } from '@playwright/test';
import { seedLegacyPersonalEntry } from './helpers';
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
/** The accepted Checkpoint 2a baseline (Mac usability acceptance), database version 2. */
const ACCEPTED_CHECKPOINT_2A = '53d6212d9a7d99854e7195df7979a9a5758b88de';

/** The accepted Checkpoint 2b-R implementation (human-accepted in Mac Safari), database version 3, before the Calendar. */
const ACCEPTED_CHECKPOINT_2B_R = 'b45af4326085b822a2b932ef21c4ee96b3954f84';

/** The final accepted Checkpoint 3 build (Calendar, refinements and the medical symbol correction), before the Journal. */
const ACCEPTED_CHECKPOINT_3 = 'c8aa0c54350fbe79df7bbeb4a40448560e20b265';

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
  const accSrc = join(ROOT, 'acc-src');
  mkdirSync(accSrc, { recursive: true });
  execFileSync('sh', ['-c', `git archive ${ACCEPTED_CHECKPOINT_2A} | tar -x -C "${accSrc}"`]);
  symlinkSync(join(process.cwd(), 'node_modules'), join(accSrc, 'node_modules'));
  execFileSync('npx', ['vite', 'build', '--outDir', join(ROOT, 'acc'), '--emptyOutDir'], { cwd: accSrc, stdio: 'ignore' });
  const brSrc = join(ROOT, 'cp2br-src');
  mkdirSync(brSrc, { recursive: true });
  execFileSync('sh', ['-c', `git archive ${ACCEPTED_CHECKPOINT_2B_R} | tar -x -C "${brSrc}"`]);
  symlinkSync(join(process.cwd(), 'node_modules'), join(brSrc, 'node_modules'));
  execFileSync('npx', ['vite', 'build', '--outDir', join(ROOT, 'cp2br'), '--emptyOutDir'], { cwd: brSrc, stdio: 'ignore' });
  const cp3Src = join(ROOT, 'cp3-src');
  mkdirSync(cp3Src, { recursive: true });
  execFileSync('sh', ['-c', `git archive ${ACCEPTED_CHECKPOINT_3} | tar -x -C "${cp3Src}"`]);
  symlinkSync(join(process.cwd(), 'node_modules'), join(cp3Src, 'node_modules'));
  execFileSync('npx', ['vite', 'build', '--outDir', join(ROOT, 'cp3'), '--emptyOutDir'], { cwd: cp3Src, stdio: 'ignore' });
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
  // Updated at Checkpoint 2b: the current version uses database version 3 (Decision D1; was 2).
  expect(dbVersionAfter).toBe(3);
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
  // Updated at Checkpoint 2b: the database is upgraded to version 3 (D1). Records, events, personal versions
  // and profile must still be byte-identical; only the version number differs.
  const afterCp2a = JSON.parse(await dump());
  expect(JSON.parse(before).version).toBe(2);
  expect(afterCp2a.version).toBe(3);
  expect({ ...afterCp2a, version: 2 }).toEqual(JSON.parse(before));
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
  // Updated at Checkpoint 2b: version 3 adds two empty stores (D1). Every existing store is byte-identical:
  // nothing migrated, converted, merged or deleted.
  const b0 = JSON.parse(before);
  const a0 = JSON.parse(await dump());
  expect(b0.version).toBe(2);
  expect(a0.version).toBe(3);
  expect([...a0.stores].sort()).toEqual([...b0.stores, 'itemEvents', 'trackerState'].sort());
  for (const n of b0.stores) expect(a0[n], n).toEqual(b0[n]);
  expect(a0.itemEvents).toEqual([]);
  expect(a0.trackerState).toEqual([]);

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

test('updating from the accepted Checkpoint 2a (53d6212) upgrades to database version 3 and keeps every record; 2b features work', async ({ page }) => {
  test.setTimeout(240_000);
  current = 'acc';
  const base = `http://localhost:${PORT}/`;
  await page.clock.setFixedTime(new Date('2026-11-27T10:00:00'));
  await page.goto(base);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill('2025-07-10');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill('Sample Child A');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  const saved = () => expect(page.getByTestId('saved')).toBeVisible();
  const save = async (id: string, status: string, label: string, date: string) => {
    await page.goto(`${base}#/growth/milestone/${id}`);
    await page.getByRole('radio', { name: status }).click();
    await page.getByLabel(label, { exact: true }).fill(date);
    await page.getByRole('button', { name: 'Save status' }).click();
    await saved();
  };
  await save('cdc22-m12-mp-03', 'Achieved', 'Date achieved', '2026-07-01');
  await save('cdc22-m15-lc-01', 'Emerging', 'Date', '2026-10-01');
  await page.goto(`${base}#/growth/milestone/cdc22-m15-se-02`);
  await page.getByLabel('Note or observation').fill('Fictional accepted-2a observation');
  await page.getByTestId('add-entry').click();
  await saved();
  await seedLegacyPersonalEntry(page, { title: 'Fictional legacy entry', derivedFromDefId: 'cdc22-m15-se-05', appCategory: 'social-emotional', referenceAgeMonths: 15 });
  await page.goto(`${base}#/growth/progress`);
  await expect(page.getByTestId('progress-all').getByTestId('fraction')).toHaveText(/^1 of \d+ achieved$/);
  const progressBefore = await page.getByTestId('progress-all').getByTestId('fraction').textContent();
  const byAreaBefore = await page.locator('[data-testid^="area-link-"]').allInnerTexts();
  await page.goto(`${base}#/home`);
  await expect(page.getByTestId('home-recent').locator('li')).toHaveCount(2);
  const recentBefore = await page.getByTestId('home-recent').innerText();

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
  const before = JSON.parse(await dump());
  expect(before.version).toBe(2);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  current = 'b';
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
  await expect(page.getByText('A new version is available.')).toBeVisible({ timeout: 20_000 });
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Refresh' }).click()]);
  await page.goto(`${base}#/growth/goals`);
  await expect(page.getByTestId('section-my-goals')).toBeVisible({ timeout: 20_000 }); // 2b running

  const after = JSON.parse(await dump());
  expect(after.version).toBe(3);
  for (const n of before.stores) expect(after[n], n).toEqual(before[n]); // every existing record byte-identical
  expect(after.itemEvents).toEqual([]);
  expect(after.trackerState).toEqual([]);

  // Existing milestone calculations and Home are unchanged.
  await page.goto(`${base}#/growth/progress`);
  await expect(page.getByTestId('progress-all').getByTestId('fraction')).toHaveText(progressBefore!);
  expect(await page.locator('[data-testid^="area-link-"]').allInnerTexts()).toEqual(byAreaBefore);
  await page.goto(`${base}#/home`);
  await expect.poll(() => page.getByTestId('home-recent').innerText()).toBe(recentBefore);
  await page.goto(`${base}#/growth/milestone/cdc22-m15-se-02`);
  await expect(page.getByTestId('entries')).toContainText('Fictional accepted-2a observation');

  // New features work on the upgraded data.
  await page.goto(`${base}#/growth/goals/new`);
  await page.getByLabel('Goal name').fill('Fictional upgraded goal');
  await page.getByTestId('save-goal').click();
  await expect(page.getByTestId('goal-title')).toHaveText('Fictional upgraded goal');
  await page.goto(`${base}#/growth/exercises/new`);
  await page.getByLabel('Exercise name').fill('Fictional upgraded exercise');
  await page.getByTestId('rule-daily').click();
  await page.getByTestId('save-exercise').click();
  await expect(page.getByTestId('exercise-title')).toHaveText('Fictional upgraded exercise');
  await page.goto(`${base}#/growth/exercises`);
  await page.getByTestId('routine-complete').click();
  await expect(page.getByTestId('daily-count')).toHaveText('1 of 1 session done');
  await page.goto(`${base}#/home`);
  await expect.poll(() => page.getByTestId('home-recent').innerText()).toBe(recentBefore); // personal history never appears in Recent milestones

  // The legacy entry is still there, and can be moved to My Goals explicitly.
  await page.goto(`${base}#/growth/library`);
  await page.getByRole('button', { name: /Your personal entries \(1\)/ }).click();
  await page.getByTestId('personal-entry-row').click();
  await page.getByTestId('manage-legacy').locator('summary').click();
  await page.getByTestId('move-to-goals').click();
  await expect(page.getByTestId('move-preview')).toContainText('goal you’re working toward');
  await page.getByTestId('confirm-move').click();
  await expect(page.getByTestId('goal-title')).toHaveText('Fictional legacy entry');
  await expect(page.getByTestId('goal-dates')).toHaveText('Start date not recorded');
  await page.goto(`${base}#/growth/library`);
  await expect(page.getByTestId('personal-entries')).toHaveCount(0);
  await page.goto(`${base}#/growth/progress`);
  await expect(page.getByTestId('progress-all').getByTestId('fraction')).toHaveText(progressBefore!);
  await expect(page.getByTestId('pp-active')).toHaveText('2');
});

test('updating from the accepted Checkpoint 2b-R (b45af43) keeps every record at database version 3; the Calendar works on the existing data', async ({ page }) => {
  test.setTimeout(240_000);
  current = 'cp2br';
  const base = `http://localhost:${PORT}/`;
  await page.clock.setFixedTime(new Date('2026-11-27T10:00:00'));
  await page.goto(base);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill('2025-07-10');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill('Sample Child A');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByTestId('theme-lavender').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  // The accepted 2b-R build: the Calendar is still a placeholder there.
  await page.goto(`${base}#/calendar`);
  await expect(page.getByText('Preview only.', { exact: false }).first()).toBeVisible();

  // Existing data: a milestone, an observation, a goal, an exercise with a session, a second child.
  const saved = () => expect(page.getByTestId('saved')).toBeVisible();
  await page.goto(`${base}#/growth/milestone/cdc22-m12-mp-03`);
  await page.getByRole('radio', { name: 'Achieved' }).click();
  await page.getByLabel('Date achieved', { exact: true }).fill('2026-07-01');
  await page.getByRole('button', { name: 'Save status' }).click();
  await saved();
  await page.getByLabel('Note or observation').fill('Fictional 2b-R observation');
  await page.getByTestId('add-entry').click();
  await saved();
  await page.goto(`${base}#/growth/goals/new`);
  await page.getByLabel('Goal name').fill('Fictional 2b-R goal');
  await page.getByTestId('save-goal').click();
  await expect(page.getByTestId('goal-title')).toHaveText('Fictional 2b-R goal');
  await page.goto(`${base}#/growth/exercises/new`);
  await page.getByLabel('Exercise name').fill('Fictional 2b-R exercise');
  await page.getByTestId('rule-daily').click();
  await page.getByTestId('save-exercise').click();
  await expect(page.getByTestId('exercise-title')).toHaveText('Fictional 2b-R exercise');
  await page.goto(`${base}#/growth/exercises`);
  await page.getByTestId('routine-complete').click();
  await expect(page.getByTestId('daily-count')).toHaveText('1 of 1 session done');
  await page.goto(`${base}#/profiles/new`);
  await page.getByLabel('Name or nickname (optional)').fill('Sample Child B');
  await page.getByLabel('Date of birth').fill('2023-04-10');
  await page.getByTestId('theme-sage').click();
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child B');
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: /Sample Child A/ }).click();
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child A');
  await page.goto(`${base}#/growth/progress`);
  const progressBefore = await page.getByTestId('progress-all').getByTestId('fraction').textContent();
  await page.goto(`${base}#/home`);
  await expect(page.getByTestId('home-recent').locator('li')).not.toHaveCount(0);
  const recentBefore = await page.getByTestId('home-recent').innerText();

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
  const before = JSON.parse(await dump());
  expect(before.version).toBe(3);
  expect(before.events).toEqual([]);
  expect(before.customItems.length).toBeGreaterThanOrEqual(2);
  expect(before.completions.length).toBe(1);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  current = 'b';
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
  await expect(page.getByText('A new version is available.')).toBeVisible({ timeout: 20_000 });
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Refresh' }).click()]);
  await page.goto(`${base}#/calendar`);
  await expect(page.getByTestId('calendar')).toBeVisible({ timeout: 20_000 }); // the Calendar is running

  // Same database version, same stores, every record byte-identical. No migration ran.
  const after = JSON.parse(await dump());
  expect(after.version).toBe(3);
  expect(after.stores).toEqual(before.stores);
  for (const n of before.stores) expect(after[n], n).toEqual(before[n]);

  // Defaults on existing settings: medical and personal shown, vaccine schedule off; the theme is kept.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lavender');
  await expect(page.getByTestId('overlay-medical')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('overlay-personal')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('overlay-vaccines')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('no-upcoming')).toBeVisible();

  // The Calendar works on the upgraded data, and changes only the events store and the overlay preference.
  await page.getByTestId('add-event').click();
  await page.getByLabel('Title').fill('Fictional upgraded appointment');
  await page.getByLabel('Date', { exact: true }).fill('2026-12-01');
  await page.getByTestId('save-event').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Event saved for December 1, 2026.');
  await page.getByTestId('overlay-vaccines').click();
  await expect(page.getByTestId('vaccine-info')).toBeVisible();
  const later = JSON.parse(await dump());
  expect(later.version).toBe(3);
  for (const n of before.stores.filter((x: string) => x !== 'events' && x !== 'settings')) expect(later[n], n).toEqual(before[n]);
  expect(later.events).toHaveLength(1);
  expect(later.events[0]).toMatchObject({ recordType: 'calendarEvent', title: 'Fictional upgraded appointment', date: '2026-12-01', kind: 'medical' });
  const { layers: layersBefore, updatedAt: _b, ...restBefore } = before.settings[0];
  const { layers: layersAfter, updatedAt: _a, ...restAfter } = later.settings[0];
  expect(restAfter).toEqual(restBefore); // themes, active child and every other setting unchanged
  expect(layersAfter).toEqual({ ...layersBefore, medical: true, vaccines: true }); // earlier fields kept, inert

  // Previously accepted features are unchanged.
  await page.goto(`${base}#/growth/progress`);
  await expect(page.getByTestId('progress-all').getByTestId('fraction')).toHaveText(progressBefore!);
  await page.goto(`${base}#/home`);
  await expect.poll(() => page.getByTestId('home-recent').innerText()).toBe(recentBefore);
  await expect(page.getByTestId('home-coming-up')).toContainText('Fictional upgraded appointment');
  await page.goto(`${base}#/growth/milestone/cdc22-m12-mp-03`);
  await expect(page.getByTestId('entries')).toContainText('Fictional 2b-R observation');
  await page.goto(`${base}#/growth/goals/my`);
  await expect(page.locator('body')).toContainText('Fictional 2b-R goal');
  await page.goto(`${base}#/growth/exercises`);
  await expect(page.getByTestId('daily-count')).toHaveText('1 of 1 session done');
  // The other child's calendar is empty, and their theme is theirs.
  await page.goto(`${base}#/calendar`); // the child selector is on the main tabs
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: /Sample Child B/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sage');
  await page.goto(`${base}#/calendar`);
  await expect(page.getByTestId('no-upcoming')).toBeVisible();
});

test('updating from the accepted Checkpoint 3 (c8aa0c5) keeps every record and both photographs byte for byte at database version 3; the Journal works on the existing data', async ({ page }) => {
  test.setTimeout(240_000);
  current = 'cp3';
  const base = `http://localhost:${PORT}/`;
  await page.clock.setFixedTime(new Date('2026-11-27T10:00:00'));
  // Two different fictional 1×1 images, so each child's stored photograph can be told apart by its contents.
  const photoA = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const photoB = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');
  await page.goto(base);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill('2025-07-10');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill('Sample Child A');
  await page.getByTestId('photo-input').setInputFiles({ name: 'sample-a.png', mimeType: 'image/png', buffer: photoA });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByTestId('theme-lavender').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByRole('heading', { name: 'Sample Child A' })).toBeVisible();
  // The accepted Checkpoint 3 build: the Journal is still a placeholder and Resources is still a tab.
  await page.goto(`${base}#/journal`);
  await expect(page.getByText('Preview only.', { exact: false }).first()).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link')).toHaveCount(5);

  // Existing data: a milestone with an observation, a goal, an exercise with a session, two calendar events,
  // the vaccine overlay switched on, and a second child with their own photograph and theme.
  const saved = () => expect(page.getByTestId('saved')).toBeVisible();
  await page.goto(`${base}#/growth/milestone/cdc22-m12-mp-03`);
  await page.getByRole('radio', { name: 'Achieved' }).click();
  await page.getByLabel('Date achieved', { exact: true }).fill('2026-07-01');
  await page.getByRole('button', { name: 'Save status' }).click();
  await saved();
  await page.getByLabel('Note or observation').fill('Fictional Checkpoint 3 observation');
  await page.getByTestId('add-entry').click();
  await saved();
  await page.goto(`${base}#/growth/goals/new`);
  await page.getByLabel('Goal name').fill('Fictional Checkpoint 3 goal');
  await page.getByTestId('save-goal').click();
  await expect(page.getByTestId('goal-title')).toHaveText('Fictional Checkpoint 3 goal');
  await page.goto(`${base}#/growth/exercises/new`);
  await page.getByLabel('Exercise name').fill('Fictional Checkpoint 3 exercise');
  await page.getByTestId('rule-daily').click();
  await page.getByTestId('save-exercise').click();
  await expect(page.getByTestId('exercise-title')).toHaveText('Fictional Checkpoint 3 exercise');
  await page.goto(`${base}#/growth/exercises`);
  await page.getByTestId('routine-complete').click();
  await expect(page.getByTestId('daily-count')).toHaveText('1 of 1 session done');
  await page.goto(`${base}#/calendar`);
  for (const e of [{ kind: 'medical', title: 'Fictional Checkpoint 3 checkup', date: '2026-12-03' }, { kind: 'personal', title: 'Fictional Checkpoint 3 visit', date: '2026-12-05' }]) {
    await page.getByTestId('add-event').click();
    await page.getByTestId(`event-kind-${e.kind}`).click();
    await page.getByLabel('Title').fill(e.title);
    await page.getByLabel('Date', { exact: true }).fill(e.date);
    await page.getByLabel('Notes (optional)').fill('Fictional Checkpoint 3 note');
    await page.getByTestId('save-event').click();
    await saved();
  }
  await page.getByTestId('overlay-vaccines').click();
  await expect(page.getByTestId('vaccine-info')).toBeVisible();
  await page.goto(`${base}#/profiles/new`);
  await page.getByLabel('Name or nickname (optional)').fill('Sample Child B');
  await page.getByLabel('Date of birth').fill('2023-04-10');
  await page.getByTestId('photo-input').setInputFiles({ name: 'sample-b.png', mimeType: 'image/png', buffer: photoB });
  await page.getByTestId('theme-sage').click();
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child B');
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: /Sample Child A/ }).click();
  await expect(page.getByTestId('child-chip')).toContainText('Sample Child A');
  await page.goto(`${base}#/growth/progress`);
  const progressBefore = await page.getByTestId('progress-all').getByTestId('fraction').textContent();
  await page.goto(`${base}#/home`);
  await expect(page.getByTestId('home-recent').locator('li')).not.toHaveCount(0);
  const recentBefore = await page.getByTestId('home-recent').innerText();
  const comingBefore = await page.getByTestId('home-coming-up').innerText();

  // Every store, with each photograph's actual bytes (not only its size).
  const dump = () => page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open('roll-crawl-run'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const names = [...db.objectStoreNames];
    const raw: Record<string, unknown[]> = {};
    await new Promise<void>((resolve) => {
      const tx = db.transaction(names, 'readonly');
      for (const n of names) { const q = tx.objectStore(n).getAll(); q.onsuccess = () => { raw[n] = q.result; }; }
      tx.oncomplete = () => resolve();
    });
    const version = db.version;
    db.close();
    const walk = async (v: unknown): Promise<unknown> => {
      if (v instanceof Blob) return { blobType: v.type, blobSize: v.size, blobHex: [...new Uint8Array(await v.arrayBuffer())].map((x) => x.toString(16).padStart(2, '0')).join('') };
      if (Array.isArray(v)) return Promise.all(v.map(walk));
      if (v && typeof v === 'object') { const o: Record<string, unknown> = {}; for (const [k, x] of Object.entries(v)) o[k] = await walk(x); return o; }
      return v;
    };
    return JSON.stringify({ version, stores: names, data: await walk(raw) });
  });
  type Dump = { version: number; stores: string[]; data: Record<string, Array<Record<string, unknown>>> };
  const before = JSON.parse(await dump()) as Dump;
  expect(before.version).toBe(3);
  expect(before.data.journal).toEqual([]);
  expect(before.data.events).toHaveLength(2);
  expect(before.data.children).toHaveLength(2);
  expect(before.data.completions).toHaveLength(1);
  const photosBefore = before.data.photos as Array<{ childId: string; blob: { blobType: string; blobSize: number; blobHex: string } }>;
  expect(photosBefore).toHaveLength(2);
  for (const ph of photosBefore) {
    expect(ph.blob.blobSize).toBeGreaterThan(0);
    expect(ph.blob.blobHex).toHaveLength(ph.blob.blobSize * 2); // the whole image was read
    expect(ph.blob.blobType).toMatch(/^image\//);
  }
  expect(photosBefore[0]!.blob.blobHex).not.toBe(photosBefore[1]!.blob.blobHex); // two different images
  expect(photosBefore[0]!.childId).not.toBe(photosBefore[1]!.childId);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  current = 'b';
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
  await expect(page.getByText('A new version is available.')).toBeVisible({ timeout: 20_000 });
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Refresh' }).click()]);
  await page.goto(`${base}#/journal`);
  await expect(page.getByTestId('journal')).toBeVisible({ timeout: 20_000 }); // the Journal is running

  // Same database version, same stores, every record identical, and both photographs byte for byte. No migration ran.
  const after = JSON.parse(await dump()) as Dump;
  expect(after.version).toBe(3);
  expect(after.stores).toEqual(before.stores);
  for (const n of before.stores) expect(after.data[n], n).toEqual(before.data[n]);
  expect((after.data.photos as typeof photosBefore).map((ph) => ph.blob.blobHex)).toEqual(photosBefore.map((ph) => ph.blob.blobHex));

  // The new navigation, on the existing data.
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link')).toHaveText(['Home', 'Growth', 'Calendar', 'Journal']);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lavender');
  await expect(page.getByTestId('journal-empty')).toBeVisible();

  // The Journal works on the upgraded data, and changes only the journal store.
  await page.getByTestId('new-entry').click();
  await page.getByTestId('entry-form').getByLabel('Entry', { exact: true }).fill('Fictional upgraded reflection');
  await page.getByTestId('save-entry').click();
  await expect(page.getByTestId('saved-text')).toHaveText('Entry saved.');
  await page.getByTestId('new-entry').click();
  await page.getByTestId('entry-type-care').click();
  await page.getByTestId('entry-form').getByLabel('Title (optional)').fill('Fictional upgraded question');
  await page.getByTestId('entry-form').getByLabel('Entry', { exact: true }).fill('Fictional: is this expected?');
  await page.getByTestId('entry-question-flag').locator('input').check();
  await page.getByTestId('save-entry').click();
  await expect(page.getByTestId('filter-unanswered')).toHaveText('Unanswered questions (1)');
  await page.getByTestId('toggle-answered').click();
  await expect(page.getByTestId('filter-unanswered')).toHaveText('Unanswered questions (0)');
  const later = JSON.parse(await dump()) as Dump;
  expect(later.version).toBe(3);
  for (const n of before.stores.filter((x) => x !== 'journal')) expect(later.data[n], n).toEqual(before.data[n]);
  const journal = later.data.journal ?? [];
  expect(journal).toHaveLength(2);
  expect(journal.map((e) => e.recordType)).toEqual(['journalEntry', 'journalEntry']);
  expect(journal.find((e) => e.type === 'care')).toMatchObject({ title: 'Fictional upgraded question', isProviderQuestion: true, answered: true });

  // Previously accepted features are unchanged.
  await page.goto(`${base}#/home`);
  await expect(page.locator('.child-hero .avatar img')).toBeVisible(); // the photograph still displays
  await expect.poll(() => page.getByTestId('home-recent').innerText()).toBe(recentBefore);
  await expect.poll(() => page.getByTestId('home-coming-up').innerText()).toBe(comingBefore);
  await page.goto(`${base}#/growth/progress`);
  await expect(page.getByTestId('progress-all').getByTestId('fraction')).toHaveText(progressBefore!);
  await page.goto(`${base}#/growth/milestone/cdc22-m12-mp-03`);
  await expect(page.getByTestId('entries')).toContainText('Fictional Checkpoint 3 observation');
  await page.goto(`${base}#/growth/goals/my`);
  await expect(page.locator('body')).toContainText('Fictional Checkpoint 3 goal');
  await page.goto(`${base}#/growth/exercises`);
  await expect(page.getByTestId('daily-count')).toHaveText('1 of 1 session done');
  await page.goto(`${base}#/calendar`);
  await expect(page.getByTestId('overlay-vaccines')).toHaveAttribute('aria-pressed', 'true'); // the overlay choice is kept
  await expect(page.getByTestId('upcoming-events').locator('.cal-event-title')).toHaveText(['Fictional Checkpoint 3 checkup', 'Fictional Checkpoint 3 visit']);
  // The other child: their own theme and photograph, and an empty journal.
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: /Sample Child B/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sage');
  await page.goto(`${base}#/journal`);
  await expect(page.getByTestId('journal-empty')).toBeVisible();
  await page.goto(`${base}#/home`);
  await expect(page.locator('.child-hero .avatar img')).toBeVisible();
});
