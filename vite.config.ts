/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { readdirSync, readFileSync } from 'node:fs';
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
      // Third-party license texts are precached so they are available offline after installation.
      const licenseFiles = readdirSync(new URL('./public/licenses/', import.meta.url)).sort().map((f) => `licenses/${f}`);
      const publicFiles = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.svg', ...licenseFiles];
      const precache = ['./', ...files, ...publicFiles].map((f) => (f === './' ? f : `./${f}`));
      const hash = createHash('sha256').update(pkg.version).update(process.env['RCR_BUILD_TAG'] ?? '').update(files.sort().join('|'));
      // Public files (icons, manifest) are part of the version too, so changing the
      // logo produces a new service worker and existing installs fetch the new icons.
      for (const f of publicFiles) hash.update(readFileSync(new URL(`./public/${f}`, import.meta.url)));
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

/** Build-time validation of the sourced milestone catalog: the build fails on any content error. */
function milestoneContentPlugin(): Plugin {
  return {
    name: 'rcr-milestone-content',
    async buildStart() {
      const { validateContent, MILESTONES, PAGE_SOURCES } = await import('./src/domain/milestones');
      const lock = JSON.parse(readFileSync(new URL('./src/content/milestone-ids.lock.json', import.meta.url), 'utf8')) as Record<string, string>;
      const errors = validateContent(MILESTONES, PAGE_SOURCES, lock, (s) => createHash('sha256').update(s).digest('hex').slice(0, 16));
      if (errors.length) this.error(`Milestone content validation failed:\n${errors.join('\n')}`);
      // Educational guide (What to Expect): traceability to verified milestones and registered sources.
      const { validateGuide } = await import('./src/domain/guide');
      const guideErrors = validateGuide();
      if (guideErrors.length) this.error(`Guide content validation failed:\n${guideErrors.join('\n')}`);
      // Gender-neutral display wording: exactly the CDC text with only declared pronoun/agreement changes.
      const { validateDisplay } = await import('./src/domain/milestoneDisplay');
      const { CONTENT_VERSION } = await import('./src/domain/milestones');
      const displayErrors = validateDisplay(undefined, undefined, CONTENT_VERSION);
      if (displayErrors.length) this.error(`Milestone display wording validation failed:\n${displayErrors.join('\n')}`);
      // Recommended activities (Checkpoint 2b): verbatim CDC records, validated display fields, locked ids.
      const { validateActivities } = await import('./src/domain/activities');
      const activityLock = JSON.parse(readFileSync(new URL('./src/content/activity-ids.lock.json', import.meta.url), 'utf8')) as Record<string, string>;
      const activityErrors = validateActivities(undefined, activityLock, (s) => createHash('sha256').update(s).digest('hex').slice(0, 16));
      if (activityErrors.length) this.error(`Activity content validation failed:\n${activityErrors.join('\n')}`);
      // Age-responsive goal ideas (R-010): app-written, traced to verified milestones and activities.
      const { validateGoalIdeas } = await import('./src/domain/goalIdeas');
      const ideaErrors = validateGoalIdeas();
      if (ideaErrors.length) this.error(`Goal idea validation failed:\n${ideaErrors.join('\n')}`);
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
  plugins: [preact(), milestoneContentPlugin(), cspPlugin(), serviceWorkerPlugin()],
  define: {
    // RCR_BUILD_TAG is only used by the automated update test to produce two distinct builds.
    __APP_VERSION__: JSON.stringify(process.env['RCR_BUILD_TAG'] ? `${pkg.version}+${process.env['RCR_BUILD_TAG']}` : pkg.version),
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
