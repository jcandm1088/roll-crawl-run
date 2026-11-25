# Roll, Crawl, RUN: Tracking Growth Together

A private, local-first, installable web app (PWA) that helps parents document their child's development, appointments, and reflections. It runs entirely in the browser: no account, no server, no analytics, and no AI.

> **Status: Checkpoint 1 — Design & Foundation, revised after the owner's hands-on review** (see `docs/reviews/CHECKPOINT_1_REVIEW.md`). Branding, themes, navigation, onboarding, child profiles, age calculation, local storage, and a basic offline-capable PWA shell are built. Growth, Calendar, Journal, Resources, sharing, and reports are **not built yet**. They show as clearly labeled placeholders.

## Important limitations

- This is an organizing and documentation tool. It does **not** diagnose, screen for, or treat anything, and it does not replace advice from your child's healthcare providers.
- Data is stored **only in this browser on this device** (IndexedDB). It is not encrypted or password-protected, and it can be lost if browser data is cleared, the app is removed, or the device is lost.
- See [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).

## Run it locally

Requires Node.js 22.

```bash
npm install
```

```bash
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173/). The service worker is only active in the production build:

```bash
npm run build && npm run preview
```

Then open http://localhost:4173/.

## Tests

```bash
npm test
```

```bash
npm run test:e2e
```

The first command runs the Vitest unit tests: dates, ages, intervals, theme contrast, and storage. The second runs the Playwright end-to-end tests against the production build, including offline use and accessibility scans.

## Deploy (GitHub Pages) — manual only

Pushing code **never** publishes the app.
1. Push to a public GitHub repository named `roll-crawl-run`. This happens only when the owner authorizes it.
2. In the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.
3. To publish, open **Actions → Deploy to GitHub Pages → Run workflow** and type `deploy`. The workflow type-checks, runs the unit tests, builds, and publishes `dist/` from `main`.

The app uses relative paths and hash routes, so it works at `https://<username>.github.io/roll-crawl-run/`.

## Project structure

```
src/domain/      pure, deterministic logic (dates, age, intervals, contrast)
src/data/        IndexedDB schema, transactions, repositories (only layer touching storage)
src/state/       app state and theme application
src/ui/          components, screens, styles, theme tokens
src/sw/          service worker and registration
tests/unit       Vitest     tests/e2e  Playwright     tests/fixtures  fictional data only
docs/            plan, build log, decisions, testing checklist, limitations, sources, design system,
                 reviews/, branding/ (logo concepts), screenshots/
```

## Privacy in the repository

The repository never contains personal information. Tests use only fictional sample data. Export and backup files (`*.rcr.json`) are git-ignored.

## Credits

- Fonts: Fraunces and Inter (SIL Open Font License 1.1), via @fontsource, bundled with the app
- Icons: Lucide (ISC)
- Libraries: Preact (MIT), idb (ISC)
