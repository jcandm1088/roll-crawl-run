# Testing Checklist

Leave results blank until a test has actually been run, and record them exactly as observed.

## Automated (run with `npm test` and `npm run test:e2e`)
| Area | Test file | Last run | Result |
|---|---|---|---|
| Dates, leap years, month lengths | tests/unit/age.test.ts | | |
| Chronological age and formatting | tests/unit/age.test.ts | | |
| DOB validation (future, invalid, pre-1900) | tests/unit/age.test.ts | | |
| Corrected age: input limits, before due date, not applicable | tests/unit/age.test.ts | | |
| Three-month interval boundaries | tests/unit/age.test.ts | | |
| Theme contrast (5 themes, AA) | tests/unit/themes.test.ts | | |
| IndexedDB schema and uniqueness constraints | tests/unit/storage.test.ts | | |
| Atomic transaction rollback | tests/unit/storage.test.ts | | |
| Profile isolation, deletion, tombstone, backup purge | tests/unit/storage.test.ts | | |
| Settings and theme persistence; reset | tests/unit/storage.test.ts | | |
| Onboarding flow, not repeated after reload | tests/e2e/checkpoint1.spec.ts | | |
| Photo, corrected age before due date (UI) | tests/e2e/checkpoint1.spec.ts | | |
| Theme switching and persistence (UI) | tests/e2e/checkpoint1.spec.ts | | |
| Profiles: add, switch, edit, delete with confirmation | tests/e2e/checkpoint1.spec.ts | | |
| Placeholders clearly labeled | tests/e2e/checkpoint1.spec.ts | | |
| Offline after first load | tests/e2e/checkpoint1.spec.ts | | |
| Manifest validity, no external requests | tests/e2e/checkpoint1.spec.ts | | |
| Accessibility (axe, WCAG 2.1 AA rules) | tests/e2e/checkpoint1.spec.ts | | |
| No horizontal scroll at 320/390/768/1280; nav targets | tests/e2e/responsive.spec.ts | | |
| Atomic profile + photo save, simulated failures, no duplicates | tests/unit/profileSave.test.ts | | |
| Blush palette and contrast; Earth default | tests/unit/profileSave.test.ts, themes.test.ts | | |
| Deploy workflow is manual-only | tests/unit/profileSave.test.ts | | |
| Child selector inside the viewport (5 viewport sizes × 5 tabs), downward, aligned with the profile card | tests/e2e/review-regressions.spec.ts | | |
| Child selector with the original root-cause condition forced | tests/e2e/review-regressions.spec.ts | | |
| Child selector with 9 profiles: internal scrolling | tests/e2e/review-regressions.spec.ts | | |
| Child selector keyboard: focus, arrows, Tab trap, Escape | tests/e2e/review-regressions.spec.ts | | |
| Settings accordions: defaults, click, keyboard, several open | tests/e2e/review-regressions.spec.ts | | |
| Cancelled reset or deletion (each step) leaves data unchanged | tests/e2e/review-regressions.spec.ts | | |
| DELETE PROFILE plus final confirmation; backup option explained | tests/e2e/review-regressions.spec.ts | | |
| Dialog focus trap; theme and corrected-age arrow keys | tests/e2e/review-regressions.spec.ts | | |
| Inter headings, Growth order and wording, privacy spacing, 320px layout | tests/e2e/review-regressions.spec.ts | | |
| Data survives an app update (two real builds) | tests/e2e/update.spec.ts | | |
| Update from the actual previous release (ade3171) → per-child theme migration | tests/e2e/update.spec.ts | | |
| Schema v1→v2 migration, per-child theme storage, isolation, deletion | tests/unit/perChildTheme.test.ts | | |
| Logo assets: favicon, manifest icons, sizes, artwork matches approved concept | tests/unit/perChildTheme.test.ts, tests/e2e/final-refinement.spec.ts | | |
| Per-child themes: switching on every tab, Appearance scope, persistence, no flash, offline, deletion | tests/e2e/final-refinement.spec.ts | | |
| Consistent primary headings; Inter everywhere except the wordmark | tests/e2e/final-refinement.spec.ts | | |
| Focus trap skips tabindex=-1 radios; Shift+Tab cannot escape | tests/e2e/final-refinement.spec.ts | | |
| Selector in short and landscape windows; no fixed minimum height | tests/e2e/final-refinement.spec.ts | | |
| Precise age formatting: newborn, under 1 month, under 1 year, first birthday, 1–2 years, older, exact birthdays, leap days, month-ends, corrected, plurals, zero parts, date change, midnight scheduling | tests/unit/preciseAge.test.ts | | |
| Precise ages on Home across age groups; profile list; leap-day birthday; corrected; pre-due-date unchanged; midnight while open; resume after suspension | tests/e2e/precise-age.spec.ts | | |

## Manual: Checkpoint 1 (physical phone required where noted)
| # | Check | Device / browser | Date | Result | Notes |
|---|---|---|---|---|---|
| M1 | Onboarding is easy to follow without instructions | | | | |
| M2 | DOB picker: future dates can't be chosen; age preview is correct | | | | |
| M3 | Photo from camera and from library; appears on Home | Phone | | | |
| M4 | Corrected age by due date and by weeks at birth; labels are clear | | | | |
| M5 | Each of the 5 themes looks cohesive and readable | | | | |
| M6 | Add a second child, switch, and confirm the active child is obvious on every screen | | | | |
| M7 | Delete a profile: the confirmation is clear and the other child is untouched | | | | |
| M8 | Close the app completely, reopen, and the data is still there | Phone | iPhone (owner) | **Pass — owner reported “local data persistence passed” and later launches passed** | Force-quit specifically not stated |
| M9 | Restart the phone, reopen, and the data is still there | Phone | | | |
| M10 | Install to the home screen (iPhone Safari) and it opens standalone | iPhone | iPhone (owner) | **Pass — added to the Home Screen; later launches passed (owner reported)** | Standalone display not separately described |
| M11 | Install to the home screen (Android Chrome) and it opens standalone | Android | | | |
| M12 | Airplane mode after install: the app opens and profiles can be edited | Phone | iPhone (owner) | **Partial — offline launch and navigation passed (owner reported)** | Offline editing not reported |
| M13 | iPhone: is data entered in Safari visible in the installed app? (record what happens) | iPhone | | | |
| M14 | Settings → Storage: record the protection status shown | Each device | | | |
| M15 | Safe areas: nothing hidden under the notch or home indicator | Phone | | | |
| M16 | Touch targets are comfortable and text is readable at default size | Phone | | | |
| M17 | Larger system text size: layout still works | Phone | | | |
| M18 | Placeholders are clearly "not available yet" | | | | |

## Manual: Checkpoint 1 review (second hands-on review)
| # | Check | Device / browser | Date | Result | Notes |
|---|---|---|---|---|---|
| R1 | Child selector opens downward and stays fully visible on the Mac (the browser where the defect was seen) | Mac · Safari | (second review) | **Pass — reported by the owner** | Owner confirmed the previously off-screen selector now works |
| R2 | Child selector on each tab, with 2+ children | Mac / phone | | | |
| R3 | Settings: sections collapsed by default; tapping a header opens and closes it | | | | |
| R4 | Reset and Delete feel deliberately available but not prominent | | | | |
| R5 | Home: name and age read naturally; the corrected tag is subtle | | | | |
| R6 | Typography A vs B: which do you prefer? | Mac · Safari | (second review) | **Option B chosen by the owner** | |
| R7 | Blush now reads as baby pink | Mac · Safari | (second review) | **Approved by the owner** | |
| R8 | Logo concepts: preferred direction, if any | — | (second review) | **Concept 5 chosen by the owner** | |
| R9 | Privacy step spacing looks balanced | | | | |
| R10 | Keyboard: Tab through Settings, open the accordions, use arrow keys on themes | Mac | | | |

## Manual: Checkpoint 1 final (third hands-on review)
| # | Check | Device / browser | Date | Result | Notes |
|---|---|---|---|---|---|
| F1 | Two children with different themes: switching changes colors, with no flash of the other theme | Mac · Safari | | | |
| F2 | Settings → Appearance says which child it applies to; the other child is unaffected | | | | |
| F3 | Existing data from the previous build kept its theme after updating | Mac · Safari | | | |
| F4 | All tab headings look identical; Journal now matches | | | | |
| F5 | New logo on the welcome screen, top bar, and browser tab | | | | |
| F6 | Installed icon (where installed): new logo appears, or note if a reinstall is needed | Phone | | | |
| F7 | Child selector in a very short Safari window | Mac · Safari | | | |

## Manual: precise age (acceptance)
| # | Check | Device / browser | Date | Result | Notes |
|---|---|---|---|---|---|
| A1 | A child over 2 years shows years, months, and days (not “27 months”) | Mac · Safari | (acceptance) | **Pass — reported by the owner** | Defect originally observed by the owner |
| A2 | Leave the app open past midnight, or reopen it the next morning: the age has advanced by one day | | | | |

## Owner acceptance (reported by the owner, Mac · Safari)
All six final acceptance criteria passed: precise age for infants; precise years, months, and days for older children; per-child themes; consistent primary headings; the new logo; and overall approval for deployment. **Checkpoint 1 accepted.**

## Publication compliance (automated)
| Area | Test file |
|---|---|
| License files are exact copies of the installed packages; versions match; About lists them; no project license added | tests/unit/licenses.test.ts |
| About → Third-party licenses: links are relative, open online and offline, and show the license text, not the app | tests/e2e/final-refinement.spec.ts |

## Deployment acceptance (reported by the owner — physical iPhone)
| Check | Result |
|---|---|
| GitHub Pages workflow | Passed (green checkmark) |
| Live URL reachable | Passed |
| Added to the iPhone Home Screen | Passed |
| Later launches | Passed |
| Local data persistence | Passed |
| Offline launch and navigation | Passed |
| Initial load | A one-time “server not responding” message after about one minute, then loaded with no changes; **cause not established** |

Not reported, and therefore untested: M9, M11, M13–M17 and F6 (see `docs/reviews/DEPLOYMENT_ACCEPTANCE.md`).

## Checkpoint 2a — automated (run in headless Chromium; results in the delivery report)
| Area | Test file |
|---|---|
| Content integrity: 159 items, category and age counts, CDC categories kept, verbatim wording spot checks, sources and reuse basis, locked IDs, validation catches each error type | tests/unit/milestoneContent.test.ts |
| Reference-age → interval mapping; empty intervals; nearest-group links | tests/unit/milestoneContent.test.ts |
| Current-interval rule (start < A ≤ end); replaces the Checkpoint 1 rule test | tests/unit/age.test.ts |
| Applicability: newborn, exact reference ages, 3-month boundaries, month-end, leap day, fifth birthday, over five, corrected before/after due date | tests/unit/milestones.test.ts |
| Progress rules: formula, no partial credit, future excluded, hidden excluded, neutral states, interval vs cumulative, single counting | tests/unit/milestones.test.ts |
| Storage: status/reversal history, date corrections, invalid dates, observations (marker, erase), notes, hide/restore, history reconstruction, personal versions, child isolation, atomic rollback, profile deletion | tests/unit/milestones.test.ts |
| Build fails on altered locked content | manual check during implementation (recorded in the build log); the `validateContent` checks are unit-tested |
| Growth navigation and order; current interval; preview independence; Back to current age; boundary at 6 months; empty interval; cumulative view filters | tests/e2e/growth.spec.ts |
| Detail: status, reversal, date correction, history; future and pre-birth dates; observations remove/erase; hide/restore; all-hidden neutral; early recording | tests/e2e/growth.spec.ts |
| Personal versions; library search and filters; corrected-age states; over five; isolation and deletion; Settings preferences; attribution, safeguards, external links, no images | tests/e2e/growth.spec.ts |
| Offline tracking; accessibility (8 screens); 320px layout; five themes | tests/e2e/growth.spec.ts |
| Update from the deployed Checkpoint 1 (aa8c869) keeps data; tracking works after the update | tests/e2e/update.spec.ts |

## Checkpoint 2a — manual acceptance (owner; record actual results)
| # | Check | Device / browser | Date | Result | Notes |
|---|---|---|---|---|---|
| G1 | Growth shows Progress, Goals & Exercises (placeholder), What to Expect, Milestone Library in that order; Back returns to Growth | | | | *Superseded by the Growth UX refinement (new order) → H1* |
| G2 | "Record a milestone" on Home opens What to Expect at your child's current age range | | | | *Superseded: now opens the Library → H2* |
| G3 | Mark one milestone Emerging, then Achieved with a past date; Home and Progress update | | | | |
| G4 | Correct the achievement date; both dates appear in History | | | | |
| G5 | Change an Achieved milestone back to Emerging; History keeps both entries | | | | |
| G6 | Add an observation; status doesn't change. Remove it (it shows as removed in History); then Erase permanently (two steps) | | | | |
| G7 | Hide a milestone; it disappears from progress counts; restore it from Library → Hidden milestones with its status intact | | | | |
| G8 | Make a personal version; find it under Library → Your versions; edit it; the CDC original is unchanged | | | | |
| G9 | Preview a future age range; banner shown; Home progress unchanged; "Back to current age" works | | | | *Superseded by the refinement → H8* |
| G10 | Open an empty range (e.g. 18–21 months): no milestones, Earlier/Next links, "See everything up to now" | | | | *Superseded by the refinement → H8* |
| G11 | Search and the area, age, and status filters in the Library | | | | *Superseded by the refinement → H12* |
| G12 | A child with corrected age on and selected: ages labelled; before the due date nothing is counted | | | | |
| G13 | Settings → Milestone Viewing Preferences shows the basis and links to the profile setting | | | | |
| G14 | About these milestones: wording reads clearly; CDC attribution and non-endorsement visible; cdc.gov links open in the browser | | | | |
| G15 | Airplane mode (after first load): open milestones, change a status, view the Library | iPhone | | | |
| G16 | Two children: records don't mix; switching child switches progress and theme | | | | |
| G17 | Readability and touch comfort on iPhone; all five themes | iPhone | | | |
| G18 | Update from the deployed Checkpoint 1 on the iPhone (after the owner authorizes a deploy): existing profile, photo, and theme kept | iPhone | | | Deployment not authorized yet |
| G19 | Spot-check 10 milestones against cdc.gov wording | | | | |

## Checkpoint 2a Growth UX refinement — automated (headless Chromium; results in BUILD_LOG)
| Area | Test file |
|---|---|
| Guide content validation: traceability, coverage, quotes, empty ranges, sources, wording; each error type caught | tests/unit/guide.test.ts |
| guideFor: all 20 ranges; all 159 milestones exactly once, verbatim; empty-range neighbours; record-independence; no write imports in the guide screen | tests/unit/guide.test.ts |
| Library selection: views, sorting, area order, hidden counts, newborn / before due date / over five, filters, matches elsewhere | tests/unit/guide.test.ts |
| Progress by CDC age (applicable ages only; totals equal current progress) | tests/unit/guide.test.ts |
| Confirmation messages for every action type | tests/unit/guide.test.ts |
| Growth order, subtitles, live lines; Goals “Coming soon” | tests/e2e/growth-refinement.spec.ts; growth.spec.ts; review-regressions.spec.ts |
| No checkpoint terminology on any parent-facing screen (accordions opened) | tests/e2e/growth-refinement.spec.ts |
| Home shortcut → Library Up to now; old expect/all address redirect | growth-refinement.spec.ts; growth.spec.ts |
| Library sorting in all three views; catalog label with hidden counts; search matches in other views | growth-refinement.spec.ts |
| Library scroll, view, filter and search restoration; reset when switching child | growth-refinement.spec.ts |
| Zero applicable and all-applicable-hidden states (Library and Progress) | growth-refinement.spec.ts |
| Progress headline, “What updates Progress?”, area links, By CDC age | growth-refinement.spec.ts |
| Confirmations: new vs early achievement; date, note and observation edits add no credit; emerging; reversals; hide and restore | growth-refinement.spec.ts |
| Guide: 20 ranges, 159 once, nine empty mappings, verbatim wording, last range, disabled ends | growth-refinement.spec.ts |
| Guide: no recording controls, status, progress or record/Library links on any range | growth-refinement.spec.ts |
| Guide: no guide-initiated database writes (shell control; record stores byte-identical); progress and history unchanged | growth-refinement.spec.ts |
| Guide: identical content across children whatever is recorded, hidden or personalized (header excluded) | growth-refinement.spec.ts |
| Guide: exact boundary, corrected age before and after the due date, over five; five themes; offline | growth-refinement.spec.ts |
| Upgrade from the original Checkpoint 2a (`73d9f6f`): records, events, personal versions and profile byte-identical; progress equal | tests/e2e/update.spec.ts |
| Accessibility scans (guide, Library views) and 320px layouts | tests/e2e/growth.spec.ts |

## Checkpoint 2a — updated hands-on acceptance checklist (owner; after the refinement)
*Local* = testable with the local production build on the Mac (Safari). *iPhone* = needs the app on a physical iPhone, either deployed or reached over the local network. *Deploy* = needs an owner-authorized deployment.

| # | Check | Where | Date | Result | Notes |
|---|---|---|---|---|---|
| H1 | Growth order is Progress, Milestone Library, Goals & Exercises, What to Expect, and each subtitle makes the section's purpose clear | Local | | | |
| H2 | Home “Record a milestone” opens the Library on Up to now, and it's obvious how to record | Local | | | |
| H3 | Record an applicable milestone Achieved: the message says it now counts; Progress and Home rise by one | Local | | | |
| H4 | Record an upcoming milestone early: the message says when it would count; Progress is unchanged | Local | | | |
| H5 | Emerging is clearly not counted as achieved; a reversal message says whether it had counted | Local | | | |
| H6 | Correct a date and save a note: the messages don't suggest a new achievement; Progress is unchanged | Local | | | |
| H7 | Progress makes clear what updates it and that it isn't an assessment; tapping an area opens the matching Library list; By CDC age shows only ages that apply | Local | | | |
| H8 | What to Expect reads like a calm guide: no status, no tapping on milestones, no meters; Earlier/Next, an empty range (18–21 months) and Back to current age are clear | Local | | | |
| H9 | After browsing the guide, nothing in Progress, Home or any milestone has changed | Local | | | |
| H10 | Hide a milestone and make a personal version: the guide is unchanged | Local | | | |
| H11 | Corrected age: the guide and Library use the labelled age; before the due date the guide says so and is still readable | Local | | | |
| H12 | Library: search, filters, hidden milestones and your versions work; Back from a milestone keeps your place; switching child starts fresh | Local | | | |
| H13 | Spot-check the guide overviews against the CDC milestones listed beneath them | Local | | | |
| H14 | No “checkpoint” wording anywhere; “Coming soon” placeholders read naturally | Local | | | |
| H15 | All five themes: the guide, Library and Progress are readable | Local | | | |
| H16 | Readability and touch comfort of the guide and Library on iPhone | iPhone | | | |
| H17 | Airplane mode after first load: guide, Library and Progress work | iPhone | | | |
| H18 | Update from the deployed Checkpoint 1 keeps profile, photo and theme (G18) | Deploy | | | Deployment not authorized yet |

Still applicable from the original list: **G3–G8, G12–G17, G19** (G18 = H18).

## Checkpoint 2a human acceptance refinements — automated (headless Chromium; results in BUILD_LOG)
| Area | Test file |
|---|---|
| Display layer validates against the catalog; 41 adaptations; catalog verbatim (texts, lock, hashes, 41 gendered originals) | tests/unit/acceptanceRefinements.test.ts |
| No gendered word in any displayed milestone; unadapted items identical to CDC | acceptanceRefinements.test.ts |
| Meaning preserved: numbers, quoted speech, parentheticals, qualifiers, word counts; ages/categories/ids only from the catalog | acceptanceRefinements.test.ts |
| Validator rejects: changed qualifier, added word, non-pronoun replacement, gendered result, stale source, unknown id, duplicate, missing coverage, no pronoun, wrong catalog version | acceptanceRefinements.test.ts |
| Guide validation rejects gendered text; Library search uses displayed wording | acceptanceRefinements.test.ts |
| Notes & Observations storage: ordering, no status change, append-only edits, validation, chain erase (from original or edit), undated legacy note, identical-version erase, removal keeps history, child isolation, database version 2 | acceptanceRefinements.test.ts |
| Erasure isolation (added after secondary review): identical text survives note erasure in an unrelated observation, on another milestone, for another child, and in a personal entry; separate identical observations keep independent lineages; ids through the wrong child or milestone are rejected with nothing changed | acceptanceRefinements.test.ts |
| Legacy personal entries never change Progress | acceptanceRefinements.test.ts |
| Age-settings route round-trip | acceptanceRefinements.test.ts |
| Every visible milestone gender-neutral: guide (20 ranges), Library (159 rows), Home, Growth, Progress, About, Settings → About | tests/e2e/acceptance-refinements.spec.ts |
| Adapted wording disclosed with CDC's original; unadapted items have no notice; Home recent uses the displayed wording; search | acceptance-refinements.spec.ts |
| No personal-version controls on milestone pages; hidden legacy entries reachable, labelled and restorable | acceptance-refinements.spec.ts; growth.spec.ts |
| Superseded terms absent; CDC mentions limited; source note, non-endorsement, source links, safeguards and full attribution present | acceptance-refinements.spec.ts; growth.spec.ts |
| Notes & Observations: one text field, separate from status; dates and order; date resets; rejected date keeps text; edit; remove; erase all versions; undated note shown honestly, edited without inventing a date, removed and erased; per-child isolation; offline | acceptance-refinements.spec.ts; growth.spec.ts; growth-refinement.spec.ts |
| Manage age settings: wording with and without corrected age and before the due date; opens the selected child; heading focused and visible; Back/Cancel/Save return to Progress; Progress unchanged unless the setting changes | acceptance-refinements.spec.ts |
| Upgrade from `170cc99` with representative data (two children, statuses, date correction, hidden, early, two note versions, kept/removed/erased observations, personal version with status, note and observation): every store byte-identical, database version 2; entries, history, progress (overall and by area), personal entry, editing and isolation after the update | tests/e2e/update.spec.ts |
| Upgrade from the original 2a (`73d9f6f`): updated to check Notes & Observations and the personal-entries section | update.spec.ts |
| Accessibility (axe, WCAG 2.1 AA): detail with entries, editing, wording disclosure, Progress, Library personal entries, profile age settings | acceptance-refinements.spec.ts |
| 320px: no horizontal scrolling and no control past the edge on the refined screens; all five themes | acceptance-refinements.spec.ts |

**Tests updated for superseded behavior (each marked in the test):**
- **`growth-refinement.spec.ts`:**
  - “All 159” → “All (159)”;
  - catalog label;
  - “No CDC milestones apply yet”;
  - note/observation confirmations → entry add/edit;
  - guide overview label, verbatim pronoun check → gender-neutral wording, area-empty note, last-age line, range-includes line, pre-due note, over-five note, offline overview phrase;
  - the seed now uses Notes & Observations and seeds a legacy personal entry.
- **`growth.spec.ts`:**
  - empty-range wording and neighbour label;
  - observations test → Notes & Observations (adds edit and all-version erase);
  - personal-versions test → personal-entries test (no creation; legacy entry seeded);
  - “Reference age” → “Age” filter;
  - attribution moved from the Library card to the source note plus the About card.
- **`update.spec.ts`:** original-2a post-update checks.
- **`guide.test.ts`:** personal confirmation wording; two new actions added to the no-new-achievement check.

## Checkpoint 2a — hands-on acceptance checklist for the human acceptance refinements (owner)
*Local* = the local production build on the Mac (Safari). *iPhone* and *Deploy* as above. Record only actual results.

| # | Check | Where | Date | Result | Notes |
|---|---|---|---|---|---|
| HA1 | Milestones read naturally with “they/them/their”; nothing says “he” or “she” (Library All, several guide ranges, Home recent) | Local | | | |
| HA2 | On an adapted milestone (e.g. “Takes a few steps on their own”), “Wording adapted to be gender-neutral” shows CDC's original, and the meaning is the same | Local | | | |
| HA3 | Spot-check five adapted items against the table in `docs/reviews/CHECKPOINT_2A_ACCEPTANCE_REFINEMENTS.md` | Local | | | |
| HA4 | No milestone page offers to make a personal version; the Library has no “Your versions” chip | Local | | | |
| HA5 | (If you have personal versions from earlier testing) they appear under “Your personal entries” at the end of the Library, open, and aren't counted in Progress | Local | | | |
| HA6 | The language feels like a parenting app: “All milestones”, “By age”, “Age”; CDC is mentioned where it matters, not repeatedly | Local | | | |
| HA7 | Source, non-endorsement and “talk with your child's healthcare provider” are still easy to find (Progress, Library, milestone page, guide, About) | Local | | | |
| HA8 | One obvious Notes & Observations place: add an entry (date defaults to today), add an older one, see them newest first | Local | | | |
| HA9 | Edit an entry's text and date; remove one; erase permanently from the history; the status never changes | Local | | | |
| HA10 | An earlier note (from previous testing) shows “No observation date · saved …”, can be edited and removed, and no date is invented | Local | | | |
| HA11 | Status and achievement-date controls are clearly separate from Notes & Observations | Local | | | |
| HA12 | Progress, end of page: the age explanation reads well; Manage age settings opens the right child's age settings; Back or Save returns to Progress | Local | | | |
| HA13 | With a corrected-age child, the explanation mentions chronological or corrected age; with another child, it suggests turning on corrected age | Local | | | |
| HA14 | Progress figures are the same as before updating | Local | | | |
| HA15 | All five themes: Notes & Observations, Progress and Library read well | Local | | | |
| HA16 | iPhone: Notes & Observations and the age link are comfortable to use | iPhone | | | |
| HA17 | iPhone, airplane mode: add and edit an entry | iPhone | | | |

Still applicable: **H1–H5, H7–H9, H11, H13–H18** from the previous checklist. **H6** now reads “correct a date and add an entry”. In **H10**, hide a milestone and add an entry; personal versions can no longer be made. In **H12**, “your versions” → “Your personal entries”.

## Checkpoint 2a — human acceptance closeout (owner report, 2026-11-27)
- **Reported by the owner:**
  - installed dependencies, built and launched the final Checkpoint 2a application (`bf790b5`) locally on macOS, using Node.js 26 and Safari;
  - **accepts Checkpoint 2a for Mac usability.**
- **Finding:** one low-priority usability refinement, R-009 (simplify deleted-entry presentation), deferred. See REFINEMENT_BACKLOG.
- **Not recorded as passed:** the owner did not report results for individual checklist items. The HA1–HA17, H1–H18 and G rows above are left blank rather than marked passed.
- **Still pending:**
  - physical iPhone acceptance (HA16, HA17, H16, H17 and the related G-items);
  - offline editing on a device;
  - manual verification of an upgrade with legacy data;
  - the update from the deployed version (H18; needs an authorized deployment).

## Checkpoint 2b — human acceptance checklist (GE1–GE24)
Record only actual results. **Mac** = local production build in Safari (`npm ci && npm run build && npx vite preview`). **iPhone** = needs a deployment or a local-network test the owner sets up. Use fictional data. Before starting, keep the Checkpoint 2a data you already have (it exercises the upgrade).

| # | Check | Where | Result | Date | Notes |
|---|---|---|---|---|---|
| GE1 | Upgrade: open the 2b build on the browser that has your 2a data. Milestones, notes, Progress figures, themes and photos are unchanged | Mac | | | |
| GE2 | Growth still shows Progress, Milestone Library, Goals & Exercises, What to Expect in that order; Goals & Exercises now opens My Goals and Exercises | Mac | | | |
| GE3 | My Goals: create a goal with just a name; it appears under Working toward. No bars or percentages | Mac | | | |
| GE4 | Mark it accomplished with a past date; correct the date; reopen it; archive it; delete it (two steps) | Mac | | | |
| GE5 | Record an achievement without a goal; no start date appears anywhere; it shows under Accomplishments | Mac | | | |
| GE6 | Inspiration: start a goal from a milestone; the milestone's status in the Library doesn't change. The example ideas are labelled as app-written | Mac | | | |
| GE7 | Create a simple exercise (every day, 2 sessions), a stopwatch exercise and a repetitions exercise “from a doctor or specialist” | Mac | | | |
| GE8 | Today's routine: tap Done, Undo, Done again; the bar matches; “+” records an additional session without passing 100% | Mac | | | |
| GE9 | Stopwatch: Start, Pause, Resume, Reset; with no target; with a target it shows a gentle “Target reached” and keeps counting; Save records the time shown | Mac | | | |
| GE10 | Stopwatch running: switch to another app or tab for a minute, come back: the time is right. Close and reopen the app: the recovery notice offers Keep running / Pause / Enter duration manually | Mac, iPhone | | | |
| GE11 | Counter: −1 stops at 0; reload mid-count keeps the count; target prompts without saving | Mac | | | |
| GE12 | Exercise page: record a past session; correct a session's value and date; remove and restore it | Mac | | | |
| GE13 | Change a schedule after recording sessions today: today's sessions are kept; yesterday's history is unchanged; pause and resume work | Mac | | | |
| GE14 | 24 sessions a day: the routine shows a count, not 24 controls | Mac | | | |
| GE15 | Browse Exercises opens at the child's most recent CDC age, all areas collapsed; empty areas say so; All ages works | Mac | | | |
| GE16 | A child under 2 months (or before the due date) gets the calm intro instead of a default age | Mac | | | |
| GE17 | Tummy time activity: safety sentences highlighted; add it; change its instructions: it says “Adapted by you”, and CDC's original and safety are still shown, including in the stopwatch | Mac | | | |
| GE18 | Home shows Today's exercises only on days with scheduled sessions, with the same numbers as Exercises; View today's routine goes straight there | Mac | | | |
| GE19 | Progress: existing cards unchanged; Personal progress counts are right; Progress over time shows Milestones, Goals, Exercises, 6 months and 1 year, and the table | Mac | | | |
| GE20 | A legacy personal entry (from earlier testing): Move to My Goals keeps its notes; another: Delete permanently; Progress unchanged | Mac | | | |
| GE21 | Second child: nothing from the first child appears; each keeps its own theme | Mac | | | |
| GE22 | All five themes: the new pages read well | Mac | | | |
| GE23 | iPhone: one-handed use of Done, Start/Pause, +1 and Save is comfortable; nothing overflows | iPhone | | | |
| GE24 | iPhone, airplane mode after install: create a goal and an exercise, record a session, relaunch: everything is there | iPhone | | | |

Automated coverage for these items is listed in `docs/BUILD_LOG.md` (Checkpoint 2b entry). Physical-device behaviour (GE10 on iPhone, GE23, GE24) can only be confirmed by hand.

*Note (2b-R):* GE6 (example ideas), GE12 (“remove and restore”) and GE19 (periods) describe 2b behaviour that R-010, R-015 and R-017 changed; use GR1–GR16 below for the refined behaviour. The table above is kept unchanged as the 2b checklist; the owner tested 2b with their own phased plan (next section), so no GE row is marked individually.

## Checkpoint 2b — initial human acceptance (owner report, Mac Safari, 2026-11-27)
Reported by the owner for the local build of `64202e2` in Mac Safari (port 4179). Recorded as reported; Claude Code did not observe these tests.
- **Update:** the app detected the new version, offered a refresh, and preserved existing profiles, themes, milestone statuses, Notes & Observations and milestone progress.

| Phase | Area | Result |
|---|---|---|
| A | Database upgrade | 7/7 passed |
| B | Goals and accomplishments | 12/12 passed |
| C & D | Exercises and tracking | 16/16 passed |
| E | Scheduling and daily routine | 14/14 passed |
| F | Home and historical progress | 15/16 passed; the historical reporting period needed refinement (→ R-017) |
| G | Legacy personal entries | **Not applicable** (no legacy entries in the owner's test data); neither passed nor failed |
| H | Overall usability | Positive: navigation, visual consistency, ease of use and usefulness accepted, subject to physical iPhone review |

**Total: 64 of 65 applicable functional checks passed.** Further findings: R-010 to R-016 (usability and visual refinements) and R-018 (deferred suggestion). An earlier suspected legacy-entry concern was resolved as a misunderstanding. **Still outstanding:** physical iPhone acceptance, offline editing on a device, installed-app upgrade testing.

## Checkpoint 2b-R — automated (headless Chromium; results in BUILD_LOG)
- **Unit:** `goalIdeas.test.ts` (10: content validation and tampering detection, range boundaries, newborn, before the due date, older than five, corrected age, safety carried with ideas, no old examples); `sessionDeletion.test.ts` (8: removal from all totals, slot reuse, no note or values kept, lineage of moved sessions, no revival, merge-protection fields, profile isolation, version 3); `stopwatchCharts.test.ts` (period tests rewritten for R-017, +1).
- **End-to-end:** `acceptance-2b-r.spec.ts` (18): ideas for a 4-month-old, browsing other ranges, editable prefill with no deadline, before the due date, over five, newborn; attribution only in the Source section and preserved after adoption; heading and duration-field geometry at 320 and 390 px; correction and manual-entry fields; deletion with Cancel default, totals, Home, slot reuse and no stored note; recovery notice hierarchy and all three actions; 6/12-month periods with before-birth, zero and not-tracked months; 12-month chart at 320 and 390 px in five themes (overflow, label overlap, axe); axe on ideas, form and deletion dialog; offline ideas and deletion.
- **Changed intentionally:** the removal-and-restore e2e test (R-015), the inspiration disclaimer assertion (R-010), the chart-period unit tests (R-017); the “blocked upgrade” and “repetition counter” e2e tests were made deterministic (test defects, BUILD_LOG #47, #52).

## Checkpoint 2b-R — targeted human retest (owner; record actual results)
**Mac** = local production build in Safari. **iPhone** = needs a deployment or a local-network test the owner sets up.

| # | Check | Where | Result | Date | Notes |
|---|---|---|---|---|---|
| GR1 | Update from the 2b build: everything from your 2b testing (goals, exercises, sessions, history, milestones, themes) is unchanged | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR2 | 4-month-old: Looking for inspiration? shows “Birth to under 6 months” and ideas such as tummy time and cuddle time; nothing for much older children | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR3 | Choose another age range; the ideas change; your child's own range is still the default next time | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR4 | Use an idea: the goal name and area are filled in; you can edit them; no target date; nothing is saved until Save goal | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR5 | Ideas with safety notes (tummy time, rolling, mirror, sitting, walking) show them; the safety link opens the activity | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR6 | A child with corrected age chosen (or before the due date) gets the right range (or the neutral note) | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR7 | Activity page (e.g. Tummy time): “Recommended activity”, “Reference age: 2 months”, safety text complete; CDC named only in the Source section, which still has the link and non-endorsement | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR8 | Add exercise: “How do you want to track it?” and “How often?” line up with their options; Minutes/Seconds are the same size and aligned | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR9 | Correct a stopwatch session; record one manually; the stopwatch's “Enter duration manually”: Hours/Minutes/Seconds aligned | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR10 | Delete a session: the confirmation appears with Cancel; Cancel keeps it; Delete removes it with no placeholder; Today's routine, Home and Personal progress update; the slot can be done again | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR11 | Correct a session's date (move it), then delete it: no trace remains in the list; other sessions are unchanged | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR12 | Stopwatch: start, refresh, Continue: the recovery notice is tidy, Keep running is the main button; each of the three options works | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR13 | Progress over time for your 4-month-old: 6 months shows six months (June marked “–” before birth), 1 year shows twelve; the table matches | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR14 | Exercises view: months before you started tracking are dotted (“Not tracked yet”); a backdated session is counted in its month | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR15 | All five themes: the ideas page, the recovery notice and the 12-month chart read well | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `b45af43` |
| GR16 | iPhone: the 12-month chart, the duration fields and the recovery notice are comfortable and nothing overflows | iPhone | Deferred | — | Deferred to Checkpoint 6 consolidated final acceptance; not completed |


## Checkpoint 2b-R — human acceptance closeout (owner report, 2026-11-27)
**Human results (reported by the owner; Mac Safari; implementation commit `b45af4326085b822a2b932ef21c4ee96b3954f84`).** Recorded separately from automated results; Claude Code did not observe these tests.

| Group | Checks | Result |
|---|---|---|
| Update and existing-data preservation | GR1 | PASS |
| Goal inspiration, age ranges, editable goals, safety guidance, corrected-age behaviour | GR2–GR6 | PASS |
| Source attribution, headings, duration-field alignment | GR7–GR9 | PASS |
| Session deletion, moved-session deletion, stopwatch recovery | GR10–GR12 | PASS |
| Reporting periods, tracking distinctions, backdated sessions, all five themes | GR13–GR15 | PASS |

**15 of 15 applicable Mac checks passed.** Checkpoint 2b-R is accepted for continued development.

**Deferred to Checkpoint 6 (consolidated final acceptance), not completed:** GR16; all physical-iPhone checks from 2a (HA16, HA17, H16–H18 and related G-items), 2b (GE10 on iPhone, GE23, GE24) and 2b-R; installed-app upgrade testing; device-level offline editing.

**Automated results (Claude Code, headless Chromium; separate from the human results):** three consecutive complete cycles of 379 unit and 219 end-to-end tests each, no retries (BUILD_LOG, Checkpoint 2b-R). No new automated run was made for this documentation-only closeout.

## Checkpoint 3 — automated (headless Chromium; results in BUILD_LOG)
- **Unit:** `calendar.test.ts` (29: month grids, leap years and month ends, navigation limits, event validation, ordering and upcoming rules, overlay filtering, vaccine content validation and tamper detection, source meaning checked against independently typed professional-note ages, qualifications, undated conditional items, single-age and inclusive-range dates, time-zone independence, one grid mark per reference) and `eventsRepo.test.ts` (18: database version 3 and stores unchanged, create/view/edit/delete, outright deletion, idempotent retry, failed writes, unrecognised records untouched, child isolation, profile deletion, full reset, no effect on other records, overlay preferences).
- **End-to-end:** `calendar.spec.ts` (28): current month, today and selection; month and year navigation; midnight rollover; create, view, edit and delete; validation; simulated storage failures for save, edit and delete; upcoming order; three independent overlays and non-destructive hiding; marker shapes; vaccine single ages and ranges; birth-dose qualifications; provider-discussion items without dates and source disclosure; corrected age has no effect; month-end and leap-day birthdays; profile isolation and switching with a form open; profile deletion and full reset; reload and reopen; offline viewing and editing; Home and Settings; keyboard use; all five themes with axe; 320 and 390 px. `update.spec.ts` (+1): update from the accepted 2b-R build with every record byte-identical at version 3.
- **Changed intentionally:** the placeholder-tab test (Calendar is built), the Settings section list (“Calendar”), the default-settings unit test (`medical`), the Checkpoint 1 offline test's link selector (exact). **Corrected (test timing only):** the R-014 measurement helper and the 2a “guide writes nothing” progress reads.
- **Not covered by automation:** Safari, iPhone, Android; native date and time pickers; the on-screen keyboard with the bottom sheet; an installed-app update on a device.

## Checkpoint 3 — human acceptance checklist (owner; record actual results)
**Mac** = local production build of the Checkpoint 3 commit in Safari. Use fictional data. **iPhone** items are deferred to Checkpoint 6 unless you choose to test over the local network. *Results below were reported by the owner on 2026-11-27; Claude Code did not observe these tests.*

### A. Update and existing data
| # | Check | Where | Result | Date | Notes |
|---|---|---|---|---|---|
| CAL1 | Update from your 2b-R build: profiles, themes, milestones, goals, exercises, sessions and history are unchanged | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL2 | The Calendar tab opens (no “Preview only”); Journal and Resources are still placeholders | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |

### B. Month view
| # | Check | Where | Result | Date | Notes |
|---|---|---|---|---|---|
| CAL3 | The current month opens with today clearly marked and selected; the weekday columns are right for this month | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL4 | Previous and next move one month at a time, across December/January; “Go to today” returns | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL5 | Tapping a day selects it and shows that day below; today and the selected day are easy to tell apart | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |

### C. Events
| # | Check | Where | Result | Date | Notes |
|---|---|---|---|---|---|
| CAL6 | Add a medical appointment with only a title and date: it appears on its day, in Upcoming, and as a circle on the grid | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL7 | Add a personal event with a time, location and notes: it appears with a square; opening it shows every detail | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL8 | Add a therapy session as a medical appointment: the wording makes sense | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL9 | Edit an event (title, type, date, time, location, notes): the calendar follows it to the new date | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL10 | Delete an event: a confirmation appears; Cancel keeps it; Delete removes it everywhere | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL11 | Try to save with no title, then with no date: a clear message appears and what you typed stays | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL12 | Upcoming shows today and later in order, not past events; “Show all” appears with more than five | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL13 | Safari's date and time pickers work as you expect in the form | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |

### D. Show on the calendar
| # | Check | Where | Result | Date | Notes |
|---|---|---|---|---|---|
| CAL14 | The vaccine schedule is off at first; Medical appointments and Personal are on | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL15 | Hide Medical appointments: only those disappear; a note says events are hidden; showing them again brings them back unchanged | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL16 | Each of the three can be switched without affecting the others; the choice is still there after closing and reopening the app | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |

### E. Recommended vaccine schedule
| # | Check | Where | Result | Date | Notes |
|---|---|---|---|---|---|
| CAL17 | Turn it on for a 4-month-old (born July 20, 2026, viewed in November 2026): one diamond on November 20, not a month of labels | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL18 | Select that day: “CDC schedule reference · not an appointment”, “Reference age reached on this day: 4 months”, five vaccines; it does not look like an appointment | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL19 | “Next on the CDC vaccine schedule: age 6 months” shows January 20, 2027 and takes you there; hepatitis B dose 3 shows “6–18 months” with “January 20, 2027 through February 19, 2028” | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL20 | A day in the middle of a range (e.g. March 15, 2027) has no diamond, but shows the ranges that include it | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL21 | The date of birth (July 20, 2026) shows the hepatitis B birth dose with its birth-weight and maternal-status note | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL22 | “Ask your child's provider about” lists RSV antibody (two entries), rotavirus dose 3, Hib dose 3, influenza and COVID-19, with CDC's words and no dates | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL23 | The provider statement is clear: your child's healthcare provider determines the schedule; the app doesn't track vaccines | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL24 | “Source and how this is shown”: CDC, schedule title and July 2, 2025, retrieval date, non-endorsement, free at cdc.gov; the link opens CDC in a new window | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL25 | A child using corrected age shows the same vaccine dates as their date of birth gives | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL26 | Overall: the vaccine information reads as reference, is not alarming, and doesn't crowd the calendar | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |

### F. Profiles and data safety
| # | Check | Where | Result | Date | Notes |
|---|---|---|---|---|---|
| CAL27 | Two children: each calendar shows only that child's events | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL28 | Open Add event, type something, tap outside to close, switch child: nothing was saved for either child | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL29 | (Optional, fictional data only) Delete a test profile: its events are gone; the other child's remain | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |

### G. Related screens, themes and layout
| # | Check | Where | Result | Date | Notes |
|---|---|---|---|---|---|
| CAL30 | Home: “New event” opens the add form; “Coming up” lists the next events; do you want these Home changes kept? | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL31 | Settings → Calendar describes the Calendar as it is (no reminders, no phone-calendar export) | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL32 | All five themes: the grid, today, the selected day, the three markers and the vaccine panels read well | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL33 | A narrow window (about 320–390 px wide): nothing is cut off; days are easy to tap | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `c5017da` |
| CAL34 | Keyboard: arrow keys move between days; Add event, the form and Delete work without a mouse | Mac | N/A | 2026-11-27 | Not human-tested by the owner (automated coverage only) |
| CAL35 | With Wi-Fi off after loading once: the Calendar opens and events can be added, edited and deleted | Mac | N/A | 2026-11-27 | Not human-tested by the owner (automated coverage only) |
| CAL36 | iPhone: the month grid, the form with the on-screen keyboard, the date and time pickers and the vaccine panels are comfortable; nothing overflows | iPhone | Deferred | — | Checkpoint 6 consolidated final acceptance |

## Checkpoint 3 — human acceptance (owner report, Mac Safari, 2026-11-27)
**Human results (reported by the owner; implementation commit `c5017da6ea9525adc6681efdee2c59b3e7cb3099`).** Recorded separately from automated results; Claude Code did not observe these tests.

| Group | Checks | Result |
|---|---|---|
| Update and existing data; month view; events; overlays; vaccine schedule; profiles and data safety; Home, Settings, themes, narrow layout | CAL1–CAL33 | PASS |
| Keyboard operation | CAL34 | N/A — not human-tested |
| Offline editing | CAL35 | N/A — not human-tested |
| iPhone | CAL36 | Deferred to Checkpoint 6 |

**33 passed, 0 failed, 2 not applicable, 1 deferred.** The Calendar's functionality, existing-data preservation, profile isolation, event management, overlay behavior and general usability are accepted on Mac.

- **Approved by the owner:** the existing Home functionality (live “New event” action and the upcoming-events card, Decision #136); the editor's dismissal behavior (tapping outside discards what was typed); and the narrow Calendar layout for submission, subject to final physical-device review.
- **Keyboard operation and offline editing** have automated coverage only (headless Chromium); they were not confirmed by a person.
- **Formal closeout pending:** the presentation refinements R-019 to R-022 (below) and the owner's focused visual acceptance of them.

## Checkpoint 3-R — automated (headless Chromium; results in BUILD_LOG)
- **Reduced cadence, authorized by the owner for this presentation-only round:** targeted tests, then **one** complete clean cycle (not three).
- **Unit (+1):** parent-facing vaccine wording keeps every precise figure, drops source-prefacing language, leaves the source record untouched, and marks which provider-discussion lines are CDC's exact words; validation rejects violations.
- **End-to-end (+3, and updated wording):** the Settings Calendar section's inner spacing at 320, 390 and 1280 px (same padding as the other sections; text and link clear of the edges). Updated in `calendar.spec.ts`: marker shapes (cross, heart, diamond; theme colors; size and no overlap; used in the controls, grid, lists and details), the simplified vaccine wording, the single visible disclaimer, the source line and non-endorsement visible without expanding, no “CDC” outside the Source section, the “Upcoming Appointments” heading.
- **Unchanged and still passing:** every vaccine age, date-arithmetic, overlay, event, isolation, persistence and upgrade test.

## Checkpoint 3-R — focused visual acceptance (owner; record actual results)
**Mac** = local production build of the refinement commit in Safari. *Results below were reported by the owner on 2026-11-27; Claude Code did not observe these tests.*

| # | Check | Where | Result | Date | Notes |
|---|---|---|---|---|---|
| CR1 | Vaccine schedule on: selecting a marked day shows “Recommended vaccinations: 4 months” with no “CDC schedule reference · not an appointment” label and no “CDC's notes…” wording | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `77d263b` |
| CR2 | “Next recommended vaccinations: 6 months” with the date; tapping it still goes to that day | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `77d263b` |
| CR3 | One statement only: “Your child's healthcare provider determines their individual vaccination schedule. The dates shown are general recommendations, not scheduled appointments or confirmation of eligibility.” | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `77d263b` |
| CR4 | “Source” is visible without expanding: “Based on the CDC childhood immunization schedule, July 2, 2025. This app is not endorsed by CDC, HHS or the U.S. Government and has not been clinically reviewed.” “Source details” opens the full record and the CDC link | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `77d263b` |
| CR5 | “Ask your child's provider about” reads naturally and still gives each age and condition (RSV antibody, rotavirus dose 3, Hib dose 3, influenza, COVID-19) | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `77d263b` |
| CR6 | Symbols: an upright cross for medical appointments, a heart for personal events, the diamond for vaccinations; the same in the controls, the month grid, the lists and Home; clear in all five themes | Mac | FAIL (medical symbol shape only) | 2026-11-27 | Owner, Mac Safari, against `77d263b`. The owner intended a symmetrical plus, not an upright cross with a raised crossbar. Heart and diamond accepted. Corrected in the symbol-correction commit; **awaiting the owner's re-check (CR6b)** |
| CR7 | A narrow window: three symbols under one day stay readable and don't overlap or enlarge the calendar | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `77d263b` |
| CR8 | Home: the card is headed “Upcoming Appointments” and still lists medical and personal events | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `77d263b` |
| CR9 | Settings → Calendar: the text and the Open Calendar link are comfortably inset, like the other sections, in a wide and a narrow window | Mac | PASS | 2026-11-27 | Owner, Mac Safari, against `77d263b` |
| CR6b | Medical appointments now show a simple plus: four equal arms, crossing in the middle, the same thickness throughout, in the theme's color; the same in the control, the month grid, the lists, the event details and Home. Heart and diamond unchanged | Secondary review | PASS | 2026-11-27 | **Delegated review, not an owner Safari test.** ChatGPT (secondary reviewer, delegated by the owner) inspected the corrected archive of `c8aa0c5`, compared it with the preceding archive, reviewed the source differences and both the 320 px and 390 px screenshots. The owner did not re-test this item in Safari |

**Owner's visual acceptance of `77d263b` (reported 2026-11-27):** CR1–CR5 PASS · CR6 FAIL (medical cross shape only) · CR7–CR9 PASS. **8 passed, 1 failed.** All other refinements are accepted. The failed item was a misunderstanding of the requested shape, corrected in a follow-up commit under targeted testing only (authorized). Final acceptance of the corrected symbol (CR6b) is pending.

## Checkpoint 3 — formal acceptance closeout (2026-11-27)
**Checkpoint 3 and refinements R-019 to R-022 are formally accepted for the submission version**, subject to the final physical-device and publication checks at Checkpoint 6. Three kinds of evidence are recorded separately and must not be merged:

| Evidence | By whom | What | Result |
|---|---|---|---|
| Human acceptance | Owner, Mac Safari, against `c5017da` | CAL1–CAL33 | PASS |
| — | — | CAL34 (keyboard operation), CAL35 (offline editing) | N/A — not human-tested |
| — | — | CAL36 (iPhone) | Deferred to Checkpoint 6 |
| Human visual acceptance | Owner, Mac Safari, against `77d263b` | CR1–CR5, CR7–CR9 | PASS |
| — | — | CR6 | FAIL — medical symbol shape only |
| Delegated secondary review | ChatGPT, delegated by the owner; archive, source-difference and screenshot review of `c8aa0c5` | CR6b (corrected plus symbol) | PASS. Not an owner-performed Safari test |
| Automated | Claude Code, headless Chromium on Linux | `c5017da`: three consecutive complete cycles of 426 unit + 248 end-to-end. `77d263b`: one complete cycle of 427 + 251 (reduced cadence authorized). `c8aa0c5`: targeted only — type check, build, Calendar suite 31, one upgrade test, 427 unit (authorized; **no complete cycle on this commit**) | As recorded in BUILD_LOG |

**Carried to Checkpoint 6 (not completed):**
- keyboard operation and offline editing of the Calendar confirmed by a person (CAL34, CAL35);
- physical-iPhone acceptance (CAL36, with the earlier deferred iPhone, installed-app upgrade and device offline-editing checks from 2a, 2b and 2b-R);
- the vaccine schedule currency recheck (Decision #125);
- a complete regression cycle covering `c8aa0c5` (resumes at the start of Checkpoint 4).

## Checkpoint 4 — automated (headless Chromium; results in BUILD_LOG)
- **Unit (45 new):** `journal.test.ts` (24: validation of text, dates, titles, tags and types; the provider-question rules; tag parsing; feed order; search and each filter alone and combined; stored-record recognition; the Journal and Resources routes) and `journalRepo.test.ts` (21: the existing store at database version 3; create, edit and outright deletion for both types; long entries; idempotent retried saves; the answered status changing one field only; invalid input and simulated storage failures rolled back; unrecognised records untouched; child isolation, including a save that follows the editor's child; profile deletion; full reset; no effect on milestone, goal, calendar or settings records).
- **End-to-end (29 new):** `journal.spec.ts` (28): four-tab navigation and the removal of Resources; the empty state; the privacy notice; both entry types (create, view, edit, delete, optional title and tags, backdating); distinct types; feed order; a 9,000-character entry; validation; simulated failures of save, edit, answered change and deletion; the discard-changes question (Cancel, Escape, tap outside, new and edited entries); search and combined filters with no-results and clearing; saving while filtered; provider questions; child isolation including search, tags, tag suggestions and an editor open while the active child changes in another window; profile deletion and full reset; reload and reopen; offline create, edit, answer, filter and delete; Home's shortcut; source attribution without Resources; keyboard and focus; axe in all five themes; 320 and 390 px layouts. `update.spec.ts` (+1): upgrade from the accepted Checkpoint 3 build (`c8aa0c5`) with every record identical and **both stored photographs compared byte for byte**, then the Journal used on the upgraded data.
- **Changed intentionally (authorized requirement change: four tabs, no Resources, no placeholders):** the bottom-navigation count (5 → 4); the tab lists in the child-selector, per-child-theme and shared-heading tests; the Resources line in the Growth wording test; the screen list in the no-development-wording test; and the Checkpoint 1 placeholder-tab test, which now checks that no primary tab is a placeholder. No other existing assertion was changed.
- **Not covered by automation:** Safari, iPhone, Android; native date pickers; the on-screen keyboard with the bottom sheet and a long entry; dictation and autocorrect; an installed-app update on a device.

## Checkpoint 4 — human acceptance checklist (owner; record actual results)
**Mac** = local production build of the Checkpoint 4 commit in Safari (`npm ci`, `npm run build`, `npm run preview`). Use fictional data only. Record PASS, FAIL or N/A for each. **iPhone** items are deferred to Checkpoint 6 unless you choose to test over the local network. *Claude Code has not performed any of these.*

### A. Update and navigation
- **J1** With existing data from the Checkpoint 3 build (profiles, a photo, milestones, goals, exercises, calendar events), open the new build: everything is still there and looks the same.
- **J2** The bottom navigation shows exactly Home, Growth, Calendar, Journal, evenly spaced. There is no Resources tab anywhere. The settings button (top right) still opens Settings.
- **J3** Home: “Journal entry” opens the Journal with a new entry form. “Record a milestone” and “New event” still work. Confirm you are content that the “Daily encouragement” placeholder is gone (Decision #168).

### B. Writing entries
- **J4** Empty Journal: the heading, one “New Journal Entry” button, a friendly empty state and the privacy note read well.
- **J5** Save a Personal Reflection with only some text (no title, no tags). It appears dated “Today”.
- **J6** Save a Care Note with a title, two tags and an earlier date. It appears in the right place in the feed.
- **J7** Try to save with no text, and with tomorrow's date: a clear message appears and what you typed stays.
- **J8** Write a long entry (several paragraphs). Typing is comfortable; the feed shows the beginning; opening it shows all of it with line breaks kept.
- **J9** Open an entry, edit every field including the type, and save. The feed updates.
- **J10** Delete an entry: “Cancel — keep it” keeps it; “Delete entry” removes it.

### C. Two kinds of entry
- **J11** Personal Reflections and Care Notes are easy to tell apart at a glance (label, icon, edge) without feeling like two different apps.
- **J12** A Personal Reflection never shows provider-question controls, in the feed, when open, or in its editor.
- **J13** Check the feed in each of the five themes (Settings → Appearance): both types remain clear and readable.

### D. Finding entries
- **J14** Search finds words in titles and in text; capitals don't matter.
- **J15** All / Personal Reflections / Care Notes filter the feed.
- **J16** Under “Dates and tags”: a From/To range and one or more tags narrow the feed; combining them with search and type works as you expect.
- **J17** A search with no matches shows “No matching entries”; “Clear search and filters” brings everything back.

### E. Questions for the provider
- **J18** Tick “This includes a question for the provider” on a Care Note. The card shows “Question for the provider · Unanswered”.
- **J19** “Unanswered questions (n)” near the top is easy to find, shows the right number, and lists only unanswered questions.
- **J20** “Mark answered” changes the status; the note stays in the ordinary feed with its text unchanged. “Mark unanswered” reverses it.
- **J21** Edit an answered question to add what the provider said. It saves and stays answered.

### F. Unsaved changes and profiles
- **J22** Start an entry, type something, then press Cancel, press Escape, and click outside the form: each asks “Discard your changes?”. “Keep writing” returns to your text; “Discard changes” closes without saving. An untouched form closes without asking.
- **J23** With two children: each has their own Journal. Search and tags in one never show the other's entries. Switching children refreshes the feed.
- **J24** While an entry form is open, the child selector can't be used.
- **J25** Delete a test profile: its Journal entries are gone and the other child's remain.

### G. Persistence, offline, privacy and layout
- **J26** Reload the page and quit and reopen Safari: entries, tags and answered statuses are unchanged.
- **J27** Turn Wi-Fi off (after the app has loaded once): open the Journal, create, edit and delete an entry, switch tabs. Turn Wi-Fi on again.
- **J28** The privacy note at the foot of the Journal is clear, appears once, and promises nothing the app doesn't do. Settings → Privacy agrees with it.
- **J29** Narrow the Safari window to phone width (about 320–390 px): the feed, filters, an open entry and the editor fit without sideways scrolling.
- **J30** Keyboard only (Tab, Shift+Tab, Enter, Space, Escape): create an entry, open it, mark it answered, delete it. Focus is always visible and stays inside open forms.
- **J31** Source information is still easy to find without Resources: Settings → About, Growth → Milestone Library → About these milestones, and the Calendar's Source section.
- **J32 (iPhone, deferred to Checkpoint 6)** Installed app: writing a long entry with the on-screen keyboard, dictation, the date picker, offline use, and the four-tab bar above the home indicator.

## Checkpoint 4 — human acceptance (owner report, Mac Safari, 2026-11-28, against `7e9eb87`)
*Reported by the owner. Claude Code did not observe these tests.*

| Result | Items |
|---|---|
| **PASS (23)** | J1, J2, J3, J4, J6, J8, J9, J10, J12, J13, J14, J15, J16, J17, J18, J19, J20, J21, J22, J23, J24, J25, J28 |
| **FAIL (1)** | **J11** — insufficient visual distinction between Personal Reflections and Care Notes (→ R-025) |
| **N/A — not human-tested (7)** | J5, J7, J26, J27, J29, J30, J31. Carried to final acceptance. **Not passed.** |
| **Deferred** | J32 (iPhone) → Checkpoint 6 |

**Owner's additional observations:**
- Leaving out the date prevents saving. The owner approves this; no change requested.
- The “Unanswered questions” toggle could stay on with “Personal Reflections” selected, giving an empty feed (→ R-024).
- **Recorded separately from the isolation checks (J23–J25 passed):** on the Journal, switching children through the top selector unexpectedly opened a New Journal Entry editor, intermittently. Growth and Calendar did not show it in ordinary switching. It stopped after one profile was deleted and another created (→ R-026).

## Checkpoint 4-R — automated (headless Chromium; results in BUILD_LOG)
- **Unit (+3, 475):** the four-view inclusion table and the answered/unanswered transitions; a filter holds exactly one view; search, dates and tags with each view. The existing filter tests were re-expressed for the single view field (same expectations).
- **End-to-end (+6, 286), all in `journal.spec.ts`:** R-024 single selection, inclusion table, transitions, count and unchanged stored fields; R-024 search, dates and tags with all four views and kept across view changes; R-025 mixed feed; R-026 after the Home shortcut with save and with cancel (child switches both ways, repeated shortcut use, unsaved-change protection, tab, reload, Back and Forward, entry ownership); R-026 the tab's own button. The five theme tests now also check the Care Note and Personal Reflection card backgrounds, their lightness ratio, the question strip and text color in each theme, with axe.
- **Existing Journal tests changed because the authorized behavior changed:** where a test turned the unanswered filter off by pressing it again, it now chooses another view (provider-question and keyboard tests); the combined-filter test notes that the unanswered view replaces the Care Notes view. Expectations about entries shown are otherwise unchanged. The isolation test additionally checks that the selected view does not carry to another child.
- **The R-026 tests were run against the old route handling and failed there** (2 of 3; the third covers the unaffected tab path), then passed with the correction.

## Checkpoint 4-R — owner reacceptance checklist (three refinements only; record actual results)
**Mac** = local production build of the Checkpoint 4-R commit in Safari. Fictional data. *Claude Code has not performed any of these.*

### R-024 — primary views
- **JR1** The four views (All, Personal Reflections, Care Notes, Unanswered questions (n)) behave as one choice: selecting one deselects the other; one is always selected.
- **JR2** Select Unanswered questions, then Personal Reflections: reflections appear; no empty, contradictory result.
- **JR3** Care Notes shows every Care Note together: ordinary notes, unanswered questions and answered questions.
- **JR4** In Unanswered questions, “Mark answered” removes the note from that view; it is still under Care Notes and All, unchanged. “Mark unanswered” brings it back. The number in the chip stays right.
- **JR5** Type a search, set a date and pick a tag; switch between all four views: the search, date and tag stay as set and keep narrowing the feed. “Clear search and filters” resets everything.

### R-025 — telling the two types apart
- **JR6** In a mixed feed, Care Notes and Personal Reflections are obvious at a glance without reading the labels (this was J11).
- **JR7** Check all five themes (Earth, Sky, Blush, Lavender, Sage): the distinction is clear, text is comfortable to read, and it still feels like a personal notebook.
- **JR8** On a Care Note with a question, the “Question for the provider” strip stands apart from the note's text and its button is clear.

### R-026 — no unexpected editor
- **JR9** With two children: Home → “Journal entry”, save the entry, stay on the Journal, switch to the other child and back. No editor opens.
- **JR10** Repeat JR9 but cancel the entry instead of saving.
- **JR11** Home → “Journal entry” still opens a new entry every time; the Journal tab and “New Journal Entry” work as before; closing a form with unsaved text still asks.

### Optional
- **JR12** Any of the seven untested items (J5, J7, J26, J27, J29, J30, J31) you choose to check now rather than at final acceptance.
- **JR13 (decision, not a test)** Whether to authorize the equivalent Calendar correction (R-027).

## Checkpoint 4-R2 — automated (headless Chromium; results in BUILD_LOG)
- **End-to-end (+2, 288):** `calendar.spec.ts` R-027, save and cancel: after Home's “New event”, child switches in both directions never reopen the form; the shortcut opens the form again for each child; the Calendar tab, its own Add event button, a reload, Back and Forward; which child each saved event belongs to; each child's Upcoming list and Home's Upcoming Appointments.
- **Both tests were run against the original handling first and failed there** (the form reopened on the first switch), then passed with the correction.
- **Unit:** unchanged, 475.
- **Run for this step:** type check; build with content validation; full unit suite; targeted end-to-end files (Calendar, Journal, Checkpoint 1, review regressions, final refinement, responsive, update). **Not run:** the Growth and goals/exercises files (no shared code changed).

## Checkpoint 4-R2 — Calendar reacceptance supplement (owner; add to JR1–JR13 for the combined review)
*Two child profiles; Mac Safari; fictional data. Claude Code has not performed these.*
- **CS1 (save)** Home → “New event”: the Add event form opens. Save an event. Staying on the Calendar, switch to the other child and back. No form opens, and the event appears only for the child it was saved for.
- **CS2 (cancel)** Home → “New event”, then Cancel. Switch children both ways. No form opens.
- **CS3 (repeat)** Use Home → “New event” again, for each child: the form opens every time.
- **CS4 (ordinary use)** The Calendar tab, its own “Add event” button, editing and deleting an event, the three “Show on the calendar” choices, the vaccine references and Home's Upcoming Appointments all behave as before.
- **CS5 (decision, not a test)** Whether to authorize the R-028 Journal correction before final acceptance.

## Checkpoint 4-R3 — automated (headless Chromium; results in BUILD_LOG)
- **End-to-end (+4, 292), `journal.spec.ts` R-028:** the test page holds every read of the journal list until the test releases it (no timers; nothing added to the app). With the form opened from Home's shortcut or from the Journal tab, over an empty or a populated journal: every field is filled while “Loading…” shows; the load is released; the test then checks the same dialog element is still there, every value (type, date, title, text, tags, question flag, answered status), focus in the text area, continued typing, the discard-changes question, saving, the stored record, and that earlier entries are untouched.
- **Against the original structure:** the two empty-journal tests fail (the dialog had been rebuilt); the two populated-journal tests pass. With the correction all four pass.
- **The existing “keyboard and focus” test is unchanged.**

## Checkpoint 4-R3 — Journal reacceptance supplement (owner; add to JR1–JR13 and CS1–CS4)
*Mac Safari; fictional data. Claude Code has not performed these. On a fast Mac the loading moment is too brief to see, so these confirm ordinary behavior rather than reproduce the defect; the defect itself is covered by the automated tests.*
- **JS1** For a child with no journal entries yet: Home → “Journal entry”, start typing immediately. What you type stays, the cursor stays in the field, and saving works.
- **JS2** The same from the Journal tab → “New Journal Entry”, and once more for a child who already has entries.
