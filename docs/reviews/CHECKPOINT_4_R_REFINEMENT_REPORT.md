# Checkpoint 4-R — Journal Human Acceptance Refinements: Report

*Prepared by Claude Code, 2026-11-28. Automated results are from headless Chromium on Linux. The owner's results are the owner's; Claude Code did not observe them. The refinements themselves have not yet been seen by a person. Fictional data only.*

## 1. Owner's acceptance of Checkpoint 4 (`7e9eb87`, Mac Safari)
| Result | Items |
|---|---|
| PASS (23) | J1–J4, J6, J8–J10, J12–J25, J28 |
| FAIL (1) | J11 — the two entry types were not distinct enough |
| Not human-tested (7) | J5, J7, J26, J27, J29, J30, J31 — carried to final acceptance; not passed |
| Deferred | J32 (iPhone) → Checkpoint 6 |

The owner approves the overall design and the required date.

## 2. R-024 — four primary views
One of four is always selected: **All · Personal Reflections · Care Notes · Unanswered questions (n)**.

| Entry | All | Personal Reflections | Care Notes | Unanswered questions |
|---|---|---|---|---|
| Personal Reflection | Yes | Yes | No | No |
| Ordinary Care Note | Yes | No | Yes | No |
| Care Note, unanswered provider question | Yes | No | Yes | Yes |
| Care Note, answered provider question | Yes | No | Yes | No |

- Confirmed by a unit test that walks this table cell by cell and an end-to-end test that does the same through the interface.
- There are still exactly two entry types. The stored record has the same fields as before (asserted).
- Marking answered removes a note from the Unanswered view only; marking unanswered restores it; text, tags, date and type are untouched (asserted against the stored record).
- Search, dates and tags combine with every view and stay set when the view changes. “Clear search and filters” resets the view to All as well.
- Pressing the selected view again leaves it selected.
- Same chips, same place, same count. No dropdown, screen or navigation layer added.
- **Code:** `JournalFilter` holds one `view` instead of a type plus a separate unanswered flag, so the contradictory combination can no longer be expressed.

## 3. R-025 — telling the two types apart
- **Care Note:** the whole card is the theme's soft tint (`--primary-soft`), with a dark edge. **Personal Reflection:** the light card, unchanged.
- Inside a Care Note: badge and tags are light pills; the provider-question strip is a light panel with a rule above it, clearly apart from the note's text.
- Kept: heart and document icons, labels, layout, typography, behavior. No new color token; no other screen changed (R-018 remains deferred).
- **Measured:** the two card backgrounds differ by a lightness ratio of 1.31 (Earth), 1.27 (Sky), 1.31 (Blush), 1.35 (Lavender), 1.28 (Sage); before, both cards had the same background. Lowest text contrast on the tint is 5.2:1 (secondary text); body text is 9.5:1 or better. axe passes in all five themes.
- **Screenshots** (`docs/screenshots/checkpoint-4-r/`): 01–05 a mixed feed in Earth, Sky, Blush, Lavender, Sage; 06 the Care Notes view; 07 the Unanswered questions view; 08 320 px. **Before:** `docs/screenshots/checkpoint-4/02-journal-feed.png`.
- Whether the difference is now enough at a glance is the owner's judgment (JR6, JR7).

## 4. R-026 — editor opening on a child switch
### Reproduction (unmodified `7e9eb87` build, before any change)
Two children; each row is a fresh run.

| How the Journal was entered | Finished by | After switching child | After switching back | After leaving and returning by the tab |
|---|---|---|---|---|
| Home → “Journal entry” | Save | **New entry editor opened** | **opened again** | no editor |
| Home → “Journal entry” | Cancel | **New entry editor opened** | **opened again** | no editor |
| Journal tab → “New Journal Entry” | Save | no editor | no editor | no editor |
| Journal tab → “New Journal Entry” | Cancel | no editor | no editor | no editor |

In the failing rows the address bar read `#/journal` throughout, while the app's route state still held “open a new entry”.

### Diagnosis
ChatGPT's hypothesis is **confirmed**. The Journal replaced `#/journal/new` with `#/journal` using `history.replaceState`, which does not fire `hashchange`; the router listens only to `hashchange`, so its state kept `add: true`. The Journal screen is keyed by child, so each child switch rebuilt it with “open new” still set.

### Correction
`consumeRoute` in `src/router.ts` replaces the address **and** updates the router's state; the Journal uses it. Nothing was added to the child selector. History behavior is unchanged (the one-time address is still replaced, so Back never returns to it).

### Evidence
- New tests (save and cancel): switch both ways, use the shortcut again for each child, unsaved-change question on a shortcut-opened form, the tab, a reload, Back and Forward, and which child each saved entry belongs to.
- Those tests **fail on the old handling** (2 of 3; the third covers the unaffected tab path) and pass with the correction.

### Remaining uncertainty
- The owner's original steps were not recorded, so it is **not proven** that this is the sequence the owner followed. It matches every detail reported: Journal only; intermittent (only after the shortcut); gone after deleting and creating profiles (which means leaving the Journal).
- No other route to the symptom was found in the code. That is inspection, not proof of absence.
- The defect could not write to the wrong child: the reopened editor belonged to the active child and the ownership checks were unaffected.

## 5. Calendar (reported separately; **not changed**)
| How the Calendar was entered | Finished by | After switching child | After switching back | After leaving and returning by the tab |
|---|---|---|---|---|
| Home → “New event” | Save | **Add event form opened** | **opened again** | no form |
| Home → “New event” | Cancel | **Add event form opened** | **opened again** | no form |

- **Confirmed: the same defect, same cause**, present since the accepted Checkpoint 3. The owner's ordinary switching on the Calendar did not show it because it needs the Home shortcut first.
- No wrong-child write is possible (the form belongs to the active child).
- **Proposed correction, awaiting authorization (R-027):** one line in `Calendar.tsx` to use `consumeRoute`, plus one regression test.
- The router change made here does not alter the Calendar's behavior: the Calendar does not call the new function.

## 6. Tests
- **Counts:** 475 unit (+3) and 286 end-to-end (+6); 761 in all (752 before).
- **Results:** BUILD_LOG, “Checkpoint 4-R”.
- **Existing tests changed:** only Journal tests whose steps relied on switching the unanswered toggle off by pressing it again; they now choose another view. No expectation about which entries appear was loosened.

## 7. Not changed
IndexedDB schema and version (3), stored Journal records, persistence, deletion, validation, the editor and entry view, Growth, the Calendar, Home, Settings.

## 8. Not done
R-018 elsewhere, R-027, photographs, Checkpoint 5, Checkpoint 6, any push, merge or deployment.
