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
