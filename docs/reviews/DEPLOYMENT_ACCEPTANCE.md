# Checkpoint 1 — Deployment Acceptance

- **Live application:** https://jcandm1088.github.io/roll-crawl-run/
- **Repository:** https://github.com/jcandm1088/roll-crawl-run (public)
- **Deployed commit:** `e40287fcd5257c332fdb3d4512f459f30da6b5c1` (Checkpoint 1: Publication Compliance and Documentation)
- **Deployed by:** the owner, running the GitHub Pages workflow manually

## Results reported by the owner (hands-on, physical iPhone)
These are the owner's own observations. They were not produced by automated tests.

| Check | Result (owner-reported) |
|---|---|
| GitHub Pages deployment workflow | **Completed successfully** (green checkmark) |
| Published app reachable at the live URL | **Passed** |
| Added to the iPhone Home Screen | **Passed** |
| Later launches from the Home Screen | **Passed** |
| Local data persistence | **Passed** |
| Offline launch and navigation on the iPhone | **Passed** |

### Initial connectivity observation (cause not established)
During the first iPhone test, the app did not load at first: after about one minute it showed a “server not responding” message. It then loaded successfully **with no code changes and no redeployment**, and the later launch, persistence, and offline tests passed.
- **The cause has not been established.** This is **not** recorded as a confirmed software defect, and it is **not** claimed to be resolved.
- Possible contributors, none verified: a new GitHub Pages site still propagating, a network or DNS delay, or a first load before the offline cache existed.
- Watch for a recurrence during later testing.

## Not yet tested on a physical device
These were not reported and remain **untested**:
- Android
- editing data while offline on the iPhone
- whether data entered in Safari appears in the installed app
- storage protection status on the iPhone
- persistence after restarting the iPhone
- safe-area layout, larger text sizes, camera photo capture
- receiving app updates on the device
- notifications and calendar export (not yet built)

## Automated testing (separate from the above)
At the deployed commit: 185 unit tests and 80 end-to-end tests passed in headless Chromium (desktop and phone-sized viewports), and the production build succeeded. A local check that served the build under `/roll-crawl-run/` also passed (service worker scope, manifest, icons, offline, license files). No automated test runs on a physical device or in Safari.
