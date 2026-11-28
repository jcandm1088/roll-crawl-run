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
| Handoff consolidation | `9ca6149` | Single current-state handoff, refinement backlog, recovery record, challenge log, baseline re-run. Preserved on `claude/beautiful-allen-1vjobt` after owner authorization. |
| Growth UX refinement | (this commit, local) | Owner acceptance testing found the Growth sections repetitive and unclear (R-002). New order and responsibilities, read-only guide with verified educational content, Library as the recording tool, Progress as the review dashboard, clearer confirmations. Not pushed or deployed. |

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

| 12 | **Growth sections repetitive; unclear what updates progress (R-002)** | Design refinement (owner-discovered usability / product-design issue) | During initial hands-on acceptance testing of Checkpoint 2a, before accepting it, the owner found that What to Expect, its “Everything up to now” view and the Library presented variations of the same checklist, and that it wasn't clear which actions update progress. The implementation had followed the approved specification and passed all **339 automated tests** (228 unit, 111 end-to-end). | Growth UX refinement (plan R11, Decisions #65–#74). Another case of human review finding what automated tests could not, because the tests verified the specification, not whether the specification served parents. |
| 13 | **Phase A content: fine motor missing from five overviews** | AI self-correction (content) | In the first educational-content draft, five overviews omitted fine-motor examples although CDC lists fine-motor milestones at those ages, contrary to the stated coverage objective. Claude found this in its own review before delivering the draft; the owner did not have to find it. | One fine-motor example added to each. The rule is now enforced by `validateGuide()`. |
| 14 | **Automated traceability vs semantic accuracy** | Process safeguard | Valid milestone IDs show that a sentence is linked to verified content, not that it says the same thing. | Two layers: build-time traceability checks, plus a documented sentence-by-sentence meaning review. Qualifiers that change meaning were kept, and three dropped qualifiers were restored at the owner's request (Q-6). |
| 15 | **Library preset address could override a newer navigation** | Confirmed defect (in new refinement code, found by tests) | When the Library opened from a shortcut it replaced its address with the plain Library address. If the parent navigated away immediately, the late replacement could make the next screen show the Library again. Surfaced as one intermittent failure of the new offline end-to-end test. | The replacement now happens only while the address still matches the preset. A first version of the guard compared address text, which would have skipped the old `expect/all` redirect; Claude caught this before running the tests and switched to comparing the parsed route. |
| 16 | **New-test defects during the refinement** | Testing defect | Two unit tests had wrong expected values (Claude's arithmetic): with one of the 72 applicable milestones hidden, “Up to now” is 71, not the 66 first written; and “cup” matches three applicable milestones, not two. Several end-to-end tests had defects: an ambiguous “Note” selector (section and text box); a no-percentage check that wrongly flagged CDC's “75% or more”; a terminology scan that clicked non-accordion or hidden controls and timed out (twice); and a history count taken before the history had loaded (intermittent). | Each test corrected; the application code was not changed for any of them. |
| 17 | **Styling slips found by review** | Design refinement (self-found) | A non-existent CSS token (`--text-base`) was used for guide text. Wrapping Progress area rows in links removed their spacing (seen in screenshot review). Full-page screenshots drew the fixed bottom navigation over the content (screenshot tooling only). | Token corrected; spacing rule added; screenshots pin the navigation to the page end. |

| 18 | **Owner found five usability improvements after 387 passing tests (R-004 to R-008)** | Human-discovered usability findings / design preferences | In hands-on review of the Growth UX refinement (`170cc99`), which had passed **all 387 automated tests (252 unit, 135 end-to-end) three consecutive times**, the owner found: inconsistent gendered wording; personal-version creation that didn't belong in the Library; repetitive, robotic CDC terminology; redundant Note and Observations inputs; and no explanation of how to change the age basis. None was a malfunction. | Human acceptance refinements; design principle “parent-first interface, evidence-backed infrastructure” adopted. The third time (with #4 and #12) that human review found what tests could not. |
| 19 | **Reuse-condition tension surfaced by R-004** | Process safeguard (owner decision pending) | Gender-neutral display wording conflicts with the register's earlier statement that wording is unchanged, and touches CDC's “no substantive changes” condition. | Catalog left verbatim; display layer mechanically validated and disclosed, with CDC's original shown. Flagged for the owner rather than assumed acceptable (Decision #77). |
| 20 | **Label collision in the new edit form** | Confirmed defect (in new code, found by tests) | The edit text box was labelled “Edit entry”, the same text as the start of the Edit buttons' accessible names (“Edit entry: …”), so assistive technology and tests matched two controls. | Text box relabelled “Entry text”. |
| 21 | **Entry date stayed on the previous entry's date** | Confirmed defect (in new code, found by a new test) | After adding a back-dated entry, the date field kept that date for the next entry, contrary to “defaulting appropriately”. | The date returns to today after each entry. |
| 22 | **A failed save could clear the parent's typed text** | AI self-correction (found in code review before testing) | The shared save helper swallowed errors, so the new entry form would have cleared its text even when the date was rejected. | The helper now reports success; text and edits are kept on failure; a test covers a rejected date. |
| 23 | **New-test mistakes during the acceptance refinements** | Testing defect (AI-generated tests) | Claude-written tests had these mistakes: (a) the upgrade test captured Progress figures with non-waiting reads before records had loaded, giving one intermittent failure; (b) an offline test reloaded before the save finished; (c) one long test exceeded the default timeout; (d) a meaning-preservation check treated the verb “like” as the example word “like”; (e) a guessed 22-month denominator (96); (f) a CDC-mention limit set before the guide's mentions were counted. | Each test corrected (wait for known values or confirmations; timeout raised; “, like” pattern; computed denominator; the guide's movement note trimmed to one CDC mention and the limit documented). No application code changed for (a)–(e). |
| 24 | **Screenshot capture overlays** | Environmental limitation (screenshot tooling) | Element screenshots drew the sticky top bar and bottom navigation over the Notes & Observations card. The app layout was correct. | The screenshot script hides the fixed bars for element captures. |
| 25 | **R-003 missing from the backlog table** | Documentation discrepancy (found at workspace recovery) | The owner referred to R-003, but it existed only as a KNOWN_LIMITATIONS note. The handoff's section 8 also still listed the superseded Growth order. | R-003 added to the backlog; handoff corrected. |

| 26 | **Erasure-isolation coverage gap (secondary review)** | Testing gap (no application defect) | Asked to confirm the scope of “erasing a note version also erases other saved versions with identical text”, Claude Code inspected `eraseEntryText`. The scope is one child, one record and one lineage. The committed tests did not directly prove that identical text elsewhere survives. A temporary test outside the repository passed. | With the owner's authorization, it became a permanent regression test. It passed; **no application defect was found and no application code changed**. The review document's wording was clarified. |

| 27 | **Deleted entries shown twice (R-009)** | Human-discovered usability finding (design preference; deferred) | In Mac acceptance, the owner found that a deleted entry's placeholder and its separate timeline entry were repetitive. | Recorded as R-009 (low priority, deferred). Checkpoint 2a accepted for Mac usability regardless. |

**Checkpoint 2b (2026-11-27).** Planning-stage items are risks or documentation problems identified before implementation, **not** observed application defects.

| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 28 | **Completion index allowed one session per day** | Proactively identified architectural limitation (planning) | The v1 schema's unique `[customItemId, occurrenceDate]` index could not hold the approved multiple and additional sessions. | Schema v3 replaces it with a unique `[customItemId, slotKey]` (D1). |
| 29 | **Personal history could have contaminated milestone history** | Proactively identified risk (planning) | Milestone code reads every `milestoneEvents` entry for a child (e.g. Home's Recent milestones), so goal events stored there would have appeared as milestones. | Separate `itemEvents` store; regression tests compare milestone results and Recent milestones before and after personal activity. |
| 30 | **Blocked database upgrade** | Proactively identified risk (planning) | `openRcrDb` had no `blocked`/`blocking` handling; an old open tab could silently stall the first-ever schema change after 2a. | Parent-friendly “Almost ready” and “A newer version is open” notices; nothing is reset (unit and e2e tests). |
| 31 | **Inappropriate future-age activity defaults** | Proactively identified safety-relevant design risk (planning) | The three-month interval rule would have shown, e.g., a 7-month-old CDC's tips for 9-month-olds (such as pulling up to stand). | Owner approved CDC's 12 ages with the most recently reached age as default, and an intro for under 2 months / before the due date (D2). |
| 32 | **Inconsistent frequency and duration documentation** | Documentation error (AI, planning) | The plan said CDC gives no frequencies or durations, but eight tips contain “every day”, “each day”, “for a few minutes” or “a few seconds”. Found by the owner's secondary reviewer. | Corrected in the plan, inventory and source register; the words stay in CDC's text and are never turned into targets. |
| 33 | **Materials extraction quality** | Content-quality defect in a draft (AI, planning) | The draft inventory extracted isolated words (“toys, cloth, books, pictures”), losing qualifiers and the example/required distinction. Found in owner review. | Curated CDC phrases with qualifiers, examples marked, omitted where unhelpful; build validation checks each phrase appears in CDC's text. |
| 34 | **Incomplete gender-neutral adaptation of secondary fields** | Content-quality defect in a draft (AI, planning) | The draft's separately extracted purpose and safety sentences quoted CDC's gendered source wording. Found in owner review. | Purpose and safety are now sentences of the validated display text; page guidance adapted too; tests check every field. |
| 35 | **Repeated Safety card on the adopted exercise page** | Confirmed defect (new code, found by an e2e test) | The collapsed “CDC's original activity” section repeated the Safety card already shown on the page (a strict-mode selector failure exposed it). | The original-activity section no longer repeats safety. |
| 36 | **“2 months-old” wording** | Confirmed defect (new code, found in screenshot review) | The activity source line built CDC's heading as “your 2 months-old”. | Uses CDC's form (“2-month-old”, “1-year-old”). |
| 37 | **Correcting a session's value and date was two transactions** | AI self-correction (code review before testing) | Editing then moving a session could have left a half-applied correction if the second step failed. | One atomic move carries the corrected values. |
| 38 | **Stale revision in chained stopwatch/counter writes** | AI self-correction (code review before testing) | The first draft read the tracker revision from a stale render, so rapid taps could have been refused as conflicts. | A revision reference updated on every successful write. |
| 39 | **New-test defects** | Testing defect (AI-generated tests) | Among others: a blocked-upgrade test that built an incomplete v2 schema; an unhandled expected rejection in the failed-upgrade test; navigating before a save's own navigation finished; a gender check that read CDC's collapsed original wording; ambiguous labels and nested `summary` selectors; comparing `innerText` with `textContent`; a non-waiting read right after navigation that failed intermittently (once in one full run). | All corrected to retrying, specific assertions before the final runs. |
| 40 | **Serial update suite understated failures** | Testing weakness | `update.spec.ts` runs serially, so after its first failure the later upgrade tests were skipped rather than reported as failures; their version-2 assertions only surfaced when run individually. | All update tests run and pass; noted for future triage. |
| 41 | **Screenshot capture artifacts** | Environmental limitation (screenshot tooling), plus one AI mistake | Full-page captures of scrolled pages drew the sticky top bar mid-page; Claude's first fix (absolute top bar) overlapped the content instead. | Scroll to top before capturing; only the bottom bar is repositioned. |
| 42 | **Bundle size larger than estimated** | Estimate error (AI, planning) | The plan estimated +50–70 KB; the validated activity content (source, display and sentence segments) brought the bundle from about 255 KB to about 512 KB (66 → 116 KB gzip). | Accepted for offline reliability; recorded in KNOWN_LIMITATIONS. |

**Still unresolved:**
- The one-time “server not responding” delay on the first iPhone load (cause unknown).
- R-001, the onboarding name-input overflow (pending investigation).
- Whether iPhone Safari and the installed app share storage (M13, untested).
- R-002 is corrected in code but **not yet verified by the owner** (hands-on acceptance pending).
- The Library's controls fill most of a phone's first screen (R-003; recorded for owner review; unchanged except one chip removed).
- R-004 to R-008 are corrected in code but **not yet verified by the owner** (hands-on acceptance pending). The R-004 reuse-condition question is resolved by the owner's determination (Decision #86).

## Draft entry — Growth UX refinement (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-26
**What I asked Claude Code to do:**
- During my first hands-on acceptance testing of Checkpoint 2a, I found the Growth sections repetitive and unclear about what updates progress.
- I asked for a plan first, then a separate educational-content review (Option A), and then authorized implementation, tests, screenshots and documentation.

**What it produced:**
- A refinement plan with wireframes and 14 decisions; a complete educational-content review with sentence-by-sentence traceability.
- Then the implementation:
  - the new Growth order and subtitles;
  - a read-only What to Expect guide (all 20 ranges, 11 overviews, 9 empty-range explanations, structurally independent of records);
  - the Library as the recording tool (Up to now / Upcoming / All 159, restored state);
  - Progress as a review dashboard (what updates it, area links, by CDC age);
  - accurate save confirmations;
  - “Coming soon” wording in place of checkpoint terms;
  - build-time guide validation;
  - new tests, screenshots and documentation.
- No schema or dependency changes.

**What I corrected or redirected:**
- The original section order and responsibilities (R-002).
- Decisions D-1–D-14.
- Educational content: “children” throughout; area explanations once per range; three qualifiers restored; revised SH-2, SH-5 and pre-due-date wording; compact neighbour cards; All 159 ordering; no development terms in the app.

### Automated results (run by Claude Code in this conversation)
Environment: Linux cloud container, Node 22.23.5, headless Chromium (Playwright; phone-sized viewport 390×844 plus a desktop project for responsive tests). **No Safari, iPhone or Android testing was performed.**

| Check | Baseline before the refinement (`9ca6149`, rerun 2026-11-26) | Final (3 consecutive full runs, 2026-11-26) |
|---|---|---|
| Type check | Passed | Passed ×3 |
| Unit tests | 228 passed (9 files) | **252 passed ×3** (10 files; +24 in `guide.test.ts`) |
| Production build (includes milestone and guide content validation) | Passed | Passed ×3 (JavaScript 240.6 KB, 62.7 KB gzip) |
| End-to-end tests | 111 passed | **135 passed ×3** (2.1–2.2 min each), no failures, no retries, no flaky results |

**End-to-end changes:**
- **Updated for superseded requirements, each marked in the test:**
  - in `growth.spec.ts`: the landing order; the Home shortcut target and the preview wording; the empty-range test; the “everything up to now” test, now testing the Library redirect; the Library default count; the safeguard wording (Q-5); the offline Library count; the accessibility and 320px screen lists;
  - in `review-regressions.spec.ts`: the order and the “Coming soon” wording.
- **Added:** 21 tests in `growth-refinement.spec.ts`, plus one upgrade test from the original Checkpoint 2a build in `update.spec.ts`.
- **Unchanged:** the remaining coverage, including all storage, history, calculation and isolation unit tests.

During development (before the final runs), new tests failed for the reasons listed in challenges #15 and #16. All were corrected before the three final runs.

**Notes / next steps:** My hands-on acceptance testing (checklist H1–H18 and the remaining G-items), then decisions on remote preservation, deployment and Checkpoint 2b.

## Draft entry — Human acceptance refinements (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-27

**What I asked Claude Code to do:** my hands-on review of the refined Growth screens found five improvements (R-004 to R-008), even though all 387 automated tests had passed three times in a row. I authorized:
- gender-neutral wording;
- removing personal-milestone creation;
- less CDC terminology;
- one Notes & Observations section;
- an age-settings explanation on Progress;
- the design principle “parent-first interface, evidence-backed infrastructure”.

**What it produced:**
- **Gender-neutral wording:** a validated display layer that proves each of 41 adaptations changes only pronouns and verb agreement, while the CDC catalog stays verbatim.
- **Personal milestones:** creation controls removed; existing personal entries preserved in a collapsed Library section.
- **Terminology:** plainer terms and consolidated attribution.
- **Notes & Observations:** one section, with append-only edits and honest “No observation date” labelling of earlier notes (no schema change).
- **Age settings:** a “Manage age settings” link to the selected child's age settings.
- **Also:** an upgrade test from `170cc99`, new tests, 29 screenshots and documentation.

**What I need to decide:**
- whether the pronoun adaptation is acceptable under CDC's reuse conditions;
- how to treat legacy personal entries in Checkpoint 2b.

### Workspace recovery and baseline (this conversation, 2026-11-27)
- **Workspace:** the new workspace held only `aa8c869` on `claude/sharp-franklin-vrbgmd`. The preserved refinement branch `claude/beautiful-allen-1vjobt` was fetched and the session branch was fast-forwarded (no rewrite) to `170cc99`.
- **Verified:** nine commits; remote `main` `aa8c869`; `checkpoint-2a` `73d9f6f`; clean working tree.
- **Baseline, matching expectations:** `npm ci` OK, type check passed, **252 unit passed**, build passed, **135 end-to-end passed**.
- **Discrepancies (documentation only):** R-003 was not in the backlog table; the handoff's section 8 listed the superseded Growth order; the handoff still said the refinement was unpushed.

### Automated results (run by Claude Code in this conversation)
Environment: Linux cloud container, Node 22, headless Chromium (Playwright; 390×844 phone viewport plus the desktop responsive project). **No Safari, iPhone or Android testing.**

| Check | Baseline (`170cc99`) | Final (3 consecutive complete runs, 2026-11-27) |
|---|---|---|
| Type check | Passed | Passed ×3 |
| Unit tests | 252 passed (10 files) | **281 passed ×3** (11 files; +29 in `acceptanceRefinements.test.ts`) |
| Production build (catalog, guide and display validation) | Passed (240.6 KB JS, 62.7 KB gzip) | Passed ×3 (255.5 KB JS, 66.0 KB gzip) |
| End-to-end tests | 135 passed | **155 passed ×3** (2.6–2.7 min each); no failures, no retries, no flaky results |

**End-to-end changes:**
- **Added:** 19 tests in `acceptance-refinements.spec.ts`, plus one upgrade test from `170cc99` in `update.spec.ts`.
- **Updated for superseded behavior:** see TESTING_CHECKLIST.
- **During development:**
  - The first full run after the changes had 17 expected failures, all from superseded wording or controls; each was reviewed individually before updating.
  - New-test mistakes are listed in challenge #23.
  - Two application defects in the new code were found by tests and fixed (#20, #21).

## Draft entry — Final review and erasure regression coverage (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-27

**What I did:**
- **Decision #77:** I reviewed CDC's “Use of Agency Materials” myself on November 26, 2026. Condition 3 says “You may not change the substantive content of the materials.” I approved the gender-neutral display wording as grammatical adaptation rather than substantive change. This is my editorial and product-design determination, not CDC approval or a legal determination.
- **Personal entries:** I kept the legacy personal-entry approach as it is and deferred conversion and deletion to 2b.
- **Erasure scope:** I asked for confirmation of the permanent-erasure scope.

**What Claude Code found:**
- Erasure is limited to one child, one milestone or personal entry, and one note or observation lineage.
- The existing tests did not directly prove isolation from unrelated entries with identical text (a coverage gap).
- A temporary test passed. With my authorization, it is now a permanent regression test. No application defect was found and no application code changed.

### Automated results (one complete run, as authorized for this test- and documentation-only revision)
| Check | Result (2026-11-27, headless Chromium, Node 22) |
|---|---|
| Type check | Passed |
| Unit tests | **282 passed** (11 files; +1, the erasure-isolation test) |
| Production build | Passed. The bundle is byte-identical to `8843a25` (same content hash, `index-VSweNDhW.js`, 255.5 KB), confirming no application change |
| End-to-end tests | **155 passed** (2.6 min); no failures, no retries |

## Draft entry — Checkpoint 2a human acceptance closeout (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-27

**What I did:**
- On my Mac (macOS, Node.js 26, Safari), I installed the dependencies, built and launched the final Checkpoint 2a application (`bf790b5`).
- **I accept Checkpoint 2a for Mac usability.**

**What I found:**
- **R-009:** deleted Notes & Observations entries leave a “text deleted” placeholder plus a separate timeline entry. That's repetitive, but minor. Recorded as low priority and deferred to a future refinement or Checkpoint 6.
- **R-001 and R-003:** still deferred.

**Still pending:** physical iPhone acceptance, offline editing on a device, and manual verification of a legacy-data upgrade. Individual checklist items were not reported, so none is marked as passed.

**Note:** the README states Node.js 22, which is the version used for automated testing. My successful local build used Node.js 26. This is recorded only as an observation; no change was made.

**Automated tests:** none run for this documentation-only closeout (not required). The last full results are in the entry above.

## Draft entry — Checkpoint 2b: Goals, Exercises & Historical Progress (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-27
**What I asked Claude Code to do:**
- Plan Checkpoint 2b (goals, exercises, historical progress) from the approved product design; then, after reviewing the plan with my secondary reviewer, implement it as one phase with decisions D1–D16 and content corrections.

**What it produced:**
- A planning proposal with a CDC activity inventory; then the implementation: database version 3, My Goals, Exercises (three origins, three tracking methods, schedules up to 24 sessions a day), a count-up stopwatch and repetition counter, Browse Exercises with 153 CDC activities, Today's routine and the Home card, Personal progress and Progress over time, and legacy personal entry conversion and deletion.
- Tests, screenshots (`docs/screenshots/checkpoint-2b/`), documentation and review records (`docs/reviews/CHECKPOINT_2B_*`).

**What I corrected or redirected:** (to be completed by the owner) — the decisions D1–D16, including CDC reference ages instead of intervals with an intro for very young children, 1–24 sessions, a count-up stopwatch design, and the inventory corrections (frequency wording, materials, gender-neutral secondary fields, safety after adoption, no repetition).

### Baseline (before any change; 2026-11-27)
`53d6212`, Node 22.23.5: type check and build passed; **282 unit + 155 end-to-end = 437 passed**; database version 2.

### Automated results (run by Claude Code in this conversation)
Environment: Linux cloud container, Node 22.23.5, headless Chromium (Playwright; 390×844 phone project plus the desktop responsive project). Playwright retries are not enabled, so no failure was hidden by a retry. **No Safari, Mac, iPhone or Android testing was performed.**

| Check | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Type check | Passed | Passed | Passed |
| Unit tests (17 files) | **360 passed** | **360 passed** | **360 passed** |
| Production build (includes content validation) | Passed (JS 512.39 kB, 116.36 kB gzip) | Passed | Passed |
| End-to-end tests | **201 passed** | **201 passed** | **201 passed** |
| **Total** | **561 passed** | **561 passed** | **561 passed** |

- **New:** 78 unit tests (schemaV3 9, personalGoals 10, exercises 20, stopwatchCharts 9, activities 22, legacyEntries 8) and 46 end-to-end tests (goals-exercises 12, goals-exercises-quality 33, one new upgrade test from a real build of `53d6212`).
- **Changed intentionally:** 3 unit and 4 end-to-end tests (see `docs/reviews/CHECKPOINT_2B_IMPLEMENTATION_REPORT.md` §6). None removed.
- **During development (before the final runs):** test defects and two confirmed defects in new code were found and fixed (challenges #35–#41). One intermittent failure was caused by a non-waiting assertion in a new test (fixed).
- **Coverage notes:** accessibility (axe, WCAG 2.1 AA) on 14 new screens; colour contrast on the main new screens in all five themes; no horizontal overflow at 320 px on every new screen; offline creation and recording after caching; two open copies; simulated clocks for the stopwatch, midnight and clock anomalies.

## Draft entry — Checkpoint 2b-R: Human Acceptance Refinements (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-27
**What I asked Claude Code to do:**
- After testing Checkpoint 2b in Mac Safari (64 of 65 applicable checks passed), implement refinements R-010 to R-017 from the exact preserved 2b commit, record R-018 as deferred, keep R-001, R-003 and R-009 deferred, and stop before Checkpoint 3.

**What it produced:**
- Age-responsive goal ideas (70 ideas in six ranges, traced to the verified milestones and activities), centralized CDC attribution on activity pages, aligned exercise-form headings and a shared duration-entry component, session deletion without placeholders (database version 3 unchanged), a re-laid-out stopwatch recovery notice, and full 6- and 12-month reporting periods.
- Tests, screenshots (`docs/screenshots/checkpoint-2b-r/`), and review records (`docs/reviews/CHECKPOINT_2B_R_REFINEMENT_REPORT.md`, `CHECKPOINT_2B_R_GOAL_IDEAS.md`).

**What I corrected or redirected:** (to be completed by the owner) — the findings from my Mac acceptance testing: inspiration ideas unsuited to a 4-month-old, repeated CDC references, misaligned headings and fields, removed-session placeholders, the recovery notice's appearance, and the 6-month/1-year periods showing the same five months.

### Owner's acceptance of Checkpoint 2b (reported, Mac Safari, port 4179)
Phase A 7/7 · B 12/12 · C & D 16/16 · E 14/14 · F 15/16 (reporting period) · G not applicable (no legacy data) · H positive (subject to iPhone review). **64 of 65 applicable checks passed.** The update was detected, a refresh was offered and existing profiles, themes, milestone statuses, Notes & Observations and milestone progress were preserved.

### Baseline (before any change; this conversation, 2026-11-27)
Recovered by fast-forwarding `claude/vigilant-keller-w6ss5f` to `64202e22f3183e81d572a4115f03bb5f080b18f6` (13 commits; no history rewritten); working tree clean; database version 3; Node 22.23.5: type check and build passed; **360 unit + 201 end-to-end = 561 passed** (one run).

### Development challenges and lessons learned (continued from #42)
| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 43 | **Generic goal examples unsuited to young babies** | Previously approved design that proved less useful in human testing | The eight D8 examples (library visits, art, playing with other children…) were approved and worked as specified, but the owner's 4-month-old test profile saw ideas for much older children. Not a programming defect. | R-010: six age ranges, 70 traced ideas, validated at build time. |
| 44 | **Reporting periods truncated at birth** | Previously approved, tested requirement that proved less useful in human testing | D7 deliberately left out months before the birth month, and unit tests enforced it; for a young child both periods showed the same five months. | R-017: fixed 6/12 positions with “before birth” and “not tracked” states; the old tests were rewritten with the requirement change explained. |
| 45 | **Misaligned form headings and duration fields** | Visual defect (implementation) | Group headings were `<legend>`s, which browsers draw on the fieldset's top border; and the stacked-field rule `.field + .field { margin-top }` also applied to side-by-side fields, pushing the second and third fields down. The automated suite checked overflow, accessibility and contrast but not alignment. | R-012–R-014: floated legends; one `DurationFields` component; a guard rule; new geometry tests (positions, sizes, label placement) at 320 and 390 px. |
| 46 | **Recovery notice layout** | Visual defect (implementation) | The notice reused the `banner` style, a horizontal flex row, for text plus a row of three differently styled small buttons, so text and buttons sat side by side unevenly. | R-016: a column `notice-panel` with full-width actions and a clear hierarchy; the same for the reset and clock-check notices; geometry and axe tests. |
| 47 | **Intermittent “blocked upgrade” test** | Test defect (pre-existing) | Under parallel load, the test failed once in this conversation: the app page could reopen the database at version 3 after the test deleted it, so the simulated old copy's version-2 open failed and the test timed out. It passed 8/8 alone on both the baseline and the new build. | The test now moves the app page off the app before deleting the database (same assertions); 10/10 in parallel. |
| 48 | **Deleting sessions inside database version 3** | Proactively identified risk | The unique `[customItemId, slotKey]` index would have blocked re-recording a slot whose deleted record kept its key; reviving a deleted id could let a stale copy “resurrect” it; a moved session's reversed original still held its note and values. | Tombstones get `slotKey: deleted:<id>` (original kept in `deletedSlotKey`); a deleted id is never reused; the reversed lineage is tombstoned too; live sessions are never touched. No schema change. |
| 49 | **Content duplicates caught by validation** | Proactively identified risk | The new validation rejected an idea titled exactly like an activity (“Kick a ball back and forth”), and a unit test found one idea titled like an old generic example. | Reworded before release. |
| 50 | **Defects in newly written tests** | Test defects | A locator matched the nested duration legend as well as the group heading; expected durations lacked the app's commas; the chart period persists between views, so a test assumed the wrong period; one axe scan ran during a screen transition. | All corrected before the final runs; no application change was needed. |
| 51 | **Screenshot and tooling limits** | Environment or tooling limitation | Scripts in the scratch directory couldn't import Playwright; element screenshots were overlapped by the sticky top bar and the bottom navigation; one complex inline command was blocked by a safety check (it deleted nothing) and was rewritten as a script file. | Script kept in `scripts/`; bars hidden only while capturing elements. |
| 52 | **Intermittent repetition-counter test** | Test defect (pre-existing) | The first full regression cycle failed 218/219: the 2b test reloaded the page immediately after the third “+1”, before that write had finished, so the count came back as 2; its check `toContainText('3')` still passed because the target “/ 3” is shown. It had also failed once earlier in this conversation under parallel load. | The test waits until the stored count is 3 and checks the exact count (10/10 in parallel). The three-cycle sequence was restarted. App note: as in any web app, a change made in the instant before the page is closed may not be saved. |

### Automated results (run by Claude Code in this conversation)
Environment: Linux cloud container, Node 22.23.5, headless Chromium (Playwright; 390×844 phone project plus the desktop responsive project), `--retries=0`. **No Safari, Mac, iPhone or Android testing was performed.**

**First attempt (not counted):** cycle 1 failed 218/219 end-to-end (the repetition-counter test, challenge #52). The test was corrected and the sequence restarted from cycle 1.

| Check | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Type check | Passed | Passed | Passed |
| Unit tests (19 files) | **379 passed** | **379 passed** | **379 passed** |
| Production build (includes content and goal-idea validation) | Passed (JS 529.04 kB, 122.74 kB gzip) | Passed | Passed |
| End-to-end tests | **219 passed** | **219 passed** | **219 passed** |
| **Total** | **598 passed** | **598 passed** | **598 passed** |

- **New:** 19 unit tests (goalIdeas 10, sessionDeletion 8, stopwatchCharts +1) and 18 end-to-end tests (`acceptance-2b-r.spec.ts`).
- **Changed intentionally:** the chart-period unit tests (R-017), the session removal/restore and inspiration e2e tests (R-015, R-010); two pre-existing tests made deterministic (#47, #52). None removed.
- **Bundle:** 512.39 → 529.04 kB (116.36 → 122.74 kB gzip).

## Draft entry — Checkpoint 2b-R human acceptance closeout and submission scope revision (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-27
**What happened:**
- **Human acceptance (owner, Mac Safari, against `b45af43`):** GR1–GR15 all passed — 15 of 15 applicable checks. Checkpoint 2b-R accepted for continued development; R-010 to R-017 closed. GR16 and all outstanding iPhone, installed-app upgrade and device offline-editing checks deferred to Checkpoint 6.
- **Automated results (unchanged, recorded earlier):** three consecutive complete cycles of 379 unit and 219 end-to-end tests each, no retries. No new run was needed for this documentation-only closeout.
- **Preservation:** `b45af43` pushed to `claude/vigilant-keller-w6ss5f` with the owner's authorization (normal push); this closeout commit is pushed the same way. `main` unchanged; no deployment.
- **Scope revision:** submission deadline about 12 hours (up to 36); the several-days-of-use requirement was removed by the professor. Remaining: Checkpoint 3 (Simplified Calendar), Checkpoint 4 (Journal; Resources removed from navigation), Checkpoint 6 (final testing, deployment, iPhone acceptance). Checkpoint 5 and Resources deferred until after submission. The submission version will have no supported backup or restoration (KNOWN_LIMITATIONS).

**What I corrected or redirected:** (to be completed by the owner) — narrowing the Calendar to a standalone record-keeping feature with a default-off vaccine overlay, removing Resources from the submission, and deferring Checkpoint 5 to fit the deadline.

## Draft entry — Checkpoint 3: Simplified Calendar (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-27
**What I asked Claude Code to do:**
- Start a fresh conversation from the exact accepted commit, verify the baseline, and stop.
- Prepare Checkpoint 3 without implementing it: investigate one intermittent test failure, verify a vaccine schedule source and its reuse terms, and check whether the existing event store was enough.
- Then build the Simplified Calendar under my decisions on seven questions, correct the test, update the documentation, and stop for my acceptance.

**What it produced:**
- A Calendar tab with a month grid, month navigation, today and selected-day indicators, the selected day's events, Upcoming, and one Add event action.
- Three independent overlays: Recommended vaccine schedule (off by default), Medical appointments, Personal.
- Parent-entered events with create, view, edit and delete, in the existing `events` store (database version 3 unchanged).
- A bundled, validated copy of CDC's July 2, 2025 childhood schedule shown as reference ages from the date of birth, with undated provider-discussion items, attribution and limitations.
- A test-only correction for the R-014 timing defect, 47 new unit and 29 new end-to-end tests, screenshots (`docs/screenshots/checkpoint-3/`), a review report (`docs/reviews/CHECKPOINT_3_IMPLEMENTATION_REPORT.md`) and an acceptance checklist (CAL1–CAL36).

**What I corrected or redirected:** (to be completed by the owner) — I modified Claude Code's proposal to show a single recommended age as a month-long window (it became a one-day reference marker); chose outright deletion over tombstones; kept overlay choices device-wide; and required the legal circumstances of the schedule to be recorded with a recheck at Checkpoint 6.

### Workspace recovery and baseline (this conversation, 2026-11-27)
- The new workspace started on `claude/great-dijkstra-wwi9g1` at `aa8c869` (the same as `main`). The authoritative branch `claude/vigilant-keller-w6ss5f` was fetched and the session branch **fast-forwarded to the exact commit** `3da76c71f1c71a7818594bacc33167f67d638f81` (15 commits, parent `b45af43`, clean tree). No history was rewritten; `main` (`aa8c869`) was not touched.
- **Baseline, one cycle (Node 22.23.5):** type check, build and content validation passed; **379 of 379 unit**; **218 of 219 end-to-end**. The one failure was the R-014 layout test (challenge #53). Reported without changing anything.
- **Preservation push versus deployment:** a push to a non-`main` branch only preserves a commit on GitHub. It does not change `main` or the published app. Deployment is the separate manual workflow from `main`. During this conversation the environment's stop hook asked for a push after each turn; each request was declined because pushes need my authorization. At the time of writing the Checkpoint 3 commit is local only.

### Development challenges and lessons learned (continued from #52)
| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 53 | **Intermittent R-014 layout assertion** | Test defect (pre-existing) | The baseline failed 218/219: duration labels “on one line” measured 4.10 px apart. It then failed 1 of 10 in parallel and 0 of 10 with one worker. The helper read each field and label in a separate browser round-trip while the sheet was still sliding in (24 px over 240 ms). A scratch diagnostic showed 0 px spread when all labels were read in one frame and offsets of up to 5.94 px (including 4.09 px) when read one at a time; fonts were loaded. Three earlier consecutive clean cycles had not shown it. | The helper waits for the animations themselves to finish and reads all rectangles in one evaluation; the shared `box()` helper waits the same way (two more measurements in that file had the same exposure). No tolerance, assertion or application change. 60 of 60 in parallel. **The cause is inferred from a matching reproduction, not from a trace of the original failure.** |
| 54 | **Stale source documentation after the scope revision** | Documentation discrepancy | SOURCE_REGISTER and KNOWN_LIMITATIONS still listed the well-child schedule and AAP immunization schedule as pending Checkpoint 3 decisions, although Decision #119 had removed well-child references and AAP stays excluded. | Corrected in the Checkpoint 3 documentation update, as instructed, not in a separate commit. |
| 55 | **Which vaccine schedule currently applies** | Source uncertainty (external) | CDC's schedule pages carried a banner: a preliminary court order of March 16, 2026 stayed the 2025 ACIP votes and a January 5, 2026 revision, so the July 2, 2025 schedule is CDC's current one. An older schedule being “current” by court order was not something to resolve silently. | Reported before any implementation. I approved the July 2, 2025 version; the circumstances are in SOURCE_REGISTER; a currency recheck is required at Checkpoint 6. |
| 56 | **CDC refused a command-line request** | Environment or tooling limitation | A plain request for CDC's terms page returned 403 “Access Denied”. | The terms page was read first, then each page was loaded once in headless Chromium as text only, the method used at 2a and 2b. Recorded in SOURCE_REGISTER. No restricted or third-party material was collected. |
| 57 | **A single age shown as a month-long window** | Design proposal corrected in review | Claude Code's preparation report proposed showing “2 months” as the whole month of age, to avoid looking like an appointment date. | I rejected this as an unsupported clinical window. A single age is one labelled reference marker on that age's anniversary; only ranges CDC states are shown as ranges. |
| 58 | **Flattened table text lost the age ranges** | Proactively identified risk | The page text gave “Dose 3” with no way to tell which age columns it spanned. | The table structure (column spans and CDC's key classes) was read from the page and compared with the professional table and notes; a unit test checks the ages against values typed independently from the notes. |
| 59 | **Keyboard focus lost between months** | Application defect (new code) | The new keyboard test failed: after an arrow key moved into another month, the focused day was removed and focus returned only after the next paint, so a quick second key press was ignored. | Focus is restored in a layout effect, in the same commit that draws the new month. |
| 60 | **Defects in newly written tests** | Test defects | Four: one expected “next reference” to follow the selected day (it follows today); one reloaded before a preference had been saved; two navigated while a deletion or onboarding was still finishing. | Corrected before the final runs. The calendar suite then passed 84 of 84 over three repeats. |
| 61 | **Existing tests that encoded the old requirement** | Requirement change | The first full cycle failed 425/426 unit: a default-settings test listed the exact overlay fields. The restarted cycle failed 1 end-to-end: the Checkpoint 1 offline test clicked a link named “Calendar”, which now also matched Home's new “Open Calendar” link. Two other tests named the Calendar as a placeholder and the Settings section as “Calendar & Reminders”. | Each updated with the reason in place; none removed. The three-cycle sequence was restarted from cycle 1 both times. |
| 62 | **Stale placeholders next to a working Calendar** | Scope judgement | Home still offered “New event — coming soon” and a “Coming up” placeholder; Settings still listed reminders and phone-calendar export as coming soon. | Settings now describes what exists (authorized). Home's action is live and “Coming up” lists the next three events (Decision #136); this goes slightly beyond the Calendar tab and is flagged for my confirmation. |
| 63 | **Intermittent “guide writes nothing” test** | Test defect (pre-existing) | In the third attempt, cycle 1 passed and cycle 2 failed 247/248: a 2a test read the overall progress text immediately after navigating and saw “0 of 11 achieved” (records not yet loaded) instead of “1 of 10 achieved”. Growth code was not changed at Checkpoint 3. Like #47, #52 and #53, it is a single immediate read racing a load. | Both reads now use a retrying assertion with the same expected value (8 of 8 in parallel). The sequence was restarted from cycle 1. **Lesson:** the suite still contains immediate, non-retrying reads; others may surface under load. |

### Automated results (run by Claude Code in this conversation)
Environment: Linux cloud container, Node 22.23.5, headless Chromium (Playwright; 390×844 phone project plus the desktop responsive project), no retries. **No Safari, Mac, iPhone or Android testing was performed.**

**Attempts not counted (each restarted from cycle 1 after one failure):**
1. Cycle 1: 425 of 426 unit (default-settings test, #61).
2. Cycle 1: 426 unit, 247 of 248 end-to-end (Checkpoint 1 offline test's link selector, #61).
3. Cycle 1 passed (426 + 248); cycle 2: 426 unit, 247 of 248 end-to-end (pre-existing intermittent 2a test, #63).

**Final sequence — three consecutive complete cycles:**

| Check | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Type check | Passed | Passed | Passed |
| Production build (includes milestone, guide, display, activity, goal-idea and vaccine-schedule validation) | Passed (JS 562.19 kB, 132.00 kB gzip) | Passed | Passed |
| Unit tests (21 files) | **426 passed** | **426 passed** | **426 passed** |
| End-to-end tests | **248 passed** | **248 passed** | **248 passed** |
| **Total** | **674 passed** | **674 passed** | **674 passed** |

- **New:** 47 unit tests (`calendar.test.ts` 29, `eventsRepo.test.ts` 18) and 29 end-to-end tests (`calendar.spec.ts` 28, `update.spec.ts` +1).
- **Changed intentionally:** the placeholder-tab test, the Settings section list, the default-settings unit test, the Checkpoint 1 offline link selector. **Corrected for timing only:** the R-014 helper (#53) and the 2a “guide writes nothing” reads (#63). None removed.
- **Targeted runs before the cycles:** the four tests using the corrected R-014 helpers, 60 of 60 in parallel; the calendar suite, 84 of 84 over three repeats; the corrected 2a test, 8 of 8.
- **Bundle:** 529.04 → 562.19 kB (122.74 → 132.00 kB gzip).
- **Screenshots:** `docs/screenshots/checkpoint-3/` (seven; 390 px, 320 px and 1280 px; Earth, Sage and Lavender), produced by `scripts/checkpoint-3-screenshots.mjs` with fictional data.

## Draft entry — Checkpoint 3 human acceptance and refinements R-019 to R-022 (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-27
**What I asked Claude Code to do:**
- Record my Mac Safari acceptance of Checkpoint 3 and make four presentation refinements, without reopening the Calendar's requirements: simpler vaccine language with centralized attribution, new calendar symbols, a new Home heading, and corrected spacing in Settings.

**What it produced:**
- **R-019:** one visible provider statement; a visible **Source** line with the non-endorsement and an expandable “Source details”; plain-language notes through a display layer beside the unchanged source record; “Recommended vaccinations: 4 months” and “Next recommended vaccinations: 6 months”.
- **R-020:** an upright cross (medical), a heart (personal) and the existing diamond (vaccinations), used everywhere the old markers were.
- **R-021:** “Upcoming Appointments” on Home. **R-022:** the Settings Calendar section uses the shared panel padding.
- One new unit test and three new end-to-end tests, updated wording and marker expectations, screenshots (`docs/screenshots/checkpoint-3-r/`), and a report (`docs/reviews/CHECKPOINT_3_R_REFINEMENT_REPORT.md`).

**What I corrected or redirected:** (to be completed by the owner) — the vaccine overlay named CDC and explained itself too often, which read as institutional and cluttered; I asked for the source to be stated once and the disclaimer consolidated into one sentence in my own wording. This is the third time I have asked for less institutional source wording (R-006, R-011, R-019).

### My acceptance of Checkpoint 3 (reported, Mac Safari, against `c5017da`)
CAL1–CAL33 PASS · CAL34 (keyboard) N/A, not human-tested · CAL35 (offline editing) N/A, not human-tested · CAL36 (iPhone) deferred to Checkpoint 6. **33 passed, 0 failed, 2 N/A, 1 deferred.** I approved the Home changes, the editor's dismissal behavior and the narrow layout for submission, subject to physical-device review.

### Development challenges and lessons learned (continued from #63)
| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 64 | **Institutional source wording, again** | Previously approved wording that proved too heavy in human testing | Checkpoint 3 labelled every reference “CDC schedule reference · not an appointment”, prefixed notes with “CDC's notes for health care providers say…”, and explained the same limits in four places. It was written defensively, to make the source and the limits impossible to miss, and it passed every automated check. In use it read as cluttered and institutional. The same finding had been made at 2a (R-006) and 2b-R (R-011). | R-019. **Lesson:** apply “parent-first interface, evidence-backed infrastructure” when content is first written: state the source once per screen, keep qualifications in plain words, keep the traceable record in the content file. |
| 65 | **Simplifying wording without touching the source record** | Proactively identified risk | Rewriting the stored qualifications would have lost the record of where each one came from, and a careless rewording could drop a figure such as “15 weeks, 0 days”. A first attempt to add the display fields with a JSON rewriter also reformatted the whole file, producing a 364-line diff for a 39-line change. | Display fields were added beside the unchanged source fields by line insertion; a script check confirmed the source data is identical; validation now fails the build if a parent-facing note drops an exact quantity, names the source, or misquotes text marked as CDC's. |
| 66 | **A medical cross that is not the Red Cross emblem** | Proactively identified risk | The requested medical symbol could have been drawn as an equal-armed cross, which in red on white is a protected emblem. | Drawn with unequal arms and a short crossbar above the middle, in the theme's own color; a test checks the proportions and that the color is the theme's. At small sizes it can also read as a religious cross; noted for my visual check. |
| 67 | **Settings section without the shared padding** | Visual defect (implementation, Checkpoint 3) | The reworded Calendar section in Settings was added as plain content instead of inside the `panel-pad` wrapper the other sections use, so it sat against the card's edges. The automated suite checked its wording but not its spacing. | R-022: the wrapper is used; a geometry test at 320, 390 and 1280 px compares the inset with “This Device”. |
| 68 | **Defects in the updated tests** | Test defects | Two: the expected order of two all-day events on one day (they sort by title), and a no-“CDC” check tripped by CDC's own verbatim sentence “Visit CDC Travelers' Health for more information.” | Corrected before the full run; the verbatim sentence is kept and explicitly allowed. No application change. |

### Automated results (run by Claude Code in this conversation)
Environment: Linux cloud container, Node 22.23.5, headless Chromium, no retries. **No Safari, Mac, iPhone or Android testing was performed by Claude Code.**

**Reduced cadence, authorized by me for this presentation-only round:** targeted tests, then one complete clean cycle (the accepted implementation had passed three consecutive cycles of 674).

| Check | Result |
|---|---|
| Targeted: `calendar.spec.ts` (31 tests, including five themes with axe, 320 and 390 px, Settings spacing at three widths) | First run 29 of 31 (two test defects, #68); after correction **31 of 31** |
| Type check | Passed |
| Production build with content validation (JS 564.02 kB, 132.33 kB gzip) | Passed |
| Unit tests (21 files) | **427 passed** |
| End-to-end tests | **251 passed** |
| **Total, one complete cycle** | **678 passed, 0 failed** |

- **New:** 1 unit test and 3 end-to-end tests. **Updated:** wording and marker expectations in `calendar.spec.ts` and two unit assertions; substantive assertions kept; none removed.
- **Unchanged and passing:** all vaccine age, date-arithmetic, overlay, event, isolation, persistence, offline and upgrade tests.
- **Bundle:** 562.19 → 564.02 kB (132.00 → 132.33 kB gzip).
- **Screenshots:** `docs/screenshots/checkpoint-3-r/` (13). The Checkpoint 3 set in `docs/screenshots/checkpoint-3/` is kept as the record of what was accepted.

## Draft entry — Checkpoint 3-R: medical symbol correction (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-27
**What I asked Claude Code to do:** after my visual check of `77d263b` (CR1–CR5 and CR7–CR9 passed; CR6 failed on the medical symbol's shape), replace the cross with a symmetrical plus and stop for my final look. Targeted testing only.

**What it produced:** a plus with four equal arms for medical appointments, everywhere the symbol appears; the heart and the diamond untouched; updated geometry, theme and narrow-width tests; an updated screenshot and archive.

**What I corrected or redirected:** (to be completed by the owner) — I had described the symbol as “a simple upright cross, resembling a lowercase t without curves” and meant a plus; the first version was a cross with a raised crossbar, which looked religious.

### Development challenges and lessons learned (continued from #68)
| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 69 | **Misread symbol description** | Requirement misunderstanding | “Upright cross, resembling a lowercase t” was implemented literally: a tall upright with a short crossbar above the middle. Claude Code noticed it could read as a religious cross and said so in its report, but built it and left the judgement to the visual check instead of asking first. The owner wanted a symmetrical plus and failed CR6. The automated tests had passed because they checked the shape that was built, not the shape that was meant. | Replaced by a plus with equal bars crossing at their midpoints; the test now checks equal length, uniform thickness, centring and equal arms. **Lesson:** when a visual description has two plausible readings and one has an unwanted connotation, ask or show both before building. |

### Automated results (run by Claude Code in this conversation)
Environment: Linux cloud container, Node 22.23.5, headless Chromium, no retries. **No Safari, Mac, iPhone or Android testing was performed by Claude Code.** Targeted testing only, as I authorized for this isolated visual correction; **no complete regression cycle was run** (the last one, on `77d263b`, was 427 unit and 251 end-to-end).

| Check | Result |
|---|---|
| Type check | Passed |
| Production build with content validation (JS 564.02 kB, 132.32 kB gzip) | Passed |
| `calendar.spec.ts` (31 tests: plus geometry and consistent use; five themes with axe and the plus in each theme's color; 320 and 390 px with the plus drawn square inside its day; Settings spacing; everything else in the Calendar suite) | First run 26 of 31: one new assertion expected the plus in three places where the test's own data shows it in two (a test defect, in all five theme tests). After correction **31 of 31** |
| Upgrade from the accepted 2b-R build (`update.spec.ts`, one test) | Passed |
| Unit tests (all 21 files) | **427 passed** |

- **Application change:** the two bars' coordinates in the shared symbol component, and two comments. Nothing else.
- **Not run:** the other end-to-end suites (Growth, goals, exercises, profiles, earlier update tests). They do not use the symbol; full regression resumes at Checkpoint 4.
- **Screenshots:** `docs/screenshots/checkpoint-3-r/` regenerated (14), including `10-symbols-plus-heart-diamond-320.png` and `-390.png`.

## Draft entry — Checkpoint 3 formal acceptance closeout (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-27
**What happened:**
- **Final review of the corrected medical symbol was delegated** by me to ChatGPT, my secondary reviewer. It inspected the corrected archive of `c8aa0c5`, compared it with the previous archive, reviewed the source differences and both screenshots, and found the plus correct, the heart and diamond unchanged, and no unrelated functional change. I did not re-test this item in Safari myself.
- **Checkpoint 3 and refinements R-019 to R-022 are formally accepted** for the submission version, subject to the final physical-device and publication checks.
- **Actual testing history, kept separate:**
  - *Mine, Mac Safari:* CAL1–CAL33 PASS; CAL34 (keyboard) and CAL35 (offline editing) not tested; CAL36 (iPhone) deferred to Checkpoint 6. CR1–CR5 and CR7–CR9 PASS; CR6 FAIL (medical symbol shape only).
  - *Delegated secondary review:* CR6b PASS.
  - *Automated (Claude Code, headless Chromium):* three complete cycles of 674 on `c5017da`; one complete cycle of 678 on `77d263b` (reduced cadence I authorized); targeted tests only on `c8aa0c5` (I authorized this; no complete cycle was run on the final commit).
- **Carried to Checkpoint 6:** keyboard operation and offline editing confirmed by a person; physical iPhone; the vaccine schedule currency recheck.
- **Checkpoint 4 design recorded** (Decision #151): one newest-first Journal feed; Personal Reflections and Care Notes; optional titles and tags; create, view, edit, delete; search and filters; a provider-question flag with answered status; child isolation and offline persistence; Resources removed from navigation; no Growth or Calendar integration; no photos. Journal photographs deferred as R-023.
- **Preservation:** after a publication safety review, the three Checkpoint 3 commits and this documentation-only closeout were pushed to `claude/great-dijkstra-wwi9g1` with my authorization (normal push). `main` unchanged; no deployment. A preservation push only stores commits on GitHub; it does not publish anything.
- **No automated run was made for this documentation-only commit.**

### Development challenges and lessons learned (continued from #69)
| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 70 | **Three checkpoint commits held only in a temporary workspace** | Workflow risk (accepted, then resolved) | From the Checkpoint 3 implementation until this closeout, the commits existed only in one conversation's container, plus ZIP archives I kept. The environment's stop hook asked for a push after every turn; Claude Code declined each time because pushes need my authorization, and said so each time. This is the same exposure as the 2a transfer incident (HANDOFF section 6), held deliberately until I had accepted the work. | Preserved at this closeout. **Lesson:** an accepted checkpoint should be preserved before a further round of refinement begins, not after. |

**What I corrected or redirected:** (to be completed by the owner)

## Draft entry — Checkpoint 4: Journal (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-27
**Tool:** Claude Code (cloud session)
**What I asked for:** recover the accepted Checkpoint 3 baseline in a fresh conversation, run one complete regression cycle, and, if it passed, build the Journal I had already designed with my project manager: one feed with Personal Reflections and Care Notes, optional titles and tags, search and filters, provider questions that can be marked answered, a privacy notice, and Resources removed from the navigation. No push, merge or deployment.

**What it produced:**
- The session branch fast-forwarded to the exact authoritative commit `8122feb` (parent `c8aa0c5`, 19 commits, clean tree, `main` still `aa8c869`).
- A passing baseline: type check, build with content validation, **427 of 427 unit and 251 of 251 end-to-end**, the first complete cycle on the final Calendar code.
- The Journal (Decisions #154–#168), using the store that has existed since database version 1. **Database version 3 unchanged; no migration.**
- Four primary tabs. Resources removed; Home's Journal shortcut live.
- 45 new unit tests and 29 new end-to-end tests, including an upgrade test from the accepted Checkpoint 3 build that compares both stored photographs byte for byte.
- A report (`docs/reviews/CHECKPOINT_4_IMPLEMENTATION_REPORT.md`), a Mac checklist (J1–J32 in TESTING_CHECKLIST), 12 screenshots (`docs/screenshots/checkpoint-4/`) and a ZIP.

**Choices Claude Code made without my explicit guidance** (Decisions #155–#168): a date rather than a date and time, and no future dates; the length limits; comma-separated tags with suggestions; how search and filters combine; where the answered control appears; outright deletion; the wording of the privacy notice and the change to Settings → Privacy; and **removing the “Daily encouragement” placeholder from Home**.

**What I corrected or redirected:** (to be completed by the owner)

### Development challenges and lessons learned (continued from #70)
| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 71 | **Edits began before the baseline run had finished** | Workflow error (Claude Code) | The instruction was to finish the baseline before changing application code. Claude Code created new, unreferenced files while the end-to-end run was in progress (harmless), then applied the first edits to existing files seconds before the last spec file, the upgrade tests, completed. Those tests rebuild the app from the working tree, so their result could have included the edits. | Claude Code noticed, stashed all work, re-ran that file on the pristine commit (7 of 7 passed) and restored the work. The baseline is 251 of 251 on unmodified code. **Lesson:** a gate means waiting for the run's last line, not its likely result. |
| 72 | **Escape closed a form with unsaved writing without asking** | Application defect, found by a new test before delivery | The shared sheet attaches its Escape handler once, when it opens. The Journal editor's “has anything changed?” check was therefore read as it stood at opening (nothing changed), so Escape discarded new writing silently. Cancel and a tap outside were unaffected. The first discard test missed it because it pressed Escape only after the form had been re-shown; the keyboard test caught it. | The editor passes the sheet a handler that reads the current state. A direct regression check was added (type, press Escape at once, expect the question). The Calendar's form is unaffected: it has no unsaved-changes check. |
| 73 | **Long unbroken words and two date fields overflowed narrow screens** | Application layout defects, found by the 320 px test | A 100-character word in a title widened the open-entry sheet to 829 px. The two date filter fields side by side were wider than a 320 px screen. | Sheet titles and paragraphs wrap long words; card contents are constrained to the card; the date fields stack below 360 px. |
| 74 | **Defects in the new tests themselves** | Test defects | (a) With the test clock fixed, two entries had the same creation time, so “most recent first” was undecided: the tests now advance the clock between entries. (b) A test expected Tab to wrap to the selected radio; the shared focus trap wraps to the first control (recorded in KNOWN_LIMITATIONS). (c) Two fixtures exceeded the title and tag limits they were not testing. (d) A test expected a button name with different spacing from the one the browser computes. | Corrected in the tests; no assertion about application behavior was weakened. |

### Automated results (run by Claude Code in this conversation)
Environment: Linux cloud container, Node 22.23.5, headless Chromium, no retries. **No Safari, Mac, iPhone or Android testing was performed by Claude Code.**

**Baseline, before any change (commit `8122feb`):**

| Check | Result |
|---|---|
| Type check; production build with content validation | Passed |
| Unit tests (21 files) | **427 of 427** |
| End-to-end tests | **251 of 251** (one complete cycle; the upgrade file re-run on the pristine commit, 7 of 7, see challenge #71) |

**Development runs (not part of the final sequence):**
- `journal.spec.ts`, first run: 24 of 28. All four failures were defects in the new tests (#74).
- Second and third runs exposed the two application defects (#72, #73), fixed in the application.
- Then `journal.spec.ts` 28 of 28 and `update.spec.ts` 8 of 8.

**Final sequence on the finished code — three consecutive complete cycles, each from a clean build, no retries, no changes between them:**

| Cycle | Type check | Build with content validation (JS 582.52 kB, 136.74 kB gzip) | Unit (23 files) | End-to-end |
|---|---|---|---|---|
| 1 | Passed | Passed | **472 of 472** | **280 of 280** (5.8 min) |
| 2 | Passed | Passed | **472 of 472** | **280 of 280** (5.8 min) |
| 3 | Passed | Passed | **472 of 472** | **280 of 280** (5.8 min) |

- **Totals:** 752 automated tests (678 before; +45 unit, +29 end-to-end). No test was skipped, disabled or retried. No failure occurred in the final sequence.
- **Database:** version 3 before and after; the upgrade test from `c8aa0c5` found every record identical and both photographs identical byte for byte.
- **Only documentation changed after the final sequence began** (these documents and regenerated screenshots).
- **Screenshots:** `docs/screenshots/checkpoint-4/` (12), from the final build.
- **Not tested by anyone yet:** Safari, Mac, iPhone, Android, an installed app.

## Draft entry — Checkpoint 4-R: Journal acceptance refinements (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-28
**Tool:** Claude Code (cloud session); secondary review by ChatGPT
**What happened:**
- I tested Checkpoint 4 (`7e9eb87`) in Mac Safari: **23 passed, J11 failed, 7 not tested** (J5, J7, J26, J27, J29, J30, J31), J32 deferred. I approve the Journal's overall design and the required date.
- I found three things: the two entry types looked too alike (J11); the unanswered filter could contradict the type filter; and, intermittently, switching children on the Journal opened a new-entry editor I hadn't asked for.
- ChatGPT, reviewing the source, proposed a cause for the third: the Home shortcut's address was corrected with `replaceState`, which doesn't notify the app's router, so the app kept “open a new entry” and acted on it again when the Journal remounted for another child.

**What I asked for:** record my results as they are; make the four views a single choice without making unanswered questions a third kind of entry; tint Care Note cards so the types differ at a glance in all five themes; investigate and reproduce the editor issue before changing anything, and report on the Calendar separately without changing it.

**What it produced:**
- **Reproduction first, on the unmodified build:** the hypothesis was confirmed. After the Home shortcut (saved or cancelled) a child switch reopened the editor, each time, until the Journal was left; the Journal tab's own button never did.
- **R-026 corrected at the cause:** a one-time address is now consumed in the router's state as well as the address bar.
- **R-024:** four single-selection views with the inclusion table I specified; stored records unchanged.
- **R-025:** tinted Care Note cards from existing theme colors.
- **Calendar:** the same defect confirmed for “New event”; **not changed**; recorded as R-027 for my decision.
- 3 new unit and 6 new end-to-end tests; a report, a reacceptance checklist (JR1–JR13), 8 screenshots and a ZIP.

**What I corrected or redirected:** (to be completed by the owner) — I failed J11; I clarified that mutually exclusive selections must not become mutually exclusive membership.

### Development challenges and lessons learned (continued from #74)
| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 75 | **A one-time shortcut address was used more than once** | Application defect (Checkpoint 4; the same pattern in the Calendar since Checkpoint 3) | Home's “Journal entry” opens `#/journal/new`. The Journal then replaced the address with `#/journal`, but replacing an address doesn't fire the event the router listens to, so the app still believed it was at “new”. The Journal screen is rebuilt when the active child changes, and each rebuild opened the form again. The Checkpoint 4 test of the shortcut checked the address, a reload and the form, but never switched children afterwards, so it passed. I met it intermittently in real use; ChatGPT identified the likely cause from the source; Claude Code reproduced it on the unmodified build before changing anything. | Corrected in the router (`consumeRoute`). Regression tests cover save and cancel, both directions, repeated use, reload, Back and Forward; they fail on the old handling and pass on the new. **Lesson:** a test of “the address looks right” is not a test of “the app's state is right”; and a second reviewer reading the source found in minutes what the test suite had not. |
| 76 | **Two filters that could contradict each other** | Design defect in Claude Code's Checkpoint 4 choice (#160) | “Unanswered questions” was an independent toggle beside the type filter, so “Personal Reflections + Unanswered” was selectable and always empty. The tests had even asserted that combination as correct behavior. | Replaced by four single-selection views (R-024). **Lesson:** combinable filters need a check that every combination can mean something. |
| 77 | **“Distinct” in the tests was not distinct to the eye** | Requirement shortfall (failed J11) | The Checkpoint 4 tests proved the two card types had different edge and badge colors. They did not, and could not, prove a person would notice. Shade disparity is something I had already raised once (R-018). | Whole-card tint for Care Notes (R-025); the theme tests now also require a minimum lightness step between the two cards. Whether it is enough is mine to judge at reacceptance. |
| 78 | **A finding outside the authorized scope** | Scope control | The Calendar has the R-026 defect too. Fixing it would have been one line. | Left unchanged, reproduced, documented as R-027 with a proposed correction, for my separate authorization. |

### Automated results (run by Claude Code in this conversation)
Environment: Linux cloud container, Node 22.23.5, headless Chromium, no retries. **No Safari, Mac, iPhone or Android testing was performed by Claude Code.**

**Before changing anything (unmodified `7e9eb87` build):** a scripted reproduction of R-026. Six runs: Journal via Home shortcut (save, cancel), Journal via the tab's button (save, cancel), Calendar via Home shortcut (save, cancel). The editor reopened after a child switch in all four shortcut runs and in neither tab run.

**Targeted runs:**

| Check | Result |
|---|---|
| Type check | Passed |
| `journal.test.ts` after the filter change (27 tests) | **27 of 27** |
| `journal.spec.ts` with the refinements and the 6 new tests (34 tests: all Journal behavior, the four views, question transitions, combined filters, Home shortcut, profile switching and isolation, five themes with axe, 320 and 390 px, keyboard, unsaved changes) | **34 of 34 on the first run** |
| The three R-026 tests against the **old** route handling (temporarily restored) | **2 failed, 1 passed**, as expected: the two shortcut tests fail without the correction; the tab test is unaffected. Correction then restored |

**One complete cycle on the finished code, from a clean build, no retries (the cadence authorized for this round):**

| Type check | Build with content validation (JS 582.69 kB, 136.81 kB gzip) | Unit (23 files) | End-to-end |
|---|---|---|---|
| Passed | Passed | **475 of 475** | **286 of 286** (6.2 min) |

- **Totals:** 761 automated tests (752 before; +3 unit, +6 end-to-end). Nothing skipped, disabled or retried. **No failure occurred in any run during this refinement** other than the deliberate old-behavior check above.
- **Database:** version 3; the stored Journal record's fields are asserted unchanged.
- **Only documentation changed after the complete cycle began.**
- **Screenshots:** `docs/screenshots/checkpoint-4-r/` (8), from the final code.
- **Not tested by anyone yet:** the refinements in Safari; anything on an iPhone.

## Draft entry — Checkpoint 4-R2: related Calendar routing correction (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-28
**Tool:** Claude Code (cloud session); secondary review by ChatGPT
**What happened:** ChatGPT's secondary review passed the three Journal refinements. Before my own reacceptance, I authorized the Calendar correction Claude Code had proposed (R-027), so that I could review everything in one local preview.
**What I asked for:** the narrowest correction, using the mechanism already added for the Journal; regression tests shown failing on the original handling; targeted tests only; no Journal changes; stop if anything broader was needed.

**What it produced:**
- Two regression tests written first, both failing on the original Calendar handling.
- A one-call correction in `Calendar.tsx` (plus its import and a comment). Both tests then passed.
- **An unexpected failure in an unchanged Journal test,** which Claude Code traced to a separate, older Journal defect (R-028). It did not change the Journal: it reproduced the defect, checked that the Calendar is not affected, tried a correction in a throwaway experiment, reverted it, and reported.

**What I corrected or redirected:** (to be completed by the owner)

### Development challenges and lessons learned (continued from #78)
| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 79 | **The Calendar's shortcut had the Journal's routing defect** | Application defect (present since Checkpoint 3; found by investigation, not by acceptance) | Same cause as #75. My Checkpoint 3 acceptance did not include the sequence that shows it, because nobody had identified it. | Corrected with the existing mechanism after separate authorization. Tests fail before and pass after. |
| 80 | **A test that had always passed failed, and the fault was in the app** | Application defect in the Checkpoint 4 Journal (unsaved typing can be lost), exposed by test timing | During the targeted run the Journal keyboard test failed once. Repeating it showed 5 of 12 failures, then 2 of 16 on the previous, unmodified commit: not caused by the Calendar change. Recording the page's events showed the entry form being removed and rebuilt at the instant the entry list finished loading. The test opens the form and presses a key within a few hundredths of a second of arriving; whether the key landed before or after the rebuild decided the result. Every earlier run, including the three complete cycles, had fallen the lucky way. A first attempt to observe it made it vanish, because the observation itself added a delay. With the load slowed to 1.5 seconds, typed text was cleared every time; the Calendar's form kept its text. | **Not corrected** (outside this step's authorization): recorded as R-028 with a tested proposal. The test is left untouched so it keeps exposing the defect. **Lessons:** three clean runs do not prove the absence of a timing-dependent defect; an intermittent failure should be diagnosed, not re-run until it passes; and a deterministic test that slows the load would have caught this at Checkpoint 4. |

### Automated results (run by Claude Code in this conversation)
Environment: Linux cloud container, Node 22.23.5, headless Chromium, no retries. **No Safari, Mac, iPhone or Android testing was performed by Claude Code.**

**Deliberately reproduced failures (expected):**

| Check | Result |
|---|---|
| The two new R-027 tests against the **original** Calendar handling, before the correction | **2 of 2 failed**, as intended: the Add event form was open after the first child switch |

**Results with the correction:**

| Check | Result |
|---|---|
| Type check | Passed |
| Production build with content validation (JS 582.66 kB, 136.80 kB gzip) | Passed |
| Unit tests (23 files) | **475 of 475** |
| Targeted end-to-end, one run: Calendar (33, including the 2 new R-027 tests), Journal (34, including the 3 R-026 tests), Checkpoint 1 (18), review regressions (22), final refinement (22), responsive (10), update (8) | **146 of 147** |

**Unexpected failure (1), not caused by this change:** `journal.spec.ts` “keyboard and focus”. Diagnosed as R-028 (challenge #80).

| Follow-up on that test | Result |
|---|---|
| Repeated 12 times with the correction in place | 7 passed, 5 failed |
| Repeated 16 times on the unmodified previous commit `c236a05` | 14 passed, 2 failed — **the defect pre-exists this step** |
| Slow-load reproduction: Journal via Home shortcut; Journal via the tab's button | Typed text cleared when loading finished, both times |
| Slow-load reproduction: Calendar via Home shortcut | Typed text kept — **the Calendar is not affected** |
| Throwaway experiment with the proposed R-028 correction (then reverted), 24 repetitions | 24 passed |

- **Totals:** 475 unit and 288 end-to-end tests exist (763; +2 for R-027). **No complete end-to-end cycle was run for this step** (authorized); the Growth and goals/exercises files were not run.
- **The targeted run was not repeated to obtain a clean result,** and the failing test was not changed, skipped or retried.
- **Application change in the commit:** `Calendar.tsx` only. The Journal's code is byte-for-byte what it was at `c236a05`.

## Draft entry — Checkpoint 4-R3: Journal unsaved writing preservation (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-28
**Tool:** Claude Code (cloud session); secondary review by ChatGPT
**What happened:** ChatGPT's review passed the Calendar correction. I authorized the correction of R-028, the defect Claude Code had found and reported, without fixing, during the previous step.
**What I asked for:** the narrow fixed-container correction it had tried experimentally; deterministic tests using controlled loading delays, shown failing on the original structure; both ways of opening the form; no drafts, no production delays, no other changes; one complete cycle.

**What it produced:**
- Four deterministic tests written first. The test page holds the list's load until the test releases it, so timing no longer decides the outcome.
- On the original structure, **2 of 4 failed**: the form was rebuilt when the list turned out to be empty, through either opening path, and survived when the list had entries. That is narrower than first reported: the exposed case was a child's first journal entry.
- The correction: one container element in `Journal.tsx`. All four tests then passed.
- Regenerated screenshots identical to the committed ones, byte for byte.

**What I corrected or redirected:** (to be completed by the owner)

### Development challenges and lessons learned (continued from #80)
| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 81 | **Correcting the form reset (R-028)** | Application defect, corrected | See #80 for how it was found. With authorization, the loading line, empty state and feed were placed in one fixed container so that swapping them cannot rebuild the form beside them. | Deterministic tests fail before (2 of 4) and pass after (4 of 4). The previously intermittent keyboard test is unchanged and passes. |
| 82 | **The first description of the defect was broader than the facts** | Diagnosis refined by a better test | From the slow-load script, Claude Code reported that any journal was exposed. The deterministic tests showed the form survived when the list had entries and was rebuilt only when it was empty. | Documentation corrected to say so, with the earlier record left in place and marked. **Lesson:** a controlled test describes a defect's boundaries better than a timing-based reproduction. |
| 83 | **A race in the new test's own setup** | Test defect | The first version checked, immediately after opening the form, that the list's read was already being held; sometimes the app had not issued it yet, and the check failed for that reason alone. | The check now waits for the read to be issued. No assertion about the application was changed. |

### Automated results (run by Claude Code in this conversation)
Environment: Linux cloud container, Node 22.23.5, headless Chromium, no retries. **No Safari, Mac, iPhone or Android testing was performed by Claude Code.**

**Deliberately reproduced failures (expected), on the original rendering structure:**

| Test | Result on the original structure |
|---|---|
| Home shortcut, empty journal | **Failed as intended** (the dialog had been rebuilt) |
| Journal tab, empty journal | **Failed as intended** (the dialog had been rebuilt) |
| Home shortcut, populated journal | Passed (no rebuild occurs in this case) |
| Journal tab, populated journal | Passed (no rebuild occurs in this case) |

*A first run of these four, before the setup race (#83) was fixed, showed 3 failures: the two above and one caused by the test's own setup.*

**Results with the correction:**

| Check | Result |
|---|---|
| The four R-028 tests | **4 of 4** |
| Regenerated Checkpoint 4-R screenshots compared with the committed files | 8 of 8 byte-for-byte identical (no visual change) |
| Targeted end-to-end, one run: Journal (38, complete suite, including the unchanged “keyboard and focus” test and the R-024 to R-026 tests), Calendar (33, including R-027), Checkpoint 1 (18), review regressions (22), final refinement (22), responsive (10) | **143 of 143** |

**One complete cycle on the finished code, from a clean build, no retries:**

| Type check | Build with content validation (JS 582.71 kB, 136.80 kB gzip) | Unit (23 files) | End-to-end |
|---|---|---|---|
| Passed | Passed | **475 of 475** | **292 of 292** (6.8 min) |

- **Totals:** 767 automated tests (763 before; +4 end-to-end). Nothing skipped, disabled or retried.
- **Unexpected failures in this step:** none in the application. One failure in the first run of the new tests came from the test's own setup (#83).
- **The previously intermittent test was not repeated beyond the ordinary suites,** as instructed; it passed in both the targeted run and the complete cycle.
- **Application change in the commit:** `Journal.tsx` only (one container element and a comment). Calendar, router, database and styles untouched.
- **Only documentation changed after the complete cycle began.**
- **Not tested by anyone yet:** R-024 to R-028 in Safari; anything on an iPhone.

## Draft entry — Checkpoint 4 formal acceptance closeout (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-28
**What happened:**
- **I completed one combined reacceptance in Mac Safari** against `aa695b9`: all 17 checks passed (JR1–JR11, CS1–CS4, JS1–JS2). I had no further observations. I did not perform the optional extra testing (JR12).
- **Checkpoint 4 and refinements R-024 to R-028 are formally accepted** for the submission version, subject to the final physical-device and publication checks.
- **Actual testing history, kept separate:**
  - *Mine, Mac Safari, original acceptance of `7e9eb87`:* 23 passed; J11 failed; J5, J7, J26, J27, J29, J30 and J31 not tested; J32 deferred.
  - *Mine, Mac Safari, reacceptance of `aa695b9`:* 17 of 17 passed. My two writing-preservation checks were ordinary use; I did not reproduce R-028 by hand.
  - *Delegated secondary review (ChatGPT):* the routing-state diagnosis; source and screenshot review of R-024 to R-026 and of R-027.
  - *Automated (Claude Code, headless Chromium):* three complete cycles of 752 on `7e9eb87`; one of 761 on `c236a05`; targeted only on `dd15e9d` (146 of 147, the failure exposing R-028); one complete cycle of 767 (475 unit, 292 end-to-end) on `aa695b9`, no failures.
- **How the checkpoint actually went:** the Journal passed three clean cycles and still had four things wrong that tests had not shown: types too alike to the eye; a filter pair that could contradict itself; a shortcut that fired twice (found by me in use, diagnosed by ChatGPT from the source, reproduced by Claude Code before it changed anything); and a form that could lose a parent's first words (exposed by one intermittent test failure that Claude Code investigated instead of re-running). The same routing fault turned out to have been in the accepted Calendar since Checkpoint 3.
- **Carried to Checkpoint 6:** the seven untested Journal items; all physical-iPhone and installed-app checks; final accessibility and regression verification; the vaccine schedule currency recheck; the source and publication audit; assignment requirement verification; merge, deployment and verification of the deployed commit.
- **Preservation:** after a publication safety check, the four Checkpoint 4 commits and this documentation-only closeout were pushed to `claude/awesome-ritchie-b198ya` with my authorization (normal push). `main` unchanged; no deployment.
- **No automated run was made for this documentation-only commit.**

### Development challenges and lessons learned (continued from #83)
| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 84 | **Four accepted-in-progress commits held only in a temporary workspace, again** | Workflow risk (accepted, then resolved) | From the Checkpoint 4 implementation through three refinement rounds, the commits existed only in one conversation's container and the ZIP archives I kept. The stop hook asked for a push after every turn; Claude Code declined each time, as instructed. This repeats #70, whose lesson was to preserve before refining. I chose to hold again so that only accepted work reached GitHub. | Preserved at this closeout. The risk did not materialize. **Lesson, restated honestly:** this was a deliberate trade, not an oversight; the ZIP after each round was what made it tolerable. |
| 85 | **What three clean regression cycles did and did not show** | Testing insight | 752 tests passed three times in a row on a build that contained a visible design shortfall, a contradictory control, a routing fault and a data-loss race. Human use found two, a second reviewer's reading found the cause of one, and an intermittent failure taken seriously found the last. | Each is now covered by a test that fails on the old code. **Lesson:** automated regression shows that what was specified still works; it takes people, a second reader and curiosity about odd failures to find what was never specified. |

**What I corrected or redirected:** (to be completed by the owner)

## Draft entry — Checkpoint 6: streamlined final publication (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-28
**What I decided:** to publish on the evidence I already had rather than run another long verification phase, so that I could test on my iPhone and submit. I accepted that this means the final version reached the public address before any physical-device testing of anything after Checkpoint 1.
**What I asked for:** five essential checks, then a fast-forward of `main`, the existing deployment workflow, and proof that the public app really is the finished version; no new features, no repeated regression cycles, no more archives.
**What it produced:**
- Baseline recovered and verified (`6b6a2d2`, 24 commits).
- CDC's reuse terms re-read, then the schedule pages: the July 2, 2025 schedule is still CDC's stated current schedule.
- A production build identical to the one from the accepted test cycle; deployment configuration unchanged.
- `main` fast-forwarded to `6b6a2d2`; deployment run 2 succeeded.
- A live check: the public app's files match the local build byte for byte, and it shows Home, Growth, Calendar and Journal.
- An iPhone checklist for me (P1–P12).

**What I corrected or redirected:** (to be completed by the owner)

### Development challenges and lessons learned (continued from #85)
| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 86 | **Choosing where to stop verifying** | Project decision (owner) | The plan called for a final regression, accessibility and device-testing phase before publication. With a deadline, I chose to rely on existing evidence and publish first. | Published successfully. What that choice leaves unverified is listed plainly in KNOWN_LIMITATIONS rather than implied to be done. **Lesson:** a streamlined release is defensible when the gaps are written down. |
| 87 | **“Pushed” is not “published”** | Verification practice | The deployment is a separate manual workflow, and a successful run still isn't proof of what the public address serves. | Claude Code compared the public app's files with a local build of the same commit and opened the live app. The version label could not help: it reads 0.1.1 for both Checkpoint 1 and the final version. |

### Results (Claude Code, 2026-11-28)
See “Checkpoint 6 — publication checks” in TESTING_CHECKLIST. **No Safari, Mac or iPhone testing was performed by Claude Code. Physical iPhone acceptance has not been performed.**

## Draft entry — CP6-R: final physical iPhone layout correction (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-28
**What happened:** I tested the published app on my iPhone. The installed Checkpoint 1 app updated itself to the final version and kept my existing data. Ten of twelve checks passed. One failed: every date and time field was slightly wider than the screen, and the page could be dragged sideways. I did not test offline use.
**What I asked for:** a narrow, centralized CSS correction, focused checks at phone widths, and republication; no global overflow hiding, no custom pickers, no full regression.
**What it produced:** one block in the shared stylesheet; a layout test covering every date and time field in the app; republication. Claude Code told me plainly that its environment has only Chromium, which does not size these fields the way an iPhone does, so its tests could not reproduce what I saw and my retest is the real verification.

**What I corrected or redirected:** (to be completed by the owner)

### Development challenges and lessons learned (continued from #87)
| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 88 | **A defect only a real iPhone could show** | Application layout defect (iOS only), found by physical-device testing | Native date and time fields on iOS Safari keep an intrinsic minimum width and their own appearance, so the shared `width: 100%` did not contain them. Every earlier check ran in desktop Safari or headless Chromium, where the fields behave. 767 automated tests, including “no sideways scrolling” checks at 320 px, passed with the defect present. | Corrected in the shared stylesheet; republished; awaiting my retest. **Lesson:** emulated phone widths test my layout, not the phone's own controls. Physical-device testing found in minutes what no simulated check could. |

## Draft entry — Final acceptance and project closeout (drafted by Claude Code; edit before submitting)
**Date:** 2026-11-28
**What happened:**
- **I retested the corrected app on my iPhone** (installed app, published `831a0dd`): the update arrived, every date and time field now fits the screen and lines up with the other fields, the pickers still work, and offline use works. P4a–P4d and P10 passed. I had no further observations.
- **All 12 physical iPhone requirements are satisfied.** The record keeps what actually happened: P4 failed the first time and passed after the R-029 correction; P10 was not tested the first time and passed the second.
- **R-029 is closed. The submission version is complete.**
- **Actual testing history, kept separate:**
  - *Mine, Mac Safari:* acceptance of each checkpoint, with the failures and untested items recorded in TESTING_CHECKLIST.
  - *Mine, physical iPhone:* 10 of 12 on the first published version; the remaining two on the corrected version.
  - *Delegated secondary review (ChatGPT):* source and screenshot reviews, and two diagnoses that proved right (the routing state behind R-026; the shared input styling behind R-029).
  - *Automated (Claude Code, headless Chromium):* the last complete cycle was 475 unit and 292 end-to-end tests on `aa695b9`; R-029 had targeted tests only. No run was made for this documentation-only closeout.
- **Still true, and written down rather than tidied away:** no backup; one iPhone and one Mac; several itemized checks never performed by a person; no final full regression after the last two changes; deferred features unbuilt.
- **Preservation:** this documentation-only closeout was pushed to `main` and `claude/awesome-ritchie-b198ya` with my authorization (normal pushes). The app was not redeployed.

### Development challenges and lessons learned (continued from #88)
| # | Challenge | Class | What happened | Outcome |
|---|---|---|---|---|
| 89 | **A correction that could only be verified by me** | Verification limit | Claude Code could not reproduce the iPhone defect or confirm its own fix: its environment has Chromium only. It said so, shipped the well-understood correction with a guard test, and left P4 recorded as failed until I checked. | My retest passed. **Lesson:** the honest status of an unverifiable fix is “corrected, not verified”, and the person with the device closes it. |

**What I corrected or redirected:** (to be completed by the owner)
