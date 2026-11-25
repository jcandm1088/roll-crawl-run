# Known Limitations

Updated at the Checkpoint 1 review revision. Items marked *(planned)* are scheduled for later checkpoints.

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
- On iPhone, the installed Home Screen app and Safari may keep **separate** storage. This has **not yet been verified on a physical device**.
- Deleting a profile removes it from the app's storage, but the app can't guarantee secure erasure at the device-storage level.

## Content and sources
- **No developmental or medical reference content is included yet.**
- The build environment could not reach cdc.gov, healthychildren.org, aap.org, or pathways.org: the network policy blocks them. Source verification for Checkpoints 2 and 3 needs either network access to those hosts or source material you supply (see SOURCE_REGISTER.md).
- The corrected-age explanation describes only the arithmetic. It gives no clinical guidance on when or how long to use corrected age.

## PWA and offline
- Offline loading has been verified only in automated headless Chromium, not yet on physical phones.
- Data preservation across an app update is now covered by an automated test that serves two real builds in headless Chromium. It has not been verified on a physical phone.
- Install guidance is basic and will be revised after testing on physical devices *(Checkpoint 6)*.

## Testing
- Automated tests run only in Chromium (desktop, at phone-sized viewports). Safari and Firefox have not been tested automatically.
- No physical-device testing has been performed.

## Checkpoint 1 review notes
- The child-selector defect depends on browser engine behavior that the headless Chromium used here does not show. The fix is verified in Chromium, including a test that forces the same positioning condition. It has **not** been verified in Safari or on the reviewer's Mac; re-checking it there is part of the second hands-on review.
- Typography is mixed under option A: on Settings, “Profiles” is in Inter while “Appearance” and the accordion titles are in Fraunces. This awaits the owner's choice of option A or B.
- The logo concepts are exploratory. Some details, such as the toes in concept 2 and the limbs in concept 1, lose definition at 16px.
