# Handoff — Current State

**This is the single authoritative, current-state handoff.** It replaces the earlier handoff notes. The original end-of-Checkpoint-1 handoff is kept unchanged as a historical record in `docs/reviews/CHECKPOINT_1_HANDOFF.md`; statements there describe the project as it was at commit `aa8c869` and are no longer current.

*Last updated: 2026-11-27 (Checkpoint 3 accepted on Mac; refinements R-019 to R-022 implemented in a second local commit on `claude/great-dijkstra-wwi9g1`, awaiting the owner's visual acceptance; not pushed). Earlier the same day: Checkpoint 3 implemented in local commit `c5017da`. Earlier: Checkpoint 2b-R human acceptance closeout and submission scope revision (documentation-only commit `3da76c7` on `claude/vigilant-keller-w6ss5f`, pushed with the owner's authorization). Earlier: Checkpoint 2b-R implementation `b45af43` (pushed); Checkpoint 2b `64202e2` on `claude/upbeat-thompson-skpm8j`; Checkpoint 2a closeout on `claude/sharp-franklin-vrbgmd`.*

## 1. Status at a glance

| Area | Status |
|---|---|
| **Checkpoint 1** — Design & Foundation | ✅ **Completed, accepted and deployed** |
| **Checkpoint 2a** — Verified Milestone Tracking, the Growth UX refinement (R-002, plan R11) and the human acceptance refinements (R-004 to R-008, plan R12) | ✅ **Accepted by the owner for Mac usability (2026-11-27;** local build of `bf790b5`, macOS, Node.js 26, Safari). **Pending:** physical iPhone acceptance, offline editing on a device, manual legacy-data upgrade verification. Not merged into `main`, not deployed |
| **Checkpoint 2b** — Goals, Exercises & Historical Progress | ✅ **Initial owner acceptance in Mac Safari: 64 of 65 applicable checks passed** (2026-11-27; Phase G not applicable). Preserved on remote `claude/upbeat-thompson-skpm8j` at `64202e2`. Not merged or deployed. Database version 3. iPhone pending |
| **Checkpoint 2b-R** — Human Acceptance Refinements R-010 to R-017 | ✅ **Accepted for continued development** (owner, Mac Safari, 2026-11-27): **all 15 applicable Mac checks (GR1–GR15) passed** against `b45af43`. GR16 (iPhone) deferred to Checkpoint 6. Preserved on remote `claude/vigilant-keller-w6ss5f`. Not merged or deployed. Database version 3 |
| **Checkpoint 3** — Simplified Calendar (plan R16) | ✅ **Accepted by the owner in Mac Safari** (2026-11-27, against `c5017da6ea9525adc6681efdee2c59b3e7cb3099`): CAL1–CAL33 passed; CAL34 (keyboard) and CAL35 (offline editing) not human-tested; CAL36 (iPhone) deferred to Checkpoint 6. Home changes approved. **Formal closeout pending R-019 to R-022.** Local only; not pushed, merged or deployed. Database version 3 |
| **Checkpoint 3-R** — acceptance refinements R-019 to R-022 (plan R17) | 🟡 **Visually accepted by the owner except the medical symbol** (against `77d263b`: CR1–CR5 and CR7–CR9 PASS; CR6 FAIL, shape only). The symbol was corrected to a simple plus in a third local commit, “Checkpoint 3-R: Medical Symbol Correction” (18 commits); **awaiting the owner's re-check (CR6b)**. Targeted tests only for the correction (authorized). **Not pushed, merged or deployed** |
| **Checkpoint 4** — Journal (Resources tab removed from the submission version) | ⏳ Planned, not started |
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
| Session branch `claude/great-dijkstra-wwi9g1` (**local only**) | Fast-forwarded from `aa8c869` to the exact authoritative `3da76c71f1c71a7818594bacc33167f67d638f81` (15 commits, no history rewritten), then the local commits “Checkpoint 3: Simplified Calendar” (`c5017da`, 16), “Checkpoint 3-R: Human Acceptance Refinements” (`77d263b`, 17) and “Checkpoint 3-R: Medical Symbol Correction” (18). **Not pushed:** it exists only in this conversation's workspace until the owner authorizes a preservation push to this branch. The environment's stop hook asks for a push after every turn; it has been declined each time because pushes need the owner's authorization |
| Session branch `claude/vigilant-keller-w6ss5f` (remote) | Fast-forwarded to `64202e2` (13 commits, no history rewritten), then `b45af4326085b822a2b932ef21c4ee96b3954f84` “Checkpoint 2b-R: Human Acceptance Refinements” (14; pushed with the owner's authorization, normal push) and the documentation-only “Checkpoint 2b-R: Human Acceptance Closeout and Submission Scope Revision” (15). Not merged; no deployment |
| Session branch `claude/sharp-franklin-vrbgmd` (remote) | Fast-forwarded to `170cc99`, then “Checkpoint 2a: Human Acceptance Refinements” (`8843a2506b0e284b365ec048406d9b6b92d0503b`) and “Checkpoint 2a: Final Review and Erasure Regression Coverage”. Preserved on this remote branch with the owner's explicit authorization (2026-11-27) after a publication safety review. Normal push, no force; not merged; no deployment |

**History:** `a4e12b5` → `ade3171` → `820bb0e` → `873ed1c` → `e40287f` → `aa8c869` → `73d9f6f` → `9ca6149` → `170cc99` → `8843a25` (Human Acceptance Refinements) → `bf790b5` Final Review and Erasure Regression Coverage (eleven commits) → `53d6212` (2a closeout, 12) → `64202e2` (Checkpoint 2b, 13) → “Checkpoint 2b-R: Human Acceptance Refinements” (local, 14).

`main` is not to receive Checkpoint 2a until the owner accepts it and authorizes the merge. Pushing never deploys: deployment is a separate manual workflow (section 7).

## 3h. Checkpoint 3-R — acceptance refinements R-019 to R-022 (implemented; awaiting the owner's visual acceptance)
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
| Preservation push of the three Checkpoint 3 commits to `claude/great-dijkstra-wwi9g1` | Before this conversation's workspace is lost | **Needs the owner's authorization.** Until then the commits exist only locally (see section 6 for why that matters) |
| ~~Owner acceptance of Checkpoint 3; the Home changes~~ | — | **Accepted on Mac 2026-11-27** (CAL1–CAL33; Decisions #138, #139) |
| Owner's re-check of the corrected medical symbol (CR6b); formal Checkpoint 3 closeout | Checkpoint 4 | Mac Safari. CR1–CR5 and CR7–CR9 already passed |
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
