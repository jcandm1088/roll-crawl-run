# Checkpoint 4 — Journal: Implementation and Technical Review Report

*Prepared by Claude Code, 2026-11-27. Automated results are from headless Chromium on Linux. Nothing here has been tested by a person, in Safari or on an iPhone. Fictional data only.*

## 1. Summary
The Journal is built as approved (Decision #151): one notebook per child holding Personal Reflections and Care Notes in a single newest-first feed, with search, filters, provider questions and a privacy notice. Resources is removed from the primary navigation, which is now Home, Growth, Calendar, Journal.

- **Database:** the existing `journal` store; **IndexedDB version 3 unchanged; no migration**.
- **Not pushed, merged or deployed.** `main` and the published app are untouched.
- **Baseline before any change:** 427 unit and 251 end-to-end, all passing, on `8122feb`.
- **After:** 472 unit and 280 end-to-end (752). Results of the three final cycles: BUILD_LOG.

## 2. What a parent can do
| Area | Behavior |
|---|---|
| Write | “New Journal Entry” (also from Home). Choose Personal Reflection or Care Note; date (today by default, earlier allowed); optional title; text; optional tags |
| Read | Cards show the type, date, title if any, the first lines of text and tags. Tapping a card opens the whole entry |
| Change | Edit any field, including the type. Delete after a confirmation |
| Find | Search titles and text. Filter by type, unanswered questions, a date range and tags, in any combination. “Showing 2 of 5 entries” and one button to clear |
| Provider questions | Tick “This includes a question for the provider” on a Care Note. “Unanswered questions (n)” is always near the top. “Mark answered” changes only the status; the note stays in the feed as written and can be edited to add the response |
| Safety | Closing a form with changes asks first. A failed save keeps what was typed. Each child's journal is separate |
| Privacy | One note at the foot of the Journal: stored on this device only, not encrypted or password-protected, readable by anyone with the unlocked device, no backup or restore in this version |

## 3. Requirements and where they are met
| Requirement (prompt section) | Implementation | Automated evidence |
|---|---|---|
| Combined feed, newest first, deterministic (4) | `compareEntries`: date, then creation time, then id | unit “feed order”; e2e ordering test |
| Shared heading, one New action, search, filters, cards, empty and no-results states (4) | `Journal.tsx` | e2e empty state, filters, no-results |
| Distinct types across five themes (4) | label + icon + edge and badge from existing tokens | e2e distinct-types test; five theme tests |
| Create, view, edit, delete; date; optional title and tags; long text (5) | `journalRepo.ts`, editor sheet | unit repository tests; e2e both-types, long-entry tests |
| Unsaved input kept on failure; discard confirmation (5) | error keeps the form; `requestClose` | e2e failed-write and discard tests |
| Wrong-child saves impossible (5, 8) | keyed screen, modal sheet, save-path check, repository ownership check | unit isolation tests; e2e isolation test with a second window |
| Provider-question flag, answered status, filter; none on reflections (6) | `setAnswered` writes one field | unit provider-question tests; e2e provider-question test |
| Privacy notice; no sharing implied (7) | `JOURNAL_PRIVACY`; Settings → Privacy sentence | e2e privacy test |
| Existing store, version 3, atomic writes, outright deletion, profile deletion, reset, reload, offline (8) | `runAtomic` over `journal` + `children`; `CHILD_SCOPED_STORES` | unit store, rollback, deletion, reset tests; e2e deletion, persistence, offline tests |
| Existing data preserved (8) | no migration | e2e upgrade from `c8aa0c5`, all stores identical, photos byte for byte |
| Resources removed; four tabs; Settings kept; attribution kept (9) | router, `Shell.tsx`, placeholder deleted | e2e navigation and attribution tests; updated legacy tests |
| Home shortcut (9) | `#/journal/new` | e2e Home test |

## 4. Data
```
journal store (existing since v1; index byChild)
{ id, createdAt, updatedAt, deletedAt: null, rev, originDeviceId, lastModifiedBy,   // common envelope
  recordType: 'journalEntry', childId,
  type: 'reflection' | 'care', date: 'YYYY-MM-DD', title: string, body: string,
  tags: string[], isProviderQuestion: boolean, answered: boolean }
```
- Create, edit, answered change and delete each run in one transaction over `journal` and `children`; the child must exist, and the entry must belong to the child the form was opened for.
- A retried save reuses the form's id, so it can't create a duplicate.
- Deletion removes the record; nothing is retained.
- Profile deletion and full reset already covered the store; both are now tested with real entries.
- No other store is read or written by the Journal (verified by snapshot in unit and upgrade tests).

## 5. Files
- **New:** `src/domain/journal.ts`, `src/data/repositories/journalRepo.ts`, `src/state/journal.ts`, `src/ui/screens/journal/Journal.tsx`, `tests/unit/journal.test.ts`, `tests/unit/journalRepo.test.ts`, `tests/e2e/journal.spec.ts`, `scripts/checkpoint-4-screenshots.mjs`, `docs/screenshots/checkpoint-4/` (12), this report.
- **Changed:** `src/types.ts` (entry type), `src/router.ts`, `src/app.tsx`, `src/ui/components/Shell.tsx` (four tabs), `src/ui/screens/home/Home.tsx`, `src/ui/screens/settings/Settings.tsx` (one Privacy sentence), `src/ui/styles/base.css`; six existing end-to-end files (below); project documentation.
- **Removed:** `src/ui/screens/placeholders/TabPlaceholder.tsx`.
- **No new dependency.** No service, account, analytics or AI.

## 6. Existing tests changed (authorized requirement change only)
| Test | Change |
|---|---|
| `responsive.spec.ts` bottom navigation | expects 4 tabs, not 5 |
| `review-regressions.spec.ts` child selector on every tab | tab list without Resources |
| `review-regressions.spec.ts` Growth wording | the Resources placeholder line now checks `#/resources` opens Home |
| `final-refinement.spec.ts` per-child theme; shared headings | tab lists without Resources |
| `growth-refinement.spec.ts` no development wording | screen list without `#/resources` |
| `checkpoint1.spec.ts` placeholder tabs | now checks that no primary tab is a placeholder |

## 7. Choices made without explicit owner guidance
Decisions #155–#168. The ones most worth a look:
1. **Home's “Daily encouragement” placeholder is removed** (#168), beyond connecting the shortcut.
2. **Settings → Privacy** sentence about sharing rewritten (#164).
3. **No future dates; a date rather than a date and time** (#156).
4. **Limits:** 20,000 characters, 10 tags of 30 characters, title 120 (#157).
5. **Multiple tags narrow the feed** (an entry must have all chosen tags); search doesn't look in tags (#160).
6. **Filters reset** on leaving the Journal (#160).
7. **The “Personal · excluded from sharing by default” label is not shown** (#164), because nothing can be shared yet; the requirement is preserved for exports (#165).
8. **Sheets now wrap long unbroken words** (a small shared style change that also applies to Calendar sheets).

## 8. Defects found and fixed during development
See BUILD_LOG challenges #71–#74. Two were application defects caught by new tests before delivery: Escape discarding unsaved writing without asking, and narrow-screen overflow.

## 9. Limitations
KNOWN_LIMITATIONS, “Checkpoint 4 (Journal)”. Principal ones: no backup or restoration; not encrypted; no automatic drafts (a reload or closed tab loses unsaved writing); deleted entries are unrecoverable; no human, Safari or iPhone testing yet.

## 10. Screenshots (`docs/screenshots/checkpoint-4/`)
01 empty Journal · 02 feed · 03 Personal Reflection open · 04 Care Note open · 05 unanswered-questions filter · 06 search with a tag filter · 07 Home with four tabs · 08 editing a Care Note · 09 discard-changes question · 10 feed at 320 px · 11 editor at 320 px · 12 desktop feed.

## 11. Not done
Photographs and attachments (R-023), Calendar or Growth integration, AI, mood or medication tracking, recurrence, reminders, sharing, backup, restoration, exports, synchronization, a Resources library, other deferred refinements, Checkpoint 5, Checkpoint 6, any push, merge or deployment.
