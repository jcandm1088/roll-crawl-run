# Handoff — Current State

**This is the single authoritative, current-state handoff.** It replaces the earlier handoff notes. The original end-of-Checkpoint-1 handoff is kept unchanged as a historical record in `docs/reviews/CHECKPOINT_1_HANDOFF.md`; statements there describe the project as it was at commit `aa8c869` and are no longer current.

*Last updated: 2026-11-27 (Checkpoint 2a final review and erasure regression coverage; preserved on `claude/sharp-franklin-vrbgmd`).*

## 1. Status at a glance

| Area | Status |
|---|---|
| **Checkpoint 1** — Design & Foundation | ✅ **Completed, accepted and deployed** |
| **Checkpoint 2a** — Verified Milestone Tracking, the Growth UX refinement (R-002, plan R11) **and the human acceptance refinements** (R-004 to R-008, plan R12) | 🟡 **Implemented, not yet accepted.** Two rounds of owner hands-on review led to the refinements; acceptance testing resumes on this build. Not merged into `main`, not deployed |
| **Checkpoint 2b** — Goals & Exercises (CDC activities, recurrence, completions, charts) | ⏳ **Planned, not started.** Needs the owner's explicit authorization |
| **Checkpoints 3–6** — Calendar, Journal & Resources, Backups/Sharing/Reports, Device polish | ⏳ **Planned, not started.** Checkpoints 3 and 5 have pending decisions (section 5) |
| **Deferred** | Project license; GitHub Actions version upgrades; live multi-device sync and other 🔮 Future items in the plan |

## 2. Repository, branches and deployment

| Item | Value |
|---|---|
| Repository | https://github.com/jcandm1088/roll-crawl-run (public) |
| Published app | https://jcandm1088.github.io/roll-crawl-run/ |
| **Deployed version** | `e40287f` (Checkpoint 1: Publication Compliance and Documentation) |
| **Remote `main`** | `aa8c869352cdd734eafb0ed8b7219069d4457241` (Checkpoint 1: Deployment Acceptance and Handoff; documentation only, so no redeploy was needed) |
| **Remote `checkpoint-2a`** | `73d9f6fc356b3f792a9f71cc8f38ff421e13581d` (Checkpoint 2a: Verified Milestone Tracking), a direct child of `aa8c869`. This is the **recovered original commit** (section 6) |
| Branch `claude/beautiful-allen-1vjobt` (remote) | `170cc99` “Checkpoint 2a: Growth UX Refinement”, preserved with the owner's authorization |
| Session branch `claude/sharp-franklin-vrbgmd` (remote) | Fast-forwarded to `170cc99`, then “Checkpoint 2a: Human Acceptance Refinements” (`8843a2506b0e284b365ec048406d9b6b92d0503b`) and “Checkpoint 2a: Final Review and Erasure Regression Coverage”. Preserved on this remote branch with the owner's explicit authorization (2026-11-27) after a publication safety review. Normal push, no force; not merged; no deployment |

**History:** `a4e12b5` → `ade3171` → `820bb0e` → `873ed1c` → `e40287f` → `aa8c869` → `73d9f6f` → `9ca6149` → `170cc99` → `8843a25` (Human Acceptance Refinements) → Final Review and Erasure Regression Coverage (eleven commits).

`main` is not to receive Checkpoint 2a until the owner accepts it and authorizes the merge. Pushing never deploys: deployment is a separate manual workflow (section 7).

## 3b. Human acceptance refinements (implemented, not yet accepted)
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
- **Still placeholders:** Goals & Exercises (2b), Calendar, Journal, Resources.

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
| Owner acceptance of Checkpoint 2a (with both refinements) | Merging into `main`, deployment, Checkpoint 2b | Section 4 |
| ~~Gender-neutral display wording vs CDC's condition 3~~ | — | **Resolved:** owner determination, Decision #86 |
| Legacy personal entries: optional conversion to goals, permanent deletion | Checkpoint 2b | Current preservation approach retained until then; no automatic migration |
| ~~Remote preservation of the acceptance-refinement work~~ | — | **Done:** `claude/sharp-franklin-vrbgmd` (owner-authorized) |
| Remote preservation of the refinement commit | Avoiding loss in a conversation transfer | Push to the session branch only with authorization |
| Option B educational excerpts | Optional | Deferred (D-10) |
| Authorization to begin Checkpoint 2b | Checkpoint 2b | Supporting activities to come from verified CDC tips |
| Pathways.org terms review | Any collection or analysis of Pathways.org content | Domain is reachable but its content must not be collected until terms are reviewed and approved |
| Alternative well-child visit and vaccine reference sources | Checkpoint 3 | AAP/Bright Futures and the AAP immunization schedule are blocked by the AAP exclusion. CDC/ACIP not yet retrieved |
| Partner-sharing theme behavior (plan R5) | Checkpoint 5 | The proposed rule needs the owner's confirmation |
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

**Navigation and screens:** five tabs (Home, Growth, Calendar, Journal, Resources); Profiles and Settings from the top-right control; the child selector is a downward popover. **Growth order (Decision #65; corrected here 2026-11-27, this line previously showed the superseded R4 order):** Progress → Milestone Library → Goals & Exercises → What to Expect at Every Age.

**Design principle:** parent-first interface, evidence-backed infrastructure (DESIGN_SYSTEM). **Calendar** (Checkpoint 3) opens straight to the current month with today highlighted, month navigation, an agenda view and upcoming events. **Settings:** Profiles and Appearance open; Your Data, Calendar & Reminders, This Device and About collapsed.

**Appearance:** themes Earth (default), Sky, Blush (baby pink), Lavender, Sage, chosen per child and stored per device. Typography Option B (Inter for all functional text, Fraunces only for the wordmark; shared heading tokens and `PageHeader`). Logo Concept 5, “Growing Together”.

**Behavior:** precise personal age (`formatPreciseAge`) separate from developmental groupings; optional corrected age with safeguards, chronological age always visible; milestone age chronological by default; progress = achieved ÷ applicable visible sourced milestones, with no grading tone or inference; append-only history; destructive actions in collapsed “Advanced” sections with typed two-step confirmation.

**Licensing:** third-party notices in `THIRD_PARTY_NOTICES.md` and `public/licenses/`; no project license (deferred).

## 9. Known limitations and refinement backlog
- **Limitations:** `docs/KNOWN_LIMITATIONS.md`. Key items: no backup or export yet (Checkpoint 5), so data lives only on the device; automated testing in Chromium only; Checkpoint 2a untested in Safari and on iPhone; Android untested; the one-time initial iPhone “server not responding” delay remains unexplained; iOS may keep an old Home Screen icon.
- **Refinement backlog:** `docs/REFINEMENT_BACKLOG.md`. **R-001**, onboarding child-name input overflow on mobile: pending investigation, not corrected. **R-002**, Growth usability: corrected, awaiting the owner's verification. **R-003**, Library control density: pending owner review. **R-004 to R-008**: corrected, awaiting the owner's verification.

## 10. Where things are
`README.md` (overview, running locally) · `docs/DEVELOPMENT_PLAN.md` (R-sections take precedence over the original plan; newest first) · `docs/DECISIONS.md` · `docs/BUILD_LOG.md` · `docs/TESTING_CHECKLIST.md` · `docs/KNOWN_LIMITATIONS.md` · `docs/REFINEMENT_BACKLOG.md` · `docs/SOURCE_REGISTER.md` · `docs/MILESTONE_INVENTORY.md` · `docs/DESIGN_SYSTEM.md` · `docs/reviews/`.
