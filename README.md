# Roll, Crawl, RUN: Tracking Growth Together

A private, local-first, installable web app (PWA) that helps parents document their child's development, appointments, and reflections. It runs entirely in the browser: no account, no server, no analytics, and no AI.

> **Status (2026-11-26):**
> - **Checkpoint 1 — completed, accepted and deployed.** Live app: https://jcandm1088.github.io/roll-crawl-run/ (deployed commit `e40287f`). Repository: https://github.com/jcandm1088/roll-crawl-run.
> - **Checkpoint 2a — implemented, awaiting the owner's acceptance testing.** Verified CDC milestone tracking, refined after the owner's first hands-on review: Growth with Progress (review), the Milestone Library (record; 159 CDC milestones), Goals & Exercises (coming soon) and What to Expect at Every Age (a read-only guide), plus milestone history and one Notes & Observations section per milestone. A second owner review led to the human acceptance refinements (gender-neutral wording, plainer language, no personal-version creation, the age-settings link). The original 2a commit is on `checkpoint-2a` (`73d9f6f`); the Growth UX refinement is on `claude/beautiful-allen-1vjobt` (`170cc99`); the acceptance refinements are a local commit. **Not** merged into `main` and **not** deployed.
> - **Planned, not started:** Checkpoint 2b (Goals & Exercises, charts) and Checkpoints 3–6 (Calendar, Journal, Resources, backups and sharing, reports). These appear in the app as labeled placeholders.
> - **Owner's hands-on testing (Checkpoint 1):** Mac Safari acceptance passed. On a physical iPhone, Home Screen install, later launches, local persistence, and offline launch and navigation passed. The first iPhone load showed a one-time “server not responding” delay whose cause has not been established. Checkpoint 2a has **not** yet been tested in Safari or on an iPhone.
> - **Automated tests:** 252 unit and 135 end-to-end tests (headless Chromium) after the Growth UX refinement; 228 and 111 at the original Checkpoint 2a; 185 and 80 at Checkpoint 1.
> - **Current state and next steps:** `docs/HANDOFF.md`.

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

The first command runs the Vitest unit tests: dates, ages, intervals, theme contrast, storage, and milestone content, applicability, progress and history. The second runs the Playwright end-to-end tests against the production build, including offline use and accessibility scans.

## Deploy (GitHub Pages) — manual only

Pushing code **never** publishes the app.
1. Push to a public GitHub repository named `roll-crawl-run`. This happens only when the owner authorizes it.
2. In the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.
3. To publish, open **Actions → Deploy to GitHub Pages → Run workflow** and type `deploy`. The workflow type-checks, runs the unit tests, builds, and publishes `dist/` from `main`.

The app uses relative paths and hash routes, so it works at `https://<username>.github.io/roll-crawl-run/`.

## Project structure

```
src/domain/      pure, deterministic logic (dates, age, intervals, contrast)
src/content/     bundled, versioned CDC milestone content, source register, locked IDs, guide text
src/data/        IndexedDB schema, transactions, repositories (only layer touching storage)
src/state/       app state and theme application
src/ui/          components, screens, styles, theme tokens
src/sw/          service worker and registration
tests/unit       Vitest     tests/e2e  Playwright     tests/fixtures  fictional data only
docs/            handoff, plan, build log, decisions, testing checklist, limitations, refinement backlog,
                 sources, milestone inventory, design system, reviews/, branding/ (logo concepts), screenshots/
```

## Privacy in the repository

The repository never contains personal information. Tests use only fictional sample data. Export and backup files (`*.rcr.json`) are git-ignored.

## Credits and third-party licenses

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The full license texts are in `public/licenses/`, ship with the app, and are linked from **Settings → About**. No license for the application itself has been chosen yet.


- Fonts: Fraunces and Inter (SIL Open Font License 1.1), via @fontsource, bundled with the app
- Icons: Lucide (ISC)
- Logo: “Growing Together”, original artwork made for this project (`src/ui/brand/growing-together.json`)
- Libraries: Preact (MIT), idb (ISC)

## Resuming development
Each cloud conversation works in its own temporary copy of the repository. Only what has been pushed to GitHub (or kept in an owner-held backup) carries over to a new conversation.
1. Start a Claude Code session with this repository attached (`jcandm1088/roll-crawl-run`), or upload the latest project ZIP.
2. Ask Claude to read `docs/HANDOFF.md` (current state) and `docs/DEVELOPMENT_PLAN.md` (the R-sections, newest first, take precedence over the original plan).
3. Ask Claude to verify the workspace against `docs/HANDOFF.md` section 2: remote `main`, the latest checkpoint branch (currently `checkpoint-2a`), the expected commit hashes, and a clean working tree. If an expected commit is missing, it must stop and report rather than reconstruct anything.
4. Install the dependencies:
   ```bash
   npm ci
   ```
5. Run the unit tests and the end-to-end tests to confirm a green baseline:
   ```bash
   npm test
   ```
   ```bash
   npm run test:e2e
   ```
6. At the end of a checkpoint, preserve the work on a separate remote branch only after a publication safety review and the owner's explicit authorization (see `docs/HANDOFF.md` section 7).
