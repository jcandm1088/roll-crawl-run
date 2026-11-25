# Checkpoint 1 — Precise Age Display (usability defect)

## Owner's observation (personal acceptance testing)
**Type:** usability defect, observed by the project owner during final hands-on acceptance testing.
Home showed a child's age only in months and days. A child aged 2 years and 3 months appeared as “27 months”. The owner requires the child's precise age to the calendar day, in years, months, and days.

## Cause (verified in the code)
Home used `formatAge()`, a compact format that shows weeks and days under 1 month, and total months (plus days) under 2 years. The underlying calculation (`ageBetween`) was already calendar-exact, so only the presentation was wrong.

## Correction
- New central formatter `formatPreciseAge()` in `src/domain/age.ts`:
  - Shows completed years (starting at the first birthday), then remaining months, then remaining days.
  - Omits zero-valued parts and uses correct singular and plural wording.
  - Shows “0 days” on the date of birth.
  - Never uses weeks, rounding, or ranges.
- It reuses the existing calendar calculation `ageBetween()`, which handles leap years, Feb 29 birthdays, and month-end birthdays.
- Used for every **personal** age display:
  - Home (chronological and corrected ages)
  - the profile list
  - the date-of-birth preview
  - the corrected-age preview
- New `useToday()` hook (`src/state/today.ts`) keeps “today” current:
  - a timer just after local midnight
  - a re-check when the app becomes visible or focused again, which covers resuming after sleep, since timers may not run while suspended
  - a once-a-minute fallback
- Long ages on Home wrap only between parts (for example “1 year, 6 months,” then “5 days”), never inside a part.

## Unchanged (by design)
- Developmental groupings: intervals, milestone eligibility and reference ages, and `viewingAge` (which still uses the compact `formatAge()` for its internal label).
- Stored birth dates and the database schema.
- The corrected-age indicator, and the pre-due-date text (“N weeks, N days before due date”, a countdown rather than an age).
- The chronological age always remains visible on Home when corrected age is shown.
