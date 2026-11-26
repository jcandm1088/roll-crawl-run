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
| Handoff | this commit | Documentation only. |
