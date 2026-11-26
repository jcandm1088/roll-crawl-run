# Third-Party Notices

Roll, Crawl, RUN: Tracking Growth Together includes third-party software and fonts. Each component is listed below with the exact version installed (`package-lock.json`) and bundled into the published application, its license, and its copyright notice.

The full license texts are in [`public/licenses/`](public/licenses/). They are published with the application at `./licenses/` (under the GitHub Pages project path) and are available offline after the app's first load. They are also linked from **Settings → About → Third-party licenses**.

This file covers third-party material only. It does not grant any license to the Roll, Crawl, RUN application itself; the project's own licensing has not been decided.

## Distributed with the application

| Component | Version | Used for | License | Copyright notice | License text |
|---|---|---|---|---|---|
| Fraunces (via `@fontsource/fraunces`) | 5.3.0 | Wordmark typeface (latin subset, weights 400/500/600, woff2) | SIL Open Font License 1.1 | Copyright 2020 The Fraunces Project Authors (github.com/undercasetype/Fraunces) | `public/licenses/fraunces-OFL-1.1.txt` |
| Inter (via `@fontsource/inter`) | 5.3.0 | Interface typeface (latin subset, weights 400/500/600, woff2) | SIL Open Font License 1.1 | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | `public/licenses/inter-OFL-1.1.txt` |
| Preact | 10.29.8 | User-interface library | MIT | Copyright (c) 2015-present Jason Miller | `public/licenses/preact-MIT.txt` |
| idb | 8.0.4 | IndexedDB helper | ISC | Copyright (c) 2016, Jake Archibald | `public/licenses/idb-ISC.txt` |
| Lucide icons (via `lucide-static`) | 1.80.0 | Interface icons (33 icons embedded as inline SVG) | ISC; the Feather-derived icons are also under MIT | Copyright (c) 2026 Lucide Icons and Contributors; Feather-derived icons: Copyright (c) 2013-present Cole Bemis | `public/licenses/lucide-ISC-and-feather-MIT.txt` |

**Fonts:** the font files are redistributed unmodified, apart from the subsetting already done by the Fontsource packages. The fonts are not renamed and are not sold on their own.

**Feather-derived icons used by the app:** check, chevron-down, chevron-left, chevron-right, clock, download, info, plus, share, smartphone, trash-2, x.

## Not distributed (development and testing only)
These tools are used to build and test the app. They are not included in the published application. Their licenses are in their packages under `node_modules/`: Vite, TypeScript, Vitest, Playwright, axe-core (`@axe-core/playwright`), fake-indexeddb, jsdom, and `@preact/preset-vite`.

## Original project assets
The “Growing Together” logo (`src/ui/brand/growing-together.json`, `public/icons/`), the screenshots, and the documentation were created for this project. They contain no third-party artwork. All people and data shown in screenshots and tests are fictional.
