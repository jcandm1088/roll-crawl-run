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
96. **D7 — Chart periods:** 6 months (default) and 1 year; months before the birth month are not drawn; a text table is always available. No all-time view. *(Before-birth part superseded by #115, R-017.)*
97. **D8 — Goal inspiration:** “Start from a milestone” (search or upcoming milestones; nothing assigned; linking never changes the milestone) and eight app-written example ideas, labelled as not CDC recommendations. *(Examples superseded by #107, R-010.)*
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

## Checkpoint 2b-R — Human Acceptance Refinements (owner-authorized 2026-11-27)
*Authorized after the owner's Mac Safari acceptance of Checkpoint 2b (64 of 65 applicable checks passed). Where these differ from #89–#106, these take precedence. Report: `docs/reviews/CHECKPOINT_2B_R_REFINEMENT_REPORT.md`.*

107. **R-010 — Age-responsive goal ideas (supersedes the eight examples of #97/D8).** Six browsing ranges on the child's milestone age in completed months: [0,6) “Birth to under 6 months”, [6,12), [12,24), [24,36), [36,48), [48,60] “48 to 60 months”; older than 60 → the last range with an explanation; before the due date → no range, a neutral note and explicit browsing. 70 app-written ideas (8–12 per range, all five areas in each), each traced to verified milestones and/or activities whose reference ages lie within the range (upper bound included). Content `src/content/goal-ideas.app-2026.json`; validation `validateGoalIdeas` at build time; mapping `docs/reviews/CHECKPOINT_2B_R_GOAL_IDEAS.md`. Ideas fill in only the goal's name and area; no date, link, schedule or assignment. “Start from a milestone” is kept. The D8 examples were an approved design that proved insufficiently useful in human testing, not a programming defect.
108. **R-010 implementation choices (not separately specified):** the selected range is kept in the address (`#/growth/goals/ideas/<range>`) so it survives Back; an idea does **not** pre-link a milestone (keeps ideas visibly distinct from CDC milestones; the parent can link one); safety-sensitive supporting activities show their CDC safety sentences with the idea and link to the activity; titles may not be identical to a milestone or activity title (avoids duplicating the libraries).
109. **R-011 — Centralized attribution.** Design rule: source attribution is centralized in one place per screen wherever practical. Activity pages: badge “Recommended activity”, “Reference age(s): 2 months”, no agency name in the safety card or the tracker's safety line; a **Source** section keeps CDC attribution, the page link, review date, non-endorsement, “available free”, the app-organization note and the original wording. Browse Exercises keeps its general attribution and non-endorsement note. Adopted exercises keep their provenance badge (“From CDC’s activity tips” / “Adapted by you from a CDC activity”) and the collapsed “Original activity and source”; parent-edited instructions are labelled “Your instructions” and never attributed to CDC. No safety sentence or page guidance was removed; content and validation are unchanged.
110. **R-012 — Grouped-choice headings** use a floated legend inside the card (`.choice-group`), applied to “How do you want to track it?”, “How often?” and “Where is it from?” on the add and edit exercise forms. Cause: an unfloated legend is drawn on the fieldset's top border.
111. **R-013/R-014 — One duration component** (`DurationFields`: equal grid columns, labels above, ≥ 44 px fields, centred tabular digits) for the stopwatch target, manual entry in the stopwatch, “Record a session” and session correction; plus a guard rule so side-by-side `.field`s never get the stacked-field margin. Cause: `.field + .field { margin-top }` pushed the second field down. Validation, parsing and persistence unchanged.
112. **R-015 — Deleting a session (supersedes “Remove/Restore” for sessions in #106).** “Delete” → “Delete this session?” / “This session will be removed from your exercise history and progress totals.” with **Cancel** (primary, focused) and **Delete session**. The session record becomes a content-free tombstone (id, child, exercise, date, `deletedAt`, `deletedSlotKey`, lineage); `slotKey` becomes `deleted:<id>` so the slot is free and the unique logical key holds. Reversed earlier versions it was moved or corrected from are tombstoned too (their note and values go); live sessions are never touched. A new content-free `session-deleted` history event is recorded but not shown; history entries about deleted sessions are hidden. A deleted id is never revived (a retried save gets a new id). **Database version 3 is unchanged** (no new store or index; tombstones are ordinary records). Undo after recording now deletes rather than reverses.
113. **R-015 — Reversed sessions are no longer listed.** Records with `reversedAt` (the original of a moved session, and sessions removed by the 2b “Remove” action) were already excluded from every total; they are now also hidden from the session list. Existing reversed records from 2b testing are **left unchanged** (not scrubbed automatically) and are hidden; they no longer have a Restore action. Recorded as a limitation.
114. **R-016 — In-sheet notices with actions** (`.notice-panel`): text, then full-width actions in one column, the primary action first. Applied to the stopwatch recovery notice (Keep running primary; Pause; Enter duration manually), the reset confirmation, the clock-anomaly review and the anomaly warning. No timing, recovery or persistence logic changed.
115. **R-017 — Reporting periods (supersedes #96/D7 “months before the birth month are not drawn”).** 6 months = exactly six calendar-month positions and 1 year = exactly twelve, ending with the current month (“so far”). Each month has a status: `counted` (a number, including 0), `before-birth` (not applicable; “–” in the chart, “Before birth (not applicable)” in the table) or, for exercises, `not-tracked` (dotted baseline, “Not tracked yet”). A month with recorded sessions is always counted, even if backdated before the exercise existed. Chart and table use the same buckets; a legend explains the marks (not colour alone). Milestones/Goals/Exercises views, corrected-record counting, hidden-milestone exclusion and count, archived treatment, exclusions and profile isolation are unchanged; still no combined score.
116. **R-018 — Shading distinction:** recorded and deferred (low priority; reassess after iPhone use). Not implemented.
117. **Scope:** R-001, R-003 and R-009 stay deferred. The suspected legacy-entry concern was a misunderstanding; no legacy-entry change. No Checkpoint 3 work, new dependencies, external services, sources, AI, analytics, accounts or credentials. Milestone calculations unchanged.

## Checkpoint 2b-R closeout and submission scope revision (owner, 2026-11-27)
118. **Checkpoint 2b-R accepted for continued development.** Owner's Mac Safari acceptance against `b45af43`: GR1–GR15 all passed (15 of 15 applicable). R-010 to R-017 closed as human-accepted. GR16 and all outstanding physical-iPhone, installed-app upgrade and device-level offline-editing checks (for 2a, 2b and 2b-R) are deferred to consolidated final acceptance in Checkpoint 6; they are not completed.
119. **Checkpoint 3 is now a Simplified Calendar** (supersedes the earlier Calendar & Reminders scope): a standalone record-keeping calendar — monthly view with navigation and today highlighted, date selection, upcoming events, and three independently toggleable overlays: **Recommended vaccine schedule** (the only automatically populated overlay; **off by default**), **Medical appointments** and **Personal**. Parent-entered events have a title, date, optional time, optional location and optional notes, and can be created, viewed, edited and deleted. Child-specific, local, offline, all five themes. The vaccine schedule must come from an authoritative U.S. childhood schedule whose content-use permissions are researched and verified during Checkpoint 3; source-defined age ranges are preserved and recommendations are kept visibly distinct from actual appointments. **Removed from scope:** goal and exercise integration, automatic therapy scheduling, the well-child reference schedule, recurring events, notifications and reminders, external calendar export, personalized vaccine eligibility or catch-up recommendations, and vaccination compliance tracking. It is not a developmental scheduling system.
120. **Checkpoint 4 — Journal** keeps the approved scope (Personal Reflections and Care Notes, local persistence, offline operation, privacy distinctions). **Resources is removed from the primary navigation in the submission version**; required source attribution and existing source information stay elsewhere in the app.
121. **Checkpoint 6** — final testing, deployment and consolidated physical-iPhone acceptance — completes the submission.
122. **Deferred until after submission (not abandoned):** Checkpoint 5 (backup, export and restoration; partner sharing and synchronization; provider reports) and Resources, plus deferred refinements R-001, R-003, R-009 and R-018. Their approved requirements remain in the development plan.
123. **Submission timing:** preferred deadline about 12 hours, up to 36 hours acceptable. The several-days-of-use requirement was removed by the professor; no mandatory post-deployment waiting period.
124. **Accepted limitation:** the submission version provides no supported backup or restoration; if local app data is lost (cleared browser data, removed app, lost device) it cannot be recovered.

## Checkpoint 3 — Simplified Calendar (owner authorization, 2026-11-27)
*Decisions #125–#131 are the owner's answers to the seven preparation questions; #132–#137 are implementation choices made within them. Report: `docs/reviews/CHECKPOINT_3_IMPLEMENTATION_REPORT.md`.*

125. **Vaccine schedule version.** Use CDC's July 2, 2025 childhood immunization schedule, which CDC's own pages identify as its current schedule under a preliminary court order of March 16, 2026 (*American Academy of Pediatrics et al. v. Kennedy et al.*, D. Mass.). The legal circumstances are recorded in SOURCE_REGISTER. **A currency recheck is required at Checkpoint 6.**
126. **Primary source.** CDC's parent-facing schedule (“Recommended Immunizations for Birth Through 6 Years Old, United States, 2025”) supplies the displayed names, dose labels and ages, cross-checked against CDC's professional table, notes and addendum.
127. **Age representation.** Source age ranges are kept whole and inclusive. Calendar dates are a display convention, not individualized clinical deadlines. A single recommended age is **one** labelled reference marker on the corresponding chronological age anniversary; it is never widened into a month-long window. Nothing is presented as a booked appointment or an individual due date.
128. **Conditional recommendations** (product-dependent, seasonal, individually decided, high-risk, travel) are shown in a compact, undated “Ask your child's provider about” section with their age and CDC's qualification. No date is calculated for them.
129. **Overlay preferences are device-wide**, in the existing `Settings.layers`: `vaccines` (off by default), `medical` (new field, on by default), `personal`. Events and derived vaccine information stay child-specific. `wellVisits`, `therapy` and the other earlier calendar settings remain as inert fields; they are not overlays.
130. **Deleting an event removes it outright**, after a confirmation. No title, note, location or tombstone is kept. (Unlike exercise sessions, #112: synchronization is outside the submission scope.)
131. **R-014:** the test-only timing correction is authorized as part of Checkpoint 3 (wait for entrance animations; read related rectangles in one evaluation; tolerances and assertions unchanged).
132. **Storage.** Parent-entered events use the existing `events` store and `byChild` index; **database version 3 is unchanged**. Record: the common envelope plus `recordType: 'calendarEvent'`, `childId`, `kind` (`medical` | `personal`), `title` (1–120), `date`, `time` (`HH:MM` or null), `location` (≤ 200), `notes` (≤ 2000). Every write is one transaction that also checks the child exists; anything else found in the store is ignored and never altered. Dates from 1990 to 2100. Times carry no time zone. Vaccine references are never stored.
133. **Profile safety.** The event form is a modal sheet (the child selector can't be used through it; tapping outside closes it unsaved); the Calendar screen is keyed by child id, so a switch closes any form; the save path and the repository both refuse a write for a child other than the one the form was opened for.
134. **Markers and the grid.** Circle = medical, square = personal, hollow diamond = vaccine schedule reference; each also has text. A reference marks one day (its age anniversary, or a range's first day). Days inside a range are not marked; ranges appear as context for a selected day and in a collapsed month summary.
135. **Calendar behavior not separately specified.** Weeks start on Sunday. Changing month selects today if it is in that month, otherwise the 1st. The form opens on the selected day with “Medical appointment” preselected. Upcoming = today and later, all-day before timed, then by time and title; five shown with “Show all N”. A note says when hidden groups have events on the selected day, and when a saved event falls in a hidden group. Arrow keys, Home/End and Page Up/Down move between days and months.
136. **Related screens.** Settings “Calendar & Reminders” becomes “Calendar” and describes what exists (no reminders, no phone-calendar export). Home's “New event” quick action is live, and the “Coming up” placeholder is a live card with the next three parent-entered events (no vaccine information). *These Home changes replace placeholders that would have been stale; they are flagged for the owner's confirmation at acceptance.*
137. **Wording rule for vaccine references.** The app says “reference age”, “not an appointment”, “not deadlines”. It never says due, overdue, up to date or eligible, never tracks vaccines given, and states that the child's healthcare provider determines the schedule and that neither CDC nor a clinician has reviewed the app.

## Checkpoint 3 human acceptance and refinements R-019 to R-022 (owner, 2026-11-27)
138. **Checkpoint 3 accepted on Mac** (Safari, against `c5017da`): CAL1–CAL33 passed; CAL34 (keyboard) and CAL35 (offline editing) not human-tested; CAL36 (iPhone) deferred to Checkpoint 6. Formal closeout follows the owner's visual acceptance of R-019 to R-022.
139. **Home (confirms #136):** the live “New event” action and the upcoming-events card are approved. The editor's dismissal behavior and the narrow Calendar layout are accepted for submission, subject to final physical-device review.
140. **R-019 — Parent-friendly vaccine language (supersedes the wording parts of #134 and #137).** Source attribution and disclaimers are centralized. One visible statement: “Your child's healthcare provider determines their individual vaccination schedule. The dates shown are general recommendations, not scheduled appointments or confirmation of eligibility.” One visible source line under the heading **Source**: “Based on the CDC childhood immunization schedule, July 2, 2025. This app is not endorsed by CDC, HHS or the U.S. Government and has not been clinically reviewed.” The complete title, version, retrieval date, free-availability statement, original link, snapshot-currency limitation and method are in an expandable “Source details”. No “CDC” label beside individual recommendations; headings read “Recommended vaccinations: <age>” and “Next recommended vaccinations: <age>”. All ages, qualifications and the conditional-item behavior are unchanged. The app still never says due, overdue, up to date or eligible.
141. **R-019 implementation.** A display layer is added beside the source record instead of rewriting it: `parentNote` for each qualified reference, and `parentText`, `parentTextVerbatim` and `parentNote` for provider-discussion items (`contentVersion … .app-2`). `qualification`, `cdcText`, `cdcKey` and `appNote` are unchanged. Validation requires a parent-facing note for every qualification, forbids source-prefacing language in it, requires every exact quantity (grams, weeks, days, months, years) to survive, and requires text marked verbatim to equal CDC's wording. CDC's sentence “Visit CDC Travelers' Health for more information.” is kept word for word (it names a resource).
142. **R-020 — Symbols.** Medical appointments: an upright cross with a short crossbar above the middle, in `--primary`; never the equal-armed red cross emblem. Personal: a heart, in `--text`. Recommended vaccinations: the hollow diamond. 10 px in the grid (9 px below 360 px wide), 12 px elsewhere. Accessible names are unchanged except that a marked day now says “recommended vaccinations”.
143. **R-021** Home's card is headed “Upcoming Appointments”. **R-022** the Settings Calendar section uses the shared `panel-pad`.
144. **Reduced regression cadence for this round only.** Because the changes are presentation-only and the accepted implementation had passed three consecutive complete cycles, the owner authorized targeted tests plus **one** complete clean cycle. The three-cycle standard stands for other work.
145. **Visual acceptance of the refinements** (owner, Mac Safari, against `77d263b`): CR1–CR5 and CR7–CR9 passed; CR6 failed on the medical symbol's shape only. R-019, R-021 and R-022 are accepted, as are the heart and the diamond.
146. **R-020 medical symbol, corrected (supersedes the medical part of #142).** A simple plus: horizontal and vertical bars of equal length and uniform thickness, crossing at the exact midpoint of both, four equal arms; in the theme's `--primary`; thin bars (one sixth of its width), so it is not the Red Cross emblem. Sizes, spacing and accessible names are unchanged. The earlier upright cross with a raised crossbar came from a misreading of the request and is withdrawn.
147. **Testing for the symbol correction:** targeted tests, type check and production build only (authorized; an isolated visual change). Full regression resumes at Checkpoint 4.

## Checkpoint 3 formal acceptance and Checkpoint 4 design decisions (owner, 2026-11-27)
148. **Checkpoint 3 formally accepted** for the submission version, with all four refinements R-019 to R-022, subject to the final physical-device and publication checks. CR6b (the corrected plus) was accepted through **delegated secondary review** by ChatGPT (archive, source-difference and screenshot review of `c8aa0c5`); it was not an additional owner-performed Safari test. The symbol correction had targeted testing only, as authorized. Accepted commits: `c5017da6ea9525adc6681efdee2c59b3e7cb3099` (implementation), `77d263b6243edd99ea7a8e0d2ce159fab303010f` (refinements), `c8aa0c54350fbe79df7bbeb4a40448560e20b265` (symbol correction).
149. **Carried to Checkpoint 6:** keyboard operation and offline editing confirmed by a person; physical-iPhone acceptance; the vaccine schedule currency recheck.
150. **Preservation.** The accepted commits and the documentation-only closeout are preserved by a normal push to `claude/great-dijkstra-wwi9g1` after a publication safety review. No force push, merge into `main`, workflow run or deployment.
151. **Checkpoint 4 — Journal: owner-approved design decisions** (to be implemented in a fresh conversation; nothing built yet):
    - One combined chronological Journal feed, newest entries first.
    - Two entry types, Personal Reflections and Care Notes, visually distinguishable.
    - Each entry: optional title, free-form text, a date, and optional parent-created tags.
    - Create, view, edit and delete entries.
    - Search and filtering by type, date, tags and text.
    - Care Notes can be flagged as a question for the provider, with an answered status and an accessible filter for unanswered questions.
    - Child-specific isolation and offline persistence.
    - Resources is removed from the primary navigation; necessary source attribution is preserved elsewhere.
    - No integration with Growth or the Calendar.
    - No photo attachments in the submission version.
152. **Journal photographs are deferred** (R-023): a desirable future enhancement, deliberately left out by the owner, to be reconsidered alongside or after backup and restoration (Checkpoint 5), since photos stored only on the device can't be recovered without it.
153. **Remaining sequence (unchanged):** Checkpoint 4 next; Checkpoint 5 deferred until after submission; Checkpoint 6 final acceptance and publication.

## Checkpoint 4 — Journal, and Resources removed from the navigation (2026-11-27)
*#154 is the owner's authorization. #155–#168 are implementation choices Claude Code made within the approved design (#151) where the owner had not given explicit guidance; each is open to the owner's correction at acceptance.*

154. **Checkpoint 4 authorized** by the owner in a fresh conversation, after a complete baseline cycle on the authoritative HEAD (427 unit, 251 end-to-end). Scope: the Journal as designed in #151, a centralized privacy notice, and removing Resources from the primary navigation. No push, merge or deployment is authorized.
155. **Storage.** Entries use the `journal` store and `byChild` index that have existed since database version 1; **database version 3 is unchanged and no migration runs**. Record: the common envelope plus `recordType: 'journalEntry'`, `childId`, `type` (`reflection` | `care`), `date`, `title` (may be empty), `body`, `tags` (array), `isProviderQuestion`, `answered`. Every write is one transaction that also checks the child exists and, for an edit, an answered change or a deletion, that the entry belongs to the child the editor was opened for. Anything else found in the store is ignored and never altered.
156. **An entry has a date, not a date and time** (the original §4 table said `dateTime`; the approved design says “a date”). It defaults to today, can be any earlier date from 1990, and **cannot be in the future**.
157. **Limits.** Title optional, up to 120 characters. Text required, up to 20,000 characters (several pages; the limit protects the device's storage). Up to 10 tags of up to 30 characters each. The text field has no hard typing cap: an over-long entry gets a message instead of being cut silently.
158. **Tags** are typed as a comma-separated list. Spaces are tidied, a leading “#” is dropped, and a tag repeated in different capitals is kept once. The editor offers the child's existing tags as one-tap additions. There is no tag management screen: a tag exists while an entry uses it.
159. **Feed order:** entry date, newest first; on the same date, the most recently written first; then by id, so the order never varies.
160. **Search and filters** only choose what is shown. Search looks in the title and text (not tags, which have their own filter), ignores capitals and needs every word. Type, the unanswered-question filter, an inclusive date range and tags all combine; when several tags are chosen an entry must have all of them. Filters reset when the Journal is left or the child changes. The type and unanswered filters are always visible; dates and tags are one tap away under “Dates and tags”.
161. **Provider questions.** Only a Care Note can be flagged, and only a flagged note has an answered status. The status can be changed from the feed, from the open entry, or in the editor. Changing it writes that one field. Turning a question into a Personal Reflection, or removing the flag, clears the status.
162. **Deleting an entry removes it outright** after a confirmation: no title, text, tag or tombstone is kept (as for calendar events, #130).
163. **Unsaved changes.** Cancel, Escape and a tap outside an editor ask “Discard your changes?” when something has changed since it opened (“Keep writing” is the first, focused choice). An untouched editor closes at once. Nothing is saved automatically and no draft is kept.
164. **Privacy notice** (one, at the foot of the Journal): “Journal entries are kept on this device only. The app doesn't encrypt or password-protect them, so anyone who can use this unlocked device may be able to read them. This version can't back up or restore entries.” The original label “Personal · excluded from sharing by default” is **not** shown, because nothing can be shared yet. Settings → Privacy's sentence about sharing now says that this version cannot share, export, back up or restore, and that if sharing is added later Personal Reflections will be left out unless the parent chooses to include them.
165. **Future requirement preserved, not built:** Personal Reflections are excluded by default from all three planned export workflows, including full backups, unless the owner explicitly includes them. The `type` field is what a later export will use.
166. **Telling the two types apart.** Label and icon first (heart, “Personal Reflection”; document, “Care Note”). Second cue from existing theme colors only: a `--primary` left edge and `--primary-soft` badge for reflections; a `--border-strong` edge and `--surface-sunken` badge for care notes. No new color tokens.
167. **Resources.** The tab, its route and the placeholder screen are removed; the old address `#/resources` opens Home. The primary navigation is Home, Growth, Calendar, Journal. Settings is unchanged. Source attribution stays where it was: Settings → About, Growth → About these milestones, each milestone and activity, and the Calendar's Source section. The deferred Resources requirements (§6.13) and SOURCE_REGISTER are untouched.
168. **Home.** “Journal entry” is a live shortcut that opens the Journal with a new entry (`#/journal/new`). **The “Coming next — Daily encouragement” placeholder card is removed**, because daily encouragement belonged to the deferred Resources work and the card promised something the submission version won't have. *This is a Home change beyond connecting the shortcut; flagged for the owner's confirmation.*

## Checkpoint 4 human acceptance and refinements R-024 to R-026 (owner, 2026-11-28)
169. **Checkpoint 4 human acceptance (owner, Mac Safari, against `7e9eb87`):** J1–J4, J6, J8–J10, J12–J25 and J28 passed (23). **J11 failed** (the two entry types were not distinct enough at a glance). J5, J7, J26, J27, J29, J30 and J31 were **not human-tested** (7) and are carried to final acceptance; J32 is deferred to Checkpoint 6. The owner approves the Journal's overall design, and confirms and approves that an entry without a date cannot be saved. The #155–#168 choices stand except where #170–#172 change them.
170. **R-024 — four primary views, one selected at a time (supersedes the type and unanswered-filter parts of #160).** All, Personal Reflections, Care Notes, Unanswered questions (n). Choosing one deselects the previous one; pressing the selected one again leaves it selected, so exactly one is always chosen. **Mutually exclusive selection is not mutually exclusive membership:** there are still exactly two entry types. Unanswered questions is a filtered subset of Care Notes, not a third type, category or storage location. A Care Note with a provider question, answered or not, is always a Care Note.

    | Entry | All | Personal Reflections | Care Notes | Unanswered questions |
    |---|---|---|---|---|
    | Personal Reflection | Yes | Yes | No | No |
    | Ordinary Care Note | Yes | No | Yes | No |
    | Care Note, unanswered provider question | Yes | No | Yes | Yes |
    | Care Note, answered provider question | Yes | No | Yes | No |

    Marking a question answered removes it from the Unanswered view only; marking it unanswered restores it there; neither changes its text, tags, date or type. Search, dates and tags combine with whichever view is selected and are kept when the view changes. “Clear search and filters” resets the view to All together with the rest. The count and placement of “Unanswered questions (n)” are unchanged. The stored record is unchanged.
171. **R-025 — Care Note cards are tinted (supersedes the Care Note part of #166).** In the feed the whole Care Note card uses the theme's `--primary-soft`, the darkest established surface color, with a `--on-primary-soft` left edge; Personal Reflections keep the light `--surface` card with the `--primary` edge. Inside a Care Note card the badge and tags are light pills and the provider-question strip is a light panel, so it stands apart from the note's text. Labels and icons are unchanged; no new color token. Every Care Note looks the same whatever its question status. The opened entry and the editor are unchanged. **Insufficient shade disparity is a recurring owner observation** (R-018, deferred); this applies it to Journal cards only and R-018 is not implemented elsewhere.
172. **R-026 — a one-time address is consumed in the app's route state as well as in the address bar.** `consumeRoute` replaces `#/journal/new` with `#/journal` and updates the router's own state. Previously only the address changed, so the app still held “open a new entry”, and a child switch (which remounts the Journal) acted on it again.
173. **Calendar: the same defect is confirmed for Home's “New event” shortcut and is deliberately not changed here.** It is recorded as R-027 with its reproduction and a proposed one-line correction, for the owner's separate authorization.
174. **Testing for this refinement round:** targeted tests, then **one** complete clean cycle (authorized). The fuller final verification belongs to Checkpoint 6.

## Checkpoint 4-R2 — related Calendar routing correction (owner, 2026-11-28)
175. **Secondary review of Checkpoint 4-R** (`c236a05`) by ChatGPT: R-024 to R-026 passed source-code and screenshot review. **Owner reacceptance is still pending** and will be done once, combined, after this correction.
176. **R-027 authorized and implemented, narrowly.** The Calendar uses the existing `consumeRoute` for Home's “New event” shortcut: one import and one call in `Calendar.tsx`. No new routing mechanism, no change to the child selector, the Journal, the database or stored records. History, kept as it happened: the owner first saw the symptom in the Journal; ChatGPT identified the suspected routing-state cause; Claude Code reproduced and confirmed it; that investigation then found the equivalent, older Calendar defect; the Calendar correction was authorized separately. **The owner's original Calendar acceptance was not a failed test:** the sequence that shows the defect (Home shortcut, then a child switch while still on the Calendar) was not part of it and had not been identified.
177. **Testing for this step:** type check, build with content validation, the full unit suite and targeted end-to-end files (authorized). Full regression resumes at Checkpoint 6.
178. **A further Journal defect was found during this step and is deliberately not corrected (R-028):** the entry form is rebuilt, and anything typed is lost, if the form is open at the moment the entry list finishes loading. It is unrelated to the Calendar change and exists in the Checkpoint 4 commits. Because this step's instructions were not to alter the Journal and to stop before widening scope, it is documented with its reproduction and a tested proposal, for the owner's decision.

## Checkpoint 4-R3 — Journal unsaved writing preservation (owner, 2026-11-28)
179. **Secondary review of Checkpoint 4-R2** (`dd15e9d`) by ChatGPT: the R-027 Calendar correction passed source-code review. Owner reacceptance of R-024 to R-027 is still pending.
180. **R-028 authorized and implemented, narrowly.** The Journal's loading line, empty state and feed are rendered inside one fixed container element, so replacing one with another cannot rebuild the entry form beside them. An open form keeps its type, date, title, text, tags, provider-question flag, answered status and keyboard focus. No drafts, no added persistence, no production delay, no visual change, and no change to the Calendar, the router, the database or the accepted refinements.
181. **Testing for this step:** deterministic regression tests that hold the list's load until the test releases it; the complete Journal suite and related files; then **one** complete clean cycle (authorized, because the previous targeted run had exposed a real defect). Comprehensive verification remains for Checkpoint 6.
