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
| M8 | Close the app completely, reopen, and the data is still there | Phone | | | |
| M9 | Restart the phone, reopen, and the data is still there | Phone | | | |
| M10 | Install to the home screen (iPhone Safari) and it opens standalone | iPhone | | | |
| M11 | Install to the home screen (Android Chrome) and it opens standalone | Android | | | |
| M12 | Airplane mode after install: the app opens and profiles can be edited | Phone | | | |
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
| A1 | A child over 2 years shows years, months, and days (not “27 months”) | Mac · Safari | | | Defect originally observed by the owner |
| A2 | Leave the app open past midnight, or reopen it the next morning: the age has advanced by one day | | | | |
