# Known Limitations

Updated at Checkpoint 1 final refinement. Items marked *(planned)* are scheduled for later checkpoints.

## Not built yet (placeholders)
- Growth, milestones, progress meters, custom goals and exercises *(Checkpoint 2)*
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
- **No developmental or medical reference content is included yet.**
- The build environment could not reach cdc.gov, healthychildren.org, aap.org, or pathways.org: the network policy blocks them. Source verification for Checkpoints 2 and 3 needs either network access to those hosts or source material you supply (see SOURCE_REGISTER.md).
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
