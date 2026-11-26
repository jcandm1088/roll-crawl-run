# Handoff — End of Checkpoint 1

## Project status
- **Checkpoint 1 (Design & Foundation): complete, accepted, and deployed.**
- **Live:** https://jcandm1088.github.io/roll-crawl-run/ · **Repo:** https://github.com/jcandm1088/roll-crawl-run (public, branch `main`)
- **Deployed commit:** `e40287f`. The newest commit (“Checkpoint 1: Deployment Acceptance and Handoff”) changes documentation only and has **not** been deployed; no redeploy is needed for it.
- **Checkpoints 2–6: not started.**
- **Owner testing:**
  - Mac Safari acceptance passed (six criteria).
  - Physical iPhone: install, later launches, local persistence, and offline launch and navigation passed.
  - A one-time initial “server not responding” delay occurred on the iPhone; its cause has not been established (see `docs/reviews/DEPLOYMENT_ACCEPTANCE.md`).
- **Automated:** 185 unit and 80 end-to-end tests passing (Chromium).

## Approved decisions to carry forward
**Platform and data**
- Vite + TypeScript + Preact, with IndexedDB (`idb`) as a local-first store.
- No accounts, servers, analytics, or AI.
- Strict content security policy; offline-first service worker.

**Navigation and screens**
- Five tabs: Home, Growth, Calendar, Journal, Resources. Profiles and Settings are reached from the top-right control.
- The child selector is a downward popover.
- **Growth sections, in this order:** Progress → Goals & Exercises → What to Expect at Every Age → Milestone Library.
- **Calendar** opens straight to the current month, with today highlighted, month navigation, an agenda view, and upcoming events below.
- **Settings:** Profiles and Appearance always open; Your Data, Calendar & Reminders, This Device, and About as collapsed accordions.

**Appearance**
- Themes: Earth (default), Sky, Blush (revised baby pink), Lavender, Sage. Themes are **chosen per child** (stored per device).
- **Typography Option B:** Inter for all functional text. Fraunces only for the wordmark. Use the shared heading tokens and `PageHeader`.
- **Logo:** Concept 5, “Growing Together” (`src/ui/brand/growing-together.json`).

**Behavior**
- **Personal age display:** precise years, months, and days (`formatPreciseAge`), refreshed at midnight and on resume. Developmental age groupings are separate.
- **Corrected age:** optional, entered as a due date or as weeks at birth, with safeguards. Chronological age is always visible.
- **Destructive actions** sit inside collapsed “Advanced” sections and need two steps: type RESET, or type DELETE PROFILE, then a final confirmation.
- Profile and photo saves are atomic, with retry-safe IDs. Dialogs trap focus; radio groups use roving tabindex.

**Project rules**
- **Deployment:** manual only (`workflow_dispatch` plus typing `deploy`). Action versions are intentionally left unchanged for now.
- **Licensing:** third-party notices are in `THIRD_PARTY_NOTICES.md` and `public/licenses/`. **No license for the app itself (deferred).**
- **Language:** parent-friendly; no grading tone. Keep the required medical, privacy, source, and destructive-action disclosures.
- **Process:** stop at each checkpoint for the owner's review. Use fictional data only. Never claim tests that were not run.

## Outstanding limitations
See `docs/KNOWN_LIMITATIONS.md`. Key items:
- There is no backup or export yet (Checkpoint 5), so data lives only on the device.
- Untested on Android; several iPhone checks are still open (see the deployment acceptance review).
- The cause of the initial iPhone connectivity delay is unknown.
- iOS may keep an old Home Screen icon after a logo change until the app is re-added.
- The GitHub Action versions are older majors; review them before relying on future deployments.
- No developmental or medical content exists yet.

## Prerequisites for Checkpoint 2 (Developmental tracking)
1. **Source access (blocking).** The build environment cannot reach cdc.gov, healthychildren.org, aap.org, or pathways.org. Choose one:
   - allow those hosts in this environment's network settings (Claude can request the change for your approval), or
   - provide the CDC “Learn the Signs. Act Early.” milestone checklists (2022 revision) yourself, for example as PDFs or saved pages.

   Source verification and a usage-permission review are mandatory before any milestone content is added.
2. **Owner review of the content once drafted:**
   - spot-check milestone transcriptions against the sources
   - review the gross vs. fine motor category assignments (D1)
   - confirm any supporting activities and their sources (D15)
3. **Confirm the Checkpoint 2 scope** from the plan (R4/R5/R6 order and wording):
   - milestone library and statuses with history
   - What to Expect at Every Age (intervals, empty-interval panel, cumulative view)
   - Progress meters (achieved ÷ applicable; separate “emerging” count; empty states)
   - Goals & Exercises with recurrence and completion history
   - developmental history charts
4. **Optional decisions:**
   - the partner-sharing theme rule (plan R5) before Checkpoint 5
   - whether to upgrade the GitHub Action versions before the next deployment

## Starting the next session
See the instructions at the end of the final report, also kept in `README.md` → “Resuming development”.
