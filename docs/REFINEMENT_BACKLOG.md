# Refinement Backlog

A living list of refinements and suspected defects that are recorded but not yet corrected. Items are added when observed and are never marked resolved without a fix and a recorded verification.

**Status values:** Pending investigation · Investigated (cause known) · Approved for correction · Corrected (awaiting verification) · Verified · Closed without change (with reason).
**Rule:** recording an item does not authorize a fix. Each correction needs the owner's authorization, normally as part of a checkpoint.

| ID | Title | Area | Recorded | Status |
|---|---|---|---|---|
| R-001 | Onboarding child-name input overflow | Onboarding · layout | 2026-11-26 (owner observation; date observed not recorded) | Pending investigation |
| R-002 | Growth sections repetitive; unclear what updates progress | Growth · product design | 2026-11-26 (owner acceptance testing) | Corrected (awaiting verification) |

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
