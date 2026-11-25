# Checkpoint 1 — Final Refinement and Acceptance

## Owner's second hands-on review (reported by the owner)
These are the owner's own observations, not automated results.
- **Tested in Safari on the owner's Mac** (revised build `ade3171`). **The child selector, which previously appeared off-screen, now works correctly.**
- **Approved:** privacy spacing, Home typography, age wording, Growth layout, Resources wording, Settings accordions, profile heading, reset safeguards, profile-deletion safeguards, the revised Blush theme, and overall navigation.
- **Remaining concern:** typography consistency. The Journal heading used a different font from the other primary tab headings, which was visually distracting.
- **Decisions:** adopt typography Option B; adopt logo Concept 5 (“Growing Together”); give each child their own theme.

## Implemented in this refinement
| Request | Implementation |
|---|---|
| Per-child themes | Stored per child on this device (`settings.childThemes`), applied when switching children, and edited under Settings → Appearance (labelled with the active child's name). A theme can be chosen when adding a child or during onboarding; Earth is the default. Existing profiles were migrated (schema v2). |
| Typography Option B | Shared heading tokens (`--heading-font`, `--h1-*`, `--h2-*`) and a single `PageHeader` component for every tab. Inter is used for all functional headings, including top-bar titles, sheet titles, accordion titles, onboarding step headings, and profile names and ages. Fraunces is kept only for the wordmark (branding). |
| Logo: Concept 5 | The approved artwork, unchanged, now lives in `src/ui/brand/growing-together.json` and drives the in-app mark (welcome screen, top bar, loading screen), the favicon, the manifest icons (including maskable), and the Apple touch icon. Installed icons use the fixed Earth brand colors. |
| Cached-asset update | Icon URLs are versioned (`?v=2`). The service-worker cache version now also hashes the public icon and manifest files, so existing installations download the new branding. Stored data is untouched. |
| Focus-trap fix | **Confirmed:** `button:not([disabled])` matched radios with `tabindex="-1"`, so with the middle child selected, Shift+Tab escaped the selector. Fixed by keeping only elements with `tabIndex >= 0` (and not inside a `hidden` panel). |
| Selector height fix | **Confirmed:** `Math.max(160, …)` forced a minimum height larger than very short windows. The selector is now limited to the real available space, moves up when there is less than 220px below the top bar (never above the window), and the whole panel scrolls. |
| Blush and the other themes | Unchanged. |

## Notes
- **Deviation from Option B as first shown.** The comparison image kept Fraunces for top-bar titles such as “Settings”. Because the owner asked for Inter on all primary page headings, top-bar titles now also use Inter. Fraunces remains only for the wordmark.
- **Found during testing:** `listChildren` order was not deterministic when two profiles had the same creation millisecond (only possible in automated tests). A tie-breaker by id was added.
