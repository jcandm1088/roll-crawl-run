# Checkpoint 1 Review — Findings and Revisions

**Reviewer:** the project owner (student). The review was hands-on, using a locally running production build on a Mac, and was followed by a secondary review with another AI assistant.
**Revision scope:** Checkpoint 1 refinements only. Checkpoint 2 has not started, and nothing was pushed or deployed.

This document records the reviewer's observations as they were reported, sorted into three types: observed defects, design preferences, and future feature requirements. Claude Code did not invent any of these items. Where Claude Code reproduced or investigated an item, the result is stated.

## A. Observed defects (reported from hands-on use)
| # | Observation (reviewer) | Investigation and result |
|---|---|---|
| D-1 | On the desktop, clicking the child-profile selector in the upper-left made the selector appear substantially **above the top edge** of the app. | **Reproduced.** The selector was a dialog using `position: fixed`, rendered *inside* the sticky top bar. The top bar uses `backdrop-filter` (blur). In some browser engines that makes the top bar the positioning container for fixed-position children, so the dialog was positioned against the ~64px top bar instead of the window. On wide screens the dialog is vertically centered, so it was centered on the top bar and extended about 100px above the window. The headless Chromium used for testing does not apply that rule, so the defect was invisible to the original automated tests. Forcing the same containing-block behavior (`transform` on the top bar) reproduces it exactly: sheet top at −102px, backdrop only 64px tall (`before/desktop-selector-defect-reproduced.png`). **Fixed:** see section D. |
| D-2 | The heading “Your information stays with you” sat too close to the information card below it. | Confirmed: the gap was 24px. Increased to 40px (+16px) and verified at 390px and 1280px. |
| D-3 | Fraunces produced undesirable letterforms in certain headings: the **J** in a child's name, the **J** in “Journal”, and the **f** in “Profiles”. | Confirmed as a design issue with the display face at those sizes. The requested headings now use Inter; see section E. |

## B. Design preferences (subjective; adopted as requested)
- Settings felt visually overwhelming because every category was expanded at once. Your Data, Calendar & Reminders, This Device, and About are now accordions, collapsed by default.
- Destructive actions (reset, delete profile) were too prominent. Both are now under collapsed “Advanced …” sections with restrained styling and two-step confirmation.
- “Chronological age” on Home is unnecessary technical wording. The age now shows plainly; corrected age gets a quiet “corrected” tag.
- Wording should be less technical and robotic throughout. The placeholder descriptions were rewritten.
- New Growth intro and section names and order: Progress → Goals & Exercises → What to Expect at Every Age → Milestone Library.
- New Resources intro wording.
- Blush was too dusty or mauve. It was revised toward a clearer baby pink.
- The reviewer is not satisfied with the current logo. Five concepts were produced for review, and the production logo is unchanged.

## C. Future feature requirements (recorded in the development plan, not built now)
- The Calendar tab opens directly to the current month, with today highlighted, month navigation, an agenda view, and upcoming events listed below the calendar (Checkpoint 3).
- Backups (Checkpoint 5): create a backup, restore from a backup, backup history, the date of the last successful external backup, optional reminders, and encouragement to back up before destructive actions.
- Permanent language and user-experience standards for all remaining checkpoints.

## D. Secondary-review technical items (each verified against the code)
| Item | Finding | Action |
|---|---|---|
| Profile and photo saved in separate operations | **Confirmed.** `saveChild` called `createChild`/`updateChild` and then `setChildPhoto` as two transactions. If the photo write failed, a profile without its photo could remain, and retrying created a **duplicate** profile. | New `saveChildProfile()` writes the profile and photo in one atomic transaction. Each form generates its profile ID once, so a retry or double-tap updates the same record. Six unit tests simulate storage failures. |
| Dialog focus trapping | **Confirmed.** Dialogs focused their first control and handled Escape, but Tab could leave the dialog. | New `useFocusTrap` hook: Tab and Shift+Tab wrap inside the dialog, Escape closes it, and focus returns to the opener. It runs as a layout effect so focus moves before the next keypress. Tests added. |
| Theme radio controls without arrow keys | **Confirmed.** Every option was a separate Tab stop, and the arrow keys did nothing. | Roving tabindex and arrow, Home, and End keys for all radio groups: theme, corrected age, age basis, profile color. In the child selector, arrows move focus and Enter selects. Tests added. |
| Deploy workflow published on every push to `main` | **Confirmed.** | The workflow is now `workflow_dispatch` only and requires typing `deploy`. It builds only from `main`. A unit test checks that there are no push, pull-request, or schedule triggers. |

**Found during re-testing:** a hash-routing timing gap. If the address changed between the first render and the moment the `hashchange` listener attached, the app could show the previous screen. This surfaced as an intermittent end-to-end failure. Fixed by re-syncing the route when the listener attaches; the suite then passed three consecutive runs.

## E. Typography decision status
- **Built (option A):** the child's name and age on Home, the Journal heading, and the Settings “Profiles” heading use Inter. Fraunces is kept everywhere else.
- **Alternative (option B), shown for comparison only:** Inter for all functional headings, with Fraunces reserved for the wordmark, the welcome screen, and screen titles in the top bar. The board is at `docs/screenshots/checkpoint-1-review/compare/typography-A-vs-B.png`. **Not adopted.**
- With option A, the Settings page shows “Profiles” in Inter directly above “Appearance” and the accordion titles in Fraunces. The reviewer should judge whether that mix is acceptable or whether option B is preferred.
