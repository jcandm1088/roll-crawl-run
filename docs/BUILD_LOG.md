# Build Log

Maintained by the student. Each entry records what was asked of Claude Code, what it produced, and what was corrected or redirected. Do not record results that didn't happen.

## Entry template
**Date:**
**What I asked Claude Code to do:**
**What it produced:**
**What I corrected or redirected:**
**Notes / next steps:**

---

<!-- Add your entries below. -->

## Draft entry — Checkpoint 1 review (drafted by Claude Code from the owner's review notes; edit before submitting)
**Date:**
**What I asked Claude Code to do:** After testing a production build on my Mac (plus a secondary AI review), I asked for Checkpoint 1 revisions only:
- fix the child selector, which appeared above the top of the window
- give the privacy-screen heading more space
- remove "Chronological age" from Home
- switch some headings from Fraunces to Inter because of their letterforms (J, f)
- rename and reorder the Growth sections
- new Growth and Resources wording
- put Settings sections in collapsed accordions
- hide reset and profile deletion under "Advanced" sections with two-step confirmation
- revise Blush to a baby pink
- create five logo concepts
- investigate four technical issues from the secondary review
- make deployment manual-only
- record future Calendar and backup requirements and language standards in the plan

**What it produced:** See `docs/reviews/CHECKPOINT_1_REVIEW.md`. Claude Code reproduced the selector defect by forcing the same positioning condition in Chromium and fixed it with a portal-rendered downward dropdown. It confirmed and fixed all four secondary-review issues and found and fixed a routing timing issue. It added regression tests, a typography A/B comparison, before-and-after screenshots, and logo concepts.
**What I corrected or redirected:** The selector defect, overly prominent destructive actions, unwanted heading letterforms, privacy-screen spacing, the overwhelming Settings page, technical wording, and the preferred Growth hierarchy (all from my hands-on review).
**Notes / next steps:** A second hands-on review on my Mac; choose typography A or B and a logo direction.

## Draft entry — Checkpoint 1 final refinement (drafted by Claude Code from the owner's notes; edit before submitting)
**Date:**
**What I asked Claude Code to do:** After testing the revised build in Safari on my Mac, where I confirmed the child selector now works, I approved most changes. I asked for:
- per-child themes
- typography Option B, because the Journal heading font didn't match the other tabs
- adopting logo Concept 5
- two small technical fixes from the secondary review: focus trapping and the selector's minimum height

**What it produced:** Per-child themes stored on the device, with a safe migration of existing profiles to schema v2. Shared heading styles and a single page-heading component (Inter). The approved logo, used everywhere including the installed icons. Confirmed and fixed both technical issues. New unit tests, end-to-end tests, and an update test that installs the actual previous version and upgrades it. See `docs/reviews/CHECKPOINT_1_FINAL.md`.
**What I corrected or redirected:** The typography inconsistency (Journal heading), the request for per-child themes, and the logo choice.
**Notes / next steps:** A third hands-on review; then approval of Checkpoint 1 and the decision about network access to sources for Checkpoint 2.

## Draft entry — Precise age display (drafted by Claude Code from the owner's report; edit before submitting)
**Date:**
**What I asked Claude Code to do:** During my final acceptance testing I found that Home showed ages only in months and days (a 2-year-3-month-old appeared as “27 months”). I asked for the precise age to the calendar day, in years, months, and days, updating automatically when the date changes.
**What it produced:**
- One central precise-age formatter reusing the existing calendar calculation, used on Home, the profile list, and the forms.
- A live “today” that updates at midnight and when the app resumes.
- Unit and end-to-end tests covering every requested case.
- Screenshots of several age groups.

Developmental groupings and the database were unchanged. See `docs/reviews/CHECKPOINT_1_PRECISE_AGE.md`.
**What I corrected or redirected:** The age display usability defect I observed.
**Notes / next steps:** Re-check on my Mac; approve Checkpoint 1.

## Draft entry — Publication compliance (drafted by Claude Code; edit before submitting)
**Date:**
**What I asked Claude Code to do:** After accepting Checkpoint 1, I asked for a pre-publication audit. I then approved adding third-party license notices (A), deferred a project license (B), kept the commit history unchanged (C), asked it to verify whether the session URLs in commit messages are private (D), and approved documentation updates (E). I authorized a private push only if every check passed.
**What it produced:**
- Third-party notices and license texts, available offline and linked from Settings → About.
- A small service-worker fix so license files open correctly.
- Tests for the licenses.
- Updated status documentation.
- A local commit.

It could not establish whether the session URL is private, so it stopped before pushing, as instructed.
**What I corrected or redirected:**
**Notes / next steps:** Confirm the session-link privacy; then authorize the private push.

## Draft entry — Deployment and physical-device testing (drafted by Claude Code from the owner's report; edit before submitting)
**Date:**
**What I asked Claude Code to do:** After I confirmed the session link is private, I authorized pushing the existing history to my public repository. I then enabled GitHub Pages and ran the manual deployment myself.
**What it produced:**
- Verified the repository was public and empty, and pushed `main` without force; the remote matched local `e40287f`, with all five commits.
- Afterwards, documentation-only updates and a handoff document.

**What I tested myself (physical iPhone):** the deployment succeeded; the live URL works; I added the app to the Home Screen; later launches, local persistence, and offline launch and navigation passed. On the first attempt the app showed “server not responding” after about a minute, then loaded with no changes. The cause is unknown.
**Notes / next steps:** Checkpoint 2 needs access to the CDC/AAP sources first (see `docs/HANDOFF.md`).

---

## Project history summary (factual; for the final write-up)
| Stage | Commit | What happened |
|---|---|---|
| Planning | — | Plan drafted; the owner revised it twice (R2, R3) with decisions D1–D15 and Q1–Q11; Checkpoint 1 only was authorized. |
| Checkpoint 1 build | `a4e12b5` | Foundation: themes, navigation, onboarding, profiles, ages, IndexedDB, PWA; 140 unit and 28 end-to-end tests. |
| Owner review 1 (Mac) | `ade3171` | The owner found an off-screen child selector, prominent destructive actions, unwanted heading letterforms, tight privacy spacing, and an overwhelming Settings page. Fixed, plus four secondary-review issues and a routing timing bug. |
| Owner review 2 (Mac Safari) | `820bb0e` | Selector fix confirmed by the owner. Per-child themes, typography Option B, logo Concept 5, focus-trap and selector-height fixes, and a schema v2 migration. |
| Acceptance testing | `873ed1c` | The owner found ages shown only in months (“27 months”); fixed with precise years, months, and days. |
| Publication compliance | `e40287f` | Third-party license notices, a service-worker file-navigation fix, and doc updates. Session-URL privacy verified by the owner; pushed. |
| Deployment | (`e40287f` deployed) | The owner deployed via the manual workflow and tested on an iPhone (see above). |
| Handoff | `aa8c869` | Documentation only (the end-of-Checkpoint-1 handoff). *(Originally written as “this commit”; the hash is added for clarity.)* |
| Checkpoint 2a build | `73d9f6f` | Verified CDC milestone tracking; 228 unit and 111 end-to-end tests reported. Committed locally; not merged into `main` or deployed. Awaiting owner acceptance. |
| Conversation transfer and recovery | `73d9f6f` on `checkpoint-2a` | The new conversation's workspace lacked the unpushed 2a commit. The original commit was pushed to a separate branch from the previous conversation and verified unchanged. |
| Handoff consolidation | (documentation-only commit after `73d9f6f`) | Single current-state handoff, refinement backlog, recovery record, challenge log, baseline re-run. Local only. |

## Draft entry — Checkpoint 2a: Verified Milestone Tracking (drafted by Claude Code; edit before submitting)
**Date:**
**What I asked Claude Code to do:**
- Set up a dedicated environment with access to the CDC, AAP, HealthyChildren and Pathways sites.
- Verify the CDC milestone sources and prepare an inventory for my review.
- After I approved the inventory, the gross/fine motor classifications and the safeguards, build milestone tracking (Checkpoint 2a only).

**What it produced:**
- The source verification and the 159-item inventory.
- The CDC content with locked IDs and build-time validation.
- What to Expect, the Milestone Library, milestone detail with history, personal versions, Progress, live Home cards, and the Settings preferences section.
- Tests, screenshots, and documentation.

**What I corrected or redirected:**
- Approved the borderline classifications and kept CDC pronouns.
- Required that boundary ages never hide current milestones, and that permanent deletion still works alongside history.
- Excluded AAP content and had those domains removed.

**Issues found during the work (factual):**
- AAP's terms restrict automated and AI access. Three AAP pages had already been loaded and saved; the copies were deleted and the content was not used.
- The preparation report's "151 of 159 match word for word" was wrong: the check compared words, not exact wording. A strict re-check found 133 exact matches; the 26 others were checked visually (10 pronoun-only and 2 wording differences in the older PDFs).
- History entries recorded within the same millisecond could sort out of order; fixed with recording timestamps that always increase.
- The current-interval rule was aligned with the milestone rule at boundary ages.

**Notes / next steps:** My hands-on review of 2a; then the decision on Checkpoint 2b.

## Draft entry — Conversation transfer, recovery and handoff consolidation (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-26
**What I asked Claude Code to do:**
- Continue the project in a new conversation, to manage context use, and first verify that the workspace contained the unpublished Checkpoint 2a commit, stopping if it did not.
- After recovery, consolidate the handoff documentation, create a refinement backlog, record the project's significant challenges, and re-run the full automated baseline.

**What it produced:**
- A verification report showing the new workspace contained only `aa8c869`: the 2a commit (`73d9f6f`) and its files were missing. It stopped without reconstructing or resetting anything.
- After the previous conversation pushed the original commit to `checkpoint-2a`, verification of its hash, parent and seven-commit history, and a read-only documentation review identifying outdated statements.
- A consolidated `docs/HANDOFF.md`, the preserved `docs/reviews/CHECKPOINT_1_HANDOFF.md`, `docs/REFINEMENT_BACKLOG.md`, corrections to the README, limitations, decisions and plan, this entry, and the challenges section below.

**What I corrected or redirected:**
- Recovered the commit through the previous conversation and a separate remote branch, after a publication safety audit.
- Reported R-001 (onboarding name-input overflow) from my own mobile use.
- Asked that remote checkpoint preservation become part of the workflow.

### Recovery and baseline verification (run by Claude Code on the recovered commit `73d9f6f`, 2026-11-26)
Run in this conversation's workspace (Linux, Node 22.23.5, headless Chromium). No application code was changed before or during the run.

| Check | Command | Result | Previously reported |
|---|---|---|---|
| Install | `npm ci` | Passed, 0 vulnerabilities | — |
| Type check | `npm run typecheck` | Passed | Passed |
| Unit tests | `npm test` | **228 passed** (9 files) | 228 |
| Production build | `npm run build` | Passed; JavaScript bundle 217.21 KB (55.96 KB gzip), consistent with Decision #60 | Passed |
| Milestone content validation | build plugin (`validateContent`, fails the build on any error) and `tests/unit/milestoneContent.test.ts` | Build passed with no validation errors; **17 of 17** content tests passed. Separately: 159 items, 159 unique IDs, 159 locked IDs | 159 items |
| End-to-end tests | `npm run test:e2e` | **111 passed** (1.7 min), no failures or retries | 111 |

**Discrepancies:** none. The only warning was Vite's advisory about a future configuration-loader default (file extensions and JSON import attributes); it does not affect the build or the tests. These are automated results only; they are not owner acceptance.

**Notes / next steps:** My hands-on acceptance testing of Checkpoint 2a (G1–G19).

---

## Significant challenges — Checkpoints 1 and 2a (factual record)
Compiled on 2026-11-26 from the review documents, decisions and earlier entries in this log. Each item is classified. “Observed by the owner” means the owner reported it from hands-on use; nothing here claims human verification that did not happen.

**Classification key:** **Confirmed defect** (the app behaved incorrectly, cause established) · **Design refinement** (a preference or quality change, not a malfunction) · **Testing defect** (a test or verification method was wrong or unreliable; the app may have been fine) · **Environmental limitation** (a constraint of the tools, network or hosting) · **Unresolved** (cause unknown or not yet fixed).

| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 1 | **Typography and visual consistency** | Design refinement | Owner review 1: Fraunces produced unwanted letterforms (the J in a child's name and in “Journal”, the f in “Profiles”). Option A changed only those headings; owner review 2 found the Journal heading still did not match the other tabs. | Option B adopted: Inter for all functional text, Fraunces only for the wordmark, shared heading tokens and one `PageHeader` (R5, `CHECKPOINT_1_FINAL.md`). |
| 2 | **Profile-selector positioning** | Confirmed defect | Observed by the owner on the Mac: the child selector opened above the top of the window. Cause: a fixed-position dialog inside the blurred sticky top bar, which some engines treat as its positioning container. Headless Chromium did not apply that rule, so automated tests passed. A related minimum-height defect in short windows was later confirmed from the secondary review. | Fixed with a portal-rendered downward dropdown and viewport-limited height. Owner confirmed the fix in Safari on the Mac (`CHECKPOINT_1_REVIEW.md` D-1, `CHECKPOINT_1_FINAL.md`). |
| 3 | **Precise age formatting** | Confirmed defect (usability) | Observed by the owner in acceptance testing: a 2-year-3-month-old was shown as “27 months”. | One `formatPreciseAge()` for all personal ages, kept current at midnight and on resume. Owner reported A1 as passing (`CHECKPOINT_1_PRECISE_AGE.md`). |
| 4 | **Human observation finding issues despite passing tests** | Pattern across items | Items 1–3 were found by the owner, not by the automated suite, which was passing each time. R-001 (onboarding input overflow) is a further owner observation. | Hands-on owner review stays mandatory at every checkpoint; automated results are never presented as acceptance. |
| 5 | **AAP and HealthyChildren source-use restrictions** | Environmental limitation (compliance) | During 2a preparation, three AAP-hosted pages were loaded automatically before AAP's Terms of Use were read. The terms restrict automated access and AI use without written permission. | Access stopped; saved copies deleted from the scratchpad; content not used. Owner excluded AAP and HealthyChildren and removed the domains. Corrective rule: review a source's terms before any automated collection; Pathways.org held until its terms are approved (`CHECKPOINT_2A_SOURCE_VERIFICATION.md` §4). |
| 6 | **CDC comparison method overlooked wording and pronoun differences** | Testing defect (verification method) | The preparation report said 151 of 159 items matched the PDFs “word for word”, but the check only tested whether each item's words appeared, so pronoun swaps passed. | Strict exact-sequence re-check: 133 exact, 26 non-exact, all 26 checked visually (14 extraction artifacts, 10 pronoun-only, 2 wording). The statement was corrected in the record; the CDC web pages remain canonical (§3). |
| 7 | **Premature navigation and ambiguous selectors in automated tests** | Testing defect | Reported in the previous conversation's 2a work: some end-to-end steps acted before the app had finished navigating, and some text-based selectors matched more than one element. Detailed failure output was not recorded in the repository; the current tests use exact-match role and label selectors. A related Checkpoint 1 case, a hash-routing timing gap, was an app defect surfaced by an intermittent end-to-end failure. | Tests corrected; the Checkpoint 1 routing gap was fixed by re-syncing the route (Decision #25). |
| 8 | **History entries within the same millisecond** | Confirmed defect (found by tests) | Milestone history entries recorded in the same millisecond could sort out of order. (A similar tie in profile ordering was found in Checkpoint 1, possible only in automated tests.) | Recording timestamps that always increase (Decision #54); an id tie-breaker for profiles. |
| 9 | **Atomicity test failed before entering the transaction** | Testing defect | A rollback test's injected failure happened before the transaction began, so it did not actually test that a mid-transaction failure rolls everything back. | The failure is now injected inside the transaction (after the record write is queued), and the test checks that records, history and personal versions are all unchanged (`tests/unit/milestones.test.ts`). |
| 10 | **Context utilization and conversation transfer** | Environmental limitation | Development moved to a new conversation to manage context. Each cloud conversation has its own temporary workspace, and the unpushed 2a commit existed only in the previous one. | The new conversation stopped and reported; nothing was reconstructed or reset. |
| 11 | **Recovery of the unpublished checkpoint** | Resolved | The previous conversation, after a publication safety audit, pushed the original commit to a separate branch, `checkpoint-2a`, leaving `main` and the deployment unchanged. | Verified unchanged (`73d9f6f`, parent `aa8c869`, seven commits). Remote checkpoint preservation adopted (Decision #63). |

**Still unresolved:**
- The one-time “server not responding” delay on the first iPhone load (cause unknown).
- R-001, the onboarding name-input overflow (pending investigation).
- Whether iPhone Safari and the installed app share storage (M13, untested).
