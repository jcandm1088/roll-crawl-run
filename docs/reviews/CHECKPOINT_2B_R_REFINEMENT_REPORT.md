# Checkpoint 2b-R — Human Acceptance Refinements: Report

*Prepared by Claude Code on 2026-11-27. Implementation authorized by the owner on 2026-11-27. Automated results come from a Linux container (Node.js 22.23.5, headless Chromium). **Nothing here has been tested in Safari, on a Mac, an iPhone or Android.** Not pushed, merged or deployed.*

Related: Decisions #107–#117, plan R14, REFINEMENT_BACKLOG (R-010 to R-018), goal-idea mapping `CHECKPOINT_2B_R_GOAL_IDEAS.md`, TESTING_CHECKLIST (owner's 2b results; GR1–GR16), BUILD_LOG (challenges #43–#51, three regression cycles), screenshots `docs/screenshots/checkpoint-2b-r/`.

## 1. Baseline
- **Recovered:** `claude/vigilant-keller-w6ss5f` fast-forwarded from `aa8c869` to **`64202e22f3183e81d572a4115f03bb5f080b18f6`** (fetched from `claude/upbeat-thompson-skpm8j`). All 13 commits preserved; no history rewritten; working tree clean.
- **Verified before any change:** database version 3; type check and build passed; **360 unit + 201 end-to-end tests passed.**
- **Owner's 2b acceptance (Mac Safari, port 4179), as reported:** A 7/7 · B 12/12 · C–D 16/16 · E 14/14 · F 15/16 · G not applicable · H positive. **64 of 65 applicable checks passed.**

## 2. Requirement-by-requirement report
Status: ✅ implemented and covered by automated tests · 🖐 needs human verification (Mac and/or iPhone).

### R-010 — Age-responsive goal inspiration ✅ 🖐
| Requirement | Result | Evidence |
|---|---|---|
| Keep inspiration, replace the generic examples | “Goal ideas by age” replaces the eight examples; “Start from a milestone” kept | `Goals.tsx` `GoalIdeasScreen`; e2e R-010 tests |
| Six ranges with unambiguous boundaries | [0,6) [6,12) [12,24) [24,36) [36,48) [48,60] completed months | `goalIdeas.ts` `ideaRangeFor`; unit boundary test (0,1,5,6,11,12,23,24,35,36,47,48,59,60) |
| Over 60 months: last range + explanation | “These ideas go up to age 5 …” | unit; e2e (child born 2021) |
| Default from milestone age (chronological or corrected) | Uses the same milestone age as Progress | unit (corrected vs chronological child) |
| Before the due date: no recommendations; intro and browsing | Neutral note, no list, “Look at ideas for birth to under 6 months” | unit; e2e |
| Browse other ranges independently | Range selector; kept in the address so it survives Back | e2e |
| ~8–12 ideas per range, variety, no forced categories | 11, 12, 11, 12, 12, 12 ideas; all five areas in every range (each supported by real records) | unit; validation |
| Developed only from verified inventories; reviewable mapping | Each idea lists its supporting milestones/activities; build-time validation | `goal-ideas.app-2026.json`, `validateGoalIdeas`, `CHECKPOINT_2B_R_GOAL_IDEAS.md` |
| Possible goals, not therapy or expectations; no medical advice | App-written goal phrasing; prescriptive/deadline words rejected by validation; disclaimer | validation; e2e disclaimer |
| Preserve safety qualifications | Ideas backed by safety-sensitive activities show those activities' safety sentences and a link | `ideaSafety`; unit (every safety sentence present); e2e (tummy time) |
| Gender-neutral | Validated | validation; unit |
| Editable before adoption; never assigned; no automatic deadline | Fills only name and area; no target date or milestone link; nothing saved until Save goal | e2e |
| Distinguished from CDC milestones | “Written for this app … aren’t CDC milestones, recommendations from CDC or any medical organization, or things [child] is expected to do. Using one sets no deadline.” | e2e |
| Don't duplicate the libraries | Titles may not equal a milestone or activity title (validation) | validation; unit tampering test |
| Document the original examples correctly | Recorded as an approved design that proved insufficiently useful, not a defect | DECISIONS #107, REFINEMENT_BACKLOG, BUILD_LOG #43 |

### R-011 — Reduce repetitive CDC attribution ✅ 🖐
| Requirement | Result |
|---|---|
| Browse page keeps attribution and non-endorsement | Unchanged source note (“Activities are from CDC’s … Not endorsed by CDC, HHS, or the U.S. Government …”) |
| Neutral reference-age wording | “Gross motor · Reference age: 2 months” (was “CDC lists this for 2-month-olds”); age switcher labelled “Reference age”; Browse context “Showing activities for 2-month-olds” |
| Remove repeated agency names from instructional and safety text | Badge “Recommended activity” (was “From CDC’s activity tips”); Safety card footer no longer “From CDC.”; tracker safety line no longer “(CDC)”; exercise page “How to do it” (was “(CDC)”) |
| Keep all safety content | Every safety sentence, highlighted in place, and CDC's page guidance are unchanged |
| Dedicated source section | “Source” heading with the CDC page link, section name, review date, non-endorsement, free availability, app-organization note and CDC's original wording |
| Provenance and safety after adoption | Badge “From CDC’s activity tips” / “Adapted by you from a CDC activity”; Safety card; collapsed “Original activity and source” |
| Don't attribute parent-edited instructions to CDC | Labelled “Your instructions” |
| Original records and validation preserved | No content file changed; `validateActivities` unchanged |
Evidence: e2e (no “CDC” outside the Source section on the activity page; Source content; adoption; tracker), existing 2b attribution tests.

### R-012 — Exercise form heading alignment ✅ (visual defect) 🖐
- **Cause:** the headings were `<legend>` elements, which browsers draw on the fieldset's top border, so they sat on the card's top edge rather than inside its padding.
- **Fix:** `.choice-group` with a floated legend inside a plain card; applied to “How do you want to track it?”, “How often?” and “Where is it from?” on the add and edit forms.
- **Evidence:** e2e geometry at 320 and 390 px (heading left edge = option left edge; heading inside the card; 8–24 px heading-to-options gap); screenshots 06, 07.

### R-013 / R-014 — Duration input alignment ✅ (visual defect) 🖐
- **Cause:** `.field + .field { margin-top }` (for stacked fields) also applied to fields placed side by side, pushing the second and third fields down.
- **Fix:** shared `DurationFields` (equal grid columns, labels above, ≥ 44 px fields, centred tabular digits) used for the stopwatch target (Minutes/Seconds), the stopwatch's manual entry, “Record a session” and session correction (Hours/Minutes/Seconds); a guard rule for any `.input-row`.
- **Behaviour unchanged:** `parseManualDuration`, target validation (“Please enter a target time …”), optional target, correction/move logic and persistence.
- **Evidence:** e2e (equal heights, tops and widths; labels above their fields; inside the viewport at 320 px; validation message; empty target saves; corrected values 2 min 5 s → 1 h 2 min 5 s); screenshots 08, 09.

### R-015 — Remove deleted exercise sessions from visible history ✅ 🖐
| Requirement | Result |
|---|---|
| Confirmation “Delete this session?” / “This session will be removed from your exercise history and progress totals.” | Exactly this; **Cancel** (primary, focused first) and **Delete session** |
| Removed from the list, no placeholder | The list shows only sessions that count; History hides entries about deleted sessions and the deletion |
| Excluded from progress; Today's routine and Home recalculated; slot available | Deleted sessions aren't loaded at all; same `routineFor` for Exercises and Home |
| Unrelated sessions and records preserved | Only the session and its reversed earlier versions; live sessions never touched |
| Minimal deletion metadata; no notes or values kept | Tombstone keeps id, child, exercise, date, `deletedAt`, `deletedSlotKey`, lineage; history events never held notes or values |
| Distinguish deletion from correction and moves | Correction and moving are unchanged; deleting a moved session also scrubs its reversed original |
| Stale copy can't resurrect it | Same id with a higher `rev` and newer `updatedAt`, `deletedAt` set; a deleted id is never reused (a retried save gets a new id) |
| Prefer database version 3 | **No schema change** — tombstones are ordinary records; the slot key becomes `deleted:<id>` so the unique index holds |
| No sharing or sync | None |
Evidence: `sessionDeletion.test.ts` (8), e2e (confirmation, Cancel default, totals, Home, slot reuse, unrelated exercise, stored data has no note or duration), offline deletion; screenshots 10, 11.

### R-016 — Stopwatch recovery interface ✅ (visual defect) 🖐
- **Cause:** the notice reused the horizontal `banner` layout with three differently styled small buttons beside the text.
- **Fix:** `.notice-panel`: the explanation, then full-width actions in one column — **Keep running** (themed primary), **Pause** (outline), **Enter duration manually** (text button) — all ≥ 44 px. Same pattern for the reset confirmation, the clock-check review and the anomaly warning.
- **Logic unchanged** (timing, recovery, persistence).
- **Evidence:** e2e (primary class, equal widths and left edges, stacked order, ≥ 44 px, axe, all three actions work); existing recovery and clock-anomaly tests; screenshots 12 (390 and 320 px).

### R-017 — Full historical reporting periods ✅ 🖐
| Requirement | Result |
|---|---|
| 6 months = 6 positions; 1 year = 12, including the current month | `chartMonths(today, period)` |
| Chart and table use identical periods | Same buckets |
| Before birth = not applicable, not zero | “–” in the chart, “Before birth (not applicable)” in the table |
| Applicable empty months = 0 | “0” drawn above the axis |
| Months before tracking may be “not tracked” | Exercises only: dotted baseline, “Not tracked yet” |
| Backdated sessions represented | A month with a recorded session is always counted |
| Current month = so far | “*” and “(so far)” |
| Not by colour alone; legend | Marks and text; legend lists only marks that appear |
| Preserved | Three views, corrected records, hidden-milestone exclusion and count, archived treatment, exclusions, profile isolation, no combined score |
| 12-month readability at 320 px and phone widths, five themes; accessible table | e2e: no overflow, month labels don't overlap, axe in all five themes at 320 and 390 px; screenshots 13–15 |
| Update tests that enforced truncation, explaining the change | `stopwatchCharts.test.ts` rewritten with an R-017 comment |

### R-018 and scope
- **R-018** recorded as deferred (low priority; reassess after iPhone use). Not implemented.
- The suspected legacy-entry concern was a misunderstanding; no legacy change. R-001, R-003, R-009 unchanged.
- No Checkpoint 3 work, new dependencies, external services, new sources, AI, analytics, accounts or credentials. Milestone calculations unchanged.

## 3. Material implementation decisions not explicitly specified
1. **Undo after recording** now deletes the session (it was a reversal), so an undone session leaves no stored values either (#112).
2. **Reversed sessions are hidden** from the list, including the originals of moved sessions and sessions removed with the 2b “Remove” action; those existing reversed records are **left unchanged** rather than scrubbed automatically, and no longer have Restore (#113).
3. **Deleting a moved session tombstones its reversed earlier versions** too (their note and values go); live sessions are never touched (#112).
4. **A `session-deleted` history event** is stored (content-free) but not shown; earlier history entries about deleted sessions are hidden (#112).
5. **Ideas don't pre-link a milestone**, and the selected range is kept in the address (#108).
6. **The same notice layout** was applied to the reset confirmation and the clock-check notices (#114); **the same duration component** to manual entry and “Record a session” (#111); the **heading fix** to “Where is it from?” (#110).
7. **12-month labels** stay three letters (“Jan”); verified not to overlap at 320 px.
8. **Test defect fixes** in the pre-existing “blocked upgrade” and “repetition counter” tests (BUILD_LOG #47, #52).

## 4. Tests
- **Added:** 18 unit (`goalIdeas` 10, `sessionDeletion` 8) and 1 net in `stopwatchCharts` (period test split into two); 18 end-to-end (`acceptance-2b-r.spec.ts`).
- **Changed intentionally:**

| Test | Change | Why |
|---|---|---|
| `stopwatchCharts.test.ts` period test | exactly 6/12 months; before birth marked, not dropped; new zero/not-tracked/backdated assertions | R-017 requirement change |
| `stopwatchCharts.test.ts` exercises test | adds `status` and backdated/not-tracked assertions | R-017 |
| `goals-exercises-quality.spec.ts` “removal and restore” | now deletion with confirmation and no placeholder | R-015 requirement change |
| `goals-exercises.spec.ts` inspiration | asserts the reworded disclaimer | R-010 |
| `goals-exercises-quality.spec.ts` “blocked upgrade” | app page moved off the app before deleting the database | test defect (race) |
| `goals-exercises.spec.ts` “repetition counter” | waits until the third tap is stored before reloading; checks the exact count | test defect (race; failed the first full cycle) |
No test was removed. Totals: **379 unit, 219 end-to-end.**

## 5. Results
See BUILD_LOG “Checkpoint 2b-R” for the three consecutive complete cycles (type check, unit, production build, end-to-end; no retries).

**Bundle:** JavaScript 512.39 kB → **529.04 kB** (gzip 116.36 → **122.74 kB**), mainly the goal-idea content (18.5 kB of formatted JSON source) and the new code.

## 6. Limitations
KNOWN_LIMITATIONS “Checkpoint 2b-R”. Most important: Chromium-only testing; session deletion has no undo; earlier “removed” sessions keep their stored values (hidden); goal ideas had an editorial, not clinical, review; coverage ends at 60 months.

## 7. Recommended targeted human retest
TESTING_CHECKLIST GR1–GR16 (Mac Safari first; GR16 on an iPhone). Priorities: GR1 (update from your 2b data), GR2–GR4 (ideas for your 4-month-old), GR8–GR9 (alignment in Safari, where legends render differently), GR10–GR11 (deletion), GR12 (recovery notice), GR13 (periods).
