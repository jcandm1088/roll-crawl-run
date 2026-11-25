// Branding exploration (Checkpoint 1 review). NOT used by the app: the production logo is unchanged
// until a replacement is approved. Original vector artwork; no external assets.
// Writes docs/branding/concepts/*.svg and docs/branding/logo-concepts.png.
// Usage: node scripts/logo-concepts.mjs
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = new URL('../docs/branding/', import.meta.url);
mkdirSync(new URL('concepts/', OUT), { recursive: true });

// Concept artwork on a 100×100 grid. P = primary, A = soft accent, B = background (used for cut-outs).
const CONCEPTS = [
  {
    id: '0-current',
    name: 'Current (three circles)',
    note: 'Production logo today. Abstract rising forms along a path.',
    art: (P, A) => `
      <path d="M18 74 C 38 80, 58 72, 82 44" fill="none" stroke="${A}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="27" cy="66" r="6.5" fill="${P}" opacity="0.55"/>
      <circle cx="49" cy="61" r="9.5" fill="${P}" opacity="0.78"/>
      <circle cx="72" cy="42" r="13.5" fill="${P}"/>`,
  },
  {
    id: '1-silhouettes',
    name: '1 · Roll, crawl, run',
    note: 'Three minimal line figures — curled, crawling, running — rising along one gentle line.',
    art: (P, A) => `
      <path d="M10 82 Q 50 80 90 66" fill="none" stroke="${A}" stroke-width="3" stroke-linecap="round"/>
      <g fill="none" stroke="${P}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15.5 75 a7.5 7.5 0 1 1 13 -2" opacity="0.6"/>
        <path d="M44 63.5 L58 64.5 M46.5 64 L45.5 76 M57.5 64.5 L62 75.5" opacity="0.8"/>
        <path d="M74 42 L69 56 M72.5 46 L81 51.5 M72.5 46 L64 47.5 M69 56 L77 63.5 L82.5 62 M69 56 L63.5 64 L58.5 66.5"/>
      </g>
      <circle cx="21.5" cy="65" r="4.6" fill="${P}" opacity="0.6"/>
      <circle cx="40" cy="60" r="4.6" fill="${P}" opacity="0.8"/>
      <circle cx="76" cy="35" r="5.4" fill="${P}"/>`,
  },
  {
    id: '2-footsteps',
    name: '2 · Little footsteps',
    note: 'Four footprints growing in size, stepping up and to the right.',
    art: (P) => {
      const print = (x, y, s, o, mirror) => `
        <g transform="translate(${x} ${y}) rotate(38) scale(${mirror ? -s : s} ${s})" fill="${P}" opacity="${o}">
          <path d="M0 -6 C 4.6 -6 5.2 1 4 5.5 C 3 9.5 -3 9.5 -4 5.5 C -5.2 1 -4.6 -6 0 -6 Z"/>
          <circle cx="-3" cy="-9.6" r="1.7"/><circle cx="0.4" cy="-10.8" r="1.6"/><circle cx="3.6" cy="-9.4" r="1.4"/>
        </g>`;
      return print(22, 80, 0.85, 0.45, false) + print(39, 70, 1.0, 0.62, true) + print(53, 55, 1.15, 0.8, false) + print(72, 38, 1.35, 1, true);
    },
  },
  {
    id: '3-sprout',
    name: '3 · Growing sprout',
    note: 'A seedling with one small and one larger leaf — nurture and growth.',
    art: (P, A) => `
      <path d="M28 79 Q 50 72 72 79" fill="none" stroke="${A}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M50 76 C 50 64 50 54 53 42" fill="none" stroke="${P}" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M50.5 61 C 40 61.5 32 55 30.5 45.5 C 41.5 45 49.5 51 50.5 61 Z" fill="${P}" opacity="0.7"/>
      <path d="M53 45 C 56 32 66 23.5 81 23 C 80.5 38 69.5 47.5 53 45 Z" fill="${P}"/>`,
  },
  {
    id: '4-pathway',
    name: '4 · Milestone path',
    note: 'A winding path with milestone markers leading upward.',
    art: (P, A, B) => `
      <path d="M18 82 C 40 84 38 62 52 60 C 68 58 64 40 78 28" fill="none" stroke="${A}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="18" cy="82" r="4.5" fill="${P}" opacity="0.5"/>
      <circle cx="52" cy="60" r="6" fill="${P}" opacity="0.78"/>
      <circle cx="78" cy="28" r="9" fill="${P}"/>
      <circle cx="78" cy="28" r="3.2" fill="${B}"/>`,
  },
  {
    id: '5-together',
    name: '5 · Growing together',
    note: 'A parent and child side by side; the child stands in front, sheltered.',
    art: (P, A, B) => `
      <circle cx="58" cy="30" r="9.5" fill="${P}"/>
      <path d="M38 84 C 38 58 46 44 58 44 C 70 44 78 58 78 84 Z" fill="${P}"/>
      <circle cx="35" cy="52" r="7.5" fill="${A}" stroke="${B}" stroke-width="3"/>
      <path d="M21 84 C 21 70 27 63 35 63 C 43 63 49 70 49 84 Z" fill="${A}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>`,
  },
];

const EARTH = { bg: '#EBDCCB', P: '#7A4F33', A: '#C08A5E', page: '#F6F0E8', text: '#2E241C', muted: '#67564A' };
const THEMES = [
  { name: 'Earth', soft: '#EBDCCB', P: '#7A4F33', A: '#C08A5E' },
  { name: 'Sky', soft: '#D6E6F3', P: '#2D6290', A: '#86B6D9' },
  { name: 'Blush', soft: '#FAD0E2', P: '#A93669', A: '#F5A5C8' },
  { name: 'Lavender', soft: '#E2D9F2', P: '#664C99', A: '#B4A0D8' },
  { name: 'Sage', soft: '#DAE7D5', P: '#466749', A: '#9BBB96' },
];

const icon = (c, { bg, P, A, size, radius = 22 }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}"><rect width="100" height="100" rx="${radius}" fill="${bg}"/>${c.art(P, A, bg)}</svg>`;

for (const c of CONCEPTS) {
  writeFileSync(new URL(`concepts/${c.id}.svg`, OUT), icon(c, { bg: EARTH.bg, P: EARTH.P, A: EARTH.A, size: 512 }));
  writeFileSync(new URL(`concepts/${c.id}-mono.svg`, OUT), icon(c, { bg: '#FFFFFF', P: '#1F1A17', A: '#1F1A17', size: 512 }));
}

const font = (pkg, file) => readFileSync(new URL(`../node_modules/@fontsource/${pkg}/files/${file}`, import.meta.url)).toString('base64');
const css = `
@font-face { font-family: Fraunces; font-weight: 500; src: url(data:font/woff2;base64,${font('fraunces', 'fraunces-latin-500-normal.woff2')}) format('woff2'); }
@font-face { font-family: Fraunces; font-weight: 600; src: url(data:font/woff2;base64,${font('fraunces', 'fraunces-latin-600-normal.woff2')}) format('woff2'); }
@font-face { font-family: Inter; font-weight: 400; src: url(data:font/woff2;base64,${font('inter', 'inter-latin-400-normal.woff2')}) format('woff2'); }
@font-face { font-family: Inter; font-weight: 600; src: url(data:font/woff2;base64,${font('inter', 'inter-latin-600-normal.woff2')}) format('woff2'); }
body { margin: 0; padding: 40px; background: ${EARTH.page}; font-family: Inter, sans-serif; color: ${EARTH.text}; width: 1400px; }
h1 { font-family: Fraunces; font-weight: 500; font-size: 34px; margin: 0 0 6px; }
.lead { color: ${EARTH.muted}; margin: 0 0 28px; font-size: 16px; }
.row { display: grid; grid-template-columns: 300px 150px 170px 1fr; gap: 28px; align-items: center; background: #FFFCF7; border: 1px solid #E6DACB; border-radius: 20px; padding: 22px 26px; margin-bottom: 16px; }
.row.current { border: 2px dashed #9C8471; }
.title { font-weight: 600; font-size: 18px; } .note { color: ${EARTH.muted}; font-size: 14px; margin-top: 6px; line-height: 1.4; }
.sizes { display: flex; align-items: flex-end; gap: 12px; } .sizes svg { box-shadow: 0 2px 8px rgba(74,47,30,.12); border-radius: 22%; }
.cap { font-size: 11px; color: ${EARTH.muted}; text-align: center; margin-top: 6px; letter-spacing: .04em; }
.mono { display: flex; gap: 10px; }
.lockup { display: flex; align-items: center; gap: 16px; }
.wm { font-family: Fraunces; font-weight: 500; font-size: 30px; letter-spacing: -0.02em; line-height: 1; } .wm b { font-weight: 600; color: ${EARTH.P}; letter-spacing: .02em; }
.sub { font-size: 11px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: ${EARTH.muted}; margin-top: 8px; }
.themes { display: flex; gap: 8px; margin-top: 14px; }
`;

const rows = CONCEPTS.map((c) => `
  <div class="row ${c.id === '0-current' ? 'current' : ''}">
    <div><div class="title">${c.name}</div><div class="note">${c.note}</div></div>
    <div><div class="sizes">${icon(c, { bg: EARTH.bg, P: EARTH.P, A: EARTH.A, size: 96 })}${icon(c, { bg: EARTH.bg, P: EARTH.P, A: EARTH.A, size: 32 })}${icon(c, { bg: EARTH.bg, P: EARTH.P, A: EARTH.A, size: 16, radius: 18 })}</div><div class="cap">APP ICON · 96 / 32 / 16 px</div></div>
    <div><div class="mono">${icon(c, { bg: '#FFFFFF', P: '#1F1A17', A: '#1F1A17', size: 64 })}${icon(c, { bg: '#2E241C', P: '#FFFFFF', A: '#FFFFFF', size: 64 })}</div><div class="cap">MONOCHROME</div></div>
    <div>
      <div class="lockup">${icon(c, { bg: EARTH.bg, P: EARTH.P, A: EARTH.A, size: 64 })}<div><div class="wm">Roll, Crawl, <b>RUN</b></div><div class="sub">Tracking Growth Together</div></div></div>
      <div class="themes">${THEMES.map((t) => icon(c, { bg: t.soft, P: t.P, A: t.A, size: 40 })).join('')}<span class="cap" style="align-self:center;margin:0 0 0 6px">ALL FIVE THEMES</span></div>
    </div>
  </div>`).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<h1>Logo concepts for review</h1>
<p class="lead">Original vector concepts shown next to the current logo (dashed). The app continues to use the current logo until you approve a replacement.</p>
${rows}</body></html>`;
writeFileSync(new URL('logo-concepts.html', OUT), html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1480, height: 1000 }, deviceScaleFactor: 2 });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: new URL('logo-concepts.png', OUT).pathname, fullPage: true });
await browser.close();
console.log('wrote docs/branding/logo-concepts.png and', CONCEPTS.length * 2, 'SVGs');
