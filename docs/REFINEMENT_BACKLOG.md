# Refinement Backlog

A living list of refinements and suspected defects that are recorded but not yet corrected. Items are added when observed and are never marked resolved without a fix and a recorded verification.

**Status values:** Pending investigation · Investigated (cause known) · Approved for correction · Corrected (awaiting verification) · Verified · Closed without change (with reason).
**Rule:** recording an item does not authorize a fix. Each correction needs the owner's authorization, normally as part of a checkpoint.

| ID | Title | Area | Recorded | Status |
|---|---|---|---|---|
| R-001 | Onboarding child-name input overflow | Onboarding · layout | 2026-11-26 (owner observation; date observed not recorded) | Deferred (pending investigation) |
| R-002 | Growth sections repetitive; unclear what updates progress | Growth · product design | 2026-11-26 (owner acceptance testing) | Accepted for Mac usability (2026-11-27); iPhone pending |
| R-003 | Library controls fill most of a phone's first screen (potential control-density refinement) | Growth · Library layout | 2026-11-26 (recorded in the refinement's review; see KNOWN_LIMITATIONS) | Deferred |
| R-004 | Use gender-neutral language consistently | Content · Growth | 2026-11-27 (owner usability review) | Accepted for Mac usability (2026-11-27); iPhone pending |
| R-005 | Remove personal milestone creation | Growth · Library | 2026-11-27 (owner usability review) | Accepted for Mac usability (2026-11-27); iPhone pending |
| R-006 | Reduce excessive CDC terminology | Content · all Growth screens | 2026-11-27 (owner usability review) | Accepted for Mac usability (2026-11-27); iPhone pending |
| R-007 | Consolidate Note and Observations into Notes & Observations | Milestone page | 2026-11-27 (owner usability review) | Accepted for Mac usability (2026-11-27); iPhone pending |
| R-008 | Explain how to change the age basis on Progress | Progress | 2026-11-27 (owner usability review) | Accepted for Mac usability (2026-11-27); iPhone pending |
| R-009 | Simplify deleted-entry presentation | Milestone page · Notes & Observations | 2026-11-27 (owner, Mac acceptance) | Deferred (low priority) |
| R-010 | Age-responsive goal inspiration | My Goals · inspiration | 2026-11-27 (owner, 2b Mac acceptance) | **Verified** (owner, Mac Safari, 2026-11-27; closed) |
| R-011 | Reduce repetitive CDC attribution on activity pages | Exercises · activity pages | 2026-11-27 (owner, 2b Mac acceptance) | **Verified** (owner, Mac Safari, 2026-11-27; closed) |
| R-012 | Exercise form heading alignment | Exercises · Add/Edit exercise | 2026-11-27 (owner, 2b Mac acceptance) | **Verified** (owner, Mac Safari, 2026-11-27; closed) |
| R-013 | Stopwatch target duration input alignment | Exercises · Add/Edit exercise | 2026-11-27 (owner, 2b Mac acceptance) | **Verified** (owner, Mac Safari, 2026-11-27; closed) |
| R-014 | Session correction duration input alignment | Exercises · session correction | 2026-11-27 (owner, 2b Mac acceptance) | **Verified** (owner, Mac Safari, 2026-11-27; closed) |
| R-015 | Remove deleted exercise sessions from visible history | Exercises · sessions | 2026-11-27 (owner, 2b Mac acceptance) | **Verified** (owner, Mac Safari, 2026-11-27; closed) |
| R-016 | Stopwatch recovery interface | Stopwatch | 2026-11-27 (owner, 2b Mac acceptance) | **Verified** (owner, Mac Safari, 2026-11-27; closed) |
| R-017 | Full historical reporting periods | Progress over time | 2026-11-27 (owner, 2b Mac acceptance) | **Verified** (owner, Mac Safari, 2026-11-27; closed) |
| R-018 | Greater shading distinction between backgrounds, cards and elements | Visual design · all screens | 2026-11-27 (owner suggestion, 2b Mac acceptance) | Deferred (low priority; reassess after iPhone use) |

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

---

## R-009 — Simplify deleted-entry presentation
- **Source:** the owner's hands-on Mac acceptance of the final Checkpoint 2a build (`bf790b5`), 2026-11-27.
- **Observation (as reported):**
  - a deleted Notes & Observations entry leaves a visible placeholder saying the text was deleted;
  - the deletion also appears as a separate timeline entry;
  - the owner finds this unnecessarily repetitive, but not consequential enough to justify another revision cycle.
- **Classification:** human-discovered usability finding / design preference, **not** a defect. Current behavior follows the approved safeguards for removal and erasure.
- **Priority:** Low. **Target:** a future usability refinement, or Checkpoint 6.
- **Suggested future approach:**
  - hide deleted-entry placeholders from the ordinary Notes & Observations and history view;
  - keep the deletion metadata that's needed, the permanent-erasure safeguards (erased text must never be recoverable) and future sharing and merge integrity (markers and stable ids).
- **Status:** Deferred. **Do not implement until authorized.**

**Also deferred:** R-001 (onboarding name-field overflow) and R-003 (Library control density), both unchanged. R-002 and R-004 to R-008: accepted as part of Checkpoint 2a's Mac usability acceptance. Physical iPhone verification is still pending.

---

## Checkpoint 2b note (2026-11-27)
- **No new backlog items** were recorded during the 2b implementation; the owner has not yet reviewed 2b.
- **R-001, R-003 and R-009 remain deferred and were not changed.** The new Notes & Observations and session lists follow the accepted 2a presentation of removed entries, so R-009 would apply to them too if it is taken up later.

---

## R-010 to R-017 — Checkpoint 2b human acceptance refinements (owner's Mac Safari acceptance of `64202e2`)
- **Source:** the owner's initial human acceptance testing of Checkpoint 2b in Mac Safari (local build on port 4179), 2026-11-27. **64 of 65 applicable functional checks passed**; Phase G (legacy entries) was not applicable to the owner's data and is recorded as neither passed nor failed. The build had passed 360 unit and 201 end-to-end tests three times.
- **Authorization:** Checkpoint 2b-R (owner, 2026-11-27). Implemented in the commit “Checkpoint 2b-R: Human Acceptance Refinements”. Details: `docs/reviews/CHECKPOINT_2B_R_REFINEMENT_REPORT.md`.

| ID | Finding (as reported) | Correction | Classification |
|---|---|---|---|
| R-010 | The eight generic inspiration examples suited much older children than the owner's 4-month-old test profile | Six age ranges with 70 app-written ideas traced to verified milestones and activities; default from the milestone age; nothing before the due date; any range can be browsed | **Previously approved design (D8) that proved less useful in human testing**, not a programming defect |
| R-011 | Activity pages repeated “CDC” in the reference age, the safety text and the source | Neutral “Reference age: …”; agency name removed from badge, safety and tracker lines; one Source section keeps attribution, non-endorsement, original wording and links | Usability / tone (design refinement) |
| R-012 | “How do you want to track it?” and “How often?” misaligned with their options | Headings were fieldset legends drawn on the card's top edge; now floated inside the card padding (shared `choice-group`) | **Visual defect** |
| R-013 | Minutes and Seconds target fields misaligned | `.field + .field` stacking margin applied to side-by-side fields; shared `DurationFields` grid and a guard rule | **Visual defect** |
| R-014 | Hours/Minutes/Seconds in session correction misaligned | Same cause and fix as R-013 (also manual entry in the stopwatch and the “Record a session” sheet) | **Visual defect** |
| R-015 | Removed sessions stayed visible as “Removed” placeholders | “Delete session” with confirmation; content-free tombstone; no placeholder; slot freed; totals recalculated | Product-design preference (the 2b behaviour followed the approved reversal design) |
| R-016 | Recovery notice and its three options had inconsistent colours, spacing and alignment | Notice laid out as a column with full-width actions: Keep running (primary), Pause, Enter duration manually | **Visual defect** (a row-flex banner used for a stacked layout) |
| R-017 | 6 months and 1 year showed the same five months for a young child | Exactly 6 or 12 month positions; before birth “not applicable”, zero shown as 0, not tracked shown separately | **Previously approved, tested requirement (D7) that proved less useful in human testing** |

- **Status:** ~~Corrected (awaiting verification).~~ **Verified and closed** (2026-11-27): the owner's Mac Safari retest GR1–GR15 passed against `b45af43`. iPhone confirmation (GR16) is deferred to Checkpoint 6 consolidated acceptance.

---

## R-018 — Greater shading distinction between backgrounds, cards and elements
- **Source:** the owner's suggestion during Checkpoint 2b Mac acceptance (2026-11-27).
- **Observation:** more contrast in shading between the page background, cards and other interface elements might help. The current visual consistency is acceptable for now.
- **Classification:** design preference; **not a defect**. Low priority.
- **Plan:** reassess after physical iPhone use (different screen, brightness and viewing conditions).
- **Status:** Deferred. **Do not implement until authorized.**

---

## Checkpoint 2b-R note (2026-11-27)
- **Legacy-entry concern resolved:** an earlier suspected legacy-entry problem was resolved during human acceptance as a misunderstanding. No legacy-entry interface change was made or authorized.
- **R-001, R-003 and R-009 remain deferred** and were not changed. R-015 removes placeholders for deleted *exercise sessions* only; Notes & Observations placeholders (R-009) are unchanged.

---

## Checkpoint 2b-R closeout (2026-11-27)
- **R-010 to R-017:** closed as human-accepted (owner, Mac Safari, GR1–GR15 PASS).
- **Deferred:** R-001, R-003, R-009 and R-018 stay deferred — after submission, or reassessed during Checkpoint 6 iPhone use (R-018). R-001 (onboarding field overflow on a phone) may be observed again during Checkpoint 6 iPhone acceptance; any correction still needs authorization.
- **Earlier status lines** in this file that say “Corrected (awaiting verification)” or “iPhone pending” for R-002 and R-004 to R-008 are kept as recorded; their iPhone checks are part of Checkpoint 6.

---

## Checkpoint 3 note (2026-11-27)
- **R-014 test timing (not a product refinement):** the intermittent failure of the R-014 layout test found at initialization was a measurement taken during a sheet's entrance animation. Corrected in the test helper only (BUILD_LOG #53). No application change; R-014 itself stays closed as human-accepted.
- **R-001, R-003, R-009 and R-018 remain deferred** and were not changed.
- **For the owner's review at acceptance (not yet backlog items):** tapping outside the event form discards what was typed (same as the app's other sheets); the Home “Coming up” card and live “New event” action (Decision #136).

---

## R-019 to R-022 — Checkpoint 3 human acceptance refinements (owner's Mac Safari acceptance of `c5017da`)
*CAL1–CAL33 passed; CAL34 and CAL35 not human-tested; CAL36 deferred to Checkpoint 6. These four are presentation refinements; no data, schema, calculation or behavior change.*

| # | Finding (owner) | Classification | Correction | Status |
|---|---|---|---|---|
| **R-019** | The vaccine overlay repeated “CDC” and its own explanations: a “CDC SCHEDULE REFERENCE · NOT AN APPOINTMENT” label on every reference, “Next on the CDC vaccine schedule”, “a reference age, not an appointment”, an introductory paragraph, a sentence about what the app doesn't track, and “CDC's notes for health care providers say…” before individual notes. Excessive, institutional and cluttered. | Usability (wording); approved Checkpoint 3 wording that proved too heavy in human testing | Attribution and non-endorsement are stated once, visibly, under **Source**; the full record is in “Source details”. One visible statement about the provider's role. Individual notes use plain wording through a separate display layer (`parentNote`, `parentText`); the source record (`qualification`, `cdcText`) is unchanged and validation keeps every precise figure. Headings read “Recommended vaccinations: 4 months” and “Next recommended vaccinations: 6 months”. | **Accepted** (owner, Mac Safari, CR1–CR5, 2026-11-27) |
| **R-020** | Replace the circle and square markers | Design preference | Medical appointments: **a simple plus** (two bars of equal length and thickness crossing at their midpoints; four equal arms; thin; theme color; not the Red Cross emblem). Personal: a heart. Recommended vaccinations: the hollow diamond, unchanged. Used in the controls, the month grid, the lists, the event details and Home. *First attempt (`77d263b`): an upright cross with a short crossbar above the middle, from a misreading of “resembling a lowercase t”; the owner failed it at CR6 as religious-looking and clarified the shape.* | **Accepted.** Heart and diamond: owner, Mac Safari. Plus: delegated secondary review (CR6b), not an owner Safari test |
| **R-021** | Home's “Coming up” heading | Wording | Now “Upcoming Appointments”. Behavior unchanged (medical and personal events; the overlay choices apply). | **Accepted** (CR8) |
| **R-022** | In Settings → Calendar, the text and the Open Calendar link sat too close to the edges | Visual defect (implementation): the section's content was not wrapped in the shared `panel-pad` used by the other sections | Wrapped in `panel-pad`; a geometry test at 320, 390 and 1280 px compares it with “This Device”. Wording and link unchanged. | **Accepted** (CR9) |

**Recurring owner observation (third time: R-006 at 2a, R-011 at 2b-R, R-019 here):** repeated institutional source terminology detracts from the parent-facing experience. The standing rule is *parent-first interface, evidence-backed infrastructure*: say the source once, in one place per screen; keep qualifications in plain words; keep the traceable source record in the content files and documentation. New content should start from this rule rather than be corrected after acceptance.

**Unchanged:** R-001, R-003, R-009 and R-018 remain deferred.

---

## Checkpoint 3 closeout (2026-11-27)
- **R-019 to R-022: closed as accepted.** R-019, R-021, R-022, the heart and the diamond by the owner in Mac Safari; the corrected medical plus (R-020) through delegated secondary review by ChatGPT.
- **Deferred, unchanged:** R-001, R-003, R-009, R-018.

## R-023 — Journal photographs (deferred enhancement)
- **Source:** the owner, when approving the Checkpoint 4 Journal design (2026-11-27).
- **What:** attaching photographs to Journal entries.
- **Classification:** desirable future enhancement; **not** part of the submission version. Not a defect.
- **Why deferred:** deliberately left out by the owner. Photos would exist only in this device's storage, and the submission version has no backup or restoration.
- **Plan:** reconsider alongside or after backup and restoration (Checkpoint 5).
- **Status:** Deferred. **Do not implement until authorized.** Checkpoint 4 should not add storage or interface for Journal photos.

## Checkpoint 4 note (2026-11-27)
- **R-023 respected:** the Journal has no photographs, attachments or supporting storage for them. Status unchanged: Deferred.
- **No new refinement items** were opened by the implementation. Items for the owner's attention at acceptance are listed as decisions (#155–#168), notably the removal of Home's “Daily encouragement” placeholder (#168).
- **Deferred, unchanged:** R-001, R-003, R-009, R-018, R-023.
