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
