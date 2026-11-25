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
