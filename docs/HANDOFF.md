# Handoff — Current State

**This is the single authoritative, current-state handoff.** It replaces the earlier handoff notes. The original end-of-Checkpoint-1 handoff is kept unchanged as a historical record in `docs/reviews/CHECKPOINT_1_HANDOFF.md`; statements there describe the project as it was at commit `aa8c869` and are no longer current.

*Last updated: 2026-11-28 (Checkpoint 4-R: Journal acceptance refinements R-024 to R-026 in a second local commit; awaiting the owner's reacceptance; **not pushed**). **Start at section 0.** Before that: 2026-11-27, Checkpoint 4 implemented locally. Earlier the same day: Checkpoint 3 formal acceptance closeout; documentation-only commit on `claude/great-dijkstra-wwi9g1`, pushed with the owner's authorization). **Start here for Checkpoint 4: section 0.** Earlier the same day: Checkpoint 3 implemented (`c5017da`), refined (`77d263b`), medical symbol corrected (`c8aa0c5`).*

## 0. Checkpoint 4-R — Journal acceptance refinements, awaiting reacceptance
**Where it is:** two local commits on the session branch `claude/awesome-ritchie-b198ya`, on top of the authoritative `8122feb062f1eee96514f23b53fce020fdc438a0`: `7e9eb87b4180e4926aeac52eabf09980634a7b15` “Checkpoint 4: Journal and Four-Tab Navigation” (20), then “Checkpoint 4-R: Journal Human Acceptance Refinements” (21; its exact hash is in the delivery report in the conversation). **Not pushed, not merged, not deployed.** Until a preservation push is authorized both exist only in that conversation's workspace and the owner's ZIP archives.

**Owner's Mac Safari acceptance of `7e9eb87` (2026-11-28):** 23 PASS; **J11 FAIL**; J5, J7, J26, J27, J29, J30, J31 **not human-tested** (carried to final acceptance, not passed); J32 deferred to Checkpoint 6. Overall design approved; required date approved. Table in TESTING_CHECKLIST.

**Refinements (plan R20, Decisions #169–#174, `docs/reviews/CHECKPOINT_4_R_REFINEMENT_REPORT.md`):**
- **R-024** four single-selection views; unanswered questions are a subset of Care Notes (inclusion table, #170).
- **R-025** tinted Care Note cards in all five themes (#171).
- **R-026** editor reopening after a child switch: reproduced on the unmodified build, corrected in the router (`consumeRoute`, #172). The owner's original steps were not recorded, so one residual uncertainty is documented (REFINEMENT_BACKLOG).
- **Unchanged:** database version 3, stored records, deletion, validation, the Calendar.

**Open item needing a decision: R-027.** The Calendar's “New event” shortcut has the same defect (confirmed, not changed). Proposed: one line in `Calendar.tsx` plus one regression test.

**Tests:** 475 unit and 286 end-to-end (761); targeted runs and one complete clean cycle, as authorized (BUILD_LOG).

**Next, each needing the owner's separate authorization:** reacceptance (JR1–JR13 in TESTING_CHECKLIST); a decision on R-027; formal Checkpoint 4 closeout; a preservation push; merging into `main`; deployment. Checkpoint 5 stays deferred; Checkpoint 6 has not begun.

**Carried to final acceptance / Checkpoint 6:** the seven untested Journal items; J32; Calendar keyboard operation and offline editing confirmed by a person; physical-iPhone acceptance for 2a, 2b, 2b-R, 3 and 4; installed-app upgrade and device offline editing; the vaccine schedule currency recheck; the fuller final regression.

**Standing rules:** no push, merge or deployment without the owner's explicit authorization for that action; the environment's stop hook asks for a push after every turn and is declined unless authorized; fictional data only; never claim human or device testing that did not happen; parent-first wording; when a visual description has two readings, ask or show both first; do not widen scope on a related finding, report it.

## 0b. Checkpoint 4 (Journal) — as implemented on 2026-11-27 *(kept as recorded; superseded by section 0 where they differ)*
**Where it is:** one local commit, “Checkpoint 4: Journal and Four-Tab Navigation”, on the session branch `claude/awesome-ritchie-b198ya`, directly on top of the authoritative `8122feb062f1eee96514f23b53fce020fdc438a0` (20 commits). **Not pushed, not merged, not deployed.** The exact hash is in the delivery report in the conversation (a commit can't contain its own hash). Until a preservation push is authorized, the commit exists only in that conversation's workspace and in the ZIP the owner was given.

**Recovery that preceded it:** the session branch was fast-forwarded to the exact authoritative HEAD (parent `c8aa0c5`, 19 commits, clean tree, `main` still `aa8c869`). Baseline on that commit: type check, build and content validation passed; **427 unit and 251 end-to-end** (the first complete cycle on the final Calendar code).

**What was built:** plan R19; Decisions #154–#168; `docs/reviews/CHECKPOINT_4_IMPLEMENTATION_REPORT.md`.
- Journal: `src/domain/journal.ts` (rules, order, filters), `src/data/repositories/journalRepo.ts` (atomic child-checked writes), `src/state/journal.ts`, `src/ui/screens/journal/Journal.tsx`.
- Existing `journal` store; **database version 3, no migration**.
- Four primary tabs; Resources route, tab and placeholder removed (`#/resources` opens Home); Home's “Journal entry” shortcut is live and the “Daily encouragement” placeholder is gone (#168, flagged for the owner).
- Tests: `tests/unit/journal.test.ts`, `tests/unit/journalRepo.test.ts`, `tests/e2e/journal.spec.ts`, one new upgrade test in `update.spec.ts`. Totals: **472 unit and 280 end-to-end (752)**; results in BUILD_LOG.

**Next, each needing the owner's separate authorization:** secondary review; Mac acceptance (J1–J31 in TESTING_CHECKLIST); any refinements; formal closeout; a preservation push; merging into `main`; deployment. Checkpoint 5 stays deferred; Checkpoint 6 has not begun.

**Carried to Checkpoint 6 (unchanged, plus J32):** Calendar keyboard operation and offline editing confirmed by a person; physical-iPhone acceptance for 2a, 2b, 2b-R, 3 and 4; installed-app upgrade and device offline editing; the vaccine schedule currency recheck.

**Standing rules:** no push, merge or deployment without the owner's explicit authorization for that action; the environment's stop hook asks for a push after every turn and is declined unless authorized; fictional data only; never claim human or device testing that did not happen; parent-first wording; when a visual description has two readings, ask or show both first.

## 0a. Starting Checkpoint 4 in a fresh conversation *(historical: this is the brief the Checkpoint 4 conversation started from; kept as recorded)*
**Authoritative branch:** `claude/great-dijkstra-wwi9g1` (remote). **Authoritative HEAD:** the documentation-only commit “Checkpoint 3: Formal Acceptance Closeout and Checkpoint 4 Design Decisions” (19 commits). Its parent is `c8aa0c54350fbe79df7bbeb4a40448560e20b265`. (A commit can't contain its own hash; the owner's closeout report gives the exact value. Verify it with `git ls-remote`.)

**Accepted Checkpoint 3 commits, in order:**
| Commit | What |
|---|---|
| `c5017da6ea9525adc6681efdee2c59b3e7cb3099` | Checkpoint 3: Simplified Calendar (implementation) |
| `77d263b6243edd99ea7a8e0d2ce159fab303010f` | Checkpoint 3-R: Human Acceptance Refinements (R-019 to R-022) |
| `c8aa0c54350fbe79df7bbeb4a40448560e20b265` | Checkpoint 3-R: Medical Symbol Correction (plus symbol) |
| HEAD | Formal acceptance closeout (documentation only) |

**Recover and verify before any work:** fetch the branch; fast-forward the new session branch to the exact HEAD without rewriting history; check the parent, the count (19) and a clean tree; confirm `main` is still `aa8c869352cdd734eafb0ed8b7219069d4457241`. If anything doesn't match, stop and report.

**Expected baseline:** type check, build and content validation pass; **427 unit and 251 end-to-end tests (678)**; IndexedDB version 3. That figure is the last complete cycle, run on `77d263b`. The final symbol correction (`c8aa0c5`) had targeted tests only, so **the first complete cycle on HEAD is the one the new conversation runs**. Report any failure before changing anything; four pre-existing tests with timing-dependent reads have already surfaced under load (BUILD_LOG #47, #52, #53, #63) and others may.

**Next task: Checkpoint 4 — Journal, and removing Resources from the primary navigation.** It needs the owner's explicit authorization to begin. The owner-approved design (Decision #151):
- One combined chronological Journal feed, newest entries first.
- Personal Reflections and Care Notes, visually distinguishable.
- Optional titles, free-form text, dates and optional parent-created tags.
- Create, view, edit and delete entries.
- Search and filtering by type, date, tags and text.
- A provider-question flag for Care Notes, an answered status, and an accessible unanswered-question filter.
- Child-specific isolation and offline persistence.
- Resources removed from the primary navigation, with necessary source attribution preserved.
- No integration with Growth or the Calendar.
- No photo attachments in the submission version (R-023, deferred; reconsider with or after backup and restoration).

**Useful facts for Checkpoint 4 (verify in the code; nothing has been designed or built):**
- A `journal` store with a `byChild` index has existed since database version 1 and is in `CHILD_SCOPED_STORES`, so profile deletion and reset already cover it. Nothing writes to it yet. Whether Checkpoint 4 can stay on version 3 is for that checkpoint to determine.
- Journal and Resources are still placeholder tabs (`TabPlaceholder.tsx`); Home still shows “Journal entry — coming soon” and a “Daily encouragement” placeholder.
- The Calendar is a recent model for a child-keyed screen with sheets, atomic child-checked writes, a validated record type, and tests for isolation, failed writes and offline use (`src/ui/screens/calendar/`, `src/data/repositories/eventsRepo.ts`, `tests/e2e/calendar.spec.ts`).
- Several existing tests list all five tabs or the Resources placeholder; removing Resources is a requirement change those tests must follow.
- **Wording rule the owner has asked for three times (R-006, R-011, R-019):** parent-first interface, evidence-backed infrastructure. State a source once per screen; no institutional prefacing.
- **When a visual description has two readings, ask or show both first** (BUILD_LOG #69).

**After Checkpoint 4:** Checkpoint 5 (backup and restore, partner sharing, provider reports) is **deferred until after submission**. Checkpoint 6 is final acceptance and publication: complete regression, publication safety review, authorized merge and deployment, installed-iPhone update check, consolidated physical-device acceptance, and the items carried forward below.

**Carried to Checkpoint 6:** Calendar keyboard operation and offline editing confirmed by a person (CAL34, CAL35); physical-iPhone acceptance for 2a, 2b, 2b-R and 3; installed-app upgrade and device offline editing; the vaccine schedule currency recheck (Decision #125).

**Standing rules that held throughout this conversation:** no push, merge or deployment without the owner's explicit authorization for that action; a preservation push is not a deployment; the environment's stop hook asks for a push after every turn and is declined unless authorized; fictional data only; never claim human or device testing that did not happen.

## 1. Status at a glance

| Area | Status |
|---|---|
| **Checkpoint 1** — Design & Foundation | ✅ **Completed, accepted and deployed** |
| **Checkpoint 2a** — Verified Milestone Tracking, the Growth UX refinement (R-002, plan R11) and the human acceptance refinements (R-004 to R-008, plan R12) | ✅ **Accepted by the owner for Mac usability (2026-11-27;** local build of `bf790b5`, macOS, Node.js 26, Safari). **Pending:** physical iPhone acceptance, offline editing on a device, manual legacy-data upgrade verification. Not merged into `main`, not deployed |
| **Checkpoint 2b** — Goals, Exercises & Historical Progress | ✅ **Initial owner acceptance in Mac Safari: 64 of 65 applicable checks passed** (2026-11-27; Phase G not applicable). Preserved on remote `claude/upbeat-thompson-skpm8j` at `64202e2`. Not merged or deployed. Database version 3. iPhone pending |
| **Checkpoint 2b-R** — Human Acceptance Refinements R-010 to R-017 | ✅ **Accepted for continued development** (owner, Mac Safari, 2026-11-27): **all 15 applicable Mac checks (GR1–GR15) passed** against `b45af43`. GR16 (iPhone) deferred to Checkpoint 6. Preserved on remote `claude/vigilant-keller-w6ss5f`. Not merged or deployed. Database version 3 |
| **Checkpoint 3** — Simplified Calendar (plan R16) with refinements R-019 to R-022 (plan R17) | ✅ **Formally accepted for the submission version** (2026-11-27), subject to final physical-device and publication checks. Owner, Mac Safari: CAL1–CAL33 and CR1–CR5, CR7–CR9 PASS; CAL34–CAL35 not human-tested; CR6 failed on the medical symbol's shape and was corrected; CR6b PASS through delegated secondary review (ChatGPT; not an owner Safari test); CAL36 deferred to Checkpoint 6. **Preserved on remote `claude/great-dijkstra-wwi9g1`.** Not merged, not deployed. Database version 3 |
| **Checkpoint 4** — Journal (Resources tab removed from the submission version; plan R19) | 🟡 **Tested by the owner in Mac Safari (23 PASS, J11 FAIL, 7 not tested); refinements R-024 to R-026 implemented in a second local commit and awaiting reacceptance** (section 0). Automated: 475 unit + 286 end-to-end. Not pushed, merged or deployed. Database version 3 |
| **Checkpoint 6** — Final testing, deployment and consolidated physical iPhone acceptance | ⏳ Planned, not started |
| **Checkpoint 5** — Backups, export/restore, partner sharing, provider reports; and **Resources** | ⏸ **Deferred until after submission** (not abandoned) |
| **Deferred** | Checkpoint 5 and Resources (after submission); R-018 (shading), R-001, R-003, R-009; project license; GitHub Actions version upgrades; live multi-device sync and other 🔮 Future items in the plan |

## 2. Repository, branches and deployment

| Item | Value |
|---|---|
| Repository | https://github.com/jcandm1088/roll-crawl-run (public) |
| Published app | https://jcandm1088.github.io/roll-crawl-run/ |
| **Deployed version** | `e40287f` (Checkpoint 1: Publication Compliance and Documentation) |
| **Remote `main`** | `aa8c869352cdd734eafb0ed8b7219069d4457241` (Checkpoint 1: Deployment Acceptance and Handoff; documentation only, so no redeploy was needed) |
| **Remote `checkpoint-2a`** | `73d9f6fc356b3f792a9f71cc8f38ff421e13581d` (Checkpoint 2a: Verified Milestone Tracking), a direct child of `aa8c869`. This is the **recovered original commit** (section 6) |
| Branch `claude/beautiful-allen-1vjobt` (remote) | `170cc99` “Checkpoint 2a: Growth UX Refinement”, preserved with the owner's authorization |
| Branch `claude/upbeat-thompson-skpm8j` (remote) | `64202e22f3183e81d572a4115f03bb5f080b18f6` “Checkpoint 2b: Personal Goals, Exercises and Historical Progress” on top of `53d6212` (13 commits). Preserved remotely by the previous conversation |
| **Authoritative branch `claude/great-dijkstra-wwi9g1` (remote)** | Fast-forwarded from `aa8c869` to the exact `3da76c71f1c71a7818594bacc33167f67d638f81` (15 commits, no history rewritten), then `c5017da` Checkpoint 3 (16), `77d263b` Checkpoint 3-R refinements (17), `c8aa0c5` medical symbol correction (18) and the documentation-only formal acceptance closeout (19). **Pushed with the owner's authorization (2026-11-27), normal push, after a publication safety review.** Not merged; no deployment |
| Session branch `claude/vigilant-keller-w6ss5f` (remote) | Fast-forwarded to `64202e2` (13 commits, no history rewritten), then `b45af4326085b822a2b932ef21c4ee96b3954f84` “Checkpoint 2b-R: Human Acceptance Refinements” (14; pushed with the owner's authorization, normal push) and the documentation-only “Checkpoint 2b-R: Human Acceptance Closeout and Submission Scope Revision” (15). Not merged; no deployment |
| Session branch `claude/sharp-franklin-vrbgmd` (remote) | Fast-forwarded to `170cc99`, then “Checkpoint 2a: Human Acceptance Refinements” (`8843a2506b0e284b365ec048406d9b6b92d0503b`) and “Checkpoint 2a: Final Review and Erasure Regression Coverage”. Preserved on this remote branch with the owner's explicit authorization (2026-11-27) after a publication safety review. Normal push, no force; not merged; no deployment |

**History:** `a4e12b5` → `ade3171` → `820bb0e` → `873ed1c` → `e40287f` → `aa8c869` → `73d9f6f` → `9ca6149` → `170cc99` → `8843a25` (Human Acceptance Refinements) → `bf790b5` Final Review and Erasure Regression Coverage (eleven commits) → `53d6212` (2a closeout, 12) → `64202e2` (Checkpoint 2b, 13) → “Checkpoint 2b-R: Human Acceptance Refinements” (local, 14).

`main` is not to receive Checkpoint 2a until the owner accepts it and authorizes the merge. Pushing never deploys: deployment is a separate manual workflow (section 7).

## 3i. Checkpoint 3 formal acceptance closeout (2026-11-27)
- **Accepted:** Checkpoint 3 and R-019 to R-022, for the submission version, subject to final physical-device and publication checks (Decisions #148–#150).
- **Evidence, kept separate:** owner Mac Safari (CAL1–CAL33; CR1–CR5, CR7–CR9); delegated secondary review by ChatGPT for the corrected symbol (CR6b; not an owner Safari test); automated results by Claude Code in headless Chromium (BUILD_LOG). Table in TESTING_CHECKLIST.
- **Testing on the final commit:** targeted only, as authorized. Last complete cycle: 427 unit and 251 end-to-end on `77d263b`.
- **Preserved:** pushed to `claude/great-dijkstra-wwi9g1` (normal push). `main` and the published app unchanged.
- **Next:** Checkpoint 4, in a fresh conversation (section 0).

## 3h. Checkpoint 3-R — acceptance refinements R-019 to R-022 (accepted; see 3i)
- **Human acceptance of Checkpoint 3 (owner, Mac Safari, against `c5017da`):** CAL1–CAL33 PASS; CAL34 and CAL35 N/A (not human-tested); CAL36 deferred to Checkpoint 6. 33 passed, 0 failed, 2 N/A, 1 deferred. The Home changes, the editor's dismissal behavior and the narrow layout are approved for submission, subject to physical-device review.
- **What changed (presentation only):** R-019 parent-friendly vaccine language (one visible provider statement; a visible **Source** line with the non-endorsement; details expandable; no “CDC” beside individual recommendations); R-020 symbols (upright cross, heart, diamond); R-021 “Upcoming Appointments” on Home; R-022 Settings Calendar spacing. Plan R17, Decisions #138–#144, `docs/reviews/CHECKPOINT_3_R_REFINEMENT_REPORT.md`.
- **Unchanged:** database version 3, event records, the vaccine source version and ages, date arithmetic, overlays, profile isolation, Growth. The content file gained display fields only (`contentVersion … .app-2`); the source record is byte-for-byte the same.
- **Results:** BUILD_LOG (targeted tests, then one complete clean cycle; reduced cadence authorized by the owner for this round only).
- **Visual acceptance (owner, Mac Safari, against `77d263b`):** CR1–CR5 and CR7–CR9 PASS; CR6 FAIL on the medical symbol's shape only. The symbol is now a simple plus with four equal arms (Decision #146); heart and diamond unchanged. The correction had targeted tests, a type check and a production build, not a full regression cycle (authorized; full regression resumes at Checkpoint 4).
- **Next, each needing separate owner authorization:** the owner's re-check of the plus (CR6b); formal Checkpoint 3 closeout; a preservation push of the three local commits; Checkpoint 4; merging into `main`; deployment.
- **All three commits are local only.** They are lost if this conversation's workspace is reclaimed before a preservation push. The updated ZIP in the conversation is the only other copy.

## 3g. Checkpoint 3 — Simplified Calendar (accepted on Mac 2026-11-27; refined by 3-R)
- **Recovery:** this conversation started at `aa8c869` and fast-forwarded its session branch to the exact authoritative `3da76c7` (15 commits, parent `b45af43`, clean tree, `main` untouched). The baseline run was 379 unit and 218 of 219 end-to-end: one intermittent failure in the R-014 layout test, later shown to be a test-timing defect.
- **What:** plan R16, Decisions #125–#137, `docs/reviews/CHECKPOINT_3_IMPLEMENTATION_REPORT.md` (requirements, data, vaccine source verification, R-014, limitations).
- **Data:** database version 3 unchanged; events in the existing `events` store; overlay choices in `Settings.layers` (`medical` added, on by default; `vaccines` off by default). Upgrade from the accepted 2b-R build (`b45af43`) is covered by an automated test: every existing record byte-identical.
- **Content:** CDC's July 2, 2025 childhood schedule, retrieved 2026-11-27, bundled in `src/content/vaccines.cdc-2025.json` (26 dated references, six undated provider-discussion items). CDC's pages state it is the current schedule under a preliminary court order (SOURCE_REGISTER). **Recheck currency at Checkpoint 6.**
- **Results:** BUILD_LOG (three consecutive complete cycles).
- **Human acceptance:** not started. Checklist CAL1–CAL36 in TESTING_CHECKLIST. A ZIP of the commit for Mac preview was prepared in the conversation's scratchpad (not in the repository).
- **Preservation push ≠ deployment:** pushing the commit to `claude/great-dijkstra-wwi9g1` would only preserve it on GitHub. It would not change `main` or the published app; deployment is a separate manual workflow from `main` (section 7).
- **Next, each needing separate owner authorization:** a preservation push of the Checkpoint 3 commit; the owner's acceptance; Checkpoint 4; merging into `main`; deployment.

## 3f. Submission scope revision (owner, 2026-11-27)
- **Deadline:** preferably about 12 hours; up to 36 hours acceptable. The professor removed the several-days-of-use requirement; no post-deployment waiting period is needed.
- **Remaining submission checkpoints:** 3 (Simplified Calendar), 4 (Journal; Resources tab removed from navigation), 6 (final testing, deployment, consolidated iPhone acceptance).
- **Deferred until after submission (not abandoned):** Checkpoint 5 (backup, export and restoration; partner sharing and synchronization; provider reports) and Resources; R-001, R-003, R-009, R-018.
- **Consequence:** the submission version has **no supported backup or restoration** if local data is lost (KNOWN_LIMITATIONS).
- Details: plan R15, Decisions #118–#124.

## 3e. Checkpoint 2b-R — Human Acceptance Refinements (accepted for continued development)
- **Human acceptance (owner, Mac Safari, against `b45af43`):** GR1–GR15 all PASS (15 of 15 applicable). GR16 and all physical-iPhone, installed-app upgrade and device offline-editing checks are **deferred to Checkpoint 6**, not completed.
- **Automated (Claude Code, headless Chromium, separate from the human results):** 379 unit + 219 end-to-end, three consecutive cycles, no retries.
- R-010 to R-017 closed as human-accepted (REFINEMENT_BACKLOG).
- **Why:** the owner's Mac Safari acceptance of 2b (64/65; TESTING_CHECKLIST) found R-010 to R-017. R-018 recorded and deferred.
- **What:** R-010 age-responsive goal ideas; R-011 centralized attribution; R-012–R-014 form and duration alignment; R-015 session deletion without placeholders; R-016 recovery notice; R-017 full reporting periods. Plan R14, Decisions #107–#117, `docs/reviews/CHECKPOINT_2B_R_REFINEMENT_REPORT.md`, `docs/reviews/CHECKPOINT_2B_R_GOAL_IDEAS.md`.
- **Data:** database version 3 unchanged; deleted sessions are content-free tombstones. Upgrade tests from Checkpoint 1, 2a and `53d6212` still pass.
- **Results:** 379 unit + 219 end-to-end, three consecutive cycles (BUILD_LOG).
- **Human retest:** GR1–GR16 in TESTING_CHECKLIST (results recorded there).
- *(Earlier “next steps” — acceptance and remote preservation — are done.)* **Next, each needing separate owner authorization:** beginning Checkpoint 3; merging into `main`; deployment.

## 3d. Checkpoint 2b — Goals, Exercises & Historical Progress (initial Mac acceptance 64/65; refined by 2b-R)
- **What:** plan R13, Decisions #89–#106, `docs/reviews/CHECKPOINT_2B_IMPLEMENTATION_REPORT.md` (requirement-by-requirement report), `docs/reviews/CHECKPOINT_2B_ACTIVITY_INVENTORY.md`, `docs/reviews/CHECKPOINT_2B_IMPLEMENTATION_PLAN.md` (approved plan, preserved).
- **Data:** database version 3 (additive; two new stores; new session index). Upgrade from a real build of the accepted 2a (`53d6212`) is covered by an automated test: every existing store byte-identical, milestone Progress and Home unchanged.
- **Content:** 153 recommended activities from 162 CDC tips (12 registered pages), gender-neutral display with CDC's original viewable, safety sentences kept at the point of use.
- **Results:** see BUILD_LOG (three consecutive full runs).
- **Human acceptance:** the owner's phased Mac Safari test: 64 of 65 applicable checks passed (2026-11-27; TESTING_CHECKLIST). *(Earlier note “nothing tested in Safari” superseded.)* iPhone not yet tested.
- **Next, each needing separate owner authorization:** owner acceptance; preserving the commit on a remote branch (this session may push only to `claude/upbeat-thompson-skpm8j`); merging into `main`; deployment; Checkpoint 3.

## 3c. Human acceptance closeout (2026-11-27)
- **Accepted for Mac usability.** The owner installed, built and ran the final build locally (macOS, Node.js 26, Safari) and accepts Checkpoint 2a for Mac usability.
- **No checklist items recorded as passed.** The owner did not report individual results, so none is marked passed.
- **New finding:** **R-009** (simplify deleted-entry presentation). Low priority, deferred to a future refinement or Checkpoint 6.
- **Still deferred:** R-001 and R-003.
- **Still pending:**
  - physical iPhone acceptance (HA16, HA17, H16, H17 and related G-items);
  - offline editing on a device;
  - manual legacy-data upgrade verification;
  - H18, which needs a deployment.
- **Next, each needing separate owner authorization:**
  - merging into `main`;
  - deployment (needed for iPhone testing unless tested over the local network);
  - beginning Checkpoint 2b.

## 3b. Human acceptance refinements (accepted for Mac usability, 2026-11-27)
- **Why:** R-004 to R-008. These are owner-discovered usability findings on `170cc99`, which had passed all 387 automated tests three times.
- **What changed:**
  - gender-neutral milestone wording (validated display layer; catalog verbatim);
  - no personal-version creation (existing entries kept under “Your personal entries”);
  - plainer terms and consolidated attribution;
  - one Notes & Observations section (earlier notes shown as “No observation date”);
  - “Manage age settings” on Progress;
  - design principle “parent-first interface, evidence-backed infrastructure”.
- **Details:** plan R12, Decisions #75–#85, `docs/reviews/CHECKPOINT_2A_ACCEPTANCE_REFINEMENTS.md`.
- **Unchanged:** database version 2, dependencies, ids, calculations and the Progress denominator, the read-only guide, isolation, offline behavior and themes.
- **Results:** 281 unit + 155 end-to-end tests, ×3 (BUILD_LOG).
- **Resolved at final review (2026-11-27):**
  - Decision #77: the owner's determination is recorded in #86 (policy reviewed 2026-11-26; grammatical adaptation, not substantive change; not CDC approval).
  - Legacy personal entries: current approach kept; conversion and deletion deferred to 2b.
  - Erasure isolation: covered by a permanent regression test; no defect found.

## 3a. Growth UX refinement (implemented, not yet accepted)
- **Why:** R-002. The owner's first hands-on acceptance testing found the Growth sections repetitive and unclear about what updates progress, even though all 339 automated tests passed.
- **What changed:**
  - Growth order is now Progress → Milestone Library → Goals & Exercises → What to Expect, with subtitles.
  - What to Expect is a read-only guide with verified Option A educational content.
  - The Library is the recording tool (Up to now / Upcoming / All 159).
  - Progress is the review dashboard.
  - Save confirmations describe the actual effect.
  - No development terms appear in the app.
- **Details:** `docs/DEVELOPMENT_PLAN.md` R11, Decisions #65–#74, `docs/reviews/CHECKPOINT_2A_GUIDE_CONTENT.md`.
- **Unchanged:** schema (version 2), dependencies, milestone content and IDs, calculation engine, history and profile isolation.

## 3. Checkpoint 2a — what is implemented (not yet accepted)
Details: `docs/DEVELOPMENT_PLAN.md` R9, `docs/MILESTONE_INVENTORY.md`, `docs/reviews/CHECKPOINT_2A_SOURCE_VERIFICATION.md`.

- **Content:** 159 CDC “Learn the Signs. Act Early.” milestones (2022 revision; CDC pages content-reviewed May 15, 2026), verbatim including pronouns; 12 CDC reference ages; five app areas (CDC's Movement/Physical split into 20 gross and 24 fine motor, owner-approved); 20 three-month viewing intervals (0–60 months). Locked IDs and build-time validation.
- **Screens:** Growth landing; Progress; What to Expect at Every Age (current interval, previews, empty-interval panel, cumulative view); Milestone Library (search, filters, hidden milestones, personal versions); milestone detail (status, dates, notes, observations, append-only history, date corrections, hide/restore, personal versions); About these milestones; live Home cards and “Record a milestone”; Settings → Milestone Viewing Preferences.
- **Unchanged:** no database schema change (still version 2), no new dependencies.
- **Still placeholders:** Goals & Exercises (2b), Calendar, Journal, Resources. *(Superseded: Goals & Exercises was built at 2b and the Calendar at Checkpoint 3; Journal and Resources remain placeholders.)*

### Automated results
| Check | Reported by the previous session (commit `73d9f6f`) | Re-run on the recovered commit (2026-11-26) |
|---|---|---|
| Unit tests | 228 passing | **228 passed** |
| End-to-end tests (headless Chromium) | 111 passing | **111 passed** |
| Type check and production build | passing | **Passed** |
| Milestone content validation | — | **Passed** (build-time validation; 17 of 17 content tests) |

Details: `docs/BUILD_LOG.md` → “Recovery and baseline verification”.

Automated tests run in headless Chromium only. **No Safari or physical-iPhone testing of Checkpoint 2a has occurred.**

## 4. Checkpoint 2a acceptance requirements
Use the **hands-on checklist for the acceptance refinements (HA1–HA17)**, plus the still-applicable H- and G-items it lists, in `docs/TESTING_CHECKLIST.md`. Earlier version: the H1–H18 checklist plus G3–G8, G12–G17, G19. G1, G2, G9–G11 are superseded by the refinement. Record only actual results. H1–H15 are local (Mac); H16–H17 need the app on an iPhone; H18 needs a deployment.
- **Testable locally** (production build on the Mac, Safari): G1–G14, G16, G19; G15 and G17 can be approximated on a Mac but are defined for iPhone.
- **Need the app on a physical iPhone:** G15 (airplane mode), G17 (readability and touch comfort). Testing these on an iPhone requires either a deployment or a local-network test the owner sets up.
- **Deployment-dependent:** G18 (update from the deployed Checkpoint 1 on the iPhone) requires an owner-authorized deployment of Checkpoint 2a.

Acceptance is complete only when the owner says so. Defects found during acceptance are recorded first and fixed only with authorization.

## 5. Outstanding decisions
| Decision | Needed before | Notes |
|---|---|---|
| ~~Owner acceptance of Checkpoint 2a for Mac usability~~ | — | **Done** (2026-11-27, section 3c) |
| Physical iPhone acceptance, offline editing on a device, installed-app upgrade, manual legacy-data upgrade verification | Checkpoint 6 (consolidated final acceptance) | Needs a deployment. Deferred to Checkpoint 6 by the owner (2026-11-27) |
| Merge Checkpoint 2a into `main`, and deploy | iPhone testing, Checkpoint 2b | Separate owner authorization |
| ~~Gender-neutral display wording vs CDC's condition 3~~ | — | **Resolved:** owner determination, Decision #86 |
| ~~Legacy personal entries: optional conversion to goals, permanent deletion~~ | — | **Built at 2b** (D9, D10): explicit Move to My Goals and Delete permanently; nothing automatic |
| ~~Remote preservation of the acceptance-refinement work~~ | — | **Done:** `claude/sharp-franklin-vrbgmd` (owner-authorized) |
| ~~Remote preservation of the 2b-R commits~~ | — | **Done:** `claude/vigilant-keller-w6ss5f` (owner-authorized, normal push) |
| Option B educational excerpts | Optional | Deferred (D-10) |
| ~~Authorization to begin Checkpoint 2b~~ | — | **Given 2026-11-27**; implemented |
| ~~Owner acceptance of Checkpoint 2b~~ | — | **Initial Mac acceptance done** (64/65); refinements → 2b-R |
| ~~Owner acceptance of Checkpoint 2b-R~~ | — | **Accepted for continued development** (GR1–GR15 pass) |
| ~~Authorization to begin Checkpoint 3~~ | — | **Given 2026-11-27**; implemented |
| ~~Preservation push of the Checkpoint 3 commits~~ | — | **Done:** `claude/great-dijkstra-wwi9g1` (owner-authorized, normal push, 2026-11-27) |
| ~~Owner acceptance of Checkpoint 3; the Home changes~~ | — | **Accepted on Mac 2026-11-27** (CAL1–CAL33; Decisions #138, #139) |
| ~~Re-check of the corrected medical symbol; formal Checkpoint 3 closeout~~ | — | **Done:** CR6b accepted through delegated secondary review; Checkpoint 3 formally accepted (Decision #148) |
| Authorization to begin Checkpoint 4 | Checkpoint 4 | Needed from the owner in the new conversation |
| Journal photographs (R-023) | After submission | Deferred by the owner; reconsider with or after backup and restoration |
| Keyboard operation and offline editing confirmed by a person | Checkpoint 6 (suggested) | CAL34 and CAL35 were not human-tested |
| Authorization to begin Checkpoint 4; merge into `main`; deployment | Submission | Each needs separate authorization |
| ~~Vaccine schedule source and its content-use permissions~~ | — | **Done at Checkpoint 3:** CDC's July 2, 2025 schedule under CDC's reuse terms (Decisions #125–#128; SOURCE_REGISTER) |
| Vaccine schedule currency recheck | Checkpoint 6 | Required (Decision #125): the applicable schedule rests on a preliminary court order and may change |
| Pathways.org terms review | Any collection or analysis of Pathways.org content | Domain is reachable but its content must not be collected until terms are reviewed and approved |
| ~~Alternative well-child visit reference sources~~ | — | **Out of scope:** the well-child reference schedule was removed from Checkpoint 3 (Decision #119) |
| Partner-sharing theme behavior (plan R5) | Checkpoint 5 (after submission) | The proposed rule needs the owner's confirmation |
| GitHub Actions version upgrades | Before relying on future deployments | Deferred pending review (Decisions #46 and #61) |
| Project license | Deferred | No license chosen; third-party licenses are included |

## 6. Conversation-transfer incident (resolved)
- **What happened:** to manage context use, development moved to a new conversation. Each cloud conversation runs in its **own short-lived workspace**, cloned fresh from GitHub. Checkpoint 2a had been committed only in the previous conversation's workspace and never pushed, so the new workspace contained only `aa8c869`; the 2a commit and its files were absent.
- **Response:** the new conversation stopped without reconstructing, resetting or overwriting anything, and reported the discrepancy.
- **Resolution:** the owner had the previous conversation push the original commit, after a publication safety audit, to a separate remote branch, `checkpoint-2a`. The new conversation fetched it and verified the exact hash (`73d9f6f`), its parent (`aa8c869`) and all seven commits. `main` and the deployment were unaffected. The owner also held a downloadable source backup, which was not needed.
- **Persistent vs session-specific:** the **environment** (`roll-crawl-run`: allowed hosts, settings) persists across conversations and was unchanged. The **workspace** (the cloned files, local commits, installed packages, scratch files) belongs to one conversation and can be lost when that conversation ends or its container is reclaimed. Only what is on GitHub (or in an owner-held backup) survives a transfer.

## 7. Workflow rules
**Remote checkpoint preservation (adopted after the transfer incident).** At the end of each checkpoint or significant revision, once work is committed locally, Claude Code proposes preserving it on a **separate, non-`main` remote branch** (for example `checkpoint-2b`). The push happens only:
1. after a publication safety review (no personal information, secrets or unintended files; session links checked as before), and
2. with the owner's explicit authorization naming the branch.

It never merges into `main` and never deploys. Claude Code must respect any session-specific branch restrictions; if a restriction conflicts with the requested branch, it reports this and asks before pushing.

**Starting a new conversation:** verify the workspace against this handoff (`main`, the latest checkpoint branch, the expected hashes and the working tree) before any work. If an expected commit is missing, stop and report it.

**Other standing rules:**
- **Deployment:** manual only (`workflow_dispatch`, typing `deploy`, builds from `main`). Pushing never publishes.
- **Checkpoints:** stop at each checkpoint for the owner's review. Fictional data only. Never claim tests or human verification that did not happen.
- **Sources:** CDC only for developmental content. AAP and HealthyChildren excluded. Review a source's access and reuse terms before any automated collection.
- **Environment changes** go through the approval mechanism, never silently.

## 8. Approved decisions to carry forward
**Platform and data:** Vite + TypeScript + Preact; IndexedDB (`idb`), local-first; no accounts, servers, analytics or AI; strict content security policy; offline-first service worker; atomic multi-record writes.

**Navigation and screens:** five tabs (Home, Growth, Calendar, Journal, Resources) — *submission version (Checkpoint 4): Resources is removed from the primary navigation; source attribution stays elsewhere*; Profiles and Settings from the top-right control; the child selector is a downward popover. **Growth order (Decision #65; corrected here 2026-11-27, this line previously showed the superseded R4 order):** Progress → Milestone Library → Goals & Exercises → What to Expect at Every Age.

**Design principle:** parent-first interface, evidence-backed infrastructure (DESIGN_SYSTEM). **Calendar** (Checkpoint 3, built, plan R16) opens straight to the current month with today highlighted, month navigation, date selection and upcoming events; overlays for the recommended vaccine schedule (off by default), medical appointments and personal events. **Settings:** Profiles and Appearance open; Your Data, Calendar (was “Calendar & Reminders”), This Device and About collapsed.

**Appearance:** themes Earth (default), Sky, Blush (baby pink), Lavender, Sage, chosen per child and stored per device. Typography Option B (Inter for all functional text, Fraunces only for the wordmark; shared heading tokens and `PageHeader`). Logo Concept 5, “Growing Together”.

**Behavior:** precise personal age (`formatPreciseAge`) separate from developmental groupings; optional corrected age with safeguards, chronological age always visible; milestone age chronological by default; progress = achieved ÷ applicable visible sourced milestones, with no grading tone or inference; append-only history; destructive actions in collapsed “Advanced” sections with typed two-step confirmation.

**Licensing:** third-party notices in `THIRD_PARTY_NOTICES.md` and `public/licenses/`; no project license (deferred).

## 9. Known limitations and refinement backlog
- **Limitations:** `docs/KNOWN_LIMITATIONS.md`. Key items: no backup or export yet (Checkpoint 5), so data lives only on the device; automated testing in Chromium only; Checkpoint 2a untested in Safari and on iPhone; Android untested; the one-time initial iPhone “server not responding” delay remains unexplained; iOS may keep an old Home Screen icon.
- **Refinement backlog:** `docs/REFINEMENT_BACKLOG.md`. **R-001**, onboarding child-name input overflow on mobile: pending investigation, not corrected. **R-002**, Growth usability: accepted for Mac usability (2026-11-27). **R-003**, Library control density: deferred. **R-004 to R-008**: accepted for Mac usability (2026-11-27). **R-009**, deleted-entry presentation: low priority, deferred. **R-010 to R-017**: corrected at 2b-R, awaiting verification. **R-018**, shading distinction: deferred. R-001, R-003 and R-009 remain deferred. The suspected legacy-entry concern was a misunderstanding (no change).

## 10. Where things are
`README.md` (overview, running locally) · `docs/DEVELOPMENT_PLAN.md` (R-sections take precedence over the original plan; newest first) · `docs/DECISIONS.md` · `docs/BUILD_LOG.md` · `docs/TESTING_CHECKLIST.md` · `docs/KNOWN_LIMITATIONS.md` · `docs/REFINEMENT_BACKLOG.md` · `docs/SOURCE_REGISTER.md` · `docs/MILESTONE_INVENTORY.md` · `docs/DESIGN_SYSTEM.md` · `docs/reviews/`.
