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
import { rmSync } from 'node:fs';

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
