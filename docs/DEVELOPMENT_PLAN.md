# Development Plan — Roll, Crawl, RUN: Tracking Growth Together (Revision 2)

> **Current status (2026-11-28, Checkpoint 4-R):** the owner's Mac Safari acceptance of Checkpoint 4 passed 23 checks, failed J11 and left 7 untested. Refinements R-024 (four single-selection views), R-025 (tinted Care Note cards) and R-026 (editor reopening after a child switch) are implemented in a second local commit (R20) and await the owner's reacceptance. Nothing is pushed, merged or deployed. Database version 3 unchanged. The current-state handoff is `docs/HANDOFF.md`.

> *Previous status line (2026-11-27, kept as recorded):* **Current status (2026-11-27, Checkpoint 4 implemented):** Checkpoint 4 (Journal; Resources removed from the primary navigation; R19) is **implemented in a local commit and awaits the owner's secondary review and Mac acceptance**. Nothing is pushed, merged or deployed. Database version 3 is unchanged. Checkpoint 5 remains deferred until after submission; Checkpoint 6 is final acceptance and publication. The current-state handoff is `docs/HANDOFF.md`.

> *Previous status line (2026-11-27, Checkpoint 3 closeout, kept as recorded):* **Current status (2026-11-27, Checkpoint 3 closeout):** Checkpoint 3 (Simplified Calendar) and refinements R-019 to R-022 are **formally accepted** for the submission version and preserved on `claude/great-dijkstra-wwi9g1` (R18). Not merged into `main`; not deployed. **Next: Checkpoint 4 (Journal; Resources removed from navigation)**, in a fresh conversation, with the owner-approved design in R18. Checkpoint 5 is deferred until after submission; Checkpoint 6 is final acceptance and publication. The current-state handoff is `docs/HANDOFF.md`.
>
> *Previous status line (2026-11-27, Checkpoint 3-R, kept as recorded):* **Current status (2026-11-27, Checkpoint 3-R):** Checkpoint 3 (Simplified Calendar, R16) was accepted by the owner in Mac Safari (CAL1–CAL33 passed; keyboard and offline editing not human-tested; iPhone deferred to Checkpoint 6). The resulting presentation refinements R-019 to R-022 (R17) are implemented in a second local commit on `claude/great-dijkstra-wwi9g1` and await the owner's visual acceptance before formal closeout; nothing is pushed, merged or deployed. Checkpoints 1–2b-R are as described below. Next, each needing authorization: acceptance of Checkpoint 3, then Checkpoint 4 (Journal; Resources removed from navigation) and Checkpoint 6. The current-state handoff is `docs/HANDOFF.md`.
>
> *Previous status line (2026-11-27, after the 2b-R closeout, kept as recorded):* **Current status (2026-11-27, after the 2b-R closeout):** Checkpoint 1 is completed, accepted and deployed (`e40287f`). Checkpoints 2a, 2b and 2b-R are accepted by the owner in Mac Safari (2b-R: GR1–GR15 passed against `b45af43`); all physical-iPhone checks are deferred to Checkpoint 6. Nothing after Checkpoint 1 is merged or deployed. **Submission scope (R15):** Checkpoint 3 (Simplified Calendar) is next, then Checkpoint 4 (Journal; Resources removed from navigation) and Checkpoint 6 (final testing, deployment, iPhone acceptance). Checkpoint 5 and Resources are deferred until after submission. The current-state handoff is `docs/HANDOFF.md`.
>
> *Previous status line (2026-11-27, Checkpoint 2b-R implementation, kept as recorded):* **Current status (2026-11-27, Checkpoint 2b-R):** Checkpoint 1 is completed, accepted and deployed (`e40287f`). Checkpoint 2a is accepted for Mac usability (physical iPhone acceptance pending); not merged, not deployed. Checkpoint 2b (R13) passed the owner's initial Mac Safari acceptance (64 of 65 applicable checks; preserved on `claude/upbeat-thompson-skpm8j` at `64202e2`). The resulting refinements R-010 to R-017 (R14, Checkpoint 2b-R) are implemented in a local commit and await the owner's acceptance; not pushed, merged or deployed. Physical iPhone acceptance of 2a and 2b is pending. Checkpoints 3–6 are planned and not started. The current-state handoff is `docs/HANDOFF.md`.
>
> *Previous status line (2026-11-27, before 2b-R, kept as recorded):* **Current status (2026-11-27):** Checkpoint 1 is completed, accepted and deployed (`e40287f`). Checkpoint 2a is accepted for Mac usability (physical iPhone acceptance pending); not merged, not deployed. Checkpoint 2b (R13) is implemented locally and awaiting the owner's acceptance; not pushed, merged or deployed. Checkpoints 3–6 are planned and not started. The current-state handoff is `docs/HANDOFF.md`.
>
> *Previous status line (2026-11-26, kept as recorded):* Checkpoint 2a, including the Growth UX refinement (R11), was implemented and awaiting the owner's acceptance testing.
>
> *Historical status at the end of Checkpoint 1 (kept as recorded):*
> - Checkpoint 1 is implemented, **accepted** after the owner's Mac Safari testing, and **deployed** at https://jcandm1088.github.io/roll-crawl-run/ (repository: https://github.com/jcandm1088/roll-crawl-run).
> - The owner's physical iPhone checks passed: install, launches, persistence, and offline launch and navigation.
> - Checkpoints 2–6 are not implemented. *(Superseded: see the current status above.)*
> - Handoff notes are in `docs/HANDOFF.md`. *(The end-of-Checkpoint-1 handoff is now `docs/reviews/CHECKPOINT_1_HANDOFF.md`.)* *(The original header said “PLAN ONLY — no application code has been written”; that was true when this plan was first written.)*
> Revision 2 incorporates your decisions on D1–D15 and your requested revisions (vaccination references, age navigation, journal privacy & export modes, partner collaboration, technical safeguards, review checkpoints). Changes from Revision 1 are marked **[R2]**.
> *(Historical)* At planning time the workspace was empty.

## R3 — Approved decisions and clarifications (supersede conflicting text below)

**Status: Revision 2 approved as modified here. Authorized scope: Checkpoint 1 (Design & Foundation) ONLY.** Stop after Checkpoint 1 and deliver the 11 requested items; do not start Checkpoint 2 without express authorization.

**Q1–Q11 resolved:** Q1 ✔ (no computed dates for conditional/product-dependent/seasonal/shared-decision items; item mapping at CP3) · Q2 ✔ (no automatic vaccine source; parent must choose on first enable) · **Q3 modified: well-child visit references ON by default; vaccination references OFF until enabled + source selected; all four layers independently toggleable** · Q4 provisional (verify/document bounds; validation ≠ clinical guidance; never silently alter user input — out-of-range input is rejected with an explanation, not adjusted) · Q5 ✔ (chronological age for care references, source qualifications noted; explained when corrected age is on) · Q6 ✔ full scope; raise concerns before any reduction · Q7 ✔ 5 snapshots · Q8 ✔ blank by default · Q9 ✔ opt-in + warning · Q10 ✔ checked by default · Q11 ✔ verify at CP3, recheck at CP6, report changes before incorporating.

**Implementation clarifications:**
1. Three-way merge keeps a **field-level common-ancestor snapshot** per record per peer (not only hash/rev) — schema for this is created in Checkpoint 1.
2. Tests (CP5) cover repeated, delayed, and out-of-order exchanges, including independently resolved conflicts followed by further exchanges.
3. Exercise/event completions are reversible; un-completions and deletions are recorded as tombstoned state so older partner files cannot undo them.
4. Export privacy controls cascade to all associated data — history, metadata, tombstones, aliases, merge bases, embedded backups — so excluded data (e.g., reflections) cannot leak through related records; tests assert this.
5. Native calendar reminders/alarms are platform-dependent until verified on devices; never guaranteed.
6. Source verification and usage-permission review remain mandatory gates before any developmental/medical content.

**Visual direction (CP1):** premium, warm, calm, adult-oriented; no cartoon imagery, not clinical, not generic dashboard. Five cohesive theme systems (Earth default, Sky, Blush, Lavender, Sage) sharing typography, spacing, iconography, components, buttons, navigation. Fraunces (display) + Inter (UI), subject to review. Initial app icon + wordmark preserving "Roll, Crawl, RUN: Tracking Growth Together". Safe-area insets, ≥44–48px targets.

**Checkpoint 1 build list:** scaffold (Vite/TS/Preact, Vitest, Playwright); fonts self-hosted (fetched from npm `@fontsource` packages, OFL); icon/wordmark (SVG → PNG sizes generated with Playwright); design tokens + 5 themes + contrast test; app shell (top bar with child chip + settings, bottom nav, hash router); placeholder tabs clearly labeled "Coming in a later checkpoint"; onboarding (DOB, name/photo, corrected age, theme, privacy); profiles create/edit/switch/delete (typed confirmation; backup purge option present but backups feature labeled pending); age domain (chronological + corrected with safeguards); IndexedDB schema v1 for all planned stores with logical-key indexes and atomic transaction helper; repositories for meta/settings/children/photos; storage-persistence status; privacy disclosures in Settings; manifest + basic service worker (precache, update banner); unit + e2e tests; mobile screenshots via Playwright at deviceScaleFactor 2; docs skeletons (README, BUILD_LOG template, TESTING_CHECKLIST, KNOWN_LIMITATIONS, DECISIONS, SOURCE_REGISTER). Code lives in `/home/user/roll-crawl-run` (git init locally; no push until you provide the remote).

---

## R20 — Checkpoint 4-R: Journal human acceptance refinements R-024 to R-026 (implemented 2026-11-28; awaiting owner reacceptance)
**Why:** the owner's Mac Safari acceptance of `7e9eb87` (Decision #169): 23 passed, J11 failed, 7 not tested; plus two observations made in ordinary use.
- **R-024:** four primary views, one at a time: All, Personal Reflections, Care Notes, Unanswered questions (n). Unanswered questions is a subset of Care Notes, never a third type (inclusion table in Decision #170). Search, dates and tags combine with any view and survive a change of view.
- **R-025:** Care Note cards are tinted across the whole card; Personal Reflections stay light; all five themes; existing tokens only (#171).
- **R-026:** the Home shortcut's one-time “new entry” request is now used exactly once, so switching children can no longer reopen the editor (#172). Reproduced on the baseline before the change.
- **Not changed:** the database, stored records, deletion, validation (including the required date), the editor, and the Calendar. The Calendar's equivalent shortcut has the same defect and is recorded as R-027 for separate authorization (#173).
- **Report:** `docs/reviews/CHECKPOINT_4_R_REFINEMENT_REPORT.md`.

---

## R19 — Checkpoint 4: Journal, and Resources removed from the navigation (implemented 2026-11-27; awaiting owner acceptance) — implements R18
**Built (Decisions #154–#168; report in `docs/reviews/CHECKPOINT_4_IMPLEMENTATION_REPORT.md`):**
- **Journal:** one feed per child, newest entry date first. Personal Reflections and Care Notes with their own label, icon and subtle treatment. Create, view, edit, delete with confirmation. A date (today by default, earlier allowed, never later), optional title, free-form text up to 20,000 characters, optional tags.
- **Finding entries:** search by title and text; filters for type, unanswered provider questions, dates and tags, alone or combined; empty and no-results states.
- **Provider questions:** a flag on Care Notes, an answered status that changes only that field, and an always-visible “Unanswered questions (n)” filter.
- **Safety:** child-keyed screen, modal editors, child-checked atomic writes, typed text kept after a failed write, a discard-changes question, outright deletion.
- **Privacy:** one notice on the Journal; Settings → Privacy updated.
- **Navigation:** four primary tabs (Home, Growth, Calendar, Journal). Resources removed; its old address opens Home. Home's “Journal entry” shortcut is live; the “Daily encouragement” placeholder is removed.
- **Data:** the existing `journal` store; **database version 3, no migration**.

**Not built (out of scope):** photographs or other attachments (R-023), Calendar or Growth integration, AI or medical analysis, mood or medication tracking, recurrence, reminders, sharing, backup, restoration, exports, synchronization, a Resources library, automatic drafts, version history.

**Preserved for later:** Personal Reflections excluded by default from all three export workflows, including full backups (#165); the Resources requirements in §6.13.

**Sequence:** owner acceptance of Checkpoint 4 → (Checkpoint 5 deferred until after submission) → Checkpoint 6.

---

## R18 — Checkpoint 3 formal acceptance and the approved Checkpoint 4 Journal design (owner, 2026-11-27) — supersedes conflicting §6.12–6.13 and R4 Journal and Resources text
**Checkpoint 3:** formally accepted with R-019 to R-022 (Decisions #148–#150). Evidence, kept separate: owner Mac Safari (CAL1–CAL33; CR1–CR5, CR7–CR9), delegated secondary review (CR6b), automated results (BUILD_LOG). Carried to Checkpoint 6: keyboard and offline editing confirmed by a person, physical iPhone, vaccine schedule currency recheck.

**Checkpoint 4 — Journal (approved design, not yet built; Decision #151):**
- One combined chronological feed, newest first.
- Personal Reflections and Care Notes, visually distinguishable.
- Optional title, free-form text, a date, optional parent-created tags.
- Create, view, edit, delete.
- Search and filtering by type, date, tags and text.
- Care Notes: a provider-question flag, an answered status, and an accessible unanswered-question filter.
- Child-specific isolation and offline persistence.
- Resources removed from the primary navigation; necessary source attribution preserved.
- **Not included:** integration with Growth or the Calendar; photo attachments (R-023, deferred; reconsider with or after backup and restoration); sharing or export (Checkpoint 5).

**Sequence:** Checkpoint 4 → (Checkpoint 5 deferred until after submission) → Checkpoint 6 final acceptance and publication.

---

## R17 — Checkpoint 3 human acceptance refinements R-019 to R-022 (implemented; accepted 2026-11-27, see R18) — supersedes conflicting R16 wording
**Authorization:** owner, 2026-11-27, after Mac Safari acceptance of `c5017da` (CAL1–CAL33 passed; CAL34–CAL35 not human-tested; CAL36 deferred). Decisions #138–#144; report `docs/reviews/CHECKPOINT_3_R_REFINEMENT_REPORT.md`.

**Built (presentation only):** R-019 parent-friendly vaccine language with one visible disclaimer and a visible **Source** line (details expandable); R-020 cross, heart and diamond symbols; R-021 “Upcoming Appointments” on Home; R-022 Settings Calendar spacing.

**Unchanged:** database version 3 and all records; the vaccine source version, ages, qualifications and date arithmetic; overlays; event management; profile isolation; Growth.

**Still required:** the Checkpoint 6 schedule currency recheck; physical-iPhone acceptance.

---

## R16 — Checkpoint 3: Simplified Calendar (implemented; accepted on Mac 2026-11-27, see R17) — supersedes conflicting §6.8–6.11, R3 Q1–Q3/Q5/Q11 and R4 Calendar text
**Authorization:** owner, 2026-11-27, after the initialization and preparation reports (Decisions #125–#137). Report: `docs/reviews/CHECKPOINT_3_IMPLEMENTATION_REPORT.md`.

**Built:**
- **Calendar tab:** month grid (Sunday first), previous/next month, today and selected-day indicators, “Go to today”, the selected day's events, Upcoming (today and later; five shown, “Show all”), one **Add event** action.
- **Three independent overlays**, remembered per device: Recommended vaccine schedule (off by default), Medical appointments, Personal. Hiding only filters the view.
- **Parent-entered events:** medical appointments (including therapy sessions entered by hand) and personal events; title, date, optional time, location and notes; create, view, edit, delete (confirmation; removed outright).
- **Vaccine schedule reference:** CDC's July 2, 2025 schedule (parent-facing page, cross-checked against the professional table, notes and addendum), bundled for offline use. 26 dated references for nine vaccines; six undated provider-discussion items. A single age is one marker on that age's anniversary; an inclusive range runs from its first age's anniversary through the last day of its last age; all from the chronological date of birth. One marked day per reference. Attribution, non-endorsement, source version, retrieval date, original link (new window) and the provider statement are shown.
- **Related screens:** Settings “Calendar” describes what exists; Home's “New event” is live and “Coming up” lists the next three events (Decision #136).
- **Data:** the existing `events` store; **database version 3 unchanged**; atomic, validated writes; child isolation; profile deletion and reset covered.
- **R-014:** test-only timing correction (Decision #131).

**Unchanged:** Growth, milestones, goals, exercises, history, profiles, themes, typography, navigation (five tabs), onboarding; no new dependencies, services, accounts, analytics or AI.

**Not done (out of scope):** goals/exercises integration, therapy or well-child scheduling, recurrence, reminders, notifications, vaccine administration tracking, eligibility or catch-up calculation, family aggregation, calendar export, backup/restore, sharing, synchronization. Journal and the removal of Resources belong to Checkpoint 4.

**Required later:** recheck the schedule's currency at Checkpoint 6 (Decision #125); physical-iPhone acceptance at Checkpoint 6.

---

## R15 — Submission scope revision and Checkpoint 2b-R closeout (owner, 2026-11-27) — supersedes conflicting §6 and §10 text on Checkpoints 3–6, R4 Calendar items and the Resources tab
**Checkpoint 2b-R:** accepted for continued development (GR1–GR15 passed in Mac Safari against `b45af43`; R-010 to R-017 closed). GR16 and all iPhone, installed-app upgrade and device offline-editing checks → Checkpoint 6. Decisions #118–#124.

**Remaining submission checkpoints** (deadline: about 12 hours preferred, up to 36 acceptable; no post-deployment waiting period):

**Checkpoint 3 — Simplified Calendar** (replaces Calendar & Reminders; standalone record-keeping, not developmental scheduling)
- Monthly calendar with navigation and today highlighted; date selection; upcoming events.
- Three independently toggleable overlays: **Recommended vaccine schedule** (off by default; the only automatically populated overlay), **Medical appointments**, **Personal**.
- Vaccine schedule: an authoritative U.S. childhood schedule, with its content-use permissions researched and verified during Checkpoint 3 (AAP sources remain excluded); source-defined age ranges preserved; recommendations visibly distinct from actual appointments.
- Parent-entered medical and personal events: title, date, optional time, optional location, optional notes; create, view, edit, delete.
- Child-specific isolation, local persistence, offline operation, all five themes.
- **Out of scope:** goal/exercise integration, automatic therapy scheduling, the well-child reference schedule, recurring events, notifications and reminders, external calendar export, personalized vaccine eligibility or catch-up recommendations, vaccination compliance tracking.

**Checkpoint 4 — Journal:** the approved scope (Personal Reflections and Care Notes, local persistence, offline, privacy distinctions). **Resources removed from the primary navigation** in the submission version; source attribution and existing source information stay elsewhere.

**Checkpoint 6 — Final testing, deployment and consolidated physical-iPhone acceptance** (including all deferred iPhone, installed-app upgrade and device offline-editing checks from 2a, 2b and 2b-R).

**Deferred until after submission (not abandoned; approved requirements below and in the original plan remain the reference):**
- **Resources** (original plan §6 Resources and R4 items).
- **Backup, export and restoration** (Checkpoint 5; §8.1a merge design, R3 clarifications 1–4, R5 partner theme rule).
- **Partner sharing and synchronization** (Checkpoint 5; the data model already carries stable ids, logical keys, tombstones and device provenance).
- **Provider reports** (Checkpoint 5).
- **Deferred usability refinements:** R-001, R-003, R-009, R-018.
- **Earlier Calendar ideas** removed from Checkpoint 3 (reminders, export, recurring events, well-child references, exercise scheduling hooks such as `occurrencesBetween`) may be reconsidered later.

**Limitation accepted for submission:** no supported backup or restoration; local data loss can't be recovered.

---

## R14 — Checkpoint 2b-R: Human Acceptance Refinements (implemented; accepted for continued development 2026-11-27, see R15) — supersedes conflicting R13 text (D7 chart periods, D8 inspiration examples, session removal)
**Authorization:** owner, 2026-11-27, after the initial Mac Safari acceptance of Checkpoint 2b (`64202e2`): Phase A 7/7, B 12/12, C–D 16/16, E 14/14, F 15/16 (reporting period), G not applicable, H positive. Decisions #107–#117; report `docs/reviews/CHECKPOINT_2B_R_REFINEMENT_REPORT.md`.

**Built:**
- **R-010** age-responsive goal ideas: six ranges (birth–<6, 6–<12, 12–<24, 24–<36, 36–<48, 48–60 months), 70 app-written ideas traced to the verified milestone and activity inventories (`goal-ideas.app-2026.json`, validated at build time, mapping in `docs/reviews/CHECKPOINT_2B_R_GOAL_IDEAS.md`). Default from the milestone age; none before the due date; last range over 60 months; any range browsable. Start from a milestone kept.
- **R-011** attribution centralized in one Source section per activity page; neutral reference-age wording; all safety text kept.
- **R-012–R-014** exercise form headings inside their groups; one shared duration-entry component for target, manual entry and correction.
- **R-015** sessions are deleted (with confirmation) rather than removed-with-placeholder; content-free tombstones; slot freed; totals recalculated; database version 3 unchanged.
- **R-016** stopwatch recovery notice and related in-sheet notices in one column with the themed button hierarchy.
- **R-017** exactly 6 or 12 month positions; before birth “not applicable”, zero shown, not tracked shown, backdated sessions counted.

**Deferred:** R-018 (shading distinction; reassess after iPhone use), R-001, R-003, R-009. **Not started:** Checkpoint 3.

---

## R13 — Checkpoint 2b: Goals, Exercises & Historical Progress (implemented; initial owner Mac acceptance 64/65 on 2026-11-27, refined by R14) — supersedes conflicting §4.3, §6.5–6.7, R9 and R11 text
**Authorization:** owner implementation authorization of 2026-11-27 (D1–D16 with modifications). Plan: `docs/reviews/CHECKPOINT_2B_IMPLEMENTATION_PLAN.md`. Decisions #89–#106.

**Built (one implementation phase):**
- **Goals & Exercises** is live: My Goals (“Set personal goals and celebrate achievements.”) and Exercises (“Discover activities and build your own routines.”) as separate pages.
- **My Goals:** Create a goal · Record an achievement · Working toward · Accomplishments · Looking for inspiration? Goals (name, area, start, optional target as the parent's plan, description, Notes & Observations, related milestone, related exercises; accomplish, correct date, reopen, archive, delete) and standalone achievements (no goal or start date is created). No bars, percentages or streaks.
- **Exercises:** Create exercise · Browse Exercises · Today's routine · My exercises. Origins: CDC activity tips (provenance kept), the parent's own, a doctor's or specialist's instructions entered by the parent. Tracking: simple, count-up stopwatch, repetitions. Schedules: as needed, every day, selected days, 1–24 sessions per scheduled day; versioned from today; pause/resume; archive; delete. Sessions: record, undo, correct, move, backdate, additional sessions.
- **Browse Exercises:** CDC's 12 ages plus All ages, five collapsed area accordions, activity pages with CDC wording (gender-neutral), purpose, highlighted safety, page guidance, materials, source and original wording.
- **Today's routine** and the conditional **Home card** (same calculation).
- **Progress:** unchanged, plus a Personal progress card (accomplishments, active goals, sessions this month) and **Progress over time** (Milestones / Goals / Exercises; 6 months or 1 year; text table).
- **Legacy personal entries:** Move to My Goals or Delete permanently, on request only.
- **Database version 3** (additive), blocked-upgrade notices.

**Unchanged:** the four Growth destinations and order; Home (apart from the card), Milestone Library, What to Expect, Calendar, Journal, Resources, Settings, onboarding and profiles; milestone ids, content, calculations and the Progress denominator; themes, typography and navigation; no new dependencies, no AI, services, accounts or analytics.

**Not done (out of scope):** Calendar integration, reminders and clock times (Checkpoint 3); sharing and backups (Checkpoint 5); R-001, R-003, R-009.

## R12 — Checkpoint 2a human acceptance refinements (implemented; awaiting owner acceptance) — supersedes conflicting R9 and R11 text
**Why:** the owner's hands-on review of the Growth UX refinement (`170cc99`) found five usability improvements, **R-004 to R-008**. That build had passed all **387 automated tests** (252 unit, 135 end-to-end) in three consecutive runs. The tests verified the specification; the owner judged how it felt to a parent.

**Design principle (permanent; see DESIGN_SYSTEM): parent-first interface, evidence-backed infrastructure.** Rigorous source verification, accurate content, reliable calculations and data safeguards stay underneath. What parents see is warm, intuitive, concise and approachable, without implementation terms, methodological repetition or checkpoint language.

| ID | Change | Details |
|---|---|---|
| R-004 | Gender-neutral milestone wording through a separate, validated display layer; the CDC catalog is unchanged | `docs/reviews/CHECKPOINT_2A_ACCEPTANCE_REFINEMENTS.md` §1 |
| R-005 | “Make a personal version” and the “Your versions” filter removed. Existing personal entries are preserved in a collapsed Library section and not counted | §2 |
| R-006 | Plain terms (“All milestones”, “By age”, “Age”); attribution consolidated into concise notes plus the full About page | §3 |
| R-007 | One **Notes & Observations** section (date, text, Add entry, previous entries with Edit/Remove). Existing notes are shown as “No observation date”. Append-only edit events; no schema change | §4 |
| R-008 | Progress explains how to change the age basis; **Manage age settings** opens the selected child's age settings | §5 |

**Unchanged:**
- Growth order, subtitles and responsibilities.
- The read-only guide.
- Calculations, eligibility and the Progress denominator.
- Milestone ids and the source catalog.
- Profile isolation, offline behavior and themes.
- The database version (2); no dependencies added.

**Not done (out of scope):** R-001, R-003, Checkpoint 2b, and Calendar/Journal/Resources/sharing features.

## R11 — Checkpoint 2a Growth UX refinement (implemented; awaiting owner acceptance) — supersedes conflicting R4, R9 and §6.4 text
**Why:** owner hands-on acceptance testing (before 2a was accepted) found the Growth sections repetitive and unclear about which actions update progress (R-002, a human-discovered usability and product-design issue). The original 2a implementation had passed all 339 automated tests.

**Growth order (supersedes R4's order; an intentional requirements change, not a regression):**
1. **Progress:** “See how far we've come.”
2. **Milestone Library:** “Record what we've accomplished.”
3. **Goals & Exercises:** “Know what to work on.”
4. **What to Expect at Every Age:** “Learn what's ahead.”

The navigation hierarchy is Review → Record → Support → Learn. Section names, the page subtitle, branding, typography and themes are unchanged.

| Section | Responsibility | Modifies records |
|---|---|---|
| Progress | Review recorded achievements (automatically calculated) | None |
| Milestone Library | Record and manage milestones | Milestone records (via milestone detail) |
| Goals & Exercises | Plan and track support activities | Goal and exercise records, from Checkpoint 2b; placeholder until then |
| What to Expect | Learn about CDC's milestones | None: exclusively informational |

**What to Expect (supersedes the tracking parts of §6.4 and R9):**
- A read-only guide.
- **Kept:**
  - opens at the current range (same interval rule);
  - the 20 three-month ranges, plus Earlier/Next;
  - Back to current age;
  - neighbouring CDC-age navigation;
  - corrected-age, pre-due-date and over-five behavior;
  - the five areas;
  - verbatim CDC milestones;
  - attribution and safeguards.
- **Removed:** status badges and filters; recording controls; progress meters and figures; links to milestone detail or the Library; personal versions; hidden-milestone management; the “Everything up to now” view (its old address redirects to the Library).
- **Content:** shows all CDC milestones regardless of the child's records. Educational text is Option A, original and traceable (`docs/reviews/CHECKPOINT_2A_GUIDE_CONTENT.md`).

**Milestone Library:**
- The primary recording interface.
- **Views:**
  - Up to now: the default, showing applicable visible milestones, most recent CDC age first;
  - Upcoming: nearest CDC age first;
  - All 159: youngest first.
  - Within an age, the five app areas in established order, then CDC order.
- **Kept:** search, area, age and status filters, hidden milestones, and personal versions.
- **Catalog label:** distinguishes the 159 CDC milestones from shown and hidden counts.
- **State:** view, filters, search and scroll position are kept in memory when returning from a milestone; never carried to another child.
- **Entry points:** Home “Record a milestone” and the Growth card open Up to now.

**Progress:**
- Headline “Milestones recorded as achieved”.
- An always-visible “What updates Progress?” card with a shortcut to the Library.
- Five area meters that open the filtered Library.
- A collapsed “By CDC age” breakdown (applicable ages only).
- The safeguard, age basis and method.
- **The calculation engine and rules are unchanged.**

**Recording confirmations:** they describe the actual effect on the resulting record:
- a new applicable achievement;
- an early achievement, which counts conditionally against the named age basis;
- Emerging;
- reversals, which say whether the milestone had counted;
- date, note and observation edits, which never claim another achievement;
- hide and restore;
- personal versions;
- permanent erase.

**Parent-facing wording:** no checkpoint or development-process terms anywhere in the app. Placeholders say “Coming soon.”

**Unchanged:** database schema (version 2), repositories, dependencies, milestone content, IDs, the lock file, the calculation engine, history and profile isolation.

**Still deferred to Checkpoint 2b:** goals, exercises, CDC activities, historical charts, and goal and exercise progress.

---

## R10 — Checkpoint 2a handoff consolidation and recovery (documentation only)
- **Status categories used from now on:** completed (accepted), implemented but not accepted, planned (not started), deferred. Current values are in `docs/HANDOFF.md` section 1.
- **Conversation transfer:** the original Checkpoint 2a commit (`73d9f6f`) existed only in the previous conversation's workspace. It was recovered unchanged through the remote branch `checkpoint-2a` and verified (hash, parent `aa8c869`, seven-commit history). `main` (`aa8c869`) and the deployment (`e40287f`) were unaffected. Details: `docs/HANDOFF.md` section 6.
- **Workflow addition:** remote checkpoint preservation on a separate branch, subject to a publication safety review and the owner's explicit authorization (Decision #63).
- **New document:** `docs/REFINEMENT_BACKLOG.md` (first item R-001, onboarding child-name input overflow; pending investigation).
- **Unchanged:** Checkpoint 2a scope and requirements (R9); no application code, dependency or schema change.

---

## R9 — Checkpoint 2a: Verified Milestone Tracking (implemented; awaiting owner review)
- **Scope built:**
  - the verified 159-item CDC library
  - What to Expect at Every Age
  - milestone detail (status, dates, notes, observations, history, date corrections, hide/restore, personal versions)
  - Progress
  - live Home cards and the "Record a milestone" quick action
  - Milestone Viewing Preferences in Settings
- **Still placeholders:** Goals & Exercises (Checkpoint 2b), Calendar, Journal, Resources.
- **Checkpoint 2b remains separate** and needs the owner's explicit approval. Its supporting activities will come from verified CDC tips.
- **Intervals:** the current interval now uses the same rule as milestone placement (start < age ≤ end, in completed calendar months), so milestones that have just become applicable never disappear at a boundary. Age 0 (or no milestone age yet) → 0–3 months; ages over 60 months → 57–60 months.
- **Milestone age:** chronological by default; corrected only when the child's existing corrected-age preference is on and selected. Before a corrected due date it has no value, and nothing applies. No clinical cutoffs.
- **Progress:** achieved ÷ applicable, counting only visible sourced milestones (reference age ≤ milestone age).
  - Emerging gets no credit; future and hidden milestones are excluded, and personal versions are separate.
  - Neutral states: "Nothing to track yet" and "All hidden".
  - Interval and cumulative figures are labelled separately, and Home always uses the actual milestone age.
- **History:** append-only events carrying an event date, a recording timestamp (always increasing), from/to status and dates, device, age-basis snapshot, hidden-at-time and status-after.
  - Checkpoint 2b charts will use `stateAsRecordedAt()`, which shows what had been recorded at each moment, and will show corrections as separate entries.
- **Observations:** removal adds a marker and keeps the text; a two-step "Erase permanently" overwrites the text in storage. Profile deletion and app reset remove everything.
- **No schema change:** existing stores only (database version 2). All multi-record writes are atomic.
- **Sources:** CDC only. AAP and HealthyChildren are excluded; Pathways.org may not be collected until its terms are approved. See `docs/reviews/CHECKPOINT_2A_SOURCE_VERIFICATION.md`.
- **Effect on Checkpoint 3:** the plan's well-child (AAP/Bright Futures) and AAP vaccine-schedule sources are blocked by the AAP exclusion and need an owner decision before Checkpoint 3.

---

## R8 — Deployment acceptance (Checkpoint 1)
- **Deployment:** the owner ran the manual GitHub Pages workflow on commit `e40287f`; it succeeded. The app is live at https://jcandm1088.github.io/roll-crawl-run/.
- **Owner's physical iPhone results:** Home Screen install, later launches, local data persistence, and offline launch and navigation passed.
- **Initial connectivity observation:** a one-time “server not responding” delay at first load. Its cause has not been established; it is not recorded as a defect and is not claimed to be resolved.
- **Publication review:** the owner verified in a signed-out private browser window that the session URL redirects to sign-in, so it is private. History was pushed unchanged.
- **Next:** Checkpoint 2 prerequisites are in `docs/HANDOFF.md`. *(Superseded: those prerequisites were resolved during Checkpoint 2a and are preserved in `docs/reviews/CHECKPOINT_1_HANDOFF.md`; see R9 and R10.)*

---

## R7 — Publication compliance (Checkpoint 1)
- **Third-party license compliance:**
  - `THIRD_PARTY_NOTICES.md` and exact copies of the license files in `public/licenses/`, covering Fraunces and Inter (OFL 1.1), Preact (MIT), idb (ISC), and Lucide (ISC, plus MIT for Feather-derived icons).
  - The licenses deploy with the app, are precached for offline use, and are linked from Settings → About.
  - Tests check that the copies match the installed packages and versions.
- **Project license:** deferred by the owner. None has been added.
- **Service worker:** a navigation to a precached file (such as a license text) now returns that file instead of the app shell. The app's own behavior is unchanged.
- **Publishing status:** *(superseded by R8)* At the time of R7, the push was on hold pending verification of the session URL.

---

## R6 — Precise personal age (Checkpoint 1, owner acceptance testing)
- **Personal age**, wherever the app shows a child's own age (Home, profiles, forms), is precise to the calendar day: completed years, remaining months, remaining days, with zero parts omitted, “0 days” at birth, and no weeks, rounding, or ranges.
- One formatter is used for all of these: `formatPreciseAge()`.
- The displayed age stays current across local midnight and when the app resumes.
- **Developmental groupings** (intervals, milestone reference ages, eligibility) are separate and unchanged. Growth, Goals & Exercises, What to Expect at Every Age, and the Milestone Library may use age groupings as designed.
- Details: `docs/reviews/CHECKPOINT_1_PRECISE_AGE.md`.

---

## R5 — Checkpoint 1 final refinement (supersede conflicting text below)

The owner tested the revised build in Safari on their Mac and confirmed the selector fix. Details are in `docs/reviews/CHECKPOINT_1_FINAL.md`.

**Per-child themes (permanent).** Each child has their own theme on this device, stored in `settings.childThemes[childId]`.
- Switching children applies that child's theme immediately. Settings → Appearance changes only the active child's theme and says which child it applies to.
- New profiles default to Earth unless another theme is chosen, during onboarding or under Add a child. With no profiles, the app uses Earth.
- Deleting a profile removes its theme entry, in the same transaction.
- Avatar colors are separate from themes.
- Database schema v2 migrates existing profiles: each one receives the previous app-wide theme. The migration runs inside the atomic upgrade transaction and does not modify child records.

**Effect on future backup, restore, and sharing (Checkpoint 5).**
- *Full backups* include each child's theme. Restore brings it back, and restoring a single profile restores that profile's theme.
- *Partner sharing:* a theme is a device preference, so it is **not** merged or conflict-checked. A partner file may carry the sender's theme as a suggestion. When joining a new shared profile, the recipient's device starts with the suggestion (or Earth). For a profile already on the device, the recipient's own theme is always kept and never silently overwritten. *(This approach needs the owner's confirmation before Checkpoint 5.)*
- *Provider reports* are unaffected; they use a neutral print style.

**Typography Option B (approved).** Inter is used for every functional heading: primary page headings (one shared `PageHeader` and identical tokens on every tab), section headings, top-bar titles, sheet and dialog titles, accordion titles, onboarding step headings, and profile names and ages. Labels and body text also use Inter. Fraunces is reserved for branding (the wordmark). Future checkpoints must use the shared heading tokens and components, never page-specific font overrides.

**Logo (approved): Concept 5, “Growing Together”.** A single artwork source, `src/ui/brand/growing-together.json`, feeds all uses. Installed icons use the fixed brand colors; the in-app mark follows the active theme. The Home screen keeps its profile-card layout, with no added heading.

---

## R4 — Checkpoint 1 review revisions (supersede conflicting text below)

Approved by the project owner after the hands-on Checkpoint 1 review. Details are in `docs/reviews/CHECKPOINT_1_REVIEW.md`.

**Growth tab — permanent structure.** The intro reads “Tracking your developmental milestones.” Sections appear in this exact order:
1. **Progress** (replaces “progress meters”)
2. **Goals & Exercises** (replaces “your own goals & exercises”)
3. **What to Expect at Every Age** (replaces the “three-month age views” / “By age interval” view; it keeps the approved D2 interval rules, the empty-interval panel, and the cumulative view)
4. **Milestone Library** (the sourced milestone catalog with source details; hide and restore live here)

§5 item 3 and §6.4 are reorganized under these four sections. Their functional requirements are unchanged.

**Calendar tab — permanent requirement (Checkpoint 3).** Selecting the Calendar tab opens an actual calendar showing the current month immediately, with no introductory menu. It highlights today, allows month-to-month navigation, offers an agenda view, and lists relevant upcoming events below the calendar.

**Resources intro:** “A curated library of trusted, science-backed resources.” Source verification and offline requirements are unchanged.

**Settings structure.** Profiles and Appearance stay expanded. Your Data, Calendar & Reminders, This Device, and About are accessible inline accordions, collapsed by default; several can be open at once. Reset sits in a collapsed “Advanced data management” subsection inside Your Data.

**Destructive actions.** They must always remain possible, but are never prominent.
- *Reset:* collapsed location, restrained styling, a plain explanation of consequences, typed RESET, then a separate final confirmation. Cancel is always the primary button.
- *Delete profile:* inside a collapsed “Advanced profile management” section on the child's profile. It identifies the child (photo, name, date of birth), lists the categories of data removed, keeps the backup-purge option (checked by default) and explains it, requires typing DELETE PROFILE, then a separate final confirmation. Cancelling at any step changes nothing.

**Saving and backups.** The app states that changes are saved automatically on the current device, and distinguishes this from backups, which are external copies that can be restored. **Checkpoint 5 must include:** create a backup; restore from a backup; backup history; the date of the most recent successful external backup; optional backup reminders; and encouragement to create a backup before any destructive action. All previously approved privacy, import, export, and sharing safeguards still apply. Unbuilt backup features are never presented as working.

**Typography.** *(Superseded by R5: Option B adopted.)*

**Blush theme.** Revised to a clearer baby pink: bg #FDE8F1, surface #FFF7FB, accent #F5A5C8, primary #A93669, text #492437. Earth remains the default.

**Branding.** *(Superseded by R5: Concept 5 adopted.)*

**Deployment.** The GitHub Pages workflow is manual-only (`workflow_dispatch` with a typed “deploy” confirmation). Pushing never publishes the app.

**Language and UX standards (permanent, all remaining checkpoints).**
- Use concise, natural, parent-friendly language, with clear and actionable labels.
- Avoid technical terminology unless it is genuinely needed.
- Don't explain functionality that is already intuitive; use contextual help where an explanation is genuinely needed.
- Avoid visual clutter.
- Never word developmental tracking like grading a child.
- Remove temporary placeholder text when features ship. Keep any remaining placeholders concise and clearly marked as temporary.
- Keep the necessary medical, privacy, source, age-calculation, and destructive-action disclosures.

**Accessibility (added).** Every dialog traps focus and returns it to the opener. Radio groups use one Tab stop plus arrow keys. Popovers render through a portal and are sized to the visible viewport.

---

Legend:
- ✅ **Full** — fully implemented in v1.
- ⚠️ **Limited** — implemented with a real technical limitation, disclosed in the app and docs.
- 🔮 **Future** — deferred; architecture prepared but not built in v1.

---

## 1. Context: purpose and intended users

**Purpose.** A private, local-first, installable PWA that helps parents *document* (not assess) their child's development: track CDC-referenced milestones, record observations, manage appointments and recurring developmental activities, keep a journal, find reputable resources, collaborate with a partner through file exchange, and produce provider-friendly reports.

**Intended users.** Parents and caregivers generally (birth–5 years), with enough customization (custom goals/exercises, corrected age, care notes, detailed reports, vaccination references) for families monitoring development more closely due to medical circumstances, prematurity, or provider recommendations — without being condition-specific.

**What it is not.** Not a diagnostic or screening tool, not a medical record system, not an individualized vaccination planner, not a timeline the child must follow. Completion meters measure *what the parent has recorded*, nothing else.

**Constraints.** Static hosting (GitHub Pages), no AI, no credentials/API keys/paid services, offline-capable, persistent local data, deterministic calculations, personal data never in the repo.

---

## 2. Technical architecture (D3 approved)

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** | Type-checked data model & calculations. |
| UI | **Preact** (~4 KB) | Component model without React's weight. |
| Build | **Vite** | Static `dist/`, GitHub Pages base-path support. |
| Routing | In-app **hash router** | No 404s on Pages; works offline. |
| Storage | **IndexedDB** via `idb` (~1 KB) | Structured records + Blobs; versioned schema; **multi-store atomic transactions** [R2]. |
| Service worker | **Hand-written**, build-generated precache list | Transparent update flow. |
| Charts | Hand-built inline SVG | No chart dependency; theme-aware, accessible. |
| Dates & recurrence | In-house pure functions on `YYYY-MM-DD` values | Deterministic, timezone-safe, testable. |
| Icons | Vendored Lucide subset (ISC) | Consistent; no runtime fetch. |
| Fonts | Self-hosted OFL fonts (e.g., Fraunces + Inter) | No third-party requests; offline. |
| Testing | Vitest (+ `fake-indexeddb`), Playwright (+ `@axe-core/playwright`) | Automated acceptance checks. |
| Deployment | GitHub Actions → GitHub Pages | Free, reproducible. |

Runtime dependencies: `preact`, `idb` only. No analytics, CDNs, or third-party runtime requests.

**Layering:** `ui/` → `state/` → `domain/` (pure functions: age, intervals, progress, recurrence, care schedule, report, export scopes, **three-way merge** [R2], ics) → `data/` (the only layer touching IndexedDB). Future live sync would plug into `data/` + the existing merge engine.

---

## 3. Project & file structure

```
roll-crawl-run/                         # D13: repository name approved
├─ index.html
├─ public/  manifest.webmanifest, icons/, fonts/ (+ OFL licenses)
├─ src/
│  ├─ main.tsx, app.tsx, router.ts
│  ├─ sw/service-worker.ts
│  ├─ content/                          # bundled, versioned, SOURCED static content only
│  │  ├─ sources.json                   # machine-readable source register incl. usage-permission notes
│  │  ├─ milestones.cdc-2022.json
│  │  ├─ activities.json                # [R2] sourced supporting activities (CDC + permitted orgs)
│  │  ├─ well-visits.json               # [R2] split from care schedule
│  │  ├─ vaccines.cdc-acip.<version>.json   # [R2] one file per schedule source
│  │  ├─ vaccines.aap.<version>.json        # [R2]
│  │  ├─ resources.json
│  │  └─ messages.json
│  ├─ domain/  age.ts, intervals.ts, progress.ts, recurrence.ts, wellVisits.ts, vaccineRefs.ts,
│  │           history.ts, report.ts, exportScopes.ts, merge/ (diff.ts, threeWay.ts, logicalKeys.ts,
│  │           conflicts.ts, plan.ts), ics.ts, capabilities.ts, messages.ts
│  ├─ data/    db.ts (schema + migrations), repositories/*.ts, transactions.ts, backup.ts, photos.ts
│  ├─ state/   activeChild.ts, settings.ts, theme.ts
│  ├─ ui/      components/, screens/ (onboarding, home, growth, calendar, journal, resources,
│  │           profiles, settings, export, import-merge, report), styles/ (tokens, themes, base, print)
│  └─ types.ts
├─ tests/  unit/, e2e/, fixtures/ (FICTIONAL data only, incl. two-device merge scenarios)
├─ docs/   BUILD_LOG.md, TESTING_CHECKLIST.md, KNOWN_LIMITATIONS.md, DECISIONS.md, SOURCE_REGISTER.md
├─ .github/workflows/deploy.yml
├─ .gitignore  (dist/, node_modules/, *.rcr.json, backups, test artifacts)
└─ README.md, package.json, tsconfig.json, vite.config.ts, playwright.config.ts
```

---

## 4. Data model and relationships

### 4.1 Common record envelope (sync- and merge-ready)
Every user record has: `id` (UUID v4), `createdAt`, `updatedAt`, `deletedAt` (tombstone, nullable), `rev` (per-record counter incremented on each local write), `lastModifiedBy` (deviceId), and **[R2]** `originDeviceId`.

`meta` holds a random `deviceId` and an optional user-entered **device label** (e.g., "Phone A"), used only to attribute history entries after merging ("Recorded on Phone A"). [R2]

### 4.2 Static content (bundled, read-only, versioned)
- `Source` — id, organization, title, URL, version/publication date, retrieval date, **usage terms & permission basis** [R2], notes.
- `MilestoneDefinition` — stable id (e.g., `cdc22-m04-mov-03`), sourceId, `sourceCategory`, `appCategory`, `classificationNote`, title, description, `referenceAgeMonths`, `referenceAgeLabel`, contentVersion.
- `Activity` [R2] — id, sourceId, linked milestone ids and/or age group, text (verbatim if permitted, otherwise original summary + link), `textType: 'verbatim' | 'summary'`.
- `WellVisitItem` [R2] — id, label, published age (point or range), sourceId.
- `VaccineReferenceItem` [R2] — id, scheduleId (`cdc-acip` | `aap`), scheduleVersion, vaccine name/abbreviation, dose number, `window: {startAge, endAge?}` as published, `recommendationType` (`routine` | `conditional` | `productDependent` | `seasonal` | `sharedDecision`), source footnote reference, display note.
- `Resource`, `Message`.

### 4.3 User data stores (IndexedDB)

| Store | Key fields | **Logical uniqueness** [R2] |
|---|---|---|
| `meta` | schemaVersion, deviceId, deviceLabel?, onboardingComplete, lastBackupAt, persistGranted | singleton |
| `settings` | theme, notification prefs, layer visibility (personal / well-visits / vaccines / therapy), vaccineSchedule (`cdc-acip`\|`aap`), ageBasis default, family view | singleton (never exported to partners) |
| `children` | name?, dob, photoId?, optional profile fields, `correctedAge {enabled, dueDate}` (GA input converted to dueDate), `ageBasis` | `id` (the **collaboration ID**, preserved across partner devices) |
| `idAliases` [R2] | aliasId → canonicalId, entity type | maps IDs merged from independently created records |
| `photos` | childId, Blob | 0..1 per child |
| `milestoneRecords` | childId, milestoneDefId **or** customItemId, status, firstObservedDate?, achievedDate?, notes, hidden | **unique (childId, milestoneDefId)** for starter milestones; (childId, customItemId) for custom |
| `milestoneEvents` | recordId, childId, type, fromStatus, toStatus, eventDate, note, deviceId | append-only; unique by `id`; never conflicts |
| `customItems` | childId, kind (milestone/goal/exercise/activity), title, description, appCategory, target?, recurrence?, status, notes, derivedFromDefId? | `id` only (independently created look-alikes flagged as *possible duplicates*, never auto-combined) |
| `completions` | customItemId, childId, occurrenceDate, note, deviceId | **unique (customItemId, occurrenceDate)** |
| `events` | childId or `family`, title, date, times, location, notes, category, layer, recurrence, exceptions, overrides, reminder, linkedReferenceId? | `id` |
| `eventCompletions` [R2] (moved out of the event record so two devices can complete different occurrences without conflict) | eventId, occurrenceDate | **unique (eventId, occurrenceDate)** |
| `referenceAnnotations` [R2] (renamed from careAnnotations) | childId, referenceItemId, scheduleId+version, hidden, dismissed, note, linkedEventId? | **unique (childId, referenceItemId)** |
| `journal` | childId, type (`reflection`\|`care`), dateTime, title?, body, tags, isProviderQuestion, answered? | `id` |
| `mergeBases` [R2, revised R3] | (recordKey, peerDeviceId) → **full field-level snapshot** of the common-ancestor version (every mergeable field's value), plus rev and per-field last-change markers | used for true field-level three-way merge (a hash alone is insufficient) |
| `backups` | createdAt, reason, childIds contained, payload | rolling last 5 (proposal) |

Rules: milestone status is never irreversible — every change writes a `milestoneEvents` row; corrections never erase history. Recurrence stored as a rule; occurrences computed.

---

## 5. Navigation & screen structure

- **Top bar:** active-child chip (avatar/initial, name, color tag → quick switcher) and Profiles & Settings icon. Active child persists across tabs.
- **Bottom nav:** Home · Growth · Calendar · Journal · Resources (icon + label, ≥48px targets).

Screens:
1. **Onboarding:** Welcome → DOB (required) → name/photo (optional) → "Was your child born early?" (optional corrected age) → theme picker (Earth default, live preview) → privacy & backup note → Home. *Second option on Welcome:* **"I have a file from a partner"** → partner-import flow [R2].
2. **Home:** child header + age(s) · daily message · category meters · next appointments · goals/exercises due · recent achievements · quick actions.
3. **Growth** [R4 order]: **Progress · Goals & Exercises · What to Expect at Every Age · Milestone Library**. The interval and cumulative views live under *What to Expect at Every Age*, and history is reached from Progress (details §6.4).
4. **Calendar** [R4: opens directly to the current month, today highlighted, upcoming events below]: Month / Agenda · **four** toggles [R2]: Personal ● · Well-child visits (reference) ◆ · Vaccination references (reference) ✚ · Therapy & activities ▲ — color + shape + text · day sheet · event editor · reference-item detail · Family view.
5. **Journal:** filter (All / Personal Reflections / Care Notes) · search · tags/date · editor with type dropdown.
6. **Resources:** categories · message · news-source links · "needs internet" badges.
7. **Profiles:** list, add, edit, delete (with backup-purge option, §6.14).
8. **Settings:** theme · profiles · device label · notifications (capability-aware) · calendar layers & vaccine schedule source · .ics export · viewing preferences · **Backup / Share with partner / Import** [R2] · reports · install guide · storage status · privacy · sources · version · reset.
9. **Export flows** (3 workflows, §6.15) · **Import & merge** (summary → conflicts → apply) · **Report builder → Preview → Print/Share.**

---

## 6. Feature-by-feature implementation plan

### 6.1 Onboarding & age calculation — ✅ Full
- **DOB (D7 approved):** any valid past date (no future dates; invalid calendar dates rejected). Children older than 60 months: note that developmental starter content ends at age five.
- **Chronological age:** calendar difference; month-end anniversaries clamp to the month's last day; Feb 29 → Feb 28 in non-leap years. Display adapts (days/weeks → months+days → years+months). Integer "completed months" drives intervals and progress.
- **Corrected age (D5 approved, with safeguards [R2]):**
  - Input as estimated due date, or gestational age at birth (weeks + days) converted to `dueDate = DOB + (40w0d − GA)`.
  - Input validation: due date must be after DOB and not in an implausible range; GA entry bounded to a documented plausibility range (proposed 20w0d–41w6d; this is input validation only, not clinical guidance — see §13 Q4). GA ≥ 40w0d or due date ≤ DOB → "corrected age does not apply" (stored as disabled, not an error).
  - **Before the due date:** corrected age is shown as "X weeks Y days before due date" — never as a negative age. Growth defaults to the 0–3 month interval with a note ("Corrected age begins at your child's due date"); no sourced milestones are applicable, so meters show the empty state, never 0%. Interval math clamps at 0 so no invalid interval index can occur.
  - Chronological and corrected ages are always labeled; parent chooses which basis drives viewing/progress; the app never switches automatically; explanation sheet covers calculation and limitations.
- Onboarding shown once (flag in `meta`); repeats only on reset or "Add child".

### 6.2 Themes & design system — ✅ Full
Full token sets for Earth (default), Sky, Blush, Lavender, Sage; all pairs tested ≥ WCAG AA; no red/amber warning colors on meters; `prefers-reduced-motion` respected; per-theme `theme-color`. Dark mode out of scope (D10 approved).

### 6.3 Home dashboard — ✅ Full
As in §5; ≤3 items per section with "See all"; message = `messages[dayIndex % n]`.

### 6.4 Growth — milestones & age navigation — ✅ Full [R2 revised]
- **Five app categories (D1 approved)** with CDC source category preserved and the gross/fine assignment documented per item.
- **Interval scheme (D2 option A approved):** child's age uses `[start, end)` in completed months; a "By X months" milestone sits in the interval ending at X (4 & 6 → 3–6; 60 → 57–60). ≥60 months defaults to 57–60.
- **View: By age interval** — dropdown of 20 intervals, defaults to the current interval; "Back to current age" chip whenever browsing. Previewing a future interval shows a banner: "Previewing — this doesn't change your child's age or current progress."
- **Empty-interval panel** (intervals with no new sourced milestones):
  - "There are no additional published reference milestones in this age range (source: CDC)."
  - **"← Previous reference group: By 18 months"** and **"Next reference group: By 24 months →"** buttons that jump to the nearest non-empty intervals.
  - **Applicable custom goals & exercises** for the child (target in or before the interval, or no target).
  - **"View all milestones through current age"** button.
  - No invented milestones.
- **View: Through current age** (cumulative list) — every visible sourced milestone with reference age ≤ the child's current age, grouped by reference age, with status filters (**Not yet observed / Emerging / Achieved / All**) and category chips. This lets parents update earlier milestones without stepping back through intervals. Milestone detail is also reachable from History and Home.
- Milestone detail: status (Not yet observed / Emerging · In progress / Achieved), first observed, achieved date, notes, dated observations, full history (with device attribution after merges), source + reference age label, sourced supporting activities, hide. Starter source fields are read-only; **"Make a personal version"** creates a linked custom item; hide/restore available.
- **Supporting activities (D15 approved with modification):** from CDC or other verified reputable organizations, attributed; verbatim only where use is permitted, otherwise original summary + link; omitted where nothing verified.

### 6.5 Custom milestones, goals, exercises, activities — ✅ Full
Unchanged: title, description, category, optional target, recurrence (daily / weekly by weekdays / monthly by day with last-day rule D6), status, notes, per-occurrence completion history, "Created by you" badge.

### 6.6 Progress meters — ✅ Full [R2 clarified labels]
For basis age *A* (completed months; corrected age before due date ⇒ nothing applicable):
- Applicable = visible starter milestones with `referenceAgeMonths ≤ A`; hidden excluded (noted); future excluded.
- **Category % = Achieved ÷ Applicable × 100**, with raw fraction; Emerging shown separately (no partial credit); zero applicable → empty state.
- Custom goals: separate "Your goals" meter; optional clearly labeled Combined view (off by default).
- **Two distinctly labeled figures** in Growth:
  - **"In this interval"** — Achieved ÷ visible milestones placed in the selected interval (works for past or future intervals; purely descriptive).
  - **"Cumulative through [age]"** — Achieved ÷ visible milestones with reference age ≤ the end of the selected interval.
  - The **current-age meters on Home are always computed from the child's actual basis age**, independent of whatever interval is being browsed.
- "How is this calculated?" sheet states the formula and that it reflects records, not development or health.

### 6.7 Developmental history & visualizations — ✅ Full
Timeline labeled "What you've recorded"; cumulative step chart, achievements per month, completions per week; table fallbacks; no projections/percentiles.

### 6.8 Calendar — ✅ Full
Month + Agenda; four independent toggles; event CRUD; complete/uncomplete per occurrence; recurrence with "this occurrence / all occurrences" edit and delete; family view (D12 approved) with child chips; **monthly last-day rule (D6)** implemented once in `recurrence.ts` and reused by the ICS exporter so both behave identically [R2].

### 6.9 Recommended care references — ⚠️ Limited [R2 rewritten]
Two **independently toggleable reference layers**, both generated from the selected child's DOB (chronological — see §13 Q5) and both visually marked "Reference · not an appointment":

**A. Well-child visit references** — AAP Bright Futures periodicity schedule (current version verified in Checkpoint 3). Published single ages shown as "Around 2 months (on or after [date])"; no invented appointment dates.

**B. Vaccination references**
- **Schedule source selector** in Settings and in the layer's header: **CDC/ACIP** or **AAP**; exactly one shown at a time; switching is explicit and labeled ("Showing: CDC/ACIP schedule, version [date]"). Recommendations from different organizations are never combined.
- **Individual vaccine names and dose-specific reference windows** exactly as the selected schedule publishes them (e.g., a dose recommended "at 2 months" → point reference; a dose with a published range → range bar from window start to end, computed from DOB).
- Entries whose timing depends on individual circumstances are **not** given computed dates. They are listed under "Depends on your child's situation — ask your provider" with the source's own wording summarized: e.g., recommendations that are conditional (maternal status, risk factors), product-dependent (number of doses varies by brand), seasonal (e.g., annual or seasonal products), or shared clinical decision-making. Exact handling per item will be presented at Checkpoint 3 for approval.
- Every entry shows: vaccine & dose, window, schedule name & version date, link to the original schedule, and: "Educational reference from [source]. It does not determine your child's eligibility or schedule. Your child's provider decides which vaccines and timing are right for your child."
- **Not calculated, ever:** eligibility, catch-up schedules, minimum intervals, contraindications, or recommendations. Nothing is marked received automatically.
- Per-entry actions: **hide**, **dismiss**, **annotate**, **"Create my appointment"** (creates a separate Personal event linked to the reference). Annotations persist when the schedule version is updated if the item id still exists; otherwise they are shown as "from an earlier schedule version".
- **Verification gate:** before any vaccine content is written, I verify the current CDC/ACIP and AAP schedules at their primary sources and record version dates and usage terms. If either cannot be verified or accurately represented, I stop and present the limitation and a proposed alternative for your approval (e.g., shipping only one source, or visit-level references for that source).

### 6.10 Notifications — ⚠️ Limited [R2 capability-aware]
- Off by default; permission requested only after the user taps "Enable".
- `capabilities.ts` detects: Notification API presence, permission state, iOS installed-vs-browser mode, and service worker availability. Settings shows the **actual** state: "Not supported in this browser", "Available only while the app is open", "Blocked in device settings — here's how to change it", or "On (while the app is open)". Unsupported options are hidden or disabled with an explanation — never shown as working.
- Provided: in-app "Due soon" center; foreground/launch notifications where supported; **reliable reminders via .ics VALARM** through the phone's calendar.
- Not provided: background notifications when the app is closed (requires a push server; §8.2).

### 6.11 Native calendar export (.ics) — ✅ Full, one-way ⚠️ [R2 recurrence consistency]
- Select child, layers (including reference layers, exported clearly titled "Reference:"), date range, or single events.
- Recurrence export mirrors the in-app engine:
  - Ordinary rules → `RRULE` (+ `EXDATE`, overrides as `RECURRENCE-ID` events).
  - Monthly on the 29th/30th/31st → `RRULE:FREQ=MONTHLY;BYMONTHDAY=28,29,30;BYSETPOS=-1` style rules (or `BYMONTHDAY=-1` for the 31st), which express "that day, or the month's last day".
  - Because `BYSETPOS` support varies among calendar apps, this is verified on physical devices in Checkpoint 5. If any target calendar renders it incorrectly, the exporter emits **explicit individual occurrences** for those series over a bounded range (proposed 24 months) and the export screen says so. A setting "Export repeating events as individual dates" is always available.
- Statement: "This is a one-time copy. Later changes in the app won't update your phone's calendar."

### 6.12 Journal — ✅ Full [R2 label]
- Types: Personal Reflections, Care Notes (distinct icon, label, subtle tint).
- Personal Reflections label: **"Personal · excluded from sharing by default"**. A short info note states that entries are stored on this device, are not encrypted or password-protected by the app, and can be seen by anyone using this unlocked device.
- Provider-question checkbox on Care Notes (D11 approved) with "answered" toggle.
- Filter/search by type, date, tags, text.

### 6.13 Resources & encouragement — ✅ Full
Curated, categorized, offline descriptions; external-link badges; news-source links (no API). **[R2] Usage verification:** for nongovernmental organizations (AAP/HealthyChildren.org, Pathways.org, ZERO TO THREE, etc.) I review terms of use; descriptions are original summaries with links unless reproduction is clearly permitted. ~60 original messages drafted for your review in Checkpoint 4 (D14 approved).

### 6.14 Multiple child profiles — ✅ Full [R2 deletion & backups]
- Independent data per `childId`; persistent child chip on every editor.
- **Delete profile dialog** explains: what will be removed; that **N internal backups** contain this child's data; an option **"Also permanently remove this child from internal backups"** (proposed default: checked) — removal rewrites each affected backup without that child (backups containing only that child are deleted); offer to export a backup first; files previously exported outside the app cannot be removed by the app; data is removed from the app's storage, but the app cannot guarantee secure erasure at the device-storage level. Typed confirmation required.

### 6.15 Export workflows, reports, and import — ✅ Full [R2 rewritten]

**Three distinct export workflows**, each with a **pre-export summary** listing the categories and counts included ("1 child · 48 milestone records · 112 history entries · 9 events · 14 Care Notes · Personal Reflections: not included · Photos: not included"):

| | 1. Full personal backup | 2. Partner/caregiver share | 3. Provider report |
|---|---|---|---|
| Purpose | Restore/move your own data | Collaborate with another parent's device | Discuss with a professional |
| Scope | All children (or one); records, history, events, Care Notes, custom items, annotations, settings | One child; selectable categories; **no** settings/device prefs | One child, date range, chosen sections |
| Personal Reflections | **Excluded by default**; include only via a clearly labeled checkbox + confirmation ("Backup will not restore your reflections unless included") | **Excluded by default**; include only via explicit choice + warning | **Excluded by default**; include only via explicit choice + warning |
| Photos | Excluded by default (D9) | Excluded by default | Excluded by default (name/age only) |
| Format | `.rcr.json` (`exportType: "backup"`) | `.rcr.json` (`exportType: "partner"`, includes `scope` manifest, collaboration IDs, mergeBase info) | Print/PDF, HTML file, copy text (D8); not importable |

Export files carry `format`, `formatVersion`, `exportType`, `scope` (exact list of included categories), `appVersion`, `contentVersions`, `exportedAt`, `sourceDeviceId`, optional device label. Files are unencrypted; the UI says so.

**Import (all types):** parse → schema & referential validation → **dry-run plan** → user confirms → pre-import backup → **single atomic IndexedDB transaction** across all affected stores. Any failure aborts the whole transaction; nothing is partially applied.

Import modes:
1. **Add as new profile** (re-mapped IDs; independent copy).
2. **Join / merge a shared profile** (partner collaboration — §8.1a).
3. **Restore / replace** from a backup (destructive; typed confirmation).

**Scope safety:** an import only touches record types listed in the file's `scope`. **Absence never means deletion** — deletions travel only as explicit tombstones. Therefore a partner file without Personal Reflections (or photos) can never delete or overwrite local reflections (or photos).

**Provider report:** unchanged sections and preview; Personal Reflections off by default; footer with generated date, app version, content source versions, disclaimer.

**Share the app** (public URL via Web Share / copy) remains visually separate from sharing personal data.

### 6.16 Settings — ✅ Full
All items per spec plus device label, storage status, vaccine schedule source; explicit confirmations for destructive actions.

### 6.17 Storage persistence — ✅ Full [R2]
The app calls `navigator.storage.persist()` where available. If unavailable or denied, the app **remains fully usable**; Settings → Storage shows "Your browser may clear this app's data under some conditions (for example, low storage or long periods without use)" with backup encouragement and a shorter backup-reminder interval.

---

## 7. Starter content strategy

### 7.1 Process
1. Fetch primary sources directly; transcribe into JSON with source IDs and reference ages.
2. **Usage-permission review [R2]:** record each source's terms in `sources.json`/`SOURCE_REGISTER.md`. U.S. federal (CDC) text is generally public domain — reproduced with attribution and no implied endorsement (third-party images excluded). For nongovernmental sources (AAP, Bright Futures, HealthyChildren.org, Pathways.org, others): factual data (e.g., ages, vaccine names) restated in the app's own structured format with attribution and links; prose is **original summary** unless reproduction is clearly permitted; no copying of charts, graphics, or footnote text. If terms appear to prohibit even that use, I report it for your decision. (This is a practical compliance approach, not legal advice.)
3. Build-time test: every content item references a valid source.
4. You spot-check samples against live sources at each checkpoint.
5. Unverifiable content → listed in `KNOWN_LIMITATIONS.md`, not filled in.

### 7.2 Milestones — CDC "Learn the Signs. Act Early." (2022 revision)
- Checklists expected at 2, 4, 6, 9, 12, 15, 18, 24, 30 months and 3, 4, 5 years (re-verified at Checkpoint 2); presented as "By X months, most children…", not deadlines.
- CDC's four categories preserved per item; Movement/Physical split into Gross/Fine by documented rule (D1).
- Expected empty intervals (e.g., 18–21, 24–27, 30–33, 36–45, 48–57 months under D2-A) use the §6.4 empty-interval panel.
- CDC "act early" prompts are not turned into in-app flags; a gentle static link to CDC's "If you're concerned" guidance instead.

### 7.3 Care references
- Well-child visits: AAP Bright Futures periodicity schedule (current version).
- Vaccinations: CDC/ACIP **and** AAP schedules, each stored separately with its own version date, displayed one at a time (§6.9).
- **Feasibility note:** U.S. childhood immunization guidance changed during 2025 and the CDC and AAP schedules diverge in places; schedules may also change again during your project. Content is frozen at a dated version, the version is displayed, and users are directed to the source for current guidance.

---

## 8. Feasibility & limitations

### 8.1 Live multi-device sync — 🔮 Future (accepted)
Requires a server and authentication; free hosted options require accounts/API keys; WebRTC requires a signaling server. Deferred.

### 8.1a Partner collaboration through file exchange — ✅ Full [R2 new]
**Workflow**
1. **Parent A** creates the child profile. The child's `id` becomes the **collaboration ID**.
2. A: Settings → **Share with partner** → chooses categories → summary → shares the `.rcr.json` file by any channel (AirDrop, messaging, email, cloud drive — the user's choice; the app warns the file is unencrypted).
3. **Parent B** opens the app → "I have a file from a partner" (onboarding) or Settings → Import → **Join shared profile**. Child ID and all record IDs are **preserved** (not re-mapped); `mergeBases` are recorded.
   - If B already created their own profile for the same child, B can choose **"Link to my existing profile"** (the app suggests a match when DOBs match but never links automatically). Records are then reconciled by logical keys (below), and the two child IDs are joined through `idAliases`.
4. Both parents update independently on their own devices.
5. Either parent exports a new partner file; the other imports with **Merge updates**. Repeat in either direction as often as needed.

**Merge algorithm (deterministic, three-way)**
- For each incoming record: resolve IDs via `idAliases`; match by `id`, else by **logical key** (e.g., `(childId, milestoneDefId)`, `(customItemId, occurrenceDate)`, `(eventId, occurrenceDate)`, `(childId, referenceItemId)`).
- **Independently created records for the same official milestone** (different UUIDs, same logical key): merged into one record. The canonical ID is chosen deterministically (lexicographically smaller UUID) so both devices converge to the same ID after exchanging files; the other ID becomes an alias. All history from both is kept.
- **Append-only data** (milestone history events, observations, completions): unioned by id/logical key — history from both devices is always preserved; nothing is lost.
- **Mutable fields** (status, dates, notes, event details): compared against the stored **merge base** (the version last exchanged with that peer):
  - changed only on one side → take that side automatically;
  - changed identically on both → no conflict;
  - changed differently on both, or no base exists and values differ → **conflict**.
- **Timestamps never decide a meaningful conflict on their own.** They are shown for context only. Device clocks can disagree; the app detects an imported file whose `exportedAt` is notably ahead of this device's clock and shows a notice. Per-record `rev` counters and base hashes — not wall-clock time — determine what changed.
- **Tombstones:** a deletion propagates only if the other side hasn't changed the record since the base; deleted-here + edited-there → conflict; a record deleted locally is **never resurrected** by an import of an older, unchanged copy.
- **Possible duplicates** without a logical key (e.g., two custom "Tummy time" goals) are flagged for optional manual combining, never combined automatically.

**Conflict-resolution interface**
- Summary first ("37 updates applied automatically · 3 need your choice").
- Each conflict shown side by side in plain language: "This device: Achieved on Mar 3 · Partner's device (Phone B): Achieved on Mar 10", with the relevant history.
- Choices: **Keep this device's**, **Use partner's**, and for text fields **Keep both** (combined with attribution). Optional "Apply my choice to all similar" for bulk resolution.
- All conflicts must be resolved (or explicitly deferred as "keep this device's for now") before the single atomic apply; then a merge summary is shown.
- Both conflicting achievement dates remain visible in history regardless of the choice.

### 8.2 Notifications — ⚠️ Limited
Background delivery needs Web Push (push server + VAPID keys) — unavailable. Notification Triggers API abandoned; Periodic Background Sync is Chromium-only and discretionary; iOS web notifications require Home Screen installation (16.4+) and push for background delivery. v1 provides in-app reminders, foreground notifications where supported, and .ics VALARM reminders.

### 8.3 Native calendar — ✅ export / ⚠️ one-way
One-time .ics files; stable UIDs may let some apps update rather than duplicate on re-import (varies). Recurrence fidelity per §6.11.

### 8.4 Offline & storage — ✅ Full after first online load, ⚠️ platform behavior
- Precached shell, assets, fonts, and all bundled content; all core features work offline.
- **Physical-device verification [R2]:** storage behavior is **not assumed identical across platforms**. Checkpoint 6 includes explicit device tests: whether data entered in iOS Safari appears in the installed Home Screen app (expected to be separate), persistence after force-close and device restart, behavior after a period of non-use where testable, Android Chrome installed vs browser tab, and `storage.persist()` results per platform. Install guidance and `KNOWN_LIMITATIONS.md` will be written from observed results, with any untestable conditions stated as untested.
- Updates: background install → "New version available — Refresh" banner. **Migrations [R2]:** before upgrading the schema, the app opens the current database, writes a pre-migration backup, then upgrades; the IndexedDB `versionchange` upgrade is atomic (if it fails, the database stays at the old version and the app offers the backup). Migrations are additive; updates never clear IndexedDB.

---

## 9. Privacy & data-storage strategy
- Local-first IndexedDB; no transmission; no analytics/trackers/ads/CDNs/external fonts; strict CSP (`default-src 'self'`; `img-src 'self' data: blob:`).
- Repo hygiene: no personal data; `.gitignore` for exports/backups; fictional fixtures only; test asserts no fixture data in `dist/`.
- Disclosures: data stays on this device/browser; can be lost if browser data is cleared, app removed, or device lost; not encrypted or password-protected by the app; not a HIPAA-compliant or clinical record; visible to anyone using the unlocked device; exported files are unencrypted.
- Three export workflows with reflections and photos excluded by default (§6.15); internal backups disclosed and purgeable (§6.14); persistence-denied explanation (§6.17).

---

## 10. Implementation roadmap — mandatory review checkpoints [R2]

Technical phases are retained but grouped into six checkpoints. **At the end of each checkpoint I stop and do not continue until you approve.** Each checkpoint report includes: what was implemented; files created/modified; tests actually run and their real results; limitations or deviations from the plan; how to view and test the current build; decisions needing your approval. An early test deployment to GitHub Pages (fictional data only) may be offered at any checkpoint once you provide your username.

| Checkpoint | Scope (phases) | Content/verification gates |
|---|---|---|
| **1. Design & foundation** | Scaffold, Vite/TS/Preact, tokens & 5 themes, app shell, bottom nav, router, manifest/icons/SW (basic), IndexedDB schema & repositories (incl. merge-ready envelope and logical-key indexes), transactions helper, settings, onboarding (DOB, name/photo, corrected age, theme), age domain, profiles & switcher, storage-persistence status | — |
| **2. Developmental tracking** | Milestone library, interval navigation (incl. empty-interval panel and cumulative view), milestone detail & history, progress engine, custom goals/exercises & recurrence/completions, hidden/restore, history charts, sourced activities | CDC milestone content verified and presented for your spot-check; gross/fine assignments listed for review |
| **3. Calendar** | Month/agenda, events CRUD, recurrence & occurrence edits, four layers, well-child references, vaccination references with source selector, annotations/dismiss/hide, "Create my appointment", family view, in-app reminders | **Vaccine gate:** both schedules verified (versions, usage terms) before coding vaccine content; per-item handling of conditional/product-dependent/seasonal entries presented for approval; stop if not verifiable |
| **4. Journal & resources** | Journal types & label, Care Notes, provider questions, search/filter, resources library, messages, notification settings (capability-aware) | ~60 drafted messages and resource list (with usage notes) for your review |
| **5. Sharing & reporting** | Three export workflows with summaries, import validation, new-profile / join / merge / restore, logical-key reconciliation, conflict UI, atomic apply, backups & purge, provider report + print/HTML/text, .ics export, share app | ICS recurrence check (automated); physical-device ICS import listed for your manual test |
| **6. Final testing & deployment** | Offline hardening, SW update & migration safety, accessibility audit, mobile/tablet/desktop polish, bug fixes, docs finalization, GitHub Actions deploy to Pages, install guide | Manual physical-device checklist (you perform; I record only results you report) |

---

## 11. Testing & acceptance plan

**Automated — Vitest (unit/domain/storage):**
- Age: leap-year & month-end DOBs, year boundaries, DOB today, future/invalid dates rejected.
- **Corrected age [R2]:** due date via GA and direct entry; GA out of bounds rejected; GA ≥ 40w → not applicable; due date ≤ DOB → not applicable; **today before due date → "before due date" display, interval clamped to 0–3, empty-state progress (not 0%)**; transition on the due date itself.
- Intervals: boundaries (2m30d, 3m0d, 59m, 60m, >60m) → exactly one interval; milestone placement per D2-A; nearest previous/next non-empty group lookup; future-interval browsing leaves current-age meters unchanged.
- Progress: formula, hidden/future exclusion, emerging uncredited, empty-state, custom separation, combined view, **interval vs cumulative figures distinct**.
- Custom items & recurrence: daily/weekly/monthly, end rules, **last-day rule for 29/30/31 incl. Feb in leap/non-leap years**, exceptions/overrides, per-occurrence completions.
- **ICS [R2]:** escaping/folding, UID stability, `RRULE` output, last-day rule output, **in-app occurrences == expanded ICS occurrences** (expanded by a test-only RRULE expander) for representative rules, explicit-occurrence fallback.
- Well-visit & vaccine references: dates from DOB for points & ranges; leap-day DOB; one schedule at a time; conditional items get no computed date; switching source never mixes items; annotations survive version updates.
- Journal: type tagging; reflections excluded by default from **all three** export workflows; explicit inclusion path.
- Profiles: isolation by childId; deletion removes only that child; **backup purge removes the child from every internal backup**.
- **Export/import [R2]:** round-trip; validation rejects malformed/unknown-version files with zero changes; scope manifest honored; **absent categories never deleted** (reflections and photos preserved); photo exclusion default.
- **Partner merge suite [R2]** (two simulated devices with separate fake-indexeddb instances and controllable clocks):
  1. Different records updated independently on two devices → both changes present after merge in each direction.
  2. Same milestone updated on both devices (different fields) → auto-merged; (same field, different values) → conflict.
  3. Conflicting achievement dates → conflict surfaced; both history entries preserved whichever is chosen.
  4. Repeated import of the same file (and re-import after merging back) → zero new/duplicate records.
  5. Deletion tombstones → deletion propagates; stale copy does not resurrect; delete-vs-edit → conflict.
  6. Partner file excluding reflections → local reflections untouched.
  7. History from both devices preserved and attributed.
  8. Independently created records for the same official milestone (different UUIDs) → single record, deterministic canonical ID, aliases recorded, both devices converge to identical state after a round trip.
  9. Device clock skew (one device hours/days ahead; equal `updatedAt` on both sides) → no timestamp-only resolution; ambiguous cases surface as conflicts; skew notice shown.
  10. **Transactionality:** injected failure mid-apply → database identical to pre-import state; failed migration → old version intact and backup available.
- Content integrity (every item sourced, usage terms recorded); theme contrast ≥ AA.

**Automated — Playwright (mobile 390×844, tablet, desktop; Chromium):**
onboarding & no repeat; theme persistence; milestone updates via cumulative view; empty-interval panel navigation; calendar CRUD & four toggles; vaccine source switch; journal filters & privacy label; profile isolation & deletion with purge; persistence across browser restart (persistent context); offline core flows (`setOffline`); SW update preserves data; export summary contents; two-context partner exchange end-to-end including conflict UI; report preview excludes reflections; axe scans; no horizontal scroll at 320px; notification settings reflect a context without Notification permission.

**Manual — physical phones (checklist in `docs/TESTING_CHECKLIST.md`):**
PWA install & standalone launch (iPhone Safari, Android Chrome); airplane mode after install; persistence after force-close and device restart; **Safari vs installed-app storage separation on iOS; Android browser vs installed behavior; `persist()` result per device**; .ics import into Apple and Google calendars incl. alarms and **last-day monthly recurrence**; share sheet with files; print/Save as PDF; notification permission & foreground notification per platform; camera photo; touch comfort; update on device preserves data; partner exchange between two real devices.

I can run automated tests in this environment; **I cannot operate physical phones**, so manual results will only be recorded from what you report. No results will be written in advance.

---

## 12. GitHub Pages deployment & PWA installation
- Repo `roll-crawl-run` (D13) → `https://<username>.github.io/roll-crawl-run/` (username to be provided).
- Vite `base: '/roll-crawl-run/'`; manifest `start_url "./"`, `scope "./"`, `display "standalone"`, full name and short name "Roll, Crawl, RUN", Earth colors, 192/512/maskable icons, Apple touch icon & meta.
- Actions workflow: typecheck → unit tests → build → deploy `dist/`; one-time manual step: set Pages source to "GitHub Actions".
- In-app install guide per platform, including "install before entering data on iPhone" based on Checkpoint 6 observations.

---

## 13. Decisions — status and remaining questions

### Approved
D1 ✔ · D2 ✔ (option A + §6.4 navigation) · D3 ✔ · **D4 revised → §6.9** · D5 ✔ (+ safeguards §6.1) · D6 ✔ (+ ICS consistency §6.11) · D7 ✔ · D8 ✔ · D9 ✔ · D10 ✔ (out of scope) · D11 ✔ · D12 ✔ · D13 ✔ `roll-crawl-run` (username pending) · D14 ✔ · D15 ✔ (modified: CDC + verified, permitted reputable sources)

### Remaining feasibility concerns & questions for clarification
| # | Item | My proposal |
|---|---|---|
| Q1 | **Vaccine entries that aren't simple age windows** (conditional, product-dependent dose counts, seasonal/annual, shared clinical decision-making). Representing them as dated windows would imply individualized determinations. | List them without computed dates under "Depends on your child's situation"; show product-dependent doses with a note. Final per-item mapping brought to you at Checkpoint 3. |
| Q2 | **Default vaccine schedule source** when the layer is first enabled. | No default: the first time the parent turns on the layer, they choose CDC/ACIP or AAP (with a one-line neutral description of each). |
| Q3 | **Reference layers default visibility.** | Both reference layers off until the parent turns them on (keeps the calendar uncluttered and makes the choice deliberate). |
| Q4 | **Corrected-age input bounds** (GA plausibility range). | 20w0d–41w6d as an input-validation range only, documented as such; you may prefer different bounds. |
| Q5 | **Age basis for care references.** Published well-visit and vaccine schedules are stated in chronological age. | Always use chronological age for these layers, with a note, even if Growth uses corrected age. |
| Q6 | **Merge complexity.** Partner collaboration (logical keys, three-way merge, conflict UI, aliases) is the most complex part of v1 and increases Checkpoint 5's size. | Keep as specified; I'd flag it as the main schedule risk. If time becomes a concern, the fallback (with your approval) would be supporting merge for milestones, history, completions, and Care Notes first. |
| Q7 | **Internal backup retention.** | Keep the 5 most recent automatic snapshots; purgeable per child; "Delete all internal backups" in Settings. |
| Q8 | **Device label** appears inside partner files to attribute history. | Optional, user-entered, defaults to blank ("Other device"). |
| Q9 | **Personal Reflections in partner shares.** You asked for exclusion by default; I assume an explicit opt-in is permitted (as for backups). | Allow opt-in with a warning that the partner will be able to read them. Confirm or tell me to block reflections from partner files entirely. |
| Q10 | **Profile deletion purge default.** | "Also remove from internal backups" checked by default. |
| Q11 | **Schedule changes during development.** If CDC/ACIP or AAP publishes a new schedule mid-project, which version ships? | Ship the latest version verified at Checkpoint 3; re-check at Checkpoint 6 and report any change to you. |

No previously approved functionality has been removed. The only structural change is that the "Recommended pediatric care" layer is now two independently toggleable reference layers (well-child visits; vaccination references), making four calendar toggles in total.

**Assumptions:** U.S. audience and guidance; English only; local time zone; no accounts.

---

## 14. Feature status summary
- ✅ **Full:** onboarding, chronological age, corrected-age calculation with safeguards, profiles & switching, 5 themes, navigation, Home, milestone library/records/history, interval + cumulative navigation with empty-interval panel, custom goals/exercises with recurrence & completions, transparent progress meters, history charts, calendar (month/agenda, CRUD, recurrence, four layers, family view), journal, resources & messages offline, three export workflows, import with validation/atomic apply, partner collaboration via file exchange with three-way merge & conflict UI, provider reports with print/PDF, .ics export, app sharing, settings, privacy disclosures, installable PWA, offline core, data-safe updates.
- ⚠️ **Limited:** corrected age (applicability is clinical), well-child & vaccination references (educational only; conditional items undated; content frozen at a version; contingent on verification), notifications (in-app/foreground + calendar alarms; no background), .ics (one-way; recurrence fidelity varies by calendar app, fallback provided), native share (browser support varies), platform storage behavior (verified on devices, not assumed), starter content coverage (only where sources publish; gross/fine app-assigned).
- 🔮 **Future:** real-time multi-device sync with end-to-end encryption (merge engine reusable), background push notifications, app lock/encryption at rest, dark mode, localization.

---

## 15. Documentation structure (you maintain; nothing fabricated)
- `README.md` — purpose, URL, install, features & status legend, privacy, disclaimer, stack, commands, credits/licenses.
- `docs/BUILD_LOG.md` — per entry: Date · What I asked Claude Code · What it produced · What I corrected or redirected · Notes. Left for you to write; at each checkpoint I provide a factual "what was produced" summary you can adapt. (Your Revision-1 review is a natural first "corrected/redirected" entry.)
- `docs/TESTING_CHECKLIST.md` — automated vs manual; result columns blank until actually run.
- `docs/KNOWN_LIMITATIONS.md` — all ⚠️/🔮 items, unverified content, device-observed storage behavior.
- `docs/DECISIONS.md` — ADR-style records for D1–D15, Q1–Q11, and later decisions.
- `docs/SOURCE_REGISTER.md` — source ID, organization, title, URL, version/date, retrieval date, content used, verification notes, **usage terms/permission basis**.

---

## 16. Verification of the finished build
1. `npm test` (Vitest) and `npx playwright test --trace off` pass.
2. `npm run build && npm run preview` → install from Chromium, go offline, exercise all core flows and a two-profile partner merge.
3. Deploy via Actions → run the manual checklist on a physical iPhone and Android phone; record only observed results.
