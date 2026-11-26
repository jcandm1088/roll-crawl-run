# Refinement Backlog

A living list of refinements and suspected defects that are recorded but not yet corrected. Items are added when observed and are never marked resolved without a fix and a recorded verification.

**Status values:** Pending investigation · Investigated (cause known) · Approved for correction · Corrected (awaiting verification) · Verified · Closed without change (with reason).
**Rule:** recording an item does not authorize a fix. Each correction needs the owner's authorization, normally as part of a checkpoint.

| ID | Title | Area | Recorded | Status |
|---|---|---|---|---|
| R-001 | Onboarding child-name input overflow | Onboarding · layout | 2026-11-26 (owner observation; date observed not recorded) | Pending investigation |

---

## R-001 — Onboarding child-name input overflow
- **Source:** the owner's hands-on use on a physical mobile device. Recorded during the Checkpoint 2a continuation (2026-11-26); the date it was first observed was not recorded. Not reproduced or investigated yet.
- **Observation (as reported):** an input field on the initial child-profile creation screen, believed to be the child's name field, extends beyond the right edge of the viewport. The field remains functional.
- **Not yet known:** the exact field, device, browser, and viewport width, and whether it also affects the Add a child and profile edit forms.
- **Relevant fact about the tests (noted, not investigated):** the automated “no horizontal scrolling” checks (`tests/e2e/responsive.spec.ts`) run *after* onboarding and measure Home, Settings, Add a child and Growth. They do not measure the onboarding screens themselves, and they measure page-level horizontal scrolling only, which would miss a field that overflows while the page itself does not scroll. They pass in headless Chromium.
- **Expected correction:** preserve the existing styling while ensuring the field stays within the viewport, with consistent margins. Investigate the other onboarding fields (date of birth, corrected-age inputs, theme options) for similar issues, and verify narrow-screen behavior.
- **Status:** Pending investigation. **Do not implement until authorized.**
