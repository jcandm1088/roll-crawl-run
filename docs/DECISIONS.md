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
1. **Age calculation rule.** Age is a calendar difference. A monthly anniversary that doesn't exist falls on the last day of that month, so Jan 31 → Feb 28/29, and a Feb 29 birthday counts on Feb 28 in non-leap years. *(The original compact display rule was superseded for personal ages by decision 39.)*
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

## Precise age display
39. **Personal ages use `formatPreciseAge()`:** years, months, and days, with zero parts omitted and no weeks or rounding. It replaces the compact format on Home, the profile list, and the forms. The compact `formatAge()` remains only for developmental/internal labels. *(This fixes a usability defect found in the owner's acceptance testing.)*
40. **`useToday()` keeps the date current:** a timer at local midnight, a re-check on resume (visibility, focus, pageshow), and a once-a-minute fallback.
41. **Age text wraps only between parts**, so a single part such as “5 days” is never split across lines.

## Publication compliance
42. **Third-party licenses** ship with the app (`public/licenses/`, precached) and are summarized in `THIRD_PARTY_NOTICES.md` and Settings → About. A test checks that they match the installed versions.
43. **The project license is deferred** by the owner; none has been added (a test checks this).
44. **Service-worker navigations** return an exact precached file when one exists, so license texts open as text even offline. All other navigations still return the app.
45. **Git history is preserved** (owner decision C): no commits were rewritten, and authorship and messages are unchanged.
46. **GitHub Action versions were left unchanged.** The workflow uses checkout@v4, setup-node@v4, upload-pages-artifact@v3, and deploy-pages@v4. Newer major versions exist (v7, v7, v5, and v5, found via `git ls-remote` of the official `actions/*` repositories), but their documentation could not be read from this environment, so no speculative upgrade was made. Revisit before the first deployment.

## Checkpoint 2a — verified milestone tracking
47. **Content:** the 159 CDC milestones (current web pages, content reviewed May 15, 2026), verbatim including pronouns. The source register is machine-readable (`src/content/sources.json`).
48. **Stable IDs** (`cdc22-mXX-{se|lc|cg|mp}-NN`) were assigned once and frozen in `milestone-ids.lock.json`. The lock pins each ID to a hash of its age, category, and text. IDs are never recomputed, removed, or reused, and any content change to a locked ID fails the build.
49. **Build-time validation** (`validateContent`, run by a Vite plugin and by unit tests) checks: IDs, sources, approved ages, category pairs, expected counts, interval mapping, duplicates, and attribution.
50. **Gross/fine motor** is the app's organizational split of CDC's Movement/Physical category (20/24). It is explained in the app; the 10 borderline assignments were approved.
51. **Current interval rule** changed to start < A ≤ end, matching milestone placement. This replaces the unused Checkpoint 1 rule; the unit test was replaced with equivalent coverage.
52. **Milestone age** is chronological by default, or corrected if selected. It is null before a corrected due date, and no clinical cutoffs are applied.
53. **Progress formula and neutral states** are as approved. Personal versions are never counted in CDC progress.
54. **Append-only milestone history with state snapshots.** Recording timestamps always increase, so order is exact.
55. **Observation removal adds a marker;** permanent erase (two steps) overwrites the text and leaves an erase marker. Profile deletion and reset remove everything.
56. **Personal versions** are separate records (`customItems`, kind `milestone`) with a provenance link (`derivedFromDefId`). The sourced original is never modified.
57. **Nothing is inferred:** no automatic achievements from age or from later milestones. Early recordings are allowed but don't count until the milestone applies.
58. **Settings → Milestone Viewing Preferences** displays the existing per-child setting and links to it. There is no second setting.
59. **Source compliance:** AAP and HealthyChildren are excluded and their domains removed. Pathways.org is not to be collected until its terms are approved. A source's terms must be reviewed before any future automated collection.
60. **No new dependencies, no schema change.** The JavaScript bundle grew from about 115 KB to about 217 KB, mainly because of the bundled milestone and source data.

## Checkpoint 2a — handoff consolidation and recovery (2026-11-26, documentation only)
*Earlier decisions are kept as recorded. Where one is updated, the update is a new entry that names it.*

61. **Update to #46 (GitHub Action versions).** #46 said to revisit the versions “before the first deployment”. The first deployment (`e40287f`) then went ahead with the unchanged versions and succeeded. The upgrade **remains deferred pending the owner's review**, to be resolved before relying on future deployments.
62. **Single current-state handoff.** `docs/HANDOFF.md` is the one authoritative current-state handoff. The end-of-Checkpoint-1 handoff is preserved unchanged as `docs/reviews/CHECKPOINT_1_HANDOFF.md`.
63. **Remote checkpoint preservation.** After the conversation-transfer incident (Checkpoint 2a existed only in a previous conversation's workspace), completed checkpoints are preserved on a separate, non-`main` remote branch (for example `checkpoint-2a`), only after a publication safety review and with the owner's explicit authorization naming the branch. This never merges into `main` and never deploys. Session-specific branch restrictions are respected; any conflict is reported before pushing.
64. **Refinement backlog.** `docs/REFINEMENT_BACKLOG.md` records observed refinements and suspected defects. Recording an item does not authorize a fix. First item: R-001, onboarding child-name input overflow.

## Checkpoint 2a — Growth UX refinement (owner-approved, 2026-11-26)
*These supersede earlier Growth decisions where they conflict; earlier entries are kept as recorded.*

65. **Growth order** Progress → Milestone Library → Goals & Exercises → What to Expect, with the approved subtitles (supersedes the R4 order). This is a requirements change, not a regression.
66. **What to Expect is exclusively informational (D-1, D-2, D-3).** It has no status, recording, progress, hidden-item or personal-version features and no link to the Library. The superseded `#/growth/expect/all` address redirects to the Library's Up to now view. Educational content comes from `guideFor(range)`, which takes no records. The screen loads only the child's milestone age (`useMilestoneAge`), never milestone records.
67. **Educational content: Option A only (D-9); Option B deferred (D-10).** Validated at build time by `validateGuide()` for traceability; accuracy rests on the documented meaning review. The CDC display heading “Movement/Physical Development” was verified on registered pages (Q-3); the identifier is unchanged.
68. **Library views and ordering (D-4, D-5, Q-8).**
    - Up to now (default; most recent CDC age first), Upcoming (nearest first), All 159 (youngest first).
    - Within an age, the app areas in established order, then CDC order.
    - Personal versions are listed when “All areas” or “Your versions” is selected.
69. **Library state (D-11).**
    - **In memory only:** view, filters, search and scroll position are restored after visiting a milestone.
    - **Reset:** they reset for another child and when opened from a shortcut.
    - **Preset address replaced:** a preset address is replaced by the plain Library address only while it is still current, avoiding a race with a newer navigation.
70. **Progress (D-6, D-7).** Adds the “Milestones recorded as achieved” headline, the “What updates Progress?” card, area rows linking to the filtered Library, and a collapsed “By CDC age” breakdown (`progressByReferenceAge`, applicable ages only, built on the existing `summarize`). No calculation rule changed.
71. **Recording confirmations (D-8).** `confirmationFor()` (pure) computes each message from the resulting record using the same applicability rule as Progress; the milestone detail workflow is otherwise unchanged.
72. **No development terms in the app (D-12).** `PlannedTag` now reads “Coming soon”. Home, tab previews, Settings planned rows and Settings → About no longer mention checkpoints. Settings → About now names the CDC milestone source.
73. **Q-5 alignment.** The unsourced “Children develop at different rates” was replaced by the 75%-basis wording, and the CDC “Concerned” page is described neutrally (“has more information”).
74. **No schema change and no new dependency.** The JavaScript bundle grew from about 217 KB to about 241 KB (63 KB gzip), mainly the guide content and screens.

## Checkpoint 2a — human acceptance refinements (owner-authorized, 2026-11-27)
*Owner-discovered usability findings R-004 to R-008. These supersede earlier decisions where they conflict; earlier entries are kept as recorded.*

75. **Design principle: parent-first interface, evidence-backed infrastructure.** It applies to all future checkpoints.
76. **Gender-neutral display layer (R-004).**
    - `milestones.display.json` adapts the 41 gendered CDC items.
    - `validateDisplay` proves each adaptation is CDC's text with only declared pronoun → neutral and verb-agreement replacements.
    - The catalog, lock and hashes are unchanged (updates #47's “verbatim including pronouns” for **display only**).
    - Adapted wording is disclosed and CDC's original is shown on the milestone page.
    - No gender field in onboarding.
77. **CDC reuse conditions (owner review requested).** #47/SOURCE_REGISTER recorded “wording is unchanged, including pronouns”. That is no longer true of the display. Claude Code considers the change non-substantive and disclosed; the owner must confirm.
78. **Personal milestone creation removed (R-005); supersedes #56's creation path.** Existing records are untouched and reachable in the collapsed “Your personal entries” Library section. `createPersonalVersion` remains in the repository only as the reference for the record shape. The 2b treatment is to be decided by the owner, with no automatic migration.
79. **Terminology (R-006).** The superseded labels are replaced by plain terms (“By age” supersedes #70's “By CDC age”; “All (159)” / “All milestones” supersede #68's “All 159”). Attribution is consolidated into:
    - the `SourceNote` on Progress and the Library;
    - the per-milestone source line;
    - the guide's Sources card;
    - the full About card.

    Non-endorsement, free availability and safeguards are retained.
80. **Guide content revision (R-006).** `guide.cdc-2022.json` (`guide-2026-11-27`) replaces repeated CDC phrasing: “CDC lists things like” becomes “milestones include things like”, plus the shared paragraphs. The meaning is unchanged and the traceability validation is unchanged; it now also rejects gendered words.
81. **Notes & Observations (R-007); supersedes the separate note and observations UI of #55.**
    - New entries are `observation` events.
    - Edits are a new append-only `observation-edited` event type in the existing store. This is not a schema change: the database stays at version 2 and nothing is migrated.
    - The legacy `record.note` is shown as an entry with “No observation date”, editable and removable through the existing note functions.
    - Erase covers every version of an entry, and identical note versions.
82. **Entry date default.** Today, and reset to today after each added entry.
83. **Age settings link (R-008).** `#/profiles/<id>/age` (`section: 'age'`) opens the selected child's profile at the Corrected age section and returns to Progress. The form and age engine are unchanged.
84. **Library search** matches the displayed (gender-neutral) wording.
85. **No schema change, no new dependency.** The JavaScript bundle grew from about 241 KB to about 255 KB (63 → 66 KB gzip): the display layer, the validator and the Notes & Observations UI.

## Checkpoint 2a — final review resolution (owner, 2026-11-27)
86. **Resolution of #77 (gender-neutral display wording).**
    - **Review:** on **November 26, 2026**, the owner independently reviewed CDC's “Use of Agency Materials” (https://www.cdc.gov/other/agencymaterials.html). Condition 3: “You may not change the substantive content of the materials.”
    - **Decision:** the owner approves the display approach because the reviewed changes are grammatical adaptations, not substantive changes to developmental guidance. This is the owner's reasoned editorial and product-design determination. It is **not** CDC approval, a legal certification or an official agency interpretation.
    - **Safeguards that must stay:**
      - the verbatim source catalog;
      - the separate display layer;
      - validation of permitted substitutions;
      - original reference ages and substantive qualifiers;
      - adaptation disclosures and access to the original wording;
      - attribution, prominent non-endorsement and free-availability statements.
87. **Legacy personal entries.** The current preservation and management approach is retained. Optional conversion to goals and permanent deletion are deferred to Checkpoint 2b.
88. **Erasure scope (clarification; no behavior change).** Permanent erasure is limited to one child, one milestone or personal entry, and one note or observation lineage. A permanent regression test now covers this (secondary review).

## Checkpoint 2b — Goals, Exercises & Historical Progress (owner-authorized 2026-11-27)
*Product design approved by the owner and secondary reviewer; implementation plan approved with modifications. The plan is preserved in `docs/reviews/CHECKPOINT_2B_IMPLEMENTATION_PLAN.md`; where the owner's authorization differs, the authorization controls.*

89. **D1 — Database version 3 (approved).** Additive migration inside the atomic upgrade transaction:
    - new store `itemEvents` (append-only history and Notes & Observations for goals, achievements and exercises), kept apart from `milestoneEvents` so milestone calculations and Home's Recent milestones can never include personal history;
    - new store `trackerState` (device-local in-progress stopwatches and counters; never shared);
    - `completions`: the unique index `[customItemId, occurrenceDate]` is replaced by a unique `[customItemId, slotKey]` (logical session key) plus `[childId, occurrenceDate]`.
    No existing record is read, rewritten or converted; a failed upgrade leaves version 2 untouched. Both new stores are child-scoped (profile deletion and reset remove them).
90. **Blocked-upgrade handling.** `openRcrDb` reports `blocked` (another copy still holds the old version: “Almost ready … please close the other copies”) and `blocking` (this copy closes its connection and asks for a reload). The database is never reset or recreated.
91. **D2 — Browse reference ages (approved with modification).** CDC's 12 ages plus All ages; default = the most recently reached CDC age by milestone age (3→2, 5→4, 7→6, 10→9, 14→12, 20→18, 40→36, over 60→60). Under 2 months, or before the due date, no default: a calm intro offers the 2-month activities or another age. The selected reference age is labelled separately from the child's age. The three-month intervals are unchanged elsewhere.
92. **D3 — Activity inventory (approved subject to corrections).** 162 CDC tip records → 153 activities; 93 tips excluded as general parenting guidance. Final record: `docs/reviews/CHECKPOINT_2B_ACTIVITY_INVENTORY.md`. Titles, areas, grouping, materials phrases, sentence roles and the safety-sensitive flag are the app's editorial organization.
93. **D4 — Gender-neutral activity wording (approved).** Same validated method as milestones (pronouns, “his or her” → “their”, verb agreement), extended with the approved -ies → -y agreement rule (tries → try, copies → copy). Applied to instructions, purpose, safety and page guidance; purpose and safety are sentences of the validated display text. One disclosed typographical correction (“helps you child” → “helps your child”). Exact CDC wording is stored and viewable. Not CDC-approved.
94. **D5 — Milestones chart basis:** current corrected records (achievement date of milestones currently Achieved). Corrections move entries; reversals and deletions remove them. `stateAsRecordedAt()` remains unused by charts (updates the R9 planning note).
95. **D6 — Hidden milestones** are excluded from the chart with a visible count. The progress engine is unchanged.
96. **D7 — Chart periods:** 6 months (default) and 1 year; months before the birth month are not drawn; a text table is always available. No all-time view.
97. **D8 — Goal inspiration:** “Start from a milestone” (search or upcoming milestones; nothing assigned; linking never changes the milestone) and eight app-written example ideas, labelled as not CDC recommendations.
98. **D9 — Legacy personal entries:** explicit “Move to My Goals” (preview and confirmation; no automatic undo) and “Delete permanently” in a collapsed “Manage this entry” section on the existing personal entry page. Achieved → achievement (its recorded date; if none, the parent must supply a known date or leave it). Emerging/Not yet → active goal with an unknown start date unless the parent gives one. Derived milestone → optional related milestone. History copied with new ids and remapped references; erased text stays erased; the legacy entry becomes a content-free tombstone with `convertedToItemId`; atomic and idempotent.
99. **D10 — Deletion safeguards:** two-step confirmation (Cancel first) inside collapsed Manage/Advanced sections for goals, achievements, exercises and legacy entries, describing effects on records, history, sessions, notes and counts. Typed confirmation stays for profile deletion and reset. Deletion leaves a content-free tombstone.
100. **D11 — Schedule changes** take effect today as a new schedule version; earlier versions and records are kept. Sessions already recorded today are never deleted; those beyond a reduced daily count are shown as additional sessions, so the bar never exceeds 100%.
101. **D12 — Stopwatch** (count-up only, owner design §4): elapsed = banked time + time since Start/Resume, measured with `performance.now()` while the page is open and recovered from the stored wall-clock start after suspension or reload. A reopened running stopwatch shows a recovery notice (Keep running / Pause / Enter duration manually). Detectable clock anomalies (clock moved back, > 1 hour unexplained gap, > 12 hours running) require review before saving. A target only gives a subtle indication; nothing stops or saves automatically. Saving captures and stops the time; a failed save keeps the time and note.
102. **D13 — Home card** after Quick actions, before Milestone progress, only when sessions are scheduled today; heading, count, the same daily bar and “View today's routine” (focuses Today's routine). Same `routineFor()` calculation as Exercises.
103. **D14 — Archived records:** archived accomplishments and sessions still count in totals and charts; archived active goals aren't active; deleted records are excluded.
104. **D15 — Landing summaries:** My Goals “N working toward · N accomplished” (or “Nothing added yet”); Exercises “Today: N of N done” (or “Nothing scheduled today”). The Growth card shows one short line.
105. **D16 — Sessions per scheduled day: 1–24, default 1** (an app capacity limit, not a recommended frequency). More than 6 sessions show a count instead of individual dots. No clock times, alarms or reminders in 2b.
106. **Implementation decisions:**
    - goals, achievements and exercises are `customItems` kinds; exercise–goal links are stored once, on the exercise (`goalIds`);
    - session logical key `slotKey` (`YYYY-MM-DD#n` or `extra:<uuid>`); reversal sets `reversedAt` and re-recording the slot revives the same record; moving a session reverses the original and records a linked one (`correctsSessionId`) in one transaction;
    - tracker state is revision-checked: a write based on an older revision is refused and the newer state shown (multiple open copies); sessions use pre-generated ids so repeated saves are idempotent;
    - Notes & Observations UI is shared (`ui/components/NotesAndObservations.tsx`); personal history uses the same edit/remove/erase rules; erasing affects only that item's entry lineage (and identical note versions of the same item), never other records with identical text;
    - recommended activity content is bundled and validated at build time (`validateActivities`, lock file); the JavaScript bundle grew from about 255 KB to about 512 KB (66 → 116 KB gzip), mainly the activity content (≈ 138 KB of JSON). No new dependencies.
