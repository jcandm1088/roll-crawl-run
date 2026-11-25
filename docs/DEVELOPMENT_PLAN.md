# Development Plan — Roll, Crawl, RUN: Tracking Growth Together (Revision 2)

> Status: **PLAN ONLY — no application code has been written.** Implementation begins only after your express approval of this revision.
> Revision 2 incorporates your decisions on D1–D15 and your requested revisions (vaccination references, age navigation, journal privacy & export modes, partner collaboration, technical safeguards, review checkpoints). Changes from Revision 1 are marked **[R2]**.
> The working directory (`/home/user`) is currently empty; there is no existing code to reuse.

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
3. **Growth** [R2 revised]: view switcher **By age interval | Through current age | Goals & exercises | History** (details §6.4).
4. **Calendar:** Month / Agenda · **four** toggles [R2]: Personal ● · Well-child visits (reference) ◆ · Vaccination references (reference) ✚ · Therapy & activities ▲ — color + shape + text · day sheet · event editor · reference-item detail · Family view.
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
