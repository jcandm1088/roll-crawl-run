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
