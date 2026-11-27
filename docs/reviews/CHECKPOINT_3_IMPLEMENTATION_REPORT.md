# Checkpoint 3 — Simplified Calendar: implementation and technical review report

*Drafted by Claude Code, 2026-11-27. Automated results are from headless Chromium on Linux only. Nothing here was tested in Safari, on a Mac, on an iPhone or on Android. No clinical review took place and CDC has not reviewed or endorsed the app.*

**Starting point:** `3da76c71f1c71a7818594bacc33167f67d638f81` (accepted Checkpoint 2b-R closeout), recovered exactly on `claude/great-dijkstra-wwi9g1`. **Authorization:** owner, 2026-11-27 (decisions on seven preparation questions; Decisions #125–#137).

## 1. What was built

| Requirement | Where | Result |
|---|---|---|
| Monthly grid, previous/next month, today and selected-day indicators | `src/ui/screens/calendar/Calendar.tsx`, `src/domain/calendar.ts` | Built. Sunday-first grid; today has an outline and an underlined, heavier number; the selected day is filled. “Go to today” appears when you are elsewhere. |
| Selected-day events and reference information | same | Built. Events for the day, a note when hidden groups have events that day, and (vaccine overlay on) the references for that day. |
| Upcoming events | same | Built. Today and later, soonest first; five shown, “Show all N” for more. |
| Accessible add-event action | same | Built. One “Add event” button; the form opens on the selected day. Home's “New event” opens the same form. |
| Exactly three independent overlays | `Settings.layers` (`medical`, `personal`, `vaccines`) | Built. Vaccine schedule off by default. Hiding only filters the view. Stored per device. |
| Parent-entered events: create, view, edit, delete; title, date, optional time, location, notes | `src/data/repositories/eventsRepo.ts` | Built. Medical appointments (including therapy sessions entered by hand) and Personal. Delete asks first and removes the record outright. |
| Markers that don't rely on color | `base.css` (`.cal-mark-*`) | Circle (medical), square (personal), hollow diamond (vaccine reference); each also has text in the day's accessible name and in every list. |
| Vaccine reference, unobtrusive, distinct from appointments | `src/domain/vaccineSchedule.ts`, `src/content/vaccines.cdc-2025.json` | Built (section 3). One marked day per reference; ranges are never repeated across their days. |
| All five themes, shared `PageHeader`, tokens, forms, focus behavior | — | Built; axe checks pass in all five themes. |
| Settings wording | `Settings.tsx` | “Calendar & Reminders” (three “coming soon” rows) is now “Calendar”, describing what exists. |

**Also changed, to avoid stale placeholders (please confirm at acceptance):** Home's “New event” quick action is now live, and Home's “Coming up” placeholder became a small live card listing the next three parent-entered events with an “Open Calendar” link. No vaccine information appears on Home.

**Not built (out of scope, unchanged):** goals/exercises integration, therapy or well-child scheduling, recurrence, reminders, notifications, vaccine administration tracking, family aggregation, ICS export, backup/restore, sharing, synchronization, Journal, Resources removal.

## 2. Data and architecture

- **Database version 3 is unchanged.** Events use the existing `events` store and its `byChild` index (created at version 1, unused until now). No store, index or migration was added. An upgrade from the accepted 2b-R build leaves every existing record byte-identical (automated test with two real builds).
- **Record:** `CalendarEvent` = the common record envelope plus `recordType: 'calendarEvent'`, `childId`, `kind` (`medical` | `personal`), `title`, `date` (`YYYY-MM-DD`), `time` (`HH:MM` or null), `location`, `notes`. Validated on every write (`validateEventInput`) and on every read (`isCalendarEvent`; anything else in the store is ignored and never altered).
- **Atomic writes:** each create, edit and delete is one transaction over `events` and `children`. It checks that the child still exists, and that an edited or deleted event belongs to the child the editor was opened for.
- **Deletion** removes the record outright (Decision #130). No title, note, location or tombstone remains.
- **Profile deletion and reset:** `events` is in `CHILD_SCOPED_STORES`, so deleting a profile erases that child's events in the same transaction; a full reset deletes the database. Both are tested.
- **Profile switching with an editor open:** the editor is a modal sheet, so the child selector can't be operated through it; tapping outside closes the form without saving. The Calendar screen is keyed by child id, so any switch closes open forms and discards their input. The save path also refuses to write if the active child differs from the editor's child, and the repository refuses cross-child edits.
- **Failed writes:** the transaction aborts, nothing changes, the form stays open with everything typed, and a plain message is shown. A retried save reuses the form's id, so it can't create a duplicate.
- **Overlay preferences:** `Settings.layers` gained `medical` (default on). `vaccines` stays off by default. `wellVisits`, `therapy`, `vaccineSchedule`, `notificationsEnabled` and `familyCalendar` remain as inert fields so older settings stay readable; nothing reads them.
- **Vaccine references are never stored.** They are computed for display from the bundled snapshot and the date of birth.
- **No new dependency, backend, analytics, runtime request, font or AI feature.** Bundle: 529.04 → 562.19 kB (122.74 → 132.00 kB gzip).

## 3. Vaccine source verification

### Source and version
| Item | Value |
|---|---|
| Organization | CDC (National Center for Immunization and Respiratory Diseases) |
| Display source | “Recommended Vaccines for Young Children” — *Recommended Immunizations for Birth Through 6 Years Old, United States, 2025* — https://www.cdc.gov/vaccines/imz-schedules/child-easyread.html |
| Cross-checked against | Schedule by age (Table 1): https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-age.html · Notes: https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html · Addendum: https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-addendum.html |
| Schedule date | July 2, 2025 (pages show “Reviewed: July 2, 2025”) |
| Retrieved | November 27, 2026 |
| Reuse terms | “Use of Agency Materials”, https://www.cdc.gov/other/agencymaterials.html (last reviewed October 28, 2026), re-read before retrieval |

### Current applicability (legal circumstances)
Every schedule page carried this banner on the retrieval date: a preliminary order of **March 16, 2026** in *American Academy of Pediatrics et al. v. Kennedy et al.*, No. 1:25-cv-11916 (D. Mass.) stayed all ACIP votes from its June, September and December 2025 meetings and the Acting CDC Director's **January 5, 2026** memo revising the childhood schedule; CDC states that the **July 2, 2025** schedule “is the current CDC” schedule. The owner approved using this version (Decision #125). The status rests on a preliminary order and may change: **a currency recheck is required at Checkpoint 6.** Claude Code did not read the order or the stayed revision; this report relies on CDC's own statement.

**Addendum review:** it lists one change since October 24, 2024 that is outside the app's ages (a combined meningococcal vaccine for ages 10 and older), and notes that from May 29, 2025 the schedule incorporates the HHS directive on COVID-19 vaccines for children 6 months to 17 years who are not moderately or severely immunocompromised. That is why COVID-19 appears only as a provider conversation. Nothing in the addendum changes a dated reference.

### Access record
- A plain command-line request for the terms page returned **403 (“Access Denied”)** from CDC's content network. Each page was then loaded once in headless Chromium, the same method used for the milestone and activity pages at Checkpoints 2a and 2b, with images, media and fonts blocked (text only). Six distinct pages (the terms page, the four schedule pages and the schedules index), three of them loaded a second time to read the table structure, plus one guessed address that returned 404; copies were kept only in the session scratchpad, not in the repository.
- The 403 was a response to a non-browser client, not a stated restriction on reuse. Claude Code did not retrieve `robots.txt`; the secondary reviewer reports having done so and that it does not generally exclude these paths. Neither fact is, by itself, permission to reproduce content; the basis for reuse is CDC's terms page.
- No AAP, HealthyChildren or Pathways.org content was accessed. CDC's notes cite the AAP *Red Book* as a reference for immunodeficiency; it was not opened or used.

### Basis for reuse
CDC states that most of its website content “is not subject to copyright, is in the public domain, and may be freely used or reproduced”, with four conditions, applied as follows:

| CDC condition | How the app meets it |
|---|---|
| 1. Attribution | “Source: CDC” with the schedule title and date, in the overlay's Source section; “CDC schedule reference” on every reference shown |
| 2. Prominent non-endorsement disclaimer | In the Source section: not endorsed by CDC, HHS or the U.S. Government; not reviewed by CDC or a clinician |
| 3. No change to substantive content | Vaccine names, dose labels and ages are CDC's. Ranges are kept whole. Conditional items quote CDC's words. App-written explanations are separate and labelled |
| 4. State that it is available free | “available free of charge at cdc.gov” |
| Links open a new window; no logo | The source link uses `target="_blank"`; no CDC logo or image is used |
| “If you do re-post, please check back periodically” | The app says the copy does not update itself; recheck at Checkpoint 6 |

No copyright statement was seen in the extracted text of the schedule pages. This is an editorial reading of CDC's terms by Claude Code and the owner, not legal advice or CDC approval.

### What is placed on the calendar
Only ages that CDC's parent schedule marks for **all children** and that don't depend on the product used:

| Vaccine (CDC's parent wording) | Reference ages |
|---|---|
| Hepatitis B | Birth · 1–2 months · 6–18 months |
| Rotavirus | 2 months · 4 months |
| DTaP | 2, 4, 6 months · 15–18 months · 4–6 years |
| Hib | 2, 4 months · 12–15 months (“Dose 3 or 4”) |
| Pneumococcal | 2, 4, 6 months · 12–15 months |
| Polio | 2, 4 months · 6–18 months · 4–6 years |
| MMR | 12–15 months · 4–6 years |
| Chickenpox | 12–15 months · 4–6 years |
| Hepatitis A | 12–23 months (“2 doses separated by 6 months”) |

26 references. The parent page and the professional table agree on every one. Qualifications kept with the reference: hepatitis B birth dose (birth weight under 2,000 grams; mother has or may have hepatitis B); rotavirus (not started at or after 15 weeks 0 days; final dose by 8 months 0 days; two or three doses by product); Hib (the parent page says “Dose 4”, the professional schedule “3rd or 4th dose”); polio final dose (on or after age 4 and at least 6 months after the previous dose); hepatitis A (no date worked out for either dose); hepatitis B dose 3 (a fourth dose is permitted with combination vaccines).

### What is never dated
Listed under “Ask your child's provider about”, with CDC's words quoted and no date:

| Item | Age label | CDC's words |
|---|---|---|
| RSV antibody | Birth through 7 months | “Depends on mother's RSV vaccine status” (plus: timing also depends on the RSV season and month of birth) |
| RSV antibody | 8 through 19 months | “Depends on child's health status” |
| Rotavirus, dose 3 | 6 months | “Dose 3”, marked for some children (depends on the vaccine used) |
| Hib, dose 3 | 6 months | “Dose 3”, marked for some children (depends on the vaccine used) |
| Influenza (flu) | 6 months and older | “Every year. Two doses for some children” |
| COVID-19 | 6 months and older | “Parents/caregivers should talk to their health care provider to decide if this vaccine is right for their child” |

Plus CDC's own list of when to ask for more guidance (higher-risk medical conditions, travel outside the United States, a missed vaccine). High-risk and travel-only recommendations (meningococcal; early MMR and hepatitis A for travel) are not listed as items and never appear as dates. No seasonal product instruction (for example “2024–25 Moderna”) is included; validation fails the build if one is added.

### Display convention (app-generated, labelled as such)
- **Chronological date of birth only**, whatever the corrected-age setting.
- **A single age** (“2 months”) is one marker on the day the child reaches that age. It is not widened into a window (Decision #127).
- **An age range** runs from the day the child reaches its first age **through the last day of its last age** (CDC: a dash “should be read as ‘through’”). 15–18 months ends the day before 19 months; 4–6 years ends the day before the 7th birthday.
- **Calendar arithmetic:** whole calendar months; a shorter month uses its last day (born August 31 → 6 months is February 28); leap days are handled; date-only arithmetic in UTC day numbers, so no time zone or daylight-saving shift can move a date.
- **On the grid:** one diamond on the day a reference age is reached, or on a range's first day. Eight marked days cover all 26 references across seven years. Days inside a range carry no mark; the range appears as context for a selected day and in a collapsed month summary.
- **Wording:** “CDC schedule reference · not an appointment”, “a reference age, not an appointment”, “not appointments or due dates”, “not deadlines”. The app never says due, overdue, up to date or eligible.
- **Provider statement:** “Your child's healthcare provider determines your child's vaccination schedule. This app doesn't track vaccines given, check eligibility or work out catch-up timing.”

### Offline availability
The snapshot is a versioned content file (`contentVersion: cdc-child-schedule-2025-07-02.app-1`) bundled into the application JavaScript, validated at build time (`validateVaccines`) and cached by the existing service worker with the rest of the app. The Calendar makes no network request.

## 4. R-014 timing correction (test-only)

- **Original failure (initialization run):** `acceptance-2b-r.spec.ts`, “R-014 … aligned duration fields (320px)”: labels expected on one line, measured 4.10 px apart. One failure in 219; then 1 in 10 in parallel and 0 in 10 with a single worker.
- **Evidence:** a scratch diagnostic read the labels two ways while the sheet's entrance animation (`sheet-in`, 24 px over 240 ms) was running. Read in one browser frame, the spread was 0 px in all 18 samples. Read one element at a time, as the helper did, offsets of −1.58, −2.52, −4.09 and −5.94 px appeared. Fonts were loaded throughout.
- **Correction:** `expectAlignedDuration` now waits for running finite animations to finish (`Animation.finished`, no fixed delay) and reads every rectangle in a single evaluation. The shared `box()` helper waits the same way, which also covers the two other sequential measurements in that file (the R-012 heading checks and the R-016 notice buttons). Tolerances, assertions, viewports and parallel execution are unchanged. No application code changed.
- **Check:** the four affected tests passed 60 of 60 in parallel (15 repeats each).
- **Residual uncertainty:** no trace of the original failing run exists, so the cause is inferred from a matching reproduction, not observed directly. An intermittent failure can't be proved absent by repetition.

## 5. Tests

- **New unit tests (47):** `calendar.test.ts` (29: month grids, leap years, month ends, navigation, event validation, ordering, overlays, vaccine content validation and tamper detection, source meaning against independently typed professional-note ages, qualifications, undated items, date conventions, time-zone independence) and `eventsRepo.test.ts` (18: CRUD, outright deletion, idempotent retry, failed writes, foreign records, isolation, profile deletion, reset, non-interference, overlay preferences).
- **New end-to-end tests (29):** `calendar.spec.ts` (28: month view, navigation, midnight rollover, CRUD, validation, simulated storage failures, upcoming order, overlays, marker shapes, vaccine single ages and ranges, birth-dose qualifications, provider-discussion and source disclosure, corrected age, month-end and leap dates, profile isolation and switching, profile deletion and reset, reload and reopen, offline, Home and Settings, keyboard, five themes with axe, 320 and 390 px) and one upgrade test from the accepted 2b-R build in `update.spec.ts`.
- **Changed intentionally (requirement changes, explained in place):** the Calendar is no longer in the placeholder-tab test; the Settings section list says “Calendar”; the default-settings unit test includes `medical`; the Checkpoint 1 offline test's “Calendar” link selector is exact. **Corrected (test timing only, same assertions):** the R-014 helper (section 4) and the 2a “guide writes nothing” progress reads. None removed.
- **Totals:** 426 unit (379 + 47) and 248 end-to-end (219 + 29) = 674.
- **Results:** see `docs/BUILD_LOG.md` (three consecutive complete cycles).

## 6. Corrections made during development

| What | Class | Outcome |
|---|---|---|
| Keyboard focus was briefly lost when the arrow keys crossed into another month, so a quick second key press was ignored | Application defect (new code), found by the new keyboard test | Focus is now restored in a layout effect, in the same commit that renders the new month |
| Raw browser error text could have been shown when a write failed | Application defect (new code), found in review | Only the app's own plain messages are shown |
| “Next on the schedule” named a range (“6–18 months”) when several references shared a day | Application defect (new code), found in screenshots | It names the age reached (“age 6 months”) |
| The month name wrapped at 320 px | Visual defect (new code), found in screenshots | One line at every width |
| Four mistakes in newly written tests (a wrong expectation about “next”, a reload racing a save, two navigations racing a finishing action) | Test defects | Corrected before the final runs |
| The default-settings unit test failed in the first full cycle; the Checkpoint 1 offline test's “Calendar” link selector matched Home's new link in the second | Tests needing a requirement update | Updated; the three-cycle sequence restarted each time |
| A Checkpoint 2a test (“browsing the guide writes nothing”) failed once in cycle 2 of the third attempt: it read the progress text before the records had loaded | Test defect (pre-existing, intermittent) | Both reads now retry with the same expected value; the sequence restarted. Growth code was not changed |

## 7. Limitations and items for the owner

1. **Schedule currency** depends on a preliminary court order; recheck at Checkpoint 6.
2. **Home changes** (live “New event”, live “Coming up” card) go slightly beyond the Calendar tab; they replace placeholders that would otherwise have been stale.
3. **Tapping outside a form closes it and discards what was typed**, as with the app's other sheets. This is also what makes a profile switch safe. No “discard changes?” prompt was added.
4. **Day cells are about 37 px wide at 320 px** and about 47 px at 390 px (48 px tall in both; measured in headless Chromium). At 320 px the width is below the 44 px touch guideline; the height is not. Widening them would mean less padding around the month card.
5. **Times have no time zone**; an event keeps the date and time as typed.
6. **Supported years are 1990–2100.**
7. **Children older than seven** see all references in the past; the overlay still works but is of little use.
8. **Not verified in Safari or on an iPhone.** Native date and time pickers, the bottom sheet with the on-screen keyboard, and touch comfort need the owner's testing.
