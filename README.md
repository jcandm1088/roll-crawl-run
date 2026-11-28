# Roll, Crawl, RUN: Tracking Growth Together

A private, local-first, installable web app (PWA) that helps parents document their child's development, appointments, and reflections. It runs entirely in the browser: no account, no server, no analytics, and no AI.

> **Status (2026-11-28): complete, accepted and published.**
> - **Live app:** https://jcandm1088.github.io/roll-crawl-run/ (deployed commit `831a0dd`). Home, Growth, Calendar and Journal.
> - **Accepted by the owner** in Mac Safari, checkpoint by checkpoint, and on a physical iPhone as an installed app: all 12 device requirements satisfied. One iPhone layout defect in date and time fields was found there, corrected and re-verified on the device.
> - **What it does not have:** backup or restore (data lives only on the device, unencrypted), sharing, provider reports, Resources, Journal photographs. These are deferred, not built.
> - **What was not tested:** see `docs/KNOWN_LIMITATIONS.md` (final section) and `docs/TESTING_CHECKLIST.md`. Automated tests ran in headless Chromium only.
> - No further development is planned for the submission version. Current state: `docs/HANDOFF.md`. *The dated notes below are the project's history and are superseded where they conflict with the lines above.*
>
> **Earlier status notes (2026-11-27 and 2026-11-28, kept as history):**
> - **Checkpoint 1 — completed, accepted and deployed.** Live app: https://jcandm1088.github.io/roll-crawl-run/ (deployed commit `e40287f`). Repository: https://github.com/jcandm1088/roll-crawl-run.
> - **Checkpoint 2a** (history): Verified CDC milestone tracking, refined after the owner's first hands-on review: Growth with Progress (review), the Milestone Library (record; 159 CDC milestones), Goals & Exercises (coming soon) and What to Expect at Every Age (a read-only guide), plus milestone history and one Notes & Observations section per milestone. A second owner review led to the human acceptance refinements (gender-neutral wording, plainer language, no personal-version creation, the age-settings link). The original 2a commit is on `checkpoint-2a` (`73d9f6f`); the Growth UX refinement is on `claude/beautiful-allen-1vjobt` (`170cc99`); the acceptance refinements are a local commit. **Not** merged into `main` and **not** deployed.
> - **Checkpoint 2a accepted for Mac usability (2026-11-27);** physical iPhone acceptance pending.
> - **Submission scope (2026-11-27):** remaining work is Checkpoint 3 (Simplified Calendar), Checkpoint 4 (Journal; the Resources tab is removed from the submission version) and Checkpoint 6 (final testing, deployment, iPhone acceptance). Backups, sharing, provider reports (Checkpoint 5) and Resources are deferred until after submission, so the submission version has **no backup or restore**: data lives only on the device.
> - **Checkpoint 2b-R — human acceptance refinements, accepted by the owner in Mac Safari (GR1–GR15 passed; iPhone checks deferred to Checkpoint 6). Preserved on `claude/vigilant-keller-w6ss5f`; not merged or deployed.** *(Earlier wording: “implemented locally, awaiting the owner's acceptance”.)* After the owner's Mac Safari acceptance of 2b (64 of 65 applicable checks): age-responsive goal ideas, less repetitive CDC attribution on activity pages, aligned exercise-form headings and duration fields, deleting sessions without placeholders, a tidier stopwatch recovery notice, and full 6- and 12-month reporting periods. Database version 3 unchanged. Automated tests in headless Chromium.
> - **Checkpoint 2b — initial owner acceptance in Mac Safari (64/65), preserved on `claude/upbeat-thompson-skpm8j` (`64202e2`).** Goals & Exercises: My Goals (personal goals and standalone achievements, inspiration), Exercises (CDC activity tips, the parent's own and provider-directed exercises; simple, stopwatch and repetition tracking; schedules up to 24 sessions a day; Today's routine and a Home card), a Personal progress summary and Progress over time charts, and optional conversion or deletion of legacy personal entries. Database version 3. Not pushed, merged or deployed; tested only in headless Chromium.
> - **Checkpoint 3 — Simplified Calendar: accepted by the owner in Mac Safari** (CAL1–CAL33; keyboard and offline editing not human-tested; iPhone deferred to Checkpoint 6). Presentation refinements R-019 to R-022 are accepted (the corrected medical symbol through delegated secondary review). **Checkpoint 3 is formally accepted and preserved on `claude/great-dijkstra-wwi9g1`**; not merged into `main`, not deployed. A record-keeping calendar with medical and personal events and an optional CDC vaccine schedule reference (off by default). Database version 3 unchanged.
> - **Checkpoint 4 — Journal: implemented in a local commit, awaiting the owner's review and Mac acceptance** (not pushed, merged or deployed). One journal per child with Personal Reflections and Care Notes, optional titles and tags, search and filters, and provider questions that can be marked answered. The primary tabs are now Home, Growth, Calendar and Journal; Resources is not in the submission version. Database version 3 unchanged. See `docs/reviews/CHECKPOINT_4_IMPLEMENTATION_REPORT.md`.
> - **Checkpoint 4-R (2026-11-28):** the owner's Mac Safari acceptance passed 23 checks, failed one (the two entry types looked too alike) and left 7 untested. Three refinements are implemented locally and await reacceptance: four single-selection Journal views, tinted Care Note cards, and a correction so that switching children can't reopen the entry form. See `docs/reviews/CHECKPOINT_4_R_REFINEMENT_REPORT.md`.
> - **Checkpoint 4-R2 (2026-11-28):** the Calendar's “New event” shortcut had the same defect as the Journal's and is corrected locally. A separate Journal defect found on the way (typed text can be lost if the entry form is open while the list is still loading; R-028) is documented and awaits a decision.
> - **Checkpoint 4-R3 (2026-11-28):** R-028 is corrected locally: an open Journal entry form keeps what was typed when the list finishes loading. 475 unit and 292 end-to-end tests.
> - **Checkpoint 4 — formally accepted (2026-11-28)** with refinements R-024 to R-028: the owner's combined Mac Safari reacceptance passed 17 of 17 checks. Preserved on `claude/awesome-ritchie-b198ya`; not merged into `main`, not deployed. All submission-version functional checkpoints are now accepted. Seven Journal checks and all iPhone checks remain for final acceptance.
> - **Next: Checkpoint 6** (final verification and publication; no new features). Checkpoint 5 (backups, sharing, reports), Resources and Journal photographs stay deferred until after submission. *(The two status lines below are earlier and superseded.)*
> - *(Earlier)* **Next:** the owner's reacceptance of Checkpoint 4, then Checkpoint 6 (final testing, deployment, iPhone acceptance). Checkpoint 5 (backups, sharing, reports) and Resources are deferred until after submission. *(Earlier wording, superseded: “Journal and Resources appear in the app as labeled placeholders.”)*
> - **Owner's hands-on testing (Checkpoint 1):** Mac Safari acceptance passed. On a physical iPhone, Home Screen install, later launches, local persistence, and offline launch and navigation passed. The first iPhone load showed a one-time “server not responding” delay whose cause has not been established. Checkpoint 2a has **not** yet been tested in Safari or on an iPhone.
> - **Automated tests:** see `docs/BUILD_LOG.md`. Checkpoint 4-R: 475 unit and 286 end-to-end (headless Chromium). Checkpoint 4: 472 and 280. Checkpoint 3: 427 and 251. Checkpoint 2b-R: 379 unit, 219 end-to-end. Checkpoint 2b: 360 unit and 201 end-to-end. Earlier: 282 unit and 155 end-to-end at the accepted 2a; 252 unit and 135 end-to-end tests (headless Chromium) after the Growth UX refinement; 228 and 111 at the original Checkpoint 2a; 185 and 80 at Checkpoint 1.
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
src/domain/      pure, deterministic logic (dates, age, intervals, schedules, stopwatch, charts, contrast)
src/content/     bundled, versioned CDC milestone and activity content, source register, locked IDs, guide text
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
