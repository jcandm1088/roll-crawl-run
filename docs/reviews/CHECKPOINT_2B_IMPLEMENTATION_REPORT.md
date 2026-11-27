# Checkpoint 2b — Implementation and Acceptance Report

*Prepared by Claude Code on 2026-11-27. Implementation authorized by the owner on 2026-11-27. Automated results are from a Linux container (Node.js 22.23.5, headless Chromium). **Nothing here has been tested in Safari, on a Mac, on an iPhone or on Android.** Not pushed, merged or deployed.*

Related: plan `CHECKPOINT_2B_IMPLEMENTATION_PLAN.md` (preserved, with corrections marked), activity inventory `CHECKPOINT_2B_ACTIVITY_INVENTORY.md`, Decisions #89–#106, plan R13, BUILD_LOG (results and development challenges), TESTING_CHECKLIST GE1–GE24, screenshots `docs/screenshots/checkpoint-2b/`.

## 1. Summary
- **Baseline:** `53d6212` (accepted Checkpoint 2a, 12 commits), fast-forwarded on `claude/upbeat-thompson-skpm8j`; verified 282 unit + 155 end-to-end tests before any change.
- **Built in one phase, in the approved order:** database version 3 foundation → My Goals → Exercises, schedules, sessions, stopwatch, counter → verified activity inventory, Browse Exercises, inspiration → Today's routine and the Home card → Personal progress and Progress over time → legacy entry management, regression, accessibility, responsive and theme review, documentation.
- **No new dependencies, no AI, external services, accounts, credentials or analytics.** Offline-capable (all content bundled and precached).
- **Final inventory:** 153 activities from 162 CDC records, 93 tips excluded; no change in inclusion from the approved proposal (section 4).

## 2. Requirement-by-requirement acceptance report
Status: ✅ implemented and covered by automated tests · 🖐 needs human verification · ⚠️ limitation.

| Requirement (authorization §) | Status | Where / evidence |
|---|---|---|
| Baseline 53d6212 verified, 437 tests (§1) | ✅ | BUILD_LOG |
| D1 v3 migration, all records preserved, blocked-upgrade handling, no silent reset (§2) | ✅ | `data/db.ts`; `schemaV3.test.ts` (byte-identical upgrade, v1→v3, failed upgrade stays v2, blocked/blocking callbacks, child-scoped deletion, reset); e2e upgrade from a real build of `53d6212`; e2e blocked and superseded notices |
| Milestone calculations unchanged (§2 D1, §6) | ✅ | unit test comparing Progress/Recent milestones before and after adding goals, exercises and conversions; e2e upgrade test compares Progress by area and Home's Recent milestones |
| D2 CDC ages + All; defaults 3→2 … >60→60; under 2 months and before due date get an intro, not a default; reference age labelled apart from the child's age | ✅ | `domain/activities.ts` `browseDefault`; `activities.test.ts`; e2e (default 12 at 13 months, 24 at 26 months, newborn intro, every age selectable) |
| D3 inventory with corrections; no invented activities; empty areas stated | ✅ | `activities.cdc-2022.json` + lock; e2e empty fine-motor area |
| D4 gender-neutral on every display field; agreement extension; typo correction disclosed; original viewable | ✅ | `validateActivities`; `activities.test.ts` (all fields, tampering detection) |
| D5 current corrected records; D6 hidden excluded with count; D7 6 months/1 year, table | ✅ | `personalProgress.ts`; `stopwatchCharts.test.ts`; e2e (correction/reversal, hidden count, periods, table) |
| D8 two inspiration sections; eight approved ideas labelled; nothing assigned | ✅ | `Goals.tsx` `GoalIdeasScreen`; e2e |
| D9 legacy conversion with safeguards (no invented dates, required date for undated achieved entries, remapped lineages, erasure kept, idempotent, atomic, failure leaves original intact) | ✅ | `legacyRepo.ts`; `legacyEntries.test.ts` (8 tests incl. post-conversion edit and erase); e2e move and delete |
| D10 two-step deletion with accurate effects; typed confirmation unchanged elsewhere | ✅ | `TwoStepDelete`; e2e |
| D11 schedule changes from today; history kept; today's sessions kept; bar ≤ 100% | ✅ | `exercises.test.ts`; e2e partial-participation change |
| D12 / §4 stopwatch: count-up; Start/Pause/Resume/Reset/Save/manual/note; optional target; no auto stop or save; monotonic + wall-clock recovery; recovery notice; anomalies require review; failed save keeps time and note | ✅ (🖐 on devices) | `domain/stopwatch.ts`, `Tracker.tsx`; unit tests for each clock case; e2e with simulated clocks (pause/resume, target keeps counting, reload recovery notice, clock jump review) |
| §4.4 concurrency: no duplicate scheduled completions, no silent overwrite of newer tracker state, stable session identity | ✅ | unique slot index; revision-checked trackers; unit tests (parallel saves, stale revisions); e2e two open copies |
| D13 Home card placement and contents; same calculation | ✅ | `Home.tsx`; e2e equality with Exercises, hidden when nothing scheduled, midnight reset |
| D14 archived counted, archived active goals not active, deleted excluded | ✅ | unit tests |
| D15 landing summaries | ✅ | e2e |
| D16 1–24 sessions, default 1; tidy display for many; additional sessions don't change denominator | ✅ | unit + e2e (24 limit, count instead of dots) |
| §3.1 safety available after adoption and customization; CDC not credited for parent wording; point-of-use safety | ✅ | exercise page Safety card, CDC's original activity, tracker safety note; e2e |
| §3.2 frequency/duration documentation corrected | ✅ | plan (marked *[Corrected]*), inventory, SOURCE_REGISTER |
| §3.3 materials as meaningful phrases; examples marked; omitted where unhelpful | ✅ | inventory; validation that phrases appear in CDC text |
| §3.5 no repeated sentences on activity pages | ✅ | purpose shown once; safety highlighted in place; unit test |
| §3.6 source integrity, stable ids, lock, attribution, non-endorsement, no logos/images, exclusions respected | ✅ | lock + validation at build; SOURCE_REGISTER |
| §5 hierarchy of Growth, Goals & Exercises, My Goals, Exercises, Progress, Home | ✅ | e2e order checks; screenshots |
| §6 profile isolation; erasure doesn't touch identical text elsewhere; personal history never in Recent milestones | ✅ | unit + e2e |
| §8 offline, narrow screens, accessibility, all five themes | ✅ (🖐 on devices) | e2e: axe on 14 new screens, contrast in 5 themes, 320 px overflow checks, offline creation and recording |
| §9 R-001, R-003, R-009 not addressed | ✅ | unchanged |
| Physical iPhone, Safari, offline editing on a device, deployment | 🖐 | Not done; GE checklist |

## 3. Data model and migration results
- **Version 3** adds `itemEvents` and `trackerState`, and replaces the one-per-day completion index with a unique `[customItemId, slotKey]` plus `[childId, occurrenceDate]`. Goals, achievements and exercises are `customItems` kinds; legacy `milestone` items are untouched unless the parent acts.
- **Preservation evidence:** unit test on a realistic v2 database (two children, milestones, notes, a legacy entry): every existing store deep-equal after the upgrade; new stores empty. End-to-end: a real production build of `53d6212` is used to enter data (milestones, Notes & Observations entry, legacy entry), then the 2b build is installed through the service-worker update: every existing store is byte-identical, Progress and its by-area lines and Home's Recent milestones are unchanged, and goals, exercises and conversion then work. The four earlier upgrade tests (from Checkpoint 1 and earlier 2a builds) still pass with version 3.
- **Failure:** a simulated failure inside the upgrade leaves version 2 and its data intact.
- **Blocked upgrade:** another open copy holding the old version gets the “Almost ready” notice; the app continues by itself when it closes. A copy holding a connection that a newer version needs closes it and shows “A newer version is open — Reload”.

## 4. Activity inventory (final)
- 162 records → 153 activities (8 multi-age groups), 93 excluded (feeding 22, behavior 22, caregiver/general 13, screen time 12, sleep 7, safety 6, routines 5, toilet training 3, permission-style 1, gendered family-role examples 2).
- 19 safety-sensitive activities; 57 with materials phrases; 8 records with CDC time words kept as text.
- **Changes from the proposal:** none in inclusion; corrected materials, gender-neutral secondary fields, non-repetitive presentation, one sentence-role correction, title suffixes removed, typo correction disclosed (details in the inventory document).

## 5. Stopwatch and repetition counter
- **Stopwatch:** count-up `MM:SS` (or `H:MM:SS`) in a large tabular font. Start → Pause/Resume; Reset (confirmation after 5 s); Save session (captures and stops the time at that moment, then saves); Enter duration manually; optional note; Discard. Target optional; when reached the display colour and caption change (“Target reached — you can save this session or keep going”) and counting continues.
- **Timing:** elapsed = banked time + time since Start/Resume. In the open page that interval is measured with `performance.now()`; time the page didn't measure (suspension, sleep, reload) is recovered from the stored wall-clock start. The 250 ms interval only redraws. State is written on every change, never every second.
- **Recovery and anomalies:** a stopwatch found running after reopening shows “kept running while the app was closed” with Keep running / Pause / Enter duration manually. A backwards clock, an unexplained gap of more than an hour, or more than 12 hours running is flagged and Save asks the parent to keep or re-enter the time.
- **Counter:** large +1, −1 (disabled at 0), Reset count (confirmed), manual entry, target indication, note; each change saved immediately.
- **Integrity:** in-progress state is device-local, revision-checked (a stale copy sees “changed in another window” instead of overwriting), and the session id is pre-generated so repeated saves can't create a second session. Saving removes the tracker in the same transaction. A failed save leaves the tracker, time and note as they were.

## 6. Automated testing
See BUILD_LOG “Checkpoint 2b” for the three consecutive full runs. New suites: `schemaV3`, `personalGoals`, `exercises`, `stopwatchCharts`, `activities`, `legacyEntries` (unit); `goals-exercises`, `goals-exercises-quality` and one new upgrade test (end-to-end).

**Existing tests changed intentionally (requirement changes):**
| Test | Change | Why |
|---|---|---|
| `storage.test.ts` store list | + `itemEvents`, `trackerState` | v3 stores |
| `storage.test.ts` “one completion per item and date” | now “one session per item and slot, several per date” | D1/D16 logical key |
| `acceptanceRefinements.test.ts` “database version unchanged” | asserts v3 and that R-007 still uses the milestone history store | D1 |
| `perChildTheme.test.ts` v1→v2 test | opens version 2 explicitly | keeps testing that step |
| `update.spec.ts` (3 assertions) | version 3; existing stores byte-identical; new stores empty | D1 |
| `growth.spec.ts`, `growth-refinement.spec.ts` (2), `review-regressions.spec.ts` | Goals & Exercises is live; Progress's “coming soon” sentence replaced by Personal progress | approved requirement change |
No test was removed.

## 7. Defects found and corrected
See BUILD_LOG challenges #28–#42 (classified). In short: confirmed defects in new code found by tests or review (a repeated Safety block on the adopted exercise page; “2 months-old” wording; a non-atomic correct-and-move of a session; stale revisions in chained tracker writes) — all fixed; several test defects in newly written tests — fixed; planning-stage risks addressed by design.

## 8. Known limitations and risks
KNOWN_LIMITATIONS “Checkpoint 2b”. Most important: no background alerts; device clock changes can't always be detected; travel across time zones; bundle size 512 KB (116 KB gzip); no automatic undo for legacy conversion; only Chromium-tested.

## 9. Human acceptance
TESTING_CHECKLIST GE1–GE24 (Mac Safari first; GE10, GE23, GE24 on an iPhone).
