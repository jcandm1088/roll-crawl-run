/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/**
 * Builds the service worker after the app bundle is generated:
 * injects the exact list of files to precache and a content-derived cache version.
 */
function serviceWorkerPlugin(): Plugin {
  return {
    name: 'rcr-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      // Legacy .woff fallbacks are skipped: every supported browser uses the .woff2 files.
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map') && !f.endsWith('.woff'));
      const publicFiles = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.svg'];
      const precache = ['./', ...files, ...publicFiles].map((f) => (f === './' ? f : `./${f}`));
      const hash = createHash('sha256').update(pkg.version).update(files.sort().join('|'));
      for (const f of files) {
        const item = bundle[f]!;
        hash.update(item.type === 'chunk' ? item.code : typeof item.source === 'string' ? item.source : Buffer.from(item.source));
      }
      const template = readFileSync(new URL('./src/sw/service-worker.js', import.meta.url), 'utf8');
      hash.update(template);
      const source = template
        .replace('__PRECACHE_LIST__', JSON.stringify(precache))
        .replace('__CACHE_VERSION__', JSON.stringify(`rcr-${pkg.version}-${hash.digest('hex').slice(0, 10)}`));
      this.emitFile({ type: 'asset', fileName: 'service-worker.js', source });
    },
  };
}

/** Strict Content-Security-Policy for production builds (dev server needs inline HMR scripts). */
function cspPlugin(): Plugin {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ');
  return {
    name: 'rcr-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${csp}" />`);
    },
  };
}

export default defineConfig({
  // Relative base works for GitHub Pages project URLs (/roll-crawl-run/) and for local preview.
  base: './',
  plugins: [preact(), cspPlugin(), serviceWorkerPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2020',
    modulePreload: { polyfill: false },
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
