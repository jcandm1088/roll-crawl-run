# Known Limitations

Last updated 2026-11-26 (Checkpoint 2a handoff consolidation). Earlier sections are kept as dated records; where a later statement supersedes an earlier one, the earlier one is marked. Items marked *(planned)* are scheduled for later checkpoints. Refinements and suspected defects awaiting correction are tracked in `docs/REFINEMENT_BACKLOG.md`.

## Not built yet (placeholders)
- Goals & Exercises, recurring activities, CDC activities, and charts *(Checkpoint 2b)*
- Calendar, well-child and vaccination references *(Checkpoint 3)*
- Journal, resources, motivational messages, notification settings *(Checkpoint 4)*
- Backups, partner sharing, import and merge, reports, calendar export *(Checkpoint 5)*
- Backup features (create, restore, history, reminders) *(Checkpoint 5)*. The app says that changes save automatically on this device and that backups are separate and not yet available.
- "I have a file from a partner" in onboarding *(Checkpoint 5)*. It was left out of the welcome screen for now so that no button appears that can't work.

## Storage and privacy
- Data lives only in this browser's IndexedDB on this device. It is **not encrypted or password-protected** and is **not** a clinical or HIPAA-compliant record.
- Data can be lost if browser data is cleared, the app is uninstalled, or the device is lost. **No backup feature exists yet** (Checkpoint 5).
- Persistent-storage permission may be denied or unsupported. The app still works, and Settings → Storage explains the risk.
- On iPhone, the installed Home Screen app and Safari may keep **separate** storage. This is **still unverified** (persistence within the installed app was reported as passing).
- Deleting a profile removes it from the app's storage, but the app can't guarantee secure erasure at the device-storage level.

## Content and sources
- **Developmental content:** the 159 CDC milestones (Checkpoint 2a) are included. There is no other developmental or medical content.
- *(Superseded at Checkpoint 2a.)* At Checkpoint 1 the build environment could not reach cdc.gov, healthychildren.org, aap.org, or pathways.org. The dedicated `roll-crawl-run` environment now allows only cdc.gov, www.cdc.gov, pathways.org, www.pathways.org and jcandm1088.github.io. AAP and HealthyChildren are excluded; Pathways.org content may not be collected until its terms are approved. Checkpoint 3 well-child and vaccine sources still need an owner decision (see SOURCE_REGISTER.md).
- The corrected-age explanation describes only the arithmetic. It gives no clinical guidance on when or how long to use corrected age.

## PWA and offline
- Offline launch and navigation passed on the owner's physical iPhone. Offline editing on a device has not been reported.
- Data preservation across an app update is now covered by an automated test that serves two real builds in headless Chromium. It has not been verified on a physical phone.
- Install guidance is basic and will be revised after testing on physical devices *(Checkpoint 6)*.

## Testing
- Automated tests run only in Chromium (desktop, at phone-sized viewports). Safari and Firefox have not been tested automatically.
- **Owner's hands-on testing:** Mac Safari acceptance passed. On a physical iPhone, install, later launches, local persistence, and offline launch and navigation passed. Android and the remaining iPhone checks are untested.

## Checkpoint 1 review notes
- The child-selector fix was confirmed by the **owner in Safari on their Mac** (second hands-on review). Automated tests cover Chromium only.
- The logo concepts are exploratory. Some details, such as the toes in concept 2 and the limbs in concept 1, lose definition at 16px.

## Checkpoint 1 final refinement notes
- **Installed-app icons on iPhone:** iOS stores the home-screen icon when the app is installed, so an existing installation may keep the old icon until it is removed and re-added. Android and desktop Chrome usually refresh icons from the updated manifest, but timing varies. Stored data is unaffected either way. This has not been verified on devices.
- **Themes are per device:** each child's theme is saved on this device only. When backups and partner sharing arrive (Checkpoint 5), themes will follow the rules in the development plan (R5).
- **In-app logo contrast:** in the Blush, Sky, and Sage themes, the child figure (accent color) has low contrast against the soft background. As a decorative logo it is exempt from WCAG contrast rules, and the installed icons use the higher-contrast brand colors.
- **Per-child themes, typography, logo, and the two technical fixes are verified only in automated headless Chromium** and in screenshots. Nothing here has been tested in Safari or on a physical device beyond the owner's selector check.

## Precise age display
- The date-change and resume behavior was verified with Playwright's simulated clock in Chromium, not on a physical device or in Safari. On some phones a suspended app may receive the resume event only when it is reopened; the age then updates at that moment.

## Publication
- **Deployed** (manual workflow, by the owner) at https://jcandm1088.github.io/roll-crawl-run/ from commit `e40287f`.
- **Initial iPhone connectivity:** the first iPhone load showed a “server not responding” message after about a minute, then loaded with no changes. **The cause has not been established, and it is not known to be resolved;** watch for a recurrence.
- No license for the application itself has been chosen (deferred). Third-party licenses are included.
- The workflow's GitHub Action versions are one or more major versions behind; see Decisions #46.

## Checkpoint 2a
- **Not yet reviewed by the owner:** milestone tracking is tested only in automated headless Chromium. It has not been tested in Safari or on an iPhone, and it is not deployed.
- **Fixed source version:** the CDC content is frozen at the pages reviewed by CDC on May 15, 2026. CDC may revise it; updating requires a new verification pass (new IDs for changed items, because locked IDs never change).
- **Printable checklists differ slightly:** the CDC PDFs (2021–2022 files) have 10 pronoun-only and 2 wording differences from the web pages. The app follows the web pages (see the source verification review).
- **CDC's other page content isn't included:** its "share with your doctor" questions, act-early guidance, photos, and videos. The app links to CDC instead.
- **Removed observations keep their text** in this device's history until erased permanently, the profile is deleted, or the app is reset. The app says so where removal happens.
- **Older than five:** there are no sourced milestones beyond age 5; existing records and personal versions still work.
- **Limits of corrected age:** the app applies only the parent's chosen basis. It has no clinical guidance on when to stop using corrected age (AAP content excluded).
- **Checkpoint 3 sources:** AAP/Bright Futures and the AAP immunization schedule are blocked by the AAP exclusion and need an owner decision.
- **Partner sharing isn't built yet.** The data is designed for it: stable IDs, logical keys, append-only events, device provenance, and state snapshots.

## Refinement backlog
- **R-001 — Onboarding child-name input overflow:** the owner observed on a physical mobile device that an input on the initial child-profile screen, believed to be the name field, extends past the right edge of the viewport. It still works. **Pending investigation; not corrected.** See `docs/REFINEMENT_BACKLOG.md`.

## Development workflow (cloud sessions)
- Each Claude Code cloud conversation works in its **own temporary workspace**. Local commits, installed packages and scratch files there are lost if the conversation ends or its container is reclaimed before they are pushed. The environment settings (allowed hosts) persist separately.
- This caused the conversation-transfer incident of 2026-11-26: Checkpoint 2a existed only in the previous workspace until it was recovered through the `checkpoint-2a` branch (see `docs/HANDOFF.md` section 6). Checkpoints are now preserved on a separate remote branch, with the owner's authorization and after a publication safety review.
- Sessions may be assigned a session-specific Git branch; pushes go only to branches the owner authorizes.
