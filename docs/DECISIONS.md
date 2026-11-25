# Decision Record

Short records in the format context → decision → consequences. The full approved plan includes decisions D1–D15 and Q1–Q11. They are summarized here as they are implemented.

## Approved before implementation
- **D1** Five app categories. CDC's original category is kept on every milestone, and the gross/fine motor split is documented per item.
- **D2** Option A. A child's age uses `[start, end)` intervals in completed months. A "By X months" milestone goes in the interval that ends at X. Ages of 60 months and older use the 57–60 month interval. *(Interval functions implemented and tested in Checkpoint 1; used in Checkpoint 2.)*
- **D3** Vite + TypeScript + Preact + IndexedDB (`idb`).
- **D4 (revised)** Vaccination reference windows come from one parent-selected source (CDC/ACIP or AAP), shown one at a time; well-child references are shown separately.
- **D5 / Q4** Corrected age can be entered as a due date or as weeks at birth. The safeguards are below.
- **D6** Monthly recurrence on the 29th–31st falls on the month's last day, and exported calendar files will match.
- **D7** Any valid past date of birth is accepted; developmental content covers ages 0–5.
- **D8** Reports use native print-to-PDF, plus HTML and copied text.
- **D9** Photos are excluded from exports by default.
- **D10** No dark mode in v1.
- **D11** Provider questions are a checkbox on Care Notes.
- **D12** An optional combined family calendar.
- **D13** The repository is named `roll-crawl-run`.
- **D14** Motivational messages are drafted for review.
- **D15** Supporting activities come from the CDC or other verified organizations, with permitted use.
- **Q1–Q11** As approved, including: well-child visit references on by default; vaccination references off until a source is chosen; device label blank by default; purge-from-backups checked by default; and five internal backup snapshots kept.

## Checkpoint 1 implementation decisions
1. **Age calculation rule.** Age is a calendar difference. A monthly anniversary that doesn't exist falls on the last day of that month, so Jan 31 → Feb 28/29, and a Feb 29 birthday counts on Feb 28 in non-leap years. Display: days or weeks under 1 month, months and days under 2 years, then years and months.
2. **Date handling.** Dates are stored as `YYYY-MM-DD` strings and computed with UTC arithmetic, so time zones and daylight-saving changes can't shift a date. "Today" is the device's local calendar date.
3. **Date of birth input limits.** Empty, impossible (for example Feb 30), and future dates are rejected. Dates before 1900-01-01 are also rejected, as a typo guard (D7: "any valid past date").
4. **Corrected-age input limits (Q4, provisional).** Weeks at birth: 20w0d–41w6d. Due date: after the date of birth and at most 20 weeks (140 days) after it. 40 weeks or later, or a due date on or before the birth date, means "doesn't apply" (an explanation, not an error). These limits only catch typing mistakes; they are **not clinical guidance**, and the UI says so. Out-of-range input is rejected with an explanation and left exactly as typed. *No clinical source was consulted, because source sites were unreachable from the build environment (see SOURCE_REGISTER).*
5. **Before the due date.** Corrected age displays as "N weeks, N days before due date", never as a negative age. The milestone viewing age is `null`, which places the child in the 0–3 month interval with nothing applicable yet.
6. **Basis fallback.** If "corrected" is selected but corrected age doesn't apply, the app uses chronological age, and the stored basis is reset to chronological when corrected age is turned off.
7. **Schema v1 creates every planned store now**, including the logical-uniqueness indexes and a `mergeBases` store keyed by `[recordKey, peerDeviceId]` for field-level snapshots. Later releases then only add data.
8. **Profile deletion** removes all of the child's records in one atomic transaction and leaves a tombstone without personal information (only id and timestamps). This stops a future partner import from silently bringing the profile back. If every profile is deleted, the app asks for a new child using a shortened onboarding.
9. **Atomic writes.** `runAtomic()` wraps multi-store writes in a single IndexedDB transaction and aborts everything on any error.
10. **Theme delivery.** Theme tokens live in TypeScript, are injected as CSS variables, and are switched with `data-theme` on `<html>`. One source drives both the CSS and the contrast tests.
11. **Hash routing and relative base path (`./`)** so the app works on GitHub Pages project URLs and offline.
12. **Service worker.** Hand-written. It precaches the build output (woff2 fonts only), serves cache-first, and waits for the user to tap "Refresh" before activating an update. The cache version is a hash of the build output and the worker source.
13. **Content Security Policy** in production: `default-src 'self'`, with no external scripts, fonts, or connections. `style-src` allows inline styles because the components set them.
14. **Storage persistence** is requested once, when the parent taps "Start using the app" (a user action). Its status is shown in Settings → Storage, and the app works whether or not it's granted.
15. **Placeholders.** Features from later checkpoints appear only as dashed "Not available yet · Checkpoint N" cards and rows, and they can't be activated.

## Checkpoint 1 review decisions
Details are in `docs/reviews/CHECKPOINT_1_REVIEW.md`.

16. **Popovers and dialogs render through a portal** (`preact/compat` `createPortal`, part of the existing `preact` package, so no new dependency). This fixes the child-selector defect: the blurred top bar could become the positioning container for fixed-position content.
17. **The child selector is a downward dropdown** anchored below the top bar, not a centered dialog. Its height is limited to the viewport and the list scrolls inside.
18. **Focus management:** `useFocusTrap` (a layout effect) is used for every dialog, and roving-tabindex radio groups with arrow keys are used everywhere.
19. **Atomic profile save:** profile and photo are written in a single transaction, using a per-form ID so retries don't create duplicates.
20. **Two-step destructive actions,** placed in collapsed “Advanced …” sections. Profile deletion requires typing DELETE PROFILE; reset requires RESET. Cancel is the primary button. *(This supersedes the original single-step DELETE confirmation.)*
21. **Settings accordions:** Profiles and Appearance stay expanded; Your Data, Calendar & Reminders, This Device, and About are collapsed by default.
22. **Typography option A:** selective Inter for the specific headings named in the review. *(Superseded by decision 31.)*
23. **Blush revised** to the reviewer's baby-pink palette.
24. **Deployment is manual-only,** using `workflow_dispatch` with a typed confirmation.
25. **Route re-sync** when the hash listener attaches, to close a timing gap found by the test suite.
26. **Growth section order and names are permanent:** Progress, Goals & Exercises, What to Expect at Every Age, Milestone Library.
27. **The Calendar tab opens directly to the current month** (a Checkpoint 3 requirement).
28. **Backup requirements added to Checkpoint 5:** create, restore, history, last successful backup date, reminders, and a prompt to back up before destructive actions.
29. **Language and UX standards** recorded in the development plan (R4).

## Checkpoint 1 final refinement decisions
Details are in `docs/reviews/CHECKPOINT_1_FINAL.md`.

30. **Per-child themes are stored as a device preference** (`settings.childThemes`), not on the child record. Each device can keep its own colors for a child, and themes never cause partner-merge conflicts. Profile save and delete update the theme entry in the same atomic transaction.
31. **Typography Option B.** Inter for all functional headings, using shared tokens and a `PageHeader` component; Fraunces only for the wordmark. Top-bar titles also use Inter (a small extension of the Option B mock-up, following the request for consistent primary headings).
32. **Logo: Concept 5, “Growing Together”**, from one JSON artwork source. Installed icons use fixed brand colors; the in-app mark is themed.
33. **Schema v2** is a data-only migration (no store or index changes), atomic within the IndexedDB upgrade transaction. Child records are unchanged.
34. **The theme is applied synchronously** before the newly selected child renders, so the previous child's theme is never shown with the new child.
35. **The focus trap includes only tabbable elements** (`tabIndex >= 0`), so radio groups stay one Tab stop.
36. **The child selector has no minimum height**; it moves up in short windows and the whole panel scrolls.
37. **Icon cache busting:** `?v=2` on icon URLs, and public files are included in the service-worker cache version.
38. **App version raised to 0.1.1.** No dependencies were added. `package.json` changed only in its version number.
