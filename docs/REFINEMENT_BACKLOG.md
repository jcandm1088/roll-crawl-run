# Refinement Backlog

A living list of refinements and suspected defects that are recorded but not yet corrected. Items are added when observed and are never marked resolved without a fix and a recorded verification.

**Status values:** Pending investigation · Investigated (cause known) · Approved for correction · Corrected (awaiting verification) · Verified · Closed without change (with reason).
**Rule:** recording an item does not authorize a fix. Each correction needs the owner's authorization, normally as part of a checkpoint.

| ID | Title | Area | Recorded | Status |
|---|---|---|---|---|
| R-001 | Onboarding child-name input overflow | Onboarding · layout | 2026-11-26 (owner observation; date observed not recorded) | Pending investigation |
| R-002 | Growth sections repetitive; unclear what updates progress | Growth · product design | 2026-11-26 (owner acceptance testing) | Corrected (awaiting verification) |
| R-003 | Library controls fill most of a phone's first screen (potential control-density refinement) | Growth · Library layout | 2026-11-26 (recorded in the refinement's review; see KNOWN_LIMITATIONS) | Pending (owner review) |
| R-004 | Use gender-neutral language consistently | Content · Growth | 2026-11-27 (owner usability review) | Corrected (awaiting verification) |
| R-005 | Remove personal milestone creation | Growth · Library | 2026-11-27 (owner usability review) | Corrected (awaiting verification) |
| R-006 | Reduce excessive CDC terminology | Content · all Growth screens | 2026-11-27 (owner usability review) | Corrected (awaiting verification) |
| R-007 | Consolidate Note and Observations into Notes & Observations | Milestone page | 2026-11-27 (owner usability review) | Corrected (awaiting verification) |
| R-008 | Explain how to change the age basis on Progress | Progress | 2026-11-27 (owner usability review) | Corrected (awaiting verification) |

---

## R-001 — Onboarding child-name input overflow
- **Source:** the owner's hands-on use on a physical mobile device. Recorded during the Checkpoint 2a continuation (2026-11-26); the date it was first observed was not recorded. Not reproduced or investigated yet.
- **Observation (as reported):** an input field on the initial child-profile creation screen, believed to be the child's name field, extends beyond the right edge of the viewport. The field remains functional.
- **Not yet known:** the exact field, device, browser, and viewport width, and whether it also affects the Add a child and profile edit forms.
- **Relevant fact about the tests (noted, not investigated):** the automated “no horizontal scrolling” checks (`tests/e2e/responsive.spec.ts`) run *after* onboarding and measure Home, Settings, Add a child and Growth. They do not measure the onboarding screens themselves, and they measure page-level horizontal scrolling only, which would miss a field that overflows while the page itself does not scroll. They pass in headless Chromium.
- **Expected correction:** preserve the existing styling while ensuring the field stays within the viewport, with consistent margins. Investigate the other onboarding fields (date of birth, corrected-age inputs, theme options) for similar issues, and verify narrow-screen behavior.
- **Status:** Pending investigation. **Do not implement until authorized.**

---

## R-002 — Growth sections repetitive; unclear what updates progress
- **Source:** the owner's initial hands-on acceptance testing of Checkpoint 2a, before accepting 2a or starting 2b.
- **Classification:** a **human-discovered usability and product-design issue**, not a coding defect. The original implementation followed the approved specification and passed all **339 automated tests** (228 unit, 111 end-to-end).
- **Observation:** the Growth sections felt repetitive: What to Expect, its “Everything up to now” view and the Library all showed variations of the same milestone checklist. It was not intuitive which actions update developmental progress.
- **Root cause (assessment):** the specification placed tracking inside the age-range view. Home's “Record a milestone” opened the educational section. Progress meters appeared in four places. The effect of recording was explained only in a collapsed accordion. The guide depended on the child's records.
- **Correction:** the Growth UX refinement (plan R11, Decisions #65–#74): new section order and responsibilities, a read-only guide, the Library as the recording tool, Progress as the review dashboard, and clearer confirmations.
- **Status:** Corrected (awaiting verification). Implemented and covered by automated tests (headless Chromium). It becomes **Verified** only after the owner's hands-on acceptance testing.

---

## R-003 — Library control density
- **Source:** recorded during the Growth UX refinement (2026-11-26) as an observation for the owner's review: on a phone, the view control, search, area chips, age and status selectors and the hidden toggle fill most of the first screen.
- **Note:** before 2026-11-27 this item was listed only in KNOWN_LIMITATIONS, not in this table. It was added here when the owner referred to it as R-003.
- **Change at the acceptance refinements:** one chip (“Your versions”) was removed as part of R-005. Otherwise the layout is unchanged.
- **Status:** Pending (owner review). **Do not implement until authorized.**

---

## R-004 to R-008 — owner usability findings (human acceptance review of `170cc99`)
- **Source:** the owner's hands-on usability review of the refined Growth experience. That build had passed **all 387 automated tests (252 unit, 135 end-to-end) in three consecutive runs**.
- **Classification:** all five are **human-discovered usability findings and design preferences**. None is a malfunction: the app did what its specification said. They show again that automated tests check the specification, while the owner's review checks whether it serves parents.

| ID | Finding (as reported) | Correction | Classification |
|---|---|---|---|
| R-004 | Milestones alternated “he” and “she”; inconsistent gendered language | Validated gender-neutral display layer; CDC catalog unchanged; adaptation disclosed | Usability / content preference |
| R-005 | “Make a personal version” didn't belong in a library of established milestones | Creation controls removed; existing entries preserved and reachable | Product-design preference |
| R-006 | Repeated CDC terminology felt formal, robotic and distracting | Plain terms; consolidated attribution | Usability / tone |
| R-007 | Separate Note box and Observations form were redundant | One Notes & Observations section; existing notes shown honestly | Usability |
| R-008 | No explanation of how to change the age used for milestones | Explanation and a “Manage age settings” link on Progress | Usability |

- **Details:** `docs/reviews/CHECKPOINT_2A_ACCEPTANCE_REFINEMENTS.md`.
- **Status:** Corrected (awaiting verification). Covered by automated tests in headless Chromium. Each becomes **Verified** only after the owner's hands-on acceptance.
