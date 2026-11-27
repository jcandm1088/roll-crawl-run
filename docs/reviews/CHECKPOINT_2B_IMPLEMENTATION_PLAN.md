# Roll, Crawl, RUN — Checkpoint 2b Implementation Plan

> **Preserved planning record (approved with modifications by the owner on 2026-11-27).** Where the owner's implementation authorization differs, the authorization controls: see `docs/DECISIONS.md` #89–#106 and `docs/DEVELOPMENT_PLAN.md` R13. Corrections made at implementation are marked *[Corrected]* below. The planning Appendix A is superseded by `docs/reviews/CHECKPOINT_2B_ACTIVITY_INVENTORY.md`.
## Goals, Exercises & Historical Progress

*Prepared by Claude Code on 2026-11-27 for the owner's review. Planning only: no application code, schema, dependency or content was changed, and nothing was committed, pushed, merged or deployed.*

Companion file: **Appendix A — Proposed CDC starter activity inventory** (`APPENDIX_A_CDC_ACTIVITY_INVENTORY.md`), with the exact source wording, proposed display wording, age, area, safety sentences and materials for every proposed activity.

---

## 0. Summary

| Item | Result |
|---|---|
| Baseline | Recovered exactly: `53d6212d9a7d…` “Checkpoint 2a: Human Acceptance Closeout”, 12 commits, by a normal fetch and fast-forward. No discrepancy |
| Automated baseline | **282 unit + 155 end-to-end = 437 passed**; type check and production build passed; database version 2 |
| CDC activity source | Usable. Each of the 12 registered CDC milestone pages has a “Tips and activities” section (255 tips). Reuse terms re-checked and unchanged |
| Proposed starter library | **153 activities** from 162 CDC tip records, across all 12 CDC ages; 93 tips excluded as general parenting guidance (feeding, sleep, screen time, behavior, safety) |
| Schema | A **version 3** migration is recommended (section 11). It is additive and touches no existing record. It needs your approval |
| Dependencies | None added. Charts are hand-built SVG, as already planned |
| Phasing | **One implementation phase** after approval, with one owner review at the end (section 16) |
| Decisions needed | 16, listed in section 17. Most have a recommendation; none reopens a settled design choice |

---

## 1. Workspace recovery and baseline verification

### 1.1 Recovery
- **Starting state:** session branch `claude/upbeat-thompson-skpm8j` at `aa8c869` (remote `main`), clean working tree.
- **Fetched** `claude/sharp-franklin-vrbgmd`: tip `53d6212d9a7d99854e7195df7979a9a5758b88de`, 12 commits, previous commit `bf790b5`, last application change `8843a25` — all as stated.
- **Fast-forwarded** the local session branch to `53d6212` (`--ff-only`; `aa8c869` is an ancestor). No history was rewritten and nothing was pushed.
- **Other preserved states** confirmed on the remote: `main` `aa8c869`, `checkpoint-2a` `73d9f6f`, `claude/beautiful-allen-1vjobt` `170cc99`. Published application `e40287f` (per the handoff; not re-inspected on GitHub Pages).
- **Branch restriction:** this session may push only to `claude/upbeat-thompson-skpm8j`. Under Decision #63, any later preservation push needs your explicit authorization naming the branch. If you want 2b preserved on another branch (for example `checkpoint-2b`), that conflicts with this session's restriction and I will raise it before pushing.

### 1.2 Verification (Linux container, Node.js 22.23.5, headless Chromium)
| Check | Result |
|---|---|
| `npm ci` | Passed |
| `npm run typecheck` | Passed |
| `npm test` | **282 passed** (11 files) |
| `npm run build` | Passed (JS 255.49 kB, 66.02 kB gzip) |
| `npm run test:e2e` | **155 passed** (2.8 min) |
| Database version | 2 (`DB_VERSION`, and asserted by tests) |

**Not verified here:** Safari, a physical iPhone, Node.js 26 and the deployed site. Physical iPhone acceptance, offline editing on a device, manual upgrade verification and deployment acceptance of Checkpoint 2a remain **pending**.

### 1.3 Documents read
README, `DEVELOPMENT_PLAN.md` (R3–R12, §4 data model, §6.5–6.7, §8.1a merge), `HANDOFF.md`, `DECISIONS.md` (#1–#88), `DESIGN_SYSTEM.md`, `SOURCE_REGISTER.md`, `REFINEMENT_BACKLOG.md` (R-001–R-009), `TESTING_CHECKLIST.md`, `KNOWN_LIMITATIONS.md`, `BUILD_LOG.md` (including the challenge log #1–#27), and the Checkpoint 2a reviews (source verification, guide content, acceptance refinements). “Development challenges” are kept in `BUILD_LOG.md` (“Significant challenges”); there is no separate file.

---

## 2. Existing infrastructure that can be reused

| Existing piece | Where | Reuse in 2b |
|---|---|---|
| Record envelope (`id`, timestamps, `deletedAt`, `rev`, device ids), `newEnvelope`, `touch` | `data/envelope.ts`, `types.ts` | Every new record |
| `runAtomic()` single-transaction writes | `data/transactions.ts` | Every multi-record write (completion + event, conversion, deletion) |
| `monotonicRecordedAt()` | `milestonesRepo.ts` | History ordering for all new events (move to a shared module) |
| Date utilities (`LocalDate`, UTC arithmetic, `todayLocal`, `addDays`) | `domain/dates.ts` | Recurrence, day boundaries, monthly buckets. Needs `weekdayOf()` and month helpers |
| `useToday()` (midnight timer, resume re-check) | `state/today.ts` | Today's routine and the Home card roll over at midnight without a reload |
| Milestone age, `intervalForAge`, `REFERENCE_AGES`, Older-than-five and pre-due-date handling | `state/milestones.ts`, `domain/intervals.ts`, `domain/age.ts` | Default age in Browse Exercises |
| Gender-neutral display layer and `validateDisplay` | `domain/milestoneDisplay.ts` | Same mechanism for activity wording (one small rule extension, decision D4) |
| Content validation at build time (Vite plugin + unit tests), locked ids | `domain/milestones.ts`, `milestone-ids.lock.json` | New `activities.cdc-2022.json` + lock file + `validateActivities()` |
| Source registry (`sources.json`) | `content/` | The 12 page sources are already registered; activity records reference them |
| Notes & Observations logic (`observationsFor`, edit/remove/erase lineage) | `domain/milestoneHistory.ts`, `milestonesRepo.ts` | Generalized to goals, achievements and exercises (pure functions already depend only on `recordId`, `type`, `refEventId`) |
| `Accordion` (whole header is one button, collapsed by default) | `ui/components/Accordion.tsx` | The five category accordions in Browse Exercises; optional form sections |
| `Sheet`, `useFocusTrap`, roving radio groups, `PageHeader`, `ForChild`, `SourceNote`, `ExternalLink`, `PlannedTag` | `ui/components`, `ui/screens/growth/parts.tsx` | Tracker sheet, forms, attribution |
| Two-step destructive pattern in collapsed “Advanced” sections | Milestone detail, profiles | Deleting goals, exercises, achievements, legacy entries |
| Profile deletion over `CHILD_SCOPED_STORES` | `childrenRepo.deleteChild` | New stores are added to this list, so profile deletion and reset still remove everything |
| Hash router | `router.ts` | New routes under `#/growth/…` |
| Update test harness (builds real earlier commits and upgrades in place) | `tests/e2e/update.spec.ts` | A new “upgrade from accepted 2a (`53d6212`)” test |
| Existing stores `customItems` (by child) and `completions` (by child; unique `[customItemId, occurrenceDate]`) | `data/db.ts` | `customItems` holds goals, achievements and exercises; `completions` holds sessions, after the index change in §11 |

**What cannot be reused as is (material findings):**
1. **`completions` allows only one record per exercise per day** (unique index on `[customItemId, occurrenceDate]`). The approved “multiple sessions per scheduled day” and “additional unscheduled sessions” cannot be stored without changing that index (section 11).
2. **`milestoneEvents` must not hold goal or exercise history.** Milestone code reads every event for a child; for example Home's “Recent milestones” (`recentProgressEvents`) takes any `status` event. Goal events there would appear as milestones. A separate history store keeps milestone calculations untouched.
3. **No handling of a blocked database upgrade.** `openRcrDb` has no `blocked`/`blocking` callbacks. With a version change, an app tab still open on the old version would silently hold up the upgrade. This must be handled (section 11.6).

---

## 3. Approved scope and navigation hierarchy

### 3.1 Approved (requirements; not reopened)
Everything in the Checkpoint 2b brief sections 3–20 is treated as settled. In short:
- Growth landing keeps its four destinations, order and subtitles. **Goals & Exercises** changes from a “Coming soon” card to a live link.
- **Goals & Exercises** → two pages: **My Goals** (“Set personal goals and celebrate achievements.”) and **Exercises** (“Discover activities and build your own routines.”).
- **My Goals** order: Create a goal · Record an achievement · Working toward · Accomplishments · Looking for inspiration?
- **Exercises** order: Create exercise · Browse Exercises · Today's routine · My exercises.
- **Browse Exercises** is its own page: subtitle, age selector, five collapsed category accordions. Each activity has its own detail page.
- Three tracking methods (simple, timer, repetitions) and four scheduling options (as needed, every day, selected weekdays, several sessions per day).
- Progress keeps everything it has, and gains a small **Personal Progress** summary near the bottom and a **View progress over time** link to a separate page with three views (Milestones, Goals, Exercises), one chart at a time.
- Home gains a conditional **Today's exercises** card.
- Legacy personal entries get optional conversion and permanent deletion, in their existing area only.
- No progress bars on goals, no percentages, streaks, scores, rankings, missed-day warnings or predictions. Nothing is ever inferred: exercises never accomplish goals, goals never achieve milestones.

### 3.2 Out of scope (unchanged)
Calendar integration (Checkpoint 3), reminders and notifications, sharing/backup (Checkpoint 5), R-001, R-003, R-009, Checkpoint 3 sources, merging into `main`, deployment.

### 3.3 Routes (all under the existing Growth tab; no new tabs)
| Route | Screen | Back goes to |
|---|---|---|
| `#/growth/goals` | Goals & Exercises landing | Growth |
| `#/growth/goals/my` | My Goals | Goals & Exercises |
| `#/growth/goals/new` · `#/growth/goals/achievement/new` | Create a goal · Record an achievement | My Goals |
| `#/growth/goals/item/<id>` (+ `/edit`) | Goal or achievement detail | My Goals |
| `#/growth/goals/ideas` | Looking for inspiration? | My Goals |
| `#/growth/exercises` (`/today` focuses Today's routine) | Exercises | Goals & Exercises |
| `#/growth/exercises/new` | Create exercise | Exercises |
| `#/growth/exercises/browse` (`/<age>` or `/all`) | Browse Exercises | Exercises |
| `#/growth/exercises/activity/<activityId>` | Recommended activity detail | Browse (history) |
| `#/growth/exercises/item/<id>` (+ `/edit`) | My exercise detail (history, schedule, pause, archive) | Exercises |
| `#/growth/progress/history` (`/milestones`·`/goals`·`/exercises`) | Progress over time | Progress |

Unknown or deleted ids show a calm “This item is no longer here” state with a link back, never a blank page.

---

## 4. Wireframes (phone, 390 px; existing header, child chip and tab bar unchanged)

**Goals & Exercises landing**
```
┌ ‹ Growth        Goals & Exercises ┐
│ For Sample Child A                │
│ ┌───────────────────────────────┐ │
│ │ ◎ My Goals                  › │ │
│ │ Set personal goals and        │ │
│ │ celebrate achievements.       │ │
│ │ 2 working toward · 5 done     │ │  ← simple counts only
│ └───────────────────────────────┘ │
│ ┌───────────────────────────────┐ │
│ │ ✦ Exercises                 › │ │
│ │ Discover activities and build │ │
│ │ your own routines.            │ │
│ │ Today: 1 of 3 done            │ │  ← or “Nothing scheduled today”
│ └───────────────────────────────┘ │
└───────────────────────────────────┘
```

**My Goals**
```
┌ ‹ Goals & Exercises      My Goals ┐
│ [ + Create a goal               ] │  primary
│ [ ★ Record an achievement       ] │  secondary
│                                   │
│ Working toward (2)                │
│ ┌───────────────────────────────┐ │
│ │ Stacking three blocks       › │ │
│ │ Fine motor · since Oct 2      │ │
│ │ Target Dec 15 (your plan)     │ │  ← no bar, no %
│ ├───────────────────────────────┤ │
│ │ Saying “more”               › │ │
│ └───────────────────────────────┘ │
│ Accomplishments (5)               │
│ ┌───────────────────────────────┐ │
│ │ ★ First steps on the beach  › │ │  achievement
│ │   Nov 20, 2026                │ │
│ │ ◎ Rolling over              › │ │  accomplished goal
│ │   Accomplished Nov 2, 2026    │ │
│ └───────────────────────────────┘ │
│ Show archived (1)                 │  only if any
│                                   │
│ Looking for inspiration?        › │  quiet link row
└───────────────────────────────────┘
Empty: “Nothing here yet. Create a goal, or record something
 [name] did that you want to remember.”
```

**Create a goal** (progressive disclosure)
```
Goal name *            [_______________]
Area                   (Uncategorized ▾)
Starts                 [Nov 27, 2026]
Target date (optional) [__________]
  “A target date is your own plan, not a deadline.”
▸ More details   → Description · Notes & Observations ·
                   Related milestone · Related exercises
[ Save goal ]   Cancel
```
*Record an achievement* has: Name *, Date * (today), Area, ▸ More details (Description, Notes & Observations).

**Goal detail**
```
Stacking three blocks          [Edit]
Working toward · Fine motor
Started Oct 2, 2026 · Target Dec 15
[ ✓ Mark as accomplished ]   → asks for the date (today)
Description …
Related milestone: “Stacks …” (CDC) ›   “Marking this goal
  accomplished doesn't change the milestone.”
Related exercises: Block play ›
Notes & Observations  (existing component)
History (collapsed)
Advanced (collapsed): Archive · Delete permanently
```
Accomplished goal: shows “Accomplished Nov 2, 2026”, **Reopen**, Correct date.

**Looking for inspiration?**
```
Ideas are optional. Change anything to fit [name].
Start from a milestone
  [Search milestones…]    → choose any; opens Create a goal
                            prefilled and linked
Ideas to get you started   (written for this app; not
  · Read a book together     recommendations)
  · …                       [Use this idea]
```

**Exercises**
```
┌ ‹ Goals & Exercises     Exercises ┐
│ [ + Create exercise             ] │
│ [ ⌕ Browse Exercises            ] │
│ Today's routine                   │
│ ┌───────────────────────────────┐ │
│ │ 1 of 3 sessions done          │ │
│ │ ███████░░░░░░░░░░░░           │ │  one bar
│ ├───────────────────────────────┤ │
│ │ Tummy time      ○ ○  [Start] │ │  timer; 2 sessions
│ │ Block stacking  ●   [Done ✓]  │ │  simple
│ └───────────────────────────────┘ │
│ My exercises (4)                  │
│  Block stacking · Every day     › │
│  Leg stretches · Mon Wed Fri      │
│    From Dr. Rivera (physical      │
│    therapy) · Paused            › │
│  Bubble popping · As needed     › │
│  Show archived (1)                │
└───────────────────────────────────┘
Empty today: “Nothing scheduled for today. You can still
 record any exercise from My exercises.” (no bar)
```

**Tracker sheet** (opens from Today's routine or an exercise; bottom-anchored for one-handed use)
```
Timer                          Repetitions
Tummy time · session 1 of 2    Leg stretches · session 1 of 1
      03:12  / 05:00                 7  / 10
 [Reset] [  Pause  ]            [ − ]   [  + 1  ]
 Elapsed time only — save to    [Reset]
 record a session.              [ Save session ]
 [ Save session ]
 ▸ Enter time manually          ▸ Enter count manually
 ▸ Add a note                   ▸ Add a note
```
Reaching the target shows “Target reached — save this session?” [Save] [Keep going]. Nothing is saved automatically.

**Browse Exercises**
```
┌ ‹ Exercises      Browse Exercises ┐
│ Everyday activities from CDC's    │
│ milestone pages.                  │
│ Age  [ 9 months ▾ ]  (child's age │
│      by default · All ages)       │
│ ▸ Gross motor (2)                 │  all collapsed
│ ▸ Fine motor (1)                  │
│ ▸ Cognitive (2)                   │
│ ▸ Language & communication (4)    │
│ ▸ Social & emotional (3)          │
│ Source: CDC · not endorsed …      │  existing SourceNote style
└───────────────────────────────────┘
Expanded empty area: “CDC's tips for this age don't include a
 [fine motor] activity. Try another age, or create your own.”
```

**Activity detail**
```
Find the hidden toy
Cognitive · CDC lists this for 9-month-olds
How to do it
  “Play a game that teaches your baby to look for things
  they see you hide, such as a toy under a blanket.”
You'll need: toy, blanket
Safety  “Try these simple tips and activities in a safe way. …”
Source: CDC, Milestones by 9 Months ↗ · wording adapted
  for gender-neutral language (show CDC's original)
[ Add to My Exercises ]  → tracking, schedule, goals (prefilled
                           “Simple”, “As needed”)
```

**Progress (existing page; only the bottom changes)**
```
… existing cards unchanged …
SourceNote (unchanged)
┌ Personal progress ──────────────┐   replaces the current
│ 5  personal accomplishments     │   “coming soon” sentence
│ 2  active goals                 │
│ 9  exercise sessions this month │
│ [ View progress over time › ]   │
│ Personal goals and exercises    │
│ never change milestone progress.│
└─────────────────────────────────┘
```

**Progress over time**
```
[ Milestones | Goals | Exercises ]     segmented control
[ 6 months | 1 year ]
Milestones recorded as achieved, by month
 ▇      ▇▇           (monthly bars, labelled)
Jun Jul Aug Sep Oct Nov*   *this month so far
“Shows what you've recorded. A month with no bar has
 nothing recorded — it doesn't mean nothing happened.”
▸ Show as a table
```

**Home card** (only when something is scheduled today; placed after Quick actions)
```
┌ Today's exercises ──────────────┐
│ 1 of 3 sessions done            │
│ ███████░░░░░░░░░░               │
│ [ View today's routine › ]      │
└─────────────────────────────────┘
```

---

## 5. Goal and achievement lifecycle

### 5.1 Records (in the existing `customItems` store, `kind` distinguishes them)
```ts
interface PersonalGoal extends RecordEnvelope {
  childId: string; kind: 'goal';
  title: string;                       // required, trimmed, ≤ 120 chars
  appCategory: AppCategory | null;     // null = Uncategorized
  description: string;
  startDate: LocalDate | null;         // default today; null only for converted legacy entries
  targetDate: LocalDate | null;        // parent's plan; never a deadline
  status: 'active' | 'accomplished';
  accomplishedDate: LocalDate | null;  // set only when accomplished
  milestoneDefId: string | null;       // optional link to one CDC milestone (no effect on it)
  archivedAt: string | null;
  convertedFrom?: { legacyCustomItemId: string; convertedAt: string };
}
interface Achievement extends RecordEnvelope {
  childId: string; kind: 'achievement';
  title: string; appCategory: AppCategory | null; description: string;
  achievedDate: LocalDate;             // required; no start date exists
  archivedAt: string | null;
  convertedFrom?: { legacyCustomItemId: string; convertedAt: string };
}
```
Exercise associations are stored once, on the exercise (`goalIds`), and edited from either side.

### 5.2 Transitions (each one atomic, with an `itemEvents` entry)
| Action | Effect | History entry |
|---|---|---|
| Create goal | `status: active` | `created` |
| Edit | Changed fields | `edited` (from → to for dates and status-relevant fields) |
| Mark accomplished (date, default today) | `status: accomplished`, `accomplishedDate` | `status` active → accomplished |
| Correct accomplishment date | `accomplishedDate` | `date-corrected` (both dates kept) |
| Reopen | `status: active`, `accomplishedDate: null` | `status` accomplished → active (earlier date kept in history) |
| Archive / restore | `archivedAt` set / cleared | `archived` / `restored` |
| Delete permanently (two steps) | Record replaced by a content-free tombstone; its `itemEvents` (including text) deleted; `goalIds` links removed from exercises | none left (tombstone only) |
| Record achievement | New `Achievement` | `created` |

**Date rules:** every date is a real date on or after the date of birth. Accomplishment and achievement dates cannot be in the future. Target date is on or after the start date. An accomplishment date before the start date is rejected with a plain message (“can't be before the start date”).

### 5.3 Accomplishments without double counting
`Accomplishments = {goals where status = accomplished} ∪ {achievements}`, each keyed by its own record id, sorted by date (newest first). A goal never creates an achievement record and an achievement is never a goal, so a single record can only be counted once. Reopening a goal removes it from the set; re-accomplishing puts it back with its new date.

### 5.4 Inspiration
- **Start from a milestone:** search or pick any milestone from the existing library (displayed wording). This opens Create a goal with the name prefilled (editable) and the milestone linked. Linking never changes the milestone record. Nothing is preselected or assigned; the list is not filtered by age unless the parent chooses “Upcoming for [name]”.
- **Ideas to get you started:** a short list of **original, app-written** examples (about eight), labelled “Written for this app as examples. They aren't recommendations from CDC or any medical organization.” They contain no ages, frequencies or developmental claims. Draft text is in decision D8.
- “Use this idea” opens Create a goal prefilled; nothing is saved until the parent saves.

---

## 6. Exercise lifecycle and tracking models

### 6.1 Record (`customItems`, `kind: 'exercise'`)
```ts
interface Exercise extends RecordEnvelope {
  childId: string; kind: 'exercise';
  title: string;                         // required
  appCategory: AppCategory | null;       // five areas; stretching/mobility under Gross motor
  instructions: string;
  origin: 'recommended' | 'parent' | 'provider';
  providerName: string;                  // optional: “Dr. Rivera, physical therapy”
  source: null | {                       // only for 'recommended'
    activityId: string;                  // e.g. 'cdc22-act-a042'
    sourceRecordId: string;              // the CDC tip record adopted
    contentVersion: string;              // activity content version at adoption
    instructionsEdited: boolean;         // true once the parent edits the text
  };
  goalIds: string[];
  tracking: { method: 'simple' } | { method: 'timer'; targetSeconds: number | null } | { method: 'reps'; targetReps: number | null };
  schedule: ScheduleVersion[];           // section 8; [] means “as needed”
  archivedAt: string | null;
}
```
- **Origin wording in the app:** “Created by you”, “From your provider: [name]” (with “The app hasn't reviewed these instructions.”), or “From CDC's activity tips”. Provider-directed exercises show a quiet note: “Follow the instructions you were given. This app doesn't check or change them.”
- **Adopted recommendations** copy the display wording into `instructions` so they keep working if content is later revised. While unedited they show CDC attribution; once edited they show “Adapted by you from a CDC activity”, with a link to the original activity page. No CDC attribution is attached to the parent's own wording.
- **Nothing therapeutic is prefilled.** Targets, durations, repetitions and frequencies are empty unless the parent enters them. Adopted activities default to Simple and As needed.

### 6.2 Completion record (`completions` store)
```ts
interface ExerciseSession extends RecordEnvelope {
  childId: string;
  customItemId: string;          // the exercise
  occurrenceDate: LocalDate;     // the local day the session belongs to
  slotKey: string;               // logical key: '2026-11-27#1' (scheduled slot 1) or 'extra:<uuid>'
  method: 'simple' | 'timer' | 'reps';
  durationSeconds: number | null;
  reps: number | null;
  targetSnapshot: number | null; // target at the time, for honest history
  note: string;                  // optional, erasable
  entry: 'live' | 'manual';      // timer/counter vs typed in
  reversedAt: string | null;     // un-completion marker (tombstoned state, plan R3 #3)
  correctsSessionId?: string;    // when a session was moved to another day
}
```

### 6.3 Lifecycle
| Action | Behavior |
|---|---|
| Create / edit | Atomic save; `itemEvents` `created`/`edited`. Changing tracking method affects future sessions only |
| Adopt a recommendation | Create exercise prefilled from the activity; parent can change tracking, schedule, goals before saving |
| Record completion | See §8.4. One tap for Simple; Save session for timer/reps |
| Reverse (undo) a completion | “Undo” toast for a few seconds, and “Remove this session” in the exercise's history. Sets `reversedAt`; the slot is free again. Re-recording the same slot revives the same record (stable logical key) |
| Correct a session | Edit duration, count or note in place (history entry). Moving to another day = reverse the old + create a new one linked by `correctsSessionId` |
| Review history | Exercise detail → “Sessions” list by date (newest first), reversed sessions shown as removed only in the collapsed history (consistent with current behavior; R-009 stays deferred) |
| Pause / resume | New schedule version (§8.3). Paused exercises can still be recorded as additional sessions |
| Archive / restore | Hidden from Today's routine and My exercises (shown under “Show archived”). History kept and still counted |
| Delete permanently | Two steps in Advanced. Removes the exercise, all its sessions, its history and any tracker state; leaves a content-free tombstone. Charts and counts drop its sessions |

---

## 7. Timer and repetition-counter persistence

### 7.1 Where the in-progress state lives
A new device-local store **`trackerState`** (one row per exercise + slot being tracked), child-scoped so profile deletion and reset remove it. It is **never part of partner sharing**: an in-progress timer is a device fact, not a shared record.
```ts
interface TrackerState {
  id: string;                 // `${exerciseId}|${slotKey}`
  childId: string; exerciseId: string; slotKey: string; occurrenceDate: LocalDate;
  method: 'timer' | 'reps';
  // timer
  running: boolean;
  accumulatedMs: number;      // time banked from earlier running periods
  runningSinceEpochMs: number | null;  // wall clock at the last Start/Resume
  // counter
  count: number;              // ≥ 0
  sessionId: string;          // pre-generated completion id → prevents duplicate saves
  updatedAt: string;
}
```

### 7.2 Elapsed-time strategy (no reliance on a running interval)
- **Elapsed = `accumulatedMs` + (now − `runningSinceEpochMs`) while running.** The on-screen value is recomputed from these stored numbers on every display tick, on `visibilitychange`, `pageshow` and `focus`. The ticking interval only redraws; it never adds time. So backgrounding, a locked screen or a throttled tab cannot lose or gain time.
- **Writes happen only on state changes** (Start, Pause, Resume, Reset, count changes, Save), not every second.
- **App reloaded or reopened while running:** the timer is restored as running, showing wall-clock elapsed time including the time the app was closed, with a notice “The timer kept running while the app was closed” and quick options *Keep*, *Pause* or *Enter time manually*.
- **Clock changes:** while the page stays open, elapsed time is advanced by `performance.now()` deltas (unaffected by clock changes), and the wall-clock anchor is re-based on each state change. Across a reload only wall time exists, so: a negative result (clock moved back) is clamped to the banked time; more than 12 hours of running time shows “This timer ran for a very long time. Check the time before saving,” with the manual entry field open.
- **Day boundary:** a session belongs to the local day it was **started**. A tracker left over from an earlier day shows “Started yesterday” with *Save for [date]* or *Discard*.
- **Elapsed vs completed:** the timer screen always says elapsed time is not a recorded session. Only **Save session** creates a completion.
- **Target reached:** when elapsed ≥ target, the screen changes to “Target reached — save this session?” (*Save*, *Keep going*). No automatic save. While the app is in the foreground a subtle visual cue only; **the app cannot alert you in the background or wake a locked phone** (no push service; iOS PWAs have no background timers). The app says so once, in the timer's help text.
- **Reset** asks for confirmation if more than a few seconds have elapsed.

### 7.3 Repetition counter
- **+1** (large, thumb-reach), **−1** (disabled at 0; counts never go negative), **Reset** (confirm if > 0), **Enter count manually** (whole number 0–9,999).
- Each change is saved immediately to `trackerState`, so a reload keeps the count.
- Reaching the target prompts “Target reached — save this session?”; counting past the target is allowed.

### 7.4 Duplicate prevention
- The completion id is generated when tracking begins (`sessionId`) and written with `add`; a second save attempt finds the same id and is treated as already saved (same approach as Decision #19).
- The Save button is disabled while saving.
- The unique `[customItemId, slotKey]` index makes it impossible to fill one scheduled slot twice, including from two tabs.
- Simple completion fills the first open scheduled slot. When all of today's slots are done, the button becomes “Record another session”, which is a deliberate, separately labelled action.

---

## 8. Recurrence and completion semantics

### 8.1 Schedule versions (stored on the exercise; history is never rewritten)
```ts
type ScheduleVersion = {
  effectiveFrom: LocalDate;               // inclusive
  rule: { kind: 'asNeeded' } | { kind: 'daily' } | { kind: 'weekdays'; days: Weekday[] };
  sessionsPerDay: number;                 // 1–6 when scheduled
  paused: boolean;
};
```
The schedule for a date is the latest version with `effectiveFrom ≤ date`. An empty list means As needed.

### 8.2 Precise behavior
| Situation | Behavior |
|---|---|
| **Start date** | Default today; the parent may choose a later date. Past start dates aren't offered (so no artificial past schedule is created). Before the start date nothing is scheduled |
| **Schedule edit** | Takes effect **from today**: a new version with `effectiveFrom = today` (a second edit the same day replaces that day's version; the history entry keeps both). Earlier days are evaluated with the version in force then, so past participation is never rewritten |
| **Today after an edit** | Today's denominator uses the new version. Sessions already recorded today keep their records; any that no longer fit a slot are shown as additional sessions, so the bar never passes 100% |
| **Pause / resume** | Pause = new version `paused: true` from today; Resume = new version with the earlier rule from today. Paused days have no scheduled sessions and no warnings |
| **Several sessions per day** | Slots `#1…#n` for that date. Each slot can be completed once; the list shows “session 1 of 2” |
| **Reversal** | Sets `reversedAt`; the slot opens again; the bar drops immediately (same calculation) |
| **Backdated completion** | Allowed for any date from birth to today. If that date had an open scheduled slot (by the version in force then), it fills it; otherwise it is an additional session. It never changes today's bar unless dated today |
| **Additional sessions** | `slotKey = extra:<uuid>`; counted in history, the monthly count and charts; never in the daily denominator |
| **Day boundary** | “Today” is the device's local calendar date (`useToday()`), rolled over at midnight and on resume. A new day starts a fresh bar; records remain |
| **Time-zone change / travel** | Dates are stored as local `YYYY-MM-DD` strings and never shift. After travel, “today” follows the device. A day can appear shorter, longer or repeated when crossing zones; this is accepted and documented |
| **Archive** | No scheduled sessions from the archive date; restoring resumes the current version |
| **As needed** | Never scheduled; recordable any time; never on Home |

### 8.3 Today's routine calculation (one pure function used by Exercises and Home)
```
todaysRoutine(exercises, sessions, today):
  scheduled = for each exercise not deleted, not archived:
                v = versionOn(today); if v and not v.paused and v.rule matches today:
                   slots 1..v.sessionsPerDay
  done      = scheduled slots with a non-reversed session whose slotKey = `${today}#k`
  return { scheduledCount, doneCount, items }    // doneCount ≤ scheduledCount by construction
```
- The bar is `doneCount / scheduledCount`. When `scheduledCount = 0`: no bar, the friendly empty state, and **no Home card**.
- Text equivalent always shown: “1 of 3 sessions done”.

### 8.4 Future Calendar integration (not built now)
`occurrencesBetween(exercise, from, to)` returns dated slots from the same versions. Checkpoint 3 can show them on the Calendar without new storage. Optional clock times are not added now: there is no clear need until Calendar and reminders exist (decision D16 confirms).

---

## 9. Verified recommendation inventory and source limitations

### 9.1 Source and reuse review (done before retrieval)
- **CDC “Use of Agency Materials”** (https://www.cdc.gov/other/agencymaterials.html), last reviewed Oct 28, 2026; re-read 2026-11-27. Conditions 1–4 (attribution, prominent non-endorsement, no substantive change, free availability), new-window links and the logo restriction are unchanged from the Checkpoint 2a register.
- **Pages:** the same 12 registered pages (`cdc-ltsae-*`), content last reviewed May 15, 2026, last updated May 16, 2026. Each has a section “Tips and activities — What you can do for your [age]”. This is the source the owner approved for 2b (SOURCE_REGISTER, “Pending verification”).
- **Retrieval:** headless Chromium, as in 2a; text saved to the session scratchpad only. No images, videos or PDFs. No AAP, HealthyChildren or Pathways.org content was accessed.

### 9.2 Findings
- **255 tips** across all 12 ages (16–28 per age).
- **162 tip records proposed for inclusion as 153 activities** (a few identical or near-identical tips at several ages are grouped as one activity listed at each age, each keeping its own wording and provenance).
- **93 tips excluded** as general parenting guidance rather than activities: feeding and nutrition (22), behavior and discipline (22), caregiver self-care and general responsiveness (13), screen time (12), sleep (7), safety (6), routines (5), toilet training (3), permission-style guidance (1), and two tips whose examples use “Mommy”/“Daddy”, which the pronoun-only display layer cannot adapt.
- **Coverage (tip records by CDC age and area):**

| CDC age | Gross | Fine | Cognitive | Language | Social |
|---|---|---|---|---|---|
| 2 months | 1 | **0** | 2 | 4 | 2 |
| 4 months | 4 | 1 | 1 | 5 | 2 |
| 6 months | 4 | **0** | 2 | 4 | 1 |
| 9 months | 2 | 1 | 2 | 4 | 3 |
| 1 year | 2 | 1 | 1 | 4 | **0** |
| 15 months | 1 | 2 | 4 | 6 | 2 |
| 18 months | 2 | **0** | 3 | 4 | 2 |
| 2 years | 2 | 3 | 4 | 2 | 3 |
| 30 months | 4 | 2 | 4 | 4 | 2 |
| 3 years | 1 | 3 | 4 | 5 | 3 |
| 4 years | 3 | **0** | 6 | 3 | 8 |
| 5 years | 2 | 3 | 5 | 4 | 3 |

  Empty cells stay empty (“CDC's tips for this age don't include a … activity”). Nothing is invented to fill them.

### 9.3 What is CDC content and what is app-created
| Field | Origin |
|---|---|
| Instructions | CDC's tip, verbatim or with the validated gender-neutral substitutions only |
| Purpose | Only a CDC sentence from the same tip (“This will help…”, “This helps…”). Omitted when CDC gives none — never written by the app |
| Safety | CDC sentences in the tip (e.g. tummy time: “Do not leave your baby alone…”), plus CDC's page-level sentence for that age: “Try these simple tips and activities in a safe way. Talk with your baby's doctor and teachers…” |
| Reference age | The CDC page (“for your 9-month-old”) |
| Title, area, grouping, materials list | **App-created** organizational wording, labelled as such, like the existing gross/fine motor split. Materials are only words that appear in the CDC text (checked at build time) |

### 9.4 Safeguards in the implementation
- `activities.cdc-2022.json` (verbatim source records, page id, age, CDC wording) + `activities.display.json` (validated substitutions) + `activity-ids.lock.json` (ids pinned to a hash of age and text) + `validateActivities()` at build time: ids, sources, ages, area values, grouping consistency, materials present in source text, no gendered words in display text, no numbers added or removed.
- Attribution on Browse and every activity page (existing `SourceNote` wording pattern), a link to CDC's page (new window), “CDC's original wording” disclosure on adapted items, non-endorsement and free-availability statements, no CDC logo.
- Language: “activities” and “ideas”, never “treatment”, “therapy” or “prescribed”. Browse's subtitle says these are everyday activities from CDC's milestone pages, not individualized advice.
- One tip (4 months: “help them ‘exercise’ (move their body)… Gently bend and move their arms and legs”) is general play, not a therapeutic stretch; it keeps CDC's own words and its “Gently” qualifier, and no duration is prefilled.

### 9.5 Limitations
- CDC does not categorize its tips; area assignment is editorial (decision D3).
- Tips are tied to CDC's 12 ages, not to three-month intervals (decision D2).
- *[Corrected]* Some CDC tips do contain time words (“every day”, “each day”, “for a few minutes”, “a few seconds”; 8 records). They are kept in CDC's text exactly as written and never converted into schedules, targets or prescribed routines; scheduling and targets are left to the parent. (The original line here said CDC gives no frequencies or durations, which was inaccurate.)
- CDC tip text contains one typo (“helps you child”, 4 years); see D4.
- The display adaptation reuses the owner's #86 determination for milestones; extending it to tips is your call (D4).

---

## 10. Personal Progress and historical chart calculations

### 10.1 Personal Progress summary (Progress page, after the SourceNote, replacing the “coming soon” sentence)
| Count | Exactly what is counted |
|---|---|
| **Personal accomplishments** | All-time: goals with `status = accomplished` + achievements; not deleted; archived included (archiving tidies, it doesn't undo); each record once |
| **Active goals** | Goals with `status = active`, not archived, not deleted |
| **Exercise sessions completed this month** | Sessions with `occurrenceDate` in the current local calendar month, not reversed, from exercises that aren't deleted (archived included); scheduled and additional sessions alike |

The card says “Personal goals and exercises never change milestone progress.” No percentages and no bars. Zero values are shown as 0, with the link still available.

### 10.2 Progress over time (one chart at a time)
**Period:** default **last 6 calendar months** including the current month (marked “so far”), with a **1 year** option. Months before the child's birth month are not drawn. (D7.)

| View | Bar for a month = | Not counted |
|---|---|---|
| **Milestones** | CDC milestones whose **current** record is Achieved with `achievedDate` in that month | Emerging; reversed achievements; hidden milestones (shown as “N hidden milestones aren't included”); legacy personal entries |
| **Goals** | Accomplished goals by `accomplishedDate` + achievements by `achievedDate` | Active goals; reopened goals (until accomplished again); deleted records |
| **Exercises** | Non-reversed sessions by `occurrenceDate` (one per session) | Reversed sessions; sessions of deleted exercises |

Labels: “Milestones recorded as achieved”, “Personal accomplishments”, “Exercise sessions recorded”. The Exercises view adds: “This shows participation, not ability.”

**Edge cases**
| Case | Handling |
|---|---|
| Missing historical data | Caption: “A month with no bar has nothing recorded — it doesn't mean nothing happened.” |
| Unavailable vs none | Exercises: months before the first exercise was created on this device are labelled “Before exercises were tracked” instead of 0. Milestones/Goals can be backdated, so only months before birth are unavailable |
| Undated legacy records | An achieved record without a date can't be placed; listed as “N achieved without a date” under the chart. None should exist (dates are required), so this is defensive |
| Backdated / corrected dates | Placed by the current date; history remains on the item's page |
| Reopened goals / reversed milestones / reversed sessions | Disappear from their month immediately |
| Archived | Still counted |
| Permanent deletion | Removed from the chart (the data no longer exists) |
| Hidden milestones | Excluded, with a count (consistent with Progress) — D6 |
| Age-basis change | No effect: charts use calendar dates, not milestone age |
| Schedule changes | No effect: only recorded sessions are counted |
| Future dates | Can't be entered; if found (device clock moved back), shown as “N with a later date” and not drawn |
| Multiple children | Always the selected child only (queries by `childId`) |

**Basis choice (D5):** the 2a plan note (R9) suggested using `stateAsRecordedAt()` (“what had been recorded by then”). For a monthly “achieved per month” chart I recommend the **current, corrected records** instead: a parent who corrects a date or undoes a mistaken achievement expects the chart to reflect it, and the full history stays on the milestone page. `stateAsRecordedAt()` remains available if you prefer the other meaning.

**Chart and accessibility:** hand-built SVG bars using theme tokens (checked by the existing contrast tests in all five themes), a value label on each non-zero bar, `role="img"` with a one-sentence summary, and a “Show as a table” disclosure listing every month and count. No new dependency.

---

## 11. Proposed data model and migration

### 11.1 Stores
| Store | Status | Contents |
|---|---|---|
| `customItems` | existing, unchanged | + `kind: 'goal' | 'achievement' | 'exercise'` (legacy `'milestone'` untouched). Existing milestone code already filters `kind === 'milestone'` |
| `completions` | existing, **index change** | exercise sessions (§6.2) |
| `itemEvents` | **new** | append-only history and Notes & Observations for goals, achievements and exercises (same shape and rules as `milestoneEvents`: `itemId`, `itemKey`, `type`, `eventDate`, `recordedAt`, `deviceId`, `text`, `refEventId`, `erasedAt`, from/to fields) |
| `trackerState` | **new**, device-local | in-progress timers and counters (§7.1) |
| `milestoneRecords`, `milestoneEvents` | unchanged | only touched by the legacy conversion/deletion actions (§12) |

### 11.2 Why a schema change is required
1. Multiple sessions per day and additional sessions need a logical key other than `[customItemId, occurrenceDate]`, which the existing **unique** index forbids.
2. Goal/exercise history must be separate from milestone history so that no existing milestone calculation or Home card can be affected.
3. Tracker state needs its own child-scoped store so that it is erased with the profile and never mixed with shareable records.

The v2-only alternative (putting a slot number inside `occurrenceDate`, history inside `milestoneEvents`, tracker state inside `settings`) is possible but would misuse field meanings and risk milestone side-effects; I don't recommend it.

### 11.3 Version 3 migration (inside the atomic `versionchange` transaction)
1. Create `itemEvents` (`keyPath: id`; indexes `byChild`, `byItem`).
2. Create `trackerState` (`keyPath: id`; index `byChild`).
3. On `completions`: delete index `byItemAndOccurrence`; create unique `byItemAndSlot` on `['customItemId','slotKey']`; create `byChildAndDate` on `['childId','occurrenceDate']`.
4. Add both new stores to `CHILD_SCOPED_STORES`.

No existing record is read, rewritten or converted. `completions` is empty in every existing installation (no released version writes to it); the migration does not depend on that, and any row would be kept. If any step fails, IndexedDB aborts and the database stays at version 2 unchanged.

### 11.4 Integrity properties
| Property | How |
|---|---|
| Logical uniqueness | `[customItemId, slotKey]` for sessions; one goal/exercise per id; no automatic combining of look-alike goals (future merge flags them as possible duplicates, plan §8.1a) |
| Stable ids | UUIDs; activity ids locked by `activity-ids.lock.json`; `itemKey` = `goal:<id>` / `achievement:<id>` / `exercise:<id>` |
| Profile isolation | Every record has `childId`; every query uses `byChild`; profile deletion clears all child-scoped stores including the new ones |
| Atomicity | Every multi-record write via `runAtomic` (session + event; delete + links; conversion) |
| Failure recovery | A failed save leaves no partial record and keeps the parent's typed text (lesson from challenge #22); the tracker state survives a failed save |
| Reversals and tombstones | Session `reversedAt`; item tombstones keep only id, kind, child id and timestamps (and `convertedToItemId` for converted legacy entries), so an older partner file can't resurrect them |
| Field-level merge (Checkpoint 5) | Plain fields + `rev`; schedules are versioned lists (append-only by `effectiveFrom`); `goalIds` treated as a set; history append-only |
| Permanent erasure | Erase of note text overwrites it (same rules as #55/#81/#88). Deleting a goal/exercise removes its text-bearing records. Erasure scope stays limited to one child / one item / one entry lineage |
| Backup/import/sharing | Nothing built now. `trackerState` is excluded from future exports by design |

### 11.5 Database version: **3** (D1).

### 11.6 Upgrade safety
- Add `blocked`/`blocking` handling to `openRcrDb`: if another tab still has the old version open, show “Please close other copies of the app to finish updating” instead of hanging; an open v3 tab closes its connection and asks to reload if a newer version needs it.
- Opening a v3 database with an older app version is not supported (IndexedDB refuses a lower version). Because updates only activate after **Refresh** and the service worker serves one version at a time, this should only arise with an old tab left open; it will be documented.

---

## 12. Legacy personal milestone entries

**Where:** only in the existing “Your personal entries” area (Library section → the personal entry's page). A collapsed **“Manage this entry”** section on that page offers **Move to My Goals** and **Delete permanently**. Nothing is converted or deleted automatically, and personal milestone creation stays removed.

### 12.1 Conversion
- **Preview first:** “This will move ‘[title]’ to My Goals as [an accomplishment on Mar 3, 2026 | a goal you're working toward]. Its notes and history come with it. It will no longer appear in the Milestone Library.” [Move] [Cancel].
- **Mapping**
  - Status **Achieved** → an **Achievement** dated with its recorded achievement date.
  - Status **Emerging** or **Not yet** → an **active goal** with **no start date** (“Start date not recorded”), which the parent may add later. No date is invented.
  - Title, description and area are copied. `derivedFromDefId` (if any) becomes the goal's milestone link, labelled “Related milestone”, with no effect on that milestone.
- **Notes, observations and history:** every related `milestoneEvents` entry (observations, edits, removals, erase markers, status changes, the undated legacy note) is copied into `itemEvents` with new ids, the original `eventDate` and `recordedAt`, and `migratedFromEventId`. Status changes appear as “Recorded as Emerging on … (as a personal milestone entry)”. Erased text stays erased (null is copied, never recovered).
- **Atomic and idempotent:** one transaction across `customItems`, `milestoneRecords`, `milestoneEvents` and `itemEvents`: create the new record and events; replace the legacy item by a tombstone with `convertedToItemId` and no text; delete its milestone record and events. Repeating the action finds the tombstone and returns the existing result, so duplicates can't arise.
- **No double counting:** legacy entries were never counted in Progress; after conversion the new record is counted once in Personal Progress and the Goals chart.
- **Reversibility:** there is no automatic “undo conversion” (it would have to rebuild milestone-style records). The preview and confirmation guard against mistakes, and the converted record can be edited, reopened, archived or deleted (D9).
- **Never official:** the result is a personal goal or achievement; it never becomes or marks a CDC milestone.

### 12.2 Permanent deletion
Two-step confirmation (“Delete ‘[title]’ and its notes permanently? This can't be undone.”). One atomic transaction removes the record, its milestone record and all its events (including text); a content-free tombstone remains. Covered by the existing erasure-scope regression pattern (only that entry is affected).

### 12.3 Sharing implications (Checkpoint 5)
Tombstones carry `convertedToItemId`, so a partner device can apply the same conversion instead of re-importing the old entry, and a deleted entry can't be brought back by an older file.

---

## 13. Home integration
- **Placement:** directly after **Quick actions** and before **Milestone progress**. It is the day's most actionable item, and inserting one card there moves the existing cards down without changing them.
- **Shown only when** `todaysRoutine(...).scheduledCount > 0` for the selected child today.
- **Contents:** heading “Today's exercises”, “1 of 3 sessions done”, one bar (same component and calculation as Exercises), **View today's routine** → `#/growth/exercises/today`, which focuses the Today's routine section.
- No exercise names, timers, counters, goals or library on Home. Quick actions and every other Home element stay as they are. The card updates at midnight and after any completion (same change notification pattern as milestones).

---

## 14. Testing and human acceptance strategy

### 14.1 Unit tests (Vitest, fake-indexeddb; fictional data)
| Area | Examples |
|---|---|
| Schema v3 | Upgrade from a real v2 database: existing stores byte-identical, new stores empty, new indexes present; failure mid-upgrade leaves v2; v1 → v3 path; `CHILD_SCOPED_STORES` complete |
| Goals/achievements | Create/edit/accomplish/correct/reopen/archive/delete; date rules; accomplishments union without double counting; deleting removes links and text |
| Recurrence | `versionOn`, weekday rules, multiple slots, start date, pause/resume, same-day edits, edits never change past evaluations, leap days, month ends, DST dates |
| Completions | Slot filling, extra sessions, reversal and revival, backdating into an open slot vs additional, moving a session, unique index rejects duplicate slots, duplicate `sessionId` treated as saved |
| Today's routine | Denominator, cap at 100%, reversals, paused/archived/as-needed excluded, empty state |
| Timer model | Elapsed from stored anchors; pause/resume accumulation; reload while running; clock moved back (clamp) and forward (> 12 h notice); day rollover |
| Counter | Never negative; persistence; reset |
| Charts | Each view's monthly buckets; hidden, reversed, reopened, archived, deleted, future and undated cases; six-month and one-year windows; birth month cut-off; unavailable months for exercises |
| Content | `validateActivities` (ids, lock, sources, ages, areas, materials-in-text, display substitutions, no gendered words, grouping); browse default age for each age case |
| Legacy conversion | Mapping per status, full history copy with erased text staying null, idempotency, atomic failure, tombstone, no Progress change |
| Isolation and erasure | Child A's actions never touch child B; profile deletion clears new stores; erase scope unchanged |
| **Unchanged behavior** | `currentProgress`, `progressByReferenceAge`, `recentProgressEvents` and Library counts give identical results before and after adding goals, exercises and conversions |

### 14.2 End-to-end tests (Playwright, headless Chromium, 390×844 plus the existing responsive sizes)
Goal and achievement flows; inspiration adoption; exercise creation (each method and schedule); adoption from Browse (default age, all ages, empty area message, accordions collapsed and fully clickable); tracker sheet (timer with simulated clock including backgrounding and reload; counter; target prompt; no auto-save); daily bar and **Home card equality** with the Exercises page; reversal updates both; midnight rollover; Progress summary counts; Progress over time (three views, two periods, table equivalent); legacy entry conversion and deletion; profile switching isolation; offline operation after install (existing service-worker harness); **upgrade from the accepted 2a build `53d6212`** with existing data preserved and 2b features working; axe checks on every new page in all five themes; no horizontal scrolling on new pages at 320 and 390 px.

### 14.3 Existing tests that legitimately change (intentional requirement changes)
| Test | Why |
|---|---|
| `growth.spec.ts:52–53`, `growth-refinement.spec.ts:104–115`, `review-regressions.spec.ts:343` | Assert Goals & Exercises is a non-clickable “Coming soon” placeholder; it becomes a live link (order and subtitles still asserted) |
| `growth-refinement.spec.ts:265` | Asserts Progress's “coming soon” sentence, replaced by the Personal Progress card |
| `storage.test.ts:31` (store list), `growth-refinement.spec.ts:68` (store names) | Two new stores |
| `acceptanceRefinements.test.ts:156`, `perChildTheme.test.ts:40`, `update.spec.ts:279, 416` (`version` is 2; stores byte-identical after update) | Version becomes 3. Rewritten to assert: existing stores byte-identical, version 3, new stores empty. The v1→v2 theme test opens version 2 explicitly so it still tests that migration |
| Library personal-entries text test, if any asserts “coming soon” | The sentence becomes “New goals and achievements live in My Goals” |

No other existing test should change. The target is the existing 437 tests (with the edits above) passing alongside the new ones, three consecutive full runs, as in 2a.

### 14.4 Human acceptance checklist (concise; Mac Safari first, then iPhone when deployed or on the local network)
1. Growth → Goals & Exercises shows My Goals then Exercises with their subtitles.
2. Create a goal with only a name; it appears under Working toward.
3. Mark it accomplished (choose a past date); it moves to Accomplishments with that date. Reopen it.
4. Record an achievement without a goal; it appears in Accomplishments, with no start date anywhere.
5. Inspiration: start a goal from a milestone; the milestone's status doesn't change.
6. Create a parent exercise (Simple, every day) and a provider exercise (Repetitions, Mon/Wed/Fri, 2 sessions).
7. Browse Exercises opens at the child's age with all areas collapsed; open one activity and add it.
8. Today's routine: complete one session, undo it, complete it again; the bar matches each time.
9. Timer: start, lock the phone/switch apps for a minute, return; time is right; reaching the target asks before saving.
10. Counter: −1 stops at 0; reload mid-count keeps the count.
11. Home shows Today's exercises with the same numbers; it disappears on a day with nothing scheduled.
12. Change a schedule; yesterday's history is unchanged.
13. Progress: existing cards unchanged; Personal Progress counts match; View progress over time shows each view and the table.
14. A legacy personal entry (from upgrade data): Move to My Goals keeps its notes; another: Delete permanently.
15. Switch child: nothing from the first child appears.
16. Each of the five themes on the new pages; text readable, controls comfortable one-handed.
17. Airplane mode after install: create and complete an exercise; data remains after relaunch.

Results are recorded only as you report them.

### 14.5 Documentation during implementation
BUILD_LOG entry with real results; challenges continue to be classified (confirmed defect, testing defect, AI self-correction, environmental limitation, design refinement, process safeguard); DECISIONS #89+; SOURCE_REGISTER activity rows; KNOWN_LIMITATIONS (timers in background, travel days, downgrade); TESTING_CHECKLIST; HANDOFF.

---

## 15. Risks and dependencies
| Risk | Mitigation |
|---|---|
| First schema change since v2; upgrade on real devices | Additive migration, atomic; upgrade test from the real accepted build; blocked-upgrade message; **manual upgrade check on iPhone remains a human step** |
| Timer behavior on iOS when backgrounded/locked | Timestamp-based design; tested with simulated clocks in Chromium only; needs physical iPhone confirmation |
| Content volume and editorial assignments (153 activities) | Owner review of Appendix A before implementation; build-time validation; bundle grows by an estimated 50–70 KB raw (≈15 KB gzip) |
| Scope size (largest checkpoint so far) | One phase but strict build order (§16), commits per step, full test runs between steps |
| Notes & Observations reuse repeats R-009 behavior on new pages | Consistent with accepted behavior; R-009 stays deferred |
| Context transfer mid-implementation | Local commits per step; propose preservation pushes (with your authorization) at safe points |
| Physical-device acceptance of 2a still pending | Not blocking 2b development; recorded as pending throughout |
| Dependencies on you | Plan approval, decisions in §17, Appendix A review, later push/merge/deploy authorizations |

---

## 16. Recommended implementation sequence
**Recommendation: one coherent implementation phase after approval**, ending with one owner review. Your sequence is kept, preceded by the shared foundation:

0. **Foundation:** schema v3 + upgrade handling + shared history/Notes helpers + upgrade tests (everything else depends on it).
1. Personal goals and standalone achievements.
2. Exercises, scheduling, sessions, timer and counter.
3. Verified activity content (data files, lock, validation) and Browse Exercises; goal inspiration.
4. Today's routine and the Home card.
5. Personal Progress summary and Progress over time.
6. Legacy entry management; integrated regression, accessibility, theme and responsive passes; screenshots; documentation; three full test runs.

There is no technical need for separate owner review cycles. The only things that must be settled **before** step 0 are the decisions in §17 (especially D1 and the Appendix A content review, D3/D4). If you prefer, a single preservation push after step 0 (with your authorization) would reduce transfer risk.

---

## 17. Decisions

### 17.1 Already approved (not reopened)
All product decisions in the Checkpoint 2b brief (navigation, page hierarchies, fields, three tracking methods, four scheduling options, the daily bar rule, the Personal Progress counts, one chart at a time, the Home card's content, legacy entry options, no streaks/percentages/scores, source restrictions, no new dependencies unless approved).

### 17.2 Unresolved technical or content decisions (recommendation first)
| # | Decision | Recommendation |
|---|---|---|
| **D1** | Schema change | Approve **database version 3** as in §11 (additive; existing records untouched) |
| **D2** | Browse age selector | Use **CDC's 12 ages** (+ All ages), defaulting to the latest CDC age the child has reached (milestone age; 2 months before 2 months or before the due date, with a note; 5 years after 60 months). Reason: the three-month interval rule would show, for example, a 7-month-old CDC's tips “for your 9-month-old” (such as pulling up to stand), earlier than CDC's stated age. This is a safety-motivated deviation from “use the three-month intervals where appropriate” |
| **D3** | Appendix A: inclusion, exclusions, titles, areas, grouping | Review and approve (or edit) the 153 activities; area assignment is editorial, like the gross/fine split |
| **D4** | Gender-neutral display for activity text | Apply the same validated method as milestones under the reasoning of Decision #86 (pronouns + verb agreement only), extending the agreement rule for “tries → try” and “copies → copy”. Show CDC's typo (“helps you child”) verbatim unless you approve a disclosed typographical correction |
| **D5** | Milestones chart basis | Current corrected records (not `stateAsRecordedAt`) |
| **D6** | Hidden milestones in the chart | Exclude, with a visible count |
| **D7** | Chart period | 6 months (default) and 1 year; no “all time” for now |
| **D8** | Inspiration content | Two sections: “Start from a milestone” and about eight original ideas, e.g. “Read a book together every day”, “Play outside together”, “Learn a new song”, “Try a new art activity”, “Visit the library”, “Play with other children”, “Practice a new word or sign”, “Try a new outdoor game”, labelled as app-written examples. You approve the final list |
| **D9** | Legacy conversion details | No undo (preview + confirm instead); Emerging/Not-yet → goal with no start date; `derivedFromDefId` → related milestone |
| **D10** | Delete safeguards for goals, achievements, exercises, legacy entries | Two-step confirmation in a collapsed Advanced/Manage section, without typing a phrase (typing stays for profiles and reset) |
| **D11** | When schedule edits take effect | From today (history before today unchanged) |
| **D12** | Timer found running after the app reopens | Keep running, show the “kept running while closed” notice with Keep / Pause / Enter manually |
| **D13** | Home card placement | After Quick actions, before Milestone progress |
| **D14** | Archived items | Still counted in totals and charts (deleted items are not) |
| **D15** | Live lines on the Goals & Exercises cards | “2 working toward · 5 accomplished” and “Today: 1 of 3 done” / “Nothing scheduled today” |
| **D16** | Optional clock times and maximum sessions | No clock times in 2b (Calendar/reminders first); up to 6 sessions per day |

**Requested next step:** your approval of this plan (with any changes to D1–D16 and Appendix A). I'll then implement in one phase, stop for your review, and make no push, merge or deployment without separate authorization.
