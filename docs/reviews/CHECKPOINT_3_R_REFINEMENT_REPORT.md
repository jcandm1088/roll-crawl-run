# Checkpoint 3-R — Human Acceptance Refinements R-019 to R-022: refinement report

*Drafted by Claude Code, 2026-11-27. Automated results are from headless Chromium on Linux only. The human results in section 1 were reported by the owner; Claude Code did not observe them. Nothing here was tested in Safari or on a physical device by Claude Code.*

**Starting point:** `c5017da6ea9525adc6681efdee2c59b3e7cb3099` (Checkpoint 3: Simplified Calendar). **Authorization:** owner, 2026-11-27 (Decisions #138–#144). **Scope:** presentation only.

## 1. Human acceptance of Checkpoint 3 (owner, Mac Safari, against `c5017da`)
| Checks | Result |
|---|---|
| CAL1–CAL33 | PASS |
| CAL34 (keyboard operation) | N/A — not human-tested |
| CAL35 (offline editing) | N/A — not human-tested |
| CAL36 (iPhone) | Deferred to Checkpoint 6 |

33 passed, 0 failed, 2 N/A, 1 deferred. The owner approved the Home changes, the editor's dismissal behavior and the narrow layout for submission, subject to physical-device review. Formal closeout awaits the owner's visual acceptance of the four refinements below.

## 2. What changed

### R-019 — Parent-friendly vaccine language
| Before | After |
|---|---|
| “CDC SCHEDULE REFERENCE · NOT AN APPOINTMENT” above every reference | Removed |
| “Reference age reached on this day: 4 months” | “Recommended vaccinations: 4 months” (with the diamond) |
| “Next on the CDC vaccine schedule: age 6 months” / “January 20, 2027 · a reference age, not an appointment” | “Next recommended vaccinations: 6 months” / “January 20, 2027”. Tapping it still goes to that day |
| Introductory paragraph “◇ marks ages on CDC's recommended schedule for all children…” | Removed |
| “Your child's healthcare provider determines your child's vaccination schedule. This app doesn't track vaccines given, check eligibility or work out catch-up timing.” | One statement, in the owner's wording: “Your child's healthcare provider determines their individual vaccination schedule. The dates shown are general recommendations, not scheduled appointments or confirmation of eligibility.” |
| “CDC's notes for health care providers say a fourth dose is permitted…” and similar | “A fourth dose is permitted when a combination vaccine is used after the birth dose.” (all seven notes; table below) |
| “Ask your child's provider about”: “CDC: “Depends on mother's RSV vaccine status”” | “Depends on mother's RSV vaccine status” (no “CDC:” prefix) |
| Collapsed “Source and how this is shown”, with the non-endorsement inside | Heading **Source**, always visible: “Based on the CDC childhood immunization schedule, July 2, 2025. This app is not endorsed by CDC, HHS or the U.S. Government and has not been clinically reviewed.” Below it, a collapsed **Source details** |

**Source details still contains:** the schedule's full title and date; the cross-checked pages; the retrieval date; the link to cdc.gov (new window); free availability; that CDC's site identified this as its current schedule when checked and that the copy does not update itself; which wording is CDC's and which is the app's; how dates are worked out from the date of birth.

**Parent-facing notes (app paraphrase; the source record is unchanged beside each):**

| Reference | Shown now |
|---|---|
| Hepatitis B, dose 1 | Timing can be different for babies who weigh less than 2,000 grams at birth, and care is different when the mother has, or may have, hepatitis B. The birth hospital and your child's provider decide this. |
| Hepatitis B, dose 3 | A fourth dose is permitted when a combination vaccine is used after the birth dose. |
| Rotavirus, dose 1 | This series should not be started at or after age 15 weeks, 0 days. |
| Rotavirus, dose 2 | The series has two or three doses, depending on the vaccine used. The maximum age for the final dose is 8 months, 0 days. |
| Hib, dose 3 or 4 | This is the third or fourth dose, depending on the vaccine used. |
| Polio, dose 4 | The final dose is given on or after age 4 years and at least 6 months after the previous dose. |
| Hepatitis A | 2 doses separated by 6 months. The app does not work out a date for either dose. |

**Provider-discussion items:** four show CDC's cell wording exactly (RSV antibody ×2, influenza, COVID-19). Two are the app's plain statement, because CDC's cell says only “Dose 3” with a “some children” key: “Some children get a third dose at this age. It depends on the vaccine used.” (rotavirus) and “Some children get a dose at this age. It depends on the vaccine used.” (Hib). The RSV note now reads “Timing also depends on the RSV season and the month your child was born.” The influenza note “The app does not place a yearly date on the calendar” was dropped as repetition; the list's opening line already says these aren't placed on a date. CDC's “Talk to your child's health care provider for more guidance if:” list is unchanged, word for word, including “Visit CDC Travelers' Health for more information.” (the name of a resource; the one place “CDC” appears outside Source).

**How it was done without rewriting the source record:** `vaccines.cdc-2025.json` gained display fields only (`parentNote`; `parentText`, `parentTextVerbatim`, `parentNote`), and its version label became `.app-2`. A script check confirmed that, with those fields removed, the file's data equals the Checkpoint 3 version exactly. `validateVaccines` now also fails the build if a parent-facing note names CDC or uses “health care providers say”, drops an exact quantity (grams, weeks, days, months, years), or if text marked as CDC's wording differs from it.

**Not changed:** the 26 references, their ages and ranges, the six conditional items and their undated treatment, date arithmetic, use of the chronological date of birth, and the rule that the app never says due, overdue, up to date or eligible.

### R-020 — Calendar symbols
| Group | Symbol | Color |
|---|---|---|
| Medical appointments | **A simple plus** with four equal arms (corrected; see section 6). *First attempt: an upright cross with a raised crossbar* | `--primary` (the theme's own color) |
| Personal | Heart | `--text` |
| Recommended vaccine schedule | Hollow diamond (unchanged) | `--text` outline |

Used in the overlay controls, the month grid, the selected-day and Upcoming lists, the event details and Home. The plus is not the Red Cross emblem: its bars are thin and it takes the theme color. Sizes: 10 px in the grid (9 px below 360 px wide), 12 px elsewhere; day cells did not grow. Three symbols under one day fit inside the day without overlap: checked by an automated test at 390 px, and measured once at 320 px (9 px each, side by side, within the 36.6 px cell; screenshot 10). The cross was drawn as the owner specified; with its short, high crossbar it can also read as a religious cross at small sizes, which the owner may want to judge in the visual check. Accessible names still carry the meaning in words; a marked day now says “recommended vaccinations”.

### R-021 — Home heading
“Coming up” → “Upcoming Appointments”. The card's behavior is unchanged: the next three parent-entered events, medical and personal, following the overlay choices.

### R-022 — Settings spacing
The Calendar section's content was not inside the shared `panel-pad` wrapper the other Settings sections use, so it sat against the card's edges. It now uses that wrapper. Wording and the Open Calendar link are unchanged.

## 3. Files changed
`src/content/vaccines.cdc-2025.json` (display fields), `src/domain/vaccineSchedule.ts` (types, validation), `src/ui/screens/calendar/Calendar.tsx` (wording, symbols, Source block), `src/ui/styles/base.css` (symbols, Source block), `src/ui/screens/home/Home.tsx` (heading), `src/ui/screens/settings/Settings.tsx` (wrapper), tests, the screenshot script and documentation. No change to the database, repositories, routing or any Growth code.

## 4. Tests
- **Updated (wording and marker expectations only; substantive assertions kept):** `calendar.spec.ts`.
- **Added:** one unit test (parent-facing wording rules and tamper detection) and three end-to-end tests (Settings spacing at 320, 390 and 1280 px). New assertions: the exact disclaimer; the source line and non-endorsement visible without expanding; “Source details” collapsed by default; no “CDC” outside the Source block; cross, heart and diamond geometry, colors, sizes and consistent use; the Home heading.
- **Unchanged and passing:** every vaccine age, date, overlay, event, isolation, persistence, offline and upgrade test.
- **Two mistakes in the updated tests were corrected before the full run:** the order of two all-day events on one day, and CDC's verbatim “Visit CDC Travelers' Health” sentence tripping a no-“CDC” check. Neither was an application defect.
- **Results:** `docs/BUILD_LOG.md`. Reduced cadence, as authorized: targeted tests, then one complete clean cycle.

## 5. For the owner's visual acceptance
Checklist CR1–CR9 in `docs/TESTING_CHECKLIST.md`. Screenshots in `docs/screenshots/checkpoint-3-r/`.

Points worth a look:
1. **Reworded notes are paraphrases.** The exact figures are kept and machine-checked, but the wording is the app's. “Source details” says so.
2. **“Recommended vaccinations: birth”** is the heading on the date of birth.
3. **The selected-day panel no longer says “not an appointment”.** The dashed outline, the diamond and the single statement in the vaccine card carry that distinction.
4. **Keyboard operation and offline editing** remain unconfirmed by a person (CAL34, CAL35).
5. **Schedule currency recheck at Checkpoint 6** is still required.

## 6. Visual acceptance and the medical symbol correction (2026-11-27)
**Owner's visual acceptance of `77d263b6243edd99ea7a8e0d2ce159fab303010f` (reported; Mac Safari):** CR1–CR5 PASS · CR6 FAIL (medical cross shape only) · CR7–CR9 PASS. R-019, R-021, R-022, the heart and the diamond are accepted.

**What was wrong:** Claude Code read “a simple upright cross, resembling a lowercase t without curves” as an upright cross with a short crossbar above the middle, and noted in its report that it could read as a religious cross. The owner intended a symmetrical plus.

**Correction (R-020, medical symbol only):**

| Requirement | Implementation |
|---|---|
| Horizontal and vertical lines of equal length | Two bars, each 10 units long in a 12-unit square box |
| Intersection at the exact midpoint of both | Both bars are centred on the middle of the box (6, 6) |
| Four equal arms | Each arm is 4 units |
| Uniform thickness | Both bars are 2 units thick |
| Theme-compatible color | `--primary`, as before |
| Not the Red Cross emblem | Thin bars (one sixth of the width) in the theme's color, never a fixed red on white |
| Used consistently | One shared component draws it in the overlay control, the month grid, the selected-day and Upcoming lists, the event details and Home |

Heart, diamond, sizes (10 px in the grid, 9 px below 360 px wide, 12 px elsewhere), spacing and accessible names are unchanged. The only application change is the two bars' coordinates in `Calendar.tsx` (and two comments).

**Tests (targeted only, as authorized):** the marker test now checks equal bar length, uniform thickness, both bars centred, equal arms, thin bars and a square rendered size; the five theme tests check the plus takes each theme's primary color; the 320 and 390 px tests check it is drawn square, readable and inside its day beside the heart without overlap. Results in `docs/BUILD_LOG.md`.

**Pending:** the owner's re-check of the corrected symbol (CR6b).
